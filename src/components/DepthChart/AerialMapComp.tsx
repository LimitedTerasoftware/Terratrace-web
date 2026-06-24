import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Filter, X, ZoomIn } from 'lucide-react';
import GoogleMapsLoader from '../hooks/googleMapsLoader';
import moment from 'moment';
import { PolePreview } from '../../types/aerial-survey';

// ─── Types ────────────────────────────────────────────────────────────────────



export interface AerialMarkerData {
  lat: number;
  lng: number;
  markerType: 'PIT' | 'MUFF' | 'EARTHING' | 'POLE';
  id: number;
  pit_id: string;
  survey_id: number | null;
  record: PolePreview;
}

interface AerialMapCompProps {
  data: PolePreview[];
}

// ─── Marker type config ───────────────────────────────────────────────────────

const MARKER_TYPES = {
  PIT: { color: '#3B82F6', icon: '🕳️', label: 'Pit' },
  MUFF: { color: '#10B981', icon: '🔧', label: 'Muff' },
  EARTHING: { color: '#F59E0B', icon: '⚡', label: 'Earthing' },
  POLE: { color: '#8B5CF6', icon: '🪝', label: 'Pole' },
} as const;

type MarkerType = keyof typeof MARKER_TYPES;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  MUFF_DONE: { label: 'Muff Done', color: '#10B981' },
  PIT_DONE: { label: 'Pit Done', color: '#3B82F6' },
  EARTHING_DONE: { label: 'Earthing Done', color: '#F59E0B' },
  POLE_DONE: { label: 'Pole Done', color: '#8B5CF6' },
  PENDING: { label: 'Pending', color: '#6B7280' },
};

const baseUrl = import.meta.env.VITE_Image_URL;

// ─── InfoWindow ───────────────────────────────────────────────────────────────

