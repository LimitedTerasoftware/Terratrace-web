import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Filter,
  X,
  ZoomIn,
  Undo2,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GripVertical,
} from 'lucide-react';
import GoogleMapsLoader from '../hooks/googleMapsLoader';
import moment from 'moment';
import type {
  PoleString,
  PolePreview,
  JointEnclosure,
  Landmark,
} from '../../types/aerial-survey';
import { isAdminUser } from '../../utils/accessControl';

/** Current position override for a marker (after drag) */
interface PositionOverride {
  lat: number;
  lng: number;
}

/** One entry in the undo stack */
interface DragChange {
  id: number;
  eventType: string;
  surveyId: number | null;
  prevLat: number;
  prevLng: number;
  newLat: number;
  newLng: number;
  timestamp: number;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

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
  START: { color: '#22C55E', icon: '🟢', label: 'Start Point' },
  END: { color: '#DC2626', icon: '🔴', label: 'End Point' },
};

const DEFAULT_MARKER = { color: '#6B7280', icon: '📌', label: 'Other' };

// Classic teardrop map-pin outline (24x24 viewBox), tip pointing down —
// used for the start/end markers so they read as "drop pins" on the map.
const PIN_PATH =
  'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z';

const getMarkerConfig = (eventType: string) =>
  EVENT_MARKER_CONFIG[eventType] ?? { ...DEFAULT_MARKER, label: eventType };

const PREVIEW_LARGE_THRESHOLD = 500;
const PREVIEW_DETAIL_ZOOM = 16;

function sampleEvenly<T>(items: T[], maxCount: number): T[] {
  if (items.length <= maxCount) return items;
  const step = items.length / maxCount;
  const sampled: T[] = [];
  for (let i = 0; i < maxCount; i++) {
    sampled.push(items[Math.floor(i * step)]);
  }
  return sampled;
}

interface EndpointPoint {
  lat: number;
  lng: number;
  label: string | null;
}

// GP link start/end coordinates repeat on every preview record for that
// link — collapse them down to one marker per unique location.
function uniqueEndpoints(
  records: PolePreview[] | undefined,
  latKey: 'start_latitude' | 'end_latitude',
  lngKey: 'start_longitude' | 'end_longitude',
  labelKey: 'start_lgd_name' | 'end_lgd_name',
): EndpointPoint[] {
  if (!records) return [];
  const seen = new Set<string>();
  const result: EndpointPoint[] = [];

  records.forEach((rec) => {
    const latStr = rec[latKey];
    const lngStr = rec[lngKey];
    if (!latStr || !lngStr) return;
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;

    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    if (seen.has(key)) return;
    seen.add(key);
    result.push({ lat, lng, label: rec[labelKey] });
  });

  return result;
}

const baseUrl = import.meta.env.VITE_Image_URL;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

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
  /** API endpoint to POST marker-position changes to. Defaults to /bulk-update-coordinates */
  submitApiUrl?: string;
  onReload?: () => void;
}

