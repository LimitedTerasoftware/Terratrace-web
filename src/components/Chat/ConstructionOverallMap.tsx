import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigation, Plus, Minus, MapPin, X, Layers } from 'lucide-react';
import GoogleMapsLoader from '../hooks/googleMapsLoader';
import { OverallConstructionBlock } from '../Services/api';
import { ProcessedDesktopPlanning, PlacemarkCategory } from '../../types/kmz';

interface ConstructionOverallMapProps {
  data: OverallConstructionBlock[];
  planningPlacemarks?: ProcessedDesktopPlanning[];
  planningCategories?: PlacemarkCategory[];
  // Called whenever a point marker is clicked, in addition to the built-in
  // details panel — hook a real lookup up here once a point-detail API
  // exists (e.g. to fetch photos/history for that point_id).
  onPointSelect?: (point: {
    lat: number;
    lng: number;
    point_id: number;
    eventType: string;
    depth: number | null;
    survey_id: number;
    machine_id: string;
    state_id: number;
    district_id: number;
    block_id: number;
  }) => void;
}

interface FlatPoint {
  lat: number;
  lng: number;
  point_id: number;
  eventType: string;
  depth: number | null;
  survey_id: number;
  machine_id: string;
  state_id: number;
  district_id: number;
  block_id: number;
}

interface SurveyPath {
  survey_id: number;
  machine_id: string;
  path: { lat: number; lng: number }[];
}

interface PointCluster {
  lat: number;
  lng: number;
  count: number;
  points: FlatPoint[];
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const EVENT_COLORS: Record<string, string> = {
  DEPTH: '#3B82F6',
  STARTPIT: '#14B8A6',
  ENDPIT: '#DC2626',
};

const EVENT_LABELS: Record<string, string> = {
  DEPTH: 'Depth',
  STARTPIT: 'Start Pit',
  ENDPIT: 'End Pit',
};

// The route line color needs to stand out against Google Maps' own blues
// (water) and greens/grays (land/roads) — a saturated orange reads clearly
// against all of them, unlike the blue used previously.
const POLYLINE_COLOR = '#F97316';

// Three zoom tiers keep the number of Marker/Polyline instances in check —
// creating too many of either at once is what freezes the page:
//   < MIN_ZOOM_FOR_LINES:    grouped count markers only.
//   >= MIN_ZOOM_FOR_LINES:   per-survey route polylines only (a polyline is
//                            one cheap graphics object no matter how many
//                            points it has, so this stays fast even with a
//                            lot of data behind each line).
//   >= MIN_ZOOM_FOR_MARKERS: individual points are added on top of the
//                            polylines — by this zoom the viewport is small
//                            enough that only a handful of lines are visible.
const MIN_ZOOM_FOR_LINES = 14;
const MIN_ZOOM_FOR_MARKERS = 17;
const MAX_VISIBLE_MARKERS = 500;
const MAX_VISIBLE_POLYLINES = 120;

const isValidPoint = (lat: number, lng: number) =>
  !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

const flattenPoints = (data: OverallConstructionBlock[]): FlatPoint[] => {
  const points: FlatPoint[] = [];
  data.forEach((block) => {
    (block.surveys || []).forEach((survey) => {
      (survey.coordinates || []).forEach((c) => {
        const [lng, lat] = c.coordinates || [];
        if (isValidPoint(lat, lng)) {
          points.push({
            lat,
            lng,
            point_id: c.point_id,
            eventType: c.eventType,
            depth: c.depth,
            survey_id: survey.survey_id,
            machine_id: survey.machine_id,
            state_id: block.state_id,
            district_id: block.district_id,
            block_id: block.block_id,
          });
        }
      });
    });
  });
  return points;
};

const buildSurveyPaths = (data: OverallConstructionBlock[]): SurveyPath[] => {
  const paths: SurveyPath[] = [];
  data.forEach((block) => {
    (block.surveys || []).forEach((survey) => {
      const path = (survey.coordinates || [])
        .filter((c) => Array.isArray(c.coordinates) && isValidPoint(c.coordinates[1], c.coordinates[0]))
        .map((c) => ({ lat: c.coordinates[1], lng: c.coordinates[0] }));
      if (path.length >= 2) {
        paths.push({ survey_id: survey.survey_id, machine_id: survey.machine_id, path });
      }
    });
  });
  return paths;
};

// Same cheap lat/lng grid bucketing used elsewhere for pole clustering — the
// cell size shrinks as the user zooms in so clusters break apart into
// smaller groups and eventually individual markers.
const clusterPoints = (points: FlatPoint[], zoom: number): PointCluster[] => {
  const cellSize = Math.max(40 / Math.pow(2, zoom), 0.003);
  const cells = new Map<string, PointCluster>();

  points.forEach((point) => {
    const key = `${Math.floor(point.lat / cellSize)}:${Math.floor(point.lng / cellSize)}`;
    const existing = cells.get(key);
    if (existing) {
      existing.count += 1;
      existing.lat += point.lat;
      existing.lng += point.lng;
      existing.points.push(point);
    } else {
      cells.set(key, { lat: point.lat, lng: point.lng, count: 1, points: [point] });
    }
  });

  return Array.from(cells.values()).map((cluster) => ({
    ...cluster,
    lat: cluster.lat / cluster.count,
    lng: cluster.lng / cluster.count,
  }));
};

const toLatLng = (
  coordinates: { lat: number; lng: number } | { lat: number; lng: number }[],
): { lat: number; lng: number } | null => {
  if (Array.isArray(coordinates)) {
    return coordinates.length > 0 ? coordinates[0] : null;
  }
  return coordinates;
};

const countByEvent = (points: FlatPoint[]) =>
  points.reduce<Record<string, number>>((acc, point) => {
    acc[point.eventType] = (acc[point.eventType] || 0) + 1;
    return acc;
  }, {});

export default function ConstructionOverallMap({
  data,
  planningPlacemarks = [],
  planningCategories = [],
  onPointSelect,
}: ConstructionOverallMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [planningOverlays, setPlanningOverlays] = useState<
    (google.maps.Marker | google.maps.Polyline)[]
  >([]);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [zoom, setZoom] = useState<number>(13);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);

