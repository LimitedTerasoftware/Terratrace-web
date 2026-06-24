import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Filter, X, ZoomIn } from 'lucide-react';
import GoogleMapsLoader from '../hooks/googleMapsLoader';
import moment from 'moment';
import type {
  PoleString,
  PolePreview,
  JointEnclosure,
  Landmark,
} from '../../types/aerial-survey';

// ─── Marker type config (keyed by eventType) ─────────────────────────────────

const EVENT_MARKER_CONFIG: Record<
  string,
  { color: string; icon: string; label: string }
> = {
  POLE: { color: '#3B82F6', icon: '🪝', label: 'Pole' },
  'JOINT ENCLOUSER': { color: '#8B5CF6', icon: '🔌', label: 'Joint Enclosure' },
  DRUM: { color: '#F59E0B', icon: '🥁', label: 'Drum' },
  LANDMARK: { color: '#10B981', icon: '📍', label: 'Landmark' },
  PREVIEW: { color: '#EF4444', icon: '📍', label: 'Survey' },
};

const DEFAULT_MARKER = { color: '#6B7280', icon: '📌', label: 'Other' };

const getMarkerConfig = (eventType: string) =>
  EVENT_MARKER_CONFIG[eventType] ?? { ...DEFAULT_MARKER, label: eventType };

const baseUrl = import.meta.env.VITE_Image_URL;

// ─── InfoWindow ───────────────────────────────────────────────────────────────

