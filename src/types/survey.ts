export interface StartGp {
  name: string,
  blk_name: string,
  dt_name: string,
  st_name: string,
  lgd_code:string,
  lattitude:string,
  longitude:string

}

export interface EndGp {
   name: string,
   lgd_code:string,
   lattitude:string,
   longitude:string
}

export interface PatrollerDetails {
companyName: string;
email: string;
mobile: string;
name: string;
}

export interface RoadCrossing {
  startPhoto?: string;
  endPhoto?: string;
  roadCrossing: string;
  endPhotoLat: number;
  endPhotoLong: number;
  length: string;
  startPhotoLat: number;
  startPhotoLong: number;
}

export interface RouteDetails {
  centerToMargin: string;
  roadWidth: string;
  routeBelongsTo: string;
  routeType: string;
  soilType: string;
}

export interface RouteFeasibility {
  alternatePathAvailable: boolean;
  alternativePathDetails: string;
  routeFeasible: boolean;
}

export interface UtilityFeaturesChecked {
  localInfo: string;
  selectedGroundFeatures: string[];
}

export interface VideoDetails {
  videoUrl?: string;
  startLatitude?: number;
  startLongitude?: number;
  startTimeStamp?: number;
  endLatitude?: number;
  endLongitude?: number;
  endTimeStamp?: number;

}

export interface UnderGroundSurveyData {
  id: number;
  survey_id: string;
  area_type: string;
  event_type: string;
  fpoiUrl: string;
  routeIndicatorUrl: string;
  jointChamberUrl: string;
  execution_modality: string;
  latitude: string;
  longitude: string;
  patroller_details: PatrollerDetails;
  road_crossing: RoadCrossing;
  route_details: RouteDetails;
  route_feasibility: RouteFeasibility;
  side_type: string;
  start_photos: string[];
  end_photos: string[];
  utility_features_checked: UtilityFeaturesChecked;
  videoUrl: string;
  videoDetails?: VideoDetails;
  created_at: string;
  createdTime: string;
  surveyUploaded: string;
  altitude: string;
  accuracy: string;
  depth: string;
  distance_error: string;
  kmtStoneUrl: string;
  landMarkUrls: string;
  fiberTurnUrl: string;
  landMarkType: string;
  blk_name?:string,
  dt_name?:string,
  st_name?:string,
  startGp?:string,
  endGp?:string,
  landMarkDescription:string;
  routeIndicatorType:string;

}

export interface GroundSurvey {
  id: number;
  startLocation: string;
  endLocation: string;
  block_id: string;
  district_id: string;
  state_id: string;
  under_ground_survey_data: UnderGroundSurveyData[];
  start_gp: StartGp;
  end_gp: EndGp;
}

export interface MediaFile {
  url: string;
  filename: string;
  eventType: string;
  type: 'image' | 'video';
  videoDetails?:any
}

export interface FolderStructure {
  [blockPath: string]: MediaFile[];
}

export interface DepthDataPoint {
  id: number;
  state_id: number;
  distrct_id: number;
  block_id: number;
  gp_id: number;
  link_name: string;
  startPointPhoto: string;
  startPointCoordinates: string;
  status: number;
  start_lgd: string;
  end_lgd: string;
  machine_id: string;
  contractor_details: string;
  distance: string;
  depthMeters: string;
  created_at: string;
  depthLatlong:string;
  depthPhoto:string;
  start_lgd_name:string;
  end_lgd_name:string;
  machine_registration_number:string;
  startPitLatlong: string | null;
  startPitPhotos: string | null;
  endPitLatlong: string | null;
  endPitPhotos: string | null;
  eventType: string;
  endPitDoc: string | null;

}

export interface ApiResponse {
  data: {
    depthData: DepthDataPoint[];
  };
}

export interface ChartPoint {
  distance: number;
  depth: number;
  isBelowMinimum: boolean;
  originalData: DepthDataPoint;
}
export interface Activity {
  id: number;
  state_id: string | null;
  distrct_id: string | null;
  block_id: string | null;
  gp_id: string | null;
  link_name: string;
  startPointPhoto: string | null;
  startPointCoordinates: string | null;
  routeBelongsTo: string | null;
  roadType: string | null;
  cableLaidOn: string | null;
  soilType: string | null;
  crossingType: string | null;
  crossingLength: string | null;
  crossingLatlong: string | null;
  crossingPhotos: string | null;
  executionModality: string | null;
  depthLatlong: string | null;
  depthPhoto: string | null;
  depthMeters: string | null;
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
  roadWidth: string | null;
  roadWidthPhotos: string | null;
  eventType: string;
  survey_id: number;
  vehicle_image: string | null;
  endPitDoc: string | null;
  start_lgd_name:string;
  end_lgd_name:string;
  registration_number:string;
  authorised_person:string;
  endPointCoordinates:string;
  endPointPhoto:string;
  landmark_type:string;
  landmark_description:string;
  machine_registration_number:string;
  Roadfesibility:string;
  area_type:string;
  road_margin:string;
  holdPhotos:string;
  holdLatlong:string;
  firm_name:string;
  dgps_accuracy:string; 
  dgps_siv:number;
  blowingPhotos:string;
  blowingLatLong:string;
  videoDetails:VideoDetails | null;
  pole_type: string | null;
  existing_pole: string | null;
  new_pole: string | null;
  routeFeatureLatLong:string|null;
  routeFeaturePhotos:string|null;
  routeFeatureType:string|null;
 }

export interface ApiResponseMachine {
  status: boolean;
  latestActivities: (Activity | { machine_id: number; message: string })[];
}

export interface MarkerData {
  position: google.maps.LatLngLiteral;
  activity: Activity;
}

export interface StateData {
  state_id: string;
  state_name: string;
  state_code: string;
}

