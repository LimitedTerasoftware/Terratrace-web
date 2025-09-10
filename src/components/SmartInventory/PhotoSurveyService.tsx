import { PhysicalSurveyApiResponse } from '../../types/kmz';

// Photo Survey Types
export interface PhotoPoint {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
  surveyId: string;
  blockId: string;
  eventType: string;
  images: PhotoImage[];
  meta?: {
    surveyId?: string;
    blockId?: string;
    eventType?: string;
    description?: string;
    coordinates?: string;
  };
}

export interface PhotoImage {
  url: string;
  type: 'start_photo' | 'end_photo' | 'fpoi' | 'route_indicator' | 'kmt_stone' | 'fiber_turn' | 'landmark' | 'joint_chamber' | 'road_crossing_start' | 'road_crossing_end' | 'bridge' | 'culvert' | 'general';
  label: string;
  coordinates?: { lat: number; lng: number };
  timestamp?: number;
  description?: string;
}

export interface PhotoSurveyData {
  photoPoints: PhotoPoint[];
  metadata: {
    totalPoints: number;
    totalImages: number;
    surveyIds: string[];
    blockIds: string[];
    timeRange: { start: number; end: number };
  };
}

export interface PhotoValidationResult {
  photoPointCount: number;
  imageCount: number;
  issues: string[];
  surveyIds: string[];
  blockIds: string[];
}

export class PhotoSurveyService {
  /**
   * Process physical survey data to extract photo points and images
   */
  static processPhysicalSurveyData(data: PhysicalSurveyApiResponse | null): PhotoSurveyData {
    if (!data || !data.data) {
      return {
        photoPoints: [],
        metadata: {
          totalPoints: 0,
          totalImages: 0,
          surveyIds: [],
          blockIds: [],
          timeRange: { start: 0, end: 0 }
        }
      };
    }

    const photoPoints: PhotoPoint[] = [];
    const surveyIds = new Set<string>();
    const blockIds = new Set<string>();
    let minTime = Infinity;
    let maxTime = -Infinity;
    let totalImages = 0;

    // Process each block's survey points
    Object.entries(data.data).forEach(([blockId, points]) => {
      if (!Array.isArray(points)) return;

      blockIds.add(blockId);

      points.forEach((point, index) => {
        try {
          // Only process points that have survey uploaded and contain images
          if (!point.surveyUploaded || point.surveyUploaded === '' || point.surveyUploaded === 'false') {
            return;
          }

          const lat = parseFloat(point.latitude);
          const lng = parseFloat(point.longitude);

          if (!this.isValidCoordinate(lat, lng)) {
            return;
          }

          // Extract images from the point
          const images = this.extractImagesFromPoint(point);
          if (images.length === 0) {
            return; // Skip points with no images
          }

          const timestamp = this.parseTimestamp(point.createdTime) || this.parseTimestamp(point.created_at) || Date.now();
          
          if (isFinite(timestamp)) {
            minTime = Math.min(minTime, timestamp);
            maxTime = Math.max(maxTime, timestamp);
          }

          surveyIds.add(point.survey_id);
          totalImages += images.length;

          const photoPoint: PhotoPoint = {
            id: `photo-${blockId}-${point.survey_id}-${index}`,
            lat,
            lng,
            timestamp,
            surveyId: point.survey_id,
            blockId,
            eventType: point.event_type,
            images,
            meta: {
              surveyId: point.survey_id,
              blockId,
              eventType: point.event_type,
              description: point.description || point.remarks,
              coordinates: `${lat}, ${lng}`
            }
          };

          photoPoints.push(photoPoint);
        } catch (error) {
          console.error(`Error processing photo point ${blockId}-${index}:`, error);
        }
      });
    });

    return {
      photoPoints,
      metadata: {
        totalPoints: photoPoints.length,
        totalImages,
        surveyIds: Array.from(surveyIds),
        blockIds: Array.from(blockIds),
        timeRange: {
          start: minTime === Infinity ? 0 : minTime,
          end: maxTime === -Infinity ? 0 : maxTime
        }
      }
    };
  }

