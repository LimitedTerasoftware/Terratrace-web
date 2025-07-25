import React from 'react';
import { Calculator, AlertTriangle, Award } from 'lucide-react';
import { DepthPenalties, MachineData } from '../../../types/machine';
import { calculatePenaltyBreakdown, calculateIncentiveBreakdown, formatCurrency, calculateTotalNetCost, calculateDepthPenaltyBreakdown } from '../../../utils/calculations';

interface BreakdownPanelProps {
  data: MachineData;
  depthPenalties?: DepthPenalties;
}

export const BreakdownPanel: React.FC<BreakdownPanelProps> = ({ data ,depthPenalties}) => {
  const penaltyBreakdown = calculatePenaltyBreakdown(data.monthlyTotalDistance);
  const incentiveBreakdown = calculateIncentiveBreakdown(data.monthlyTotalDistance);
  const totalNetCost = depthPenalties ? calculateTotalNetCost(data, depthPenalties) : data.netCost;
  const breakdown = depthPenalties && calculateDepthPenaltyBreakdown(depthPenalties);


  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Financial Breakdown</h3>
      </div>
      
      <div className="space-y-6">
        {/* Performance Requirements */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Performance Requirements</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Target (No penalty/incentive):</span>
              <span className="font-medium">7.5 km/month</span>
            </div>
            <div className="flex justify-between">
              <span>Current Performance:</span>
              <span className={`font-medium ${
                data.monthlyTotalDistance >= 7.5 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.monthlyTotalDistance.toFixed(2)} km/month
              </span>
            </div>
              <div className="flex justify-between">
              <span>Standard Depth:</span>
              <span className="font-medium">165 cm</span>
            </div>
            {depthPenalties && (
              <div className="flex justify-between">
                <span>Depth Events:</span>
                <span className={`font-medium ${
                  depthPenalties.totalDepthEvents > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {depthPenalties.totalDepthEvents} events
                </span>
              </div>
            )}
            {depthPenalties && (
              <div className="flex justify-between">
                <span>Total Depth Shortfall:</span>
                <span className={`font-medium ${
                  depthPenalties.details.reduce((total, event) => total + Math.max(0, 165 - event.depth), 0) > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {depthPenalties.details.reduce((total, event) => total + Math.max(0, 165 - event.depth), 0).toFixed(0)} cm
                </span>
              </div>
            )}
          </div>
        </div>
        
          {/* Total Cost Summary */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3">Monthly Cost Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Base Rent:</span>
              <span className="font-medium">{formatCurrency(data.machineRent)}</span>
            </div>
             <div className="flex justify-between">
              <span>Output Incentive:</span>
              <span className={`font-medium text-green-600`}>
                {data.monthlyIncentive 
                    ? `+${formatCurrency(data.monthlyIncentive)}`
                    : '₹0'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Output Penalty:</span>
              <span className={`font-medium text-red-600`}>
                {data.monthlyPenalty 
                  ? `-${formatCurrency(data.monthlyPenalty)}` 
                   : '₹0'
                }
              </span>
            </div>
            {depthPenalties && (
              <div className="flex justify-between">
                <span>Depth Penalty:</span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(depthPenalties.totalDepthPenalty)}
                </span>
              </div>
            )}
            <div className="border-t border-blue-200 pt-2 mt-2">
              <div className="flex justify-between font-semibold text-blue-800">
                <span>Total Net Payable:</span>
                <span>{formatCurrency(totalNetCost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Penalty Breakdown */}
        {penaltyBreakdown && (
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-red-800">Output Penalty Breakdown</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Shortfall:</span>
                <span className="font-medium">{penaltyBreakdown.shortfall} km</span>
              </div>
              <div className="flex justify-between">
                <span>Penalty segments (250m each):</span>
                <span className="font-medium">{penaltyBreakdown.segments}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate per segment:</span>
                <span className="font-medium">{formatCurrency(penaltyBreakdown.ratePerSegment)}</span>
              </div>
              <div className="border-t border-red-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-red-800">
                  <span>Total Distance Penalty:</span>
                  <span>{formatCurrency(penaltyBreakdown.totalPenalty)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Incentive Breakdown */}
        {incentiveBreakdown && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Output Incentive Breakdown</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Excess distance:</span>
                <span className="font-medium">{incentiveBreakdown.excess} km</span>
              </div>
              <div className="flex justify-between">
                <span>Incentive segments (250m each):</span>
                <span className="font-medium">{incentiveBreakdown.segments}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate per segment:</span>
                <span className="font-medium">{incentiveBreakdown.ratePerSegment}</span>
              </div>
              <div className="border-t border-green-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold text-green-800">
                  <span>Total Incentive:</span>
                  <span>{formatCurrency(incentiveBreakdown.totalIncentive)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
           {/* Penalty Breakdown */}
        {breakdown && depthPenalties && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800">Depth Penalty Breakdown</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Standard Depth:</span>
              <span className="font-medium">165 cm</span>
            </div>
            <div className="flex justify-between">
              <span>164-150 cm events:</span>
              <span className="font-medium">{breakdown.penalty500Events} × ₹500 = {formatCurrency(breakdown.penalty500Amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>149-120 cm events:</span>
              <span className="font-medium">{breakdown.penalty1100Events} × ₹1100 = {formatCurrency(breakdown.penalty1100Amount)}</span>
            </div>
            <div className="border-t border-red-200 pt-2 mt-2">
              <div className="flex justify-between font-semibold text-red-800">
                <span>Total Depth Penalty:</span>
                <span>{formatCurrency(breakdown.totalDepthPenalty)}</span>
              </div>
            </div>
          </div>
        </div>
        )}
        {/* Neutral Performance */}
        {!penaltyBreakdown && !incentiveBreakdown && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-center">
              <h4 className="font-semibold text-blue-800 mb-2">Target Performance</h4>
              <p className="text-sm text-blue-700">
                Performance is at target level. No penalty or incentive applied.
              </p>
            </div>
          </div>
        )}
        
        {/* Rate Structure */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Rate Structure</h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div><strong>Distance Penalty Rates:</strong></div>
            <div>• 5-7.5 km: ₹40,000 per 250m shortfall</div>
            <div>• &lt;5 km: ₹42,000 per 250m shortfall</div>
            <div className="mt-2"><strong>Distance Incentive Rates:</strong></div>
            <div>• 7.5-10 km: ₹42,000 per 250m excess</div>
            <div>• &gt;10 km: ₹45,000 per 250m excess</div>
            <div className="mt-2"><strong>Depth Penalty Rates:</strong></div>
            <div>• 164-150 cm: ₹500 per 100m</div>
            <div>• 149-120 cm: ₹1100 per 100m</div>
          </div>
        </div>
      </div>
    </div>
  );
};