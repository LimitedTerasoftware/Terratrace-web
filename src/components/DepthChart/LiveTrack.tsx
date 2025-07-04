import React, { useState, useMemo } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { Satellite, RefreshCw } from 'lucide-react';
import MapComponent from './MapComponent';
import ActivityDetails from './ActivityDetails';
import StatsPanel from './StatsPanel';
import useActivities from '../hooks/useActivities';
import { Activity, MarkerData } from '../../types/survey';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Event type mapping for coordinates and photos
const EVENT_TYPE_MAPPING = {
  'DEPTH': { coordField: 'depthLatlong', photoField: 'depthPhoto' },
  'ROADCROSSING': { coordField: 'crossingLatlong', photoField: 'crossingPhotos' },
  'FPOI': { coordField: 'fpoiLatLong', photoField: 'fpoiPhotos' },
  'JOINTCHAMBER': { coordField: 'jointChamberLatLong', photoField: 'jointChamberPhotos' },
  'MANHOLE': { coordField: 'manholeLatLong', photoField: 'manholePhotos' },
  'ROUTEINDICATOR': { coordField: 'routeIndicatorLatLong', photoField: 'routeIndicatorPhotos' },
  'LANDMARK': { coordField: 'landmarkLatLong', photoField: 'landmarkPhotos' },
  'FIBERTURN': { coordField: 'fiberTurnLatLong', photoField: 'fiberTurnPhotos' },
  'KILOMETERSTONE': { coordField: 'kilometerstoneLatLong', photoField: 'kilometerstonePhotos' },
  'STARTPIT': { coordField: 'startPitLatlong', photoField: 'startPitPhotos' },
  'ENDPIT': { coordField: 'endPitLatlong', photoField: 'endPitPhotos' }
};

function LiveTrack() {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  const { activities, isLoading, error, refetch } = useActivities();

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Satellite className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Live Activity Tracker</h1>
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
          <StatsPanel activities={activities} isLoading={isLoading} />
                    
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
                    onMarkerClick={handleMarkerClick}
                  />
                </Wrapper>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Details Modal */}
      <ActivityDetails
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />
    </div>
  );
}

export default LiveTrack;