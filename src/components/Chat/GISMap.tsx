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

// Below this zoom level the pole count can be in the thousands, so we skip
// rendering individual markers (creating that many Marker/InfoWindow
// instances at once is what was freezing the page) and wait for the user
// to zoom in far enough to see a manageable area.
const MIN_ZOOM_FOR_MARKERS = 12;
const MAX_VISIBLE_MARKERS = 500;

const isValidPole = (pole: PoleData) =>
  !isNaN(pole.latitude) &&
  !isNaN(pole.longitude) &&
  Math.abs(pole.latitude) <= 90 &&
  Math.abs(pole.longitude) <= 180;

interface PoleCluster {
  lat: number;
  lng: number;
  count: number;
  poles: PoleData[];
}

// Simple lat/lng grid bucketing — cheap enough to run on thousands of
// points, and the cell size shrinks as the user zooms in so clusters break
// apart into smaller groups (and eventually individual markers).
const clusterPoles = (poles: PoleData[], zoom: number): PoleCluster[] => {
  const cellSize = Math.max(40 / Math.pow(2, zoom), 0.005);
  const cells = new Map<string, PoleCluster>();

  poles.forEach((pole) => {
    const key = `${Math.floor(pole.latitude / cellSize)}:${Math.floor(pole.longitude / cellSize)}`;
    const existing = cells.get(key);
    if (existing) {
      existing.count += 1;
      existing.lat += pole.latitude;
      existing.lng += pole.longitude;
      existing.poles.push(pole);
    } else {
      cells.set(key, { lat: pole.latitude, lng: pole.longitude, count: 1, poles: [pole] });
    }
  });

  return Array.from(cells.values()).map((cluster) => ({
    ...cluster,
    lat: cluster.lat / cluster.count,
    lng: cluster.lng / cluster.count,
  }));
};

export default function GISMap({ acceptedPoles }: GISMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [zoom, setZoom] = useState<number>(10);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);

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

    mapInstance.addListener('idle', () => {
      setZoom(mapInstance.getZoom() ?? 10);
      setBounds(mapInstance.getBounds() ?? null);
    });

    setMap(mapInstance);
  }, [mapsLoaded, acceptedPoles, map]);

  // Fit the map to the full result set whenever the filtered data changes.
  // This only touches the viewport (cheap) — marker creation is handled
  // separately once the user has zoomed in.
  useEffect(() => {
    if (!map) return;

    const validPoles = acceptedPoles.filter(isValidPole);
    if (validPoles.length === 0) return;

    const dataBounds = new google.maps.LatLngBounds();
    validPoles.forEach((pole) => {
      dataBounds.extend({ lat: pole.latitude, lng: pole.longitude });
    });
    map.fitBounds(dataBounds);
  }, [map, acceptedPoles]);

  const makePoleMarker = (pole: PoleData) => {
    if (!map) return null;

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

    return marker;
  };

  const makeClusterMarker = (cluster: PoleCluster) => {
    if (!map) return null;

    const scale = Math.min(14 + Math.log2(cluster.count) * 4, 30);
    const marker = new google.maps.Marker({
      position: { lat: cluster.lat, lng: cluster.lng },
      map,
      title: `${cluster.count} poles`,
      label: {
        text: String(cluster.count),
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: '700',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale,
        fillColor: '#2563eb',
        fillOpacity: 0.85,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
      zIndex: cluster.count,
    });

    marker.addListener('click', () => {
      map.setCenter({ lat: cluster.lat, lng: cluster.lng });
      map.setZoom(Math.min((map.getZoom() || 10) + 3, MIN_ZOOM_FOR_MARKERS + 1));
    });

    return marker;
  };

  // At low zoom, group nearby poles into count markers so the page never has
  // to create thousands of Marker/InfoWindow instances at once. Once the
  // user zooms in far enough, plot the exact pole locations instead.
  useEffect(() => {
    if (!map) return;

    markers.forEach((m) => m.setMap(null));

    const validPoles = acceptedPoles.filter(isValidPole);
    const newMarkers: google.maps.Marker[] = [];

    if (zoom >= MIN_ZOOM_FOR_MARKERS) {
      const visiblePoles = (
        bounds ? validPoles.filter((pole) => bounds.contains({ lat: pole.latitude, lng: pole.longitude })) : validPoles
      ).slice(0, MAX_VISIBLE_MARKERS);

      visiblePoles.forEach((pole) => {
        const marker = makePoleMarker(pole);
        if (marker) newMarkers.push(marker);
      });
    } else {
      const clusters = clusterPoles(validPoles, zoom);

      clusters.forEach((cluster) => {
        const marker =
          cluster.count === 1 ? makePoleMarker(cluster.poles[0]) : makeClusterMarker(cluster);
        if (marker) newMarkers.push(marker);
      });
    }

    setMarkers(newMarkers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, acceptedPoles, zoom, bounds]);

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

        {mapsLoaded && zoom < MIN_ZOOM_FOR_MARKERS && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200 z-20 max-w-[220px]">
            <span className="text-xs text-gray-600 font-medium">
              Showing grouped markers — zoom in to view exact pole locations
            </span>
          </div>
        )}

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
