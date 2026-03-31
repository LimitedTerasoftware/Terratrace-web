import { MapPin, TrendingDown } from 'lucide-react';

export function DistrictPerformance() {
  const districts = [
    { name: 'Amravati', gp: '840 / 712', block: '14 / 12', completion: 84, exceptions: 12 },
    { name: 'Nagpur', gp: '712 / 680', block: '12 / 12', completion: 95, exceptions: 0 },
    { name: 'Pune', gp: '1,200 / 720', block: '24 / 14', completion: 60, exceptions: 45 },
    { name: 'Nashik', gp: '980 / 410', block: '18 / 6', completion: 41, exceptions: 82 },
  ];

  const topLaggingDistricts = [
    { name: 'Gadhchiroli', percentage: 24 },
    { name: 'Nandurbar', percentage: 31 },
  ];

  return (
    <div className="space-y-6 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">DISTRICT PERFORMANCE PERFORMANCE</h3>
              <button className="text-sm text-blue-600 font-medium hover:text-blue-700">View All Districts</button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">DISTRICT</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">GP (TOTAL/INST)</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">BLOCK (TOTAL/INST)</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">COMPLETION %</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">EXCEPTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {districts.map((district, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">{district.name}</td>
                      <td className="px-6 py-4 text-gray-600">{district.gp}</td>
                      <td className="px-6 py-4 text-gray-600">{district.block}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full ${
                              district.completion >= 80 ? 'bg-green-500' :
                              district.completion >= 60 ? 'bg-yellow-500' :
                              district.completion >= 40 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`} style={{ width: `${district.completion}%` }} />
                          </div>
                          <span className="font-semibold text-gray-900">{district.completion}%</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-semibold ${
                        district.exceptions > 50 ? 'text-red-600' :
                        district.exceptions > 20 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>{district.exceptions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        
        </div>

        <div className="bg-gradient-to-b from-teal-600 to-teal-700 rounded-lg p-6 shadow-sm text-white min-h-64 flex flex-col">
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-6">INSTALLATION HEATMAP</h3>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white bg-opacity-20 rounded px-4 py-2 text-sm text-center">
              Interactive Map: Click to Filter Districts
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white border-opacity-20">
            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2">
              <TrendingDown size={16} />
              TOP 5 LAGGING DISTRICTS
            </h4>
            <div className="space-y-2">
              {topLaggingDistricts.map((district, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm">{district.name}</span>
                  <div className="flex items-center gap-2 flex-1 ml-4">
                    <div className="flex-1 bg-white bg-opacity-20 rounded-full h-1 overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${district.percentage}%` }} />
                    </div>
                    <span className="text-sm font-semibold">{district.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
