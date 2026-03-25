import { useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface KmTrendData {
  date: string;
  daily_km: string;
  cumulative_km: string;
}

interface ProgressTrendChartProps {
  data?: KmTrendData[];
  isLoading?: boolean;
}

export default function ProgressTrendChart({
  data,
  isLoading,
}: ProgressTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-200/50 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              KM Progress Trend
            </h3>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-blue-500 absolute top-0 left-0"></div>
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
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              KM Progress Trend
            </h3>
          </div>
        </div>
        <div className="h-80 flex flex-col items-center justify-center text-gray-400">
          <div className="p-4 bg-gray-100 rounded-full mb-3">
            <TrendingUp className="w-8 h-8" />
          </div>
          <p className="text-sm font-medium">No data available</p>
        </div>
      </div>
    );
  }

  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const cumulativeValues = sortedData.map((d) => parseFloat(d.daily_km));
  const maxKm = Math.max(...cumulativeValues, 1);
  const minKm = 0;

  const chartHeight = 280;
  const minWidth = 400;
  const itemWidth = 80;
  const chartWidth = Math.max(minWidth, sortedData.length * itemWidth);
  const padding = { top: 30, right: 30, bottom: 50, left: 50 };

  const getY = (value: number) => {
    const normalized = (value - minKm) / (maxKm - minKm);
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

  const linePath = sortedData
    .map((d, i) => {
      const x = getX(i);
      const y = getY(parseFloat(d.daily_km));
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  const areaPath = `${linePath} L ${getX(sortedData.length - 1)} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`;

  const yAxisTicks = 5;
  const yTickValues = Array.from(
    { length: yAxisTicks },
    (_, i) => minKm + (i * (maxKm - minKm)) / (yAxisTicks - 1),
  );

  const averageKm =
    cumulativeValues.reduce((a, b) => a + b, 0) / cumulativeValues.length;
  const totalKm = cumulativeValues.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200/50 shadow-lg shadow-gray-200/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/60">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/30">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">
              KM Progress Trend
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Last {sortedData.length} days tracking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">Total</p>
            <p className="text-lg font-bold text-gray-900">
              {totalKm.toFixed(1)} <span className="text-sm text-gray-500">km</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-medium">Average</p>
            <p className="text-lg font-bold text-blue-600">
              {averageKm.toFixed(1)} <span className="text-sm text-blue-400">km</span>
            </p>
          </div>
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
                id="gradient-blue"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient
                id="line-gradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
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
                    {val.toFixed(1)}
                  </text>
                </g>
              ))}

            <path d={areaPath} fill="url(#gradient-blue)" />

            <path
              d={linePath}
              fill="none"
              stroke="url(#line-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className="transition-all duration-300"
            />

            {sortedData.map((d, i) => {
              const x = getX(i);
              const y = getY(parseFloat(d.daily_km));
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
                      y1={y}
                      x2={x}
                      y2={chartHeight - padding.bottom}
                      stroke="#3B82F6"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      opacity="0.3"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 8 : 5}
                    fill="white"
                    stroke={isHovered ? "#3B82F6" : "#06B6D4"}
                    strokeWidth={isHovered ? 3 : 2.5}
                    filter={isHovered ? "url(#glow)" : ""}
                    className="transition-all duration-200"
                  />

                  {isHovered && (
                    <g className="animate-fade-in">
                      <rect
                        x={x - 60}
                        y={y - 60}
                        width="120"
                        height="50"
                        rx="8"
                        fill="white"
                        stroke="#E5E7EB"
                        strokeWidth="1"
                        filter="drop-shadow(0 4px 12px rgba(0,0,0,0.15))"
                      />
                      <rect
                        x={x - 60}
                        y={y - 60}
                        width="120"
                        height="4"
                        rx="8"
                        fill="url(#line-gradient)"
                      />
                      <text
                        x={x}
                        y={y - 38}
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
                        x={x}
                        y={y - 20}
                        textAnchor="middle"
                        fontSize="16"
                        fontWeight="700"
                        fill="#1F2937"
                      >
                        {parseFloat(d.daily_km).toFixed(2)}
                      </text>
                      <text
                        x={x}
                        y={y - 20}
                        dx="28"
                        textAnchor="start"
                        fontSize="10"
                        fontWeight="600"
                        fill="#3B82F6"
                      >
                        km
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
                  fontWeight={isHovered ? "600" : "500"}
                  fill={isHovered ? "#3B82F6" : "#9CA3AF"}
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
