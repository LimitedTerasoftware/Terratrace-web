import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

export function ActivityFeed() {
  const activities = [
    {
      timestamp: '14:28:10',
      siteId: 'MH-NGP-1011',
      district: 'Nagpur',
      type: 'GP',
      activity: 'Checklist Approved by IE',
      status: 'Completed',
      statusColor: 'text-green-600',
      icon: CheckCircle,
    },
    {
      timestamp: '14:25:44',
      siteId: 'MH-AMR-0221',
      district: 'Amravati',
      type: 'BLOCK',
      activity: 'Material Received at Site',
      status: 'In Progress',
      statusColor: 'text-blue-600',
      icon: Clock,
    },
    {
      timestamp: '14:22:15',
      siteId: 'MH-NAS-4491',
      district: 'Nashik',
      type: 'GP',
      activity: 'Rework Assigned - FDMS Image Clear',
      status: 'Issue',
      statusColor: 'text-red-600',
      icon: AlertCircle,
    },
    {
      timestamp: '14:18:02',
      siteId: 'MH-PUN-0102',
      district: 'Pune',
      type: 'GP',
      activity: 'Router Configuration Pushed',
      status: 'In Progress',
      statusColor: 'text-blue-600',
      icon: Clock,
    },
  ];

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">REAL-TIME ACTIVITY FEED</h3>
        <div className="flex items-center gap-2 text-xs text-green-600 font-semibold">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          LIVE UPDATES
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">TIMESTAMP</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">SITE ID</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">DISTRICT</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">TYPE</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">ACTIVITY</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {activities.map((activity, idx) => {
              const IconComponent = activity.icon;
              return (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">{activity.timestamp}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{activity.siteId}</td>
                  <td className="px-6 py-4 text-gray-600">{activity.district}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold ${activity.type === 'GP' ? 'text-blue-600' : 'text-purple-600'}`}>
                      {activity.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{activity.activity}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <IconComponent size={16} className={activity.statusColor} />
                      <span className={`font-medium ${activity.statusColor}`}>{activity.status}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
