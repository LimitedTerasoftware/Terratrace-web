export default function ProgressTrendChart() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">KM Progress Trend</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
            <span className="text-gray-600">Target</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
            <span className="text-gray-600">Actual</span>
          </div>
        </div>
      </div>
      <div className="h-64 flex items-end justify-between space-x-2">
        <svg viewBox="0 0 600 200" className="w-full h-full">
          <path
            d="M 0 150 Q 100 100 200 80 T 400 100 T 600 60"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            className="drop-shadow-sm"
          />
          <path
            d="M 0 160 Q 100 120 200 110 T 400 140 T 600 100"
            fill="none"
            stroke="#9CA3AF"
            strokeWidth="3"
            className="drop-shadow-sm"
          />
          <path
            d="M 0 150 Q 100 100 200 80 T 400 100 T 600 60 L 600 200 L 0 200 Z"
            fill="url(#gradient-blue)"
            opacity="0.1"
          />
          <path
            d="M 0 160 Q 100 120 200 110 T 400 140 T 600 100 L 600 200 L 0 200 Z"
            fill="url(#gradient-gray)"
            opacity="0.05"
          />
          <defs>
            <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient-gray" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9CA3AF" />
              <stop offset="100%" stopColor="#9CA3AF" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
