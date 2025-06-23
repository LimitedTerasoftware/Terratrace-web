import JSZip from 'jszip';
import { parseString } from 'xml2js';
import { Placemark, KMZFile } from '../types/kmz';

export class KMZParser {
  static async parseKMZ(file: File): Promise<KMZFile> {
    const arrayBuffer = await file.arrayBuffer();
    
    // Check if it's a KML file (plain text) or KMZ file (zip archive)
    const isKML = file.name.toLowerCase().endsWith('.kml');
    
    let kmlContent: string;
    
    if (isKML) {
      // Handle KML file directly
      const textDecoder = new TextDecoder('utf-8');
      kmlContent = textDecoder.decode(arrayBuffer);
    } else {
      // Handle KMZ file (zip archive)
      const zip = new JSZip();
      
      let zipContent: JSZip;
      try {
        zipContent = await zip.loadAsync(arrayBuffer);
      } catch (error) {
        throw new Error('Failed to read KMZ file. It might be corrupted or not a valid KMZ (zip) archive.');
      }
      
      // Find KML file in the zip (usually doc.kml or the main .kml file)
      let kmlFile: JSZip.JSZipObject | null = null;
      
      zipContent.forEach((relativePath, zipEntry) => {
        if (relativePath.endsWith('.kml') && !kmlFile) {
          kmlFile = zipEntry;
        }
      });

      if (!kmlFile) {
        throw new Error('No KML file found in KMZ archive');
      }

      kmlContent = await kmlFile.async('text');
    }
    
    const placemarks = await this.parseKML(kmlContent);
    
    // Extract metadata for filtering
    const metadata = this.extractMetadata(placemarks);
    
    const kmzFileData: KMZFile = {
      id: crypto.randomUUID(),
      name: file.name.replace(/\.(kmz|kml)$/i, ''),
      uploadDate: new Date(),
      size: file.size,
      placemarks,
      originalData: arrayBuffer,
      metadata
    };

    return kmzFileData;
  }

  private static async parseKML(kmlContent: string): Promise<Placemark[]> {
    return new Promise((resolve, reject) => {
      parseString(kmlContent, (err, result) => {
        if (err) {
          reject(new Error(`Failed to parse KML content: ${err.message}`));
          return;
        }

        const placemarks: Placemark[] = [];
        
        try {
          const kml = result.kml || result;
          const document = kml.Document?.[0] || kml;
          
          // Find all Placemark elements
          const findPlacemarks = (obj: any): void => {
            if (Array.isArray(obj)) {
              obj.forEach(findPlacemarks);
            } else if (typeof obj === 'object' && obj !== null) {
              if (obj.Placemark) {
                obj.Placemark.forEach((placemark: any) => {
                  const parsed = this.parsePlacemark(placemark);
                  if (parsed) {
                    placemarks.push(parsed);
                  }
                });
              }
              
              Object.values(obj).forEach(findPlacemarks);
            }
          };

          findPlacemarks(document);
          resolve(placemarks);
        } catch (error) {
          reject(new Error(`Failed to extract placemarks from KML: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      });
    });
  }

  private static parsePlacemark(placemark: any): Placemark | null {
    try {
      const name = placemark.name?.[0] || 'Unnamed';
      const description = placemark.description?.[0] || '';
      
      // Extract coordinates from Point geometry
      const point = placemark.Point?.[0];
      if (!point || !point.coordinates?.[0]) {
        return null;
      }

      const coords = point.coordinates[0].trim().split(',');
      const lng = parseFloat(coords[0]);
      const lat = parseFloat(coords[1]);
      const alt = coords[2] ? parseFloat(coords[2]) : undefined;

      if (isNaN(lat) || isNaN(lng)) {
        return null;
      }

      // Extract additional data from ExtendedData
      const customData: Record<string, any> = {};
      const extendedData = placemark.ExtendedData?.[0];
      if (extendedData?.Data) {
        extendedData.Data.forEach((data: any) => {
          const name = data.$.name;
          const value = data.value?.[0];
          if (name && value) {
            customData[name] = value;
          }
        });
      }

      // Try to extract location hierarchy from name or description
      const locationInfo = this.extractLocationInfo(name, description, customData);

      return {
        id: crypto.randomUUID(),
        name,
        description,
        coordinates: { lat, lng, alt },
        customData,
        ...locationInfo
      };
    } catch (error) {
      console.warn('Failed to parse placemark:', error);
      return null;
    }
  }

  private static extractLocationInfo(name: string, description: string, customData: Record<string, any>) {
    const result: Partial<Placemark> = {};
    
    // Check custom data first
    if (customData.state || customData.State) {
      result.state = customData.state || customData.State;
    }
    if (customData.division || customData.Division) {
      result.division = customData.division || customData.Division;
    }
    if (customData.block || customData.Block) {
      result.block = customData.block || customData.Block;
    }
    if (customData.category || customData.Category) {
      result.category = customData.category || customData.Category;
    }

    // If not found in custom data, try to extract from name/description
    const text = `${name} ${description}`.toLowerCase();
    
    // Simple pattern matching for common location formats
    const stateMatch = text.match(/state[:\s]+([^,\n]+)/i);
    if (stateMatch && !result.state) {
      result.state = stateMatch[1].trim();
    }

    const divisionMatch = text.match(/division[:\s]+([^,\n]+)/i);
    if (divisionMatch && !result.division) {
      result.division = divisionMatch[1].trim();
    }

    const blockMatch = text.match(/block[:\s]+([^,\n]+)/i);
    if (blockMatch && !result.block) {
      result.block = blockMatch[1].trim();
    }

    return result;
  }

  private static extractMetadata(placemarks: Placemark[]) {
    const states = new Set<string>();
    const divisions = new Set<string>();
    const blocks = new Set<string>();
    const categories = new Set<string>();

    placemarks.forEach(placemark => {
      if (placemark.state) states.add(placemark.state);
      if (placemark.division) divisions.add(placemark.division);
      if (placemark.block) blocks.add(placemark.block);
      if (placemark.category) categories.add(placemark.category);
    });

    return {
      states: Array.from(states).sort(),
      divisions: Array.from(divisions).sort(),
      blocks: Array.from(blocks).sort(),
      categories: Array.from(categories).sort()
    };
  }
}