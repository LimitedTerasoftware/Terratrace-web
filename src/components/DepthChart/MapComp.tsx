import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Navigation, Filter, X, ZoomIn } from 'lucide-react';
import GoogleMapsLoader from '../hooks/googleMapsLoader';
import moment from 'moment';
import { Activity } from '../../types/survey';

interface MarkerData {
  lat: number;
  lng: number;
  eventType: string;
  id: number;
}
interface MapCompProps {
  data: MarkerData[];
  eventData?: Activity[];
}

// Event type configurations
const EVENT_TYPES = {
  STARTSURVEY: { color: '#10B981', icon: '🎯', label: 'Survey Start' },
  DEPTH: { color: '#3B82F6', icon: '📏', label: 'Depth' },
  ROADCROSSING: { color: '#F59E0B', icon: '🛣️', label: 'Road Crossing' },
  FPOI: { color: '#EF4444', icon: '📍', label: 'FPOI' },
  JOINTCHAMBER: { color: '#8B5CF6', icon: '🔧', label: 'Joint Chamber' },
  MANHOLES: { color: '#06B6D4', icon: '🕳️', label: 'Manholes' },
  ROUTEINDICATOR: { color: '#84CC16', icon: '🧭', label: 'Route Indicator' },
  LANDMARK: { color: '#F97316', icon: '🏛️', label: 'Landmark' },
  FIBERTURN: { color: '#EC4899', icon: '🔄', label: 'Fiber Turn' },
  KILOMETERSTONE: { color: '#6B7280', icon: '📏', label: 'Kilometer Stone' },
  STARTPIT: { color: '#14B8A6', icon: '🕳️', label: 'Start Pit' },
  ENDPIT: { color: '#DC2626', icon: '🏁', label: 'End Pit' },
  ENDSURVEY: { color: '#10B981', icon: '🎯', label: 'End Survey' },
  HOLDSURVEY: { color: '#a93226', icon: '⏸️', label: 'Hold Survey'},
};

const baseUrl = import.meta.env.VITE_Image_URL;

