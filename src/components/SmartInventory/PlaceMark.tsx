import { ApiPlacemark, ApiPoint, ApiPolyline, ProcessedPlacemark, PlacemarkCategory, PhysicalSurveyApiResponse, ProcessedPhysicalSurvey } from '../../types/kmz';

// Enhanced placemark categories with ALL infrastructure types from your API
export const PLACEMARK_CATEGORIES: Record<string, { color: string; icon: string }> = {
  // Geographic Points
  'GP': { color: '#4ECDC4', icon: '📍' },
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
  
  // Network Infrastructure
  'Block Router': { color: '#2E86AB', icon: '📡' },
  'FIBERTURN': { color: '#372AAC', icon: '🔄' },
  'JOINTCHAMBER': { color: '#FE9A37', icon: '🔗' },
  'ROUTEINDICATOR': { color: '#42D3F2', icon: '🧭' },
  
  // Markers & Indicators
  'KILOMETERSTONE': { color: '#35530E', icon: '📏' },
  
  // Cable Types
  'Incremental Cable': { color: '#61f335', icon: '━━━━' },
  'Proposed Cable': { color: '#ff0000', icon: '┅┅┅┅' },
  
  // Survey Points
  'SURVEYSTART': { color: '#10B981', icon: '🎯'},
  'ENDSURVEY': { color: '#E7180B', icon: '🎯'},
  'HOLDSURVEY': { color: '#a93226', icon: '⏸️'},
  'DEPTH': { color: '#3B82F6', icon: '📏'},
  'MANHOLES': { color: '#06B6D4', icon: '🕳️'},
  'STARTPIT': { color: '#14B8A6', icon: '🕳️' },
  'ENDPIT': { color: '#DC2626', icon: '🏁'},
  'BLOWING': { color: '#663300', icon:'💨'},
  'ROUTEFEASIBILITY': { color: '#17A2B8', icon: '🛤️' },
  'AREA': { color: '#FFC107', icon: '📐' },
  'LIVELOCATION': { color: '#DC3545', icon: '📍' },
  'SIDE': { color: '#6F42C1', icon: '↔️' },
  'ROUTEDETAILS': { color: '#09090B', icon: '📋' },
  
  // Default
  'point': { color: '#FF0000', icon: '📍' },
};

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
  
  // Partial matches for variations
  if (upperName.includes('BRIDGE')) return 'Bridge';
  if (upperName.includes('CROSS') || upperName.includes('CROSSING')) return 'ROADCROSSING';
  if (upperName.includes('CULVERT')) return 'Culvert';
  if (upperName.includes('FIBER')) return 'FIBERTURN';
  if (upperName.includes('RAIL')) return 'Level Cross';
  if (upperName.includes('KM') || upperName.includes('KILOMETER')) return 'KILOMETERSTONE';
  if (upperName.includes('ROUTER')) return 'BR';
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