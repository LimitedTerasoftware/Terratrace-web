export interface PatrollerDetails {
  companyName: string;
  email: string;
  mobile: string;
  name: string;
}

export interface RoadCrossing {
  endPhoto: string;
  endPhotoLat: number;
  endPhotoLong: number;
  length: string;
  roadCrossing: string;
  startPhoto: string;
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
  endLatitude: number;
  endLongitude: number;
  endTimeStamp: number;
  startLatitude: number;
  startLongitude: number;
  startTimeStamp: number;
  videoUrl: string;
}

export interface UnderGroundSurveyData {
  id: number;
  survey_id: string;
  area_type: string;
  event_type: "LIVELOCATION" | "VIDEORECORD";
  surveyUploaded: string;
  fpoiUrl: string;
  execution_modality: string;
  latitude: string;
  longitude: string;
  altitude: string;
  accuracy: string;
  depth: string;
  distance_error: string;
  patroller_details: PatrollerDetails;
  road_crossing: RoadCrossing;
  route_details: RouteDetails;
  route_feasibility: RouteFeasibility;
  routeIndicatorUrl: string;
  side_type: string;
  start_photos: string[];
  end_photos: string[];
  utility_features_checked: UtilityFeaturesChecked;
  videoUrl: string | null;
  videoDetails: VideoDetails;
  jointChamberUrl: string;
  createdTime: string;
  created_at: string;
  updated_at: string;
}

export interface MapPosition {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface SegmentSelection {
  start: MapPosition | null;
  end: MapPosition | null;
}