import { AlertTriangle, Info, Router, Layers, Zap } from 'lucide-react';

interface ProgressBarProps {
  value: number;
  color: string;
  label?: string;
  percent?: string;
}

function ProgressBar({ value, color, label, percent }: ProgressBarProps) {
  return (
    <div className="mt-3">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-xs font-semibold text-gray-700">{percent}</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function MetricItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-0.5">{label}</p>
      <p className="text-xl font-bold" style={{ color: color || '#1e293b' }}>{value}</p>
    </div>
  );
}

function CircleProgress({ value, size = 52 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f59e0b" strokeWidth="5"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        className="rotate-90" style={{ transform: `rotate(90deg) translate(0, 0)`, fontSize: 11, fontWeight: 700, fill: '#f59e0b', transformOrigin: 'center' }}>
      </text>
    </svg>
  );
}

export default function InstallationCards() {
  return (
    <div className="space-y-4">
      {/* GP + Block Installation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GP Installation */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">GP Installation</h3>
            <Router size={16} className="text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <MetricItem label="Approved Surveys" value="3,104" />
            <MetricItem label="Installed Units" value="2,105" color="#3b82f6" />
            <MetricItem label="Pending Work" value="999" color="#f59e0b" />
            <MetricItem label="HOTO Ready" value="1,680" color="#3b82f6" />
          </div>
          <ProgressBar value={68} color="#22c55e" label="Installation Progress" percent="68%" />
          <div className="flex items-center gap-1.5 mt-2">
            <Info size={12} className="text-gray-400 flex-shrink-0" />
            <p className="text-xs text-gray-400">Checklist status: 428 Pending review</p>
          </div>
        </div>

        {/* Block Installation */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Block Installation</h3>
            <Layers size={16} className="text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <MetricItem label="Router Installed" value="84 / 142" />
            <MetricItem label="Rack Setup" value="92 / 142" color="#3b82f6" />
            <MetricItem label="Earthing Done" value="78" />
            <MetricItem label="HOTO Ready" value="62" color="#3b82f6" />
          </div>
          <ProgressBar value={59} color="#3b82f6" label="Router/Rack Checklist" percent="59%" />
          <div className="flex items-center gap-1.5 mt-2">
            <AlertTriangle size={12} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-600">Critical: Power connectivity issues at 14 locations</p>
          </div>
        </div>
      </div>

      {/* Underground + Aerial Construction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Underground Construction */}
        <div className="bg-white rounded-xl border border-l-4 border-gray-200 p-5" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Underground Construction</h3>
            <div className="flex gap-0.5">
              {[0,1,2].map(i => <div key={i} className="w-1 bg-gray-300 rounded-full" style={{height: 14 + i * 2}} />)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-0.5">Total Planned</p>
              <p className="text-xl font-bold text-gray-800">6,200 <span className="text-sm font-semibold text-gray-500">KM</span></p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-0.5">Completed</p>
              <p className="text-xl font-bold text-emerald-600">1,842 <span className="text-sm font-semibold text-emerald-500">KM</span></p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Today KM', value: '+4.2' },
              { label: 'Active Machines', value: '24' },
              { label: 'Depth Compliance', value: '98.2%' },
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-2.5 text-center">
                <p className="text-[9px] font-semibold tracking-wider text-gray-400 uppercase">{item.label}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">4 MAJOR ISSUES</span>
            <button className="text-xs font-semibold text-blue-600 hover:underline">Monitor Live Units</button>
          </div>
        </div>

        {/* Aerial Construction */}
        <div className="bg-white rounded-xl border border-l-4 border-gray-200 p-5" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">Aerial Construction</h3>
            <Zap size={16} className="text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-0.5">Poles Accepted</p>
              <p className="text-xl font-bold text-gray-800">12,504</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-0.5">Distance Clung</p>
              <p className="text-xl font-bold text-amber-500">840 <span className="text-sm font-semibold">KM</span></p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#e5e7eb" strokeWidth="5" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="#f59e0b" strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 22}
                  strokeDashoffset={2 * Math.PI * 22 * 0.3}
                  strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-600">70%</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">3,100 Poles Pending</p>
              <p className="text-xs text-gray-500 mt-0.5">Row clearance pending in 3 blocks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
