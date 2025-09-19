import {
  ApiPlacemark,
  ApiPoint,
  ApiPolyline,
  ProcessedPlacemark,
  PlacemarkCategory,
  PhysicalSurveyApiResponse,
} from '../../types/kmz';

// Enhanced interfaces with image support
export interface ProcessedPhysicalSurvey {
  id: string;
  name: string;
  category: string;
  type: 'point' | 'polyline';
  coordinates: { lat: number; lng: number } | { lat: number; lng: number }[];
  surveyId: string;
  eventType: string;
  blockId: string;
  // Image fields
  images: SurveyImage[];
  hasImages: boolean;

  startLgdName?: string;
  endLgdName?: string;
  routeDetails?: any;
  routeFeasibility?: any;
  stateName?: string;
  districtName?: string;
  blockName?: string;
  createdTime?: string;
}

export interface SurveyImage {
  url: string;
  type: 'start_photo' | 'end_photo' | 'fpoi' | 'route_indicator' | 'kmt_stone' | 'fiber_turn' | 'landmark' | 'joint_chamber' | 'road_crossing_start' | 'road_crossing_end' | 'video_thumbnail' | 'bridge' | 'culvert' | 'general' | 'kilometerstone' | 'fiberturn' | 'routeindicator';
  label: string;
  coordinates?: { lat: number; lng: number }; // For road crossing photos and other geotagged images
}

// Enhanced placemark categories with ALL infrastructure types from your API including PHOTO_SURVEY
export const PLACEMARK_CATEGORIES: Record<string, { color: string; icon: string }> = {
  // Geographic Points
  GP: { color: '#4ECDC4', icon: '🏠' },
  FPOI: { color: '#F8C471', icon: '⭐' },
  BHQ: { color: '#BF1E00', icon: '🏢' },
  BR: { color: '#0030BF', icon: '🌐' },
  LANDMARK: { color: '#FF6B6B', icon: '🏛️' },

  // Infrastructure - Crossings
  ROADCROSSING: { color: '#31F527', icon: '🛣️' },
  'Road Cross': { color: '#FFD700', icon: '🛣️' },
  'N Highway Cross': { color: '#FF8C00', icon: '🛤️' },

  // Infrastructure - Water/Drainage
  Bridge: { color: '#45B7D1', icon: '🌉' },
  Culvert: { color: '#96CEB4', icon: '🌊' },
  Causeways: { color: '#F7DC6F', icon: '🛤️' },

  // Infrastructure - Rail
  'Level Cross': { color: '#DDA0DD', icon: '🚂' },
  'Rail Under Bridge': { color: '#98D8C8', icon: '🚇' },
  'Rail Over Bridge': { color: '#BB8FCE', icon: '🚄' },
  'Railway Cross': { color: '#8B5CF6', icon: '🚂' },

  // Network Infrastructure
  'Block Router': { color: '#000000', icon: '🔗' },
  FIBERTURN: { color: '#372AAC', icon: '🔄' },
  JOINTCHAMBER: { color: '#FE9A37', icon: '🔗' },
  ROUTEINDICATOR: { color: '#42D3F2', icon: '🧭' },

  // Markers & Indicators
  KILOMETERSTONE: { color: '#35530E', icon: '📍' },

  // Cable Types
  'Incremental Cable': { color: '#61f335', icon: '⚡⚡⚡⚡' },
  'Proposed Cable': { color: '#ff0000', icon: '➖➖➖➖' },

  // Survey Points
  SURVEYSTART: { color: '#10B981', icon: '🎯' },
  ENDSURVEY: { color: '#E7180B', icon: '🎯' },
  HOLDSURVEY: { color: '#a93226', icon: '⏸️' },
  DEPTH: { color: '#3B82F6', icon: '📏' },
  MANHOLES: { color: '#06B6D4', icon: '🕳️' },
  STARTPIT: { color: '#14B8A6', icon: '🕳️' },
  ENDPIT: { color: '#DC2626', icon: '🔴' },
  BLOWING: { color: '#663300', icon: '💨' },
  ROUTEFEASIBILITY: { color: '#17A2B8', icon: '🛤️' },
  AREA: { color: '#FFC107', icon: '📐' },
  LIVELOCATION: { color: '#DC3545', icon: '📍' },
  SIDE: { color: '#6F42C1', icon: '↔️' },
  ROUTEDETAILS: { color: '#09090B', icon: '📋' },

  // Desktop Planning Categories
  'Desktop: GP': { color: '#2DD4BF', icon: '🟢' },
  'Desktop: FPOI': { color: '#FBBF24', icon: '📷' },
  'Desktop: BHQ': { color: '#DC2626', icon: '🏛️' },
  'Desktop: Block Router': { color: '#1F2937', icon: '⚫' },
  'Desktop: Bridge': { color: '#3B82F6', icon: '🌉' },
  'Desktop: Culvert': { color: '#10B981', icon: '🌊' },
  'Desktop: Road Cross': { color: '#F59E0B', icon: '🛣️' },
  'Desktop: Railway Cross': { color: '#8B5CF6', icon: '🚂' },
  'Desktop: N Highway Cross': { color: '#EF4444', icon: '🛤️' },
  'Desktop: Incremental Cable': { color: '#22C55E', icon: '━━━━' },
  'Desktop: Proposed Cable': { color: '#EF4444', icon: '┅┅┅┅' },

  // Tracking
  SURVEY_ROUTE: { color: '#FFFF99', icon: '➡️' },

  // Media categories (UPDATED with PHOTO_SURVEY)
  VIDEORECORD: { color: '#8B5CF6', icon: '🎥' },
  PHOTO_SURVEY: { color: '#DCB14E', icon: '📸' },
  VIDEO_SURVEY: { color: '#7C3AED', icon: '🎬' },

  // Default
  point: { color: '#FF0000', icon: '📍' },
};

