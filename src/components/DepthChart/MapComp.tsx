import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useFullscreen } from '../hooks/useFullscreen';
import { GoogleMap, InfoWindow, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { EventData } from './UGConstView';

interface MapMarker {
  lat: number;
  lng: number;
  eventType: string;
  id: number;
}

function MapComp({ data }: { data: MapMarker[] }) {

    const containerRef = useRef<HTMLDivElement>(null);
      const mapRef = useRef<google.maps.Map | null>(null);
      const [mapLoaded, setMapLoaded] = useState(false);
      const {enterFullscreen, exitFullscreen } = useFullscreen();
      const [isFullscreen, setIsFullscreen] = useState(true);
       const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

        useEffect(() => {
          // Short delay to ensure the component is fully rendered
          const timer = setTimeout(() => {
            if (containerRef.current) {
              enterFullscreen(containerRef.current);
            }
          }, 500);
      
          return () => clearTimeout(timer);
        }, [enterFullscreen]);
  const GoogleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey:GoogleKey,
  });
    if (loadError) return <div>Map cannot be loaded right now...</div>;
  if (!isLoaded) return <div>Loading Map...</div>;
  const initialCenter = { lat: 20.5937, lng: 78.9629 }; 
   const polylinePath = data.map(marker => ({
    lat: marker.lat,
    lng: marker.lng,
  }));

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row h-screen">
         <GoogleMap 
          mapContainerStyle={{ height: '100%', width: '100%' }}
          //zoom={5}
          center={!mapLoaded ? initialCenter : undefined}
          onLoad={(map) => {
            mapRef.current = map;
            setMapLoaded(true);

            if (data.length > 0) {
              const bounds = new window.google.maps.LatLngBounds();
              data.forEach((item) => {
                bounds.extend({
                  lat: (item.lat),
                  lng: (item.lng),
                });
              });
              map.fitBounds(bounds);
            }
          }}

          options={{
            scrollwheel: true
          }}>
      {data.map(marker => (
        <Marker
          key={marker.id}
          position={{ lat: marker.lat, lng: marker.lng }}
          onClick={() => setSelectedMarker(marker)}
        />
      ))}
        {polylinePath.length > 1 && (
        <Polyline
          path={polylinePath}
          options={{
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      )}
       {selectedMarker && (
        <InfoWindow
          position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div>
            <p className="font-bold">{selectedMarker.eventType}</p>
            <p>Lat: {selectedMarker.lat}</p>
            <p>Lng: {selectedMarker.lng}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
        </div>


    
  )
}

export default MapComp