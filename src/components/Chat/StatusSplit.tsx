export function StatusSplit() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-6">STATUS SPLIT</h3>

      <div className="relative w-40 h-40 mb-8">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="12"
            strokeDasharray="214.33 360"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="12"
            strokeDasharray="248.67 360"
            strokeDashoffset="-214.33"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeDasharray="36 360"
            strokeDashoffset="-463"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">14.2k</p>
            <p className="text-xs text-gray-500 uppercase">TOTAL SITES</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-900" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <span className="font-semibold text-gray-900">69%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-sm text-gray-600">In Progress</span>
          </div>
          <span className="font-semibold text-gray-900">21%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <span className="font-semibold text-gray-900">10%</span>
        </div>
      </div>
    </div>
  );
}
