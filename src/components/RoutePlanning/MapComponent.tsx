import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useAppContext } from './AppContext';
import axios from 'axios';
import MapIcon from '../../images/icon/icon-Map.svg'
import UndoIcon from '../../images/icon/undo-icon.svg'
import { AlertCircle, CheckCircle, X } from 'lucide-react';


// CONSTANTS & CONFIGURATION

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

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = [
  "places",
  "drawing",
  "geometry",
  "visualization"
];
const colors = ['blue', 'green', 'gray'];


// TYPE DEFINITIONS & INTERFACES


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
  lgd_code: string;
  properties?: Record<string, any>;
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


// UTILITY COMPONENTS


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


// UTILITY FUNCTIONS


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
const BASEURL_Val = import.meta.env.VITE_TraceAPI_URL;

// MAIN COMPONENT
const MapComponent: React.FC = () => {
  
  // CONTEXT & HOOKS
  
  const { transportMode, apiGPSResponse, apiConctResponse, setPointProperties, AutoMode, setAutoMode, SaveFile, setSaveFile, DownloadFile, setDownloadFile, AIMode, setAIMode, incrementalFile, gpFile, setGPSApiResponse, setConctApiResponse,
    lineSummary, setLineSummary, VerifySaveFile, setVerifySaveFile,previewKmlData 
  } = useAppContext();
  const GoogleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GoogleKey,
    libraries,
  });

  
  // STATE DECLARATIONS
  

  // Map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Point selection state
  const [pointA, setPointA] = useState<google.maps.LatLngLiteral | null>(null);
  const [pointB, setPointB] = useState<google.maps.LatLngLiteral | null>(null);
  const [pointAName, setPointAName] = useState<string>('');
  const [pointBName, setPointBName] = useState<string>('');

  // Route management state
  const [routeGroups, setRouteGroups] = useState<Map<string, { layers: google.maps.Polyline[] }>>(new Map());
  const [polylineHistory, setPolylineHistory] = useState(new Map());
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [polylineInstanceMap, setPolylineInstanceMap] = useState<Map<string, google.maps.Polyline>>(new Map());
  const [deletedPolylines, setDeletedPolylines] = useState<Set<string>>(new Set());

  // Distance and route tracking state
  const [distanceInfoWindows, setDistanceInfoWindows] = useState<
    { position: google.maps.LatLngLiteral; distance: number }[]
  >([]);
  const [existingDistance, setExistingDistance] = useState<number>(0);
  const [proposedDistance, setProposedDistance] = useState<number>(0);

  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Data management state
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

  // UI state
  const [editMarkers, setEditMarkers] = useState<google.maps.Marker[]>([]);
  const [RouteKey, setRouteKey] = useState<any>('');
  const [SelectRoute, setSelectRoute] = useState<any>('');
  const [IsOpen, setIsOpen] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [loader, setLoader] = useState(false);


  // Search functionality state
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [showSearch, setShowSearch] = useState(true);

  // Notification state
  const [Notifier, setNotifier] = useState<NotifierState>({ type: 'success', message: '', visible: false });

  
  // REFS
  
  const searchMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const autoModeRef = useRef(AutoMode);
  const pointARef = useRef(pointA);
  const pointBRef = useRef(pointB);
  const notifierTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const routeMarkers = useRef<Map<string, google.maps.Marker[]>>(new Map());

  // Inline default values
  
  const DEFAULTS = {
  EMPTY_STRING: "",
  ZERO: 0,
  NULL_VALUE: null
};

  
  // MAP LIFECYCLE CALLBACKS
  

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

