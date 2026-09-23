import { useEffect, useRef, useState } from 'react';
import { Navigation, Plus, Minus } from 'lucide-react';
import GoogleMapsLoader from '../hooks/googleMapsLoader';
import type { ProcessedConstruction, ProcessedDesktopPlanning, PlacemarkCategory } from '../../types/kmz';
import stateBoundaries from '../../data/stateBoundaries.json';
import blocks from '../../utils/blockLookup';
import { PLACEMARK_CATEGORIES } from '../SmartInventory/PlaceMark';
import { createImageGalleryHTML } from './imageGalleryHtml';
import { getAuthHeaders } from '../../utils/accessControl';

export interface PoleMapPoint {
  id: number;
  survey_id: number;
  pole_type: string;
  latitude: number;
  longitude: number;
  distance: number;
  construction_type?: string;
  state_name: string;
  district_name: string;
  block_name: string;
}

export interface LayerVisibility {
  poles: boolean;
  construction: boolean;
  planning: boolean;
}

interface BlockDataMapProps {
  poles: PoleMapPoint[];
  constructionPlacemarks: ProcessedConstruction[];
  constructionCategories: PlacemarkCategory[];
  planningPlacemarks: ProcessedDesktopPlanning[];
  planningCategories: PlacemarkCategory[];
  visibleLayers: LayerVisibility;
  // Bumped by the parent every time a new block's data has finished
  // loading, so the map knows to re-fit its viewport to the fresh result
  // set instead of on every unrelated re-render.
  fitToken: number;
  // Highlight the 6 project states (from the locally bundled LGD boundary
  // set) until the user has drilled into a block — gives an at-a-glance
  // "where is there data" view before any search/auto-detect has run.
  highlightStates: boolean;
  onViewportChange?: (zoom: number, bounds: google.maps.LatLngBounds | null) => void;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const BASEURL = import.meta.env.VITE_TraceAPI_URL;
const IMAGE_BASE_URL = import.meta.env.VITE_Image_URL;
const DEFAULT_CENTER = { lat: 22.9734, lng: 78.6569 }; // India

const POLE_COLORS: Record<string, string> = { existing: '#f59e0b', new: '#22c55e' };
const MAX_MARKERS_PER_LAYER = 1200;

// Row returned by GET /get-poledata-preview?ids=<pole_id> — same shape and
// endpoint ExecutiveConstructionView.tsx uses for its pole click handler,
// keyed by survey_id in the response.
interface PolePreviewDetails {
  id: number;
  survey_id: number;
  pit_id?: string | null;
  pole_type?: string | null;
  workType?: string | null;
  muff_type?: string | null;
  pole_height?: string | null;
  drum_number?: string | null;
  meter?: string | null;
  image?: string | null;
  images?: string[];
  created_at?: string | null;
  start_lgd_name?: string | null;
  end_lgd_name?: string | null;
  state_name?: string | null;
  district_name?: string | null;
  block_name?: string | null;
  user_name?: string | null;
  user_mobile?: string | null;
  [key: string]: unknown;
}

const parsePolePhotos = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((p): p is string => typeof p === 'string' && p.trim() !== '');
  }
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === 'string' && p.trim() !== '') : [];
  } catch {
    return [];
  }
};

// state_code in blocksData.json == State_LGD in stateBoundaries.json.
const BLOCK_COUNT_BY_STATE_LGD: Record<number, number> = blocks.reduce((acc, block) => {
  acc[block.state_code] = (acc[block.state_code] || 0) + 1;
  return acc;
}, {} as Record<number, number>);

const isValidLatLng = (lat: number, lng: number) =>
  !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);

