export interface Machine {
  machine_id:string;
  id: string;
  firm_name:string;
  authorised_person:string;
  machine_make:string;
  capacity:string;
  year_of_manufacture: number | null;
  no_of_rods:number;
  digitrack_make:string;
  digitrack_model:string;
  truck_make:string;
  truck_model:string;
  registration_number: string;
  registration_valid_upto:Date;
  driver_batch_no:string;
  driver_valid_upto:Date;
  serial_number: string;
  supervisor_name :string ,
  supervisor_email :string,
  supervisor_phone :string,
  author_phone :string,
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  created_at: Date;
  updated_at: Date;

  // contractor_name: string;
  // model: string;
  // manufacturer: string;
  // gps_tracker_id: string;
  // assigned_project: string;
}

export type MachineFormData = Omit<Machine, 'id' | 'created_at' | 'updated_at'>;

export interface DailyDistance {
  date: string;
  totalDistance: number;
  meetsDailyRequirement: boolean;
  difference: number;
}

export interface MachineData {
  machineId: string;
  dailyDistances: DailyDistance[];
  monthlyTotalDistance: number;
  machineRent: number;
  monthlyPenalty: number | null;
  monthlyIncentive: number | null;
  netCost: number;
}

export interface DepthEvent {
  id: number;
  depth: number;
  latlong: string;
  eventType: string;
  created_at: string;
  alert: boolean;
}

export interface DepthPenalties{
  totalDepthEvents: number;
  penalty500: number;
  penalty1100: number;
  alerts: number;
  totalDepthPenalty: number;
  details: DepthEvent[];

}

export interface ApiResponse {
  status: boolean;
  data: MachineData[];
  depthPenalties: DepthPenalties;
  filters: {
    machine_id: string;
    month: number;
    year: number;
    from_date: string;
    to_date: string;
    query_date: string;
  };
}


export interface PerformanceMetrics {
  status: 'excellent' | 'good' | 'warning' | 'penalty';
  message: string;
  color: string;
  bgColor: string;
}


export interface MachineDataListItem {
  id: number;
  link_name: string | null;
  startPointPhoto: string | null;
  startPointCoordinates: string | null;
  routeBelongsTo: string;
  roadType: string;
  cableLaidOn: string;
  soilType: string;
  crossingType: string | null;
  crossingLength: string | null;
  crossingLatlong: string | null;
  crossingPhotos: string | null;
  executionModality: string;
  depthLatlong: string | null;
  depthPhoto: string | null;
  depthMeters: string;
  fpoiLatLong: string | null;
  fpoiPhotos: string | null;
  jointChamberLatLong: string | null;
  jointChamberPhotos: string | null;
  manholeLatLong: string | null;
  manholePhotos: string | null;
  routeIndicatorLatLong: string | null;
  routeIndicatorPhotos: string | null;
  landmarkLatLong: string | null;
  landmarkPhotos: string | null;
  fiberTurnLatLong: string | null;
  fiberTurnPhotos: string | null;
  kilometerstoneLatLong: string | null;
  kilometerstonePhotos: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  start_lgd: string;
  end_lgd: string;
  machine_id: string;
  contractor_details: string | null;
  vehicleserialno: string | null;
  distance: string | null;
  startPitLatlong: string | null;
  startPitPhotos: string | null;
  endPitLatlong: string | null;
  endPitPhotos: string | null;
  roadWidthLatlong: string | null;
  roadWidth: string;
  roadWidthPhotos: string | null;
  eventType: string;
  survey_id: number;
  vehicle_image: string | null;
  endPitDoc: string | null;
  road_margin: string;
  endPointPhoto: string | null;
  endPointCoordinates: string | null;
  landmark_type: string | null;
  landmark_description: string | null;
  Roadfesibility: string;
  area_type: string;
  pole_type: string | null;
  existing_pole: string | null;
  new_pole: string | null;
  holdLatlong: string | null;
  holdPhotos: string | null;
  dgps_accuracy: string;
  dgps_siv: number;
  videoDetails: string | null;
  blowingLatLong: string | null;
  blowingPhotos: string | null;
  routeFeatureType: string | null;
  routeFeaturePhotos: string | null;
  routeFeatureLatLong: string | null;
  centerLatLong: string | null;
  cable_stack: string | null;
  machine_registration_number: string;
  firm_name: string;
  surveyType: string;
  construction_type: string;
  routeType: string | null;
  cableType: string | null;
  state_id: number;
  district_id: number;
  block_id: number;
  gp_id: number;
  state_name: string;
  district_name: string;
  block_name: string;
  start_lgd_name: string;
  end_lgd_name: string;
  user_name: string;
  user_mobile: string;
  url: string | null;
}

export interface MachineApiResponse {
  status: boolean;
  data: MachineDataListItem[];
}
