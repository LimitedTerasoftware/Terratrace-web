export interface AerialSurveyDetails {
  id: number;
  startGpName: string;
  startGpCoordinates: string;
  startGpPhotos: string;
  endGpName: string;
  endGpCoordinates: string;
  endGpPhotos: string;
  aerial_road_crossings: AerialRoadCrossing[];
  aerial_poles: AerialPole[];
  created_at: string;
  updated_at: string;
  is_active: number;
  state_name:string;
  district_name:string;
  block_name:string;
  user_fullname:string;
  user_contact_no:string;
  block_id:number;
  gp_id:number;
  end_gp_id:number

}

export interface AerialRoadCrossing {
  id: number;
  typeOfCrossing: string;
  slattitude: string;
  slongitude: string;
  elattitude: string;
  elongitude: string;
  startPhoto: string;
  endPhoto: string;
  length: string;
  block_id?:number;
}

export interface AerialPole {
  id: number;
  survey_id:number;
  electricityLineType: string;
  lattitude: string;
  longitude: string;
  poleAvailabilityAt: string;
  poleCondition: string;
  poleHeight: string;
  polePhoto: string;
  polePosition: string;
  poleType: number;
  typeOfPole: string;
    block_id?:number;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  label: string;
}

export interface MapFilters {
  showStartEndGP: boolean;
  showPoles: boolean;
  showCrossings: boolean;
  showPolylines: boolean;
}

export interface MarkerData {
  position: google.maps.LatLngLiteral;
  type: 'start' | 'end' | 'pole' | 'crossing';
  data: any;
  surveyId: number;
}
export type EditType = 'aerial' | 'pole' | 'roadcrossing';

export interface EditPayload {
  type: EditType;
  id: number;
  [key: string]: string | number;
}
export interface PolePreview {
  id: number;
  survey_id: number | null;
  pit_id: string;
  latitude: string;
  longitude: string;
  pit_images: string[];
  muff_images: string[];
  earthing_images: string[];
  status: string;
  created_at: string;
  updated_at: string;
  pole_images: string[];
  muff_latitude: string | null;
  muff_longitude: string | null;
  earthing_latitude: string | null;
  earthing_longitude: string | null;
  pole_latitude: string | null;
  pole_longitude: string | null;
  workType: string | null;
  construction_type: string | null;
  start_lgd_name: string | null;
  end_lgd_name: string | null;
  state_name: string | null;
  district_name: string | null;
  block_name: string | null;
  user_name: string | null;
  user_mobile: string | null;
}

export interface JointEnclosure {
  jointType: string;
  jointImages: string[];
  endDrumMeter: string;
  endDrumNumber: string;
  startDrumMeter: string;
  startDrumNumber: string;
}
export interface Landmark {
  type: string;
  images: string[];
  description: string | null;
}


export interface PoleString {
  id: number;
  survey_id: number | null;
  pit_id: string | null;
  pole_type: string | null;
  eventType: string;
  latitude: number;
  longitude: number;
  line_type: string | null;
  pole_material: string | null;
  pole_owner: string | null;
  pole_owner_description: string | null;
  fitting_type: string | null;
  fitting_type_new: string | null;
  pole_height: string | null;
  drum_number: string | null;
  meter: string | null;
  landmark: Landmark | null;
  joint_enclosure: JointEnclosure | null;
  images: [] | null;
  created_at: string;
  updated_at: string;
  workType: string | null;
  construction_type: string | null;
  start_lgd_name: string | null;
  end_lgd_name: string | null;
  state_name: string | null;
  district_name: string | null;
  block_name: string | null;
  user_name: string | null;
  user_mobile: string | null;
  distance:number | null;
  video: string | null;
  image:string;
  road_crossing:string | null;
  version:string|null;
  is_active:number
}
export interface PoleSurveyResponse {
  status: boolean;
  count: number;
  data: PoleSurveyData[];
}

export interface PoleSurveyData {
  id: number;
  user_id: number;
  company_id: number | null;
  state_id: number;
  district_id: number;
  block_id: number;
  gp_id: number;
  startLocation: number;
  endLocation: number;
  cableType: string | null;
  routeType: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  surveyType: string;
  construction_type: string;
  versions: string | null;
  machine_id: number | null;
  total_distance: number;
  workType: string;
  start_lgd_name: string;
  end_lgd_name: string;
  state_name: string;
  district_name: string;
  block_name: string;
  user_name: string;
  user_mobile: string;
}

export interface PoleSurveyorDetails {
 rank: number;
 surveyor_id: number;
surveyor_name: string;
contact_no: string;
poles: number;
distance_km: number;
completion_percentage: number;
}
export interface PoleSurveyorDetailsResponse {
  status: boolean;
  filters: {
    state_id: number | null,
    district_id: number | null,
    block_id: number | null,
    from_date: string | null,
    to_date: string | null
  },
  total_surveyors: number;
  data: PoleSurveyorDetails[];
}