// Enhanced URL resolution with better error handling
export function resolveMediaUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') {
    console.warn('Invalid path provided to resolveMediaUrl:', path);
    return '';
  }
  
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    console.warn('Empty path provided to resolveMediaUrl');
    return '';
  }
  
  // If already absolute URL, return as-is
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }
  
  // Clean up path - remove leading slashes for consistent concatenation
  const cleanPath = trimmedPath.replace(/^\/+/, '');
  
  const baseUrl = import.meta.env.VITE_Image_URL;
  if (!baseUrl) {
    console.error('VITE_Image_URL environment variable not set');
    return trimmedPath; // Return original path as fallback
  }
  
  // Ensure base URL ends with slash for proper concatenation
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const url = `${normalizedBase}${cleanPath}`;
  
  return url;
}

// Add this helper function for image validation
function isValidImageUrl(url: string): boolean {
  if (!url || url.trim() === '' || url === 'null' || url === 'undefined') return false;
  
  // Basic URL validation
  try {
    const urlObj = new URL(url);
    // Check if it's a valid protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) return false;
    
    // Check if it has an image extension or contains image-related paths
    const pathname = urlObj.pathname.toLowerCase();
    const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(pathname);
    const hasImagePath = pathname.includes('/image') || pathname.includes('/photo') || pathname.includes('/media');
    
    return hasImageExtension || hasImagePath;
  } catch {
    return false;
  }
}

// Helper function to extract all images from a survey point
function extractSurveyImages(point: any): SurveyImage[] {
  const images: SurveyImage[] = [];
 
  if (!point.surveyUploaded || point.surveyUploaded === '' || point.surveyUploaded === 'false') {
    return images;
  }
 
  try {
    // Process start_photos array
    try {
      const startPhotos = point.start_photos ? JSON.parse(point.start_photos) : [];
      if (Array.isArray(startPhotos)) {
        startPhotos.forEach((photoUrl: string, index: number) => {
          const resolvedUrl = resolveMediaUrl(photoUrl);
          if (isValidImageUrl(resolvedUrl)) {
            images.push({
              url: resolvedUrl,
              type: "start_photo",
              label: `Start Photo ${index + 1}`,
              coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
            });
          }
        });
      }
    } catch (error) {
      console.warn('Error parsing start_photos:', error);
    }

    // Process end_photos array
    try {
      const endPhotos = point.end_photos ? JSON.parse(point.end_photos) : [];
      if (Array.isArray(endPhotos)) {
        endPhotos.forEach((photoUrl: string, index: number) => {
          const resolvedUrl = resolveMediaUrl(photoUrl);
          if (isValidImageUrl(resolvedUrl)) {
            images.push({
              url: resolvedUrl,
              type: "end_photo",
              label: `End Photo ${index + 1}`,
              coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
            });
          }
        });
      }
    } catch (error) {
      console.warn('Error parsing end_photos:', error);
    }

    // Process landMarkUrls
    if (point.landMarkUrls && point.event_type === "LANDMARK" && point.landMarkType !== "NONE") {
      try {
        const parsed = typeof point.landMarkUrls === "string"
          ? JSON.parse(point.landMarkUrls)
          : point.landMarkUrls;
 
        if (Array.isArray(parsed)) {
          parsed.forEach((url: string, index: number) => {
            const resolvedUrl = resolveMediaUrl(url);
            if (isValidImageUrl(resolvedUrl)) {
              images.push({
                url: resolvedUrl,
                type: "landmark",
                label: `Landmark Photo ${index + 1}`,
                coordinates: point.latitude && point.longitude
                  ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                  : undefined
              });
            }
          });
        } else if (typeof parsed === "string") {
          const resolvedUrl = resolveMediaUrl(parsed);
          if (isValidImageUrl(resolvedUrl)) {
            images.push({
              url: resolvedUrl,
              type: "landmark",
              label: "Landmark Photo",
              coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
            });
          }
        }
      } catch (error) {
        console.warn("Error parsing landMarkUrls:", error);
      }
    }

    // Process road_crossing photos
    if (point.event_type === "ROADCROSSING" && point.road_crossing) {
      try {
        const rc = typeof point.road_crossing === "string" ? JSON.parse(point.road_crossing) : point.road_crossing;
 
        if (rc.startPhoto) {
          const resolvedUrl = resolveMediaUrl(rc.startPhoto);
          if (isValidImageUrl(resolvedUrl)) {
            images.push({
              url: resolvedUrl,
              type: "road_crossing_start",
              label: "Road Crossing Start Photo",
              coordinates: rc.startPhotoLat && rc.startPhotoLong
                ? { lat: parseFloat(rc.startPhotoLat), lng: parseFloat(rc.startPhotoLong) }
                : point.latitude && point.longitude
                  ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                  : undefined
            });
          }
        }
 
        if (rc.endPhoto) {
          const resolvedUrl = resolveMediaUrl(rc.endPhoto);
          if (isValidImageUrl(resolvedUrl)) {
            images.push({
              url: resolvedUrl,
              type: "road_crossing_end",
              label: "Road Crossing End Photo",
              coordinates: rc.endPhotoLat && rc.endPhotoLong
                ? { lat: parseFloat(rc.endPhotoLat), lng: parseFloat(rc.endPhotoLong) }
                : point.latitude && point.longitude
                  ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                  : undefined
            });
          }
        }
      } catch (error) {
        console.warn("Error parsing road_crossing:", error);
      }
    }

    // Process individual photo URL fields
    const photoFields = [
      { field: 'fpoiUrl', eventType: 'FPOI', type: 'fpoi', label: 'FPOI Photo' },
      { field: 'kmtStoneUrl', eventType: 'KILOMETERSTONE', type: 'kmt_stone', label: 'KM Stone Photo' },
      { field: 'fiberTurnUrl', eventType: 'FIBERTURN', type: 'fiber_turn', label: 'Fiber Turn Photo' },
      { field: 'jointChamberUrl', eventType: 'JOINTCHAMBER', type: 'joint_chamber', label: 'Joint Chamber Photo' },
      { field: 'routeIndicatorUrl', eventType: 'ROUTEINDICATOR', type: 'route_indicator', label: 'Route Indicator Photo' }
    ];

    photoFields.forEach(({ field, eventType, type, label }) => {
      if (point[field] && (point.event_type === eventType || !eventType)) {
        try {
          let urls: string[] = [];
          
          if (typeof point[field] === 'string') {
            try {
              const parsed = JSON.parse(point[field]);
              if (Array.isArray(parsed)) {
                urls = parsed;
              } else if (typeof parsed === 'string') {
                urls = [parsed];
              } else {
                urls = [point[field]];
              }
            } catch {
              urls = [point[field]];
            }
          } else if (Array.isArray(point[field])) {
            urls = point[field];
          }

          urls.forEach((url: string, index: number) => {
            const resolvedUrl = resolveMediaUrl(url);
            if (isValidImageUrl(resolvedUrl)) {
              images.push({
                url: resolvedUrl,
                type: type as any,
                label: urls.length > 1 ? `${label} ${index + 1}` : label,
                coordinates: point.latitude && point.longitude
                  ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                  : undefined
              });
            }
          });
        } catch (error) {
          console.warn(`Error parsing ${field}:`, error);
        }
      }
    });

    // Generic fallback for any other image fields
    const genericImageFields = [
      'imageUrl', 'image_url', 'photoUrl', 'photo_url', 
      'attachmentUrl', 'attachment_url', 'mediaUrl', 'media_url',
      'surveyPhoto', 'survey_photo'
    ];

    genericImageFields.forEach(field => {
      if (point[field]) {
        const resolvedUrl = resolveMediaUrl(point[field]);
        if (isValidImageUrl(resolvedUrl)) {
          // Check if we haven't already added this URL
          const exists = images.some(img => img.url === resolvedUrl);
          
          if (!exists) {
            images.push({
              url: resolvedUrl,
              type: "general",
              label: `${point.event_type || 'Survey'} Photo`,
              coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
            });
          }
        }
      }
    });

  } catch (error) {
    console.error("Error extracting survey images:", error);
  }
 
  // Remove duplicates based on URL
  const uniqueImages = images.filter((img, index, arr) => 
    arr.findIndex(other => other.url === img.url) === index
  );
  
  return uniqueImages;
}

