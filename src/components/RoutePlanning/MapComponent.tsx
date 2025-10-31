import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useAppContext } from './AppContext';
import axios from 'axios';
import MapIcon from '../../images/icon/icon-Map.svg'
import UndoIcon from '../../images/icon/undo-icon.svg'
import { AlertCircle, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';



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

interface KMLData {
  success: boolean;
  data?: {
    points?: KMLPoint[];
    connections?: KMLConnection[];
    network?: {
      id?: number;
      main_point_name?: string;
      blk_code?: string;
      dt_code?: string;
      dt_name?: string;
      st_code?: string;
      st_name?: string;
      total_length?: number;
      existing_length?: number;
      proposed_length?: number;
    };
  };
}

interface KMLPoint {
  id?: number;
  name: string;
  coordinates: string | number[] | any;
  lgd_code?: string;
  properties?: string | Record<string, any>;
  status?: string;
  network_id?: number;
  created_at?: string;
  updated_at?: string;
  FID?: string;
}

interface KMLConnection {
  id?: number;
  name?: string;
  original_name?: string;
  start: string;
  end: string;
  length?: number;
  coordinates?: string | number[][];
  type?: string;
  existing?: boolean;
  color?: string;
  properties?: string | Record<string, any>;
  network_id?: number;
  status?: string;
  user_id?: number;
  user_name?: string;
  created_at?: string;
  updated_at?: string;
  start_latlong?: string;
  end_latlong?: string;
  start_lgd_code?: string;
  end_lgd_code?: string;
  cs?: string;
  asset_code?: string;
  seg_length?: string;
}

interface ProcessedPoint {
  name: string;
  coordinates: number[];
  lgd_code: string;
  properties: Record<string, any>;
}

interface ProcessedConnection {
  start: string;
  end: string;
  length: number;
  name: string;
  coordinates: number[][];
  color: string;
  existing: boolean;
  id?: number;
  network_id?: number;
  type?: string;
  status?: string;
  segmentData: {
    connection: {
      length: number;
      existing: boolean;
      color: string;
    };
    startCords: string;
    endCords: string;
    properties: Record<string, any>;
  };
  originalProperties?: Record<string, any>;
  [key: string]: any;
}

interface StateData {
  state_id: string;
  state_name: string;
  state_code: string;
}

interface District {
  district_id: string;
  district_name: string;
  state_code: string;
}

interface Block {
  block_id: string;
  block_name: string;
  district_code: string;
}

interface LocationFilters {
  state: string;
  district: string;
  block: string;
  state_name?: string;
  district_name?: string;
  block_name?: string;
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
  
  // Extended properties for database/API integration
  id?: number;
  network_id?: number;
  type?: string;
  status?: string;
  user_id?: number;
  user_name?: string;
  created_at?: string;
  updated_at?: string;
  
  // Coordinate information
  start_latlong?: string;
  end_latlong?: string;
  start_lgd_code?: string;
  end_lgd_code?: string;
  
  // Additional properties from API responses
  originalProperties?: Record<string, any>;
  
  // Segment data for route information
  segmentData?: {
    connection: {
      length: number;
      existing: boolean;
      color?: string;
    };
    startCords?: string;
    endCords?: string;
    properties?: Record<string, any>;
  };
  
  // Additional metadata fields that might come from KML/API
  original_name?: string;
  cs?: string;
  asset_code?: string;
  seg_length?: string;
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

interface StandardUserData {
  user_id: number;
  uname: string;
  email?: string;
  company_id?: number;
}


const BASEURL = import.meta.env.VITE_API_BASE;

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

const getStandardUserData = (): StandardUserData => {
  try {
    const userDataString = localStorage.getItem('userData');
    
    if (!userDataString) {
      console.warn('No user data found in localStorage');
      return {
        user_id: 1,
        uname: "Anonymous User"
      };
    }

    const rawUserData = JSON.parse(userDataString);
    
    if (!rawUserData || typeof rawUserData !== 'object') {
      console.warn('Invalid user data structure in localStorage');
      return {
        user_id: 1,
        uname: "Anonymous User"
      };
    }

    const standardUserData: StandardUserData = {
      user_id: rawUserData.id || 1,                    
      uname: rawUserData.name || "Anonymous User",
      email: rawUserData.email || undefined,
      company_id: rawUserData.company_id || undefined 
    };

    // Validation
    if (!standardUserData.user_id || !standardUserData.uname) {
      console.warn('Incomplete user data, using fallback');
      return {
        user_id: 1,
        uname: "Anonymous User"
      };
    }

    return standardUserData;

  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return {
      user_id: 1,
      uname: "Anonymous User"
    };
  }
};

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
  const [routeGroups, setRouteGroups] = useState<Map<string, { layers: (google.maps.Polyline | google.maps.InfoWindow)[] }>>(new Map());
  const [polylineHistory, setPolylineHistory] = useState(new Map());
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
    const [markerInstanceMap, setMarkerInstanceMap] = useState<Map<string, google.maps.Marker>>(new Map());
  const [polylineInstanceMap, setPolylineInstanceMap] = useState<Map<string, google.maps.Polyline>>(new Map());
  const [deletedPolylines, setDeletedPolylines] = useState<Set<string>>(new Set());
  const [newConnections, setNewConnections] = useState<ProcessedConnection[]>([]);


  // Distance and route tracking state
  const [distanceInfoWindows, setDistanceInfoWindows] = useState<
    { position: google.maps.LatLngLiteral; distance: number }[]
  >([]);
  const [existingDistance, setExistingDistance] = useState<number>(0);
  const [proposedDistance, setProposedDistance] = useState<number>(0);

  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showLegend, setShowLegend] = useState(true);

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

const [searchParams, setSearchParams] = useSearchParams();
const [states, setStates] = useState<StateData[]>([]);
const [districts, setDistricts] = useState<District[]>([]);
const [blocks, setBlocks] = useState<Block[]>([]);
const [selectedState, setSelectedState] = useState<string | null>(null);
const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
const [loadingStates, setLoadingStates] = useState<boolean>(false);
const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
const [loadingBlocks, setLoadingBlocks] = useState<boolean>(false);
const [showLocationPanel, setShowLocationPanel] = useState(false);
const [showLocationFilters, setShowLocationFilters] = useState(true);



  
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
      let parsed: KMLData | KMLData[];
      try {
        parsed = typeof previewKmlData === "string" ? JSON.parse(previewKmlData) : previewKmlData;
      } catch (parseError) {
        console.error("❌ JSON Parse Error:", parseError);
        showNotification("error", "Invalid KML data format: Unable to parse JSON");
        return;
      }

      const kmlArray: KMLData[] = Array.isArray(parsed) ? parsed : [parsed];
      
      console.log("=== PREVIEW KML DATA RECEIVED ===", {
        rawData: parsed,
        summary: {
          totalFiles: kmlArray.length,
          pointsPerFile: kmlArray.map((kml, idx) => ({
            fileIndex: idx,
            pointsCount: kml.data?.points?.length || 0,
            connectionsCount: kml.data?.connections?.length || 0
          })),
          totalPoints: kmlArray.reduce((sum, kml) => sum + (kml.data?.points?.length || 0), 0),
          totalConnections: kmlArray.reduce((sum, kml) => sum + (kml.data?.connections?.length || 0), 0),
          networkInfo: kmlArray[0]?.data?.network || null
        },
        samplePoints: kmlArray[0]?.data?.points?.slice(0, 3) || [],
        sampleConnections: kmlArray[0]?.data?.connections?.slice(0, 3) || []
      });

      let allPoints: ProcessedPoint[] = [];
      let allConnections: ProcessedConnection[] = [];
      let processingErrors: string[] = [];

      kmlArray.forEach((kmlData: KMLData, idx: number) => {
        if (!kmlData.success || !kmlData.data) {
          console.warn(`❌ File ${idx + 1}: Invalid or unsuccessful data`);
          processingErrors.push(`KML file ${idx + 1}: Invalid or unsuccessful data`);
          return;
        }

        const data = kmlData.data;

        // PROCESS POINTS
        if (data.points && Array.isArray(data.points)) {
          const points = data.points.map((point: KMLPoint, i: number): ProcessedPoint => {
            let coordinates: number[] = [0, 0];
            
            // 🔥 CRITICAL FIX: Parse coordinates if they're a string
            try {
              let coordsToProcess = point.coordinates;
              
              // If coordinates is a string, parse it first
              if (typeof coordsToProcess === 'string') {
                coordsToProcess = JSON.parse(coordsToProcess);
              }
              
              // Now handle the parsed/original coordinates
              if (Array.isArray(coordsToProcess) && coordsToProcess.length >= 2) {
                coordinates = [Number(coordsToProcess[0]) || 0, Number(coordsToProcess[1]) || 0];
              } else if (coordsToProcess && typeof coordsToProcess === 'object') {
                const coords = coordsToProcess as any;
                if (coords.lat !== undefined && coords.lng !== undefined) {
                  coordinates = [Number(coords.lng) || 0, Number(coords.lat) || 0];
                } else if (coords[0] !== undefined && coords[1] !== undefined) {
                  coordinates = [Number(coords[0]) || 0, Number(coords[1]) || 0];
                }
              }
            } catch (error) {
              console.error(`Point ${i} coordinate parsing error:`, error, point.coordinates);
              coordinates = [0, 0];
            }

            let parsedProperties: Record<string, any> = {};
            try {
              if (point.properties) {
                if (typeof point.properties === 'string') {
                  parsedProperties = JSON.parse(point.properties);
                } else if (typeof point.properties === 'object') {
                  parsedProperties = { ...point.properties };
                }
              }
            } catch (error) {
              console.error(`Point ${i} properties parsing error:`, error);
              parsedProperties = {};
            }

            const adminData = {
              blk_code: parsedProperties.blk_code || data.network?.blk_code || "",
              blk_name: parsedProperties.blk_name || data.network?.main_point_name || "",
              dt_code: parsedProperties.dt_code || data.network?.dt_code || "",
              dt_name: parsedProperties.dt_name || data.network?.dt_name || "",
              st_code: parsedProperties.st_code || data.network?.st_code || "",
              st_name: parsedProperties.st_name || data.network?.st_name || ""
            };

            // 🔥 FIX: Use properties.name first (for BJC-11, SJC-15, etc.)
            const pointName = parsedProperties.name || point.name || `Unnamed_Point_${i}`;

            const processedPoint: ProcessedPoint = {
              name: pointName,  // ✅ Now gets "BJC-11" instead of "BJC"
              coordinates: coordinates,
              lgd_code: point.lgd_code || parsedProperties.lgd_code || "NULL",
              properties: {
                id: point.id,
                network_id: point.network_id,
                created_at: point.created_at,
                updated_at: point.updated_at,
                
                FID: parsedProperties.FID || point.FID || "",
                name: pointName,  // ✅ Use the same name
                lat: parsedProperties.lat || coordinates[1]?.toString() || "",
                long: parsedProperties.long || coordinates[0]?.toString() || "",
                remarks: parsedProperties.remarks || "",
                
                ...adminData,
                
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
                
                // 🔥 FIX: Use properties.type first (BJC, SJC, LC, etc.)
                asset_type: parsedProperties.type || point.type || parsedProperties.asset_type || "FPOI",
                type: parsedProperties.type || point.type || parsedProperties.asset_type || "FPOI",
                
                olt_code: parsedProperties.olt_code || "",
                olt_ip: parsedProperties.olt_ip || "",
                rd_offset: parsedProperties.rd_offset || "",
                coil_2_ont: parsedProperties.coil_2_ont || "",
                coil_2_olt: parsedProperties.coil_2_olt || "",
                direction: parsedProperties.direction || "",
                fiber_pos: parsedProperties.fiber_pos || "",
                created_us: parsedProperties.created_us || "",
                created_da: parsedProperties.created_da || "",
                last_edite: parsedProperties.last_edite || "",
                last_edi_1: parsedProperties.last_edi_1 || "",
                
                gp_code: parsedProperties.gp_code || "",
                block_ip: parsedProperties.block_ip || "",
                gp_mac_id: parsedProperties.gp_mac_id || "",
                gp_sr_no: parsedProperties.gp_sr_no || "",
                nmsgp_cd: parsedProperties.nmsgp_cd || "",
                nmsblk_cd: parsedProperties.nmsblk_cd || "",
                
                cable_len: parsedProperties.cable_len || "0",
                ring: parsedProperties.ring || "",
                
                GlobalID: parsedProperties.GlobalID || parsedProperties.globalid || "",
                Label: parsedProperties.Label || pointName,
                
                // 🔥 FIX: Icon logic based on type
                icon: parsedProperties.icon || 
                      (parsedProperties.type === "Block Router" || point.type === "Block Router" ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png" :
                       parsedProperties.type === "BHQ" || point.type === "BHQ" ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png" :
                       parsedProperties.type === "GP" || point.type === "GP" ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png" :
                       parsedProperties.type === "BJC" || point.type === "BJC" ? "https://maps.google.com/mapfiles/ms/icons/purple-dot.png" :
                       parsedProperties.type === "SJC" || point.type === "SJC" ? "https://maps.google.com/mapfiles/ms/icons/orange-dot.png" :
                       parsedProperties.type === "LC" || point.type === "LC" ? "https://maps.google.com/mapfiles/ms/icons/pink-dot.png" :
                       parsedProperties.type === "N Highway Cross" || point.type === "N Highway Cross" ? "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png" :
                       "https://maps.google.com/mapfiles/ms/icons/red-dot.png"),
                
                ...(i === 0 && data.network && {
                  network_metadata: {
                    total_length: data.network.total_length,
                    existing_length: data.network.existing_length,
                    proposed_length: data.network.proposed_length,
                    main_point_name: data.network.main_point_name,
                    network_id: data.network.id
                  }
                }),
                
                ...parsedProperties,
                
                _parsing_info: {
                  source_file: idx,
                  original_coordinates_type: typeof point.coordinates,
                  original_coordinates_value: point.coordinates,
                  original_properties_type: typeof point.properties,
                  coordinates_parsed_successfully: coordinates[0] !== 0 || coordinates[1] !== 0,
                  properties_parsed_successfully: Object.keys(parsedProperties).length > 0,
                  original_point_name: point.name,
                  properties_point_name: parsedProperties.name
                }
              }
            };

            return processedPoint;
          });

          console.log(`✅ Processed ${points.length} points from file ${idx + 1}`);
          console.log("Sample processed point:", points[0]);
          
          allPoints.push(...points);
        } else {
          console.warn(`❌ File ${idx + 1}: No points data found`);
          processingErrors.push(`KML file ${idx + 1}: No points data found`);
        }

        // PROCESS CONNECTIONS
        if (data.connections && Array.isArray(data.connections)) {
          const pointLookup = new Map<string, ProcessedPoint>();
          const pointLookupByLGD = new Map<string, ProcessedPoint>();
          const pointLookupByBaseName = new Map<string, ProcessedPoint>();
          
          allPoints.forEach((point: ProcessedPoint) => {
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
              point.name.replace(/_/g, ' '),
              point.name.replace(/[^a-zA-Z0-9]/g, '')
            ];
            
            nameVariants.forEach(variant => {
              pointLookup.set(variant.toUpperCase(), point);
            });
          });

          const connections = data.connections.map((conn: KMLConnection, i: number): ProcessedConnection => {
            let convertedCoords: number[][] = [];
            
            // 🔥 CRITICAL FIX: Parse connection coordinates if they're a string
            try {
              let coordsToProcess = conn.coordinates;
              
              if (typeof coordsToProcess === 'string') {
                coordsToProcess = JSON.parse(coordsToProcess);
              }
              
              if (Array.isArray(coordsToProcess)) {
                convertedCoords = coordsToProcess.map((coord: any) => {
                  if (Array.isArray(coord) && coord.length >= 2) {
                    const [first, second] = coord;
                    const num1 = Number(first) || 0;
                    const num2 = Number(second) || 0;
                    
                    // Detect which is lat and which is lng
                    if (Math.abs(num1) > Math.abs(num2) && Math.abs(num2) < 90) {
                      return [num1, num2]; // [lng, lat]
                    } else {
                      return [num2, num1]; // [lat, lng] → swap to [lng, lat]
                    }
                  }
                  return coord;
                });
              }
            } catch (error) {
              console.error(`Connection ${i + 1} coordinate parsing error:`, error);
              convertedCoords = [];
            }

            // Calculate distance
            let calculatedDistance = 0;
            let distanceSource = 'stored';
            
            if (convertedCoords.length >= 2) {
              const coordsForDistance = convertedCoords.map(coord => ({
                lat: coord[1],
                lng: coord[0]
              }));
              calculatedDistance = computePathDistance(coordsForDistance);
              distanceSource = 'calculated';
            } else if (conn.length && Number(conn.length) > 0) {
              calculatedDistance = Number(conn.length);
              distanceSource = 'stored';
            }

            // Parse connection properties
            let connectionProperties: Record<string, any> = {};
            try {
              if (conn.properties) {
                if (typeof conn.properties === 'string') {
                  connectionProperties = JSON.parse(conn.properties);
                } else if (typeof conn.properties === 'object') {
                  connectionProperties = { ...conn.properties };
                }
              }
            } catch (error) {
              console.error(`Connection ${i + 1} properties parsing error:`, error);
              connectionProperties = {};
            }

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

            const startPoint = findPoint(conn.start, conn.start_lgd_code);
            const endPoint = findPoint(conn.end, conn.end_lgd_code);

            const isExisting = conn.type === 'existing' || 
                             conn.existing === true || 
                             connectionProperties.existing === true ||
                             connectionProperties.status === 'Accepted' ||
                             connectionProperties.phase === '1';
            
            const connectionColor = isExisting ? "#00AA00" : "#FF0000";

            const processedConnection: ProcessedConnection = {
              start: conn.start || "Unknown_Start",
              end: conn.end || "Unknown_End",
              length: calculatedDistance,
              name: conn.original_name || conn.name || `${conn.start} TO ${conn.end}`,
              coordinates: convertedCoords,
              color: connectionColor,
              existing: isExisting,
              
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
              
              start_lgd_code: conn.start_lgd_code,
              end_lgd_code: conn.end_lgd_code,
              
              segmentData: {
                connection: {
                  length: calculatedDistance,
                  existing: isExisting,
                  color: connectionColor
                },
                startCords: startPoint?.lgd_code || conn.start_lgd_code || conn.start_latlong || "NULL",
                endCords: endPoint?.lgd_code || conn.end_lgd_code || conn.end_latlong || "NULL",
                properties: {
                  cs: connectionProperties.cs || conn.cs || "",
                  name: connectionProperties.name || conn.name || `${conn.start} TO ${conn.end}`,
                  asset_code: connectionProperties.asset_code || conn.asset_code || "",
                  seg_length: connectionProperties.seg_length || conn.seg_length || (calculatedDistance ? (calculatedDistance * 1000).toString() : "0"),
                  length: connectionProperties.length || calculatedDistance?.toString() || "0",
                  cable_len: connectionProperties.cable_len || (calculatedDistance ? (calculatedDistance * 1000).toString() : "0"),
                  start_node: connectionProperties.start_node || conn.start,
                  end_node: connectionProperties.end_node || conn.end,
                  num_fibre: connectionProperties.num_fibre || "24",
                  status: connectionProperties.status || conn.status || (isExisting ? "Accepted" : "Proposed"),
                  phase: connectionProperties.phase || (isExisting ? "1" : "3"),
                  existing: connectionProperties.existing !== undefined ? connectionProperties.existing : isExisting,
                  asset_type: connectionProperties.asset_type || "Incremental Cable",
                  type: connectionProperties.type || "Incremental Cable",
                  route_code: connectionProperties.route_code || "",
                  blk_code: connectionProperties.blk_code || data.network?.blk_code || "",
                  blk_name: connectionProperties.blk_name || data.network?.main_point_name || "",
                  dt_code: connectionProperties.dt_code || data.network?.dt_code || "",
                  dt_name: connectionProperties.dt_name || data.network?.dt_name || "",
                  st_code: connectionProperties.st_code || data.network?.st_code || "",
                  st_name: connectionProperties.st_name || data.network?.st_name || "",
                  ...connectionProperties
                }
              },
              
              originalProperties: connectionProperties
            };

            return processedConnection;
          });

          console.log(`✅ Processed ${connections.length} connections from file ${idx + 1}`);
          allConnections.push(...connections);
        }
      });
      
      // ==========================================
      // ✅ NO JUNCTION EXTRACTION NEEDED - ALREADY IN POINTS
      // ==========================================
      
      console.log("=== ALL POINTS ALREADY INCLUDE JUNCTIONS ===", {
        totalPoints: allPoints.length,
        pointsByType: allPoints.reduce((acc, p) => {
          const type = p.properties?.type || p.properties?.asset_type || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        pointsByName: {
          BJC: allPoints.filter(p => /BJC/i.test(p.name)).length,
          SJC: allPoints.filter(p => /SJC/i.test(p.name)).length,
          LC: allPoints.filter(p => /LC|LUP/i.test(p.name)).length,
          GP: allPoints.filter(p => /GP/i.test(p.name)).length,
          BHQ: allPoints.filter(p => /BHQ/i.test(p.name)).length,
          Other: allPoints.filter(p => 
            !/BJC|SJC|LC|LUP|GP|BHQ/i.test(p.name)
          ).length
        },
        samplePointNames: allPoints.slice(0, 20).map(p => ({
          name: p.name,
          type: p.properties?.type,
          originalName: p.properties?._parsing_info?.original_point_name
        }))
      });
      
      // Calculate totals
      const existingConnections = allConnections.filter(conn => conn.existing === true);
      const proposedConnections = allConnections.filter(conn => conn.existing === false);
      
      const totalExistingLength = existingConnections.reduce((sum, conn) => sum + (conn.length || 0), 0);
      const totalProposedLength = proposedConnections.reduce((sum, conn) => sum + (conn.length || 0), 0);
      const totalLength = totalExistingLength + totalProposedLength;

      console.log("=== FINAL PROCESSED DATA ===", {
        points: {
          total: allPoints.length,
          samplePoint: allPoints[0],
          coordinateCheck: allPoints.slice(0, 5).map(p => ({
            name: p.name,
            coords: p.coordinates,
            valid: p.coordinates[0] !== 0 && p.coordinates[1] !== 0
          }))
        },
        connections: {
          total: allConnections.length,
          existing: existingConnections.length,
          proposed: proposedConnections.length,
          totalExistingLength: totalExistingLength.toFixed(3),
          totalProposedLength: totalProposedLength.toFixed(3)
        }
      });

      // Set the processed data
      setGPSApiResponse({ points: allPoints });
      setConctApiResponse({ connections: allConnections });

      const firstValidKml = kmlArray.find(kml => kml.success && kml.data?.network);
      if (firstValidKml?.data?.network) {
        const network = firstValidKml.data.network;
        setLocalData(prev => ({
          ...prev,
          mainPointName: network.main_point_name || prev.mainPointName,
          dt_code: network.dt_code || prev.dt_code,
          dt_name: network.dt_name || prev.dt_name,
          st_code: network.st_code || prev.st_code,
          st_name: network.st_name || prev.st_name,
          totalLength: totalLength,
          existinglength: totalExistingLength,
          proposedlength: totalProposedLength
        }));
      }

      console.log("=== AFTER PROCESSING KML ===", {
        allPointsCount: allPoints.length,
        pointTypes: allPoints.reduce((acc, p) => {
          const type = p.properties?.type || p.properties?.asset_type || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        pointsWithIds: allPoints.filter(p => p.properties?.id).length,
        pointsWithoutIds: allPoints.filter(p => !p.properties?.id).length
      });

      setExistingDistance(totalExistingLength);
      setProposedDistance(totalProposedLength);

      showNotification("success", 
        `Successfully loaded KML data: ${allPoints.length} points, ${existingConnections.length} existing + ${proposedConnections.length} proposed connections`
      );
      
    } catch (error) {
      console.error("❌ CRITICAL ERROR in KML processing:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      showNotification("error", `Critical error loading KML data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}, [previewKmlData, map, isLoaded, setGPSApiResponse, setConctApiResponse, setLocalData]);


// ==========================================
// 2️⃣ RENDER POINTS ON MAP
// ==========================================
useEffect(() => {
  if (apiGPSResponse?.points?.length && map) {
    console.log("=== RENDERING POINTS ON MAP ===");
    console.log("Total points to render:", apiGPSResponse.points.length);
    
    setPointProperties(apiGPSResponse?.points[0]);
    
    const connectionsByPoint = new Map<string, Connection[]>();
    
    if (apiConctResponse?.connections?.length) {
      apiConctResponse.connections.forEach((conn: Connection) => {
        const from = conn.start && typeof conn.start === 'string' ? conn.start : '';
        const to = conn.end && typeof conn.end === 'string' ? conn.end : '';
        
        [from, to].forEach((pointName) => {
          if (pointName && pointName.trim() !== '') {
            if (!connectionsByPoint.has(pointName)) {
              connectionsByPoint.set(pointName, []);
            }
            connectionsByPoint.get(pointName)?.push(conn);
          }
        });
      });
    }
    
    const validPoints = apiGPSResponse.points.filter((point: any) => {
      return point && 
             point.name && 
             typeof point.name === 'string' && 
             point.coordinates && 
             Array.isArray(point.coordinates) && 
             point.coordinates.length >= 2;
    });

    console.log(`Rendering ${validPoints.length} valid points`);
    
    console.log("=== POINT NAME MAPPING DEBUG ===", {
      samplePoints: validPoints.slice(0, 10).map((p: any) => ({
        originalName: p.name,
        propertiesName: p.properties?.name,
        finalName: p.properties?.name || p.name,
        type: p.properties?.type
      }))
    });

    const newLoopEntries: LoopEntry[] = validPoints.map((point: any) => {
      // 🔥 FIX: Use properties.name first (for BJC-11, SJC-15, etc.)
      const pointName = point.properties?.name || point.name || `Unnamed_Point_${Date.now()}`;
      const relatedConnections = connectionsByPoint.get(pointName) || [];
      const matchedConn = relatedConnections[0];
      
      return {
        name: pointName,  // ✅ Now uses "BJC-11" instead of "BJC"
        coordinates: point.coordinates || [0, 0],
        lgd_code: point.properties?.lgd_code || point.lgd_code || "NULL",
        properties: point.properties || {},
        ...(matchedConn && {
          connection: {
            length: matchedConn.length || 0,
            existing: previewKmlData === null ? true : matchedConn.existing || false,
            color: matchedConn.color || "#55ff00",
          },
          route: {
            features: [
              {
                geometry: {
                  coordinates: matchedConn.coordinates?.map(([lng, lat]) => [lng, lat]) || [],
                },
              },
            ],
          },
        }),
      };
    });

    console.log("=== NEW LOOP ENTRIES DEBUG ===", {
      totalEntries: newLoopEntries.length,
      sampleNames: newLoopEntries.slice(0, 10).map(e => e.name),
      junctionCounts: {
        BJC: newLoopEntries.filter(e => /BJC/i.test(e.name)).length,
        SJC: newLoopEntries.filter(e => /SJC/i.test(e.name)).length,
        LC: newLoopEntries.filter(e => /LC|LUP/i.test(e.name)).length
      },
      genericNames: {
        justBJC: newLoopEntries.filter(e => e.name === 'BJC').length,
        justSJC: newLoopEntries.filter(e => e.name === 'SJC').length,
        justLC: newLoopEntries.filter(e => e.name === 'LC').length
      }
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
    validPoints.forEach((point: any) => {
      if (Array.isArray(point.coordinates) && point.coordinates.length >= 2) {
        bounds.extend({ lat: point.coordinates[1], lng: point.coordinates[0] });
      }
    });
   
    map.fitBounds(bounds);
  }
}, [apiGPSResponse, apiConctResponse, map, previewKmlData]);


// ==========================================
// 2️⃣B: RENDER POINT MARKERS ON MAP (NEW!)
// ==========================================
useEffect(() => {
  if (!map || !LocalData.loop || LocalData.loop.length === 0) {
    return;
  }

  console.log("=== RENDERING POINT MARKERS ===");
  console.log("Total points to render as markers:", LocalData.loop.length);

  // Clear existing markers
  markerInstanceMap.forEach((marker) => {
    if (marker) {
      marker.setMap(null);
    }
  });

  const newMarkerMap = new Map<string, google.maps.Marker>();
  let renderedCount = 0;
  let skippedCount = 0;

  LocalData.loop.forEach((point: LoopEntry, index: number) => {
    // Validate coordinates
    if (!point.coordinates || 
        !Array.isArray(point.coordinates) || 
        point.coordinates.length < 2) {
      console.warn(`Skipping point ${point.name}: Invalid coordinates`, point.coordinates);
      skippedCount++;
      return;
    }

    const [lng, lat] = point.coordinates;
    
    // Validate lat/lng values
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        lat === 0 || lng === 0 ||
        isNaN(lat) || isNaN(lng) ||
        Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      console.warn(`Skipping point ${point.name}: Invalid lat/lng values`, { lat, lng });
      skippedCount++;
      return;
    }

    const position = { lat, lng };

    // Get icon based on asset type
    const assetType = point.properties?.asset_type || point.properties?.type;
    let iconUrl: string;

    switch (assetType) {
      case "Block Router":
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/blue-dot.png";
        break;
      case "BHQ":
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/green-dot.png";
        break;
      case "GP":
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        break;
      case "BJC":
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/purple-dot.png";
        break;
      case "SJC":
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/orange-dot.png";
        break;
      case "LC":
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/pink-dot.png";
        break;
      case "N Highway Cross":
        iconUrl = "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
        break;
      case "FPOI":
      default:
        iconUrl = point.properties?.icon || "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
    }

    // Create marker
    const marker = new google.maps.Marker({
      position,
      map,
      title: point.name,
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(32, 32),
      },
      animation: google.maps.Animation.DROP,
      optimized: true,
    });

    // Add click listener
    marker.addListener("click", () => {
      setPointProperties({
        name: point.name,
        coordinates: point.coordinates,
        lgd_code: point.lgd_code,
        properties: point.properties,
        ...(point.connection && { connection: point.connection }),
        ...(point.route && { route: point.route })
      });
    });

    newMarkerMap.set(point.name, marker);
    renderedCount++;

    // Log every 10th marker
    if ((index + 1) % 10 === 0) {
      console.log(`Progress: ${index + 1}/${LocalData.loop.length} markers rendered`);
    }
  });

  setMarkerInstanceMap(newMarkerMap);

  console.log("=== MARKER RENDERING COMPLETE ===", {
    totalPoints: LocalData.loop.length,
    renderedMarkers: renderedCount,
    skippedMarkers: skippedCount,
    renderRate: `${((renderedCount / LocalData.loop.length) * 100).toFixed(1)}%`,
    markerBreakdown: {
      "Block Router": Array.from(newMarkerMap.values()).filter(m => 
        m.getIcon()?.url?.includes("blue-dot")
      ).length,
      "BHQ": Array.from(newMarkerMap.values()).filter(m => 
        m.getIcon()?.url?.includes("green-dot")
      ).length,
      "GP": Array.from(newMarkerMap.values()).filter(m => 
        m.getIcon()?.url?.includes("yellow-dot")
      ).length,
      "BJC": Array.from(newMarkerMap.values()).filter(m => 
        m.getIcon()?.url?.includes("purple-dot")
      ).length,
      "SJC": Array.from(newMarkerMap.values()).filter(m => 
        m.getIcon()?.url?.includes("orange-dot")
      ).length,
      "LC": Array.from(newMarkerMap.values()).filter(m => 
        m.getIcon()?.url?.includes("pink-dot")
      ).length,
      "FPOI/Other": Array.from(newMarkerMap.values()).filter(m => 
        m.getIcon()?.url?.includes("red-dot")
      ).length
    }
  });

  // Log details about skipped markers
  if (skippedCount > 0) {
    console.warn(`⚠️ Skipped ${skippedCount} markers due to invalid coordinates`);
    
    const skippedPoints = LocalData.loop.filter(point => {
      if (!point.coordinates || !Array.isArray(point.coordinates) || point.coordinates.length < 2) {
        return true;
      }
      const [lng, lat] = point.coordinates;
      return !lat || !lng || lat === 0 || lng === 0 || isNaN(lat) || isNaN(lng);
    });

    console.warn("Skipped points details:", skippedPoints.map(p => ({
      name: p.name,
      coordinates: p.coordinates,
      reason: !p.coordinates ? "No coordinates" : 
              p.coordinates.length < 2 ? "Insufficient coordinates" :
              "Invalid lat/lng values"
    })));
  }

}, [LocalData.loop, map]);


// ==========================================
// 3️⃣ SYNC ALL CONNECTIONS WITH UNIQUE KEYS
// ==========================================
// ==========================================
// 3️⃣ SYNC ALL CONNECTIONS WITH UNIQUE KEYS
// ==========================================
useEffect(() => {
  if (!apiConctResponse?.connections?.length) {
    return;
  }

  console.log("=== FULL SYNC: REBUILDING ALL CONNECTIONS ===");
  console.log("API Connections Count:", apiConctResponse.connections.length);
  console.log("Deleted Count:", deletedPolylines.size);

  const completePolylineHistory: Record<string, any> = {};
  let processedCount = 0;
  let skippedCount = 0;
  const duplicateKeyWarnings: string[] = [];

  apiConctResponse.connections.forEach((connection: Connection, idx: number) => {
    // ✅ CREATE UNIQUE KEY USING ID OR INDEX
    const baseKey = `${connection.start} TO ${connection.end}`;
    const uniqueKey = connection.id 
      ? `${baseKey}_${connection.id}`
      : `${baseKey}_${idx}`;
    
    // ✅ CORRECTED: Track duplicates by checking existing keys with same base
    const existingKeysWithSameBase = Object.keys(completePolylineHistory).filter(k => 
      k.startsWith(baseKey + "_") || k === baseKey
    );
    
    if (existingKeysWithSameBase.length > 0) {
      duplicateKeyWarnings.push(
        `Duplicate route: ${baseKey} (instance #${existingKeysWithSameBase.length + 1}, key: ${uniqueKey})`
      );
    }

    // Check if user deleted this specific connection
    const isDeleted = deletedPolylines.has(baseKey) || 
                     deletedPolylines.has(uniqueKey);
    
    if (isDeleted) {
      console.log(`[${idx + 1}/${apiConctResponse.connections.length}] SKIPPED (user deleted): ${uniqueKey}`);
      skippedCount++;
      return;
    }

    // Convert coordinates
    const path = connection.coordinates?.map((coord) => ({
      lat: coord[1],
      lng: coord[0]
    })) || [];

    if (path.length === 0) {
      console.warn(`[${idx + 1}/${apiConctResponse.connections.length}] SKIPPED (no coordinates): ${uniqueKey}`);
      skippedCount++;
      return;
    }

    const midPoint = path.length > 0 ? path[Math.floor(path.length / 2)] : null;

    // Find matching points
    const startPoint = apiGPSResponse?.points?.find((point: PointType) => 
      point.name === connection.start
    );
    const endPoint = apiGPSResponse?.points?.find((point: PointType) => 
      point.name === connection.end
    );

    // ✅ STORE WITH UNIQUE KEY
    completePolylineHistory[uniqueKey] = {
      polyline: {
        coordinates: path
      },
      segmentData: {
        connection: {
          length: connection.length || 0,
          existing: connection.existing ?? false,
          color: connection.color || (connection.existing ? "#00AA00" : "#FF0000")
        },
        startCords: startPoint?.properties?.lgd_code || 
                    connection.start_lgd_code || 
                    connection.segmentData?.startCords || 
                    "NULL",
        endCords: endPoint?.properties?.lgd_code || 
                  connection.end_lgd_code || 
                  connection.segmentData?.endCords || 
                  "NULL",
        properties: {
          // Merge all property sources
          ...(connection.originalProperties || {}),
          ...(connection.segmentData?.properties || {}),
          ...(connection.properties || {}),
          
          // Critical fields
          name: connection.name || baseKey,
          start_node: connection.start,
          end_node: connection.end,
          length: (connection.length || 0).toString(),
          seg_length: ((connection.length || 0) * 1000).toString(),
          cable_len: ((connection.length || 0) * 1000).toString(),
          existing: connection.existing ?? false,
          status: connection.status || (connection.existing ? "Accepted" : "Proposed"),
          phase: connection.phase || (connection.existing ? "1" : "3"),
          type: connection.type || "Incremental Cable",
          asset_type: connection.type || "Incremental Cable",
          
          // IDs - CRITICAL FOR UNIQUENESS
          id: connection.id,
          network_id: connection.network_id,
          objectid: connection.segmentData?.properties?.objectid || "",
          
          // Admin codes
          blk_code: connection.segmentData?.properties?.blk_code || 
                    startPoint?.properties?.blk_code || "",
          blk_name: connection.segmentData?.properties?.blk_name || 
                    startPoint?.properties?.blk_name || "",
          dt_code: connection.segmentData?.properties?.dt_code || 
                   startPoint?.properties?.dt_code || "",
          dt_name: connection.segmentData?.properties?.dt_name || 
                   startPoint?.properties?.dt_name || "",
          st_code: connection.segmentData?.properties?.st_code || 
                   startPoint?.properties?.st_code || "",
          st_name: connection.segmentData?.properties?.st_name || 
                   startPoint?.properties?.st_name || "",
          
          // All other metadata
          cs: connection.segmentData?.properties?.cs || "",
          asset_code: connection.segmentData?.properties?.asset_code || "",
          olt_code: connection.segmentData?.properties?.olt_code || "",
          route_code: connection.segmentData?.properties?.route_code || "",
          ring: connection.segmentData?.properties?.ring || "",
          GlobalID: connection.segmentData?.properties?.GlobalID || 
                   connection.segmentData?.properties?.globalid || "",
          S_N: connection.segmentData?.properties?.S_N || "",
          FID: connection.segmentData?.properties?.FID || "",
          num_fibre: connection.segmentData?.properties?.num_fibre || "24 F",
          fibre_type: connection.segmentData?.properties?.fibre_type || "",
          cable_type: connection.segmentData?.properties?.cable_type || "",
          fiber_pos: connection.segmentData?.properties?.fiber_pos || "",
          direction: connection.segmentData?.properties?.direction || "",
          traverse: connection.segmentData?.properties?.traverse || "",
          owner: connection.segmentData?.properties?.owner || "BBNL",
          remarks: connection.segmentData?.properties?.remarks || "",
          obs: connection.segmentData?.properties?.obs || "",
          s_coil_len: connection.segmentData?.properties?.s_coil_len || "0.0",
          e_coil_len: connection.segmentData?.properties?.e_coil_len || "0.0",
          created_us: connection.segmentData?.properties?.created_us || "",
          created_da: connection.segmentData?.properties?.created_da || "",
          last_edite: connection.segmentData?.properties?.last_edite || "",
          last_edi_1: connection.segmentData?.properties?.last_edi_1 || "",
          mp4: connection.segmentData?.properties?.mp4 || "NULL",
          ontcode: connection.segmentData?.properties?.ontcode || "NULL",
          svcready: connection.segmentData?.properties?.svcready || "NULL",
          st_length_: connection.segmentData?.properties?.st_length_ || "",
          no: connection.segmentData?.properties?.no || "",
          "s.no": connection.segmentData?.properties?.["s.no"] || ""
        }
      },
      original: {
        coords: path.slice(),
        distance: connection.length || 0,
        markerPositions: [],
        labelPos: midPoint ? [midPoint.lat, midPoint.lng] : null,
        labelText: `${(connection.length || 0).toFixed(2)} km`,
        properties: {
          ...(connection.properties || {}),
          ...(connection.segmentData?.properties || {})
        }
      },
      undoStack: [],
      dragMarkers: [],
      
      // ✅ ADD METADATA TO TRACK ORIGINAL KEY
      _metadata: {
        originalKey: baseKey,
        uniqueKey: uniqueKey,
        connectionId: connection.id,
        arrayIndex: idx
      }
    };

    processedCount++;
    
    if ((idx + 1) % 10 === 0) {
      console.log(`Progress: ${idx + 1}/${apiConctResponse.connections.length} connections processed`);
    }
  });

  // Show warnings about duplicates
  if (duplicateKeyWarnings.length > 0) {
    console.warn("⚠️ DUPLICATE ROUTES DETECTED:", duplicateKeyWarnings);
    console.warn(`Total duplicates: ${duplicateKeyWarnings.length}`);
  }

  console.log("=== SYNC COMPLETE ===", {
    totalApiConnections: apiConctResponse.connections.length,
    processedConnections: processedCount,
    skippedConnections: skippedCount,
    finalPolylineHistoryCount: Object.keys(completePolylineHistory).length,
    duplicatesFound: duplicateKeyWarnings.length,
    shouldMatch: (processedCount === Object.keys(completePolylineHistory).length),
    sampleKeys: Object.keys(completePolylineHistory).slice(0, 5)
  });

  // ✅ REPLACE polylineHistory completely
  setLocalData(prev => ({
    ...prev,
    polylineHistory: completePolylineHistory
  }));

}, [apiConctResponse, apiGPSResponse, deletedPolylines, previewKmlData]);


// ==========================================
// 4️⃣ RENDER POLYLINES ON MAP + UPDATE DISTANCES
// ==========================================
useEffect(() => {
  if (!map || !LocalData.polylineHistory || Object.keys(LocalData.polylineHistory).length === 0) {
    return;
  }

  console.log("=== RENDERING POLYLINES ON MAP ===");
  console.log("Polylines to render:", Object.keys(LocalData.polylineHistory).length);
  console.log("New connections to render:", newConnections.length);
  
  // Clear existing polylines
  polylineInstanceMap.forEach((polyline) => {
    if (polyline) {
      polyline.setMap(null);
    }
  });
  
  setDistanceInfoWindows([]);
  const bounds = new window.google.maps.LatLngBounds();
  
  const newPolylineMap = new Map<string, google.maps.Polyline>();
  const newDistanceWindows: { position: google.maps.LatLngLiteral; distance: number }[] = [];
  
  // Track distances while rendering
  let totalExisting = 0;
  let totalProposed = 0;
  
  // Render each polyline from polylineHistory
  Object.entries(LocalData.polylineHistory).forEach(([key, entry]: [string, any]) => {
    const path = entry.polyline?.coordinates || [];
    
    if (path.length < 2) {
      console.warn(`Skipping polyline with insufficient coordinates: ${key}`);
      return;
    }
    
    const isExisting = entry.segmentData?.connection?.existing !== false;
    const polylineColor = isExisting ? "#00AA00" : "#FF0000";
    
    const polyline = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: polylineColor,
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });

    polyline.setMap(map);
    newPolylineMap.set(key, polyline);
    
    // Add bounds
    path.forEach((p: google.maps.LatLngLiteral) => bounds.extend(p));
    
    // Add distance label
    const midPoint = path[Math.floor(path.length * 0.5)];
    const distance = entry.segmentData?.connection?.length || 0;
    
    // Accumulate distances
    if (isExisting) {
      totalExisting += distance;
    } else {
      totalProposed += distance;
    }
    
    newDistanceWindows.push({
      position: midPoint,
      distance: distance,
    });
    
    // Add click handler
    polyline.addListener("click", () => {
      const metadata = entry._metadata || {};
      const baseKey = metadata.originalKey || key.split('_')[0];
      
      const lineProperties = {
        name: entry.segmentData?.properties?.name || baseKey,
        start: entry.segmentData?.properties?.start_node,
        end: entry.segmentData?.properties?.end_node,
        length: distance,
        existing: isExisting,
        color: polylineColor,
        properties: entry.segmentData?.properties
      };
      
      setPointProperties(lineProperties);
      
      if (previewKmlData !== null) {
        const routeIndex = metadata.arrayIndex || 0;
        handleRouteSelection(baseKey, routeIndex, distance, true);
        setSelectedRouteIndex(routeIndex);
      }
    });
  });
  
  // Also render new connections that aren't in polylineHistory yet
  newConnections.forEach((conn, idx) => {
    if (!conn.coordinates || conn.coordinates.length < 2) {
      return;
    }
    
    const path = conn.coordinates.map(coord => ({
      lat: coord[1],
      lng: coord[0]
    }));
    
    const polyline = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#FF0000", // Always red for new proposed routes
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });

    polyline.setMap(map);
    newPolylineMap.set(`new_connection_${idx}`, polyline);
    
    // Add bounds
    path.forEach((p: google.maps.LatLngLiteral) => bounds.extend(p));
    
    // Add to proposed distance
    totalProposed += conn.length;
    
    // Add distance label
    const midPoint = path[Math.floor(path.length * 0.5)];
    newDistanceWindows.push({
      position: midPoint,
      distance: conn.length,
    });
    
    // Add click handler
    polyline.addListener("click", () => {
      const lineProperties = {
        name: conn.name,
        start: conn.start,
        end: conn.end,
        length: conn.length,
        existing: false,
        color: "#FF0000",
        properties: conn.segmentData?.properties
      };
      
      setPointProperties(lineProperties);
    });
  });
  
  setPolylineInstanceMap(newPolylineMap);
  setDistanceInfoWindows(newDistanceWindows);
  
  // Update distance state variables
  console.log("=== UPDATING DISTANCES ===", {
    existingDistance: totalExisting.toFixed(3),
    proposedDistance: totalProposed.toFixed(3),
    totalDistance: (totalExisting + totalProposed).toFixed(3)
  });
  
  setExistingDistance(totalExisting);
  setProposedDistance(totalProposed);
  
  // Update LocalData with calculated totals
  setLocalData(prev => ({
    ...prev,
    totalLength: totalExisting + totalProposed,
    existinglength: totalExisting,
    proposedlength: totalProposed
  }));
  
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds);
  }
  
  console.log("✅ Rendered polylines:", newPolylineMap.size);
  console.log("✅ Distance Summary:", {
    existing: `${totalExisting.toFixed(2)}km`,
    proposed: `${totalProposed.toFixed(2)}km`,
    total: `${(totalExisting + totalProposed).toFixed(2)}km`
  });
  
}, [LocalData.polylineHistory, map, previewKmlData, newConnections]);

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

