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
}

export interface FormData {
  form1?: {
    stateId?: string | '';
    districtId?: string | '';
    blockId?: string | '';
    gpId?: string | '';
    gpName?: string | '';
    latitude?: string | '';
    longitude?: string | '';
    siteImages?: GeoTaggedImage[] | [];
    building_type?: string | '';
    buildingImages?: GeoTaggedImage[] | [];
    qrCodeImages?: GeoTaggedImage[] | [];
    otdrReport?: File | null;
    geoTaggedPhoto?: string | '';
    siteBoardInstalled?: string | '';
    siteBoardRemark?: string | '';
    smartRackInstalled?: string | '';
    smartRackPhoto?: GeoTaggedImage[] | [];
    geotaggedSiteImages?: GeoTaggedImage[] | [];
  };
  form2?: {
    ofcConnected?: string;
    fiberLength?: string;
    otdrTest?: string;
    linkStatus?: string;
    ofcRouteImages?: GeoTaggedImage[];
    opticalPowerImages?: GeoTaggedImage[];
    splicingImages?: GeoTaggedImage[];
    routeIndicatorImages?: GeoTaggedImage[];
    otdrPdf?: File | null;
  };
  form3?: {
    routerImage?: GeoTaggedImage[];
    snocImage?: GeoTaggedImage[];
    serialNumber?: string;
    macId?: string;
    qrType?: string;
    qrCodeImage?: GeoTaggedImage[];
    devicePing?: string;
  };
  form4?: {
    solarPanelInstalled?: boolean;
    solarPanelFunctional?: string;
    batteryBackup?: string;
    earthingVerified?: string;
    earthingVideo?: File | null;
    powerSource?: string;
  };
  form5?: {
    photosGeoTagged?: string;
    photosAngleImages?: GeoTaggedImage[];
    videoUploaded?: string;
    videoUploadedFile?: File | null;
    abdUpdated?: boolean;
    gisEntryCompleted?: string;
    ieVerification?: string;
  };
  form6?: {
    siteClean?: string;
    materialsApproved?: boolean;
    socialAudit?: string;
    socialAuditVideo?: File | null;
    siteLabelBoard?: boolean;
  };
  form7?: {
    patCompleted?: string;
    patProof?: File | null;
    fatApproved?: string;
    fatApprovalProof?: File | null;
    qrTagVerified?: string;
    qrTagImage?: GeoTaggedImage[];
    hotoSigned?: string;
    hotoMemoSignature?: File | null;
  };
}

export interface Project {
  id: string;
  name: string;
  location: string;
  status: 'draft' | 'submitted' | 'approved';
  current_form: number;
  progress: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}