// Desktop Planning Interfaces
export interface DesktopPlanningApiResponse {
  status: boolean;
  data: DesktopPlanningNetwork[];
}

export interface DesktopPlanningNetwork {
  id: number;
  name: string;
  total_length: string;
  main_point_name: string;
  created_at: string;
  existing_length: string;
  proposed_length: string;
  status: string;
  st_code: string;
  st_name: string;
  blk_code: string;
  blk_name: string;
  dt_code: string;
  dt_name: string;
  user_id: number;
  user_name: string;
  points: DesktopPlanningPoint[];
  connections: DesktopPlanningConnection[];
}

export interface DesktopPlanningPoint {
  id: number;
  network_id: number;
  name: string;
  coordinates: string; // "[longitude,latitude]" format
  lgd_code: string;
  created_at: string;
  properties: string; // JSON string
}

export interface DesktopPlanningConnection {
  id: number;
  network_id: number;
  start_point_id: number | null;
  end_point_id: number | null;
  start: string;
  end: string;
  length: string;
  original_name: string;
  coordinates: string; // "[[lat,lng],[lat,lng],...]" format
  type: 'proposed' | 'incremental';
  color: string;
  created_at: string;
  start_latlong: string;
  end_latlong: string;
  user_id: number | null;
  user_name: string | null;
  status: string;
  properties: string; // JSON string
}

export interface ProcessedDesktopPlanning {
  id: string;
  name: string;
  category: string;
  type: 'point' | 'polyline';
  coordinates: { lat: number; lng: number } | { lat: number; lng: number }[];
  styleUrl?: string;
  pointType?: string;
  assetType?: string;
  status?: string;
  ring?: string;
  networkId?: number;
  lgdCode?: string;
  length?: string;
  connectionType?: 'proposed' | 'incremental';
  rawProperties?: any;
}

