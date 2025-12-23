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
  user_contact_no:string

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
}

export interface AerialPole {
  id: number;
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
