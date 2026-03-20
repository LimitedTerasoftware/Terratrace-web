import {
  TrendingUp,
  CheckCircle,
  FileText,
  Settings,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { MachineDetailsResponse } from '../../types/machine';

interface KPICardsProps {
  Data?: MachineDetailsResponse | null;
}

export default function KPICards({ Data }: KPICardsProps) {
  if (!Data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 px-6 py-6">
        <div className="col-span-6 bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500">
          Loading KPI data...
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 px-6 py-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">
              Total KM Completed
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(parseFloat(Data.summary.total_distance) / 1000).toFixed(2)}{' '}
              <span className="text-lg font-normal text-gray-600">km</span>
            </p>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12 km this week
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">
              {/* KM Completed Today */}
              Avg Distance/day
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(parseFloat(Data.summary.avg_distance_per_day)/1000).toFixed(2)}{' '}
              <span className="text-lg font-normal text-gray-600">km</span>
            </p>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8% vs yesterday
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">
              Total Surveys
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {Data.summary.total_links}
            </p>
            <p className="text-xs text-blue-600 mt-1">18 new today</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">
              Active Machines
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {Data.summary.active_machines_today}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {Data.summary.inactive_machines_today} idle machines
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">
              Depth Compliance
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-2">92%</p>
            <p className="text-xs text-green-600 mt-1">Target 90% (Green)</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">
              Issues Count
            </p>
            <p className="text-3xl font-bold text-red-600 mt-2">18</p>
            <p className="text-xs text-gray-600 mt-1">
              10 depths, 5 GPS, 3 photos
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
