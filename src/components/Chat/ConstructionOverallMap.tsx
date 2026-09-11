import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigation, Plus, Minus, MapPin } from 'lucide-react';
import GoogleMapsLoader from '../hooks/googleMapsLoader';
import { OverallConstructionBlock } from '../Services/api';
import { ProcessedDesktopPlanning, PlacemarkCategory } from '../../types/kmz';

interface ConstructionOverallMapProps {
  data: OverallConstructionBlock[];
  planningPlacemarks?: ProcessedDesktopPlanning[];
  planningCategories?: PlacemarkCategory[];
}

interface FlatPoint {
  lat: number;
  lng: number;
  point_id: number;
  eventType: string;
  depth: number | null;
  survey_id: number;
  machine_id: string;
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

// Below this zoom the number of construction points can run into the
// thousands, so individual markers/polylines are skipped (creating that many
// Marker/Polyline instances at once is what freezes the page) in favor of
// grouped count markers. Past this zoom, exact points and per-survey
// polylines are drawn instead.
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

export default function ConstructionOverallMap({
  data,
  planningPlacemarks = [],
  planningCategories = [],
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

  const buildInfoContent = (point: FlatPoint) => `
    <div style="padding: 10px; min-width: 200px; font-family: system-ui, sans-serif;">
      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 13px; font-weight: 600;">
        ${EVENT_LABELS[point.eventType] || point.eventType}
      </h3>
      <table style="width: 100%; font-size: 12px; color: #4b5563;">
        <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">Survey ID:</td><td>${point.survey_id}</td></tr>
        <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">Machine ID:</td><td>${point.machine_id}</td></tr>
        <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">Point ID:</td><td>${point.point_id}</td></tr>
        ${point.depth !== null && point.depth !== undefined ? `<tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">Depth:</td><td>${point.depth} m</td></tr>` : ''}
        <tr><td style="padding: 2px 8px 2px 0; font-weight: 500;">Coordinates:</td><td>${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}</td></tr>
      </table>
    </div>
  `;

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

    // A shared InfoWindow (content built lazily on click) instead of one
    // per marker — with up to MAX_VISIBLE_MARKERS on screen, eagerly
    // building and instantiating an InfoWindow for every marker is what was
    // freezing the page at high zoom.
    marker.addListener('click', () => {
      const infoWindow = infoWindowRef.current;
      if (!infoWindow) return;
      infoWindow.setContent(buildInfoContent(point));
      infoWindow.open(map, marker);
    });

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
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 3,
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

  // At low zoom, group nearby construction points into count markers so the
  // page never has to create thousands of Marker/Polyline instances at once.
  // Once the user zooms in far enough, plot exact points and the per-survey
  // route polylines instead.
  useEffect(() => {
    if (!map) return;

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

      const visiblePaths = (
        bounds
          ? surveyPaths.filter((s) => s.path.some((p) => bounds.contains(p)))
          : surveyPaths
      ).slice(0, MAX_VISIBLE_POLYLINES);

      visiblePaths.forEach((survey) => {
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

  const eventCounts = flatPoints.reduce<Record<string, number>>((acc, point) => {
    acc[point.eventType] = (acc[point.eventType] || 0) + 1;
    return acc;
  }, {});

  const legendEntries = [
    ...Object.entries(EVENT_LABELS)
      .filter(([type]) => eventCounts[type] > 0)
      .map(([type, label]) => ({
        key: type,
        label,
        color: EVENT_COLORS[type],
        count: eventCounts[type],
      })),
    ...planningCategories
      .filter((c) => c.count > 0)
      .map((c) => ({ key: c.id, label: c.name, color: c.color, count: c.count })),
  ];

  return (
    <div className="relative w-full h-full">
      {!mapsLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full min-h-[280px]" />

      {mapsLoaded && zoom < MIN_ZOOM_FOR_MARKERS && flatPoints.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200 z-20 max-w-[280px] text-center">
          <span className="text-xs text-gray-600 font-medium">
            Showing grouped markers — zoom in to view exact points and survey routes
          </span>
        </div>
      )}

      {legendEntries.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-sm max-w-[220px] max-h-[60vh] overflow-y-auto">
          <div className="font-semibold text-gray-700 mb-2">Legend</div>
          {legendEntries.map((entry) => (
            <div key={entry.key} className="flex items-center gap-2 py-0.5">
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

      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-gray-200 z-20">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-gray-600 font-medium">
            {flatPoints.length} Points · {surveyPaths.length} Surveys
          </span>
        </div>
      </div>
    </div>
  );
}
