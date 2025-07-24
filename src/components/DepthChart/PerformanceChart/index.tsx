import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Zap } from 'lucide-react';
import FilterPanel from '../MachineWorkChart/FilterPanel';
import { TabNavigation } from './TabNavigation';
import { PerformanceCard } from './PerformanceCard';
import { PerformanceChart } from './PerformanceChart';
import { DataTable } from './DataTable';
import { BreakdownPanel } from './BreakdownPanel';
import { getMachinePerformance } from '../../Services/api';
import { generatePDF } from '../../../utils/pdfGenerator';
import { FilterState } from '../../../types/survey';
import { DepthAnalysisPanel } from './DepthAnalysisPanel';
import { DepthTableData } from './DepthTableData';

function IndexPerformanceChart() {
const getTodayMon = () => new Date().getMonth() + 1; 
const getTodayYear = () => new Date().getFullYear();
  const [filters, setFilters] = useState<FilterState>({
    machineId: '1',
    machineName:'',
    month: getTodayMon(),
    year: getTodayYear()
  });
  
  const [activeTab, setActiveTab] = useState<'chart' | 'data' | 'depth'>('chart');
  const { data, loading, error, fetchData } = getMachinePerformance();

  useEffect(() => {
    fetchData(filters);
  }, []);

  const handleApplyFilters = () => {
    fetchData(filters);
  };

  const handleDownloadPDF = async () => {
    if (!data?.data[0]) return;
    
    try {
      await generatePDF(data.data[0], filters,data.depthPenalties);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const machineData = data?.data[0];
  const depthPenalties = data?.depthPenalties;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Machine Performance </h1>
                <p className="text-sm text-gray-600">Real-time monitoring and analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
            {/* Filters */}
                <FilterPanel
                    filters={filters}
                    onFiltersChange={setFilters}
                    onApplyFilters={handleApplyFilters}
                    isLoading={loading}
                />
              <button
                onClick={handleApplyFilters}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={!machineData || loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
        

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading performance data...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center">
                <div className="text-red-600 mr-3">⚠️</div>
                <div>
                  <h3 className="text-red-800 font-semibold">Error Loading Data</h3>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {machineData && !loading && (
            <>
              {/* Performance Overview */}
              <PerformanceCard data={machineData} depthPenalties={depthPenalties}machineName={filters.machineName}/>

              {/* Main Content Area with Tabs */}
              <div className="grid grid-cols-1 gap-8">
                  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
                    
                    {activeTab === 'chart' && (
                      <PerformanceChart data={machineData} depthPenalties={depthPenalties}/>
                    )}
                    
                    {activeTab === 'data' && (
                      <DataTable data={machineData} />
                    
                    )}
                     {activeTab === 'depth' && depthPenalties && (
                    
                      <DepthTableData depthPenalties={depthPenalties} />
                      
                    )}
                  </div>
                <div>
                  <BreakdownPanel data={machineData} depthPenalties={depthPenalties}/>
                </div>
              </div>
              {/* Depth Analysis */}
              {/* {depthPenalties && (
                <DepthAnalysisPanel depthPenalties={depthPenalties} />
              )} */}

            </>
          )}

          {/* No Data State */}
          {!machineData && !loading && !error && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                Please adjust your filters and try again.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IndexPerformanceChart;