import { AlertCircle, MapPin, User, Info } from 'lucide-react';

interface Alert {
  icon: React.ReactNode;
  title: string;
  detail: string;
  badge: { label: string; color: string };
  bg: string;
  border: string;
}

const alerts: Alert[] = [
  {
    icon: <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />,
    title: 'Site BN-402 stuck at PIT_DONE',
    detail: 'Delayed for 12 days · Zone 4',
    badge: { label: 'CRITICAL', color: 'bg-red-500 text-white' },
    bg: 'bg-red-50',
    border: 'border-l-red-500',
  },
  {
    icon: <MapPin size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />,
    title: 'District 04 bottleneck at MUFF_DONE',
    detail: 'Delayed for 8 days · 15 sites affected',
    badge: { label: 'WARNING', color: 'bg-yellow-500 text-white' },
    bg: 'bg-yellow-50',
    border: 'border-l-yellow-500',
  },
  {
    icon: <User size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />,
    title: 'Surveyor P. Sharma: 10+ pending logs',
    detail: 'Overdue since 7 days · District 02',
    badge: { label: 'DELAYED', color: 'bg-orange-400 text-white' },
    bg: 'bg-orange-50',
    border: 'border-l-orange-400',
  },
];

export default function BottleneckAnalysis() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Bottleneck Analysis</h2>
        <Info size={18} className="text-gray-300" />
      </div>

      <div className="space-y-2.5 flex-1">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={`flex items-start justify-between gap-3 p-3 rounded-lg border-l-4 ${alert.bg} ${alert.border}`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              {alert.icon}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{alert.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{alert.detail}</p>
              </div>
            </div>
            <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-md tracking-wide ${alert.badge.color}`}>
              {alert.badge.label}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
        <button className="py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors tracking-wide">
          REASSIGN TASKS
        </button>
        <button className="py-2 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors tracking-wide">
          NOTIFY TEAM
        </button>
      </div>
    </div>
  );
}
