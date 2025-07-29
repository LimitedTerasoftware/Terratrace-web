export interface Placemark {
  id: string;
  name: string;
  description?: string;
  coordinates?: {
    lat: number;
    lng: number;
    alt?: number;
  };
  styleId?: string;
  icon?: string;
  state?: string;
  division?: string;
  block?: string;
  category?: string;
  customData?: Record<string, any>;
}
export interface ApiPlacemark {
  points: ApiPoint[];
  polylines: ApiPolyline[];
}

export interface ApiPoint {
  name: string;
  styleUrl: string | null;
  coordinates: {
    longitude: number;
    latitude: number;
  };
}

export interface ApiPolyline {
  name: string;
  styleUrl: string | null;
  distance: string | null;
  coordinates: [number, number][];
}
export interface KMZFile {
  id: string;
  filename: string;
  filepath:string;
  file_type:string;
  data_id:number;
  uploaded_at: Date;
  size: number;
  placemarks: Placemark[];
  originalData: ArrayBuffer;
  styles?: Record<string, any>;
  state_code: string;
  dist_code: string;
  blk_code: string;
}

export interface FilterState {
  state?: string;
  division?: string;
  block?: string;
  category?: string;
  searchQuery?: string;
}

export interface ViewState {
  center: {
    lat: number;
    lng: number;
  };
  zoom: number;
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
}
export interface PlacemarkCategory {
  id: string;
  name: string;
  count: number;
  visible: boolean;
  color: string;
  icon: string;
}

export interface ProcessedPlacemark {
  id: string;
  name: string;
  category: string;
  type: 'point' | 'polyline';
  coordinates: any;
  distance?: string|null;
  styleUrl?: string | null;
}

export interface PhysicalSurveyData{
    id:number;
    user_id: number;
    company_id: string|null,
    state_id: number,
    district_id: number,
    block_id: number,
    gp_id: number,
    startLocation: number,
    endLocation: number,
    cableType: string|null,
    is_active: number,
    created_at: string,
    updated_at: string,
    surveyType: string|null,
    latitude: string,
    longitude: string,
    event_type: string
}