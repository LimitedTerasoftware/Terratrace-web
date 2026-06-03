import { ExternalLink } from 'lucide-react';

interface Surveyor {
  rank: number;
  name: string;
  phone: string;
  poles: number;
  distKm: number;
  completion: number;
}

const surveyors: Surveyor[] = [
  { rank: 1, name: 'Ravi Kumar', phone: '+91 98765 43210', poles: 1240, distKm: 42.5, completion: 94 },
  { rank: 2, name: 'Suresh', phone: '+91 98765 43211', poles: 1180, distKm: 38.2, completion: 91 },
  { rank: 3, name: 'Mahesh', phone: '+91 98765 43212', poles: 1050, distKm: 35.0, completion: 88 },
];

const rankColors = ['bg-blue-600', 'bg-gray-400', 'bg-yellow-600'];

export default function SurveyorPerformance() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Surveyor Performance</h2>
        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          VIEW ALL <ExternalLink size={12} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['RANK', 'SURVEYOR NAME', 'POLES', 'DIST. (KM)', 'COMPL. %'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-400 tracking-wider py-2 pr-4 first:pl-0 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {surveyors.map((s) => (
              <tr key={s.rank} className="hover:bg-gray-50 transition-colors duration-100">
                <td className="py-3.5 pr-4">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${rankColors[s.rank - 1]}`}>
                    {s.rank}
                  </span>
                </td>
                <td className="py-3.5 pr-4">
                  <p className="font-medium text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-400">{s.phone}</p>
                </td>
                <td className="py-3.5 pr-4 text-gray-700 font-medium">{s.poles.toLocaleString()}</td>
                <td className="py-3.5 pr-4 text-gray-600">{s.distKm}</td>
                <td className="py-3.5">
                  <span className="font-semibold text-green-600">{s.completion}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
