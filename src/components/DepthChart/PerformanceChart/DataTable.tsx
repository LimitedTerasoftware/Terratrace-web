import React from 'react';
import { CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { MachineData } from '../../../types/machine';
import { format } from 'date-fns';

interface DataTableProps {
  data: MachineData;
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-t-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">Daily Performance Data</h3>
        <p className="text-sm text-gray-600 mt-1">
          Detailed breakdown of daily distance achievements
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Distance (km)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Difference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.dailyDistances.map((day, index) => (
              <tr key={day.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {format(new Date(day.date), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="font-semibold">{day.totalDistance.toFixed(2)}</span> km
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {day.meetsDailyRequirement ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 mr-2" />
                    )}
                    <span className={`text-sm font-medium ${
                      day.meetsDailyRequirement ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {day.meetsDailyRequirement ? 'Target Met' : 'Below Target'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center">
                    {day.difference >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`font-medium ${
                      day.difference >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {day.difference >= 0 ? '+' : ''}{day.difference.toFixed(2)} km
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    day.meetsDailyRequirement
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {day.meetsDailyRequirement ? 'Excellent' : 'Needs Improvement'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total entries: {data.dailyDistances.length}</span>
          <span>
            Monthly Total: <span className="font-semibold text-gray-900">
              {data.monthlyTotalDistance.toFixed(2)} km
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};