function BlockDataMap({
  poles,
  constructionPlacemarks,
  constructionCategories,
  planningPlacemarks,
  planningCategories,
  visibleLayers,
  fitToken,
  highlightStates,
  onViewportChange,
}: BlockDataMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const overlaysRef = useRef<(google.maps.Marker | google.maps.Polyline)[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const statesDataRef = useRef<google.maps.Data | null>(null);
  const stateLabelsRef = useRef<google.maps.Marker[]>([]);
  // Caches /get-poledata-preview results per pole id, and tracks which pole
  // the InfoWindow is currently showing so a slow fetch can't clobber a
  // different pole's popup if the user clicked elsewhere in the meantime.
  const polePreviewCacheRef = useRef<Map<number, PolePreviewDetails | null>>(new Map());
  const openPoleIdRef = useRef<number | null>(null);

  useEffect(() => {
    GoogleMapsLoader.getInstance()
      .loadGoogleMaps(API_KEY, ['places', 'geometry'])
      .then(() => setMapsLoaded(true))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || map) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: false,
    });

    mapInstance.addListener('idle', () => {
      onViewportChange?.(mapInstance.getZoom() ?? 5, mapInstance.getBounds() ?? null);
    });

    infoWindowRef.current = new google.maps.InfoWindow();
    infoWindowRef.current.addListener('closeclick', () => {
      openPoleIdRef.current = null;
    });

    const statesData = new google.maps.Data({ map: mapInstance });
    statesData.addGeoJson(stateBoundaries as GeoJSON.FeatureCollection);
    statesData.setStyle({
      fillColor: '#1c33c8',
      fillOpacity: 0.12,
      strokeColor: '#1c33c8',
      strokeWeight: 1.5,
      strokeOpacity: 0.55,
      clickable: true,
    });
    statesData.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
      statesData.overrideStyle(e.feature, { fillOpacity: 0.3, strokeWeight: 2.5 });
      const stateLgd = e.feature.getProperty('state_lgd') as number;
      const stateName = e.feature.getProperty('state_name') as string;
      const count = BLOCK_COUNT_BY_STATE_LGD[stateLgd] ?? 0;
      if (infoWindowRef.current && e.latLng) {
        openPoleIdRef.current = null;
        infoWindowRef.current.setContent(
          `<div style="padding:6px 8px;font-family:system-ui,sans-serif;font-size:12px">
            <b>${stateName}</b><br/>${count} block${count === 1 ? '' : 's'} in project data
          </div>`,
        );
        infoWindowRef.current.setPosition(e.latLng);
        infoWindowRef.current.open(mapInstance);
      }
    });
    statesData.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
      statesData.revertStyle(e.feature);
      infoWindowRef.current?.close();
    });
    statesData.addListener('click', (e: google.maps.Data.MouseEvent) => {
      const bounds = new google.maps.LatLngBounds();
      e.feature.getGeometry()?.forEachLatLng((latLng) => bounds.extend(latLng));
      mapInstance.fitBounds(bounds, 24);
    });
    statesDataRef.current = statesData;

    stateLabelsRef.current = (stateBoundaries as GeoJSON.FeatureCollection).features.map((feature) => {
      const bounds = new google.maps.LatLngBounds();
      const geometry = feature.geometry;
      const rings =
        geometry.type === 'Polygon' ? geometry.coordinates : geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : [];
      rings.forEach((ring) => ring.forEach(([lng, lat]) => bounds.extend({ lat, lng })));

      return new google.maps.Marker({
        position: bounds.getCenter(),
        map: mapInstance,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 },
        label: {
          text: String(feature.properties?.state_name ?? ''),
          color: '#1c33c8',
          fontSize: '11px',
          fontWeight: '700',
        },
        clickable: false,
      });
    });

    setMap(mapInstance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, map]);

  // Toggle the project-states highlight layer once the user has drilled
  // into a specific block's data — the polygon fill would otherwise sit
  // on top of the plotted markers/polylines.
  useEffect(() => {
    if (!statesDataRef.current) return;
    statesDataRef.current.setStyle({
      fillColor: '#1c33c8',
      fillOpacity: highlightStates ? 0.12 : 0,
      strokeColor: '#1c33c8',
      strokeWeight: highlightStates ? 1.5 : 0,
      strokeOpacity: highlightStates ? 0.55 : 0,
      clickable: highlightStates,
    });
    stateLabelsRef.current.forEach((marker) => marker.setVisible(highlightStates));
  }, [highlightStates, map]);

  const clearOverlays = () => {
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
  };

  // Redraw every layer whenever the data or layer toggles change.
  useEffect(() => {
    if (!map) return;
    clearOverlays();

    // Same color source /smart-inventory's PlaceMark.tsx uses — falls back
    // to the category's own computed color, then a neutral gray.
    const categoryColor = (categories: PlacemarkCategory[], name: string) =>
      PLACEMARK_CATEGORIES[name]?.color || categories.find((c) => c.name === name)?.color || '#6b7280';

    const openInfo = (marker: google.maps.Marker, html: string) => {
      marker.addListener('click', () => {
        if (!infoWindowRef.current) return;
        // A different (non-pole) popup is taking over the shared
        // InfoWindow — stop any in-flight pole preview fetch from
        // overwriting it once it resolves.
        openPoleIdRef.current = null;
        infoWindowRef.current.setContent(html);
        infoWindowRef.current.open(map, marker);
      });
    };

    // Icon shapes ported verbatim from SmartInventory/MapViewer.tsx so
    // construction/desktop-planning markers look identical to /smart-inventory.
    const constructionIcon = (eventType: string, color: string): google.maps.Symbol => {
      if (eventType === 'ENDPIT') {
        return { path: 'M-6,0 L0,-8 L6,0 L0,8 Z', scale: 1, fillColor: color, fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 2, rotation: 180 };
      }
      if (eventType === 'DEPTH' || eventType === 'STARTPIT') {
        return { path: 'M-6,0 L0,-8 L6,0 L0,8 Z', scale: 1, fillColor: color, fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 2 };
      }
      return { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: color, fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 2 };
    };

    const desktopPlanningIcon = (assetType: string, color: string): google.maps.Symbol => {
      switch (assetType) {
        case 'GP':
          return { path: google.maps.SymbolPath.CIRCLE, scale: 14, fillColor: color, fillOpacity: 0.9, strokeColor: '#000000', strokeWeight: 3 };
        case 'BHQ':
        case 'Block Router':
          return { path: 'M-8,-8 L8,-8 L8,8 L-8,8 Z', scale: 1, fillColor: color, fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 3 };
        case 'FPOI':
          return { path: 'M0,-12 L8,8 L-8,8 Z', scale: 1, fillColor: color, fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 2 };
        case 'SJC':
          return { path: 'M-6,-6 L6,-6 L6,6 L-6,6 Z', scale: 1.2, fillColor: color, fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 2, rotation: 45 };
        case 'BJC':
          return { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: color, fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 2 };
        case 'LC':
          return { path: 'M0,-8 L8,0 L0,8 L-8,0 Z', scale: 1, fillColor: color, fillOpacity: 0.9, strokeColor: '#ffffff', strokeWeight: 2 };
        default:
          return {
            path: 'M-6,-6 L6,-6 L6,6 L-6,6 Z M-4,-4 L4,-4 L4,4 L-4,4 Z',
            scale: 1,
            fillColor: color,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          };
      }
    };

    // Basic popup shown immediately on click, then swapped for the richer
    // /get-poledata-preview details once they've loaded (or "no details"
    // if the endpoint came back empty).
    const buildPoleInfoHtml = (pole: PoleMapPoint, details: PolePreviewDetails | null | undefined): string => {
      const basic = `
        <b>Pole #${pole.id}</b><br/>
        Survey: ${pole.survey_id}<br/>
        Type: ${pole.pole_type}${pole.construction_type ? ` (${pole.construction_type})` : ''}<br/>
        ${pole.block_name}, ${pole.district_name}, ${pole.state_name}
      `;

      if (details === undefined) {
        return `<div style="padding:8px;min-width:220px;font-family:system-ui,sans-serif;font-size:12px">${basic}<br/><span style="color:#8290a6">Loading details…</span></div>`;
      }
      if (details === null) {
        return `<div style="padding:8px;min-width:220px;font-family:system-ui,sans-serif;font-size:12px">${basic}<br/><span style="color:#8290a6">No additional details found for this pole.</span></div>`;
      }

      const rows: [string, string][] = [];
      if (details.pit_id) rows.push(['Pit ID', String(details.pit_id)]);
      if (details.workType) rows.push(['Work Type', String(details.workType)]);
      if (details.muff_type) rows.push(['Muff Type', String(details.muff_type)]);
      if (details.start_lgd_name || details.end_lgd_name) {
        rows.push(['Route', `${details.start_lgd_name || '—'} → ${details.end_lgd_name || '—'}`]);
      }
      if (details.pole_height) rows.push(['Pole Height', String(details.pole_height)]);
      if (details.drum_number) rows.push(['Drum Number', String(details.drum_number)]);
      if (details.meter) rows.push(['Meter', String(details.meter)]);
      if (details.user_name) {
        rows.push(['Surveyor', `${details.user_name}${details.user_mobile ? ` (${details.user_mobile})` : ''}`]);
      }
      if (details.created_at) rows.push(['Created', String(details.created_at)]);

      const detailRows = rows
        .map(([label, value]) => `<div><strong>${label}:</strong> ${value}</div>`)
        .join('');

      const photos = parsePolePhotos(details.images ?? details.image);
      const photoGrid = photos.length
        ? `<div style="margin-top:8px"><div style="font-size:11px;color:#6B7280;margin-bottom:4px">Photos</div>
           <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">
             ${photos
               .map(
                 (src) =>
                   `<a href="${IMAGE_BASE_URL}${src}" target="_blank" rel="noreferrer"><img src="${IMAGE_BASE_URL}${src}" style="width:100%;height:48px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb" /></a>`,
               )
               .join('')}
           </div></div>`
        : '';

      return `<div style="padding:8px;min-width:220px;max-width:280px;font-family:system-ui,sans-serif;font-size:12px">
        ${basic}
        <div style="margin-top:6px;padding-top:6px;border-top:1px solid #e5e7eb">${detailRows}</div>
        ${photoGrid}
      </div>`;
    };

    // Fetches (and caches) GET /get-poledata-preview?ids=<pole_id> — same
    // endpoint/response shape ExecutiveConstructionView.tsx uses for its
    // aerial pole click handler.
    const loadPolePreview = async (pole: PoleMapPoint): Promise<void> => {
      if (polePreviewCacheRef.current.has(pole.id)) {
        const cached = polePreviewCacheRef.current.get(pole.id) ?? null;
        if (openPoleIdRef.current === pole.id) infoWindowRef.current?.setContent(buildPoleInfoHtml(pole, cached));
        return;
      }
      try {
        const resp = await fetch(`${BASEURL}/get-poledata-preview?ids=${pole.id}`, { headers: getAuthHeaders() });
        const result = await resp.json();
        const groups: Record<string, PolePreviewDetails[]> = result.status ? result.data || {} : {};
        const row = Object.values(groups).flat()[0] ?? null;
        polePreviewCacheRef.current.set(pole.id, row);
        if (openPoleIdRef.current === pole.id) infoWindowRef.current?.setContent(buildPoleInfoHtml(pole, row));
      } catch (error) {
        console.error('Failed to load pole preview:', error);
        polePreviewCacheRef.current.set(pole.id, null);
        if (openPoleIdRef.current === pole.id) infoWindowRef.current?.setContent(buildPoleInfoHtml(pole, null));
      }
    };

    if (visibleLayers.poles) {
      poles
        .filter((p) => isValidLatLng(p.latitude, p.longitude))
        .slice(0, MAX_MARKERS_PER_LAYER)
        .forEach((pole) => {
          const marker = new google.maps.Marker({
            position: { lat: pole.latitude, lng: pole.longitude },
            map,
            title: `Pole #${pole.id}`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: POLE_COLORS[pole.pole_type] || '#6b7280',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 1.5,
            },
          });
          marker.addListener('click', () => {
            if (!infoWindowRef.current) return;
            openPoleIdRef.current = pole.id;
            infoWindowRef.current.setContent(buildPoleInfoHtml(pole, undefined));
            infoWindowRef.current.open(map, marker);
            loadPolePreview(pole);
          });
          overlaysRef.current.push(marker);
        });
    }

    if (visibleLayers.construction) {
      constructionPlacemarks.slice(0, MAX_MARKERS_PER_LAYER).forEach((pm) => {
        if (pm.type !== 'point' || Array.isArray(pm.coordinates)) return;
        const color = categoryColor(constructionCategories, pm.category);
        const marker = new google.maps.Marker({
          position: pm.coordinates,
          map,
          title: pm.name,
          icon: constructionIcon(pm.eventType, color),
        });

        // Same InfoWindow layout as /smart-inventory's construction-point
        // click handler (MapViewer.tsx), including the photo gallery.
        const coords = pm.coordinates as { lat: number; lng: number };
        const baseInfo = `
          <div class="p-3" style="max-width: 400px;">
            <h3 class="font-semibold text-gray-900 mb-2" style="font-weight: 600; margin-bottom: 8px;">
              ${pm.name}
            </h3>
            <div class="text-sm text-gray-700 space-y-1" style="font-size: 14px;">
              <div><strong>Survey ID:</strong> ${pm.surveyId || 'N/A'}</div>
              <div><strong>ID:</strong> ${pm.id || 'N/A'}</div>
              <div><strong>Category:</strong> ${pm.category}</div>
              <div><strong>Type:</strong> Construction (API)</div>
              <div><strong>Link Name:</strong> ${pm.linkName || 'N/A'}</div>
              <div><strong>Route Belongs To:</strong> ${pm.routeBelongsTo || 'N/A'}</div>
              <div><strong>Road Type:</strong> ${pm.roadType || 'N/A'}</div>
              <div><strong>Cable Laid On:</strong> ${pm.cableLaidOn || 'N/A'}</div>
              <div><strong>Soil Type:</strong> ${pm.soilType || 'N/A'}</div>
              <div><strong>Depth (Meters):</strong> ${pm.depthMeters || 'N/A'}</div>
              <div><strong>Road Width:</strong> ${pm.roadWidth || 'N/A'}</div>
              <div><strong>Distance:</strong> ${pm.distance || 'N/A'}</div>
              <div><strong>Road Margin:</strong> ${pm.roadMargin || 'N/A'}</div>
              <div><strong>Area Type:</strong> ${pm.areaType || 'N/A'}</div>
              <div><strong>Coordinates:</strong> ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}</div>
            </div>
        `;
        const imageGallery = pm.hasImages && pm.images?.length ? createImageGalleryHTML(pm.images) : '';
        openInfo(marker, baseInfo + imageGallery + '</div>');
        overlaysRef.current.push(marker);
      });
    }

    if (visibleLayers.planning) {
      planningPlacemarks.slice(0, MAX_MARKERS_PER_LAYER).forEach((pm) => {
        const color = categoryColor(planningCategories, pm.category);
        if (pm.type === 'point' && !Array.isArray(pm.coordinates)) {
          const assetType = pm.assetType || pm.pointType || 'FPOI';
          const marker = new google.maps.Marker({
            position: pm.coordinates,
            map,
            title: pm.name,
            icon: desktopPlanningIcon(assetType, color),
          });
          // Same InfoWindow content as /smart-inventory's desktop-planning
          // point click handler (MapViewer.tsx).
          openInfo(
            marker,
            `<div class="p-3">
              <h3 class="font-semibold text-gray-900 mb-1">${pm.name}</h3>
              <p class="text-sm text-gray-600">Category: ${pm.category}</p>
              <p class="text-sm text-gray-600">Type: Desktop Planning (API)</p>
              <p class="text-sm text-gray-600">Asset Type: ${pm.assetType || 'N/A'}</p>
              <p class="text-sm text-gray-600">Status: ${pm.status || 'N/A'}</p>
              ${pm.ring ? `<p class="text-sm text-gray-600">Ring: ${pm.ring}</p>` : ''}
              ${pm.lgdCode && pm.lgdCode !== 'NULL' ? `<p class="text-sm text-gray-600">LGD Code: ${pm.lgdCode}</p>` : ''}
              ${pm.networkId ? `<p class="text-sm text-gray-600">Network ID: ${pm.networkId}</p>` : ''}
            </div>`,
          );
          overlaysRef.current.push(marker);
        } else if (pm.type === 'polyline' && Array.isArray(pm.coordinates)) {
          // Same stroke-styling rule as /smart-inventory: 'incremental'
          // connections draw bolder/fully opaque, everything else is a
          // standard weight-3 line — color always comes from the category.
          const isIncremental = pm.connectionType === 'incremental';
          const polyline = new google.maps.Polyline({
            path: pm.coordinates,
            map,
            geodesic: true,
            strokeColor: color,
            strokeWeight: isIncremental ? 4 : 3,
            strokeOpacity: isIncremental ? 1.0 : 0.7,
          });
          polyline.addListener('click', (e: google.maps.PolyMouseEvent) => {
            if (!infoWindowRef.current || !map) return;
            openPoleIdRef.current = null;
            infoWindowRef.current.setContent(
              `<div class="p-3">
                <h3 class="font-semibold text-gray-900 mb-1">${pm.name}</h3>
                <p class="text-sm text-gray-600">Category: ${pm.category}</p>
                <p class="text-sm text-gray-600">Type: Desktop Planning Connection</p>
                <p class="text-sm text-gray-600">Connection Type: ${pm.connectionType || 'N/A'}</p>
                <p class="text-sm text-gray-600">Length: ${pm.length || 'N/A'} km</p>
                <p class="text-sm text-gray-600">Status: ${pm.status || 'N/A'}</p>
                ${pm.networkId ? `<p class="text-sm text-gray-600">Network ID: ${pm.networkId}</p>` : ''}
              </div>`,
            );
            infoWindowRef.current.setPosition(e.latLng ?? pm.coordinates[0]);
            infoWindowRef.current.open(map);
          });
          overlaysRef.current.push(polyline);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, poles, constructionPlacemarks, constructionCategories, planningPlacemarks, planningCategories, visibleLayers]);

  // Fit viewport to the freshly loaded result set. Mirrors exactly what the
  // redraw effect above actually plots — same visibleLayers gating and the
  // same MAX_MARKERS_PER_LAYER cap — otherwise a block with, say, 1,298
  // poles fits bounds around all 1,298 while only the first 1,200 are ever
  // rendered as markers, so the viewport ends up wider than the visible pins.
  useEffect(() => {
    if (!map || fitToken === 0) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoint = false;

    if (visibleLayers.poles) {
      poles
        .filter((p) => isValidLatLng(p.latitude, p.longitude))
        .slice(0, MAX_MARKERS_PER_LAYER)
        .forEach((p) => {
          bounds.extend({ lat: p.latitude, lng: p.longitude });
          hasPoint = true;
        });
    }
    if (visibleLayers.construction) {
      constructionPlacemarks.slice(0, MAX_MARKERS_PER_LAYER).forEach((pm) => {
        const coords = Array.isArray(pm.coordinates) ? pm.coordinates : [pm.coordinates];
        coords.forEach((c) => {
          bounds.extend(c);
          hasPoint = true;
        });
      });
    }
    if (visibleLayers.planning) {
      planningPlacemarks.slice(0, MAX_MARKERS_PER_LAYER).forEach((pm) => {
        const coords = Array.isArray(pm.coordinates) ? pm.coordinates : [pm.coordinates];
        coords.forEach((c) => {
          bounds.extend(c);
          hasPoint = true;
        });
      });
    }

    if (hasPoint) map.fitBounds(bounds, 48);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, fitToken]);

  return (
    <div className="absolute inset-0">
      {!mapsLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#edf4fc]">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#1c33c8]" />
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" />
      {mapsLoaded && (
        <div className="absolute bottom-14 right-4 z-10 flex flex-col items-end gap-2">
          <div className="overflow-hidden rounded-lg bg-white/95 shadow-md">
            <button
              onClick={() => map?.setZoom((map.getZoom() || 5) + 1)}
              className="flex h-8 w-8 items-center justify-center text-[#52617a] hover:bg-[#eef3ff]"
            >
              <Plus size={17} />
            </button>
            <div className="h-px bg-[#e3e8f1]" />
            <button
              onClick={() => map?.setZoom((map.getZoom() || 5) - 1)}
              className="flex h-8 w-8 items-center justify-center text-[#52617a] hover:bg-[#eef3ff]"
            >
              <Minus size={17} />
            </button>
          </div>
          <button
            onClick={() => {
              if (!navigator.geolocation || !map) return;
              navigator.geolocation.getCurrentPosition((position) => {
                map.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
                map.setZoom(14);
              });
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-[#52617a] shadow-md hover:text-[#1c33c8]"
          >
            <Navigation size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default BlockDataMap;
