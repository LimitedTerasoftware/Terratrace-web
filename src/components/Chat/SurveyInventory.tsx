import { ChevronRight } from 'lucide-react';
import { MachineDataReport } from '../../types/machine';

interface SurveyInventoryProps {
  data?: MachineDataReport[];
  isLoading?: boolean;
}

export default function SurveyInventory({
  data,
  isLoading,
}: SurveyInventoryProps) {
  const surveys = data?.slice(0, 10) || [];

  const formatDistance = (distance: string) => {
    if (!distance) return '0 km';
    const meters = parseFloat(distance);
    if (isNaN(meters)) return '0 km';
    return `${(meters / 1000).toFixed(2)} km`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
        Vendor
        </h3>
        {/* <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </button> */}
      </div>
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : surveys.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Machines
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total Links
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total Distance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Avg/Day
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {surveys.map((survey, index) => (
                <tr
                  key={`${survey.firm_id}-${index}`}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {survey.firm_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {survey.authorised_person}
                    </div>
                    <div className="text-sm text-gray-500">
                      {survey.authorised_mobile}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {survey.total_machines}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {survey.total_links}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {(survey.total_distance_meters)} m
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {survey.total_days}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {survey.avg_distance_per_day} m
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-500">
            No survey data available
          </div>
        )}
      </div>
    </div>
  );
}
