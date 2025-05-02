import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import { LatLngExpression, LatLngBounds } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useFullscreen } from '../hooks/useFullscreen';

// Leaflet icon fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Type Definitions
type UnderGroundSurveyData = {
  id: string;
  latitude: string;
  longitude: string;
  event_type: string;
  execution_modality: string;
  videoUrl?: string;
  start_photos: string[];
};

interface FitBoundsProps {
  positions: LatLngExpression[];
  triggerReset: boolean;
  resetComplete: () => void;
}
const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;

interface MapComponentProps {
  data: UnderGroundSurveyData[];
}

// Component to re-fit bounds dynamically
const FitBounds: React.FC<FitBoundsProps> = ({ positions, triggerReset, resetComplete }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0 && triggerReset) {
      const bounds = new LatLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
      resetComplete(); // reset the trigger
    }
  }, [positions, triggerReset, resetComplete, map]);
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ data }) => {
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(5);
  const [viewMode, setViewMode] = useState<string>('default');
  const [resetMapBounds, setResetMapBounds] = useState<boolean>(false);
  const [initialFitDone, setInitialFitDone] = useState<boolean>(false);
  const [isFullView, setIsFullView] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { enterFullscreen, exitFullscreen } = useFullscreen();
  const [isFullscreen, setIsFullscreen] = useState(false);


  const eventTypes = useMemo<string[]>(() => ['ALL', ...new Set(data.map(d => d.event_type))], [data]);
  const modalities = useMemo<string[]>(() => ['ALL', ...new Set(data.map(d => d.execution_modality))], [data]);

  const filteredData = useMemo<UnderGroundSurveyData[]>(() => {
    return data.filter(item =>
      (selectedEventType === 'ALL' || item.event_type === selectedEventType) &&
      (selectedModality === 'ALL' || item.execution_modality === selectedModality)
    );
  }, [data, selectedEventType, selectedModality]);

  const positions: LatLngExpression[] = filteredData.map(item => [
    parseFloat(item.latitude),
    parseFloat(item.longitude),
  ]);

  const mapCenter: LatLngExpression = positions.length > 0 ? positions[0] : [20.5937, 78.9629];

  const tileLayerUrl = useMemo(() => {
    switch (viewMode) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  }, [viewMode]);

  const handleResetMap = () => {
    setResetMapBounds(true);
  };

  const resetComplete = () => {
    setResetMapBounds(false);
  };

  const clearFilters = () => {
    setSelectedEventType('ALL');
    setSelectedModality('ALL');
  };

  return (
    <div ref={containerRef} className="flex h-screen">
      {/* Left side: Map */}
      <div className={`w-full transition-all duration-300`}>
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url={tileLayerUrl}
            attribution="&copy; OpenStreetMap contributors"
          />

          <FitBounds positions={positions} triggerReset={!initialFitDone || resetMapBounds} 
          resetComplete={() => {
            setInitialFitDone(true);
            setResetMapBounds(false);
          }} />

          {filteredData.map(item => (
            <Marker
              key={item.id}
              position={[parseFloat(item.latitude), parseFloat(item.longitude)]}
            >
              <Popup minWidth={200} maxWidth={250}>
                <div>
                  <strong>ID:</strong> {item.id}<br />
                  <strong>Event:</strong> {item.event_type}<br />
                  <strong>Modality:</strong> {item.execution_modality}<br /><br />

                  {item.videoUrl ? (
                    <iframe
                      src={`${baseUrl}${item.videoUrl}`}
                      width="100%"
                      height="200"
                      style={{ border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`Video-${item.id}`}
                    />
                  ) : null}

                  {!item.videoUrl && item.start_photos.length > 0 ? (
                    <img
                      src={`${baseUrl}${item.start_photos[0]}`}
                      alt="Start photo"
                      className="w-full max-h-40 object-cover mt-2"
                    />
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}

          {positions.length > 1 && (
            <Polyline positions={positions} pathOptions={{ color: 'blue' }} />
          )}
        </MapContainer>
      </div>

      {/* Right side: Filters and Controls */}
      <div className="w-80 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Filters</h2>

        {/* Event Type Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Event Type:</label>
          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {eventTypes.map((event) => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </div>

        {/* Execution Modality Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Execution Modality:</label>
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {modalities.map((modality) => (
              <option key={modality} value={modality}>{modality}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="mb-6">
          <button
            onClick={clearFilters}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded"
          >
            Clear Filters
          </button>
        </div>

        <h2 className="text-lg font-bold mt-8 mb-4">Map Controls</h2>

        {/* Zoom Controls */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setZoomLevel((prev) => Math.min(prev + 1, 18))}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
          >
            Zoom In
          </button>
          <button
            onClick={() => setZoomLevel((prev) => Math.max(prev - 1, 2))}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
          >
            Zoom Out
          </button>
        </div>

        {/* Reset Zoom Button */}
        <div className="mb-6">
          <button
            onClick={handleResetMap}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded"
          >
            Reset Zoom
          </button>
        </div>
        
        {/* View Mode Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">View Mode:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="default">Default (Road Map)</option>
            <option value="satellite">Satellite</option>
            <option value="terrain">Terrain</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">View full Screen:</label>
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              if (isFullscreen) {
                exitFullscreen();
                setIsFullscreen(false);
              } else {
                enterFullscreen(containerRef.current);
                setIsFullscreen(true);
              }
            }}
          >
            {isFullscreen ? 'Exit Full View' : 'Full View'}
          </button>

        </div>
      </div>
    </div>
  );
};

export default MapComponent;
