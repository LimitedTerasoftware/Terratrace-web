import axios from 'axios';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import GoogleMapsLoader from '../hooks/googleMapsLoader';
import { Activity } from '../../types/survey';
import type {
  DesktopPlanningApiResponse,
  PlacemarkCategory,
  ProcessedDesktopPlanning,
} from '../../types/kmz';
import { processDesktopPlanningData } from '../SmartInventory/PlaceMark';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

const DESKTOP_PLANNING_CATEGORIES = [
  'Desktop: GP',
  'Desktop: FPOI',
  'Desktop: Block Router',
  'Desktop: Proposed Cable',
  'Desktop : Block to FPOI Cable',
  'Desktop : Offset Cable',
  'Desktop: Incremental Cable',
];

interface ProgressMapLocationState {
  row?: number | number[];
  surveyIds?: number[];
  selectedState?: string | null;
  selectedDistrict?: string | null;
  selectedBlock?: string | null;
}

interface ProgressMarker {
  id: number;
  lat: number;
  lng: number;
  eventType: string;
  surveyId: number;
  indexId: number;
}

interface IntegratedGp {
  id: number;
  name: string;
  lattitude: string;
  longitude: string;
  type: string;
  blk_code: string;
  blk_name: string;
  dt_code: string;
  dt_name: string;
  st_code: string;
  st_name: string;
  lgd_code: string;
  remark: string | null;
  integrated: number;
  created_at: string;
  updated_at: string;
}

interface UGProgressMapCompProps {
  markers: ProgressMarker[];
  planningPlacemarks: ProcessedDesktopPlanning[];
  planningCategories: PlacemarkCategory[];
  visiblePlanningCategories: Set<string>;
  onPlanningCategoryVisibilityChange: (
    categoryId: string,
    visible: boolean,
  ) => void;
  integratedGps: IntegratedGp[];
}

const parseSurveyIds = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? [numericValue] : [];
};

const parseSurveyIdsParam = (value: string | null): number[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
};

const getLatLongForEvent = (row: Activity) => {
  switch (row.eventType) {
    case 'FPOI':
      return row.fpoiLatLong;
    case 'DEPTH':
      return row.depthLatlong;
    case 'JOINTCHAMBER':
      return row.jointChamberLatLong;
    case 'MANHOLES':
      return row.manholeLatLong;
    case 'LANDMARK':
      return row.landmarkLatLong;
    case 'KILOMETERSTONE':
      return row.kilometerstoneLatLong;
    case 'FIBERTURN':
      return row.fiberTurnLatLong;
    case 'ROUTEINDICATOR':
      return row.routeIndicatorLatLong;
    case 'STARTPIT':
      return row.startPitLatlong;
    case 'ENDPIT':
      return row.endPitLatlong;
    case 'STARTSURVEY':
      return row.startPointCoordinates;
    case 'ENDSURVEY':
      return row.endPointCoordinates;
    case 'ROADCROSSING':
      return row.crossingLatlong;
    case 'HOLDSURVEY':
      return row.holdLatlong;
    case 'BLOWING':
    case 'OFCBLOWING':
      return row.blowingLatLong;
    case 'ROUTEFEATURE':
      return row.routeFeatureLatLong;
    default:
      return null;
  }
};

const isSameLocation = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  epsilon = 0.0003,
) => Math.abs(a.lat - b.lat) < epsilon && Math.abs(a.lng - b.lng) < epsilon;

const parseLatLong = (value: string | null | undefined) => {
  if (!value || !value.includes(',')) return null;
  const [latStr, lngStr] = value.split(',');
  const lat = Number(latStr.trim());
  const lng = Number(lngStr.trim());

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }

  return { lat, lng };
};

const buildMarkers = (events: Activity[]): ProgressMarker[] =>
  events
    .filter((event) => event.status === 0 && event.eventType !== 'STARTSURVEY' && event.eventType !== 'ENDSURVEY' && event.eventType !== 'ROADCROSSING' && event.eventType !== 'FIBERTURN')
    .map((event) => {
      const coords = parseLatLong(getLatLongForEvent(event));
      if (!coords) return null;

      return {
        id: event.id,
        lat: coords.lat,
        lng: coords.lng,
        eventType: event.eventType,
        surveyId: event.survey_id,
        indexId: event.order_index,
      };
    })
    .filter((event): event is ProgressMarker => event !== null);

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

const INTEGRATED_GP_COLOR = '#16A34A';

type MarkerShape = 'circle' | 'square' | 'triangle' | 'diamond';

