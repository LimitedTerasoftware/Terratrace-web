export interface StartGp {
  name: string,
  blk_name: string,
  dt_name: string,
  st_name: string,
}

export interface EndGp {
   name: string,
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
}

export interface FolderStructure {
  [blockPath: string]: MediaFile[];
}

export interface DepthDataPoint {
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
}

export interface Block {
  block_id: string;
  block_name: string;
  district_code: string;
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
  fromDate: string;
  toDate: string;
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