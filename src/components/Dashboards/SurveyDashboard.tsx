import React, { useMemo, useState } from "react";
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
  AlertCircle
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────
type Risk = "Low" | "Medium" | "High";
type Status = "Excellent" | "Good" | "Needs Attention";
interface Surveyor {
  id: number;
  name: string;
  company: string;
  avatar: string;
  assigned: number;
  inProgress: number;
  completed: number;
  kmDoneKm: number; // numeric kilometers
  pacePerDay: number; // numeric km/day
  paceUp: boolean;
  qcPassPct: number; // 0-100
  risk: Risk;
  status: Status;
}

// ────────────────────────────────────────────────────────────────────────────────
// Mock Data (normalized to numbers for computation)
// ────────────────────────────────────────────────────────────────────────────────
const mockSurveyors: Surveyor[] = [
  {
    id: 1,
    name: "Kanha Patel",
    company: "WEST BENGAL",
    avatar: "https://ui-avatars.com/api/?name=Kanha+Patel&background=0D8ABC&color=fff",
    assigned: 5,
    inProgress: 0, // 0 pending
    completed: 5,  // 5 accepted
    kmDoneKm: 60,  // completed * 12
    pacePerDay: 8.5, // 6 + 5*0.5
    paceUp: true, // ratio = 1
    qcPassPct: 96,
    risk: "Low",
    status: "Excellent",
  },
  {
    id: 2,
    name: "Uttam Abhishek Biharilal",
    company: "HIMACHAL PRADESH",
    avatar: "https://ui-avatars.com/api/?name=Uttam+Abhishek+Biharilal&background=0D8ABC&color=fff",
    assigned: 2,
    inProgress: 1, // pending
    completed: 1,  // accepted
    kmDoneKm: 12,
    pacePerDay: 6.5, // 6 + 1*0.5
    paceUp: true, // ratio = 0.5
    qcPassPct: 90,
    risk: "Medium",
    status: "Good",
  },
  {
    id: 3,
    name: "Sunil Kumar",
    company: "HIMACHAL PRADESH",
    avatar: "https://ui-avatars.com/api/?name=Sunil+Kumar&background=0D8ABC&color=fff",
    assigned: 1,
    inProgress: 1,
    completed: 0,
    kmDoneKm: 0,
    pacePerDay: 3.5,
    paceUp: false,
    qcPassPct: 85,
    risk: "High",
    status: "Needs Attention",
  },
  {
    id: 4,
    name: "Mani Dhiman",
    company: "HIMACHAL PRADESH",
    avatar: "https://ui-avatars.com/api/?name=Mani+Dhiman&background=0D8ABC&color=fff",
    assigned: 1,
    inProgress: 1,
    completed: 0,
    kmDoneKm: 0,
    pacePerDay: 3.5,
    paceUp: false,
    qcPassPct: 85,
    risk: "High",
    status: "Needs Attention",
  },
  {
    id: 5,
    name: "Sukhraj",
    company: "HIMACHAL PRADESH",
    avatar: "https://ui-avatars.com/api/?name=Sukhraj&background=0D8ABC&color=fff",
    assigned: 1,
    inProgress: 1,
    completed: 0,
    kmDoneKm: 0,
    pacePerDay: 3.5,
    paceUp: false,
    qcPassPct: 85,
    risk: "High",
    status: "Needs Attention",
  },
  {
    id: 6,
    name: "Krishan Pal",
    company: "HIMACHAL PRADESH",
    avatar: "https://ui-avatars.com/api/?name=Krishan+Pal&background=0D8ABC&color=fff",
    assigned: 2,
    inProgress: 2,
    completed: 0,
    kmDoneKm: 0,
    pacePerDay: 3.5,
    paceUp: false,
    qcPassPct: 85,
    risk: "High",
    status: "Needs Attention",
  },
  {
    id: 7,
    name: "Rajneesh Chouhan",
    company: "HIMACHAL PRADESH",
    avatar: "https://ui-avatars.com/api/?name=Rajneesh+Chouhan&background=0D8ABC&color=fff",
    assigned: 1,
    inProgress: 1,
    completed: 0,
    kmDoneKm: 0,
    pacePerDay: 3.5,
    paceUp: false,
    qcPassPct: 85,
    risk: "High",
    status: "Needs Attention",
  },
  {
    id: 8,
    name: "Sonal Pattnaik",
    company: "WEST BENGAL",
    avatar: "https://ui-avatars.com/api/?name=Sonal+Pattnaik&background=0D8ABC&color=fff",
    assigned: 2,
    inProgress: 0,
    completed: 2,
    kmDoneKm: 24,
    pacePerDay: 7.0, // 6 + 2*0.5
    paceUp: true,
    qcPassPct: 96,
    risk: "Low",
    status: "Excellent",
  },
];


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
const fmtKm = (km: number) => `${km} km`;
const fmtPace = (pace: number) => `${pace.toFixed(1)}/d`;
const fmtPct = (pct: number) => `${pct}%`;

