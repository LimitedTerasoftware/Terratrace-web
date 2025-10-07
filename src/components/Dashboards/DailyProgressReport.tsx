import React from "react";
import {
  Building2,
  CalendarDays,
  User,
  Phone,
  PieChart,
  Circle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

/** tiny helper */
const cx = (...cls: (string | false | null | undefined)[]) => cls.filter(Boolean).join(" ");

const Dot = ({ className = "" }) => (
  <span className={cx("inline-block h-3 w-3 rounded-full", className)} />
);

const RiskPill = ({ level }: { level: "Low" | "Medium" | "High" }) => {
  const map = {
    Low: { wrap: "bg-green-100 text-green-800", dot: "bg-green-500" },
    Medium: { wrap: "bg-orange-100 text-orange-800", dot: "bg-orange-500" },
    High: { wrap: "bg-red-100 text-red-800", dot: "bg-red-500" },
  }[level];

  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium", map.wrap)}>
      <Dot className={map.dot} />
      {level}
    </span>
  );
};

const TrendIcon = ({ dir }: { dir: "up" | "down" | "flat" }) => (
  <span className="inline-flex items-center justify-center text-gray-700">
    {dir === "up" && <TrendingUp className="h-4 w-4" />}
    {dir === "down" && <TrendingDown className="h-4 w-4" />}
    {dir === "flat" && <Minus className="h-4 w-4" />}
  </span>
);

const Card = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={cx("rounded-lg border bg-white p-6", className)}>{children}</div>
);

const SectionTitle = ({ children }: React.PropsWithChildren) => (
  <h3 className="mb-4 text-lg font-semibold text-gray-900">{children}</h3>
);

const HeaderKVP = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <span className="inline-flex items-center gap-2 text-sm text-gray-700">
    {icon}
    {children}
  </span>
);

const BharatNetDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              BharatNet Phase III - Maharashtra/Pune
            </h1>
            <div className="flex flex-wrap items-center gap-6">
              <HeaderKVP icon={<Building2 className="h-4 w-4 text-gray-500" />}>
                Tera Software + ITI
              </HeaderKVP>
              <HeaderKVP icon={<CalendarDays className="h-4 w-4 text-gray-500" />}>
                24/09/2025
              </HeaderKVP>
              <HeaderKVP icon={<User className="h-4 w-4 text-gray-500" />}>
                Rajesh Kumar
              </HeaderKVP>
              <HeaderKVP icon={<Phone className="h-4 w-4 text-gray-500" />}>
                +91 98765 43210
              </HeaderKVP>
            </div>
          </div>

          <div className="rounded bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white">
            <div className="flex items-center justify-center gap-1">
              <PieChart className="h-4 w-4" />
              DPR
            </div>
            <div className="text-xs opacity-90">Daily Progress Report</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-6 rounded-lg bg-gray-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Executive Summary
          </h2>

          <div className="mb-4 grid grid-cols-1 gap-6 sm:grid-cols-5">
            <div className="text-center">
              <div className="mb-1 text-3xl font-bold text-blue-600">78%</div>
              <div className="text-sm text-gray-600">Overall Completion</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-3xl font-bold text-red-600">+5</div>
              <div className="text-sm text-gray-600">Days Behind Schedule</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-sm font-medium text-red-600">
                Wayleave Delays
              </div>
              <div className="text-sm text-gray-600">Top Risk</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-sm font-medium text-orange-600">
                Contractor B
              </div>
              <div className="text-sm text-gray-600">Key Watch</div>
            </div>
            <div className="text-center">
              <div className="mb-1 text-sm font-bold text-green-600">
                20/05/2025
              </div>
              <div className="text-sm text-gray-600">Forecast Completion</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="inline-flex items-center gap-2">
              <Dot className="bg-green-500" /> On Track (≥95%)
            </span>
            <span className="inline-flex items-center gap-2">
              <Dot className="bg-orange-500" /> Slight Delay (85–95%)
            </span>
            <span className="inline-flex items-center gap-2">
              <Dot className="bg-red-500" /> Critical Delay (&lt;85%)
            </span>
            <span className="inline-flex items-center gap-2">
              <Dot className="bg-gray-500" /> Pending/Not Started
            </span>
          </div>
        </div>

        {/* A. Survey Progress */}
        <Card>
          <SectionTitle>A. Survey Progress</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    "Metric",
                    "Today",
                    "Cumulative",
                    "Target",
                    "Δ vs Target",
                    "% Achieved",
                    "Trend (7d)",
                    "Remarks",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Blocks Assigned
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">15</td>
                  <td className="px-4 py-3 text-sm text-gray-700">450</td>
                  <td className="px-4 py-3 text-sm text-gray-700">500</td>
                  <td className="px-4 py-3 text-sm text-red-600">-50</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-700">
                    90%
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <TrendIcon dir="up" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    In Progress
                  </td>
                </tr>

                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Blocks Completed
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">12</td>
                  <td className="px-4 py-3 text-sm text-gray-700">420</td>
                  <td className="px-4 py-3 text-sm text-gray-700">450</td>
                  <td className="px-4 py-3 text-sm text-red-600">-30</td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-700">
                    93%
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <TrendIcon dir="up" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    Slight delay
                  </td>
                </tr>

                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Blocks Verified
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">8</td>
                  <td className="px-4 py-3 text-sm text-gray-700">380</td>
                  <td className="px-4 py-3 text-sm text-gray-700">420</td>
                  <td className="px-4 py-3 text-sm text-red-600">-40</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-700">
                    90%
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <TrendIcon dir="down" />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">QC backlog</td>
                </tr>

                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    QC Pass %
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">95%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">92%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">95%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">N/A</td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-700">
                    92%
                  </td>
                  <td className="px-4 py-3 text-sm">—</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Improving</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* B. Construction Progress */}
        <Card className="mt-6">
          <SectionTitle>B. Construction Progress</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    "Metric",
                    "Today",
                    "Cumulative",
                    "Target",
                    "Δ vs Target",
                    "% Achieved",
                    "Trend (7d)",
                    "Variance %",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Km Planned
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">25</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1250</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1500</td>
                  <td className="px-4 py-3 text-sm text-red-600">-250</td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-700">
                    83%
                  </td>
                  <td className="px-4 py-3 text-sm">—</td>
                  <td className="px-4 py-3 text-sm text-red-600">-17%</td>
                </tr>

                <tr className="bg-red-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Km Completed
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">18</td>
                  <td className="px-4 py-3 text-sm text-gray-700">980</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1200</td>
                  <td className="px-4 py-3 text-sm text-red-600">-220</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-700">
                    82%
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <TrendIcon dir="up" />
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600">-18%</td>
                </tr>

                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Trenching (km)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">22</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1100</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1250</td>
                  <td className="px-4 py-3 text-sm text-red-600">-150</td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-700">
                    88%
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <TrendIcon dir="down" />
                  </td>
                  <td className="px-4 py-3 text-sm text-orange-600">-12%</td>
                </tr>

                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Cable Blowing (km)
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">15</td>
                  <td className="px-4 py-3 text-sm text-gray-700">850</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1000</td>
                  <td className="px-4 py-3 text-sm text-red-600">-150</td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-700">
                    85%
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <TrendIcon dir="down" />
                  </td>
                  <td className="px-4 py-3 text-sm text-orange-600">-15%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* C. Installation Progress */}
        <Card className="mt-6">
          <SectionTitle>C. Installation Progress</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    "Metric",
                    "Today",
                    "Cumulative",
                    "Target",
                    "Δ vs Target",
                    "% Achieved",
                    "Trend (7d)",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Sites Planned
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">45</td>
                  <td className="px-4 py-3 text-sm text-gray-700">2250</td>
                  <td className="px-4 py-3 text-sm text-gray-700">2500</td>
                  <td className="px-4 py-3 text-sm text-red-600">-250</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-700">
                    90%
                  </td>
                  <td className="px-4 py-3 text-sm">—</td>
                </tr>

                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Sites Installed
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">38</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1950</td>
                  <td className="px-4 py-3 text-sm text-gray-700">2200</td>
                  <td className="px-4 py-3 text-sm text-red-600">-250</td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-700">
                    89%
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <TrendIcon dir="up" />
                  </td>
                </tr>

                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    HOTO Completed
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">32</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1680</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1900</td>
                  <td className="px-4 py-3 text-sm text-red-600">-220</td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-700">
                    88%
                  </td>
                  <td className="px-4 py-3 text-sm">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pipeline Conversion Funnel */}
        <Card className="mt-6">
          <SectionTitle>Pipeline Conversion Funnel</SectionTitle>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="w-32 rounded-lg bg-blue-500 p-6 text-white">
                <div className="text-2xl font-bold">420</div>
                <div className="text-sm">Surveyed</div>
                <div className="mt-1 text-xs">93%</div>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-gray-400" />
            <div className="text-center">
              <div className="w-32 rounded-lg bg-orange-500 p-6 text-white">
                <div className="text-2xl font-bold">980</div>
                <div className="text-sm">Construction</div>
                <div className="mt-1 text-xs">82%</div>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-gray-400" />
            <div className="text-center">
              <div className="w-32 rounded-lg bg-purple-500 p-6 text-white">
                <div className="text-2xl font-bold">1950</div>
                <div className="text-sm">Installation</div>
                <div className="mt-1 text-xs">89%</div>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-gray-400" />
            <div className="text-center">
              <div className="w-32 rounded-lg bg-green-500 p-6 text-white">
                <div className="text-2xl font-bold">1680</div>
                <div className="text-sm">HOTO</div>
                <div className="mt-1 text-xs">88%</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Contractor Benchmarking */}
        <Card className="mt-6">
          <SectionTitle>Contractor Benchmarking</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    "Contractor",
                    "Survey SLA %",
                    "Construction SLA %",
                    "Installation SLA %",
                    "QC %",
                    "FTR %",
                    "Risk",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-green-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Contractor A
                  </td>
                  {["95%", "92%", "94%", "93%", "92%"].map((val) => (
                    <td
                      key={val}
                      className="px-4 py-3 text-sm font-medium text-green-700"
                    >
                      {val}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <RiskPill level="Low" />
                  </td>
                </tr>

                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Contractor B
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-700">
                    85%
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-red-700">
                    80%
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-red-700">
                    78%
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-700">
                    82%
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-red-700">
                    75%
                  </td>
                  <td className="px-4 py-3">
                    <RiskPill level="Medium" />
                  </td>
                </tr>

                <tr className="bg-red-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Contractor C
                  </td>
                  {["75%", "70%", "65%", "70%", "60%"].map((val) => (
                    <td
                      key={val}
                      className="px-4 py-3 text-sm font-medium text-red-700"
                    >
                      {val}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <RiskPill level="High" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Risk, Delay & Escalation Log */}
        <Card className="mt-6">
          <SectionTitle>Risk, Delay & Escalation Log</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    "Stage",
                    "Issue",
                    "Affected",
                    "Reason",
                    "SLA Impact",
                    "Action Taken",
                    "Owner",
                    "Days Open",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Survey
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    Wayleave Clearance Delay
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">50 Blocks</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    Local Authority Approval
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">
                    +7 days
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    Escalated to District Collector
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">PM Team</td>
                  <td className="px-4 py-3 text-center text-sm">12</td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Construction
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    Material Shortage
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">25 Km</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    Supply Chain Disruption
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-600">
                    +3 days
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    Alternative Supplier Engaged
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">Logistics</td>
                  <td className="px-4 py-3 text-center text-sm">5</td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Installation
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    Power Connection Delay
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">15 Sites</td>
                  <td className="px-4 py-3 text-sm text-gray-700">MSEB Approval</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">
                    Resolved
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    Temporary Power Arranged
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">Site Team</td>
                  <td className="px-4 py-3 text-center text-sm">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Milestones & Forecast */}
        <Card className="mt-6">
          <SectionTitle>Milestones & Forecast</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    "Milestone",
                    "Target Date",
                    "Status",
                    "Forecast Completion",
                    "Δ vs Target",
                    "Risk",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Survey 100%
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">15/03/2025</td>
                  <td className="px-4 py-3 text-sm text-gray-700">85%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">20/03/2025</td>
                  <td className="px-4 py-3 text-sm font-medium text-orange-600">
                    +5 days
                  </td>
                  <td className="px-4 py-3">
                    <RiskPill level="Medium" />
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Construction 75%
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">30/04/2025</td>
                  <td className="px-4 py-3 text-sm text-gray-700">62%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">07/05/2025</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">
                    +7 days
                  </td>
                  <td className="px-4 py-3">
                    <RiskPill level="High" />
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    Installation HOTO
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">15/05/2025</td>
                  <td className="px-4 py-3 text-sm text-gray-700">70%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">15/05/2025</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">
                    0 days
                  </td>
                  <td className="px-4 py-3">
                    <RiskPill level="Low" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t pt-6 text-sm text-gray-500">
          <div>Generated on 24/09/2025 at 09:45 AM</div>
          <div className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            BharatNet Phase III - DPR Report
          </div>
        </div>
      </div>
    </div>
  );
};

export default BharatNetDashboard;