// DATA PROCESSING EFFECTS

  useEffect(() => {
  if (previewKmlData && map && isLoaded) {
    try {
      let parsed: KMLData | KMLData[] = typeof previewKmlData === "string" ? JSON.parse(previewKmlData) : previewKmlData;
      const kmlArray: KMLData[] = Array.isArray(parsed) ? parsed : [parsed];

      let allPoints: ProcessedPoint[] = [];
      let allConnections: ProcessedConnection[] = [];

      kmlArray.forEach((kmlData: KMLData, idx: number) => {
        if (kmlData.success && kmlData.data) {
          const points = kmlData.data.points.map((point: KMLPoint, i: number): ProcessedPoint => {
            let coordinates: number[];
            try {
              const coordsArray = JSON.parse(point.coordinates as string);
              coordinates = [coordsArray[0], coordsArray[1]];
            } catch (error) {
              if (Array.isArray(point.coordinates)) {
                coordinates = point.coordinates as number[];
              } else {
                coordinates = [0, 0];
              }
            }
            
            let parsedProperties: Record<string, any> = {};
            try {
              if (point.properties && typeof point.properties === 'string') {
                parsedProperties = JSON.parse(point.properties);
              } else if (point.properties && typeof point.properties === 'object') {
                parsedProperties = point.properties;
              }
            } catch (error) {
              console.warn('Failed to parse properties for point:', point.name);
            }

            return {
              name: point.name,
              coordinates: coordinates,
              lgd_code: point.lgd_code || parsedProperties.lgd_code || "NULL",
              properties: {
                id: point.id,
                network_id: point.network_id,
                created_at: point.created_at,
                updated_at: point.updated_at,
                
                FID: parsedProperties.FID || point.FID || "",
                name: parsedProperties.name || point.name,
                lat: parsedProperties.lat || coordinates[1]?.toString() || "",
                long: parsedProperties.long || coordinates[0]?.toString() || "",
                remarks: parsedProperties.remarks || "",
                
                blk_code: parsedProperties.blk_code || kmlData.data.network?.blk_code || "",
                blk_name: parsedProperties.blk_name || kmlData.data.network?.main_point_name || "",
                dt_code: parsedProperties.dt_code || kmlData.data.network?.dt_code || "",
                dt_name: parsedProperties.dt_name || kmlData.data.network?.dt_name || "",
                st_code: parsedProperties.st_code || kmlData.data.network?.st_code || "",
                st_name: parsedProperties.st_name || kmlData.data.network?.st_name || "",
                
                lgd_code: point.lgd_code || parsedProperties.lgd_code || "NULL",
                asset_code: parsedProperties.asset_code || "",
                
                location: parsedProperties.location || "",
                loc_type: parsedProperties.loc_type || "",
                obs: parsedProperties.obs || "",
                status: parsedProperties.status || point.status || "Proposed",
                geo_photo: parsedProperties.geo_photo || "",
                
                otdr_len: parsedProperties.otdr_len || "",
                conn_str: parsedProperties.conn_str || "",
                backhaul: parsedProperties.backhaul || "",
                phase: parsedProperties.phase || "3",
                route_code: parsedProperties.route_code || "",
                asset_type: parsedProperties.asset_type || "FPOI",
                
                gp_code: parsedProperties.gp_code || "",
                block_ip: parsedProperties.block_ip || "",
                gp_mac_id: parsedProperties.gp_mac_id || "",
                gp_sr_no: parsedProperties.gp_sr_no || "",
                nmsgp_cd: parsedProperties.nmsgp_cd || "",
                nmsblk_cd: parsedProperties.nmsblk_cd || "",
                
                cable_len: parsedProperties.cable_len || "0",
                ring: parsedProperties.ring || "",
                type: parsedProperties.type || parsedProperties.asset_type || "FPOI",
                
                GlobalID: parsedProperties.GlobalID || "",
                Label: parsedProperties.Label || point.name,
                
                icon: parsedProperties.icon || 
                      (parsedProperties.asset_type === "Block Router" ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" :
                       parsedProperties.asset_type === "BHQ" ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png" :
                       parsedProperties.asset_type === "GP" ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png" :
                       "https://maps.google.com/mapfiles/ms/icons/red-dot.png"),
                
                ...(i === 0 && kmlData.data.network && {
                  network_metadata: {
                    total_length: kmlData.data.network.total_length,
                    existing_length: kmlData.data.network.existing_length,
                    proposed_length: kmlData.data.network.proposed_length
                  }
                }),
                
                ...parsedProperties
              }
            };
          });

          const pointLookup = new Map<string, ProcessedPoint>();
          const pointLookupByLGD = new Map<string, ProcessedPoint>();
          const pointLookupByBaseName = new Map<string, ProcessedPoint>();
          
          points.forEach((point: ProcessedPoint) => {
            pointLookup.set(point.name, point);
            pointLookup.set(point.name.toUpperCase(), point);
            
            if (point.lgd_code && point.lgd_code !== "NULL") {
              pointLookupByLGD.set(point.lgd_code, point);
            }
            
            const baseName = point.name.replace(/\([^)]*\)$/, '').trim();
            pointLookupByBaseName.set(baseName.toUpperCase(), point);
            
            const nameVariants = [
              point.name.replace(/-/g, ' '),
              point.name.replace(/\s+/g, '-'),
              point.name.replace(/\s+/g, '_'),
              point.name.replace(/_/g, ' ')
            ];
            
            nameVariants.forEach(variant => {
              pointLookup.set(variant.toUpperCase(), point);
            });
          });

          const findPoint = (searchName: string, lgdCode?: string): ProcessedPoint | null => {
            if (!searchName) return null;
            
            if (lgdCode && lgdCode !== "NULL") {
              const found = pointLookupByLGD.get(lgdCode);
              if (found) return found;
            }
            
            let found = pointLookup.get(searchName) || pointLookup.get(searchName.toUpperCase());
            if (found) return found;
            
            found = pointLookupByBaseName.get(searchName.replace(/\([^)]*\)$/, '').trim().toUpperCase());
            if (found) return found;
            
            for (const [key, point] of pointLookup.entries()) {
              if (key.includes(searchName.toUpperCase()) || searchName.toUpperCase().includes(key)) {
                return point;
              }
            }
            
            return null;
          };

          const connections = kmlData.data.connections.map((conn: KMLConnection): ProcessedConnection => {
            let convertedCoords: number[][];
            try {
              if (typeof conn.coordinates === 'string') {
                const coordsArray = JSON.parse(conn.coordinates);
                convertedCoords = coordsArray.map((coord: any) => {
                  if (Array.isArray(coord) && coord.length === 2) {
                    const [first, second] = coord;
                    if (Math.abs(first) > 50 && Math.abs(second) < 50) {
                      return [first, second];
                    } else {
                      return [second, first];
                    }
                  }
                  return coord;
                });
              } else if (Array.isArray(conn.coordinates)) {
                convertedCoords = conn.coordinates as number[][];
              } else {
                convertedCoords = [];
              }
            } catch (error) {
              console.warn('Failed to parse coordinates for connection:', conn.name);
              convertedCoords = [];
            }

            let connectionProperties: Record<string, any> = {};
            try {
              if (conn.properties && typeof conn.properties === 'string') {
                connectionProperties = JSON.parse(conn.properties);
              } else if (conn.properties && typeof conn.properties === 'object') {
                connectionProperties = conn.properties;
              }
            } catch (error) {
              console.warn('Failed to parse connection properties');
            }

            const startPoint = findPoint(conn.start, conn.start_lgd_code);
            const endPoint = findPoint(conn.end, conn.end_lgd_code);

            return {
              start: conn.start,
              end: conn.end,
              length: Number(conn.length || 0),
              name: conn.original_name || conn.name || `${conn.start} TO ${conn.end}`,
              coordinates: convertedCoords,
              color: (conn.type === 'existing' || conn.existing === true) ? "#00AA00" : "#FF0000",
              existing: conn.type === 'existing' || conn.existing === true,
              
              id: conn.id,
              network_id: conn.network_id,
              type: conn.type,
              start_latlong: conn.start_latlong,
              end_latlong: conn.end_latlong,
              user_id: conn.user_id,
              user_name: conn.user_name,
              status: conn.status,
              created_at: conn.created_at,
              updated_at: conn.updated_at,
              
              segmentData: {
                connection: {
                  length: Number(conn.length || 0),
                  existing: conn.type === 'existing' || conn.existing === true,
                  color: conn.color || (conn.type === 'existing' ? "#00AA00" : "#FF0000")
                },
                startCords: startPoint?.lgd_code || conn.start_lgd_code || conn.start_latlong || "NULL",
                endCords: endPoint?.lgd_code || conn.end_lgd_code || conn.end_latlong || "NULL",
                properties: {
                  ...connectionProperties,
                  cs: connectionProperties.cs || conn.cs || "",
                  name: connectionProperties.name || conn.name || `${conn.start} TO ${conn.end}`,
                  asset_code: connectionProperties.asset_code || conn.asset_code || "",
                  seg_length: connectionProperties.seg_length || conn.seg_length || (conn.length ? conn.length * 1000 : 0).toString() || "0",
                  start_node: connectionProperties.start_node || conn.start,
                  end_node: connectionProperties.end_node || conn.end,
                  num_fibre: connectionProperties.num_fibre || "24",
                  status: connectionProperties.status || conn.status || (conn.type === 'existing' ? "Accepted" : "Proposed"),
                  phase: connectionProperties.phase || (conn.type === 'existing' ? "1" : "3"),
                  route_code: connectionProperties.route_code || "",
                  asset_type: connectionProperties.asset_type || "Incremental Cable",
                  type: connectionProperties.type || "Incremental Cable",
                  length: connectionProperties.length || conn.length?.toString() || "0",
                  GlobalID: connectionProperties.GlobalID || "",
                  S_N: connectionProperties.S_N || ""
                }
              },
              
              originalProperties: connectionProperties
            };
          });

          allPoints.push(...points);
          allConnections.push(...connections);
        }
      });

      setGPSApiResponse({ points: allPoints });
      setConctApiResponse({ connections: allConnections });

      if (kmlArray[0]?.data?.network) {
        const network = kmlArray[0].data.network;
        setLocalData(prev => ({
          ...prev,
          mainPointName: network.main_point_name || prev.mainPointName,
          dt_code: network.dt_code || prev.dt_code,
          dt_name: network.dt_name || prev.dt_name,
          st_code: network.st_code || prev.st_code,
          st_name: network.st_name || prev.st_name,
          totalLength: network.total_length || 0,
          existinglength: network.existing_length || 0,
          proposedlength: network.proposed_length || 0
        }));
      }

      const matchedConnections = allConnections.filter(conn => 
        conn.segmentData.startCords !== "NULL" && conn.segmentData.endCords !== "NULL"
      );
      
      showNotification("success", 
        `Loaded ${allPoints.length} points and ${allConnections.length} connections`
      );
      
    } catch (error) {
      console.error('Error parsing KML data:', error);
      showNotification("error", "Error loading KML data: Invalid format");
    }
  }
}, [previewKmlData, map, isLoaded]);

