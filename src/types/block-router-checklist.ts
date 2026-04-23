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

export interface FormData {
  form1?: {
    stateId?: string | '';
    districtId?: string | '';
    blockId?: string | '';
    blockName?: string | '';
    latitude?: string | '';
    longitude?: string | '';
    siteImages?: GeoTaggedImage[] | [];
    building_type?: string | '';
    buildingImages?: GeoTaggedImage[] | [];
    qrCodeImages?: GeoTaggedImage[] | [];
    otdrReport?: File | null | string;
    geoTaggedPhoto?: string | '';
    siteBoardInstalled?: string | '';
    siteBoardRemark?: string | '';
    smartRackInstalled?: string | '';
    smartRackPhoto?: GeoTaggedImage[] | [];
    geotaggedSiteImages?: GeoTaggedImage[] | [];
  };
  form2?: {
    ofcRouteImages?: GeoTaggedImage[];
    ofcConnected?: string;
    opticalPowerImages?: GeoTaggedImage[];
    opticalPowerConnected?: string;
    splicingImages?: GeoTaggedImage[];
    splicingConnected?: string;
    routeIndicatorImages?: GeoTaggedImage[];
    routeIndicatorConnected?: string;
    otdrPdf?: File | null | string;
    isOtdrReportUploaded?: string;
  };
  form3?: {
    routerImage?: GeoTaggedImage[];
    routerConnected?: string;
    snocImage?: GeoTaggedImage[];
    snocImageConnected?: string;
    serialNumber?: string;
    macId?: string;
    qrType?: string;
    qrCodeImage?: GeoTaggedImage[];
    devicePing?: string;
    pingProofImg?: GeoTaggedImage[];
  };
  form4?: {
    solarPanelInstalled?: string;
    solarPanelImage?: GeoTaggedImage[];
    batteryBackup?: string;
    batteryBackupImage?: GeoTaggedImage[];
    earthingVerified?: string;
    earthingVideo?: File | null | string;
    powerSource?: string;
  };
  form5?: {
    photosGeoTagged?: string;
    photosAngleImages?: GeoTaggedImage[];
    videoUploaded?: string;
    videoUploadedFile?: File | null | string;
    abdUpdated?: string;
    abdPDF?: File | null | string;
    gisEntryCompleted?: string;
    GISImgages?: GeoTaggedImage[];
  };
  form6?: {
    cableDuctImages?: GeoTaggedImage[];
    cableDuctDescription?: string;
    chamberImages?: GeoTaggedImage[];
    chamberDescription?: string;
    cableDrumImages?: GeoTaggedImage[];
    cableDrumDescription?: string;
  };
  form7?: {
    powerConsumption?: string;
    powerConsumptionImage?: GeoTaggedImage[];
    cableJointImages?: GeoTaggedImage[];
    cableJointDescription?: string;
    slackCoilsImages?: GeoTaggedImage[];
    slackCoilsDescription?: string;
    otdrTestReport?: File | null | string;
  };
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

export interface BlockRouterChecklistData {
  id: string;
  stateId?: string;
  districtId?: string;
  blockId?: string;
  blockName?: string;
  createdAt?: string;
  updatedAt?: string;
  submittedBy?: string;
  formData?: FormData;
}
