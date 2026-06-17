import { AlertTriangle, AlarmClock, SlidersHorizontal, Zap, ChevronRight } from 'lucide-react';

const hotoItems = [
  { label: 'HOTO Completed', value: 45, dotColor: '#22c55e', icon: null },
  { label: 'Pending Review', value: 1152, dotColor: '#f59e0b', icon: null },
  { label: 'Rejected / Rework', value: 3, dotColor: '#ef4444', icon: null },
  { label: 'Ready for Acceptance', value: 12, dotColor: '#3b82f6', icon: null },
  { label: 'Delayed Handover', value: 156, dotColor: '#ef4444', isAlert: true },
];

const bottlenecks = [
  {
    icon: <AlertTriangle size={18} className="text-amber-500" />,
    iconBg: '#fef3c7',
    title: 'Survey Approved but Installation Not Started',
    desc: 'Affects 842 Gram Panchayats in 12 districts. Average delay: 14 days.',
    action: 'ASSIGN TEAM',
  },
  {
    icon: <SlidersHorizontal size={18} className="text-blue-500" />,
    iconBg: '#dbeafe',
    title: 'Installation Done but Checklist Pending',
    desc: '428 locations are awaiting quality engineer sign-off before HOTO.',
    action: 'REMIND ENG',
  },
  {
    icon: <Zap size={18} className="text-blue-500" />,
    iconBg: '#dbeafe',
    title: 'Power EB Meter Pending',
    desc: '124 Block POPs ready for commissioning but EB meters not installed.',
    action: 'LIAISON LOG',
  },
];

export default function StatusBottlenecks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* HOTO Status Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4">HOTO Status Summary</h3>
        <div className="space-y-2">
          {hotoItems.map((item, i) => (
            <div key={i} className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${item.isAlert ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}>
              <div className="flex items-center gap-2.5">
                {item.isAlert ? (
                  <AlarmClock size={14} className="text-red-500" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.dotColor }} />
                )}
                <span className={`text-sm ${item.isAlert ? 'text-red-700 font-medium' : 'text-gray-700'}`}>{item.label}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: item.dotColor }}>
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Bottlenecks */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4">Critical Bottlenecks &amp; Needs Attention</h3>
        <div className="space-y-3">
          {bottlenecks.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.iconBg }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
              <button className="flex-shrink-0 text-[10px] font-bold tracking-wider text-gray-500 border border-gray-200 hover:border-blue-400 hover:text-blue-600 px-2 py-1 rounded transition-colors">
                {item.action}
              </button>
            </div>
          ))}
        </div>
        <button className="mt-3 w-full text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 transition-colors">
          View All 42 Bottlenecks <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
