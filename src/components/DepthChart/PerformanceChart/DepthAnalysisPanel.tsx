import React from 'react';
import { AlertTriangle, MapPin, Calendar, Layers } from 'lucide-react';
import { DepthPenalties } from '../../../types/machine';
import { calculateDepthPenaltyBreakdown, formatCurrency } from '../../../utils/calculations';
import { format } from 'date-fns';

interface DepthAnalysisPanelProps {
  depthPenalties: DepthPenalties;
}

export const DepthAnalysisPanel: React.FC<DepthAnalysisPanelProps> = ({ depthPenalties }) => {
  const breakdown = calculateDepthPenaltyBreakdown(depthPenalties);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-6">
        <Layers className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">Depth Analysis</h3>
      </div>
      
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{depthPenalties.totalDepthEvents}</div>
            <div className="text-sm text-gray-600">Total Events</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{breakdown.penalty500Events}</div>
            <div className="text-sm text-gray-600">₹500 Penalties</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{breakdown.penalty1100Events}</div>
            <div className="text-sm text-gray-600">₹1100 Penalties</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(breakdown.totalDepthPenalty)}</div>
            <div className="text-sm text-gray-600">Total Penalty</div>
          </div>
        </div>

        {/* Penalty Breakdown */}
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

        {/* Recent Depth Events */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Recent Depth Events</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {depthPenalties.details.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    event.depth >= 150 && event.depth <= 164 ? 'bg-amber-500' :
                    event.depth >= 120 && event.depth <= 149 ? 'bg-red-500' :
                    'bg-green-500'
                  }`} />
                  <div>
                    <div className="font-medium text-gray-900">{event.depth} cm depth</div>
                    <div className="text-xs text-gray-500">
                      Shortfall: {Math.max(0, 165 - event.depth)} cm
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono text-gray-600">
                  {event.latlong.split(',')[0].substring(0, 8)}...
                </div>
              </div>
            ))}
          </div>
          {depthPenalties.details.length > 10 && (
            <div className="text-center mt-3">
              <span className="text-sm text-gray-500">
                Showing 10 of {depthPenalties.details.length} events
              </span>
            </div>
          )}
        </div>

        {/* Depth Standards */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-3">Depth Standards & Penalties</h4>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex justify-between">
              <span>Standard Depth:</span>
              <span className="font-medium">165 cm</span>
            </div>
            <div className="flex justify-between">
              <span>164-150 cm:</span>
              <span className="font-medium">₹500 penalty per 100m</span>
            </div>
            <div className="flex justify-between">
              <span>149-120 cm:</span>
              <span className="font-medium">₹1100 penalty per 100m</span>
            </div>
            <div className="flex justify-between">
              <span>Below 120 cm:</span>
              <span className="font-medium">Critical violation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};