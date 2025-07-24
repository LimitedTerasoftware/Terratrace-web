import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, MapPin, Ruler, Clock, TrendingUp, Eye, EyeOff, Navigation, ChevronDown, X } from 'lucide-react';
import { Activity } from '../../types/survey';

interface MachineRouteMapProps {
  machineId: string;
}

interface MachineData {
  status: boolean;
  data: Activity[];
}

 const BASEURL_Val = import.meta.env.VITE_API_BASE;
 const baseUrl = import.meta.env.VITE_Image_URL;
 const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

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
  'HOLDSURVEY': { coordField: 'holdLatlong', photoField: 'holdPhotos' },};

const MachineRouteMap: React.FC<MachineRouteMapProps> = ({ machineId }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [arrowMarkers, setArrowMarkers] = useState<google.maps.Marker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<google.maps.Marker | null>(null);
  const [openInfoWindow, setOpenInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  
  // Filter states
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<string>>(new Set());
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [depthEventsDistance, setDepthEventsDistance] = useState<number | null>(null);
  const [firstDepthMarker, setFirstDepthMarker] = useState<google.maps.Marker | null>(null);
  const [lastDepthMarker, setLastDepthMarker] = useState<google.maps.Marker | null>(null);
  const [depthEventsLine, setDepthEventsLine] = useState<google.maps.Polyline | null>(null);

  // Event type colors for markers
  const getMarkerColor = (eventType: string) => {
     const colors = {
      'DEPTH': '#2563eb',
      'ROADCROSSING': '#dc2626',
      'FPOI': '#059669',
      'JOINTCHAMBER': '#7c3aed',
      'MANHOLES': '#ea580c',
      'ROUTEINDICATOR': '#0891b2',
      'LANDMARK': '#be185d',
      'FIBERTURN': '#4338ca',
      'KILOMETERSTONE': '#65a30d',
      "ENDPIT":'#ea580c',
      "STARTPIT":'#ea580c',
      'STARTSURVEY':'#dc2626',
      'ENDSURVEY':'#dc2626',
      'HOLDSURVEY':'#a93226',

    };
    return colors[eventType as keyof typeof colors] || '#6b7280';
  };

  const parsePhotos = (photoString: string | null): string[] => {
    if (!photoString) return [];
    try {
      return JSON.parse(photoString);
    } catch {
      return photoString.split(',').map(p => p.trim());
    }
  };

  const fetchMachineData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${TraceBASEURL}/get-filtered-data?machine_id=${machineId}&from_date=${today}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MachineData = await response.json();
      
      if (data.status && data.data) {
        // Filter activities that have valid coordinates
        const validActivities = data.data.filter(activity => {
          const mapping = EVENT_TYPE_MAPPING[activity.eventType as keyof typeof EVENT_TYPE_MAPPING];
          if (!mapping) return false;
          
          const coordField = mapping.coordField as keyof Activity;
          const coordinates = activity[coordField] as string | null;
          
          return coordinates && coordinates.trim() !== '';
        });

        // Sort by creation time
        validActivities.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        setActivities(validActivities);
        
        // Initialize all event types as visible
        // const eventTypes = new Set(validActivities.map(a => a.eventType));
         const eventTypes = new Set(['DEPTH', 'STARTPIT', 'ENDPIT']);
        setVisibleEventTypes(eventTypes);
      } else {
        setActivities([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };



  // Toggle event type visibility
  const toggleEventType = (eventType: string) => {
    const newVisibleTypes = new Set(visibleEventTypes);
    if (newVisibleTypes.has(eventType)) {
      newVisibleTypes.delete(eventType);
    } else {
      newVisibleTypes.add(eventType);
    }
    setVisibleEventTypes(newVisibleTypes);
    setIsFilterDropdownOpen(false);
  };

  const handleMarkerClick = (activity: Activity, marker: google.maps.Marker) => {
    // Close previous info window
    if (openInfoWindow) {
      openInfoWindow.close();
    }
     setSelectedMarker(marker);
    
    // Create and show info window
    const mapping = EVENT_TYPE_MAPPING[activity.eventType as keyof typeof EVENT_TYPE_MAPPING];
    const photoField = mapping?.photoField as keyof Activity;
    const photos = parsePhotos(activity[photoField] as string | null);
    
    const photoGallery = photos.length > 0 ? `
      <div style="margin-top: 8px;">
        <h4 style="margin: 0 0 4px 0; color: #374151; font-size: 12px; font-weight: 600;">Photos:</h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 4px; max-width: 250px;">
          ${photos.slice(0, 4).map(photo => `
            <img src="${baseUrl}/${photo}" 
                 style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer;"
                 onclick="window.open('${baseUrl}/${photo}', '_blank')"
                 onerror="this.style.display='none'" />
          `).join('')}
          ${photos.length > 4 ? `<div style="display: flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280;">+${photos.length - 4}</div>` : ''}
        </div>
      </div>
    ` : '';

    const infoContent = `
      <div style="padding: 12px; min-width: 250px; max-width: 300px;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
          ${activity.eventType} #${activities.indexOf(activity) + 1}
        </h3>
        <div style="margin-bottom: 8px;">
          <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
            <strong>Link:</strong> ${activity.start_lgd_name}-${activity.end_lgd_name}
          </p>
          <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
            <strong>Survey ID:</strong> ${activity.survey_id}
          </p>
          ${activity.depthMeters ? `
            <p style="margin: 0 0 4px 0; color: #2563eb; font-size: 13px; font-weight: 600;">
              <strong>Depth:</strong> ${activity.depthMeters}m
            </p>
          ` : ''}
          ${activity.crossingLength ? `
            <p style="margin: 0 0 4px 0; color: #dc2626; font-size: 13px; font-weight: 600;">
              <strong>Crossing Length:</strong> ${activity.crossingLength}
            </p>
          ` : ''}
          ${activity.roadWidth ? `
            <p style="margin: 0 0 4px 0; color: #059669; font-size: 13px; font-weight: 600;">
              <strong>Road Width:</strong> ${activity.roadWidth}
            </p>
          ` : ''}
        </div>
        <p style="margin: 0; color: #6b7280; font-size: 11px;">
          ${new Date(activity.created_at).toLocaleString()}
        </p>
        ${photoGallery}
      </div>
    `;

    const infoWindow = new google.maps.InfoWindow({
      content: infoContent
    });
    
    setOpenInfoWindow(infoWindow);
    infoWindow.open(map, marker);
  };

  useEffect(() => {
    fetchMachineData();
  }, [machineId]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 17.3882, lng: 78.4892 },
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


    setMap(newMap);
  }, []);

// Calculate distance between first and last DEPTH events and highlight them
  useEffect(() => {
    if (!map || activities.length === 0) return;

    // Clear previous DEPTH event markers and line
    if (firstDepthMarker) firstDepthMarker.setMap(null);
    if (lastDepthMarker) lastDepthMarker.setMap(null);
    if (depthEventsLine) depthEventsLine.setMap(null);

    // Get all DEPTH events sorted by creation time
    const depthEvents = activities
      .filter(a => a.eventType === 'DEPTH')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    if (depthEvents.length >= 2) {
      const depthMapping = EVENT_TYPE_MAPPING['DEPTH'];
      const coordField = depthMapping.coordField as keyof Activity;
      
      // Calculate total distance through all DEPTH events
      let totalDepthDistance = 0;
      const depthPath: google.maps.LatLngLiteral[] = [];
      
      // Build path and calculate cumulative distance
      for (let i = 0; i < depthEvents.length; i++) {
        const coords = depthEvents[i][coordField] as string;
        if (coords) {
          const [lat, lng] = coords.split(',').map(Number);
          const position = { lat, lng };
          depthPath.push(position);
          
          // Calculate distance from previous point
          if (i > 0) {
            const prevPosition = depthPath[i - 1];
            totalDepthDistance += calculateDistance(
              prevPosition.lat, prevPosition.lng, 
              position.lat, position.lng
            );
          }
        }
      }
      
      setDepthEventsDistance(totalDepthDistance);
    } else {
      setDepthEventsDistance(null);
    }
  }, [map, activities]);


  useEffect(() => {
    if (!map || activities.length === 0) return;

    // Clear existing markers, polyline, arrows, and labels
    markers.forEach(marker => marker.setMap(null));
    arrowMarkers.forEach(marker => marker.setMap(null));
    if (polyline) polyline.setMap(null);
    if (openInfoWindow) openInfoWindow.close();

    // Filter activities based on visibility
    const visibleActivities = activities.filter(activity => 
      visibleEventTypes.has(activity.eventType)
    );

    const newMarkers: google.maps.Marker[] = [];
    const newArrowMarkers: google.maps.Marker[] = [];
    const newLabelMarkers: google.maps.Marker[] = [];
    const path: google.maps.LatLngLiteral[] = [];
    let distance = 0;

    visibleActivities.forEach((activity, index) => {
      const mapping = EVENT_TYPE_MAPPING[activity.eventType as keyof typeof EVENT_TYPE_MAPPING];
      if (!mapping) return;

      const coordField = mapping.coordField as keyof Activity;
      const photoField = mapping.photoField as keyof Activity;
      const coordinates = activity[coordField] as string;
      const [lat, lng] = coordinates.split(',').map(Number);
      
      const position = { lat, lng };
      path.push(position);

      // Calculate distance from previous point
      if (index > 0) {
        const prevPosition = path[index - 1];
        distance += calculateDistance(prevPosition.lat, prevPosition.lng, lat, lng);
      }

      const markerColor = getMarkerColor(activity.eventType);
      const photos = parsePhotos(activity[photoField] as string | null);
      
      const marker = new google.maps.Marker({
        position,
        map,
        title: `${activity.eventType} - ${activity.start_lgd_name}-${activity.end_lgd_name}`,
        label: {
          text: (activities.indexOf(activity) + 1).toString(),
          color: 'black',
          fontSize: '12px',
          fontWeight: 'bold'
        },
        icon: {
          // url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          //   <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${markerColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          //     <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          //     <circle cx="12" cy="10" r="3" fill="${markerColor}"></circle>
          //   </svg>
          // `)}`,
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="${markerColor}">
            <path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 6.57 10.74 8.55 12.27a1.5 1.5 0 0 0 1.9 0C14.43 21.74 21 16.25 21 11c0-4.97-4.03-9-9-9z"/>
            <circle cx="12" cy="11" r="3" fill="white"/>
          </svg>
        `)}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 36)
        }
      });

      // Create detailed info window with images
      const photoGallery = photos.length > 0 ? `
        <div style="margin-top: 8px;">
          <h4 style="margin: 0 0 4px 0; color: #374151; font-size: 12px; font-weight: 600;">Photos:</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 4px; max-width: 250px;">
            ${photos.slice(0, 4).map(photo => `
              <img src="${baseUrl}/${photo}" 
                   style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer;"
                   onclick="window.open('${baseUrl}/${photo}', '_blank')"
                   onerror="this.style.display='none'" />
            `).join('')}
            ${photos.length > 4 ? `<div style="display: flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280;">+${photos.length - 4}</div>` : ''}
          </div>
        </div>
      ` : '';

      const infoContent = `
        <div style="padding: 12px; min-width: 250px; max-width: 300px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
            ${activity.eventType} #${activities.indexOf(activity) + 1}
          </h3>
          <div style="margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>Link:</strong> ${activity.start_lgd_name}-${activity.end_lgd_name}
            </p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>Survey ID:</strong> ${activity.survey_id}
            </p>
            ${activity.depthMeters ? `
              <p style="margin: 0 0 4px 0; color: #2563eb; font-size: 13px; font-weight: 600;">
                <strong>Depth:</strong> ${activity.depthMeters}m
              </p>
            ` : ''}
            ${activity.crossingLength ? `
              <p style="margin: 0 0 4px 0; color: #dc2626; font-size: 13px; font-weight: 600;">
                <strong>Crossing Length:</strong> ${activity.crossingLength}
              </p>
            ` : ''}
            ${activity.roadWidth ? `
              <p style="margin: 0 0 4px 0; color: #059669; font-size: 13px; font-weight: 600;">
                <strong>Road Width:</strong> ${activity.roadWidth}
              </p>
            ` : ''}
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 11px;">
            ${new Date(activity.created_at).toLocaleString()}
          </p>
          ${photoGallery}
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        handleMarkerClick(activity, marker);
      });

      (marker as any).activity = activity;
      newMarkers.push(marker);
    });

    // Create polyline connecting all visible points with distance and depth labels
    if (path.length > 1) {
      const newPolyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map,
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
      setPolyline(newPolyline);
    }

    setMarkers(newMarkers);
    setArrowMarkers(newArrowMarkers);
    setTotalDistance(distance);

    // Fit map to show all visible markers
    if (path.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom()! > 16) {
          map.setZoom(16);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, activities, visibleEventTypes]);

  const depthActivities = activities.filter(a => a.eventType === 'DEPTH' && a.depthMeters);
  const averageDepth = depthActivities.length > 0 
    ? depthActivities.reduce((sum, a) => sum + parseFloat(a.depthMeters || '0'), 0) / depthActivities.length 
    : 0;

  const uniqueEventTypes = Array.from(new Set(activities.map(a => a.eventType)));

  return (
    <div className="h-full flex flex-col">
      {/* Stats Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Events</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{activities.length}</p>
          </div>
          
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Total Distance</span>
            </div>
            {/* <p className="text-lg font-bold text-gray-900">{totalDistance.toFixed(2)} km</p> */}
             <p className="text-lg font-bold text-gray-900">
              {depthEventsDistance ? `${depthEventsDistance.toFixed(2)} km` : 0}
            </p>
          </div>
          
          {/* <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Depth Events Distance</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {depthEventsDistance ? `${depthEventsDistance.toFixed(2)} km` : 'N/A'}
            </p>
          </div> */}
           <div className="bg-white p-3 rounded-lg border border-gray-200">
           <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Avg Depth</span>
            </div>
             <p className="text-lg font-bold text-gray-900">
               {averageDepth > 0 ? `${averageDepth.toFixed(1)}m` : '0'}
             </p>
         </div> 
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-600">Duration</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {activities.length > 0 ? 
                `${Math.ceil((new Date(activities[activities.length - 1].created_at).getTime() - 
                new Date(activities[0].created_at).getTime()) / (1000 * 60 * 60))}h` : 0}
            </p>
          </div>
        </div>


        {/* Event Type Filters */}
        <div className="mt-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            <button
              onClick={fetchMachineData}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </div>
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
            >
              <Eye className="h-4 w-4" />
              Filter Events ({visibleEventTypes.size}/{uniqueEventTypes.length})
              <ChevronDown className={`h-4 w-4 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {isFilterDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Select Event Types</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVisibleEventTypes(new Set(uniqueEventTypes))}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => setVisibleEventTypes(new Set())}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Hide All
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {uniqueEventTypes.map(eventType => {
                    const isVisible = visibleEventTypes.has(eventType);
                    const count = activities.filter(a => a.eventType === eventType).length;
                    return (
                      <label
                        key={eventType}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleEventType(eventType)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getMarkerColor(eventType) }}
                            ></div>
                            <span className="text-sm text-gray-700">{eventType.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Filter Chips */}
        {/* <div className="mt-3 flex flex-wrap gap-2">
          {Array.from(visibleEventTypes).map(eventType => (
            <span
              key={eventType}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getMarkerColor(eventType) }}
            >
              {eventType.replace('_', ' ')}
              <button
                onClick={() => toggleEventType(eventType)}
                className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {visibleEventTypes.size === 0 && (
            <span className="text-sm text-gray-500 italic">No event types selected</span>
          )}
        </div> */}
        
     
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Legend */}
        {activities.length > 0 && (
          <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs max-h-64 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Route Events</h4>
            <div className="space-y-1">
              {uniqueEventTypes.map(eventType => {
                const count = activities.filter(a => a.eventType === eventType).length;
                const isVisible = visibleEventTypes.has(eventType);
                return (
                  <div key={eventType} className={`flex items-center justify-between gap-2 ${!isVisible ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getMarkerColor(eventType) }}
                      ></div>
                      <span className="text-xs text-gray-700">{eventType.replace('_', ' ')}</span>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
            
            {depthActivities.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-1">Depth Measurements</h5>
                <div className="space-y-1">
                  {depthActivities.slice(0, 3).map((activity, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      Point {activities.indexOf(activity) + 1}: {activity.depthMeters}m
                    </div>
                  ))}
                  {depthActivities.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{depthActivities.length - 3} more...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-gray-600 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading machine route data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MachineRouteMap;