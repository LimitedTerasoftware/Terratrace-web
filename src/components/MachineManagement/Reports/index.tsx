import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Factory,
  Activity,
  TrendingUp,
  Eye,
  CogIcon,
  Search,
  X,
  Ruler,
  Calendar,
} from 'lucide-react';
import {
  MachineDataReport,
  MachineDetailsResponse,
  MachineList,
} from '../../../types/machine';
import StatusCard from './SummaryCards';
import {
  getStateData,
  getDistrictData,
  getBlockData,
  machineApi,
} from '../../Services/api';
import DataTable, { TableColumn } from 'react-data-table-component';
import { Block, District } from '../../../types/survey';

interface StateData {
  state_id: number;
  state_name: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<MachineDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState<boolean>(false);
  const [machineData, setMachineData] = useState<MachineList[] | []>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingBlock, setLoadingBlock] = useState<boolean>(false);

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    fetchMachineDetails(
      selectedState,
      selectedDistrict,
      selectedBlock,
      fromdate,
      todate,
    );
  }, [selectedState, selectedDistrict, selectedBlock, fromdate, todate]);

  useEffect(() => {
    if (selectedState) {
      setLoadingDistricts(true);
      getDistrictData(selectedState)
        .then((data) => {
          setDistricts(data);
        })
        .finally(() => setLoadingDistricts(false));
    } else {
      setDistricts([]);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) {
      setLoadingBlock(true);
      getBlockData(selectedDistrict)
        .then((data) => {
          setBlocks(data);
        })
        .finally(() => setLoadingBlock(false));
    } else {
      setBlocks([]);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    const state_id = searchParams.get('state_id') || '';
    const district_id = searchParams.get('district_id') || '';
    const block_id = searchParams.get('block_id') || '';
    const from_date = searchParams.get('from_date') || '';
    const to_date = searchParams.get('to_date') || '';
    const search = searchParams.get('search') || '';

    setSelectedState(state_id);
    setSelectedDistrict(district_id);
    setSelectedBlock(block_id);
    setFromDate(from_date);
    setToDate(to_date);
    setSearchQuery(search);
  }, []);

  const handleFilterChange = (
    newState: string,
    newDistrict: string,
    newBlock: string,
    from_date: string,
    to_date: string,
    search: string,
  ) => {
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
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedBlock('');
    setSearchQuery('');
    setFromDate('');
    setToDate('');
    setSearchParams({});
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedDistrict('');
    setSelectedBlock('');
    handleFilterChange(value, '', '', fromdate, todate, searchQuery);
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedBlock('');
    handleFilterChange(selectedState, value, '', fromdate, todate, searchQuery);
  };

  const handleBlockChange = (value: string) => {
    setSelectedBlock(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      value,
      fromdate,
      todate,
      searchQuery,
    );
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      value,
      todate,
      searchQuery,
    );
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      fromdate,
      value,
      searchQuery,
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      fromdate,
      todate,
      value,
    );
  };

  const fetchStates = async () => {
    try {
      getStateData().then((data) => {
        setStates(data);
      });
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchMachineDetails = async (
    stateId?: string,
    districtId?: string,
    blockId?: string,
    fromDate?: string,
    toDate?: string,
  ) => {
    try {
      // setLoading(true);
      const response = await machineApi.getFirmDistanceStats(
        stateId,
        districtId,
        blockId,
        fromDate,
        toDate,
      );
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  const fetchMachineList = async (id: number) => {
    try {
      const resp = await machineApi.getMachineList(id);
      setMachineData(resp.machines);
      setShow(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredFirms = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery) return data.data;

    const query = searchQuery.toLowerCase();
    return data.data.filter(
      (firm) =>
        firm.firm_name?.toLowerCase().includes(query) ||
        firm.authorised_mobile?.includes(query) ||
        firm.authorised_person?.toLowerCase().includes(query),
    );
  }, [data?.data, searchQuery]);

  const totals = useMemo(() => {
    if (!data?.summary) {
      return {
        totalDistance: '0',
        totalDays: 0,
        totalMachines: 0,
        totalLinks: 0,
        avgDistance: '0',
      };
    }
    return {
      totalDistance: data.summary.total_distance || '0',
      totalDays: data.summary.total_days || 0,
      totalMachines: data.summary.total_machines || 0,
      totalLinks: data.summary.total_links || 0,
      avgDistance: data.summary.avg_distance_per_day || '0',
    };
  }, [data?.summary]);

  const columns: TableColumn<any>[] = [
    {
      name: 'Firm Name',
      selector: (row) => row.firm_name,
      sortable: true,
      wrap: true,
      grow: 2,
    },
    {
      name: 'Authorised Mobile Number',
      selector: (row) => row.authorised_mobile,
      sortable: true,
    },
    {
      name: 'Authorised Person',
      selector: (row) => row.authorised_person,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Total Machines',
      selector: (row) => row.total_machines,
      sortable: true,
      width: '130px',
    },
    {
      name: 'Total Links',
      selector: (row) => row.total_links,
      sortable: true,
      width: '110px',
    },
    {
      name: 'Total Distance (m)',
      cell: (row) =>
        row.total_distance_meters
          ? parseFloat(row.total_distance_meters).toFixed(2)
          : '-',
      sortable: true,
      width: '150px',
    },
    {
      name: 'Total Days',
      selector: (row) => row.total_days,
      sortable: true,
      width: '100px',
    },
    {
      name: 'Avg Distance/Day (m)',
      cell: (row) =>
        row.avg_distance_per_day
          ? parseFloat(row.avg_distance_per_day).toFixed(2)
          : '-',
      sortable: true,
      width: '160px',
    },
    {
      name: 'Action',
      cell: (row) => (
        <button
          onClick={() => fetchMachineList(row.firm_id)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      ),
      center: true,
      width: '120px',
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <CogIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Vendor MIS Monitoring System
              </h1>
              <p className="text-sm text-gray-600">
                Real-time monitoring and analytics dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Breadcrumb Navigation */}
            <nav>
              <ol className="flex items-center gap-2">
                <li>
                  <Link className="font-medium" to="/dashboard">
                    Dashboard /
                  </Link>
                </li>
                <li className="font-medium text-primary">Machine Management</li>
              </ol>
            </nav>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-2 px-1 py-6">
        <StatusCard
          title="Total Machines"
          value={totals.totalMachines}
          icon={Factory}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatusCard
          title="Total Firms"
          value={data?.summary?.total_firms || 0}
          icon={Activity}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatusCard
          title="Total Links"
          value={totals.totalLinks}
          icon={TrendingUp}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatusCard
          title="Total Distance"
          value={totals.totalDistance}
          icon={Ruler}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatusCard
          title="Avg Distance"
          value={totals.avgDistance}
          icon={TrendingUp}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
        />
        <StatusCard
          title="Total Days"
          value={totals.totalDays}
          icon={Calendar}
          iconColor="text-teal-600"
          bgColor="bg-teal-50"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Registered Firms
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state.state_id} value={state.state_id}>
                    {state.state_name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedState || loadingDistricts}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px] disabled:opacity-50"
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
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
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
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </div>
            <div className="relative">
              <select
                value={selectedBlock}
                onChange={(e) => handleBlockChange(e.target.value)}
                disabled={!selectedDistrict || loadingBlock}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px] disabled:opacity-50"
              >
                <option value="">All Blocks</option>
                {blocks.map((block) => (
                  <option key={block.block_id} value={block.block_id}>
                    {block.block_name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
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
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </div>
            </div>
            <div className="relative">
              <input
                type="date"
                value={fromdate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="From Date"
              />
            </div>
            <div className="relative">
              <input
                type="date"
                value={todate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="To Date"
              />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search firms..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-[250px]"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
            >
              <span className="text-red-500 font-medium text-sm">✕</span>
              <span>Clear</span>
            </button>
          </div>
        </div>
        {filteredFirms.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No data found
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="p-4">
              <DataTable
                columns={columns}
                data={filteredFirms}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                highlightOnHover
                pointerOnHover
                responsive
                striped
                noHeader
                progressPending={loading}
                progressComponent={
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }
              />
            </div>
          </div>
        )}

        {show && machineData.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Machine Details
                  </h3>
                  <button
                    onClick={() => setShow(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {machineData.map((machine) => (
                    <div
                      key={machine.machine_id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Machine ID</p>
                          <p className="font-semibold">{machine.machine_id}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Registration</p>
                          <p className="font-semibold">
                            {machine.registration_number}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Machine Make</p>
                          <p className="font-semibold">
                            {machine.machine_make}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Serial Number</p>
                          <p className="font-semibold">
                            {machine.serial_number}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Firm</p>
                          <p className="font-semibold">{machine.firm_name}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Capacity</p>
                          <p className="font-semibold">{machine.capacity}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Supervisor</p>
                          <p className="font-semibold">
                            {machine.supervisor_name}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-semibold">
                            {machine.supervisor_phone}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigate(
                              `/machine-management/machine-details/${machine.machine_id}`,
                            )
                          }
                          className="mt-3 px-3 py-1 text-xs bg-green-600 text-white rounded"
                        >
                          Track Machine
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
