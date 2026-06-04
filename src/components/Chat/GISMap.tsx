import { useEffect, useRef, useState } from 'react';
import { Navigation, Plus, Minus, MapPin } from 'lucide-react';
import GoogleMapsLoader from '../hooks/googleMapsLoader';

interface PoleData {
  id: number;
  survey_id: number;
  pole_type: string;
  latitude: number;
  longitude: number;
  distance: number;
  created_at: string;
  state_name: string;
  district_name: string;
  block_name: string;
}

interface GISMapProps {
  acceptedPoles: PoleData[];
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const poleTypeColors: Record<string, string> = {
  existing: '#f59e0b',
  new: '#22c55e',
};

export default function GISMap({ acceptedPoles }: GISMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  useEffect(() => {
    const loader = GoogleMapsLoader.getInstance();
    loader
      .loadGoogleMaps(API_KEY, ['places', 'geometry'])
      .then(() => setMapsLoaded(true))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || map) return;

    const center =
      acceptedPoles.length > 0
        ? { lat: acceptedPoles[0].latitude, lng: acceptedPoles[0].longitude }
        : { lat: 23.4173509, lng: 85.289009 };

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
    });

    setMap(mapInstance);
  }, [mapsLoaded, acceptedPoles, map]);

  useEffect(() => {
    if (!map) return;

    markers.forEach((m) => m.setMap(null));

    const newMarkers: google.maps.Marker[] = [];

    acceptedPoles.forEach((pole) => {
      if (
        isNaN(pole.latitude) ||
        isNaN(pole.longitude) ||
        Math.abs(pole.latitude) > 90 ||
        Math.abs(pole.longitude) > 180
      )
        return;

      const marker = new google.maps.Marker({
        position: { lat: pole.latitude, lng: pole.longitude },
        map,
        title: `Survey #${pole.survey_id}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: poleTypeColors[pole.pole_type] || '#6b7280',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; min-width: 220px; font-family: system-ui, sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
              Pole #${pole.id}
            </h3>
            <table style="width: 100%; font-size: 12px; color: #4b5563;">
              <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">Survey ID:</td><td>${pole.survey_id}</td></tr>
              <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">Pole Type:</td><td>${pole.pole_type}</td></tr>
              <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">State:</td><td>${pole.state_name}</td></tr>
              <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">District:</td><td>${pole.district_name}</td></tr>
              <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">Block:</td><td>${pole.block_name}</td></tr>
              <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">Distance:</td><td>${pole.distance.toFixed(2)} m</td></tr>
              <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">Coordinates:</td><td>${pole.latitude.toFixed(4)}, ${pole.longitude.toFixed(4)}</td></tr>
            </table>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach((m) => {
        const pos = m.getPosition();
        if (pos) bounds.extend(pos);
      });
      map.fitBounds(bounds);
    }
  }, [map, acceptedPoles]);

  const handleZoomIn = () => {
    if (map) map.setZoom((map.getZoom() || 10) + 1);
  };

  const handleZoomOut = () => {
    if (map) map.setZoom((map.getZoom() || 10) - 1);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (map) {
            map.setCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            map.setZoom(15);
          }
        },
        () => console.error('Error getting location'),
      );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative h-full min-h-[340px]">
      <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-wrap gap-2">
        <h2 className="text-base font-semibold text-gray-900">
          Live GIS Deployment Map
        </h2>
        <div className="flex items-center gap-3">
          {[
            { label: 'Existing', color: 'bg-yellow-500' },
            { label: 'New', color: 'bg-green-500' },
          ].map((b) => (
            <span
              key={b.label}
              className="flex items-center gap-1.5 text-xs text-gray-600 font-medium"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
              {b.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative w-full" style={{ height: 'calc(100% - 48px)' }}>
        {!mapsLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full min-h-[280px]" />

        <div className="absolute top-3 right-3 flex flex-col space-y-2 z-20">
          <button
            onClick={handleCurrentLocation}
            className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200"
          >
            <Navigation className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleZoomIn}
            className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200"
          >
            <Plus className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200"
          >
            <Minus className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200 z-20">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-gray-600 font-medium">
              {acceptedPoles.length} Accepted Poles
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
