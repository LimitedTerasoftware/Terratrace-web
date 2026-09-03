import axios from 'axios';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, Camera, Loader2, X, ZoomIn } from 'lucide-react';
import moment from 'moment';
import GoogleMapsLoader from '../hooks/googleMapsLoader';
import type { JointEnclosure, Landmark, PoleString } from '../../types/aerial-survey';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const baseUrl = import.meta.env.VITE_Image_URL;

interface ProgressPoleMarker {
  id: number;
  lat: number;
  lng: number;
  eventType: string;
  surveyId: number;
  orderIndex: number;
  /** Joint Enclosure's jointType, when present — lets joint markers be
   * styled/grouped by joint type instead of all sharing one look. */
  subType?: string;
}

const parseSurveyIdsParam = (value: string | null): number[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
};

// Only pole points are stitched into the pole-stringing polyline — every
// other event type (Landmark, Joint Enclosure, Drum, ...) is a standalone
// marker, mirroring how UGProgressMap only connects path-only event types.
const CONNECT_EVENT_TYPES = new Set(['POLE']);

type MarkerShape =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'pentagon';

const EVENT_POINT_STYLES: Record<
  string,
  { color: string; label: string; shape: MarkerShape }
> = {
  LANDMARK: { color: '#10B981', label: 'Landmark', shape: 'square' },
  'JOINT ENCLOUSER': {
    color: '#8B5CF6',
    label: 'Joint Enclosure',
    shape: 'diamond',
  },
  DRUM: { color: '#F59E0B', label: 'Drum', shape: 'triangle' },
};


const FALLBACK_SHAPES: MarkerShape[] = [
  'square',
  'pentagon',
  'circle',
  'triangle',
  'diamond',
];
const FALLBACK_COLORS = [
  '#EF4444', // red
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#EC4899', // pink
  '#84CC16', // lime
  '#0EA5E9', // sky
  '#A855F7', // purple
];

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const humanizeEventType = (eventType: string) =>
  eventType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getFallbackStyle = (
  eventType: string,
): { color: string; label: string; shape: MarkerShape } => {
  const hash = hashString(eventType);
  return {
    color: FALLBACK_COLORS[hash % FALLBACK_COLORS.length],
    shape: FALLBACK_SHAPES[Math.floor(hash / FALLBACK_COLORS.length) % FALLBACK_SHAPES.length],
    label: humanizeEventType(eventType),
  };
};

// The pole-stringing API returns this event type under more than one
// spelling/format across datasets — the historical typo used elsewhere in
// this app ("JOINT ENCLOUSER", with a space) and the correctly spelled,
// unspaced form ("JOINTENCLOSURE") — plus arbitrary case. Normalize before
// comparing so both resolve to the same style/grouping.
const normalizeEventTypeKey = (value: string) =>
  value.trim().toUpperCase().replace(/[\s_-]/g, '');

const NORMALIZED_EVENT_POINT_STYLES = new Map<
  string,
  { color: string; label: string; shape: MarkerShape }
>(
  Object.entries(EVENT_POINT_STYLES).map(([key, value]) => [
    normalizeEventTypeKey(key),
    value,
  ]),
);
NORMALIZED_EVENT_POINT_STYLES.set(
  normalizeEventTypeKey('JOINTENCLOSURE'),
  EVENT_POINT_STYLES['JOINT ENCLOUSER'],
);

const JOINT_ENCLOSURE_KEYS = new Set(
  ['JOINT ENCLOUSER', 'JOINTENCLOSURE'].map(normalizeEventTypeKey),
);
const isJointEnclosureEventType = (eventType: string) =>
  JOINT_ENCLOSURE_KEYS.has(normalizeEventTypeKey(eventType));

const getPointStyle = (
  eventType: string,
): { color: string; label: string; shape: MarkerShape } =>
  NORMALIZED_EVENT_POINT_STYLES.get(normalizeEventTypeKey(eventType)) ??
  getFallbackStyle(eventType);

/** Groups markers for the legend/visibility toggle — Joint Enclosure markers
 * group by jointType (when recorded) instead of all sharing one bucket. */
const getMarkerGroupKey = (
  marker: Pick<ProgressPoleMarker, 'eventType' | 'subType'>,
): string =>
  isJointEnclosureEventType(marker.eventType) && marker.subType
    ? `${marker.eventType}::${marker.subType}`
    : marker.eventType;

/** Resolves the shape/color/label actually drawn for a marker — Joint
 * Enclosure markers get a distinct look per jointType (hashed, same
 * mechanism as the unknown-eventType fallback) instead of one flat style. */
