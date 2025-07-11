import React, { useState, useMemo, useEffect } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { Satellite, RefreshCw } from 'lucide-react';
import MapComponent from './MapComponent';
import ActivityDetails from './ActivityDetails';
import StatsPanel from './StatsPanel';
import useActivities from '../hooks/useActivities';
import { Activity, Block, District, MarkerData, StateData } from '../../types/survey';
import axios from 'axios';
import { Machine } from '../../types/machine';
import { getMachineOptions } from '../Services/api';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
interface StatesResponse {
  success: boolean;
  data: StateData[];
}
// Event type mapping for coordinates and photos
const EVENT_TYPE_MAPPING = {
  'DEPTH': { coordField: 'depthLatlong', photoField: 'depthPhoto' },
  'ROADCROSSING': { coordField: 'crossingLatlong', photoField: 'crossingPhotos' },
  'FPOI': { coordField: 'fpoiLatLong', photoField: 'fpoiPhotos' },
  'JOINTCHAMBER': { coordField: 'jointChamberLatLong', photoField: 'jointChamberPhotos' },
  'MANHOLES': { coordField: 'manholeLatLong', photoField: 'manholePhotos' },
  'ROUTEINDICATOR': { coordField: 'routeIndicatorLatLong', photoField: 'routeIndicatorPhotos' },
  'LANDMARK': { coordField: 'landmarkLatLong', photoField: 'landmarkPhotos' },
  'FIBERTURN': { coordField: 'fiberTurnLatLong', photoField: 'fiberTurnPhotos' },
  'KILOMETERSTONE': { coordField: 'kilometerstoneLatLong', photoField: 'kilometerstonePhotos' },
  'STARTPIT': { coordField: 'startPitLatlong', photoField: 'startPitPhotos' },
  'ENDPIT': { coordField: 'endPitLatlong', photoField: 'endPitPhotos' },
  'STARTSURVEY': { coordField: 'startPointCoordinates', photoField: 'startPointPhoto' },
  'ENDSURVEY': { coordField: 'endPointCoordinates', photoField: 'endPointPhoto' },

};

