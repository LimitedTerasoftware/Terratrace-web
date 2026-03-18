import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Link2,
  Ruler,
  Calendar,
  TrendingUp,
  CogIcon,
  Search,
} from 'lucide-react';
import { MachineLinkStats, MachineLinkStatsResponse } from '../../../types/machine';
import StatusCard from './SummaryCards';
import { machineApi } from '../../Services/api';
import { FaArrowLeft } from 'react-icons/fa';
import { getBlockData, getDistrictData, getStateData } from '../../Services/api';
import { Block, District, StateData } from '../../../types/survey';
import DataTable, { TableColumn } from 'react-data-table-component';

export default function MachineDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MachineLinkStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersReady, setFiltersReady] = useState(false);

  useEffect(() => {
    try {
      setLoadingStates(true);

      getStateData().then(data => {
        setStates(data);
      })
    } catch (error) {
      console.error('Error fetching states:', error);

    } finally {
      setLoadingStates(false);
    }

  }, [])

  useEffect(() => {
    if (selectedState) {
      setLoadingDistricts(true);

      getDistrictData(selectedState).then(data => {
        setDistricts(data);
      })
    } else {
      setDistricts([])
      setLoadingDistricts(false);

    }
    setLoadingDistricts(false);
  }, [selectedState])

  useEffect(() => {
    if (selectedDistrict) {
      setLoadingBlock(true);
      getBlockData(selectedDistrict).then(data => {
        setBlocks(data);
      })
    } else {
      setBlocks([])
    }
    setLoadingBlock(false);
  }, [selectedDistrict])



  useEffect(() => {
    if (id) {
      fetchMachineLinkStats();
    }
  }, [id, selectedState, selectedDistrict, selectedBlock, fromdate, todate, filtersReady]);

  const fetchMachineLinkStats = async () => {
    try {
      setLoading(true);
      const response = await machineApi.getMachineLinkStats(
        parseInt(id!),
        selectedState || undefined,
        selectedDistrict || undefined,
        selectedBlock || undefined,
        fromdate || undefined,
        todate || undefined
      );
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const state_id = searchParams.get('state_id') || null;
    const district_id = searchParams.get('district_id') || null;
    const block_id = searchParams.get('block_id') || null;
    const from_date = searchParams.get('from_date') || '';
    const to_date = searchParams.get('to_date') || "";
    const search = searchParams.get('search') || "";

    setSelectedState(state_id);
    setSelectedDistrict(district_id);
    setSelectedBlock(block_id);
    setFromDate(from_date);
    setToDate(to_date);
    setGlobalSearch(search)
    setFiltersReady(true);
  }, []);

  const handleFilterChange = (newState: string | null, newDistrict: string | null, newBlock: string | null, from_date: string | null, to_date: string | null, search: string | null) => {
    const params: Record<string, string> = {};
    if (newState) params.state_id = newState;
    if (newDistrict) params.district_id = newDistrict;
    if (newBlock) params.block_id = newBlock;
    if (from_date) params.from_date = from_date;
    if (to_date) params.to_date = to_date;
    if (search) params.search = search;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setGlobalSearch('');
    setFromDate('');
    setToDate('');
    setSearchParams({});
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value || null);
    handleFilterChange(value || null, selectedDistrict, selectedBlock, fromdate, todate, globalsearch);
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value || null);
    handleFilterChange(selectedState, value || null, selectedBlock, fromdate, todate, globalsearch);
  };

  const handleBlockChange = (value: string) => {
    setSelectedBlock(value || null);
    handleFilterChange(selectedState, selectedDistrict, value || null, fromdate, todate, globalsearch);
  };



  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    handleFilterChange(selectedState, selectedDistrict, selectedBlock, value, todate, globalsearch);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    handleFilterChange(selectedState, selectedDistrict, selectedBlock, fromdate, value, globalsearch);
  };

  const handleSearchChange = (value: string) => {
    setGlobalSearch(value);
    handleFilterChange(selectedState, selectedDistrict, selectedBlock, fromdate, todate, value);
  };

  const filteredData = useMemo(() => {
    if (!globalsearch.trim()) return data?.data || [];

    const lowerSearch = globalsearch.toLowerCase();

    return data?.data.filter((row: MachineLinkStats) =>
      Object.values(row).some((value) =>
        (typeof value === 'string' || typeof value === 'number') &&
        value.toString().toLowerCase().includes(lowerSearch)
      )
    ) || [];
  }, [globalsearch, data]);

  const customStyles = {
    headCells: {
      style: {
        fontSize: '11px',
        fontWeight: '500',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        color: '#9CA3AF',
        backgroundColor: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        fontSize: '14px',
        color: '#111827',
        borderBottom: '1px solid #F3F4F6',
      },
    },
    rows: {
      style: {
        '&:hover': {
          backgroundColor: '#F9FAFB',
        },
      },
    },
  };
  const columns: TableColumn<MachineLinkStats>[] = [
    {
      name: "Registration No.",
      selector: (row: MachineLinkStats) => row.registration_number,
      sortable: true,
      wrap: true
    },
    {
      name: "Serial No.",
      selector: (row: MachineLinkStats) => row.serial_number,
      sortable: true,
      wrap: true
    },
    {
      name: "Machine Make",
      selector: (row: MachineLinkStats) =>
        row.machine_model ? `${row.machine_make} - ${row.machine_model}` : row.machine_make,
      sortable: true,
      wrap: true
    },
    {
      name: "Location",
      cell: (row: MachineLinkStats) => (
        <div className="flex flex-col">
          <span>{row.state}</span>
          <span className="text-xs text-gray-500">
            {row.district}, {row.block}
          </span>
        </div>
      ),
    },
    {
      name: "Link Name",
      selector: (row: MachineLinkStats) => row.link_name,
      sortable: true,
      wrap: true
    },
    {
      name: "Total Links",
      selector: (row: MachineLinkStats) => row.total_links,
      sortable: true,
      right: true,
    },
    {
      name: "Distance (m)",
      selector: (row: MachineLinkStats) =>
        row.total_distance_meters,
      sortable: true,
      right: true,
    },
    {
      name: "Total Day",
      selector: (row: MachineLinkStats) =>
        (row.total_days),
      sortable: true,
      right: true,
    },
    {
      name: "Avg Distance/Day (m)",
      selector: (row: MachineLinkStats) =>
        (row.avg_distance_per_day),
      sortable: true,
      right: true,
    },

  ];



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-medium">Error: {error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }
  const MachineHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <CogIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Machine Details</h1>
              <p className="text-sm text-gray-600">Monitor and manage equipment inventory</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
              onClick={() => window.history.back()}
            >
              <FaArrowLeft className="h-5 w-5" />
              Back
            </button>
          </div>
        </div>
      </header>
    );
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <MachineHeader />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-2 px-1 py-6">
        <StatusCard
          title="Total Links"
          value={data?.summary.total_links || 0}
          icon={Link2}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatusCard
          title="Total Distance"
          value={`${parseFloat(data?.summary.total_distance_meters || '0').toFixed(2)} m`}
          icon={Ruler}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatusCard
          title="Total Days"
          value={data?.summary.total_days || 0}
          icon={Calendar}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatusCard
          title="Avg Distance/Day"
          value={`${parseFloat(data?.summary.avg_distance_per_day || '0').toFixed(2)} m`}
          icon={TrendingUp}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">

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
                <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
                <option key={district.district_id} value={district.district_id}>
                  {district.district_name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              {loadingDistricts ? (
                <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
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
                <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
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
          <div className="relative w-60">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
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

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2">
            <span className="text-red-500 dark:text-red-400 font-medium text-sm">✕</span>
            <span>Clear Filters</span>
          </button>
        </div>


      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Machine Link Statistics
          </h2>
        </div>
        {filteredData.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Machine data found</h3>
            <p className="text-gray-500">
              {globalsearch
                ? 'Try adjusting your search or filter criteria.'
                : 'There is no machine data available.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredData || []}
              progressPending={loading}
              pagination
              highlightOnHover
              pointerOnHover
              striped
              dense
              responsive
              customStyles={customStyles}

            />
          </div>
        )}


      </div>
    </div>

  );
}
