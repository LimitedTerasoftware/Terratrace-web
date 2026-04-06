import { useState } from 'react';
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

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const ImgbaseUrl = import.meta.env.VITE_Image_URL;

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
        if (f2.otdrPdf) docs.push(f2.otdrPdf);
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
        if (f4.earthingVideo) videos.push(f4.earthingVideo);
        images.push(...(f4.solarPanelImage || []));
        images.push(...(f4.batteryBackupImage || []));
      }
      break;
    }
    case 5: {
      const f5 = formData.form5;
      if (f5) {
        images.push(...(f5.photosAngleImages || []));
        if (f5.videoUploadedFile) videos.push(f5.videoUploadedFile);
        if (f5.abdPDF) docs.push(f5.abdPDF);
        images.push(...(f5.GISImgages || []));
        images.push(...(f5.IEimages || []));
      }
      break;
    }
    case 6: {
      const f6 = formData.form6;
      if (f6) {
        if (f6.socialAuditVideo) videos.push(f6.socialAuditVideo);
        if (f6.siteLabelBoardImage) images.push(...f6.siteLabelBoardImage);
        if (f6.materialImgages) images.push(...f6.materialImgages);
        if (f6.verificationProof) docs.push(f6.verificationProof);
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
): Array<{
  form_type: string;
  item_name: string;
  item_type?: string;
  status: number;
  images?: string[];
  remark?: string;
}> => {
  const items: Array<{
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
    images.forEach(() => {
      urls.push(uploads.imageUrls[imageIndex++] || '');
    });
    return urls;
  };

  switch (formNumber) {
    case 2: {
      const f2 = formData.form2;
      if (!f2) break;
      items.push(
        {
          form_type: 'OFC and connectivity form',
          item_name: 'OFC Route Images',
          status: f2.ofcConnected === 'yes' ? 1 : 0,
          images: getImages(f2.ofcRouteImages),
        },
        {
          form_type: 'OFC and connectivity form',
          item_name: 'Optical Power Images',
          status: f2.opticalPowerConnected === 'yes' ? 1 : 0,
          images: getImages(f2.opticalPowerImages),
        },
        {
          form_type: 'OFC and connectivity form',
          item_name: 'Splicing Images',
          status: f2.splicingConnected === 'yes' ? 1 : 0,
          images: getImages(f2.splicingImages),
        },
        {
          form_type: 'OFC and connectivity form',
          item_name: 'Route Indicator Images',
          status: f2.routeIndicatorConnected === 'yes' ? 1 : 0,
          images: getImages(f2.routeIndicatorImages),
        },
        {
          form_type: 'OFC and connectivity form',
          item_name: 'OTDR PDF',
          status: f2.isOtdrReportUploaded === 'yes' ? 1 : 0,
          images: f2.isOtdrReportUploaded === 'yes' ? uploads.docUrls : [],
        },
      );
      break;
    }
    case 3: {
      const f3 = formData.form3;
      if (!f3) break;
      items.push(
        {
          form_type: 'Equipement Installation',
          item_name: 'Router Image',
          status: f3.routerConnected === 'yes' ? 1 : 0,
          images: getImages(f3.routerImage),
        },
        {
          form_type: 'Equipement Installation',
          item_name: 'SNOC Image',
          status: f3.snocImageConnected === 'yes' ? 1 : 0,
          images: getImages(f3.snocImage),
        },
        {
          form_type: 'Equipement Installation',
          item_name: 'Serial Number',
          status: f3.serialNumber ? 1 : 0,
          item_type: f3.serialNumber || '',
        },
        {
          form_type: 'Equipement Installation',
          item_name: 'MAC ID',
          status: f3.macId ? 1 : 0,
          item_type: f3.macId || '',
        },
        {
          form_type: 'Equipement Installation',
          item_name: 'QR Code Imag',
          item_type: f3.qrType || '',
          status: f3.qrCodeImage?.length ? 1 : 0,
          images: getImages(f3.qrCodeImage),
        },
        {
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
          form_type: 'Power Earth Verification',
          item_name: 'Solar panel installed and functional',
          status: f4.solarPanelInstalled ? 1 : 0,
          images: getImages(f4.solarPanelImage),
        },

        {
          form_type: 'Power Earth Verification',
          item_name: 'Battery backup installed, charged',
          status: f4.batteryBackup === 'yes' ? 1 : 0,
          images: getImages(f4.batteryBackupImage),
        },
        {
          form_type: 'Power Earth Verification',
          item_name: 'Proper earthing resistance verified',
          status: f4.earthingVerified === 'yes' ? 1 : 0,
          images: f4.earthingVideo ? uploads.videoUrls : [],
        },
        {
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
          form_type: 'Gsi Mapping',
          item_name:
            'Photos taken (5 angles: close-up + 4 directional) and geo-tagged',
          status: f5.photosGeoTagged === 'yes' ? 1 : 0,
          images: getImages(f5.photosAngleImages),
        },
        {
          form_type: 'Gsi Mapping',
          item_name: 'Video of GP installation uploaded to BharatNet GIS app',
          status: f5.videoUploaded === 'yes' ? 1 : 0,
          images: f5.videoUploaded === 'yes' ? uploads.videoUrls : [],
        },
        {
          form_type: 'Gsi Mapping',
          item_name: 'Digital As-Built Drawing (ABD)',
          status: f5.abdUpdated === 'yes' ? 1 : 0,
          images: f5.abdUpdated === 'yes' && f5.abdPDF ? uploads.docUrls : [],
        },
        {
          form_type: 'Gsi Mapping',
          item_name:
            'GIS entry  latitude, longitude, route code, and asset type',
          status: f5.gisEntryCompleted === 'yes' ? 1 : 0,
          images: getImages(f5.GISImgages),
        },
        {
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
          form_type: 'Safe Quality Verification',
          item_name: 'Site Clear Images',
          item_type: f6.siteClean || '',
          status: f6.siteClean === 'yes' ? 1 : f6.siteClean === 'no' ? 0 : 0,
          images: getImages(f6.materialImgages),
        },
        {
          form_type: 'Safe Quality Verification',
          item_name: 'TEC Approval Proof,',
          status: f6.materialsApproved ? 1 : 0,
          images:
            f6.materialsApproved && f6.verificationProof ? uploads.docUrls : [],
        },
        {
          form_type: 'Safe Quality Verification',
          item_name: 'Social Audit Video',
          status:
            f6.socialAudit === 'yes' ? 1 : f6.socialAudit === 'no' ? 0 : 0,
          images:
            f6.socialAudit === 'yes' && f6.socialAuditVideo
              ? uploads.videoUrls
              : [],
        },
        {
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
          form_type: 'Final Acceptance',
          item_name: 'PAT Completed Proof',
          status:
            f7.patCompleted === 'yes' ? 1 : f7.patCompleted === 'no' ? 0 : 0,
          images: (f7.patCompleted === 'yes' && getImages(f7.patProof)) || [],
        },
        {
          form_type: 'Final Acceptance',
          item_name: 'FAT Approval Proof',
          status:
            f7.fatApproved === 'yes' ? 1 : f7.fatApproved === 'no' ? 0 : 0,
          images:
            (f7.fatApproved === 'yes' && getImages(f7.fatApprovalProof)) || [],
        },
        {
          form_type: 'Final Acceptance',
          item_name: 'QR Tag Verification Image',
          status:
            f7.qrTagVerified === 'yes' ? 1 : f7.qrTagVerified === 'no' ? 0 : 0,
          images:
            (f7.qrTagVerified === 'yes' && getImages(f7.qrTagImage)) || [],
        },

        {
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpMainId, setGpMainId] = useState<number | null>(null);

  const updateFormData = (formNumber: number, data: any) => {
    setFormData((prev) => ({
      ...prev,
      [`form${formNumber}`]: data,
    }));
  };

  const handleSubmit = async () => {
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

      const pdfFiles = f1.otdrReport ? [f1.otdrReport] : [];
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

      const payload = {
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

      console.log('Submitting payload:', payload);

      const response = await axios.post(
        `${TraceBASEURL}/submit-gp-checklist`,
        payload,
      );
      const newGpMainId =
        response.data?.gp_main_id || response.data?.data?.gp_main_id;
      if (newGpMainId) {
        setGpMainId(newGpMainId);
      }
      if (currentForm > 1 && newGpMainId) {
        const {
          images: formImages,
          docs: formDocs,
          videos: formVideos,
        } = getFormFiles(currentForm, formData);
        const imageFiles = formImages.map((img) =>
          img.watermarkedPreview
            ? convertBase64ToFile(
                img.watermarkedPreview,
                `form${currentForm}_${img.id}.jpg`,
              )
            : img.file,
        );

        const docFiles = formDocs;
        const videoFiles = formVideos;

        const uploadedImageUrls = imageFiles.length
          ? await uploadImages(imageFiles)
          : [];

        const uploadedDocUrls = docFiles.length
          ? await uploadDocs(docFiles)
          : [];

        const uploadedVideoUrls = videoFiles.length
          ? await uploadVideos(videoFiles)
          : [];

        for (let i = 0; i < formImages.length; i++) {
          const img = formImages[i];
          const url = uploadedImageUrls[i];

          if (url && img.latitude && img.longitude) {
            await geotagImage(url, img.latitude, img.longitude);
          }
        }

        const currentFormItems = buildFormItems(currentForm, formData, {
          imageUrls: uploadedImageUrls,
          docUrls: uploadedDocUrls,
          videoUrls: uploadedVideoUrls,
        });
        if (currentFormItems.length > 0) {
          await submitFormItems(newGpMainId, currentFormItems);
        }
      }
      const newCompleted = new Set(completedForms);
      newCompleted.add(currentForm);
      setCompletedForms(newCompleted);

      if (currentForm < 7) {
        setCurrentForm(currentForm + 1);
        alert(`Form ${currentForm} submitted successfully!`);
      } else {
        alert('All forms completed! Project submitted successfully.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    switch (currentForm) {
      case 1:
        return (
          <Form1
            data={formData.form1}
            onChange={(data) => updateFormData(1, data)}
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

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
