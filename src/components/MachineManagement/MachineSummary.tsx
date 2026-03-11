import React, { useEffect, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { RefreshCw, Satellite, BarChart3, Database, MapPin, Activity, MapPinCheck, DiscIcon, MapPinIcon } from 'lucide-react';
import { MachineApiResponse, MachineDataListItem } from '../../types/machine';
import { MachineMapComponent } from './MachineMap';
import { DepthChart } from '../DepthChart/DepthChart';
import { DepthDataTable } from '../DepthChart/DepthDataTable';
import { convertMachineDataToDepthData } from '../../utils/DataConverter';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const MachineSurveyDashboard: React.FC = () => {
  const [activities, setActivities] = useState<MachineDataListItem[]>([]);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'chart' | 'table'>('map');
  const [minDepth, setMinDepth] = useState(1.65);
  
  const colorPalette = [
    '#2563eb', '#dc2626', '#059669', '#7c3aed', '#ea580c',
    '#0891b2', '#be185d', '#4338ca', '#65a30d', '#f59e0b',
    '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280',
  ];


  const getColorByRegistration = useCallback((() => {
    const colorMap: Record<string, string> = {};
    let colorIndex = 0;

    return (event: string | null | undefined) => {
      if (!event) return '#9ca3af';

      if (!colorMap[event]) {
        colorMap[event] = colorPalette[colorIndex % colorPalette.length];
        colorIndex++;
      }
      return colorMap[event];
    };
  })(), []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('machineId');
    setMachineId(id);
  }, []);

  const fetchMachineData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${TraceBASEURL}/get-latest-activity`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MachineApiResponse = await response.json();

      if (data.status && data.data) {
        const allActivities: MachineDataListItem[] = Object.values(data.data).flat();
        const validActivities = allActivities.filter((activity) => {
          if (machineId && Number(activity.machine_id) !== Number(machineId)) {
             setActivities([]);
            return false;
            
          }
          return true;
        });

        validActivities.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setActivities(validActivities);
      } else {
        setActivities([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [machineId]);

  useEffect(() => {
    fetchMachineData();
  }, [fetchMachineData]);

  const render = (status: Status) => {
    if (status === Status.LOADING) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-gray-600 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading Google Maps...</p>
          </div>
        </div>
      );
    }

    if (status === Status.FAILURE) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-red-600 text-center">
            <p>Error loading Google Maps. Please check your API key.</p>
          </div>
        </div>
      );
    }

    return (
      <MachineMapComponent 
        activities={activities} 
        getColorByRegistration={getColorByRegistration}
        minDepth={minDepth}
      />
    );
  };

  const machineInfo = activities.length > 0 ? activities[0] : null;
  const depthData = convertMachineDataToDepthData(activities);
  const livePoint = activities.length > 0 ? activities[activities.length - 1] : null;
  const criticalDepthCount = depthData.filter(point => 
    parseFloat(point.depthMeters) < minDepth
  ).length;
const totalDistance = activities.reduce((sum, survey) => {
  const distance = parseFloat(survey.distance || "0");
  return sum + (isNaN(distance) ? 0 : distance);
}, 0);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-2">
        {/* Header */}
       <div className="bg-white rounded-lg shadow-lg p-3 mb-2">

        {/* HEADER ROW */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Satellite className="w-8 h-8 text-blue-600" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">HDD</h1>

              {machineInfo && (
                <p className="text-gray-600 mt-1">
                  {machineInfo.machine_registration_number} - {machineInfo.firm_name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {livePoint && (
              <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">Live Point Active</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Last update: {new Date(livePoint.created_at).toLocaleTimeString()}
                </p>
              </div>
            )}

            <button
              onClick={fetchMachineData}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* DISTANCE ROW */}
        {machineInfo && (
          <div className="flex items-center text-gray-700">
            <MapPinIcon className="text-green-600 w-5 h-5 mr-2" />
            <span>
              Cumulative Distance Today:
              <span className="font-bold ml-1">{totalDistance.toFixed(2)} m</span>
            </span>
          </div>
        )}

      </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-2">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('map')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'map'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                Route Map
              </button>
              <button
                onClick={() => setActiveTab('chart')}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'chart'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Depth Chart
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
            {activeTab === 'map' && (
              <div className="h-[600px] relative">
                <Wrapper apiKey={apiKey} render={render} />
{/*                 
                {activities.length > 0 && (
                  <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs max-h-64 overflow-y-auto z-10">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Events</h4>
                    <div className="space-y-1">
                      {Array.from(
                        new Map(
                          activities.map(a => [a.eventType, a])
                        ).values()
                      ).map(machine => (
                        <div key={machine.id} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: getColorByRegistration(
                                machine.eventType
                              ),
                            }}
                          ></div>
                          <span className="text-xs text-gray-700">
                            {machine.eventType}
                          </span>
                        </div>
                      ))}
                    </div>
                 
                  </div>
                )} */}
                <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10 w-64">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Map Indicators
                  </h4>

                  <table className="w-full text-xs text-gray-700">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-1">Marker</th>
                        <th className="text-left py-1">Meaning</th>
                      </tr>
                    </thead>

                    <tbody className="space-y-2">

                      <tr className="border-b">
                        <td className="py-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          Green dot
                        </td>
                        <td>Current machine location</td>
                      </tr>
                       <tr className="border-b">
                        <td className="py-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          Blue dot
                        </td>
                        <td>Depth</td>
                      </tr>

                      <tr className="border-b">
                        <td className="py-2 flex items-center gap-2">
                          <div className="w-5 h-1 bg-blue-500"></div>
                          Blue line
                        </td>
                        <td>Completed route</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          Red flag
                        </td>
                        <td>End pit</td>
                      </tr>

                      <tr>
                        <td className="py-2 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          Yellow flag
                        </td>
                        <td>Start pit</td>
                      </tr>

                    </tbody>
                  </table>
                </div>

                {isLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-20">
                    <div className="text-gray-600 text-center">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Loading machine route data...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'chart' && depthData.length > 0 && (
              <DepthChart depthData={depthData} minDepth={minDepth} />
            )}

            {activeTab === 'table' && depthData.length > 0 && (
              <DepthDataTable depthData={depthData} minDepth={minDepth} />
            )}

            {((activeTab === 'chart' || activeTab === 'table') && depthData.length === 0) && (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Depth Data Available</h3>
                <p className="text-gray-600">
                  No depth measurements found in the current dataset.
                </p>
              </div>
            )}
          </div>
        </div>
          {/* Controls */}
         {machineInfo && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    {machineInfo.machine_registration_number} Information
                </h2>

                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                    Active
                </span>
                </div>
                {/* Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Location</div>
                    <div className="font-semibold">
                    {machineInfo.start_lgd_name} → {machineInfo.end_lgd_name}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Company</div>
                    <div className="font-semibold">
                    {machineInfo.firm_name}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Machine</div>
                    <div className="font-semibold">
                    {machineInfo.machine_registration_number}
                    </div>
                </div>
               <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">State</div>
                    <div className="font-semibold">
                    {machineInfo.state_name}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">District</div>
                    <div className="font-semibold">
                    {machineInfo.district_name}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Block</div>
                    <div className="font-semibold">
                    {machineInfo.block_name}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Surveyor</div>
                    <div className="font-semibold">
                    {machineInfo.user_name}
                    </div>
                </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Total Points</div>
                    <div className="font-semibold">
                        {activities.length}
                    </div>
                </div>
            </div>
            </div>
            )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Real-time machine survey data with depth analysis and route visualization</p>
          <p className="mt-1">
            Last updated: {activities.length > 0 ? new Date(activities[activities.length - 1].created_at).toLocaleString() : 'No data'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MachineSurveyDashboard;