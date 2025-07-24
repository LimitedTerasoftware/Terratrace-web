import React from 'react';
import { AlertTriangle, MapPin, Calendar } from 'lucide-react';
import { DepthPenalties } from '../../../types/machine';
import { format } from 'date-fns';

interface DepthDataTableProps {
  depthPenalties: DepthPenalties;
}

export const DepthTableData: React.FC<DepthDataTableProps> = ({ depthPenalties }) => {
  const getPenaltyInfo = (depth: number) => {
    const shortfall = Math.max(0, 165 - depth);
    if (depth >= 150 && depth <= 164) {
      return { penalty: 500, color: 'text-amber-600', bgColor: 'bg-amber-50' };
    } else if (depth >= 120 && depth <= 149) {
      return { penalty: 1100, color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (depth < 120) {
      return { penalty: 'Critical', color: 'text-red-800', bgColor: 'bg-red-100' };
    }
    return { penalty: 0, color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h3 className="text-xl font-semibold text-gray-900">Depth Events Data</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Detailed breakdown of all depth violations and penalties
        </p>
      </div>
      
      <div className="overflow-x-auto overflow-y-scroll max-h-100">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Depth (cm)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Shortfall
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Penalty Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {depthPenalties.details.map((event, index) => {
              const penaltyInfo = getPenaltyInfo(event.depth);
              const shortfall = Math.max(0, 165 - event.depth);
              
              return (
                <tr key={event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="font-medium">
                          {format(new Date(event.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(event.created_at), 'HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="font-semibold text-gray-900">{event.depth}</span> cm
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {shortfall > 0 ? `${shortfall.toFixed(0)} cm` : 'None'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-medium ${penaltyInfo.color}`}>
                      {typeof penaltyInfo.penalty === 'number' && penaltyInfo.penalty > 0 
                        ? `₹${penaltyInfo.penalty}/100m` 
                        : penaltyInfo.penalty === 'Critical' 
                          ? 'Critical' 
                          : 'No Penalty'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="font-mono text-xs">
                        {event.latlong}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      event.depth >= 165 
                        ? 'bg-green-100 text-green-800'
                        : event.depth >= 150
                          ? 'bg-amber-100 text-amber-800'
                          : event.depth >= 120
                            ? 'bg-red-100 text-red-800'
                            : 'bg-red-200 text-red-900'
                    }`}>
                      {event.depth >= 165 
                        ? 'Standard'
                        : event.depth >= 150
                          ? 'Minor Violation'
                          : event.depth >= 120
                            ? 'Major Violation'
                            : 'Critical'
                      }
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{depthPenalties.details.length}</div>
            <div className="text-gray-600">Total Events</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-amber-600">
              {depthPenalties.details.filter(e => e.depth >= 150 && e.depth <= 164).length}
            </div>
            <div className="text-gray-600">₹500 Penalties</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600">
              {depthPenalties.details.filter(e => e.depth >= 120 && e.depth <= 149).length}
            </div>
            <div className="text-gray-600">₹1100 Penalties</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {depthPenalties.details.reduce((total, event) => total + Math.max(0, 165 - event.depth), 0).toFixed(0)} cm
            </div>
            <div className="text-gray-600">Total Shortfall</div>
          </div>
        </div>
      </div>
    </div>
  );
};