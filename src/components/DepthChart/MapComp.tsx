import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Navigation,
  Filter,
  X,
  ZoomIn,
  MapPin,
  Undo2,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GripVertical,
} from 'lucide-react';
import GoogleMapsLoader from '../hooks/googleMapsLoader';
import moment from 'moment';
import { Activity } from '../../types/survey';
import type {
  ProcessedDesktopPlanning,
  PlacemarkCategory,
} from '../../types/kmz';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarkerData {
  lat: number;
  lng: number;
  eventType: string;
  id: number;
  survey_id: number;
}

interface MapCompProps {
  data: MarkerData[];
  eventData?: Activity[];
  planningPlacemarks?: ProcessedDesktopPlanning[];
  planningCategories?: PlacemarkCategory[];
  visiblePlanningCategories?: Set<string>;
  onPlanningCategoryVisibilityChange?: (categoryId: string, visible: boolean) => void;
  /** API endpoint to POST marker-position changes to. Defaults to /api/markers/positions */
  submitApiUrl?: string;
  onReload:()=>void;
}

/** One entry in the undo stack */
interface DragChange {
  id: number;
  eventType: string;
  surveyId: number;
  prevLat: number;
  prevLng: number;
  newLat: number;
  newLng: number;
  timestamp: number;
}

/** Current position override for a marker (after drag) */
interface PositionOverride {
  lat: number;
  lng: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPES = {
  STARTSURVEY:    { color: '#10B981', icon: '🎯', label: 'Survey Start' },
  DEPTH:          { color: '#3B82F6', icon: '📏', label: 'Depth' },
  ROADCROSSING:   { color: '#F59E0B', icon: '🛣️', label: 'Road Crossing' },
  FPOI:           { color: '#EF4444', icon: '📍', label: 'FPOI' },
  JOINTCHAMBER:   { color: '#8B5CF6', icon: '🔧', label: 'Joint Chamber' },
  MANHOLES:       { color: '#06B6D4', icon: '🕳️', label: 'Manholes' },
  ROUTEINDICATOR: { color: '#84CC16', icon: '🧭', label: 'Route Indicator' },
  LANDMARK:       { color: '#F97316', icon: '🏛️', label: 'Landmark' },
  FIBERTURN:      { color: '#EC4899', icon: '🔄', label: 'Fiber Turn' },
  KILOMETERSTONE: { color: '#6B7280', icon: '📏', label: 'Kilometer Stone' },
  STARTPIT:       { color: '#14B8A6', icon: '🕳️', label: 'Start Pit' },
  ENDPIT:         { color: '#DC2626', icon: '🏁', label: 'End Pit' },
  ENDSURVEY:      { color: '#10B981', icon: '🎯', label: 'End Survey' },
  HOLDSURVEY:     { color: '#a93226', icon: '⏸️', label: 'Hold Survey' },
  BLOWING:        { color: '#663300', icon: '💨', label: 'Blowing Survey' },
  OFCBLOWING:     { color: '#0EA5E9', icon: '🧵', label: 'OFC Blowing' },
};

const baseUrl = import.meta.env.VITE_Image_URL;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;


// ─── InfoWindow ───────────────────────────────────────────────────────────────

const InfoWindow: React.FC<{
  event: Activity;
  onClose: () => void;
  onImageClick: (url: string) => void;
}> = ({ event, onClose, onImageClick }) => {
  const eventPhotoFields: Record<string, keyof Activity> = {
    FPOI: 'fpoiPhotos',
    DEPTH: 'depthPhoto',
    JOINTCHAMBER: 'jointChamberPhotos',
    MANHOLES: 'manholePhotos',
    LANDMARK: 'landmarkPhotos',
    KILOMETERSTONE: 'kilometerstonePhotos',
    FIBERTURN: 'fiberTurnPhotos',
    ROUTEINDICATOR: 'routeIndicatorPhotos',
    STARTPIT: 'startPitPhotos',
    ENDPIT: 'endPitPhotos',
    STARTSURVEY: 'startPointPhoto',
    ROADCROSSING: 'crossingPhotos',
    ENDSURVEY: 'endPointPhoto',
    HOLDSURVEY: 'holdPhotos',
    BLOWING: 'blowingPhotos',
    OFCBLOWING: 'blowingPhotos',
  };

  const getLatLongForEvent = (row: Activity) => {
    switch (row.eventType) {
      case 'FPOI':          return row.fpoiLatLong;
      case 'DEPTH':         return row.depthLatlong;
      case 'JOINTCHAMBER':  return row.jointChamberLatLong;
      case 'MANHOLES':      return row.manholeLatLong;
      case 'LANDMARK':      return row.landmarkLatLong;
      case 'KILOMETERSTONE':return row.kilometerstoneLatLong;
      case 'FIBERTURN':     return row.fiberTurnLatLong;
      case 'ROUTEINDICATOR':return row.routeIndicatorLatLong;
      case 'STARTPIT':      return row.startPitLatlong;
      case 'ENDPIT':        return row.endPitLatlong;
      case 'STARTSURVEY':   return row.startPointCoordinates;
      case 'ENDSURVEY':     return row.endPointCoordinates;
      case 'ROADCROSSING':  return row.crossingLatlong;
      case 'HOLDSURVEY':    return row.holdLatlong;
      case 'BLOWING':
      case 'OFCBLOWING':    return row.blowingLatLong;
      default:              return null;
    }
  };

  const getEventPhotos = (event: Activity): string[] => {
    const photos: string[] = [];
    const addImages = (rawPhotoData: any) => {
      if (typeof rawPhotoData === 'string' && rawPhotoData.trim() !== '') {
        try {
          const parsed = JSON.parse(rawPhotoData);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: string) => { if (typeof p === 'string' && p.trim()) photos.push(p.trim()); });
          } else if (typeof parsed === 'string' && parsed.trim()) {
            photos.push(parsed.trim());
          }
        } catch {
          photos.push(rawPhotoData.trim());
        }
      }
    };
    const photoField = eventPhotoFields[event.eventType];
    addImages(photoField ? event[photoField] : null);
    if (event.eventType === 'JOINTCHAMBER' || event.eventType === 'MANHOLES') {
      addImages(event[eventPhotoFields['DEPTH']]);
    }
    return photos;
  };

  const photos = getEventPhotos(event);
  const eventConfig = EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES];

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-sm w-80 max-h-96 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{eventConfig?.icon}</span>
            <h3 className="font-semibold text-sm">{eventConfig?.label}</h3>
            <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">{event.survey_id}</span>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="p-4 max-h-80 overflow-y-auto">
        <div className="space-y-3">
          {event.id && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Event Id:</span>
              <span className="font-medium text-sm">{event.id}</span>
            </div>
          )}
          {event.machine_registration_number && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Machine Id:</span>
              <span className="font-medium text-sm">{event.machine_registration_number}</span>
            </div>
          )}
          {event.firm_name && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Firm Name:</span>
              <span className="font-medium text-sm">{event.firm_name}</span>
            </div>
          )}
          {event.start_lgd_name && event.end_lgd_name && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Link Name:</span>
              <span className="font-medium text-sm">{event.start_lgd_name}_{event.end_lgd_name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Coordinates:</span>
            <span className="font-medium text-sm">{getLatLongForEvent(event)}</span>
          </div>
          {event.depthMeters && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Depth:</span>
              <span className="font-medium text-sm">{event.depthMeters}m</span>
            </div>
          )}
          {event.distance && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Distance:</span>
              <span className="font-medium text-sm">{event.distance}</span>
            </div>
          )}
          {event.soilType && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Soil Type:</span>
              <span className="font-medium text-sm">{event.soilType}</span>
            </div>
          )}
          {event.roadType && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Road Type:</span>
              <span className="font-medium text-sm">{event.roadType}</span>
            </div>
          )}
          {event.landmark_type && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Land Mark Type:</span>
              <span className="font-medium text-sm">{event.landmark_type}</span>
            </div>
          )}
          {event.landmark_description && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Land Mark Description:</span>
              <span className="font-medium text-sm">{event.landmark_description}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Created:</span>
            <span className="font-medium text-sm">{moment(event.created_at).format('DD/MM/YYYY, hh:mm A')}</span>
          </div>
          {photos.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Photos:</h4>
              <div className="grid grid-cols-2 gap-2">
                {photos.slice(0, 5).map((photo: string, idx: number) => (
                  <div
                    key={idx}
                    className="relative aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onImageClick(`${baseUrl}${photo}`)}
                  >
                    <img src={`${baseUrl}${photo}`} alt={`${event.eventType} photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                      <ZoomIn className="text-white opacity-0 hover:opacity-100 transition-opacity" size={16} />
                    </div>
                  </div>
                ))}
              </div>
              {photos.length > 5 && <p className="text-xs text-gray-500 mt-1">+{photos.length - 5} more photos</p>}
            </div>
          )}
          {typeof event.videoDetails === 'string' && (() => {
            try {
              const parsed = JSON.parse(event.videoDetails);
              const url = parsed?.videoUrl?.trim().replace(/(^"|"$)/g, '') ?? null;
              if (url) {
                return <iframe width="100%" height="180" src={`${baseUrl}${url}`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen title={`Video-${event.eventType}`} />;
              }
              return <p>No video available.</p>;
            } catch {
              return <p>No video available.</p>;
            }
          })()}
        </div>
      </div>
    </div>
  );
};

// ─── Loading / Error shells ───────────────────────────────────────────────────

const LoadingComponent = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
      <p className="text-gray-600">Loading Google Maps…</p>
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

// ─── Submit status type ───────────────────────────────────────────────────────

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

// ─── Core Map Component ───────────────────────────────────────────────────────

const MapComponent: React.FC<MapCompProps> = ({
  data,
  eventData = [],
  planningPlacemarks = [],
  planningCategories = [],
  visiblePlanningCategories: externalVisibleCategories,
  onPlanningCategoryVisibilityChange,
  submitApiUrl = `${TraceBASEURL}/bulk-update-coordinates`,
  onReload,
}) => {
  const mapRef  = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // marker instances keyed by marker data id
  const markerInstancesRef = useRef<Map<number, google.maps.Marker>>(new Map());

  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Activity | null>(null);
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<string>>(
    new Set(['DEPTH', 'STARTPIT', 'ENDPIT']),
  );
  const [showPolylines, setShowPolylines] = useState(true);
  const [showPlanning, setShowPlanning]   = useState(true);
  const [showFilters, setShowFilters]     = useState(false);
  const [zoomImage, setZoomImage]         = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Drag / undo / submit state ────────────────────────────────────────────

  const positionOverridesRef = useRef<Map<number, PositionOverride>>(new Map());
  const [renderTick, setRenderTick] = useState(0);
  const bumpRender = useCallback(() => setRenderTick(t => t + 1), []);

  // undoStack also lives in a ref so undo/reset closures read fresh state.
  const undoStackRef = useRef<DragChange[]>([]);
  const [undoStack, setUndoStack] = useState<DragChange[]>([]);   // mirrors ref for UI

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [showChangesPanel, setShowChangesPanel] = useState(false);

  /** All markers that have been moved (net position differs from original) */
  const changedMarkers = useMemo(() => {
    const result: Array<{ id: number; eventType: string; surveyId: number; origLat: number; origLng: number; newLat: number; newLng: number }> = [];
    positionOverridesRef.current.forEach((pos, id) => {
      const original = data.find(d => d.id === id);
      if (!original) return;
      if (original.lat !== pos.lat || original.lng !== pos.lng) {
        result.push({
          id,
          eventType: original.eventType,
          surveyId: original.survey_id,
          origLat: original.lat,
          origLng: original.lng,
          newLat: pos.lat,
          newLng: pos.lng,
        });
      }
    });
    return result;
  // renderTick is the actual dependency — the ref mutates silently
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderTick, data]);

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || map) return;
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: data.length > 0 ? { lat: data[0].lat, lng: data[0].lng } : { lat: 20.5937, lng: 78.9629 },
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: true,
      zoomControl: true,
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
    });
    setMap(mapInstance);
  }, [data, map]);

  // ── Record a drag change ──────────────────────────────────────────────────
  const recordDrag = useCallback((
    id: number,
    eventType: string,
    surveyId: number,
    prevLat: number,
    prevLng: number,
    newLat: number,
    newLng: number,
  ) => {
    const change: DragChange = { id, eventType, surveyId, prevLat, prevLng, newLat, newLng, timestamp: Date.now() };
    // Mutate refs synchronously — no stale-closure risk
    undoStackRef.current = [...undoStackRef.current, change];
    positionOverridesRef.current = new Map(positionOverridesRef.current);
    positionOverridesRef.current.set(id, { lat: newLat, lng: newLng });
    // Mirror to state for UI
    setUndoStack([...undoStackRef.current]);
    setSubmitStatus('idle');
    setSubmitError(null);
    bumpRender();
  }, [bumpRender]);

  // ── Undo last drag ────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const last = stack[stack.length - 1];

    // Move the marker back visually
    const markerInstance = markerInstancesRef.current.get(last.id);
    if (markerInstance) {
      markerInstance.setPosition({ lat: last.prevLat, lng: last.prevLng });
    }

    // Pop from stack ref
    undoStackRef.current = stack.slice(0, -1);

    // Update overrides: revert to the position before this specific drag
    const newOverrides = new Map(positionOverridesRef.current);
    const earlierEntry = [...undoStackRef.current]
      .reverse()
      .find(c => c.id === last.id);
    if (earlierEntry) {
      newOverrides.set(last.id, { lat: earlierEntry.newLat, lng: earlierEntry.newLng });
    } else {
      newOverrides.delete(last.id); // fully reverted to original
    }
    positionOverridesRef.current = newOverrides;

    // Sync UI state
    setUndoStack([...undoStackRef.current]);
    setSubmitStatus('idle');
    setSubmitError(null);
    bumpRender();
  }, [bumpRender]);

  // ── Reset all changes ─────────────────────────────────────────────────────
  const handleResetAll = useCallback(() => {
    // Restore every moved marker to its original data position
    markerInstancesRef.current.forEach((markerInstance, id) => {
      const original = data.find(d => d.id === id);
      if (original) {
        markerInstance.setPosition({ lat: original.lat, lng: original.lng });
      }
    });
    undoStackRef.current = [];
    positionOverridesRef.current = new Map();
    setUndoStack([]);
    setSubmitStatus('idle');
    setSubmitError(null);
    bumpRender();
  }, [data, bumpRender]);

  // ── Submit changes to API ─────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (changedMarkers.length === 0) return;
    setSubmitStatus('loading');
    setSubmitError(null);
    try {
      const payload = {
        changes: changedMarkers.map(m => ({
          id: m.id,
          event_type: m.eventType,
          survey_id: m.surveyId,
          lat: m.newLat,
          lng: m.newLng,
        }))
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
      // Clear history after successful save  
      undoStackRef.current = [];
      positionOverridesRef.current = new Map();
      setUndoStack([]);
      bumpRender();
      onReload()
      
    } catch (err: any) {
      setSubmitStatus('error');
      setSubmitError(err.message ?? 'Failed to save changes');
    }
  }, [changedMarkers, submitApiUrl]);

  // ── Create / update markers ───────────────────────────────────────────────
  useEffect(() => {
    if (!map || !data.length) {
      markerInstancesRef.current.forEach(m => m.setMap(null));
      markerInstancesRef.current.clear();
      return;
    }

    const existingIds = new Set(markerInstancesRef.current.keys());
    const incomingIds = new Set(
      data.filter(p => visibleEventTypes.has(p.eventType)).map(p => p.id),
    );

    // Remove markers no longer visible
    existingIds.forEach(id => {
      if (!incomingIds.has(id)) {
        markerInstancesRef.current.get(id)?.setMap(null);
        markerInstancesRef.current.delete(id);
      }
    });

    const bounds = new google.maps.LatLngBounds();
    let markerCount = 0;

    data
      .filter(p => visibleEventTypes.has(p.eventType))
      .forEach((point, index) => {
        const eventConfig = EVENT_TYPES[point.eventType as keyof typeof EVENT_TYPES];
        if (!eventConfig) return;

        const eventDetails = eventData.find(e => e.id === point.id);
        // Use overridden position if available
        const override = positionOverridesRef.current.get(point.id);
        const lat = override?.lat ?? point.lat;
        const lng = override?.lng ?? point.lng;
        const hasMoved = override !== undefined &&
          (override.lat !== point.lat || override.lng !== point.lng);

        if (markerInstancesRef.current.has(point.id)) {
          // Update existing marker visibility and position
          const existing = markerInstancesRef.current.get(point.id)!;
          existing.setMap(map);
          // Update icon to reflect moved state
          existing.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: hasMoved ? 10 : 8,
            fillColor: eventConfig.color,
            fillOpacity: 0.9,
            strokeColor: hasMoved ? '#ffffff' : '#ffffff',
            strokeWeight: hasMoved ? 3 : 2,
          });
          bounds.extend({ lat, lng });
          markerCount++;
          return;
        }

        // Create new marker
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: `${eventConfig.label} — ${point.eventType} — Survey: ${point.survey_id}`,
          label: {
            text: (index + 1).toString(),
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: eventConfig.color,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          draggable: true, // ← enable drag
          animation: google.maps.Animation.DROP,
          cursor: 'grab',
        });

        // Click → open info window
        marker.addListener('click', () => {
          if (eventDetails) setSelectedEvent(eventDetails);
        });

        // Drag start → change cursor & close any open info
        marker.addListener('dragstart', () => {
          setSelectedEvent(null);
          marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 11,
            fillColor: eventConfig.color,
            fillOpacity: 1,
            strokeColor: '#facc15',  // yellow ring while dragging
            strokeWeight: 3,
          });
        });

        // Drag end → record change
        marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
          const newPos = e.latLng;
          if (!newPos) return;
          // Read prevLat/prevLng from the overrides ref (current known position)
          // NOT from marker.getPosition() which already reflects the new position
          const override = positionOverridesRef.current.get(point.id);
          const prevLat = override?.lat ?? point.lat;
          const prevLng = override?.lng ?? point.lng;

          const newLat = newPos.lat();
          const newLng = newPos.lng();

          // Restore normal icon (slightly larger to indicate it was moved)
          marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: eventConfig.color,
            fillOpacity: 0.95,
            strokeColor: '#facc15',  // keep yellow ring to signal "changed"
            strokeWeight: 2.5,
          });

          recordDrag(point.id, point.eventType, point.survey_id, prevLat, prevLng, newLat, newLng);
        });

        markerInstancesRef.current.set(point.id, marker);
        bounds.extend({ lat, lng });
        markerCount++;
      });

    if (markerCount > 0) map.fitBounds(bounds);
  // positionOverridesRef is a ref — not in deps. renderTick drives icon updates.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, data, visibleEventTypes, eventData, renderTick, recordDrag]);

  // ── Polylines ─────────────────────────────────────────────────────────────
  useEffect(() => {
    polylines.forEach(p => p.setMap(null));
    if (!map || !data.length || !showPolylines) {
      setPolylines([]);
      return;
    }
    const hasVisible = data.some(p => visibleEventTypes.has(p.eventType));
    if (!hasVisible) { setPolylines([]); return; }

    const grouped = data.reduce((acc: Record<number, MarkerData[]>, pt) => {
      if (!acc[pt.survey_id]) acc[pt.survey_id] = [];
      acc[pt.survey_id].push(pt);
      return acc;
    }, {});

    const newPolylines: google.maps.Polyline[] = [];
    Object.values(grouped).forEach(pts => {
      const sorted = [...pts].sort((a: any, b: any) => (a.index_id ?? a.id) - (b.index_id ?? b.id));
      const path = sorted
        .filter(p => visibleEventTypes.has(p.eventType))
        .map(p => {
          const ov = positionOverridesRef.current.get(p.id);
          return { lat: ov?.lat ?? p.lat, lng: ov?.lng ?? p.lng };
        });
      if (path.length > 1) {
        newPolylines.push(new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#3B82F6',
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map,
        }));
      }
    });
    setPolylines(newPolylines);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, data, visibleEventTypes, showPolylines, renderTick]);

  // ── Planning placemarks ───────────────────────────────────────────────────
  const planningConfigMap = useMemo(() => {
    const m: Record<string, { color: string; icon: string }> = {};
    planningCategories.forEach(cat => { m[cat.id] = { color: cat.color, icon: cat.icon }; });
    return m;
  }, [planningCategories]);

  const categoryIdForPlacemark = (pm: ProcessedDesktopPlanning) => {
    const cat = planningCategories.find(c => c.name === pm.category);
    return cat ? cat.id : pm.category.toLowerCase().replace(/[^a-z0-9]/g, '-');
  };

  const isCategoryVisible = (catId: string) =>
    !externalVisibleCategories || externalVisibleCategories.has(catId);

  useEffect(() => {
    if (!map || !showPlanning) return;
    const planMarkers: google.maps.Marker[] = [];
    const planPolylines: google.maps.Polyline[] = [];

    planningPlacemarks.forEach(pm => {
      const catId  = categoryIdForPlacemark(pm);
      if (!isCategoryVisible(catId)) return;
      const config = planningConfigMap[catId] ?? { color: '#6B7280', icon: '📍' };

      if (pm.type === 'point') {
        const coord = pm.coordinates as { lat: number; lng: number };
        const m = new google.maps.Marker({
          position: coord,
          map,
          title: pm.name,
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: config.color, fillOpacity: 0.9, strokeColor: '#fff', strokeWeight: 2 },
        });
        m.addListener('click', () => {
          new google.maps.InfoWindow({ content: `<div style="padding:4px;font-size:13px"><strong>${pm.name}</strong><br/>${pm.category}</div>` }).open(map, m);
        });
        planMarkers.push(m);
      } else {
        planPolylines.push(new google.maps.Polyline({
          path: pm.coordinates as { lat: number; lng: number }[],
          geodesic: true,
          strokeColor: config.color,
          strokeOpacity: 0.7,
          strokeWeight: 2,
          map,
        }));
      }
    });

    return () => {
      planMarkers.forEach(m => m.setMap(null));
      planPolylines.forEach(p => p.setMap(null));
    };
  }, [map, planningPlacemarks, planningCategories, showPlanning, externalVisibleCategories, planningConfigMap]);

  // ── Filter helpers ────────────────────────────────────────────────────────
  const toggleEventType = (et: string) => {
    setVisibleEventTypes(prev => {
      const next = new Set(prev);
      next.has(et) ? next.delete(et) : next.add(et);
      return next;
    });
  };

  const toggleAllEventTypes = () => {
    setVisibleEventTypes(prev => prev.size === 0 ? new Set(Object.keys(EVENT_TYPES)) : new Set());
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showFilters && filterRef.current && !filterRef.current.contains(e.target as Node))
        setShowFilters(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilters]);

  const getEventTypeCount = (et: string) => data.filter(p => p.eventType === et).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      {/* Map canvas */}
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />

      {/* ── Top-right controls ── */}
      <div ref={filterRef} className="absolute top-2 right-10 z-10">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              <Filter size={14} /> Filters
            </button>
            <button
              onClick={() => setShowPolylines(!showPolylines)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors text-sm ${
                showPolylines ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Navigation size={14} /> Routes
            </button>
            <button
              onClick={() => setShowPlanning(!showPlanning)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors text-sm ${
                showPlanning ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <MapPin size={14} /> Approved KMZ
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-md p-3 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-700">Event Types</h4>
                <button onClick={toggleAllEventTypes} className="text-xs text-blue-600 hover:text-blue-800">
                  {visibleEventTypes.size === 0 ? 'Show All' : 'Hide All'}
                </button>
              </div>
              <div className="space-y-1">
                {Object.entries(EVENT_TYPES).map(([et, config]) => {
                  const count = getEventTypeCount(et);
                  const isVisible = visibleEventTypes.has(et);
                  return (
                    <div key={et} className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer" onClick={() => toggleEventType(et)}>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span className="text-sm">{config.icon}</span>
                        </div>
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">({count})</span>
                        <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: isVisible ? config.color : 'transparent' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {planningCategories.length > 0 && (
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm text-gray-700">Approved KMZ Types</h4>
                    <button
                      onClick={() => {
                        const anyVisible = planningCategories.some(c => externalVisibleCategories?.has(c.id));
                        planningCategories.forEach(c => onPlanningCategoryVisibilityChange?.(c.id, !anyVisible));
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {planningCategories.some(c => externalVisibleCategories?.has(c.id)) ? 'Hide All' : 'Show All'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    {planningCategories.map(cat => {
                      const isVisible = externalVisibleCategories?.has(cat.id) ?? true;
                      return (
                        <div key={cat.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer" onClick={() => onPlanningCategoryVisibilityChange?.(cat.id, !isVisible)}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                              <span className="text-sm">{cat.icon}</span>
                            </div>
                            <span className="text-sm font-medium">{cat.name.replace('Desktop:', '').trim() || cat.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">({cat.count})</span>
                            <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: isVisible ? cat.color : 'transparent' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Drag-edit toolbar (appears when there are changes) ── */}
      {(undoStack.length > 0 || submitStatus !== 'idle') && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-xl px-3 py-2 pointer-events-auto border border-gray-100">
            {/* Undo */}
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0 || submitStatus === 'loading'}
              title="Undo last move"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                enabled:bg-gray-100 enabled:hover:bg-gray-200 text-gray-700"
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

            {/* Changes badge */}
            <button
              onClick={() => setShowChangesPanel(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
            >
              <GripVertical size={14} />
              {changedMarkers.length} moved
            </button>

            <div className="w-px h-5 bg-gray-200" />

            {/* Reset all */}
            <button
              onClick={handleResetAll}
              disabled={submitStatus === 'loading'}
              title="Reset all markers to original positions"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                disabled:opacity-40 disabled:cursor-not-allowed
                enabled:bg-red-50 enabled:hover:bg-red-100 text-red-600 transition-colors"
            >
              <X size={14} />
              Reset all
            </button>

            <div className="w-px h-5 bg-gray-200" />

            {/* Submit */}
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
              {submitStatus === 'error'   && <AlertCircle size={14} />}
              {submitStatus === 'idle'    && <Send size={14} />}
              {submitStatus === 'loading' ? 'Saving…'
                : submitStatus === 'success' ? 'Saved!'
                : submitStatus === 'error'   ? 'Retry'
                : 'Save changes'}
            </button>
          </div>

          {/* Error message */}
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
                      {EVENT_TYPES[cm.eventType as keyof typeof EVENT_TYPES]?.label ?? cm.eventType}
                    </span>
                    <span className="text-gray-400">ID {cm.id}</span>
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                      Survey {cm.surveyId}
                    </span>
                  </div>
                  <div className="text-gray-400 font-mono">
                    <span className="line-through">{cm.origLat.toFixed(6)}, {cm.origLng.toFixed(6)}</span>
                    <span className="mx-1.5 text-gray-300">→</span>
                    <span className="text-gray-600">{cm.newLat.toFixed(6)}, {cm.newLng.toFixed(6)}</span>
                  </div>
                </div>
                {/* Per-row undo: undo all moves for this id */}
                <button
                  onClick={() => {
                    // Revert this marker to its original data position
                    const original = data.find(d => d.id === cm.id);
                    if (original) {
                      markerInstancesRef.current.get(cm.id)?.setPosition({ lat: original.lat, lng: original.lng });
                    }
                    // Remove all undo entries for this id
                    undoStackRef.current = undoStackRef.current.filter(c => c.id !== cm.id);
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

      {/* ── Bottom-left legend ── */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm text-gray-700">Events</h4>
            {changedMarkers.length === 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <GripVertical size={11} /> Drag markers to reposition
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(EVENT_TYPES).map(([et, config]) => {
              const count = getEventTypeCount(et);
              const isVisible = visibleEventTypes.has(et);
              if (count === 0) return null;
              return (
                <div key={et} className={`flex items-center gap-1 ${isVisible ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                  <span>{config.label} ({count})</span>
                </div>
              );
            })}
          </div>
          {planningCategories.length > 0 && (
            <div className="text-xs space-y-1 mt-2 pt-2 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 flex items-center gap-1">
                <MapPin size={12} className="text-emerald-500" />
                Approved KMZ ({planningCategories.reduce((s, c) => s + c.count, 0)})
              </h4>
              {planningCategories.map(cat => {
                const isVisible = externalVisibleCategories?.has(cat.id) ?? true;
                return (
                  <div key={cat.id} className={`flex justify-between ${isVisible && showPlanning ? 'opacity-100' : 'opacity-50'}`}>
                    <span>{cat.icon} {cat.name.replace('Desktop:', '').trim() || cat.name}</span>
                    <span>{cat.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── InfoWindow overlay ── */}
      {selectedEvent && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <InfoWindow event={selectedEvent} onClose={() => setSelectedEvent(null)} onImageClick={setZoomImage} />
        </div>
      )}

      {/* ── Image zoom modal ── */}
      {zoomImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={() => setZoomImage(null)}>
          <div className="relative max-w-4xl max-h-4xl p-4">
            <button onClick={() => setZoomImage(null)} className="absolute top-2 right-2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2">
              <X size={20} />
            </button>
            <img src={zoomImage} alt="Zoomed" className="max-w-full max-h-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Root component with Maps loader ─────────────────────────────────────────

const MapComp: React.FC<MapCompProps> = (props) => {
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) { setError('Google Maps API key is not configured'); setIsLoading(false); return; }

    GoogleMapsLoader.getInstance()
      .loadGoogleMaps(apiKey, ['places', 'geometry'])
      .then(() => { setIsMapReady(true); setIsLoading(false); })
      .catch(err => { setError(err.message || 'Failed to load Google Maps'); setIsLoading(false); });
  }, []);

  if (isLoading || !isMapReady) return <LoadingComponent />;
  if (error) return <ErrorComponent message={error} />;

  return <MapComponent {...props} />;
};

export default MapComp;