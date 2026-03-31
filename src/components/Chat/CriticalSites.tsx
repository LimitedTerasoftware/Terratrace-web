import { AlertTriangle } from 'lucide-react';

export function CriticalSites() {
  const criticalSites = [
    {
      siteId: 'MH-AMR-0412',
      type: 'GP',
      district: 'Amravati',
      issue: 'Power Cable Shortage',
      issueColor: 'text-red-600',
      aging: '15+ Days',
      agingColor: 'text-red-600',
      actionOwner: 'Vendor A',
    },
    {
      siteId: 'MH-PUN-0912',
      type: 'Block',
      district: 'Pune',
      issue: 'Material Mismatch',
      issueColor: 'text-orange-600',
      aging: '8-15 Days',
      agingColor: 'text-orange-600',
      actionOwner: 'Internal Team',
    },
    {
      siteId: 'MH-NAS-1102',
      type: 'GP',
      district: 'Nashik',
      issue: 'Survey Error',
      issueColor: 'text-orange-600',
      aging: '4-7 Days',
      agingColor: 'text-orange-600',
      actionOwner: 'Vendor C',
    },
  ];

  const agingBuckets = [
    { range: '15+ DAYS', value: 98, color: 'bg-red-600' },
    { range: '8-15 DAYS', value: 65, color: 'bg-orange-400' },
    { range: '4-7 DAYS', value: 44, color: 'bg-blue-500' },
    { range: '0-3 DAYS', value: 31, color: 'bg-purple-300' },
  ];

  return (
    <div className="space-y-6 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" />
              CRITICAL SITES & EXCEPTIONS
            </h3>
            <div className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded">
              Action Required: 112
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">SITE ID</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">TYPE</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">DISTRICT</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">MISSING ITEM / ISSUE</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">AGING</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">ACTION OWNER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {criticalSites.map((site, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">{site.siteId}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${site.type === 'GP' ? 'text-blue-600' : 'text-purple-600'}`}>
                        {site.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{site.district}</td>
                    <td className={`px-6 py-4 font-medium ${site.issueColor}`}>{site.issue}</td>
                    <td className={`px-6 py-4 font-semibold ${site.agingColor}`}>{site.aging}</td>
                    <td className="px-6 py-4 text-gray-600">{site.actionOwner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg p-2 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">EXCEPTIONS AGING BUCKET</h3>

          <div className="space-y-4">
            {agingBuckets.map((bucket, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">{bucket.range}</span>
                  <span className="text-lg font-bold text-gray-900">{bucket.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className={`h-full ${bucket.color}`} style={{ width: '100%' }} />
                </div>
              </div>
            ))}
          </div>

         <div className="mt-2 pt-2 border-t flex gap-4">
            <div className='bg-gray-100 rounded-lg p-2 flex-1'>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">AVG RESOLVE TIME</p>
                <p className="text-3xl font-bold text-gray-900">
                12.4 <span className="text-lg text-gray-500 font-normal">Days</span>
                </p>
            </div>

            <div className='bg-gray-100 rounded-lg p-2 flex-1'>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">RESOLVE RATE</p>
                <p className="text-3xl font-bold text-green-600">
                82<span className="text-lg text-gray-500 font-normal">%</span>
                </p>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
}