useEffect(() => {
  if (apiGPSResponse?.points?.length && map) {
    setPointProperties(apiGPSResponse?.points[0]);
    
    const connectionsByPoint = new Map<string, Connection[]>();
    
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
    
    const uniquePoints = new Map<string, any>();
    
    apiGPSResponse.points.forEach((point: any) => {
      if (!point.name.includes(" TO ")) {
        uniquePoints.set(point.name, point);
      }
    });
    
    const newLoopEntries: LoopEntry[] = Array.from(uniquePoints.values()).map((point: any) => {
      const relatedConnections = connectionsByPoint.get(point.name) || [];
      const matchedConn = relatedConnections[0];
      
      return {
        name: point.name,
        coordinates: point.coordinates,
        lgd_code: point.properties?.lgd_code || "NULL",
        properties: point.properties || {},
        ...(matchedConn && {
          connection: {
            length: matchedConn.length || 0,
            existing: previewKmlData === null ? true : matchedConn.existing,
            color: matchedConn.color || "#55ff00",
          },
          route: {
            features: [
              {
                geometry: {
                  coordinates: matchedConn.coordinates.map(([lat, lng]) => [lng, lat]),
                },
              },
            ],
          },
        }),
      };
    });

    setLocalData((prev: GlobalData) => ({
      ...prev,
      mainPointName: apiGPSResponse.points[0].properties?.blk_name || apiGPSResponse.points[0].properties?.name || '',
      dt_code: apiGPSResponse.points[0].properties?.dt_code || '',
      dt_name: apiGPSResponse.points[0].properties?.dt_name || '',
      st_code: apiGPSResponse.points[0].properties?.st_code || '',
      st_name: apiGPSResponse.points[0].properties?.st_name || '',
      loop: newLoopEntries,
    }));
    
    const bounds = new window.google.maps.LatLngBounds();
    (apiGPSResponse.points as PointType[]).forEach((point) => {
      if (Array.isArray(point.coordinates) && point.coordinates.length === 2 && !point.name.includes(" TO ")) {
        bounds.extend({ lat: point.coordinates[1], lng: point.coordinates[0] });
      }
    });
   
    map.fitBounds(bounds);
  }
}, [apiGPSResponse, apiConctResponse, map]);

  useEffect(() => {
    if (!map || !apiConctResponse?.connections?.length) return;
       polylineInstanceMap.forEach((polyline, key) => {
          if (map && polyline) {
            polyline.setMap(null);
          }
        });
    setDistanceInfoWindows([]);
    const bounds = new window.google.maps.LatLngBounds();
    let totalExisting = 0;
    
    const newPolylineHistory: Record<string, {
      instance: google.maps.Polyline;
      data: PolylineEntry;
    }> = {};
  
    apiConctResponse.connections.forEach((connection: Connection,index:any) => {
      if (!Array.isArray(connection.coordinates) || connection.coordinates.length < 2) {
        console.warn(`Skipping invalid connection: ${connection.name}`);
        return;
      }
       const key = `${connection.start} TO ${connection.end}`;

  
      if (deletedPolylines.has(key)) {
        return;
      }

      const path = connection.coordinates.map((coord) => {
        const point = { lat: coord[1], lng: coord[0] };
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
      const offsetIndex = Math.floor(path.length * 0.5);
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
              existing: previewKmlData === null ? true : connection.existing ?? false,
            },
            startCords: startLgdCode?.properties.lgd_code || '123',
            endCords: endLgdCode?.properties.lgd_code || '1234',
          }, 
        },
      };
      if (previewKmlData !== null && connection.existing) {
        totalExisting += connection.length;
      }else if(previewKmlData === null){
         totalExisting += connection.length;
      }
      const routeKey = `${connection.start}-${connection.end}`;

      if(previewKmlData !== null && connection.existing === false){
      const segmentKey = `${routeKey}-route${index + 1}`;
      const labelPos = path[Math.floor(path.length / 2)];  
        polylineHistory.set(segmentKey, {
            polyline,
            segmentData: {
              connection: {
                length: connection.length,
                existing:connection.existing ?? false,
                color: connection.color,
              },
            },
            original: {
              coords: path.slice(),
              distance: connection.length,
              markerPositions: [],
              labelPos: labelPos ? [labelPos.lat, labelPos.lng] : null,
              labelText: `${connection.length} km`
            },
            undoStack: [],
            dragMarkers: [],

            
      });
      }
      
      polyline.addListener("click", (e) => {
        setPointProperties(connection);
        if(previewKmlData !== null ){
            handleRouteSelection(routeKey, index, connection.length,true);
            setSelectedRouteIndex(index);
        }
      });
    });
    
    setPolylineInstanceMap(prev => {
      const newMap = new Map(prev);
       Object.entries(newPolylineHistory).forEach(([key, val]) => {
        newMap.set(key, val.instance);
      });
      return newMap;
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
  }, [apiConctResponse, map,deletedPolylines]);

  useEffect(() => {
    
    const total = Object.values(LocalData.polylineHistory || {})
      .filter(h => h.segmentData?.connection && !h.segmentData.connection.existing)
      .reduce((sum, h) => sum + (h.segmentData.connection.length || 0), 0);

    setLocalData(prev => ({
      ...prev,
      totalLength: prev.existinglength + total,
      proposedlength: Number(total),

    }));
    setProposedDistance(Number(total));
  }, [LocalData.polylineHistory]);

  // REF SYNCHRONIZATION EFFECTS
  

  useEffect(() => {
    // Cleanup function
    return () => {
      if (notifierTimeoutRef.current) {
        clearTimeout(notifierTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    autoModeRef.current = AutoMode;
  }, [AutoMode]);

  useEffect(() => {
    pointARef.current = pointA;
  }, [pointA]);

  useEffect(() => {
    pointBRef.current = pointB;
  }, [pointB]);

  
  // AI MODE FUNCTIONS
  

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

      // if (!response.ok) {
      //   throw new Error(`Upload failed: ${response.statusText}`);
      // }
      
      const result = await response.json();
        if (!response.ok) {
          showNotification("error", `Error saving KML: ${result.details}`);
         }else{
              //  setAIdata(result)
              //  AIMap(result)
          showNotification("success", `Block Generated Successfully`);

         }

    
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoader(false)
    }
  }

 

  useEffect(() => {
    if (AIMode && map) {
      clearMapData();
      AImodehandle()
    }
  }, [AIMode, map]);

  
  // ROUTE CALCULATION FUNCTIONS
  

  const HandleCalculation = async () => {
    if (!pointA || !pointB || !pointAName || !pointBName || !mapInstance) return;

    const url = `${BASEURL_Val}/show-route?lat1=${pointA.lat}&lng1=${pointA.lng}&lat2=${pointB.lat}&lng2=${pointB.lng}`;
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

            handleRouteSelection(routeKey, index, routeData.distance,false);
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

  
  // ROUTE SELECTION FUNCTIONS
  

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


  useEffect(() => {
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (notifierTimeoutRef.current) {
      clearTimeout(notifierTimeoutRef.current);
      notifierTimeoutRef.current = null;
    }
  };
}, []);

  const handleRouteSelection = (routeKey: string, selectedIndex: number, Length: number,preview:boolean) => {
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
    if(preview === false){
     updateGlobalDataWithSelectedRoute(selectedPolyline, routeKey, selectedIndex, Length);
     
    }
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


  //  updateGlobalDataWithSelectedRoute function
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

    const distance = Length;

    let fromName = '';
    let toName = '';
    let startLgdCode = '';
    let endLgdCode = '';
    
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
      return;
    }

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
        return;
      }
    }

    const selectedRoute: LoopEntry = {
      name: endPoint.name,
      coordinates: endPoint.coordinates,
      lgd_code: endPoint.lgd_code,
      properties: endPoint.properties || {},
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
          properties: loopCopy[existingIndex].properties || {},
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
            startCords: startLgdCode,
            endCords: endLgdCode,
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

  
  // ROUTE EDITING FUNCTIONS

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
            `${BASEURL_Val}/compute-route`,
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
          


            const newFractions = [0, 0.25, 0.5, 0.75, 1];

            allMarkers.forEach((m, i) => {
              const idx = Math.floor(updatedPath.length * newFractions[i]);
              const pos = updatedPath[idx];
              if (pos) m.setPosition(pos);
            });

            // routeMarkers.current.set(selectedId, allMarkers);

            const offsetPoint = updatedPath[Math.floor(updatedPath.length * 0.25)];
            const distanceKm = data[0].distance;

            updateGlobalDataWithSelectedRoute(polyline, routeKey, 0, distanceKm);

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

  
  // ROUTE DELETION FUNCTIONS
  

  const deleteRoute = (routeKey: string, routeKeyMain: string) => {
    const history = polylineHistory.get(routeKey);
    if (!history) return;
    // Remove polyline from map
    history.polyline.setMap(null);
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
    if(previewKmlData !== null){
      deletePolylineAndDistance(`${fromName} TO ${toName}`);
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
      delete updatedHistory[`${fromName} TO ${toName}`];
    
      return {
        ...prev,
        loop: updatedLoop,
        polylineHistory: updatedHistory
      };
    });
  };
