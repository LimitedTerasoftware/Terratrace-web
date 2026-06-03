export default function GISMap() {
  const dots = [
    { x: 38, y: 45, type: 'installed' },
    { x: 52, y: 38, type: 'installed' },
    { x: 61, y: 55, type: 'installed' },
    { x: 44, y: 62, type: 'inProgress' },
    { x: 70, y: 42, type: 'installed' },
    { x: 30, y: 58, type: 'pending' },
    { x: 58, y: 68, type: 'inProgress' },
    { x: 75, y: 60, type: 'installed' },
    { x: 25, y: 40, type: 'pending' },
    { x: 48, y: 30, type: 'installed' },
    { x: 65, y: 30, type: 'pending' },
    { x: 35, y: 72, type: 'inProgress' },
    { x: 80, y: 50, type: 'installed' },
    { x: 20, y: 65, type: 'installed' },
    { x: 55, y: 78, type: 'pending' },
  ];

  const colorMap: Record<string, string> = {
    installed: '#22c55e',
    inProgress: '#f59e0b',
    pending: '#ef4444',
  };

  return (
     <div className=" relative w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm p-5 overflow-hidden min-h-[280px] sm:min-h-[340px]">
       {/* <div className="relative w-full h-full bg-slate-100 rounded-lg overflow-hidden min-h-[280px] sm:min-h-[340px]"> */}
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-base font-semibold text-gray-900">
          Live GIS Deployment Map
        </h2>
        <div className="flex items-center gap-3">
          {[
            { label: 'Installed', color: 'bg-green-500' },
            { label: 'In Progress', color: 'bg-yellow-400' },
            { label: 'Pending', color: 'bg-red-400' },
          ].map((b) => (
            <span
              key={b.label}
              className="flex items-center gap-1.5 text-xs text-gray-600 font-medium"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${b.color}`} />
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* Map area */}
      <div className="relative bg-slate-100 rounded-lg overflow-hidden h-full min-h-[320px]">
        {/* Grid lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="0.8"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Simulated roads */}
          <line
            x1="0"
            y1="45%"
            x2="100%"
            y2="42%"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          <line
            x1="55%"
            y1="0"
            x2="52%"
            y2="100%"
            stroke="#cbd5e1"
            strokeWidth="2"
          />
          <line
            x1="20%"
            y1="70%"
            x2="85%"
            y2="25%"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />
        </svg>

        {/* Dots */}
        {dots.map((dot, i) => (
          <div
            key={i}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-transform duration-200 hover:scale-150 cursor-pointer"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: '12px',
              height: '12px',
              backgroundColor: colorMap[dot.type],
            }}
            title={
              dot.type === 'installed'
                ? 'Installed'
                : dot.type === 'inProgress'
                  ? 'In Progress'
                  : 'Pending'
            }
          />
        ))}

        {/* Center label */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm text-xs text-gray-500 px-3 py-1 rounded-full border border-gray-200 whitespace-nowrap">
          GIS Map Render Area · Center: 12.9716, 77.5946
        </div>
      </div>
    </div>
  );
}