const isLocationValid = !!(selectedState && selectedDistrict && selectedBlock);
const locationFilters = {
  state: selectedState || '',
  district: selectedDistrict || '',
  block: selectedBlock || '',
  state_name: states.find(s => s.state_id === selectedState)?.state_name || '',
  district_name: districts.find(d => d.district_id === selectedDistrict)?.district_name || '',
  block_name: blocks.find(b => b.block_id === selectedBlock)?.block_name || ''
};

// 4. ADD THESE FUNCTIONS (same pattern as Construction.tsx)
const fetchStates = async () => {
  try {
    setLoadingStates(true);
    
    const response = await fetch(`${BASEURL}/states`);
    if (!response.ok) throw new Error('Failed to fetch states');
    
    const result: { success: boolean; data: StateData[] } = await response.json();
    
    setStates(result.success ? result.data : []);
  } catch (error) {
    console.error('Error fetching states:', error);
    setStates([]);
    showNotification("error", "Failed to load states");
  } finally {
    setLoadingStates(false);
  }
};

const fetchDistricts = async (stateId: string) => {
  if (!stateId) {
    setDistricts([]);
    return;
  }

  try {
    setLoadingDistricts(true);
    
    const response = await fetch(`${BASEURL}/districtsdata?state_code=${stateId}`);
    if (!response.ok) throw new Error('Failed to fetch districts');
    
    const data = await response.json();
    
    setDistricts(data || []);
  } catch (error) {
    console.error('Error fetching districts:', error);
    setDistricts([]);
    showNotification("error", "Failed to load districts");
  } finally {
    setLoadingDistricts(false);
  }
};

