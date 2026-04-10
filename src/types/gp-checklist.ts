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
    gpId?: string | '';
    gpName?: string | '';
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
    ieVerification?: string;
    IEimages?: GeoTaggedImage[];
  };
  form6?: {
    siteClean?: string;
    materialsApproved?: string;
    verificationProof?: File | null | string;
    materialImgages?: GeoTaggedImage[];
    socialAudit?: string;
    socialAuditVideo?: File | null | string;
    siteLabelBoard?: string;
    siteLabelBoardImage?: GeoTaggedImage[];
  };
  form7?: {
    patCompleted?: string;
    patProof?: GeoTaggedImage[];
    fatApproved?: string;
    fatApprovalProof?: GeoTaggedImage[];
    qrTagVerified?: string;
    qrTagImage?: GeoTaggedImage[];
    hotoSigned?: string;
    hotoMemoSignature?: GeoTaggedImage[];
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
export interface GPChecklistData {
  id: number;
  state_id: number;
  district_id: number;
  block_id: number;
  gp_id: string;
  gp_name: string;
  latitude: string;
  longitude: string;
  site_images: string;
  building_images: string;
  building_type: string;
  user_id: string | null;
  status: number;
  created_at: string;
  updated_at: string;
}
