import React, { useState } from 'react';
import { X, MapPin, Calendar, Camera, Info, Ruler, ArrowRight ,Route} from 'lucide-react';
import { Activity } from '../../types/survey';
import MachineRouteMap from './MachineRouteMap';

interface ActivityDetailsProps {
  activity: Activity | null;
  onClose: () => void;
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
const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;

const ActivityDetails: React.FC<ActivityDetailsProps> = ({ activity, onClose }) => {
  const [showRouteMap, setShowRouteMap] = useState(false);
  if (!activity) return null;


  const parsePhotos = (photoString: string | null): string[] => {
    if (!photoString) return [];
    try {
      return JSON.parse(photoString);
    } catch {
      return photoString.split(',').map(p => p.trim());
    }
  };

  const getCoordinates = (coordString: string | null) => {
    if (!coordString) return null;
    const [lat, lng] = coordString.split(',');
    return { lat: parseFloat(lat), lng: parseFloat(lng) };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get the appropriate fields based on event type
  const mapping = EVENT_TYPE_MAPPING[activity.eventType as keyof typeof EVENT_TYPE_MAPPING];
  let photos: string[] = [];
  let coordinates = null;

  if (mapping) {
    const photoField = mapping.photoField as keyof Activity;
    const coordField = mapping.coordField as keyof Activity;
    
    photos = parsePhotos(activity[photoField] as string | null);
    coordinates = getCoordinates(activity[coordField] as string | null);
  }

if (showRouteMap) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-[1250px] max-h-[95vh] overflow-hidden">
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Route className="h-5 w-5 text-blue-600" />
              Machine {activity.registration_number} - Complete Route
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRouteMap(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Back to Details
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="h-full">
            <MachineRouteMap machineId={activity.machine_id} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Activity Details - {activity.eventType}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
                    {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowRouteMap(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Route className="h-4 w-4" />
              View Complete Route
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Link Name</h3>
              <p className="text-gray-900 font-semibold">{activity.start_lgd_name}-{activity.end_lgd_name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Event Type</h3>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                {activity.eventType}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Machine ID</h3>
              <p className="text-gray-900">{activity.registration_number}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Contractor Details</h3>
              <p className="text-gray-900">{activity.authorised_person}</p>
            </div>
          </div>

          {/* Location Information */}
          {coordinates && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {activity.eventType} Location Coordinates
              </h3>
              <p className="text-gray-900">
                Latitude: {coordinates.lat.toFixed(6)}, Longitude: {coordinates.lng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Event-specific Information */}
          {activity.eventType === 'DEPTH' && activity.depthMeters && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Depth Measurement
              </h3>
              <p className="text-gray-900 text-lg font-semibold">{activity.depthMeters} meters</p>
            </div>
          )}

          {activity.eventType === 'ROADCROSSING' && activity.crossingLength && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Crossing Length</h3>
              <p className="text-gray-900 text-lg font-semibold">{activity.crossingLength}</p>
            </div>
          )}

          {activity.eventType === 'ROADCROSSING' && activity.crossingType && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Crossing Type</h3>
              <p className="text-gray-900">{activity.crossingType}</p>
            </div>
          )}

          {/* Construction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activity.soilType && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Soil Type</h3>
                <p className="text-gray-900">{activity.soilType}</p>
              </div>
            )}
            {activity.roadType && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Road Type</h3>
                <p className="text-gray-900">{activity.roadType}</p>
              </div>
            )}
          </div>

          {/* Photos */}
          {photos.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-4 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                {activity.eventType} Photos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={`${baseUrl}${photo}`}
                      alt={`${activity.eventType} photo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDE2IDggMTQuMjEgOCAxMlM5Ljc5IDggMTIgOFMxNiA5Ljc5IDE2IDEyUzE0LjIxIDE2IDEyIDE2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created At
              </h3>
              <p className="text-gray-900">{formatDate(activity.created_at)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Updated At
              </h3>
              <p className="text-gray-900">{formatDate(activity.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetails;