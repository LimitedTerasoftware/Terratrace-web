import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Grid2X2,
  Layers3,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import BlockDataMap, { type LayerVisibility, type PoleMapPoint } from './BlockDataMap';
import { searchBlocks, getBlockByCode, type BlockRecord } from '../../utils/blockLookup';
import { locateByCoordinates } from '../../utils/bharatlasLocate';
import {
  getAcceptedPoles,
  getConstructionData,
  getDesktopPlanning,
  getStateData,
  getDistrictData,
  getBlockData,
  getExecutiveDashboard,
  type ExecutiveDashboardResponse,
} from '../Services/api';
import { processConstructionData, processDesktopPlanningData } from '../SmartInventory/PlaceMark';
import type {
  DesktopPlanningNetwork,
  PlacemarkCategory,
  ProcessedConstruction,
  ProcessedDesktopPlanning,
} from '../../types/kmz';

// Below this zoom the viewport covers many blocks at once, so reverse
// geocoding the center wouldn't mean much — wait until the user has zoomed
// in to roughly block/town level before attempting auto-detect.
const AUTO_DETECT_MIN_ZOOM = 11;
const AUTO_DETECT_DEBOUNCE_MS = 700;
// ~1km — enough to skip redundant lookups from tiny idle jitters at the
// same spot, small enough to still catch a real pan to the next block.
const AUTO_DETECT_MIN_MOVE_DEG = 0.01;

// Shape common to the /states, /districtsdata and /blocksdata rows once
// normalized — `id` is the internal numeric id these APIs (and the data
// APIs) key on, `code` is the LGD-style code shown/searched by.
interface GeoOption {
  id: number;
  name: string;
  code: number;
}

interface LoadedBlockData {
  poles: PoleMapPoint[];
  constructionPlacemarks: ProcessedConstruction[];
  constructionCategories: PlacemarkCategory[];
  planningPlacemarks: ProcessedDesktopPlanning[];
  planningCategories: PlacemarkCategory[];
  // Raw networks (not yet flattened into placemarks) — carries the
  // route-level summary fields (name, status, total/existing/proposed
  // length) the sidebar's route overview card is built from.
  planningNetworks: DesktopPlanningNetwork[];
}

const EMPTY_DATA: LoadedBlockData = {
  poles: [],
  constructionPlacemarks: [],
  constructionCategories: [],
  planningPlacemarks: [],
  planningCategories: [],
  planningNetworks: [],
};

