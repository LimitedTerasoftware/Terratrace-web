import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useAppContext } from './AppContext';
import { MapStyles } from './MapStyles';
import { mapMarkers } from './mapMarkers';
import axios from 'axios';
import { localeData } from 'moment';

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center position
const center = {
  lat: 17.4484,
  lng: 78.3741
};

interface RouteFeature {
  geometry: {
    coordinates: [number, number][];
  };
}

interface LatLng {
  lat: number;
  lng: number;
}

interface PolylineEntry {
  polyline: {
    coordinates: LatLng[];
  };
  segmentData: {
    connection: {
      length: number;
      existing: boolean;
    };
  };
  distanceLabel?: string | null;
}

// Define the structure for LoopConnection
interface LoopConnection {
  length: number;
  existing: boolean;
  color: string;
}

// Define the structure for a single Loop entry
interface LoopEntry {
  name: string;
  coordinates: [number, number];
  connection: LoopConnection;
  route: {
    features: RouteFeature[];
  };
 
}

// Define the global data structure
interface GlobalData {
  
  loop: LoopEntry[];
  mainPointName: string | null;
  totalLength: number;
  // complete: boolean;
   polylineHistory: {
    [segmentKey: string]: PolylineEntry;
  };
}

type GPSPoint = {
  name: string;
  coordinates: [number, number];
  properties?: {
    icon?: string;
    remarks?: string;
    type?: string;
  };
};

type PointType = {
  name: string;
  coordinates: [number, number];
  styleUrl?: string;
  properties: Record<string, any>;
};


type GPSResponse = {
  points: GPSPoint[];
};

type MarkerInfo = {
  position: { lat: number; lng: number };
  title: string;
  description: string;
};

type Connection = {
  start: string;
  end: string;
  length: number;
  name: string;
  coordinates: [number, number][];
  color?: string;
  existing?: boolean;
};


type DistanceLabelProps = {
  position: google.maps.LatLngLiteral;
  text: string;
};


const DistanceLabel = ({ position, text }: DistanceLabelProps) => {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div className="bg-black text-white text-[10px] font-semibold text-nowrap px-6 py-[2px] rounded shadow">
        <span className='-ml-5'>{text}</span>
      </div>
    </OverlayView>
  );
};

const isSameCoordinate = (
  coord1: google.maps.LatLngLiteral,
  coord2: google.maps.LatLngLiteral
) => {
  const lat1 = parseFloat(coord1.lat as any);
  const lng1 = parseFloat(coord1.lng as any);
  const lat2 = parseFloat(coord2.lat as any);
  const lng2 = parseFloat(coord2.lng as any);

  return lat1 === lat2 && lng1 === lng2;
};
function computePathDistance(path: { lat: number; lng: number }[]): number {
  if (path.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += haversineDistance(path[i], path[i + 1]);
  }

  return total;
}

function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // km
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const aVal = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
}


function getLatLng(pos) {
  // If it's a google.maps.LatLng object
  if (pos && typeof pos.lat === 'function' && typeof pos.lng === 'function') {
    return { lat: pos.lat(), lng: pos.lng() };
  }
  // If it's a plain object with lat/lng properties as numbers
  if (
    pos &&
    typeof pos.lat === 'number' &&
    typeof pos.lng === 'number'
  ) {
    return pos;
  }
  // Unknown format
  return null;
}

function isSamePosition(pos1, pos2, precision = 6) {
  const p1 = getLatLng(pos1);
  const p2 = getLatLng(pos2);

  if (!p1 || !p2) {
    console.warn('Invalid position(s) provided:', pos1, pos2);
    return false;
  }

  // Compare with fixed decimal precision
  return (
    Number(p1.lat.toFixed(precision)) === Number(p2.lat.toFixed(precision)) &&
    Number(p1.lng.toFixed(precision)) === Number(p2.lng.toFixed(precision))
  );
}





const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];
const colors = ['gray', 'blue', 'green'];

