// Existing types (keeping your original structure)
export interface KMZFile {
  id: string;
  filename: string;
  uploaded_at: string | Date;
  filepath?: string;
  file_type?: string;
  size?: number;
  originalData?: ArrayBuffer;
  placemarks?: ProcessedPlacemark[];
}

export interface FilterState {
  state?: string;
  division?: string;
  block?: string;
}

export interface ViewState {
  center: { lat: number; lng: number };
  zoom: number;
}

// Placemark interfaces
export interface ApiPlacemark {
  points: ApiPoint[];
  polylines: ApiPolyline[];
}

export interface ApiPoint {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  type?: string;
  styleUrl?: string;
}

export interface ApiPolyline {
  name: string;
  coordinates: [number, number][];
  distance?: string;
  type?: string;
  styleUrl?: string;
}

export interface ProcessedPlacemark {
  id: string;
  name: string;
  category: string;
  type: 'point' | 'polyline';
  coordinates: { lat: number; lng: number } | { lat: number; lng: number }[];
  styleUrl?: string;
  distance?: string;
  pointType?: string;
}

export interface PlacemarkCategory {
  id: string;
  name: string;
  count: number;
  visible: boolean;
  color: string;
  icon: string;
}

// Physical Survey types
export interface PhysicalSurveyApiResponse {
  status: boolean;
  data: Record<string, PhysicalSurveyPoint[]>;
}

export interface PhysicalSurveyPoint {
  survey_id: string;
  event_type: string;
  latitude: string;
  longitude: string;
  [key: string]: any;
}

export interface ProcessedPhysicalSurvey {
  id: string;
  name: string;
  category: string;
  type: 'point' | 'polyline';
  coordinates: { lat: number; lng: number } | { lat: number; lng: number }[];
  surveyId: string;
  eventType: string;
  blockId: string;
  // NEW: Image fields
  images: SurveyImage[];
  hasImages: boolean;
}

export interface SurveyImage {
  url: string;
  type: 'start_photo' | 'end_photo' | 'fpoi' | 'route_indicator' | 'kmt_stone' | 
        'fiber_turn' | 'landmark' | 'joint_chamber' | 'road_crossing' | 
        'videorecord' | 'route_feasibility' | 'area' | 'side' | 'route_details' | 
        'hold_survey' | 'bridge' | 'culvert' | 'general';
  label: string;
  coordinates?: { lat: number; lng: number };
}


// Desktop Planning types
export interface DesktopPlanningApiResponse {
  status: boolean;
  data: DesktopPlanningNetwork[];
}

export interface DesktopPlanningNetwork {
  id: number;
  name: string;
  total_length: string;
  main_point_name: string;
  created_at: string;
  existing_length: string;
  proposed_length: string;
  status: string;
  st_code: string;
  st_name: string;
  blk_code: string;
  blk_name: string;
  dt_code: string;
  dt_name: string;
  user_id: number;
  user_name: string;
  points: DesktopPlanningPoint[];
  connections: DesktopPlanningConnection[];
}

export interface DesktopPlanningPoint {
  id: number;
  network_id: number;
  name: string;
  coordinates: string; // "[longitude,latitude]" format
  lgd_code: string;
  created_at: string;
  properties: string; // JSON string
}

export interface DesktopPlanningConnection {
  id: number;
  network_id: number;
  start_point_id: number | null;
  end_point_id: number | null;
  start: string;
  end: string;
  length: string;
  original_name: string;
  coordinates: string; // "[[lat,lng],[lat,lng],...]" format
  type: 'proposed' | 'incremental';
  color: string;
  created_at: string;
  start_latlong: string;
  end_latlong: string;
  user_id: number | null;
  user_name: string | null;
  status: string;
  properties: string; // JSON string
}

export interface ProcessedDesktopPlanning {
  id: string;
  name: string;
  category: string;
  type: 'point' | 'polyline';
  coordinates: { lat: number; lng: number } | { lat: number; lng: number }[];
  styleUrl?: string;
  pointType?: string;
  assetType?: string;
  status?: string;
  ring?: string;
  networkId?: number;
  lgdCode?: string;
  length?: string;
  connectionType?: 'proposed' | 'incremental';
  rawProperties?: any;
}

// Additional types for configuration
export interface EventTypeConfig {
  color: string;
  icon: string;
  label: string;
}

export interface EventTypeCounts {
  [eventType: string]: number;
}