// InfoWindow Component
const InfoWindow: React.FC<{
  event: Activity;
  onClose: () => void;
  onImageClick: (url: string) => void;
}> = ({ event, onClose, onImageClick }) => {

  const eventPhotoFields: Record<string, keyof Activity> = {
    FPOI: "fpoiPhotos",
    DEPTH: "depthPhoto",
    JOINTCHAMBER: "jointChamberPhotos",
    MANHOLES: "manholePhotos",
    LANDMARK: "landmarkPhotos",
    KILOMETERSTONE: "kilometerstonePhotos",
    FIBERTURN: "fiberTurnPhotos",
    ROUTEINDICATOR: "routeIndicatorPhotos",
    STARTPIT: 'startPitPhotos',
    ENDPIT: 'endPitPhotos',
    STARTSURVEY: 'startPointPhoto',
    ROADCROSSING: 'crossingPhotos',
    ENDSURVEY:'endPointPhoto',
    HOLDSURVEY:'holdPhotos'
  };
  const getLatLongForEvent = (row: Activity) => {
          switch (row.eventType) {
              case "FPOI": return row.fpoiLatLong;
              case "DEPTH": return row.depthLatlong;
              case "JOINTCHAMBER": return row.jointChamberLatLong;
              case "MANHOLES": return row.manholeLatLong;
              case "LANDMARK": return row.landmarkLatLong;
              case "KILOMETERSTONE": return row.kilometerstoneLatLong;
              case "FIBERTURN": return row.fiberTurnLatLong;
              case "ROUTEINDICATOR": return row.routeIndicatorLatLong;
              case "STARTPIT": return row.startPitLatlong;
              case "ENDPIT": return row.endPitLatlong;
              case "STARTSURVEY": return row.startPointCoordinates;
              case "ENDSURVEY": return row.endPointCoordinates;
              case "ROADCROSSING": return row.crossingLatlong;
              case 'HOLDSURVEY':return row.holdLatlong;
              default: return null;
          }
      };
  

  const getEventPhotos = (event: Activity) => {
  const photoField = eventPhotoFields[event.eventType];
  const rawPhotoData = photoField ? event[photoField] : null;

  if (typeof rawPhotoData === "string" && rawPhotoData.trim() !== "") {
    try {
      const parsed = JSON.parse(rawPhotoData);

      // If it's a valid array, return it
      if (Array.isArray(parsed)) {
        return parsed.filter((p: string) => typeof p === 'string' && p.trim() !== '');
      }

      // If it's a string inside JSON (like just `"uploads/..."`), return as array
      if (typeof parsed === 'string') {
        return [parsed];
      }
    } catch {
      // If it's not valid JSON (just a raw path), return it as a one-item array
      return [rawPhotoData.trim()];
    }
  }

  return [];
};
  const photos = getEventPhotos(event);
  const eventConfig = EVENT_TYPES[event.eventType as keyof typeof EVENT_TYPES];

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-sm w-80 max-h-96 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{eventConfig?.icon}</span>
            <h3 className="font-semibold text-sm">{eventConfig?.label}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className="p-4 max-h-80 overflow-y-auto">
        <div className="space-y-3">
          {event.machine_registration_number && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Machine Id:</span>
              <span className="font-medium text-sm">{event.machine_registration_number}</span>
            </div>
          )}
           {event.firm_name && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Firm Name:</span>
              <span className="font-medium text-sm">{event.firm_name}</span>
            </div>
          )}
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Coordinates:</span>
              <span className="font-medium text-sm">{getLatLongForEvent(event)}</span>
            </div>
          
         
          {event.depthMeters && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Depth:</span>
              <span className="font-medium text-sm">{event.depthMeters}m</span>
            </div>
          )}
          
          {event.distance && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Distance:</span>
              <span className="font-medium text-sm">{event.distance}</span>
            </div>
          )}
          
          {event.soilType && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Soil Type:</span>
              <span className="font-medium text-sm">{event.soilType}</span>
            </div>
          )}
          
          {event.roadType && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Road Type:</span>
              <span className="font-medium text-sm">{event.roadType}</span>
            </div>
          )}
           {event.landmark_type && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Land Mark Type:</span>
              <span className="font-medium text-sm">{event.landmark_type}</span>
            </div>
          )}
          {event.landmark_description && (
            <div className="flex justify-between">
              <span className="text-gray-600 text-sm">Land Mark Description:</span>
              <span className="font-medium text-sm">{event.landmark_description}</span>
            </div>
          )}
        
          
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">Created:</span>
            <span className="font-medium text-sm">
              {moment(event.created_at).format("DD/MM/YYYY, hh:mm A")}
            </span>
          </div>
          
          {photos.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Photos:</h4>
              <div className="grid grid-cols-2 gap-2">
                {photos.slice(0, 5).map((photo: string, idx: number) => (
                  <div
                    key={idx}
                    className="relative aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onImageClick(`${baseUrl}${photo}`)}
                  >
                    <img
                      src={`${baseUrl}${photo}`}
                      alt={`${event.eventType} photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                      <ZoomIn className="text-white opacity-0 hover:opacity-100 transition-opacity" size={16} />
                    </div>
                  </div>
                ))}
              </div>
              {photos.length > 5 && (
                <p className="text-xs text-gray-500 mt-1">
                  +{photos.length - 5} more photos
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading Component
const LoadingComponent: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading Google Maps...</p>
    </div>
  </div>
);

// Error Component
const ErrorComponent: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <p className="text-red-500 font-medium">Error loading Google Maps</p>
      <p className="text-sm text-gray-500 mt-1">{message}</p>
     
    </div>
  </div>
);

// Map Component
const MapComponent: React.FC<MapCompProps> = ({ data, eventData = [] }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Activity | null>(null);
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<string>>(
    // new Set(Object.keys(EVENT_TYPES))
      new Set(['DEPTH', 'STARTPIT', 'ENDPIT']));
  const [showPolylines, setShowPolylines] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Initialize map
  useEffect(() => {
    if (!mapRef.current || map) return;
      
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: data.length > 0 ? { lat: data[0].lat, lng: data[0].lng } : { lat: 20.5937, lng: 78.9629 },
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    setMap(mapInstance);
  }, [data, map]);

  // Create markers
  useEffect(() => {
   
    if (!map || !data.length) {
      markers.forEach(mark => mark.setMap(null));
      setMarkers([]);
      return;
    }
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    
    const newMarkers: google.maps.Marker[] = [];

    const visibleData = data.filter(point => visibleEventTypes.has(point.eventType));

    visibleData.forEach((point,index) => {
      const eventConfig = EVENT_TYPES[point.eventType as keyof typeof EVENT_TYPES];
      const eventDetails = eventData.find(e => e.id === point.id);
      if (!eventConfig || !visibleEventTypes.has(point.eventType)) return;
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        title: `${eventConfig.label} - ${point.eventType}`,
        label: {
          text:  (index + 1).toString(),
          color: 'black',
          fontSize: '12px',
          fontWeight: 'bold'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: eventConfig.color,
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        animation: google.maps.Animation.DROP,
      });

      // Add click event
      marker.addListener('click', () => {
        if (eventDetails) {
          setSelectedEvent(eventDetails);
        }
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const pos = marker.getPosition();
        if (pos) bounds.extend(pos);
      });
      map.fitBounds(bounds);
    }

  }, [map, data, visibleEventTypes, eventData]);

  // Create polylines
  useEffect(() => {
    if (!map || !data.length || !showPolylines) {
      polylines.forEach(polyline => polyline.setMap(null));
      setPolylines([]);
      return;
    }
     const hasVisibleEvents = data.some(point => visibleEventTypes.has(point.eventType));

    // Clear existing polylines
    polylines.forEach(polyline => polyline.setMap(null));

     if (!hasVisibleEvents) {
      setPolylines([]);
      return;
    }
    // Sort data by creation time or distance to create proper route
    const sortedData = [...data].sort((a, b) => {
      const eventA = eventData.find(e => e.id === a.id);
      const eventB = eventData.find(e => e.id === b.id);
      
      if (eventA?.created_at && eventB?.created_at) {
        return new Date(eventA.created_at).getTime() - new Date(eventB.created_at).getTime();
      }
      return 0;
    });

    const path = sortedData
      // .filter(point => visibleEventTypes.has(point.eventType))
      .map(point => ({ lat: point.lat, lng: point.lng }));

    if (path.length > 1 ) {
      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: map,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 4,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 1,
            },
            offset: '0%',
            repeat: '10%',
          },
        ],
      });

      setPolylines([polyline]);
    }
  }, [map, data, visibleEventTypes, showPolylines, eventData]);

  // Toggle event type visibility
  const toggleEventType = (eventType: string) => {
    const newVisibleTypes = new Set(visibleEventTypes);
    if (newVisibleTypes.has(eventType)) {
      newVisibleTypes.delete(eventType);
    } else {
      newVisibleTypes.add(eventType);
    }
    setVisibleEventTypes(newVisibleTypes);
  };

  // Toggle all event types
  const toggleAllEventTypes = () => {
    if (visibleEventTypes.size === Object.keys(EVENT_TYPES).length) {
      setVisibleEventTypes(new Set());
    } else {
      setVisibleEventTypes(new Set(Object.keys(EVENT_TYPES)));
    }
  };

  // Close event window
  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      showFilters &&
      filterRef.current &&
      !filterRef.current.contains(event.target as Node)
    ) {
      setShowFilters(false);
    }
  }

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showFilters]);


  const getEventTypeCount = (eventType: string) => {
    return data.filter(point => point.eventType === eventType).length;
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full rounded-lg shadow-lg" />

      {/* Controls */}
      <div   ref={filterRef} className="absolute top-2 right-10 z-10">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              <Filter size={14} />
              Filters
            </button>
            <button
              onClick={() => setShowPolylines(!showPolylines)}
              className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors text-sm ${
                showPolylines 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Navigation size={14} />
              Routes
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 rounded-md p-3 max-h-80 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-700">Event Types</h4>
                <button
                  onClick={toggleAllEventTypes}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {visibleEventTypes.size === Object.keys(EVENT_TYPES).length ? 'Show All' : 'Hide All'}
                </button>
              </div>
              
              <div className="space-y-1">
                {Object.entries(EVENT_TYPES).map(([eventType, config]) => {
                  const count = getEventTypeCount(eventType);
                  const isVisible = visibleEventTypes.has(eventType);
                  
                  return (
                    <div
                      key={eventType}
                      className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer"
                      onClick={() => toggleEventType(eventType)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                          <span className="text-sm">{config.icon}</span>
                        </div>
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">({count})</span>
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: isVisible ? config.color : 'transparent' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events Data */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Events</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(EVENT_TYPES).map(([eventType, config]) => {
              const count = getEventTypeCount(eventType);
              const isVisible = visibleEventTypes.has(eventType);
              
              if (count === 0) return null;
              
              return (
                <div
                  key={eventType}
                  className={`flex items-center gap-1 ${isVisible ? 'opacity-100' : 'opacity-50'}`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span>{config.label} ({count})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* InfoWindow */}
      {selectedEvent && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <InfoWindow
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onImageClick={setZoomImage}
          />
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-4xl max-h-4xl p-4">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-2 right-2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
            >
              <X size={20} />
            </button>
            <img
              src={zoomImage}
              alt="Zoomed"
              className="max-w-full max-h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Main component with proper loading management
const MapComp: React.FC<MapCompProps> = ({ data, eventData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    const apiKey =  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API key is not configured');
      setIsLoading(false);
      return;
    }

    const loader = GoogleMapsLoader.getInstance();
    
    loader.loadGoogleMaps(apiKey, ['places'])
      .then(() => {
        setIsMapReady(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load Google Maps');
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <ErrorComponent message={error} />;
  }

  if (!isMapReady) {
    return <LoadingComponent />;
  }

  return <MapComponent data={data} eventData={eventData} />;
};

export default MapComp;