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