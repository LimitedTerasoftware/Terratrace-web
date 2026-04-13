import { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle, Menu, X, Bell, Users, Loader2 } from 'lucide-react';
import Form1 from './forms/Form1';
import Form2 from './forms/Form2';
import Form3 from './forms/Form3';
import Form4 from './forms/Form4';
import Form5 from './forms/Form5';
import Form6 from './forms/Form6';
import Form7 from './forms/Form7';
import type { FormData, GeoTaggedImage } from '../../types/gp-checklist';
import Sidebar from './Sidebar';
import axios from 'axios';
import {
  getStateData,
  getDistrictData,
  getBlockData,
  getChecklistPreview,
  updateChecklistItems,
} from '../Services/api';
import { GPList } from '../../types/survey';

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const ImgbaseUrl = import.meta.env.VITE_Image_URL;

const stripBaseUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith(ImgbaseUrl)) {
    return url.replace(ImgbaseUrl, '');
  }
  if (url.startsWith(BASEURL)) {
    return url.replace(BASEURL, '');
  }
  return url;
};

interface ImageUploadResponse {
  success: boolean;
  data: {
    images?: string[];
    videos?: string[];
    docs?: string[];
  };
}

const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images[]', file);
  });

  try {
    const response = await fetch(`${BASEURL}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data: ImageUploadResponse = await response.json();
    return data.data.images || [];
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

const uploadDocs = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('docs[]', file);
  });

  try {
    const response = await fetch(`${BASEURL}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data: ImageUploadResponse = await response.json();
    return data.data.docs || [];
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
const uploadVideos = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('videos[]', file);
  });

  try {
    const response = await fetch(`${BASEURL}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data: ImageUploadResponse = await response.json();
    return data.data.videos || [];
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

const geotagImage = async (
  imageUrl: string,
  latitude: number,
  longitude: number,
): Promise<void> => {
  try {
    await fetch(`${TraceBASEURL}/geotag-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        latitude,
        longitude,
      }),
    });
  } catch (error) {
    console.error('Geotag error:', error);
  }
};

const getFormFiles = (
  formNumber: number,
  formData: FormData,
): { images: GeoTaggedImage[]; docs: File[]; videos: File[] } => {
  const images: GeoTaggedImage[] = [];
  const docs: File[] = [];
  const videos: File[] = [];

  switch (formNumber) {
    case 2: {
      const f2 = formData.form2;
      if (f2) {
        images.push(...(f2.ofcRouteImages || []));
        images.push(...(f2.opticalPowerImages || []));
        images.push(...(f2.splicingImages || []));
        images.push(...(f2.routeIndicatorImages || []));
        if (f2.otdrPdf instanceof File) {
          docs.push(f2.otdrPdf);
        }
      }
      break;
    }
    case 3: {
      const f3 = formData.form3;
      if (f3) {
        images.push(...(f3.routerImage || []));
        images.push(...(f3.snocImage || []));
        images.push(...(f3.qrCodeImage || []));
        images.push(...(f3.pingProofImg || []));
      }
      break;
    }
    case 4: {
      const f4 = formData.form4;
      if (f4) {
        if (f4.earthingVideo instanceof File) videos.push(f4.earthingVideo);
        images.push(...(f4.solarPanelImage || []));
        images.push(...(f4.batteryBackupImage || []));
      }
      break;
    }
    case 5: {
      const f5 = formData.form5;
      if (f5) {
        images.push(...(f5.photosAngleImages || []));
        if (f5.videoUploadedFile instanceof File)
          videos.push(f5.videoUploadedFile);
        if (f5.abdPDF instanceof File) docs.push(f5.abdPDF);
        images.push(...(f5.GISImgages || []));
        images.push(...(f5.IEimages || []));
      }
      break;
    }
    case 6: {
      const f6 = formData.form6;
      if (f6) {
        if (f6.socialAuditVideo instanceof File)
          videos.push(f6.socialAuditVideo);
        if (f6.siteLabelBoardImage) images.push(...f6.siteLabelBoardImage);
        if (f6.materialImgages) images.push(...f6.materialImgages);
        if (f6.verificationProof instanceof File)
          docs.push(f6.verificationProof);
      }
      break;
    }
    case 7: {
      const f7 = formData.form7;
      if (f7) {
        if (f7.patProof) images.push(...f7.patProof);
        if (f7.fatApprovalProof) images.push(...f7.fatApprovalProof);
        images.push(...(f7.qrTagImage || []));
        if (f7.hotoMemoSignature) images.push(...f7.hotoMemoSignature);
      }
      break;
    }
  }

  return { images, docs, videos };
};

const submitFormItems = async (
  gpMainId: number,
  items: Array<{
    form_type: string;
    item_name: string;
    item_type?: string;
    status: number;
    images?: string[];
    remark?: string;
  }>,
): Promise<void> => {
  try {
    await axios.post(`${TraceBASEURL}/add-form-items`, {
      gp_main_id: gpMainId,
      items,
    });
  } catch (error) {
    console.error('Error submitting form items:', error);
    throw error;
  }
};

