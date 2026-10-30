import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF as Marker,
  PolylineF as Polyline,
  InfoWindowF as InfoWindow,
  OverlayViewF as OverlayView,
} from '@react-google-maps/api';
import { RefreshCw, CalendarDays } from 'lucide-react';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const ImgBaseUrl = import.meta.env.VITE_Image_URL;
const GoogleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface PoleStringing {
  id: number;
  survey_id: number;
  order_index: number | null;
  pit_id: string | null;
  pole_type: string | null;
  eventType: string | null;
  latitude: number | string;
  longitude: number | string;
  distance: number | null;
  line_type: string | null;
  pole_material: string | null;
  pole_owner: string | null;
  fitting_type: string | null;
  pole_height: string | null;
  drum_number: string | null;
  meter: string | null;
  image: string[] | null;
  created_time: string | null;
  start_lgd_name: string | null;
  end_lgd_name: string | null;
  user_name: string | null;
  user_mobile: string | null;
}

interface PoleInstallation {
  id: number;
  survey_id: number;
  pit_id: string | null;
  latitude: string | number;
  longitude: string | number;
  pit_images: string[] | null;
  pole_images: string[] | null;
  muff_images: string[] | null;
  muff_type: string | null;
  earthing_images: string[] | null;
  crossing_images: string[] | null;
  crossingType: string | null;
  crossingLength: string | number | null;
  status: string | null;
  eventType: string | null;
  created_time: string | null;
  user_name: string | null;
  user_mobile: string | null;
}

interface BlockPreviewResponse {
  status: boolean;
  date: string;
  block: { block_id: number; block_name: string; block_code: number } | null;
  counts: {
    poles: number;
    new_poles: number;
    existing_poles: number;
    stringing_events: number;
    installations: number;
  };
  pole_stringing: PoleStringing[];
  pole_installation: PoleInstallation[];
}


const SURVEY_COLORS = [
  '#2563eb', '#dc2626', '#059669', '#7c3aed', '#ea580c',
  '#0891b2', '#be185d', '#4338ca', '#65a30d', '#f59e0b',
];
const NEW_POLE_COLOR = '#16a34a';
const EXISTING_POLE_COLOR = '#f97316';
const INSTALLATION_COLOR = '#9333ea';

const MAP_OPTIONS: google.maps.MapOptions = { mapTypeId: 'hybrid', streetViewControl: false };
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };
const MARKER_ZOOM = 19;

const toLatLng = (lat: number | string, lng: number | string) => {
  const p = { lat: Number(lat), lng: Number(lng) };
  return Number.isFinite(p.lat) && Number.isFinite(p.lng) && (p.lat !== 0 || p.lng !== 0) ? p : null;
};

const imageUrl = (path: string) => (path.startsWith('http') ? path : `${ImgBaseUrl}${path}`);

const circleIcon = (color: string, scale = 6): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: color,
  fillOpacity: 1,
  strokeColor: '#ffffff',
  strokeWeight: 2,
  scale,
});

const fitToPoints = (map: google.maps.Map | null, points: google.maps.LatLngLiteral[]) => {
  if (!map || !points.length) return;
  const bounds = new google.maps.LatLngBounds();
  points.forEach((pt) => bounds.extend(pt));
  map.fitBounds(bounds);
};

const focusOn = (map: google.maps.Map | null, pos: google.maps.LatLngLiteral | null) => {
  if (!map || !pos) return;
  map.panTo(pos);
  if ((map.getZoom() ?? 0) < MARKER_ZOOM) map.setZoom(MARKER_ZOOM);
};

interface MapCardProps {
  title: string;
  legend: React.ReactNode;
  isLoaded: boolean;
  loadError: Error | undefined;
  onLoad: (map: google.maps.Map) => void;
  onUnmount: () => void;
  onClick: () => void;
  children: React.ReactNode;
}

const MapCard: React.FC<MapCardProps> = ({ title, legend, isLoaded, loadError, onLoad, onUnmount, onClick, children }) => (
  <div className="rounded-lg bg-white p-4 shadow-sm">
    <div className="mb-3 flex flex-wrap items-center gap-4 text-sm">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {legend}
    </div>
    <div className="h-[80vh] min-h-[500px] w-full overflow-hidden rounded-lg">
      {loadError ? (
        <div className="flex h-full items-center justify-center bg-red-50 text-red-600">Error loading Google Maps</div>
      ) : !isLoaded ? (
        <div className="flex h-full items-center justify-center bg-gray-50 text-gray-600">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading map...
        </div>
      ) : (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          onLoad={(m) => {
            m.setCenter(INDIA_CENTER);
            m.setZoom(5);
            onLoad(m);
          }}
          onUnmount={onUnmount}
          onClick={onClick}
          options={MAP_OPTIONS}
        >
          {children}
        </GoogleMap>
      )}
    </div>
  </div>
);

const legendDot = (color: string, label: string) => (
  <span className="flex items-center gap-1 text-gray-600">
    <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} /> {label}
  </span>
);