// File format detection helper
function detectFileFormat(apiData: ApiPlacemark): string {
  const hasNullTypes = (apiData.points || []).some(p => p.type === "NULL");
  const hasOFCPolylines = (apiData.polylines || []).some(p => p.type?.includes("OFC"));
  const avgPropertyCount = (apiData.points || []).reduce((sum, p) => 
    sum + (p.properties ? Object.keys(p.properties).length : 0), 0) / (apiData.points?.length || 1);
  
  if (hasNullTypes && avgPropertyCount > 40) return "Complex KMZ (Server Export)";
  if (hasOFCPolylines) return "OFC Network KMZ";
  if (avgPropertyCount < 20) return "Simple KMZ (Desktop Export)";
  return "Standard KMZ";
}

// Enhanced polyline type normalization
function normalizePolylineType(type: string): string {
  if (!type || type === 'NULL' || type === 'Unknown Line Type') {
    return 'Incremental Cable';
  }
  
  const upperType = type.toUpperCase();
  
  // Handle OFC variations
  if (upperType.includes('OFC')) {
    return upperType.includes('PROPOSED') ? 'Proposed Cable' : 'Incremental Cable';
  }
  
  // Handle standard cable types
  if (upperType.includes('PROPOSED')) return 'Proposed Cable';
  if (upperType.includes('INCREMENTAL')) return 'Incremental Cable';
  if (upperType.includes('CABLE')) return 'Incremental Cable';
  
  return type;
}