const MapComponent: React.FC = () => {
  const { transportMode, apiGPSResponse, apiConctResponse, setPointProperties, AutoMode, setAutoMode ,SaveFile,SetSaveFile,DownloadFile,SetDownloadFile,AIMode,setAIMode,incrementalFile,gpFile,setGPSApiResponse,setConctApiResponse} = useAppContext();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [distanceInfoWindows, setDistanceInfoWindows] = useState<
    { position: google.maps.LatLngLiteral; distance: number }[]
  >([]);
  const [pointA, setPointA] = useState<google.maps.LatLngLiteral | null>(null);
  const [pointB, setPointB] = useState<google.maps.LatLngLiteral | null>(null);
  const [pointAName, setPointAName] = useState<string>('');
  const [pointBName, setPointBName] = useState<string>('');
  const [routeGroups, setRouteGroups] = useState<Map<string, { layers: google.maps.Polyline[] }>>(new Map());
  const [polylineHistory, setPolylineHistory] = useState(new Map());
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [editMarkers, setEditMarkers] = useState<google.maps.Marker[]>([]);
  const [existingDistance, setExistingDistance] = useState<number>(0);
  const [proposedDistance, setProposedDistance] = useState<number>(0);
  const [LocalData, setLocalData] = useState<GlobalData>({
    
    loop: [],
    mainPointName: null,
    totalLength: 0,
    // complete: false,
    polylineHistory: {},
  });

  const [RouteKey,setRouteKey]=useState<any>('');
  const [SelectRoute,setSelectRoute]=useState<any>('');
  const [IsOpen,setIsOpen]=useState<boolean>(false)
  const [error,setError]=useState<string>('')
 const [polylineInstanceMap, setPolylineInstanceMap] = useState<Map<string, google.maps.Polyline>>(new Map());
 const [AIdata, setAIdata] = useState<any>({});
 const [PolylineDetails, setPolylineDetails] = useState<any>('');






  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyCPHNQoyCkDJ3kOdYZAjZElbhXuJvx-Odg',
    // libraries,
  });

  // Callback when map loads - moved outside conditional block
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setMapInstance(map);

  }, []);

  // Callback when map unmounts - moved outside conditional block
  const onUnmount = useCallback(() => {
    setMap(null);
    setMapInstance(null);

  }, []);
  
  useEffect(() => {
    if (apiGPSResponse?.points?.length && map) {
    setPointProperties(apiGPSResponse?.points[0])
    
  const connectionsByPoint = new Map<string, Connection[]>();

  // Group connections by point name (like "A", "B")
  if (apiConctResponse?.connections?.length) {
    apiConctResponse.connections.forEach((conn:Connection) => {
    const [from, to] = [conn.start, conn.end];
      [from, to].forEach((point) => {
        if (!connectionsByPoint.has(point)) {
          connectionsByPoint.set(point, []);
        }
        connectionsByPoint.get(point)?.push(conn);
      });
    });
  }

  const newLoopEntries: LoopEntry[] = apiGPSResponse.points.map((point: any) => {
    const relatedConnections = connectionsByPoint.get(point.name) || [];

    // Pick one connection if multiple (or you can loop them all if needed)
    const matchedConn = relatedConnections[0];

    return {
      name: point.name,
      coordinates: point.coordinates,
      ...(matchedConn && {
      connection: {
        length: matchedConn.length || 0,
        existing: true,
        color: matchedConn.color || "#55ff00",
      },
      route: {
        features: [
          {
            geometry: {
              coordinates: matchedConn.coordinates,
            },
          },
        ],
      },
    }),
       
    };
  });

  setLocalData((prev: GlobalData) => ({
    ...prev,
    mainPointName: apiGPSResponse.mainPointName || null,
    loop: [...prev.loop, ...newLoopEntries],
  }));


      const bounds = new window.google.maps.LatLngBounds();
      (apiGPSResponse.points as PointType[]).forEach((point) => {
        if (
          Array.isArray(point.coordinates) &&
          point.coordinates.length === 2 &&
          typeof point.coordinates[0] === 'number' &&
          typeof point.coordinates[1] === 'number'
        ) {
          bounds.extend({ lat: point.coordinates[1], lng: point.coordinates[0] });
        }
      });

      map.fitBounds(bounds);
    }
  }, [apiGPSResponse,apiConctResponse, map]);
  useEffect(() => {
    if (!map || !apiConctResponse?.connections?.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    let totalExisting = 0;
    // const newPolylineHistory: Record<string, PolylineEntry> = {};
const newPolylineHistory: Record<string, {
  instance: google.maps.Polyline; // this is for cleanup later
  data: PolylineEntry;            // this is for global state
}> = {};
    apiConctResponse.connections.forEach((connection: Connection) => {
      if (!Array.isArray(connection.coordinates) || connection.coordinates.length < 2) {
        console.warn(`Skipping invalid connection: ${connection.name}`);
        return;
      }

      const path = connection.coordinates.map(([lng, lat]) => {
        const point = { lat, lng };
        bounds.extend(point);
        return point;
      });

      const polyline = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: connection.color || "#00AA00",
        strokeOpacity: 1.0,
        strokeWeight: 4,
      });

      polyline.setMap(map);

      //Add distance label
      const offsetIndex = Math.floor(path.length * 0.5); // middle point
      const midPoint = path[offsetIndex];

      setDistanceInfoWindows(prev => [
        ...prev,
        {
          position: midPoint,
          distance: connection.length || 0,
        },
      ]);

    //   newPolylineHistory[connection.name] = {
    //   polyline: { coordinates: path },
    //   segmentData: {
    //     connection: {
    //       length: connection.length || 0,
    //       existing: true,
    //     },
    //   },
    // };
 





newPolylineHistory[connection.name] = {
  instance: polyline,
  data: {
    polyline: { coordinates: path },
    segmentData: {
      connection: {
        length: connection.length || 0,
        existing: true,
      },
    },
  },
};




    totalExisting += connection.length || 0;

   setPolylineInstanceMap(prev => {
  const newMap = new Map(prev);
  Object.entries(newPolylineHistory).forEach(([key, val]) => {
    newMap.set(key, val.instance);
  });
  return newMap;
});
    });
    setExistingDistance(totalExisting);

    map.fitBounds(bounds);
  //    setLocalData(prev => ({
  //   ...prev,
  //   polylineHistory: {
  //     ...prev.polylineHistory,
  //     ...newPolylineHistory,
  //   },
  // }));
setLocalData(prev => ({
  ...prev,
  polylineHistory: {
    ...prev.polylineHistory,
    ...Object.fromEntries(
      Object.entries(newPolylineHistory).map(([key, val]) => [key, val.data])
    ),
  },
}));



  }, [apiConctResponse, map]);

