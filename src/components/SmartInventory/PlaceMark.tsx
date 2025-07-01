import { ApiPlacemark, ApiPoint, ApiPolyline, ProcessedPlacemark, PlacemarkCategory } from '../../types/kmz';

// Define placemark categories with colors and icons
export const PLACEMARK_CATEGORIES: Record<string, { color: string; icon: string }> = {
  'LANDMARK': { color: '#FF6B6B', icon: '🏛️' },
  'FIBERTURN': { color: '#4ECDC4', icon: '🔄' },
  'Bridge': { color: '#45B7D1', icon: '🌁' },
  'Culvert': { color: '#96CEB4', icon: '🌊' },
  'ROADCROSSING': { color: '#FFEAA7', icon: '🛣️' },
  'Level Cross': { color: '#DDA0DD', icon: '🚂' },
  'Rail Under Bridge': { color: '#98D8C8', icon: '🚇' },
  'Causeways': { color: '#F7DC6F', icon: '🛤️' },
  'Rail Over Bridge': { color: '#BB8FCE', icon: '🚄' },
  'KILOMETERSTONE': { color: '#85C1E9', icon: '📍' },
  'FPOI': { color: '#F8C471', icon: '⭐' },
  'JOINTCHAMBER': { color: '#82E0AA', icon: '🔗' },
  'ROUTEINDICATOR': { color: '#F1948A', icon: '🧭' }
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
    const category = getCategoryFromName(point.name);
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
      styleUrl: point.styleUrl
    });
  });

  // Process polylines
  apiData.polylines.forEach((polyline, index) => {
    const category = getCategoryFromName(polyline.name);
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
      distance: polyline?.distance,
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
  return 'LANDMARK';
}