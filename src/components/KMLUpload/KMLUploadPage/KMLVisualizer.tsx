import React, { useEffect, useRef, useState } from 'react';
import { Map, Globe } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

type Gpdata = {
  name: string;
  coordinates: [number, number];
};

interface KMLVisualizerProps {
  showPlaceholder?: boolean;
  Points?: Gpdata[];
}

const KMLVisualizer: React.FC<KMLVisualizerProps> = ({
  showPlaceholder = true,
  Points = [],
}) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [GpPoints, setGpPoints] = useState<Gpdata[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const GoogleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GoogleKey,
  });

  useEffect(() => {
    if (Points.length > 0) {
      setGpPoints(Points);
    }
  }, [Points]);

  if (loadError) return <div>Map cannot be loaded right now...</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  const initialCenter = { lat: 20.5937, lng: 78.9629 };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Map className="h-5 w-5 text-blue-500 mr-2" />
          <h2 className="text-sm font-medium text-gray-900">Map Preview</h2>
        </div>
        <div className="text-xs text-gray-500">Preview KML data</div>
      </div>

      {showPlaceholder && GpPoints.length > 0 ? (
        <div className="h-[800px] bg-gray-100 flex items-center justify-center">
          <GoogleMap
            mapContainerStyle={{ height: '100%', width: '100%' }}
            center={!mapLoaded ? initialCenter : undefined}
            onLoad={(map) => {
              mapRef.current = map;
              setMapLoaded(true);

              const bounds = new window.google.maps.LatLngBounds();
              GpPoints.forEach((item) => {
                bounds.extend({
                  lat: item.coordinates[1],
                  lng: item.coordinates[0],
                });
              });
              map.fitBounds(bounds);
            }}
            options={{ scrollwheel: true }}
          >
            {GpPoints.map((item, index) => {
              const position = {
                lat: item.coordinates[1],
                lng: item.coordinates[0],
              };
              return (
                <Marker
                  key={index}
                  position={position}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    scaledSize: new window.google.maps.Size(25, 25),
                  }}
                  
                />
              );
            })}
          </GoogleMap>
        </div>
      ) : (
        <div className="bg-gray-50 h-60 flex flex-col items-center justify-center p-4">
          <Globe className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm text-center">
            Upload KML files to view map data
          </p>
          <p className="text-gray-400 text-xs text-center mt-2">
            Geographic visualizations will appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default KMLVisualizer;