export interface District {
  district_id: string;
  district_name: string;
  state_code: string;
  district_code:string
}

export interface Block {
  block_id: string;
  block_name: string;
  district_code: string;
  block_code:string
}

export interface UGConstructionSurveyData {
  id: number;
  user_id: number;
  company_id: number | null;
  state_id: number;
  state_name:string;
  district_id: number;
  district_name:string;
  block_id: number;
  block_name:string;
  gp_id: number;
  startLocation: number;
  endLocation: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  surveyType: string;
  start_lgd_name:string;
  end_lgd_name:string;
  user_name:string;
  user_mobile:string;
  construction_type: string | null;

}

// MachineWork Chart

export interface MachineData {
  date: string;
  totalDistance: string;
}

export interface MachineDataApiResponse {
  status: boolean;
  data: MachineData[];
}

export interface ChartDataPoint {
  x: string;
  y: number;
}

export interface FilterState {
  machineId: string;
  machineName:string;
  fromDate?: string;
  toDate?: string;
  month?: number;
  year?: number;
}
export interface ImageUploadResponse {
  success: boolean;
  data:{images?: string[];}
  message?: string;
}

export interface UpdatePhotosRequest {
  id: number;
  [key: string]: any;
}

export interface GPList{
  name:string,
  lattitude: string,
  longitude: string,
  type:string ,
  blk_code: string,
  blk_name: string,
  dt_code: string,
  dt_name: string,
  st_code: string,
  st_name: string,
  lgd_code: string,
  remark: string,
  id:number,
  created_at:string,
  updated_at:string
}

export type GPListFormData = Omit<GPList, 'id' | 'created_at' | 'updated_at'>;

export type GPMainData = {
  status: boolean,
  currentPage: number,
    totalPages: number,
    totalRows: number,
    filters: {
        st_code: string,
        dt_code: string,
        blk_code: string
    },
    data:GPList[]
}

export interface GPInstallationData {
    id: number;
    user_id: number;
    state_code: string;
    district_code: string;
    block_code: string;
    gp_code: string;
    gp_name: string;
    gp_latitude: string;
    gp_longitude: string;
    gp_photos: string; // JSON string array
    smart_rack: string; // JSON string
    fdms_shelf: string; // JSON string array
    ip_mpls_router: string; // JSON string
    sfp_10g: string; // JSON string array
    sfp_1g: string; // JSON string array
    power_system_with_mppt: string; // JSON string
    power_system_with_out_mppt: string; // JSON string
    mppt_solar_1kw: string; // JSON string
    equipment_photo: string; // JSON string array
    electricity_meter: string; // JSON string
    earthpit: string; // JSON string
    gp_contact: string; // JSON string
    key_person: string; // JSON string
    created_at: string;
    updated_at: string;
    state_name: string;
    district_name: string;
    block_name: string;
}

export interface SmartRackData {
    make: string;
    photo: string;
    serial_no: string;
    type: string;
}

export interface FDMSShelfData {
    count: number;
    make: string;
    photo: string;
    serial_no: string;
}

export interface IPMPLSRouterData {
    make: string;
    photo: string;
    serial_no: string;
    type: string;
}

export interface SFPData {
    count: string;
    make: string;
    photo: string;
    serial_no: string;
}

export interface PowerSystemData {
    available: boolean;
    make?: string;
    photo?: string;
    serial_no?: string;
}

export interface MPPTSolarData {
    make: string;
    photo: string;
    serial_no: string;
}

export interface ElectricityMeterData {
    photo: string;
    serial_no: string;
}

export interface EarthpitData {
    capacity: string;
    latitude: string;
    longitude: string;
    photo: string;
}

export interface GPContactData {
    email: string;
    name: string;
    phone: string;
}

export interface KeyPersonData {
    name: string;
    phone: string;
}

export interface InstallationResponse {
    status: boolean;
    totalRows: number;
    filters: Record<string, any>;
    data: GPInstallationData[];
}

export interface JointsApiResponse{
  success:boolean;
  total_joints?:number;
  data:JointsData[];
  message?:string;
  pagination:Pagination;
}
export interface Pagination{
  page: number,
    limit: number,
    total: number,
    total_pages: number
}
export interface JointsData{
   joint_code:string,
     joint_name:string,
     state_id: number,
     state_name:string,
     district_id: number,
     district_name:string,
     block_id: number,
     block_name:string,
     work_type:string,
     joint_type:string,
     date_time:string,
     created_at:string,
     gps_lat:string,
     gps_long:string,
     address:string,
     photo_path:string,
     proof_photo:string,
     user_id: never,
     user_name:string
}
export interface Cable {
  cable_id: string;
  cable_name: string;
  from_node: string;
  to_node: string;
  fiber_count: string;
  cable_type: string;
}

export interface TubeMapping {
  from_cable: string;
  from_cable_name: string;
  from_tube: string;
  from_tube_color: string;
  to_cable: string;
  to_cable_name: string;
  to_tube: string;
  to_tube_color: string;
}

export interface FiberSplicing {
  from_cable: string;
  from_cable_name: string;
  to_cable: string;
  to_cable_name: string;
  from_tube: string;
  to_tube: string;
  from_core: number;
  to_core: number;
  status: string | null;
}

export interface ProcessedJoints {
  id: string|undefined;
  name: string;
  category: string;
  type: 'point';
  coordinates: { lat: number; lng: number } | { lat: number; lng: number }[];
  address?: string;
  pointType?: string;
  assetType?: string;
  photo_path?: string;
  joint_code?: string;
  joint_type?: string;
  work_type?: string;
  state_name: string;
  district_name: string;
  block_name: string;
  cables: Cable[];
  tube_mapping: TubeMapping[];
  fiber_splicing: FiberSplicing[];
}