const MapComponent: React.FC<Props> = ({
  data,
  previewData,
  submitApiUrl = `${TraceBASEURL}/poles/bulk-update-coordinates`,
  onReload,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [gMarkers, setGMarkers] = useState<google.maps.Marker[]>([]);
  const [gPreviewMarkers, setGPreviewMarkers] = useState<google.maps.Marker[]>([]);
  const [gPolylines, setGPolylines] = useState<google.maps.Polyline[]>([]);
  const [showPolylines, setShowPolylines] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<PoleString | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<PolePreview | null>(
    null,
  );
  const [selectedEndpoint, setSelectedEndpoint] = useState<
    { kind: 'START' | 'END'; point: EndpointPoint } | null
  >(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [gPreviewPolylines, setGPreviewPolylines] = useState<google.maps.Polyline[]>([]);
  const [mapZoom, setMapZoom] = useState(14);
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
  const hasFitBoundsRef = useRef(false);
  const AdminAcess = isAdminUser();

  // ── Drag / undo / submit state ──────────────────────────────────────────
  const positionOverridesRef = useRef<Map<number, PositionOverride>>(new Map());
  const [renderTick, setRenderTick] = useState(0);
  const bumpRender = useCallback(() => setRenderTick((t) => t + 1), []);

  const undoStackRef = useRef<DragChange[]>([]);
  const [undoStack, setUndoStack] = useState<DragChange[]>([]);

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showChangesPanel, setShowChangesPanel] = useState(false);

  // GP link start/end points — deduplicated, since every preview record on
  // the same link repeats the same start/end coordinates.
  const startPoints = useMemo(
    () => uniqueEndpoints(previewData, 'start_latitude', 'start_longitude', 'start_lgd_name'),
    [previewData],
  );
  const endPoints = useMemo(
    () => uniqueEndpoints(previewData, 'end_latitude', 'end_longitude', 'end_lgd_name'),
    [previewData],
  );

  // Derive unique event types present in data (plus PREVIEW/START/END if applicable)
  const presentTypes = useMemo(() => {
    const types = new Set(data.filter((val)=>val.is_active == 1).map((d) => d.eventType));
    if (previewData && previewData.length > 0) types.add('PREVIEW');
    if (startPoints.length > 0) types.add('START');
    if (endPoints.length > 0) types.add('END');
    return Array.from(types);
  }, [data, previewData, startPoints, endPoints]);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
    new Set(presentTypes),
  );

  // Sync visibleTypes when data changes (new event types may appear)
  useEffect(() => {
    const types = new Set(data.filter((val)=>val.is_active == 1).map((d) => d.eventType));
    if (previewData && previewData.length > 0) types.add('PREVIEW');
    if (startPoints.length > 0) types.add('START');
    if (endPoints.length > 0) types.add('END');
    setVisibleTypes(types);
  }, [data, previewData, startPoints, endPoints]);

  // Valid points only
  const validData = data.filter(
    (r) =>
      r.latitude != null &&
      r.longitude != null &&
      !isNaN(Number(r.latitude)) &&
      !isNaN(Number(r.longitude)) &&
      Math.abs(Number(r.latitude)) <= 90 &&
      Math.abs(Number(r.longitude)) <= 180 && 
      r.is_active === 1,
  );

  // Valid preview points, parsed once per previewData change
  const validPreview = useMemo(() => {
    if (!previewData) return [];
    return previewData
      .map((rec) => ({ rec, lat: parseFloat(rec.latitude), lng: parseFloat(rec.longitude) }))
      .filter(
        ({ lat, lng }) => !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180,
      );
  }, [previewData]);

  // New dataset → allow the map to re-fit its bounds once more.
  useEffect(() => {
    hasFitBoundsRef.current = false;
  }, [data, previewData]);

  /** All pole/joint/landmark markers that have been dragged to a new position */
  const changedMarkers = useMemo(() => {
    const result: Array<{
      id: number;
      eventType: string;
      surveyId: number | null;
      origLat: number;
      origLng: number;
      newLat: number;
      newLng: number;
    }> = [];
    positionOverridesRef.current.forEach((pos, id) => {
      const original = validData.find((d) => d.id === id);
      if (!original) return;
      const origLat = Number(original.latitude);
      const origLng = Number(original.longitude);
      if (origLat !== pos.lat || origLng !== pos.lng) {
        result.push({
          id,
          eventType: original.eventType,
          surveyId: original.survey_id ?? null,
          origLat,
          origLng,
          newLat: pos.lat,
          newLng: pos.lng,
        });
      }
    });
    return result;
    // renderTick is the actual dependency — the ref mutates silently
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTick, validData]);

  // ── Record a drag change ────────────────────────────────────────────────
  const recordDrag = useCallback(
    (
      id: number,
      eventType: string,
      surveyId: number | null,
      prevLat: number,
      prevLng: number,
      newLat: number,
      newLng: number,
    ) => {
      const change: DragChange = {
        id,
        eventType,
        surveyId,
        prevLat,
        prevLng,
        newLat,
        newLng,
        timestamp: Date.now(),
      };
      undoStackRef.current = [...undoStackRef.current, change];
      positionOverridesRef.current = new Map(positionOverridesRef.current);
      positionOverridesRef.current.set(id, { lat: newLat, lng: newLng });
      setUndoStack([...undoStackRef.current]);
      setSubmitStatus('idle');
      setSubmitError(null);
      bumpRender();
    },
    [bumpRender],
  );

  // ── Undo last drag ──────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const last = stack[stack.length - 1];

    undoStackRef.current = stack.slice(0, -1);

    const newOverrides = new Map(positionOverridesRef.current);
    const earlierEntry = [...undoStackRef.current].reverse().find((c) => c.id === last.id);
    if (earlierEntry) {
      newOverrides.set(last.id, { lat: earlierEntry.newLat, lng: earlierEntry.newLng });
    } else {
      newOverrides.delete(last.id);
    }
    positionOverridesRef.current = newOverrides;

    setUndoStack([...undoStackRef.current]);
    setSubmitStatus('idle');
    setSubmitError(null);
    bumpRender();
  }, [bumpRender]);

  // ── Reset all changes ────────────────────────────────────────────────────
  const handleResetAll = useCallback(() => {
    undoStackRef.current = [];
    positionOverridesRef.current = new Map();
    setUndoStack([]);
    setSubmitStatus('idle');
    setSubmitError(null);
    bumpRender();
  }, [bumpRender]);

  // ── Submit changes to API ────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (changedMarkers.length === 0) return;
    setSubmitStatus('loading');
    setSubmitError(null);
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      const payload = {
        changes: changedMarkers.map((m) => ({
          id: m.id,
          event_type: m.eventType,
          // survey_id: m.surveyId,
          lat: m.newLat.toFixed(7),
          lng: m.newLng.toFixed(7),
          // user_id: userData.id,
          // user_name: userData.name,
        })),
      };
      const res = await fetch(submitApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Server responded ${res.status}: ${errText}`);
      }
      setSubmitStatus('success');
      undoStackRef.current = [];
      positionOverridesRef.current = new Map();
      setUndoStack([]);
      bumpRender();
      onReload?.();
    } catch (err: any) {
      setSubmitStatus('error');
      setSubmitError(err.message ?? 'Failed to save changes');
    }
  }, [changedMarkers, submitApiUrl, onReload, bumpRender]);

  // Auto-close the changes panel when all changes are undone/reset
  useEffect(() => {
    if (changedMarkers.length === 0) setShowChangesPanel(false);
  }, [changedMarkers.length]);

  // Auto-dismiss the success state on the toolbar after 2 s
  useEffect(() => {
    if (submitStatus !== 'success') return;
    const t = setTimeout(() => setSubmitStatus('idle'), 2000);
    return () => clearTimeout(t);
  }, [submitStatus]);

  // Preview data can be huge (thousands of raw survey pings). Above the
  // threshold we skip individual pins while zoomed out — the route polyline
  // (drawn separately, see below) still shows the overall shape — and only
  // render pins inside the current viewport once the user zooms in.
  const previewMarkersToRender = useMemo(() => {
    if (!visibleTypes.has('PREVIEW')) return [];
    if (validPreview.length <= PREVIEW_LARGE_THRESHOLD) return validPreview;

    if (mapZoom >= PREVIEW_DETAIL_ZOOM && mapBounds) {
      const inView = validPreview.filter(({ lat, lng }) => mapBounds.contains({ lat, lng }));
      return sampleEvenly(inView, PREVIEW_LARGE_THRESHOLD * 2);
    }

    return [];
  }, [validPreview, visibleTypes, mapZoom, mapBounds]);

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

    mapInstance.addListener('idle', () => {
      setMapZoom(mapInstance.getZoom() ?? 14);
      setMapBounds(mapInstance.getBounds() ?? null);
    });

    setMap(mapInstance);
  }, [data, map]);

  // Fit the map to the full dataset once per load — kept separate from
  // marker creation so pan/zoom (which recomputes previewMarkersToRender)
  // never fights the user by re-fitting bounds.
  useEffect(() => {
    if (!map || hasFitBoundsRef.current) return;
    const allPoints = [
      ...validData.map((r) => ({ lat: Number(r.latitude), lng: Number(r.longitude) })),
      ...validPreview.map(({ lat, lng }) => ({ lat, lng })),
      ...startPoints.map(({ lat, lng }) => ({ lat, lng })),
      ...endPoints.map(({ lat, lng }) => ({ lat, lng })),
    ];
    if (allPoints.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    allPoints.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds);
    hasFitBoundsRef.current = true;
  }, [map, validData, validPreview, startPoints, endPoints]);

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

      const origLat = Number(record.latitude);
      const origLng = Number(record.longitude);
      const override = positionOverridesRef.current.get(record.id);
      const lat = override?.lat ?? origLat;
      const lng = override?.lng ?? origLng;
      const hasMoved =
        override !== undefined && (override.lat !== origLat || override.lng !== origLng);

      const marker = new google.maps.Marker({
        position: { lat, lng },
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
          scale: hasMoved ? 11 : 9,
          fillColor,
          fillOpacity: 0.9,
          strokeColor: hasMoved ? '#facc15' : '#ffffff',
          strokeWeight: hasMoved ? 2.5 : 2,
        },
        draggable: AdminAcess,
        cursor: AdminAcess ? 'grab' : 'pointer',
      });

      marker.addListener('click', () => setSelectedRecord(record));

      marker.addListener('dragstart', () => {
        setSelectedRecord(null);
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor,
          fillOpacity: 1,
          strokeColor: '#facc15',
          strokeWeight: 3,
        });
      });

      marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
        const newPos = e.latLng;
        if (!newPos) return;
        const currentOverride = positionOverridesRef.current.get(record.id);
        const prevLat = currentOverride?.lat ?? origLat;
        const prevLng = currentOverride?.lng ?? origLng;
        recordDrag(
          record.id,
          record.eventType,
          record.survey_id ?? null,
          prevLat,
          prevLng,
          newPos.lat(),
          newPos.lng(),
        );
      });

      newMarkers.push(marker);
    });

    // GP link start/end markers (already deduplicated in startPoints/endPoints)
    const addEndpointMarkers = (points: EndpointPoint[], kind: 'START' | 'END') => {
      if (!visibleTypes.has(kind)) return;
      const cfg = getMarkerConfig(kind);
      points.forEach((point) => {
        idx++;
        const marker = new google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map,
          title: `${cfg.label}${point.label ? ` — ${point.label}` : ''}`,
          icon: {
            path: PIN_PATH,
            fillColor: cfg.color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
            scale: 1.7,
            anchor: new google.maps.Point(12, 22),
            labelOrigin: new google.maps.Point(12, 9),
          },
          label: {
            text: kind === 'START' ? 'S' : 'E',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 'bold',
          },
          zIndex: google.maps.Marker.MAX_ZINDEX + 1,
        });
        marker.addListener('click', () => setSelectedEndpoint({ kind, point }));
        newMarkers.push(marker);
      });
    };

    addEndpointMarkers(startPoints, 'START');
    addEndpointMarkers(endPoints, 'END');

    setGMarkers(newMarkers);
    // positionOverridesRef is a ref — not in deps. renderTick drives icon/position updates.
    // previewMarkersToRender deliberately excluded — it changes on every zoom/pan
    // 'idle' event for large datasets, and recreating these stable markers on
    // every such tick caused visible blinking. See the dedicated preview-marker
    // effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, data, visibleTypes, startPoints, endPoints, renderTick, recordDrag, AdminAcess]);

  // ── Create / update preview markers ─────────────────────────────────────────
  // Kept separate from the effect above: previewMarkersToRender changes on
  // every zoom/pan for large preview datasets (viewport sampling), and only
  // these markers need to be torn down and recreated in response — not the
  // draggable pole/joint/landmark markers or the GP start/end pins.
  useEffect(() => {
    if (!map) return;

    gPreviewMarkers.forEach((m) => m.setMap(null));

    const newPreviewMarkers: google.maps.Marker[] = [];
    const cfg = getMarkerConfig('PREVIEW');
    previewMarkersToRender.forEach(({ rec, lat, lng }, i) => {
      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: `Survey — ${rec.pit_id ?? rec.id}`,
        label: {
          text: (i + 1).toString(),
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
      });
      marker.addListener('click', () => setSelectedPreview(rec));
      newPreviewMarkers.push(marker);
    });

    setGPreviewMarkers(newPreviewMarkers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, previewMarkersToRender]);

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
      const sorted = [...records].sort((a, b) => a.order_index || a.id - b.order_index || a.id);
      if (sorted.length < 2) return;

      const path = sorted.map((r) => {
        const override = positionOverridesRef.current.get(r.order_index || r.id);
        return {
          lat: override?.lat ?? Number(r.latitude),
          lng: override?.lng ?? Number(r.longitude),
        };
      });

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
    // positionOverridesRef is a ref — not in deps. renderTick drives redraws after drag/undo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, data, visibleTypes, showPolylines, renderTick]);

  // ── Draw preview route polylines (one per survey_id, sorted by id) ─────────
  // Drawn independently of previewMarkersToRender so the overall route stays
  // visible even while zoomed out and individual pins are held back.
  useEffect(() => {
    if (!map) return;

    gPreviewPolylines.forEach((p) => p.setMap(null));

    if (!showPolylines || !visibleTypes.has('PREVIEW') || validPreview.length < 2) {
      setGPreviewPolylines([]);
      return;
    }

    const groups: Record<string, { rec: PolePreview; lat: number; lng: number }[]> = {};
    validPreview.forEach((p) => {
      const key = String(p.rec.survey_id ?? `no_survey_${p.rec.id}`);
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    const newPreviewPolylines: google.maps.Polyline[] = [];
    Object.values(groups).forEach((points) => {
      const sorted = [...points].sort((a, b) => a.rec.id - b.rec.id);
      if (sorted.length < 2) return;

      const polyline = new google.maps.Polyline({
        path: sorted.map(({ lat, lng }) => ({ lat, lng })),
        map,
        strokeColor: '#EF4444',
        strokeOpacity: 0.7,
        strokeWeight: 2,
        geodesic: true,
      });

      newPreviewPolylines.push(polyline);
    });

    setGPreviewPolylines(newPreviewPolylines);
  }, [map, validPreview, visibleTypes, showPolylines]);

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

  const getCount = (type: string) => {
    if (type === 'PREVIEW') return validPreview.length;
    if (type === 'START') return startPoints.length;
    if (type === 'END') return endPoints.length;
    return validData.filter((r) => r.eventType === type).length;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      {/* Map canvas */}
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />

      {/* ── Drag-edit toolbar (appears when there are changes) ── */}
      {(undoStack.length > 0 || submitStatus !== 'idle') && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-xl px-3 py-2 pointer-events-auto border border-gray-100">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0 || submitStatus === 'loading'}
              title="Undo last move"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <Undo2 size={14} />
              Undo
              {undoStack.length > 0 && (
                <span className="ml-1 bg-gray-200 text-gray-600 text-xs rounded-full px-1.5 py-0.5 font-semibold">
                  {undoStack.length}
                </span>
              )}
            </button>

            <div className="w-px h-5 bg-gray-200" />

            <button
              onClick={() => setShowChangesPanel((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
            >
              <GripVertical size={14} />
              {changedMarkers.length} moved
            </button>

            <div className="w-px h-5 bg-gray-200" />

            <button
              onClick={handleResetAll}
              disabled={submitStatus === 'loading'}
              title="Reset all markers to original positions"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                disabled:opacity-40 disabled:cursor-not-allowed
                bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
            >
              <X size={14} />
              Reset all
            </button>

            <div className="w-px h-5 bg-gray-200" />

            <button
              onClick={handleSubmit}
              disabled={changedMarkers.length === 0 || submitStatus === 'loading' || submitStatus === 'success'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                ${submitStatus === 'success'
                  ? 'bg-green-100 text-green-700'
                  : submitStatus === 'error'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              {submitStatus === 'loading' && <Loader2 size={14} className="animate-spin" />}
              {submitStatus === 'success' && <CheckCircle2 size={14} />}
              {submitStatus === 'error' && <AlertCircle size={14} />}
              {submitStatus === 'idle' && <Send size={14} />}
              {submitStatus === 'loading'
                ? 'Saving…'
                : submitStatus === 'success'
                ? 'Saved!'
                : submitStatus === 'error'
                ? 'Retry'
                : 'Save changes'}
            </button>
          </div>

          {submitStatus === 'error' && submitError && (
            <div className="mt-1 mx-auto max-w-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 text-center pointer-events-auto">
              {submitError}
            </div>
          )}
        </div>
      )}

      {/* ── Changes detail panel ── */}
      {showChangesPanel && changedMarkers.length > 0 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[420px] max-h-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">
              Pending position changes ({changedMarkers.length})
            </span>
            <button onClick={() => setShowChangesPanel(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="overflow-y-auto max-h-56 divide-y divide-gray-50">
            {changedMarkers.map((cm, i) => (
              <div key={cm.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-xs">
                <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-semibold shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-700">
                      {getMarkerConfig(cm.eventType).label}
                    </span>
                    <span className="text-gray-400">ID {cm.id}</span>
                    {cm.surveyId != null && (
                      <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                        Survey {cm.surveyId}
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 font-mono">
                    <span className="line-through">{cm.origLat.toFixed(6)}, {cm.origLng.toFixed(6)}</span>
                    <span className="mx-1.5 text-gray-300">→</span>
                    <span className="text-gray-600">{cm.newLat.toFixed(6)}, {cm.newLng.toFixed(6)}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    undoStackRef.current = undoStackRef.current.filter((c) => c.id !== cm.id);
                    positionOverridesRef.current = new Map(positionOverridesRef.current);
                    positionOverridesRef.current.delete(cm.id);
                    setUndoStack([...undoStackRef.current]);
                    bumpRender();
                  }}
                  title="Revert this marker"
                  className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Undo2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  notice for large preview datasets */}
      {visibleTypes.has('PREVIEW') && validPreview.length > PREVIEW_LARGE_THRESHOLD && (
        <div className="absolute top-15 left-2 z-10 bg-white rounded-lg shadow-lg px-3 py-1.5 text-xs text-gray-700">
          {mapZoom < PREVIEW_DETAIL_ZOOM
            ? `Showing route line for ${validPreview.length} preview points — zoom in to see individual points`
            : `Showing ${previewMarkersToRender.length} of ${validPreview.length} preview points in view`}
        </div>
      )}

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
          <div className="flex items-center justify-between mb-2 gap-3">
            <h4 className="font-medium text-sm text-gray-700">
              Marker Legend
            </h4>
            {AdminAcess && changedMarkers.length === 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <GripVertical size={11} /> Drag to reposition
              </span>
            )}
          </div>
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

      {selectedEndpoint && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-72 overflow-hidden">
            <div
              className="p-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${getMarkerConfig(selectedEndpoint.kind).color}, ${getMarkerConfig(selectedEndpoint.kind).color}bb)`,
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  {getMarkerConfig(selectedEndpoint.kind).label}
                </h3>
                <button
                  onClick={() => setSelectedEndpoint(null)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {selectedEndpoint.point.label && (
                <Row label="GP Name" value={selectedEndpoint.point.label} />
              )}
              <Row
                label="Coordinates"
                value={`${selectedEndpoint.point.lat}, ${selectedEndpoint.point.lng}`}
              />
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

const PoleStringMapComp: React.FC<Props> = ({ data, previewData, submitApiUrl, onReload }) => {
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

  return (
    <MapComponent
      data={data}
      previewData={previewData}
      submitApiUrl={submitApiUrl}
      onReload={onReload}
    />
  );
};

export default PoleStringMapComp;
