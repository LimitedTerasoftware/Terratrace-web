import React, { useMemo, useState } from 'react';
import { DepthDataPoint, ChartPoint } from '../../types/survey';
import { AlertTriangle, TrendingDown, Ruler, X } from 'lucide-react';

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

interface SurveyGroup {
  survey_id: number | null;
  points: ChartPoint[];
  startDistance: number;
  endDistance: number;
  totalDistance: number;
  color: string;
  link_name:string;
}

export const DepthChart: React.FC<DepthChartProps> = ({ 
  depthData, 
  minDepth = 1.65 
}) => {
  const [selectedPoints, setSelectedPoints] = useState<SelectedPoint[]>([]);

  const getLatLng = (point: any): { lat: number; lng: number } | null => {
    let coord: string | null | undefined = null;

    switch (point.eventType) {
      case 'DEPTH':
        coord = point.depthLatlong;
        break;
      case 'STARTPIT':
        coord = point.startPitLatlong;
        break;
      case 'ENDPIT':
        coord = point.endPitLatlong;
        break;
      case 'JOINTCHAMBER':
        coord = point.jointChamberLatLong;
        break;
      case 'MANHOLES':
        coord = point.manholeLatLong;
        break;  
      default:
        coord = point.depthLatlong || point.startPitLatlong || point.endPitLatlong || point.jointChamberLatLong || point.manholeLatLong || null;
    }

    if (!coord) return null;

    const [latStr, lngStr] = coord.split(',');
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) return null;

    return { lat, lng };
  };

  const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Radius of the earth in meters
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in meters
    return d;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  const surveyColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const { chartData, surveyGroups } = useMemo(() => {
    // Group data by survey_id
    const surveyMap = new Map<number| null, DepthDataPoint[]>();
    
    depthData.forEach(point => {
      const surveyId = point.survey_id || null;
      const link_name = `${point.start_lgd_name}_${point.end_lgd_name}`;
      if (!surveyMap.has(surveyId)) {
        surveyMap.set(surveyId, []);
      }
      surveyMap.get(surveyId)!.push({...point, link_name}); 
    });

    let globalCumulativeDistance = 0;
    const allChartData: ChartPoint[] = [];
    const groups: SurveyGroup[] = [];

    Array.from(surveyMap.entries()).forEach(([surveyId, points], surveyIndex) => {
      let surveyCumulativeDistance = 0;
      const surveyStartDistance = globalCumulativeDistance;
      const surveyColor = surveyColors[surveyIndex % surveyColors.length];
      
      const surveyChartData = points.map((point, index) => {
        const depthValue = parseFloat(point.depthMeters);
        const current = getLatLng(point);
        const prev = index > 0 ? getLatLng(points[index - 1]) : null;

        if (current && prev) {
          const segmentDistance = getDistanceFromLatLonInMeters(
            prev.lat,
            prev.lng,
            current.lat,
            current.lng
          );
          surveyCumulativeDistance += segmentDistance;
        }

        const chartPoint: ChartPoint = {
          distance: Math.round(globalCumulativeDistance + surveyCumulativeDistance),
          depth: isNaN(depthValue) ? 0 : depthValue,
          isBelowMinimum: !isNaN(depthValue) && depthValue < minDepth,
          originalData: point,
          eventType: point.eventType,
          survey_id: point.survey_id
        };

        return chartPoint;
      });

      // Sort survey data by distance
      surveyChartData.sort((a, b) => a.distance - b.distance);
      
      const surveyEndDistance = surveyChartData.length > 0 
        ? surveyChartData[surveyChartData.length - 1].distance 
        : surveyStartDistance;

      groups.push({
        link_name: points[0].link_name,
        survey_id: surveyId,
        points: surveyChartData,
        startDistance: surveyStartDistance,
        endDistance: surveyEndDistance,
        totalDistance: surveyCumulativeDistance,
        color: surveyColor
      });

      allChartData.push(...surveyChartData);
      globalCumulativeDistance = surveyEndDistance + 50; // Add gap between surveys
    });

    return {
      chartData: allChartData.sort((a, b) => a.distance - b.distance),
      surveyGroups: groups
    };
  }, [depthData, minDepth]);

  const chartDimensions = {
    width: Math.max(1000, chartData.length * 40), 
    height: 600,
    margin: { top: 100, right: 30, bottom: 60, left: 60 }
  };

  const { width, height, margin } = chartDimensions;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxDistance = Math.max(...chartData.map(d => d.distance), 100);
  const totalDistance = surveyGroups.reduce(
    (sum, survey) => sum + survey.totalDistance,
    0
  );
  const validDepths = chartData
    .map(d => d.depth)
    .filter((depth): depth is number => depth !== null);
  const maxDepth = validDepths.length > 0 ? Math.max(...validDepths, minDepth + 0.5) : minDepth + 0.5;

  const xScale = (distance: number) => (distance / maxDistance) * innerWidth;
  const yScale = (depth: number) => (depth / maxDepth) * innerHeight;

  const handlePointClick = (point: ChartPoint, index: number) => {
    const selectedPoint: SelectedPoint = {
      index,
      distance: point.distance,
      depth: point.depth,
      data: point.originalData
    };

    setSelectedPoints(prev => {
      const existingIndex = prev.findIndex(p => p.index === index);
      if (existingIndex !== -1) {
        return prev.filter((_, i) => i !== existingIndex);
      }

      if (prev.length >= 2) {
        return [prev[1], selectedPoint];
      }

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

  const getPointColor = (index: number, isBelowMinimum: boolean, eventType?: string, surveyId?: number | null) => {
    const selectedIndex = selectedPoints.findIndex(p => p.index === index);
    if (selectedIndex !== -1) {
      return selectedIndex === 0 ? "#10B981" : "#8B5CF6";
    }
    if (eventType === "STARTPIT") return "#F59E0B";
    if (eventType === "ENDPIT") return "#008000";
    if (eventType === "JOINTCHAMBER" || eventType === "MANHOLES") return "#CD7F32";
    
    // Use survey-specific color for regular depth points
    const surveyGroup = surveyGroups.find(g => g.survey_id === surveyId);
    if (surveyGroup && !isBelowMinimum) {
      return surveyGroup.color;
    }
    
    return isBelowMinimum ? "#EF4444" : "#3B82F6";
  };

  const getPointRadius = (index: number, isBelowMinimum: boolean, eventType?: string) => {
    const isSelected = selectedPoints.some(p => p.index === index);
    if (isSelected) return 8;
    if (eventType === "STARTPIT" || eventType === "ENDPIT" || eventType === "JOINTCHAMBER" || eventType === "MANHOLES") return 8;
    return isBelowMinimum ? 6 : 4;
  };

  const criticalAreas = chartData.filter(point => point.isBelowMinimum);
  const belowMinimumCount = criticalAreas.length;
  const totalPoints = chartData.length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Multi-Survey Depth Analysis Chart</h2>
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

      <div className="overflow-x-auto max-w-full max-h-[600px]">
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
            {surveyGroups.map((survey, index) => (
              <linearGradient key={survey.survey_id} id={`surveyGradient${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={survey.color} stopOpacity="0.1" />
                <stop offset="100%" stopColor={survey.color} stopOpacity="0.3" />
              </linearGradient>
            ))}
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Survey separation lines and labels */}
            {surveyGroups.map((survey, index) => (
              <g key={survey.survey_id}>
                {/* Survey background area */}
                <rect
                  x={xScale(survey.startDistance)}
                  y={0}
                  width={xScale(survey.endDistance) - xScale(survey.startDistance)}
                  height={innerHeight}
                  fill={`url(#surveyGradient${index})`}
                  opacity="0.2"
                />
                
                {/* Survey start line */}
                <line
                  x1={xScale(survey.startDistance)}
                  y1={0}
                  x2={xScale(survey.startDistance)}
                  y2={innerHeight}
                  stroke={survey.color}
                  strokeWidth="2"
                  strokeDasharray="3,3"
                  opacity="0.6"
                />
                
                {/* Survey label at top */}
                <text
                  x={xScale(survey.startDistance) + (xScale(survey.endDistance) - xScale(survey.startDistance)) / 2}
                  y={-60}
                  textAnchor="middle"
                  className="text-sm font-bold"
                  fill={survey.color}
                >
                  Survey {survey.survey_id}
                </text>
                
                {/* Survey distance label */}
                <text
                  x={xScale(survey.startDistance) + (xScale(survey.endDistance) - xScale(survey.startDistance)) / 2}
                  y={-40}
                  textAnchor="middle"
                  className="text-xs"
                  fill={survey.color}
                >
                  {survey.totalDistance.toFixed(0)}m
                </text>
              </g>
            ))}

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

            {/* Critical areas highlighting */}
            {criticalAreas.map((point, index) => {
              const originalIndex = chartData.indexOf(point);
              const x = xScale(point.distance);

              const nextPoint = originalIndex < chartData.length - 1 ? chartData[originalIndex + 1] : null;
              const prevPoint = originalIndex > 0 ? chartData[originalIndex - 1] : null;

              const isNextCritical = nextPoint?.isBelowMinimum;
              const isPrevCritical = prevPoint?.isBelowMinimum;

              let rectX = x;
              let rectWidth = 8;

              if (isNextCritical) {
                const nextX = xScale(nextPoint.distance);
                rectWidth = nextX - x;
              } else if (isPrevCritical) {
                return null;
              } else {
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

            {/* Survey-specific depth lines */}
            {surveyGroups.map((survey, index) => {
              const pathData = survey.points.reduce((path, point, pointIndex) => {
                const x = xScale(point.distance);
                const y = yScale(point.depth);
                return pointIndex === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
              }, '');

              return (
                <path
                  key={survey.survey_id}
                  d={pathData}
                  fill="none"
                  stroke={survey.color}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              );
            })}

            {/* Data points */}
            {chartData.map((point, index) => (
              <g key={index}>
                <circle
                  cx={xScale(point.distance)}
                  cy={yScale(point.depth)}
                  r={getPointRadius(index, point.isBelowMinimum, point.eventType)}
                  fill={getPointColor(index, point.isBelowMinimum, point.eventType, point.survey_id)}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer hover:opacity-80 transition-all duration-200"
                  onClick={() => handlePointClick(point, index)}
                >
                  <title>
                    Survey: {point.survey_id}
                    Distance: {point.distance}m
                    Depth: {point.depth}m
                    Type: {point.eventType}
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

            {/* Total distance labels at the top */}
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
              y={-80}
              textAnchor="middle"
              className="text-sm font-medium fill-gray-700"
            >
              Total Distance (meters)
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

      {/* Enhanced Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-0.5 bg-gray-800"></div>
            <span className="text-sm text-gray-700">Surface Level</span>
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
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Start Pit</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-600 rounded-full"></div>
            <span className="text-sm text-gray-700">End Pit</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
            <span className="text-sm text-gray-700">Joint Chamber/Manholes</span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {surveyGroups.length}
          </div>
          <div className="text-sm text-blue-700">Total Surveys</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {totalPoints}
          </div>
          <div className="text-sm text-gray-700">Total Measurements</div>
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
        {/* Survey Information Panel */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Survey Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveyGroups.map((survey, index) => (
            <div key={survey.survey_id} className="bg-white rounded-lg p-3 border-l-4" style={{ borderLeftColor: survey.color }}>
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Survey {survey.survey_id}</h4>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: survey.color }}></div>
              </div>
              <div className="mt-2 space-y-1">
                <></>
                <p className="text-sm text-gray-600">
                  Link Name: <span className="font-medium">{survey.link_name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Distance: <span className="font-medium">{survey.totalDistance.toFixed(0)}m</span>
                </p>
                <p className="text-sm text-gray-600">
                  Points: <span className="font-medium">{survey.points.length}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Range: <span className="font-medium">{survey.startDistance}m - {survey.endDistance}m</span>
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Total Distance:</span> {totalDistance.toFixed(0)}m across {surveyGroups.length} surveys
          </p>
        </div>
      </div>
    </div>
  );
};