  // The point behind the last marker click, and whatever extra detail was
  // looked up for it. `pointDetails` is populated by `loadPointDetails`
  // below — that's the one place to swap in a real API call later.
  const [selectedPoint, setSelectedPoint] = useState<FlatPoint | null>(null);
  const [pointDetails, setPointDetails] = useState<FlatPoint | null>(null);
  const [loadingPointDetails, setLoadingPointDetails] = useState(false);

  // True while individual markers/polylines are being built at high zoom —
  // that work is synchronous and can take a beat over MAX_VISIBLE_MARKERS
  // points, so the UI shows a spinner instead of appearing to hang.
  const [plottingMarkers, setPlottingMarkers] = useState(false);

  // Recomputing these on every render (including the ones zoom/pan trigger)
  // was the main source of the freeze when zooming in far enough to see
  // individual points — memoize so they only rebuild when the data changes.
  const flatPoints = useMemo(() => flattenPoints(data), [data]);
  const surveyPaths = useMemo(() => buildSurveyPaths(data), [data]);

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
      flatPoints.length > 0
        ? { lat: flatPoints[0].lat, lng: flatPoints[0].lng }
        : { lat: 23.4173509, lng: 85.289009 };

    const mapInstance = new google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
    });

    mapInstance.addListener('idle', () => {
      setZoom(mapInstance.getZoom() ?? 13);
      setBounds(mapInstance.getBounds() ?? null);
    });

    infoWindowRef.current = new google.maps.InfoWindow();
    setMap(mapInstance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, map]);

  // Fit the map to the full result set whenever the filtered data changes.
  useEffect(() => {
    if (!map || flatPoints.length === 0) return;

    const dataBounds = new google.maps.LatLngBounds();
    flatPoints.forEach((point) => {
      dataBounds.extend({ lat: point.lat, lng: point.lng });
    });
    map.fitBounds(dataBounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, data]);

  // Placeholder point-detail lookup. It currently just surfaces the fields
  // already carried on the clicked point so the panel has something to show
  // today. Once a details API exists, replace the body with the real call
  // (keyed on point.point_id / point.survey_id) and set the response here —
  // the panel re-renders automatically when `pointDetails` changes.
  const loadPointDetails = async (point: FlatPoint) => {
    setSelectedPoint(point);
    setPointDetails(null);
    setLoadingPointDetails(true);
    onPointSelect?.(point);
    try {
      // TODO: const resp = await getConstructionPointDetails(point.point_id);
      setPointDetails(point);
    } finally {
      setLoadingPointDetails(false);
    }
  };

  const makePointMarker = (point: FlatPoint) => {
    if (!map) return null;

    const marker = new google.maps.Marker({
      position: { lat: point.lat, lng: point.lng },
      map,
      title: `Survey #${point.survey_id} — ${EVENT_LABELS[point.eventType] || point.eventType}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: EVENT_COLORS[point.eventType] || '#6b7280',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeWeight: 1.5,
      },
    });

    marker.addListener('click', () => loadPointDetails(point));

    return marker;
  };

  const makeClusterMarker = (cluster: PointCluster) => {
    if (!map) return null;

    const scale = Math.min(14 + Math.log2(cluster.count) * 4, 30);
    const marker = new google.maps.Marker({
      position: { lat: cluster.lat, lng: cluster.lng },
      map,
      title: `${cluster.count} construction points`,
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
      map.setZoom(Math.min((map.getZoom() || 13) + 3, MIN_ZOOM_FOR_MARKERS + 1));
    });

    return marker;
  };

  const makeSurveyPolyline = (survey: SurveyPath) => {
    if (!map) return null;

    const polyline = new google.maps.Polyline({
      path: survey.path,
      map,
      strokeColor: POLYLINE_COLOR,
      strokeOpacity: 0.9,
      strokeWeight: 4,
    });

    polyline.addListener('click', (e: google.maps.PolyMouseEvent) => {
      const infoWindow = infoWindowRef.current;
      if (!infoWindow) return;
      infoWindow.setContent(`
        <div style="padding: 8px; font-family: system-ui, sans-serif; font-size: 12px; color: #4b5563;">
          <strong>Survey #${survey.survey_id}</strong><br/>
          Machine: ${survey.machine_id}<br/>
          Points: ${survey.path.length}
        </div>
      `);
      if (e.latLng) infoWindow.setPosition(e.latLng);
      infoWindow.open(map);
    });

    return polyline;
  };

  // Three-tier rendering — see the MIN_ZOOM_FOR_* comment above. Below
  // MIN_ZOOM_FOR_LINES: grouped count markers. From there to
  // MIN_ZOOM_FOR_MARKERS: survey route polylines only, no point markers. At
  // MIN_ZOOM_FOR_MARKERS and above: polylines plus individual points.
  useEffect(() => {
    if (!map) return;

    const visiblePaths = () =>
      (bounds ? surveyPaths.filter((s) => s.path.some((p) => bounds.contains(p))) : surveyPaths).slice(
        0,
        MAX_VISIBLE_POLYLINES,
      );

    const rebuild = () => {
      markers.forEach((m) => m.setMap(null));
      const newMarkers: (google.maps.Marker | google.maps.Polyline)[] = [];

      if (zoom >= MIN_ZOOM_FOR_MARKERS) {
        const visiblePoints = (
          bounds ? flatPoints.filter((p) => bounds.contains({ lat: p.lat, lng: p.lng })) : flatPoints
        ).slice(0, MAX_VISIBLE_MARKERS);

        visiblePoints.forEach((point) => {
          const marker = makePointMarker(point);
          if (marker) newMarkers.push(marker);
        });

        visiblePaths().forEach((survey) => {
          const polyline = makeSurveyPolyline(survey);
          if (polyline) newMarkers.push(polyline);
        });
      } else if (zoom >= MIN_ZOOM_FOR_LINES) {
        visiblePaths().forEach((survey) => {
          const polyline = makeSurveyPolyline(survey);
          if (polyline) newMarkers.push(polyline);
        });
      } else {
        const clusters = clusterPoints(flatPoints, zoom);
        clusters.forEach((cluster) => {
          const marker =
            cluster.count === 1 ? makePointMarker(cluster.points[0]) : makeClusterMarker(cluster);
          if (marker) newMarkers.push(marker);
        });
      }

      setMarkers(newMarkers as google.maps.Marker[]);
      setPlottingMarkers(false);
    };

    // Plotting individual point markers is synchronous and, right at the
    // zoom threshold, can involve hundreds of them — deferring one tick lets
    // the spinner actually paint before that work blocks the main thread.
    // The clustering and polyline-only tiers are cheap enough to run inline.
    if (zoom >= MIN_ZOOM_FOR_MARKERS) {
      setPlottingMarkers(true);
      const timer = setTimeout(rebuild, 0);
      return () => clearTimeout(timer);
    }

    setPlottingMarkers(false);
    rebuild();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, data, zoom, bounds]);

  // Approved KMZ (desktop planning) overlay — comparatively small dataset,
  // so it's always drawn in full regardless of zoom.
  useEffect(() => {
    if (!map) return;

    planningOverlays.forEach((o) => o.setMap(null));
    const overlays: (google.maps.Marker | google.maps.Polyline)[] = [];
    const colorFor = (category: string) =>
      planningCategories.find((c) => c.name === category)?.color || '#6b7280';

    planningPlacemarks.forEach((placemark) => {
      if (placemark.type === 'polyline' && Array.isArray(placemark.coordinates)) {
        overlays.push(
          new google.maps.Polyline({
            path: placemark.coordinates,
            map,
            strokeColor: colorFor(placemark.category),
            strokeOpacity: 0.8,
            strokeWeight: 3,
          }),
        );
      } else {
        const position = toLatLng(placemark.coordinates);
        if (!position) return;
        overlays.push(
          new google.maps.Marker({
            position,
            map,
            title: placemark.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: colorFor(placemark.category),
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 1.5,
            },
          }),
        );
      }
    });

    setPlanningOverlays(overlays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, planningPlacemarks, planningCategories]);

  const handleZoomIn = () => {
    if (map) map.setZoom((map.getZoom() || 13) + 1);
  };

  const handleZoomOut = () => {
    if (map) map.setZoom((map.getZoom() || 13) - 1);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (map) {
            map.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
            map.setZoom(MIN_ZOOM_FOR_MARKERS);
          }
        },
        () => console.error('Error getting location'),
      );
    }
  };

  // Whole-dataset totals — shown in the sidebar's "Overview" section.
  const overallEventCounts = useMemo(() => countByEvent(flatPoints), [flatPoints]);

  // Stats for whatever is currently inside the viewport — recomputed as the
  // user pans/zooms so the sidebar answers "this area has how many points".
  // Since the data can span multiple states/districts/blocks (it now loads
  // unfiltered), `byBlock` breaks the view down by the state/district/block
  // ids carried on each point, not just a single aggregate count.
  const viewStats = useMemo(() => {
    const scoped = bounds
      ? flatPoints.filter((p) => bounds.contains({ lat: p.lat, lng: p.lng }))
      : flatPoints;

    const blockGroups = new Map<
      string,
      { state_id: number; district_id: number; block_id: number; points: number; surveys: Set<number> }
    >();
    scoped.forEach((p) => {
      const key = `${p.state_id}-${p.district_id}-${p.block_id}`;
      const group = blockGroups.get(key);
      if (group) {
        group.points += 1;
        group.surveys.add(p.survey_id);
      } else {
        blockGroups.set(key, {
          state_id: p.state_id,
          district_id: p.district_id,
          block_id: p.block_id,
          points: 1,
          surveys: new Set([p.survey_id]),
        });
      }
    });

    return {
      points: scoped.length,
      surveys: new Set(scoped.map((p) => p.survey_id)).size,
      byEvent: countByEvent(scoped),
      byBlock: Array.from(blockGroups.values())
        .map((g) => ({ ...g, surveys: g.surveys.size }))
        .sort((a, b) => b.points - a.points),
    };
  }, [flatPoints, bounds]);

  const legendEntries = [
    ...Object.entries(EVENT_LABELS)
      .filter(([type]) => overallEventCounts[type] > 0)
      .map((entry) => ({
        key: entry[0],
        label: entry[1],
        color: EVENT_COLORS[entry[0]],
        count: overallEventCounts[entry[0]],
      })),
    ...planningCategories
      .filter((c) => c.count > 0)
      .map((c) => ({ key: c.id, label: c.name, color: c.color, count: c.count })),
  ];

  return (
    <div className="flex flex-col md:flex-row w-full h-full">
      {/* Map */}
      <div className="relative flex-1 min-w-0 min-h-[320px] md:min-h-0">
        {!mapsLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full min-h-[280px]" />

        {mapsLoaded && zoom < MIN_ZOOM_FOR_LINES && flatPoints.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200 z-20 max-w-[280px] text-center">
            <span className="text-xs text-gray-600 font-medium">
              Showing grouped markers — zoom in to view survey routes
            </span>
          </div>
        )}

        {mapsLoaded && zoom >= MIN_ZOOM_FOR_LINES && zoom < MIN_ZOOM_FOR_MARKERS && flatPoints.length > 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200 z-20 max-w-[280px] text-center">
            <span className="text-xs text-gray-600 font-medium">
              Showing survey routes — zoom in further to view exact points
            </span>
          </div>
        )}

        {mapsLoaded && plottingMarkers && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-30">
            <div className="flex flex-col items-center gap-2 bg-white rounded-lg shadow-md px-4 py-3 border border-gray-200">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-xs text-gray-600 font-medium">Plotting points…</span>
            </div>
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col space-y-2 z-20">
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
      </div>

      {/* Stats sidebar */}
      <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-gray-200 bg-white overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm mb-3">
            <Layers className="w-4 h-4 text-blue-600" />
            Overview
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 rounded-lg px-3 py-4">
              <div className="text-xs text-gray-500">Total Points</div>
              <div className="text-2xl font-semibold text-gray-900">{flatPoints.length}</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-4">
              <div className="text-xs text-gray-500">Total Surveys</div>
              <div className="text-2xl font-semibold text-gray-900">{surveyPaths.length}</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
              <MapPin className="w-4 h-4 text-blue-600" />
              Current View
            </div>
            <span className="text-xs text-gray-400">Zoom {zoom}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-500">Points</div>
              <div className="text-lg font-semibold text-gray-900">{viewStats.points}</div>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-500">Surveys</div>
              <div className="text-lg font-semibold text-gray-900">{viewStats.surveys}</div>
            </div>
          </div>
          {Object.entries(EVENT_LABELS)
            .filter(([type]) => viewStats.byEvent[type] > 0)
            .map(([type, label]) => (
              <div key={type} className="flex items-center gap-2 py-0.5 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: EVENT_COLORS[type] }}
                />
                <span className="text-gray-600">{label}</span>
                <span className="text-gray-400 ml-auto">{viewStats.byEvent[type]}</span>
              </div>
            ))}

          {viewStats.byBlock.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs font-medium text-gray-500 mb-1.5">By State / District / Block</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {viewStats.byBlock.map((group) => (
                  <div
                    key={`${group.state_id}-${group.district_id}-${group.block_id}`}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1"
                  >
                    <span className="text-gray-600 truncate">
                      S:{group.state_id} · D:{group.district_id} · B:{group.block_id}
                    </span>
                    <span className="text-gray-400 flex-shrink-0 ml-2">
                      {group.points} pts · {group.surveys} sv
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {zoom < MIN_ZOOM_FOR_LINES && (
            <p className="text-xs text-gray-400 mt-2">
              Zoom in to level {MIN_ZOOM_FOR_LINES}+ for survey routes, {MIN_ZOOM_FOR_MARKERS}+ for exact points.
            </p>
          )}
          {zoom >= MIN_ZOOM_FOR_LINES && zoom < MIN_ZOOM_FOR_MARKERS && (
            <p className="text-xs text-gray-400 mt-2">
              Showing survey routes only — zoom in to level {MIN_ZOOM_FOR_MARKERS}+ for exact points.
            </p>
          )}
        </div>

        {legendEntries.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="font-semibold text-gray-900 text-sm mb-2">Legend</div>
            {legendEntries.map((entry) => (
              <div key={entry.key} className="flex items-center gap-2 py-0.5 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 truncate">{entry.label}</span>
                <span className="text-gray-400 ml-auto">{entry.count}</span>
              </div>
            ))}
          </div>
        )}

        {selectedPoint && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-gray-900 text-sm">Selected Point</div>
              <button
                onClick={() => {
                  setSelectedPoint(null);
                  setPointDetails(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingPointDetails ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              pointDetails && (
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1 pr-2 text-gray-500">Event</td>
                      <td className="py-1 font-medium text-gray-900">
                        {EVENT_LABELS[pointDetails.eventType] || pointDetails.eventType}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-2 text-gray-500">State ID</td>
                      <td className="py-1 font-medium text-gray-900">{pointDetails.state_id}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-2 text-gray-500">District ID</td>
                      <td className="py-1 font-medium text-gray-900">{pointDetails.district_id}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-2 text-gray-500">Block ID</td>
                      <td className="py-1 font-medium text-gray-900">{pointDetails.block_id}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-2 text-gray-500">Survey ID</td>
                      <td className="py-1 font-medium text-gray-900">{pointDetails.survey_id}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-2 text-gray-500">Machine ID</td>
                      <td className="py-1 font-medium text-gray-900">{pointDetails.machine_id}</td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-2 text-gray-500">Point ID</td>
                      <td className="py-1 font-medium text-gray-900">{pointDetails.point_id}</td>
                    </tr>
                    {pointDetails.depth !== null && pointDetails.depth !== undefined && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Depth</td>
                        <td className="py-1 font-medium text-gray-900">{pointDetails.depth} m</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-1 pr-2 text-gray-500 align-top">Coordinates</td>
                      <td className="py-1 font-medium text-gray-900">
                        {pointDetails.lat.toFixed(5)}, {pointDetails.lng.toFixed(5)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
