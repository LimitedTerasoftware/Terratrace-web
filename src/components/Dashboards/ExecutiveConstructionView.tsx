import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SearchableSelect from '../Forms/SearchableSelect';
import {
  getStateData,
  getDistrictData,
  getBlockData,
  getAcceptedPoles,
  getPoleDashboard,
  machineApi,
} from '../Services/api';
import type { AcceptedPolesResponse, PoleDashboardResponse } from '../Services/api';
import { Block, District, StateData } from '../../types/survey';
import { MachineDetailsResponse } from '../../types/machine';
import { isIEUser } from '../../utils/accessControl';
import { GoogleMap } from '../SmartInventory/MapViewer';
import {
  processConstructionData,
  processJointsData,
  processDesktopPlanningData,
} from '../SmartInventory/PlaceMark';
import GISMap from '../Chat/GISMap';
import KPICards from '../Chat/KPICards';
import { StatsCard } from '../Chat/StatsCard';
import {
  ConstructionApiResponse,
  JointsApiResponse,
  ProcessedConstruction,
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

interface IssuesSummary {
  total: number;
  critical: number;
  warning: number;
  missing: number;
  depth_compliance: string;
}

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

export default function ExecutiveConstructionView() {
  const [activeTab, setActiveTab] = useState<TabType>('construction');

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');

  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const [loadingMapData, setLoadingMapData] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const [constructionPlacemarks, setConstructionPlacemarks] = useState<ProcessedConstruction[]>([]);
  const [constructionCategories, setConstructionCategories] = useState<PlacemarkCategory[]>([]);

  const [planningPlacemarks, setPlanningPlacemarks] = useState<ProcessedDesktopPlanning[]>([]);
  const [planningCategories, setPlanningCategories] = useState<PlacemarkCategory[]>([]);

  const [jointsPlacemarks, setJointsPlacemarks] = useState<ProcessedJoints[]>([]);
  const [jointsCategories, setJointsCategories] = useState<PlacemarkCategory[]>([]);

  const [acceptedPoles, setAcceptedPoles] = useState<AcceptedPolesResponse['data']>([]);

  const [constructionStats, setConstructionStats] = useState<MachineDetailsResponse | null>(null);
  const [constructionIssues, setConstructionIssues] = useState<IssuesSummary | null>(null);
  const [loadingConstructionStats, setLoadingConstructionStats] = useState(false);

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
  useEffect(() => {
    if (!blockSelected && activeTab !== 'aerial') {
      setConstructionPlacemarks([]);
      setConstructionCategories([]);
      setJointsPlacemarks([]);
      setJointsCategories([]);
      setAcceptedPoles([]);
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
          const resp = await axios.get<ConstructionApiResponse>(
            `${BASEURL}/get-construction-data`,
            { params },
          );
          const { placemarks, categories } = processConstructionData(resp.data);
          setConstructionPlacemarks(placemarks);
          setConstructionCategories(categories);
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
          setConstructionPlacemarks([]);
          setConstructionCategories([]);
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

  // Construction stat cards — same source as the Construction Dashboard's KPI row.
  useEffect(() => {
    if (activeTab !== 'construction' || !blockSelected) {
      setConstructionStats(null);
      setConstructionIssues(null);
      return;
    }

    const loadConstructionStats = async () => {
      setLoadingConstructionStats(true);
      try {
        const [statsResp, issuesResp] = await Promise.all([
          machineApi.getFirmDistanceStats(
            selectedState,
            selectedDistrict,
            selectedBlock,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            isIEUser() ? undefined : 'Dashboard',
          ),
          machineApi.getIssues(selectedState, selectedDistrict, selectedBlock),
        ]);
        setConstructionStats(statsResp);
        setConstructionIssues(issuesResp.status ? issuesResp.summary : null);
      } catch (error) {
        console.error('Failed to load construction stats:', error);
        setConstructionStats(null);
        setConstructionIssues(null);
      } finally {
        setLoadingConstructionStats(false);
      }
    };

    loadConstructionStats();
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

  const constructionVisibleCategories = useMemo(
    () =>
      new Set([
        ...constructionCategories.map((c) => c.id),
        ...planningCategories.map((c) => c.id),
      ]),
    [constructionCategories, planningCategories],
  );
  const jointsVisibleCategories = useMemo(
    () => new Set(jointsCategories.map((c) => c.id)),
    [jointsCategories],
  );

  const activeCategories =
    activeTab === 'construction'
      ? [...constructionCategories, ...planningCategories]
      : activeTab === 'joints'
        ? jointsCategories
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

  const handleReset = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedBlock('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] bg-gray-50">
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
        <nav className="flex gap-6 flex-shrink-0">
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
      {activeTab === 'construction' && blockSelected && (
        <KPICards
          Data={constructionStats}
          issuesSummary={constructionIssues}
          selectIssueType=""
          selectedState={selectedState}
          selectedDistrict={selectedDistrict}
          selectedBlock={selectedBlock}
        />
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

      {/* Map */}
      <div className="flex-1 relative min-h-[500px]">
        {!blockSelected && (
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

        {activeTab === 'aerial' ? (
          <GISMap acceptedPoles={acceptedPoles} />
        ) : activeTab === 'construction' ? (
          <GoogleMap
            className="h-full w-full"
            placemarks={[...constructionPlacemarks, ...planningPlacemarks]}
            categories={[...constructionCategories, ...planningCategories]}
            visibleCategories={constructionVisibleCategories}
            onPlacemarkClick={() => {}}
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
    </div>
  );
}
