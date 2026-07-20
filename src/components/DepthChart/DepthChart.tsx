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
  points: (ChartPoint & { isOutlier: boolean })[];
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
  const [showOutliers, setShowOutliers] = useState(false);

  /**
   * Fits a quadratic (parabola) y = a·x² + b·x + c through the DEPTH points
   * using least-squares regression, then flags only those points whose residual
   * exceeds 1.5 × the standard deviation of all residuals as non-aligned.
   *
   * This tolerates the natural small fluctuations that real depth readings have
   * while still removing genuine outliers that break the parabolic shape.
   * STARTPIT / ENDPIT / other anchor types are never touched.
   */
  const filterParabolaAlignedDepthPoints = (
    points: (ChartPoint & { isOutlier: boolean })[]
  ): (ChartPoint & { isOutlier: boolean })[] => {
    const depthOnly = points.filter(p => p.eventType === 'DEPTH');

    // Need at least 3 points to fit a parabola
    if (depthOnly.length < 3) return points;

    // ── Normalise x to [0, 1] to keep the regression numerically stable ──
    const xVals = depthOnly.map(p => p.distance);
    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);
    const xRange = xMax - xMin || 1;
    const xs = xVals.map(x => (x - xMin) / xRange); // normalised 0..1
    const ys = depthOnly.map(p => p.depth);

    // ── Least-squares fit for y = a·x² + b·x + c ──
    // Build normal equations: [Σx⁴ Σx³ Σx²] [a]   [Σx²y]
    //                          [Σx³ Σx² Σx ] [b] = [Σxy ]
    //                          [Σx² Σx  n  ] [c]   [Σy  ]
    const n = xs.length;
    let sx1=0, sx2=0, sx3=0, sx4=0, sy=0, sx1y=0, sx2y=0;
    for (let i = 0; i < n; i++) {
      const x = xs[i], y = ys[i];
      sx1 += x; sx2 += x*x; sx3 += x*x*x; sx4 += x*x*x*x;
      sy  += y; sx1y += x*y; sx2y += x*x*y;
    }
    // Solve 3×3 system via Cramer's rule
    const A = [[sx4,sx3,sx2],[sx3,sx2,sx1],[sx2,sx1,n]];
    const B = [sx2y, sx1y, sy];
    const det3 = (m: number[][]): number =>
      m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])
     -m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])
     +m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
    const detA = det3(A);

    let a = 0, b = 0, c = 0;
    if (Math.abs(detA) > 1e-12) {
      a = det3([[B[0],A[0][1],A[0][2]],[B[1],A[1][1],A[1][2]],[B[2],A[2][1],A[2][2]]]) / detA;
      b = det3([[A[0][0],B[0],A[0][2]],[A[1][0],B[1],A[1][2]],[A[2][0],B[2],A[2][2]]]) / detA;
      c = det3([[A[0][0],A[0][1],B[0]],[A[1][0],A[1][1],B[1]],[A[2][0],A[2][1],B[2]]]) / detA;
    } else {
      // Degenerate case — keep all points
      return points;
    }

    // ── Compute residuals and their std-dev ──
    const residuals = xs.map((x, i) => Math.abs(ys[i] - (a*x*x + b*x + c)));
    const meanRes = residuals.reduce((s, r) => s + r, 0) / n;
    const stdRes  = Math.sqrt(residuals.reduce((s, r) => s + (r - meanRes)**2, 0) / n);
    // Threshold: points more than 1.5σ away from the fitted parabola are non-aligned
    const threshold = meanRes + 1.5 * stdRes;

    // ── Tag each DEPTH point ──
    let depthCounter = 0;
    return points.map(p => {
      if (p.eventType !== 'DEPTH') return p; // anchors are never outliers
      const isOutlier = residuals[depthCounter++] > threshold;
      return { ...p, isOutlier };
    });
  };

  /**
   * Builds a smooth cubic Bézier path through an ordered set of SVG points,
   * producing a natural parabola-like curve.
   * Uses Catmull-Rom → cubic Bézier conversion for continuity at every joint.
   */
  const buildParabolaPath = (pts: Array<{ x: number; y: number }>): string => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    if (pts.length === 2)
      return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

    const alpha = 0.5; // tension — 0 = tight, 1 = loose

    const cp = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number }
    ) => {
      // Catmull-Rom control points converted to cubic Bézier handles
      const cp1x = p1.x + (p2.x - p0.x) * alpha / 3;
      const cp1y = p1.y + (p2.y - p0.y) * alpha / 3;
      const cp2x = p2.x - (p3.x - p1.x) * alpha / 3;
      const cp2y = p2.y - (p3.y - p1.y) * alpha / 3;
      return { cp1x, cp1y, cp2x, cp2y };
    };

    // Phantom points at both ends for smooth boundary tangents
    const phantom0 = { x: 2 * pts[0].x - pts[1].x, y: 2 * pts[0].y - pts[1].y };
    const phantomN = {
      x: 2 * pts[pts.length - 1].x - pts[pts.length - 2].x,
      y: 2 * pts[pts.length - 1].y - pts[pts.length - 2].y,
    };
    const extended = [phantom0, ...pts, phantomN];

    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      const { cp1x, cp1y, cp2x, cp2y } = cp(
        extended[i - 1],
        extended[i],
        extended[i + 1],
        extended[i + 2]
      );
      d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
    }
    return d;
  };

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

        // if (current && prev) {
        //   const segmentDistance = getDistanceFromLatLonInMeters(
        //     prev.lat,
        //     prev.lng,
        //     current.lat,
        //     current.lng
        //   );
        //   surveyCumulativeDistance += segmentDistance;
        // }
         surveyCumulativeDistance+= point.distance ? parseFloat(point.distance) : 0;


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

      // Tag all points with isOutlier: false initially
      const initialTagged: (ChartPoint & { isOutlier: boolean })[] = surveyChartData.map(
        p => ({ ...p, isOutlier: false })
      );

      // Apply parabola-alignment filter: only DEPTH points are evaluated;
      // STARTPIT / ENDPIT / other anchors are never marked as outliers.
      const taggedPoints = filterParabolaAlignedDepthPoints(initialTagged);
      
      const surveyEndDistance = taggedPoints.length > 0 
        ? taggedPoints[taggedPoints.length - 1].distance 
        : surveyStartDistance;

      groups.push({
        link_name: points[0].link_name,
        survey_id: surveyId,
        points: taggedPoints,
        startDistance: surveyStartDistance,
        endDistance: surveyEndDistance,
        totalDistance: surveyCumulativeDistance,
        color: surveyColor
      });

      allChartData.push(...taggedPoints);
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
  const outlierCount = chartData.filter(
    p => (p as ChartPoint & { isOutlier: boolean }).isOutlier
  ).length;

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
          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Total Distance:</span> {totalDistance.toFixed(0)}m across {surveyGroups.length} surveys
            </p>
          </div>
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
          {/* {outlierCount > 0 && (
            <button
              onClick={() => setShowOutliers(prev => !prev)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                showOutliers
                  ? 'bg-gray-200 text-gray-700 border-gray-300'
                  : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full border border-dashed border-gray-400 inline-block" />
              <span>{showOutliers ? 'Hide' : 'Show'} {outlierCount} non-aligned point{outlierCount !== 1 ? 's' : ''}</span>
            </button>
          )} */}
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

            {/* Survey-specific depth lines — true parabola shape:
                STARTPIT → ascending DEPTH points → peak → descending DEPTH points → ENDPIT
                Non-aligned DEPTH points are excluded from the curve */}
            {surveyGroups.map((survey) => {
              // Build the ordered set of points that form the parabola:
              //   1. STARTPIT (if present)
              //   2. Aligned DEPTH points only (isOutlier = false)
              //   3. ENDPIT (if present)
              const startPit = survey.points.find(p => p.eventType === 'STARTPIT');
              const endPit   = survey.points.find(p => p.eventType === 'ENDPIT');
              const alignedDepths = survey.points.filter(
                p => p.eventType === 'DEPTH' && !p.isOutlier
              );

              const curvePoints: Array<{ x: number; y: number }> = [
                ...(startPit ? [{ x: xScale(startPit.distance), y: yScale(startPit.depth) }] : []),
                ...alignedDepths.map(p => ({ x: xScale(p.distance), y: yScale(p.depth) })),
                ...(endPit ? [{ x: xScale(endPit.distance), y: yScale(endPit.depth) }] : []),
              ];

              const pathData = buildParabolaPath(curvePoints);
              if (!pathData) return null;

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
            {chartData.map((point, index) => {
              const taggedPoint = point as ChartPoint & { isOutlier: boolean };
              const isOutlier = taggedPoint.isOutlier;
              const isAnchor = point.eventType === 'STARTPIT' || point.eventType === 'ENDPIT'
                || point.eventType === 'JOINTCHAMBER' || point.eventType === 'MANHOLES';

              // Anchor points (STARTPIT, ENDPIT, etc.) are ALWAYS visible.
              // DEPTH outliers are hidden unless showOutliers toggle is on.
              if (!isAnchor && isOutlier && !showOutliers) return null;

              return (
                <g key={index}>
                  {/* Dashed ring on outlier DEPTH points when revealed */}
                  {isOutlier && showOutliers && (
                    <circle
                      cx={xScale(point.distance)}
                      cy={yScale(point.depth)}
                      r={getPointRadius(index, point.isBelowMinimum, point.eventType) + 5}
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      strokeDasharray="3,2"
                      opacity="0.7"
                    />
                  )}
                  <circle
                    cx={xScale(point.distance)}
                    cy={yScale(point.depth)}
                    r={getPointRadius(index, point.isBelowMinimum, point.eventType)}
                    fill={isOutlier ? '#9CA3AF' : getPointColor(index, point.isBelowMinimum, point.eventType, point.survey_id)}
                    stroke="white"
                    strokeWidth="2"
                    opacity={isOutlier ? 0.5 : 1}
                    className="cursor-pointer hover:opacity-80 transition-all duration-200"
                    onClick={() => handlePointClick(point, index)}
                  >
                    <title>
                      Survey: {point.survey_id}
                      Distance: {point.distance}m
                      Depth: {point.depth}m
                      Type: {point.eventType}
                      {point.isBelowMinimum ? ' (Below Minimum!)' : ''}
                      {/* {isOutlier ? ' [Not aligned — hidden from parabola curve]' : ''} */}
                      Click to select for distance measurement
                    </title>
                  </circle>
                  {point.isBelowMinimum && !isOutlier && (
                    <text
                      x={xScale(point.distance)}
                      y={yScale(point.depth) - 12}
                      textAnchor="middle"
                      className="text-xs font-bold fill-red-600 pointer-events-none"
                    >
                      ⚠
                    </text>
                  )}
                  {/* {isOutlier && showOutliers && (
                    <text
                      x={xScale(point.distance)}
                      y={yScale(point.depth) - 14}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#6B7280"
                      className="pointer-events-none"
                    >
                      not aligned
                    </text>
                  )} */}
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
              );
            })}

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
          {/* <div className="flex items-center space-x-2">
            <div className="relative w-3 h-3">
              <div className="w-3 h-3 rounded-full bg-gray-300 opacity-50"></div>
              <div className="absolute inset-0 rounded-full border border-dashed border-gray-400"></div>
            </div>
            <span className="text-sm text-gray-700">Not aligned (hidden from curve)</span>
          </div> */}
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
                {/* <p className="text-sm text-gray-600">
                  Range: <span className="font-medium">{survey.startDistance}m - {survey.endDistance}m</span>
                </p> */}
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