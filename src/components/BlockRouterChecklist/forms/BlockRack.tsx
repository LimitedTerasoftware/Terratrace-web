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
} from 'lucide-react';
import Tricad from '../../../images/logo/Tricad.png';
import { RouterData } from '../../../types/block-router-checklist';

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

interface BlockRackFormProps {
  blockId: string;
  existingData?: RouterData | null;
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

const BlockRackForm = ({ blockId, existingData }: BlockRackFormProps) => {
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
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');

  useEffect(() => {
    if (existingData?.tests) {
      const updatedItems = blockRackTests.map((tc) => {
        const testData = existingData.tests?.[tc.id];
        if (testData) {
          const urls = parseImageUrls(testData.Image);
          const existingImages: UploadedFile[] = [];
          const existingDocs: UploadedFile[] = [];

          urls.forEach((url, idx) => {
            if (isImageUrl(url)) {
              existingImages.push({
                id: `existing-img-${idx}`,
                preview: getFullImageUrl(url),
                url: url,
                isDocument: false,
              });
            } else {
              existingDocs.push({
                id: `existing-doc-${idx}`,
                preview: getFullImageUrl(url),
                url: url,
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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const completedItems = items.filter((item) => item.compliance !== '');

      if (completedItems.length === 0) {
        alert('Please complete at least one test case before submitting');
        setSubmitting(false);
        return;
      }

      const rackData: Record<
        string,
        { compliance: string; remarks: string; Image: string }
      > = {};

      for (const item of completedItems) {
        const uploadedUrls: string[] = [];

        const newImages = item.images.filter((img) => img.file);
        const existingImageUrls = item.images
          .filter((img) => img.url)
          .map((img) => stripBaseUrl(img.url as string));

        const newDocs = item.documents.filter((doc) => doc.file);
        const existingDocUrls = item.documents
          .filter((doc) => doc.url)
          .map((doc) => stripBaseUrl(doc.url as string));

        if (newImages.length > 0) {
          const files = newImages.map((img) => img.file as File);
          const uploadedImgUrls = await uploadImages(files);
          uploadedUrls.push(...uploadedImgUrls);
        }

        if (newDocs.length > 0) {
          const files = newDocs.map((doc) => doc.file as File);
          const uploadedDocs = await uploadDocs(files);
          uploadedUrls.push(...uploadedDocs);
        }

        const allUrls = [
          ...existingImageUrls,
          ...existingDocUrls,
          ...uploadedUrls,
        ];

        rackData[item.id] = {
          compliance: item.compliance,
          remarks: item.remarks,
          Image: allUrls.length > 0 ? `[${allUrls.join(',')}]` : '[]',
        };
      }

      const payload = {
        block_id: parseInt(blockId),
        ...rackData,
      };

      const response = await fetch(`${TraceBASEURL}/upload-block-rack-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to submit Block Rack data');

      const result = await response.json();
      console.log('Block Rack Submit Result:', result);
      alert('Block Rack Checklist submitted successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error submitting Block Rack:', error);
      alert('Failed to submit Block Rack checklist. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const partAItems = items.filter((item) => item.part === 'A');
  const partBItems = items.filter((item) => item.part === 'B');
  const currentItems = activeTab === 'A' ? partAItems : partBItems;

  const completedCount = items.filter((item) => item.compliance !== '').length;
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
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'A'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-white text-gray-600 hover:bg-blue-50 border-2 border-gray-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          Part A: Infrastructure
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
            {partACompleted}/{partAItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('B')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'B'
              ? 'bg-green-600 text-white shadow-lg shadow-green-200'
              : 'bg-white text-gray-600 hover:bg-green-50 border-2 border-gray-200'
          }`}
        >
          <Server className="w-4 h-4" />
          Part B: Functional
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
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
                    <p className="text-sm text-gray-700 ">
                      {item.procedure}
                    </p>
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

      {/* Submit Button */}
      <div className="mt-6 sticky bottom-4">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: submitting
              ? '#90a4ae'
              : 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
            color: '#fff',
          }}
          onMouseEnter={(e) => {
            if (!submitting)
              e.currentTarget.style.background =
                'linear-gradient(135deg, #0a3880 0%, #0d47a1 100%)';
          }}
          onMouseLeave={(e) => {
            if (!submitting)
              e.currentTarget.style.background =
                'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)';
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              Submitting...
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
      </div>
    </div>
  );
};

export default BlockRackForm;
