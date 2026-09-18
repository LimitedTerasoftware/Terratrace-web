import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Maximize2, LayoutDashboard, MapPin, X } from 'lucide-react';
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
import { getAuthHeaders } from '../../utils/accessControl';
import { GoogleMap } from '../SmartInventory/MapViewer';
import {
  processJointsData,
  processDesktopPlanningData,
} from '../SmartInventory/PlaceMark';
import GISMap, { PoleData } from '../Chat/GISMap';
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
const IMAGE_BASE_URL = import.meta.env.VITE_Image_URL;

const formatNumber = (num: number) => num.toLocaleString('en-IN');

const formatAvgDistanceM = (distanceKm: number, count: number) => {
  if (!count) return '-';
  return `${formatNumber(Number(((distanceKm * 1000) / count).toFixed(2)))} M`;
};

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

// Row returned by GET /get-const-progress — total surveyed distance grouped
// by work type. Construction's Milestone Progress bars are each work type's
// share of the total distance, computed at render time (see
// buildConstructionMilestones below).
interface ConstProgressItem {
  workType: string | null;
  total_distance_km: number;
}

const CONSTRUCTION_MILESTONE_COLORS: Record<string, string> = {
  'New Construction': 'bg-green-500',
  Rectification: 'bg-blue-500',
  'OFC Blowing/ JointChamber': 'bg-indigo-500',
  Protection: 'bg-orange-500',
};
const FALLBACK_MILESTONE_COLORS = [
  'bg-green-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-pink-500',
];

const buildConstructionMilestones = (
  data: ConstProgressItem[]
): MilestoneItem[] => {
  const milestonesMap: Record<string, MilestoneItem> = {};

  data.forEach((item) => {
    const label = item.workType?.trim() || "Unclassified";

    if (!milestonesMap[label]) {
      milestonesMap[label] = {
        label,
        percent: 0,
        colorClass:
          label === "New Construction"
            ? "bg-blue-500"
            : label === "Rectification"
            ? "bg-green-500"
            : label === "Protection"
            ? "bg-orange-500"
            : label === "OFC Blowing/ JointChamber"
            ? "bg-purple-500"
            : "bg-gray-400",
      };
    }

    milestonesMap[label].percent += item.total_distance_km;
  });

  return Object.values(milestonesMap);
};

interface ConstructionSummary {
  totalSurveys: number;
  acceptedSurveys: number;
  rejectedSurveys: number;
  totalDistanceMeters: number;
  totalKm: number;
  pendingSurveys: number;
}

// No depth-compliance/health-scoring API for Construction yet, so this is a
// static placeholder until one exists.
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

// Row returned by GET /get-poledata-preview?ids=<pole_id>, keyed by survey_id
// in the response — fetched on demand when an aerial pole marker is clicked.
interface PolePreviewDetails {
  id: number;
  survey_id: number;
  pit_id?: string | null;
  pole_type?: string | null;
  eventType?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  pole_height?: string | null;
  drum_number?: string | null;
  meter?: string | null;
  image?: string | null;
  images?: string[];
  created_at?: string | null;
  workType?: string | null;
  construction_type?: string | null;
  start_lgd_name?: string | null;
  end_lgd_name?: string | null;
  state_name?: string | null;
  district_name?: string | null;
  block_name?: string | null;
  user_name?: string | null;
  user_mobile?: string | null;
  muff_type?: string | null;
  [key: string]: unknown;
}