const EVENT_POINT_STYLES: Record<
  string,
  { color: string; label: string; shape: MarkerShape }
> = {
  JOINTCHAMBER: { color: '#F97316', label: 'Joint Chamber', shape: 'square' },
  ROUTEINDICATOR: {
    color: '#0EA5E9',
    label: 'Route Indicator',
    shape: 'triangle',
  },
};

// Only these event types are connected into the construction-path polyline.
// Every other event type is shown as a standalone point marker.
const CONNECT_EVENT_TYPES = new Set(['STARTPIT', 'ENDPIT', 'DEPTH']);

const DEFAULT_POINT_STYLE: { color: string; shape: MarkerShape } = {
  color: '#6B7280',
  shape: 'circle',
};

const humanizeEventType = (eventType: string) =>
  eventType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getPointStyle = (
  eventType: string,
): { color: string; label: string; shape: MarkerShape } =>
  EVENT_POINT_STYLES[eventType] ?? {
    ...DEFAULT_POINT_STYLE,
    label: humanizeEventType(eventType),
  };

const buildLabeledCircleIcon = (
  color: string,
  radius: number,
  strokeWidth = 2,
): google.maps.Icon => {
  const diameter = radius * 2 + strokeWidth * 2;
  const center = diameter / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${diameter}" height="${diameter}"><circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="#ffffff" stroke-width="${strokeWidth}"/></svg>`;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(diameter, diameter),
    anchor: new google.maps.Point(center, center),
    labelOrigin: new google.maps.Point(center, -8),
  };
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
  return (
    <span
      className="h-2 w-2 flex-none rounded-full"
      style={{ backgroundColor: color }}
    />
  );
};