const deletePolylineAndDistance = (key: string) => {
 
  // Remove polyline from map

  setPolylineInstanceMap(prev => {
  const newMap = new Map(prev);
  const polyline = newMap.get(key);
  if (polyline) {
    polyline.setMap(null); // remove from map
    newMap.delete(key);
  }

  setDeletedPolylines(prevSet => {
    const newSet = new Set(prevSet);
    newSet.add(key); // e.g., "PAKUAHAT TO BAMANGOLA"
    return newSet;
  });

  return newMap;
});


  // Remove distance InfoWindow
  setDistanceInfoWindows((prev) => {
    return prev.filter((info) => {
      const entry = LocalData.polylineHistory[key];
      const coords = entry?.polyline?.coordinates;
      if (!coords?.length) return true;

      const midpoint = coords[Math.floor(coords.length * 0.5)];
      return !(midpoint.lat === info.position.lat && midpoint.lng === info.position.lng);
    });
  });

  // Optionally remove from polylineHistory
  setLocalData((prev) => {
    const updatedHistory = { ...prev.polylineHistory };
    delete updatedHistory[key];
    return {
      ...prev,
      polylineHistory: updatedHistory,
    };
  });
};


  // MAP CLEANUP FUNCTIONS
  
  const clearMapData = () =>
  {
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

  
  // FILE OPERATIONS FUNCTIONS
  

  const userDataString = localStorage.getItem('userData');
  const UserData = userDataString ? JSON.parse(userDataString) : null;
 
  // saveKML function
  const saveKML = async (localData: GlobalData) => {
  if (isSaving) {
    setSaveFile(false);
    return;
  }

  if (!localData || !localData.loop || !localData.loop.length) {
    showNotification("error", "No data available to save");
    setSaveFile(false);
    return;
  }

  try {
    setIsSaving(true);
    setLoader(true);

    const userDataString = localStorage.getItem('userData');
    const UserData = userDataString ? JSON.parse(userDataString) : null;

    // Deduplicate points by name before processing
    const uniqueLoopPoints = new Map<string, any>();
    localData.loop.forEach(point => {
      if (!point.name.includes(" TO ") && !uniqueLoopPoints.has(point.name)) {
        uniqueLoopPoints.set(point.name, point);
      }
    });

    const deduplicatedPoints = Array.from(uniqueLoopPoints.values());

    // Extract administrative data from first point's properties
    const firstPoint = deduplicatedPoints[0];
    const adminCodes = {
      blockCode: firstPoint?.properties?.blk_code || '',
      blockName: firstPoint?.properties?.blk_name || localData.mainPointName || '',
      dtCode: firstPoint?.properties?.dt_code || localData.dt_code || '',
      dtName: firstPoint?.properties?.dt_name || localData.dt_name || '',
      stCode: firstPoint?.properties?.st_code || localData.st_code || '',
      stName: firstPoint?.properties?.st_name || localData.st_name || ''
    };

    // Enhanced function to build comprehensive line properties
    const buildLineProperties = (routeKey: string, historyEntry: any, adminCodes: any) => {
      const [startName, endName] = routeKey.split(' TO ');
      const segmentData = historyEntry.segmentData;
      const connection = segmentData?.connection;
      
      // Find existing properties from various sources
      let existingProperties = segmentData?.properties || {};
      
      // Try to find properties from apiConctResponse
      if (apiConctResponse?.connections) {
        const matchingConnection = apiConctResponse.connections.find(
          (conn: any) => `${conn.start} TO ${conn.end}` === routeKey || 
                        `${conn.end} TO ${conn.start}` === routeKey
        );
        if (matchingConnection?.properties) {
          existingProperties = { ...matchingConnection.properties, ...existingProperties };
        }
        if (matchingConnection?.segmentData?.properties) {
          existingProperties = { ...matchingConnection.segmentData.properties, ...existingProperties };
        }
      }

      // Build comprehensive line properties with all KML standard fields
      const lineProperties = {
        // Core identification
        cs: existingProperties.cs || "",
        name: existingProperties.name || routeKey,
        asset_code: existingProperties.asset_code || "",
        
        // Administrative codes (from extracted admin data)
        blk_code: existingProperties.blk_code || adminCodes.blockCode,
        blk_name: existingProperties.blk_name || adminCodes.blockName,
        dt_code: existingProperties.dt_code || adminCodes.dtCode,
        dt_name: existingProperties.dt_name || adminCodes.dtName,
        st_code: existingProperties.st_code || adminCodes.stCode,
        st_name: existingProperties.st_name || adminCodes.stName,
        
        // Length and measurements
        seg_length: existingProperties.seg_length || (connection?.length * 1000)?.toString() || "0",
        length: existingProperties.length || connection?.length?.toString() || "0",
        cable_len: existingProperties.cable_len || (connection?.length * 1000)?.toString() || "0",
        
        // Node information
        start_node: existingProperties.start_node || startName || "",
        end_node: existingProperties.end_node || endName || "",
        s_coil_len: existingProperties.s_coil_len || "0",
        e_coil_len: existingProperties.e_coil_len || "0",
        
        // Technical specifications
        num_fibre: existingProperties.num_fibre || "",
        fibre_pos: existingProperties.fibre_pos || "",
        fibre_type: existingProperties.fibre_type || "",
        cable_type: existingProperties.cable_type || "",
        
        // Status and phase information
        status: existingProperties.status || (connection?.existing ? "Accepted" : "Proposed"),
        phase: existingProperties.phase || (connection?.existing ? "1" : "3"),
        existing: existingProperties.existing || connection?.existing || false,
        
        // Asset classification
        asset_type: existingProperties.asset_type || "",
        type: existingProperties.type || "",
        route_type: existingProperties.route_type || "",
        
        // Route and path information
        route_code: existingProperties.route_code || "",
        route_name: existingProperties.route_name || routeKey,
        direction: existingProperties.direction || "",
        traverse: existingProperties.traverse || "",
        
        // Geographic and location data
        start_lat: existingProperties.start_lat || "",
        start_lng: existingProperties.start_lng || "",
        end_lat: existingProperties.end_lat || "",
        end_lng: existingProperties.end_lng || "",
        
        // Construction and maintenance
        remarks: existingProperties.remarks || "",
        obs: existingProperties.obs || "",
        notes: existingProperties.notes || "",
        construction_method: existingProperties.construction_method || "",
        contractor: existingProperties.contractor || "",
        
        // Dates and timeline
        install_date: existingProperties.install_date || "",
        completion_date: existingProperties.completion_date || "",
        created_at: existingProperties.created_at || new Date().toISOString(),
        updated_at: existingProperties.updated_at || new Date().toISOString(),
        
        // Network and connectivity
        ring: existingProperties.ring || "",
        network_id: existingProperties.network_id || "",
        segment_id: existingProperties.segment_id || "",
        
        // Cost and project information
        estimated_cost: existingProperties.estimated_cost || "",
        actual_cost: existingProperties.actual_cost || "",
        project_code: existingProperties.project_code || "",
        budget_code: existingProperties.budget_code || "",
        
        // Quality and testing
        test_result: existingProperties.test_result || "",
        signal_strength: existingProperties.signal_strength || "",
        attenuation: existingProperties.attenuation || "",
        
        // Visual properties
        color: existingProperties.color || connection?.color || "#00AA00",
        stroke_width: existingProperties.stroke_width || "4",
        stroke_opacity: existingProperties.stroke_opacity || "1.0",
        
        // System fields
        GlobalID: existingProperties.GlobalID || "",
        S_N: existingProperties.S_N || "",
        FID: existingProperties.FID || "",
        OBJECTID: existingProperties.OBJECTID || "",
        
        // User information
        created_by: existingProperties.created_by || UserData?.uname || "Unknown User",
        modified_by: existingProperties.modified_by || UserData?.uname || "Unknown User",
        user_id: existingProperties.user_id || UserData?.user_id || 1,
        
        // Preserve any additional custom properties
        ...existingProperties
      };

      return lineProperties;
    };

    // Process connections with FULL properties
    const connectionsData = Object.entries(localData.polylineHistory || {}).map(([routeKey, historyEntry]) => {
      const segmentData = historyEntry.segmentData;
      const polylineCoords = historyEntry.polyline?.coordinates || [];
      
      const lineProperties = buildLineProperties(routeKey, historyEntry, adminCodes);
      
      return {
        routeKey: routeKey,
        coordinates: polylineCoords,
        length: segmentData?.connection?.length || 0,
        existing: segmentData?.connection?.existing ?? false,
        color: segmentData?.connection?.color || "#00AA00",
        startCords: segmentData?.startCords || "NULL",
        endCords: segmentData?.endCords || "NULL",
        properties: lineProperties
      };
    });

    // Build payload with complete data structure
    const payload = {
      globalData: {
        loop: deduplicatedPoints.map((point) => ({
          name: point.name,
          coordinates: point.coordinates,
          lgd_code: point.lgd_code || null,
          // Include FULL properties with all fields
          properties: {
            // Core identification fields
            FID: point.properties?.FID || "",
            name: point.properties?.name || point.name,
            lat: point.properties?.lat || (point.coordinates[1]?.toString() || ""),
            long: point.properties?.long || (point.coordinates[0]?.toString() || ""),
            remarks: point.properties?.remarks || "",
            
            // Administrative fields
            blk_code: point.properties?.blk_code || adminCodes.blockCode,
            blk_name: point.properties?.blk_name || adminCodes.blockName,
            dt_code: point.properties?.dt_code || adminCodes.dtCode,
            dt_name: point.properties?.dt_name || adminCodes.dtName,
            st_code: point.properties?.st_code || adminCodes.stCode,
            st_name: point.properties?.st_name || adminCodes.stName,
            
            // Asset identification
            lgd_code: point.properties?.lgd_code || point.lgd_code || null,
            asset_code: point.properties?.asset_code || "",
            
            // Location and type fields
            location: point.properties?.location || "",
            loc_type: point.properties?.loc_type || "",
            obs: point.properties?.obs || "",
            status: point.properties?.status || "Proposed",
            geo_photo: point.properties?.geo_photo || "",
            
            // Technical fields
            otdr_len: point.properties?.otdr_len || "",
            conn_str: point.properties?.conn_str || "",
            backhaul: point.properties?.backhaul || "",
            phase: point.properties?.phase || "3",
            route_code: point.properties?.route_code || "",
            asset_type: point.properties?.asset_type || "",
            
            // Network fields
            gp_code: point.properties?.gp_code || "",
            block_ip: point.properties?.block_ip || "",
            gp_mac_id: point.properties?.gp_mac_id || "",
            gp_sr_no: point.properties?.gp_sr_no || "",
            nmsgp_cd: point.properties?.nmsgp_cd || "",
            nmsblk_cd: point.properties?.nmsblk_cd || "",
            
            // Cable and ring fields
            cable_len: point.properties?.cable_len || "0",
            ring: point.properties?.ring || "",
            type: point.properties?.type || point.properties?.asset_type || "",
            
            // System fields
            GlobalID: point.properties?.GlobalID || "",
            Label: point.properties?.Label || point.name,
            
            // Preserve any additional custom properties
            ...point.properties
          },
          // Include connection data if exists
          ...(point.connection && {
            connection: {
              length: point.connection.length,
              existing: point.connection.existing,
              color: point.connection.color
            }
          }),
          // Include route data if exists
          ...(point.route && {
            route: point.route
          })
        })),
        // Administrative data
        mainPointName: adminCodes.blockName,
        blk_code: adminCodes.blockCode,
        blk_name: adminCodes.blockName,
        totalLength: localData.totalLength || 0,
        existinglength: localData.existinglength || 0,
        proposedlength: localData.proposedlength || 0,
        dt_code: adminCodes.dtCode,
        dt_name: adminCodes.dtName,
        st_code: adminCodes.stCode,
        st_name: adminCodes.stName
      },
      // Enhanced polylineHistory with comprehensive line properties
      polylineHistory: Object.fromEntries(
        Object.entries(localData.polylineHistory || {}).map(([key, value]) => {
          const lineProperties = buildLineProperties(key, value, adminCodes);
          
          return [
            key,
            {
              polyline: value.polyline,
              segmentData: {
                connection: value.segmentData?.connection || {
                  length: 0,
                  existing: false,
                  color: "#00AA00"
                },
                startCords: value.segmentData?.startCords || "NULL",
                endCords: value.segmentData?.endCords || "NULL",
                properties: lineProperties
              },
              // Include distanceLabel if exists
              ...(value.distanceLabel && { distanceLabel: value.distanceLabel })
            }
          ];
        })
      ),
      connections: connectionsData,
      user_id: UserData?.user_id ?? 1,
      user_name: UserData?.uname ?? "Unknown User",
      created_at: new Date().toISOString(),
      // Add metadata
      metadata: {
        version: "1.0",
        export_date: new Date().toISOString(),
        source: "MapComponent",
        total_points: deduplicatedPoints.length,
        total_connections: Object.keys(localData.polylineHistory || {}).length,
        line_properties_version: "2.0"
      }
    };

    const payloadString = JSON.stringify(payload);
    const payloadSizeMB = new Blob([payloadString]).size / (1024 * 1024);

    if (payloadSizeMB > 50) {
      showNotification("error", `Payload too large (${payloadSizeMB.toFixed(2)} MB). Please reduce data size.`);
      setIsSaving(false);
      setLoader(false);
      setSaveFile(false);
      return;
    }

    const response = await fetch(`${BASEURL_Val}/save-to-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payloadString
    });

    let result;
    try {
      const responseText = await response.text();
      if (responseText) {
        result = JSON.parse(responseText);
      } else {
        result = { message: "Empty response from server" };
      }
    } catch (parseError) {
      result = { error: "Invalid JSON response from server" };
    }

    if (!response.ok) {
      showNotification("error", `Error saving KML: ${result?.details || result?.message || result?.error || `HTTP ${response.status}: ${response.statusText}`}`);
    } else {
      showNotification("success", `KML saved successfully! Network ID: ${result?.networkId || 'N/A'} ${result?.message || ''}`);
      
      // Update local data with server response if provided
      if (result?.data) {
        setLocalData(prev => ({
          ...prev,
          ...result.data,
          // Preserve polylineHistory with updated properties if server returns them
          polylineHistory: result.data.polylineHistory || prev.polylineHistory
        }));
      }
      
      // Clear the save flag
      setSaveFile(false);
    }

  } catch (error) {
    console.error('SaveKML Error Details:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      showNotification("error", "Network error: Unable to connect to server. Please check if the backend is running.");
    } else if (error instanceof Error) {
      showNotification("error", `Error saving KML: ${error.message}`);
    } else {
      showNotification("error", "An unknown error occurred while saving KML data.");
    }
  } finally {
    setIsSaving(false);
    setLoader(false);
    setSaveFile(false);
  }
};

useEffect(() => {
  if (SaveFile && !isSaving) {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveKML(LocalData);
    }, 500);
  } else if (SaveFile && isSaving) {
    setSaveFile(false);
  }

  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };
}, [SaveFile, isSaving, LocalData]);

  async function VerifySaveKML(previewKmlData:any) {
     const kmlData = JSON.parse(previewKmlData);     
   const Body={
     networkId:kmlData?.data?.points[0].network_id || 0
   }
    try {
      setLoader(true)
      const response = await fetch(`${BASEURL_Val}/verify-network`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Body)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setVerifySaveFile(false);
      showNotification("success", `KML verified successfully`)
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
      const response = await fetch(`${BASEURL_Val}/download/${DownloadFile}`, {
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
    if (SaveFile) {
      saveKML(LocalData)
    }
  }, [SaveFile])

  useEffect(() => {
    if (VerifySaveFile && previewKmlData) {
      VerifySaveKML(previewKmlData)
    }
  }, [VerifySaveFile])

  useEffect(() => {
    if (DownloadFile !== null && DownloadFile !== '') {

      downloadFile(DownloadFile)

    }
  }, [DownloadFile])

  
  // SEARCH FUNCTIONALITY

  useEffect(() => {
    if (searchValue.trim() === '') {
      setSearchResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setLoader(true)
        const res = await fetch(`${BASEURL_Val}/search-location?query=${encodeURIComponent(searchValue)}`);
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

  
  // NOTIFICATION FUNCTIONS
  

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

  // ---------------------------------------------------------------------------
  // LOADING AND ERROR HANDLING
  // ---------------------------------------------------------------------------

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

  
  // RENDER
  

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
            lat: point.coordinates[1], 
            lng: point.coordinates[0], 
          };
  
          const isPointSame = pointA && !pointB && isSameCoordinate(pointA, position);

          return (
            <Marker
              key={`marker-${index}-${point.name}`}
              position={position}
              icon={{
                url: point?.properties?.icon?.startsWith("http")
                  ? point.properties.icon
                  : 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
                scaledSize: new window.google.maps.Size(30, 30),
              }}
              title={point.name}
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
              }}
            />
          )
        })}
        {distanceInfoWindows.map((info, idx) => (
          <DistanceLabel
            key={idx}
            position={info.position}
            text={`${info.distance?.toFixed(2)} km`}
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