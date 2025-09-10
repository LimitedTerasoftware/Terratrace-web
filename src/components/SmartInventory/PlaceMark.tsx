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
}

export interface SurveyImage {
  url: string;
  type: 'start_photo' | 'end_photo' | 'fpoi' | 'route_indicator' | 'kmt_stone' | 'fiber_turn' | 'landmark' | 'joint_chamber' | 'road_crossing_start' | 'road_crossing_end' | 'video_thumbnail' | 'bridge' | 'culvert' | 'general';
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
  AREA: { color: '#FFC107', icon: '📍' },
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

// Helper function to extract all images from a survey point
function extractSurveyImages(point: any): SurveyImage[] {
  const images: SurveyImage[] = [];
 
  if (!point.surveyUploaded || point.surveyUploaded === '' || point.surveyUploaded === 'false') {
    return images;
  }
 
  try {
    // FPOI
    if (point.fpoiUrl && point.event_type === "FPOI") {
      images.push({
        url: resolveMediaUrl(point.fpoiUrl),
        type: "fpoi",
        label: "FPOI Photo",
        coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
      });
    }
 
    // Kilometer Stone
    if (point.kmtStoneUrl && point.event_type === "KILOMETERSTONE") {
      images.push({
        url: resolveMediaUrl(point.kmtStoneUrl),
        type: "kilometerstone",
        label: "KM Stone Photo",
        coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
      });
    }
 
    // Landmark
    if (point.landMarkUrls && point.event_type === "LANDMARK" && point.landMarkType !== "NONE") {
      try {
        const parsed = typeof point.landMarkUrls === "string"
          ? JSON.parse(point.landMarkUrls)
          : point.landMarkUrls;
 
        if (Array.isArray(parsed)) {
          parsed.forEach((url: string, index: number) => {
            images.push({
              url: resolveMediaUrl(url),
              type: "landmark",
              label: `Landmark ${index + 1}`,
              coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
            });
          });
        } else if (typeof parsed === "string") {
          images.push({
            url: resolveMediaUrl(parsed),
            type: "landmark",
            label: "Landmark",
            coordinates: point.latitude && point.longitude
              ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
              : undefined
          });
        }
      } catch (error) {
        console.warn("Error parsing landMarkUrls:", error);
      }
    }
 
    // Fiber Turn
    if (point.fiberTurnUrl && point.event_type === "FIBERTURN") {
      images.push({
        url: resolveMediaUrl(point.fiberTurnUrl),
        type: "fiberturn",
        label: "Fiber Turn Photo",
        coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
      });
    }
 
    // Survey Start
    if (point.start_photos && Array.isArray(point.start_photos) && point.start_photos.length > 0 && point.event_type === "SURVEYSTART") {
      point.start_photos.forEach((url: string, index: number) => {
        images.push({
          url: resolveMediaUrl(url),
          type: "start_photo",
          label: `Survey Start Photo ${index + 1}`,
          coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
        });
      });
    }
 
    // Survey End
    if (point.end_photos && Array.isArray(point.end_photos) && point.end_photos.length > 0 && point.event_type === "ENDSURVEY") {
      point.end_photos.forEach((url: string, index: number) => {
        images.push({
          url: resolveMediaUrl(url),
          type: "end_photo",
          label: `Survey End Photo ${index + 1}`,
          coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
        });
      });
    }
 
    // Joint Chamber
    if (point.jointChamberUrl && point.event_type === "JOINTCHAMBER") {
      images.push({
        url: resolveMediaUrl(point.jointChamberUrl),
        type: "jointchamber",
        label: "Joint Chamber Photo",
        coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
      });
    }
 
    // Road Crossing
    if (point.event_type === "ROADCROSSING" && point.road_crossing) {
      const rc = typeof point.road_crossing === "string" ? JSON.parse(point.road_crossing) : point.road_crossing;
 
      if (rc.startPhoto && rc.startPhoto.trim() && rc.startPhoto !== "null") {
        images.push({
          url: resolveMediaUrl(rc.startPhoto),
          type: "road_crossing_start",
          label: "Road Crossing Start Photo",
          coordinates: rc.startPhotoLat && rc.startPhotoLong
            ? { lat: parseFloat(rc.startPhotoLat), lng: parseFloat(rc.startPhotoLong) }
            : undefined
        });
      }
 
      if (rc.endPhoto && rc.endPhoto.trim() && rc.endPhoto !== "null") {
        images.push({
          url: resolveMediaUrl(rc.endPhoto),
          type: "road_crossing_end",
          label: "Road Crossing End Photo",
          coordinates: rc.endPhotoLat && rc.endPhotoLong
            ? { lat: parseFloat(rc.endPhotoLat), lng: parseFloat(rc.endPhotoLong) }
            : undefined
        });
      }
    }
 
    // Route Indicator
    if (point.routeIndicatorUrl && point.event_type === "ROUTEINDICATOR") {
      try {
        const parsed = JSON.parse(point.routeIndicatorUrl);
        if (Array.isArray(parsed)) {
          parsed.forEach((url: string, index: number) => {
            images.push({
              url: resolveMediaUrl(url),
              type: "routeindicator",
              label: `Route Indicator Photo ${index + 1}`,
               coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
            });
          });
        } else if (typeof parsed === "string") {
          images.push({
            url: resolveMediaUrl(parsed),
            type: "routeindicator",
            label: "Route Indicator Photo",
             coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
          });
        }
      } catch (e) {
        images.push({
          url: resolveMediaUrl(point.routeIndicatorUrl),
          type: "routeindicator",
          label: "Route Indicator Photo",
           coordinates: point.latitude && point.longitude
                ? { lat: parseFloat(point.latitude), lng: parseFloat(point.longitude) }
                : undefined
        });
      }
    }
  } catch (error) {
    console.error("Error extracting survey images:", error);
  }
 
  return images.filter(img => img.url && img.url.trim() !== "");
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

// -----------------------------
// Enhanced API Data Processing
// -----------------------------
export function processApiData(apiData: ApiPlacemark): {
  placemarks: ProcessedPlacemark[];
  categories: PlacemarkCategory[];
} {
  const processedPlacemarks: ProcessedPlacemark[] = [];
  const categoryCounts: Record<string, number> = {};

  // Initialize category counts
  Object.keys(PLACEMARK_CATEGORIES).forEach(category => {
    categoryCounts[category] = 0;
  });

  // Process ALL points with validation
  (apiData.points || []).forEach((point: ApiPoint, index: number) => {
    try {
      // Validate coordinates
      const lat = point.coordinates.latitude;
      const lng = point.coordinates.longitude;
      
      if (!isValidCoordinate(lat, lng)) {
        console.warn(`Invalid coordinates for point ${index}:`, { lat, lng });
        return;
      }

      const category = getCategoryFromName(point.type || 'FPOI');
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      processedPlacemarks.push({
        id: `point-${index}`,
        name: point.name || `Point ${index + 1}`,
        category,
        type: 'point',
        coordinates: { lat, lng },
        styleUrl: (point as any).styleUrl,
        pointType: point.type,
      });
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

      const catName =
        polyline.type === 'Incremental Cable' || polyline.type === 'Proposed Cable'
          ? polyline.type
          : 'Incremental Cable';
      const category = getCategoryFromName(catName);
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

  // Specific mappings for your API data types
  const mappings: Record<string, string> = {
    'ROAD CROSS': 'Road Cross',
    'N HIGHWAY CROSS': 'N Highway Cross',
    'BLOCK ROUTER': 'Block Router',
    'BRIDGE': 'Bridge',
    'CULVERT': 'Culvert',
    'GP': 'GP',
    'FPOI': 'FPOI',
    'BHQ': 'BHQ',
    'BR': 'BR',
    'LANDMARK': 'LANDMARK',
    'RAILWAY CROSS': 'Railway Cross',
  };

  if (mappings[upperName]) return mappings[upperName];

  // Partial matches for variations
  if (upperName.includes('BRIDGE')) return 'Bridge';
  if (upperName.includes('CROSS') || upperName.includes('CROSSING')) return 'ROADCROSSING';
  if (upperName.includes('CULVERT')) return 'Culvert';
  if (upperName.includes('FIBER')) return 'FIBERTURN';
  if (upperName.includes('RAIL')) return 'Railway Cross';
  if (upperName.includes('KM') || upperName.includes('KILOMETER')) return 'KILOMETERSTONE';
  if (upperName.includes('ROUTER')) return 'Block Router';
  if (upperName.includes('HIGHWAY')) return 'N Highway Cross';

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
    'SURVEY_ROUTE', 'VIDEORECORD', 'PHOTO_SURVEY', 'VIDEO_SURVEY'
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
              hasImages: false
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

        // Determine category based on connection type
        const connectionType = connection.type || 'proposed';
        const category =
          connectionType === 'incremental' ? 'Desktop: Incremental Cable' : 'Desktop: Proposed Cable';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        processedPlacemarks.push({
          id: `desktop-connection-${network.id}-${connection.id}`,
          name: connection.original_name || `Desktop Connection ${connection.id}`,
          category,
          type: 'polyline',
          coordinates,
          length: connection.length,
          connectionType: connection.type as 'proposed' | 'incremental',
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
      visible: false,
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