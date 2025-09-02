import { ApiPlacemark, ApiPoint, ApiPolyline, ProcessedPlacemark, PlacemarkCategory, PhysicalSurveyApiResponse, ProcessedPhysicalSurvey } from '../../types/kmz';

// Enhanced placemark categories with ALL infrastructure types from your API
export const PLACEMARK_CATEGORIES: Record<string, { color: string; icon: string }> = {
  // Geographic Points
  'GP': { color: '#4ECDC4', icon: '🏠' },
  'FPOI': { color: '#F8C471', icon: '⭐' },
  'BHQ': { color: '#BF1E00', icon: '🏢' },
  'BR': { color: '#0030BF', icon: '🌐' },
  'LANDMARK': { color: '#FF6B6B', icon: '🏛️' },
  
  // Infrastructure - Crossings
  'ROADCROSSING': { color: '#31F527', icon: '🛣️' },
  'Road Cross': { color: '#FFD700', icon: '🛣️' },
  'N Highway Cross': { color: '#FF8C00', icon: '🛤️' },
  
  // Infrastructure - Water/Drainage  
  'Bridge': { color: '#45B7D1', icon: '🌉' },
  'Culvert': { color: '#96CEB4', icon: '🌊' },
  'Causeways': { color: '#F7DC6F', icon: '🛤️' },
  
  // Infrastructure - Rail
  'Level Cross': { color: '#DDA0DD', icon: '🚂' },
  'Rail Under Bridge': { color: '#98D8C8', icon: '🚇' },
  'Rail Over Bridge': { color: '#BB8FCE', icon: '🚄' },
  'Railway Cross': { color: '#8B5CF6', icon: '🚂' },
  
  // Network Infrastructure
  'Block Router': { color: '#000000', icon: '🔗' },
  'FIBERTURN': { color: '#372AAC', icon: '🔄' },
  'JOINTCHAMBER': { color: '#FE9A37', icon: '🔗' },
  'ROUTEINDICATOR': { color: '#42D3F2', icon: '🧭' },
  
  // Markers & Indicators
  'KILOMETERSTONE': { color: '#35530E', icon: '📍' },
  
  // Cable Types
  'Incremental Cable': { color: '#61f335', icon: '⚡⚡⚡⚡' },
  'Proposed Cable': { color: '#ff0000', icon: '➖➖➖➖' },
  
  // Survey Points
  'SURVEYSTART': { color: '#10B981', icon: '🎯'},
  'ENDSURVEY': { color: '#E7180B', icon: '🎯'},
  'HOLDSURVEY': { color: '#a93226', icon: '⏸️'},
  'DEPTH': { color: '#3B82F6', icon: '📏'},
  'MANHOLES': { color: '#06B6D4', icon: '🕳️'},
  'STARTPIT': { color: '#14B8A6', icon: '🕳️' },
  'ENDPIT': { color: '#DC2626', icon: '🔴'},
  'BLOWING': { color: '#663300', icon:'💨'},
  'ROUTEFEASIBILITY': { color: '#17A2B8', icon: '🛤️' },
  'AREA': { color: '#FFC107', icon: '📍' },
  'LIVELOCATION': { color: '#DC3545', icon: '📍' },
  'SIDE': { color: '#6F42C1', icon: '↔️' },
  'ROUTEDETAILS': { color: '#09090B', icon: '📋' },
  
  // Desktop Planning Categories
  'Desktop: GP': { color: '#2DD4BF', icon: '🟢' },
  'Desktop: FPOI': { color: '#FBBF24', icon: '🔷' },
  'Desktop: BHQ': { color: '#DC2626', icon: '🏛️' },
  'Desktop: Block Router': { color: '#1F2937', icon: '⚫' },
  'Desktop: Bridge': { color: '#3B82F6', icon: '🌉' },
  'Desktop: Culvert': { color: '#10B981', icon: '🌊' },
  'Desktop: Road Cross': { color: '#F59E0B', icon: '🛣️' },
  'Desktop: Railway Cross': { color: '#8B5CF6', icon: '🚂' },
  'Desktop: N Highway Cross': { color: '#EF4444', icon: '🛤️' },
  'Desktop: Incremental Cable': { color: '#22C55E', icon: '━━━━' },
  'Desktop: Proposed Cable': { color: '#EF4444', icon: '┅┅┅┅' },
  
  // Default
  'point': { color: '#FF0000', icon: '📍' },
};

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

  // Process ALL points - REMOVED THE RESTRICTIVE FILTER
  apiData.points.forEach((point, index) => {
    // Get category from point type - process ALL points now
    const category = getCategoryFromName(point.type || 'FPOI');
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    processedPlacemarks.push({
      id: `point-${index}`,
      name: point.name,
      category,
      type: 'point',
      coordinates: {
        lat: point.coordinates.latitude,
        lng: point.coordinates.longitude
      },
      styleUrl: point.styleUrl,
      pointType: point.type
    });
  });

  // Process polylines (this was already working correctly)
  apiData.polylines.forEach((polyline, index) => {
    const category = getCategoryFromName((polyline.type === 'Incremental Cable' || polyline.type ===  "Proposed Cable" ) ? polyline.type : "Incremental Cable");
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    processedPlacemarks.push({
      id: `polyline-${index}`,
      name: polyline.name,
      category,
      type: 'polyline',
      coordinates: polyline.coordinates.map(coord => ({
        lat: coord[1],
        lng: coord[0]
      })),
      distance: polyline.distance,
      styleUrl: polyline.styleUrl
    });
  });

  // Create categories array
  const categories: PlacemarkCategory[] = Object.entries(PLACEMARK_CATEGORIES).map(([name, config]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    count: categoryCounts[name] || 0,
    visible: true,
    color: config.color,
    icon: config.icon
  })).filter(category => category.count > 0);

  return { placemarks: processedPlacemarks, categories };
}