function OverallMap() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<BlockRecord[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<BlockRecord | null>(null);
  const [blockSource, setBlockSource] = useState<'search' | 'viewport' | null>(null);

  // KPI cards at the top of the page — /get-executive-dashboard, project-wide
  // when no block is selected, scoped to state_id/district_id/block_id once
  // one is.
  const [dashboard, setDashboard] = useState<ExecutiveDashboardResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setDashboardLoading(true);
    const filters = selectedBlock
      ? {
          state_id: selectedBlock.state_id,
          ...(selectedBlock.district_id !== null ? { district_id: selectedBlock.district_id } : {}),
          block_id: selectedBlock.block_id,
        }
      : {};
    getExecutiveDashboard(filters)
      .then((result) => {
        if (!cancelled) setDashboard(result);
      })
      .catch((error) => {
        console.error('Failed to load executive dashboard:', error);
        if (!cancelled) setDashboard(null);
      })
      .finally(() => !cancelled && setDashboardLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedBlock]);

  // State / District / Block cascading filters — an alternative to typing
  // into the search box, sourced live from /states, /districtsdata and
  // /blocksdata (the same endpoints SmartInventory/GeographicSelector.tsx
  // uses) rather than the local blocksData.json.
  const [filterStateId, setFilterStateId] = useState<number | null>(null);
  const [filterDistrictId, setFilterDistrictId] = useState<number | null>(null);
  const [filterBlockId, setFilterBlockId] = useState<number | null>(null);
  const [stateOptions, setStateOptions] = useState<GeoOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<GeoOption[]>([]);
  const [blockOptions, setBlockOptions] = useState<GeoOption[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [blocksLoading, setBlocksLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatesLoading(true);
    getStateData()
      .then((rows: any[]) => {
        if (cancelled) return;
        setStateOptions(rows.map((s) => ({ id: s.state_id, name: s.state_name, code: s.state_code })));
      })
      .catch(() => !cancelled && showNotice('Failed to load states'))
      .finally(() => !cancelled && setStatesLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDistrictOptions([]);
    setBlockOptions([]);
    if (filterStateId === null) return;

    let cancelled = false;
    setDistrictsLoading(true);
    getDistrictData(String(filterStateId))
      .then((rows: any[]) => {
        if (cancelled) return;
        setDistrictOptions(rows.map((d) => ({ id: d.district_id, name: d.district_name, code: d.district_code })));
      })
      .catch(() => !cancelled && showNotice('Failed to load districts'))
      .finally(() => !cancelled && setDistrictsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filterStateId]);

  useEffect(() => {
    setBlockOptions([]);
    if (filterDistrictId === null) return;

    let cancelled = false;
    setBlocksLoading(true);
    getBlockData(String(filterDistrictId))
      .then((rows: any[]) => {
        if (cancelled) return;
        setBlockOptions(rows.map((b) => ({ id: b.block_id, name: b.block_name, code: b.block_code })));
      })
      .catch(() => !cancelled && showNotice('Failed to load blocks'))
      .finally(() => !cancelled && setBlocksLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filterDistrictId]);

  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [detecting, setDetecting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [data, setData] = useState<LoadedBlockData>(EMPTY_DATA);
  const [fitToken, setFitToken] = useState(0);

  const [layersOpen, setLayersOpen] = useState(true);
  const [visibleLayers, setVisibleLayers] = useState<LayerVisibility>({
    poles: true,
    construction: true,
    planning: true,
  });
  // Categories toggled off individually (e.g. just "Construction: Depth"
  // within the Construction layer) — checked-in by default, so a name only
  // appears here once the user has explicitly checked it out.
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());
  const toggleCategory = (name: string): void => {
    setHiddenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const [zoom, setZoom] = useState<number | null>(null);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const autoDetectTimerRef = useRef<number | null>(null);
  const lastLocatedRef = useRef<{ lat: number; lng: number } | null>(null);
  const autoDetectEnabledRef = useRef(autoDetectEnabled);
  const suggestionsOpenRef = useRef(suggestionsOpen);
  const selectedBlockRef = useRef(selectedBlock);

  useEffect(() => {
    autoDetectEnabledRef.current = autoDetectEnabled;
  }, [autoDetectEnabled]);
  useEffect(() => {
    suggestionsOpenRef.current = suggestionsOpen;
  }, [suggestionsOpen]);
  useEffect(() => {
    selectedBlockRef.current = selectedBlock;
  }, [selectedBlock]);

  const showNotice = (message: string): void => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3500);
  };

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setSuggestions(searchBlocks(query));
  }, [query]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selectBlock = (block: BlockRecord, source: 'search' | 'viewport' = 'search'): void => {
    setSelectedBlock(block);
    setBlockSource(source);
    setQuery(`${block.block_name}${block.district_name ? `, ${block.district_name}` : ''}`);
    setSuggestionsOpen(false);
    // Keep the State/District/Block dropdowns in sync however the block
    // was chosen (search, auto-detect, or the dropdowns themselves).
    setFilterStateId(block.state_id);
    setFilterDistrictId(block.district_id);
    setFilterBlockId(block.block_id);
  };

  const clearSelection = (): void => {
    setSelectedBlock(null);
    setBlockSource(null);
    setQuery('');
    setData(EMPTY_DATA);
    lastLocatedRef.current = null;
    setFilterStateId(null);
    setFilterDistrictId(null);
    setFilterBlockId(null);
  };

  const onFilterStateChange = (stateId: number | null): void => {
    setFilterStateId(stateId);
    setFilterDistrictId(null);
    setFilterBlockId(null);
  };

  const onFilterDistrictChange = (districtId: number | null): void => {
    setFilterDistrictId(districtId);
    setFilterBlockId(null);
  };

  const onFilterBlockChange = (blockId: number | null): void => {
    setFilterBlockId(blockId);
    if (blockId === null) return;

    const block = blockOptions.find((b) => b.id === blockId);
    const state = stateOptions.find((s) => s.id === filterStateId);
    const district = districtOptions.find((d) => d.id === filterDistrictId);
    if (!block || !state) return;

    selectBlock(
      {
        block_id: block.id,
        block_code: block.code,
        block_name: block.name,
        district_id: district?.id ?? null,
        district_code: district?.code ?? null,
        district_name: district?.name ?? null,
        state_id: state.id,
        state_code: state.code,
        state_name: state.name,
      },
      'search',
    );
  };

  // Reverse-geocode the map center via bharatlas.com and resolve it to a
  // local block by LGD block_code — the "map viewport -> find block" path,
  // used as an automatic complement to the manual search box above.
  const autoDetectBlock = async (lat: number, lng: number): Promise<void> => {
    setDetecting(true);
    try {
      const located = await locateByCoordinates(lat, lng);
      if (!located?.blockLgd) return;

      const block = getBlockByCode(located.blockLgd);
      if (!block) return;
      if (selectedBlockRef.current?.block_id === block.block_id) return;

      selectBlock(block, 'viewport');
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (!selectedBlock) return;

    let cancelled = false;
    const loadBlockData = async () => {
      setLoading(true);
      try {
        const { block_id, district_id, state_id, block_name } = selectedBlock;
        const districtFilter = district_id !== null ? { district_id } : {};

        const [polesResult, constructionResult, planningResult] = await Promise.allSettled([
          getAcceptedPoles({ state_id, block_id, ...districtFilter }),
          getConstructionData({ state_id, block_id, ...districtFilter }),
          getDesktopPlanning({
            stateId: state_id,
            blockId: block_id,
            ...(district_id !== null ? { districtId: district_id } : {}),
          }),
        ]);

        if (cancelled) return;

        const poles: PoleMapPoint[] =
          polesResult.status === 'fulfilled' && polesResult.value.status ? polesResult.value.data : [];

        const { placemarks: constructionPlacemarks, categories: constructionCategories } =
          constructionResult.status === 'fulfilled'
            ? processConstructionData(constructionResult.value)
            : { placemarks: [], categories: [] };

        const { placemarks: planningPlacemarks, categories: planningCategories } =
          planningResult.status === 'fulfilled'
            ? processDesktopPlanningData(planningResult.value)
            : { placemarks: [], categories: [] };
        const planningNetworks: DesktopPlanningNetwork[] =
          planningResult.status === 'fulfilled' && planningResult.value.status ? planningResult.value.data : [];

        setData({ poles, constructionPlacemarks, constructionCategories, planningPlacemarks, planningCategories, planningNetworks });
        setFitToken((token) => token + 1);

        const prefix = blockSource === 'viewport' ? `Auto-detected ${block_name}` : block_name;
        const failed = [polesResult, constructionResult, planningResult].filter((r) => r.status === 'rejected').length;
        if (failed > 0) {
          showNotice(`${prefix}: ${failed} of 3 data sources failed to load`);
        } else if (poles.length === 0 && constructionPlacemarks.length === 0 && planningPlacemarks.length === 0) {
          showNotice(`No data found for ${prefix}`);
        } else {
          showNotice(`Loaded data for ${prefix}`);
        }
      } catch (error) {
        if (!cancelled) showNotice('Failed to load block data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBlockData();
    return () => {
      cancelled = true;
    };
  }, [selectedBlock]);

  const totalRecords = data.poles.length + data.constructionPlacemarks.length + data.planningPlacemarks.length;
  const existingPoles = useMemo(() => data.poles.filter((p) => p.pole_type === 'existing').length, [data.poles]);
  const newPoles = data.poles.length - existingPoles;

  const visibleConstructionPlacemarks = useMemo(
    () => data.constructionPlacemarks.filter((pm) => !hiddenCategories.has(pm.category)),
    [data.constructionPlacemarks, hiddenCategories],
  );
  const visiblePlanningPlacemarks = useMemo(
    () => data.planningPlacemarks.filter((pm) => !hiddenCategories.has(pm.category)),
    [data.planningPlacemarks, hiddenCategories],
  );

  const viewportLabel = useMemo(() => {
    if (!bounds) return null;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    return `${sw.lat().toFixed(3)}, ${sw.lng().toFixed(3)}  →  ${ne.lat().toFixed(3)}, ${ne.lng().toFixed(3)}`;
  }, [bounds]);

  return (
    <div className="min-h-screen bg-[#f7f9fe] text-[#0b1c30]">
      <header className="sticky top-0 z-40 border-b border-[#d9e2f3] bg-white/95 shadow-[0_1px_10px_rgba(20,42,90,0.05)] backdrop-blur-md">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden shrink-0 items-center gap-1.5 rounded-full bg-[#e6f7f4] px-2.5 py-1 text-[11px] font-medium text-[#176b67] sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#10b981]" /> Live Project Data
            </div>
            <div className="hidden h-5 w-px bg-[#ccd6e7] md:block" />
            <h1 className="truncate text-lg font-bold tracking-tight">Executive Construction View</h1>

            <div ref={searchBoxRef} className="relative ml-2">
              <div className="flex items-center gap-2 rounded-lg bg-[#f0f4fb] px-3 py-1.5">
                <Search size={16} className="text-[#8794aa]" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  placeholder="Search block name, e.g. BORUM..."
                  className="w-48 bg-transparent text-xs outline-none placeholder:text-[#8794aa] md:w-64"
                />
                {loading && <Loader2 size={14} className="animate-spin text-[#1c33c8]" />}
                {selectedBlock && !loading && (
                  <button onClick={clearSelection} className="text-[#8290a6] hover:text-[#0b1c30]">
                    <X size={14} />
                  </button>
                )}
              </div>

              {suggestionsOpen && suggestions.length > 0 && (
                <div className="absolute left-0 top-full z-30 mt-1 max-h-80 w-80 overflow-y-auto rounded-lg bg-white shadow-lg">
                  {suggestions.map((block) => (
                    <button
                      key={block.block_id}
                      onClick={() => selectBlock(block)}
                      className="flex w-full flex-col items-start gap-0.5 border-b border-[#f0f3fa] px-3 py-2 text-left hover:bg-[#f0f4fb] last:border-b-0"
                    >
                      <span className="text-xs font-semibold text-[#0b1c30]">{block.block_name}</span>
                      <span className="text-[10px] text-[#8290a6]">
                        {(block.district_name ?? 'Unknown district')}, {block.state_name} · block_id {block.block_id}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {suggestionsOpen && query.trim() && suggestions.length === 0 && (
                <div className="absolute left-0 top-full z-30 mt-1 w-80 rounded-lg bg-white px-3 py-2 text-xs text-[#8290a6] shadow-lg">
                  No block matches "{query}"
                </div>
              )}
            </div>

            <select
              value={filterStateId ?? ''}
              onChange={(event) => onFilterStateChange(event.target.value ? Number(event.target.value) : null)}
              disabled={statesLoading}
              className="rounded-lg bg-[#f0f4fb] px-2.5 py-1.5 text-xs outline-none disabled:opacity-50"
            >
              <option value="">{statesLoading ? 'Loading states…' : 'State'}</option>
              {stateOptions.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>

            <select
              value={filterDistrictId ?? ''}
              onChange={(event) => onFilterDistrictChange(event.target.value ? Number(event.target.value) : null)}
              disabled={filterStateId === null || districtsLoading}
              className="rounded-lg bg-[#f0f4fb] px-2.5 py-1.5 text-xs outline-none disabled:opacity-50"
            >
              <option value="">{districtsLoading ? 'Loading…' : 'District'}</option>
              {districtOptions.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>

            <select
              value={filterBlockId ?? ''}
              onChange={(event) => onFilterBlockChange(event.target.value ? Number(event.target.value) : null)}
              disabled={filterDistrictId === null || blocksLoading}
              className="rounded-lg bg-[#f0f4fb] px-2.5 py-1.5 text-xs outline-none disabled:opacity-50"
            >
              <option value="">{blocksLoading ? 'Loading…' : 'Block'}</option>
              {blockOptions.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex h-9 items-center justify-between border-t border-[#e2e8f3] bg-[#f2f6ff] px-4 text-xs lg:px-6">
          <div className="flex items-center gap-2 text-[#52617a]">
            <MapPin size={14} className="text-[#1c33c8]" />
            <span className="font-semibold text-[#0b1c30]">
              {selectedBlock
                ? `${selectedBlock.block_name}, ${selectedBlock.district_name ?? '—'}, ${selectedBlock.state_name}`
                : 'No block selected'}
            </span>
            {selectedBlock && <span className="text-[10px] text-[#8290a6]">block_id: {selectedBlock.block_id}</span>}
            {selectedBlock && blockSource === 'viewport' && (
              <span className="flex items-center gap-1 rounded-full bg-[#e5ecff] px-2 py-0.5 text-[9px] font-semibold text-[#1c33c8]">
                <Crosshair size={10} /> Auto-detected from viewport
              </span>
            )}
          </div>
        </div>
      </header>

      <main>
        <KpiRow
          dashboard={dashboard}
          loading={dashboardLoading}
          onAlertsClick={() =>
            navigate('/construction-issues', {
              state: {
                state_id: selectedBlock?.state_id,
                district_id: selectedBlock?.district_id,
                block_id: selectedBlock?.block_id,
              },
            })
          }
        />

        <section className="flex flex-col xl:flex-row">
          <div className="relative min-h-[700px] flex-1 overflow-hidden bg-[#edf4fc] xl:min-h-[calc(100vh-88px)]">
            <div className="absolute right-4 top-3 z-20 flex items-center gap-2">
              <button
                onClick={() => setAutoDetectEnabled((prev) => !prev)}
                title={`Auto-detect block from map viewport (zoom in past ${AUTO_DETECT_MIN_ZOOM} to activate)`}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shadow-md ${
                  autoDetectEnabled ? 'bg-[#1c33c8] text-white hover:bg-[#16279e]' : 'bg-white/95 text-[#52617a] hover:bg-white'
                }`}
              >
                {detecting ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
                Auto-detect
              </button>
              <button
                onClick={() => setLayersOpen(!layersOpen)}
                className="flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold shadow-md hover:bg-white"
              >
                <Layers3 size={16} className="text-[#1c33c8]" /> Layers
              </button>
            </div>

            {!selectedBlock && (
              <div className="absolute left-1/2 top-16 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#35445b] shadow-sm backdrop-blur">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#1c33c8]" />
                Highlighted states have project data — hover for block count, click to zoom in
              </div>
            )}

            <BlockDataMap
              poles={data.poles}
              constructionPlacemarks={visibleConstructionPlacemarks}
              constructionCategories={data.constructionCategories}
              planningPlacemarks={visiblePlanningPlacemarks}
              planningCategories={data.planningCategories}
              visibleLayers={visibleLayers}
              fitToken={fitToken}
              highlightStates={!selectedBlock}
              onViewportChange={(z, b) => {
                setZoom(z);
                setBounds(b);

                if (autoDetectTimerRef.current !== null) {
                  window.clearTimeout(autoDetectTimerRef.current);
                  autoDetectTimerRef.current = null;
                }
                if (!autoDetectEnabledRef.current || suggestionsOpenRef.current || !b || z < AUTO_DETECT_MIN_ZOOM) {
                  return;
                }

                const center = b.getCenter();
                const lat = center.lat();
                const lng = center.lng();
                const last = lastLocatedRef.current;
                if (last && Math.abs(last.lat - lat) < AUTO_DETECT_MIN_MOVE_DEG && Math.abs(last.lng - lng) < AUTO_DETECT_MIN_MOVE_DEG) {
                  return;
                }

                autoDetectTimerRef.current = window.setTimeout(() => {
                  lastLocatedRef.current = { lat, lng };
                  autoDetectBlock(lat, lng);
                }, AUTO_DETECT_DEBOUNCE_MS);
              }}
            />

            {layersOpen && (
              <LayerPanel
                visibleLayers={visibleLayers}
                onToggle={(key) => setVisibleLayers((prev) => ({ ...prev, [key]: !prev[key] }))}
                onClose={() => setLayersOpen(false)}
                poleCount={data.poles.length}
                constructionCategories={data.constructionCategories}
                planningCategories={data.planningCategories}
                hiddenCategories={hiddenCategories}
                onToggleCategory={toggleCategory}
              />
            )}

            <div className="absolute bottom-0 left-0 right-0 z-10 flex h-10 items-center gap-3 overflow-x-auto whitespace-nowrap border-t border-[#d7e0ee] bg-white px-4 text-[11px] text-[#63718a] shadow-inner">
              <b className="flex items-center gap-1 text-[#0b1c30]">
                <MapPin size={14} className="text-[#1c33c8]" /> Viewport:
              </b>
              <span>Zoom: <b className="text-[#0b1c30]">{zoom ?? '—'}</b></span>
              <i>•</i>
              <span>Bounds: <b className="text-[#0b1c30]">{viewportLabel ?? '—'}</b></span>
              <i>•</i>
              <span>Records shown: <b className="text-[#0b1c30]">{totalRecords}</b></span>
            </div>
          </div>

          <InsightsPanel
            selectedBlock={selectedBlock}
            data={data}
            existingPoles={existingPoles}
            newPoles={newPoles}
            loading={loading}
            dashboard={dashboard}
          />
        </section>
      </main>

      {notice && (
        <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#0b1c30] px-4 py-3 text-sm font-medium text-white shadow-xl">
          <CheckCircle2 size={17} className="text-[#8ed8fd]" />
          {notice}
        </div>
      )}
    </div>
  );
}

// /get-executive-dashboard KPI row — project-wide by default, scoped to the
// selected block's state_id/district_id/block_id once one is chosen.
// Formats a possibly-null/undefined API number, defaulting to an em dash —
// /get-executive-dashboard returns null (not just omits the field) for any
// of these when a filter matches no data.
const fmtNum = (value: number | null | undefined, digits = 0): string =>
  value === null || value === undefined ? '—' : digits > 0 ? value.toFixed(digits) : value.toLocaleString('en-IN');

function KpiRow({
  dashboard,
  loading,
  onAlertsClick,
}: {
  dashboard: ExecutiveDashboardResponse | null;
  loading: boolean;
  onAlertsClick: () => void;
}) {
  const construction = dashboard?.construction_built.summary;
  const alerts = dashboard?.open_gis_alerts.summary;
  const acceptedPct =
    construction && construction.totalSurveys && construction.totalSurveys > 0 && construction.acceptedSurveys !== null
      ? Math.round((construction.acceptedSurveys / construction.totalSurveys) * 100)
      : undefined;

  const cards = [
    {
      label: 'Survey Distance',
      value: fmtNum(dashboard?.survey_distance_km, 1),
      suffix: 'KM',
      detail: 'Cumulative surveyed',
      note: 'All accepted surveys',
      tone: 'blue',
      icon: Navigation,
    },
    {
      label: 'Construction Built',
      value: fmtNum(construction?.totalKm, 1),
      suffix: 'KM',
      detail: construction ? `${fmtNum(construction.acceptedSurveys)} / ${fmtNum(construction.totalSurveys)} accepted` : '—',
      note: construction ? `${fmtNum(construction.pendingSurveys)} pending` : '—',
      tone: 'cyan',
      icon: Wrench,
      progress: acceptedPct,
    },
    {
      label: 'Survey → Const Match',
      value: fmtNum(dashboard?.survey_const_match_pct, 1),
      suffix: dashboard?.survey_const_match_pct != null ? '%' : '',
      detail: 'Actual vs sanctioned',
      note: 'Project-wide ratio',
      tone: 'indigo',
      icon: RefreshCw,
    },
    {
      label: 'GPS Integrated',
      value: fmtNum(dashboard?.gps_integrated_count),
      suffix: '',
      detail: 'RFMS synced points',
      note: 'Live sync',
      tone: 'sky',
      icon: Crosshair,
    },
    {
      label: 'GPs Completed',
      value: fmtNum(dashboard?.gps_completed_count),
      suffix: '',
      detail: 'Gram Panchayats',
      note: 'Fully connected',
      tone: 'slate',
      icon: Grid2X2,
    },
    {
      label: 'Open GIS Alerts',
      value: fmtNum(alerts?.total),
      suffix: '',
      detail: alerts ? `${fmtNum(alerts.open)} open · ${fmtNum(alerts.checked)} checked` : '—',
      note: alerts ? `${fmtNum(alerts.low_depth)} low depth · ${fmtNum(alerts.high_depth)} high depth` : '—',
      tone: 'red',
      icon: AlertTriangle,
      critical: alerts && alerts.open ? `${fmtNum(alerts.open)} Open` : undefined,
      onClick: onAlertsClick,
    },
  ] as const;

  return (
    <section className="border-b border-[#e2e8f3] bg-white p-3 lg:px-4">
      <div className={`grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 ${loading ? 'animate-pulse opacity-70' : ''}`}>
        {cards.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} icon={<kpi.icon size={16} />} />
        ))}
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  detail,
  note,
  tone,
  icon,
  progress,
  critical,
  onClick,
}: {
  label: string;
  value: string;
  suffix: string;
  detail: string;
  note: string;
  tone: string;
  icon: ReactNode;
  progress?: number;
  critical?: string;
  onClick?: () => void;
}) {
  const colors: Record<string, string> = {
    blue: 'border-[#1c33c8] text-[#1c33c8]',
    cyan: 'border-[#006686] text-[#006686]',
    indigo: 'border-[#3c50e0] text-[#3c50e0]',
    sky: 'border-[#8ed8fd] text-[#006686]',
    slate: 'border-[#424a5c] text-[#424a5c]',
    red: 'border-[#ba1a1a] text-[#ba1a1a]',
  };
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') onClick();
            }
          : undefined
      }
      className={`min-h-[106px] rounded-lg border-l-[3px] bg-white p-3 shadow-[0_1px_5px_rgba(28,51,91,0.08)] ${colors[tone]} ${
        onClick ? 'cursor-pointer transition-shadow hover:shadow-[0_2px_10px_rgba(28,51,91,0.16)]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#65738a]">{label}</span>
        <span>{icon}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`text-[27px] font-bold tracking-tight ${tone === 'red' ? 'text-[#ba1a1a]' : 'text-[#0b1c30]'}`}>{value}</span>
        {suffix && <span className="text-[10px] font-bold text-[#65738a]">{suffix}</span>}
        {critical && <span className="rounded bg-[#ffe0dc] px-1.5 py-0.5 text-[10px] font-bold text-[#93000a]">{critical}</span>}
      </div>
      <div className="mt-1 text-[10px] text-[#65738a]">{detail}</div>
      <div className="mt-1 flex items-center justify-between text-[10px]">
        {progress !== undefined ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#dce9ff]">
            <div className="h-full rounded-full bg-[#006686]" style={{ width: `${progress}%` }} />
          </div>
        ) : (
          <span className="text-[#7f8ca0]">{note}</span>
        )}
      </div>
    </div>
  );
}

function LayerPanel({
  visibleLayers,
  onToggle,
  onClose,
  poleCount,
  constructionCategories,
  planningCategories,
  hiddenCategories,
  onToggleCategory,
}: {
  visibleLayers: LayerVisibility;
  onToggle: (key: keyof LayerVisibility) => void;
  onClose: () => void;
  poleCount: number;
  constructionCategories: PlacemarkCategory[];
  planningCategories: PlacemarkCategory[];
  hiddenCategories: Set<string>;
  onToggleCategory: (name: string) => void;
}) {
  const constructionCount = constructionCategories.reduce((sum, c) => sum + c.count, 0);
  const planningCount = planningCategories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="absolute left-4 top-16 z-20 w-72 rounded-xl bg-white/95 p-3.5 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between border-b border-[#e6ebf3] pb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
          <Layers3 size={16} className="text-[#1c33c8]" /> GIS Layer Control
        </div>
        <button onClick={onClose} className="text-[#8290a6] hover:text-[#0b1c30]">
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[360px] space-y-1 overflow-y-auto pt-3 text-[11px]">
        <label className="flex cursor-pointer items-center justify-between rounded p-1.5 hover:bg-[#f0f4fb]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            Accepted Poles ({poleCount})
          </span>
          <input type="checkbox" checked={visibleLayers.poles} onChange={() => onToggle('poles')} className="accent-[#1c33c8]" />
        </label>
        <label className="flex cursor-pointer items-center justify-between rounded p-1.5 hover:bg-[#f0f4fb]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
            Construction Data ({constructionCount})
          </span>
          <input
            type="checkbox"
            checked={visibleLayers.construction}
            onChange={() => onToggle('construction')}
            className="accent-[#1c33c8]"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between rounded p-1.5 hover:bg-[#f0f4fb]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-3 rounded-full" style={{ backgroundColor: '#7c3aed' }} />
            Desktop Planning ({planningCount})
          </span>
          <input
            type="checkbox"
            checked={visibleLayers.planning}
            onChange={() => onToggle('planning')}
            className="accent-[#1c33c8]"
          />
        </label>

        {constructionCategories.length > 0 && (
          <div className="mt-2 border-t border-[#e6ebf3] pt-2">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8490a4]">Construction Categories</div>
            {constructionCategories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center justify-between rounded px-1.5 py-1 hover:bg-[#f0f4fb]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                  <span className="text-[#8290a6]">({c.count})</span>
                </span>
                <input
                  type="checkbox"
                  checked={!hiddenCategories.has(c.name)}
                  onChange={() => onToggleCategory(c.name)}
                  className="accent-[#1c33c8]"
                />
              </label>
            ))}
          </div>
        )}

        {planningCategories.length > 0 && (
          <div className="mt-2 border-t border-[#e6ebf3] pt-2">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#8490a4]">Planning Categories</div>
            {planningCategories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center justify-between rounded px-1.5 py-1 hover:bg-[#f0f4fb]">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                  <span className="text-[#8290a6]">({c.count})</span>
                </span>
                <input
                  type="checkbox"
                  checked={!hiddenCategories.has(c.name)}
                  onChange={() => onToggleCategory(c.name)}
                  className="accent-[#1c33c8]"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InsightsPanel({
  selectedBlock,
  data,
  existingPoles,
  newPoles,
  loading,
  dashboard,
}: {
  selectedBlock: BlockRecord | null;
  data: LoadedBlockData;
  existingPoles: number;
  newPoles: number;
  loading: boolean;
  dashboard: ExecutiveDashboardResponse | null;
}) {
  if (!selectedBlock) {
    return (
      <aside className="w-full shrink-0 space-y-4 overflow-y-auto bg-white p-4 shadow-sm xl:w-[340px] xl:max-h-[calc(100vh-88px)]">
        <div className="rounded-xl bg-[#eef4ff] p-4 text-center">
          <Search size={22} className="mx-auto mb-2 text-[#1c33c8]" />
          <p className="text-xs text-[#52617a]">
            Search for a block above, or zoom into the map past level {AUTO_DETECT_MIN_ZOOM} with Auto-detect on — its accepted
            poles, construction progress and desktop planning data will load automatically.
          </p>
        </div>
      </aside>
    );
  }

  const hasData = data.poles.length > 0 || data.constructionPlacemarks.length > 0 || data.planningPlacemarks.length > 0;

  return (
    <aside className="w-full shrink-0 space-y-4 overflow-y-auto bg-white p-4 shadow-sm xl:w-[340px] xl:max-h-[calc(100vh-88px)]">
      <div className="rounded-xl bg-[#eef4ff] p-3">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#1c33c8]">
          Active Inspection Unit
          {loading ? (
            <span className="flex items-center gap-1 rounded-full bg-[#d5f6ee] px-2 py-1 text-[9px] text-[#047857]">
              <Loader2 size={10} className="animate-spin" /> Loading
            </span>
          ) : hasData ? (
            <span className="flex items-center gap-1 rounded-full bg-[#d5f6ee] px-2 py-1 text-[9px] text-[#047857]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />Field Link Data

            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-[#ffe0dc] px-2 py-1 text-[9px] text-[#93000a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#dc2626]" /> No Data
            </span>
          )}
        </div>
        <h2 className="mt-1 text-lg font-bold">{selectedBlock.block_name}</h2>
        <p className="text-xs text-[#63718a]">
          {selectedBlock.district_name ?? 'Unknown district'} · {selectedBlock.state_name}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2 border-t border-[#dce5f3] pt-2 text-center text-[10px]">
          <div>
            <b className="block text-[#0b1c30]">{selectedBlock.block_id}</b>
            <span className="text-[#8692a5]">Block ID</span>
          </div>
          <div>
            <b className="block text-[#0b1c30]">{selectedBlock.district_id ?? '—'}</b>
            <span className="text-[#8692a5]">District ID</span>
          </div>
          <div>
            <b className="block text-[#0b1c30]">{selectedBlock.state_id}</b>
            <span className="text-[#8692a5]">State ID</span>
          </div>
        </div>
      </div>

      <RouteOverviewCard networks={data.planningNetworks} dashboard={dashboard} />

      <div className="space-y-2">
        <Metric label="Accepted Poles" value={data.poles.length} note={`${newPoles} new · ${existingPoles} existing`} />
        <Metric
          label="Construction Points"
          value={data.constructionPlacemarks.length}
          note={data.constructionCategories.map((c) => c.name.replace('Construction: ', '')).join(', ') || 'No data'}
        />
        <Metric
          label="Desktop Planning Assets"
          value={data.planningPlacemarks.length}
          note={data.planningCategories.length > 0 ? `${data.planningCategories.length} categories` : 'No data'}
        />
      </div>

      {!loading &&
        data.poles.length === 0 &&
        data.constructionPlacemarks.length === 0 &&
        data.planningPlacemarks.length === 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-[#fff8e6] p-3 text-[11px] text-[#8a6d00]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            No accepted poles, construction or planning data was returned for this block yet.
          </div>
        )}
    </aside>
  );
}

// Built from the raw desktop-planning network response (total/existing/
// proposed length, name, status) — the same fields RoutePlanning/RouteList.tsx
// shows in its table, here rolled up into the mockup's "Route" card shape
// but with real numbers instead of placeholder ones.
function RouteOverviewCard({
  networks,
  dashboard,
}: {
  networks: DesktopPlanningNetwork[];
  dashboard: ExecutiveDashboardResponse | null;
}) {
  if (networks.length === 0) return null;

  const toKm = (value: string) => {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  };

  const totalKm = networks.reduce((sum, n) => sum + toKm(n.total_length), 0);
  const proposedKm = networks.reduce((sum, n) => sum + toKm(n.proposed_length), 0);

  // "Actual Built" mirrors the Construction Built KPI card (same
  // /get-executive-dashboard scoping to this block) rather than the desktop
  // planning network's own existing_length, so the two stay consistent.
  const actualBuiltKm = dashboard?.construction_built.summary.totalKm ?? null;
  const remainingKm = actualBuiltKm !== null ? Math.max(totalKm - actualBuiltKm, 0) : null;
  const percent = actualBuiltKm !== null && totalKm > 0 ? Math.min(100, Math.round((actualBuiltKm / totalKm) * 100)) : 0;

  const primary = networks[0];
  const routeName = networks.length > 1 ? `${primary.name} +${networks.length - 1} more` : primary.name;

  return (
    <div className="rounded-xl border-l-[3px] border-[#1c33c8] bg-white p-3.5 shadow-[0_2px_10px_rgba(28,51,91,0.1)]">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold">{routeName}</h3>
            <span className="rounded bg-[#dfe0ff] px-1.5 py-0.5 text-[10px] font-bold text-[#172fc5]">Desktop Planning</span>
          </div>
          {primary.main_point_name && <p className="text-[11px] text-[#63718a]">{primary.main_point_name}</p>}
        </div>
        <span className="whitespace-nowrap rounded-full bg-[#d8f4ff] px-2 py-1 text-[10px] font-bold text-[#005f7d]">
          {primary.status || 'Planned'} ({percent}%)
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <RouteMetric label="Survey Distance" value={`${totalKm.toFixed(2)} KM`} note="Total network length" />
        <RouteMetric label="Planned Const." value={`${proposedKm.toFixed(2)} KM`} note="Proposed cable" />
        <RouteMetric label="Actual Built" value={`${fmtNum(actualBuiltKm, 2)} KM`} note={`${percent}% constructed`} good />
        <RouteMetric
          label="Remaining"
          value={`${remainingKm !== null ? remainingKm.toFixed(2) : '—'} KM`}
          note="Left to build"
          alert={!!remainingKm && remainingKm > 0}
        />
      </div>
    </div>
  );
}

function RouteMetric({
  label,
  value,
  note,
  good,
  alert,
}: {
  label: string;
  value: string;
  note: string;
  good?: boolean;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-lg p-2 ${alert ? 'bg-[#fff0ee]' : 'bg-[#f0f4fb]'}`}>
      <div className={`text-[10px] ${alert ? 'font-semibold text-[#ba1a1a]' : 'text-[#63718a]'}`}>{label}</div>
      <div className={`text-sm font-bold ${good ? 'text-[#047857]' : alert ? 'text-[#ba1a1a]' : ''}`}>{value}</div>
      <div className={`text-[10px] ${alert ? 'text-[#ba1a1a]' : 'text-[#63718a]'}`}>{note}</div>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-lg border-l-[3px] border-[#1c33c8] bg-[#f0f4fb] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#63718a]">{label}</div>
      <div className="text-xl font-bold text-[#0b1c30]">{value.toLocaleString('en-IN')}</div>
      <div className="mt-0.5 truncate text-[10px] text-[#8692a5]" title={note}>
        {note}
      </div>
    </div>
  );
}

export default OverallMap;
