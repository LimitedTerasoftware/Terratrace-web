import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

const districts = [
  { state: 'UP', district: 'Lakhimpur Kheri', gpSurvey: 100, ugConst: '420/500 KM', aerial: '1200/1200 P', gpInstall: '210/420', hoto: '12/420', status: 'STABLE', statusColor: '#3b82f6' },
  { state: 'UP', district: 'Sitapur', gpSurvey: 85, ugConst: '120/450 KM', aerial: '840/1500 P', gpInstall: '45/380', hoto: '0/380', status: 'DELAYED', statusColor: '#f59e0b' },
  { state: 'UP', district: 'Hardoi', gpSurvey: 98, ugConst: '280/300 KM', aerial: '950/1000 P', gpInstall: '110/300', hoto: '4/300', status: 'AHEAD', statusColor: '#22c55e' },
  { state: 'UP', district: 'Unnao', gpSurvey: 40, ugConst: '12/400 KM', aerial: '0/800 P', gpInstall: '0/340', hoto: '0/340', status: 'CRITICAL', statusColor: '#ef4444' },
  { state: 'UP', district: 'Lucknow', gpSurvey: 92, ugConst: '310/380 KM', aerial: '1100/1300 P', gpInstall: '180/290', hoto: '8/290', status: 'STABLE', statusColor: '#3b82f6' },
  { state: 'UP', district: 'Barabanki', gpSurvey: 76, ugConst: '200/420 KM', aerial: '720/1400 P', gpInstall: '80/350', hoto: '2/350', status: 'DELAYED', statusColor: '#f59e0b' },
];

function SurveyBar({ value }: { value: number }) {
  const color = value >= 95 ? '#22c55e' : value >= 80 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-[80px]">
        <div className="h-2 rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function DistrictTable() {
  const [search, setSearch] = useState('');

  const filtered = districts.filter(d =>
    d.district.toLowerCase().includes(search.toLowerCase()) ||
    d.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-800">District / Block Wise Progress</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search District..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all w-44"
            />
          </div>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <SlidersHorizontal size={13} /> Filter
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['State', 'District', 'GP Survey', 'UG Const', 'Aerial', 'GP Install', 'HOTO', 'Status'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-4 py-3 text-xs font-semibold text-gray-500">{row.state}</td>
                <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{row.district}</td>
                <td className="px-4 py-3"><SurveyBar value={row.gpSurvey} /></td>
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{row.ugConst}</td>
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{row.aerial}</td>
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{row.gpInstall}</td>
                <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{row.hoto}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded"
                    style={{ color: row.statusColor, backgroundColor: row.statusColor + '1a' }}>
                    {row.status}
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
