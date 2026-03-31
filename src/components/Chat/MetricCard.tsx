export function MetricCard({
  title,
  value,
  subtitle,
  percentage,
  label,
  color = 'border-l-blue-600',
}: {
  title: string;
  value: string;
  subtitle?: string;
  percentage?: string;
  label?: string;
  color?: string;
}) {
  return (
    <div className={`bg-white rounded-lg p-2 shadow-sm border-l-4 ${color}`}>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {percentage && <p className="text-lg font-semibold text-green-600 mt-1">{percentage}</p>}
          {label && <p className="text-sm text-gray-500 mt-1">{label}</p>}
        </div>
      </div>
    </div>
  );
}