const fetchBlocks = async (districtId: string) => {
  if (!districtId) {
    setBlocks([]);
    return;
  }

  try {
    setLoadingBlocks(true);
    
    const response = await fetch(`${BASEURL}/blocksdata?district_code=${districtId}`);
    if (!response.ok) throw new Error('Failed to fetch blocks');
    
    const data = await response.json();
    
    setBlocks(data || []);
  } catch (error) {
    console.error('Error fetching blocks:', error);
    setBlocks([]);
    showNotification("error", "Failed to load blocks");
  } finally {
    setLoadingBlocks(false);
  }
};

const handleLocationFilterChange = (newState: string | null, newDistrict: string | null, newBlock: string | null) => {
  const params: Record<string, string> = {};
  if (newState) params.state_id = newState;
  if (newDistrict) params.district_id = newDistrict;
  if (newBlock) params.block_id = newBlock;
  setSearchParams(params);
};

const handleStateChange = (value: string) => {
  const newState = value || null;
  setSelectedState(newState);
  setSelectedDistrict(null);
  setSelectedBlock(null);
  handleLocationFilterChange(newState, null, null);
};

const handleDistrictChange = (value: string) => {
   const newDistrict = value || null;
  setSelectedDistrict(newDistrict);
  setSelectedBlock(null);
  handleLocationFilterChange(selectedState, newDistrict, null);
};

