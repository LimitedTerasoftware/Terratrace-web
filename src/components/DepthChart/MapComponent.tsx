import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  LiveMarkerData,
  MachineBlockKMLResponse,
  ConstructionPathResponse,
} from '../../types/survey';

interface MapComponentProps {
  markers: LiveMarkerData[];
  machineData: {
    [key: string]: {
      machine_id: number;
      registration_number: string;
      authorised_person: string;
      activities: Activity[];
    };
  };
  onMarkerClick: (activity: LiveMarkerData['activity']) => void;
  kmlData?: MachineBlockKMLResponse | null;
  constructionPathData?: ConstructionPathResponse | null;
}

const MapComponent: React.FC<MapComponentProps> = ({
  markers,
  machineData,
  onMarkerClick,
  kmlData,
  constructionPathData,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [googleMarkers, setGoogleMarkers] = useState<google.maps.Marker[]>([]);
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);
  const [constructionPolylines, setConstructionPolylines] = useState<
    google.maps.Polyline[]
  >([]);

  const isActive = (dateString: string) => {
    const today = new Date();
    const created = new Date(dateString);

    return (
      created.getDate() === today.getDate() &&
      created.getMonth() === today.getMonth() &&
      created.getFullYear() === today.getFullYear()
    );
  };
  const colorPalette = [
    '#2563eb',
    '#dc2626',
    '#059669',
    '#7c3aed',
    '#ea580c',
    '#0891b2',
    '#be185d',
    '#4338ca',
    '#65a30d',
    '#f59e0b',
    '#10b981',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#6b7280',
  ];

  const getColorByRegistration = (() => {
    const colorMap: Record<string, string> = {};
    let colorIndex = 0;

    return (registration_number: string | null | undefined) => {
      if (!registration_number) return '#9ca3af'; // default gray for missing

      if (!colorMap[registration_number]) {
        colorMap[registration_number] =
          colorPalette[colorIndex % colorPalette.length];
        colorIndex++;
      }
      return colorMap[registration_number];
    };
  })();

  useEffect(() => {
    if (!mapRef.current || !window.google) return;
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
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
    });

    setMap(newMap);
  }, []);
  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    googleMarkers.forEach((marker) => marker.setMap(null));

    // Create new markers
    const newMarkers = markers.map((markerData) => {
      const markerColor = isActive(markerData.activity.created_at)
        ? '#16a34a' // green
        : '#dc2626'; // red
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: map,
        title: `${markerData.activity.machine_registration_number} - ${markerData.activity.eventType}`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="${markerColor}">
            <path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 6.57 10.74 8.55 12.27a1.5 1.5 0 0 0 1.9 0C14.43 21.74 21 16.25 21 11c0-4.97-4.03-9-9-9z"/>
            <circle cx="12" cy="11" r="3" fill="white"/>
          </svg>
        `)}`,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 32),
        },
      });

      // Create info window with event type specific information
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
              ${markerData.activity.eventType}
            </h3>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
              <strong>Link:</strong> ${markerData.activity.link_name}
            </p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
              <strong>Machine:</strong> ${markerData.activity.machine_id}
            </p>
            <p style="margin: 0; color: #6b7280; font-size: 11px;">
              ${new Date(markerData.activity.created_at).toLocaleString()}
            </p>
            <div style="margin-top: 8px; text-align: center;">
              <button style="background: ${markerColor}; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                View Details
              </button>
            </div>
          </div>
        `,
      });
      marker.addListener('click', () => {
        // Close all other info windows
        googleMarkers.forEach((m) => {
          const iw = (m as any).infoWindow;
          if (iw) iw.close();
        });

        infoWindow.open(map, marker);
        onMarkerClick(markerData.activity);
      });

      // Store info window reference
      (marker as any).infoWindow = infoWindow;

      return marker;
    });

    setGoogleMarkers(newMarkers);

    // Adjust map bounds to fit all markers
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((marker) => bounds.extend(marker.position));
      map.fitBounds(bounds);

      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom()! > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, markers, onMarkerClick]);

  // Render KML polylines (proposed connections)
  useEffect(() => {
    if (!map) return;

    // Clear existing KML polylines
    polylines.forEach((polyline) => polyline.setMap(null));

    if (!kmlData?.data) {
      setPolylines([]);
      return;
    }

    const newPolylines: google.maps.Polyline[] = [];

    kmlData.data.forEach((blockData) => {
      blockData.kml_data.forEach((kml) => {
        kml.connections.forEach((connection) => {
          try {
            const coordinates = JSON.parse(connection.coordinates) as [
              number,
              number,
            ][];
            if (coordinates.length > 0) {
              const polyline = new google.maps.Polyline({
                path: coordinates.map((coord) => ({
                  lat: coord[0],
                  lng: coord[1],
                })),
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 0.8,
                strokeWeight: 4,
              });

              const infoWindow = new google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px; min-width: 200px;">
                    <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                      ${connection.original_name || 'Connection'}
                    </h3>
                    <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                      <strong>Length:</strong> ${connection.length} km
                    </p>
                    <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                      <strong>Type:</strong> ${connection.type}
                    </p>
                    <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                      <strong>Status:</strong> ${connection.status}
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 11px;">
                      <strong>Block:</strong> ${kml.blk_name}
                    </p>
                  </div>
                `,
              });

              polyline.addListener(
                'click',
                (event: google.maps.MapMouseEvent) => {
                  if (event.latLng) {
                    infoWindow.setPosition(event.latLng);
                    infoWindow.open(map);
                  }
                },
              );

              polyline.setMap(map);
              newPolylines.push(polyline);
            }
          } catch (e) {
            console.error('Error parsing coordinates:', e);
          }
        });
      });
    });

    setPolylines(newPolylines);
  }, [map, kmlData]);

  // Render construction path polylines (work done)
  useEffect(() => {
    if (!map) return;

    // Clear existing construction polylines
    constructionPolylines.forEach((polyline) => polyline.setMap(null));

    if (!constructionPathData?.data) {
      setConstructionPolylines([]);
      return;
    }

    const newPolylines: google.maps.Polyline[] = [];

    constructionPathData.data.forEach((block) => {
      block.surveys.forEach((survey) => {
        if (survey.coordinates.length > 0) {
          const polyline = new google.maps.Polyline({
            path: survey.coordinates.map((coord) => ({
              lat: coord[1],
              lng: coord[0],
            })),
            geodesic: true,
            strokeColor: '#10b981',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                  Construction Path
                </h3>
                <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                  <strong>Survey ID:</strong> ${survey.survey_id}
                </p>
                <p style="margin: 0; color: #4b5563; font-size: 12px;">
                  <strong>Machine ID:</strong> ${survey.machine_id}
                </p>
              </div>
            `,
          });

          polyline.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              infoWindow.setPosition(event.latLng);
              infoWindow.open(map);
            }
          });

          polyline.setMap(map);
          newPolylines.push(polyline);
        }
      });
    });

    setConstructionPolylines(newPolylines);
  }, [map, constructionPathData]);

  // Cleanup polylines on unmount
  useEffect(() => {
    return () => {
      polylines.forEach((polyline) => polyline.setMap(null));
      constructionPolylines.forEach((polyline) => polyline.setMap(null));
    };
  }, []);
  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      <div className="absolute top-20 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
        {/* Status Legend */}
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Status</h4>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span className="text-xs text-gray-700">Active (Today)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-xs text-gray-700">Inactive</span>
          </div>
        </div>

        {/* KML Legend */}
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Proposed Cable
          </h4>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#FF0000' }}
            ></div>
            <span className="text-xs text-gray-700">Planned Routes</span>
          </div>
        </div>

        {/* Construction Path Legend */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Work Done
          </h4>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#10b981' }}
            ></div>
            <span className="text-xs text-gray-700">Construction Path</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      {machineData && Object.keys(machineData).length > 0 && (
        <div className="absolute top-20 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Machine Id
          </h4>

          <div className="space-y-1">
            {Array.from(
              new Set(
                Object.values(machineData).map((m) => m.registration_number),
              ),
            ).map((regNumber) => (
              <div key={regNumber} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getColorByRegistration(regNumber) }}
                ></div>
                <span className="text-xs text-gray-700">
                  {regNumber.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default MapComponent;
