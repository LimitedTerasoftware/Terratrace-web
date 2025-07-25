import React, { useEffect, useState } from 'react';
import { DepthChart } from './DepthChart';
import { DepthDataTable } from './DepthDataTable';
import { Database, BarChart3 } from 'lucide-react';
import { DepthDataPoint } from '../../types/survey';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

function IndexChart({ MainData }: any) {
  const [depthData,setdepthData]=useState<DepthDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // let depthData:DepthDataPoint[] = location.state?.depthData || MainData || []
  const handleDepthChart = async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {};
            if (MainData.start_lgd) params.start_lgd = MainData.start_lgd;
            if (MainData.end_lgd) params.end_lgd = MainData.end_lgd;
            params.eventType = 'DEPTH';
            const resp = await axios.get(`${TraceBASEURL}/get-depth-data`, { params });
            if (resp.status === 200 || resp.status === 201) {
                const Data = resp.data;
                const depthData = Data.data;
                setdepthData(depthData);
            } else {
                setError('Error Occured')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');

        } finally {
            setLoading(false);
        }

    }
    useEffect(()=>{
    handleDepthChart();
    },[])
  const [minDepth, setMinDepth] = useState(1.65);
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');
  const criticalCount = depthData.filter(point => 
    parseFloat(point.depthMeters) < minDepth
  ).length;


  return (
    <div className="min-h-screen">
     
      <div className="container mx-auto px-4">
         {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
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
          <p>Depth measurements are recorded based on latlong along the route</p>
        </div>
      </div>
    </div>
  );
}

export default IndexChart;