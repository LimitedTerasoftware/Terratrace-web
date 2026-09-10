import { useState, useEffect } from 'react';
import {
  Upload,
  CheckCircle,
  X,
  Camera,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
  Image,
  ClipboardCheck,
  Loader2,
  Printer,
  ArrowLeft,
} from 'lucide-react';
import Tricad from '../../../images/logo/Tricad.png';
import TricadIcon from '../../../images/logo/favicon.png';
import BharatNetLogo from '../../../images/logo/bharatnet-logo.jpg';
import BsnlLogo from '../../../images/logo/bsnl-logo.jpg';
import { RouterData } from '../../../types/block-router-checklist';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const ImgbaseUrl = import.meta.env.VITE_Image_URL;

const parseImageUrls = (imageString: string): string[] => {
  if (!imageString || imageString === '[]') return [];
  const cleaned = imageString.replace(/^\[|\]$/g, '');
  if (!cleaned) return [];
  return cleaned.split(',').map((url) => url.trim());
};

const getFullImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${ImgbaseUrl}${url}`;
};

const stripBaseUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith(ImgbaseUrl)) return url.replace(ImgbaseUrl, '');
  if (url.startsWith(BASEURL)) return url.replace(BASEURL, '');
  return url;
};

const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some((ext) => lowerUrl.includes(ext));
};

interface UploadedFile {
  id: string;
  file?: File;
  preview: string;
  url?: string;
  isDocument?: boolean;
}

interface ATRackCheckItem {
  id: string;
  testCaseNo: string;
  clause: string;
  description: string;
  parameters: string;
  procedure: string;
  expectedResult: string;
  iconBg: string;
  iconColor: string;
}

interface ATRackFormItem extends ATRackCheckItem {
  compliance: string;
  remarks: string;
  images: UploadedFile[];
  documents: UploadedFile[];
}

interface ATBlockRackFormProps {
  blockId: string;
  existingData?: RouterData | null;
  blockName: string;
  onBack: () => void;
}

const DOC_CODE = 'ABP/AT/BLRK/002 Ver1.0';

type CertificationKey =
  | 'tsecCertificate'
  | 'qaCertificate'
  | 'qrCodeLogo'
  | 'photoEvidence'
  | 'oemApproval';

const CERTIFICATION_FIELDS: { key: CertificationKey; label: string }[] = [
  { key: 'tsecCertificate', label: 'TSEC Certificate' },
  { key: 'qaCertificate', label: 'QA Certificate' },
  { key: 'qrCodeLogo', label: 'QR Code / Logo' },
  { key: 'photoEvidence', label: 'Photo Evidence' },
  { key: 'oemApproval', label: 'OEM Approval by BSNL' },
];

const isImageFile = (file?: File, url?: string): boolean => {
  if (file) return file.type.startsWith('image/');
  if (url) {
    const lower = url.toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].some((ext) =>
      lower.includes(ext),
    );
  }
  return false;
};

// Test cases per BSNL Bharatnet Tender No. MM/BNO&M/BN-III/T-791/2024
// "Acceptance Testing Test Cases document for Block Rack" - Section 3 (Test Cases for Block Rack)
const COLORS = [
  { iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  { iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  { iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  { iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  { iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
  { iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
];

const atRackTestsRaw: Omit<
  ATRackCheckItem,
  'iconBg' | 'iconColor'
>[] = [
  {
    id: 'T1',
    testCaseNo: 'T-1',
    clause: 'Sec-IV-C, Anx-B (VI.1)',
    description:
      'Outdoor/Indoor enclosure for DC Power Plant/AC UPS and Other Network Equipment',
    parameters:
      'Check both network and power supply including battery, with partitions for power, battery bank and network devices, are placed in a single enclosure.',
    procedure: 'To be checked physically as per approved Rack Layout Plan.',
    expectedResult: 'All the equipment is arranged as per layout plan.',
  },
  {
    id: 'T2',
    testCaseNo: 'T-2',
    clause: 'Sec-IV-C, Anx-B (VI.2)',
    description: 'Technical Requirement',
    parameters:
      'All enclosure panels are single walled boltable from inside with earthing to be done on all flat parts. Earthing strip & wires should be properly fixed with all the equipment.',
    procedure:
      'Physical verification of earthing strip and wire connections for all equipment.',
    expectedResult: 'Earthing is connected for all the equipment.',
  },
  {
    id: 'T3',
    testCaseNo: 'T-3',
    clause: 'Sec-IV-C, Anx-B (VI.3)',
    description: 'Enclosure Frame Material',
    parameters:
      'Zinc magnesium coating with 25mm system punching in the roof and base frame plus vertical sections with two mounting levels, rolled out of a single sheet.',
    procedure:
      'To be checked physically and OEM QA Certificate to be taken for material.',
    expectedResult: 'Cross checked with OEM QA certificate.',
  },
  {
    id: 'T4',
    testCaseNo: 'T-4',
    clause: 'Sec-IV-C, Anx-B (VI.4)',
    description: 'Enclosure Flat Parts Material',
    parameters: 'Galvanized sheet steel 1.5mm/2mm thick of 120 GSM.',
    procedure: 'OEM QA Certificate to be taken.',
    expectedResult: 'Cross checked with OEM QA certificate.',
  },
  {
    id: 'T5',
    testCaseNo: 'T-5',
    clause: 'Sec-IV-C, Anx-B (VI.4)',
    description: 'Enclosure Flat Parts Material',
    parameters:
      'Front single door with 4-point locking system and rear panel boltable from inside in single walled construction with door stay. Side panels left and right in single walled construction boltable from inside.',
    procedure: 'To be checked physically.',
    expectedResult: 'Locking system and door arrangement checked.',
  },
  {
    id: 'T6',
    testCaseNo: 'T-6',
    clause: 'Sec-IV-C, Anx-B (VI.4)',
    description: 'Enclosure Flat Parts Material',
    parameters:
      'Rain canopy of 75mm height with projection all around, with 300mm base plinth of 3mm thick.',
    procedure: 'OEM QA Certificate to be taken.',
    expectedResult: 'Cross checked with OEM QA certificate.',
  },
  {
    id: 'T7',
    testCaseNo: 'T-7',
    clause: 'Sec-IV-C, Anx-B (VI.4)',
    description: 'Enclosure Flat Parts Material',
    parameters:
      'The enclosure flat parts to be gasketed with outdoor polyurethane foam gasket; the fasteners will be of SS304 grade suitable for outdoor application.',
    procedure: 'OEM QA Certificate to be taken.',
    expectedResult: 'Physically checked & OEM QA certificate collected.',
  },
  {
    id: 'T8',
    testCaseNo: 'T-8',
    clause: 'Sec-IV-C, Anx-B (VI.5)',
    description: 'Dimension',
    parameters: 'Provision for minimum 20% additional space for future expansion.',
    procedure: 'To be checked physically.',
    expectedResult: 'Physically checked.',
  },
  {
    id: 'T9',
    testCaseNo: 'T-9',
    clause: 'Sec-IV-B, SCC, 3.9(i)',
    description: 'Mini OLT Space provisioning',
    parameters:
      '1U space to be available in rack for future OLT provisioning and power to the OLT to be tapped from the Power System being procured at the GP location.',
    procedure: 'Space and power provisioning to be checked physically.',
    expectedResult: 'Physically checked.',
  },
  {
    id: 'T10',
    testCaseNo: 'T-10',
    clause: 'Sec-IV-C, Anx-B (VI.6)',
    description: 'Cooling',
    parameters:
      'The housing should be equipped with DC/AC operated cooling axial fans, self-starting, double ball-bearing, temperature-controlled operation via controller.',
    procedure:
      'To be checked physically and required OEM QA certificate for fan & controller functionality.',
    expectedResult: 'Physically checked & OEM QA certificate collected.',
  },
  {
    id: 'T11',
    testCaseNo: 'T-11',
    clause: 'Sec-IV-C, Anx-B (VI.6)',
    description: 'Cooling',
    parameters: 'Noise level maximum 65dB.',
    procedure: 'To be checked with Sound Level Meter.',
    expectedResult: 'Noise is in the limit.',
  },
  {
    id: 'T12',
    testCaseNo: 'T-12',
    clause: 'Sec-IV-C, Anx-B (VI.6)',
    description: 'Cooling',
    parameters:
      'The cooling fans should be on a fan tray for ease of access and easy fault identification and diagnosis.',
    procedure:
      'Accessibility to be checked physically and parameters to be checked at SNOC.',
    expectedResult: 'Checked physically and through SNOC.',
  },
  {
    id: 'T13',
    testCaseNo: 'T-13',
    clause: 'Sec-IV-C, Anx-B (VI.6)',
    description: 'Cooling',
    parameters: 'N+1 configuration fans.',
    procedure: 'To be checked physically.',
    expectedResult: 'Redundant fan available.',
  },
  {
    id: 'T14',
    testCaseNo: 'T-14',
    clause: 'Sec-IV-C, Anx-B (VI.6)',
    description: 'Cooling',
    parameters: 'The enclosure should have provision to mount outlet filters.',
    procedure: 'To be checked physically.',
    expectedResult: 'Physically checked.',
  },
  {
    id: 'T15',
    testCaseNo: 'T-15',
    clause: 'Sec-IV-C, Anx-B (VI.6)',
    description: 'Cooling',
    parameters:
      'Material: ABS/PU, for ventilation by convection; size and capacity as per heat load requirement.',
    procedure: 'OEM QA Certificate to be taken.',
    expectedResult: 'Cross checked with OEM QA certificate.',
  },
  {
    id: 'T16',
    testCaseNo: 'T-16',
    clause: 'Sec-IV-C, Anx-B (VI.8)',
    description: 'Surface Finishing',
    parameters:
      'Powder coated with UV resistant pure polyester RAL7035 Matt super durable with painting thickness of 80 to 120 microns minimum.',
    procedure: 'OEM QA Certificate to be taken.',
    expectedResult: 'Cross checked with OEM QA certificate.',
  },
  {
    id: 'T17',
    testCaseNo: 'T-17',
    clause: 'Sec-IV-C, Anx-B (VI.9)',
    description: 'Access Control and Monitoring System',
    parameters:
      'Electromagnetic spring loaded metal lock with 9-digit electronic keypad reader for front door with IP/SNMP/Web browser based control and monitoring to SNOC along with temperature, humidity, water logging, fan fail, water leakage from top, fire detection, door open/unauthorized access monitoring to manage the SLA. Enclosure, fan and filter locking and monitoring system should be from the same OEM.',
    procedure:
      'Availability of lock to be checked physically and parameters to be checked at SNOC.',
    expectedResult: 'Checked physically and through SNOC.',
  },
  {
    id: 'T18',
    testCaseNo: 'T-18',
    clause: 'Sec-IV-C, Anx-B (VI.9)',
    description: 'Access Control and Monitoring System',
    parameters:
      'Monitoring of major parameters including input & output voltages, inside & outside temperature, humidity, alarms, % battery backup time left.',
    procedure: 'To be checked at SNOC.',
    expectedResult: 'Checked at SNOC.',
  },
  {
    id: 'T19',
    testCaseNo: 'T-19',
    clause: 'Sec-IV-C, Anx-B (VI.9)',
    description: 'Access Control and Monitoring System',
    parameters:
      'Control/switch on/off non-critical loads/extra fans. The monitor & control should be possible from SNOC.',
    procedure: 'To be checked at SNOC.',
    expectedResult: 'Checked at SNOC.',
  },
  {
    id: 'T20',
    testCaseNo: 'T-20',
    clause: 'Sec-IV-C, Anx-B (VI.9)',
    description: 'Access Control and Monitoring System',
    parameters:
      'Last 24 hrs (at least) alarm & access events must be stored with date & time stamp.',
    procedure: 'SNOC report to be provided by PIA.',
    expectedResult: 'SNOC report collected.',
  },
  {
    id: 'T21',
    testCaseNo: 'T-21',
    clause: 'Sec-IV-C, Anx-B (VI.10)',
    description: 'Temperature based fan operation',
    parameters:
      'The fans will be in 5+1 configuration and 3 fans will operate when inside temperature is above 25°C, 2 more fans will start operating automatically when inside temperature exceeds 35°C.',
    procedure: 'Functionality to be checked with external blower.',
    expectedResult: 'Physically checked.',
  },
  {
    id: 'T22',
    testCaseNo: 'T-22',
    clause: 'Sec-IV-C, Anx-B (VI.10)',
    description: 'Temperature based fan operation',
    parameters:
      'Standby fan operates automatically when inside temperature exceeds 60°C OR any of the fans fails.',
    procedure: 'Functionality to be checked with external blower.',
    expectedResult: 'Physically checked.',
  },
  {
    id: 'T23',
    testCaseNo: 'T-23',
    clause: 'Sec-IV-C, Anx-B (VI.11)',
    description: 'Hidden camera',
    parameters: 'A hidden tamper proof camera available and found in good condition.',
    procedure: 'To be checked physically.',
    expectedResult: 'Hidden camera available.',
  },
  {
    id: 'T24',
    testCaseNo: 'T-24',
    clause: 'Sec-IV-C, Anx-B (VI.11)',
    description: 'Hidden camera',
    parameters:
      'Camera will capture a snapshot every time the door is opened and continues to take snapshots every 5 minutes for one hour and thereafter every 15 minutes until the door is closed, and sends the snapshot to SNOC, where it is stored for at least 15 days backup.',
    procedure: 'Functionality to be checked at SNOC.',
    expectedResult: 'Functionality checked.',
  },
  {
    id: 'T25',
    testCaseNo: 'T-25',
    clause: 'Sec-IV-C, Anx-B (VI.12)',
    description: 'Access control system rights and protection',
    parameters:
      'The password for access control system can be remotely reset by a Super User at SNOC. In case of unauthorized access of cabinet or wrong password entered, a notification will be sent to the SNOC, and after three failed attempts the password will be disabled.',
    procedure: 'Functionality to be checked at SNOC.',
    expectedResult: 'Functionality checked.',
  },
  {
    id: 'T26',
    testCaseNo: 'T-26',
    clause: 'Sec-IV-C, Anx-B (VI.13)',
    description: 'eMS for Rack Operations',
    parameters:
      'The status of all the racks and all the alarms shall be available in the SNOC to be supplied.',
    procedure: 'Functionality to be checked at SNOC.',
    expectedResult: 'Functionality checked.',
  },
  {
    id: 'T27',
    testCaseNo: 'T-27',
    clause: 'Sec-IV-C, Anx-B (VI.14)',
    description: 'Power Supply',
    parameters: 'Power supply to the Rack shall be without external ON/OFF switch.',
    procedure: 'Physically checked to disconnect the external power supply.',
    expectedResult:
      'Rack supply automatically shifted to backup supply without any time delay and equipment shutdown.',
  },
];

const atRackTests: ATRackCheckItem[] = atRackTestsRaw.map((tc, index) => ({
  ...tc,
  ...COLORS[index % COLORS.length],
}));

const ATBlockRackForm = ({
  blockId,
  existingData,
  blockName,
  onBack,
}: ATBlockRackFormProps) => {
  const [items, setItems] = useState<ATRackFormItem[]>(
    atRackTests.map((tc) => ({
      ...tc,
      compliance: '',
      remarks: '',
      images: [],
      documents: [],
    })),
  );
  const [expandedId, setExpandedId] = useState<string | null>('T1');
  const [submitting, setSubmitting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [memorandum, setMemorandum] = useState({
    equipmentDescription: '',
    siteNameBlockCode: '',
    siteAddress: '',
    dateTime: '',
  });
  const [certificationFiles, setCertificationFiles] = useState<
    Record<CertificationKey, UploadedFile | null>
  >({
    tsecCertificate: null,
    qaCertificate: null,
    qrCodeLogo: null,
    photoEvidence: null,
    oemApproval: null,
  });

  useEffect(() => {
    if (existingData?.memorandum) {
      setMemorandum((prev) => ({
        equipmentDescription:
          existingData.memorandum?.equipmentDescription ?? prev.equipmentDescription,
        siteNameBlockCode:
          existingData.memorandum?.siteNameBlockCode ?? prev.siteNameBlockCode,
        siteAddress: existingData.memorandum?.siteAddress ?? prev.siteAddress,
        dateTime: existingData.memorandum?.dateTime ?? prev.dateTime,
      }));
    }
    if (existingData?.certificationFiles) {
      const files = existingData.certificationFiles;
      setCertificationFiles((prev) => {
        const next = { ...prev };
        (Object.keys(files) as CertificationKey[]).forEach((key) => {
          const url = files[key];
          if (url) {
            next[key] = {
              id: `existing-${key}`,
              preview: getFullImageUrl(url),
              url,
              isDocument: !isImageFile(undefined, url),
            };
          }
        });
        return next;
      });
    }
    if (existingData?.tests) {
      const updatedItems = atRackTests.map((tc) => {
        const testData = existingData.tests?.[tc.id];
        if (testData) {
          const urls = parseImageUrls(testData.Image);
          const existingImages: UploadedFile[] = [];
          const existingDocs: UploadedFile[] = [];

          urls.forEach((url, idx) => {
            if (isImageUrl(url)) {
              existingImages.push({
                id: `existing-img-${tc.id}-${idx}`,
                preview: getFullImageUrl(url),
                url,
                isDocument: false,
              });
            } else {
              existingDocs.push({
                id: `existing-doc-${tc.id}-${idx}`,
                preview: getFullImageUrl(url),
                url,
                isDocument: true,
              });
            }
          });

          return {
            ...tc,
            compliance:
              testData.compliance === 'Yes' || testData.compliance === 'Y'
                ? 'Yes'
                : testData.compliance === 'No' || testData.compliance === 'N'
                  ? 'No'
                  : '',
            remarks: testData.remarks || '',
            images: existingImages,
            documents: existingDocs,
          };
        }
        return {
          ...tc,
          compliance: '',
          remarks: '',
          images: [],
          documents: [],
        };
      });
      setItems(updatedItems);
    }
  }, [existingData]);

  const handleComplianceChange = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, compliance: value } : item,
      ),
    );
  };

  const handleRemarksChange = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, remarks: value } : item)),
    );
  };

  const handleFileUpload = (
    id: string,
    type: 'images' | 'documents',
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      isDocument: type === 'documents',
    }));

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [type]: [...item[type], ...newFiles] }
          : item,
      ),
    );
  };

  const removeFile = (
    itemId: string,
    type: 'images' | 'documents',
    fileId: string,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const fileToRemove = item[type].find((f) => f.id === fileId);
          if (fileToRemove?.file) {
            URL.revokeObjectURL(fileToRemove.preview);
          }
          return { ...item, [type]: item[type].filter((f) => f.id !== fileId) };
        }
        return item;
      }),
    );
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images[]', file));

    try {
      const response = await fetch(`${BASEURL}/upload-image`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return data.data?.images || [];
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const uploadDocs = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('docs[]', file));

    try {
      const response = await fetch(`${BASEURL}/upload-image`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return data.data?.docs || [];
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const singleFileFromInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): UploadedFile | null => {
    const file = event.target.files?.[0];
    if (!file) return null;
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      isDocument: !file.type.startsWith('image/'),
    };
  };

  const handleCertificationUpload = (
    key: CertificationKey,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const uploaded = singleFileFromInput(event);
    if (uploaded) {
      setCertificationFiles((prev) => ({ ...prev, [key]: uploaded }));
    }
  };
  const removeCertificationFile = (key: CertificationKey) => {
    setCertificationFiles((prev) => {
      const current = prev[key];
      if (current?.file) URL.revokeObjectURL(current.preview);
      return { ...prev, [key]: null };
    });
  };

  const uploadSingleFile = async (
    slot: UploadedFile | null,
  ): Promise<string | undefined> => {
    if (!slot) return undefined;
    if (slot.url) return stripBaseUrl(slot.url);
    if (slot.file) {
      const urls = isImageFile(slot.file)
        ? await uploadImages([slot.file])
        : await uploadDocs([slot.file]);
      return urls[0];
    }
    return undefined;
  };

  const submitData = async (): Promise<boolean> => {
    const completedItems = items.filter((item) => item.compliance !== '');
    if (completedItems.length === 0) {
      alert('Please complete at least one test case before submitting');
      return false;
    }
    try {
      const atRackData: Record<
        string,
        { compliance: string; remarks: string; Image: string }
      > = {};
      for (const item of completedItems) {
        const existingImageUrls = item.images
          .filter((img) => img.url)
          .map((img) => stripBaseUrl(img.url as string));
        const existingDocUrls = item.documents
          .filter((doc) => doc.url)
          .map((doc) => stripBaseUrl(doc.url as string));
        const newImages = item.images.filter((img) => img.file);
        const newDocs = item.documents.filter((doc) => doc.file);
        const uploadedImgUrls =
          newImages.length > 0
            ? await uploadImages(newImages.map((img) => img.file as File))
            : [];
        const uploadedDocUrls =
          newDocs.length > 0
            ? await uploadDocs(newDocs.map((doc) => doc.file as File))
            : [];
        const allUrls = [
          ...existingImageUrls,
          ...existingDocUrls,
          ...uploadedImgUrls,
          ...uploadedDocUrls,
        ];
        atRackData[item.id] = {
          compliance: item.compliance,
          remarks: item.remarks,
          Image: allUrls.length > 0 ? `[${allUrls.join(',')}]` : '[]',
        };
      }
      const certificationFilesPayload: Record<string, string | undefined> = {};
      for (const { key } of CERTIFICATION_FIELDS) {
        certificationFilesPayload[key] = await uploadSingleFile(
          certificationFiles[key],
        );
      }

      const payload = {
        block_id: parseInt(blockId),
        memorandum,
        certificationFiles: certificationFilesPayload,
        ...atRackData,
      };
      const response = await fetch(`${TraceBASEURL}/upload-at-smartrack-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to submit');
      return true;
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit. Please try again.');
      return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const success = await submitData();
      if (success) {
        alert('AT Block Rack Checklist submitted successfully!');
        window.location.reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Print helpers ─────────────────────────────────────────────────────────

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const toBase64 = async (source: File | string): Promise<string> => {
    try {
      if (source instanceof File) {
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(source);
        });
      }
      const response = await fetch(source, {
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
      });
      if (!response.ok) throw new Error(`Failed to fetch: ${source}`);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error('Base64 conversion failed:', source, err);
      return typeof source === 'string' ? source : '';
    }
  };

  const renderPdfToImages = async (
    source: File | string,
  ): Promise<string[]> => {
    const arrayBuffer =
      source instanceof File
        ? await source.arrayBuffer()
        : await fetch(source, {
            mode: 'cors',
            credentials: 'omit',
            cache: 'no-cache',
          }).then((res) => {
            if (!res.ok) throw new Error(`Failed to fetch PDF: ${source}`);
            return res.arrayBuffer();
          });
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: string[] = [];
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      pages.push(canvas.toDataURL('image/png'));
    }
    return pages;
  };

  const getDocMeta = (
    doc: UploadedFile,
  ): {
    ext: string;
    label: string;
    color: string;
    bg: string;
    icon: string;
  } => {
    const name = doc.file?.name ?? doc.url?.split('/').pop() ?? '';
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf')
      return {
        ext: 'PDF',
        label: name,
        color: '#dc2626',
        bg: '#fef2f2',
        icon: '📄',
      };
    if (ext === 'doc' || ext === 'docx')
      return {
        ext: 'WORD',
        label: name,
        color: '#2563eb',
        bg: '#eff6ff',
        icon: '📝',
      };
    if (ext === 'xls' || ext === 'xlsx')
      return {
        ext: 'EXCEL',
        label: name,
        color: '#16a34a',
        bg: '#f0fdf4',
        icon: '📊',
      };
    return {
      ext: ext.toUpperCase() || 'FILE',
      label: name,
      color: '#7c3aed',
      bg: '#f5f3ff',
      icon: '📎',
    };
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const triggerPrint = async () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.');
      return;
    }

    printWindow.document
      .write(`<!DOCTYPE html><html><head><title>AT Block Rack Report</title>
      <style>body{display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#64748b;font-size:15pt;}</style>
      </head><body>⏳ Preparing report, please wait…</body></html>`);
    printWindow.document.close();

    let iconBase64 = '';
    try {
      iconBase64 = await toBase64(TricadIcon as unknown as string);
    } catch (_) {
      /* skip */
    }
    let bharatNetLogoBase64 = '';
    let bsnlLogoBase64 = '';
    try {
      bharatNetLogoBase64 = await toBase64(BharatNetLogo as unknown as string);
    } catch (_) {
      /* skip */
    }
    try {
      bsnlLogoBase64 = await toBase64(BsnlLogo as unknown as string);
    } catch (_) {
      /* skip */
    }

    const attachmentPages: string[] = [];

    const itemsHtml = await Promise.all(
      items.map(async (item) => {
        const imagesHtml = await Promise.all(
          item.images.map(async (img, index) => {
            let src = img.preview;
            try {
              src = img.file
                ? await toBase64(img.file)
                : await toBase64(img.preview);
            } catch (_) {}
            const label =
              img.file?.name ||
              img.url?.split('/').pop() ||
              `${item.testCaseNo}-image-${index + 1}`;
            attachmentPages.push(`
              <div class="attachment-page image-attachment-page">
                <div class="attachment-label">${item.testCaseNo} - ${label}</div>
                <img src="${src}" alt="${label}" />
              </div>
            `);
            return `<div class="image-thumb"><img src="${src}" alt="Attachment" crossorigin="anonymous"/></div>`;
          }),
        );

        const docsHtml = await Promise.all(
          item.documents.map(async (doc) => {
            const meta = getDocMeta(doc);
            const size = formatFileSize(doc.file?.size);
            if (meta.ext === 'PDF') {
              let pdfPages: string[] = [];
              try {
                const source = doc.file || doc.preview;
                if (source) pdfPages = await renderPdfToImages(source);
              } catch (err) {
                console.error('PDF render failed:', doc, err);
              }
              if (pdfPages.length > 0) {
                pdfPages.forEach((src, index) => {
                  attachmentPages.push(`
                  <div class="attachment-page pdf-attachment-page">
                    <div class="attachment-label">${item.testCaseNo} - ${meta.label} - Page ${index + 1}</div>
                    <img src="${src}" alt="${meta.label} page ${index + 1}" />
                  </div>
                `);
                });
              }
              return `
                <div class="doc-card compact-doc-card">
                  <div class="doc-card-meta">
                    <span class="doc-ext-badge" style="background:${meta.bg};color:${meta.color};">${meta.icon} ${meta.ext}</span>
                    <span class="doc-filename">${meta.label}</span>
                    ${size ? `<span class="doc-size">${size}</span>` : ''}
                  </div>
                  <div class="doc-card-info" style="border-left:3px solid ${meta.color};">
                    <p style="color:${meta.color};font-weight:600;margin-bottom:4px;">PDF Document</p>
                    <p style="color:#64748b;font-size:8pt;">Full PDF content is included in the attachment appendix.</p>
                  </div>
                </div>`;
            }
            return `
              <div class="doc-card">
                <div class="doc-card-meta">
                  <span class="doc-ext-badge" style="background:${meta.bg};color:${meta.color};">${meta.icon} ${meta.ext}</span>
                  <span class="doc-filename">${meta.label}</span>
                  ${size ? `<span class="doc-size">${size}</span>` : ''}
                </div>
                <div class="doc-card-info" style="border-left:3px solid ${meta.color};">
                  <p style="color:${meta.color};font-weight:600;margin-bottom:4px;">${meta.ext} Document</p>
                  <p style="color:#64748b;font-size:8pt;">This file type cannot be rendered inline. The document has been attached and submitted with this checklist.</p>
                  ${doc.url ? `<p style="font-size:7.5pt;color:#94a3b8;margin-top:4px;word-break:break-all;">📎 ${doc.preview}</p>` : ''}
                </div>
              </div>`;
          }),
        );

        const complianceBadgeClass =
          item.compliance === 'Yes'
            ? 'badge-yes'
            : item.compliance === 'No'
              ? 'badge-no'
              : 'badge-pending';

        return `
          <div class="test-card">
            <div class="test-card-header">
              <span class="test-badge">${item.testCaseNo}</span>
              <span class="test-description">${item.description}</span>
              <span class="compliance-badge ${complianceBadgeClass}">${item.compliance || 'Pending'}</span>
            </div>
            <div class="test-card-body">
              <div class="clause-box"><strong>RFP Clause: </strong>${item.clause}</div>
              <div class="params-box"><strong>Test Parameters: </strong>${item.parameters}</div>
              <div class="procedure-box"><strong>Test Procedure: </strong>${item.procedure}</div>
              <div class="result-box"><strong>Expected Result: </strong>${item.expectedResult}</div>
              ${item.remarks ? `<div class="remarks-box"><strong>Remarks: </strong>${item.remarks}</div>` : ''}
              ${
                imagesHtml.length > 0
                  ? `
              <div class="images-section">
                <div class="section-title blue-bar">Images (${imagesHtml.length})</div>
                <div class="images-grid">${imagesHtml.join('')}</div>
              </div>`
                  : ''
              }
              ${
                docsHtml.length > 0
                  ? `
              <div class="docs-section">
                <div class="section-title purple-bar">Documents (${docsHtml.length})</div>
                ${docsHtml.join('')}
              </div>`
                  : ''
              }
            </div>
          </div>`;
      }),
    );

    const completedCount = items.filter((i) => i.compliance !== '').length;
    const yesCount = items.filter((i) => i.compliance === 'Yes').length;
    const noCount = items.filter((i) => i.compliance === 'No').length;
    const pendingCount = items.length - completedCount;
    const progress = Math.round((completedCount / items.length) * 100);

    const tocHtml = `
      <li>1. Introduction</li>
      <li>2. Acceptance Memorandum</li>
      <li>3. Acceptance testing test cases
        <ul class="toc-sublist"><li>3.1 Test cases for BLOCK smart rack</li></ul>
      </li>
    `;

    const fileSlotHtml = async (
      slot: UploadedFile | null,
      label: string,
    ): Promise<string> => {
      if (!slot) return '&nbsp;';
      const name = slot.file?.name || slot.url?.split('/').pop() || label;
      if (isImageFile(slot.file, slot.url)) {
        let src = slot.preview;
        try {
          src = slot.file ? await toBase64(slot.file) : await toBase64(slot.preview);
        } catch (_) {}
        return `<img src="${src}" alt="${escapeHtml(label)}" class="memo-file-image" />`;
      }
      return `<div class="doc-chip">📎 ${escapeHtml(name)}</div>`;
    };

    const certFileHtml: Record<CertificationKey, string> = {
      tsecCertificate: '',
      qaCertificate: '',
      qrCodeLogo: '',
      photoEvidence: '',
      oemApproval: '',
    };
    for (const { key, label } of CERTIFICATION_FIELDS) {
      certFileHtml[key] = await fileSlotHtml(certificationFiles[key], label);
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AT Block Rack Compliance Report</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      color: #1a1a2e;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4; margin: 14mm 16mm 18mm 16mm; }

    .cover { text-align:center; padding: 30px 0 20px; page-break-after: always; break-after: page; }
    .cover img.cover-logo { height:60px; margin: 0 auto 14px; display:block; }
    .cover h1 { font-size:15pt; font-weight:700; margin: 10px 0 4px; color:#0d47a1; }
    .cover p { font-size:10.5pt; max-width:600px; margin:6px auto 0; line-height:1.5; color:#1e293b; }

    .toc-page { page-break-after: always; break-after: page; }
    .toc-title { font-size:13pt; font-weight:700; margin-bottom:14px; color:#0d47a1; border-bottom:2px solid #1565c0; padding-bottom:4px; }
    .toc-list { list-style:none; padding-left:0; font-size:9.5pt; line-height:1.9; color:#1e293b; }
    .toc-sublist { list-style:none; padding-left:22px; font-size:8.8pt; line-height:1.7; color:#475569; }

    h2.section-title {
      font-size:13pt; font-weight:700; margin:18px 0 10px; padding-bottom:4px;
      border-bottom:2px solid #1565c0; color:#0d47a1;
    }
    p.intro-text { font-size:9.5pt; line-height:1.55; margin-bottom:10px; color:#1e293b; }
    table.memo-table, table.cert-table {
      width:100%; border-collapse:collapse; margin-bottom:14px; font-size:9.2pt;
    }
    table.memo-table td, table.cert-table td {
      border:1px solid #94a3b8; padding:6px 8px; vertical-align:top;
    }
    table.memo-table td.label, table.cert-table td.label { width:32%; font-weight:600; background:#f1f5f9; }
    .memo-file-image {
      display:block; max-width:220px; max-height:160px; border:1px solid #e2e8f0; border-radius:4px;
    }
    .doc-chip { font-size:8pt; color:#4338ca; }
    .doc-header {
      display:flex; justify-content:flex-end; font-size:8.5pt; color:#374151;
      padding-bottom:6px; margin-bottom:14px; border-bottom:1px solid #cbd5e1;
    }
    .sig-table { width:100%; border-collapse:collapse; margin-top:8px; margin-bottom:16px; }
    .sig-table td { border:1px solid #94a3b8; padding:14px 10px; width:33.33%; vertical-align:top; font-size:9pt; }
    .sig-table .sig-title { font-weight:700; margin-bottom:26px; display:block; }

    .report-header {
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: 14px; border-bottom: 3px solid #1565c0; margin-bottom: 22px;
    }
    .report-header img { height: 48px; }
    .report-header-title { text-align: right; }
    .report-header-title h1 { font-size: 17pt; font-weight: 700; color: #0d47a1; }
    .report-header-title p { font-size: 9pt; color: #5f6b8c; margin-top: 2px; }

    .summary-bar { display: flex; gap: 10px; margin-bottom: 20px; }
    .summary-chip { flex: 1; padding: 10px 12px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
    .chip-value { font-size: 18pt; font-weight: 700; line-height: 1; }
    .chip-label { font-size: 8pt; color: #64748b; margin-top: 3px; }
    .chip-total   { background:#eff6ff; } .chip-total .chip-value   { color:#1d4ed8; }
    .chip-yes     { background:#f0fdf4; } .chip-yes .chip-value     { color:#15803d; }
    .chip-no      { background:#fef2f2; } .chip-no .chip-value      { color:#b91c1c; }
    .chip-pending { background:#fafafa; } .chip-pending .chip-value { color:#64748b; }

    .progress-wrap { margin-bottom: 24px; padding: 12px 16px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; }
    .progress-label { display:flex; justify-content:space-between; font-size:9pt; color:#475569; margin-bottom:6px; }
    .progress-track { height:10px; background:#e2e8f0; border-radius:99px; overflow:hidden; }
    .progress-fill  { height:100%; border-radius:99px; background:linear-gradient(90deg,#2563eb,#16a34a); }

    .test-card { border:1px solid #e2e8f0; border-radius:10px; margin-bottom:16px; overflow:hidden; break-inside:auto; page-break-inside:auto; }
    .test-card-header { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
    .test-badge { font-size:11pt; font-weight:700; color:#1d4ed8; background:#dbeafe; padding:4px 10px; border-radius:6px; white-space:nowrap; flex-shrink:0; }
    .test-description { flex:1; font-size:9.5pt; color:#1e293b; line-height:1.45; }
    .compliance-badge { padding:4px 12px; border-radius:99px; font-size:9pt; font-weight:600; white-space:nowrap; flex-shrink:0; }
    .badge-yes     { background:#dcfce7; color:#166534; border:1px solid #86efac; }
    .badge-no      { background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; }
    .badge-pending { background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1; }

    .test-card-body { padding: 12px 14px; }
    .clause-box    { background:#eef2ff; border:1px solid #c7d2fe; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:8.5pt; color:#3730a3; }
    .clause-box strong { color:#312e81; }
    .params-box    { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:9pt; color:#334155; }
    .params-box strong { color:#0f172a; }
    .procedure-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:9pt; color:#0c4a6e; }
    .procedure-box strong { color:#075985; }
    .result-box    { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:9pt; color:#14532d; }
    .result-box strong { color:#166534; }
    .remarks-box   { background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:9pt; color:#78350f; }

    .section-title { font-size:9pt; font-weight:600; color:#374151; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
    .section-title::before { content:''; display:inline-block; width:3px; height:12px; border-radius:2px; }
    .blue-bar::before   { background:#3b82f6; }
    .purple-bar::before { background:#8b5cf6; }

    .images-section { margin-top:10px; }
    .images-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    .image-thumb { border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; aspect-ratio:4/3; }
    .image-thumb img { width:100%; height:100%; object-fit:cover; display:block; }

    .docs-section { margin-top:12px; }
    .doc-card {
      border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;
      margin-bottom:10px; page-break-inside:avoid;
    }
    .doc-card-meta {
      display:flex; align-items:center; gap:10px; padding:8px 12px;
      background:#fafafa; border-bottom:1px solid #e2e8f0;
    }
    .doc-ext-badge {
      font-size:8pt; font-weight:700; padding:3px 8px;
      border-radius:4px; white-space:nowrap; flex-shrink:0;
    }
    .doc-filename { font-size:9pt; color:#1e293b; font-weight:500; flex:1; word-break:break-all; }
    .doc-size     { font-size:8pt; color:#94a3b8; white-space:nowrap; }
    .doc-card-info { padding:10px 14px; background:#fff; }

    .test-card-header, .clause-box, .params-box, .procedure-box, .result-box, .remarks-box, .images-section, .compact-doc-card {
      break-inside:avoid;
      page-break-inside:avoid;
    }

    .attachment-page {
      page-break-before: always;
      break-before: page;
      page-break-inside: avoid;
      break-inside: avoid;
      height: 245mm;
      border: 1px solid #e2e8f0;
      background: #fff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .attachment-label {
      flex: 0 0 auto;
      padding: 7px 10px;
      font-size: 8.5pt;
      font-weight: 700;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
      word-break: break-word;
    }
    .attachment-page img {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      background: #fff;
    }

    .signature-section { margin-top:28px; padding-top:18px; border-top:2px solid #e2e8f0; page-break-inside:avoid; }
    .signature-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; }
    .signature-block { text-align:center; }
    .signature-line { border-bottom:1px solid #94a3b8; margin-bottom:6px; height:40px; }
    .signature-label { font-size:8.5pt; color:#64748b; }

    .report-footer { margin-top:18px; padding-top:10px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:8pt; color:#94a3b8; }
  </style>
</head>
<body>
  <div class="doc-header">${DOC_CODE}</div>
  <div class="cover">
    ${bharatNetLogoBase64 ? `<img class="cover-logo" src="${bharatNetLogoBase64}" alt="BharatNet Logo" />` : ''}
    ${bsnlLogoBase64 ? `<img class="cover-logo" src="${bsnlLogoBase64}" alt="BSNL Logo" />` : ''}
    <h1>Bharat Sanchar Nigam Limited</h1>
    <p>Acceptance Testing Test Cases document for Block Rack — ${blockName}<br/>as per BSNL Bharatnet Tender No. MM/BNO&M/BN-III/T-791/2024 issued on 15.02.2024</p>
  </div>

  <div class="toc-page">
    <div class="toc-title">Table of Contents</div>
    <ul class="toc-list">${tocHtml}</ul>
  </div>

  <h2 class="section-title">1. Introduction</h2>
  <p class="intro-text">This document outlines the Acceptance Testing (A/T) procedures for Smart Rack at Block, in accordance with the requirements of BSNL BharatNet Tender No. MM/BNO&M/BN-III/T-791/2024 dated 15.02.2024. It covers the applicable test cases in line with industry best practices, relevant specifications and standards, and includes the acceptance testing template for quality assurance in accordance with the requirements specified in the RFP.</p>

  <h2 class="section-title">2. Acceptance Memorandum</h2>
  <table class="memo-table">
    <tr><td class="label">Equipment description</td><td>${memorandum.equipmentDescription ? escapeHtml(memorandum.equipmentDescription) : '&nbsp;'}</td></tr>
    <tr><td class="label">Site Name with Block code</td><td>${escapeHtml(memorandum.siteNameBlockCode || blockName)}</td></tr>
    <tr><td class="label">Site Address</td><td>${memorandum.siteAddress ? escapeHtml(memorandum.siteAddress) : '&nbsp;'}</td></tr>
    <tr><td class="label">Date &amp; Time</td><td>${escapeHtml(memorandum.dateTime) || new Date().toLocaleString()}</td></tr>
  </table>
  <p class="intro-text">We hereby declare that all tests in this form were successfully completed.</p>
  <table class="sig-table">
    <tr>
      <td><span class="sig-title">PIA Representative's Sign off</span>Representative Name:<br/><br/>Designation:<br/><br/>Date:<br/><br/>Signature: ____________________</td>
      <td><span class="sig-title">IE Representative's Sign off</span>Representative Name:<br/><br/>Designation:<br/><br/>Date:<br/><br/>Signature: ____________________</td>
      <td><span class="sig-title">BSNL Representative's Sign off*</span>Representative Name:<br/><br/>Designation:<br/><br/>Date:<br/><br/>Signature: ____________________</td>
    </tr>
  </table>
  <p class="intro-text" style="font-size:8pt;color:#64748b;">*Note: For first time AT of Block Router, GP Router, Block Rack, GP Rack, Route and Ring, one BSNL person may be kept mandatorily and his/her signatures are required on the AT document. For subsequent ATs, BSNL may assign person on need basis or as requested by any PIA. Decision regarding the same shall be taken by BharatNet State Head on case-to-case basis.</p>

  <h3 style="font-size:11pt;font-weight:700;margin:14px 0 8px;color:#1565c0;">Certification Verification</h3>
  <table class="cert-table">
    <tr><td class="label">Rack</td><td>DIN41491, DIN41494, and IEC297.</td></tr>
    <tr><td class="label">All products/OEM</td><td>ISO 9001, 14001, ISO 45001 and IS13252: PART1 (2010) &amp; IEC 60950-1.</td></tr>
    <tr><td class="label">Protection category</td><td>IP55: IS/IEC60529:2001. Certificate from NABL accredited lab shall be attached.</td></tr>
    <tr><td class="label">TSEC Certificate</td><td>${certFileHtml.tsecCertificate}</td></tr>
    <tr><td class="label">QA Certificate</td><td>${certFileHtml.qaCertificate}</td></tr>
    <tr><td class="label">QR Code, logo</td><td>${certFileHtml.qrCodeLogo}</td></tr>
    <tr><td class="label">Photo evidence</td><td>${certFileHtml.photoEvidence}</td></tr>
    <tr><td class="label">OEM approval by BSNL</td><td>${certFileHtml.oemApproval}</td></tr>
  </table>

  <h3 style="font-size:11pt;font-weight:700;margin:14px 0 8px;color:#1565c0;">Documentation Requirements</h3>
  <table class="cert-table">
    <tr>
      <td class="label">Documentation requirements</td>
      <td>
        <strong>Test 1:</strong> The contractor shall provide the following documents: system description documents; installation, operation and maintenance documents.<br/>
        <strong>Test 2:</strong> All technical documents shall be in English language both in CD-ROM and in hard copy. To be provided by PIA along with first Block AT offered for the package.
      </td>
    </tr>
  </table>

  <h2 class="section-title">3. Acceptance Testing Test Cases</h2>
  <div class="report-header">
    ${iconBase64 ? `<img src="${iconBase64}" alt="Logo" />` : '<div></div>'}
    <div class="report-header-title">
      <h1>AT Block Rack Tests - ${blockName}</h1>
      <p>Acceptance Test - BSNL BharatNet Block Rack Compliance Report</p>
      <p style="font-size:8pt;color:#94a3b8;margin-top:2px;">Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <div class="summary-bar">
    <div class="summary-chip chip-total"><div class="chip-value">${items.length}</div><div class="chip-label">Total Tests</div></div>
    <div class="summary-chip chip-yes"><div class="chip-value">${yesCount}</div><div class="chip-label">Compliant</div></div>
    <div class="summary-chip chip-no"><div class="chip-value">${noCount}</div><div class="chip-label">Non-Compliant</div></div>
    <div class="summary-chip chip-pending"><div class="chip-value">${pendingCount}</div><div class="chip-label">Pending</div></div>
  </div>

  <div class="progress-wrap">
    <div class="progress-label"><span>Completion Progress</span><span>${completedCount} / ${items.length} completed (${progress}%)</span></div>
    <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
  </div>

  ${itemsHtml.join('')}

  <div class="signature-section">
    <div class="signature-grid">
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">PIA Representative</div></div>
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">IE Representative</div></div>
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">BSNL Representative</div></div>
    </div>
  </div>

  <div class="report-footer">
    <span>AT Block Rack Compliance Checklist — Block Name: ${blockName}</span>
    <span>Confidential — Internal Use Only</span>
  </div>
  ${attachmentPages.length > 0 ? attachmentPages.join('') : ''}

</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 800);
    };
  };

  const handlePrint = async () => {
    setPreparing(true);
    try {
      await triggerPrint();
    } finally {
      setPreparing(false);
    }
  };

  const handleSubmitAndPrint = async () => {
    setSubmitting(true);
    try {
      const success = await submitData();
      if (success) {
        alert('AT Block Rack Checklist submitted successfully!');
        setPreparing(true);
        try {
          await triggerPrint();
        } finally {
          setPreparing(false);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderFileSlot = (
    label: string,
    slot: UploadedFile | null,
    inputId: string,
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onRemove: () => void,
  ) => (
    <div className="border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>
      {slot ? (
        <div className="flex items-center gap-3">
          {isImageFile(slot.file, slot.url) ? (
            <img
              src={slot.preview}
              alt={label}
              className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 flex items-center justify-center rounded-lg border border-gray-200 bg-purple-50 flex-shrink-0">
              <FileText className="w-6 h-6 text-purple-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-700 truncate">
              {slot.file?.name || slot.url?.split('/').pop() || 'Uploaded file'}
            </p>
            <button
              onClick={onRemove}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-1"
            >
              <Trash2 size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center hover:bg-gray-50 transition-colors">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={onUpload}
            className="hidden"
            id={inputId}
          />
          <label htmlFor={inputId} className="cursor-pointer">
            <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Tap to upload</p>
          </label>
        </div>
      )}
    </div>
  );

  const completedCount = items.filter((item) => item.compliance !== '').length;
  const yesCount = items.filter((item) => item.compliance === 'Yes').length;
  const noCount = items.filter((item) => item.compliance === 'No').length;
  const pendingCount = items.length - completedCount;
  const progress = Math.round((completedCount / items.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-2 md:p-4">
      <div
        className="rounded-2xl p-4 md:p-6 mb-4 text-white shadow-lg"
        style={{
          background:
            'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <img
              src={Tricad}
              alt="Logo"
              className="hidden md:block w-[140px] md:w-[180px]"
            />
            <div>
              <h2 className="text-xl md:text-2xl font-bold">
                AT Block Rack Tests
              </h2>
              <p className="text-blue-100 text-sm">
                Acceptance Test - BSNL BharatNet Block Rack Compliance
              </p>
            </div>
          </div>
          <div className="bg-white/20 p-2 rounded-xl">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Progress</span>
            <span>
              {completedCount} / {items.length} Tests Completed ({progress}%)
            </span>
          </div>
          <div className="h-3 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Acceptance Memorandum */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-5 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Acceptance Memorandum
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={memorandum.equipmentDescription}
            onChange={(e) =>
              setMemorandum((m) => ({ ...m, equipmentDescription: e.target.value }))
            }
            placeholder="Equipment description (e.g. Smart Block Rack model)"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            value={memorandum.siteNameBlockCode}
            onChange={(e) =>
              setMemorandum((m) => ({ ...m, siteNameBlockCode: e.target.value }))
            }
            placeholder="Site name with Block code"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            value={memorandum.siteAddress}
            onChange={(e) =>
              setMemorandum((m) => ({ ...m, siteAddress: e.target.value }))
            }
            placeholder="Site address"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none md:col-span-2"
          />
          <input
            value={memorandum.dateTime}
            onChange={(e) =>
              setMemorandum((m) => ({ ...m, dateTime: e.target.value }))
            }
            placeholder="Date & Time"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Certification Verification */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-5 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" /> Certification Verification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CERTIFICATION_FIELDS.map(({ key, label }) => (
            <div key={key}>
              {renderFileSlot(
                label,
                certificationFiles[key],
                `at-rack-cert-${key}`,
                (e) => handleCertificationUpload(key, e),
                () => removeCertificationFile(key),
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          const isCompleted = item.compliance !== '';

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${isCompleted ? 'ring-2 ring-green-400' : ''}`}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`${item.iconBg} p-2 md:p-3 rounded-xl ${item.iconColor}`}
                >
                  <span className="text-lg font-bold">{item.testCaseNo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-medium text-gray-800">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isCompleted
                          ? item.compliance === 'Yes'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isCompleted ? item.compliance : 'Pending'}
                    </span>
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      {item.clause}
                    </span>
                  </div>
                </div>
                <div
                  className={`p-2 rounded-full ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                >
                  {isExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                  <div className="p-3 rounded-lg bg-indigo-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      RFP Clause
                    </p>
                    <p className="text-sm text-gray-700">{item.clause}</p>
                  </div>

                  <div className={`p-3 rounded-lg ${item.iconBg}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Test Parameters
                    </p>
                    <p className="text-sm text-gray-700">{item.parameters}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-sky-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Test Procedure
                    </p>
                    <p className="text-sm text-gray-700">{item.procedure}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-green-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Expected Result
                    </p>
                    <p className="text-sm text-gray-700">
                      {item.expectedResult}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">
                      Compliance Status
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleComplianceChange(item.id, 'Yes')}
                        className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                          item.compliance === 'Yes'
                            ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        <CheckCircle
                          className={`w-5 h-5 mx-auto mb-1 ${item.compliance === 'Yes' ? '' : 'text-gray-400'}`}
                        />
                        Yes
                      </button>
                      <button
                        onClick={() => handleComplianceChange(item.id, 'No')}
                        className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                          item.compliance === 'No'
                            ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
                        }`}
                      >
                        <X
                          className={`w-5 h-5 mx-auto mb-1 ${item.compliance === 'No' ? '' : 'text-gray-400'}`}
                        />
                        No
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">
                      Remarks / Notes
                    </label>
                    <textarea
                      value={item.remarks}
                      onChange={(e) =>
                        handleRemarksChange(item.id, e.target.value)
                      }
                      placeholder="Add any additional notes or remarks..."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Upload Images
                      </label>
                      <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) =>
                            handleFileUpload(item.id, 'images', e)
                          }
                          className="hidden"
                          id={`at-rack-images-${item.id}`}
                        />
                        <label
                          htmlFor={`at-rack-images-${item.id}`}
                          className="cursor-pointer"
                        >
                          <Camera className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-sm text-blue-600 font-medium">
                            Tap to upload images
                          </p>
                          <p className="text-xs text-blue-400 mt-1">
                            JPG, PNG, GIF supported
                          </p>
                        </label>
                      </div>
                      {item.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {item.images.map((img) => (
                            <div key={img.id} className="relative group">
                              <img
                                src={img.preview}
                                alt="Preview"
                                className="w-full aspect-square object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                onClick={() =>
                                  removeFile(item.id, 'images', img.id)
                                }
                                className="absolute bottom-1 left-1 right-1 bg-red-500 text-white text-xs py-1 rounded-md flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 size={12} />
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Upload Documents
                      </label>
                      <div className="border-2 border-dashed border-purple-200 rounded-xl p-4 text-center bg-purple-50/50 hover:bg-purple-50 transition-colors">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          multiple
                          onChange={(e) =>
                            handleFileUpload(item.id, 'documents', e)
                          }
                          className="hidden"
                          id={`at-rack-docs-${item.id}`}
                        />
                        <label
                          htmlFor={`at-rack-docs-${item.id}`}
                          className="cursor-pointer"
                        >
                          <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                          <p className="text-sm text-purple-600 font-medium">
                            Tap to upload documents
                          </p>
                          <p className="text-xs text-purple-400 mt-1">
                            PDF, Word, Excel supported
                          </p>
                        </label>
                      </div>
                      {item.documents.length > 0 && (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {item.documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between bg-purple-50 px-3 py-2 rounded-lg border border-purple-100"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText
                                  size={16}
                                  className="text-purple-500 flex-shrink-0"
                                />
                                {doc.url ? (
                                  <a
                                    href={doc.preview}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-purple-700 hover:text-purple-900 truncate underline"
                                  >
                                    {doc.url.split('/').pop()}
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-700 truncate">
                                    {doc.file?.name}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  removeFile(item.id, 'documents', doc.id)
                                }
                                className="text-red-500 hover:text-red-700 flex-shrink-0 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-6 sticky bottom-4">
        <button
          onClick={handleSubmitAndPrint}
          disabled={submitting}
          className="flex-1 py-3.5 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: submitting
              ? '#90a4ae'
              : 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
            color: '#fff',
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={24} className="animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <CheckCircle size={24} />
              Submit AT Block Rack Checklist
              <span
                className="ml-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {completedCount}/{items.length}
              </span>
            </>
          )}
        </button>

        <button
          onClick={handlePrint}
          disabled={preparing}
          className="px-6 py-3.5 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-base bg-white border-2 border-blue-200 text-blue-700 hover:bg-blue-50 shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {preparing ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Preparing…
            </>
          ) : (
            <>
              <Printer size={18} /> Print
            </>
          )}
        </button>
      </div>

      {/* ── Print Preview Modal ── */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="sticky top-0 bg-white border-b z-10 p-4 flex items-center justify-between shadow-md">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5" /> Print Preview
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                disabled={preparing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {preparing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                {preparing ? 'Preparing…' : 'Print'}
              </button>
              <button
                onClick={() => setShowPrintPreview(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>
          </div>

          <div className="p-6 md:p-10 max-w-5xl mx-auto">
            <div className="flex items-center justify-between pb-6 mb-8 border-b-4 border-blue-700">
              <img src={TricadIcon} alt="Logo" className="h-14" />
              <div className="text-right">
                <h1 className="text-2xl font-bold text-blue-900">
                  AT Block Rack Tests - {blockName}
                </h1>
                <p className="text-gray-500 text-sm">
                  Acceptance Test - BSNL BharatNet Block Rack Compliance
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: 'Total',
                  value: items.length,
                  bg: 'bg-blue-50',
                  color: 'text-blue-700',
                },
                {
                  label: 'Compliant',
                  value: yesCount,
                  bg: 'bg-green-50',
                  color: 'text-green-700',
                },
                {
                  label: 'Non-Compliant',
                  value: noCount,
                  bg: 'bg-red-50',
                  color: 'text-red-700',
                },
                {
                  label: 'Pending',
                  value: pendingCount,
                  bg: 'bg-gray-50',
                  color: 'text-gray-500',
                },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className={`${chip.bg} rounded-xl p-4 text-center border border-gray-100`}
                >
                  <div className={`text-3xl font-bold ${chip.color}`}>
                    {chip.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{chip.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-8 border">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="font-medium">Completion Progress</span>
                <span>
                  {completedCount}/{items.length} ({progress}%)
                </span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                >
                  <div className="flex items-start gap-3 p-4 bg-gray-50 border-b">
                    <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1.5 rounded-lg text-base whitespace-nowrap">
                      {item.testCaseNo}
                    </span>
                    <p className="text-sm text-gray-700 flex-1 leading-relaxed">
                      {item.description}
                    </p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                        item.compliance === 'Yes'
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : item.compliance === 'No'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {item.compliance || 'Pending'}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2.5 text-sm text-indigo-900">
                      <span className="font-semibold">RFP Clause: </span>
                      {item.clause}
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-sm text-slate-800">
                      <span className="font-semibold">Test Parameters: </span>
                      {item.parameters}
                    </div>
                    <div className="bg-sky-50 border border-sky-100 rounded-lg px-4 py-2.5 text-sm text-sky-900">
                      <span className="font-semibold">Test Procedure: </span>
                      {item.procedure}
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-2.5 text-sm text-green-900">
                      <span className="font-semibold">Expected Result: </span>
                      {item.expectedResult}
                    </div>
                    {item.remarks && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-sm text-amber-900">
                        <span className="font-semibold">Remarks: </span>
                        {item.remarks}
                      </div>
                    )}

                    {item.images.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="inline-block w-1 h-3 bg-blue-500 rounded" />
                          Images ({item.images.length})
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {item.images.map((img) => (
                            <div
                              key={img.id}
                              className="rounded-lg overflow-hidden border aspect-video"
                            >
                              <img
                                src={img.preview}
                                alt="Attachment"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.documents.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span className="inline-block w-1 h-3 bg-purple-500 rounded" />
                          Documents ({item.documents.length})
                        </p>
                        <div className="space-y-2">
                          {item.documents.map((doc) => {
                            const meta = getDocMeta(doc);
                            const size = formatFileSize(doc.file?.size);
                            return (
                              <div
                                key={doc.id}
                                className="border rounded-xl overflow-hidden"
                                style={{ borderColor: meta.color + '40' }}
                              >
                                <div
                                  className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border-b"
                                  style={{ borderColor: meta.color + '30' }}
                                >
                                  <span
                                    className="text-xs font-bold px-2 py-0.5 rounded"
                                    style={{
                                      background: meta.bg,
                                      color: meta.color,
                                    }}
                                  >
                                    {meta.icon} {meta.ext}
                                  </span>
                                  <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                                    {meta.label}
                                  </span>
                                  {size && (
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                      {size}
                                    </span>
                                  )}
                                  {doc.preview && (
                                    <a
                                      href={doc.preview}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-medium underline flex-shrink-0"
                                      style={{ color: meta.color }}
                                    >
                                      Open ↗
                                    </a>
                                  )}
                                </div>
                                <div
                                  className="px-3 py-2.5"
                                  style={{
                                    borderLeft: `3px solid ${meta.color}`,
                                  }}
                                >
                                  {meta.ext === 'PDF' ? (
                                    <p className="text-xs text-gray-500">
                                      PDF document — will be embedded inline in
                                      the printed report.
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-500">
                                      {meta.ext} file — shown as attachment card
                                      in printed report.
                                    </p>
                                  )}
                                  {doc.url && (
                                    <p className="text-xs text-gray-400 mt-1 truncate">
                                      📎 {doc.preview}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-6 border-t-2 border-gray-200">
              <div className="grid grid-cols-3 gap-8">
                {['PIA Representative', 'IE Representative', 'BSNL Representative'].map(
                  (label) => (
                    <div key={label} className="text-center">
                      <div className="h-12 border-b border-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">{label}</span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
              <span>
                AT Block Rack Compliance Checklist — Block Name: {blockName}
              </span>
              <span>Confidential — Internal Use Only</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ATBlockRackForm;
