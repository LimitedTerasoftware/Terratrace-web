import { useEffect, useState } from 'react';
import { StateData, District, Block } from '../../../types/survey';
import {
  ClipboardCheck,
  ListOrdered,
  Search,
  Loader2,
  Eye,
  Percent,
} from 'lucide-react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  getBlockData,
  getDistrictData,
  getStateData,
  getATBlocksList,
  getATBlockRouterList,
} from '../../Services/api';
import DataTable, { TableColumn } from 'react-data-table-component';
import SearchableSelect from '../../Forms/SearchableSelect';

interface StatsData {
  total: number;
  completed: number;
  avgCompletion: number;
  byState: Record<string, number>;
}

type FormTab = 'rack' | 'router';

interface CommonBlockItem {
  block_id: number;
  block_name: string;
  state_name: string;
  district_name: string;
  completion_percentage: string;
  filled_tests: number;
  total_tests: number;
  created_at: string;
  updated_at: string;
}

function ATChecklistList() {
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
  const [activeTab, setActiveTab] = useState<FormTab>('rack');
  const [checklistData, setChecklistData] = useState<CommonBlockItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    completed: 0,
    avgCompletion: 0,
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
              <ClipboardCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                AT Checklist Data
              </h1>
              <p className="text-sm text-gray-600">
                View AT (Acceptance Test) Block Router / Rack submissions
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
              <li className="font-medium text-primary">AT Checklist Data</li>
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
                  <div className="text-sm text-gray-600">Total Records</div>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.completed}
                  </div>
                  <div className="text-sm text-gray-600">Fully Completed</div>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <ClipboardCheck className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.avgCompletion}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Avg. Completion
                  </div>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Percent className="w-5 h-5 text-yellow-600" />
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

      const filters = {
        state_id: selectedStateId || undefined,
        district_id: selectedDistrictId || undefined,
        block_id: selectedBlockId || undefined,
        from_date: fromdate || undefined,
        to_date: todate || undefined,
        search: globalsearch || undefined,
        page: currentPage,
        per_page: rowsPerPage,
      };

      const response =
        activeTab === 'rack'
          ? await getATBlocksList(filters)
          : await getATBlockRouterList(filters);

      if (response.status && response.blocks) {
        setChecklistData(response.blocks || []);

        const newStats: StatsData = {
          total: response.pagination.total || 0,
          completed: response.blocks.filter(
            (item) => Number(item.completion_percentage) >= 100,
          ).length,
          avgCompletion:
            response.blocks.length > 0
              ? Math.round(
                  response.blocks.reduce(
                    (sum, item) => sum + Number(item.completion_percentage || 0),
                    0,
                  ) / response.blocks.length,
                )
              : 0,
          byState: {},
        };
        setRowsPerPage(response.pagination.limit);
        setCurrentPage(response.pagination.page);

        response.blocks.forEach((item) => {
          if (item.state_name) {
            newStats.byState[item.state_name] =
              (newStats.byState[item.state_name] || 0) + 1;
          }
        });

        setStats(newStats);
      } else {
        setChecklistData([]);
        setStats({ total: 0, completed: 0, avgCompletion: 0, byState: {} });
      }
    } catch (error) {
      console.error('Error fetching AT checklist data:', error);
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
    setSelectedStateId(state_id);
    setSelectedDistrictId(district_id);
    setSelectedBlockId(block_id);
    setGlobalSearch(search);
    setFromDate(from_date);
    setToDate(to_date);
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (filtersReady) {
      fetchChecklistData();
    }
  }, [
    filtersReady,
    activeTab,
    selectedStateId,
    selectedDistrictId,
    selectedBlockId,
    globalsearch,
    fromdate,
    todate,
    currentPage,
    rowsPerPage,
  ]);

  const handleTabChange = (tab: FormTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleFilterChange = (
    stateId: string | null,
    districtId: string | null,
    blockId: string | null,
    from_date: string | null,
    to_date: string | null,
    search: string | null,
  ) => {
    const params: Record<string, string> = {};
    if (stateId) params.state_id = stateId;
    if (districtId) params.district_id = districtId;
    if (blockId) params.block_id = blockId;
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
    setSearchParams({});
  };

  const handleStateChange = (value: string | null) => {
    setSelectedStateId(value);
    setSelectedDistrictId(null);
    setSelectedBlockId(null);
    handleFilterChange(value, null, null, fromdate, todate, globalsearch);
  };

  const handleDistrictChange = (value: string | null) => {
    setSelectedDistrictId(value);
    setSelectedBlockId(null);
    handleFilterChange(
      selectedStateId,
      value,
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
      fromdate,
      todate,
      value,
    );
  };

  const columns: TableColumn<CommonBlockItem>[] = [
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
      name: 'Completion',
      selector: (row) => row.completion_percentage,
      sortable: true,
      cell: (row) => {
        const pct = Math.min(100, Math.round(Number(row.completion_percentage || 0)));
        return (
          <div className="w-full py-1">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>
                {row.filled_tests}/{row.total_tests}
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden w-28">
              <div
                className={`h-full rounded-full ${
                  pct >= 100
                    ? 'bg-green-500'
                    : pct > 0
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
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
      cell: (row) => {
        const viewPath =
          activeTab === 'rack'
            ? `/at-checklist-data/view/${row.block_id}`
            : `/at-checklist-data/router/view/${row.block_id}`;
        return (
          <Link
            to={`${viewPath}?block_name=${encodeURIComponent(row.block_name)}&state_name=${encodeURIComponent(row.state_name)}&district_name=${encodeURIComponent(row.district_name)}`}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
        );
      },
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

      <div className="bg-white border-b border-gray-200 px-7">
        <div className="flex gap-1">
          <button
            onClick={() => handleTabChange('rack')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rack'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Block Rack
          </button>
          <button
            onClick={() => handleTabChange('router')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'router'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Block Router
          </button>
        </div>
      </div>

      <StatsPanel />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <SearchableSelect
                value={selectedStateId || ''}
                onChange={(value) => handleStateChange(value || null)}
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
                value={selectedDistrictId || ''}
                onChange={(value) => handleDistrictChange(value || null)}
                disabled={!selectedStateId || loadingDistricts}
                options={districts.map((district) => ({
                  value: String(district.district_id),
                  label: district.district_name,
                }))}
                placeholder="All Districts"
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <SearchableSelect
                value={selectedBlockId || ''}
                onChange={(value) => handleBlockChange(value || null)}
                disabled={!selectedDistrictId || loadingBlock}
                options={blocks.map((block) => ({
                  value: String(block.block_id),
                  label: block.block_name,
                }))}
                placeholder="All Blocks"
              />
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
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            }
            noDataComponent={
              <div className="p-6 text-center text-gray-500">
                No AT {activeTab === 'rack' ? 'Block Rack' : 'Block Router'}{' '}
                checklist data found
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

export default ATChecklistList;