// -----------------------------
// Enhanced API Data Processing
// -----------------------------
export function processApiData(apiData: ApiPlacemark): {
  placemarks: ProcessedPlacemark[];
  categories: PlacemarkCategory[];
} {
  const processedPlacemarks: ProcessedPlacemark[] = [];
  const categoryCounts: Record<string, number> = {};

  // Analysis arrays for logging
  const typeAnalysis: Array<{
    index: number;
    name: string;
    directType: any;
    propertiesType: any;
    extractedType: string;
    category: string;
    allProperties: any;
    hasCoordinates: boolean;
  }> = [];

  const polylineAnalysis: Array<{
    index: number;
    name: string;
    type: any;
    normalizedType: string;
    length: any;
    distance: any;
    allProperties: any;
    coordinateCount: number;
  }> = [];

  // Initialize category counts
  Object.keys(PLACEMARK_CATEGORIES).forEach(category => {
    categoryCounts[category] = 0;
  });

  // Enhanced type extraction helper
  const extractPointType = (point: ApiPoint): string => {
    try {
      // First try direct type
      if (point.type && point.type !== "NULL") {
        return point.type;
      }
      
      // Fallback to properties
      if (point.properties?.type && point.properties.type !== "NULL") {
        return point.properties.type;
      }
      
      // Enhanced name-based inference
      const name = point.name || '';
      
      // Network equipment patterns
      if (name.includes("OLT") || name.includes("Block Router") || name.includes("BSNL EXCHANGE")) {
        return "Block Router";
      }
      
      // GP patterns (more comprehensive)
      if (name.includes(" GP ") || name.endsWith(" GP") || name.match(/\(\d+\)$/)) {
        return "GP";
      }
      
      // BHQ patterns
      if (name.includes("BHQ") || name.includes("Block Headquarters") || name.includes("BLOCK OFFICE")) {
        return "BHQ";
      }
      
      // FPOI patterns
      if (name.startsWith("FPOI") || name.includes("FPOI")) {
        return "FPOI";
      }
      
      // Infrastructure patterns
      if (name.includes("Bridge")) return "Bridge";
      if (name.includes("Culvert")) return "Culvert";
      if (name.includes("Cross")) return "Road Cross";
      
      return 'FPOI';
    } catch (error) {
      console.error('Error in extractPointType:', error);
      return 'FPOI';
    }
  };

  // Process ALL points with validation
  (apiData.points || []).forEach((point: ApiPoint, index: number) => {
    try {
      // Validate coordinates
      const lat = point.coordinates.latitude;
      const lng = point.coordinates.longitude;
      
      const hasValidCoords = isValidCoordinate(lat, lng);
      if (!hasValidCoords) {
        console.warn(`Invalid coordinates for point ${index}:`, { lat, lng });
        // Still analyze the point for type information
      }

      const pointType = extractPointType(point);
      const category = getCategoryFromName(pointType);
      
      // Add to analysis
      typeAnalysis.push({
        index,
        name: point.name || `Point ${index + 1}`,
        directType: point.type,
        propertiesType: point.properties?.type,
        extractedType: pointType,
        category,
        allProperties: point.properties,
        hasCoordinates: hasValidCoords
      });

      if (hasValidCoords) {
        // Validate category exists
        if (!PLACEMARK_CATEGORIES[category]) {
          console.warn(`Category '${category}' not found in PLACEMARK_CATEGORIES. Using FPOI as fallback.`);
          categoryCounts['FPOI'] = (categoryCounts['FPOI'] || 0) + 1;
        } else {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }

        processedPlacemarks.push({
          id: `point-${index}`,
          name: point.name || `Point ${index + 1}`,
          category: PLACEMARK_CATEGORIES[category] ? category : 'FPOI',
          type: 'point',
          coordinates: { lat, lng },
          styleUrl: (point as any).styleUrl,
          pointType: pointType,
        });
      }
    } catch (error) {
      console.error(`Error processing point ${index}:`, error, point);
    }
  });

  // Process polylines with validation
  (apiData.polylines || []).forEach((polyline: ApiPolyline, index: number) => {
    try {
      // Validate polyline coordinates
      if (!polyline.coordinates || !Array.isArray(polyline.coordinates) || polyline.coordinates.length < 2) {
        console.warn(`Invalid polyline coordinates for polyline ${index}:`, polyline.coordinates);
        return;
      }

      // Handle different coordinate formats
      const validCoordinates = polyline.coordinates.filter(coord => {
        if (!Array.isArray(coord)) return false;
        
        // Handle [lng, lat, elevation] format (your desktop files)
        if (coord.length === 3) {
          const [lng, lat, elevation] = coord;
          return isValidCoordinate(lat, lng);
        }
        // Handle [lng, lat] format (standard KML)
        else if (coord.length === 2) {
          const [lng, lat] = coord;
          return isValidCoordinate(lat, lng);
        }
        
        return false;
      });

      if (validCoordinates.length < 2) {
        console.warn(`Insufficient valid coordinates for polyline ${index}:`, polyline);
        return;
      }

      // Enhanced polyline type processing with name-based fallback
      let normalizedType = normalizePolylineType(polyline.type);
      
      // If type is unclear, check the name for semantic clues
      if ((normalizedType === 'Incremental Cable') && polyline.name) {
        const nameLower = polyline.name.toLowerCase();
        if (nameLower.includes('proposed')) {
          normalizedType = 'Proposed Cable';
        }
      }
      
      const category = getCategoryFromName(normalizedType);
      
      // Add to polyline analysis
      polylineAnalysis.push({
        index,
        name: polyline.name || `Polyline ${index + 1}`,
        type: polyline.type,
        normalizedType,
        length: (polyline as any).length,
        distance: (polyline as any).distance,
        allProperties: (polyline as any).properties,
        coordinateCount: validCoordinates.length
      });

      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      // Convert coordinates to {lat, lng} format
      const processedCoordinates = validCoordinates.map(coord => {
        if (coord.length === 3) {
          // [lng, lat, elevation] format
          return {
            lat: coord[1],  // latitude is second
            lng: coord[0],  // longitude is first
          };
        } else {
          // [lng, lat] format
          return {
            lat: coord[1],  // latitude is second
            lng: coord[0],  // longitude is first
          };
        }
      });

      processedPlacemarks.push({
        id: `polyline-${index}`,
        name: polyline.name || `Polyline ${index + 1}`,
        category,
        type: 'polyline',
        coordinates: processedCoordinates,
        distance: (polyline as any).distance || (polyline as any).length,
        styleUrl: (polyline as any).styleUrl,
      } as any);
    } catch (error) {
      console.error(`Error processing polyline ${index}:`, error, polyline);
    }
  });


  // Unique types summary
  const uniqueDirectTypes = [...new Set(typeAnalysis.map(item => item.directType))];
  const uniquePropsTypes = [...new Set(typeAnalysis.map(item => item.propertiesType))];
  const uniqueExtractedTypes = [...new Set(typeAnalysis.map(item => item.extractedType))];

  const sampleProperties = typeAnalysis.slice(0, 3).map(item => ({
    name: item.name,
    type: item.extractedType,
    propertyKeys: item.allProperties ? Object.keys(item.allProperties) : []
  }));

  // Detailed property sampling
  typeAnalysis.slice(0, 5).forEach((item, i) => {
    if (item.allProperties) {
      const sampleProps = Object.entries(item.allProperties)
        .slice(0, 10)
        .reduce((obj, [key, value]) => {
          obj[key] = typeof value === 'string' && value.length > 50 
            ? value.substring(0, 50) + '...' 
            : value;
          return obj;
        }, {} as any);
      console.table(sampleProps);
    }
  });

  // Polyline analysis
  if (polylineAnalysis.length > 0) {
    console.table(polylineAnalysis.map(item => ({
      Index: item.index,
      Name: item.name.substring(0, 30),
      OriginalType: item.type,
      NormalizedType: item.normalizedType,
      Length: item.length,
      Distance: item.distance,
      Coords: item.coordinateCount
    })));

    const uniquePolylineTypes = [...new Set(polylineAnalysis.map(item => item.type))];
    const uniqueNormalizedTypes = [...new Set(polylineAnalysis.map(item => item.normalizedType))];
  }

  // Category mapping results
  const categoryResults = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a);
  console.table(categoryResults.map(([name, count]) => ({ Category: name, Count: count })));

  // Flag any issues
  const nullTypes = typeAnalysis.filter(item => item.directType === "NULL");
  const unknownCategories = typeAnalysis.filter(item => item.category === 'FPOI' && item.extractedType !== 'FPOI');
  
  if (nullTypes.length > 0) {
  }
  
  if (unknownCategories.length > 0) {
    console.table(unknownCategories.map(item => ({
      Name: item.name.substring(0, 30),
      ExtractedType: item.extractedType,
      DirectType: item.directType,
      PropsType: item.propertiesType
    })));
  }

  // Create categories array
  const categories: PlacemarkCategory[] = Object.entries(PLACEMARK_CATEGORIES)
    .map(([name, config]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      count: categoryCounts[name] || 0,
      visible: true,
      color: config.color,
      icon: config.icon,
    }))
    .filter(category => category.count > 0);

  return { placemarks: processedPlacemarks, categories };
}

// Enhanced coordinate validation
function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    lat !== 0 && lng !== 0 // Exclude null island unless specifically needed
  );
}

