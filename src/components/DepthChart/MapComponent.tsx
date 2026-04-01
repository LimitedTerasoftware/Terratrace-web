import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  LiveMarkerData,
  MachineBlockKMLResponse,
  ConstructionPathResponse,
} from '../../types/survey';
import { useNavigate } from 'react-router-dom';

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
  const [kmlPointMarkers, setKmlPointMarkers] = useState<google.maps.Marker[]>(
    [],
  );
  const [constructionPolylines, setConstructionPolylines] = useState<
    google.maps.Polyline[]
  >([]);
  const navigate = useNavigate();

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
        // icon: {

        //   url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        //   <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="${markerColor}">
        //     <path d="M12 2C7.03 2 3 6.03 3 11c0 5.25 6.57 10.74 8.55 12.27a1.5 1.5 0 0 0 1.9 0C14.43 21.74 21 16.25 21 11c0-4.97-4.03-9-9-9z"/>
        //     <circle cx="12" cy="11" r="3" fill="white"/>
        //   </svg>
        // `)}`,
        //   scaledSize: new google.maps.Size(32, 32),
        //   anchor: new google.maps.Point(16, 32),
        // },
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg fill="${markerColor}" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 777.891 777.891" xml:space="preserve" stroke="#000000">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M357.265,729.213c9.996,0,18.127-8.137,18.127-18.129c0-9.994-8.131-18.125-18.127-18.125 c-9.998,0-18.129,8.131-18.129,18.125S347.267,729.213,357.265,729.213z"></path> <path d="M235.593,727.059c8.812,0,15.971-7.162,15.971-15.975c0-8.816-7.158-15.973-15.971-15.973s-15.975,7.154-15.975,15.973 C219.619,719.896,226.781,727.059,235.593,727.059z"></path> <path d="M484.125,727.059c8.812,0,15.969-7.162,15.969-15.975c0-8.816-7.154-15.973-15.969-15.973 c-8.816,0-15.977,7.154-15.977,15.973C468.15,719.896,475.311,727.059,484.125,727.059z"></path> <path d="M101.828,727.059c8.812,0,15.973-7.162,15.973-15.975c0-8.816-7.16-15.973-15.973-15.973s-15.968,7.154-15.968,15.973 C85.86,719.896,93.014,727.059,101.828,727.059z"></path> <path d="M646.572,777.1v-4.365c30.609-3.838,54.363-30.021,54.363-61.648c0-31.625-23.754-57.812-54.363-61.646v-4.371H54.369 v4.371c-30.613,3.836-54.368,30.021-54.368,61.646c0,31.627,23.755,57.811,54.368,61.646v4.365h592.203V777.1z M101.828,679.582 c14.672,0,26.926,10.131,30.416,23.734h72.934c3.477-13.604,15.73-23.734,30.416-23.734c14.68,0,26.938,10.131,30.414,23.734 h58.58c3.539-14.818,16.807-25.891,32.678-25.891c15.863,0,29.137,11.072,32.669,25.891h63.771 c3.475-13.604,15.732-23.734,30.418-23.734c14.682,0,26.936,10.131,30.414,23.734h64.709c3.486-13.604,15.742-23.734,30.43-23.734 c17.387,0,31.508,14.137,31.508,31.504s-14.121,31.506-31.508,31.506c-14.688,0-26.941-10.131-30.43-23.742h-64.709 c-3.48,13.611-15.732,23.742-30.414,23.742c-14.686,0-26.943-10.131-30.418-23.742h-63.771 c-3.533,14.826-16.806,25.896-32.669,25.896c-15.871,0-29.139-11.068-32.678-25.896h-58.58 c-3.477,13.611-15.734,23.742-30.414,23.742c-14.686,0-26.939-10.131-30.416-23.742h-72.934 c-3.49,13.611-15.744,23.742-30.416,23.742c-17.365,0-31.5-14.139-31.5-31.506C70.328,693.717,84.462,679.582,101.828,679.582z"></path> <path d="M609.678,727.059c8.801,0,15.975-7.162,15.975-15.975c0-8.816-7.174-15.973-15.975-15.973 c-8.799,0-15.975,7.154-15.975,15.973C593.705,719.896,600.879,727.059,609.678,727.059z"></path> <path d="M750.586,8.557c0-0.029-0.021-0.044-0.021-0.078c0-0.226-0.09-0.438-0.104-0.666c-0.051-0.439-0.152-0.861-0.275-1.304 c-0.074-0.239-0.029-0.499-0.135-0.741c0-0.033-0.031-0.063-0.061-0.091c-0.02-0.06-0.02-0.123-0.033-0.17 c-0.09-0.208-0.271-0.36-0.379-0.56c-0.104-0.185-0.104-0.392-0.229-0.578c-0.15-0.228-0.363-0.35-0.531-0.543 c-0.164-0.229-0.287-0.504-0.467-0.701c-0.049-0.041-0.092-0.075-0.123-0.104c-0.014-0.029-0.027-0.062-0.041-0.078 c-0.174-0.15-0.367-0.199-0.537-0.329c-0.361-0.306-0.725-0.551-1.137-0.776c-0.213-0.106-0.379-0.291-0.605-0.395 c-0.078-0.028-0.139-0.049-0.199-0.075c-0.229-0.077-0.453-0.106-0.686-0.166c-0.438-0.138-0.859-0.2-1.311-0.26 c-0.275-0.028-0.506-0.12-0.766-0.12c-0.043,0-0.092-0.031-0.135-0.031c-0.031,0-0.047,0.014-0.076,0.014 c-0.211,0-0.426,0.094-0.639,0.109c-0.457,0.043-0.881,0.137-1.334,0.27c-0.242,0.06-0.502,0.033-0.76,0.122L83.066,254.829 c-0.062,0.014-0.077,0.062-0.119,0.076c-0.076,0.027-0.15,0.062-0.228,0.09c-0.032,0.014-0.079,0.014-0.11,0.033 c-0.33,0.151-0.543,0.421-0.848,0.606c-0.122,0.09-0.244,0.166-0.377,0.255c-0.322,0.242-0.688,0.393-0.957,0.669 c-0.061,0.047-0.109,0.124-0.166,0.185c-0.335,0.344-0.535,0.785-0.807,1.18c-0.226,0.363-0.543,0.666-0.712,1.065 c-0.03,0.09-0.044,0.165-0.077,0.24c-0.18,0.454-0.213,0.939-0.303,1.427c-0.092,0.439-0.243,0.847-0.243,1.301 c0,0.049-0.026,0.075-0.026,0.123v265.233H0v83.852h350.47h117.68h67.938c0,0,73.59-83.852,0-177.463c0,0-101.4-41.592-160.695,0 c0,0-19.416,50.242-25.35,93.611H245.406l174.109-173.825c0.033-0.026,0.045-0.046,0.061-0.062l85.982-85.824 c0.014-0.014,0.029-0.029,0.059-0.062c0-0.014,0.02-0.027,0.031-0.061c0.029-0.016,0.043-0.016,0.062-0.028L615.15,153.134 c0.018-0.013,0.018-0.027,0.035-0.027l51.391-53.686c0,0,0,0,0.018,0l68.459-71.522v379.474c0,0.648,0.225,1.229,0.379,1.83 c-15.809,3.416-27.688,17.465-27.688,34.256c0,16.672,11.697,30.578,27.309,34.131v23.285c0,2.686,1.379,5.174,3.656,6.6 l12.736,7.932c1.352,1.596,2.096,3.58,2.096,5.688c0,2.365-0.939,4.609-2.609,6.279c-3.43,3.428-9.068,3.445-12.525-0.014 c-3.035-3.033-7.953-3.033-10.984,0c-3.031,3.035-3.031,7.949,0,10.98c4.762,4.764,11.014,7.133,17.266,7.133 c6.246,0,12.498-2.369,17.244-7.113c4.596-4.627,7.145-10.74,7.145-17.268c0-6.521-2.549-12.639-7.158-17.229 c-0.424-0.428-0.875-0.793-1.377-1.111l-9.951-6.188v-18.979c15.607-3.551,27.301-17.459,27.301-34.129 c0-16.791-11.877-30.84-27.68-34.256c0.15-0.604,0.379-1.182,0.379-1.83V8.557H750.586z M428.83,447.355h89.709 c19.514-3.895,23.396,97.508,23.396,97.508H428.83V447.355z M93.626,527.312V297.516l105.787,229.796H93.626L93.626,527.312z M225.425,527.312h-8.93l-63.697-138.388l239.231-146.93l-9.526,16.29c0,0.033-0.013,0.047-0.031,0.062L225.425,527.312z M271.33,479.496l32.994-56.518h23.617L271.33,479.496z M331.369,407.449h-17.977l17.977-30.785V407.449z M346.9,404.047v-48.314 h48.407L346.9,404.047z M352.667,340.2l34.176-58.554l16.895,58.554H352.667z M417.881,333.192l-18.266-63.347h81.711 L417.881,333.192z M402.818,254.311l17.273-29.592l44.418-28.49l23.979,58.082H402.818z M502.738,248.094l-22.693-54.973 l71.488,4.002L502.738,248.094z M492.541,178.272l49.057-31.479l15.113,35.072L492.541,178.272z M571.299,176.481l-13.26-30.777 l36.135,6.885L571.299,176.481z M601.914,138.239l-36.195-6.902l36.195-23.206V138.239z M540.736,128.911l-77.742,49.844 c0,0-0.02,0-0.02,0.016l-52.83,33.873c0,0,0,0,0,0.015L146.259,374.725L96.367,266.356L674.043,43.431L540.736,128.911z M617.445,128.273v-26.577H642.9L617.445,128.273z M657.766,86.161H636.18l55.896-35.845L657.766,86.161z M762.354,443.457 c0,10.771-8.766,19.535-19.535,19.535c-10.771,0-19.539-8.766-19.539-19.535s8.768-19.537,19.539-19.537 C753.588,423.918,762.354,432.688,762.354,443.457z"></path> </g> </g> </g></svg>
          `)}`,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
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
                strokeColor:
                  connection.type === 'existing' ? '#00FF41' : '#FF1744',
                strokeOpacity: 0.9,
                strokeWeight: 5,
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

  // Render KML points as markers
  useEffect(() => {
    if (!map) return;

    kmlPointMarkers.forEach((marker) => marker.setMap(null));

    if (!kmlData?.data) {
      setKmlPointMarkers([]);
      return;
    }

    const newMarkers: google.maps.Marker[] = [];

    kmlData.data.forEach((blockData) => {
      blockData.kml_data.forEach((kml) => {
        kml.points.forEach((point) => {
          try {
            const coordinates = JSON.parse(point.coordinates) as [
              number,
              number,
            ];
            if (coordinates.length === 2) {
              const marker = new google.maps.Marker({
                position: { lat: coordinates[1], lng: coordinates[0] },
                map: map,
                title: point.name,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#9333ea',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                },
              });

              const infoWindow = new google.maps.InfoWindow({
                content: (() => {
                  let parsedProps: Record<string, string> = {};
                  try {
                    parsedProps = JSON.parse(point.properties);
                  } catch {}

                  return `
                    <div style="padding: 8px; min-width: 220px; max-width: 300px;">
                      <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                        ${point.name}
                      </h3>
                      <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                        <strong>LGD Code:</strong> ${point.lgd_code}
                      </p>
                      <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                        <strong>Asset Code:</strong> ${parsedProps.asset_code || '-'}
                      </p>
                      <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                        <strong>Status:</strong> ${parsedProps.status || '-'}
                      </p>
                      <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                        <strong>Remarks:</strong> ${parsedProps.remarks || '-'}
                      </p>
                      <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                        <strong>Type:</strong> ${parsedProps.asset_type || parsedProps.type || '-'}
                      </p>
                      <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                        <strong>Route:</strong> ${parsedProps.route_code || parsedProps.ring || '-'}
                      </p>
                      <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 11px;">
                        <strong>Block:</strong> ${kml.blk_name}
                      </p>
                      <p style="margin: 0; color: #6b7280; font-size: 11px;">
                        <strong>District:</strong> ${parsedProps.dt_name || '-'}
                      </p>
                    </div>
                  `;
                })(),
              });

              marker.addListener('click', () => {
                infoWindow.open(map, marker);
              });

              newMarkers.push(marker);
            }
          } catch (e) {
            console.error('Error parsing point coordinates:', e);
          }
        });
      });
    });

    setKmlPointMarkers(newMarkers);
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
            strokeColor: '#FFFF2E', // Yellow for construction path
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
                <div style="display: flex; gap: 8px;">
                  <button  id="viewDetailsBtn"style="flex:1;padding:4px 8px;background:#2563eb;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">Construction Details</button>
                  <button 
                  onclick="window.location.href='/machine-management/machine-details/${survey.machine_id}?state_id=${block.state_id}&district_id=${block.district_id}&block_id=${block.block_id}'" 
                  style="flex:1;padding:4px 8px;background:#059669;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">Machine Details</button>
                </div>

              </div>
            `,
          });
          google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            document
              .getElementById('viewDetailsBtn')
              ?.addEventListener('click', () => {
                navigate('/construction-details', {
                  state: { row: survey.survey_id, multipreview: true },
                });
              });
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
      kmlPointMarkers.forEach((marker) => marker.setMap(null));
      constructionPolylines.forEach((polyline) => polyline.setMap(null));
    };
  }, []);
  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      <div className="absolute top-20 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
        {/* Status Legend */}
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Cable</h4>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-700">Existing</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-700">Proposed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
            <span className="text-xs text-gray-700">Construction Path</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-xs text-gray-700">KML Points</span>
          </div>
        </div>

        {/* KML Legend */}
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Machines</h4>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#16a34a' }}
            ></div>
            <span className="text-xs text-gray-700">Active</span>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: '#FF0000' }}
            ></div>
            <span className="text-xs text-gray-700">InActive</span>
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