const buildFormItems = (
  formNumber: number,
  formData: FormData,
  uploads: {
    imageUrls: string[];
    docUrls: string[];
    videoUrls: string[];
  },
  itemIds?: number[],
): Array<{
  id?: number;
  form_type: string;
  item_name: string;
  item_type?: string;
  status: number;
  images?: string[];
  remark?: string;
}> => {
  const items: Array<{
    id?: number;
    form_type: string;
    item_name: string;
    item_type?: string;
    status: number;
    images?: string[];
    remark?: string;
  }> = [];

  let imageIndex = 0;
  const getImages = (images?: GeoTaggedImage[]): string[] => {
    if (!images?.length) return [];
    const urls: string[] = [];
    images.forEach((img) => {
      if (img.originalUrl) {
        urls.push(stripBaseUrl(img.originalUrl));
      } else if (
        img.preview &&
        (img.preview.startsWith('http') || img.preview.startsWith('/'))
      ) {
        urls.push(stripBaseUrl(img.preview));
      } else if (
        img.watermarkedPreview &&
        (img.watermarkedPreview.startsWith('http') ||
          img.watermarkedPreview.startsWith('/'))
      ) {
        urls.push(stripBaseUrl(img.watermarkedPreview));
      } else {
        urls.push(uploads.imageUrls[imageIndex++] || '');
      }
    });

    return urls;
  };
  const getItemId = (itemName: string): number | undefined => {
    if (!itemIds || itemIds.length === 0) return undefined;

    const itemOrder: Record<number, Record<string, number>> = {
      2: {
        'OFC Route Images': 0,
        'Optical Power Images': 1,
        'Splicing Images': 2,
        'Route Indicator Images': 3,
        'OTDR PDF': 4,
      },
      3: {
        'Router Image': 0,
        'SNOC Image': 1,
        'Serial Number': 2,
        'MAC ID': 3,
        'QR Code Image': 4,
        'Device Ping Image': 5,
      },
      4: {
        'Solar panel installed and functional': 0,
        'Battery backup installed, charged': 1,
        'Proper earthing resistance verified': 2,
        'Power Source': 3,
      },
      5: {
        'Photos taken (5 angles: close-up + 4 directional) and geo-tagged': 0,
        'Video of GP installation uploaded to BharatNet GIS app': 1,
        'Digital As-Built Drawing (ABD)': 2,
        'GIS entry  latitude, longitude, route code, and asset type': 3,
        'Verification by Independent Engineer': 4,
      },
      6: {
        'Site Clear Images': 0,
        'TEC Approval Proof': 1,
        'Social Audit Video': 2,
        'Site Label Verification': 3,
      },
      7: {
        'PAT Completed Proof': 0,
        'FAT Approval Proof': 1,
        'QR Tag Verification Image': 2,
        'HOTO Memo Signature Image': 3,
      },
    };

    const formItemOrder = itemOrder[formNumber];
    if (!formItemOrder) return undefined;

    const index = formItemOrder[itemName];
    if (index === undefined || index >= itemIds.length) return undefined;

    return itemIds[index];
  };

  switch (formNumber) {
    case 2: {
      const f2 = formData.form2;
      if (!f2) break;
      items.push(
        {
          id: getItemId('OFC Route Images'),
          form_type: 'OFC and connectivity form',
          item_name: 'OFC Route Images',
          status: f2.ofcConnected === 'yes' ? 1 : 0,
          images: getImages(f2.ofcRouteImages),
        },
        {
          id: getItemId('Optical Power Images'),
          form_type: 'OFC and connectivity form',
          item_name: 'Optical Power Images',
          status: f2.opticalPowerConnected === 'yes' ? 1 : 0,
          images: getImages(f2.opticalPowerImages),
        },
        {
          id: getItemId('Splicing Images'),
          form_type: 'OFC and connectivity form',
          item_name: 'Splicing Images',
          status: f2.splicingConnected === 'yes' ? 1 : 0,
          images: getImages(f2.splicingImages),
        },
        {
          id: getItemId('Route Indicator Images'),
          form_type: 'OFC and connectivity form',
          item_name: 'Route Indicator Images',
          status: f2.routeIndicatorConnected === 'yes' ? 1 : 0,
          images: getImages(f2.routeIndicatorImages),
        },
        {
          id: getItemId('OTDR PDF'),
          form_type: 'OFC and connectivity form',
          item_name: 'OTDR PDF',
          status: f2.isOtdrReportUploaded === 'yes' ? 1 : 0,
          images: (() => {
            if (typeof f2.otdrPdf === 'string' && f2.otdrPdf) {
              return [stripBaseUrl(f2.otdrPdf)];
            }
            return f2.isOtdrReportUploaded === 'yes' ? uploads.docUrls : [];
          })(),
        },
      );
      break;
    }
    case 3: {
      const f3 = formData.form3;
      if (!f3) break;
      items.push(
        {
          id: getItemId('Router Image'),
          form_type: 'Equipement Installation',
          item_name: 'Router Image',
          status: f3.routerConnected === 'yes' ? 1 : 0,
          images: getImages(f3.routerImage),
        },
        {
          id: getItemId('SNOC Image'),
          form_type: 'Equipement Installation',
          item_name: 'SNOC Image',
          status: f3.snocImageConnected === 'yes' ? 1 : 0,
          images: getImages(f3.snocImage),
        },
        {
          id: getItemId('Serial Number'),
          form_type: 'Equipement Installation',
          item_name: 'Serial Number',
          status: f3.serialNumber ? 1 : 0,
          item_type: f3.serialNumber || '',
        },
        {
          id: getItemId('MAC ID'),
          form_type: 'Equipement Installation',
          item_name: 'MAC ID',
          status: f3.macId ? 1 : 0,
          item_type: f3.macId || '',
        },
        {
          id: getItemId('QR Code Image'),
          form_type: 'Equipement Installation',
          item_name: 'QR Code Image',
          item_type: f3.qrType || '',
          status: f3.qrCodeImage?.length ? 1 : 0,
          images: getImages(f3.qrCodeImage),
        },
        {
          id: getItemId('Device Ping Image'),
          form_type: 'Equipement Installation',
          item_name: 'Device Ping Image',
          status: f3.devicePing === 'yes' ? 1 : 0,
          images: getImages(f3.pingProofImg),
        },
      );
      break;
    }
    case 4: {
      const f4 = formData.form4;
      if (!f4) break;
      items.push(
        {
          id: getItemId('Solar panel installed and functional'),
          form_type: 'Power Earth Verification',
          item_name: 'Solar panel installed and functional',
          status: f4.solarPanelInstalled ? 1 : 0,
          images: getImages(f4.solarPanelImage),
        },

        {
          id: getItemId('Battery backup installed, charged'),
          form_type: 'Power Earth Verification',
          item_name: 'Battery backup installed, charged',
          status: f4.batteryBackup === 'yes' ? 1 : 0,
          images: getImages(f4.batteryBackupImage),
        },
        {
          id: getItemId('Proper earthing resistance verified'),
          form_type: 'Power Earth Verification',
          item_name: 'Proper earthing resistance verified',
          status: f4.earthingVerified === 'yes' ? 1 : 0,
          images: (() => {
            if (typeof f4.earthingVideo === 'string' && f4.earthingVideo) {
              return [stripBaseUrl(f4.earthingVideo)];
            }
            return f4.earthingVideo ? uploads.videoUrls : [];
          })(),
        },
        {
          id: getItemId('Power Source'),
          form_type: 'Power Earth Verification',
          item_name: 'Power Source',
          status: f4.powerSource ? 1 : 0,
          item_type: f4.powerSource || '',
        },
      );
      break;
    }
    case 5: {
      const f5 = formData.form5;
      if (!f5) break;
      items.push(
        {
          id: getItemId(
            'Photos taken (5 angles: close-up + 4 directional) and geo-tagged',
          ),
          form_type: 'Gsi Mapping',
          item_name:
            'Photos taken (5 angles: close-up + 4 directional) and geo-tagged',
          status: f5.photosGeoTagged === 'yes' ? 1 : 0,
          images: getImages(f5.photosAngleImages),
        },
        {
          id: getItemId(
            'Video of GP installation uploaded to BharatNet GIS app',
          ),
          form_type: 'Gsi Mapping',
          item_name: 'Video of GP installation uploaded to BharatNet GIS app',
          status: f5.videoUploaded === 'yes' ? 1 : 0,
          images: (() => {
            if (
              typeof f5.videoUploadedFile === 'string' &&
              f5.videoUploadedFile
            ) {
              return [f5.videoUploadedFile];
            }
            return f5.videoUploaded === 'yes' ? uploads.videoUrls : [];
          })(),
        },
        {
          id: getItemId('Digital As-Built Drawing (ABD)'),
          form_type: 'Gsi Mapping',
          item_name: 'Digital As-Built Drawing (ABD)',
          status: f5.abdUpdated === 'yes' ? 1 : 0,
          images: (() => {
            if (
              typeof f5.videoUploadedFile === 'string' &&
              f5.videoUploadedFile
            ) {
              return [stripBaseUrl(f5.videoUploadedFile)];
            }
            return f5.videoUploaded === 'yes' ? uploads.videoUrls : [];
          })(),
        },
        {
          id: getItemId('Digital As-Built Drawing (ABD)'),
          form_type: 'Gsi Mapping',
          item_name: 'Digital As-Built Drawing (ABD)',
          status: f5.abdUpdated === 'yes' ? 1 : 0,
          images: (() => {
            if (typeof f5.abdPDF === 'string' && f5.abdPDF) {
              return [stripBaseUrl(f5.abdPDF)];
            }
            return f5.abdUpdated === 'yes' && f5.abdPDF ? uploads.docUrls : [];
          })(),
        },
        {
          id: getItemId(
            'GIS entry  latitude, longitude, route code, and asset type',
          ),
          form_type: 'Gsi Mapping',
          item_name:
            'GIS entry  latitude, longitude, route code, and asset type',
          status: f5.gisEntryCompleted === 'yes' ? 1 : 0,
          images: getImages(f5.GISImgages),
        },
        {
          id: getItemId('Verification by Independent Engineer'),
          form_type: 'Gsi Mapping',
          item_name: 'Verification by Independent Engineer',
          status: f5.ieVerification === 'yes' ? 1 : 0,
          images: getImages(f5.IEimages),
        },
      );
      break;
    }
    case 6: {
      const f6 = formData.form6;
      if (!f6) break;
      items.push(
        {
          id: getItemId('Site Clear Images'),
          form_type: 'Safe Quality Verification',
          item_name: 'Site Clear Images',
          item_type: f6.siteClean || '',
          status: f6.siteClean != '' ? 1 : 0,
          images: getImages(f6.materialImgages),
        },
        {
          id: getItemId('TEC Approval Proof'),
          form_type: 'Safe Quality Verification',
          item_name: 'TEC Approval Proof',
          status: f6.materialsApproved ? 1 : 0,
          images: (() => {
            if (
              typeof f6.verificationProof === 'string' &&
              f6.verificationProof
            ) {
              return [stripBaseUrl(f6.verificationProof)];
            }
            return f6.materialsApproved && f6.verificationProof
              ? uploads.docUrls
              : [];
          })(),
        },
        {
          id: getItemId('Social Audit Video'),
          form_type: 'Safe Quality Verification',
          item_name: 'Social Audit Video',
          status:
            f6.socialAudit === 'yes' ? 1 : f6.socialAudit === 'no' ? 0 : 0,
          images: (() => {
            if (
              typeof f6.socialAuditVideo === 'string' &&
              f6.socialAuditVideo
            ) {
              return [stripBaseUrl(f6.socialAuditVideo)];
            }
            return f6.socialAudit === 'yes' && f6.socialAuditVideo
              ? uploads.videoUrls
              : [];
          })(),
        },
        {
          id: getItemId('Site Label Verification'),
          form_type: 'Safe Quality Verification',
          item_name: 'Site Label Verification',
          status: f6.siteLabelBoard === 'yes' ? 1 : 0,
          images: getImages(f6.siteLabelBoardImage),
        },
      );
      break;
    }
    case 7: {
      const f7 = formData.form7;
      if (!f7) break;
      items.push(
        {
          id: getItemId('PAT Completed Proof'),
          form_type: 'Final Acceptance',
          item_name: 'PAT Completed Proof',
          status:
            f7.patCompleted === 'yes' ? 1 : f7.patCompleted === 'no' ? 0 : 0,
          images: (f7.patCompleted === 'yes' && getImages(f7.patProof)) || [],
        },
        {
          id: getItemId('FAT Approval Proof'),
          form_type: 'Final Acceptance',
          item_name: 'FAT Approval Proof',
          status:
            f7.fatApproved === 'yes' ? 1 : f7.fatApproved === 'no' ? 0 : 0,
          images:
            (f7.fatApproved === 'yes' && getImages(f7.fatApprovalProof)) || [],
        },
        {
          id: getItemId('QR Tag Verification Image'),
          form_type: 'Final Acceptance',
          item_name: 'QR Tag Verification Image',
          status:
            f7.qrTagVerified === 'yes' ? 1 : f7.qrTagVerified === 'no' ? 0 : 0,
          images:
            (f7.qrTagVerified === 'yes' && getImages(f7.qrTagImage)) || [],
        },

        {
          id: getItemId('HOTO Memo Signature Image'),
          form_type: 'Final Acceptance',
          item_name: 'HOTO Memo Signature Image',
          status: f7.hotoSigned === 'yes' ? 1 : f7.hotoSigned === 'no' ? 0 : 0,
          images:
            (f7.hotoSigned === 'yes' && getImages(f7.hotoMemoSignature)) || [],
        },
      );
      break;
    }
  }

  return items;
};