const handleBlockChange = (value: string) => {
  const newBlock = value || null;
  setSelectedBlock(newBlock);
  handleLocationFilterChange(selectedState, selectedDistrict, newBlock);
};



useEffect(() => {
  fetchStates();
}, []);

useEffect(() => {
  if (selectedState) {
    fetchDistricts(selectedState);
  } else {
    setDistricts([]);
  }
}, [selectedState]);

useEffect(() => {
  if (selectedDistrict) {
    fetchBlocks(selectedDistrict);
  } else {
    setBlocks([]);
  }
}, [selectedDistrict]);

// Initialize from URL params
useEffect(() => {
  const state_id = searchParams.get('state_id') || null;
  const district_id = searchParams.get('district_id') || null;
  const block_id = searchParams.get('block_id') || null;

  setSelectedState(state_id);
  setSelectedDistrict(district_id);
  setSelectedBlock(block_id);
}, []);


  
  // ROUTE CALCULATION FUNCTIONS
  

  const HandleCalculation = async () => {
  if (!mapInstance || !pointA || !pointB) return;
  
  // Use the actual point names that were set when markers were clicked
  const routeKeyFormat = `${pointAName}-${pointBName}`;
  
  const url = `${BASEURL_Val}/show-route?lat1=${pointA.lat}&lng1=${pointA.lng}&lat2=${pointB.lat}&lng2=${pointB.lng}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const routes = Array.isArray(data) ? data.slice(0, 3) : [data];
    const routeKey = routeKeyFormat; // Use the formatted key

    // Clear existing layers
    if (routeGroups.has(routeKey)) {
      routeGroups.get(routeKey)!.layers.forEach((layer: google.maps.Polyline | google.maps.InfoWindow) => {
        if ('setMap' in layer) {
          layer.setMap(null);
        }
      });
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

          handleRouteSelection(routeKey, index, routeData.distance, false);
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
            // Add start and end cords from the actual points
            startCords: LocalData.loop.find(p => p.name === pointAName)?.lgd_code || 'NULL',
            endCords: LocalData.loop.find(p => p.name === pointBName)?.lgd_code || 'NULL',
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

        path.forEach((p: google.maps.LatLngLiteral) => bounds.extend(p));
      }
    });

    routeGroups.set(routeKey, { layers: newRouteLayers });
    setDistanceInfoWindows(prev => [...prev, ...newInfoWindows]);
    mapInstance.fitBounds(bounds);
    
    // Show notification about route calculation
    showNotification("success", `Route calculated: ${pointAName} to ${pointBName}`);
    
  } catch (err) {
    console.error(err);
    showNotification("error", "Failed to calculate route");
  }
};

useEffect(() => {
  return () => {
    // Clear new connections on unmount
    setNewConnections([]);
  };
}, []);

  
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
    // Clear all markers
    markerInstanceMap.forEach((marker) => {
      if (marker) {
        marker.setMap(null);
      }
    });
    
    // Clear all polylines
    polylineInstanceMap.forEach((polyline) => {
      if (polyline) {
        polyline.setMap(null);
      }
    });
    
    // Clear timeouts
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

  // Parse the route key to get start and end names
  let fromName = '';
  let toName = '';
  let startLgdCode = '';
  let endLgdCode = '';
  
  // Extract names from routeKey (format: "PointA-PointB")
  const parts = routeKey.split('-');
  if (parts.length >= 2) {
    fromName = parts[0];
    toName = parts.slice(1).join('-'); // Handle names with hyphens
  }
  
  // Find LGD codes from LocalData.loop
  const fromPoint = LocalData.loop.find(p => p.name === fromName);
  const toPoint = LocalData.loop.find(p => p.name === toName);
  
  if (fromPoint) {
    startLgdCode = fromPoint.lgd_code || 'NULL';
  }
  if (toPoint) {
    endLgdCode = toPoint.lgd_code || 'NULL';
  }

  if (!fromName || !toName) {
    console.error('Could not parse route names from:', routeKey);
    return;
  }

  let endPoint = toPoint || null;

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
      endLgdCode = endPoint.lgd_code || 'NULL';
    } else {
      console.error('Could not find endpoint for route');
      return;
    }
  }

  // Create a new connection object for the proposed route
  const newConnection: ProcessedConnection = {
    name: `${fromName} TO ${toName}`,
    start: fromName,
    end: toName,
    length: distance,
    existing: false, // New routes are always proposed
    color: '#FF0000', // Red for proposed
    coordinates: path.map(p => [p.lng, p.lat]),
    type: 'Incremental Cable',
    status: 'Proposed',
    segmentData: {
      connection: {
        length: distance,
        existing: false,
        color: '#FF0000'
      },
      startCords: startLgdCode,
      endCords: endLgdCode,
      properties: {
        start_node: fromName,
        end_node: toName,
        length: distance.toString(),
        seg_length: (distance * 1000).toString(),
        existing: false,
        type: 'Incremental Cable',
        status: 'Proposed',
        phase: '3',
        created_at: new Date().toISOString(),
        user_created: true // Mark as user-created route
      }
    },
    originalProperties: {
      user_created: true,
      creation_mode: 'auto_mode',
      created_at: new Date().toISOString()
    }
  };

  // Add to new connections state
  setNewConnections(prev => {
    // Check if this connection already exists
    const exists = prev.some(conn => 
      (conn.start === fromName && conn.end === toName) ||
      (conn.start === toName && conn.end === fromName)
    );
    
    if (!exists) {
      return [...prev, newConnection];
    }
    return prev;
  });

  // Update the selected route in LocalData.loop
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
      color: '#FF0000'
    }
  };

  // Update LocalData with new route and update distances
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
      [`${fromName} TO ${toName}`]: {
        polyline: {
          coordinates: path
        },
        segmentData: {
          connection: {
            length: distance,
            existing: false,
            color: '#FF0000'
          },
          startCords: startLgdCode,
          endCords: endLgdCode,
          properties: {
            start_node: fromName,
            end_node: toName,
            length: distance.toString(),
            seg_length: (distance * 1000).toString(),
            existing: false,
            status: 'Proposed',
            type: 'Incremental Cable',
            phase: '3',
            user_created: true
          }
        },
        distanceLabel: `${distance.toFixed(2)} km`
      }
    };

    // Update total lengths
    const newProposedLength = prev.proposedlength + distance;
    const newTotalLength = prev.existinglength + newProposedLength;

    return {
      ...prev,
      loop: loopCopy,
      polylineHistory: updatedHistory,
      proposedlength: newProposedLength,
      totalLength: newTotalLength
    };
  });

  // Update distance states immediately
  setProposedDistance(prev => prev + distance);
  
  // Show notification
  showNotification("success", `New route created: ${fromName} to ${toName} (${distance.toFixed(2)} km)`);
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
      marker.addListener('drag', (e: google.maps.MapMouseEvent) => {
        const newCoord = e.latLng;
        if (!newCoord) return;
        
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

      marker.addListener('dragend', async (e: google.maps.MapMouseEvent) => {
        if (ghostLine) {
          ghostLine.setMap(null);
          ghostLine = null;
        }

        const newCoord = e.latLng;
        if (!newCoord) return;
        
        const start = getStart();
        const end = getEnd();

        try {
          const res = await axios.post(
            `${BASEURL_Val}/compute-route`,
            {
              newPos: {
                lat: newCoord.lat(),
                lng: newCoord.lng()
              },
              origin: {
                lat: start.lat(),
                lng: start.lng()
              },
              destination: {
                lat: end.lat(),
                lng: end.lng()
              },
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const data = res.data;
          if (data && data[0] && Array.isArray(data[0].route) && data[0].route.length > 0) {
            const newCoords = data[0].route.map(([lat, lng]: [number, number]) => ({ lat, lng }));

            const currentPath = polyline.getPath().getArray().map((p: google.maps.LatLng) => ({
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

            allMarkers.forEach((m: google.maps.Marker, i: number) => {
              if (i < newFractions.length) {
                const idx = Math.floor(updatedPath.length * newFractions[i]);
                const pos = updatedPath[idx];
                if (pos) m.setPosition(pos);
              }
            });

            const offsetPointIndex = Math.floor(updatedPath.length * 0.25);
            const offsetPoint = updatedPath[offsetPointIndex];
            const distanceKm = data[0].distance || 0;

            if (offsetPoint) {
              updateGlobalDataWithSelectedRoute(polyline, routeKey, 0, distanceKm);

              const entry = Array.from(polylineHistory.entries()).find(([key]) =>
                key.startsWith(`${routeKey}-route`)
              );
              const oldKey = entry?.[0];
              let infoWindow = entry?.[1]?.distanceLabel;
              let oldPos: google.maps.LatLng | null = null;

              if (infoWindow) {
                oldPos = infoWindow.getPosition() || null;
                infoWindow.close();
              }

              infoWindow = new google.maps.InfoWindow({
                content: `<div class="distance-label">${distanceKm.toFixed(2)} km</div>`,
                position: {
                  lat: offsetPoint.lat(),
                  lng: offsetPoint.lng()
                },
              });

              if (oldKey) {
                const existingHistory = polylineHistory.get(oldKey);
                polylineHistory.set(oldKey, {
                  ...(existingHistory ?? {}),
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
                { 
                  position: {
                    lat: offsetPoint.lat(),
                    lng: offsetPoint.lng()
                  }, 
                  distance: distanceKm 
                },
              ]);
              
              updateRouteSummary(polyline);
            }

          } else {
            alert("No route found");
          }
        } catch (err) {
          console.error("Rerouting failed", err);
          alert("Failed to calculate new route. Please try again.");
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
  setSelectRoute('');
  
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
  
  if (previewKmlData !== null) {
    deletePolylineAndDistance(`${fromName} TO ${toName}`);
    return;
  }
  
  setLocalData(prev => {
    const updatedLoop = prev.loop.map(entry => {
      if (entry.name === toName) {
        // Create a new entry without route and connection properties
        const { route, connection, ...restEntry } = entry;
        return restEntry as LoopEntry;
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

  // Remove from polylineHistory and update distances
  setLocalData((prev) => {
    const updatedHistory = { ...prev.polylineHistory };
    const deletedEntry = updatedHistory[key];
    delete updatedHistory[key];
    
    // Recalculate distances after deletion
    const deletedLength = deletedEntry?.segmentData?.connection?.length || 0;
    const wasExisting = deletedEntry?.segmentData?.connection?.existing || false;
    
    console.log(``, {
      key,
      length: deletedLength,
      wasExisting
    });
    
    const newExistingLength = wasExisting ? prev.existinglength - deletedLength : prev.existinglength;
    const newProposedLength = !wasExisting ? prev.proposedlength - deletedLength : prev.proposedlength;
    
    return {
      ...prev,
      polylineHistory: updatedHistory,
      existinglength: Math.max(0, newExistingLength),
      proposedlength: Math.max(0, newProposedLength),
      totalLength: Math.max(0, newExistingLength + newProposedLength)
    };
  });
  
  // Update the component state distances
  const deletedEntry = LocalData.polylineHistory[key];
  if (deletedEntry) {
    const deletedLength = deletedEntry.segmentData?.connection?.length || 0;
    const wasExisting = deletedEntry.segmentData?.connection?.existing || false;
    
    if (wasExisting) {
      setExistingDistance(prev => Math.max(0, prev - deletedLength));
    } else {
      setProposedDistance(prev => Math.max(0, prev - deletedLength));
    }
  }
};


  // MAP CLEANUP FUNCTIONS
  
  const clearMapData = () => {
  // Clear polylines
  polylineInstanceMap.forEach(polyline => {
    polyline.setMap(null);
    setNewConnections([]);
  });

  // ✅ ADD THIS: Clear markers
  markerInstanceMap.forEach(marker => {
    if (marker) {
      marker.setMap(null);
    }
  });
  
  // Clear polyline history
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
  
  setPolylineHistory(new Map());
  setRouteGroups(new Map());
  setPolylineInstanceMap(new Map()); // ✅ ADD: Clear polyline map
  setMarkerInstanceMap(new Map());   // ✅ ADD: Clear marker map
  setIsOpen(false);
  setRouteKey('');
  setSelectRoute('');
  setSelectRoute(null);
  setProposedDistance(0);
  setExistingDistance(0);
  setSelectedRouteIndex(null);
  setError('');
  setPointA(null);
  setPointB(null);
  setMap(null);
  setConctApiResponse(null);
  setGPSApiResponse(null);
};

  // saveKML function
 const saveKML = async (localData: GlobalData) => {
  try {
    if (isSaving) {
      console.log("Save already in progress, skipping...");
      return;
    }
    
    setIsSaving(true);
    setLoader(true);

    const finalUserData = getStandardUserData();
    const isPreviewMode = previewKmlData !== null;
    const networkId = isPreviewMode && previewKmlData 
      ? JSON.parse(previewKmlData)?.data?.network?.id 
      : null;

    console.log("=== STARTING SAVE OPERATION ===", {
      mode: isPreviewMode ? 'UPDATE' : 'CREATE',
      networkId: networkId,
      userData: finalUserData
    });

    // Get admin codes
    const adminCodes = {
      blockCode: selectedBlock || localData.dt_code || "",
      blockName: blocks.find(b => b.block_id === selectedBlock)?.block_name || localData.mainPointName || "",
      dtCode: selectedDistrict || localData.dt_code || "",
      dtName: districts.find(d => d.district_id === selectedDistrict)?.district_name || localData.dt_name || "",
      stCode: selectedState || localData.st_code || "",
      stName: states.find(s => s.state_id === selectedState)?.state_name || localData.st_name || ""
    };

    // Collect all points
    const allPoints: LoopEntry[] = localData.loop || [];
    
    // Build connections data from both existing connections and new connections
    const existingConnectionsData = Object.entries(localData.polylineHistory || {}).map(([key, value]: [string, any]) => {
      const [startName, endName] = key.split(' TO ');
      
      return {
        name: key,
        start: startName,
        end: endName,
        length: value.segmentData?.connection?.length || 0,
        existing: value.segmentData?.connection?.existing !== false, // Default to true for loaded connections
        color: value.segmentData?.connection?.color || "#00AA00",
        coordinates: value.polyline?.coordinates || [],
        properties: value.segmentData?.properties || {},
        segmentData: value.segmentData,
        user_created: value.segmentData?.properties?.user_created || false
      };
    });

    // Merge with new connections (avoiding duplicates)
    const allConnectionsData = [...existingConnectionsData];
    
    newConnections.forEach(newConn => {
      const exists = allConnectionsData.some(conn => 
        (conn.start === newConn.start && conn.end === newConn.end) ||
        (conn.start === newConn.end && conn.end === newConn.start) ||
        conn.name === newConn.name
      );
      
      if (!exists) {
        allConnectionsData.push({
          name: newConn.name,
          start: newConn.start,
          end: newConn.end,
          length: newConn.length,
          existing: false,
          color: newConn.color,
          coordinates: newConn.coordinates,
          properties: newConn.segmentData?.properties || {},
          segmentData: newConn.segmentData,
          user_created: true
        });
      }
    });

    console.log("=== CONNECTIONS DATA ===", {
      existingConnections: existingConnectionsData.length,
      newConnections: newConnections.length,
      totalConnections: allConnectionsData.length,
      userCreatedRoutes: allConnectionsData.filter(c => c.user_created).length
    });

    // Calculate accurate totals
    let totalExisting = 0;
    let totalProposed = 0;
    
    allConnectionsData.forEach(conn => {
      if (conn.existing) {
        totalExisting += conn.length;
      } else {
        totalProposed += conn.length;
      }
    });

    // Helper function to build line properties
    const buildLineProperties = (connection: any, adminCodes: any) => {
      const existingProps = connection.properties || {};
      
      return {
        ...existingProps,
        cs: existingProps.cs || "",
        name: connection.name,
        asset_code: existingProps.asset_code || "",
        blk_code: adminCodes.blockCode,
        blk_name: adminCodes.blockName,
        dt_code: adminCodes.dtCode,
        dt_name: adminCodes.dtName,
        st_code: adminCodes.stCode,
        st_name: adminCodes.stName,
        seg_length: (connection.length * 1000).toString(),
        length: connection.length.toString(),
        cable_len: (connection.length * 1000).toString(),
        start_node: connection.start || "",
        end_node: connection.end || "",
        num_fibre: existingProps.num_fibre || "24 F",
        status: connection.existing ? "Accepted" : "Proposed",
        phase: connection.existing ? "1" : "3",
        existing: connection.existing,
        type: existingProps.type || "Incremental Cable",
        asset_type: existingProps.asset_type || "Incremental Cable",
        created_by: existingProps.created_by || finalUserData.uname,
        modified_by: finalUserData.uname,
        user_id: existingProps.user_id || finalUserData.user_id,
        user_name: finalUserData.uname,
        user_created: connection.user_created || false,
        coordinates: connection.coordinates || []
      };
    };

    // Build the complete payload
    const payload = {
      globalData: {
        loop: allPoints.map((point: LoopEntry) => ({
          name: point.name,
          coordinates: point.coordinates,
          lgd_code: point.lgd_code || "NULL",
          is_junction: point.properties?.is_junction || /^(BJC|SJC|LC|LUP|JC)/i.test(point.name),
          properties: {
            ...point.properties,
            blk_code: adminCodes.blockCode,
            blk_name: adminCodes.blockName,
            dt_code: adminCodes.dtCode,
            dt_name: adminCodes.dtName,
            st_code: adminCodes.stCode,
            st_name: adminCodes.stName,
            network_id: point.properties?.network_id || networkId?.toString() || "",
            created_by: point.properties?.created_by || finalUserData.uname,
            modified_by: finalUserData.uname,
            user_id: point.properties?.user_id || finalUserData.user_id,
            user_name: finalUserData.uname
          },
          ...(point.connection && {
            connection: point.connection
          }),
          ...(point.route && {
            route: point.route
          })
        })),
        
        mainPointName: adminCodes.blockName,
        blk_code: adminCodes.blockCode,
        blk_name: adminCodes.blockName,
        dt_code: adminCodes.dtCode,
        dt_name: adminCodes.dtName,
        st_code: adminCodes.stCode,
        st_name: adminCodes.stName,
        totalLength: totalExisting + totalProposed,
        existinglength: totalExisting,
        proposedlength: totalProposed,
        
        location_filter_metadata: {
          selected_state_id: selectedState,
          selected_district_id: selectedDistrict,
          selected_block_id: selectedBlock,
          filter_timestamp: new Date().toISOString(),
          source: "user_location_filters"
        },
        ...(isPreviewMode && { network_id: networkId })
      },
      
      // Include actual connections array with all connections
      connections: allConnectionsData.map(conn => {
        const lineProps = buildLineProperties(conn, adminCodes);
        return {
          name: conn.name,
          start: conn.start,
          end: conn.end,
          length: conn.length,
          coordinates: conn.coordinates,
          existing: conn.existing,
          color: conn.color,
          type: lineProps.type,
          status: lineProps.status,
          properties: lineProps,
          segmentData: conn.segmentData,
          user_created: conn.user_created || false,
          network_id: networkId?.toString() || ""
        };
      }),
      
      // Also update polylineHistory with complete data
      polylineHistory: Object.fromEntries(
        allConnectionsData.map(conn => {
          return [
            conn.name,
            {
              polyline: {
                coordinates: conn.coordinates
              },
              segmentData: {
                connection: {
                  length: conn.length,
                  existing: conn.existing,
                  color: conn.color
                },
                startCords: conn.segmentData?.startCords || "NULL",
                endCords: conn.segmentData?.endCords || "NULL",
                properties: buildLineProperties(conn, adminCodes)
              }
            }
          ];
        })
      ),
      
      user_id: finalUserData.user_id,
      user_name: finalUserData.uname,
      created_at: new Date().toISOString(),
      ...(isPreviewMode && { network_id: networkId }),
      
      metadata: {
        version: "1.0",
        export_date: new Date().toISOString(),
        source: "MapComponent",
        mode: isPreviewMode ? "preview_update" : "new_save",
        total_points: allPoints.length,
        total_connections: allConnectionsData.length,
        user_created_connections: allConnectionsData.filter(c => c.user_created).length,
        point_breakdown: {
          BJC: allPoints.filter(p => /BJC/i.test(p.name)).length,
          SJC: allPoints.filter(p => /SJC/i.test(p.name)).length,
          LC: allPoints.filter(p => /LC|LUP/i.test(p.name)).length,
          GP: allPoints.filter(p => /GP/i.test(p.name)).length,
          BHQ: allPoints.filter(p => /BHQ/i.test(p.name)).length,
          Other: allPoints.filter(p => !/BJC|SJC|LC|LUP|GP|BHQ/i.test(p.name)).length
        },
        connections_breakdown: {
          existing: allConnectionsData.filter(c => c.existing).length,
          proposed: allConnectionsData.filter(c => !c.existing).length,
          total: allConnectionsData.length,
          existing_length: totalExisting.toFixed(3),
          proposed_length: totalProposed.toFixed(3),
          total_length: (totalExisting + totalProposed).toFixed(3)
        }
      }
    };

    console.log("=== COMPLETE PAYLOAD SUMMARY ===", {
      totalPoints: payload.globalData.loop.length,
      totalConnections: payload.connections.length,
      existingConnections: payload.metadata.connections_breakdown.existing,
      proposedConnections: payload.metadata.connections_breakdown.proposed,
      userCreatedConnections: payload.metadata.user_created_connections,
      totalExistingLength: payload.metadata.connections_breakdown.existing_length,
      totalProposedLength: payload.metadata.connections_breakdown.proposed_length,
      networkId: networkId,
      mode: payload.metadata.mode
    });

    const payloadString = JSON.stringify(payload);
    const payloadSizeMB = new Blob([payloadString]).size / (1024 * 1024);

    if (payloadSizeMB > 50) {
      showNotification("error", `Payload too large (${payloadSizeMB.toFixed(2)} MB)`);
      setIsSaving(false);
      setLoader(false);
      setSaveFile(false);
      return;
    }

    let apiUrl: string;
    let requestMethod: string;
    
    if (isPreviewMode) {
      apiUrl = `${BASEURL_Val}/update-network/${networkId}`;
      requestMethod = 'PUT';
    } else {
      apiUrl = `${BASEURL_Val}/save-to-db`;
      requestMethod = 'POST';
    }
    
    console.log("\n🚀 Sending request to backend...\n");

    const response = await fetch(apiUrl, {
      method: requestMethod,
      headers: {
        'Content-Type': 'application/json',
      },
      body: payloadString
    });

    let result: any;
    try {
      const responseText = await response.text();
      if (responseText) {
        result = JSON.parse(responseText);
      } else {
        result = { message: "Empty response from server" };
      }
    } catch (parseError) {
      console.error('Response parsing error:', parseError);
      result = { error: "Invalid JSON response from server" };
    }

    if (response.ok) {
      const successMessage = isPreviewMode ? "Network updated successfully!" : "KML saved successfully!";
      showNotification("success", `${successMessage}\nPoints: ${allPoints.length} • Connections: ${allConnectionsData.length}`);
      setSaveFile(false);
      
      // Clear new connections after successful save
      setNewConnections([]);
    } else {
      throw new Error(result?.message || result?.error || 'Save failed');
    }

  } catch (error) {
    console.error('Save Error:', error);
    const isPreviewMode = previewKmlData !== null;
    const operationText = isPreviewMode ? "updating network" : "saving KML";
    
    if (error instanceof Error) {
      showNotification("error", `Error ${operationText}: ${error.message}`);
    } else {
      showNotification("error", `An unknown error occurred while ${operationText}.`);
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
     const finalUserData = getStandardUserData();
   const Body={
     networkId:kmlData?.data?.points[0].network_id || 0,
     user_id: finalUserData.user_id,
     user_name: finalUserData.uname,
     verified_by: finalUserData.uname,
     verification_timestamp: new Date().toISOString()
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

  const finalUserData = getStandardUserData();

  const filteredData = {
    globalData: {
      loop: LocalData.loop,
      mainPointName: LocalData.mainPointName,
      totalLength: LocalData.totalLength,
      proposedlength: LocalData.proposedlength,
      existinglength: LocalData.existinglength,
      dt_code: LocalData.dt_code || '',
      dt_name: LocalData.dt_name || '',
      st_code: LocalData.st_code || '',
      st_name: LocalData.st_name || '',
    },
    polylineHistory: LocalData.polylineHistory,
    user_id: finalUserData.user_id,
    user_name: finalUserData.uname,
  
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

    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null);
    }
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

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
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [map, isLoaded]); 

  
  // NOTIFICATION FUNCTIONS
  

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (notifierTimeoutRef.current) {
      clearTimeout(notifierTimeoutRef.current);
      notifierTimeoutRef.current = null;
    }

    setNotifier({ type, message, visible: true });

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

  const LocationFilterPanel = () => (
  <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 w-80">
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Location Selection</h3>
        <button
          onClick={() => setShowLocationFilters(!showLocationFilters)}
          className="text-gray-400 hover:text-gray-600"
        >
          {showLocationFilters ? '−' : '+'}
        </button>
      </div>
      
      {!isLocationValid && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          Please select State, District, and Block to enable file operations
        </div>
      )}
      
      {showLocationFilters && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
            <select
              value={locationFilters.state}
              onChange={(e) => handleLocationFilterChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state.state_id} value={state.state_id}>
                  {state.state_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
            <select
              value={locationFilters.district}
              onChange={(e) => handleLocationFilterChange('district', e.target.value)}
              disabled={!locationFilters.state}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select District</option>
              {districts.map((district) => (
                <option key={district.district_id} value={district.district_id}>
                  {district.district_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Block</label>
            <select
              value={locationFilters.block}
              onChange={(e) => handleLocationFilterChange('block', e.target.value)}
              disabled={!locationFilters.district}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select Block</option>
              {blocks.map((block) => (
                <option key={block.block_id} value={block.block_id}>
                  {block.block_name}
                </option>
              ))}
            </select>
          </div>
          
          {isLocationValid && (
            <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              ✓ Location selected: {locationFilters.state_name} → {locationFilters.district_name} → {locationFilters.block_name}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);

const MapLegend = () => {
  const [showLegend, setShowLegend] = useState(true);
  
  const pointTypes = [
    { label: 'Block Router', icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' },
    { label: 'BHQ', icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' },
    { label: 'GP', icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' },
    { label: 'BJC (Box Junction)', icon: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png' },
    { label: 'SJC (Splice Junction)', icon: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png' },
    { label: 'LC (Loop Chamber)', icon: 'https://maps.google.com/mapfiles/ms/icons/pink-dot.png' },
    { label: 'N Highway Cross', icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' },
    { label: 'FPOI', icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }
  ];

  return (
    <div className="absolute bottom-2 left-3 z-10 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Point Indicator</h3>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
            aria-label={showLegend ? "Collapse legend" : "Expand legend"}
          >
            {showLegend ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {showLegend && (
          <div className="space-y-3">
            {/* Point Types */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Point Types</p>
              <div className="space-y-2">
                {pointTypes.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <img 
                      src={item.icon} 
                      alt={item.label}
                      className="w-5 h-5"
                    />
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



  
  // RENDER
  

  return (
  <div className="relative h-full w-full">
    {loader && (
      <div className="absolute top-70 right-150 z-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800 mx-auto mb-4"></div>
      </div>
    )}
    
    {/* Search Box - Left side (keeping your existing implementation) */}
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

    {/* Toggle Button for Location Filter - Always visible */}
    <button
      onClick={() => setShowLocationPanel(!showLocationPanel)}
      className="absolute top-14 right-2 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
      title={showLocationPanel ? "Hide Location Filter" : "Show Location Filter"}
    >
      <svg 
        className="w-5 h-5 text-gray-600" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
        />
      </svg>
    </button>

    {/* Location Filter Panel - Conditionally rendered */}
    {showLocationPanel && (
  <div className="absolute top-4 right-16 z-10 bg-white rounded-lg shadow-lg border border-gray-200 w-80">
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Location Selection</h3>
        <button
          onClick={() => setShowLocationFilters(!showLocationFilters)}
          className="text-gray-400 hover:text-gray-600"
        >
          {showLocationFilters ? '−' : '+'}
        </button>
      </div>
      
      {/* Status indicator */}
      <div className={`mb-3 p-2 rounded text-xs border ${
        isLocationValid 
          ? 'bg-green-50 border-green-200 text-green-700' 
          : 'bg-amber-50 border-amber-200 text-amber-700'
      }`}>
        {isLocationValid ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">File uploads enabled</span>
            </div>
            <div className="text-xs opacity-75">
              {locationFilters.state_name} → {locationFilters.district_name} → {locationFilters.block_name}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Complete location selection to enable file uploads</span>
          </div>
        )}
      </div>
      
      {showLocationFilters && (
        <div className="space-y-3">
          {/* State Selection */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
            <select
  value={selectedState || ''}
  onChange={(e) => handleStateChange(e.target.value)}  // Changed from handleLocationFilterChange
  disabled={loadingStates}
  className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
>
  <option value="">Select State</option>
  {states.map((state) => (
    <option key={state.state_id} value={state.state_id}>
      {state.state_name}
    </option>
  ))}
</select>

            <div className="absolute inset-y-0 right-0 top-6 flex items-center pr-2 pointer-events-none">
              {loadingStates ? (
                <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>

          {/* District Selection */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
            <select
  value={selectedDistrict || ''}
  onChange={(e) => handleDistrictChange(e.target.value)}  // Changed from handleLocationFilterChange
  disabled={!selectedState || loadingDistricts}
  className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:opacity-50"
>
  <option value="">Select District</option>
  {districts.map((district) => (
    <option key={district.district_id} value={district.district_id}>
      {district.district_name}
    </option>
  ))}
</select>
            <div className="absolute inset-y-0 right-0 top-6 flex items-center pr-2 pointer-events-none">
              {loadingDistricts ? (
                <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>

          {/* Block Selection */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">Block</label>
            <select
  value={selectedBlock || ''}
  onChange={(e) => handleBlockChange(e.target.value)}  // Changed from handleLocationFilterChange
  disabled={!selectedDistrict || loadingBlocks}
  className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:opacity-50"
>
  <option value="">Select Block</option>
  {blocks.map((block) => (
    <option key={block.block_id} value={block.block_id}>
      {block.block_name}
    </option>
  ))}
</select>
            <div className="absolute inset-y-0 right-0 top-6 flex items-center pr-2 pointer-events-none">
              {loadingBlocks ? (
                <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>

          {/* Clear Selection Button */}
          {(selectedState || selectedDistrict || selectedBlock) && (
            <button
              onClick={() => {
                setSelectedState(null);
                setSelectedDistrict(null);
                setSelectedBlock(null);
                setSearchParams({});
              }}
              className="w-full px-3 py-2 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>
      )}
    </div>
  </div>
)}  
    <MapLegend />

    {/* Google Map Component - keeping your existing implementation */}
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onLoad={onLoad}
      onUnmount={onUnmount}
      mapTypeId="roadmap"
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        scrollwheel: true
      }}
    >
      {/* Markers - keeping your existing implementation */}
       {apiGPSResponse?.points?.map((point: GPSPoint, index: number) => {
  // Validate point data
  if (!point || !point.coordinates || !Array.isArray(point.coordinates) || point.coordinates.length < 2) {
    console.warn(`Skipping invalid point at index ${index}:`, point);
    return null;
  }

  // 🔥 CRITICAL FIX: Check for valid coordinate values
  const lng = Number(point.coordinates[0]);
  const lat = Number(point.coordinates[1]);
  
  if (isNaN(lng) || isNaN(lat) || 
    (lng === 0 && lat === 0) ||  // Only skip if BOTH are zero
    Math.abs(lat) > 90 || 
    Math.abs(lng) > 180) {
  console.warn(`Skipping point with invalid coordinates...`);
  return null;
}

  const position = {
    lat: lat,
    lng: lng,
  };

  const isPointSame = pointA && !pointB && isSameCoordinate(pointA, position);

  // ✅ PROPER ICON LOGIC - Fixed to handle all point types
  const getIconUrl = (point: any): string => {
  const properties = point?.properties || {};
  const iconProp = properties.icon;
  
  // If icon is already a valid URL, use it
  if (iconProp && typeof iconProp === 'string' && iconProp.startsWith('http')) {
    return iconProp;
  }
  
  // Check multiple property sources for asset type
  const assetType = properties.asset_type || 
                   properties.type || 
                   point.type || 
                   point.name?.includes('BJC') ? 'BJC' :
                   point.name?.includes('SJC') ? 'SJC' :
                   point.name?.includes('LC') ? 'LC' : '';
  
  // Map asset types to icons
  const iconMap: Record<string, string> = {
    "Block Router": "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    "BHQ": "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
    "GP": "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    "BJC": "https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
    "SJC": "https://maps.google.com/mapfiles/ms/icons/orange-dot.png",
    "LC": "https://maps.google.com/mapfiles/ms/icons/pink-dot.png",
    "N Highway Cross": "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    "FPOI": "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
  };
  
  return iconMap[assetType] || "https://maps.google.com/mapfiles/ms/icons/red-dot.png";
};

  const pointName = point.name || `Point_${index}`;

  return (
    <Marker
      key={`marker-${index}-${pointName}-${lat}-${lng}`}
      position={position}
      icon={{
        url: getIconUrl(point),
        scaledSize: new window.google.maps.Size(30, 30),
      }}
      title={pointName}
      onClick={() => {
        setPointProperties(point);
        if (AutoMode) {
          if (!pointA) {
            setPointAName(pointName);
            setPointA(position);
          } else if (!pointB && !isPointSame) {
            setPointBName(pointName);
            setPointB(position);
          }
        }
      }}
    />
  );
})}
      
      {distanceInfoWindows.map((info, idx) => (
        <DistanceLabel
          key={idx}
          position={info.position}
          text={`${info.distance?.toFixed(2)} km`}
        />
      ))}

      {/* Auto Mode Panel - keeping your existing implementation */}
      {AutoMode && (
        <div className="absolute top-15 right-4 z-50 bg-white text-white rounded-lg shadow-lg w-80 overflow-hidden">
          <div className="bg-gray-200 text-blue-800 flex justify-between items-center px-4 py-3">
            <h2 className="text-lg font-semibold">Route Selection</h2>
            <button className="text-blue-800 hover:text-blue-600 text-xl font-bold" onClick={() => setAutoMode(false)}>&times;</button>
          </div>
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
      
      {/* Line Summary - keeping your existing implementation */}
      {lineSummary && (
        <div className="absolute top-35 left-3 overflow-hidden">
          <div className="p-3 rounded-lg shadow-md bg-white w-60 font-sans text-sm text-gray-800">
            <strong className="text-base mb-2 font-semibold text-blue-900 flex justify-between items-center">
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
    
    {/* Delete Route Modal - keeping your existing implementation */}
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
    
    {/* Notification - keeping your existing implementation */}
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