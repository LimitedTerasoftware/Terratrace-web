import { ChevronRight } from 'lucide-react';

export default function SurveyInventory() {
  const surveys = [
    {
      id: 'SRV-8821',
      date: '2023-10-24',
      vendor: 'BuildCore Ltd',
      km: '4.2 km',
      completion: '98%',
      status: 'Completed',
    },
    {
      id: 'SRV-8822',
      date: '2023-10-24',
      vendor: 'InfraTech',
      km: '2.8 km',
      completion: '45%',
      status: 'In Progress',
    },
    {
      id: 'SRV-8823',
      date: '2023-10-23',
      vendor: 'Global Constr',
      km: '1.5 km',
      completion: '12%',
      status: 'Critical',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Survey Inventory</h3>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Survey ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                KM
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Comp %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {surveys.map((survey) => (
              <tr key={survey.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{survey.id}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{survey.date}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{survey.vendor}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{survey.km}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm font-medium ${
                      survey.completion === '98%'
                        ? 'text-green-600'
                        : survey.completion === '45%'
                        ? 'text-blue-600'
                        : 'text-red-600'
                    }`}
                  >
                    {survey.completion}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      survey.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : survey.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {survey.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
