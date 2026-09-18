import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Maximize2, LayoutDashboard } from 'lucide-react';
import SearchableSelect from '../Forms/SearchableSelect';
import {
  getStateData,
  getDistrictData,
  getBlockData,
  getAcceptedPoles,
  getPoleDashboard,
  getOverallConstruction,
} from '../Services/api';
import type {
  AcceptedPolesResponse,
  PoleDashboardResponse,
  OverallConstructionBlock,
} from '../Services/api';
import { Block, District, StateData } from '../../types/survey';
import { GoogleMap } from '../SmartInventory/MapViewer';
import {
  processJointsData,
  processDesktopPlanningData,
} from '../SmartInventory/PlaceMark';
import GISMap from '../Chat/GISMap';
import ConstructionOverallMap, { MilestoneItem, HealthIndexData } from '../Chat/ConstructionOverallMap';
import { StatsCard } from '../Chat/StatsCard';
import {
  JointsApiResponse,
  ProcessedJoints,
  ProcessedDesktopPlanning,
  DesktopPlanningApiResponse,
  PlacemarkCategory,
} from '../../types/kmz';

// Same "Approved KMZ" category whitelist used by the construction-progress-map view
// (that view fetches 'Desktop : Offset Cable' too, but always excludes it from its
// default-visible categories and legend — this page has no toggle UI, so it's left
// out of the whitelist entirely instead).
const DESKTOP_PLANNING_CATEGORIES = [
  'Desktop: GP',
  'Desktop: FPOI',
  'Desktop: Block Router',
  'Desktop: Proposed Cable',
  'Desktop : Block to FPOI Cable',
  'Desktop: Incremental Cable',
];

const BASEURL = import.meta.env.VITE_TraceAPI_URL;

const formatNumber = (num: number) => num.toLocaleString('en-IN');

const formatAvgDistanceM = (distanceKm: number, count: number) => {
  if (!count) return '-';
  return `${formatNumber(Number(((distanceKm * 1000) / count).toFixed(2)))} M`;
};

type TabType = 'construction' | 'aerial' | 'joints';

const TABS: { id: TabType; label: string }[] = [
  { id: 'construction', label: 'Construction' },
  { id: 'aerial', label: 'Aerial' },
  { id: 'joints', label: 'Joints' },
];

// Illustrative rollout targets — not yet backed by a milestone-tracking API,
// so these are static placeholders shared by every tab's Project Insights panel.
const MILESTONE_ITEMS: MilestoneItem[] = [
  { label: 'New Construction', percent: 92, colorClass: 'bg-green-500' },
  { label: 'Rectification', percent: 84, colorClass: 'bg-blue-500' },
  { label: 'Joint Chamber Construction', percent: 78, colorClass: 'bg-indigo-500' },
  { label: 'Protection', percent: 64, colorClass: 'bg-orange-500' },
];

// Same static-placeholder treatment, scoped to the Aerial tab's own milestones.
const AERIAL_MILESTONE_ITEMS: MilestoneItem[] = [
  { label: 'Pit Work', percent: 40, colorClass: 'bg-blue-500' },
  { label: 'Muff Work', percent: 30, colorClass: 'bg-indigo-500' },
  { label: 'Earthing', percent: 20, colorClass: 'bg-orange-500' },
  { label: 'Pole Installed', percent: 10, colorClass: 'bg-green-500' },
];

// Construction has no executive-level aggregate API yet, so this row is a
// static placeholder (same treatment as MILESTONE_ITEMS above) until one
// exists — swap these for real values once that endpoint is available.
const CONSTRUCTION_KPI_CARDS: {
  label: string;
  value: string;
  accentColor: 'default' | 'green' | 'blue' | 'yellow' | 'red';
  breakdown?: { label: string; value: string }[];
}[] = [
  { label: 'Total Surveys', value: formatNumber(8297), accentColor: 'blue' },
  { label: 'Total Links', value: formatNumber(6842), accentColor: 'blue' },
  { label: 'Accepted Surveys', value: formatNumber(7668), accentColor: 'green' },
  { label: 'Pending Surveys', value: formatNumber(412), accentColor: 'yellow' },
  { label: 'Rejected Surveys', value: formatNumber(217), accentColor: 'red' },
  { label: 'Total Distance', value: `${formatNumber(2145.32)} KM`, accentColor: 'blue' },
];

