import { useEffect, useState } from 'react';
import { StateData, District, Block } from '../../../types/survey';
import MainInstallationReport from './MainInstallationReport';
import InstallationStatsPanel from './InstallationStatsPanel';
import { Group, Construction } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

interface StatesResponse {
  success: boolean;
  data: StateData[];
}

type StatusOption = {
  value: string;
  label: string;
};

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

function InstallationPage() {
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Store both ID (for hierarchy APIs) and CODE (for installation APIs)
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(
    null,
  );
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    null,
  );
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<
    string | null
  >(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedBlockCode, setSelectedBlockCode] = useState<string | null>(
    null,
  );
  const [globalsearch, setGlobalSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string | ''>('');
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingBlock, setLoadingBlock] = useState<boolean>(false);
  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'GP_INSTALLATION' | 'BLOCK_INSTALLATION'
  >('GP_INSTALLATION');
  const [excel, setExcel] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersReady, setFiltersReady] = useState(false);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStatsPanel, setLoadingStatsPanel] = useState<boolean>(false);

  const statusOptions: StatusOption[] = [
    { value: 'ACCEPT', label: 'Accepted' },
    { value: 'REJECT', label: 'Rejected' },
    { value: 'PENDING', label: 'Pending' },
  ];
  const InstallationHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <Group className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Equipment Installation
              </h1>
              <p className="text-sm text-gray-600">
                Monitor and analyze equipment installation data
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
              <li className="font-medium text-primary">Installation Data</li>
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

  // Function to fetch stats panel data based on active tab
  const fetchStatsData = async () => {
    try {
      setLoadingStatsPanel(true);

      // Build query params
      const params = new URLSearchParams();
      if (selectedStateCode) params.append('state_code', selectedStateCode);
      if (selectedDistrictCode)
        params.append('district_code', selectedDistrictCode);
      if (selectedBlockCode) params.append('block_code', selectedBlockCode);
      if (fromdate) params.append('from_date', fromdate);
      if (todate) params.append('to_date', todate);
      if (globalsearch) params.append('search', globalsearch);
      if (selectedStatus !== '')
        params.append('status', selectedStatus.toString());

      const queryString = params.toString();
      const urlSuffix = queryString ? `?${queryString}` : '';

      let url = '';
      if (activeTab === 'GP_INSTALLATION') {
        url = `${TraceBASEURL}/get-gps-count${urlSuffix}`;
      } else {
        url = `${TraceBASEURL}/get-block-count${urlSuffix}`;
      }

      const response = await axios.get<{ success: boolean; summary: any }>(url);

      if (response.data.success) {
        setStatsData(response.data.summary);
      } else {
        setStatsData(null);
      }
    } catch (error) {
      console.error('Error fetching stats data:', error);
      setStatsData(null);
    } finally {
      setLoadingStatsPanel(false);
    }
  };



  useEffect(() => {
    fetchStates();
  }, []);



  // Fetch stats panel data when tab or location filters change
  useEffect(() => {
    if (filtersReady) {
      fetchStatsData();
    }
  }, [activeTab, selectedStateCode, selectedDistrictCode, filtersReady, selectedBlockCode, fromdate, todate, globalsearch, selectedStatus]);
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
      if (!selectedDistrictId) return;
      setLoadingBlock(true);

      const response = await fetch(
        `${BASEURL}/blocksdata?district_code=${selectedDistrictId}`,
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

  useEffect(() => {
    if (selectedStateId) {
      fetchDistricts(selectedStateId);
    } else {
      setDistricts([]);
    }
  }, [selectedStateId, states]);

  useEffect(() => {
    fetchBlock();
  }, [selectedDistrictId]);

  useEffect(() => {
    const state_code = searchParams.get('state_code') || null;
    const district_code = searchParams.get('district_code') || null;
    const block_code = searchParams.get('block_code') || null;
    const from_date = searchParams.get('from_date') || '';
    const to_date = searchParams.get('to_date') || '';
    const search = searchParams.get('search') || '';
    const tab =
      (searchParams.get('tab') as 'GP_INSTALLATION' | 'BLOCK_INSTALLATION') ||
      'GP_INSTALLATION';
    const status = searchParams.get('status') || null;

    // Set codes for installation APIs
    setSelectedStateCode(state_code);
    setSelectedDistrictCode(district_code);
    setSelectedBlockCode(block_code);
    setSelectedStatus(status || '');
    setFromDate(from_date);
    setToDate(to_date);
    setGlobalSearch(search);
    setActiveTab(tab);
    setFiltersReady(true);
  }, []);

  // Resolve IDs from codes when states are loaded (for URL navigation)
  useEffect(() => {
    if (states.length > 0 && selectedStateCode && !selectedStateId) {
      const state = states.find(
        (s) => s.state_code.toString() === selectedStateCode,
      );
      if (state) {
        setSelectedStateId(state.state_id);
      }
    }
  }, [states, selectedStateCode, selectedStateId]);

  const handleFilterChange = (
    stateCode: string | null,
    districtCode: string | null,
    blockCode: string | null,
    from_date: string | null,
    to_date: string | null,
    search: string | null,
    status: string | null,
  ) => {
    const params: Record<string, string> = {};
    if (stateCode) params.state_code = stateCode;
    if (districtCode) params.district_code = districtCode;
    if (blockCode) params.block_code = blockCode;
    if (from_date) params.from_date = from_date;
    if (to_date) params.to_date = to_date;
    if (search) params.search = search;
    if (status !== null) params.status = status.toString();
    params.tab = activeTab;
    setSearchParams(params);
  };

  const handleTabChange = (tab: 'GP_INSTALLATION' | 'BLOCK_INSTALLATION') => {
    setActiveTab(tab);
    const params: Record<string, string> = {};
    if (selectedStateCode) params.state_code = selectedStateCode;
    if (selectedDistrictCode) params.district_code = selectedDistrictCode;
    if (selectedBlockCode) params.block_code = selectedBlockCode;
    if (fromdate) params.from_date = fromdate;
    if (todate) params.to_date = todate;
    if (globalsearch) params.search = globalsearch;
    if (selectedStatus !== '') params.status = selectedStatus.toString();
    params.tab = tab;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSelectedStateId(null);
    setSelectedStateCode(null);
    setSelectedDistrictId(null);
    setSelectedDistrictCode(null);
    setSelectedStatus('');
    setSelectedBlockId(null);
    setSelectedBlockCode(null);
    setGlobalSearch('');
    setFromDate('');
    setToDate('');
    const params: Record<string, string> = {};
    params.tab = activeTab;
    setSearchParams(params);
  };

  const handleStateChange = (value: string) => {
    if (!value) {
      // Clear all when no state selected
      setSelectedStateId(null);
      setSelectedStateCode(null);
      setSelectedDistrictId(null);
      setSelectedDistrictCode(null);
      setSelectedBlockId(null);
      setSelectedBlockCode(null);
      setDistricts([]);
      setBlocks([]);
      handleFilterChange(
        null,
        null,
        null,
        fromdate,
        todate,
        globalsearch,
        selectedStatus,
      );
      return;
    }

    // Find selected state to get both ID and code
    const selectedState = states.find((s) => s.state_code.toString() === value);
    if (selectedState) {
      setSelectedStateId(selectedState.state_id);
      setSelectedStateCode(selectedState.state_code.toString());
      setSelectedDistrictId(null);
      setSelectedDistrictCode(null);
      setSelectedBlockId(null);
      setSelectedBlockCode(null);
      setDistricts([]);
      setBlocks([]);
      handleFilterChange(
        selectedState.state_code.toString(),
        null,
        null,
        fromdate,
        todate,
        globalsearch,
        selectedStatus,
      );
    }
  };

  const handleDistrictChange = (value: string) => {
    if (!value) {
      setSelectedDistrictId(null);
      setSelectedDistrictCode(null);
      setSelectedBlockId(null);
      setSelectedBlockCode(null);
      setBlocks([]);
      handleFilterChange(
        selectedStateCode,
        null,
        null,
        fromdate,
        todate,
        globalsearch,
        selectedStatus,
      );
      return;
    }

    // Find selected district to get both ID and code
    const selectedDistrict = districts.find(
      (d) => d.district_code.toString() === value,
    );
    if (selectedDistrict) {
      setSelectedDistrictId(selectedDistrict.district_id);
      setSelectedDistrictCode(selectedDistrict.district_code.toString());
      setSelectedBlockId(null);
      setSelectedBlockCode(null);
      setBlocks([]);
      handleFilterChange(
        selectedStateCode,
        selectedDistrict.district_code.toString(),
        null,
        fromdate,
        todate,
        globalsearch,
        selectedStatus,
      );
    }
  };

  const handleBlockChange = (value: string) => {
    if (!value) {
      setSelectedBlockId(null);
      setSelectedBlockCode(null);
      handleFilterChange(
        selectedStateCode,
        selectedDistrictCode,
        null,
        fromdate,
        todate,
        globalsearch,
        selectedStatus,
      );
      return;
    }

    // Find selected block to get both ID and code
    const selectedBlock = blocks.find((b) => b.block_code.toString() === value);
    if (selectedBlock) {
      setSelectedBlockId(selectedBlock.block_id);
      setSelectedBlockCode(selectedBlock.block_code.toString());
      handleFilterChange(
        selectedStateCode,
        selectedDistrictCode,
        selectedBlock.block_code.toString(),
        fromdate,
        todate,
        globalsearch,
        selectedStatus,
      );
    }
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    handleFilterChange(
      selectedStateCode,
      selectedDistrictCode,
      selectedBlockCode,
      value,
      todate,
      globalsearch,
      selectedStatus,
    );
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    handleFilterChange(
      selectedStateCode,
      selectedDistrictCode,
      selectedBlockCode,
      fromdate,
      value,
      globalsearch,
      selectedStatus,
    );
  };

  const handleSearchChange = (value: string) => {
    setGlobalSearch(value);
    handleFilterChange(
      selectedStateCode,
      selectedDistrictCode,
      selectedBlockCode,
      fromdate,
      todate,
      value,
      selectedStatus,
    );
  };
  const handleStatusChange = (value: string) => {
    const statusValue = value;
    setSelectedStatus(statusValue);
    handleFilterChange(
      selectedStateCode,
      selectedDistrictCode,
      selectedBlockCode,
      fromdate,
      todate,
      globalsearch,
      statusValue,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <InstallationHeader />

      {/* Stats Panel */}
      <InstallationStatsPanel
        isLoading={loadingStats}
        statsData={statsData}
        statsLoading={loadingStatsPanel}
        activeTab={activeTab}
      />

      {/* Main Content Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          {/* First Row - Location Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* State Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedStateCode || ''}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={loadingStates}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state.state_id} value={state.state_code}>
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
                value={selectedDistrictCode || ''}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedStateId || loadingDistricts}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                <option value="">All Districts</option>
                {districts.map((district) => (
                  <option
                    key={district.district_id}
                    value={district.district_code}
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
                value={selectedBlockCode || ''}
                onChange={(e) => handleBlockChange(e.target.value)}
                disabled={!selectedDistrictId || loadingBlock}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                <option value="">All Blocks</option>
                {blocks.map((block) => (
                  <option key={block.block_id} value={block.block_code}>
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

            {/* Status Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedStatus}
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

          {/* Second Row - Search and Excel Export */}
          <div className="flex flex-wrap items-center gap-3">
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
                placeholder={`Search ${activeTab === 'GP_INSTALLATION' ? 'GP' : 'Block'} installations...`}
                value={globalsearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* Excel Export Button */}
            <button
              onClick={() => setExcel(true)}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
              title={`Export ${activeTab === 'GP_INSTALLATION' ? 'GP' : 'Block'} installation data to Excel`}
            >
              <Construction className="h-4 w-4 text-green-600" />
              Export Excel
            </button>

            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-500 ml-auto">
              <span>
                Showing data for:{' '}
                {activeTab === 'GP_INSTALLATION'
                  ? 'GP Installations'
                  : 'Block Installations'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <MainInstallationReport
          Data={{
            selectedState: selectedStateCode,
            selectedDistrict: selectedDistrictCode,
            selectedBlock: selectedBlockCode,
            selectedStatus: selectedStatus,
            fromdate,
            todate,
            globalsearch,
            excel,
            filtersReady,
          }}
          Onexcel={() => setExcel(false)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
}

export default InstallationPage;
