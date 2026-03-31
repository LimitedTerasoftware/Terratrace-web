import { AlertTriangle } from 'lucide-react';
import { MetricCard } from '../Chat/MetricCard';
import { ProgressBar } from '../Chat/ProgressBar';
import { InstallationFunnel } from '../Chat/InstallationFunnel';
import { DailyTrend } from '../Chat/DailyTrend';
import { StatusSplit } from '../Chat/StatusSplit';

export function InstallationSections() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard title="TOTAL GP / BLOCKS" value="14,280" subtitle="Global" color="border-l-blue-600" />

                <MetricCard title="INSTALLED" value="9,842" percentage="68.9%" color="border-l-green-600" />

                <MetricCard title="PENDING" value="2,104" subtitle="Not Started" color="border-l-gray-300" />

                <MetricCard title="IN PROGRESS" value="1,850" label="Active" color="border-l-orange-500" />

                <MetricCard title="APPROVAL READY" value="484" label="QC Stage" color="border-l-indigo-500" />

              
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard title="REWORK (EXCEPTIONS)" value="14,280" subtitle="" color="border-l-red-600" />
                <div className="bg-white text-white rounded-lg p-2 shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">CHECKLIST %</span>
                         <ProgressBar percentage={82.4} color="bg-blue-600" />
                        <span className="text-xl font-bold text-gray-900">82.4%</span>
                </div>
                    <div className="bg-white text-white rounded-lg p-2 shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">Evidence Completeness</span>
                         <ProgressBar percentage={82.4} color="bg-blue-400" />
                        <span className="text-xl font-bold text-gray-900">82.4%</span>
                </div>
                    <div className="bg-white text-white rounded-lg p-2 shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">HOTO Readiness</span>
                         <ProgressBar percentage={82.4} color="bg-green-600" />
                        <span className="text-xl font-bold text-gray-900">82.4%</span>
                </div>
                <div className="bg-gradient-to-r from-indigo-800 to-indigo-600 text-white rounded-lg p-2 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wide opacity-80">TARGET PACE</h3>
                    <p className="text-3xl font-bold mt-2">120</p>
                    <p className="text-sm opacity-80">/ day</p>
                    <p className="text-xs opacity-70 mt-2">Currently at 98.4</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
                <InstallationFunnel />
                <DailyTrend />
                <StatusSplit />
            </div>
        </div>
    );
}
