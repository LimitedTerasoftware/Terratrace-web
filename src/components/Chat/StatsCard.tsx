interface StatsCardProps {
  label: string;
  value: string | number;
  unit?: string;
  accentColor?: 'default' | 'green' | 'blue' | 'yellow' | 'red';
}

const accentMap: Record<string, string> = {
  default: 'border-l-gray-200',
  green: 'border-l-green-500',
  blue: 'border-l-blue-500',
  yellow: 'border-l-yellow-400',
  red: 'border-l-red-500',
};

export function StatsCard({ label, value, unit, accentColor = 'default' }: StatsCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${accentMap[accentColor]} px-4 py-4 shadow-sm min-w-0`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-gray-900 leading-none">
        {value}
        {unit && <span className="text-sm font-semibold text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
  accent?: boolean;
  accentColor?: string;
}

function StatCard({ label, value, valueColor, accent, accentColor }: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 relative overflow-hidden ${accent ? `border-l-4` : ''}`}
      style={accent && accentColor ? { borderLeftColor: accentColor } : undefined}>
      <p className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color: valueColor || '#1e293b' }}>{value}</p>
    </div>
  );
}

export function StatCards() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Blocks" value="142" accent accentColor="#3b82f6" />
        <StatCard label="Total GPS" value="4,289" accent accentColor="#3b82f6" />
        <StatCard label="GP Survey Appr." value="3,104" valueColor="#3b82f6" accent accentColor="#3b82f6" />
        <StatCard label="UG KM Done" value="1,842" accent accentColor="#3b82f6" />
        <StatCard label="Aerial Poles" value="12,504" accent accentColor="#3b82f6" />
        <StatCard label="GP Installation" value="2,105" accent accentColor="#3b82f6" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Block Install" value="84" accent accentColor="#3b82f6" />
        <StatCard label="Checklist Pend." value="428" valueColor="#f59e0b" accent accentColor="#f59e0b" />
        <StatCard label="HOTO Pending" value="1,152" accent accentColor="#3b82f6" />
        <StatCard label="Critical Issues" value="12" valueColor="#ef4444" accent accentColor="#ef4444" />
      </div>
    </div>
  );
}