const UGProgressMapComp: React.FC<UGProgressMapCompProps> = ({
  markers,
  planningPlacemarks,
  planningCategories,
  visiblePlanningCategories,
  onPlanningCategoryVisibilityChange,
  integratedGps,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const eventPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const planningMarkersRef = useRef<google.maps.Marker[]>([]);
  const planningPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const integratedGpMarkersRef = useRef<google.maps.Marker[]>([]);
  const eventPointMarkersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const visiblePlanningKey = useMemo(
    () => Array.from(visiblePlanningCategories).sort().join('|'),
    [visiblePlanningCategories],
  );
  const eventRoutePaths = useMemo(() => {
    const grouped = markers
      .filter((marker) => CONNECT_EVENT_TYPES.has(marker.eventType))
      .reduce<Record<number, ProgressMarker[]>>((acc, marker) => {
        if (!acc[marker.surveyId]) acc[marker.surveyId] = [];
        acc[marker.surveyId].push(marker);
        return acc;
      }, {});

    return Object.entries(grouped)
      .map(([surveyId, items]) => {
        const path = [...items]
          .sort(
            (a, b) =>
              (a.indexId ?? Number.MAX_SAFE_INTEGER) -
                (b.indexId ?? Number.MAX_SAFE_INTEGER) || a.id - b.id,
          )
          .map((item) => ({ lat: item.lat, lng: item.lng }));
        return { surveyId: Number(surveyId), path };
      })
      .filter((entry) => entry.path.length > 1);
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

  useEffect(() => {
    if (!map) return;
    
    eventPolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    eventPolylinesRef.current = eventRoutePaths.flatMap(({ surveyId, path }) => {
      // outline/casing - drawn first, wider, white
      const casing = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#ffffff',
        strokeOpacity: 1,
        strokeWeight: 7,
        zIndex: 998,
        map,
      });

      // main colored line on top
      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#9C27B0',
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


      // return polyline;
    });

    return () => {
      eventPolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      eventPolylinesRef.current = [];
    };
  }, [eventRoutePaths, map]);

  useEffect(() => {
    if (!map) return;

    eventPointMarkersRef.current.forEach((marker) => marker.setMap(null));
    eventPointMarkersRef.current = markers
      .filter((marker) => !CONNECT_EVENT_TYPES.has(marker.eventType))
      .map((marker) => {
        const style = getPointStyle(marker.eventType);
        const eventMarker = new google.maps.Marker({
          position: { lat: marker.lat, lng: marker.lng },
          map,
          title: style.label,
          zIndex: 997,
          icon: buildLabeledShapeIcon(style.shape, style.color, 14),
        });

        eventMarker.addListener('click', () => {
          infoWindowRef.current?.setContent(`
            <div style="padding:4px 4px;font-size:13px;line-height:1.5">
              <div style="font-weight:700;color:${style.color}">${escapeHtml(style.label)}</div>
              <div>Survey ID: ${marker.surveyId}</div>
            </div>
          `);
          infoWindowRef.current?.open(map, eventMarker);
        });

        return eventMarker;
      });

    return () => {
      eventPointMarkersRef.current.forEach((marker) => marker.setMap(null));
      eventPointMarkersRef.current = [];
    };
  }, [markers, map]);

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

    planningMarkersRef.current.forEach((marker) => marker.setMap(null));
    planningPolylinesRef.current.forEach((polyline) => polyline.setMap(null));
    planningMarkersRef.current = [];
    planningPolylinesRef.current = [];

    planningPlacemarks.forEach((placemark) => {
      const category = planningCategories.find(
        (item) => item.name === placemark.category,
      );
      const categoryId =
        category?.id ??
        placemark.category.toLowerCase().replace(/[^a-z0-9]/g, '-');

      if (!visiblePlanningCategories.has(categoryId)) return;

      const color = category?.color ?? '#6B7280';
      if (placemark.type === 'point') {
        const coord = placemark.coordinates as { lat: number; lng: number };

        // Skip planned GP points already represented by an Integrated GP
        // marker at (roughly) the same spot, so their labels don't overlap.
        if (
          placemark.category === 'Desktop: GP' &&
          integratedGps.some((gp) => {
            if (
              placemark.lgdCode &&
              gp.lgd_code &&
              placemark.lgdCode === gp.lgd_code
            ) {
              return true;
            }
            const lat = Number(gp.lattitude);
            const lng = Number(gp.longitude);
            return (
              Number.isFinite(lat) &&
              Number.isFinite(lng) &&
              isSameLocation(coord, { lat, lng })
            );
          })
        ) {
          return;
        }

        const marker = new google.maps.Marker({
          position: coord,
          map,
          title: placemark.name,
          label: {
            text: placemark.name,
            color: '#111827',
            fontSize: '10px',
            fontWeight: '600',
          },
          icon: buildLabeledCircleIcon(color, 8),
        });

        marker.addListener('click', () => {
          infoWindowRef.current?.setContent(`
            <div style="padding:4px 4px;font-size:13px;line-height:1.5">
              <div style="font-weight:700;color:#111827">${escapeHtml(placemark.name)}</div>
              <div>${escapeHtml(placemark.category)}</div>
            </div>
          `);
          infoWindowRef.current?.open(map, marker);
        });

        planningMarkersRef.current.push(marker);
        return;
      }

      const polyline = new google.maps.Polyline({
        path: placemark.coordinates as { lat: number; lng: number }[],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.75,
        strokeWeight: 2,
        map,
      });
      planningPolylinesRef.current.push(polyline);
    });

    return () => {
      planningMarkersRef.current.forEach((marker) => marker.setMap(null));
      planningPolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      planningMarkersRef.current = [];
      planningPolylinesRef.current = [];
    };
  }, [
    map,
    planningCategories,
    planningPlacemarks,
    visiblePlanningCategories,
    visiblePlanningKey,
    integratedGps,
  ]);

  useEffect(() => {
    if (!map) return;

    integratedGpMarkersRef.current.forEach((marker) => marker.setMap(null));
    integratedGpMarkersRef.current = integratedGps
      .map((gp) => {
        const lat = Number(gp.lattitude);
        const lng = Number(gp.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map,
          title: gp.name,
          zIndex: 1000,
          label: {
            text: gp.name,
            color: '#111827',
            fontSize: '10px',
            fontWeight: '600',
          },
          icon: buildLabeledCircleIcon(INTEGRATED_GP_COLOR, 9),
        });

        marker.addListener('click', () => {
          infoWindowRef.current?.setContent(`
            <div style="padding:4px 4px;font-size:13px;line-height:1.5">
              <div style="font-weight:700;color:#111827">${escapeHtml(gp.name)}</div>
              <div>Type: ${escapeHtml(gp.type)}</div>
              <div style="color:${INTEGRATED_GP_COLOR};font-weight:600">Integrated GP</div>
            </div>
          `);
          infoWindowRef.current?.open(map, marker);
        });

        return marker;
      })
      .filter((marker): marker is google.maps.Marker => marker !== null);

    return () => {
      integratedGpMarkersRef.current.forEach((marker) => marker.setMap(null));
      integratedGpMarkersRef.current = [];
    };
  }, [map, integratedGps]);

  useEffect(() => {
    if (!map) return;

    const bounds = new google.maps.LatLngBounds();
    let points = 0;

    markers.forEach((marker) => {
      bounds.extend({ lat: marker.lat, lng: marker.lng });
      points += 1;
    });

    planningPlacemarks.forEach((placemark) => {
      const category = planningCategories.find(
        (item) => item.name === placemark.category,
      );
      const categoryId =
        category?.id ??
        placemark.category.toLowerCase().replace(/[^a-z0-9]/g, '-');

      if (!visiblePlanningCategories.has(categoryId)) return;

      if (placemark.type === 'point') {
        bounds.extend(placemark.coordinates as { lat: number; lng: number });
        points += 1;
        return;
      }

      (placemark.coordinates as { lat: number; lng: number }[]).forEach(
        (coord) => {
          bounds.extend(coord);
          points += 1;
        },
      );
    });

    integratedGps.forEach((gp) => {
      const lat = Number(gp.lattitude);
      const lng = Number(gp.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      bounds.extend({ lat, lng });
      points += 1;
    });

    if (points === 0) return;
    map.fitBounds(bounds, 48);
    if (points === 1) map.setZoom(16);
  }, [
    map,
    markers,
    integratedGps,
    planningCategories,
    planningPlacemarks,
    visiblePlanningCategories,
    visiblePlanningKey,
  ]);

  if (isLoading) return <LoadingState label="Loading map..." />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {(planningCategories.length > 0 || integratedGps.length > 0) && (
        <div className="absolute right-4 top-10 z-10 max-w-xs rounded-md border border-gray-200 bg-white p-3 shadow-lg">
          <div className="text-sm font-semibold text-gray-800">
            Approved KMZ
          </div>
          <div className="mt-2 max-h-56 space-y-1 overflow-auto text-xs text-gray-600">
            {planningCategories
              .filter((category) => category.name !== 'Desktop : Offset Cable')
              .map((category) => {
                const isVisible = visiblePlanningCategories.has(category.id);
                return (
                  <label
                    key={category.id}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(event) =>
                        onPlanningCategoryVisibilityChange(
                          category.id,
                          event.target.checked,
                        )
                      }
                    />
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="flex-1 truncate">
                      {category.name.replace(/^Desktop\s*/, '')}
                    </span>
                    <span className="font-medium">{category.count}</span>
                  </label>
                );
              })}
            <div className="mt-2 border-t border-gray-200 pt-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={true} disabled />
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: '#9C27B0' }}
                />
                <span className="flex-1 truncate">Construction Path</span>
              </label>
              {integratedGps.length > 0 && (
                <label className="mt-1 flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={true} disabled />
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: INTEGRATED_GP_COLOR }}
                  />
                  <span className="flex-1 truncate">Integrated GP</span>
                  <span className="font-medium">{integratedGps.length}</span>
                </label>
              )}
              {Array.from(
                new Set(
                  markers
                    .filter((marker) => !CONNECT_EVENT_TYPES.has(marker.eventType))
                    .map((marker) => marker.eventType),
                ),
              ).map((eventType) => {
                const style = getPointStyle(eventType);
                const count = markers.filter(
                  (marker) => marker.eventType === eventType,
                ).length;
                if (count === 0) return null;

                return (
                  <label
                    key={eventType}
                    className="mt-1 flex cursor-pointer items-center gap-2"
                  >
                    <input type="checkbox" checked={true} disabled />
                    <ShapeSwatch shape={style.shape} color={style.color} />
                    <span className="flex-1 truncate">{style.label}</span>
                    <span className="font-medium">{count}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UGProgressMap: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = (location.state || {}) as ProgressMapLocationState;

  const surveyIds = useMemo(() => {
    const fromQuery = parseSurveyIdsParam(searchParams.get('survey_ids'));
    if (fromQuery.length > 0) return fromQuery;
    return parseSurveyIds(state.surveyIds ?? state.row);
  }, [searchParams, state.row, state.surveyIds]);

  const selectedState =
    searchParams.get('selectedState') ?? state.selectedState ?? '';
  const selectedDistrict =
    searchParams.get('selectedDistrict') ?? state.selectedDistrict ?? '';
  const selectedBlock =
    searchParams.get('selectedBlock') ?? state.selectedBlock ?? '';
  const surveyIdsKey = surveyIds.join(',');

  const [events, setEvents] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planningPlacemarks, setPlanningPlacemarks] = useState<
    ProcessedDesktopPlanning[]
  >([]);
  const [planningCategories, setPlanningCategories] = useState<
    PlacemarkCategory[]
  >([]);
  const [visiblePlanningCategories, setVisiblePlanningCategories] = useState<
    Set<string>
  >(new Set());
  const [integratedGps, setIntegratedGps] = useState<IntegratedGp[]>([]);

  const markers = useMemo(() => buildMarkers(events), [events]);

  useEffect(() => {
    if (surveyIds.length === 0) {
      setEvents([]);
      setError('Please select at least one survey to view the progress map.');
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchProgressData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${TraceBASEURL}/construction-forms`, {
          params: { survey_ids: surveyIdsKey },
        });

        if (!mounted) return;
        if (response.status === 200 || response.status === 201) {
          setEvents(response.data?.data ?? []);
        } else {
          setError('Error occurred while loading progress data.');
          setEvents([]);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'An error occurred');
        setEvents([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProgressData();
    return () => {
      mounted = false;
    };
  }, [surveyIds.length, surveyIdsKey]);

  useEffect(() => {
    if (!selectedState || !selectedDistrict || !selectedBlock) return;

    let mounted = true;
    const fetchDesktopPlanning = async () => {
      try {
        const response = await axios.post(
          `${TraceBASEURL}/get-desktop-planning`,
          {
            stateId: selectedState,
            districtId: selectedDistrict,
            blockId: selectedBlock,
            type: 'Approved KMZ',
          },
          { headers: { 'Content-Type': 'application/json' } },
        );

        if (!mounted) return;
        const result: DesktopPlanningApiResponse = response.data;
        if (
          (response.status === 200 || response.status === 201) &&
          result.status &&
          result.data.length > 0
        ) {
          const { placemarks, categories } = processDesktopPlanningData(result);
          const filteredPlacemarks = placemarks.filter((point) =>
            DESKTOP_PLANNING_CATEGORIES.includes(point.category),
          );
          const filteredCategories = categories.filter((category) =>
            DESKTOP_PLANNING_CATEGORIES.includes(category.name),
          );

          setPlanningPlacemarks(filteredPlacemarks);
          setPlanningCategories(filteredCategories);
          setVisiblePlanningCategories(
            new Set(
              filteredCategories
                .filter((category) => category.visible)
                .filter(
                  (category) => category.name !== 'Desktop : Offset Cable',
                )
                .map((category) => category.id),
            ),
          );
        } else {
          setPlanningPlacemarks([]);
          setPlanningCategories([]);
          setVisiblePlanningCategories(new Set());
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching desktop planning data', err);
        setPlanningPlacemarks([]);
        setPlanningCategories([]);
        setVisiblePlanningCategories(new Set());
      }
    };

    fetchDesktopPlanning();
    return () => {
      mounted = false;
    };
  }, [selectedBlock, selectedDistrict, selectedState]);

  useEffect(() => {
    if (!selectedBlock) {
      setIntegratedGps([]);
      return;
    }

    let mounted = true;
    const fetchIntegratedGps = async () => {
      try {
        const response = await axios.get(`${TraceBASEURL}/getIntegratedGps`, {
          params: { block_id: selectedBlock },
        });

        if (!mounted) return;
        if (response.data?.status && Array.isArray(response.data.data)) {
          setIntegratedGps(
            response.data.data.filter(
              (gp: IntegratedGp) => Number(gp.integrated) === 1,
            ),
          );
        } else {
          setIntegratedGps([]);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Error fetching integrated GPs', err);
        setIntegratedGps([]);
      }
    };

    fetchIntegratedGps();
    return () => {
      mounted = false;
    };
  }, [selectedBlock]);

  const handlePlanningCategoryVisibilityChange = (
    categoryId: string,
    visible: boolean,
  ) => {
    setVisiblePlanningCategories((prev) => {
      const next = new Set(prev);
      if (visible) {
        next.add(categoryId);
      } else {
        next.delete(categoryId);
      }
      return next;
    });
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-white">
      <div className="absolute left-50 top-0 z-20 max-w-md rounded-md border border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Progress Map
            </h1>
            <p className="text-sm text-gray-500">
              {surveyIds.length} survey selected
              {surveyIds.length === 1 ? '' : 's'} | {markers.length} mapped
              events
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading progress data..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <UGProgressMapComp
          markers={markers}
          planningPlacemarks={planningPlacemarks}
          planningCategories={planningCategories}
          visiblePlanningCategories={visiblePlanningCategories}
          onPlanningCategoryVisibilityChange={
            handlePlanningCategoryVisibilityChange
          }
          integratedGps={integratedGps}
        />
      )}
    </div>
  );
};

export default UGProgressMap;
