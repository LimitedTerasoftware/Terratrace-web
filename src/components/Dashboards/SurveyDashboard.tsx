import React, { useMemo, useState, useEffect } from "react";
import { 
  Download, 
  Calendar, 
  RefreshCw, 
  X, 
  Trophy, 
  AlertTriangle, 
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  CheckCircle,
  Clock,
  Target,
  AlertCircle,
  ClipboardCheck
} from "lucide-react";
import DataTable, { TableColumn } from 'react-data-table-component';

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────
type Risk = "Low" | "Medium" | "High";
type Status = "Excellent" | "Good" | "Needs Attention";

interface APIUser {
  user_id: number;
  username: string;
  email: string;
  version: string;
  company_name: string;
  completed_surveys: string;
  pending_surveys: string;
  rejected_surveys: string;
  total_surveys: number;
  total_kms: string;
}

interface APIStats {
  completed: string;
  in_progress: string;
  not_started: string;
  total: number;
}

interface District {
  district_id: number;
  district_code: string;
  district_name: string;
  state_code: string;
}

interface Surveyor {
  id: number;
  name: string;
  company: string;
  avatar: string;
  version: string;
  pending: number;
  rejected: number;
  completed: number;
  total: number;
  kmDoneKm: number;
}

// ────────────────────────────────────────────────────────────────────────────────
// Styling helpers
// ────────────────────────────────────────────────────────────────────────────────
const RISK_BADGE: Record<Risk, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-red-100 text-red-800",
};

const STATUS_BADGE: Record<Status, string> = {
  Excellent: "bg-green-100 text-green-800",
  Good: "bg-blue-100 text-blue-800",
  "Needs Attention": "bg-red-100 text-red-800",
};

// ────────────────────────────────────────────────────────────────────────────────
// Utils
// ────────────────────────────────────────────────────────────────────────────────
const fmtKm = (km: number) => `${km.toFixed(2)} km`;
const fmtPace = (pace: number) => `${pace.toFixed(1)}/d`;
const fmtPct = (pct: number) => `${pct}%`;