// The user wants the joint type itself as the title/label — not the
// generic "Joint Enclosure" name — so the label is just marker.subType,
// with no "Joint Enclosure -" prefix, whenever a joint type is recorded.
const getMarkerStyle = (
  marker: Pick<ProgressPoleMarker, 'eventType' | 'subType'>,
): { color: string; label: string; shape: MarkerShape } => {
  if (isJointEnclosureEventType(marker.eventType) && marker.subType) {
    const { color, shape } = getFallbackStyle(getMarkerGroupKey(marker));
    return { color, shape, label: marker.subType };
  }
  return getPointStyle(marker.eventType);
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[char] ?? char;
  });

// Regular polygon vertices, centered at (cx, cy), first point pointing up.
const polygonPoints = (
  sides: number,
  cx: number,
  cy: number,
  radius: number,
) => {
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (-90 + (360 / sides) * i) * (Math.PI / 180);
    points.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return points.join(' ');
};

// Five-pointed star, alternating outer/inner vertices, centered at (cx, cy).
const starPoints = (
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
) => {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (-90 + 36 * i) * (Math.PI / 180);
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push(
      `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return points.join(' ');
};

const buildLabeledShapeIcon = (
  shape: MarkerShape,
  color: string,
  size = 16,
  strokeWidth = 2,
): google.maps.Icon => {
  const dimension = size + strokeWidth * 2;
  const center = dimension / 2;
  const inset = strokeWidth;

  let shapeSvg: string;
  switch (shape) {
    case 'square':
      shapeSvg = `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" fill="${color}" stroke="#ffffff" stroke-width="${strokeWidth}"/>`;
      break;
    case 'diamond':
      shapeSvg = `<polygon points="${center},${inset} ${dimension - inset},${center} ${center},${dimension - inset} ${inset},${center}" fill="${color}" stroke="#ffffff" stroke-width="${strokeWidth}"/>`;
      break;
    case 'triangle':
      shapeSvg = `<polygon points="${center},${inset} ${dimension - inset},${dimension - inset} ${inset},${dimension - inset}" fill="${color}" stroke="#ffffff" stroke-width="${strokeWidth}"/>`;
      break;
    case 'star':
      shapeSvg = `<polygon points="${starPoints(center, center, size / 2, size / 4.2)}" fill="${color}" stroke="#ffffff" stroke-width="${strokeWidth}"/>`;
      break;
    case 'pentagon':
      shapeSvg = `<polygon points="${polygonPoints(5, center, center, size / 2)}" fill="${color}" stroke="#ffffff" stroke-width="${strokeWidth}"/>`;
      break;
    default:
      shapeSvg = `<circle cx="${center}" cy="${center}" r="${size / 2}" fill="${color}" stroke="#ffffff" stroke-width="${strokeWidth}"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimension}" height="${dimension}">${shapeSvg}</svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(dimension, dimension),
    anchor: new google.maps.Point(center, center),
    labelOrigin: new google.maps.Point(center, -8),
  };
};

const ShapeSwatch: React.FC<{ shape: MarkerShape; color: string }> = ({
  shape,
  color,
}) => {
  if (shape === 'square') {
    return <span className="h-2.5 w-2.5 flex-none" style={{ backgroundColor: color }} />;
  }
  if (shape === 'diamond') {
    return (
      <span
        className="h-2 w-2 flex-none rotate-45"
        style={{ backgroundColor: color }}
      />
    );
  }
  if (shape === 'triangle') {
    return (
      <span
        className="h-0 w-0 flex-none border-l-[5px] border-r-[5px] border-b-[9px] border-l-transparent border-r-transparent"
        style={{ borderBottomColor: color }}
      />
    );
  }
  if (shape === 'star') {
    return (
      <svg width="11" height="11" viewBox="0 0 11 11" className="flex-none">
        <polygon points={starPoints(5.5, 5.5, 5.5, 2.4)} fill={color} />
      </svg>
    );
  }
  if (shape === 'pentagon') {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" className="flex-none">
        <polygon points={polygonPoints(5, 5, 5, 5)} fill={color} />
      </svg>
    );
  }
  return (
    <span
      className="h-2 w-2 flex-none rounded-full"
      style={{ backgroundColor: color }}
    />
  );
};

const resolveImageUrl = (value: string) =>
  value.startsWith('http') ? value : `${baseUrl}${value}`;

// Some pole-stringing records deliver joint_enclosure/landmark as JSON
// strings rather than already-parsed objects — parse defensively so a
// stringified payload doesn't silently hide fields behind a no-op '?.'.
const parseNestedField = <T,>(raw: unknown): T | null => {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }
  return raw as T;
};

const getJointEnclosure = (record: PoleString): JointEnclosure | null =>
  parseNestedField<JointEnclosure>(record.joint_enclosure);

const getLandmark = (record: PoleString): Landmark | null =>
  parseNestedField<Landmark>(record.landmark);

const getRecordPhotos = (record: PoleString): string[] => {
  const photos = new Set<string>();
  if (record.image) photos.add(record.image);
  record.images?.forEach((img) => img && photos.add(img));
  getJointEnclosure(record)?.jointImages?.forEach(
    (img) => img && photos.add(img),
  );
  getLandmark(record)?.images?.forEach((img) => img && photos.add(img));
  return Array.from(photos);
};

const getRecordVideoUrl = (record: PoleString): string | null => {
  if (
    typeof record.video === 'string' &&
    record.video.trim() !== '' &&
    record.video !== 'null'
  ) {
    return record.video.trim();
  }
  return null;
};

const buildMarkers = (records: PoleString[]): ProgressPoleMarker[] =>
  records
    .filter((record) => {
      const lat = Number(record.latitude);
      const lng = Number(record.longitude);
      return (
        record.is_active === 1 &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
      );
    })
    .map((record) => ({
      id: record.id,
      lat: Number(record.latitude),
      lng: Number(record.longitude),
      eventType: record.eventType,
      surveyId: record.survey_id ?? 0,
      orderIndex: record.order_index || record.id,
      subType: getJointEnclosure(record)?.jointType?.trim() || undefined,
    }));

const LoadingState: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex h-full min-h-[420px] items-center justify-center">
    <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      {label}
    </div>
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-full min-h-[420px] items-center justify-center">
    <div className="flex max-w-md items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
      <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
      <div>
        <p className="font-semibold">Unable to load progress map</p>
        <p className="mt-1 text-sm">{message}</p>
      </div>
    </div>
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between gap-2">
    <span className="text-gray-500 text-sm flex-shrink-0">{label}:</span>
    <span className="font-medium text-sm text-right">{value}</span>
  </div>
);

const MarkerDetailsPanel: React.FC<{
  record: PoleString;
  onClose: () => void;
  onImageClick: (url: string) => void;
}> = ({ record, onClose, onImageClick }) => {
  const jointEnclosure = getJointEnclosure(record);
  const landmark = getLandmark(record);
  const style = getMarkerStyle({
    eventType: record.eventType,
    subType: jointEnclosure?.jointType?.trim() || undefined,
  });
  const photos = getRecordPhotos(record);
  const videoUrl = getRecordVideoUrl(record);

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-sm w-80 max-h-[26rem] overflow-hidden">
      <div className="p-4 text-white" style={{ backgroundColor: style.color }}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{style.label}</h3>
          <button
            onClick={onClose}
            className="text-white/90 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="p-4 max-h-[22rem] overflow-y-auto space-y-2 text-sm">
        {record.survey_id != null && (
          <Row label="Survey ID" value={String(record.survey_id)} />
        )}
        <Row
          label="Coordinates"
          value={`${record.latitude}, ${record.longitude}`}
        />
        {record.pole_type && <Row label="Pole Type" value={record.pole_type} />}
        {record.line_type && <Row label="Line Type" value={record.line_type} />}
        {record.pole_material && (
          <Row label="Pole Material" value={record.pole_material} />
        )}
        {record.pole_owner && <Row label="Pole Owner" value={record.pole_owner} />}
        {record.pole_height && (
          <Row label="Pole Height" value={record.pole_height} />
        )}
        {record.drum_number && (
          <Row label="Drum Number" value={record.drum_number} />
        )}
        {landmark?.type && <Row label="Landmark Type" value={landmark.type} />}
        {landmark?.description && (
          <Row label="Landmark Description" value={landmark.description} />
        )}
        {jointEnclosure?.jointType && (
          <Row label="Joint Type" value={jointEnclosure.jointType} />
        )}
        {record.start_lgd_name && record.end_lgd_name && (
          <Row
            label="GP Link"
            value={`${record.start_lgd_name} → ${record.end_lgd_name}`}
          />
        )}
        {record.state_name && <Row label="State" value={record.state_name} />}
        {record.district_name && (
          <Row label="District" value={record.district_name} />
        )}
        {record.block_name && <Row label="Block" value={record.block_name} />}
  

        {photos.length > 0 && (
          <div className="pt-1">
            <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Camera size={12} /> Photos
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {photos.slice(0, 6).map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity group"
                  onClick={() => onImageClick(resolveImageUrl(photo))}
                >
                  <img
                    src={resolveImageUrl(photo)}
                    alt={`${style.label} photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      size={16}
                    />
                  </div>
                </div>
              ))}
            </div>
            {photos.length > 6 && (
              <p className="text-xs text-gray-500 mt-1">
                +{photos.length - 6} more photos
              </p>
            )}
          </div>
        )}

        {videoUrl && (
          <div className="pt-1">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Video</h4>
            <iframe
              width="100%"
              height="160"
              src={resolveImageUrl(videoUrl)}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={`Video-${record.eventType}`}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface AerialProgressMapCompProps {
  records: PoleString[];
  markers: ProgressPoleMarker[];
}

const AerialProgressMapComp: React.FC<AerialProgressMapCompProps> = ({
  records,
  markers,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const routePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const pointMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<PoleString | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [showRoute, setShowRoute] = useState(true);
  const [hiddenMarkerGroups, setHiddenMarkerGroups] = useState<Set<string>>(
    new Set(),
  );

  const toggleMarkerGroup = (groupKey: string) => {
    setHiddenMarkerGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const routePaths = useMemo(() => {
    const grouped = markers
      .filter((marker) => CONNECT_EVENT_TYPES.has(marker.eventType))
      .reduce<Record<number, ProgressPoleMarker[]>>((acc, marker) => {
        if (!acc[marker.surveyId]) acc[marker.surveyId] = [];
        acc[marker.surveyId].push(marker);
        return acc;
      }, {});

    return Object.entries(grouped)
      .map(([surveyId, items]) => {
        const path = [...items]
          .sort((a, b) => a.orderIndex - b.orderIndex || a.id - b.id)
          .map((item) => ({ lat: item.lat, lng: item.lng }));
        return { surveyId: Number(surveyId), path };
      })
      .filter((entry) => entry.path.length > 1);
  }, [markers]);

  // One legend/toggle entry per marker group — Joint Enclosure markers split
  // out by jointType, everything else keyed by eventType alone.
  const pointMarkerGroups = useMemo(() => {
    const groups = new Map<
      string,
      { groupKey: string; marker: ProgressPoleMarker; count: number }
    >();
    markers
      .filter((marker) => !CONNECT_EVENT_TYPES.has(marker.eventType))
      .forEach((marker) => {
        const groupKey = getMarkerGroupKey(marker);
        const existing = groups.get(groupKey);
        if (existing) {
          existing.count += 1;
        } else {
          groups.set(groupKey, { groupKey, marker, count: 1 });
        }
      });
    return Array.from(groups.values());
  }, [markers]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key is not configured');
      setIsLoading(false);
      return;
    }

    let mounted = true;
    GoogleMapsLoader.getInstance()
      .loadGoogleMaps(apiKey, ['places', 'geometry'])
      .then(() => {
        if (!mounted) return;
        setIsLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load Google Maps');
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || error || !mapRef.current || map) return;

    const firstMarker = markers[0];
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: firstMarker
        ? { lat: firstMarker.lat, lng: firstMarker.lng }
        : { lat: 20.5937, lng: 78.9629 },
      zoom: firstMarker ? 14 : 5,
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

    infoWindowRef.current = new google.maps.InfoWindow();
    setMap(mapInstance);
  }, [error, isLoading, map, markers]);

  // Pole-stringing route polyline — one per survey, poles only.
  useEffect(() => {
    if (!map) return;

    routePolylinesRef.current.forEach((polyline) => polyline.setMap(null));

    if (!showRoute) {
      routePolylinesRef.current = [];
      return;
    }

    routePolylinesRef.current = routePaths.flatMap(({ surveyId, path }) => {
      const casing = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#ffffff',
        strokeOpacity: 1,
        strokeWeight: 7,
        zIndex: 998,
        map,
      });

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.95,
        strokeWeight: 4,
        zIndex: 999,
        map,
      });

      polyline.addListener('mouseover', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          infoWindowRef.current?.setContent(`
            <div style="padding:4px 4px;font-size:13px;line-height:1.5">
              <div style="font-weight:700;color:#111827">Survey ID: ${surveyId}</div>
            </div>
          `);
          infoWindowRef.current?.setPosition(e.latLng);
          infoWindowRef.current?.open(map);
        }
      });

      polyline.addListener('mouseout', () => {
        infoWindowRef.current?.close();
      });

      return [casing, polyline];
    });

    return () => {
      routePolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      routePolylinesRef.current = [];
    };
  }, [routePaths, map, showRoute]);

  // Standalone markers — every non-pole event type, never connected.
  useEffect(() => {
    if (!map) return;

    pointMarkersRef.current.forEach((marker) => marker.setMap(null));
    pointMarkersRef.current = markers
      .filter(
        (marker) =>
          !CONNECT_EVENT_TYPES.has(marker.eventType) &&
          !hiddenMarkerGroups.has(getMarkerGroupKey(marker)),
      )
      .map((marker) => {
        const style = getMarkerStyle(marker);
        const pointMarker = new google.maps.Marker({
          position: { lat: marker.lat, lng: marker.lng },
          map,
          title: style.label,
          zIndex: 997,
          icon: buildLabeledShapeIcon(style.shape, style.color, 14),
          label: {
            text: style.label,
            color: '#111827',
            fontSize: '10px',
            fontWeight: '600',
          },
        });

        pointMarker.addListener('click', () => {
          infoWindowRef.current?.close();
          const fullRecord = records.find((record) => record.id === marker.id);
          if (fullRecord) {
            setSelectedRecord(fullRecord);
          } else {
            infoWindowRef.current?.setContent(`
              <div style="padding:4px 4px;font-size:13px;line-height:1.5">
                <div style="font-weight:700;color:${style.color}">${escapeHtml(style.label)}</div>
                <div>Survey ID: ${marker.surveyId}</div>
              </div>
            `);
            infoWindowRef.current?.open(map, pointMarker);
          }
        });

        return pointMarker;
      });

    return () => {
      pointMarkersRef.current.forEach((marker) => marker.setMap(null));
      pointMarkersRef.current = [];
    };
  }, [markers, map, records, hiddenMarkerGroups]);

  useEffect(() => {
    if (!map || !mapRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      google.maps.event.trigger(map, 'resize');
    });
    resizeObserver.observe(mapRef.current);

    return () => resizeObserver.disconnect();
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    let points = 0;

    markers.forEach((marker) => {
      bounds.extend({ lat: marker.lat, lng: marker.lng });
      points += 1;
    });

    if (points === 0) return;
    map.fitBounds(bounds, 48);
    if (points === 1) map.setZoom(16);
  }, [map, markers]);

  if (isLoading) return <LoadingState label="Loading map..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      <div className="absolute right-4 top-10 z-10 max-w-xs rounded-md border border-gray-200 bg-white p-3 shadow-lg">
        <div className="text-sm font-semibold text-gray-800">Legend</div>
        <div className="mt-2 max-h-56 space-y-1 overflow-auto text-xs text-gray-600">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={showRoute}
              onChange={(event) => setShowRoute(event.target.checked)}
            />
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: '#3B82F6' }}
            />
            <span className="flex-1 truncate">Pole Route</span>
          </label>
          {pointMarkerGroups.map(({ groupKey, marker, count }) => {
            const style = getMarkerStyle(marker);

            return (
              <label
                key={groupKey}
                className="mt-1 flex cursor-pointer items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={!hiddenMarkerGroups.has(groupKey)}
                  onChange={() => toggleMarkerGroup(groupKey)}
                />
                <ShapeSwatch shape={style.shape} color={style.color} />
                <span className="flex-1 truncate">{style.label}</span>
                <span className="font-medium">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {selectedRecord && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <MarkerDetailsPanel
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
            onImageClick={setZoomImage}
          />
        </div>
      )}

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

const AerialProgressMap: React.FC = () => {
  const [searchParams] = useSearchParams();

  const surveyIds = useMemo(
    () => parseSurveyIdsParam(searchParams.get('survey_ids')),
    [searchParams],
  );
  const surveyIdsKey = surveyIds.join(',');

  const [records, setRecords] = useState<PoleString[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const markers = useMemo(() => buildMarkers(records), [records]);

  useEffect(() => {
    if (surveyIds.length === 0) {
      setRecords([]);
      setError('Please select at least one survey to view the progress map.');
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchPoleStringing = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${TraceBASEURL}/get-pole-stringing`, {
          params: { survey_ids: surveyIdsKey },
        });

        if (!mounted) return;
        if (response.status === 200 || response.status === 201) {
          const raw = response.data?.data ?? [];
          setRecords(Array.isArray(raw) ? raw : Object.values(raw).flat());
        } else {
          setError('Error occurred while loading progress data.');
          setRecords([]);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'An error occurred');
        setRecords([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPoleStringing();
    return () => {
      mounted = false;
    };
  }, [surveyIds.length, surveyIdsKey]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white">
      <div className="absolute left-50 top-0 z-20 max-w-md rounded-md border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Aerial Progress Map
            </h1>
            <p className="text-sm text-gray-500">
              {surveyIds.length} survey selected
              {surveyIds.length === 1 ? '' : 's'} | {markers.length} mapped
              points
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading progress data..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <AerialProgressMapComp records={records} markers={markers} />
      )}
    </div>
  );
};

export default AerialProgressMap;