// Enhanced getCategoryFromName function to handle all infrastructure types
function getCategoryFromName(name: string): string {
  if (!name) return 'FPOI';
  
  const upperName = name.toUpperCase();
  
  // Direct exact matches first
  if (PLACEMARK_CATEGORIES[name]) return name;
  
  // Check for exact matches in uppercase
  for (const category of Object.keys(PLACEMARK_CATEGORIES)) {
    if (category.toUpperCase() === upperName) {
      return category;
    }
  }
  
  // Specific mappings for your API data types
  if (upperName === 'ROAD CROSS') return 'Road Cross';
  if (upperName === 'N HIGHWAY CROSS') return 'N Highway Cross';
  if (upperName === 'BLOCK ROUTER') return 'Block Router';
  if (upperName === 'BRIDGE') return 'Bridge';
  if (upperName === 'CULVERT') return 'Culvert';
  if (upperName === 'GP') return 'GP';
  if (upperName === 'FPOI') return 'FPOI';
  if (upperName === 'BHQ') return 'BHQ';
  if (upperName === 'BR') return 'BR';
  if (upperName === 'LANDMARK') return 'LANDMARK';
  if (upperName === 'RAILWAY CROSS') return 'Railway Cross';
  
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
  return 'FPOI';
}

export function processPhysicalSurveyData(apiData: PhysicalSurveyApiResponse): {
  placemarks: ProcessedPhysicalSurvey[];
  categories: PlacemarkCategory[];
} {
  const processedPlacemarks: ProcessedPhysicalSurvey[] = [];
  const categoryCounts: Record<string, number> = {};

  // Initialize category counts for physical survey categories
  const physicalSurveyCategories = [
    'SURVEYSTART', 'ROUTEFEASIBILITY', 'AREA', 'LIVELOCATION', 'SIDE', 'ROUTEDETAILS',
    'LANDMARK', 'FIBERTURN', 'Bridge', 'Culvert', 'ROADCROSSING', 'Causeways', 
    'KILOMETERSTONE', 'FPOI', 'JOINTCHAMBER', 'ROUTEINDICATOR', 'ENDSURVEY', 'HOLDSURVEY'
  ];
  
  physicalSurveyCategories.forEach(category => {
    categoryCounts[category] = 0;
  });

  // Process physical survey data
  Object.entries(apiData.data).forEach(([blockId, points]) => {
    points.forEach((point, index) => {
      // Skip LIVELOCATION events to reduce map load
      if (point.event_type === 'LIVELOCATION') {
        return;
      }
      
      const category = point.event_type;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;

      processedPlacemarks.push({
        id: `physical-${blockId}-${point.survey_id}-${index}`,
        name: `${point.event_type} - Survey ${point.survey_id}`,
        category,
        type: 'point',
        coordinates: {
          lat: parseFloat(point.latitude),
          lng: parseFloat(point.longitude)
        },
        surveyId: point.survey_id,
        eventType: point.event_type,
        blockId
      });
    });
  });

  // Create categories array for physical survey
  const categories: PlacemarkCategory[] = physicalSurveyCategories.map(name => ({
    id: `physical-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name: `${name}`,
    count: categoryCounts[name] || 0,
    visible: true,
    color: PLACEMARK_CATEGORIES[name]?.color || '#6B7280',
    icon: PLACEMARK_CATEGORIES[name]?.icon || '📍'
  })).filter(category => category.count > 0);

  return { placemarks: processedPlacemarks, categories };
}

// Desktop Planning Data Processing Function
export function processDesktopPlanningData(apiData: DesktopPlanningApiResponse): {
  placemarks: ProcessedDesktopPlanning[];
  categories: PlacemarkCategory[];
} {
  const processedPlacemarks: ProcessedDesktopPlanning[] = [];
  const categoryCounts: Record<string, number> = {};

  // Initialize category counts for desktop planning
  const desktopPlanningCategories = [
    'Desktop: GP', 'Desktop: FPOI', 'Desktop: BHQ', 'Desktop: Block Router',
    'Desktop: Bridge', 'Desktop: Culvert', 'Desktop: Road Cross', 
    'Desktop: Railway Cross', 'Desktop: N Highway Cross',
    'Desktop: Incremental Cable', 'Desktop: Proposed Cable'
  ];
  
  desktopPlanningCategories.forEach(category => {
    categoryCounts[category] = 0;
  });

  // Process each network in the response
  apiData.data.forEach((network) => {
    // Process Points
    network.points.forEach((point, index) => {
      try {
        // Parse coordinates from "[longitude,latitude]" format
        const coordsArray = JSON.parse(point.coordinates);
        const longitude = parseFloat(coordsArray[0]);
        const latitude = parseFloat(coordsArray[1]);

        // Parse properties to get type information
        let pointProperties: any = {};
        try {
          pointProperties = JSON.parse(point.properties);
        } catch (e) {
          console.warn('Failed to parse point properties:', point.properties);
        }

        // Determine category based on asset_type or type
        const assetType = pointProperties.asset_type || pointProperties.type || 'FPOI';
        const category = getDesktopPlanningCategory(assetType, 'point');
        
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        processedPlacemarks.push({
          id: `desktop-point-${network.id}-${point.id}`,
          name: point.name,
          category,
          type: 'point',
          coordinates: {
            lat: latitude,
            lng: longitude
          },
          pointType: assetType,
          assetType: pointProperties.asset_type,
          status: pointProperties.status,
          ring: pointProperties.ring,
          networkId: network.id,
          lgdCode: pointProperties.lgd_code,
          rawProperties: pointProperties
        });
      } catch (error) {
        console.error('Error processing desktop planning point:', point, error);
      }
    });

    // Process Connections (Polylines)
    network.connections.forEach((connection, index) => {
      try {
        // Parse coordinates from "[[lat,lng],[lat,lng],...]" format
        const coordsArray = JSON.parse(connection.coordinates);
        const coordinates = coordsArray.map((coord: [number, number]) => ({
          lat: coord[0],
          lng: coord[1]
        }));

        // Parse properties
        let connectionProperties: any = {};
        try {
          connectionProperties = JSON.parse(connection.properties);
        } catch (e) {
          console.warn('Failed to parse connection properties:', connection.properties);
        }

        // Determine category based on connection type
        const connectionType = connection.type || 'proposed';
        const category = connectionType === 'incremental' 
          ? 'Desktop: Incremental Cable' 
          : 'Desktop: Proposed Cable';
        
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        processedPlacemarks.push({
          id: `desktop-connection-${network.id}-${connection.id}`,
          name: connection.original_name,
          category,
          type: 'polyline',
          coordinates,
          length: connection.length,
          connectionType: connection.type as 'proposed' | 'incremental',
          status: connection.status,
          networkId: network.id,
          rawProperties: connectionProperties
        });
      } catch (error) {
        console.error('Error processing desktop planning connection:', connection, error);
      }
    });
  });

  // Create categories array
  const categories: PlacemarkCategory[] = desktopPlanningCategories.map(name => ({
    id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name,
    count: categoryCounts[name] || 0,
    visible: true,
    color: PLACEMARK_CATEGORIES[name]?.color || '#6B7280',
    icon: PLACEMARK_CATEGORIES[name]?.icon || '📍'
  })).filter(category => category.count > 0);

  return { placemarks: processedPlacemarks, categories };
}

// Helper function to determine desktop planning category
function getDesktopPlanningCategory(assetType: string, itemType: 'point' | 'polyline'): string {
  if (!assetType) return 'Desktop: FPOI';
  
  const upperAssetType = assetType.toUpperCase();
  
  if (itemType === 'point') {
    // Point categories based on asset_type or type
    if (upperAssetType === 'GP') return 'Desktop: GP';
    if (upperAssetType === 'FPOI') return 'Desktop: FPOI';
    if (upperAssetType === 'BHQ') return 'Desktop: BHQ';
    if (upperAssetType === 'BLOCK ROUTER') return 'Desktop: Block Router';
    
    // Infrastructure types from properties.type
    if (upperAssetType === 'BRIDGE') return 'Desktop: Bridge';
    if (upperAssetType === 'CULVERT') return 'Desktop: Culvert';
    if (upperAssetType === 'ROAD CROSS') return 'Desktop: Road Cross';
    if (upperAssetType === 'RAILWAY CROSS') return 'Desktop: Railway Cross';
    if (upperAssetType === 'N HIGHWAY CROSS') return 'Desktop: N Highway Cross';
    
    // Default for points
    return 'Desktop: FPOI';
  } else {
    // Polyline categories based on connection type are handled in the main processing function
    return 'Desktop: Proposed Cable';
  }
}