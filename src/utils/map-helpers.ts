import { AerialSurveyDetails } from '../types/aerial-survey';

export const parseCoordinates = (coordinates: string): google.maps.LatLngLiteral | null => {
  try {
    if (!coordinates) return null;
    const [lat, lng] = coordinates.split(',').map(c => parseFloat(c.trim()));
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  } catch (error) {
    console.error('Error parsing coordinates:', error);
    return null;
  }
};

export const parsePhotos = (photosString: string): string[] => {
  try {
    if (!photosString) return [];
    const parsed = JSON.parse(photosString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing photos:', error);
    return [];
  }
};

export const getMidpoint = (
  start: google.maps.LatLngLiteral,
  end: google.maps.LatLngLiteral
): google.maps.LatLngLiteral => {
  return {
    lat: (start.lat + end.lat) / 2,
    lng: (start.lng + end.lng) / 2,
  };
};

export const calculateBounds = (surveys: AerialSurveyDetails[]): google.maps.LatLngBounds | null => {
  if (typeof google === 'undefined' || !surveys.length) return null;

  const bounds = new google.maps.LatLngBounds();
  let hasPoints = false;

  surveys.forEach(survey => {
    const startCoords = parseCoordinates(survey.startGpCoordinates);
    const endCoords = parseCoordinates(survey.endGpCoordinates);

    if (startCoords) {
      bounds.extend(startCoords);
      hasPoints = true;
    }
    if (endCoords) {
      bounds.extend(endCoords);
      hasPoints = true;
    }

    survey.aerial_poles?.forEach(pole => {
      const poleCoords = parseCoordinates(`${pole.lattitude},${pole.longitude}`);
      if (poleCoords) {
        bounds.extend(poleCoords);
        hasPoints = true;
      }
    });

    survey.aerial_road_crossings?.forEach(crossing => {
      const startCrossingCoords = parseCoordinates(`${crossing.slattitude},${crossing.slongitude}`);
      const endCrossingCoords = parseCoordinates(`${crossing.elattitude},${crossing.elongitude}`);
      if (startCrossingCoords) {
        bounds.extend(startCrossingCoords);
        hasPoints = true;
      }
      if (endCrossingCoords) {
        bounds.extend(endCrossingCoords);
        hasPoints = true;
      }
    });
  });

  return hasPoints ? bounds : null;
};

export const getSurveyColor = (index: number): string => {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  return colors[index % colors.length];
};

export const createMarkerIcon = (type: 'start' | 'end' | 'pole' | 'crossing', data?: { poleType?: number}): google.maps.Icon => {
  let color = '#3b82f6';
  if (type === 'pole') {
    color = data?.poleType === 1 ?  '#10b981': '#f59e0b';
  }
  const iconMap = {
    start: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
          <path fill="#3b82f6" d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z"/>
          <circle fill="white" cx="16" cy="16" r="6"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(30,30),
      anchor: new google.maps.Point(16, 40),
    },
    end: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
          <path fill="#ef4444" d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z"/>
          <circle fill="white" cx="16" cy="16" r="6"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(30,30),
      anchor: new google.maps.Point(16, 40),
    },
 
    pole: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
          <path fill="${color}" d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z"/>
          <path fill="white" d="M16 8l-4 4h2v8h-2l4 4 4-4h-2v-8h2z"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(30,30),
      anchor: new google.maps.Point(16, 40),
    },
    crossing: {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
          <path fill="#8b5cf6" d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 24 16 24s16-15.2 16-24C32 7.2 24.8 0 16 0z"/>
          <path fill="white" d="M16 10l-6 6h4v8h4v-8h4z"/>
        </svg>
      `),
      scaledSize: new google.maps.Size(30,30),
      anchor: new google.maps.Point(16, 40),
    },
  };

  return iconMap[type];
};
