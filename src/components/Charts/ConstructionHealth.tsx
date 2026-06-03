interface ConstructionHealthProps {
  percentage: number;
  completed: number;
  pending: number;
}

export default function ConstructionHealth({ percentage, completed, pending }: ConstructionHealthProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full">
      <h2 className="text-base font-semibold text-gray-900 mb-4">Construction Health</h2>

      {/* Donut */}
      <div className="flex justify-center mb-4">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="14"
            />
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="#22c55e"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{percentage}%</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Completed</p>
          <p className="text-lg font-bold text-green-600 mt-0.5">{completed.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Pending</p>
          <p className="text-lg font-bold text-yellow-500 mt-0.5">{pending.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
