import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useAppContext } from './AppContext';
import axios from 'axios';
import MapIcon from '../../images/icon/icon-Map.svg'
import UndoIcon from '../../images/icon/undo-icon.svg'
import { AlertCircle, CheckCircle, X } from 'lucide-react';

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
    },
    startCords?:string;
    endCords?:string;
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
  lgd_code:string
  route: {
    features: RouteFeature[];
  };

}

// Define the global data structure
interface GlobalData {

  loop: LoopEntry[];
  mainPointName: string | null;
  totalLength: number;
  existinglength: number,
  proposedlength: number,
  dt_code:string,
  dt_name:string,
  st_code:string,
  st_name:string,
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

type Place = {
  name: string;
  formatted_address: string;
  location: {
    lat: number;
    lng: number;
  };
};

interface NotifierState {
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}

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

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = [
  "places",
  "drawing",
  "geometry",
  "visualization"
];
const colors = ['blue', 'green', 'gray'];
const BASEURL_Val = import.meta.env.VITE_TraceAPI_URL;

const MapComponent: React.FC = () => {
  const { transportMode, apiGPSResponse, apiConctResponse, setPointProperties, AutoMode, setAutoMode, SaveFile, setSaveFile, DownloadFile, setDownloadFile, AIMode, setAIMode, incrementalFile, gpFile, setGPSApiResponse, setConctApiResponse,
    lineSummary, setLineSummary, VerifySaveFile, setVerifySaveFile
  } = useAppContext();
  const [map, setMap] = useState<google.maps.Map | null>(null);
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
    existinglength: 0,
    proposedlength: 0,
    dt_code:'',
    dt_name:'',
    st_code:'',
    st_name:'',
    polylineHistory: {},
  });
  const [RouteKey, setRouteKey] = useState<any>('');
  const [SelectRoute, setSelectRoute] = useState<any>('');
  const [IsOpen, setIsOpen] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [polylineInstanceMap, setPolylineInstanceMap] = useState<Map<string, google.maps.Polyline>>(new Map());
  const [AIdata, setAIdata] = useState<any>({});
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [showSearch, setShowSearch] = useState(true);
  const searchMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const autoModeRef = useRef(AutoMode);
  const pointARef = useRef(pointA);
  const pointBRef = useRef(pointB);
  const [loader, setLoader] = useState(false);
  const [Notifier, setNotifier] = useState<NotifierState>({ type: 'success', message: '', visible: false });
  const notifierTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const routeMarkers = useRef<Map<string, google.maps.Marker[]>>(new Map());

  useEffect(() => {
    // Cleanup function
    return () => {
      if (notifierTimeoutRef.current) {
        clearTimeout(notifierTimeoutRef.current);
      }
    };
  }, []);
  const GoogleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey:GoogleKey,
    libraries,
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
        apiConctResponse.connections.forEach((conn: Connection) => {
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
          lgd_code:point.properties.lgd_code,
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
          mainPointName:apiGPSResponse.points[0].properties?.blk_name || '',
          dt_code:apiGPSResponse.points[0].properties?.dt_code || '',
          dt_name:apiGPSResponse.points[0].properties?.dt_name || '',
          st_code:apiGPSResponse.points[0].properties?.st_code || '',
          st_name:apiGPSResponse.points[0].properties?.st_name || '',
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
  }, [apiGPSResponse, apiConctResponse, map]);

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
     const startLgdCode = apiGPSResponse.points.find((point: PointType) => point.name === connection.start);
     const endLgdCode = apiGPSResponse.points.find((point: PointType) => point.name === connection.end);

      newPolylineHistory[`${connection.start} TO ${connection.end}`] = {
        instance: polyline,
        data: {
          polyline: { coordinates: path },
          segmentData: {
            connection: {
              length: connection.length || 0,
              existing: true,
            },
            startCords:startLgdCode.properties.lgd_code,
            endCords:endLgdCode.properties.lgd_code,
          }, 
        },
      };
      totalExisting += connection.length || 0;
      polyline.addListener("click", (e) => {
        setPointProperties(connection)

      });
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

    setLocalData(prev => ({
      ...prev,
      totalLength: totalExisting,
      existinglength: totalExisting,
      polylineHistory: {
        ...prev.polylineHistory,
        ...Object.fromEntries(
          Object.entries(newPolylineHistory).map(([key, val]) => [key, val.data])
        ),
      },
    }));
  }, [apiConctResponse, map]);

  async function AImodehandle() {
    if (!gpFile || !incrementalFile) {
      return;
    }
    setLoader(true)
    const formData = new FormData();
    formData.append('pointsFile', gpFile);
    formData.append('connectionsFile', incrementalFile);

    try {
      const response = await fetch(`${BASEURL_Val}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAIdata(result)
      AIMap(result)
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoader(false)
    }
  }

  useEffect(() => {
    autoModeRef.current = AutoMode;
  }, [AutoMode]);

  useEffect(() => {
    pointARef.current = pointA;
  }, [pointA]);

  useEffect(() => {
    pointBRef.current = pointB;
  }, [pointB]);

  const AIMap = (AIdata: any) => {
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

      const routeKey = `${connection?.from} TO ${connection?.to}`;
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
            startCords: '', 
            endCords: '',

          },

        },
      };

      totalLength += connection?.length || 0;
      polyline.addListener("click", (e) => {

        setPointProperties(connection)

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
            properties: {
              coordinates: coordinates
            }
          });
          if (autoModeRef.current) {
            const currentPointA = pointARef.current;
            const currentPointB = pointBRef.current;

            const isPointSame = currentPointA && !currentPointB && isSameCoordinate(currentPointA, markerPoint);

            if (!currentPointA) {
              setPointAName(name);
              setPointA(markerPoint);
            } else if (!currentPointB && !isPointSame) {
              setPointBName(name);
              setPointB(markerPoint);
            }
          }
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

    const url = `https://traceapi.keeshondcoin.com/show-route?lat1=${pointA.lat}&lng1=${pointA.lng}&lat2=${pointB.lat}&lng2=${pointB.lng}`;
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
            setPointProperties({
              name: `${pointAName} - ${pointBName}`,
              start: pointAName,
              end: pointBName,
              length: routeData.distance,
              existing: false

            });

            handleRouteSelection(routeKey, index, routeData.distance);
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
              distance: routeData.distance,
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
  }, [selectedRouteIndex, RouteKey]);

  const addDragMarkersWithRerouting = (
    polyline: google.maps.Polyline,
    routeKey: string,
    selectedId: string
  ) => {
    const path = polyline.getPath().getArray();
    const fractions = [0.25, 0.5, 0.75];
    // editMarkers.forEach(m => m.setMap(null));
    // setEditMarkers([]); 
    const existingMarkers = routeMarkers.current.get(selectedId);
    if (existingMarkers) {
      existingMarkers.forEach(m => m.setMap(null));
    }

    const allMarkers: google.maps.Marker[] = [];

    let ghostLine: google.maps.Polyline | null = null;

    const handleDragEvents = (marker: google.maps.Marker, getStart: () => google.maps.LatLng, getEnd: () => google.maps.LatLng) => {
      marker.addListener('drag', (e) => {
        const newCoord = e.latLng;
        const previewPath = [getStart(), newCoord, getEnd()];
        if (!ghostLine) {
          ghostLine = new google.maps.Polyline({
            path: previewPath,
            strokeColor: '#888',
            strokeOpacity: 0.5,
            strokeWeight: 3,
            map: mapInstance,
            zIndex: 1,
          });
        } else {
          ghostLine.setPath(previewPath);
        }
      });

      marker.addListener('dragend', async (e) => {
        if (ghostLine) {
          ghostLine.setMap(null);
          ghostLine = null;
        }

        const newCoord = e.latLng;
        const start = getStart();
        const end = getEnd();

        try {
          const res = await axios.post(
            'https://traceapi.keeshondcoin.com/compute-route',
            {
              newPos: newCoord,
              origin: start,
              destination: end,
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const data = res.data;
          if (data[0].route.length > 0) {
            const newCoords = data[0].route.map(([lat, lng]) => ({ lat, lng }));

            const currentPath = polyline.getPath().getArray().map(p => ({
              lat: p.lat(),
              lng: p.lng(),
            }));

            const history = polylineHistory.get(selectedId);
            setRouteKey(selectedId);
            setSelectRoute(routeKey);

            if (history) {
              history.undoStack = history.undoStack || [];
              history.undoStack.push(currentPath);
            }

            polyline.setPath(newCoords);
            const updatedPath = polyline.getPath().getArray();
            updateGlobalDataWithSelectedRoute(polyline, routeKey, 0, updatedPath.length);


            const newFractions = [0, 0.25, 0.5, 0.75, 1];

            allMarkers.forEach((m, i) => {
              const idx = Math.floor(updatedPath.length * newFractions[i]);
              const pos = updatedPath[idx];
              if (pos) m.setPosition(pos);
            });

            // routeMarkers.current.set(selectedId, allMarkers);

            const offsetPoint = updatedPath[Math.floor(updatedPath.length * 0.25)];
            const distanceKm = data[0].distance;

            const entry = Array.from(polylineHistory.entries()).find(([key]) =>
              key.startsWith(`${routeKey}-route`)
            );
            const oldKey = entry?.[0];
            let infoWindow = entry?.[1]?.distanceLabel;
            let oldPos: google.maps.LatLng | null = null;

            if (infoWindow) {
              oldPos = infoWindow.getPosition();
              infoWindow.close();
            }

            infoWindow = new google.maps.InfoWindow({
              content: `<div class="distance-label">${distanceKm.toFixed(2)} km</div>`,
              position: offsetPoint,
            });

            if (oldKey) {
              polylineHistory.set(oldKey, {
                ...(polylineHistory.get(oldKey) ?? {}),
                polyline,
                distanceLabel: infoWindow,
              });
            }

            setDistanceInfoWindows(prev =>
              prev.filter(
                d =>
                  !oldPos ||
                  Math.abs(d.position.lat - oldPos.lat()) > 1e-6 ||
                  Math.abs(d.position.lng - oldPos.lng()) > 1e-6
              )
            );

            setDistanceInfoWindows(prev => [
              ...prev,
              { position: offsetPoint, distance: distanceKm },
            ]);
            updateRouteSummary(polyline);

          } else {
            alert("No route found");
          }
        } catch (err) {
          console.error("Rerouting failed", err);
        }
      });
    };

    const addMarkerAt = (coord: google.maps.LatLng, index: number, getStart: () => google.maps.LatLng, getEnd: () => google.maps.LatLng) => {
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

      handleDragEvents(marker, getStart, getEnd);
      allMarkers.push(marker);


    };

    const start = path[0];
    const end = path[path.length - 1];
    addMarkerAt(start, 0, () => path[1], () => path[path.length - 1]); // Start marker
    addMarkerAt(end, 4, () => path[0], () => path[path.length - 2]);   // End marker

    fractions.forEach((f, i) => {
      const idx = Math.floor(path.length * f);
      const coord = path[idx];
      if (coord) {
        addMarkerAt(coord, i + 1, () => path[0], () => path[path.length - 1]);
      }
    });
    routeMarkers.current.set(selectedId, allMarkers);

    // setEditMarkers(allMarkers);
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

    //  editMarkers.forEach(marker => marker.setMap(null));
    //  setEditMarkers([]);

    const markers = routeMarkers.current.get(routeKey);
    if (markers) {
      markers.forEach(m => m.setMap(null));
      routeMarkers.current.delete(routeKey);
    }
    // Re-add fresh markers with drag handlers
    addDragMarkersWithRerouting(history.polyline, SelectRoute, routeKey);


    // editMarkers.forEach((m, idx) => {
    //   const pointIndex = Math.floor(updatedPath.length * fractions[idx]);
    //   const pos = updatedPath[pointIndex];
    //   if (pos) m.setPosition(pos);
    // });


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
    updateGlobalDataWithSelectedRoute(history.polyline, SelectRoute, 0, distance);
  };
  const handleRouteSelection = (routeKey: string, selectedIndex: number, Length: number) => {
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
    // Enable editing with draggable midpoints
    addDragMarkersWithRerouting(selectedPolyline, routeKey, selectedId);

    // Show summary and update global state
    updateRouteSummary(selectedPolyline);
    updateGlobalDataWithSelectedRoute(selectedPolyline, routeKey, selectedIndex, Length);
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

  };

  const updateGlobalDataWithSelectedRoute = (
    polyline: google.maps.Polyline,
    routeKey: string,
    index: number,
    Length: number
  ) => {
    const path = polyline.getPath().getArray().map(p => ({
      lat: p.lat(),
      lng: p.lng()
    }));

    // const distance = computePathDistance(path);
    const distance = Length

    // Extract fromName and toName from routeKey
    let fromName = '';
    let toName = '';
    let startLgdCode='';
    let endLgdCode='';
    for (const point of LocalData.loop) {
      if (routeKey.endsWith(`-${point.name}`)) {
        toName = point.name;
        endLgdCode = point.lgd_code;
        fromName = routeKey.slice(0, routeKey.length - point.name.length - 1);
          const fromPoint = LocalData.loop.find(p => p.name === fromName);
          if (fromPoint) {
            startLgdCode = fromPoint.lgd_code;
          }

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
      lgd_code:endPoint.lgd_code,
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
    setLocalData(prev => {
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
        [`${toName} TO ${fromName}`]: {
          polyline: {
            coordinates: path
          },

          segmentData: {
            connection: selectedRoute.connection,
            startCords:startLgdCode,
            endCords:endLgdCode,
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


  const deleteRoute = (routeKey: string, routeKeyMain: string) => {

    const history = polylineHistory.get(routeKey);
    if (!history) return;
    // Remove polyline from map
    history.polyline.setMap(null);

    // Remove edit markers from map

    //   Array.from(routeMarkers.current.values()).flat().forEach(m => {
    //     google.maps.event.clearInstanceListeners(m);
    //     m.setMap(null);
    //   });
    //  routeMarkers.current.clear();
    //  editMarkers.forEach(marker => marker.setMap(null));
    //  setEditMarkers([]);
    const markers = routeMarkers.current.get(routeKey);
    if (markers) {
      markers.forEach(m => m.setMap(null));
      routeMarkers.current.delete(routeKey);
    }
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
    routeMarkers.current.delete(routeKey);



  };

  const deleteGlobalRoute = (routeKey: string) => {
    let fromName = '';
    let toName = '';
    setRouteKey('');
    setSelectRoute('')
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
      delete updatedHistory[`${toName} TO ${fromName}`];

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
    for (const [key, markers] of routeMarkers.current.entries()) {
      markers.forEach(m => m.setMap(null));
    }
    routeMarkers.current.clear();

    setLocalData({
      loop: [],
      mainPointName: null,
      totalLength: 0,
      existinglength: 0,
      proposedlength: 0,
      polylineHistory: {},
      dt_code:'',
      dt_name: '',
      st_code:'',
      st_name:'',
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
    //  setMapInstance(null)
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

    setLocalData(prev => ({
      ...prev,
      totalLength: prev.existinglength + total,
      proposedlength: total,

    }));
    setProposedDistance(total);
  }, [LocalData.polylineHistory]);
    const userDataString = localStorage.getItem('userData');
    const UserData = userDataString ? JSON.parse(userDataString) : null;

  async function saveKML(LocalData: GlobalData) {
    const Body = {
      globalData: {
        loop: LocalData.loop,
        mainPointName: LocalData.mainPointName,
        totalLength: LocalData.totalLength,
        proposedlength: LocalData.proposedlength,
        existinglength: LocalData.existinglength,
        dt_code:LocalData.dt_code || '',
        dt_name:LocalData.dt_name || '',
        st_code:LocalData.st_code || '',
        st_name:LocalData.st_name || '',
      },
      polylineHistory: LocalData.polylineHistory,
      user_id: UserData?.user_id ?? 1,
      user_name: UserData?.uname ?? " "
    };
    try {
      setLoader(true)
      const response = await fetch('https://traceapi.keeshondcoin.com/save-kml', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Body)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setSaveFile(false);
      showNotification("success", `KML saved successfully`)
    } catch (error) {
      setSaveFile(false)
      if (error instanceof Error) {
        showNotification("error", `Error saving KML: ${error.message}`);
        console.error('Save KML error:', error);
      } else {
        showNotification("error", "An unknown error occurred while saving KML.");
        console.error('Save KML unknown error:', error);
      }
      ;
    } finally {
      setLoader(false)
    }
  }

  async function VerifySaveKML(LocalData: GlobalData) {
    const Body = {
      globalData: {
        loop: LocalData.loop,
        mainPointName: LocalData.mainPointName,
        totalLength: LocalData.totalLength,
        proposedlength: LocalData.proposedlength,
        existinglength: LocalData.existinglength,
        dt_code:LocalData.dt_code || '',
        dt_name:LocalData.dt_name || '',
        st_code:LocalData.st_code || '',
        st_name:LocalData.st_name || '',
      },
      polylineHistory: LocalData.polylineHistory,
      user_id: UserData?.user_id ?? 1,
      user_name: UserData?.uname ?? " "
    };
    try {
      setLoader(true)
      const response = await fetch('https://traceapi.keeshondcoin.com/save-to-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Body)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setVerifySaveFile(false);
      showNotification("success", `KML saved successfully`)
    } catch (error) {
      setVerifySaveFile(false)
      if (error instanceof Error) {
        showNotification("error", `Error saving KML: ${error.message}`);
        console.error('Save KML error:', error);
      } else {
        showNotification("error", "An unknown error occurred while saving KML.");
        console.error('Save KML unknown error:', error);
      }
      ;
    } finally {
      setLoader(false)
    }
  }

  useEffect(() => {
    if (SaveFile) {
      saveKML(LocalData)
    }
  }, [SaveFile])
  useEffect(() => {
    if (VerifySaveFile) {
      VerifySaveKML(LocalData)
    }
  }, [VerifySaveFile])
  const showNotification = (type: 'success' | 'error', message: string) => {
    // Clear any existing timeout to prevent multiple notifications
    if (notifierTimeoutRef.current) {
      clearTimeout(notifierTimeoutRef.current);
      notifierTimeoutRef.current = null;
    }

    setNotifier({ type, message, visible: true });

    // Auto-hide notification after 5 seconds for success, 10 seconds for error
    const hideDelay = type === 'success' ? 5000 : 10000;

    notifierTimeoutRef.current = setTimeout(() => {
      setNotifier(prev => ({ ...prev, visible: false }));
      notifierTimeoutRef.current = null;
    }, hideDelay);
  };

  async function downloadFile(DownloadFile: string) {
    if (!LocalData) {
      setError('No data available to download')
      return;
    }

    const filteredData = {
      globalData: {
        loop: LocalData.loop,
        mainPointName: LocalData.mainPointName,
        totalLength: LocalData.totalLength,
        proposedlength: LocalData.proposedlength,
        existinglength: LocalData.existinglength,
        dt_code:LocalData.dt_code || '',
        dt_name:LocalData.dt_name || '',
        st_code:LocalData.st_code || '',
        st_name:LocalData.st_name || '',
      },
      polylineHistory: LocalData.polylineHistory,
      user_id: UserData?.user_id ?? 1,
      user_name: UserData?.uname ?? " "
    };

    const payload = JSON.stringify(filteredData);
    const payloadSizeMB = new Blob([payload]).size / (1024 * 1024);

    if (payloadSizeMB > 50) {
      setError(`Error: Payload too large (${payloadSizeMB.toFixed(2)} MB`)

      return;
    }

    try {
      setLoader(true)
      const response = await fetch(`https://traceapi.keeshondcoin.com/download/${DownloadFile}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });

      if (!response.ok) {
        const error = await response.json();
        showNotification("error", `${error.error}`)

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
      setDownloadFile("")
      showNotification("success", `${DownloadFile} file downloaded`)

    } catch (error) {
      console.error('Download error:', error);
      showNotification("error", `${error}`)

      setDownloadFile("")

    } finally {
      setLoader(false)
    }
  }
  useEffect(() => {
    if (DownloadFile !== null && DownloadFile !== '') {

      downloadFile(DownloadFile)

    }
  }, [DownloadFile])

  useEffect(() => {
    if (searchValue.trim() === '') {
      setSearchResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setLoader(true)
        const res = await fetch(`https://traceapi.keeshondcoin.com/search-location?query=${encodeURIComponent(searchValue)}`);
        const data: Place[] = await res.json();
        setSearchResults(data);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setLoader(false)
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchValue]);

  const handleSelect = (place: Place) => {
    if (!map || !place?.location) return;

    const { lat, lng } = place.location;

    // Remove old marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null);
    }
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    // Create new marker
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      title: place.name,
    });

    searchMarkerRef.current = marker;

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div>
          <strong>${place.name}</strong><br/>
          ${place.formatted_address}<br/>
          Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}
        </div>
      `,
    });

    infoWindow.open(map, marker);
    infoWindowRef.current = infoWindow;

    map.setCenter({ lat, lng });
    map.setZoom(15);
    setSearchResults([]);
    setSearchValue(`${place.name}`);
  };

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
      {loader && (
        <div className="absolute top-70 right-150 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800 mx-auto mb-4"></div>
        </div>
      )}
      {/* Search Box */}
      <div className="absolute top-20 left-1 right-200 mx-auto w-45 z-10">

        <div className="relative">
          <input
            id="map-search"
            type="text"
            placeholder="Find a place"
            className={`w-full pl-10 pr-4 py-2 rounded-full shadow-md bg-white text-sm placeholder-gray-500 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-opacity duration-300 ${showSearch ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />

          {/* Show this icon inside the input only when search is open */}
          {showSearch && (
            <span className="absolute left-3 top-2.5 text-xl pointer-events-none">
              <img src={MapIcon} className="w-5" alt="Map Icon" />
            </span>
          )}

          {/* Toggle button: MapIcon when closed, × when open */}
          <button
            type="button"
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-700 z-10"
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? (
              '×'
            ) : (
              <img src={MapIcon} className="w-5" alt="Open search" />
            )}
          </button>
          {/* Dropdown results */}
          {searchResults.length > 0 && (
            <ul className="absolute top-full mt-2 left-0 w-full bg-white shadow-lg rounded-md z-20 max-h-60 overflow-y-auto">
              {searchResults.map((place, index) => (
                <li
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => handleSelect(place)}
                >
                  {place.name} ({place.formatted_address})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>


      {/* Google Map Component */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        mapTypeId="roadmap"
        options={{
          // styles: MapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          scrollwheel: true
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
                url: point?.properties?.icon || 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
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
          <div className="absolute top-15 right-4 z-50 bg-white text-white rounded-lg shadow-lg w-80 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-200 text-blue-800 flex justify-between items-center px-4 py-3">
              <h2 className="text-lg font-semibold">Route Selection</h2>
              <button className="text-blue-800 hover:text-blue-600 text-xl font-bold" onClick={() => setAutoMode(false)}>&times;</button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2">
              <p><span className="font-bold text-black">Point A:</span> <span className="text-gray-700">{pointA ? `${pointAName}` : 'Not Selected'}</span></p>
              <p><span className="font-bold text-black">Point B:</span> <span className="text-gray-700">{pointB ? `${pointBName}` : 'Not Selected'}</span></p>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-gray-300 text-black py-2 px-0 rounded-md font-medium flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!pointA || !pointB}
                  onClick={HandleCalculation}

                >
                  🧭 Calculate Route
                </button>
                <button className="flex-1 bg-gray-300 text-black py-2 px-0 rounded-md font-medium flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={RouteKey === ''} onClick={() => { setIsOpen(true) }}>
                  🗑️ Delete Route
                </button>
              </div>
            </div>
          </div>

        )}
        {lineSummary && (
          <div className="absolute top-35 left-3  overflow-hidden">
            <div className="p-3 rounded-lg shadow-md bg-white w-60 font-sans text-sm text-gray-800">
              <strong className="text-base mb-2 font-semibold text-blue-900  flex justify-between items-center ">
                Line Summary
                <button className="text-blue-800 hover:text-blue-600 text-xl font-bold" onClick={() => setLineSummary(false)}>&times;</button>

              </strong>

              <div className="mb-1.5 flex items-center">
                <div className="w-5 h-1 rounded-sm mr-2" style={{ backgroundColor: '#0f0' }}></div>
                Existing Lines: {existingDistance.toFixed(2)}km
              </div>

              <div className="mb-2.5 flex items-center">
                <div className="w-5 h-1 rounded-sm mr-2" style={{ backgroundColor: '#f00' }}></div>
                Proposed Lines: {proposedDistance.toFixed(2)}km
              </div>



              <button
                onClick={() => undoRouteChange(RouteKey)}
                className="px-3 py-1.5 bg-gray-300 hover:bg-gray-200 rounded cursor-pointer font-bold border-none flex items-center justify-center gap-2"
              >
                <img src={UndoIcon} className='w-3' />
                Undo
              </button>
            </div>
          </div>
        )}
      </GoogleMap>
      {IsOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">Delete Route</h2>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this route?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteRoute(RouteKey, SelectRoute); setIsOpen(false) }}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {Notifier.visible && (
        <div
          className={`fixed top-4 right-4 z-[10000] p-4 rounded-lg shadow-lg flex items-start max-w-md transform transition-all duration-500 ease-in-out ${Notifier.type === 'success'
            ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
            : 'bg-red-100 border-l-4 border-red-500 text-red-700'
            } animate-fadeIn`}
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          <div className="mr-3 mt-0.5">
            {Notifier.type === 'success'
              ? <CheckCircle size={20} className="text-green-500" />
              : <AlertCircle size={20} className="text-red-500" />
            }
          </div>
          <div>
            <p className="font-bold text-sm">
              {Notifier.type === 'success' ? 'Success!' : 'Oops!'}
            </p>
            <p className="text-sm">
              {Notifier.message}
            </p>
          </div>
          <button
            onClick={() => setNotifier(prev => ({ ...prev, visible: false }))}
            className="ml-auto p-1 hover:bg-opacity-20 hover:bg-gray-500 rounded"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>


  );
};

export default MapComponent;

export { MapComponent }