function App() {
  const [currentForm, setCurrentForm] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [completedForms, setCompletedForms] = useState<Set<number>>(new Set());
  const [form1Existing, setForm1Existing] = useState(false);
  const [existingForms, setExistingForms] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpMainId, setGpMainId] = useState<number | null>(null);
  const [showGpModal, setShowGpModal] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [previousForm, setPreviousForm] = useState<number | null>(null);
  const [formItemIds, setFormItemIds] = useState<Record<number, number[]>>({});
  const formDataRef = useRef(formData);
  const currentFormRef = useRef(currentForm);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    currentFormRef.current = currentForm;
  }, [currentForm]);

  const [states, setStates] = useState<
    { state_id: string; state_name: string }[]
  >([]);
  const [districts, setDistricts] = useState<
    { district_id: string; district_name: string }[]
  >([]);
  const [blocks, setBlocks] = useState<
    { block_id: string; block_name: string }[]
  >([]);
  const [gps, setGps] = useState<GPList[]>([]);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedGp, setSelectedGp] = useState<string>('');

  useEffect(() => {
    getStateData().then((data) => setStates(data));
  }, []);

  useEffect(() => {
    if (selectedState) {
      getDistrictData(selectedState).then((data) => setDistricts(data));
      setSelectedDistrict('');
      setBlocks([]);
      setGps([]);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) {
      getBlockData(selectedDistrict).then((data) => setBlocks(data));
      setSelectedBlock('');
      setGps([]);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedBlock) {
      axios
        .get(`${BASEURL}/gpdata`, { params: { block_code: selectedBlock } })
        .then((res) => setGps(res.data || []))
        .catch(() => setGps([]));
      setSelectedGp('');
    }
  }, [selectedBlock]);

  useEffect(() => {
    if (
      gpMainId &&
      currentForm >= 2 &&
      currentForm <= 7 &&
      previousForm !== currentForm &&
      completedForms.has(currentForm)
    ) {
      setPreviousForm(currentForm);

      const fetchFormData = async () => {
        try {
          const response = await getChecklistPreview(gpMainId);
          if (response.status) {
            const { items } = response.data;

            const parseImages = (images: any): string[] => {
              if (!images) return [];
              try {
                return typeof images === 'string' ? JSON.parse(images) : images;
              } catch {
                return [];
              }
            };

            const mapToImages = (
              urls: string[],
              prefix: string,
            ): GeoTaggedImage[] =>
              urls.map((url, index) => ({
                id: `${prefix}_${index}`,
                file: new File([], `${prefix}_${index}.jpg`),
                preview: url.startsWith('http') ? url : `${ImgbaseUrl}/${url}`,
                originalUrl: url,
                latitude: 0,
                longitude: 0,
                timestamp: '',
              }));

            const getStatus = (itemName: string) => {
              const item = items.find((i: any) => i.item_name === itemName);
              return item?.status === 1
                ? 'yes'
                : item?.status === 0
                  ? 'no'
                  : '';
            };

            const getItemImages = (itemName: string, prefix: string) => {
              const item = items.find((i: any) => i.item_name === itemName);
              return mapToImages(parseImages(item?.images), prefix);
            };

            const getSingleFileUrl = (itemName: string): string | null => {
              const item = items.find((i: any) => i.item_name === itemName);
              const parsed = parseImages(item?.images);
              return parsed?.[0] ? `${ImgbaseUrl}/${parsed[0]}` : null;
            };

            const getItemIds = (itemName: string): number[] => {
              const item = items.find((i: any) => i.item_name === itemName);
              return item?.id ? [item.id] : [];
            };

            let formUpdateData: any = {};

            if (currentForm === 2) {
              const f2Items = items.filter(
                (i: any) => i.form_type === 'OFC and connectivity form',
              );
              setFormItemIds((prev) => ({
                ...prev,
                2: f2Items.map((i: any) => i.id),
              }));
              formUpdateData = {
                ofcConnected: getStatus('OFC Route Images'),
                ofcRouteImages: getItemImages('OFC Route Images', 'ofc_route'),
                opticalPowerConnected: getStatus('Optical Power Images'),
                opticalPowerImages: getItemImages(
                  'Optical Power Images',
                  'optical_power',
                ),
                splicingConnected: getStatus('Splicing Images'),
                splicingImages: getItemImages('Splicing Images', 'splicing'),
                routeIndicatorConnected: getStatus('Route Indicator Images'),
                routeIndicatorImages: getItemImages(
                  'Route Indicator Images',
                  'route_indicator',
                ),
                otdrPdf: getSingleFileUrl('OTDR PDF'),
                isOtdrReportUploaded: getStatus('OTDR PDF'),
              };
            } else if (currentForm === 3) {
              const f3Items = items.filter(
                (i: any) => i.form_type === 'Equipement Installation',
              );
              setFormItemIds((prev) => ({
                ...prev,
                3: f3Items.map((i: any) => i.id),
              }));
              formUpdateData = {
                routerImage: getItemImages('Router Image', 'router'),
                routerConnected: getStatus('Router Image'),
                snocImage: getItemImages('SNOC Image', 'snoc'),
                snocImageConnected: getStatus('SNOC Image'),
                serialNumber:
                  f3Items.find((i: any) => i.item_name === 'Serial Number')
                    ?.item_type || '',
                macId:
                  f3Items.find((i: any) => i.item_name === 'MAC ID')
                    ?.item_type || '',
                qrType:
                  f3Items.find((i: any) => i.item_name === 'QR Code Image')
                    ?.item_type || '',
                qrCodeImage: getItemImages('QR Code Image', 'qr_code'),
                devicePing: getStatus('Device Ping Image'),
                pingProofImg: getItemImages('Device Ping Image', 'ping_proof'),
              };
            } else if (currentForm === 4) {
              const f4Items = items.filter(
                (i: any) => i.form_type === 'Power Earth Verification',
              );
              setFormItemIds((prev) => ({
                ...prev,
                4: f4Items.map((i: any) => i.id),
              }));
              formUpdateData = {
                solarPanelInstalled: getStatus(
                  'Solar panel installed and functional',
                ),
                solarPanelImage: getItemImages(
                  'Solar panel installed and functional',
                  'solar_panel',
                ),
                batteryBackup:
                  getStatus('Battery backup installed, charged') || '',
                batteryBackupImage: getItemImages(
                  'Battery backup installed, charged',
                  'battery_backup',
                ),
                earthingVerified:
                  getStatus('Proper earthing resistance verified') || '',
                earthingVideo: getSingleFileUrl(
                  'Proper earthing resistance verified',
                ),
                powerSource:
                  f4Items.find((i: any) => i.item_name === 'Power Source')
                    ?.item_type || '',
              };
            } else if (currentForm === 5) {
              const f5Items = items.filter(
                (i: any) => i.form_type === 'Gsi Mapping',
              );
              setFormItemIds((prev) => ({
                ...prev,
                5: f5Items.map((i: any) => i.id),
              }));
              formUpdateData = {
                photosGeoTagged: getStatus(
                  'Photos taken (5 angles: close-up + 4 directional) and geo-tagged',
                ),
                photosAngleImages: getItemImages(
                  'Photos taken (5 angles: close-up + 4 directional) and geo-tagged',
                  'photos_angle',
                ),
                videoUploadedFile: getSingleFileUrl(
                  'Video of GP installation uploaded to BharatNet GIS app',
                ),
                videoUploaded: getStatus(
                  'Video of GP installation uploaded to BharatNet GIS app',
                ),
                abdPDF: getSingleFileUrl('Digital As-Built Drawing (ABD)'),
                abdUpdated: getStatus('Digital As-Built Drawing (ABD)'),
                gisEntryCompleted: getStatus(
                  'GIS entry  latitude, longitude, route code, and asset type',
                ),
                GISImgages: getItemImages(
                  'GIS entry  latitude, longitude, route code, and asset type',
                  'gis',
                ),
                ieVerification: getStatus(
                  'Verification by Independent Engineer',
                ),
                IEimages: getItemImages(
                  'Verification by Independent Engineer',
                  'ie',
                ),
              };
            } else if (currentForm === 6) {
              const f6Items = items.filter(
                (i: any) => i.form_type === 'Safe Quality Verification',
              );
              setFormItemIds((prev) => ({
                ...prev,
                6: f6Items.map((i: any) => i.id),
              }));
              formUpdateData = {
                siteClean:
                  f6Items.find((i: any) => i.item_name === 'Site Clear Images')
                    ?.item_type || '',
                materialImgages: getItemImages(
                  'Site Clear Images',
                  'site_clean',
                ),
                materialsApproved: getStatus('TEC Approval Proof'),
                verificationProof: getSingleFileUrl('TEC Approval Proof'),
                socialAudit: getStatus('Social Audit Video'),
                socialAuditVideo: getSingleFileUrl('Social Audit Video'),
                siteLabelBoard: getStatus('Site Label Verification'),
                siteLabelBoardImage: getItemImages(
                  'Site Label Verification',
                  'site_label_board',
                ),
              };
            } else if (currentForm === 7) {
              const f7Items = items.filter(
                (i: any) => i.form_type === 'Final Acceptance',
              );
              setFormItemIds((prev) => ({
                ...prev,
                7: f7Items.map((i: any) => i.id),
              }));
              formUpdateData = {
                patCompleted: getStatus('PAT Completed Proof'),
                patProof: getItemImages('PAT Completed Proof', 'pat_proof'),
                fatApproved: getStatus('FAT Approval Proof'),
                fatApprovalProof: getItemImages(
                  'FAT Approval Proof',
                  'fat_approval',
                ),
                qrTagVerified: getStatus('QR Tag Verification Image'),
                qrTagImage: getItemImages(
                  'QR Tag Verification Image',
                  'qr_tag',
                ),
                hotoSigned: getStatus('HOTO Memo Signature Image'),
                hotoMemoSignature: getItemImages(
                  'HOTO Memo Signature Image',
                  'hoto_signature',
                ),
              };
            }

            setFormData((prev) => ({
              ...prev,
              [`form${currentForm}`]: formUpdateData,
            }));
          }
        } catch (error) {
          console.error('Error fetching form data:', error);
        }
      };

      fetchFormData();
    }
  }, [currentForm, gpMainId, previousForm]);
  const fetchExistingData = async (
    stateId: string,
    districtId: string,
    blockId: string,
    gpId: string,
    gpName: string,
  ) => {
    setIsLoadingData(true);
    try {
      const response = await axios.get(`${TraceBASEURL}/get-checklist-data`, {
        params: {
          state_id: stateId,
          district_id: districtId,
          block_id: blockId,
          gp_id: gpId,
        },
      });

      if (response.data?.status && response.data?.data?.main) {
        const { main, items } = response.data.data;
        setGpMainId(main.id);

        const parseImages = (images: any): string[] => {
          if (!images) return [];
          try {
            return typeof images === 'string' ? JSON.parse(images) : images;
          } catch {
            return [];
          }
        };

        const itemsMap: Record<string, any> = {};

        items.forEach((item: any) => {
          itemsMap[item.item_name] = {
            ...item,
            images: parseImages(item.images),
          };
        });

        const mapToImages = (
          urls: string[],
          prefix: string,
        ): GeoTaggedImage[] =>
          urls.map((url, index) => ({
            id: `${prefix}_${index}`,
            file: new File([], `${prefix}_${index}.jpg`),
            preview: url.startsWith('http') ? url : `${ImgbaseUrl}/${url}`,
            originalUrl: url,
            latitude: 0,
            longitude: 0,
            timestamp: '',
          }));

        const getStatus = (itemName: string) => {
          const item = items.find((i: any) => i.item_name === itemName);
          return item?.status === 1 ? 'yes' : item?.status === 0 ? 'no' : '';
        };

        const getRemark = (itemName: string) => {
          const item = items.find((i: any) => i.item_name === itemName);
          return item?.remark || '';
        };

        const getItemImages = (itemName: string, prefix: string) => {
          const item = items.find((i: any) => i.item_name === itemName);
          return mapToImages(parseImages(item?.images), prefix);
        };
        const getSingleFileUrl = (itemName: string): string | null => {
          const item = items.find((i: any) => i.item_name === itemName);
          const parsed = parseImages(item?.images);
          return parsed?.[0] ? `${ImgbaseUrl}/${parsed[0]}` : null;
        };

        const f1Data: FormData['form1'] = {
          stateId: main.state_id?.toString(),
          districtId: main.district_id?.toString(),
          blockId: main.block_id?.toString(),
          gpId: main.gp_id?.toString(),
          gpName: main.gp_name,
          latitude: main.latitude,
          longitude: main.longitude,
          building_type: main.building_type,
          geoTaggedPhoto: getStatus('Geo Tagged'),
          geotaggedSiteImages: getItemImages('Geo Tagged', 'geotagged'),
          siteBoardInstalled: getStatus('Board Installed'),
          siteBoardRemark: getRemark('Board Installed'),
          smartRackInstalled: getStatus('Smart Rack Installed'),
          smartRackPhoto: getItemImages('Smart Rack Installed', 'smart_rack'),
          qrCodeImages: getItemImages('QR Images', 'qr'),
          siteImages: mapToImages(parseImages(main.site_images), 'site'),
          buildingImages: mapToImages(
            parseImages(main.building_images),
            'building',
          ),
          otdrReport: getSingleFileUrl('OTDR Report'),
        };

        const f2Items = items.filter(
          (i: any) => i.form_type === 'OFC and connectivity form',
        );

        const f2Data: FormData['form2'] = {
          ofcConnected: getStatus('OFC Route Images'),
          ofcRouteImages: getItemImages('OFC Route Images', 'ofc_route'),
          opticalPowerConnected: getStatus('Optical Power Images'),
          opticalPowerImages: getItemImages(
            'Optical Power Images',
            'optical_power',
          ),
          splicingConnected: getStatus('Splicing Images'),
          splicingImages: getItemImages('Splicing Images', 'splicing'),
          routeIndicatorConnected: getStatus('Route Indicator Images'),
          routeIndicatorImages: getItemImages(
            'Route Indicator Images',
            'route_indicator',
          ),
          otdrPdf: getSingleFileUrl('OTDR PDF'),
          isOtdrReportUploaded: getStatus('OTDR PDF'),
        };
        const f3Items = items.filter(
          (i: any) => i.form_type === 'Equipement Installation',
        );
        const f3Data: FormData['form3'] = {
          routerImage: getItemImages('Router Image', 'router'),
          routerConnected: getStatus('Router Image'),
          snocImage: getItemImages('SNOC Image', 'snoc'),
          snocImageConnected: getStatus('SNOC Image'),
          serialNumber:
            f3Items.find((i: any) => i.item_name === 'Serial Number')
              ?.item_type || '',
          macId:
            f3Items.find((i: any) => i.item_name === 'MAC ID')?.item_type || '',
          qrType:
            f3Items.find((i: any) => i.item_name === 'QR Code Image')
              ?.item_type || '',
          qrCodeImage: getItemImages('QR Code Image', 'qr_code'),
          devicePing: getStatus('Device Ping Image'),
          pingProofImg: getItemImages('Device Ping Image', 'ping_proof'),
        };

        const f4Items = items.filter(
          (i: any) => i.form_type === 'Power Earth Verification',
        );
        const f4Data: FormData['form4'] = {
          solarPanelInstalled: getStatus(
            'Solar panel installed and functional',
          ),
          solarPanelImage: getItemImages(
            'Solar panel installed and functional',
            'solar_panel',
          ),
          batteryBackup: getStatus('Battery backup installed, charged') || '',
          batteryBackupImage: getItemImages(
            'Battery backup installed, charged',
            'battery_backup',
          ),
          earthingVerified:
            getStatus('Proper earthing resistance verified') || '',
          earthingVideo: getSingleFileUrl(
            'Proper earthing resistance verified',
          ),
          powerSource:
            f4Items.find((i: any) => i.item_name === 'Power Source')
              ?.item_type || '',
        };

        const f5Items = items.filter((i: any) => i.form_type === 'Gsi Mapping');
        const f5Data: FormData['form5'] = {
          photosGeoTagged: getStatus(
            'Photos taken (5 angles: close-up + 4 directional) and geo-tagged',
          ),
          photosAngleImages: getItemImages(
            'Photos taken (5 angles: close-up + 4 directional) and geo-tagged',
            'photos_angle',
          ),
          videoUploadedFile: getSingleFileUrl(
            'Video of GP installation uploaded to BharatNet GIS app',
          ),
          videoUploaded: getStatus(
            'Video of GP installation uploaded to BharatNet GIS app',
          ),
          abdPDF: getSingleFileUrl('Digital As-Built Drawing (ABD)'),
          abdUpdated: getStatus('Digital As-Built Drawing (ABD)'),
          gisEntryCompleted: getStatus(
            'GIS entry  latitude, longitude, route code, and asset type',
          ),
          GISImgages: getItemImages(
            'GIS entry  latitude, longitude, route code, and asset type',
            'gis',
          ),
          ieVerification: getStatus('Verification by Independent Engineer'),
          IEimages: getItemImages('Verification by Independent Engineer', 'ie'),
        };

        const f6Items = items.filter(
          (i: any) => i.form_type === 'Safe Quality Verification',
        );
        const f6Data: FormData['form6'] = {
          siteClean:
            f6Items.find((i: any) => i.item_name === 'Site Clear Images')
              ?.item_type || '',
          materialImgages: getItemImages('Site Clear Images', 'site_clean'),
          materialsApproved: getStatus('TEC Approval Proof'),
          verificationProof: getSingleFileUrl('TEC Approval Proof'),
          socialAudit: getStatus('Social Audit Video'),
          socialAuditVideo: getSingleFileUrl('Social Audit Video'),
          siteLabelBoard: getStatus('Site Label Verification'),
          siteLabelBoardImage: getItemImages(
            'Site Label Verification',
            'site_label_board',
          ),
        };

        const f7Items = items.filter(
          (i: any) => i.form_type === 'Final Acceptance',
        );
        const f7Data: FormData['form7'] = {
          patCompleted: getStatus('PAT Completed Proof'),
          patProof: getItemImages('PAT Completed Proof', 'pat_proof'),
          fatApproved: getStatus('FAT Approval Proof'),
          fatApprovalProof: getItemImages('FAT Approval Proof', 'fat_approval'),
          qrTagVerified: getStatus('QR Tag Verification Image'),
          qrTagImage: getItemImages('QR Tag Verification Image', 'qr_tag'),
          hotoSigned: getStatus('HOTO Memo Signature Image'),
          hotoMemoSignature: getItemImages(
            'HOTO Memo Signature Image',
            'hoto_signature',
          ),
        };

        setFormData({
          form1: f1Data,
          form2: f2Items.length > 0 ? f2Data : undefined,
          form3: f3Items.length > 0 ? f3Data : undefined,
          form4: f4Items.length > 0 ? f4Data : undefined,
          form5: f5Items.length > 0 ? f5Data : undefined,
          form6: f6Items.length > 0 ? f6Data : undefined,
          form7: f7Items.length > 0 ? f7Data : undefined,
        });

        setForm1Existing(true);

        const completed = new Set<number>();
        const existForms = new Set<number>();
        completed.add(1);
        existForms.add(1);

        const formTypes = new Set(items.map((i: any) => i.form_type));
        if (formTypes.has('OFC and connectivity form')) {
          completed.add(2);
          existForms.add(2);
        }
        if (formTypes.has('Equipement Installation')) {
          completed.add(3);
          existForms.add(3);
        }
        if (formTypes.has('Power Earth Verification')) {
          completed.add(4);
          existForms.add(4);
        }
        if (formTypes.has('ABD/GIS form') || formTypes.has('Gsi Mapping')) {
          completed.add(5);
          existForms.add(5);
        }
        if (
          formTypes.has('Site clean and material form') ||
          formTypes.has('Safe Quality Verification')
        ) {
          completed.add(6);
          existForms.add(6);
        }
        if (
          formTypes.has('PAT/ FAT form') ||
          formTypes.has('Final Acceptance')
        ) {
          completed.add(7);
          existForms.add(7);
        }
        setCompletedForms(completed);
        setExistingForms(existForms);

        const firstIncompleteForm = [1, 2, 3, 4, 5, 6, 7].find(
          (f) => !completed.has(f),
        );
        if (firstIncompleteForm) {
          setCurrentForm(firstIncompleteForm);
        }
      } else {
        const f1Data: FormData['form1'] = {
          stateId: stateId?.toString(),
          districtId: districtId?.toString(),
          blockId: blockId?.toString(),
          gpId: gpId?.toString(),
          gpName: gpName,
        };
        setFormData({ form1: f1Data });
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleGpSelect = () => {
    if (selectedState && selectedDistrict && selectedBlock && selectedGp) {
      const gp = gps.find((g) => g.id === Number(selectedGp));

      setShowGpModal(false);
      fetchExistingData(
        selectedState,
        selectedDistrict,
        selectedBlock,
        selectedGp,
        gp?.name || '',
      );
    }
  };

  const updateFormData = (formNumber: number, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [`form${formNumber}`]: data,
    }));
  };

  const handleSubmitForm1 = async () => {
    if (!formData.form1) {
      alert('Please fill in Form 1');
      return;
    }

    const f1 = formData.form1;
    const requiredFields = [
      { value: f1.stateId, field: 'State' },
      { value: f1.districtId, field: 'District' },
      { value: f1.blockId, field: 'Block' },
      { value: f1.gpId, field: 'GP' },
      { value: f1.latitude, field: 'Latitude' },
      { value: f1.longitude, field: 'Longitude' },
      { value: f1.building_type, field: 'Building Type' },
      { value: f1.geoTaggedPhoto, field: 'Geo-tagged Photo' },
      { value: f1.siteBoardInstalled, field: 'Site Board Installed' },
      { value: f1.smartRackInstalled, field: 'Smart Rack Installed' },
      { value: f1.otdrReport, field: 'OTDR Report' },
    ];

    const missingFields = requiredFields
      .filter((f) => !f.value)
      .map((f) => f.field);

    if (missingFields.length > 0) {
      alert(`Please fill required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (
      !f1.siteImages?.length ||
      !f1.buildingImages?.length ||
      !f1.qrCodeImages?.length
    ) {
      alert('Please capture required images (Site, Building, QR Code)');
      return;
    }

    if (f1.geoTaggedPhoto === 'yes' && !f1.geotaggedSiteImages?.length) {
      alert('Please capture geo-tagged site photo');
      return;
    }

    if (f1.smartRackInstalled === 'yes' && !f1.smartRackPhoto?.length) {
      alert('Please capture smart rack photo');
      return;
    }

    setIsSubmitting(true);

    try {
      const f1 = formData.form1;

      const convertBase64ToFile = (base64: string, filename: string): File => {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      };

      const allImageFiles = [
        ...(f1.siteImages || []).map((img) =>
          img.watermarkedPreview
            ? convertBase64ToFile(img.watermarkedPreview, `site_${img.id}.jpg`)
            : img.file,
        ),
        ...(f1.buildingImages || []).map((img) =>
          img.watermarkedPreview
            ? convertBase64ToFile(
                img.watermarkedPreview,
                `building_${img.id}.jpg`,
              )
            : img.file,
        ),
        ...(f1.qrCodeImages || []).map((img) =>
          img.watermarkedPreview
            ? convertBase64ToFile(img.watermarkedPreview, `qr_${img.id}.jpg`)
            : img.file,
        ),
        ...(f1.smartRackPhoto || []).map((img) =>
          img.watermarkedPreview
            ? convertBase64ToFile(img.watermarkedPreview, `rack_${img.id}.jpg`)
            : img.file,
        ),
        ...(f1.geotaggedSiteImages || []).map((img) =>
          img.watermarkedPreview
            ? convertBase64ToFile(
                img.watermarkedPreview,
                `geotagged_${img.id}.jpg`,
              )
            : img.file,
        ),
      ];

      const uploadedImageUrls: string[] =
        allImageFiles.length > 0 ? await uploadImages(allImageFiles) : [];

      let imageIndex = 0;
      const siteImagesData = (f1.siteImages || []).map(
        () => uploadedImageUrls[imageIndex++] || '',
      );
      const buildingImagesData = (f1.buildingImages || []).map(
        () => uploadedImageUrls[imageIndex++] || '',
      );
      const qrCodeImagesData = (f1.qrCodeImages || []).map(
        () => uploadedImageUrls[imageIndex++] || '',
      );
      const smartRackImagesData = (f1.smartRackPhoto || []).map(
        () => uploadedImageUrls[imageIndex++] || '',
      );
      const geotaggedSiteImagesData = (f1.geotaggedSiteImages || []).map(
        () => uploadedImageUrls[imageIndex++] || '',
      );

      const allImagesWithCoords: { url: string; lat: number; lng: number }[] = [
        ...(f1.siteImages || []).map((img, i) => ({
          url: siteImagesData[i],
          lat: img.latitude,
          lng: img.longitude,
        })),
        ...(f1.buildingImages || []).map((img, i) => ({
          url: buildingImagesData[i],
          lat: img.latitude,
          lng: img.longitude,
        })),
        ...(f1.qrCodeImages || []).map((img, i) => ({
          url: qrCodeImagesData[i],
          lat: img.latitude,
          lng: img.longitude,
        })),
        ...(f1.smartRackPhoto || []).map((img, i) => ({
          url: smartRackImagesData[i],
          lat: img.latitude,
          lng: img.longitude,
        })),
        ...(f1.geotaggedSiteImages || []).map((img, i) => ({
          url: geotaggedSiteImagesData[i],
          lat: img.latitude,
          lng: img.longitude,
        })),
      ];

      for (const imgData of allImagesWithCoords) {
        if (imgData.url) {
          await geotagImage(imgData.url, imgData.lat, imgData.lng);
        }
      }

      const pdfFiles = f1.otdrReport instanceof File ? [f1.otdrReport] : [];
      const uploadedPdfUrls: string[] =
        pdfFiles.length > 0 ? await uploadDocs(pdfFiles) : [];

      const items = [
        {
          form_type: 'General verification form',
          item_name: 'Geo Tagged',
          status:
            f1.geoTaggedPhoto === 'yes'
              ? 1
              : f1.geoTaggedPhoto === 'no'
                ? 0
                : 0,
          images: geotaggedSiteImagesData,
        },
        {
          form_type: 'General verification form',
          item_name: 'QR Images',
          status: (f1.qrCodeImages?.length || 0) > 0 ? 1 : 0,
          images: qrCodeImagesData,
        },
        {
          form_type: 'General verification form',
          item_name: 'OTDR Report',
          status: f1.otdrReport ? 1 : 0,
          images: uploadedPdfUrls,
        },
        {
          form_type: 'General verification form',
          item_name: 'Board Installed',
          status:
            f1.siteBoardInstalled === 'yes'
              ? 1
              : f1.siteBoardInstalled === 'no'
                ? 0
                : 0,

          remark: f1.siteBoardRemark || '',
        },
        {
          form_type: 'General verification form',
          item_name: 'Smart Rack Installed',
          status:
            f1.smartRackInstalled === 'yes'
              ? 1
              : f1.smartRackInstalled === 'no'
                ? 0
                : 0,
          images: smartRackImagesData,
        },
      ];

      const payload: any = {
        gpData: {
          state_id: parseInt(f1.stateId || '0'),
          district_id: parseInt(f1.districtId || '0'),
          block_id: parseInt(f1.blockId || '0'),
          gp_id: f1.gpId || '',
          gp_name: f1.gpName || '',
          latitude: parseFloat(f1.latitude || '0'),
          longitude: parseFloat(f1.longitude || '0'),
          building_type: f1.building_type || '',
          site_images: siteImagesData,
          building_images: buildingImagesData,
        },
        items,
      };

      if (gpMainId) {
        payload.gp_main_id = gpMainId;
      }

      const response = await axios.post(
        `${TraceBASEURL}/submit-gp-checklist`,
        payload,
      );
      const newGpMainId = response.data?.id;
      if (newGpMainId) {
        setGpMainId(newGpMainId);
      }

      const newCompleted = new Set(completedForms);
      newCompleted.add(1);
      setCompletedForms(newCompleted);
      const firstIncompleteForm = [1, 2, 3, 4, 5, 6, 7].find(
        (f) => !newCompleted.has(f),
      );
      if (firstIncompleteForm) {
        setCurrentForm(firstIncompleteForm);
      }

      alert('Form 1 submitted successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitOtherForm = async (formNumber: number) => {
    if (!gpMainId) {
      alert('Please submit Form 1 first');
      return;
    }

    setIsSubmitting(true);

    try {
      const convertBase64ToFile = (base64: string, filename: string): File => {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
      };

      const {
        images: formImages,
        docs: formDocs,
        videos: formVideos,
      } = getFormFiles(formNumber, formDataRef.current);

      const imageFiles = formImages
        .filter((img) => {
          if (img.originalUrl) return false;
          const preview = img.preview || img.watermarkedPreview || '';
          return !(preview.startsWith('http') || preview.startsWith('/'));
        })
        .map((img) =>
          img.watermarkedPreview
            ? convertBase64ToFile(
                img.watermarkedPreview,
                `form${formNumber}_${img.id}.jpg`,
              )
            : img.file,
        );

      const uploadedImageUrls = imageFiles.length
        ? await uploadImages(imageFiles)
        : [];

      const docFiles = formDocs.filter((doc: any) => {
        return !(
          typeof doc === 'string' &&
          (doc.startsWith('http') || doc.startsWith('/'))
        );
      });
      const uploadedDocUrls = docFiles.length ? await uploadDocs(docFiles) : [];

      const videoFiles = formVideos.filter((video: any) => {
        return !(
          typeof video === 'string' &&
          (video.startsWith('http') || video.startsWith('/'))
        );
      });
      const uploadedVideoUrls = videoFiles.length
        ? await uploadVideos(videoFiles)
        : [];

      for (let i = 0; i < imageFiles.length; i++) {
        const img = formImages.find((img) => {
          if (img.originalUrl) return false;
          const preview = img.preview || img.watermarkedPreview || '';
          return !(preview.startsWith('http') || preview.startsWith('/'));
        });
        const url = uploadedImageUrls[i];

        if (url && img?.latitude && img?.longitude) {
          await geotagImage(url, img.latitude, img.longitude);
        }
      }
      const formItems = buildFormItems(
        formNumber,
        formDataRef.current,
        {
          imageUrls: uploadedImageUrls,
          docUrls: uploadedDocUrls,
          videoUrls: uploadedVideoUrls,
        },
        formItemIds[currentFormRef.current],
      );
      if (formItems.length === 0) {
        alert('No data to submit for this form');
        setIsSubmitting(false);
        return;
      }
      const existingIds = formItemIds[currentFormRef.current] || [];
      const isFormCompleted = existingIds.length > 0;

      // const itemsToUpdate = formItems.filter((item) => item.id);
      // const itemsToCreate = formItems.filter((item) => !item.id);
      if (isFormCompleted) {
        await updateChecklistItems(gpMainId, formItems);
        setPreviousForm(null);
      } else {
        await submitFormItems(gpMainId, formItems);
      }
      const newCompleted = new Set(completedForms);
      newCompleted.add(formNumber);
      setCompletedForms(newCompleted);
      const firstIncompleteForm = [1, 2, 3, 4, 5, 6, 7].find(
        (f) => !newCompleted.has(f),
      );
      if (firstIncompleteForm) {
        setCurrentForm(firstIncompleteForm);
      }

      alert(`Form ${formNumber} submitted successfully!`);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (currentFormRef.current === 1) {
      await handleSubmitForm1();
    } else {
      await handleSubmitOtherForm(currentFormRef.current);
    }
  };

  const renderForm = () => {
    switch (currentForm) {
      case 1:
        return (
          <Form1
            data={formData.form1}
            onChange={(data) => updateFormData(1, data)}
            readOnly={form1Existing}
          />
        );
      case 2:
        return (
          <Form2
            data={formData.form2}
            onChange={(data) => updateFormData(2, data)}
          />
        );
      case 3:
        return (
          <Form3
            data={formData.form3}
            onChange={(data) => updateFormData(3, data)}
          />
        );
      case 4:
        return (
          <Form4
            data={formData.form4}
            onChange={(data) => updateFormData(4, data)}
          />
        );
      case 5:
        return (
          <Form5
            data={formData.form5}
            onChange={(data) => updateFormData(5, data)}
          />
        );
      case 6:
        return (
          <Form6
            data={formData.form6}
            onChange={(data) => updateFormData(6, data)}
          />
        );
      case 7:
        return (
          <Form7
            data={formData.form7}
            onChange={(data) => updateFormData(7, data)}
          />
        );
      default:
        return null;
    }
  };

  if (showGpModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Select GP Location
          </h2>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.state_id} value={state.state_id}>
                      {state.state_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={!selectedState}
                >
                  <option value="">Select District</option>
                  {districts.map((district) => (
                    <option
                      key={district.district_id}
                      value={district.district_id}
                    >
                      {district.district_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block
                </label>
                <select
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={!selectedDistrict}
                >
                  <option value="">Select Block</option>
                  {blocks.map((block) => (
                    <option key={block.block_id} value={block.block_id}>
                      {block.block_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GP
                </label>
                <select
                  value={selectedGp}
                  onChange={(e) => setSelectedGp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={!selectedBlock}
                >
                  <option value="">Select GP</option>
                  {gps.map((gp) => (
                    <option key={gp.id} value={gp.id}>
                      {gp.name}-{gp.lgd_code}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGpSelect}
                disabled={
                  !selectedState ||
                  !selectedDistrict ||
                  !selectedBlock ||
                  !selectedGp
                }
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-300 rounded-lg shadow-md"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className="flex">
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-10 transition-transform duration-300 ease-in-out`}
        >
          <div className="h-screen sticky top-0">
            <Sidebar
              currentForm={currentForm}
              progress={completedForms.size}
              onFormChange={(formId) => {
                setCurrentForm(formId);
                setSidebarOpen(false);
              }}
              completedForms={completedForms}
              gpMainId={gpMainId}
            />
          </div>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto p-6 sm:p-8 lg:p-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10 mb-6">
              {renderForm()}
            </div>

            {!(form1Existing && currentForm === 1) && (
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>
                        {completedForms.has(currentForm)
                          ? 'Updating...'
                          : 'Submitting...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>
                        {completedForms.has(currentForm) ? 'Update' : 'Submit'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
