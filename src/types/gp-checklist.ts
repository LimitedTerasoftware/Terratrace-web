export interface FormStep {
  id: number;
  title: string;
  shortTitle: string;
}

export interface FormData {
  form1?: {
    siteAccessible?: string;
    siteLocation?: string;
    gpCoordinates?: string;
    sitePhotos?: string;
  };
  form2?: {
    ofcConnected?: string;
    fiberLength?: string;
    otdrTest?: string;
    linkStatus?: string;
  };
  form3?: {
    routerImage?: string;
    snocImage?: string;
    serialNumber?: string;
    macId?: string;
    qrType?: string;
    qrCodeImage?: File | null;
    devicePing?: string;
  };
  form4?: {
    solarPanelInstalled?: boolean;
    solarPanelFunctional?: string;
    batteryBackup?: string;
    earthingVerified?: string;
    powerSource?: string;
  };
  form5?: {
    photosGeoTagged?: string;
    videoUploaded?: string;
    abdUpdated?: boolean;
    gisEntryCompleted?: string;
    ieVerification?: string;
  };
  form6?: {
    siteClean?: string;
    materialsApproved?: boolean;
    socialAudit?: string;
    siteLabelBoard?: boolean;
  };
  form7?: {
    patCompleted?: string;
    fatApproved?: string;
    qrTagVerified?: string;
    hotoSigned?: string;
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