// Enhanced getCategoryFromName function to handle all infrastructure types
function getCategoryFromName(name: string): string {
  if (!name) return 'FPOI';
  
  // Sanitize input
  const cleanName = String(name).trim();
  if (!cleanName) return 'FPOI';
  
  const upperName = cleanName.toUpperCase();
  
  // Direct exact matches first
  if (PLACEMARK_CATEGORIES[cleanName]) return cleanName;
  
  // Case-insensitive exact matches
  for (const category of Object.keys(PLACEMARK_CATEGORIES)) {
    if (category.toUpperCase() === upperName) return category;
  }
  
  // Enhanced mappings for API data types (includes all missing mappings from analysis)
  const mappings: Record<string, string> = {
    // Infrastructure types
    'ROAD CROSS': 'Road Cross',
    'N HIGHWAY CROSS': 'N Highway Cross',
    'RAILWAY CROSS': 'Railway Cross',
    'BRIDGE': 'Bridge',
    'CULVERT': 'Culvert',
    
    // Network equipment
    'BLOCK ROUTER': 'Block Router',
    'BLOCK OFFICE': 'BHQ', // From analysis: BLOCK OFFICE should map to BHQ
    'GP': 'GP',
    'FPOI': 'FPOI',
    'BHQ': 'BHQ',
    'BR': 'BR',
    
    // Cable types with OFC variations
    'INCREMENTAL CABLE': 'Incremental Cable',
    'PROPOSED CABLE': 'Proposed Cable',
    'INCREMENTAL OFC': 'Incremental Cable', // From analysis
    'PROPOSED OFC': 'Proposed Cable', // From analysis
    'UNKNOWN LINE TYPE': 'Incremental Cable', // From analysis
    'OFC': 'Incremental Cable',
    'FIBER OPTIC CABLE': 'Incremental Cable',
    
    // Other types
    'LANDMARK': 'LANDMARK',
    'NULL': 'FPOI', // Handle NULL types
    'UNKNOWN': 'FPOI',
  };
  
  if (mappings[upperName]) return mappings[upperName];
  
  // Enhanced partial matches for variations
  if (upperName.includes('BRIDGE')) return 'Bridge';
  if (upperName.includes('CROSS') || upperName.includes('CROSSING')) {
    if (upperName.includes('ROAD')) return 'Road Cross';
    if (upperName.includes('HIGHWAY')) return 'N Highway Cross';
    if (upperName.includes('RAIL')) return 'Railway Cross';
    return 'Road Cross'; // Default crossing type
  }
  if (upperName.includes('CULVERT')) return 'Culvert';
  if (upperName.includes('FIBER')) return 'FIBERTURN';
  if (upperName.includes('RAIL')) return 'Railway Cross';
  if (upperName.includes('KM') || upperName.includes('KILOMETER')) return 'KILOMETERSTONE';
  if (upperName.includes('ROUTER') || upperName.includes('OLT')) return 'Block Router';
  if (upperName.includes('HIGHWAY')) return 'N Highway Cross';
  if (upperName.includes('CABLE') || upperName.includes('OFC')) {
    if (upperName.includes('PROPOSED')) return 'Proposed Cable';
    return 'Incremental Cable';
  }
  
  // Gram Panchayat detection
  if (upperName.includes(' GP ') || upperName.endsWith(' GP') || upperName.includes('PANCHAYAT')) {
    return 'GP';
  }
  
  // Block Headquarters detection
  if (upperName.includes('BHQ') || upperName.includes('HEADQUARTERS') || upperName.includes('BLOCK OFFICE')) {
    return 'BHQ';
  }
  
  // Default category for unknown types
  console.warn(`Unknown category type: ${name}, defaulting to FPOI`);
  return 'FPOI';
}