const InfoWindow: React.FC<{
  marker: AerialMarkerData;
  onClose: () => void;
  onImageClick: (url: string) => void;
}> = ({ marker, onClose, onImageClick }) => {
  const { record, markerType } = marker;
  const config = MARKER_TYPES[markerType];

  const getImages = (): string[] => {
    switch (markerType) {
      case 'PIT':      return [...(record.pit_images || []),
                                ...(record.muff_images || []),
                                ...(record.earthing_images || []),
                                ...(record.pole_images || [])];
      case 'MUFF':     return record.muff_images || [];
      case 'EARTHING': return record.earthing_images || [];
      case 'POLE':     return record.pole_images || [];
      default:         return [];
    }
  };

  const getCoords = (): string => {
    switch (markerType) {
      case 'PIT':      return `${record.latitude}, ${record.longitude}`;
      case 'MUFF':     return record.muff_latitude && record.muff_longitude ? `${record.muff_latitude}, ${record.muff_longitude}` : '-';
      case 'EARTHING': return record.earthing_latitude && record.earthing_longitude ? `${record.earthing_latitude}, ${record.earthing_longitude}` : '-';
      case 'POLE':     return record.pole_latitude && record.pole_longitude ? `${record.pole_latitude}, ${record.pole_longitude}` : '-';
      default:         return '-';
    }
  };

  const photos = getImages();
  const statusConfig = STATUS_CONFIG[record.status] ?? { label: record.status, color: '#6B7280' };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-sm w-80 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="p-4 text-white" style={{ background: `linear-gradient(135deg, ${config.color}, ${config.color}cc)` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <h3 className="font-semibold text-sm">{config.label}</h3>
            <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">
              {record.pit_id}
            </span>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 max-h-72 overflow-y-auto">
        <div className="space-y-2">
          {record.survey_id && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Survey ID:</span>
              <span className="font-medium text-sm">{record.survey_id}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Pit ID:</span>
            <span className="font-medium text-sm">{record.pit_id || '-'}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Coordinates:</span>
            <span className="font-medium text-sm text-right">{getCoords()}</span>
          </div>

          {record.workType && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Work Type:</span>
              <span className="font-medium text-sm">{record.workType}</span>
            </div>
          )}

          {record.construction_type && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Construction:</span>
              <span className="font-medium text-sm">{record.construction_type}</span>
            </div>
          )}

          {record.state_name && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">State:</span>
              <span className="font-medium text-sm">{record.state_name}</span>
            </div>
          )}

          {record.district_name && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">District:</span>
              <span className="font-medium text-sm">{record.district_name}</span>
            </div>
          )}

          {record.block_name && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Block:</span>
              <span className="font-medium text-sm">{record.block_name}</span>
            </div>
          )}

          {record.start_lgd_name && record.end_lgd_name && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">GP Link:</span>
              <span className="font-medium text-sm">{record.start_lgd_name} → {record.end_lgd_name}</span>
            </div>
          )}

          {record.user_name && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">User:</span>
              <span className="font-medium text-sm">{record.user_name}</span>
            </div>
          )}

          {record.user_mobile && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Mobile:</span>
              <span className="font-medium text-sm">{record.user_mobile}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-sm">Status:</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Created:</span>
            <span className="font-medium text-sm">{moment(record.created_at).format('DD/MM/YYYY, hh:mm A')}</span>
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{config.label} Photos:</h4>
              <div className="grid grid-cols-2 gap-2">
                {photos.slice(0, 5).map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onImageClick(`${baseUrl}${photo}`)}
                  >
                    <img
                      src={`${baseUrl}${photo}`}
                      alt={`${config.label} photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                      <ZoomIn className="text-white opacity-0 hover:opacity-100 transition-opacity" size={16} />
                    </div>
                  </div>
                ))}
              </div>
              {photos.length > 5 && (
                <p className="text-xs text-gray-500 mt-1">+{photos.length - 5} more photos</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Loading / Error ──────────────────────────────────────────────────────────

const LoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
      <p className="text-gray-600">Loading Google Maps...</p>
    </div>
  </div>
);

const ErrorComponent: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <p className="text-red-500 font-medium">Error loading Google Maps</p>
      <p className="text-sm text-gray-500 mt-1">{message}</p>
    </div>
  </div>
);

// ─── Map Component ────────────────────────────────────────────────────────────

const MapComponent: React.FC<AerialMapCompProps> = ({ data }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<AerialMarkerData | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleTypes, setVisibleTypes] = useState<Set<MarkerType>>(
    new Set(Object.keys(MARKER_TYPES) as MarkerType[]),
  );

  // Build flat marker list from PolePreview records
  const buildMarkers = (records: PolePreview[]): AerialMarkerData[] => {
    const result: AerialMarkerData[] = [];

    records.forEach((rec) => {
      const tryPush = (
        latStr: string | null | undefined,
        lngStr: string | null | undefined,
        type: MarkerType,
      ) => {
        if (!latStr || !lngStr) return;
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          result.push({ lat, lng, markerType: type, id: rec.id, pit_id: rec.pit_id, survey_id: rec.survey_id, record: rec });
        }
      };

      tryPush(rec.latitude, rec.longitude, 'PIT');
      tryPush(rec.muff_latitude, rec.muff_longitude, 'MUFF');
      tryPush(rec.earthing_latitude, rec.earthing_longitude, 'EARTHING');
      tryPush(rec.pole_latitude, rec.pole_longitude, 'POLE');
    });

    return result;
  };

  const allMarkers = buildMarkers(data);

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || map) return;

    const center = allMarkers.length > 0
      ? { lat: allMarkers[0].lat, lng: allMarkers[0].lng }
      : { lat: 20.5937, lng: 78.9629 };

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: true,
      zoomControl: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });

    setMap(mapInstance);
  }, [data, map]);

  // ── Create / update markers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    // Clear old markers
    markers.forEach((m) => m.setMap(null));

    const visible = allMarkers.filter((m) => visibleTypes.has(m.markerType));
    const newMarkers: google.maps.Marker[] = [];

    visible.forEach((point, index) => {
      const config = MARKER_TYPES[point.markerType];

      const gMarker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map,
        title: `${config.label} — ${point.pit_id}`,
        label: {
          text: (index + 1).toString(),
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: config.color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        animation: google.maps.Animation.DROP,
      });

      gMarker.addListener('click', () => setSelectedMarker(point));
      newMarkers.push(gMarker);
    });

    setMarkers(newMarkers);

    // Fit bounds
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach((m) => {
        const pos = m.getPosition();
        if (pos) bounds.extend(pos);
      });
      map.fitBounds(bounds);
    }
  }, [map, data, visibleTypes]);

  // ── Close filter panel on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showFilters && filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilters]);

  // ── Toggle helpers ──────────────────────────────────────────────────────────
  const toggleType = (type: MarkerType) => {
    const next = new Set(visibleTypes);
    next.has(type) ? next.delete(type) : next.add(type);
    setVisibleTypes(next);
  };

  const toggleAll = () => {
    const all = Object.keys(MARKER_TYPES) as MarkerType[];
    setVisibleTypes(visibleTypes.size === all.length ? new Set() : new Set(all));
  };

  const getTypeCount = (type: MarkerType) =>
    allMarkers.filter((m) => m.markerType === type).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      {/* Map canvas */}
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />

      {/* Filter panel */}
      <div ref={filterRef} className="absolute top-2 right-10 z-10">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              <Filter size={14} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-md p-3 min-w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-700">Marker Types</h4>
                <button onClick={toggleAll} className="text-xs text-blue-600 hover:text-blue-800">
                  {visibleTypes.size === Object.keys(MARKER_TYPES).length ? 'Hide All' : 'Show All'}
                </button>
              </div>

              <div className="space-y-1">
                {(Object.entries(MARKER_TYPES) as [MarkerType, typeof MARKER_TYPES[MarkerType]][]).map(
                  ([type, config]) => {
                    const count = getTypeCount(type);
                    const isVisible = visibleTypes.has(type);
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer"
                        onClick={() => toggleType(type)}
                      >
                        <div className="flex items-center gap-2">
                          {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span className="text-sm">{config.icon}</span>
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">({count})</span>
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: isVisible ? config.color : 'transparent', borderColor: config.color }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Marker Legend</h4>
          <div className="space-y-1 text-xs">
            {(Object.entries(MARKER_TYPES) as [MarkerType, typeof MARKER_TYPES[MarkerType]][]).map(
              ([type, config]) => {
                const count = getTypeCount(type);
                const isVisible = visibleTypes.has(type);
                if (count === 0) return null;
                return (
                  <div key={type} className={`flex items-center gap-2 ${isVisible ? 'opacity-100' : 'opacity-40'}`}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
                    <span>{config.icon} {config.label} ({count})</span>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>

      {/* InfoWindow */}
      {selectedMarker && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <InfoWindow
            marker={selectedMarker}
            onClose={() => setSelectedMarker(null)}
            onImageClick={setZoomImage}
          />
        </div>
      )}

      {/* Zoom image modal */}
      {zoomImage && (
           <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50"
          onClick={() => setZoomImage(null)}
        >
          <img
            src={zoomImage}
            alt="Zoomed"
            className="max-w-full max-h-full p-4 rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

// ─── Main export (handles Maps SDK loading) ───────────────────────────────────

const AerialMapComp: React.FC<AerialMapCompProps> = ({ data }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key is not configured');
      setIsLoading(false);
      return;
    }

    const loader = GoogleMapsLoader.getInstance();
    loader
      .loadGoogleMaps(apiKey, ['places', 'geometry'])
      .then(() => {
        setIsMapReady(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load Google Maps');
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <LoadingComponent />;
  if (error) return <ErrorComponent message={error} />;
  if (!isMapReady) return <LoadingComponent />;

  return <MapComponent data={data} />;
};

export default AerialMapComp;