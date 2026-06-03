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

export default function StatsCard({ label, value, unit, accentColor = 'default' }: StatsCardProps) {
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