  /**
   * Extract images from a survey point
   */
  private static extractImagesFromPoint(point: any): PhotoImage[] {
    const images: PhotoImage[] = [];

    try {
      // Survey Start photos
      if (point.event_type === "SURVEYSTART" && point.start_photos) {
        const startPhotos = this.parsePhotoArray(point.start_photos);
        startPhotos.forEach((photoPath: string, index: number) => {
          if (this.isValidPhotoPath(photoPath)) {
            images.push({
              url: this.resolveImageUrl(photoPath),
              type: 'start_photo',
              label: `Survey Start Photo ${index + 1}`,
              timestamp: this.parseTimestamp(point.createdTime) || this.parseTimestamp(point.created_at)
            });
          }
        });
      }

      // Survey End photos
      if (point.event_type === "ENDSURVEY" && point.end_photos) {
        const endPhotos = this.parsePhotoArray(point.end_photos);
        endPhotos.forEach((photoPath: string, index: number) => {
          if (this.isValidPhotoPath(photoPath)) {
            images.push({
              url: this.resolveImageUrl(photoPath),
              type: 'end_photo',
              label: `Survey End Photo ${index + 1}`,
              timestamp: this.parseTimestamp(point.createdTime) || this.parseTimestamp(point.created_at)
            });
          }
        });
      }

      // Road Crossing photos
      if (point.event_type === "ROADCROSSING" && point.road_crossing) {
        const roadCrossing = this.parseRoadCrossingData(point.road_crossing);
        
        if (roadCrossing.startPhoto && this.isValidPhotoPath(roadCrossing.startPhoto)) {
          images.push({
            url: this.resolveImageUrl(roadCrossing.startPhoto),
            type: 'road_crossing_start',
            label: 'Road Crossing Start Photo',
            coordinates: roadCrossing.startPhotoLat && roadCrossing.startPhotoLong 
              ? { lat: parseFloat(roadCrossing.startPhotoLat), lng: parseFloat(roadCrossing.startPhotoLong) }
              : undefined
          });
        }
        
        if (roadCrossing.endPhoto && this.isValidPhotoPath(roadCrossing.endPhoto)) {
          images.push({
            url: this.resolveImageUrl(roadCrossing.endPhoto),
            type: 'road_crossing_end',
            label: 'Road Crossing End Photo',
            coordinates: roadCrossing.endPhotoLat && roadCrossing.endPhotoLong 
              ? { lat: parseFloat(roadCrossing.endPhotoLat), lng: parseFloat(roadCrossing.endPhotoLong) }
              : undefined
          });
        }
      }

      // LANDMARK photos (might be in road_crossing field)
      if (point.event_type === "LANDMARK" && point.road_crossing && images.length === 0) {
        const roadCrossing = this.parseRoadCrossingData(point.road_crossing);
        
        if (roadCrossing.startPhoto && this.isValidPhotoPath(roadCrossing.startPhoto)) {
          images.push({
            url: this.resolveImageUrl(roadCrossing.startPhoto),
            type: 'landmark',
            label: 'Landmark Photo',
            coordinates: roadCrossing.startPhotoLat && roadCrossing.startPhotoLong 
              ? { lat: parseFloat(roadCrossing.startPhotoLat), lng: parseFloat(roadCrossing.startPhotoLong) }
              : undefined
          });
        }
        
        if (roadCrossing.endPhoto && this.isValidPhotoPath(roadCrossing.endPhoto)) {
          images.push({
            url: this.resolveImageUrl(roadCrossing.endPhoto),
            type: 'landmark',
            label: 'Landmark Photo 2',
            coordinates: roadCrossing.endPhotoLat && roadCrossing.endPhotoLong 
              ? { lat: parseFloat(roadCrossing.endPhotoLat), lng: parseFloat(roadCrossing.endPhotoLong) }
              : undefined
          });
        }
      }

      // Generic event type photos from videoUrl field
      if (point.videoUrl && this.isValidPhotoPath(point.videoUrl)) {
        const eventTypeLabels: Record<string, string> = {
          'FIBERTURN': 'Fiber Turn Photo',
          'FPOI': 'FPOI Photo', 
          'KILOMETERSTONE': 'KM Stone Photo',
          'JOINTCHAMBER': 'Joint Chamber Photo',
          'ROUTEINDICATOR': 'Route Indicator Photo',
          'BRIDGE': 'Bridge Photo',
          'CULVERT': 'Culvert Photo',
          'ROUTEFEASIBILITY': 'Route Feasibility Photo',
          'AREA': 'Area Photo',
          'SIDE': 'Side Photo',
          'ROUTEDETAILS': 'Route Details Photo'
        };
        
        if (eventTypeLabels[point.event_type]) {
          images.push({
            url: this.resolveImageUrl(point.videoUrl),
            type: point.event_type.toLowerCase() as any,
            label: eventTypeLabels[point.event_type],
            timestamp: this.parseTimestamp(point.createdTime) || this.parseTimestamp(point.created_at)
          });
        }
      }

      // Check jointChamberUrl field as fallback
      if (point.jointChamberUrl && this.isValidPhotoPath(point.jointChamberUrl) && images.length === 0) {
        const eventTypeLabels: Record<string, string> = {
          'FIBERTURN': 'Fiber Turn Photo',
          'FPOI': 'FPOI Photo', 
          'KILOMETERSTONE': 'KM Stone Photo',
          'JOINTCHAMBER': 'Joint Chamber Photo',
          'ROUTEINDICATOR': 'Route Indicator Photo',
          'BRIDGE': 'Bridge Photo',
          'CULVERT': 'Culvert Photo',
          'ROUTEFEASIBILITY': 'Route Feasibility Photo',
          'AREA': 'Area Photo',
          'SIDE': 'Side Photo',
          'ROUTEDETAILS': 'Route Details Photo'
        };
        
        if (eventTypeLabels[point.event_type]) {
          images.push({
            url: this.resolveImageUrl(point.jointChamberUrl),
            type: point.event_type.toLowerCase() as any,
            label: eventTypeLabels[point.event_type],
            timestamp: this.parseTimestamp(point.createdTime) || this.parseTimestamp(point.created_at)
          });
        }
      }

    } catch (error) {
      console.error('Error extracting images from survey point:', error);
    }

    return images;
  }

