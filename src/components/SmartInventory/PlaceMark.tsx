import { ApiPlacemark, ApiPoint, ApiPolyline, ProcessedPlacemark, PlacemarkCategory, PhysicalSurveyApiResponse, ProcessedPhysicalSurvey } from '../../types/kmz';

// placemark categories with colors and icons
export const PLACEMARK_CATEGORIES: Record<string, { color: string; icon: string }> = {
  'LANDMARK': { color: '#FF6B6B', icon: '🏛️' },
  'FIBERTURN': { color: '#372AAC', icon: '🔄' },
  'Bridge': { color: '#45B7D1', icon: '🌁' },
  'Culvert': { color: '#96CEB4', icon: '🌊' },
  'ROADCROSSING': { color: '#31F527', icon: '🛣️' },
  'Level Cross': { color: '#DDA0DD', icon: '🚂' },
  'Rail Under Bridge': { color: '#98D8C8', icon: '🚇' },
  'Causeways': { color: '#F7DC6F', icon: '🛤️' },
  'Rail Over Bridge': { color: '#BB8FCE', icon: '🚄' },
  'KILOMETERSTONE': { color: '#35530E', icon: '📍' },
  'FPOI': { color: '#F8C471', icon: '⭐' },
  'GP': { color: '#4ECDC4', icon: '⭐' },
  'BHQ': { color: '#BF1E00', icon: '⭐' },
  'BR': { color: '#0030BF', icon: '⭐' },
  'JOINTCHAMBER': { color: '#FE9A37', icon: '🔗' },
  'ROUTEINDICATOR': { color: '#42D3F2', icon: '🧭' },
  'SURVEYSTART': { color: '#10B981', icon: '🎯'},
  'DEPTH': { color: '#3B82F6', icon: '📏'},
  "MANHOLES": { color: '#06B6D4', icon: '🕳️'},
  "STARTPIT": { color: '#14B8A6', icon: '🕳️' },
  "ENDPIT": { color: '#DC2626', icon: '🏁'},
  "ENDSURVEY": { color: '#E7180B', icon: '🎯'},
  "HOLDSURVEY": { color: '#a93226', icon: '⏸️'},
  "BLOWING": { color: '#663300', icon:'💨'},
  "Incremental Cable":{color:"#61f335",icon:'----'},
  "Proposed Cable":{color:"#ff0000",icon:'----'},
  'ROUTEFEASIBILITY': { color: '#17A2B8', icon: '🛤️' },
  'AREA': { color: '#FFC107', icon: '📐' },
  'LIVELOCATION': { color: '#DC3545', icon: '📍' },
  'SIDE': { color: '#6F42C1', icon: '↔️' },
  'ROUTEDETAILS': { color: '#09090B', icon: '📋' },
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

  // Process points
  apiData.points.forEach((point, index) => {
    // Only process points with type "GP" or "FPOI"
    if(!point.type 
       || (point.type !== 'GP' && point.type !== 'FPOI' && point.type !== "BHQ" && point.type !== 'BR' && point.type !== "LANDMARK" && point.type !== 'point')
    ) {
      return;
    }
    
    const category = getCategoryFromName(point.type);
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

  // Process polylines
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

function getCategoryFromName(name: string): string {
  const upperName = name.toUpperCase();
  
  // Check for exact matches first
  for (const category of Object.keys(PLACEMARK_CATEGORIES)) {
    if (upperName.includes(category.toUpperCase())) {
      return category;
    }
  }
  
  // Check for partial matches
  if (upperName.includes('BRIDGE')) return 'Bridge';
  if (upperName.includes('CROSS')) return 'ROADCROSSING';
  if (upperName.includes('FIBER')) return 'FIBERTURN';
  if (upperName.includes('CULVERT')) return 'Culvert';
  if (upperName.includes('RAIL')) return 'Level Cross';
  if (upperName.includes('KM') || upperName.includes('KILOMETER')) return 'KILOMETERSTONE';
  
  // Default category
  return 'FPOI';
}

export function processPhysicalSurveyData(apiData: PhysicalSurveyApiResponse): {
  placemarks: ProcessedPhysicalSurvey[];
  categories: PlacemarkCategory[];
} {
  const processedPlacemarks: ProcessedPhysicalSurvey[] = [];
  const categoryCounts: Record<string, number> = {};

  // Initialize category counts for physical survey categories
  const physicalSurveyCategories = ['SURVEYSTART', 'ROUTEFEASIBILITY', 'AREA', 'LIVELOCATION', 'SIDE', 'ROUTEDETAILS','LANDMARK','FIBERTURN','Bridge',
        'Culvert','ROADCROSSING','Causeways','KILOMETERSTONE','FPOI','JOINTCHAMBER','ROUTEINDICATOR' ,'ENDSURVEY','HOLDSURVEY',    
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