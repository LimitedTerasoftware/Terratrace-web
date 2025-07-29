import React, { useEffect, useRef } from 'react';

interface SurveyPoint {
  latitude: string;
  longitude: string;
  event_type: string;
}

interface GoogleMapProps {
  points: SurveyPoint[];
}

const GoogleMap: React.FC<GoogleMapProps> = ({ points }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map>();

useEffect(() => {
  if (!window.google || !mapInstance.current) return;

  const map = mapInstance.current;

  const bounds = new google.maps.LatLngBounds(); // create bounds
  const path: google.maps.LatLngLiteral[] = [];

  points.forEach((point) => {
    const lat = parseFloat(point.latitude);
    const lng = parseFloat(point.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      const position = { lat, lng };

      // Marker
      new google.maps.Marker({
        position,
        map,
        title: point.event_type,
        icon: {
          url:
            point.event_type === 'SURVEYSTART'
              ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
              : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
      });

      // Extend bounds
      bounds.extend(position);

      // Add to path for polyline
      path.push(position);
    }
  });

  // Center and zoom to fit all points
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds);
  }

  // Draw polyline
  if (path.length > 1) {
    new google.maps.Polyline({
      path,
      map,
      strokeColor: '#007bff',
      strokeOpacity: 0.8,
      strokeWeight: 4,
    });
  }
}, [points]);


  return <div ref={mapRef} className="w-full h-full rounded-lg"  />;
};

export default GoogleMap;