// Same reasoning as CONSTRUCTION_KPI_CARDS — no depth-compliance/health-scoring
// API for Construction yet, so this is a static placeholder until one exists.
const CONSTRUCTION_HEALTH_INDEX: HealthIndexData = {
  percent: 88,
  status: 'Stable',
  description:
    '8,297 surveys distributed over 142 blocks. 3 critical depth compliance bottlenecks detected.',
};

interface InsightGroup {
  key: string;
  label: string;
  sub: string;
}

// Standalone "Project Insights" sidebar for the Aerial/Joints tabs, mirroring
// the panel ConstructionOverallMap renders natively for the Construction tab.
function ProjectInsightsPanel({
  healthPercent,
  healthDescription,
  groups,
  groupsLabel,
  milestones,
}: {
  healthPercent: number | null;
  healthDescription: string;
  groups: InsightGroup[];
  groupsLabel: string;
  milestones: MilestoneItem[];
}) {
  const healthBadgeClass =
    healthPercent === null
      ? ''
      : healthPercent >= 90
      ? 'bg-green-100 text-green-700'
      : healthPercent >= 70
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';

  return (
    <div className="w-80 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <LayoutDashboard className="w-4 h-4 text-blue-600" />
        <span className="font-semibold text-gray-900 text-sm">Project Insights</span>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-900">
            {healthPercent === null ? 'Summary' : 'Project Health Index'}
          </span>
          {healthPercent !== null && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${healthBadgeClass}`}>
              {healthPercent >= 90 ? 'Stable' : healthPercent >= 70 ? 'Watch' : 'At Risk'}
            </span>
          )}
        </div>
        {healthPercent !== null && (
          <div className="text-2xl font-bold text-gray-900 mb-1">{healthPercent}%</div>
        )}
        <p className="text-xs text-gray-500">{healthDescription}</p>
      </div>

      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-900">Milestone Progress</span>
          <span className="text-xs text-blue-600 font-medium">Target: Q4 2026</span>
        </div>
        <div className="space-y-3">
          {milestones.map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>{m.label}</span>
                <span className="font-semibold text-gray-900">{m.percent}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${m.colorClass}`} style={{ width: `${m.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {groups.length > 0 && (
        <div className="p-4">
          <div className="text-xs font-medium text-gray-500 mb-1.5">{groupsLabel}</div>
          <div className="space-y-1.5">
            {groups.map((g) => (
              <div key={g.key} className="flex items-center justify-between text-sm bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-600 truncate" title={g.label}>{g.label}</span>
                <span className="text-gray-400 flex-shrink-0 ml-2">{g.sub}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ExecutiveConstructionViewProps {
  // When true, renders just the map full-bleed (no header/filters/stat cards) —
  // used by the "Full View" tab opened from the normal dashboard view.
  fullView?: boolean;
}

export default function ExecutiveConstructionView({ fullView = false }: ExecutiveConstructionViewProps) {
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>(
    (searchParams.get('tab') as TabType) || 'construction',
  );

  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || '');
  const [selectedBlock, setSelectedBlock] = useState(searchParams.get('block') || '');

  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const [loadingMapData, setLoadingMapData] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const [overallConstructionData, setOverallConstructionData] = useState<OverallConstructionBlock[]>([]);

  const [planningPlacemarks, setPlanningPlacemarks] = useState<ProcessedDesktopPlanning[]>([]);
  const [planningCategories, setPlanningCategories] = useState<PlacemarkCategory[]>([]);

  const [jointsPlacemarks, setJointsPlacemarks] = useState<ProcessedJoints[]>([]);
  const [jointsCategories, setJointsCategories] = useState<PlacemarkCategory[]>([]);

  const [acceptedPoles, setAcceptedPoles] = useState<AcceptedPolesResponse['data']>([]);

  const [poleStats, setPoleStats] = useState<PoleDashboardResponse['data'] | null>(null);
  const [loadingPoleStats, setLoadingPoleStats] = useState(false);

  const blockSelected = Boolean(selectedState && selectedDistrict && selectedBlock);

  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true);
      try {
        const data = await getStateData();
        setStates(data || []);
      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      setSelectedDistrict('');
      return;
    }
    const fetchDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const data = await getDistrictData(selectedState);
        setDistricts(data || []);
      } catch (error) {
        console.error('Error fetching districts:', error);
      } finally {
        setLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [selectedState]);

  useEffect(() => {
    if (!selectedDistrict) {
      setBlocks([]);
      setSelectedBlock('');
      return;
    }
    const fetchBlocks = async () => {
      setLoadingBlocks(true);
      try {
        const data = await getBlockData(selectedDistrict);
        setBlocks(data || []);
      } catch (error) {
        console.error('Error fetching blocks:', error);
      } finally {
        setLoadingBlocks(false);
      }
    };
    fetchBlocks();
  }, [selectedDistrict]);

  // Load the active tab's map data whenever the tab or the selected block changes.
  // Construction (like Aerial) loads unfiltered on first render — the state/
  // district/block filters just narrow an already-visible map.
  useEffect(() => {
    if (!blockSelected && activeTab === 'joints') {
      setJointsPlacemarks([]);
      setJointsCategories([]);
      setMapError(null);
      return;
    }


    const params = {
      state_id: selectedState,
      district_id: selectedDistrict,
      block_id: selectedBlock,
    };

    const loadMapData = async () => {
      setLoadingMapData(true);
      setMapError(null);
      try {
        if (activeTab === 'construction') {
          const resp = await getOverallConstruction({
            stateId: selectedState,
            district_id: selectedDistrict,
            block_id: selectedBlock,
          });
          setOverallConstructionData(resp.status ? resp.data || [] : []);
        } else if (activeTab === 'joints') {
          const resp = await axios.get<JointsApiResponse>(
            `${BASEURL}/fetch-joints-location`,
            { params },
          );
          const { placemarks, categories } = processJointsData(resp.data);
          setJointsPlacemarks(placemarks);
          setJointsCategories(categories);
        } else {
          const resp = await getAcceptedPoles(params);
          setAcceptedPoles(resp.status ? resp.data || [] : []);
        }
      } catch (error) {
        console.error(`Failed to load ${activeTab} map data:`, error);
        setMapError(`Failed to load ${activeTab} data for this block.`);
        if (activeTab === 'construction') {
          setOverallConstructionData([]);
        } else if (activeTab === 'joints') {
          setJointsPlacemarks([]);
          setJointsCategories([]);
        } else {
          setAcceptedPoles([]);
        }
      } finally {
        setLoadingMapData(false);
      }
    };

    loadMapData();
  }, [activeTab, blockSelected, selectedState, selectedDistrict, selectedBlock]);

  // Approved KMZ (desktop planning) overlay for the construction map —
  // same /get-desktop-planning call and category whitelist as construction-progress-map.
  useEffect(() => {
    if (activeTab !== 'construction' || !blockSelected) {
      setPlanningPlacemarks([]);
      setPlanningCategories([]);
      return;
    }

    let mounted = true;
    const loadDesktopPlanning = async () => {
      try {
        const response = await axios.post(
          `${BASEURL}/get-desktop-planning`,
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
          ).filter(
                  (cat) => cat.name !== 'Desktop : Offset Cable',
                );
          setPlanningPlacemarks(filteredPlacemarks);
          setPlanningCategories(filteredCategories);
         
        } else {
          setPlanningPlacemarks([]);
          setPlanningCategories([]);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('Error fetching desktop planning data:', error);
        setPlanningPlacemarks([]);
        setPlanningCategories([]);
      }
    };

    loadDesktopPlanning();
    return () => {
      mounted = false;
    };
  }, [activeTab, blockSelected, selectedState, selectedDistrict, selectedBlock]);

  // Aerial stat cards — same source as the Aerial Dashboard's pole stats row.
  useEffect(() => {
    if (activeTab !== 'aerial') {
      setPoleStats(null);
      return;
    }

    const loadPoleStats = async () => {
      setLoadingPoleStats(true);
      try {
        const resp = await getPoleDashboard({
          state_id: selectedState || undefined,
          district_id: selectedDistrict || undefined,
          block_id: selectedBlock || undefined,
        });
        setPoleStats(resp.status ? resp.data : null);
      } catch (error) {
        console.error('Failed to load pole stats:', error);
        setPoleStats(null);
      } finally {
        setLoadingPoleStats(false);
      }
    };

    loadPoleStats();
  }, [activeTab, selectedState, selectedDistrict, selectedBlock]);

  const jointsVisibleCategories = useMemo(
    () => new Set(jointsCategories.map((c) => c.id)),
    [jointsCategories],
  );

  // The construction tab renders its own legend (event types + Approved KMZ
  // overlay) inside ConstructionOverallMap, so it's excluded here.
  const activeCategories = activeTab === 'joints' ? jointsCategories : [];

  const aerialStatsCards = poleStats
    ? [
        {
          label: 'Total Poles',
          value: formatNumber(poleStats.total_poles),
          accentColor: 'blue' as const,
          breakdown: [
            {
              label: 'Distance',
              value: `${formatNumber(poleStats.total_distance_km)} KM`,
            },
            {
              label: 'Avg/Pole',
              value: formatAvgDistanceM(
                poleStats.total_distance_km,
                poleStats.total_poles,
              ),
            },
          ],
        },
        {
          label: 'New Poles',
          value: formatNumber(poleStats.new_poles),
          accentColor: 'green' as const,
          breakdown: [
            {
              label: 'Distance',
              value: `${formatNumber(poleStats.new_poles_distance_km)} KM`,
            },
            {
              label: 'Avg/Pole',
              value: formatAvgDistanceM(
                poleStats.new_poles_distance_km,
                poleStats.new_poles,
              ),
            },
          ],
        },
        {
          label: 'Existing Poles',
          value: formatNumber(poleStats.existing_poles),
          accentColor: 'red' as const,
          breakdown: [
            {
              label: 'Distance',
              value: `${formatNumber(poleStats.existing_poles_distance_km)} KM`,
            },
            {
              label: 'Avg/Pole',
              value: formatAvgDistanceM(
                poleStats.existing_poles_distance_km,
                poleStats.existing_poles,
              ),
            },
          ],
        },
        {
          label: 'Completion Rate',
          value: `${formatNumber(Math.round(poleStats.completion_rate))}%`,
          accentColor: poleStats.completion_rate >= 90 ? ('green' as const) : ('yellow' as const),
        },
        {
          label: 'Action Required',
          value: formatNumber(poleStats.pending_poles ?? 0),
          accentColor: (poleStats.pending_poles ?? 0) > 0 ? ('red' as const) : ('green' as const),
          breakdown: [
            { label: 'Pending', value: formatNumber(poleStats.pending_poles ?? 0) },
          ],
        },
        {
          label: 'Muff Count',
          value: formatNumber(
            (poleStats.new_poles_by_muff_type?.Muff ?? 0) +
              (poleStats.new_poles_by_muff_type?.Mold ?? 0) +
              (poleStats.new_poles_by_muff_type?.Unknown ?? 0),
          ),
          accentColor: 'yellow' as const,
          breakdown: [
            {
              label: 'Muff',
              value: formatNumber(poleStats.new_poles_by_muff_type?.Muff ?? 0),
            },
            {
              label: 'Mold',
              value: formatNumber(poleStats.new_poles_by_muff_type?.Mold ?? 0),
            },
            {
              label: 'Unknown',
              value: formatNumber(
                poleStats.new_poles_by_muff_type?.Unknown ?? 0,
              ),
            },
          ],
        },
      ]
    : [];

  // Real per-block breakdown for the Aerial tab's Project Insights panel —
  // acceptedPoles already carries the resolved state/district/block names.
  const aerialGroups: InsightGroup[] = useMemo(() => {
    const groups = new Map<string, { label: string; count: number }>();
    acceptedPoles.forEach((p) => {
      const key = `${p.state_name}-${p.district_name}-${p.block_name}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(key, { label: `${p.state_name} · ${p.district_name} · ${p.block_name}`, count: 1 });
      }
    });
    return Array.from(groups.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([key, g]) => ({ key, label: g.label, sub: `${formatNumber(g.count)} poles` }));
  }, [acceptedPoles]);

  const aerialHealthPercent = poleStats ? Math.round(poleStats.completion_rate) : null;
  const aerialHealthDescription = poleStats
    ? `${formatNumber(poleStats.total_poles)} poles surveyed across ${aerialGroups.length} block${
        aerialGroups.length === 1 ? '' : 's'
      }. ${formatNumber(poleStats.pending_poles ?? 0)} pole(s) pending review.`
    : 'Loading pole survey data…';

  // Real per-block breakdown for the Joints tab's Project Insights panel.
  const jointsGroups: InsightGroup[] = useMemo(() => {
    const groups = new Map<string, { label: string; count: number }>();
    jointsPlacemarks.forEach((p) => {
      const key = `${p.state_name}-${p.district_name}-${p.block_name}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(key, { label: `${p.state_name} · ${p.district_name} · ${p.block_name}`, count: 1 });
      }
    });
    return Array.from(groups.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([key, g]) => ({ key, label: g.label, sub: `${formatNumber(g.count)} joints` }));
  }, [jointsPlacemarks]);

  const jointsHealthDescription = jointsPlacemarks.length > 0
    ? `${formatNumber(jointsPlacemarks.length)} joints recorded across ${jointsGroups.length} block${
        jointsGroups.length === 1 ? '' : 's'
      } and ${jointsCategories.length} categor${jointsCategories.length === 1 ? 'y' : 'ies'}.`
    : 'Select a state, district, and block to load joints data.';

  const handleReset = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedBlock('');
  };

  const handleOpenFullView = () => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    if (selectedState) params.set('state', selectedState);
    if (selectedDistrict) params.set('district', selectedDistrict);
    if (selectedBlock) params.set('block', selectedBlock);
    window.open(
      `/dashboards/executive-construction-view/full-map?${params.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <div className={`flex flex-col bg-gray-50 ${fullView ? 'h-screen' : 'h-[calc(100vh-48px)]'}`}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-0 flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Executive Construction View</h1>
          {/* <div className="flex items-center text-sm text-gray-500 gap-1 mt-1">
            <Link to="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-700 font-medium">Executive Construction View</span>
          </div> */}
        </div>
        <nav className="flex items-center gap-6 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 border-b-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {!fullView && (
            <button
              onClick={handleOpenFullView}
              title="Open map in full view (new tab)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 border border-gray-300 rounded-lg hover:border-blue-400"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Full View
            </button>
          )}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchableSelect
            className="min-w-[180px]"
            value={selectedState}
            onChange={setSelectedState}
            disabled={loadingStates}
            placeholder="Select State"
            options={states.map((state) => ({
              value: String(state.state_id),
              label: state.state_name,
            }))}
          />
          <SearchableSelect
            className="min-w-[180px]"
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            disabled={loadingDistricts || !selectedState}
            placeholder="Select District"
            options={districts.map((district) => ({
              value: String(district.district_id),
              label: district.district_name,
            }))}
          />
          <SearchableSelect
            className="min-w-[180px]"
            value={selectedBlock}
            onChange={setSelectedBlock}
            disabled={loadingBlocks || !selectedDistrict}
            placeholder="Select Block"
            options={blocks.map((block) => ({
              value: String(block.block_id),
              label: block.block_name,
            }))}
          />
          <button
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Stat cards */}
      {activeTab === 'construction' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-2 bg-gray-50">
          {CONSTRUCTION_KPI_CARDS.map((s) => (
            <StatsCard
              key={s.label}
              label={s.label}
              value={s.value}
              accentColor={s.accentColor}
              breakdown={s.breakdown}
            />
          ))}
        </div>
      )}
      {activeTab === 'aerial' && aerialStatsCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-2 bg-gray-50">
          {aerialStatsCards.map((s) => (
            <StatsCard
              key={s.label}
              label={s.label}
              value={s.value}
              accentColor={s.accentColor}
              breakdown={s.breakdown}
            />
          ))}
        </div>
      )}
      {/* Joints tab intentionally has no stat cards. */}

      {/* Map (+ Project Insights panel for tabs that don't render their own) */}
      <div className="flex-1 flex min-h-[580px] overflow-hidden">
        <div className="flex-1 relative min-w-0">
          {!blockSelected && activeTab === 'joints' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-sm text-gray-600">
              Select a state, district, and block to load {activeTab} data
            </div>
          )}
          {loadingMapData && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-sm text-blue-600">
              Loading {activeTab} data...
            </div>
          )}
          {mapError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-50 border border-red-200 rounded-lg shadow-sm px-4 py-2 text-sm text-red-600">
              {mapError}
            </div>
          )}

          {activeCategories.length > 0 && (
            <div className="absolute top-4 right-4 z-10 bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-sm max-w-[220px] max-h-[60vh] overflow-y-auto">
              <div className="font-semibold text-gray-700 mb-2">Legend</div>
              {activeCategories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 py-0.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-gray-600 truncate">
                    {cat.name.replace(/^(Construction|Joint): /, '')}
                  </span>
                  <span className="text-gray-400 ml-auto">{cat.count}</span>
                </div>
              ))}
            </div>
          )}

          {!fullView && (
            <button
              onClick={handleOpenFullView}
              title="Open map in full view (new tab)"
              className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 hover:text-blue-600"
            >
              <Maximize2 className="w-4 h-4" />
              Full View
            </button>
          )}

          {activeTab === 'aerial' ? (
            <GISMap acceptedPoles={acceptedPoles} />
          ) : activeTab === 'construction' ? (
            <ConstructionOverallMap
              data={overallConstructionData}
              planningPlacemarks={planningPlacemarks}
              planningCategories={planningCategories}
              healthIndex={CONSTRUCTION_HEALTH_INDEX}
              milestones={MILESTONE_ITEMS}
            />
          ) : (
            <GoogleMap
              className="h-full w-full"
              placemarks={jointsPlacemarks}
              categories={jointsCategories}
              visibleCategories={jointsVisibleCategories}
              onPlacemarkClick={() => {}}
            />
          )}
        </div>

        {/* ConstructionOverallMap renders its own Project Insights sidebar —
            only add the standalone one for the tabs that don't have it. */}
        {!fullView && activeTab === 'aerial' && (
          <ProjectInsightsPanel
            healthPercent={aerialHealthPercent}
            healthDescription={aerialHealthDescription}
            groups={aerialGroups}
            groupsLabel="By State / District / Block"
            milestones={AERIAL_MILESTONE_ITEMS}
          />
        )}
        {!fullView && activeTab === 'joints' && (
          <ProjectInsightsPanel
            healthPercent={null}
            healthDescription={jointsHealthDescription}
            groups={jointsGroups}
            groupsLabel="By State / District / Block"
            milestones={MILESTONE_ITEMS}
          />
        )}
      </div>
    </div>
  );
}