// Slide-in panel for a selected aerial pole — same docked-to-sidebar,
// slide-from-right treatment as ConstructionOverallMap's SelectedPointPanel.
function SelectedPolePanel({
  pole,
  details,
  loading,
  onClose,
}: {
  pole: PoleData | null;
  details: PolePreviewDetails | null;
  loading: boolean;
  onClose: () => void;
}) {
  const open = pole !== null;
  const photos = details ? parsePolePhotos(details.images ?? details.image) : [];

  return (
    <div
      className={`absolute top-0 right-0 z-30 h-full w-full md:w-80 bg-white shadow-xl border-l border-gray-200 overflow-y-auto transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      }`}
    >
      {pole && (
        <>
          <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-100 sticky top-0 bg-white">
            <div className="font-semibold text-gray-900 text-sm">Selected Pole</div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 pt-3">
            <table className="w-full text-sm mb-2">
              <tbody>
                <tr>
                  <td className="py-1 pr-2 text-gray-500">Type</td>
                  <td className="py-1 font-medium text-gray-900 capitalize">{pole.pole_type}</td>
                </tr>
                <tr>
                  <td className="py-1 pr-2 text-gray-500 align-top">Coordinates</td>
                  <td className="py-1 font-medium text-gray-900">
                    {pole.latitude.toFixed(5)}, {pole.longitude.toFixed(5)}
                  </td>
                </tr>
              </tbody>
            </table>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            ) : details ? (
              <>
                <table className="w-full text-sm">
                  <tbody>
                    {details.pit_id && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Pit ID</td>
                        <td className="py-1 font-medium text-gray-900">{details.pit_id}</td>
                      </tr>
                    )}
                    {details.workType && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Work Type</td>
                        <td className="py-1 font-medium text-gray-900">{details.workType}</td>
                      </tr>
                    )}
                    {details.muff_type && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Muff Type</td>
                        <td className="py-1 font-medium text-gray-900">{details.muff_type}</td>
                      </tr>
                    )}
                    {(details.start_lgd_name || details.end_lgd_name) && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Route</td>
                        <td className="py-1 font-medium text-gray-900">
                          {details.start_lgd_name || '—'} → {details.end_lgd_name || '—'}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-1 pr-2 text-gray-500 align-top">Location</td>
                      <td className="py-1 font-medium text-gray-900">
                        {[details.block_name, details.district_name, details.state_name]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>
                    </tr>
                    {details.distance !== undefined && details.distance !== null && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Distance</td>
                        <td className="py-1 font-medium text-gray-900">{details.distance} m</td>
                      </tr>
                    )}
                    {details.pole_height && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Pole Height</td>
                        <td className="py-1 font-medium text-gray-900">{details.pole_height}</td>
                      </tr>
                    )}
                    {details.drum_number && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Drum Number</td>
                        <td className="py-1 font-medium text-gray-900">{details.drum_number}</td>
                      </tr>
                    )}
                    {details.meter && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Meter</td>
                        <td className="py-1 font-medium text-gray-900">{details.meter}</td>
                      </tr>
                    )}
                    {details.user_name && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Surveyor</td>
                        <td className="py-1 font-medium text-gray-900">
                          {details.user_name}
                          {details.user_mobile ? ` (${details.user_mobile})` : ''}
                        </td>
                      </tr>
                    )}
                    {details.created_at && (
                      <tr>
                        <td className="py-1 pr-2 text-gray-500">Created</td>
                        <td className="py-1 font-medium text-gray-900">{details.created_at}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {photos.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-gray-500 mb-1.5">Photos</div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {photos.map((src, i) => (
                        <a key={i} href={`${IMAGE_BASE_URL}${src}`} target="_blank" rel="noreferrer">
                          <img
                            src={`${IMAGE_BASE_URL}${src}`}
                            alt={`Photo ${i + 1}`}
                            className="w-full h-16 object-cover rounded border border-gray-200"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400">No additional details found for this pole.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Standalone "Project Insights" sidebar for the Aerial/Joints tabs, mirroring
// the panel ConstructionOverallMap renders natively for the Construction tab.
function ProjectInsightsPanel({
  healthPercent,
  healthDescription,
  groups,
  groupsLabel,
  milestones,
  currentView,
}: {
  healthPercent: number | null;
  healthDescription: string;
  groups: InsightGroup[];
  groupsLabel: string;
  milestones: MilestoneItem[];
  // When provided, renders a "Current View" section (zoom + tiles) with the
  // groups list nested inside it, same as ConstructionOverallMap's sidebar.
  // Omit for tabs with no zoom-tracked viewport (e.g. Joints).
  currentView?: { zoom: number; tiles: { label: string; value: number }[] };
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

      {/* <div className="p-4 border-b border-gray-200">
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
      </div> */}

      {currentView && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-gray-900 font-semibold text-sm">
              <MapPin className="w-4 h-4 text-blue-600" />
              Current View
            </div>
            <span className="text-xs text-gray-400">Zoom {currentView.zoom}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {currentView.tiles.map((t) => (
              <div key={t.label} className="bg-gray-50 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-500">{t.label}</div>
                <div className="text-lg font-semibold text-gray-900">{formatNumber(t.value)}</div>
              </div>
            ))}
          </div>

          {groups.length > 0 && (
            <div className="pt-1">
              <div className="text-xs font-medium text-gray-500 mb-1.5">{groupsLabel}</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
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
      )}

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

      {!currentView && groups.length > 0 && (
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

  // Kept separate from loadingMapData/mapError above — Construction now
  // fetches independently of the active tab, so it needs its own indicators.
  const [loadingConstructionMap, setLoadingConstructionMap] = useState(false);
  const [constructionMapError, setConstructionMapError] = useState<string | null>(null);

  const [overallConstructionData, setOverallConstructionData] = useState<OverallConstructionBlock[]>([]);

  const [planningPlacemarks, setPlanningPlacemarks] = useState<ProcessedDesktopPlanning[]>([]);
  const [planningCategories, setPlanningCategories] = useState<PlacemarkCategory[]>([]);

  const [jointsPlacemarks, setJointsPlacemarks] = useState<ProcessedJoints[]>([]);
  const [jointsCategories, setJointsCategories] = useState<PlacemarkCategory[]>([]);

  const [acceptedPoles, setAcceptedPoles] = useState<AcceptedPolesResponse['data']>([]);

  const [constructionSummary, setConstructionSummary] = useState<ConstructionSummary | null>(null);
  const [loadingConstructionSummary, setLoadingConstructionSummary] = useState(false);

  const [constProgress, setConstProgress] = useState<ConstProgressItem[]>([]);

  const [poleStats, setPoleStats] = useState<PoleDashboardResponse['data'] | null>(null);
  const [loadingPoleStats, setLoadingPoleStats] = useState(false);

  const [aerialZoom, setAerialZoom] = useState(10);
  const [aerialBounds, setAerialBounds] = useState<google.maps.LatLngBounds | null>(null);

  const [selectedPole, setSelectedPole] = useState<PoleData | null>(null);
  const [polePreview, setPolePreview] = useState<PolePreviewDetails | null>(null);
  const [loadingPolePreview, setLoadingPolePreview] = useState(false);

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

  // Construction's map data is fetched once on mount and again only when the
  // state/district/block filters change — NOT on every tab switch. Refetching
  // (and the resulting point/polyline rebuild) on each return to this tab is
  // what was making the map hang when flipping between tabs.
  useEffect(() => {
    const loadConstructionMapData = async () => {
      setLoadingConstructionMap(true);
      setConstructionMapError(null);
      try {
        const resp = await getOverallConstruction({
          stateId: selectedState,
          district_id: selectedDistrict,
          block_id: selectedBlock,
        });
        setOverallConstructionData(resp.status ? resp.data || [] : []);
      } catch (error) {
        console.error('Failed to load construction map data:', error);
        setConstructionMapError('Failed to load construction data for this block.');
        setOverallConstructionData([]);
      } finally {
        setLoadingConstructionMap(false);
      }
    };

    loadConstructionMapData();
  }, [selectedState, selectedDistrict, selectedBlock]);

  // Aerial/Joints map data — lazy-loaded per tab, unlike Construction above.
  // Neither has reported the same tab-switch freeze, so this keeps the
  // original lazy-load-on-tab-select behavior.
  useEffect(() => {
    if (activeTab === 'construction') return;

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
        if (activeTab === 'joints') {
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
        if (activeTab === 'joints') {
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

  // Approved KMZ (desktop planning) overlay for the construction map — same
  // /get-desktop-planning call and category whitelist as construction-progress-map.
  // Not gated on activeTab: only re-fetches when the filters actually
  // change, not on every switch back to the Construction tab.
  useEffect(() => {
    if (!blockSelected) {
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
  }, [blockSelected, selectedState, selectedDistrict, selectedBlock]);

  // Construction KPI row — same /getConstructionSummary endpoint the
  // Construction Dashboard uses, scoped to HDD construction. Not gated on
  // activeTab: fetches once on mount, then again only on filter changes.
  useEffect(() => {
    const loadConstructionSummary = async () => {
      setLoadingConstructionSummary(true);
      try {
        const params: Record<string, string> = { construction_type: 'Hdd' };
        if (selectedState) params.state_id = selectedState;
        if (selectedDistrict) params.district_id = selectedDistrict;
        if (selectedBlock) params.block_id = selectedBlock;

        const response = await fetch(
          `${BASEURL}/getConstructionSummary?${new URLSearchParams(params).toString()}`,
          { headers: getAuthHeaders() },
        );
        const result = await response.json();
        setConstructionSummary(result.status ? result.summary : null);
      } catch (error) {
        console.error('Failed to load construction summary:', error);
        setConstructionSummary(null);
      } finally {
        setLoadingConstructionSummary(false);
      }
    };

    loadConstructionSummary();
  }, [selectedState, selectedDistrict, selectedBlock]);

  // Milestone Progress bars — real data from /get-const-progress (distance
  // surveyed per work type). Same not-gated-on-activeTab treatment as the
  // summary/map-data fetches above.
  useEffect(() => {
    const loadConstProgress = async () => {
      try {
        const params: Record<string, string> = {};
        if (selectedState) params.stateId = selectedState;
        if (selectedDistrict) params.districtId = selectedDistrict;
        if (selectedBlock) params.blockId = selectedBlock;
        const queryString = new URLSearchParams(params).toString();

        const response = await fetch(
          `${BASEURL}/api/get-const-progress${queryString ? `?${queryString}` : ''}`,
          { headers: getAuthHeaders() },
        );
        const result = await response.json();
        setConstProgress(result.status ? result.data || [] : []);
      } catch (error) {
        console.error('Failed to load construction progress:', error);
        setConstProgress([]);
      }
    };

    loadConstProgress();
  }, [selectedState, selectedDistrict, selectedBlock]);

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

  // Fetches the full pole record for a clicked aerial marker — feeds the
  // slide-in SelectedPolePanel, same pattern as construction's point popup.
  const loadPolePreview = async (pole: PoleData) => {
    setSelectedPole(pole);
    setPolePreview(null);
    setLoadingPolePreview(true);
    try {
      const resp = await fetch(`${BASEURL}/get-poledata-preview?ids=${pole.id}`, {
        headers: getAuthHeaders(),
      });
      const result = await resp.json();
      const groups: Record<string, PolePreviewDetails[]> = result.status ? result.data || {} : {};
      const row = Object.values(groups).flat()[0] ?? null;
      setPolePreview(row);
    } catch (error) {
      console.error('Failed to load pole preview:', error);
      setPolePreview(null);
    } finally {
      setLoadingPolePreview(false);
    }
  };

  const jointsVisibleCategories = useMemo(
    () => new Set(jointsCategories.map((c) => c.id)),
    [jointsCategories],
  );

  // The construction tab renders its own legend (event types + Approved KMZ
  // overlay) inside ConstructionOverallMap, so it's excluded here.
  const activeCategories = activeTab === 'joints' ? jointsCategories : [];

  const constructionStatsCards: {
    label: string;
    value: string;
    accentColor: 'default' | 'green' | 'blue' | 'yellow' | 'red';
    breakdown?: { label: string; value: string }[];
  }[] = constructionSummary
    ? [
        {
          label: 'Total Surveys',
          value: formatNumber(constructionSummary.totalSurveys),
          accentColor: 'blue',
        },
        {
          label: 'Accepted Surveys',
          value: formatNumber(constructionSummary.acceptedSurveys),
          accentColor: 'green',
        },
        {
          label: 'Pending Surveys',
          value: formatNumber(constructionSummary.pendingSurveys),
          accentColor: 'yellow',
        },
        {
          label: 'Rejected Surveys',
          value: formatNumber(constructionSummary.rejectedSurveys),
          accentColor: 'red',
        },
        {
          label: 'Total Distance',
          value: `${formatNumber(Number(constructionSummary.totalKm?.toFixed(2) ?? 0))} KM`,
          accentColor: 'blue',
        },
      ]
    : [];

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

  // Viewport-scoped version of the same breakdown — feeds the "Current View"
  // section, same real-viewport behavior as ConstructionOverallMap's sidebar.
  const aerialViewStats = useMemo(() => {
    const scoped = aerialBounds
      ? acceptedPoles.filter((p) => aerialBounds.contains({ lat: p.latitude, lng: p.longitude }))
      : acceptedPoles;

    const groups = new Map<string, { label: string; count: number }>();
    scoped.forEach((p) => {
      const key = `${p.state_name}-${p.district_name}-${p.block_name}`;
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(key, { label: `${p.state_name} · ${p.district_name} · ${p.block_name}`, count: 1 });
      }
    });

    return {
      newCount: scoped.filter((p) => p.pole_type === 'new').length,
      existingCount: scoped.filter((p) => p.pole_type === 'existing').length,
      groups: Array.from(groups.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 6)
        .map(([key, g]) => ({ key, label: g.label, sub: `${formatNumber(g.count)} poles` })) as InsightGroup[],
    };
  }, [acceptedPoles, aerialBounds]);

  const aerialHealthPercent = poleStats ? Math.round(poleStats.completion_rate) : null;
  const aerialHealthDescription = poleStats
    ? `${formatNumber(poleStats.total_poles)} poles surveyed across ${aerialGroups.length} block${
        aerialGroups.length === 1 ? '' : 's'
      }. ${formatNumber(poleStats.pending_poles ?? 0)} pole(s) pending review.`
    : 'Loading pole survey data…';

  const constructionMilestones = useMemo(
    () => buildConstructionMilestones(constProgress),
    [constProgress],
  );

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
      {activeTab === 'construction' && constructionStatsCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-2 bg-gray-50">
          {constructionStatsCards.map((s) => (
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-2 bg-gray-50">
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
      <div className="relative flex-1 flex min-h-[580px] overflow-hidden">
        <div className="flex-1 relative min-w-0">
          {!blockSelected && activeTab === 'joints' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-sm text-gray-600">
              Select a state, district, and block to load {activeTab} data
            </div>
          )}
          {((activeTab === 'construction' && loadingConstructionMap) ||
            (activeTab !== 'construction' && loadingMapData)) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-2 text-sm text-blue-600">
              Loading {activeTab} data...
            </div>
          )}
          {(activeTab === 'construction' ? constructionMapError : mapError) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-50 border border-red-200 rounded-lg shadow-sm px-4 py-2 text-sm text-red-600">
              {activeTab === 'construction' ? constructionMapError : mapError}
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
            <GISMap
              acceptedPoles={acceptedPoles}
              onViewportChange={(zoom, bounds) => {
                setAerialZoom(zoom);
                setAerialBounds(bounds);
              }}
              onPoleClick={loadPolePreview}
            />
          ) : activeTab === 'construction' ? (
            <ConstructionOverallMap
              data={overallConstructionData}
              planningPlacemarks={planningPlacemarks}
              planningCategories={planningCategories}
              healthIndex={CONSTRUCTION_HEALTH_INDEX}
              totalSurveys={constructionSummary?.totalSurveys}
              milestones={constructionMilestones}
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
            groups={aerialViewStats.groups}
            groupsLabel="By State / District / Block"
            milestones={AERIAL_MILESTONE_ITEMS}
            currentView={{
              zoom: aerialZoom,
              tiles: [
                { label: 'New Poles', value: aerialViewStats.newCount },
                { label: 'Existing Poles', value: aerialViewStats.existingCount },
              ],
            }}
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

        {activeTab === 'aerial' && (
          <SelectedPolePanel
            pole={selectedPole}
            details={polePreview}
            loading={loadingPolePreview}
            onClose={() => {
              setSelectedPole(null);
              setPolePreview(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
