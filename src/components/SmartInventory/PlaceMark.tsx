import {
  ApiPlacemark,
  ApiPoint,
  ApiPolyline,
  ProcessedPlacemark,
  PlacemarkCategory,
  PhysicalSurveyApiResponse,
  RectificationApiResponse,
  RectificationItem,
  ProcessedRectification,
  JointsApiResponse,
  ProcessedJoints,
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

export interface ProcessedGPData {
  id: string;
  name: string;
  category: string;
  type: 'point';
  coordinates: { lat: number; lng: number };
  surveyId: string;
  eventType: string;
  blockId: string;
  gpCoordinates: { lat: number; lng: number };
  poleCoordinates: { lat: number; lng: number };
  earthPitCoordinates: { lat: number; lng: number };
  images: SurveyImage[];
  hasImages: boolean;
  itemType: 'gp' | 'pole' | 'earthpit';
}

export interface ProcessedBlockData {
  id: string;
  name: string;
  category: string;
  type: 'point';
  coordinates: { lat: number; lng: number };
  surveyId: string;
  eventType: string;
  blockId: string;
  images: SurveyImage[];
  hasImages: boolean;
}

export interface SurveyImage {
  url: string;
  type: 'start_photo' | 'end_photo' | 'fpoi' | 'route_indicator' | 'kmt_stone' | 'fiber_turn' | 'landmark' | 'joint_chamber' | 'road_crossing_start' | 'road_crossing_end' | 'video_thumbnail' | 'bridge' | 'culvert' | 'general' | 'kilometerstone' | 'fiberturn' | 'routeindicator';
  label: string;
  coordinates?: { lat: number; lng: number }; // For road crossing photos and other geotagged images
}

// Survey Infrastructure Interface (NEW)
export interface ProcessedSurveyInfrastructure {
  id: string;
  name: string;
  category: string;
  type: 'point' | 'polyline';
  coordinates: { lat: number; lng: number } | { lat: number; lng: number }[];
  
  // Survey-specific metadata
  blockName?: string;
  districtName?: string;
  stateName?: string;
  direction?: string;
  phase?: string;
  fiberPosition?: string;
  roadOffset?: string;
  
  // Polyline-specific properties
  segmentLength?: string;
  startNode?: string;
  endNode?: string;
  numFibre?: string;
  routeCode?: string;
  assetType?: string;
  ring?: string;
  
  // Original properties for reference
  rawProperties?: any;
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
  'Incremental Cable': { color: '#00FF41', icon: '⚡' },
  'Proposed Cable': { color: '#FF1744', icon: '➖' },

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

  // GP Installation Categories
  'GP_LOCATION': { color: '#6B21A8', icon: '🏘️' },
  
  // Block Installation Category
  'BSNL_BLOCK': { color: '#C2410C', icon: '🏢' }, 

  // Junction Types (Network Infrastructure)
  'SJC': { color: '#06B6D4', icon: '🔷' },
  'BJC': { color: '#8B5CF6', icon: '🟣' },
  'LC': { color: '#F59E0B', icon: '🔶' },
  
  // Desktop Planning Junction Categories
  'Desktop: SJC': { color: '#22D3EE', icon: '🔷' },
  'Desktop: BJC': { color: '#A78BFA', icon: '🟣' },
  'Desktop: LC': { color: '#FBBF24', icon: '🔶' },

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
  'Desktop: Incremental Cable': { color: '#7CF10F', icon: '▓▓▓▓' },
  'Desktop: Proposed Cable': { color: '#FF2400', icon: '▒▒▒▒' },
   'Joint: SJC': { color: '#22D3EE', icon: '🔷' },
  // Tracking
  SURVEY_ROUTE: { color: '#FFFF99', icon: '➡️' },

  // Media categories (UPDATED with PHOTO_SURVEY)
  VIDEORECORD: { color: '#8B5CF6', icon: '🎥' },
  PHOTO_SURVEY: { color: '#DCB14E', icon: '📸' },
  VIDEO_SURVEY: { color: '#7C3AED', icon: '🎬' },

  // Rectification Categories (NEW)
    'Rectification: Chamber Installation': { color: '#9333EA', icon: '🔧' },
  'Rectification: Closer Replacement': { color: '#9333EA', icon: '🔄' },
  'Rectification: Route Under Road': { color: '#9333EA', icon: '🛣️' },
  'Rectification: Patch Replacement': { color: '#9333EA', icon: '🔨' }, // Purple with black center line
  'Rectification: Cable Repair': { color: '#9333EA', icon: '⚡' },
  'Rectification: Joint Repair': { color: '#9333EA', icon: '🔗' },
  'Rectification: Other': { color: '#9333EA', icon: '🔧' },

'Rectification: SURVEYSTART': { color: '#9333EA', icon: '🎯' },
'Rectification: ENDSURVEY': { color: '#9333EA', icon: '🏁' },
'Rectification: ROUTEFEASIBILITY': { color: '#9333EA', icon: '🛤️' },
'Rectification: LIVELOCATION': { color: '#9333EA', icon: '📍' },
'Rectification: AREA': { color: '#9333EA', icon: '📐' },
'Rectification: SIDE': { color: '#9333EA', icon: '↔️' },
'Rectification: VIDEORECORD': { color: '#9333EA', icon: '🎥' },
'Rectification: ROUTEDETAILS': { color: '#9333EA', icon: '📋' },
'Rectification: LANDMARK': { color: '#9333EA', icon: '🏛️' },
'Rectification: FIBERTURN': { color: '#9333EA', icon: '🔄' },
'Rectification: JOINTCHAMBER': { color: '#9333EA', icon: '🔗' },
'Rectification: ROADCROSSING': { color: '#9333EA', icon: '🛣️' },
'Rectification: KILOMETERSTONE': { color: '#9333EA', icon: '📍' },
'Rectification: SURVEY_ROUTE': { color: '#8B4513', icon: '➡️' },

  // NEW: Survey Infrastructure Categories
  // Educational
  'School': { color: '#4F46E5', icon: '🏫' },
  
  // Financial
  'Bank': { color: '#059669', icon: '🏦' },
  'ATM': { color: '#10B981', icon: '🏧' },
  
  // Religious
  'Masjid': { color: '#7C3AED', icon: '🕌' },
  'Temple': { color: '#F59E0B', icon: '🛕' },
  
  // Commercial
  'Restaurant': { color: '#EF4444', icon: '🍽️' },
  'Hotel': { color: '#8B5CF6', icon: '🏨' },
  'Pharmacy': { color: '#06B6D4', icon: '💊' },
  'Petrol Pump': { color: '#F97316', icon: '⛽' },
  
  // Transportation
  'Bus Stop': { color: '#84CC16', icon: '🚌' },
  'Railway Station': { color: '#6366F1', icon: '🚂' },
  
  // Government/Public Services
  'Post Office': { color: '#DC2626', icon: '📫' },
  'Fire Station': { color: '#B91C1C', icon: '🚒' },
  'Hospital': { color: '#EC4899', icon: '🏥' },
  'Govt. Office': { color: '#374151', icon: '🏛️' },
  
  // Infrastructure Markers
  'KM Stone': { color: '#35530E', icon: '📍' },
  'Landmark': { color: '#FF6B6B', icon: '🏛️' },
  
  // Telecom Infrastructure
  'RJIL RI': { color: '#FF1744', icon: '📡' },
  'VITIL RI': { color: '#2196F3', icon: '📡' },
  'AIRTEL RI': { color: '#FF5722', icon: '📡' },
  'RI': { color: '#9C27B0', icon: '📡' },
  'ASSET': { color: '#607D8B', icon: '🔧' },

  // Default
  point: { color: '#FF0000', icon: '📍' },

  // Cable Infrastructure (Survey prefixed) - MOVED TO END
  'Survey: Block to FPOI Cable': { color: '#1E3A8A', icon: '🔗' },

   // EXTERNAL FILE CATEGORIES - Survey
  'External Survey: SURVEYSTART': { color: '#10B981', icon: '🎯' },
  'External Survey: LANDMARK': { color: '#FF6B6B', icon: '🏛️' },
  'External Survey: FIBERTURN': { color: '#372AAC', icon: '🔄' },
  'External Survey: Bridge': { color: '#45B7D1', icon: '🌉' },
  'External Survey: Culvert': { color: '#96CEB4', icon: '🌊' },
  'External Survey: ROADCROSSING': { color: '#31F527', icon: '🛣️' },
  'External Survey: KILOMETERSTONE': { color: '#35530E', icon: '📏' },
  'External Survey: FPOI': { color: '#F8C471', icon: '⭐' },
  'External Survey: JOINTCHAMBER': { color: '#FE9A37', icon: '🔗' },
  'External Survey: ROUTEINDICATOR': { color: '#42D3F2', icon: '🧭' },
  'External Survey: ENDSURVEY': { color: '#E7180B', icon: '🎯' },
  'External Survey: HOLDSURVEY': { color: '#a93226', icon: '⏸️' },
  'External Survey: SURVEY_ROUTE': { color: '#FFFF99', icon: '➡️' },
  'External Survey: PHOTO_SURVEY': { color: '#DCB14E', icon: '📸' },
  'External Survey: VIDEO_SURVEY': { color: '#7C3AED', icon: '🎬' },
  'External Survey: GP': { color: '#4ECDC4', icon: '🏠' },
  'External Survey: BHQ': { color: '#BF1E00', icon: '🏢' },
  'External Survey: Block Router': { color: '#000000', icon: '🔗' },
  'External Survey: Incremental Cable': { color: '#06B6D4', icon: '⚡' },
  'External Survey: Proposed Cable': { color: '#F97316', icon: '➖' },

  // EXTERNAL FILE CATEGORIES - Desktop
  'External Desktop: GP': { color: '#2DD4BF', icon: '🟢' },
  'External Desktop: FPOI': { color: '#FBBF24', icon: '📷' },
  'External Desktop: BHQ': { color: '#DC2626', icon: '🏛️' },
  'External Desktop: Block Router': { color: '#1F2937', icon: '⚫' },
  'External Desktop: Bridge': { color: '#3B82F6', icon: '🌉' },
  'External Desktop: Culvert': { color: '#10B981', icon: '🌊' },
  'External Desktop: Road Cross': { color: '#F59E0B', icon: '🛣️' },
  'External Desktop: Railway Cross': { color: '#8B5CF6', icon: '🚂' },
  'External Desktop: N Highway Cross': { color: '#EF4444', icon: '🛤️' },
  'External Desktop: Incremental Cable': { color: '#8B5CF6', icon: '▓▓▓▓' },
  'External Desktop: Proposed Cable': { color: '#F59E0B', icon: '▒▒▒▒' },
  
  // BSNL Infrastructure Assets
  'External O & M: GP': { color: '#4ECDC4', icon: '🏠' },
'External O & M: FPOI': { color: '#F8C471', icon: '⭐' },
'External O & M: BHQ': { color: '#BF1E00', icon: '🏢' },
'External O & M: BR': { color: '#0030BF', icon: '🌐' },
'External O & M: Block Router': { color: '#000000', icon: '🔗' },
'External O & M: LANDMARK': { color: '#FF6B6B', icon: '🏛️' },

// Infrastructure - Crossings and Bridges
'External O & M: Bridge': { color: '#45B7D1', icon: '🌉' },
'External O & M: Culvert': { color: '#96CEB4', icon: '🌊' },
'External O & M: ROADCROSSING': { color: '#31F527', icon: '🛣️' },
'External O & M: Road Cross': { color: '#FFD700', icon: '🛣️' },
'External O & M: Railway Cross': { color: '#8B5CF6', icon: '🚂' },
'External O & M: N Highway Cross': { color: '#EF4444', icon: '🛤️' },

// Network Infrastructure
'External O & M: KILOMETERSTONE': { color: '#35530E', icon: '📍' },
'External O & M: FIBERTURN': { color: '#372AAC', icon: '🔄' },
'External O & M: JOINTCHAMBER': { color: '#FE9A37', icon: '🔗' },
'External O & M: ROUTEINDICATOR': { color: '#42D3F2', icon: '🧭' },

// Route Indicators (RI)
'External O & M: RI': { color: '#9C27B0', icon: '📡' },
'External O & M: AIRTEL RI': { color: '#FF5722', icon: '📡' },
'External O & M: RJIL RI': { color: '#FF1744', icon: '📡' },
'External O & M: VITIL RI': { color: '#2196F3', icon: '📡' },

// Survey Points
'External O & M: SURVEYSTART': { color: '#10B981', icon: '🎯' },
'External O & M: ENDSURVEY': { color: '#E7180B', icon: '🎯' },
'External O & M: HOLDSURVEY': { color: '#a93226', icon: '⏸️' },
'External O & M: SURVEY_ROUTE': { color: '#FFFF99', icon: '➡️' },
'External O & M: PHOTO_SURVEY': { color: '#DCB14E', icon: '📸' },
'External O & M: VIDEO_SURVEY': { color: '#7C3AED', icon: '🎬' },

// Cable Infrastructure (distinctive colors for O & M)
'External O & M: Incremental Cable': { color: '#00FF00', icon: '⚡' }, // Bright Green
'External O & M: Proposed Cable': { color: '#FF0000', icon: '➖' }, // Bright Red
'External O & M: Survey: Block to FPOI Cable': { color: '#FF6B35', icon: '🔗' }, // Orange-red

// Infrastructure Assets
'External O & M: School': { color: '#4F46E5', icon: '🏫' },
'External O & M: Bank': { color: '#059669', icon: '🏦' },
'External O & M: ATM': { color: '#10B981', icon: '🏧' },
'External O & M: Masjid': { color: '#7C3AED', icon: '🕌' },
'External O & M: Temple': { color: '#F59E0B', icon: '🛕' },
'External O & M: Restaurant': { color: '#EF4444', icon: '🍽️' },
'External O & M: Hotel': { color: '#8B5CF6', icon: '🏨' },
'External O & M: Pharmacy': { color: '#06B6D4', icon: '💊' },
'External O & M: Petrol Pump': { color: '#F97316', icon: '⛽' },
'External O & M: Bus Stop': { color: '#84CC16', icon: '🚌' },
'External O & M: Railway Station': { color: '#6366F1', icon: '🚂' },
'External O & M: Post Office': { color: '#DC2626', icon: '📫' },
'External O & M: Fire Station': { color: '#B91C1C', icon: '🚒' },
'External O & M: Hospital': { color: '#EC4899', icon: '🏥' },
'External O & M: Govt. Office': { color: '#374151', icon: '🏛️' },
'External O & M: KM Stone': { color: '#35530E', icon: '📍' },
'External O & M: Landmark': { color: '#FF6B6B', icon: '🏛️' },
'External O & M: ASSET': { color: '#FF6B35', icon: '🔧' },

};

export const CATEGORY_DISPLAY_LABELS: Record<string, string> = {
  'BSNL': 'O & M',
  'BSNL_Cables': 'O & M',
};

export function getCategoryDisplayLabel(category: string): string {
  return CATEGORY_DISPLAY_LABELS[category] || category;
}

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
// Enhanced polyline type normalization
function normalizePolylineType(type: string): string {
  if (!type || type === 'NULL' || type === 'Unknown Line Type') {
    return 'Incremental Cable';
  }
  
  const upperType = type.toUpperCase();
  
  // Handle specific survey infrastructure types - ADD THIS
  if (upperType.includes('BLOCK TO FPOI') || 
      upperType.includes('BLOCK_TO_FPOI') ||
      upperType.includes('BLOCKTOFPOI')) {
    return 'Survey: Block to FPOI Cable';
  }
  
  if (upperType.includes('PROPOSED')) return 'Proposed Cable';
  if (upperType.includes('INCREMENTAL')) return 'Incremental Cable';
  if (upperType.includes('RAILWAY CROSS')) return 'Railway Cross';
  if (upperType.includes('ROAD CROSS')) return 'Road Cross';
  if (upperType.includes('BRIDGE')) return 'Bridge';
  if (upperType.includes('CULVERT')) return 'Culvert';
  
  // Handle OFC variations
  if (upperType.includes('OFC')) {
    return upperType.includes('PROPOSED') ? 'Proposed Cable' : 'Incremental Cable';
  }
  
  // Handle standard cable types
  if (upperType.includes('CABLE')) return 'Incremental Cable';
  
  return type;
}

// NEW: Detect if a Survey category file contains actual survey events or infrastructure assets
export function detectSurveyFileType(apiData: ApiPlacemark): 'physical_survey' | 'infrastructure_assets' {
  // Check for physical survey event types in points
  const surveyEventTypes = ['SURVEYSTART', 'ENDSURVEY', 'LIVELOCATION', 'VIDEORECORD', 'LANDMARK', 'ROUTEINDICATOR', 'ROUTEFEASIBILITY'];
  
  const hasPhysicalSurveyEvents = (apiData.points || []).some(point => 
    surveyEventTypes.includes(point.type) || 
    (point.properties?.event_type && surveyEventTypes.includes(point.properties.event_type))
  );

  // Check for infrastructure asset types
  const infrastructureTypes = ['School', 'Bank', 'Landmark', 'Masjid', 'Temple', 'Restaurant', 'Hotel', 'Pharmacy', 'Bus Stop', 'Petrol Pump', 'Post Office', 'Fire Station', 'Hospital', 'Govt. Office', 'ATM', 'KM Stone', 'Railway Station', 'Bridge', 'RJIL RI', 'VITIL RI', 'RI', 'AIRTEL RI', 'ASSET'];
  
  const hasInfrastructureAssets = (apiData.points || []).some(point => 
    infrastructureTypes.includes(point.type) || 
    (point.properties?.type && infrastructureTypes.includes(point.properties.type))
  );

  // Check polylines for cable infrastructure
  const hasCableInfrastructure = (apiData.polylines || []).some(polyline => 
    polyline.type && (
      polyline.type.includes('CABLE') ||
      polyline.type.includes('INCREMENTAL') ||
      polyline.type.includes('PROPOSED')
    )
  );

  // Decision logic: infrastructure assets take precedence if they dominate
  if (hasInfrastructureAssets && (hasCableInfrastructure || !hasPhysicalSurveyEvents)) {
    return 'infrastructure_assets';
  }
  
  return 'physical_survey';
}

// NEW: Process Survey infrastructure files containing asset data (not actual survey events)
export function processSurveyInfrastructureData(apiData: ApiPlacemark): {
  placemarks: ProcessedSurveyInfrastructure[];
  categories: PlacemarkCategory[];
} {
  const processedPlacemarks: ProcessedSurveyInfrastructure[] = [];
  const categoryCounts: Record<string, number> = {};


  // Process Points
  (apiData.points || []).forEach((point, index) => {
    try {
      const lat = point.coordinates.latitude;
      const lng = point.coordinates.longitude;
      
      if (!isValidCoordinate(lat, lng)) {
        console.warn(`Invalid coordinates for survey infrastructure point ${index}:`, { lat, lng });
        return;
      }

      // Determine category from type or properties
      let category = point.type || 'ASSET';
      
      // Check if properties has more specific type info
      if (point.properties?.type && point.properties.type !== point.type) {
        category = point.properties.type;
      }
      
      // Ensure category exists in our mapping
      if (!PLACEMARK_CATEGORIES[category]) {
        console.warn(`Unknown survey infrastructure category: ${category}, defaulting to ASSET`);
        category = 'ASSET';
      }

      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      processedPlacemarks.push({
        id: `survey-infra-point-${index}`,
        name: point.properties?.name || point.name || `${category} ${index + 1}`,
        category,
        type: 'point',
        coordinates: { lat, lng },
        
        // Extract survey-specific metadata
        blockName: point.properties?.blk_name,
        districtName: point.properties?.dt_name,
        stateName: point.properties?.st_name,
        direction: point.properties?.direction,
        phase: point.properties?.phase,
        fiberPosition: point.properties?.fiber_pos,
        roadOffset: point.properties?.rd_offset,
        
        rawProperties: point.properties
      });

    } catch (error) {
      console.error(`Error processing survey infrastructure point ${index}:`, error);
    }
  });

  // Process Polylines
  (apiData.polylines || []).forEach((polyline, index) => {
    try {
      if (!polyline.coordinates || !Array.isArray(polyline.coordinates) || polyline.coordinates.length < 2) {
        console.warn(`Invalid polyline coordinates for survey infrastructure polyline ${index}`);
        return;
      }

      // Convert coordinates from [lng, lat, elevation] to {lat, lng}
      const validCoordinates = polyline.coordinates
        .filter(coord => Array.isArray(coord) && coord.length >= 2)
        .filter(coord => isValidCoordinate(coord[1], coord[0])) // lat, lng
        .map(coord => ({
          lat: coord[1], // latitude is second
          lng: coord[0], // longitude is first
        }));

      if (validCoordinates.length < 2) {
        console.warn(`Insufficient valid coordinates for survey infrastructure polyline ${index}`);
        return;
      }

      // Determine category with Survey: prefix to distinguish from regular infrastructure
      let category = normalizePolylineType(polyline.type);
      
      // Ensure category exists
      if (!PLACEMARK_CATEGORIES[category]) {
        console.warn(`Unknown survey infrastructure polyline category: ${category}`);
        category = 'Survey: Incremental Cable'; // Default fallback
      }

      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      // Extract properties
      const props = (polyline as any).properties || {};

      processedPlacemarks.push({
        id: `survey-infra-polyline-${index}`,
        name: polyline.name || props.name || `${category} ${index + 1}`,
        category,
        type: 'polyline',
        coordinates: validCoordinates,
        
        // Polyline-specific properties
        segmentLength: props.seg_length,
        startNode: props.start_node,
        endNode: props.end_node,
        numFibre: props.num_fibre,
        routeCode: props.route_code,
        assetType: props.asset_type,
        ring: props.RING,
        
        // Survey metadata
        blockName: props.blk_name,
        districtName: props.dt_name,
        stateName: props.st_name,
        direction: props.direction,
        phase: props.phase,
        
        rawProperties: props
      });

    } catch (error) {
      console.error(`Error processing survey infrastructure polyline ${index}:`, error);
    }
  });

  // Create categories array
  const categories: PlacemarkCategory[] = Object.entries(PLACEMARK_CATEGORIES)
    .map(([name, config]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name,
      count: categoryCounts[name] || 0,
      visible: categoryCounts[name] > 0, // Auto-show categories that have data
      color: config.color,
      icon: config.icon,
    }))
    .filter(category => category.count > 0);

  
  // Log category distribution
  const topCategories = categories
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(c => `${c.name}: ${c.count}`)
    .join(', ');
  return { placemarks: processedPlacemarks, categories };
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
  
  // Enhanced mappings for API data types
  const mappings: Record<string, string> = {
    // Infrastructure types
    'ROAD CROSS': 'Road Cross',
    'N HIGHWAY CROSS': 'N Highway Cross',
    'RAILWAY CROSS': 'Railway Cross',
    'BRIDGE': 'Bridge',
    'CULVERT': 'Culvert',
    
    // Network equipment
    'BLOCK ROUTER': 'Block Router',
    'BLOCK OFFICE': 'BHQ',
    'GP': 'GP',
    'FPOI': 'FPOI',
    'BHQ': 'BHQ',
    'BR': 'BR',
    
    // Junction types - ADD THESE
    'SJC': 'SJC',
    'BJC': 'BJC',
    'LC': 'LC',
    
    // Cable types with OFC variations
    'INCREMENTAL CABLE': 'Incremental Cable',
    'PROPOSED CABLE': 'Proposed Cable',
    'INCREMENTAL OFC': 'Incremental Cable',
    'PROPOSED OFC': 'Proposed Cable',
    'UNKNOWN LINE TYPE': 'Incremental Cable',
    'OFC': 'Incremental Cable',
    'FIBER OPTIC CABLE': 'Incremental Cable',
    
    // Other types
    'LANDMARK': 'LANDMARK',
    'NULL': 'FPOI',
    'UNKNOWN': 'FPOI',
  };
  
  if (mappings[upperName]) return mappings[upperName];
  
  // Enhanced partial matches for variations
  if (upperName.includes('BRIDGE')) return 'Bridge';
  if (upperName.includes('CROSS') || upperName.includes('CROSSING')) {
    if (upperName.includes('ROAD')) return 'Road Cross';
    if (upperName.includes('HIGHWAY')) return 'N Highway Cross';
    if (upperName.includes('RAIL')) return 'Railway Cross';
    return 'Road Cross';
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
  placemarks: (ProcessedPhysicalSurvey | ProcessedGPData | ProcessedBlockData)[];
  categories: PlacemarkCategory[];
} {
  const processedPlacemarks: (ProcessedPhysicalSurvey | ProcessedGPData | ProcessedBlockData)[] = [];
  const categoryCounts: Record<string, number> = {};

  // Updated to include only GP_LOCATION and BSNL_BLOCK categories
  const physicalSurveyCategories = [
    'SURVEYSTART','LANDMARK', 'FIBERTURN', 'Bridge', 'Culvert', 'ROADCROSSING', 'Causeways',
    'KILOMETERSTONE', 'FPOI', 'JOINTCHAMBER', 'ROUTEINDICATOR', 'ENDSURVEY', 'HOLDSURVEY',
    'SURVEY_ROUTE', 'PHOTO_SURVEY', 'VIDEO_SURVEY', 'GP_LOCATION', 'BSNL_BLOCK'
  ];
  
  physicalSurveyCategories.forEach(c => categoryCounts[c] = 0);

  Object.entries(apiData.data).forEach(([blockId, points]) => {
    const liveLocationPoints: any[] = [];

    points.forEach((point, index) => {
      try {
        // NEW: Check if this "point" is actually GP data
        if (point.gp_data && Array.isArray(point.gp_data)) {          
          point.gp_data.forEach((gpItem: any, gpIndex: number) => {
            try {
              // Parse GP coordinates
              const gpCoordsParts = gpItem.gpCoordinates.split(',').map((c: string) => c.trim());
              const gpLat = parseFloat(gpCoordsParts[0]);
              const gpLng = parseFloat(gpCoordsParts[1]);

              // Parse Pole coordinates (for reference only)
              const poleCoordsParts = gpItem.poleCoordinates.split(',').map((c: string) => c.trim());
              const poleLat = parseFloat(poleCoordsParts[0]);
              const poleLng = parseFloat(poleCoordsParts[1]);

              // Parse Earth Pit coordinates (for reference only)
              const earthPitCoordsParts = gpItem.earthPitCoordinates.split(',').map((c: string) => c.trim());
              const earthPitLat = parseFloat(earthPitCoordsParts[0]);
              const earthPitLng = parseFloat(earthPitCoordsParts[1]);

              // Process photos array
              const images: SurveyImage[] = [];
              if (gpItem.photos && Array.isArray(gpItem.photos)) {
                gpItem.photos.forEach((photoPath: string) => {
                  // Skip null, empty strings, empty arrays
                  if (!photoPath || photoPath === 'null' || photoPath === '[]' || photoPath.trim() === '') {
                    return;
                  }

                  // Handle JSON array strings like "[\"uploads\/images\/file.jpg\"]"
                  if (photoPath.startsWith('[') && photoPath.endsWith(']')) {
                    try {
                      const parsed = JSON.parse(photoPath.replace(/\\/g, ''));
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        parsed.forEach((url: string) => {
                          const resolvedUrl = resolveMediaUrl(url);
                          if (isValidImageUrl(resolvedUrl)) {
                            images.push({
                              url: resolvedUrl,
                              type: 'general',
                              label: `GP Installation Photo ${images.length + 1}`
                            });
                          }
                        });
                      }
                    } catch (e) {
                      console.warn('Failed to parse photo array:', photoPath);
                    }
                  } else {
                    // Regular photo path
                    const resolvedUrl = resolveMediaUrl(photoPath);
                    if (isValidImageUrl(resolvedUrl)) {
                      images.push({
                        url: resolvedUrl,
                        type: 'general',
                        label: `GP Installation Photo ${images.length + 1}`
                      });
                    }
                  }
                });
              }

              // Create ONLY ONE marker at GP Location (includes all coordinate data for reference)
              if (isValidCoordinate(gpLat, gpLng)) {
                categoryCounts['GP_LOCATION'] = (categoryCounts['GP_LOCATION'] || 0) + 1;
                processedPlacemarks.push({
                  id: `gp-location-${blockId}-${gpIndex}`,
                  name: `GP Installation ${gpIndex + 1}`,
                  category: 'GP_LOCATION',
                  type: 'point',
                  coordinates: { lat: gpLat, lng: gpLng }, // Only GP coordinates for marker position
                  surveyId: `gp-${blockId}-${gpIndex}`,
                  eventType: 'GP_LOCATION',
                  blockId: blockId,
                  // Store all three coordinates for InfoWindow display
                  gpCoordinates: { lat: gpLat, lng: gpLng },
                  poleCoordinates: { lat: poleLat, lng: poleLng },
                  earthPitCoordinates: { lat: earthPitLat, lng: earthPitLng },
                  images: images,
                  hasImages: images.length > 0,
                  itemType: 'gp'
                });
              }

            } catch (error) {
              console.error(`Error processing GP data item ${gpIndex} in block ${blockId}:`, error);
            }
          });
          
          // Don't process this as a regular point, skip to next
          return;
        }

        // NEW: Check if this "point" is actually Block data
        if (point.blk_data) {
          
          try {
            const blockData = point.blk_data;
            
            // Parse BSNL coordinates
            const bsnlCoordsParts = blockData.bsnlCordinates.split(',').map((c: string) => c.trim());
            const bsnlLat = parseFloat(bsnlCoordsParts[0]);
            const bsnlLng = parseFloat(bsnlCoordsParts[1]);

            if (isValidCoordinate(bsnlLat, bsnlLng)) {
              // Process block photos
              const blockImages: SurveyImage[] = [];
              
              const photoFields = [
                { field: 'bsnlCableEntryPhoto', label: 'BSNL Cable Entry Photo' },
                { field: 'bsnlCableExitPhoto', label: 'BSNL Cable Exit Photo' },
                { field: 'bsnlExistingRackPhoto', label: 'BSNL Existing Rack Photo' },
                { field: 'bsnlLayoutPhoto', label: 'BSNL Layout Photo' },
                { field: 'bsnlProposedRackPhoto', label: 'BSNL Proposed Rack Photo' },
                { field: 'bsnlUPSPhoto', label: 'BSNL UPS Photo' }
              ];

              photoFields.forEach(({ field, label }) => {
                const photoPath = (blockData as any)[field];
                if (photoPath && photoPath !== 'null' && photoPath.trim() !== '') {
                  const resolvedUrl = resolveMediaUrl(photoPath);
                  if (isValidImageUrl(resolvedUrl)) {
                    blockImages.push({
                      url: resolvedUrl,
                      type: 'general',
                      label: label
                    });
                  }
                }
              });

              categoryCounts['BSNL_BLOCK'] = (categoryCounts['BSNL_BLOCK'] || 0) + 1;
              processedPlacemarks.push({
                id: `bsnl-block-${blockData.block_id}`,
                name: `BSNL Block Office - ${blockData.block_id}`,
                category: 'BSNL_BLOCK',
                type: 'point',
                coordinates: { lat: bsnlLat, lng: bsnlLng },
                surveyId: `block-${blockData.block_id}`,
                eventType: 'BSNL_BLOCK',
                blockId: blockData.block_id.toString(),
                images: blockImages,
                hasImages: blockImages.length > 0
              });
            }
          } catch (error) {
            console.error(`Error processing block data in block ${blockId}:`, error);
          }
          
          // Don't process this as a regular point, skip to next
          return;
        }

        // Regular survey point processing (not gp_data or blk_data)
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
      visible: name === 'SURVEY_ROUTE',
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
    'Desktop: SJC',
    'Desktop: BJC',
    'Desktop: LC',
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

        const assetType = pointProperties.type || point.type || pointProperties.asset_type || 'FPOI';
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
      // ADD JUNCTION TYPES
      'SJC': 'Desktop: SJC',
      'BJC': 'Desktop: BJC',
      'LC': 'Desktop: LC',
    };

    if (pointMappings[upperAssetType]) return pointMappings[upperAssetType];

    // Default for points
    return 'Desktop: FPOI';
  }

  // Polyline categories based on connection type are handled in the main processing function
  return 'Desktop: Proposed Cable';
}

// -----------------------------
// Rectification Survey Processing (NEW)
// -----------------------------
export function processRectificationData(apiData: RectificationApiResponse | null): {
  placemarks: ProcessedRectification[];
  categories: PlacemarkCategory[];
} {
  if (!apiData || !apiData.data) {
    return { placemarks: [], categories: [] };
  }

  const processedPlacemarks: ProcessedRectification[] = [];
  const categoryCounts: Record<string, number> = {};

  // Initialize rectification category counts
  const rectificationCategories = [
    'Rectification: Chamber Installation',
    'Rectification: Closer Replacement',
    'Rectification: Route Under Road',
    'Rectification: Patch Replacement',
    'Rectification: Cable Repair',
    'Rectification: Joint Repair',
    'Rectification: Other',
  ];

  rectificationCategories.forEach(category => {
    categoryCounts[category] = 0;
  });

  // Process each block's rectification items
  Object.entries(apiData.data).forEach(([blockId, items]) => {
    if (!Array.isArray(items)) return;

    items.forEach(item => {
      try {
        // Parse coordinates
        const startLat = parseFloat(item.start_lat);
        const startLng = parseFloat(item.start_long);

        if (!isValidCoordinate(startLat, startLng)) {
          console.warn(`Invalid start coordinates for rectification item ${item.id}:`, { startLat, startLng });
          return;
        }

        // Determine if this is a polyline or point
        const hasEndCoordinates = item.end_lat && item.end_long;
        const isPolyline = hasEndCoordinates && item.length;

        let coordinates: { lat: number; lng: number } | { lat: number; lng: number }[];

        if (isPolyline) {
          const endLat = parseFloat(item.end_lat!);
          const endLng = parseFloat(item.end_long!);

          if (!isValidCoordinate(endLat, endLng)) {
            console.warn(`Invalid end coordinates for rectification item ${item.id}:`, { endLat, endLng });
            return;
          }

          coordinates = [
            { lat: startLat, lng: startLng },
            { lat: endLat, lng: endLng }
          ];
        } else {
          coordinates = { lat: startLat, lng: startLng };
        }

        // Parse images from JSON string array
        let imageUrls: string[] = [];
        try {
          if (!item.image || item.image === 'null' || item.image === '[]') {
            imageUrls = [];
          } else {
            // The API returns images in format: "[path1, path2]" or "[path1]"
            // This is NOT valid JSON (missing quotes), so we need to parse it manually
            const imageString = item.image.trim();
            
            // Remove outer brackets
            const withoutBrackets = imageString.replace(/^\[|\]$/g, '').trim();
            
            if (withoutBrackets) {
              // Split by comma and clean each path
              imageUrls = withoutBrackets
                .split(',')
                .map(path => path.trim())
                .filter(path => path && path !== 'null');
                        }
          }
        } catch (error) {
          console.warn(`Failed to parse images for rectification item ${item.id}:`, error);
          imageUrls = [];
        }

        // Map images to SurveyImage format
        const images: SurveyImage[] = imageUrls.map((url, index) => ({
          url: resolveMediaUrl(url),
          type: 'general',
          label: `Rectification Photo ${index + 1}`
        }));

        // Determine category based on work_to_be_done
        const category = getRectificationCategory(item.work_to_be_done);
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        // Create processed rectification placemark
        processedPlacemarks.push({
          id: `rectification-${blockId}-${item.id}`,
          name: `${item.work_to_be_done} - ${item.gp}`,
          category,
          type: isPolyline ? 'polyline' : 'point',
          coordinates,
          surveyId: `Block-${blockId}`,
          eventType: item.work_to_be_done,
          blockId: item.block_id,
          blockName: item.blk_name,
          gpName: item.gp,
          lgdCode: item.lgd_code,
          accuracy: item.accuracy,
          length: item.length,
          workToBeDone: item.work_to_be_done,
          images,
          hasImages: images.length > 0,
          createdTime: item.created_at,
        });
      } catch (error) {
        console.error('Error processing rectification item:', item, error);
      }
    });
  });

  // Create categories array
  const categories: PlacemarkCategory[] = rectificationCategories
  .map(name => ({
    id: `rectification-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    count: categoryCounts[name] || 0,
    visible: name === 'SURVEY_ROUTE',  // Only SURVEY_ROUTE visible by default
    color: PLACEMARK_CATEGORIES[name]?.color || '#9333EA',
    icon: PLACEMARK_CATEGORIES[name]?.icon || '🔧'
  }))
  .filter(c => c.count > 0);

  return { placemarks: processedPlacemarks, categories };
}

// Helper function to map work_to_be_done to category
function getRectificationCategory(workType: string): string {
  if (!workType) return 'Rectification: Other';

  const normalizedWork = workType.toUpperCase().trim();

  // Chamber Installation patterns
  if (normalizedWork.includes('CHAMBER INSTALLATION') || 
      normalizedWork.includes('CHAMBER') && normalizedWork.includes('INSTALL')) {
    return 'Rectification: Chamber Installation';
  }

  // Closer Replacement patterns
  if (normalizedWork.includes('CLOSER REPLACEMENT') || 
      normalizedWork.includes('CLOSURE REPLACEMENT')) {
    return 'Rectification: Closer Replacement';
  }

  // Route Under Road patterns
  if (normalizedWork.includes('ROUTE UNDER ROAD') || 
      normalizedWork.includes('UNDER ROAD') ||
      normalizedWork.includes('ROAD CROSSING')) {
    return 'Rectification: Route Under Road';
  }

  // Patch Replacement patterns
  if (normalizedWork.includes('PATCH REPLACEMENT') || 
      normalizedWork.includes('PATCH') && normalizedWork.includes('REPLACE')) {
    return 'Rectification: Patch Replacement';
  }

  // Cable Repair patterns
  if (normalizedWork.includes('CABLE REPAIR') || 
      normalizedWork.includes('CABLE') && normalizedWork.includes('FIX')) {
    return 'Rectification: Cable Repair';
  }

  // Joint Repair patterns
  if (normalizedWork.includes('JOINT REPAIR') || 
      normalizedWork.includes('JOINT') && normalizedWork.includes('FIX')) {
    return 'Rectification: Joint Repair';
  }

  // Default
  return 'Rectification: Other';
}

// Process Rectification data that uses Physical Survey structure
// Process Rectification data that uses Physical Survey structure
export function processRectificationSurveyData(apiData: PhysicalSurveyApiResponse | null): {
  placemarks: (ProcessedPhysicalSurvey | ProcessedGPData | ProcessedBlockData)[];
  categories: PlacemarkCategory[];
} {
  if (!apiData || !apiData.data) {
    return { placemarks: [], categories: [] };
  }

  const processedPlacemarks: (ProcessedPhysicalSurvey | ProcessedGPData | ProcessedBlockData)[] = [];
  const categoryCounts: Record<string, number> = {};

  // Include event types for rectification (excluding VIDEORECORD and LIVELOCATION markers)
  const rectificationCategories = [
    'SURVEYSTART', 'ENDSURVEY', 'HOLDSURVEY',
    'LANDMARK', 'FIBERTURN', 'Bridge', 'Culvert', 'ROADCROSSING', 'Causeways',
    'KILOMETERSTONE', 'FPOI', 'JOINTCHAMBER', 'ROUTEINDICATOR',
    'ROUTEFEASIBILITY', 'ROUTEDETAILS', 'AREA', 'SIDE', 'DEPTH',
    'PHOTO_SURVEY', 'VIDEO_SURVEY', 'Rectification: SURVEY_ROUTE',
    'GP_LOCATION', 'BSNL_BLOCK', 'BLOWING', 'MANHOLES', 'STARTPIT', 'ENDPIT'
  ];
  
  rectificationCategories.forEach(c => categoryCounts[c] = 0);

  Object.entries(apiData.data).forEach(([blockId, points]) => {
    const liveLocationPoints: any[] = [];

    if (!Array.isArray(points)) return;

    points.forEach((point: any, index: number) => {
      try {
        // Handle GP data if present
        if (point.gp_data && Array.isArray(point.gp_data)) {
          point.gp_data.forEach((gpItem: any, gpIndex: number) => {
            try {
              // Parse GP coordinates
              const gpCoordsParts = gpItem.gpCoordinates.split(',').map((c: string) => c.trim());
              const gpLat = parseFloat(gpCoordsParts[0]);
              const gpLng = parseFloat(gpCoordsParts[1]);

              // Parse Pole coordinates
              const poleCoordsParts = gpItem.poleCoordinates.split(',').map((c: string) => c.trim());
              const poleLat = parseFloat(poleCoordsParts[0]);
              const poleLng = parseFloat(poleCoordsParts[1]);

              // Parse Earth Pit coordinates
              const earthPitCoordsParts = gpItem.earthPitCoordinates.split(',').map((c: string) => c.trim());
              const earthPitLat = parseFloat(earthPitCoordsParts[0]);
              const earthPitLng = parseFloat(earthPitCoordsParts[1]);

              // Process photos array
              const images: SurveyImage[] = [];
              if (gpItem.photos && Array.isArray(gpItem.photos)) {
                gpItem.photos.forEach((photoPath: string) => {
                  if (!photoPath || photoPath === 'null' || photoPath === '[]' || photoPath.trim() === '') {
                    return;
                  }

                  if (photoPath.startsWith('[') && photoPath.endsWith(']')) {
                    try {
                      const parsedArray = JSON.parse(photoPath);
                      if (Array.isArray(parsedArray)) {
                        parsedArray.forEach((innerPath: string, innerIdx: number) => {
                          const resolvedUrl = resolveMediaUrl(innerPath);
                          if (resolvedUrl) {
                            images.push({
                              url: resolvedUrl,
                              type: 'general',
                              label: `GP Installation Photo ${images.length + 1}`
                            });
                          }
                        });
                      }
                    } catch (e) {
                      const resolvedUrl = resolveMediaUrl(photoPath);
                      if (resolvedUrl) {
                        images.push({
                          url: resolvedUrl,
                          type: 'general',
                          label: `GP Installation Photo ${images.length + 1}`
                        });
                      }
                    }
                  } else {
                    const resolvedUrl = resolveMediaUrl(photoPath);
                    if (resolvedUrl) {
                      images.push({
                        url: resolvedUrl,
                        type: 'general',
                        label: `GP Installation Photo ${images.length + 1}`
                      });
                    }
                  }
                });
              }

              if (isValidCoordinate(gpLat, gpLng)) {
                categoryCounts['GP_LOCATION'] = (categoryCounts['GP_LOCATION'] || 0) + 1;
                
                processedPlacemarks.push({
                  id: `gp-location-${blockId}-${gpIndex}`,
                  name: `GP Installation - ${gpItem.gpName || blockId}`,
                  category: 'GP_LOCATION',
                  type: 'point',
                  coordinates: { lat: gpLat, lng: gpLng },
                  surveyId: `gp-${blockId}-${gpIndex}`,
                  eventType: 'GP_LOCATION',
                  blockId,
                  gpCoordinates: { lat: gpLat, lng: gpLng },
                  poleCoordinates: { lat: poleLat, lng: poleLng },
                  earthPitCoordinates: { lat: earthPitLat, lng: earthPitLng },
                  images,
                  hasImages: images.length > 0,
                  itemType: 'gp'
                } as ProcessedGPData);
              }
            } catch (error) {
              console.error(`Error processing GP data in block ${blockId}:`, error);
            }
          });
          return;
        }

        // Handle Block data if present
        if (point.blk_data && Array.isArray(point.blk_data)) {
          point.blk_data.forEach((blockData: any) => {
            try {
              const bsnlLat = parseFloat(blockData.latitude);
              const bsnlLng = parseFloat(blockData.longitude);

              if (isValidCoordinate(bsnlLat, bsnlLng)) {
                const blockImages: SurveyImage[] = [];
                
                const photoFields = [
                  { field: 'block_photo', label: 'Block Office Photo' },
                  { field: 'earthpit_photo', label: 'Earth Pit Photo' },
                  { field: 'pole_photo', label: 'Pole Photo' },
                  { field: 'additional_photo', label: 'Additional Photo' }
                ];

                photoFields.forEach(({ field, label }) => {
                  const photoPath = (blockData as any)[field];
                  if (photoPath && photoPath !== 'null' && photoPath.trim() !== '') {
                    const resolvedUrl = resolveMediaUrl(photoPath);
                    if (resolvedUrl) {
                      blockImages.push({
                        url: resolvedUrl,
                        type: 'general',
                        label: label
                      });
                    }
                  }
                });

                categoryCounts['BSNL_BLOCK'] = (categoryCounts['BSNL_BLOCK'] || 0) + 1;
                processedPlacemarks.push({
                  id: `bsnl-block-${blockData.block_id}`,
                  name: `BSNL Block Office - ${blockData.block_id}`,
                  category: 'BSNL_BLOCK',
                  type: 'point',
                  coordinates: { lat: bsnlLat, lng: bsnlLng },
                  surveyId: `block-${blockData.block_id}`,
                  eventType: 'BSNL_BLOCK',
                  blockId: blockData.block_id.toString(),
                  images: blockImages,
                  hasImages: blockImages.length > 0
                } as ProcessedBlockData);
              }
            } catch (error) {
              console.error(`Error processing block data in block ${blockId}:`, error);
            }
          });
          return;
        }

        // Regular survey point processing
        const lat = parseFloat(point.latitude);
        const lng = parseFloat(point.longitude);
        
        if (!isValidCoordinate(lat, lng)) {
          return;
        }

        const eventType = point.event_type || 'UNKNOWN';
        
        // Collect LIVELOCATION for route creation only (no markers)
        if (eventType === 'LIVELOCATION') {
          const timestamp = parseTimestamp(point.createdTime) || parseTimestamp(point.created_at);
          if (isFinite(timestamp)) {
            liveLocationPoints.push({
              lat,
              lng,
              timestamp,
              surveyId: point.survey_id
            });
          }
          return; // Don't create marker for LIVELOCATION
        }

        // Skip VIDEORECORD markers (but still count for VIDEO_SURVEY)
        if (eventType === 'VIDEORECORD') {
          if (point.videoDetails) {
            try {
              const vd = JSON.parse(point.videoDetails);
              if (vd && vd.videoUrl && vd.videoUrl.trim() !== '') {
                categoryCounts['VIDEO_SURVEY'] = (categoryCounts['VIDEO_SURVEY'] || 0) + 1;
              }
            } catch (error) {
              // Ignore parse errors
            }
          }
          return; // Don't create marker for VIDEORECORD
        }

        // Create marker for other event types
        categoryCounts[eventType] = (categoryCounts[eventType] || 0) + 1;

        // Extract images
        const images = extractSurveyImages(point);
        
        processedPlacemarks.push({
          id: `rectification-${blockId}-${point.survey_id}-${index}`,
          name: `${eventType} - Survey ${point.survey_id}`,
          category: eventType,
          type: 'point',
          coordinates: { lat, lng },
          surveyId: point.survey_id,
          eventType: eventType,
          blockId,
          images, 
          hasImages: images.length > 0,
          startLgdName: point.start_lgd_name,
          endLgdName: point.end_lgd_name,
          stateName: point.state_name,
          districtName: point.district_name,
          blockName: point.block_name,
          createdTime: point.createdTime || point.created_at,
        });

        // Count PHOTO_SURVEY for points with images
        if (images.length > 0 && point.surveyUploaded && point.surveyUploaded !== 'false') {
          categoryCounts['PHOTO_SURVEY'] = (categoryCounts['PHOTO_SURVEY'] || 0) + 1;
        }

      } catch (error) {
        console.error(`Error processing rectification point ${blockId}-${index}:`, error);
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
          const firstPoint = points.find((p: any) => p.survey_id === surveyId);

          categoryCounts['Rectification: SURVEY_ROUTE'] = (categoryCounts['Rectification: SURVEY_ROUTE'] || 0) + 1;
          processedPlacemarks.push({
            id: `rectification-route-${blockId}-${surveyId}`,
            name: `Survey Route - ${surveyId}`,
            category: 'Rectification: SURVEY_ROUTE',
            type: 'polyline',
            coordinates: routePoints.map(p => ({ lat: p.lat, lng: p.lng })),
            surveyId,
            eventType: 'SURVEY_ROUTE',
            blockId,
            images: [], 
            hasImages: false,
            startLgdName: firstPoint?.start_lgd_name,
            endLgdName: firstPoint?.end_lgd_name,
            stateName: firstPoint?.state_name,
            districtName: firstPoint?.district_name,
            blockName: firstPoint?.block_name,
            createdTime: firstPoint?.createdTime
          });
        }
      });
    }
  });

  // Create categories with rectification- prefix
  const categories: PlacemarkCategory[] = rectificationCategories
    .map(name => ({
      id: `rectification-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      count: categoryCounts[name] || 0,
      visible: ['Rectification: SURVEY_ROUTE'].includes(name),
      color: PLACEMARK_CATEGORIES[name]?.color || '#9333EA',
      icon: PLACEMARK_CATEGORIES[name]?.icon || '🔧'
    }))
    .filter(c => c.count > 0);

  return { placemarks: processedPlacemarks, categories };
}

export function processJointsData(apiData: JointsApiResponse | null): {
  placemarks: (ProcessedJoints)[];
  categories: PlacemarkCategory[];
} {
  if (!apiData || !apiData.data) {
    return { placemarks: [], categories: [] };
  }

  const processedPlacemarks: (ProcessedJoints)[] = [];
  const categoryCounts: Record<string, number> = {};

  const JointCategories = [
  'Joint: SJC',
  ];

  JointCategories.forEach(c => categoryCounts[c] = 0);
  (apiData.data || []).forEach(joint => {
    try {
        const longitude = Number(joint.gps_long);
        const latitude = Number(joint.gps_lat);
        if (!isValidCoordinate(latitude, longitude)) {
          console.warn(`Invalid coordinate values for Joint point ${joint.joint_name}:`, { latitude, longitude });
          return;
        }
        const category = joint.joint_type === 'SJC' ? 'Joint: SJC' : joint.joint_type;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        processedPlacemarks.push({
          id: `Joint-point-${joint.joint_code}`,
          name: joint.joint_name ,
          category,
          type: 'point',
          coordinates: { lat: latitude, lng: longitude },
          joint_type: joint.joint_type,
          work_type: joint.work_type,
          address:joint.address,
          state_name:joint.state_name,
          district_name:joint.district_name,
          block_name:joint.block_name,
          photo_path:joint.photo_path,
          cables:joint.cables,
          tube_mapping:joint.tube_mapping,
          fiber_splicing:joint.fiber_splicing

        });
    } catch (error) {
        console.error('Error processing joints:', joint, error);

    }
    })
    const categories: PlacemarkCategory[] = JointCategories
    .map(name => ({
      id:"Joint-",
      name,
      count: categoryCounts[name] || 0,
      visible: true,
      color: PLACEMARK_CATEGORIES[name]?.color || '#6B7280',
      icon: PLACEMARK_CATEGORIES[name]?.icon || '📍',
    }))
    .filter(category => category.count > 0);
    return { placemarks: processedPlacemarks, categories };


}