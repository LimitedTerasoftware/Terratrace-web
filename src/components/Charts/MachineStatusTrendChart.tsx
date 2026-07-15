import { useState } from 'react';
import { Activity } from 'lucide-react';

export interface MachineStatusTrendData {
  date: string;
  active_machines: number;
  inactive_machines: number;
}

interface MachineStatusTrendChartProps {
  data?: MachineStatusTrendData[];
  isLoading?: boolean;
}

export default function MachineStatusTrendChart({
  data,
  isLoading,
}: MachineStatusTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-200/50 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Active / Inactive Machines Trend
            </h3>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-emerald-500 absolute top-0 left-0"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-200/50 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Active / Inactive Machines Trend
            </h3>
          </div>
        </div>
        <div className="h-80 flex flex-col items-center justify-center text-gray-400">
          <div className="p-4 bg-gray-100 rounded-full mb-3">
            <Activity className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium">No data available</p>
        </div>
      </div>
    );
  }

  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const maxValue = Math.max(
    ...sortedData.map((d) => Math.max(d.active_machines, d.inactive_machines)),
    1,
  );
  const minValue = 0;

  const chartHeight = 280;
  const minWidth = 400;
  const itemWidth = 80;
  const chartWidth = Math.max(minWidth, sortedData.length * itemWidth);
  const padding = { top: 30, right: 30, bottom: 50, left: 50 };

  const getY = (value: number) => {
    const normalized = (value - minValue) / (maxValue - minValue);
    return (
      chartHeight -
      padding.bottom -
      normalized * (chartHeight - padding.top - padding.bottom)
    );
  };

  const getX = (index: number) => {
    const availableWidth = chartWidth - padding.left - padding.right;
    return (
      padding.left + (index / (sortedData.length - 1 || 1)) * availableWidth
    );
  };

  const buildLinePath = (key: 'active_machines' | 'inactive_machines') =>
    sortedData
      .map((d, i) => {
        const x = getX(i);
        const y = getY(d[key]);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');

  const activeLinePath = buildLinePath('active_machines');
  const inactiveLinePath = buildLinePath('inactive_machines');

  const yAxisTicks = 5;
  const yTickValues = Array.from(
    { length: yAxisTicks },
    (_, i) => minValue + (i * (maxValue - minValue)) / (yAxisTicks - 1),
  );

  const totalActive = sortedData.reduce((a, d) => a + d.active_machines, 0);
  const totalInactive = sortedData.reduce(
    (a, d) => a + d.inactive_machines,
    0,
  );
  const avgActive = totalActive / sortedData.length;
  const avgInactive = totalInactive / sortedData.length;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-200/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              Active / Inactive Machines Trend
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Last {sortedData.length} days tracking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">Avg Active</p>
            <p className="text-lg font-bold text-emerald-600">
              {avgActive.toFixed(1)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">Avg Inactive</p>
            <p className="text-lg font-bold text-rose-500">
              {avgInactive.toFixed(1)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-gray-600">Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="text-xs font-medium text-gray-600">Inactive</span>
        </div>
      </div>

      <div className="h-80 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 rounded-lg">
        <div className="min-w-full" style={{ width: `${chartWidth}px` }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full"
          >
            <defs>
              <linearGradient
                id="active-line-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
              <linearGradient
                id="inactive-line-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#FB7185" />
                <stop offset="100%" stopColor="#F43F5E" />
              </linearGradient>
              <filter id="status-glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {yAxisTicks > 0 &&
              yTickValues.map((val, i) => (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={getY(val)}
                    x2={chartWidth - padding.right}
                    y2={getY(val)}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    strokeDasharray="6 4"
                    opacity="0.5"
                  />
                  <text
                    x={padding.left - 10}
                    y={getY(val) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="500"
                    fill="#9CA3AF"
                  >
                    {Math.round(val)}
                  </text>
                </g>
              ))}

            <path
              d={inactiveLinePath}
              fill="none"
              stroke="url(#inactive-line-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#status-glow)"
              className="transition-all duration-300"
            />

            <path
              d={activeLinePath}
              fill="none"
              stroke="url(#active-line-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#status-glow)"
              className="transition-all duration-300"
            />

            {sortedData.map((d, i) => {
              const x = getX(i);
              const yActive = getY(d.active_machines);
              const yInactive = getY(d.inactive_machines);
              const isHovered = hoveredIndex === i;
              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer transition-all duration-200"
                >
                  {isHovered && (
                    <line
                      x1={x}
                      y1={padding.top}
                      x2={x}
                      y2={chartHeight - padding.bottom}
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.3"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={yInactive}
                    r={isHovered ? 8 : 5}
                    fill="white"
                    stroke="#F43F5E"
                    strokeWidth={isHovered ? 3 : 2.5}
                    filter={isHovered ? 'url(#status-glow)' : ''}
                    className="transition-all duration-200"
                  />
                  <circle
                    cx={x}
                    cy={yActive}
                    r={isHovered ? 8 : 5}
                    fill="white"
                    stroke="#10B981"
                    strokeWidth={isHovered ? 3 : 2.5}
                    filter={isHovered ? 'url(#status-glow)' : ''}
                    className="transition-all duration-200"
                  />

                  {isHovered && (
                    <g className="animate-fade-in">
                      <rect
                        x={x - 65}
                        y={Math.min(yActive, yInactive) - 78}
                        width="130"
                        height="66"
                        rx="8"
                        fill="white"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        filter="drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                      />
                      <text
                        x={x}
                        y={Math.min(yActive, yInactive) - 60}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="500"
                        fill="#6B7280"
                      >
                        {new Date(d.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </text>
                      <text
                        x={x - 55}
                        y={Math.min(yActive, yInactive) - 42}
                        textAnchor="start"
                        fontSize="12"
                        fontWeight="700"
                        fill="#10B981"
                      >
                        ● {d.active_machines} active
                      </text>
                      <text
                        x={x - 55}
                        y={Math.min(yActive, yInactive) - 26}
                        textAnchor="start"
                        fontSize="12"
                        fontWeight="700"
                        fill="#F43F5E"
                      >
                        ● {d.inactive_machines} inactive
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {sortedData.map((d, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <text
                  key={`x-${i}`}
                  x={getX(i)}
                  y={chartHeight - 25}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isHovered ? '600' : '500'}
                  fill={isHovered ? '#10B981' : '#9CA3AF'}
                  className="transition-all duration-200"
                >
                  {new Date(d.date).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
