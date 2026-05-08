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
export interface InfrastructureItem {
  Image: string;
  remarks: string;
  compliance: string;
}

export interface RackData {
  id: number;
  block_id: number;

  infrastructure_T1: InfrastructureItem | null;
  infrastructure_T2: InfrastructureItem | null;
  infrastructure_T3: InfrastructureItem | null;
  infrastructure_T4: InfrastructureItem | null;
  infrastructure_T5: InfrastructureItem | null;
  infrastructure_T6: InfrastructureItem | null;
  infrastructure_T7: InfrastructureItem | null;
  infrastructure_T8: InfrastructureItem | null;
  infrastructure_T9: InfrastructureItem | null;
  infrastructure_T10: InfrastructureItem | null;

  functional_T1: InfrastructureItem | null;
  functional_T2: InfrastructureItem | null;
  functional_T3: InfrastructureItem | null;
  functional_T4: InfrastructureItem | null;
  functional_T5: InfrastructureItem | null;
  functional_T6:InfrastructureItem | null;

  created_at: string;
  updated_at: string;
}

export interface RackPercentage {
  infrastructure: string;
  functional: string;
  overall: string;
}

export interface RackResponse {
  status: boolean;
  data: RackData;
  percentage: RackPercentage;
}