const downloadCSV = (surveyors: Surveyor[]) => {
  if (typeof window === "undefined") return;

  const headers = [
    "Name",
    "Company",
    "Version",
    "Completed",
    "Pending",
    "Rejected",
    "Total Surveys",
    "KmDone",
  ];
  const rows = surveyors.map((s) => [
    s.name,
    s.company,
    s.version,
    s.completed,
    s.pending,
    s.rejected,
    s.total,
    s.kmDoneKm,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `survey-dashboard-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ────────────────────────────────────────────────────────────────────────────────
// Small subcomponents
// ────────────────────────────────────────────────────────────────────────────────
function KPICard({ value, label, accent, icon: Icon }: { value: React.ReactNode; label: string; accent?: string; icon?: React.ComponentType<any> }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        <div className={`text-3xl font-bold ${accent ?? "text-gray-900"}`}>{value}</div>
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function Badge({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${className}`}>{children}</span>;
}

function ProgressBar({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2" aria-label="progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-2 rounded-full ${className}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────────────────────────
export default function SurveyDashboard() {
  const [activeTab, setActiveTab] = useState<"Table" | "Charts" | "Insights">("Table");
  const [loading, setLoading] = useState(true);
  const [surveyors, setSurveyors] = useState<Surveyor[]>([]);
  const [stats, setStats] = useState<APIStats | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);

  // Filters
  const [scope, setScope] = useState<"Surveyors" | "Teams">("Surveyors");
  const [district, setDistrict] = useState<"All" | "North District" | "South District">("All");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>("");
  const [contractor, setContractor] = useState<"All" | string>("All");
  const [assignee, setAssignee] = useState<"All" | string>("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);

  const BASEURL = import.meta.env.VITE_API_BASE || 'https://api.tricadtrack.com';

  // Fetch districts by state code
  const fetchDistricts = async () => {
    try {
      setLoadingDistricts(true);
      const response = await fetch(`${BASEURL}/districtsdata?state_code=6`);
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

  // Load districts on mount
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Fetch data on mount and when dates or pagination changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build URL with date parameters and pagination
        let usersUrl = `https://api.tricadtrack.com/get-users-survey?state_code=6&page=${currentPage}&limit=${perPage}`;
        let statsUrl = 'https://api.tricadtrack.com/get-survey-count?state_code=19';
        
        if (startDate && endDate) {
          usersUrl += `&from_date=${startDate}&to_date=${endDate}`;
          statsUrl += `&from_date=${startDate}&to_date=${endDate}`;
        } else if (startDate) {
          // If only start date is provided, use it for both
          usersUrl += `&from_date=${startDate}&to_date=${startDate}`;
          statsUrl += `&from_date=${startDate}&to_date=${startDate}`;
        } else if (endDate) {
          // If only end date is provided, use it for both
          usersUrl += `&from_date=${endDate}&to_date=${endDate}`;
          statsUrl += `&from_date=${endDate}&to_date=${endDate}`;
        }
        
        // Fetch users survey data
        const usersResponse = await fetch(usersUrl);
        const usersData = await usersResponse.json();
        
        // Fetch stats data
        const statsResponse = await fetch(statsUrl);
        const statsData = await statsResponse.json();
        
        if (usersData.success && usersData.data) {
          const transformedData: Surveyor[] = usersData.data
            .filter((user: APIUser) => user.user_id !== null && user.username !== null)
            .map((user: APIUser) => ({
              id: user.user_id,
              name: user.username?.trim() || 'Unknown',
              company: user.company_name || 'N/A',
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username?.trim() || 'Unknown')}&background=0D8ABC&color=fff`,
              version: user.version || 'N/A',
              pending: parseInt(user.pending_surveys) || 0,
              rejected: parseInt(user.rejected_surveys) || 0,
              completed: parseInt(user.completed_surveys) || 0,
              total: user.total_surveys || 0,
              kmDoneKm: parseFloat(user.total_kms) || 0,
            }));
          setSurveyors(transformedData);
          
          // Set total rows for pagination - prioritize API's total count
          // Check multiple possible locations in API response for total count
          let apiTotalCount = 0;
          
          if (typeof usersData.total === 'number') {
            // If total is directly in response
            apiTotalCount = usersData.total;
          } else if (typeof usersData.totalCount === 'number') {
            // Alternative: totalCount field
            apiTotalCount = usersData.totalCount;
          } else if (typeof usersData.count === 'number') {
            // Alternative: count field
            apiTotalCount = usersData.count;
          } else if (usersData.pagination?.total_users) {
            // Your API format: pagination.total_users
            apiTotalCount = usersData.pagination.total_users;
          } else if (usersData.pagination?.total) {
            // Alternative: pagination.total
            apiTotalCount = usersData.pagination.total;
          } else if (usersData.pagination?.totalRecords) {
            // Alternative: totalRecords in pagination
            apiTotalCount = usersData.pagination.totalRecords;
          } else if (usersData.meta?.total) {
            // Alternative: total in meta object
            apiTotalCount = usersData.meta.total;
          }
          
          // Set the total rows
          if (apiTotalCount > 0) {
            setTotalRows(apiTotalCount);
          } else {
            // Fallback: estimate if API doesn't provide total
            console.warn('API response does not contain total count. Using estimated value.');
            const estimatedTotal = (currentPage - 1) * perPage + transformedData.length;
            setTotalRows(transformedData.length === perPage ? estimatedTotal + 1 : estimatedTotal);
          }
        }
        
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [startDate, endDate, currentPage, perPage]);

  const contractors = useMemo(() => Array.from(new Set(surveyors.map((s) => s.company))), [surveyors]);
  const assignees = useMemo(() => surveyors.map((s) => s.name), [surveyors]);

  const filtered = useMemo(() => {
    let rows = [...surveyors];
    if (contractor !== "All") rows = rows.filter((r) => r.company === contractor);
    if (assignee !== "All") rows = rows.filter((r) => r.name === assignee);
    return rows;
  }, [surveyors, contractor, assignee]);

  const maxKm = useMemo(() => Math.max(1, ...filtered.map((s) => s.kmDoneKm)), [filtered]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, s) => {
        acc.total += s.total;
        acc.completed += s.completed;
        acc.pending += s.pending;
        acc.rejected += s.rejected;
        return acc;
      },
      { total: 0, completed: 0, pending: 0, rejected: 0 }
    );
  }, [filtered]);

  const resetFilters = () => {
    setDistrict("All");
    setSelectedDistrictCode("");
    setContractor("All");
    setAssignee("All");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1); // Reset to first page when filters are reset
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle rows per page change
  const handlePerRowsChange = (newPerPage: number, page: number) => {
    setPerPage(newPerPage);
    setCurrentPage(page);
  };

  // Custom styles for DataTable (matching MachineList)
  const customTableStyles = {
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
    pagination: {
      style: {
        borderTop: '1px solid #E5E7EB',
        minHeight: '56px',
        paddingTop: '8px',
        paddingBottom: '8px',
      },
      pageButtonsStyle: {
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '4px',
        fill: '#4B5563',
        height: '32px',
        width: '32px',
        padding: '4px',
        margin: '0 2px',
        '&:disabled': {
          cursor: 'not-allowed',
          fill: '#D1D5DB',
          opacity: 0.5,
        },
        '&:hover:not(:disabled)': {
          backgroundColor: '#F3F4F6',
          fill: '#1F2937',
        },
        '&:focus': {
          outline: '2px solid #3B82F6',
          outlineOffset: '2px',
        },
      },
    },
  };

  // DataTable columns definition
  const tableColumns: TableColumn<Surveyor>[] = [
    {
      name: "Surveyor",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <img className="h-10 w-10 rounded-full" src={row.avatar} alt={row.name} />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{row.name}</div>
            <div className="text-sm text-gray-500">{row.company}</div>
          </div>
        </div>
      ),
      minWidth: '250px',
    },
    {
      name: "Version",
      selector: (row) => row.version,
      sortable: true,
      cell: (row) => (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          {row.version}
        </span>
      ),
      width: '120px',
    },
    {
      name: "Completed",
      selector: (row) => row.completed,
      sortable: true,
      cell: (row) => <span className="text-sm text-green-600 font-medium">{row.completed}</span>,
      width: '120px',
    },
    {
      name: "Pending",
      selector: (row) => row.pending,
      sortable: true,
      cell: (row) => <span className="text-sm text-orange-600 font-medium">{row.pending}</span>,
      width: '120px',
    },
    {
      name: "Rejected",
      selector: (row) => row.rejected,
      sortable: true,
      cell: (row) => <span className="text-sm text-red-600 font-medium">{row.rejected}</span>,
      width: '120px',
    },
    {
      name: "Total Surveys",
      selector: (row) => row.total,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-900">{row.total}</span>,
      width: '140px',
    },
    {
      name: "KM Done",
      selector: (row) => row.kmDoneKm,
      sortable: true,
      cell: (row) => <span className="text-sm text-gray-900">{fmtKm(row.kmDoneKm)}</span>,
      width: '120px',
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:text-blue-800">Reassign</button>
          <button className="text-blue-600 hover:text-blue-800">Split</button>
          <button className="text-gray-400 hover:text-gray-600" aria-label="More actions">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '200px',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header & Actions */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">Survey Dashboard</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="text-sm text-gray-500"><span>Performance Tracking</span></div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadCSV(filtered)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                aria-label="Export CSV"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                aria-label="Schedule Email"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {/* District Filter with API */}
                <div className="relative">
                  <select
                    value={selectedDistrictCode}
                    onChange={(e) => setSelectedDistrictCode(e.target.value)}
                    disabled={loadingDistricts}
                    className="px-3 py-2 pr-8 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px] appearance-none disabled:opacity-50"
                  >
                    <option value="">All Districts</option>
                    {districts.map((district) => (
                      <option key={district.district_id} value={district.district_code}>
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

                <select
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px]"
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                >
                  <option value="All">All Companies</option>
                  {contractors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px]"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                >
                  <option value="All">All Assignees</option>
                  {assignees.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 w-40 cursor-pointer"
                      aria-label="Start date"
                      placeholder="Start Date"
                    />
                  </div>
                  <span className="text-gray-500 text-sm">to</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 w-40 cursor-pointer"
                      aria-label="End date"
                      placeholder="End Date"
                    />
                  </div>
                </div>

                <button 
                  onClick={resetFilters}
                  className="relative group px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50" 
                  aria-label="Reset filters"
                >
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Reset Filters
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards + Performance Info */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5">
            <KPICard value={stats?.total || 0} label="Total Surveys" icon={Target} />
            <KPICard value={(parseInt(stats?.completed || '0') + parseInt(stats?.in_progress || '0'))} label="Assigned" icon={Target} />
            <KPICard value={<span className="text-green-600">{stats?.completed || 0}</span>} label="Completed" icon={CheckCircle} />
            <KPICard value={<span className="text-orange-600">{stats?.in_progress || 0}</span>} label="Total In Progress" icon={Clock} />
            <KPICard value={<span className="text-gray-600">{stats?.not_started || 0}</span>} label="Not Started" icon={AlertCircle} />
          </div>

          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Top Performer:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {[...filtered].sort((a, b) => b.completed - a.completed)[0]?.name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Surveyor Performance</h2>
                <div className="flex bg-gray-100 rounded-lg p-1" role="tablist" aria-label="Data views">
                  <button
                    className={`px-4 py-1 text-sm rounded ${activeTab === "Table" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
                    role="tab"
                    aria-selected={activeTab === "Table"}
                    onClick={() => setActiveTab("Table")}
                  >
                    Table
                  </button>
                  <button
                    className={`px-4 py-1 text-sm rounded ${activeTab === "Charts" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
                    role="tab"
                    aria-selected={activeTab === "Charts"}
                    onClick={() => setActiveTab("Charts")}
                  >
                    Charts
                  </button>
                  <button
                    className={`px-4 py-1 text-sm rounded ${activeTab === "Insights" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
                    role="tab"
                    aria-selected={activeTab === "Insights"}
                    onClick={() => setActiveTab("Insights")}
                  >
                    Insights
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {activeTab === "Table" && (
                <div className="overflow-x-auto">
                  <DataTable
                    columns={tableColumns}
                    data={filtered}
                    pagination
                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationDefaultPage={currentPage}
                    onChangePage={handlePageChange}
                    onChangeRowsPerPage={handlePerRowsChange}
                    paginationPerPage={perPage}
                    paginationRowsPerPageOptions={[10, 25, 50, 100]}
                    highlightOnHover
                    pointerOnHover
                    striped={false}
                    dense={false}
                    responsive
                    customStyles={customTableStyles}
                    noHeader
                    defaultSortFieldId={1}
                    progressPending={loading}
                    progressComponent={
                      <div className="py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    }
                  />
                </div>
              )}

              {activeTab === "Charts" && (
                <div className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Completion Status Chart */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">Survey Completion Status</h4>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {filtered.map((s) => {
                          const completionPct = s.total > 0 ? (s.completed / s.total) * 100 : 0;
                          return (
                            <div key={s.id}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700 truncate mr-2" title={s.name}>{s.name}</span>
                                <span className="text-gray-500 whitespace-nowrap">{s.completed}/{s.total}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-green-500 transition-all"
                                  style={{ width: `${completionPct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* KM Performance Chart */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">KM Performance</h4>
                      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                        {filtered
                          .sort((a, b) => b.kmDoneKm - a.kmDoneKm)
                          .map((s) => {
                            const widthPct = (s.kmDoneKm / maxKm) * 100;
                            const showLabel = widthPct > 15;
                            return (
                              <div key={s.id} className="flex items-center gap-3">
                                <div className="w-40 text-sm font-medium text-gray-700 truncate flex-shrink-0" title={s.name}>
                                  {s.name}
                                </div>
                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                    <div
                                      className="h-6 rounded-full bg-blue-500 transition-all relative"
                                      style={{ width: `${Math.max(2, widthPct)}%` }}
                                    >
                                      {showLabel && s.kmDoneKm > 0 && (
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-medium whitespace-nowrap">
                                          {fmtKm(s.kmDoneKm)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {!showLabel && s.kmDoneKm > 0 && (
                                    <span className="text-xs font-medium text-gray-700 whitespace-nowrap min-w-[70px]">
                                      {fmtKm(s.kmDoneKm)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Insights" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Top Performers */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      Top Performers (By Completed Surveys)
                    </h4>
                    <div className="space-y-3">
                      {[...filtered]
                        .sort((a, b) => b.completed - a.completed)
                        .slice(0, 3)
                        .map((s, index) => (
                          <div key={s.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                              }`}>
                                {index + 1}
                              </div>
                              <img className="h-8 w-8 rounded-full" src={s.avatar} alt={s.name} />
                              <div className="text-sm font-medium text-gray-900">{s.name}</div>
                            </div>
                            <span className="text-sm font-medium text-green-600">{s.completed} surveys</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* At Risk Surveyors */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      High Rejection Rate
                    </h4>
                    <div className="space-y-3">
                      {[...filtered]
                        .sort((a, b) => b.rejected - a.rejected)
                        .slice(0, 3)
                        .map((s) => (
                          <div key={s.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img className="h-8 w-8 rounded-full" src={s.avatar} alt={s.name} />
                              <div className="text-sm font-medium text-gray-900">{s.name}</div>
                            </div>
                            <span className="text-sm font-medium text-red-600">{s.rejected} rejected</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}