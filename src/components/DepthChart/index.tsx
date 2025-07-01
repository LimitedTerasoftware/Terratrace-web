import React, { useState } from 'react';
import { DepthChart } from './DepthChart';
import { DepthDataTable } from './DepthDataTable';
import { Database, RefreshCw, Settings, BarChart3 } from 'lucide-react';
import { ApiResponse, DepthDataPoint } from '../../types/survey';
import { useLocation } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

interface IndexChartProps {
  depthData: DepthDataPoint[];
}

function IndexChart() {
  const location = useLocation();
  const depthData:DepthDataPoint[] = location.state?.depthData
  const [minDepth, setMinDepth] = useState(1.65);
  const [apiUrl, setApiUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const criticalCount = depthData.filter(point => 
    parseFloat(point.depthMeters) < minDepth
  ).length;
 
  return (
    <div className="min-h-screen">
        <button
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
          onClick={() => window.history.back()}
          >
          <FaArrowLeft className="h-5 w-5" />
          Back
        </button>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Depth Analysis
                </h1>
                <p className="text-gray-600 mt-1">
                  Monitor and analyze depth measurements with critical threshold detection
                </p>
              </div>
            </div>
            
            {criticalCount > 0 && (
              <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-700 font-medium">
                    {criticalCount} Critical Point{criticalCount !== 1 ? 's' : ''} Detected
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('chart')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'chart'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Chart View
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'table'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                Data Table
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'chart' ? (
              <DepthChart depthData={depthData} minDepth={minDepth} />
            ) : (
              <DepthDataTable depthData={depthData} minDepth={minDepth} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Depth measurements are recorded every 10 meters along the route</p>
        </div>
      </div>
    </div>
  );
}

export default IndexChart;