interface ProgressItem {
  label: string;
  percentage: number;
  color: string;
}

const items: ProgressItem[] = [
  { label: 'PIT WORK', percentage: 40, color: 'bg-blue-600' },
  { label: 'MUFF WORK', percentage: 30, color: 'bg-yellow-400' },
  { label: 'EARTHING', percentage: 20, color: 'bg-yellow-500' },
  { label: 'POLE INSTALLED', percentage: 10, color: 'bg-green-500' },
];

export default function InstallationProgress() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full">
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Installation Progress
      </h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-gray-500 tracking-wide">
                {item.label}
              </span>
              <span className="text-xs font-semibold text-gray-600">
                {item.percentage}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color} transition-all duration-700`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