// Local date as YYYY-MM-DD (toISOString would shift to UTC)
const todayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const AerialBlockActivity: React.FC = () => {
  const blockId = useMemo(() => new URLSearchParams(window.location.search).get('block_id'), []);
  const [date, setDate] = useState(() => new URLSearchParams(window.location.search).get('date') || todayString());
  const [data, setData] = useState<BlockPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stringingMap, setStringingMap] = useState<google.maps.Map | null>(null);
  const [installationMap, setInstallationMap] = useState<google.maps.Map | null>(null);
  const [selectedPole, setSelectedPole] = useState<PoleStringing | null>(null);
  const [selectedInstallation, setSelectedInstallation] = useState<PoleInstallation | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: GoogleKey });

  const fetchData = useCallback(async () => {
    if (!blockId) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ block_id: blockId, date });
      const response = await fetch(`${TraceBASEURL}/pole/block-preview?${params}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const json: BlockPreviewResponse = await response.json();
      if (!json.status) throw new Error('No data found for this block');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [blockId, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stringing poles grouped per survey and ordered by order_index, so each survey draws its own line
  const stringingRoutes = useMemo(() => {
    const groups = new Map<number, PoleStringing[]>();
    (data?.pole_stringing ?? []).forEach((p) => {
      if (!toLatLng(p.latitude, p.longitude)) return;
      const list = groups.get(p.survey_id) ?? [];
      list.push(p);
      groups.set(p.survey_id, list);
    });
    return Array.from(groups.entries()).map(([surveyId, poles], idx) => {
      const sorted = [...poles].sort(
        (a, b) => (a.order_index ?? a.id) - (b.order_index ?? b.id),
      );
      return {
        surveyId,
        color: SURVEY_COLORS[idx % SURVEY_COLORS.length],
        poles: sorted,
        path: sorted.map((p) => toLatLng(p.latitude, p.longitude)!),
        label: `${sorted[0].start_lgd_name ?? '-'} → ${sorted[0].end_lgd_name ?? '-'}`,
      };
    });
  }, [data]);

  // Work can only be ongoing when viewing today's data
  const isToday = (data?.date ?? date) === todayString();

  // Single most recent stringing pole across all routes = ongoing work location
  const latestPole = useMemo(() => {
    if (!isToday) return null;
    const poles = stringingRoutes.flatMap((r) => r.poles);
    if (!poles.length) return null;
    return poles.reduce((a, b) =>
      (b.created_time ?? '') > (a.created_time ?? '') ||
      ((b.created_time ?? '') === (a.created_time ?? '') && b.id > a.id)
        ? b
        : a,
    );
  }, [stringingRoutes, isToday]);

  const installations = useMemo(
    () => (data?.pole_installation ?? []).filter((p) => toLatLng(p.latitude, p.longitude)),
    [data],
  );

  useEffect(() => {
    fitToPoints(stringingMap, stringingRoutes.flatMap((r) => r.path));
  }, [stringingMap, stringingRoutes]);

  useEffect(() => {
    fitToPoints(installationMap, installations.map((p) => toLatLng(p.latitude, p.longitude)!));
  }, [installationMap, installations]);

  if (!blockId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">block_id is missing in the URL.</p>
      </div>
    );
  }


  // Images normally come as arrays, but tolerate a JSON string or a single path
  const toImageList = (images: unknown): string[] => {
    if (Array.isArray(images)) return images.filter((i): i is string => typeof i === 'string' && !!i);
    if (typeof images === 'string' && images) {
      try {
        return toImageList(JSON.parse(images));
      } catch {
        return [images];
      }
    }
    return [];
  };

  const renderImageGroups = (groups: [string, unknown][]) => {
    const filled = groups.filter(([, images]) => toImageList(images).length);
    if (!filled.length) return <div className="mt-2 text-xs text-gray-400">No images</div>;
    return filled.map(([label, images]) => <React.Fragment key={label}>{renderImages(label, images)}</React.Fragment>);
  };

  const renderImages = (label: string, images: unknown) => {
    const list = toImageList(images);
    return (
      <div className="mt-2">
        <div className="text-xs font-semibold text-gray-700">
          {label} ({list.length})
        </div>
        {list.length ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {list.map((img) => (
              <a key={img} href={imageUrl(img)} target="_blank" rel="noreferrer">
                <img src={imageUrl(img)} alt={label} className="h-16 w-16 rounded border object-cover" />
              </a>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400">No images</div>
        )}
      </div>
    );
  };

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex gap-2 text-xs">
      <span className="min-w-[90px] text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">
        {value === null || value === undefined || value === '' ? '-' : value}
      </span>
    </div>
  );

  const renderPoleInfo = (p: PoleStringing) => (
    <div className="max-h-[360px] max-w-[280px] space-y-1 overflow-y-auto">
      <div className="mb-1 text-sm font-semibold">Pole Stringing #{p.order_index ?? p.id}</div>
      {row('Pole Type', p.pole_type)}
      {row('Latitude', p.latitude)}
      {row('Longitude', p.longitude)}
      {renderImages('Images', p.image)}
    </div>
  );

  const renderInstallationInfo = (p: PoleInstallation) => (
    <div className="max-h-[360px] max-w-[280px] space-y-1 overflow-y-auto">
      <div className="mb-1 text-sm font-semibold">Pole Installation</div>
      {/* {row('Status', p.status)} */}
      {row('Event Type', p.eventType)}
      {row('Latitude', p.latitude)}
      {row('Longitude', p.longitude)}
      {row('Created Time', p.created_time)}
      {p.muff_type && row('Muff Type', p.muff_type)}
      {p.crossingType && row('Crossing Type', p.crossingType)}
      {p.crossingLength != null && row('Crossing Length', p.crossingLength)}
      {renderImageGroups([
        ['Pit Images', p.pit_images],
        ['Pole Images', p.pole_images],
        ['Muff Images', p.muff_images],
        ['Earthing Images', p.earthing_images],
        ['Crossing Images', p.crossing_images],
      ])}
    </div>
  );

  const selectedPolePosition = selectedPole ? toLatLng(selectedPole.latitude, selectedPole.longitude) : null;
  const selectedInstallationPosition = selectedInstallation
    ? toLatLng(selectedInstallation.latitude, selectedInstallation.longitude)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Aerial Activity {data?.block ? `- ${data.block.block_name}` : ''}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {data?.date && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" /> {data.date}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            max={todayString()}
            onChange={(e) => {
              if (!e.target.value) return;
              setSelectedPole(null);
              setSelectedInstallation(null);
              setDate(e.target.value);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

    

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MapCard
          title={`Pole Stringing (${data?.pole_stringing?.length ?? 0})`}
          legend={
            <>
              {legendDot(NEW_POLE_COLOR, 'New Pole')}
              {legendDot(EXISTING_POLE_COLOR, 'Existing Pole')}
              {isToday && (
                <span className="flex items-center gap-1 text-gray-600">
                  <span className="relative inline-flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                  </span>
                  Work in progress
                </span>
              )}
            </>
          }
          isLoaded={isLoaded}
          loadError={loadError}
          onLoad={setStringingMap}
          onUnmount={() => setStringingMap(null)}
          onClick={() => setSelectedPole(null)}
        >
          {stringingRoutes.map((r) => (
            <React.Fragment key={r.surveyId}>
              <Polyline path={r.path} options={{ strokeColor: r.color, strokeOpacity: 0.9, strokeWeight: 4 }} />
              {r.poles.map((p) => (
                <Marker
                  key={`s-${p.id}`}
                  position={toLatLng(p.latitude, p.longitude)!}
                  icon={circleIcon(p.pole_type === 'new' ? NEW_POLE_COLOR : EXISTING_POLE_COLOR)}
                  onClick={() => {
                    focusOn(stringingMap, toLatLng(p.latitude, p.longitude));
                    setSelectedPole(p);
                  }}
                />
              ))}
            </React.Fragment>
          ))}

          {latestPole && (
            <OverlayView position={toLatLng(latestPole.latitude, latestPole.longitude)!} mapPaneName="overlayLayer">
              <div className="pointer-events-none relative -translate-x-1/2 -translate-y-1/2">
                <span className="absolute inset-0 h-8 w-8 animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative block h-8 w-8 rounded-full border-2 border-red-500 bg-red-500/30" />
                <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                  Work in progress
                </span>
              </div>
            </OverlayView>
          )}

          {selectedPole && selectedPolePosition && (
            <InfoWindow position={selectedPolePosition} onCloseClick={() => setSelectedPole(null)}>
              {renderPoleInfo(selectedPole)}
            </InfoWindow>
          )}
        </MapCard>

        <MapCard
          title={`Pole Installation (${data?.pole_installation?.length ?? 0})`}
          legend={legendDot(INSTALLATION_COLOR, 'Installation')}
          isLoaded={isLoaded}
          loadError={loadError}
          onLoad={setInstallationMap}
          onUnmount={() => setInstallationMap(null)}
          onClick={() => setSelectedInstallation(null)}
        >
          {installations.map((p) => (
            <Marker
              key={`i-${p.id}`}
              position={toLatLng(p.latitude, p.longitude)!}
              icon={circleIcon(INSTALLATION_COLOR)}
              onClick={() => {
                focusOn(installationMap, toLatLng(p.latitude, p.longitude));
                setSelectedInstallation(p);
              }}
            />
          ))}

          {selectedInstallation && selectedInstallationPosition && (
            <InfoWindow position={selectedInstallationPosition} onCloseClick={() => setSelectedInstallation(null)}>
              {renderInstallationInfo(selectedInstallation)}
            </InfoWindow>
          )}
        </MapCard>
      </div>
    </div>
  );
};

export default AerialBlockActivity;
