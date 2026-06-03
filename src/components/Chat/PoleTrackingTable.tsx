import { useState } from 'react';
import { Search, SlidersHorizontal, MoreVertical } from 'lucide-react';

interface PoleRecord {
  surveyId: string;
  pitId: string;
  location: string;
  status: 'INSTALLED' | 'MUFF WORK' | 'PENDING' | 'PIT WORK';
  lastUpdated: string;
}

const records: PoleRecord[] = [
  { surveyId: 'SRV-1024', pitId: 'PIT-A01', location: 'Zone 4, Sector 12', status: 'INSTALLED', lastUpdated: '2 hrs ago' },
  { surveyId: 'SRV-1025', pitId: 'PIT-A02', location: 'Zone 4, Sector 12', status: 'MUFF WORK', lastUpdated: '5 hrs ago' },
  { surveyId: 'SRV-1026', pitId: 'PIT-A03', location: 'Zone 4, Sector 13', status: 'PENDING', lastUpdated: '1 day ago' },
  { surveyId: 'SRV-1027', pitId: 'PIT-A04', location: 'Zone 4, Sector 13', status: 'PIT WORK', lastUpdated: '2 days ago' },
];

const statusStyle: Record<string, string> = {
  'INSTALLED': 'bg-green-50 text-green-700 border border-green-200',
  'MUFF WORK': 'bg-orange-50 text-orange-600 border border-orange-200',
  'PENDING': 'bg-red-50 text-red-600 border border-red-200',
  'PIT WORK': 'bg-gray-100 text-gray-600 border border-gray-200',
};

export default function PoleTrackingTable() {
  const [search, setSearch] = useState('');

  const filtered = records.filter(
    (r) =>
      r.surveyId.toLowerCase().includes(search.toLowerCase()) ||
      r.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-900">Pole Tracking Table</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search ID or Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <SlidersHorizontal size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['SURVEY ID', 'PIT ID', 'LOCATION', 'STATUS', 'LAST UPDATED', 'ACTION'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 tracking-wider py-2.5 pr-4 first:pl-0 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((row) => (
              <tr key={row.surveyId} className="hover:bg-gray-50 transition-colors duration-100">
                <td className="py-3.5 pr-4 font-medium text-blue-600 cursor-pointer hover:underline whitespace-nowrap">{row.surveyId}</td>
                <td className="py-3.5 pr-4 text-gray-700 whitespace-nowrap">{row.pitId}</td>
                <td className="py-3.5 pr-4 text-gray-600">{row.location}</td>
                <td className="py-3.5 pr-4">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-wide ${statusStyle[row.status]}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3.5 pr-4 text-gray-500 whitespace-nowrap">{row.lastUpdated}</td>
                <td className="py-3.5">
                  <button className="p-1 hover:bg-gray-100 rounded-md transition-colors">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