  /**
   * Validate photo survey data
   */
  static validatePhotoSurveyData(data: PhysicalSurveyApiResponse | null): PhotoValidationResult {
    const result: PhotoValidationResult = {
      photoPointCount: 0,
      imageCount: 0,
      issues: [],
      surveyIds: [],
      blockIds: []
    };

    if (!data || !data.data) {
      result.issues.push('No survey data provided');
      return result;
    }

    const surveyIds = new Set<string>();
    const blockIds = new Set<string>();

    Object.entries(data.data).forEach(([blockId, points]) => {
      blockIds.add(blockId);
      
      if (!Array.isArray(points)) {
        result.issues.push(`Invalid points array for block ${blockId}`);
        return;
      }

      points.forEach((point, index) => {
        if (point.surveyUploaded && point.surveyUploaded !== '' && point.surveyUploaded !== 'false') {
          const images = this.extractImagesFromPoint(point);
          if (images.length > 0) {
            result.photoPointCount++;
            result.imageCount += images.length;
            surveyIds.add(point.survey_id);
          }
        }
      });
    });

    result.surveyIds = Array.from(surveyIds);
    result.blockIds = Array.from(blockIds);

    if (result.photoPointCount === 0) {
      result.issues.push('No photo points found in survey data');
    }

    return result;
  }

  /**
   * Find photo point by ID
   */
  static findPhotoPointById(photoPoints: PhotoPoint[], id: string): PhotoPoint | null {
    return photoPoints.find(point => point.id === id) || null;
  }

  /**
   * Get photo points within a geographic bounds
   */
  static getPhotoPointsInBounds(
    photoPoints: PhotoPoint[],
    bounds: { north: number; south: number; east: number; west: number }
  ): PhotoPoint[] {
    return photoPoints.filter(point => 
      point.lat >= bounds.south &&
      point.lat <= bounds.north &&
      point.lng >= bounds.west &&
      point.lng <= bounds.east
    );
  }

  /**
   * Format duration in milliseconds to human readable string
   */
  static formatDuration(ms: number): string {
    if (!isFinite(ms) || ms < 0) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Private helper methods
  private static isValidCoordinate(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' && typeof lng === 'number' &&
      isFinite(lat) && isFinite(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      lat !== 0 && lng !== 0
    );
  }

  private static parseTimestamp(timeStr: string | number | undefined): number {
    if (!timeStr) return NaN;
    
    if (typeof timeStr === 'number') {
      return timeStr;
    }
    
    const parsed = Number(timeStr);
    if (isFinite(parsed)) {
      if (parsed > 1000000000000) return parsed;
      if (parsed > 1000000000) return parsed * 1000;
    }
    
    return Date.parse(timeStr);
  }

  private static parsePhotoArray(photoData: string | any[]): string[] {
    try {
      if (Array.isArray(photoData)) return photoData;
      if (typeof photoData === 'string') return JSON.parse(photoData);
      return [];
    } catch (error) {
      console.warn('Error parsing photo array:', error);
      return [];
    }
  }

  private static parseRoadCrossingData(roadCrossingData: string | any): any {
    try {
      if (typeof roadCrossingData === 'string') {
        return JSON.parse(roadCrossingData);
      }
      return roadCrossingData || {};
    } catch (error) {
      console.warn('Error parsing road crossing data:', error);
      return {};
    }
  }

  private static isValidPhotoPath(path: string): boolean {
    return path && 
           typeof path === 'string' && 
           path.trim() !== '' && 
           path !== 'null' && 
           path !== 'undefined';
  }

  private static resolveImageUrl(path: string): string {
    if (!path || typeof path !== 'string') {
      return '';
    }
    
    const trimmedPath = path.trim();
    if (!trimmedPath) {
      return '';
    }
    
    // If already absolute URL, return as-is
    if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
      return trimmedPath;
    }
    
    // Clean up path - remove leading slashes
    const cleanPath = trimmedPath.replace(/^\/+/, '');
    
    const baseUrl = import.meta.env.VITE_Image_URL;
    if (!baseUrl) {
      console.error('VITE_Image_URL environment variable not set');
      return trimmedPath;
    }
    
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${normalizedBase}${cleanPath}`;
  }
}