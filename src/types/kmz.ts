export interface Placemark {
  id: string;
  name: string;
  description?: string;
  coordinates: {
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

export interface KMZFile {
  id: string;
  name: string;
  uploadDate: Date;
  size: number;
  placemarks: Placemark[];
  originalData: ArrayBuffer;
  styles?: Record<string, any>;
  metadata?: {
    states: string[];
    divisions: string[];
    blocks: string[];
    categories: string[];
  };
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