// -----------------------------
// Enhanced Physical Survey Processing with Images and PHOTO_SURVEY category
// -----------------------------
export function processPhysicalSurveyData(apiData: PhysicalSurveyApiResponse): {
  placemarks: ProcessedPhysicalSurvey[];
  categories: PlacemarkCategory[];
} {
  const processedPlacemarks: ProcessedPhysicalSurvey[] = [];
  const categoryCounts: Record<string, number> = {};

  // Updated to include PHOTO_SURVEY category
  const physicalSurveyCategories = [
    'SURVEYSTART', 'ROUTEFEASIBILITY', 'AREA', 'SIDE', 'ROUTEDETAILS',
    'LANDMARK', 'FIBERTURN', 'Bridge', 'Culvert', 'ROADCROSSING', 'Causeways',
    'KILOMETERSTONE', 'FPOI', 'JOINTCHAMBER', 'ROUTEINDICATOR', 'ENDSURVEY', 'HOLDSURVEY',
    'SURVEY_ROUTE', 'PHOTO_SURVEY', 'VIDEO_SURVEY'
  ];
  
  physicalSurveyCategories.forEach(c => categoryCounts[c] = 0);

  Object.entries(apiData.data).forEach(([blockId, points]) => {
    const liveLocationPoints: any[] = [];

    points.forEach((point, index) => {
      try {
        // Validate coordinates
        const lat = parseFloat(point.latitude);
        const lng = parseFloat(point.longitude);
        
        if (!isValidCoordinate(lat, lng)) {
          console.warn(`Invalid coordinates for physical survey point ${blockId}-${index}:`, { lat, lng, point });
          return;
        }

        if (point.event_type === 'LIVELOCATION') {
          // Parse timestamp safely
          const timestamp = parseTimestamp(point.createdTime) || parseTimestamp(point.created_at);
          if (isFinite(timestamp)) {
            liveLocationPoints.push({
              lat,
              lng,
              timestamp,
              surveyId: point.survey_id
            });
          }
        } else {
          const category = point.event_type;
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;

          // Extract images for this point
          const images = extractSurveyImages(point);
          
          processedPlacemarks.push({
            id: `physical-${blockId}-${point.survey_id}-${index}`,
            name: `${point.event_type} - Survey ${point.survey_id}`,
            category,
            type: 'point',
            coordinates: { lat, lng },
            surveyId: point.survey_id,
            eventType: point.event_type,
            blockId,
            images, 
            hasImages: images.length > 0 
          });

          // Enhanced video survey handling
          if (point.event_type === 'VIDEORECORD' && point.videoDetails) {
            try {
              const vd = JSON.parse(point.videoDetails);
              if (vd && vd.videoUrl && vd.videoUrl.trim() !== '') {
                categoryCounts['VIDEO_SURVEY'] = (categoryCounts['VIDEO_SURVEY'] || 0) + 1;
              }
            } catch (error) {
              console.warn(`Failed to parse videoDetails for survey ${point.survey_id}:`, error);
            }
          }

          // Enhanced photo survey handling - count points with images
          if (images.length > 0 && point.surveyUploaded && point.surveyUploaded !== 'false') {
            categoryCounts['PHOTO_SURVEY'] = (categoryCounts['PHOTO_SURVEY'] || 0) + 1;
          }
        }
      } catch (error) {
        console.error(`Error processing physical survey point ${blockId}-${index}:`, error, point);
      }
    });

    // Process live location points into routes
    if (liveLocationPoints.length > 1) {
      liveLocationPoints.sort((a, b) => a.timestamp - b.timestamp);
      
      const surveyGroups = liveLocationPoints.reduce((groups, p) => {
        if (!groups[p.surveyId]) groups[p.surveyId] = [];
        groups[p.surveyId].push(p);
        return groups;
      }, {} as Record<string, any[]>);

      Object.entries(surveyGroups).forEach(([surveyId, routePoints]) => {
        if (routePoints.length > 1) {
          try {

            const firstPoint = points.find(p => p.survey_id === surveyId);

            categoryCounts['SURVEY_ROUTE'] = (categoryCounts['SURVEY_ROUTE'] || 0) + 1;
            processedPlacemarks.push({
              id: `physical-route-${blockId}-${surveyId}`,
              name: `Survey Route - ${surveyId}`,
              category: 'SURVEY_ROUTE',
              type: 'polyline',
              coordinates: routePoints.map(p => ({ lat: p.lat, lng: p.lng })),
              surveyId,
              eventType: 'SURVEY_ROUTE',
              blockId,
              images: [], 
              hasImages: false,

              startLgdName: firstPoint?.start_lgd_name,
              endLgdName: firstPoint?.end_lgd_name,
              routeDetails: firstPoint?.route_details,
              routeFeasibility: firstPoint?.route_feasibility,
              stateName: firstPoint?.state_name,
              districtName: firstPoint?.district_name,
              blockName: firstPoint?.block_name,
              createdTime: firstPoint?.createdTime
            });
          } catch (error) {
            console.error(`Error creating survey route for ${surveyId}:`, error);
          }
        }
      });
    }
  });

  const categories: PlacemarkCategory[] = physicalSurveyCategories
    .map(name => ({
      id: `physical-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      count: categoryCounts[name] || 0,
      visible: name === 'SURVEY_ROUTE' ? true : false, // Only SURVEY_ROUTE is visible by default
      color: PLACEMARK_CATEGORIES[name]?.color || '#6B7280',
      icon: PLACEMARK_CATEGORIES[name]?.icon || '📍'
    }))
    .filter(c => c.count > 0);

  return { placemarks: processedPlacemarks, categories };
}

// Enhanced timestamp parsing
function parseTimestamp(timeStr: string | number | undefined): number {
  if (!timeStr) return NaN;
  
  if (typeof timeStr === 'number') {
    return timeStr;
  }
  
  const parsed = Number(timeStr);
  if (isFinite(parsed)) {
    // If it's already a large number (epoch ms), return as-is
    if (parsed > 1000000000000) return parsed;
    // If it's a smaller number, might be seconds - convert to ms
    if (parsed > 1000000000) return parsed * 1000;
  }
  
  // Fallback to Date.parse for string dates
  return Date.parse(timeStr);
}

// -----------------------------
// Enhanced Desktop Planning Processing
// -----------------------------
export function processDesktopPlanningData(apiData: DesktopPlanningApiResponse): {
  placemarks: ProcessedDesktopPlanning[];
  categories: PlacemarkCategory[];
} {
  const processedPlacemarks: ProcessedDesktopPlanning[] = [];
  const categoryCounts: Record<string, number> = {};

  // Initialize category counts for desktop planning
  const desktopPlanningCategories = [
    'Desktop: GP',
    'Desktop: FPOI',
    'Desktop: BHQ',
    'Desktop: Block Router',
    'Desktop: Bridge',
    'Desktop: Culvert',
    'Desktop: Road Cross',
    'Desktop: Railway Cross',
    'Desktop: N Highway Cross',
    'Desktop: Incremental Cable',
    'Desktop: Proposed Cable',
  ];

  desktopPlanningCategories.forEach(category => {
    categoryCounts[category] = 0;
  });

  // Process each network in the response
  (apiData.data || []).forEach(network => {
    // Points
    (network.points || []).forEach(point => {
      try {
        // Parse coordinates from "[longitude,latitude]" format
        const coordsArray = JSON.parse(point.coordinates);
        if (!Array.isArray(coordsArray) || coordsArray.length !== 2) {
          console.warn(`Invalid coordinates format for desktop point ${point.id}:`, point.coordinates);
          return;
        }

        const longitude = Number(coordsArray[0]);
        const latitude = Number(coordsArray[1]);

        if (!isValidCoordinate(latitude, longitude)) {
          console.warn(`Invalid coordinate values for desktop point ${point.id}:`, { latitude, longitude });
          return;
        }

        // Parse properties to get type information
        let pointProperties: any = {};
        try {
          pointProperties = JSON.parse(point.properties);
        } catch (error) {
          console.warn(`Failed to parse properties for desktop point ${point.id}:`, error);
        }

        const assetType = pointProperties.asset_type || pointProperties.type || 'FPOI';
        const category = getDesktopPlanningCategory(assetType, 'point');
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        processedPlacemarks.push({
          id: `desktop-point-${network.id}-${point.id}`,
          name: point.name || `Desktop Point ${point.id}`,
          category,
          type: 'point',
          coordinates: { lat: latitude, lng: longitude },
          pointType: assetType,
          assetType: pointProperties.asset_type,
          status: pointProperties.status,
          ring: pointProperties.ring,
          networkId: network.id,
          lgdCode: pointProperties.lgd_code,
          rawProperties: pointProperties,
        });
      } catch (error) {
        console.error('Error processing desktop planning point:', point, error);
      }
    });

    // Connections (Polylines)
    (network.connections || []).forEach(connection => {
      try {
        // Parse coordinates from "[[lat,lng],[lat,lng],...]" format
        const coordsArray = JSON.parse(connection.coordinates);
        if (!Array.isArray(coordsArray) || coordsArray.length < 2) {
          console.warn(`Invalid coordinates format for desktop connection ${connection.id}:`, connection.coordinates);
          return;
        }

        // Validate coordinates
        const validCoordinates = coordsArray.filter(coord => {
          if (!Array.isArray(coord) || coord.length !== 2) return false;
          const [lat, lng] = coord;
          return isValidCoordinate(lat, lng);
        });

        if (validCoordinates.length < 2) {
          console.warn(`Insufficient valid coordinates for desktop connection ${connection.id}`);
          return;
        }

        const coordinates = validCoordinates.map((coord: [number, number]) => ({
          lat: coord[0],
          lng: coord[1],
        }));

        // Parse properties
        let connectionProperties: any = {};
        try {
          connectionProperties = JSON.parse(connection.properties);
        } catch (error) {
          console.warn(`Failed to parse properties for desktop connection ${connection.id}:`, error);
        }

        // FIXED: Determine category based on connection type from API
        // API uses "existing" for implemented cables and "proposed" for planned cables
        const connectionType = connection.type || 'proposed';
        const category = connectionType === 'existing' 
          ? 'Desktop: Incremental Cable'  // Green cables - already implemented
          : 'Desktop: Proposed Cable';    // Red cables - planned for future

        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        processedPlacemarks.push({
          id: `desktop-connection-${network.id}-${connection.id}`,
          name: connection.original_name || `Desktop Connection ${connection.id}`,
          category,
          type: 'polyline',
          coordinates,
          length: connection.length,
          connectionType: connectionType as 'proposed' | 'incremental' | 'existing',
          status: connection.status,
          networkId: network.id,
          rawProperties: connectionProperties,
        });
      } catch (error) {
        console.error('Error processing desktop planning connection:', connection, error);
      }
    });
  });

  // Create categories array
  const categories: PlacemarkCategory[] = desktopPlanningCategories
    .map(name => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      count: categoryCounts[name] || 0,
      visible: true,
      color: PLACEMARK_CATEGORIES[name]?.color || '#6B7280',
      icon: PLACEMARK_CATEGORIES[name]?.icon || '📍',
    }))
    .filter(category => category.count > 0);

  return { placemarks: processedPlacemarks, categories };
}

// Helper function to determine desktop planning category
function getDesktopPlanningCategory(assetType: string, itemType: 'point' | 'polyline'): string {
  if (!assetType) return 'Desktop: FPOI';
  
  const cleanAssetType = String(assetType).trim();
  if (!cleanAssetType) return 'Desktop: FPOI';
  
  const upperAssetType = cleanAssetType.toUpperCase();

  if (itemType === 'point') {
    // Point categories based on asset_type or type
    const pointMappings: Record<string, string> = {
      'GP': 'Desktop: GP',
      'FPOI': 'Desktop: FPOI',
      'BHQ': 'Desktop: BHQ',
      'BLOCK ROUTER': 'Desktop: Block Router',
      'BRIDGE': 'Desktop: Bridge',
      'CULVERT': 'Desktop: Culvert',
      'ROAD CROSS': 'Desktop: Road Cross',
      'RAILWAY CROSS': 'Desktop: Railway Cross',
      'N HIGHWAY CROSS': 'Desktop: N Highway Cross',
    };

    if (pointMappings[upperAssetType]) return pointMappings[upperAssetType];

    // Default for points
    return 'Desktop: FPOI';
  }

  // Polyline categories based on connection type are handled in the main processing function
  return 'Desktop: Proposed Cable';
}