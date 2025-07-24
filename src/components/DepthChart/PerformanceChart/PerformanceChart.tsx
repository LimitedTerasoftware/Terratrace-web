import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { DepthPenalties, MachineData } from '../../../types/machine';
import { format } from 'date-fns';
import { calculateDepthPenaltyBreakdown, formatCurrency } from '../../../utils/calculations';

interface PerformanceChartProps {
  data: MachineData;
  depthPenalties?: DepthPenalties;

}
const defaultDepthPenalties: DepthPenalties = {
  totalDepthEvents: 0,
  penalty500: 0,
  penalty1100: 0,
  alerts: 0,
  totalDepthPenalty: 0,
  details: []
};

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data,depthPenalties}) => {
 
const breakdown = calculateDepthPenaltyBreakdown(depthPenalties ?? defaultDepthPenalties);
  
const chartData = data.dailyDistances.map(day => ({
    date: format(new Date(day.date), 'MMM dd'),
    fullDate: day.date,
    distance: day.totalDistance,
    target: 0.25, // Daily target (7.5km/30days = 0.25km/day)
    meets: day.meetsDailyRequirement,
    difference: day.difference,
    depthShortfall: depthPenalties?.details
      .filter(event => format(new Date(event.created_at), 'yyyy-MM-dd') === day.date)
      .reduce((total, event) => {
        const shortfall = Math.max(0, 165 - event.depth);
        return total + shortfall;
      }, 0) || 0,
    depthEventsCount: depthPenalties?.details.filter(event => 
      format(new Date(event.created_at), 'yyyy-MM-dd') === day.date
    ).length || 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border">
          <p className="font-semibold text-gray-900">{label}</p>
          <p className={`text-sm ${data.meets ? 'text-green-600' : 'text-red-600'}`}>
            Distance: {data.distance.toFixed(2)} km
          </p>
          <p className="text-sm text-gray-600">
            Target: {data.target} km
          </p>
          <p className={`text-sm font-medium ${data.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.difference >= 0 ? '+' : ''}{data.difference.toFixed(2)} km
          </p>
            {data.depthEventsCount > 0 && (
            <p className="text-sm text-orange-600">
              Depth Events: {data.depthEventsCount}
            </p>
          )}
          {data.depthShortfall > 0 && (
            <p className="text-sm text-red-600">
              Depth Shortfall: {data.depthShortfall.toFixed(0)} cm
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-b-xl shadow-sm border border-t-0 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Daily Performance Worked</h3>
        <p className="text-sm text-gray-600 mt-1">
          {/* Daily distance vs target (0.25 km/day for 7.5 km/month goal) */}
           Daily distance vs target with depth events overlay
        </p>
      </div>
      
      <div style={{ width: '100%', height: 500 }}>
        <ResponsiveContainer>
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              yAxisId="distance"
              label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }}
            />
             <YAxis 
              yAxisId="events"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickLine={false}
              label={{ value: 'Depth Shortfall (cm)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Target line */}
            <ReferenceLine 
              yAxisId="distance"
              y={0.25} 
              stroke="#f59e0b" 
              strokeDasharray="5 5" 
              label={{ value: "Daily Target", position: "top" }}
            />
              {/* Depth shortfall bars */}
            <Bar 
              yAxisId="events"
              dataKey="depthShortfall" 
              fill="#fb923c" 
              opacity={0.6}
              name="Depth Shortfall (cm)"
            />
            
            {/* Actual performance line */}
            <Line 
              yAxisId="distance"
              type="monotone" 
              dataKey="distance" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={(props: any) => {
                const { payload } = props;
                return (
                  <circle 
                    {...props} 
                    fill={payload.meets ? '#10b981' : '#ef4444'}
                    stroke={payload.meets ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    r={6}
                  />
                );
              }}
              activeDot={{ r: 8, fill: '#3b82f6' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {data.dailyDistances.length}
          </div>
          <div className="text-sm text-gray-600">Days Worked</div>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {data.dailyDistances.filter(d => d.meetsDailyRequirement).length}
          </div>
          <div className="text-sm text-gray-600">Distance Target Met</div>
        </div>
        
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {data.dailyDistances.filter(d => !d.meetsDailyRequirement).length}
          </div>
          <div className="text-sm text-gray-600">Distance Below Target</div>
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {((data.dailyDistances.filter(d => d.meetsDailyRequirement).length / data.dailyDistances.length) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
      </div>
      {depthPenalties && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{depthPenalties.totalDepthEvents}</div>
          <div className="text-sm text-gray-600">Total Depth Events</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{breakdown.penalty500Events}</div>
          <div className="text-sm text-gray-600">₹500 Depth Penalties</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{breakdown.penalty1100Events}</div>
          <div className="text-sm text-gray-600">₹1100 Depth Penalties</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(breakdown.totalDepthPenalty)}</div>
          <div className="text-sm text-gray-600">Total Depth Penalty</div>
        </div>
      </div>
      )}
      
    </div>
  );
};