export interface FormStep {
  id: number;
  title: string;
  shortTitle: string;
}

export interface GeoTaggedImage {
  id: string;
  file: File;
  preview: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  watermarkedPreview?: string;
  originalUrl?: string;
}



export interface BlockChecklistResponse {
  status: boolean;
   pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
  blocks: BlockChecklistData[];
}
export interface BlockChecklistData {
  id: number;
  state_id: number;
  district_id: number;
  block_id: number;
  block_name: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  state_name: string;
  district_name: string;
}


export interface RouterData {
  status: boolean;
  block_id?: number;
  completion_percentage?: string;
  filled_tests?: number;
  total_tests?: number;
  tests?: Record<
    string,
    {
      Image: string;
      remarks: string;
      compliance: string;
    } | null
  >;
  message?: string;
}