async function AImodehandle() {
  if(!gpFile || !incrementalFile){
    return;
  }
  const formData = new FormData();
  formData.append('pointsFile', gpFile);
  formData.append('connectionsFile', incrementalFile);

  try {
    const response = await fetch('http://traceapi.keeshondcoin.com/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    AIMap(result)
  } catch (error) {
    console.error('Upload error:', error);
  }
}

const AIMap = (AIdata:any) => {
  if (!map || !AIdata?.loop?.length) return;
  const bounds = new window.google.maps.LatLngBounds();
  let totalLength = 0;

  const newPolylineHistory: Record<string, {
    instance: google.maps.Polyline;
    data: PolylineEntry;
  }> = {};

  AIdata.loop.forEach((item: any) => {
    const { name, coordinates, connection, route } = item;

    if (
      !route?.features?.[0]?.geometry?.coordinates?.length ||
      !Array.isArray(route.features[0].geometry.coordinates)
    ) return;

    const path = route.features[0].geometry.coordinates.map(([lng, lat]) => {
      const point = { lat, lng };
      bounds.extend(point);
      return point;
    });

    // Draw polyline
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: connection?.color || "#ff0000",
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });
    polyline.setMap(map);

    // Midpoint distance label
    const offsetIndex = Math.floor(path.length * 0.5);
    const midPoint = path[offsetIndex];

    setDistanceInfoWindows(prev => [
      ...prev,
      {
        position: midPoint,
        distance: connection?.length || 0,
      },
    ]);

    const routeKey = `${connection?.from}->${connection?.to}`;

    // Polyline history
    newPolylineHistory[routeKey] = {
      instance: polyline,
      data: {
        polyline: { coordinates: path },
        segmentData: {
          connection: {
            length: connection?.length || 0,
            existing: connection?.existing || false,
          },
        },
      },
    };

    totalLength += connection?.length || 0;
    polyline.addListener("click", (e) => {
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <strong>${connection?.originalName || `${connection?.from} → ${connection?.to}`}</strong><br/>
            Length: ${connection?.length?.toFixed(2)} km<br/>
            Existing: ${connection?.existing ? 'Yes' : 'No'}
          </div>
        `,
        position: e.latLng,
      });

      infoWindow.open(map);
    });
    // Optional: Add marker for loop point
    if (
      Array.isArray(coordinates) &&
      coordinates.length === 2 &&
      typeof coordinates[0] === 'number' &&
      typeof coordinates[1] === 'number'
    ) {
      const markerPoint = {
        lat: coordinates[1],
        lng: coordinates[0],
      };
      new google.maps.Marker({
        position: markerPoint,
        map,
        title: name,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new google.maps.Size(30, 30),
        },
      });

      bounds.extend(markerPoint);
      const marker = new google.maps.Marker({
  position: markerPoint,
  map,
  title: name,
  icon: {
    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    scaledSize: new google.maps.Size(30, 30),
  },
});

// Add click listener to send data
marker.addListener('click', () => {
  setPointProperties({
    name,
    coordinates,
    properties:{
    coordinates:coordinates
  }
  });
});


      
    }
  });

  // Store instance references for cleanup
  setPolylineInstanceMap(prev => {
    const newMap = new Map(prev);
    Object.entries(newPolylineHistory).forEach(([key, val]) => {
      newMap.set(key, val.instance);
    });
    return newMap;
  });

  // Store polyline data into global state
  setLocalData(prev => ({
    ...prev,
    polylineHistory: {
      ...prev.polylineHistory,
      ...Object.fromEntries(
        Object.entries(newPolylineHistory).map(([key, val]) => [key, val.data])
      ),
    },
    mainPointName: AIdata.mainPointName || null,
    loop: AIdata.loop || [],
  }));

  setExistingDistance(totalLength);
  map.fitBounds(bounds);

}


  useEffect(() => {
  if (AIMode && map) {
    clearMapData(); 
    AImodehandle()
  }
}, [AIMode, map]);

  const HandleCalculation = async () => {
    if (!pointA || !pointB || !pointAName || !pointBName || !mapInstance) return;

    const url = `http://traceapi.keeshondcoin.com/show-route?lat1=${pointA.lat}&lng1=${pointA.lng}&lat2=${pointB.lat}&lng2=${pointB.lng}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const routes = Array.isArray(data) ? data.slice(0, 3) : [data];
      const routeKey = `${pointAName}-${pointBName}`;

      // Clear existing layers
      if (routeGroups.has(routeKey)) {
        routeGroups.get(routeKey)!.layers.forEach((layer: google.maps.Polyline) => layer.setMap(null));
        routeGroups.delete(routeKey);
      }


      const newRouteLayers: (google.maps.Polyline | google.maps.InfoWindow)[] = [];
      const newInfoWindows: { position: google.maps.LatLngLiteral; distance: number }[] = [];
      const bounds = new google.maps.LatLngBounds();

      routes.forEach((routeData, index) => {
        if (Array.isArray(routeData.route)) {
          const path = routeData.route.map((coord: [number, number]) => ({
            lat: coord[0],
            lng: coord[1],
          }));

          const polyline = new google.maps.Polyline({
            path,
            strokeColor: colors[index],
            strokeOpacity: 0.8,
            strokeWeight: selectedRouteIndex === index ? 8 : 4,
            zIndex: selectedRouteIndex === index ? 999 : 1,
            map: mapInstance,
          });

          polyline.addListener("click", () => {
            handleRouteSelection(routeKey, index);
            setSelectedRouteIndex(index);
          });
          polyline.addListener("mouseover", () => {
            polyline.setOptions({ strokeWeight: 6 });
          });
          polyline.addListener("mouseout", () => {
            polyline.setOptions({ strokeWeight: selectedRouteIndex === index ? 8 : 4 });
          });
          newRouteLayers.push(polyline);

          const offsetPoint = path[Math.floor(path.length * 0.25)];
          const distanceLabel = new google.maps.InfoWindow({
            content: `<div class="distance-label">${routeData.distance.toFixed(2)} km</div>`,
            position: offsetPoint,
          });
          // distanceLabel.open(mapInstance);
          newRouteLayers.push(distanceLabel);

          newInfoWindows.push({
            position: offsetPoint,
            distance: routeData.distance,
          });
            const labelPos = path[Math.floor(path.length / 2)];

          const segmentKey = `${routeKey}-route${index + 1}`;
          polylineHistory.set(segmentKey, {
            polyline,
            segmentData: {
              connection: {
                length: routeData.distance,
                existing: false,
                color: colors[index],
              },
            },
           original: {
            coords: path.slice(),
            distance:routeData.distance,
            markerPositions: [],
            labelPos: labelPos ? [labelPos.lat, labelPos.lng] : null,
            labelText: `${routeData.distance} km`
          },
            undoStack: [],
            dragMarkers: [],

            distanceLabel,
          });

          path.forEach(p => bounds.extend(p));
        }
      });

      routeGroups.set(routeKey, { layers: newRouteLayers });
      setDistanceInfoWindows(prev => [...prev, ...newInfoWindows]);
      mapInstance.fitBounds(bounds);
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    if (selectedRouteIndex === null || !routeGroups || !mapInstance) return;

    routeGroups.forEach(({ layers }, key) => {
      layers.forEach(layer => {
        if (layer instanceof google.maps.Polyline) {
          const isSelected =
            polylineHistory.get(`${key}-route${selectedRouteIndex + 1}`)?.polyline === layer;

          layer.setOptions({
            strokeWeight: isSelected ? 8 : 4,
            strokeColor: isSelected ? "#FF0000" : (layer.get("strokeColor") || "#00AA00"),
            zIndex: isSelected ? 1000 : 1,
          });
        }
      });
    });
  }, [selectedRouteIndex]);


  const addDragMarkersWithRerouting = (polyline: google.maps.Polyline, routeKey: string,selectedId:string) => {
    const path = polyline.getPath().getArray();
    const fractions = [0.25, 0.5, 0.75];
   
    const newMarkers: google.maps.Marker[] = [];

    fractions.forEach((f, index) => {
      const pointIndex = Math.floor(path.length * f);
      const coord = path[pointIndex];
      if (!coord) return;

      const marker = new google.maps.Marker({
        position: coord,
        map: mapInstance,
        draggable: true,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' +
            encodeURIComponent(`
            <svg width="12" height="12" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6" r="5" fill="#00FFFF" stroke="white" stroke-width="1"/>
            </svg>`),
          scaledSize: new google.maps.Size(12, 12),
        },
        zIndex: 999 + index,
      });

      marker.addListener('dragend', async (e) => {
        const newCoord = e.latLng;
        const start = path[0];
        const end = path[path.length - 1];
        // const routeUrl = `http://router.project-osrm.org/route/v1/driving/${start.lng()},${start.lat()};${newCoord.lng()},${newCoord.lat()};${end.lng()},${end.lat()}?overview=full&geometries=geojson`;

        try {
          const res = await axios.post('http://traceapi.keeshondcoin.com/compute-route', {
            newPos: newCoord,
            origin: start,
            destination: end
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const data = res.data;
          if (data[0].route.length > 0) {
            const newCoordsRaw = data[0].route
            const newCoords = newCoordsRaw.map(([lat, lng]) => ({ lat, lng }));
            // Save current path to undoStack
          const currentPath = polyline.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
          const history = polylineHistory.get(selectedId);
          setRouteKey(selectedId);
          setSelectRoute(routeKey)
            if (history) {
              history.undoStack = history.undoStack || [];
              history.undoStack.push(currentPath);
            }
          


            polyline.setPath(newCoords);
            updateGlobalDataWithSelectedRoute(polyline, routeKey, 0); // assume index 0 if rerouted

            // Reposition drag markers
            const updatedPath = polyline.getPath().getArray();
            const updatedFractions = [0.25, 0.5, 0.75];
            newMarkers.forEach((m, idx) => {
              const i = Math.floor(updatedPath.length * updatedFractions[idx]);
              const pos = updatedPath[i];
              if (pos) m.setPosition(pos);
            });


            const distanceKm = data[0].distance;
            const updatedCoords = updatedPath; // or data.routes[0].geometry.coordinates.map

            const offsetIndex = Math.floor(updatedCoords.length * 0.25);
            const offsetPoint = updatedCoords[offsetIndex] || updatedCoords[Math.floor(updatedCoords.length / 2)];


            let entry = Array.from(polylineHistory.entries()).find(([key]) =>
              key.startsWith(`${routeKey}-route`)
            );

            let infoWindow = entry?.[1]?.distanceLabel;
            const oldKey = entry?.[0];

            let oldPos: google.maps.LatLng | null = null;

            if (infoWindow) {
              oldPos = infoWindow.getPosition();
              infoWindow.close();
            }

            // Always create a new InfoWindow (since the path changed)
            infoWindow = new google.maps.InfoWindow({
              content: `<div class="distance-label">${distanceKm.toFixed(2)} km</div>`,
              position: offsetPoint,
            });
            // infoWindow.open(mapInstance);

            // Update polylineHistory with the new InfoWindow
            if (oldKey) {
              polylineHistory.set(oldKey, {
                ...(polylineHistory.get(oldKey) ?? {}),
                polyline,
                distanceLabel: infoWindow,
              });
            }

            // Remove old one from state
            setDistanceInfoWindows(prev =>
              prev.filter(
                d =>
                  !oldPos ||
                  Math.abs(d.position.lat - oldPos.lat()) > 1e-6 ||
                  Math.abs(d.position.lng - oldPos.lng()) > 1e-6
              )
            );

            // Add the new one
            setDistanceInfoWindows(prev => [
              ...prev,
              { position: offsetPoint, distance: distanceKm },
            ]);


            // Update global state
            updateRouteSummary(polyline);
          } else {
            alert("No route found");
          }
        } catch (err) {
          console.error("Rerouting failed", err);
        }
      });

      newMarkers.push(marker);
    });

    setEditMarkers(newMarkers); // store for cleanup later
  };

const undoRouteChange = (routeKey: string) => {
  const history = polylineHistory.get(routeKey);
  
  if (!history || history.undoStack.length === 0) return;

  const lastPath = history.undoStack.pop();
  if (!lastPath) return;

   const oldInfoWindow = history.distanceLabel;
  const oldPos = oldInfoWindow?.getPosition();
  // Set polyline back to previous path
  history.polyline.setPath(lastPath);

  // Update infoWindow and marker positions
  const midPoint = lastPath[Math.floor(lastPath.length / 2)];
  const distance = computePathDistance(lastPath);

  const newInfoWindow = new google.maps.InfoWindow({
    content: `<div class="distance-label">${distance.toFixed(2)} km</div>`,
    position: midPoint,
  });

  // Move the existing edit markers to the correct spots
const updatedPath = lastPath;
const fractions = [0.25, 0.5, 0.75];


editMarkers.forEach((m, idx) => {
  const pointIndex = Math.floor(updatedPath.length * fractions[idx]);
  const pos = updatedPath[pointIndex];
  if (pos) m.setPosition(pos);
});


// Update polylineHistory
  polylineHistory.set(routeKey, {
    ...history,
    distanceLabel: newInfoWindow,

  });

  // Update distance windows state
  setDistanceInfoWindows(prev =>
    [
      ...prev.filter(d =>
        !oldPos ||
        Math.abs(d.position.lat - oldPos.lat()) > 1e-6 ||
        Math.abs(d.position.lng - oldPos.lng()) > 1e-6
      ),
      { position: midPoint, distance },
    ]
  );;

  // Update the route globally again
  updateGlobalDataWithSelectedRoute(history.polyline, SelectRoute, 0);
};



const handleRouteSelection = (routeKey: string, selectedIndex: number) => {
    const selectedId = `${routeKey}-route${selectedIndex + 1}`;
    const selectedEntry = polylineHistory.get(selectedId);
    if (!selectedEntry || !selectedEntry.polyline) return;
    const selectedPolyline = selectedEntry.polyline;

   setRouteKey(selectedId);
   setSelectRoute(routeKey)
    setPointA(null)
    setPointB(null)
    // Remove other optional routes and their distance labels
    const group = routeGroups.get(routeKey);
    const toRemovePositions: google.maps.LatLng[] = [];

    let routeCounter = 0;

    group?.layers.forEach((layer) => {
      if (!(layer instanceof google.maps.Polyline)) return;

      const currentKey = `${routeKey}-route${routeCounter + 1}`;
      const isSelected = currentKey === selectedId;

      if (!isSelected) {
        // Remove non-selected polyline

        layer.setMap(null);
        
        // Collect distanceLabel position to be removed
        const entry = polylineHistory.get(currentKey);

        if (entry?.distanceLabel) {
          entry.distanceLabel.close();
          const pos = entry.distanceLabel.getPosition();
          if (pos) toRemovePositions.push(pos);
        }
      }

      routeCounter++; // Only increment when it's a polyline
    });




    // Filter out only those InfoWindows that match the removed ones
    setDistanceInfoWindows(prev =>
      prev.filter(d =>
        !toRemovePositions.some(pos =>
          Math.abs(d.position.lat - pos.lat()) < 1e-6 &&
          Math.abs(d.position.lng - pos.lng()) < 1e-6
        )
      )
    );



    // Keep selected InfoWindow open
    // if (selectedEntry.distanceLabel) {
    //   selectedEntry.distanceLabel.open(mapInstance);
    // }

    // Enable editing with draggable midpoints
    addDragMarkersWithRerouting(selectedPolyline, routeKey,selectedId);
   
    // Show summary and update global state
    updateRouteSummary(selectedPolyline);
    updateGlobalDataWithSelectedRoute(selectedPolyline, routeKey, selectedIndex);
  };


  const updateRouteSummary = (polyline: google.maps.Polyline) => {
    const path = polyline.getPath();
    let totalDistance = 0;

    for (let i = 1; i < path.getLength(); i++) {
      const p1 = path.getAt(i - 1);
      const p2 = path.getAt(i);
      totalDistance += google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
    }

    const summary = {
      distanceKm: (totalDistance / 1000).toFixed(2),
      points: path.getArray().map(p => ({ lat: p.lat(), lng: p.lng() })),
    };

    // Optionally display in a custom div or popup
    // setSelectedRouteSummary(summary);
  };

 const updateGlobalDataWithSelectedRoute = (
  polyline: google.maps.Polyline,
  routeKey: string,
  index: number
) => {
  const path = polyline.getPath().getArray().map(p => ({
    lat: p.lat(),
    lng: p.lng()
  }));

  const distance = computePathDistance(path);

  // Extract fromName and toName from routeKey
  let fromName = '';
  let toName = '';
  for (const point of LocalData.loop) {
    if (routeKey.endsWith(`-${point.name}`)) {
      toName = point.name;
      fromName = routeKey.slice(0, routeKey.length - point.name.length - 1);
      break;
    }
  }

  if (!fromName || !toName) {
    console.error('Invalid route key format:', routeKey);
    return;
  }

  // Get the end point
  let endPoint = LocalData.loop.find(p => p.name === toName) || null;


  if (!endPoint) {
   const endCoord = path[path.length - 1];

    const result = LocalData.loop.reduce<{
    point: LoopEntry | null;
    dist: number;
  }>((closest, p) => {
    if (!p.coordinates || p.coordinates.length < 2) return closest;
    const dist = Math.sqrt(
      Math.pow(p.coordinates[0] - endCoord.lng, 2) +
      Math.pow(p.coordinates[1] - endCoord.lat, 2)
    );
    return dist < closest.dist ? { point: p, dist } : closest;
  }, { point: null, dist: Infinity });

  endPoint = result.point;

  if (endPoint) {
    toName = endPoint.name;
  } else {
    console.error(`End point ${toName} not found.`);
    return;
  }
  }
   
  // Create new route object
 const selectedRoute: LoopEntry = {
  name: endPoint.name,
  coordinates: endPoint.coordinates,
  route: {
    features: [
      {
        geometry: {
          coordinates: polyline.getPath().getArray().map(p => [p.lng(), p.lat()])
        }
      }
    ]
  },
  connection: {
    length: distance,
    existing: false,
    color: '#00FFFF'
  }
};
  setLocalData(prev  => {
    const loopCopy = [...prev.loop];
    const existingIndex = loopCopy.findIndex(p => p.name === toName);

    if (existingIndex >= 0) {
      loopCopy[existingIndex] = {
        ...loopCopy[existingIndex],
        route: selectedRoute.route,
        connection: selectedRoute.connection
      };
    } else {
      loopCopy.push(selectedRoute);
    }


    const updatedHistory = {
      ...prev.polylineHistory,
      [routeKey]: {
            polyline: {
          coordinates: path
        },

        segmentData: {
          connection: selectedRoute.connection
        },
       
      }
    };

    return {
      ...prev,
      loop: loopCopy,
      polylineHistory: updatedHistory
    };
  });
};

const deleteRoute = (routeKey: string,routeKeyMain:string) => {

  const history = polylineHistory.get(routeKey);
  if (!history) return;

  // Remove polyline from map
  history.polyline.setMap(null);

  // Remove edit markers from map
  editMarkers.forEach(marker => marker.setMap(null));

  // Close and remove distance InfoWindow
  if (history.distanceLabel) {
    history.distanceLabel.close();
  }

  // Remove from polylineHistory
  polylineHistory.delete(routeKey);

  // Remove from distanceInfoWindows state
  const oldPos = history.distanceLabel?.getPosition();
  setDistanceInfoWindows(prev =>
    prev.filter(d =>
      !oldPos ||
      Math.abs(d.position.lat - oldPos.lat()) > 1e-6 ||
      Math.abs(d.position.lng - oldPos.lng()) > 1e-6
    )
  );

  deleteGlobalRoute(routeKeyMain);



};

const deleteGlobalRoute = (routeKey: string) => {
  let fromName = '';
  let toName = '';

  // Extract fromName and toName from routeKey
  for (const point of LocalData.loop) {
    if (routeKey.endsWith(`-${point.name}`)) {
      toName = point.name;
      fromName = routeKey.slice(0, routeKey.length - point.name.length - 1);
      break;
    }
  }

  if (!fromName || !toName) {
    console.error('Invalid route key format:', routeKey);
    return;
  }

  setLocalData(prev => {
    const updatedLoop = prev.loop.map(entry => {
      if (entry.name === toName) {
        return {
          ...entry,
          route: undefined,
          connection: undefined
        };
      }
      return entry;
    });

    const updatedHistory = { ...prev.polylineHistory };
    delete updatedHistory[routeKey];

    return {
      ...prev,
      loop: updatedLoop,
      polylineHistory: updatedHistory
    };
  });
};

const clearMapData = () => {
polylineInstanceMap.forEach(polyline => {
  polyline.setMap(null);
});

  polylineHistory.forEach((entry, key) => {
    if (entry.polyline) {
      entry.polyline.setMap(null);
    }
  });

  polylineHistory.clear();

  setDistanceInfoWindows([]);

  editMarkers.forEach((marker) => {
    marker.setMap(null);
  });
  setEditMarkers([]);

  setLocalData({
    loop: [],
    mainPointName: null,
    totalLength: 0,
    polylineHistory: {},
  });
  setPolylineHistory(new Map())
  setRouteGroups(new Map())
  setIsOpen(false)
  setRouteKey('')
  setSelectRoute('')
  setSelectRoute(null);
  setProposedDistance(0);
  setExistingDistance(0);
  setSelectedRouteIndex(null);
  setError('')
 setMapInstance(null)
  setPointA(null)
  setPointB(null)
 setMap(null)
 setConctApiResponse(null)
 setGPSApiResponse(null)
};


useEffect(() => {
  const total = Object.values(LocalData.polylineHistory || {})
    .filter(h => h.segmentData?.connection && !h.segmentData.connection.existing)
    .reduce((sum, h) => sum + (h.segmentData.connection.length || 0), 0);

  setProposedDistance(total);
}, [LocalData.polylineHistory]);




async function saveKML(LocalData:GlobalData) {
  const Body = {
  globalData: {
    loop: LocalData.loop,
    mainPointName: LocalData.mainPointName,
    totalLength: LocalData.totalLength,
  },
  polylineHistory: LocalData.polylineHistory,
};


  try {
    const response = await fetch('http://traceapi.keeshondcoin.com/save-kml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:  JSON.stringify(Body)
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    SetSaveFile(false);
    // document.getElementById('result').innerHTML = `<p>KML saved successfully: ${result.name}</p>`;
  } catch (error) {
    SetSaveFile(false)
    console.error('Save KML error:', error);
    // document.getElementById('result').innerHTML = `<p>Error saving KML: ${error.message}</p>`;
  }
}

useEffect(()=>{
  if(SaveFile){
    saveKML(LocalData)
  }
},[SaveFile])

async function downloadFile(DownloadFile:string) {
  if (!LocalData) {
    setError('No data available to download')
    return;
  }

   const filteredData = {
  globalData: {
    loop: LocalData.loop,
    mainPointName: LocalData.mainPointName,
    totalLength: LocalData.totalLength,
  },
  polylineHistory: LocalData.polylineHistory,
};

  const payload = JSON.stringify(filteredData);
  const payloadSizeMB = new Blob([payload]).size / (1024 * 1024);

  if (payloadSizeMB > 50) {
        setError(`Error: Payload too large (${payloadSizeMB.toFixed(2)} MB`)

    return;
  }

  try {
    const response = await fetch(`http://traceapi.keeshondcoin.com/download/${DownloadFile}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });

    if (!response.ok) {
      const error = await response.json();
      setError(`Error: ${error.error}`)

      return;
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename =
      contentDisposition?.match(/filename="(.+)"/)?.[1] ||
      `routes.${DownloadFile}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    SetDownloadFile(null)

  } catch (error) {
     console.error('Download error:', error);
    SetDownloadFile(null)

  }
}
useEffect(()=>{
  if(DownloadFile !== null){

   downloadFile(DownloadFile)

  }
},[DownloadFile])
  // Initialize places autocomplete - moved outside conditional block
  React.useEffect(() => {
    if (!isLoaded || !map || !window.google?.maps?.places) return;

    const input = document.getElementById('map-search') as HTMLInputElement;
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        return;
      }

      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }
    });

    return () => {
      // Cleanup listener if needed
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [map, isLoaded]); // Added proper dependencies

  if (loadError) return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center text-red-600">
        Error loading map. Please try again later.
      </div>
    </div>
  );

  if (!isLoaded) return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800 mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg">Loading map...</p>
      </div>
    </div>
  );

  return (
    <div className="relative h-full w-full">
      {/* Search Box */}
      <div className="absolute top-4 left-0 right-0 mx-auto w-11/12 sm:w-96 z-10">
        <div className="relative">
          <input
            id="map-search"
            type="text"
            placeholder="Find a place"
            className={`w-full px-4 py-2 pr-10 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${showSearch ? 'opacity-100' : 'opacity-0 pointer-events-none'
              } transition-opacity duration-300`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? '×' : '🔍'}
          </button>
        </div>
      </div>

      {/* Google Map Component */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: MapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        }}
      >
        {/* Markers */}
        {apiGPSResponse?.points?.map((point: GPSPoint, index: number) => {
          const position = {
            lat: (point.coordinates[1]),
            lng: (point.coordinates[0]),
          };
          const isPointSame = pointA && !pointB && isSameCoordinate(pointA, position);

            return (
            <Marker
              key={index}
              position={{ lat: point.coordinates[1], lng: point.coordinates[0] }}
              icon={{
                url:point?.properties?.icon || 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
                scaledSize: new window.google.maps.Size(30, 30),
              }}
              onClick={() => {
                setPointProperties(point);
                if (AutoMode) {
                  if (!pointA) {
                    setPointAName(point.name)
                    setPointA(position)
                  } else if (!pointB && !isPointSame) {
      
                    setPointBName(point.name)
                    setPointB(position);
                  }
                }


              }
              }
            />
          )
        })}


       

        {distanceInfoWindows.map((info, idx) => (
          <DistanceLabel
            key={idx}
            position={info.position}
            text={`${info.distance.toFixed(2)} km`}
          />
        ))}
        {AutoMode && (
          <div className="absolute top-15 right-4 z-50 bg-blue-800 text-white rounded-lg shadow-lg w-96 overflow-hidden">
            {/* Header */}
            <div className="bg-white text-blue-800 flex justify-between items-center px-4 py-3">
              <h2 className="text-lg font-semibold">Route Selection</h2>
              <button className="text-blue-800 hover:text-blue-600 text-xl font-bold" onClick={() => setAutoMode(false)}>&times;</button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2">
              <p><span className="font-bold">Start:</span> <span className="text-gray-200">{pointA ? `${pointAName} (${pointA.lat}, ${pointA.lng})` : 'Not Selected'}</span></p>
              <p><span className="font-bold">End:</span> <span className="text-gray-200">{pointB ? `${pointBName} (${pointB.lat},${pointB.lng})` : 'Not Selected'}</span></p>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-white text-black py-2 px-3 rounded-md font-medium flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!pointA || !pointB} onClick={HandleCalculation}>
                  🧭 Calculate Route
                </button>
                <button className="flex-1 bg-white text-black py-2 px-3 rounded-md font-medium flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={RouteKey === ''} onClick={() => {setIsOpen(true)}}>
                  🗑️ Delete Route
                </button>
              </div>
            </div>
          </div>

        )}

        <div className="absolute top-70 left-4 z-50 overflow-hidden">
        <div className="p-3 rounded-lg shadow-md bg-white w-60 font-sans text-sm text-gray-800">
          <strong className="text-base block mb-2 font-semibold text-blue-900">
            Line Summary
          </strong>

          <div className="mb-1.5 flex items-center">
            <div className="w-5 h-1 rounded-sm mr-2" style={{ backgroundColor: '#0f0' }}></div>
            Existing Lines: {existingDistance.toFixed(2)}km
          </div>

          <div className="mb-2.5 flex items-center">
            <div className="w-5 h-1 rounded-sm mr-2" style={{ backgroundColor: '#f00' }}></div>
            Proposed Lines: {proposedDistance.toFixed(2)}km
          </div>
          {PolylineDetails && (
          <div className="mb-2.5 flex items-center">
            <div className="w-5 h-1 rounded-sm mr-2" style={{ backgroundColor: '#f00' }}></div>
             Lines Details: {PolylineDetails}
          </div>
          )}
          

          <button
            onClick={() => undoRouteChange(RouteKey)}
            className="px-3 py-1.5 bg-gray-300 rounded cursor-pointer font-bold border-none"
          >
            Undo
          </button>
        </div>
        </div>

  

      </GoogleMap>
      {IsOpen && (
       <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Delete Route</h2>
        <p className="text-gray-700 mb-6">Are you sure you want to delete this route?</p>
        <div className="flex justify-end space-x-4">
          <button
          onClick={()=>setIsOpen(false)}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Cancel
          </button>
          <button
        onClick={()=>{deleteRoute(RouteKey,SelectRoute);setIsOpen(false)}}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
    )}
    </div>


  );
};

export default MapComponent;

export { MapComponent }