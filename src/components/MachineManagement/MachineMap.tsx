import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Wrapper, Status } from '@googlemaps/react-wrapper';
import { RefreshCw, Satellite } from 'lucide-react';
import { MachineApiResponse, MachineDataListItem } from '../../types/machine';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const baseUrl = import.meta.env.VITE_Image_URL;

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
  'HOLDSURVEY': { coordField: 'holdLatlong', photoField: 'holdPhotos' },
  'BLOWING': { coordField: 'blowingLatLong', photoField: 'blowingPhotos' },
};

const MapComponent: React.FC<{
  activities: MachineDataListItem[];
  getColorByRegistration: (registration: string | null | undefined) => string;
}> = ({ activities, getColorByRegistration }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  const parsePhotos = (photoString: string | null): string[] => {
    if (!photoString) return [];
    try {
      return JSON.parse(photoString);
    } catch {
      return photoString.split(',').map(p => p.trim());
    }
  };

  useEffect(() => {
    if (!mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 17.3882, lng: 78.4892 },
      zoom: 10,
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
  }, [map]);

  useEffect(() => {
    if (!map || activities.length === 0) return;

    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const path: google.maps.LatLngLiteral[] = [];

    activities.forEach((activity, index) => {
      const mapping = EVENT_TYPE_MAPPING[activity.eventType as keyof typeof EVENT_TYPE_MAPPING];
      if (!mapping) return;

      const coordField = mapping.coordField as keyof MachineDataListItem;
      const photoField = mapping.photoField as keyof MachineDataListItem;
      const coordinates = activity[coordField] as string;

      if (!coordinates) return;

      const [lat, lng] = coordinates.split(',').map(Number);
      const position = { lat, lng };
      path.push(position);

      const markerColor = getColorByRegistration(activity.machine_registration_number);
      const photos = parsePhotos(activity[photoField] as string | null);

      const marker = new google.maps.Marker({
        position,
        map,
        title: `${activity.eventType} - ${activity.machine_registration_number || 'N/A'}`,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        },
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${markerColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3" fill="${markerColor}"></circle>
            </svg>
          `)}`,
          scaledSize: new google.maps.Size(36, 36),
          anchor: new google.maps.Point(18, 36)
        }
      });

      const photoGallery = photos.length > 0 ? `
        <div style="margin-top: 8px;">
          <h4 style="margin: 0 0 4px 0; color: #374151; font-size: 12px; font-weight: 600;">Photos:</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 4px; max-width: 300px;">
            ${photos.slice(0, 6).map(photo => `
              <img src="${baseUrl}/${photo}"
                   style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer;"
                   onclick="window.open('${baseUrl}/${photo}', '_blank')"
                   onerror="this.style.display='none'" />
            `).join('')}
            ${photos.length > 6 ? `<div style="display: flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280;">+${photos.length - 6}</div>` : ''}
          </div>
        </div>
      ` : '';

      const infoContent = `
        <div style="padding: 12px; min-width: 300px; max-width: 400px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
            ${activity.eventType} 
          </h3>
          <div style="margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>Machine:</strong> ${activity.machine_registration_number}
            </p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>Firm:</strong> ${activity.firm_name}
            </p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>User:</strong> ${activity.user_name} (${activity.user_mobile})
            </p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>Location:</strong> ${activity.state_name}, ${activity.district_name}
            </p>
            ${activity.link_name ? `
              <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
                <strong>Link:</strong> ${activity.link_name}
              </p>
            ` : ''}
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
                <strong>Road Width:</strong> ${activity.roadWidth}m
              </p>
            ` : ''}
            ${activity.dgps_accuracy ? `
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;">
                <strong>GPS Accuracy:</strong> ${activity.dgps_accuracy}m
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
        infoWindow.open(map, marker);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    if (path.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);

      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom()! > 16) {
          map.setZoom(16);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, activities, getColorByRegistration]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};

const MachineMapPage: React.FC = () => {
  const [activities, setActivities] = useState<MachineDataListItem[]>([]);
  const [machineId, setMachineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorPalette = [
    '#2563eb', '#dc2626', '#059669', '#7c3aed', '#ea580c',
    '#0891b2', '#be185d', '#4338ca', '#65a30d', '#f59e0b',
    '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#6b7280',
  ];

  const getColorByRegistration = useCallback((() => {
    const colorMap: Record<string, string> = {};
    let colorIndex = 0;

    return (registration_number: string | null | undefined) => {
      if (!registration_number) return '#9ca3af';

      if (!colorMap[registration_number]) {
        colorMap[registration_number] = colorPalette[colorIndex % colorPalette.length];
        colorIndex++;
      }
      return colorMap[registration_number];
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
      const response = await fetch(`${TraceBASEURL}/get-depth-record`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MachineApiResponse = await response.json();

      if (data.status && data.data) {
        const validActivities = data.data.filter((activity:MachineDataListItem) => {
          if (machineId && Number(activity.machine_id) !== Number(machineId)) {
            return false;
          }

          const mapping = EVENT_TYPE_MAPPING[
            activity.eventType as keyof typeof EVENT_TYPE_MAPPING
          ];
          if (!mapping) return false;

          const coordField = mapping.coordField as keyof MachineDataListItem;
          const coordinates = activity[coordField] as string | null;

          return coordinates && coordinates.trim() !== '';
        });

        validActivities.sort((a:any, b:any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

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

    return <MapComponent activities={activities} getColorByRegistration={getColorByRegistration} />;
  };

  const machineInfo = activities.length > 0 ? activities[0] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Satellite className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Machine {machineId} - Route Map
              </h1>
              {machineInfo && (
                <p className="text-sm text-gray-600">
                  {machineInfo.machine_registration_number} - {machineInfo.firm_name}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={fetchMachineData}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-6 mt-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="px-6 pb-6 pt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] relative">
          <Wrapper apiKey={apiKey} render={render} />

          {activities.length > 0 && (
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs max-h-64 overflow-y-auto z-10">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Machines</h4>
              <div className="space-y-1">
                {Array.from(
                  new Map(
                    activities.map(a => [a.machine_registration_number, a])
                  ).values()
                ).map(machine => (
                  <div key={machine.machine_id} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: getColorByRegistration(
                          machine.machine_registration_number
                        ),
                      }}
                    ></div>
                    <span className="text-xs text-gray-700">
                      {machine.machine_registration_number}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-20">
              <div className="text-gray-600 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading machine route data...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineMapPage;
