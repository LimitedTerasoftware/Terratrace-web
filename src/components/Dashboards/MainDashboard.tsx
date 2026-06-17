import { Download, RefreshCw } from 'lucide-react';import {StatCards} from '../Chat/StatsCard';
import FlowCards from '../Chat/FlowCards';
import SurveyTable from '../Chat/SurveyTable';
import InstallationCards from '../Chat/InstallationCards';
import StatusBottlenecks from '../Charts/StatusBottlenecks';
import DistrictTable from '../Chat/DistrictTable';

export default function MainDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Project Progress Dashboard</h1>
            <p className="text-xs text-gray-500 mt-0.5">Survey to Installation, Construction, Checklist and HOTO live status</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 px-3.5 py-2 rounded-lg transition-colors">
              <Download size={14} /> Export
            </button>
            <button className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-3.5 py-2 rounded-lg transition-colors shadow-sm">
              <RefreshCw size={14} /> Sync Data
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Stat Cards */}
        <StatCards/>
        {/* Flow Cards */}
        <FlowCards />

        {/* Survey Status Table */}
        <SurveyTable />

        {/* Installation & Construction Cards */}
        <InstallationCards />

        {/* HOTO Status + Critical Bottlenecks */}
        <StatusBottlenecks />

        {/* District / Block Wise Progress */}
        <DistrictTable />
      </div>
    </div>
  );
}
