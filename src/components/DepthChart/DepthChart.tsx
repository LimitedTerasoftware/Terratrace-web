import React, { useMemo, useState } from 'react';
import { DepthDataPoint, ChartPoint } from '../../types/survey';
import { AlertTriangle, TrendingDown, Ruler, X } from 'lucide-react';
import { getDistanceFromLatLonInMeters } from '../../utils/calculations';

interface DepthChartProps {
  depthData: DepthDataPoint[];
  minDepth?: number;
}

interface SelectedPoint {
  index: number;
  distance: number;
  depth: number;
  data: DepthDataPoint;
}

export const DepthChart: React.FC<DepthChartProps> = ({ 
  depthData, 
  minDepth = 1.65 
}) => {
  const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);
  const chartData = useMemo(() => {
    let cumulativeDistance = 0;
  return depthData
    .map((point, index) => {
      const depthValue = parseFloat(point.depthMeters);

    // Parse lat/lng
    const [latStr, lngStr] = point.depthLatlong?.split(',') || [];
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (index > 0) {
      const [prevLatStr, prevLngStr] = depthData[index - 1].depthLatlong?.split(',') || [];
      const prevLat = parseFloat(prevLatStr);
      const prevLng = parseFloat(prevLngStr);

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(prevLat) && !isNaN(prevLng)) {
        const segmentDistance = getDistanceFromLatLonInMeters(prevLat, prevLng, lat, lng);
        cumulativeDistance += segmentDistance;
      }
    }
      return {
        distance: Math.round(cumulativeDistance),
        depth: isNaN(depthValue) ? 0 : depthValue,
        isBelowMinimum: !isNaN(depthValue) && depthValue < minDepth,
        originalData: point
      };
    })
    .sort((a, b) => a.distance - b.distance);
}, [depthData, minDepth]);

  const chartDimensions = {
    width: 800,
    height: 400,
    margin: { top: 60, right: 30, bottom: 20, left: 60 }
  };

  const { width, height, margin } = chartDimensions;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxDistance = Math.max(...chartData.map(d => d.distance), 100);
  const validDepths = chartData
  .map(d => d.depth)
  .filter((depth): depth is number => depth !== null);
  const maxDepth = validDepths.length > 0 ? Math.max(...validDepths, minDepth + 0.5) : minDepth + 0.5;

  // const maxDepth = Math.max(...chartData.map(d => d.depth), minDepth + 0.5);

  const xScale = (distance: number) => (distance / maxDistance) * innerWidth;
  // Reversed Y scale: 0 depth at top, max depth at bottom
  const yScale = (depth: number) => (depth / maxDepth) * innerHeight;

  const pathData = chartData.reduce((path, point, index) => {
    const x = xScale(point.distance);
    const y = yScale(point.depth);
    return index === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, '');

  const criticalAreas = chartData.filter(point => point.isBelowMinimum);
  const belowMinimumCount = criticalAreas.length;
  const totalPoints = chartData.length;

  const handlePointClick = (point: ChartPoint, index: number) => {
    const selectedPoint: SelectedPoint = {
      index,
      distance: point.distance,
      depth: point.depth,
      data: point.originalData
    };

    setSelectedPoints(prev => {
      // If this point is already selected, remove it
      const existingIndex = prev.findIndex(p => p.index === index);
      if (existingIndex !== -1) {
        return prev.filter((_, i) => i !== existingIndex);
      }

      // If we already have 2 points, replace the first one
      if (prev.length >= 2) {
        return [prev[1], selectedPoint];
      }

      // Add the new point
      return [...prev, selectedPoint];
    });
  };

  const clearSelection = () => {
    setSelectedPoints([]);
  };

  const calculateDistance = () => {
    if (selectedPoints.length !== 2) return 0;
    return Math.abs(selectedPoints[1].distance - selectedPoints[0].distance);
  };

  const calculateDepthDifference = () => {
    if (selectedPoints.length !== 2) return 0;
    return Math.abs(selectedPoints[1].depth - selectedPoints[0].depth);
  };

  const getPointColor = (index: number, isBelowMinimum: boolean) => {
    const selectedIndex = selectedPoints.findIndex(p => p.index === index);
    if (selectedIndex !== -1) {
      return selectedIndex === 0 ? "#10B981" : "#8B5CF6"; // Green for first, Purple for second
    }
    return isBelowMinimum ? "#EF4444" : "#3B82F6";
  };

  const getPointRadius = (index: number, isBelowMinimum: boolean) => {
    const isSelected = selectedPoints.some(p => p.index === index);
    if (isSelected) return 8;
    return isBelowMinimum ? 6 : 4;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Depth Analysis Chart</h2>
          <p className="text-gray-600 mt-1">
            Minimum Required Depth: {minDepth}m (Surface to Bottom View)
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Click on any two points to measure distance between them
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-green-600">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-medium">
              {totalPoints - belowMinimumCount} Above Min
            </span>
          </div>
          {belowMinimumCount > 0 && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">
                {belowMinimumCount} Critical Points
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Distance Measurement Panel */}
      {selectedPoints.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Ruler className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Distance Measurement</h3>
            </div>
            <button
              onClick={clearSelection}
              className="p-1 hover:bg-white rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Selected Points</h4>
              {selectedPoints.map((point, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    idx === 0 ? 'bg-green-500' : 'bg-purple-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    Point {idx + 1}: {point.distance}m, {point.depth.toFixed(2)}m depth
                  </span>
                </div>
              ))}
              {selectedPoints.length === 1 && (
                <p className="text-sm text-gray-500 italic">Click another point to measure distance</p>
              )}
            </div>
            
            {selectedPoints.length === 2 && (
              <>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {calculateDistance()}m
                  </div>
                  <div className="text-sm text-gray-600">Horizontal Distance</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">
                    {calculateDepthDifference().toFixed(2)}m
                  </div>
                  <div className="text-sm text-gray-600">Depth Difference</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <svg 
          width={width} 
          height={height}
          className="border border-gray-200 rounded-lg"
        >
          <defs>
            <linearGradient id="depthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="criticalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Grid lines - horizontal */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <g key={ratio}>
                <line
                  x1={0}
                  y1={ratio * innerHeight}
                  x2={innerWidth}
                  y2={ratio * innerHeight}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <text
                  x={-10}
                  y={ratio * innerHeight + 4}
                  textAnchor="end"
                  className="text-xs fill-gray-500"
                >
                  {(ratio * maxDepth).toFixed(2)}m
                </text>
              </g>
            ))}

            {/* Vertical grid lines */}
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(ratio => (
              <line
                key={ratio}
                x1={ratio * innerWidth}
                y1={0}
                x2={ratio * innerWidth}
                y2={innerHeight}
                stroke="#E5E7EB"
                strokeWidth="1"
                opacity="0.3"
              />
            ))}

            {/* Surface line (0 depth) */}
            <line
              x1={0}
              y1={0}
              x2={innerWidth}
              y2={0}
              stroke="#1F2937"
              strokeWidth="3"
              opacity="0.8"
            />
            <text
              x={5}
              y={-5}
              className="text-sm font-medium fill-gray-700"
            >
              Surface (0m)
            </text>

            {/* Minimum depth threshold line */}
            <line
              x1={0}
              y1={yScale(minDepth)}
              x2={innerWidth}
              y2={yScale(minDepth)}
              stroke="#EF4444"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.8"
            />
            <text
              x={innerWidth - 5}
              y={yScale(minDepth) - 5}
              textAnchor="end"
              className="text-sm font-medium fill-red-600"
            >
              Min Depth ({minDepth}m)
            </text>

            {/* Area fill under curve */}
            <path
              d={`M 0 0 ${pathData} L ${xScale(maxDistance)} 0 Z`}
              fill="url(#depthGradient)"
              opacity="0.3"
            />

            {/* Critical areas highlighting - areas above minimum depth line */}
            {/* {criticalAreas.map((point, index) => {
              const x = xScale(point.distance);
              const nextPoint = chartData[chartData.indexOf(point) + 1];
              const nextX = nextPoint ? xScale(nextPoint.distance) : x + 20;
              
              return (
                <rect
                  key={index}
                  x={x - 5}
                  y={0}
                  width={Math.max(10, nextX - x)}
                  height={yScale(minDepth)}
                  fill="url(#criticalGradient)"
                  opacity="0.4"
                />
              );
            })} */}
            {criticalAreas.map((point, index) => {
                const originalIndex = chartData.indexOf(point);
                const x = xScale(point.distance);

                const nextPoint =
                  originalIndex < chartData.length - 1
                    ? chartData[originalIndex + 1]
                    : null;

                const prevPoint =
                  originalIndex > 0
                    ? chartData[originalIndex - 1]
                    : null;

                const isNextCritical = nextPoint?.isBelowMinimum;
                const isPrevCritical = prevPoint?.isBelowMinimum;

                let rectX = x;
                let rectWidth = 8; // default small width for single critical point

                // If next point is also critical → extend to next point
                if (isNextCritical) {
                  const nextX = xScale(nextPoint.distance);
                  rectWidth = nextX - x;
                }
                // else if previous is critical → skip to avoid duplicate drawing
                else if (isPrevCritical) {
                  return null;
                }
                // else single critical point → keep small width centered
                else {
                  rectX = x - rectWidth / 2;
                }

                return (
                  <rect
                    key={originalIndex}
                    x={rectX}
                    y={0}
                    width={Math.max(4, rectWidth)}
                    height={yScale(minDepth)}
                    fill="url(#criticalGradient)"
                    opacity="0.4"
                  />
                );
              })}

  

            {/* Connection line between selected points */}
            {selectedPoints.length === 2 && (
              <line
                x1={xScale(selectedPoints[0].distance)}
                y1={yScale(selectedPoints[0].depth)}
                x2={xScale(selectedPoints[1].distance)}
                y2={yScale(selectedPoints[1].depth)}
                stroke="#6366F1"
                strokeWidth="3"
                strokeDasharray="8,4"
                opacity="0.8"
              />
            )}

            {/* Main depth line */}
            <path
              d={pathData}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Data points */}
            {chartData.map((point, index) => (
              <g key={index}>
                <circle
                  cx={xScale(point.distance)}
                  cy={yScale(point.depth)}
                  r={getPointRadius(index, point.isBelowMinimum)}
                  fill={getPointColor(index, point.isBelowMinimum)}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-all duration-200"
                  onClick={() => handlePointClick(point, index)}
                >
                  <title>
                    Distance: {point.distance}m
                    Depth: {point.depth}m
                    {point.isBelowMinimum ? ' (Below Minimum!)' : ''}
                    Click to select for distance measurement
                  </title>
                </circle>
                {point.isBelowMinimum && (
                  <text
                    x={xScale(point.distance)}
                    y={yScale(point.depth) - 12}
                    textAnchor="middle"
                    className="text-xs font-bold fill-red-600 pointer-events-none"
                  >
                    ⚠
                  </text>
                )}
                {/* Selection indicators */}
                {selectedPoints.some(p => p.index === index) && (
                  <text
                    x={xScale(point.distance)}
                    y={yScale(point.depth) + 20}
                    textAnchor="middle"
                    className="text-xs font-bold fill-gray-700 pointer-events-none"
                  >
                    {selectedPoints.findIndex(p => p.index === index) === 0 ? '1' : '2'}
                  </text>
                )}
              </g>
            ))}

            {/* Distance labels at the top */}
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(ratio => (
              <text
                key={ratio}
                x={ratio * innerWidth}
                y={-20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {Math.round(ratio * maxDistance)}m
              </text>
            ))}

            {/* Axis labels */}
            <text
              x={innerWidth / 2}
              y={-45}
              textAnchor="middle"
              className="text-sm font-medium fill-gray-700"
            >
              Distance (meters)
            </text>
            <text
              x={-50}
              y={innerHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, -50, ${innerHeight / 2})`}
              className="text-sm font-medium fill-gray-700"
            >
              Depth from Surface (meters)
            </text>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-gray-800"></div>
          <span className="text-sm text-gray-700">Surface Level</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span className="text-sm text-gray-700">Depth Measurement</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-0.5 bg-red-500 border-dashed"></div>
          <span className="text-sm text-gray-700">Minimum Depth ({minDepth}m)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 opacity-40"></div>
          <span className="text-sm text-gray-700">Critical Areas</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-700">Point 1</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-sm text-gray-700">Point 2</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {totalPoints}
          </div>
          <div className="text-sm text-blue-700">Total Measurements</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {totalPoints - belowMinimumCount}
          </div>
          <div className="text-sm text-green-700">Above Minimum</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {belowMinimumCount}
          </div>
          <div className="text-sm text-red-700">Below Minimum</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {totalPoints > 0 ? Math.round((belowMinimumCount / totalPoints) * 100) : 0}%
          </div>
          <div className="text-sm text-yellow-700">Critical Rate</div>
        </div>
      </div>
    </div>
  );
};