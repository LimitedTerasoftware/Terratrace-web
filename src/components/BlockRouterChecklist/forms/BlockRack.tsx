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
  Server,
  Shield,
  Printer,
  ArrowLeft,
} from 'lucide-react';
import Tricad from '../../../images/logo/Tricad.png';
import TricadIcon from '../../../images/logo/favicon.png';
import { RackData, RouterData } from '../../../types/block-router-checklist';
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

interface BlockRackItem {
  id: string;
  slNo: string;
  part: 'A' | 'B';
  description: string;
  procedure: string;
  compliance: string;
  remarks: string;
  images: UploadedFile[];
  documents: UploadedFile[];
  iconBg: string;
  iconColor: string;
}
interface RackTestItem {
  Image: string;
  remarks: string;
  compliance: string;
}

interface BlockRackFormProps {
  blockId: string;
  existingData?: RackData | null;
  blockName: string;
  onBack: () => void;
}

const blockRackTests: Omit<
  BlockRackItem,
  'compliance' | 'remarks' | 'images' | 'documents'
>[] = [
  // Part A: Infrastructure Tests
  {
    id: 'A1',
    slNo: '1',
    part: 'A',
    description: 'Location Alignment and Rigidity (LAR)',
    procedure: 'As per approved Layout plan - Layout plan to be submitted.',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'A2',
    slNo: '2',
    part: 'A',
    description: 'LI-Bty, HUPS',
    procedure: 'ATC to be submitted.',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 'A3',
    slNo: '3',
    part: 'A',
    description: 'Check of Firefighting Equipment',
    procedure:
      'Physical verification for availability of fire fighting equipment (As provided fire-fighting equipment should be available) - Physical verification for availability of fire fighting equipment should be adequate',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    id: 'A4',
    slNo: '4',
    part: 'A',
    description: 'Illumination and Power outlets',
    procedure: 'Should be adequate',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    id: 'A5',
    slNo: '5',
    part: 'A',
    description: 'Check of Earthing system',
    procedure:
      'As per Inspection & QA (T&D) Circle E.I. No 1-001. 1. If earth exists then earth measurement is to be done (<0.5 ohm). If not feasible, a certificate from planning along with last reading (within six months) to be taken (BSNL scope). 2. Connectivity of Eqpt to earth is to be ensured.',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'A6',
    slNo: '6',
    part: 'A',
    description: 'QA / FTR certification of all equipment',
    procedure: 'TSEC Certificate and IC/RR to be submitted.',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'A7',
    slNo: '7',
    part: 'A',
    description: 'Check of Documentation',
    procedure:
      'User manual, System Administration manual, product specification, Installation and O&M Manual & Safety measures to be observed in handling the equipment.',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  {
    id: 'A8',
    slNo: '8',
    part: 'A',
    description: 'Voltage drop test',
    procedure: 'Should be less than 1 volt (in case of DC supply)',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    id: 'A9',
    slNo: '9',
    part: 'A',
    description: 'Cabling, Labelling & Sign Writing',
    procedure:
      'Physical check: 1. Each terminal block and individual tags shall be numbered suitably with clear identification code. 2. All controls, switches, indicators etc. shall be clearly marked. 3. Suitable visual indications shall be provided to indicate healthy and unhealthy conditions.',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    id: 'A10',
    slNo: '10',
    part: 'A',
    description: 'Check of power supply',
    procedure:
      'Check that equipment at GP shall be AC operated while at the Block, all equipment shall be DC operated',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
  // Part B: Functional/Operational Tests
  {
    id: 'B1',
    slNo: '1',
    part: 'B',
    description:
      'Physical Check: Dimensioning, Surface finishing, Power supply, Smart meter provision',
    procedure:
      '(1) As per BoM / TSEC (addl. 20% space as per BoM). (2) Physical Inspection. (3) Power switch shall be inside the RACK. (4) In case of requirement of smart meter provision. Galvanized sheet steel 1.5mm / 2 mm thick of 120 GSM /Front single door with 4-point locking system Rain canopy of 75mm height with projection all around, with 300 mm base plinth of 3mm thick.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'B2',
    slNo: '2',
    part: 'B',
    description: 'Check earthing for the Rack',
    procedure:
      'All enclosure panels are single walled boltable from inside with Earthing to be done on all flat parts',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    id: 'B3',
    slNo: '3',
    part: 'B',
    description: 'Check for Cooling/ Fan (N+1)',
    procedure:
      '3 fans will operate when inside temperature is above 25°C, 2 more fans will start operating automatically when inside temperature exceeds 35°C. Standby fan operates automatically when inside temperature exceeds 60°C OR any of the fans fails. Self-starting axial fans (AC/DC) in 5+1 with monitored fan tray & one time temp. setting at factory.',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    id: 'B4',
    slNo: '4',
    part: 'B',
    description:
      'Access Control and Monitoring System (with IP/SNMP/Web browser based control)',
    procedure:
      'To be tested on 5% Racks in a lot offered. Electromagnetic spring loaded metal lock with 9 digit electronic keypad reader for front door. Password can be remotely reset by Super User at NOC. Notification sent to NOC after 3 failed attempts. Hidden tamper proof IR enabled camera captures snapshots every time door is opened, continues every 5 min for 1 hour then every 15 min until door closed. Snapshots stored for at least 15 days at NOC.',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    id: 'B5',
    slNo: '5',
    part: 'B',
    description:
      'Check of SNMP traps (IP/SNMP/Web Browser based control and monitoring)',
    procedure:
      'To be tested on 5% Racks in a lot offered. (i) SNMP traps for: temperature, humidity, water logging, fan fail, water leakage from top, fire detection, door open/unauthorized access monitoring. (ii) Control/switch on/off Non-Critical Loads/Extra fans. (iii) SNMP Traps for Battery monitoring Percentages of the UPS-battery. All messages should be seen from SNOC.',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    id: 'B6',
    slNo: '6',
    part: 'B',
    description:
      'Check for Grouting bolts & RCC Plinth (only for outside building premises)',
    procedure:
      '(i) Physical verification. (ii) Install the rack on a RCC plinth of minimum 2 feet height to be casted with 2 pipes - one for power and the other for OFC (only for external installation)',
    iconBg: 'bg-lime-100',
    iconColor: 'text-lime-600',
  },
];

// Maps component test IDs to API field names
const TEST_ID_TO_API_KEY: Record<string, string> = {
  A1: 'infrastructure_T1',
  A2: 'infrastructure_T2',
  A3: 'infrastructure_T3',
  A4: 'infrastructure_T4',
  A5: 'infrastructure_T5',
  A6: 'infrastructure_T6',
  A7: 'infrastructure_T7',
  A8: 'infrastructure_T8',
  A9: 'infrastructure_T9',
  A10: 'infrastructure_T10',
  B1: 'functional_T1',
  B2: 'functional_T2',
  B3: 'functional_T3',
  B4: 'functional_T4',
  B5: 'functional_T5',
  B6: 'functional_T6',
};

// Reverse map for loading existing data
const API_KEY_TO_TEST_ID: Record<string, string> = Object.fromEntries(
  Object.entries(TEST_ID_TO_API_KEY).map(([k, v]) => [v, k]),
);

const BlockRackForm = ({
  blockId,
  existingData,
  blockName,
  onBack,
}: BlockRackFormProps) => {
  const [items, setItems] = useState<BlockRackItem[]>(
    blockRackTests.map((tc) => ({
      ...tc,
      compliance: '',
      remarks: '',
      images: [],
      documents: [],
    })),
  );
  const [expandedId, setExpandedId] = useState<string | null>('A1');
  const [submitting, setSubmitting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');

  useEffect(() => {
    if (!existingData) return;

    const updatedItems = blockRackTests.map((tc) => {
      const apiKey = TEST_ID_TO_API_KEY[tc.id]; // e.g. 'infrastructure_T1'
      const testData = existingData[
        apiKey as keyof RackData
      ] as RackTestItem | null;

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

      return { ...tc, compliance: '', remarks: '', images: [], documents: [] };
    });

    setItems(updatedItems);
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

  const submitData = async (): Promise<boolean> => {
    const completedItems = items.filter((item) => item.compliance !== '');
    if (completedItems.length === 0) {
      alert('Please complete at least one test case before submitting');
      return false;
    }
    try {
      const payload: Record<string, unknown> = { block_id: parseInt(blockId) };
      for (const item of completedItems) {
        const apiKey = TEST_ID_TO_API_KEY[item.id];
        const existingImageUrls = item.images
          .filter((img) => img.url)
          .map((img) => stripBaseUrl(img.url!));
        const existingDocUrls = item.documents
          .filter((doc) => doc.url)
          .map((doc) => stripBaseUrl(doc.url!));
        const newImages = item.images.filter((img) => img.file);
        const newDocs = item.documents.filter((doc) => doc.file);
        const uploadedImgUrls =
          newImages.length > 0
            ? await uploadImages(newImages.map((img) => img.file!))
            : [];
        const uploadedDocUrls =
          newDocs.length > 0
            ? await uploadDocs(newDocs.map((doc) => doc.file!))
            : [];
        const allUrls = [
          ...existingImageUrls,
          ...existingDocUrls,
          ...uploadedImgUrls,
          ...uploadedDocUrls,
        ];
        payload[apiKey] = {
          compliance: item.compliance === 'Yes' ? 'Y' : 'N',
          remarks: item.remarks,
          Image: allUrls.length > 0 ? `[${allUrls.join(',')}]` : '[]',
        };
      }
      const response = await fetch(`${TraceBASEURL}/upload-smartrack-data`, {
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
        alert('Block Rack Checklist submitted successfully!');
        window.location.reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Print helpers ─────────────────────────────────────────────────────────

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
      .write(`<!DOCTYPE html><html><head><title>Block Rack Report</title>
      <style>body{display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#64748b;font-size:15pt;}</style>
      </head><body>⏳ Preparing report, please wait…</body></html>`);
    printWindow.document.close();

    let iconBase64 = '';
    try {
      iconBase64 = await toBase64(TricadIcon as unknown as string);
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
              `${item.id}-image-${index + 1}`;
            attachmentPages.push(`
              <div class="attachment-page image-attachment-page">
                <div class="attachment-label">${item.id} - ${label}</div>
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
                    <div class="attachment-label">${item.id} - ${meta.label} - Page ${index + 1}</div>
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
              <span class="test-badge">${item.id}</span>
              <span class="test-description">${item.description}</span>
              <span class="compliance-badge ${complianceBadgeClass}">${item.compliance || 'Pending'}</span>
            </div>
            <div class="test-card-body">
              <div class="procedure-box"><strong>Procedure: </strong>${item.procedure}</div>
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

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Block Rack Compliance Report</title>
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
    .procedure-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:9pt; color:#0c4a6e; }
    .procedure-box strong { color:#075985; }
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

    .test-card-header, .procedure-box, .remarks-box, .images-section, .compact-doc-card {
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
  <div class="report-header">
    ${iconBase64 ? `<img src="${iconBase64}" alt="Logo" />` : '<div></div>'}
    <div class="report-header-title">
      <h1>Block Rack Inspection - ${blockName}</h1>
      <p>Infrastructure & Functional Testing Checklist Report</p>
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
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">Prepared By</div></div>
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">Reviewed By</div></div>
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">Approved By</div></div>
    </div>
  </div>

  <div class="report-footer">
    <span>Block Rack Compliance Checklist — Block Name: ${blockName}</span>
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
        alert('Block Rack Checklist submitted successfully!');
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

  const partAItems = items.filter((item) => item.part === 'A');
  const partBItems = items.filter((item) => item.part === 'B');
  const currentItems = activeTab === 'A' ? partAItems : partBItems;

  const completedCount = items.filter((item) => item.compliance !== '').length;
  const yesCount = items.filter((item) => item.compliance === 'Yes').length;
  const noCount = items.filter((item) => item.compliance === 'No').length;
  const pendingCount = items.length - completedCount;
  const progress = Math.round((completedCount / items.length) * 100);

  const partACompleted = partAItems.filter((i) => i.compliance !== '').length;
  const partBCompleted = partBItems.filter((i) => i.compliance !== '').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-2 md:p-4">
      {/* Header */}
      <div
        className="rounded-2xl p-4 md:p-6 mb-4 text-white shadow-lg"
        style={{
          background:
            'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
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
                Block Rack Inspection
              </h2>
              <p className="text-blue-100 text-sm">
                Infrastructure & Functional Testing Checklist
              </p>
            </div>
          </div>
          <div className="bg-white/20 p-2 rounded-xl">
            <Server className="w-6 h-6" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Progress</span>
            <span>
              {completedCount} / {items.length} Tests ({progress}%)
            </span>
          </div>
          <div className="h-3 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Part Progress */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-white/10 rounded-lg p-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Part A: Infrastructure</span>
              <span>
                {partACompleted}/{partAItems.length}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-400 transition-all duration-500 rounded-full"
                style={{
                  width: `${(partACompleted / partAItems.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Part B: Functional</span>
              <span>
                {partBCompleted}/{partBItems.length}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-400 transition-all duration-500 rounded-full"
                style={{
                  width: `${(partBCompleted / partBItems.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('A')}
          className={`flex-1 py-2 md:py-3 px-2 md:px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base ${
            activeTab === 'A'
              ? 'bg-green-600 text-white shadow-lg shadow-green-200'
              : 'bg-white text-gray-600 hover:bg-green-50 border-2 border-gray-200'
          }`}
        >
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span className="hidden xs:inline">Part A:</span>
          <span className="truncate">Infrastructure</span>
          <span className="text-xs px-1 md:px-2 py-0.5 rounded-full bg-white/20 flex-shrink-0">
            {partACompleted}/{partAItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('B')}
          className={`flex-1 py-2 md:py-3 px-2 md:px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base ${
            activeTab === 'B'
              ? 'bg-green-600 text-white shadow-lg shadow-green-200'
              : 'bg-white text-gray-600 hover:bg-green-50 border-2 border-gray-200'
          }`}
        >
          <Server className="w-4 h-4 flex-shrink-0" />
          <span className="hidden xs:inline">Part B:</span>
          <span className="truncate">Functional</span>
          <span className="text-xs px-1 md:px-2 py-0.5 rounded-full bg-white/20 flex-shrink-0">
            {partBCompleted}/{partBItems.length}
          </span>
        </button>
      </div>

      {/* Test Cases */}
      <div className="space-y-3">
        {currentItems.map((item) => {
          const isExpanded = expandedId === item.id;
          const isCompleted = item.compliance !== '';

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${
                isCompleted ? 'ring-2 ring-green-400' : ''
              }`}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`${item.iconBg} p-2 md:p-3 rounded-xl ${item.iconColor}`}
                >
                  <span className="text-lg font-bold">{item.slNo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm md:text-base font-medium text-gray-800 line-clamp-2">
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
                      {item.part === 'A' ? 'Infrastructure' : 'Functional'}
                    </span>
                  </div>
                </div>
                <div
                  className={`p-2 rounded-full ${
                    isCompleted
                      ? 'bg-green-100 text-green-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                  {/* Procedure */}
                  <div className={`p-3 rounded-lg ${item.iconBg}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Test Procedure / Reference
                    </p>
                    <p className="text-sm text-gray-700 ">{item.procedure}</p>
                  </div>

                  {/* Compliance */}
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

                  {/* Remarks */}
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

                  {/* File Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Images Upload */}
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
                          id={`images-${item.id}`}
                        />
                        <label
                          htmlFor={`images-${item.id}`}
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

                    {/* Documents Upload */}
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
                          id={`docs-${item.id}`}
                        />
                        <label
                          htmlFor={`docs-${item.id}`}
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

      {/* Action Buttons */}
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
              Submit Block Rack Checklist
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
                  Block Rack Inspection - {blockName}
                </h1>
                <p className="text-gray-500 text-sm">
                  Infrastructure & Functional Testing Checklist
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
                      {item.id}
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
                    <div className="bg-sky-50 border border-sky-100 rounded-lg px-4 py-2.5 text-sm text-sky-900">
                      <span className="font-semibold">Procedure: </span>
                      {item.procedure}
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
                {['Prepared By', 'Reviewed By', 'Approved By'].map((label) => (
                  <div key={label} className="text-center">
                    <div className="h-12 border-b border-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400">
              <span>
                Block Rack Compliance Checklist — Block Name: {blockName}
              </span>
              <span>Confidential — Internal Use Only</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockRackForm;