const InfoWindow: React.FC<{
  record: PoleString;
  onClose: () => void;
  onImageClick: (url: string) => void;
}> = ({ record, onClose, onImageClick }) => {
  const config = getMarkerConfig(record.eventType);
  const je: JointEnclosure | null = record.joint_enclosure;

  const allImages: { url: string; label: string }[] = [];

  if (record.image) {
    allImages.push({
      url: record.image.startsWith('http')
        ? record.image
        : `${baseUrl}${record.image}`,
      label: 'Pole Image',
    });
  }
  if (record.images?.length)
    record?.images.forEach((img, i) =>
      allImages.push({
        url: `${baseUrl}${img}`,
        label: `Pole Image ${i + 1}`,
      }),
    );
  {
  }
  if (je?.jointImages?.length) {
    je.jointImages.forEach((u, i) =>
      allImages.push({
        url: u.startsWith('http') ? u : `${baseUrl}${u}`,
        label: `Joint ${i + 1}`,
      }),
    );
  }

  if (record.landmark?.images?.length) {
    record.landmark.images.forEach((u, i) =>
      allImages.push({
        url: u.startsWith('http') ? u : `${baseUrl}${u}`,
        label: `Landmark ${i + 1}`,
      }),
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-sm w-80 max-h-[440px] overflow-hidden">
      {/* Header */}
      <div
        className="p-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${config.color}, ${config.color}bb)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <h3 className="font-semibold text-sm">{config.label}</h3>
            {record.pit_id && (
              <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">
                {record.pit_id}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 max-h-80 overflow-y-auto space-y-2">
        {record.survey_id && (
          <Row label="Survey ID" value={String(record.survey_id)} />
        )}
        <Row label="Event Type" value={record.eventType} />
        <Row
          label="Coordinates"
          value={`${record.latitude}, ${record.longitude}`}
        />

        {/* POLE fields */}
        {record.pole_type && <Row label="Pole Type" value={record.pole_type} />}
        {record.line_type && <Row label="Line Type" value={record.line_type} />}
        {record.pole_material && (
          <Row label="Pole Material" value={record.pole_material} />
        )}
        {record.pole_owner && (
          <Row label="Pole Owner" value={record.pole_owner} />
        )}
        {(record.fitting_type || record.fitting_type_new) && (
          <Row
            label="Fitting Type"
            value={record.fitting_type ?? record.fitting_type_new ?? '-'}
          />
        )}
        {record.pole_height && (
          <Row label="Pole Height" value={record.pole_height} />
        )}
        {record.drum_number && (
          <Row label="Drum Number" value={record.drum_number} />
        )}
        {record.meter && <Row label="Meter" value={record.meter} />}
        {record.landmark && (
          <>
            <div className="border-t pt-2 mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Landmark
              </p>
            </div>
            {record.landmark.type && (
              <Row label="Type" value={record.landmark.type} />
            )}
            {record.landmark.description && (
              <Row label="Description" value={record.landmark.description} />
            )}
          </>
        )}

        {/* Joint Enclosure fields */}
        {je && (
          <>
            <div className="border-t pt-2 mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Joint Enclosure
              </p>
            </div>
            {je.jointType && <Row label="Joint Type" value={je.jointType} />}
            {je.startDrumNumber && (
              <Row
                label="Start Drum"
                value={`${je.startDrumNumber} / ${je.startDrumMeter}m`}
              />
            )}
            {je.endDrumNumber && (
              <Row
                label="End Drum"
                value={`${je.endDrumNumber} / ${je.endDrumMeter}m`}
              />
            )}
          </>
        )}

        {/* Location */}
        {(record.state_name || record.district_name || record.block_name) && (
          <div className="border-t pt-2 mt-2">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
              Location
            </p>
          </div>
        )}
        {record.state_name && <Row label="State" value={record.state_name} />}
        {record.district_name && (
          <Row label="District" value={record.district_name} />
        )}
        {record.block_name && <Row label="Block" value={record.block_name} />}
        {record.start_lgd_name && record.end_lgd_name && (
          <Row
            label="GP Link"
            value={`${record.start_lgd_name} → ${record.end_lgd_name}`}
          />
        )}

        {/* User */}
        {record.user_name && <Row label="User" value={record.user_name} />}
        {record.user_mobile && (
          <Row label="Mobile" value={record.user_mobile} />
        )}

        <Row
          label="Created"
          value={moment(record.created_at).format('DD/MM/YYYY, hh:mm A')}
        />

        {/* Photos */}
        {allImages.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              Photos
            </p>
            <div className="grid grid-cols-2 gap-2">
              {allImages.slice(0, 6).map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => onImageClick(img.url)}
                >
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40 text-white text-[10px] px-1 py-0.5 truncate">
                    {img.label}
                  </div>
                </div>
              ))}
            </div>
            {allImages.length > 6 && (
              <p className="text-xs text-gray-500 mt-1">
                +{allImages.length - 6} more photos
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Small helper to avoid repeating the row layout
const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between gap-2">
    <span className="text-gray-500 text-sm flex-shrink-0">{label}:</span>
    <span className="font-medium text-sm text-right">{value}</span>
  </div>
);

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

interface Props {
  data: PoleString[];
  previewData?: PolePreview[];
}

const MapComponent: React.FC<Props> = ({ data, previewData }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [gMarkers, setGMarkers] = useState<google.maps.Marker[]>([]);
  const [gPolylines, setGPolylines] = useState<google.maps.Polyline[]>([]);
  const [showPolylines, setShowPolylines] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<PoleString | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<PolePreview | null>(
    null,
  );
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Derive unique event types present in data (plus PREVIEW if previewData exists)
  const presentTypes = useMemo(() => {
    const types = new Set(data.map((d) => d.eventType));
    if (previewData && previewData.length > 0) types.add('PREVIEW');
    return Array.from(types);
  }, [data, previewData]);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
    new Set(presentTypes),
  );

  // Sync visibleTypes when data changes (new event types may appear)
  useEffect(() => {
    const types = new Set(data.map((d) => d.eventType));
    if (previewData && previewData.length > 0) types.add('PREVIEW');
    setVisibleTypes(types);
  }, [data, previewData]);

  // Valid points only
  const validData = data.filter(
    (r) =>
      r.latitude != null &&
      r.longitude != null &&
      !isNaN(Number(r.latitude)) &&
      !isNaN(Number(r.longitude)) &&
      Math.abs(Number(r.latitude)) <= 90 &&
      Math.abs(Number(r.longitude)) <= 180,
  );

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || map) return;

    const center =
      validData.length > 0
        ? {
            lat: Number(validData[0].latitude),
            lng: Number(validData[0].longitude),
          }
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
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    setMap(mapInstance);
  }, [data, map]);

  // ── Create / update markers ─────────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    gMarkers.forEach((m) => m.setMap(null));

    const visible = validData.filter((r) => visibleTypes.has(r.eventType));
    const newMarkers: google.maps.Marker[] = [];
    let idx = 0;

    visible.forEach((record) => {
      const config = getMarkerConfig(record.eventType);
      let fillColor = config.color;
      if (record.eventType === 'POLE' && record.pole_type) {
        fillColor =
          record.pole_type.toLowerCase() === 'existing' ? '#3B82F6' : '#EF4444';
      }
      idx++;
      const marker = new google.maps.Marker({
        position: {
          lat: Number(record.latitude),
          lng: Number(record.longitude),
        },
        map,
        title: `${config.label} — ${record.pit_id ?? record.id}`,
        label: {
          text: idx.toString(),
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        animation: google.maps.Animation.DROP,
      });

      marker.addListener('click', () => setSelectedRecord(record));
      newMarkers.push(marker);
    });

    // Add preview data markers
    if (previewData && visibleTypes.has('PREVIEW')) {
      previewData.forEach((rec) => {
        const lat = parseFloat(rec.latitude);
        const lng = parseFloat(rec.longitude);
        if (
          isNaN(lat) ||
          isNaN(lng) ||
          Math.abs(lat) > 90 ||
          Math.abs(lng) > 180
        )
          return;
        idx++;
        const cfg = getMarkerConfig('PREVIEW');
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: `Survey — ${rec.pit_id ?? rec.id}`,
          label: {
            text: idx.toString(),
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: cfg.color,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          animation: google.maps.Animation.DROP,
        });
        marker.addListener('click', () => setSelectedPreview(rec));
        newMarkers.push(marker);
      });
    }

    setGMarkers(newMarkers);

    // Fit bounds
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach((m) => {
        const pos = m.getPosition();
        if (pos) bounds.extend(pos);
      });
      map.fitBounds(bounds);
    }
  }, [map, data, previewData, visibleTypes]);

  // ── Draw polylines (one per survey_id, points sorted by id) ─────────────────
  useEffect(() => {
    if (!map) return;

    // Clear old polylines
    gPolylines.forEach((p) => p.setMap(null));

    if (!showPolylines) {
      setGPolylines([]);
      return;
    }

    // Group valid points by survey_id, sorted ascending by record id
    const groups: Record<string, PoleString[]> = {};
    validData.forEach((r) => {
      const key = String(r.survey_id ?? `no_survey_${r.id}`);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    // Assign a distinct stroke color per survey group
    const STROKE_COLORS = [
      '#3B82F6', // blue
      '#10B981', // emerald
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];

    const newPolylines: google.maps.Polyline[] = [];
    Object.entries(groups).forEach(([, records], groupIndex) => {
      // Sort by id ascending so line follows insertion order
      const sorted = [...records].sort((a, b) => a.id - b.id);
      if (sorted.length < 2) return;

      const path = sorted.map((r) => ({
        lat: Number(r.latitude),
        lng: Number(r.longitude),
      }));

      const strokeColor = STROKE_COLORS[groupIndex % STROKE_COLORS.length];

      const polyline = new google.maps.Polyline({
        path,
        map,
        strokeColor,
        strokeOpacity: 0.8,
        strokeWeight: 3,
        geodesic: true,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
              scale: 3,
              strokeColor,
              strokeOpacity: 1,
            },
            offset: '50%',
            repeat: '120px',
          },
        ],
      });

      newPolylines.push(polyline);
    });

    setGPolylines(newPolylines);
  }, [map, data, visibleTypes, showPolylines]);

  // ── Close filter panel on outside click ────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        showFilters &&
        filterRef.current &&
        !filterRef.current.contains(e.target as Node)
      ) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilters]);

  // ── Toggle helpers ──────────────────────────────────────────────────────────
  const toggleType = (type: string) => {
    const next = new Set(visibleTypes);
    next.has(type) ? next.delete(type) : next.add(type);
    setVisibleTypes(next);
  };

  const toggleAll = () => {
    setVisibleTypes(
      visibleTypes.size === presentTypes.length
        ? new Set()
        : new Set(presentTypes),
    );
  };

  const getCount = (type: string) =>
    validData.filter((r) => r.eventType === type).length;

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
            <button
              onClick={() => setShowPolylines((prev) => !prev)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors text-sm border ${
                showPolylines
                  ? 'bg-blue-50 text-blue-600 border-blue-300 hover:bg-blue-100'
                  : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
              }`}
              title={showPolylines ? 'Hide route lines' : 'Show route lines'}
            >
              {showPolylines ? <Eye size={14} /> : <EyeOff size={14} />}
              Route
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-md p-3 min-w-[200px]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-700">
                  Event Types
                </h4>
                <button
                  onClick={toggleAll}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {visibleTypes.size === presentTypes.length
                    ? 'Hide All'
                    : 'Show All'}
                </button>
              </div>

              <div className="space-y-1">
                {presentTypes.map((type) => {
                  const config = getMarkerConfig(type);
                  const count = getCount(type);
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
                        <span className="text-sm font-medium">
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">({count})</span>
                          <div
                            className="w-3 h-3 rounded-full border"
                            style={{
                              backgroundColor: isVisible
                                ? config.color
                                : 'transparent',
                              borderColor: config.color,
                            }}
                          />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <h4 className="font-medium text-sm text-gray-700 mb-2">
            Marker Legend
          </h4>
          <div className="space-y-1 text-xs">
            {presentTypes.map((type) => {
              const config = getMarkerConfig(type);
              const count = getCount(type);
              const isVisible = visibleTypes.has(type);
              if (type === 'POLE') {
                const existingCount = validData.filter(
                  (r) =>
                    r.eventType === 'POLE' &&
                    r.pole_type?.toLowerCase() === 'existing',
                ).length;
                const newCount = validData.filter(
                  (r) =>
                    r.eventType === 'POLE' &&
                    r.pole_type?.toLowerCase() !== 'existing',
                ).length;
                return (
                  <React.Fragment key={type}>
                    <div
                      className={`flex items-center gap-2 ${isVisible ? 'opacity-100' : 'opacity-40'}`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#3B82F6' }}
                      />
                      <span>
                        {config.icon} Pole - Existing ({existingCount})
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-2 ${isVisible ? 'opacity-100' : 'opacity-40'}`}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#EF4444' }}
                      />
                      <span>
                        {config.icon} Pole - New ({newCount})
                      </span>
                    </div>
                  </React.Fragment>
                );
              }
              return (
                <div
                  key={type}
                  className={`flex items-center gap-2 ${isVisible ? 'opacity-100' : 'opacity-40'}`}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span>
                    {config.icon} {config.label} ({count})
                  </span>
                </div>
              );
            })}
            {/* Polyline indicator */}
            <div
              className={`flex items-center gap-2 mt-1 pt-1 border-t border-gray-200 ${showPolylines ? 'opacity-100' : 'opacity-40'}`}
            >
              <svg width="20" height="10" viewBox="0 0 20 10">
                <line
                  x1="0"
                  y1="5"
                  x2="20"
                  y2="5"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />
                <polygon points="16,2 20,5 16,8" fill="#3B82F6" />
              </svg>
              <span>Route line</span>
            </div>
          </div>
        </div>
      </div>

      {/* InfoWindow */}
      {selectedRecord && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <InfoWindow
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onImageClick={setZoomImage}
          />
        </div>
      )}
      {selectedPreview && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-80 max-h-[440px] overflow-hidden">
            <div
              className="p-4 text-white"
              style={{
                background: 'linear-gradient(135deg, #EF4444, #EF4444bb)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Survey</h3>
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">
                    {selectedPreview.pit_id}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPreview(null)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              <Row
                label="Survey ID"
                value={String(selectedPreview.survey_id ?? '-')}
              />
              <Row label="Pit ID" value={selectedPreview.pit_id || '-'} />
              <Row label="Status" value={selectedPreview.status || '-'} />
              <Row
                label="Coordinates"
                value={`${selectedPreview.latitude}, ${selectedPreview.longitude}`}
              />
              {selectedPreview.workType && (
                <Row label="Work Type" value={selectedPreview.workType} />
              )}
              {selectedPreview.construction_type && (
                <Row
                  label="Construction"
                  value={selectedPreview.construction_type}
                />
              )}
              {/* Photos */}
              {(() => {
                const photos = [
                  ...(selectedPreview.pit_images || []),
                  ...(selectedPreview.muff_images || []),
                  ...(selectedPreview.earthing_images || []),
                  ...(selectedPreview.pole_images || []),
                ];
                if (photos.length === 0) return null;
                return (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Photos
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {photos.slice(0, 6).map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setZoomImage(`${baseUrl}${photo}`)}
                        >
                          <img
                            src={`${baseUrl}${photo}`}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {photos.length > 6 && (
                      <p className="text-xs text-gray-500 mt-1">
                        +{photos.length - 6} more photos
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
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

const PoleStringMapComp: React.FC<Props> = ({ data, previewData }) => {
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

  return <MapComponent data={data} previewData={previewData} />;
};

export default PoleStringMapComp;
