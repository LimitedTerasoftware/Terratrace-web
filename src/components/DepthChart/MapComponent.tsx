import React, { useEffect, useRef, useState } from 'react';
import { MarkerData } from '../../types/survey';

interface MapComponentProps {
  markers: MarkerData[];
  onMarkerClick: (activity: MarkerData['activity']) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ markers, onMarkerClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [googleMarkers, setGoogleMarkers] = useState<google.maps.Marker[]>([]);

  // Event type colors for markers
  const getMarkerColor = (eventType: string) => {
    const colors = {
      'DEPTH': '#2563eb',
      'ROADCROSSING': '#dc2626',
      'FPOI': '#059669',
      'JOINTCHAMBER': '#7c3aed',
      'MANHOLE': '#ea580c',
      'ROUTEINDICATOR': '#0891b2',
      'LANDMARK': '#be185d',
      'FIBERTURN': '#4338ca',
      'KILOMETERSTONE': '#65a30d',
      "ENDPIT":'ea580c',
      "STARTPIT":'ea580c',
    };
    return colors[eventType as keyof typeof colors] || '#6b7280';
  };

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 17.3882, lng: 78.4892 },
      zoom: 10,
      
    });

    setMap(newMap);
  }, []);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    googleMarkers.forEach(marker => marker.setMap(null));

    // Create new markers
    const newMarkers = markers.map(markerData => {
      const markerColor = getMarkerColor(markerData.activity.eventType);
      
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: map,
        title: `${markerData.activity.eventType} - ${markerData.activity.link_name}`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${markerColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3" fill="${markerColor}"></circle>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32)
        }
      });

      // Create info window with event type specific information
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
              ${markerData.activity.eventType}
            </h3>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
              <strong>Link:</strong> ${markerData.activity.link_name}
            </p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
              <strong>Machine:</strong> ${markerData.activity.machine_id}
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 11px;">
              ${new Date(markerData.activity.created_at).toLocaleString()}
            </p>
            <div style="margin-top: 8px; text-align: center;">
              <button style="background: ${markerColor}; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                View Details
              </button>
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        // Close all other info windows
        googleMarkers.forEach(m => {
          const iw = (m as any).infoWindow;
          if (iw) iw.close();
        });
        
        infoWindow.open(map, marker);
        onMarkerClick(markerData.activity);
      });

      // Store info window reference
      (marker as any).infoWindow = infoWindow;

      return marker;
    });

    setGoogleMarkers(newMarkers);

    // Adjust map bounds to fit all markers
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(marker => bounds.extend(marker.position));
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom()! > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, markers, onMarkerClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Legend */}
      {markers.length > 0 && (
        <div className="absolute top-20 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Event Types</h4>
          <div className="space-y-1">
            {Array.from(new Set(markers.map(m => m.activity.eventType))).map(eventType => (
              <div key={eventType} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getMarkerColor(eventType) }}
                ></div>
                <span className="text-xs text-gray-700">{eventType.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;