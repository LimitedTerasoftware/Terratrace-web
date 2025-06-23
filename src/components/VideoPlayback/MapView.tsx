import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { MapPosition, SegmentSelection } from './types';
import { formatTimestamp } from './timeUtils';
interface MapViewProps {
  trackPoints: MapPosition[];
  currentPosition: MapPosition | null;
  selection: SegmentSelection;
  onSelectionChange: (selection: SegmentSelection) => void;
  className?: string;
}

const MapView: React.FC<MapViewProps> = ({
  trackPoints,
  currentPosition,
  selection,
  onSelectionChange,
  className = ''
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<MapPosition | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const hasFitBounds = useRef(false);


  // Get initial center from first track point
  const initialCenter = trackPoints.length > 0
    ? { lat: trackPoints[0].lat, lng: trackPoints[0].lng }
    : { lat: 0, lng: 0 };

  // Handle map bounds when track points change or map loads
  useEffect(() => {
    if (mapRef.current && mapLoaded && trackPoints.length > 0 && window.google 
) {
      const bounds = new window.google.maps.LatLngBounds();
      trackPoints.forEach(point => {
        bounds.extend({ lat: point.lat, lng: point.lng });
      });
      
      mapRef.current.fitBounds(bounds);
     hasFitBounds.current = true;

    }
  }, [trackPoints, mapLoaded]);

 // Handle map click to set selection points
  const handleMapClick = (point: MapPosition) => {
    if (!selection.start) {
      onSelectionChange({ start: point, end: null });
    } else if (!selection.end) {
      onSelectionChange({ ...selection, end: point });
    } else {
      onSelectionChange({ start: point, end: null });
    }
  };
   const clearSelection = () => {
    onSelectionChange({ start: null, end: null });
  };
  const GoogleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GoogleKey,
  });
    if (loadError) return <div>Map cannot be loaded right now...</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className={`relative rounded-lg overflow-hidden shadow-lg ${className}`}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%', minHeight: '400px' }}
          center={!mapLoaded ? initialCenter : undefined}
          zoom={14}
          onLoad={(map) => {
            mapRef.current = map;
            setMapLoaded(true);
          }}
          options={{
            scrollwheel: true,
            zoomControl: true,
            streetViewControl:false,
            mapTypeControl: true,
            fullscreenControl: true
          }}

        >
        {mapLoaded && (
            <>
              {/* Track path */}
              <Polyline
                path={trackPoints.map(point => ({ lat: point.lat, lng: point.lng }))}
                options={{
                  strokeColor: '#008000',
                  strokeOpacity: 0.8,
                  strokeWeight: 3,
                  icons: [{
                    icon: {
                      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                      scale: 3,
                      strokeColor: '#3B82F6'
                    },
                    offset: '100%'
                  }]
                }}
              />

              {/* Track points */}
              {trackPoints.map((point, index) => (
                <Marker
                  key={`track-${index}`}
                  position={{ lat: point.lat, lng: point.lng }}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    scaledSize: new window.google.maps.Size(8, 8)
                  }}
                  onClick={() => handleMapClick(point)}
                />
              ))}

              {/* Current position marker */}
              {currentPosition && (
                <Marker
                  position={{ lat: currentPosition.lat, lng: currentPosition.lng }}
                  
                  icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#ff0000', // Google blue
                  fillOpacity: 1,
                  strokeColor: 'white',
                  strokeWeight: 2,
                }}
                  onClick={() => setSelectedPoint(currentPosition)}
                />
              )}

              {/* Selection markers */}
              {selection.start && (
                <Marker
                  position={{ lat: selection.start.lat, lng: selection.start.lng }}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    scaledSize: new window.google.maps.Size(24, 24)
                  }}
                  onClick={() => setSelectedPoint(selection.start)}
                />
              )}

              {selection.end && (
                <Marker
                  position={{ lat: selection.end.lat, lng: selection.end.lng }}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                    scaledSize: new window.google.maps.Size(24, 24)
                  }}
                  onClick={() => setSelectedPoint(selection.end)}
                />
              )}
              {/* Info window for selected point */}
              {selectedPoint && (
                <InfoWindow
                  position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
                  onCloseClick={() => setSelectedPoint(null)}
                >
                  <div className="p-2">
                    <p className="font-medium">Position Details</p>
                    <p className="text-sm">Time: {formatTimestamp(selectedPoint.timestamp)}</p>
                    <p className="text-sm">
                      Location: {selectedPoint.lat.toFixed(6)}, {selectedPoint.lng.toFixed(6)}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </>
          )}
        </GoogleMap>

      {/* Selection instructions */}
      {/* {!selection.start && !selection.end && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          Click on a point on the map to set the start of your video segment
        </div>
      )}
      
      {selection.start && !selection.end && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm">
          Now click another point to set the end of your video segment
        </div>
      )}
        {selection.start && (
        <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white p-3 rounded-lg text-sm">

          <button
            onClick={clearSelection}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Clear Selection
          </button>
           </div>
        )} */}

    </div>
  );
};

export default MapView;