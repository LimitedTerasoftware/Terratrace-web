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

interface UGProgressMapCompProps {
  markers: ProgressMarker[];
  planningPlacemarks: ProcessedDesktopPlanning[];
  planningCategories: PlacemarkCategory[];
  visiblePlanningCategories: Set<string>;
  onPlanningCategoryVisibilityChange: (
    categoryId: string,
    visible: boolean,
  ) => void;
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
    .filter((event) => event.status === 0)
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

const UGProgressMapComp: React.FC<UGProgressMapCompProps> = ({
  markers,
  planningPlacemarks,
  planningCategories,
  visiblePlanningCategories,
  onPlanningCategoryVisibilityChange,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const eventPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const planningMarkersRef = useRef<google.maps.Marker[]>([]);
  const planningPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const visiblePlanningKey = useMemo(
    () => Array.from(visiblePlanningCategories).sort().join('|'),
    [visiblePlanningCategories],
  );
  const eventRoutePaths = useMemo(() => {
    const grouped = markers.reduce<Record<number, ProgressMarker[]>>(
      (acc, marker) => {
        if (!acc[marker.surveyId]) acc[marker.surveyId] = [];
        acc[marker.surveyId].push(marker);
        return acc;
      },
      {},
    );

    return Object.values(grouped)
      .map((items) =>
        [...items]
          .sort(
            (a, b) =>
              (a.indexId ?? Number.MAX_SAFE_INTEGER) -
                (b.indexId ?? Number.MAX_SAFE_INTEGER) || a.id - b.id,
          )
          .map((item) => ({ lat: item.lat, lng: item.lng })),
      )
      .filter((path) => path.length > 1);
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
    eventPolylinesRef.current = eventRoutePaths.map(
      (path) =>
        new google.maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#9C27B0',
          strokeOpacity: 0.85,
          strokeWeight: 4,
          map,
        }),
    );

    return () => {
      eventPolylinesRef.current.forEach((polyline) => polyline.setMap(null));
      eventPolylinesRef.current = [];
    };
  }, [eventRoutePaths, map]);

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
        const marker = new google.maps.Marker({
          position: coord,
          map,
          title: placemark.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 4,
            fillColor: color,
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 1.2,
          },
        });

        marker.addListener('click', () => {
          infoWindowRef.current?.setContent(`
            <div style="padding:6px 4px;font-size:13px;line-height:1.5">
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
  ]);

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

    if (points === 0) return;
    map.fitBounds(bounds, 48);
    if (points === 1) map.setZoom(16);
  }, [
    map,
    markers,
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

      {planningCategories.length > 0 && (
        <div className="absolute right-4 top-10 z-10 max-w-xs rounded-md border border-gray-200 bg-white p-3 shadow-lg">
          <div className="text-sm font-semibold text-gray-800">
            Approved KMZ
          </div>
          <div className="mt-2 max-h-56 space-y-1 overflow-auto text-xs text-gray-600">
            {planningCategories.map((category) => {
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
                  <span className="flex-1 truncate">{category.name}</span>
                  <span className="font-medium">{category.count}</span>
                </label>
              );
            })}
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
          {/* <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button> */}
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
        />
      )}
    </div>
  );
};

export default UGProgressMap;
