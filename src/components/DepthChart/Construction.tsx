import { act, useEffect, useState } from 'react';
import { StateData, District, Block } from '../../types/survey';
import Report from './UGConst';
import ConstructionStatsPanel from './ConstructionStatsPanel';
import {
  SheetIcon,
  Construction,
  EyeIcon,
  PlusCircleIcon,
  Globe2Icon,
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { UGConstructionSurveyData } from '../../types/survey';
import { isAdminUser } from '../../utils/accessControl';
interface StatesResponse {
  success: boolean;
  data: StateData[];
}

type StatusOption = {
  value: number;
  label: string;
};

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const AdminAcess = isAdminUser();

function ConstructionPage() {
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
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const activeTab = 'UG';
  const [excel, setExcel] = useState<boolean>(false);
  const [kml, setkml] = useState<boolean>(false);
  const [preview, setPreview] = useState<boolean>(false);
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

  // New state for stats panel
  const [surveyData, setSurveyData] = useState<UGConstructionSurveyData[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [worktype, setworktype] = useState<string>('');
  const [constType, setConstType] = useState<string>('Hdd');
  const [cords, setcords] = useState<string>('');
  const [page, setPage] = useState<number>(1);

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

  const ConstructionHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
              <Construction className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'UG' ? 'Construction' : 'New Pole Construction'}{' '}
                Management
              </h1>
              <p className="text-sm text-gray-600">
                Monitor and analyze{' '}
                {activeTab === 'UG' ? 'construction' : 'new pole construction'}{' '}
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
                {activeTab === 'UG' ? 'Construction' : 'New Pole Construction'}{' '}
                Data
              </li>
            </ol>
          </nav>
        </div>
      </header>
    );
  };

  const fetchStates = async () => {
    try {
      setLoadingStates(true);
      const response = await fetch(`${BASEURL}/states`);
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
    // const params: Record<string, string> = {};
    // const tab = searchParams.get('tab') || 'UG';
    // if (tab) params.tab = tab;
    // setSearchParams(params);
  }, []);

  const fetchDistricts = async (stateId: string) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }

    try {
      setLoadingDistricts(true);
      const response = await fetch(
        `${BASEURL}/districtsdata?state_code=${stateId}`,
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
        `${BASEURL}/blocksdata?district_code=${selectedDistrict}`,
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
      if (!selectedBlock) {
        return;
      }
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
    const status = searchParams.get('status') || null;
    const from_date = searchParams.get('from_date') || '';
    const to_date = searchParams.get('to_date') || '';
    const search = searchParams.get('search') || '';
    const worktype = searchParams.get('worktype') || '';
    const constType = searchParams.get('constType') || 'Hdd';
    const cords = searchParams.get('cords') || '';
    const pageParam = searchParams.get('page') || '1';

    setcords(cords);
    setSelectedState(state_id);
    setSelectedDistrict(district_id);
    setSelectedBlock(block_id);
    setSelectedStatus(status !== null ? Number(status) : null);
    setFromDate(from_date);
    setToDate(to_date);
    setGlobalSearch(search);
    setworktype(worktype);
    setFiltersReady(true);
    setConstType(constType);
    setPage(Number(pageParam));
  }, []);

  const handleFilterChange = (
    newState: string | null,
    newDistrict: string | null,
    newBlock: string | null,
    newLink: string | null,
    status: number | null,
    worktype: string | '',
    from_date: string | null,
    to_date: string | null,
    search: string | null,
    constType: string | '',
    tab?: 'UG' | 'Pole',
    cords?: string | '',
    page?: number,
  ) => {
    const params: Record<string, string> = {};
    if (newState) params.state_id = newState;
    if (newDistrict) params.district_id = newDistrict;
    if (newBlock) params.block_id = newBlock;
    if (newLink) params.link = newLink;
    if (status !== null) {
      params.status = String(status);
    }
    if (worktype) params.worktype = worktype;
    if (from_date) params.from_date = from_date;
    if (to_date) params.to_date = to_date;
    if (search) params.search = search;
    if (constType) params.constType = constType;
    if (tab) params.tab = tab;
    if (cords) params.cords = cords;
    if (page && page > 1) params.page = String(page);
    setSearchParams(params);
    if (!page) setPage(1);
  };

  const clearFilters = () => {
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    setSelectedStatus(null);
    setGlobalSearch('');
    setFromDate('');
    setToDate('');
    setSearchParams({});
    setworktype('');
    setConstType('');
    setcords('');
    setPage(1);
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
      constType,
      activeTab,
      cords,
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
      constType,
      activeTab,
      cords,
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
      constType,
      activeTab,
      cords,
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
      constType,
      activeTab,
      cords,
      page,
    );
  };

  const handleStatusChange = (value: string) => {
    const statusValue = value === 'null' ? null : Number(value);
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
      constType,
      activeTab,
      cords,
      page,
    );
  };
  const handleworkChange = (value: string) => {
    setworktype(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      value,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
    );
  };
  const handleConstTypeChange = (value: string) => {
    setConstType(value);
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
      value,
      activeTab,
      cords,
      page,
    );
  };
  const handleCordsChange = (value: string) => {
    setcords(value);
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
      constType,
      activeTab,
      value,
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
      constType,
      activeTab,
      cords,
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
      constType,
      activeTab,
      cords,
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
      constType,
      activeTab,
      cords,
      page,
    );
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
      constType,
      activeTab,
      cords,
      newPage,
    );
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <ConstructionHeader />

      {/* Stats Panel */}
      <ConstructionStatsPanel surveys={surveyData} isLoading={loadingStats} />

      {/* Main Content Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center px-6">
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg outline-none ${
                  activeTab === 'UG'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                onClick={() => {
                  const params: Record<string, string> = {};
                  params.tab = 'UG';
                  setSearchParams(params);
                }}
              >
                Construction
              </button>
            </li>
          </ul>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          {/* First Row - Location Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* State Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedState || ''}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={loadingStates}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state.state_id} value={state.state_id}>
                    {state.state_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                {loadingStates ? (
                  <svg
                    className="animate-spin h-4 w-4 text-gray-400"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* District Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedDistrict || ''}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedState || loadingDistricts}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                <option value="">All Districts</option>
                {districts.map((district) => (
                  <option
                    key={district.district_id}
                    value={district.district_id}
                  >
                    {district.district_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                {loadingDistricts ? (
                  <svg
                    className="animate-spin h-4 w-4 text-gray-400"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Block Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedBlock || ''}
                onChange={(e) => handleBlockChange(e.target.value)}
                disabled={!selectedDistrict || loadingBlock}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                <option value="">All Blocks</option>
                {blocks.map((block) => (
                  <option key={block.block_id} value={block.block_id}>
                    {block.block_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                {loadingBlock ? (
                  <svg
                    className="animate-spin h-4 w-4 text-gray-400"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </div>
            {/* Links Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-56">
              <select
                value={selectedConnection || ''}
                onChange={(e) => handleLinkChange(e.target.value)}
                disabled={!selectedBlock || loadingConnections}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                <option value="">Select Links</option>
                {connections.map((conn) => (
                  <option value={conn.route_name} key={conn.route_name}>
                    {conn.route_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                {loadingConnections ? (
                  <svg
                    className="animate-spin h-4 w-4 text-gray-400"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedStatus !== null ? selectedStatus : ''}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="null">All Status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Date Filters */}
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

          {/* Second Row - Search and Excel Export */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={worktype !== '' ? worktype : ''}
                onChange={(e) => handleworkChange(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Work Type</option>
                <option value="New Construction">New Construction</option>
                <option value="Rectification">Rectification</option>
              </select>

              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {activeTab === 'UG' && (
              <>
                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                  <select
                    value={constType !== '' ? constType : ''}
                    onChange={(e) => handleConstTypeChange(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All Construction Type</option>
                    <option value="Hdd">HDD</option>
                    {/* <option value="Aerial">Aerial</option> */}
                    <option value="OpenTrench">OpenTrench</option>
                  </select>

                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                  <select
                    value={cords !== '' ? cords : ''}
                    onChange={(e) => handleCordsChange(e.target.value)}
                    className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">ALL CORDS</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>

                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
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
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </>
            )}

            {/* Search Bar */}
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
                  ></path>
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

            {/* Excel Export Button */}

            <button
              onClick={() => setExcel(true)}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
            >
              <SheetIcon className="h-4 w-4 text-green-600" />
              Excel
            </button>
            {activeTab === 'UG' && (
              <button
                onClick={() => setkml(true)}
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
            {activeTab === 'UG' && AdminAcess && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-none h-10 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-blue-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
              >
                <PlusCircleIcon className="h-4 w-4 text-blue-600" />
                Add New Event
              </button>
            )}

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
            >
              <span className="text-red-500 dark:text-red-400 font-medium text-sm">
                ✕
              </span>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'UG' && (
          <Report
            Data={{
              selectedState,
              selectedDistrict,
              selectedBlock,
              selectedStatus,
              worktype,
              constType,
              cords,
              fromdate,
              todate,
              globalsearch,
              excel,
              kml,
              filtersReady,
              preview,
              isAddModalOpen,
              selectedConnection,
              connectionStart: getSelectedConnectionDetails()?.startLocation,
              connectionEnd: getSelectedConnectionDetails()?.endLocation,
              page,
            }}
            Onexcel={() => setExcel(false)}
            OnPreview={() => setPreview(false)}
            OnKml={() => setkml(false)}
            OnModal={() => setIsAddModalOpen(false)}
            OnData={(data: UGConstructionSurveyData[]) => setSurveyData(data)}
            OnPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}

export default ConstructionPage;
