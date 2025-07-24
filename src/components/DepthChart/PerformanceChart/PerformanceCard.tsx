import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Award } from 'lucide-react';
import { DepthPenalties, MachineData } from '../../../types/machine';
import { calculatePerformanceMetrics, calculateTotalNetCost, formatCurrency, formatDistance } from '../../../utils/calculations';

interface PerformanceCardProps {
  data: MachineData;
  depthPenalties?:DepthPenalties;
  machineName:string
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({ data,depthPenalties,machineName }) => {
  const metrics = calculatePerformanceMetrics(data,depthPenalties);
  const totalNetCost = depthPenalties ? calculateTotalNetCost(data, depthPenalties) : data.netCost;

  const getIcon = () => {
    switch (metrics.status) {
      case 'excellent':
      case 'good':
        return <Award className="w-6 h-6 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'penalty':
        return <TrendingDown className="w-6 h-6 text-red-600" />;
      default:
        return <TrendingUp className="w-6 h-6" />;
    }
  };

  return (
    <div className={`rounded-xl border-2 p-6 ${metrics.bgColor}`}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${metrics.color}`}>
            Machine {machineName} Performance
          </h3>
          <p className={`text-sm ${metrics.color} mt-1`}>
            {metrics.message}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {formatDistance(data.monthlyTotalDistance)}
          </div>
          <div className="text-sm text-gray-600">
            Monthly Distance
          </div>
        </div>
      </div>

        <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-white/50 rounded-lg relative">
          <div className="text-sm text-gray-600">Machine Rent</div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(data.machineRent)}
          </div>
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">
            {data.monthlyPenalty ? '-' : '+'}
          </div>
        </div>
        
        <div className="text-center p-3 bg-white/50 rounded-lg relative">
          <div className="text-sm text-gray-600">
            {data.monthlyPenalty ? 'Output Penalty' : 'Output Incentive'}
          </div>
          <div className={`text-lg font-semibold ${
            data.monthlyPenalty ? 'text-red-600' : 'text-green-600'
          }`}>
            {data.monthlyPenalty 
              ? `-${formatCurrency(data.monthlyPenalty)}` 
              : data.monthlyIncentive 
                ? `+${formatCurrency(data.monthlyIncentive)}`
                : '₹0'
            }
          </div>
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">
             -
          </div>
        </div>
        
        <div className="text-center p-3 bg-white/50 rounded-lg relative">
          <div className="text-sm text-gray-600">Depth Penalty</div>
          <div className="text-lg font-semibold text-red-600">
            {depthPenalties ? formatCurrency(depthPenalties.totalDepthPenalty) : '₹0'}
          </div>
          <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-gray-400">
            =
          </div>
        </div>
        
        <div className="text-center p-3 bg-white/50 rounded-lg">
          <div className="text-sm text-gray-600">Net Payable</div>
          <div className={`text-lg font-semibold ${
            totalNetCost > data.machineRent ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(totalNetCost)}
          </div>
        </div>
      </div>
    </div>
  );
};