const downloadCSV = (surveyors: Surveyor[]) => {
  if (typeof window === "undefined") return; // SSR guard

  const headers = [
    "Name",
    "Company",
    "Assigned",
    "InProgress",
    "Completed",
    "KmDone",
    "PacePerDay",
    "QCPass",
    "Risk",
    "Status",
  ];
  const rows = surveyors.map((s) => [
    s.name,
    s.company,
    s.assigned,
    s.inProgress,
    s.completed,
    s.kmDoneKm,
    s.pacePerDay,
    s.qcPassPct,
    s.risk,
    s.status,
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

  // Filters
  const [scope, setScope] = useState<"Surveyors" | "Teams">("Surveyors");
  const [district, setDistrict] = useState<"All" | "North District" | "South District">("All"); // demo only
  const [contractor, setContractor] = useState<"All" | "ABC Surveys Ltd" | "XYZ Mapping Co">("All");
  const [assignee, setAssignee] = useState<"All" | "Ramesh Kumar" | "Anita Sharma" | "Vikash Singh">("All");
  const [dateStr, setDateStr] = useState("");

  const contractors = useMemo(() => Array.from(new Set(mockSurveyors.map((s) => s.company))), []);
  const assignees = useMemo(() => mockSurveyors.map((s) => s.name), []);

  const filtered = useMemo(() => {
    let rows = [...mockSurveyors];
    if (contractor !== "All") rows = rows.filter((r) => r.company === contractor);
    if (assignee !== "All") rows = rows.filter((r) => r.name === assignee);
    // district is a demo filter: add a field to data to make it functional in real usage
    return rows;
  }, [contractor, assignee]);

  const maxKm = useMemo(() => Math.max(1, ...filtered.map((s) => s.kmDoneKm)), [filtered]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, s) => {
        acc.assigned += s.assigned;
        acc.completed += s.completed;
        acc.verified += Math.round(s.completed * 0.83);
        acc.rectifications += s.qcPassPct < 90 ? 1 : 0;
        return acc;
      },
      { assigned: 0, completed: 0, verified: 0, rectifications: 0 }
    );
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header & Actions */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-900">Survey Dashboard</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 bg-gray-300 rounded" />
                <span>Performance Tracking</span>
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <select
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px]"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value as any)}
                >
                  <option value="All">All Districts</option>
                  <option>North District</option>
                  <option>South District</option>
                </select>

                <select
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px]"
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value as any)}
                >
                  <option value="All">All Contractors</option>
                  {contractors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <select
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px]"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value as any)}
                >
                  <option value="All">All Assignees</option>
                  {assignees.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div role="tablist" aria-label="View scope" className="flex bg-gray-100 rounded-md p-0.5">
                  <button
                    role="tab"
                    aria-selected={scope === "Surveyors"}
                    className={`px-4 py-1.5 text-sm rounded ${scope === "Surveyors" ? "text-blue-600 bg-white shadow-sm font-medium" : "text-gray-600 font-medium"}`}
                    onClick={() => setScope("Surveyors")}
                  >
                    <Users className="w-4 h-4 inline mr-1" />
                    Surveyors
                  </button>
                  <button
                    role="tab"
                    aria-selected={scope === "Teams"}
                    className={`px-4 py-1.5 text-sm rounded ${scope === "Teams" ? "text-blue-600 bg-white shadow-sm font-medium" : "text-gray-600 font-medium"}`}
                    onClick={() => setScope("Teams")}
                  >
                    Teams
                  </button>
                </div>

                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 w-40"
                  aria-label="Select date"
                />

                <button className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50" aria-label="Refresh">
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Active Filter Chips */}
            <div className="flex items-center gap-2">
              {district !== "All" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                  {district}
                  <button
                    onClick={() => setDistrict("All")}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                    aria-label="Clear district filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {dateStr && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">
                  {new Date(dateStr).toLocaleDateString()}
                  <button
                    onClick={() => setDateStr("")}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                    aria-label="Clear date filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards + Performance Info */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
            <KPICard value={totals.assigned} label="Assigned" icon={Target} />
            <KPICard value={<span className="text-blue-600">{totals.completed}</span>} label="Completed" icon={CheckCircle} />
            <KPICard value={<span className="text-green-600">{totals.verified}</span>} label="Verified" icon={CheckCircle} />
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <div className="text-3xl font-bold text-red-600">{totals.rectifications}</div>
              </div>
              <div className="text-sm text-gray-600">Rectifications</div>
            </div>
            <KPICard value={<span className="text-purple-600">6.5</span>} label="Avg Pace (km/day)" icon={Activity} />
            <KPICard value={<span className="text-green-600">92%</span>} label="QC Pass" />
            <KPICard value={<span className="text-orange-600">88%</span>} label="SLA Compliance" />
          </div>

          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Top Performer:</span>
                  <span className="text-sm font-medium text-blue-600">Ramesh Kumar</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">At Risk:</span>
                <span className="text-sm font-medium text-red-600">{filtered.filter((s) => s.risk !== "Low").length} surveyors</span>
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
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surveyor</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KM Done</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pace</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QC %</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filtered.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img className="h-10 w-10 rounded-full" src={s.avatar} alt={s.name} />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{s.name}</div>
                                <div className="text-sm text-gray-500">{s.company}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.assigned}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.inProgress}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.completed}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtKm(s.kmDoneKm)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-900">{fmtPace(s.pacePerDay)}</span>
                              {s.paceUp ? (
                                <TrendingUp className="w-3 h-3 text-green-600" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-red-600" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{fmtPct(s.qcPassPct)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={RISK_BADGE[s.risk]}>{s.risk}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={STATUS_BADGE[s.status]}>{s.status}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <button className="text-blue-600 hover:text-blue-800">Reassign</button>
                              <button className="text-blue-600 hover:text-blue-800">Split</button>
                              <button className="text-gray-400 hover:text-gray-600" aria-label="More actions">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "Charts" && (
                <div className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Completion Status Chart */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">Task Completion Status</h4>
                      <div className="space-y-3">
                        {filtered.map((s) => (
                          <div key={s.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-gray-700">{s.name}</span>
                              <span className="text-gray-500">{s.completed}/{s.assigned}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-green-500"
                                style={{ width: `${(s.completed / Math.max(1, s.assigned)) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* KM Performance Chart */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">KM Performance</h4>
                      <div className="space-y-4">
                        {filtered.map((s) => (
                          <div key={s.id} className="flex items-center gap-3">
                            <div className="w-20 text-sm font-medium text-gray-700">{s.name.split(" ")[0]}</div>
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-4">
                                <div
                                  className="h-4 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium bg-blue-500"
                                  style={{ width: `${(s.kmDoneKm / maxKm) * 100}%` }}
                                >
                                  {fmtKm(s.kmDoneKm)}
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600 w-12">{fmtPace(s.pacePerDay)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* QC Performance Chart */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">Quality Control Performance</h4>
                      <div className="space-y-3">
                        {filtered.map((s) => (
                          <div key={s.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img className="h-6 w-6 rounded-full" src={s.avatar} alt={s.name} />
                              <span className="text-sm font-medium text-gray-900">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ProgressBar
                                pct={s.qcPassPct}
                                className={s.qcPassPct >= 95 ? "bg-green-500" : s.qcPassPct >= 90 ? "bg-yellow-500" : "bg-red-500"}
                              />
                              <span className="text-sm font-medium text-gray-900 w-8">{fmtPct(s.qcPassPct)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Risk Status Overview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-base font-semibold text-gray-900 mb-3">Risk Status Overview</h4>
                      <div className="space-y-3">
                        {filtered.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                            <div className="flex items-center gap-2">
                              <img className="h-8 w-8 rounded-full" src={s.avatar} alt={s.name} />
                              <div>
                                <div className="text-sm font-medium text-gray-900">{s.name}</div>
                                <div className="text-xs text-gray-500">{s.company}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={RISK_BADGE[s.risk]}>{s.risk}</Badge>
                              <Badge className={STATUS_BADGE[s.status]}>{s.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Insights" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    {/* Top Performers */}
                    <div className="md:pr-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        Top Performers
                      </h4>
                      <div className="space-y-2">
                        {[...filtered]
                          .sort((a, b) => b.kmDoneKm - a.kmDoneKm)
                          .slice(0, 3)
                          .map((s, index) => (
                            <div key={s.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                                }`}>
                                  {index + 1}
                                </div>
                                <img className="h-6 w-6 rounded-full" src={s.avatar} alt={s.name} />
                                <div className="text-xs font-medium text-gray-900">{s.name}</div>
                              </div>
                              <span className="text-xs font-medium text-green-600">{fmtKm(s.kmDoneKm)}</span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* SLA Compliance */}
                    <div className="md:px-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        SLA Compliance
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Overall</span>
                          <span className="text-xs font-medium">88%</span>
                        </div>
                        <ProgressBar pct={88} className="bg-orange-500" />

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">On Time</span>
                          <span className="text-xs font-medium">92%</span>
                        </div>
                        <ProgressBar pct={92} className="bg-green-500" />

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Quality</span>
                          <span className="text-xs font-medium">85%</span>
                        </div>
                        <ProgressBar pct={85} className="bg-blue-500" />
                      </div>
                    </div>

                    {/* Risk Distribution */}
                    <div className="md:pl-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Risk Distribution
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-xs text-gray-600">Low Risk</span>
                          </div>
                          <span className="text-xs font-medium">{filtered.filter((s) => s.risk === "Low").length}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            <span className="text-xs text-gray-600">Medium Risk</span>
                          </div>
                          <span className="text-xs font-medium">{filtered.filter((s) => s.risk === "Medium").length}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-xs text-gray-600">High Risk</span>
                          </div>
                          <span className="text-xs font-medium">{filtered.filter((s) => s.risk === "High").length}</span>
                        </div>
                      </div>

                      <div className="mt-3 p-2 bg-red-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-red-800">Action Required</p>
                            <p className="text-xs text-red-600 mt-1">{filtered.filter((s) => s.risk !== "Low").length} surveyors need attention</p>
                          </div>
                        </div>
                      </div>
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