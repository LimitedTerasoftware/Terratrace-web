import { Server, Activity, ServerOff } from 'lucide-react';

interface SummaryCardsProps {
  totalMachines: number;
  activeMachines: number;
  inactiveMachines: number;
}

export default function SummaryCards({
  totalMachines,
  activeMachines,
  inactiveMachines,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Machines</p>
            <p className="text-3xl font-semibold text-gray-900">{totalMachines}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <Server className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Active Machines</p>
            <p className="text-3xl font-semibold text-green-600">{activeMachines}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Inactive Machines</p>
            <p className="text-3xl font-semibold text-red-600">{inactiveMachines}</p>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <ServerOff className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
