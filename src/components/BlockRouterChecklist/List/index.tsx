import { useEffect, useState } from 'react';
import { StateData, District, Block } from '../../../types/survey';
import {
  CheckSquare,
  ListOrdered,
  Search,
  ChevronDown,
  Loader2,
  Eye,
  Wifi,
} from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  getBlockData,
  getDistrictData,
  getStateData,
  getBlocksChecklist,
} from '../../Services/api';
import DataTable, { TableColumn } from 'react-data-table-component';
import { BlockChecklistData } from '../../../types/block-router-checklist';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const ImgbaseUrl = import.meta.env.VITE_Image_URL;

interface StatsData {
  total: number;
  active: number;
  inactive: number;
  byState: Record<string, number>;
}
type StatusOption = {
  value: number;
  label: string;
};
function BlockChecklistList() {
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    null,
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingBlock, setLoadingBlock] = useState<boolean>(false);
  const [globalsearch, setGlobalSearch] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersReady, setFiltersReady] = useState(false);
  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [excel, setExcel] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [checklistData, setChecklistData] = useState<BlockChecklistData[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    active: 0,
    inactive: 0,
    byState: {},
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const Header = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <CheckSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Block Checklist List
              </h1>
              <p className="text-sm text-gray-600">
                View and manage Block Checklist submissions
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
              <li className="font-medium text-primary">Block Checklist List</li>
            </ol>
          </nav>
        </div>
      </header>
    );
  };

  const StatsPanel = () => {
    if (loadingData) {
      return (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="px-1 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-8 bg-gray-200 rounded mb-2 w-12"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-1 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Checklists</div>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.active}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.inactive}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Loader2 className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Object.keys(stats.byState).length}
                  </div>
                  <div className="text-sm text-gray-600">States Covered</div>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <ListOrdered className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
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

  const fetchDistricts = async (stateCode: string) => {
    setLoadingDistricts(true);
    try {
      const data = await getDistrictData(stateCode);
      setDistricts(data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchBlock = async () => {
    try {
      if (!selectedDistrictId) return;
      setLoadingBlock(true);
      const data = await getBlockData(selectedDistrictId);
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlock(false);
    }
  };

  const fetchChecklistData = async () => {
    try {
      setLoadingData(true);

      const response = await getBlocksChecklist({
        state_id: selectedStateId || undefined,
        district_id: selectedDistrictId || undefined,
        block_id: selectedBlockId || undefined,
        from_date: fromdate || undefined,
        to_date: todate || undefined,
        search: globalsearch || undefined,
        status: selectedStatus || undefined,
        page: currentPage,
        per_page: rowsPerPage,
      });

      if (response.status && response.blocks) {
        setChecklistData(response?.blocks || []);

        const newStats: StatsData = {
          total: response.pagination.total || 0,
          active: response.blocks.filter(
            (item: BlockChecklistData) => item.is_active === 1,
          ).length,
          inactive: response.blocks.filter(
            (item: BlockChecklistData) => item.is_active === 0,
          ).length,
          byState: {},
        };
        setRowsPerPage(response.pagination.limit);
        setCurrentPage(response.pagination.page);

        response.blocks.forEach((item: BlockChecklistData) => {
          if (item.state_id) {
            newStats.byState[item.state_id.toString()] =
              (newStats.byState[item.state_id.toString()] || 0) + 1;
          }
        });

        setStats(newStats);
      } else {
        setChecklistData([]);
        setStats({ total: 0, active: 0, inactive: 0, byState: {} });
      }
    } catch (error) {
      console.error('Error fetching checklist data:', error);
      setChecklistData([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedStateId) {
      fetchDistricts(selectedStateId);
    } else {
      setDistricts([]);
    }
  }, [selectedStateId]);

  useEffect(() => {
    fetchBlock();
  }, [selectedDistrictId]);

  useEffect(() => {
    const state_id = searchParams.get('state_id') || null;
    const district_id = searchParams.get('district_id') || null;
    const block_id = searchParams.get('block_id') || null;
    const search = searchParams.get('search') || '';
    const from_date = searchParams.get('from_date') || '';
    const to_date = searchParams.get('to_date') || '';
    const status = searchParams.get('status') || '';
    setSelectedStateId(state_id);
    setSelectedDistrictId(district_id);
    setSelectedBlockId(block_id);
    setGlobalSearch(search);
    setFromDate(from_date);
    setToDate(to_date);
    setSelectedStatus(status ? parseInt(status) : null);
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (filtersReady) {
      fetchChecklistData();
    }
  }, [
    filtersReady,
    selectedStateId,
    selectedDistrictId,
    selectedBlockId,
    globalsearch,
    fromdate,
    todate,
    selectedStatus,
    currentPage,
    rowsPerPage,
  ]);

  const handleFilterChange = (
    stateId: string | null,
    districtId: string | null,
    blockId: string | null,
    status: number | null,
    from_date: string | null,
    to_date: string | null,
    search: string | null,
  ) => {
    const params: Record<string, string> = {};
    if (stateId) params.state_id = stateId;
    if (districtId) params.district_id = districtId;
    if (blockId) params.block_id = blockId;
    if (status !== null) params.status = status.toString();
    if (from_date) params.from_date = from_date;
    if (to_date) params.to_date = to_date;
    if (search) params.search = search;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSelectedStateId(null);
    setSelectedDistrictId(null);
    setSelectedBlockId(null);
    setGlobalSearch('');
    setFromDate('');
    setToDate('');
    setSelectedStatus(null);
    setSearchParams({});
  };

  const handleStateChange = (value: string | null) => {
    setSelectedStateId(value);
    setSelectedDistrictId(null);
    setSelectedBlockId(null);
    handleFilterChange(value, null, null, null, fromdate, todate, globalsearch);
  };

  const handleDistrictChange = (value: string | null) => {
    setSelectedDistrictId(value);
    setSelectedBlockId(null);
    handleFilterChange(
      selectedStateId,
      value,
      null,
      null,
      fromdate,
      todate,
      globalsearch,
    );
  };

  const handleBlockChange = (value: string | null) => {
    setSelectedBlockId(value);
    handleFilterChange(
      selectedStateId,
      selectedDistrictId,
      value,
      null,
      fromdate,
      todate,
      globalsearch,
    );
  };
  const handleStatusChange = (value: string) => {
    const statusValue = value === 'null' ? null : Number(value);
    setSelectedStatus(statusValue);
    handleFilterChange(
      selectedStateId,
      selectedDistrictId,
      selectedBlockId,
      statusValue,
      fromdate,
      todate,
      globalsearch,
    );
  };
  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    handleFilterChange(
      selectedStateId,
      selectedDistrictId,
      selectedBlockId,
      selectedStatus,
      value,
      todate,
      globalsearch,
    );
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    handleFilterChange(
      selectedStateId,
      selectedDistrictId,
      selectedBlockId,
      selectedStatus,
      fromdate,
      value,
      globalsearch,
    );
  };

  const handleSearchChange = (value: string) => {
    setGlobalSearch(value);
    handleFilterChange(
      selectedStateId,
      selectedDistrictId,
      selectedBlockId,
      selectedStatus,
      fromdate,
      todate,
      value,
    );
  };

  const columns: TableColumn<BlockChecklistData>[] = [
    {
      name: 'Sl.No',
      selector: (_row, index = 0) =>
        (currentPage - 1) * rowsPerPage + index + 1,
      width: '70px',
    },
    {
      name: 'Block Name',
      selector: (row) => row.block_name,
      cell: (row) => (
        <span className="text-sm font-medium text-gray-900">
          {row.block_name}
        </span>
      ),
    },
    {
      name: 'State',
      selector: (row) => row.state_name,
      cell: (row) => (
        <span className="text-sm text-gray-600">{row.state_name}</span>
      ),
    },
    {
      name: 'District',
      selector: (row) => row.district_name,
      cell: (row) => (
        <span className="text-sm text-gray-600">{row.district_name}</span>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.is_active,
      sortable: true,
      cell: (row) => {
        const status = row.is_active as 0 | 1 | 2;
        const statusConfig = {
          0: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
          1: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
          2: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
        };
        const config = statusConfig[status] || {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800',
        };

        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      name: 'Created At',
      selector: (row) => row.created_at,
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      name: 'Updated At',
      selector: (row) => row.updated_at,
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.updated_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: (row) => (
        <Link
          to={`/installation-block-checklist/view/${row.block_id}/?state_id=${row.state_name}&district_id=${row.district_name}&block_id=${row.block_name}`}
          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </Link>
      ),
      ignoreRowClick: true,
      width: '80px',
    },
  
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number, newPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(newPage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <StatsPanel />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedStateId || ''}
                onChange={(e) => handleStateChange(e.target.value || null)}
                disabled={loadingStates}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none disabled:opacity-50"
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
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedDistrictId || ''}
                onChange={(e) => handleDistrictChange(e.target.value || null)}
                disabled={!selectedStateId || loadingDistricts}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none disabled:opacity-50"
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
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedBlockId || ''}
                onChange={(e) => handleBlockChange(e.target.value || null)}
                disabled={!selectedDistrictId || loadingBlock}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none disabled:opacity-50"
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
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>
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

            <button
              onClick={clearFilters}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
            >
              <span className="text-red-500 font-medium text-sm">✕</span>
              <span>Clear Filters</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search blocks..."
                value={globalsearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none"
              />
            </div>

            <div className="flex items-center text-sm text-gray-500 ml-auto">
              <span>Total Records: {stats.total}</span>
            </div>
          </div>
        </div>

        <div className="p-4">
          <DataTable
            columns={columns}
            data={checklistData}
            pagination
            paginationServer
            paginationTotalRows={stats.total}
            paginationPerPage={rowsPerPage}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handleRowsPerPageChange}
            highlightOnHover
            pointerOnHover
            progressPending={loadingData}
            progressComponent={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }
            noDataComponent={
              <div className="p-6 text-center text-gray-500">
                No checklist data found
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

export default BlockChecklistList;
