import { ChevronRight, AlertTriangle, Satellite, Camera } from 'lucide-react';

export default function RecentIssues() {
  const issues = [
    {
      id: 'SRV-8823',
      date: '2023-10-24',
      type: 'Depth Variance',
      surveyId: 'SRV-8823',
      location: 'WB-Section-4',
      severity: 'High',
      status: 'Open',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
    },
    {
      id: 'SRV-8822',
      date: '2023-10-24',
      type: 'GPS Signal Lost',
      surveyId: 'SRV-8819',
      location: 'MH-West-Zone',
      severity: 'Medium',
      status: 'Investigating',
      icon: Satellite,
      iconColor: 'text-orange-600',
    },
    {
      id: 'SRV-8821',
      date: '2023-10-23',
      type: 'Low Light Photo',
      surveyId: 'SRV-8815',
      location: 'KA-Industrial',
      severity: 'Low',
      status: 'Resolved',
      icon: Camera,
      iconColor: 'text-blue-600',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Issues</h3>
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
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Survey ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {issues.map((issue) => (
              <tr key={issue.id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg bg-opacity-10 flex items-center justify-center ${
                      issue.severity === 'High' ? 'bg-red-100' : issue.severity === 'Medium' ? 'bg-orange-100' : 'bg-blue-100'
                    }`}>
                      <issue.icon className={`w-4 h-4 ${issue.iconColor}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{issue.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-blue-600 font-medium hover:underline">{issue.surveyId}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">{issue.location}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 rounded-full mr-2 ${
                        issue.severity === 'High'
                          ? 'bg-red-600'
                          : issue.severity === 'Medium'
                          ? 'bg-orange-600'
                          : 'bg-blue-600'
                      }`}
                    ></div>
                    <span className="text-sm text-gray-900">{issue.severity}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      issue.status === 'Open'
                        ? 'bg-red-100 text-red-800'
                        : issue.status === 'Investigating'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {issue.status}
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