function LiveTrack() {
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [machinesData, setMachinesData] = useState<Machine[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [Machine, setMachine] = useState('');
  const { activities, totalCount, isLoading, error, refetch } = useActivities(selectedState, selectedDistrict, selectedBlock, Machine);
  
  // Fetch all states
  const fetchStates = async () => {
    try {
      setLoadingStates(true);
      const response = await fetch(`${BASEURL}/states`);
      if (!response.ok) throw new Error('Failed to fetch states');
      const result: StatesResponse = await response.json();
      setStates(result.success ? result.data : []);
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };
  useEffect(() => {
    fetchStates();
    getMachineOptions().then(data => {
      setMachinesData(data);
    });
  }, []);

  // Fetch districts by state ID (not state_code)
  const fetchDistricts = async (stateId: string) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }

    try {
      setLoadingDistricts(true);
      // Find the state_code for the selected state_id

      const response = await fetch(`${BASEURL}/districtsdata?state_code=${stateId}`);
      if (!response.ok) throw new Error('Failed to fetch districts');
      const data = await response.json();
      setDistricts(data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchBlock = async () => {
    try {
      if (selectedDistrict === '') return;


      const response = await fetch(`${BASEURL}/blocksdata?district_code=${selectedDistrict}`);
      if (!response.ok) throw new Error('Failed to fetch blocks');
      const data = await response.json();
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    }
  }

  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedState, states]);

  useEffect(() => {
    fetchBlock();
  }, [selectedDistrict]);

  const markers: MarkerData[] = useMemo(() => {
    return activities
      .filter(activity => {
        // Get the coordinate field based on event type
        const mapping = EVENT_TYPE_MAPPING[activity.eventType as keyof typeof EVENT_TYPE_MAPPING];
        if (!mapping) return false;

        const coordField = mapping.coordField as keyof Activity;
        const coordinates = activity[coordField] as string | null;

        return coordinates && coordinates.trim() !== '';
      })
      .map(activity => {
        const mapping = EVENT_TYPE_MAPPING[activity.eventType as keyof typeof EVENT_TYPE_MAPPING];
        const coordField = mapping.coordField as keyof Activity;
        const coordinates = activity[coordField] as string;

        const [lat, lng] = coordinates.split(',').map(Number);
        return {
          position: { lat, lng },
          activity
        };
      });
  }, [activities]);

  const handleMarkerClick = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  const render = (status: any) => {
    if (status === 'LOADING') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading Google Maps...</p>
          </div>
        </div>
      );
    }

    if (status === 'FAILURE') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-red-600 text-center">
            <p>Error loading Google Maps. Please check your API key.</p>
          </div>
        </div>
      );
    }

    return null;
  };
  const clearFilters = () => {
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedBlock(null);

  };
  return (
    <><div className="mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
          <select
            value={Machine !== '' ? Machine : ''}
            onChange={(e) => {
              setMachine(e.target.value !== '' ? (e.target.value) : '');

            }}
            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Machines</option>
            {machinesData.map((machine) => (
              <option key={machine.machine_id} value={machine.machine_id}>
                {machine.registration_number}
              </option>
            ))}

          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {/* State Filter */}
        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
          <select
            value={selectedState || ''}
            onChange={(e) => setSelectedState(e.target.value || '')}
            disabled={loadingStates}
            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state.state_id} value={state.state_id}>
                {state.state_name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {loadingStates ? (
              <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>

        {/* District Filter */}
        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
          <select
            value={selectedDistrict || ''}
            onChange={(e) => setSelectedDistrict(e.target.value || '')}
            disabled={!selectedState}
            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
          >
            <option value="">All Districts</option>
            {districts.map((district) => (
              <option key={district.district_id} value={district.district_id}>
                {district.district_name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {loadingDistricts ? (
              <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>

        {/* Block Filter */}
        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
          <select
            value={selectedBlock || ''}
            onChange={(e) => setSelectedBlock(e.target.value)}
            disabled={!selectedDistrict}
            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
          >
            <option value="">All Blocks</option>
            {blocks.map((block) => (
              <option key={block.block_id} value={block.block_id}>
                {block.block_name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {/* Clear Filters */}
        <button
          onClick={clearFilters}
          className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
        >
          <span className="text-red-500 dark:text-red-400 font-medium text-sm">✕</span>
          <span>Clear Filters</span>
        </button>
      </div>
    </div><div className="min-h-screen bg-gray-50">

        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Satellite className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Live Machine Tracker</h1>
                <p className="text-sm text-gray-600">Fiber Optic Construction Monitoring</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isAutoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-600">
                  {isAutoRefresh ? 'Live Updates' : 'Manual Mode'}
                </span>
              </div>

              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
              >
                {isAutoRefresh ? 'Disable Auto' : 'Enable Auto'}
              </button>

              <button
                onClick={refetch}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-6 mt-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="p-6">
          <div className="space-y-6">
            <StatsPanel activities={activities} totalCount={totalCount} isLoading={isLoading} />

            <div>

              {/* <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"> */}
              {/* Recent Activities */}
              {/* <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.length === 0 && !isLoading ? (
            <p className="text-gray-500 text-sm">No activities found.</p>
          ) : (
            activities.map(activity => {
              const mapping = EVENT_TYPE_MAPPING[activity.eventType as keyof typeof EVENT_TYPE_MAPPING];
              const hasLocation = mapping && activity[mapping.coordField as keyof Activity];
              
              return (
                <div
                  key={activity.id}
                  className="bg-gray-50 p-4 rounded-lg border border-gray-100 hover:border-gray-300 cursor-pointer transition-colors"
                  onClick={() => setSelectedActivity(activity)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{activity.link_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                        {activity.eventType}
                      </span>
                      {hasLocation && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          📍
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    Machine {activity.machine_id} • {new Date(activity.created_at).toLocaleString()}
                  </p>
                  {activity.depthMeters && (
                    <p className="text-sm text-blue-600 mt-1">Depth: {activity.depthMeters}m</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div> */}

              {/* Map */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 lg:h-[600px]">
                  <Wrapper apiKey={API_KEY} render={render}>
                    <MapComponent
                      markers={markers}
                      onMarkerClick={handleMarkerClick} />
                  </Wrapper>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Details Modal */}
        <ActivityDetails
          activity={selectedActivity}
          onClose={() =>setSelectedActivity(null)}
          
           />
      </div></>
  );
}

export default LiveTrack;