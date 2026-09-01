import { useEffect, useRef, useState } from 'react';
import {
  StateData,
  District,
  Block,
  UGConstructionSurveyData,
} from '../../types/survey';
import Report from './UGConst';
import Poles from './Poles';
import ConstructionStatsPanel from './ConstructionStatsPanel';
import {
  SheetIcon,
  Construction,
  EyeIcon,
  Globe2Icon,
  PlusCircleIcon,
  GitMerge,
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { getAuthHeaders, isAdminUser } from '../../utils/accessControl';
import { getPoleDashboard } from '../Services/api';
import SearchableSelect from '../Forms/SearchableSelect';
import { StatsCard } from '../Chat/StatsCard';

interface StatesResponse {
  success: boolean;
  data: StateData[];
}

type StatusOption = {
  value: number;
  label: string;
};

type PoleDashboardData =
  import('../Services/api').PoleDashboardResponse['data'];

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

const formatNumber = (num: number) => {
  return num.toLocaleString('en-IN');
};

const formatAvgDistanceM = (distanceKm: number, count: number) => {
  if (!count) return '-';
  return `${formatNumber(Number(((distanceKm * 1000) / count).toFixed(2)))} M`;
};

function AerialListPage() {
  const AdminAcess = isAdminUser();
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [globalsearch, setGlobalSearch] = useState<string>('');
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingBlock, setLoadingBlock] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<number[]>([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [excel, setExcel] = useState<boolean>(false);
  const [kml, setKml] = useState<boolean>(false);
  const [preview, setPreview] = useState<boolean>(false);
  const [mergeSurveys, setMergeSurveys] = useState<boolean>(false);
  const [mergeLoading, setMergeLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersReady, setFiltersReady] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [connections, setConnections] = useState<
    { route_name: string; startLocation: string; endLocation: string }[]
  >([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(
    null,
  );
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [surveyData, setSurveyData] = useState<UGConstructionSurveyData[]>([]);
  const [loadingStats] = useState<boolean>(false);
  const [poleData, setPoleData] = useState<PoleDashboardData | null>(null);
  const [loadingPoleStats, setLoadingPoleStats] = useState<boolean>(false);
  const [worktype, setWorktype] = useState<string[]>([]);
  const [workTypeDropdownOpen, setWorkTypeDropdownOpen] = useState(false);
  const workTypeDropdownRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'Aerial' | 'Pole' | string>('Aerial');
  const constType = 'Aerial';
  const [page, setPage] = useState<number>(() => {
    const pageParam = Number(new URLSearchParams(window.location.search).get('page'));
    return pageParam > 0 ? pageParam : 1;
  });

  const statusMap: Record<number, string> = {
    1: 'Accepted',
    2: 'Rejected',
    0: 'Pending',
  };

  const statusOptions: StatusOption[] = Object.entries(statusMap).map(
    ([value, label]) => ({
      value: Number(value),
      label,
    }),
  );
  const workTypeOptions = [
    { value: 'New Construction', label: 'New Construction' },
    { value: 'Rectification', label: 'Rectification' },
    { value: 'OFC Blowing/ JointChamber', label: 'OFC Blowing / Joint Chamber' },
    { value: 'Protection', label: 'Protection' },
  ];

  const poleStats = poleData
    ? [
        {
          label: 'Total Poles',
          value: formatNumber(poleData.total_poles),
          accentColor: 'blue' as const,
          breakdown: [
            {
              label: 'Distance',
              value: `${formatNumber(poleData.total_distance_km)} KM`,
            },
            {
              label: 'Avg/Pole',
              value: formatAvgDistanceM(
                poleData.total_distance_km,
                poleData.total_poles,
              ),
            },
          ],
        },
        {
          label: 'New Poles',
          value: formatNumber(poleData.new_poles),
          accentColor: 'green' as const,
          breakdown: [
            {
              label: 'Distance',
              value: `${formatNumber(poleData.new_poles_distance_km)} KM`,
            },
            {
              label: 'Avg/Pole',
              value: formatAvgDistanceM(
                poleData.new_poles_distance_km,
                poleData.new_poles,
              ),
            },
          ],
        },
        {
          label: 'Existing Poles',
          value: formatNumber(poleData.existing_poles),
          accentColor: 'red' as const,
          breakdown: [
            {
              label: 'Distance',
              value: `${formatNumber(poleData.existing_poles_distance_km)} KM`,
            },
            {
              label: 'Avg/Pole',
              value: formatAvgDistanceM(
                poleData.existing_poles_distance_km,
                poleData.existing_poles,
              ),
            },
          ],
        },
        {
          label: 'Muff Count',
          value: formatNumber(
            (poleData.new_poles_by_muff_type?.Muff ?? 0) +
              (poleData.new_poles_by_muff_type?.Mold ?? 0) +
              (poleData.new_poles_by_muff_type?.Unknown ?? 0),
          ),
          accentColor: 'yellow' as const,
          breakdown: [
            {
              label: 'Muff',
              value: formatNumber(poleData.new_poles_by_muff_type?.Muff ?? 0),
            },
            {
              label: 'Mold',
              value: formatNumber(poleData.new_poles_by_muff_type?.Mold ?? 0),
            },
            {
              label: 'Unknown',
              value: formatNumber(
                poleData.new_poles_by_muff_type?.Unknown ?? 0,
              ),
            },
          ],
        },
      ]
    : [];


  const AerialHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
              <Construction className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'Aerial' ? 'Aerial' : 'New Pole Construction'}{' '}
                List
              </h1>
              <p className="text-sm text-gray-600">
                Monitor and analyze{' '}
                {activeTab === 'Aerial'
                  ? 'aerial construction'
                  : 'new pole construction'}{' '}
                project data
              </p>
            </div>
          </div>
          <nav>
            <ol className="flex items-center gap-2">
              <li>
                <Link className="font-medium" to="/dashboard">
                  Dashboard /
                </Link>
              </li>
              <li className="font-medium text-primary">
                {activeTab === 'Aerial' ? 'Aerial' : 'New Pole Construction'}{' '}
                Data
              </li>
            </ol>
          </nav>
        </div>
      </header>
    );
  };

  const fetchPoleDashboard = async () => {
    setLoadingPoleStats(true);
    try {
      const response = await getPoleDashboard({
        state_id: selectedState || undefined,
        district_id: selectedDistrict || undefined,
        block_id: selectedBlock || undefined,
        from_date: fromdate || null,
        to_date: todate || null,
        start: getSelectedConnectionDetails()?.startLocation,
        end:   getSelectedConnectionDetails()?.endLocation,
      });
      if (response.status) {
        setPoleData(response.data);
      }
    } catch (error) {
      console.error('Error fetching pole dashboard:', error);
    } finally {
      setLoadingPoleStats(false);
    }
  };

  const fetchStates = async () => {
    try {
      setLoadingStates(true);
      const response = await fetch(`${TraceBASEURL}/states`, { headers: getAuthHeaders() });
      if (!response.ok) throw new Error('Failed to fetch states');
      const result: StatesResponse = await response.json();
      setStates(result.success ? result.data : []);
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchDistricts = async (stateId: string) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }
    try {
      setLoadingDistricts(true);
      const response = await fetch(
        `${TraceBASEURL}/districtsdata?state_code=${stateId}`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) throw new Error('Failed to fetch districts');
      const data = await response.json();
      setDistricts(data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchBlock = async () => {
    try {
      if (!selectedDistrict) return;
      setLoadingBlock(true);
      const response = await fetch(
        `${TraceBASEURL}/blocksdata?district_code=${selectedDistrict}`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) throw new Error('Failed to fetch blocks');
      const data = await response.json();
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlock(false);
    }
  };

  const fetchVerifiedNetworks = async () => {
    try {
      if (!selectedBlock) return;
      setLoadingConnections(true);
      const response = await fetch(
        `${TraceBASEURL}/get-linknames?block_id=${selectedBlock}`,
      );
      const result = await response.json();
      if (result.status && result.data?.length > 0) {
        setConnections(result.data);
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error('Error fetching verified networks:', error);
      setLoadingConnections(false);
    } finally {
      setLoadingConnections(false);
    }
  };

  useEffect(() => {
    fetchVerifiedNetworks();
  }, [selectedState, selectedDistrict, selectedBlock]);

  useEffect(() => {
    if (!filtersReady) return;
    fetchPoleDashboard();
  }, [filtersReady, selectedState, selectedDistrict, selectedBlock, fromdate, todate,selectedConnection]);

  const getSelectedConnectionDetails = () => {
    if (!selectedConnection) return null;
    return connections.find((c) => c.route_name === selectedConnection);
  };

  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
    } else {
      setDistricts([]);
    }
  }, [selectedState, states]);

  useEffect(() => {
    fetchBlock();
  }, [selectedDistrict]);

  useEffect(() => {
    const state_id = searchParams.get('state_id') || null;
    const district_id = searchParams.get('district_id') || null;
    const block_id = searchParams.get('block_id') || null;
    const link = searchParams.get('link') || null;
    const status = searchParams.get('status') || null;
    const from_date = searchParams.get('from_date') || '';
    const to_date = searchParams.get('to_date') || '';
    const search = searchParams.get('search') || '';
    const worktype = searchParams.get('worktype') || '';
    const tab = searchParams.get('tab') || 'Aerial';

    setSelectedState(state_id);
    setSelectedDistrict(district_id);
    setSelectedBlock(block_id);
    setSelectedConnection(link);
    setSelectedStatus(
      status !== null && status !== ''
        ? status
            .split(',')
            .map(Number)
            .filter((n) => !Number.isNaN(n))
        : [],
    );
    setFromDate(from_date);
    setToDate(to_date);
    setGlobalSearch(search);
    setWorktype(worktype ? worktype.split(',').filter(Boolean):[]);
    setFiltersReady(true);
    setActiveTab(tab);
  }, []);

  useEffect(() => {
    const pageParam = Number(searchParams.get('page'));
    setPage(pageParam > 0 ? pageParam : 1);
  }, [searchParams]);

  const handleFilterChange = (
    newState: string | null,
    newDistrict: string | null,
    newBlock: string | null,
    newLink: string | null,
    status: number[],
    worktype: string[],
    from_date: string | null,
    to_date: string | null,
    search: string | null,
    tab: 'Aerial' | 'Pole' | string,
    page?: number,
  ) => {
    const params: Record<string, string> = {};
    if (newState) params.state_id = newState;
    if (newDistrict) params.district_id = newDistrict;
    if (newBlock) params.block_id = newBlock;
    if (newLink) params.link = newLink;
    if (status.length > 0) {
      params.status = status.join(',');
    }
    if (worktype.length >0) params.worktype = worktype.join(',');
    if (from_date) params.from_date = from_date;
    if (to_date) params.to_date = to_date;
    if (search) params.search = search;
    if (tab) params.tab = tab;
    if (page && page > 1) params.page = String(page);

    setSearchParams(params);
    if (!page) setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      activeTab,
      newPage,
    );
  };

  const clearFilters = () => {
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    setSelectedStatus([]);
    setGlobalSearch('');
    setFromDate('');
    setToDate('');
    setSearchParams({});
    setWorktype([]);
    setPage(1);
    
  };

 const handletabchage = (value: string) => {
    setActiveTab(value);
  
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      value
    );
  };
  const handleStateChange = (value: string) => {
    setSelectedState(value || null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    handleFilterChange(
      value || null,
      null,
      null,
      null,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      activeTab,
      page,
    );
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value || null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    handleFilterChange(
      selectedState,
      value || null,
      null,
      null,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      activeTab,
      page,
    );
  };

  const handleBlockChange = (value: string) => {
    setSelectedBlock(value || null);
    setSelectedConnection(null);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      value || null,
      null,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      activeTab,
      page,
    );
  };

  const handleLinkChange = (value: string) => {
    setSelectedConnection(value || null);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      activeTab,
      page,
    );
  };

  const handleStatusToggle = (value: number) => {
    const statusValue = selectedStatus.includes(value)
      ? selectedStatus.filter((s) => s !== value)
      : [...selectedStatus, value];
    setSelectedStatus(statusValue);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      statusValue,
      worktype,
      fromdate,
      todate,
      globalsearch,
      activeTab,
      page,
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
       if (
        workTypeDropdownRef.current &&
        !workTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setWorkTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



   const handleWorkTypeToggle = (value: string) => {
    const updated = worktype.includes(value)
      ? worktype.filter((w) => w !== value)
      : [...worktype, value];
    setWorktype(updated);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      updated,
      fromdate,
      todate,
      globalsearch,
      activeTab,
      page,
    );
  };
 

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      value,
      todate,
      globalsearch,
      activeTab,
      page,
    );
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      value,
      globalsearch,
      activeTab,
      page,
    );
  };

  const handleSearchChange = (value: string) => {
    setGlobalSearch(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      value,
      activeTab,
      page,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AerialHeader />

      {/* <ConstructionStatsPanel
        surveys={surveyData}
        isLoading={loadingStats || loadingPoleStats}
      /> */}

      {poleStats.length > 0 && (
        <div className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {poleStats.map((s) => (
              <StatsCard
                key={s.label}
                label={s.label}
                value={s.value}
                accentColor={s.accentColor}
                breakdown={s.breakdown}
              />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center px-6">
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg outline-none ${
                  activeTab === 'Aerial'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => {
                  handletabchage('Aerial');
                  // setActiveTab('Aerial');
                  // const params: Record<string, string> = {};
                  // params.tab = 'Aerial';
                  // setSearchParams(params);
                }}
              >
                Aerial
              </button>
            </li>
            <li>
              <button
                className={`inline-block p-4 rounded-t-lg outline-none ${
                  activeTab === 'Pole'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => {
                  // setActiveTab('Pole');
                  // const params: Record<string, string> = {};
                  // params.tab = 'Pole';
                  // setSearchParams(params);
                   handletabchage('Pole');
                }}
              >
                New Pole Construction
              </button>
            </li>
          </ul>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <SearchableSelect
                value={selectedState || ''}
                onChange={(value) => handleStateChange(value)}
                disabled={loadingStates}
                options={states.map((state) => ({
                  value: String(state.state_id),
                  label: state.state_name,
                }))}
                placeholder="All States"
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <SearchableSelect
                value={selectedDistrict || ''}
                onChange={(value) => handleDistrictChange(value)}
                disabled={!selectedState || loadingDistricts}
                options={districts.map((district) => ({
                  value: String(district.district_id),
                  label: district.district_name,
                }))}
                placeholder="All Districts"
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <SearchableSelect
                value={selectedBlock || ''}
                onChange={(value) => handleBlockChange(value)}
                disabled={!selectedDistrict || loadingBlock}
                options={blocks.map((block) => ({
                  value: String(block.block_id),
                  label: block.block_name,
                }))}
                placeholder="All Blocks"
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-56">
              <SearchableSelect
                value={selectedConnection || ''}
                onChange={(value) => handleLinkChange(value)}
                disabled={!selectedBlock || loadingConnections}
                options={connections.map((conn) => ({
                  value: conn.route_name,
                  label: conn.route_name,
                }))}
                placeholder="Select Links"
              />
            </div>

            <div
              className="relative flex-1 min-w-0 sm:flex-none sm:w-44"
              ref={statusDropdownRef}
            >
              <button
                type="button"
                onClick={() => setStatusDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <span className="truncate text-left">
                  {selectedStatus.length === 0
                    ? 'All Status'
                    : selectedStatus.map((s) => statusMap[s]).join(', ')}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {statusDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatus.includes(option.value)}
                        onChange={() => handleStatusToggle(option.value)}
                        className="rounded border-gray-300"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <input
                type="date"
                value={fromdate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="From Date"
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <input
                type="date"
                value={todate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="To Date"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
             <div
                  className="relative flex-1 min-w-0 sm:flex-none sm:w-44"
                  ref={workTypeDropdownRef}
                >
                  <button
                    type="button"
                    onClick={() => setWorkTypeDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <span className="truncate text-left">
                      {worktype.length === 0
                        ? 'All Work Type'
                        : worktype
                            .map(
                              (value) =>
                                workTypeOptions.find(
                                  (option) => option.value === value,
                                )?.label ?? value,
                            )
                            .join(', ')}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {workTypeDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600">
                      {workTypeOptions.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={worktype.includes(option.value)}
                            onChange={() => handleWorkTypeToggle(option.value)}
                            className="rounded border-gray-300"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
          

            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={globalsearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <button
              onClick={() => setExcel(true)}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
            >
              <SheetIcon className="h-4 w-4 text-green-600" />
              Excel
            </button>
            {activeTab == 'Aerial' &&(

            <button
              onClick={() => setKml(true)}
              className="flex items-center gap-2 flex-none h-10 px-4 py-2 text-sm font-medium text-yellow-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap"
            >
              <Globe2Icon className="h-4 w-4" />
              KML
            </button>
            )}

            <button
              onClick={() => setPreview(!preview)}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
            >
              <EyeIcon className="h-4 w-4 text-blue-600" />
              Preview
            </button>

            {activeTab === 'Aerial' && (
              <button
                onClick={() => setMergeSurveys(true)}
                disabled={mergeLoading}
                className="flex-none h-10 px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
              >
                {mergeLoading ? (
                  <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <GitMerge className="h-4 w-4 text-indigo-600" />
                )}
                {mergeLoading ? 'Merging...' : 'Merge Surveys'}
              </button>
            )}

            {(activeTab === 'Aerial' && AdminAcess) && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-none h-10 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
              >
                <PlusCircleIcon className="h-4 w-4 text-blue-600" />
                Add New Event
              </button>
            )}

            <button
              onClick={clearFilters}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
            >
              <span className="text-red-500 font-medium text-sm">✕</span>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {activeTab === 'Aerial' && (
          <Report
            Data={{
              selectedState,
              selectedDistrict,
              selectedBlock,
              selectedStatus,
              worktype,
              constType,
              cords: '',
              fromdate,
              todate,
              globalsearch,
              excel,
              kml,
              filtersReady,
              preview,
              progressmap: false,
              isAddModalOpen,
              selectedConnection,
              connectionStart: getSelectedConnectionDetails()?.startLocation,
              connectionEnd: getSelectedConnectionDetails()?.endLocation,
              page,
              mergeSurveys,

            }}
            Onexcel={() => setExcel(false)}
            OnPreview={() => setPreview(false)}
            OnProgressMap={() => {}}
            OnKml={() => setKml(false)}
            OnModal={() => setIsAddModalOpen(false)}
            OnData={(data: UGConstructionSurveyData[]) => setSurveyData(data)}
            OnPageChange={handlePageChange}
            OnMergeSurveys={() => setMergeSurveys(false)}
            OnMergeLoadingChange={setMergeLoading}
          />
        )}
        {activeTab === 'Pole' && (
          <Poles
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            selectedBlock={selectedBlock}
            selectedStatus={selectedStatus}
            worktype={worktype}
            fromdate={fromdate}
            todate={todate}
            globalsearch={globalsearch}
            filtersReady={filtersReady}
            excel={excel}
            preview={preview}
            OnData={() => setSurveyData([])}
            Onexcel={() => setExcel(false)}
            OnPreview={() => setPreview(false)}
          />
        )}
      </div>
    </div>
  );
}

export default AerialListPage;
