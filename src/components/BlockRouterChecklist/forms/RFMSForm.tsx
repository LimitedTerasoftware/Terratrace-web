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
  Download,
} from 'lucide-react';
import Tricad from '../../../images/logo/Tricad.png';

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
  if (url.startsWith(ImgbaseUrl)) {
    return url.replace(ImgbaseUrl, '');
  }
  if (url.startsWith(BASEURL)) {
    return url.replace(BASEURL, '');
  }
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

interface RFMSItem {
  id: string;
  testCaseNo: string;
  description: string;
  procedure: string;
  compliance: string;
  remarks: string;
  images: UploadedFile[];
  documents: UploadedFile[];
  iconBg: string;
  iconColor: string;
}

interface RFMSFormProps {
  blockId: string;
  existingData?: {
    status: boolean;
    block_id?: number;
    completion_percentage?: string;
    filled_tests?: number;
    total_tests?: number;
    tests?: Record<
      string,
      { Image: string; remarks: string; compliance: string } | null
    >;
    message?: string;
  } | null;
}

const rfmsTestCases = [
  {
    id: 'T1',
    testCaseNo: 'T1',
    description:
      'The Remote test unit (RTU) should have 48 ports within 2U with 10W power consumption. Connectors to be LC or SC type. Connectors should be in the front panel of RTU preferably. RTU should have Dual DC power input capability/provisioning. Each Nodes, about 50% ports shall be having live or active fiber monitoring facility at 24 Ports (out of 48 Ports) and 24 Ports for dark fiber monitoring. All types of telecom traffic to be considered in case of Live Fiber monitoring.',
    procedure: 'Physical Check',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'T2',
    testCaseNo: 'T2',
    description:
      'The OTDR module is required of 1650 nm (used for dark and live monitoring both) and dynamic range should be 40 dB or higher. Pulse width selectable between 6ns and 20μs and better. Event dead zone: = <1 Meter. Attenuation dead zone: 4 Meters; Optical distance accuracy: ±(0.75 + 0.0025%  x  distance  +  sampling resolution).',
    procedure:
      'Physical Check as well as on EMS/SNOC. 1650nm demo as per data sheet.',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 'T3',
    testCaseNo: 'T3',
    description:
      'The system should have high availability feature with automatic switchover  from  active  server  to backup server in case of failure.',
    procedure: 'To be tested during eMS testing',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'T4',
    testCaseNo: 'T4',
    description:
      'It should be possible that the fiber is still being monitored after a fault is detected. Users are automatically notified if the fault severity or the fault location changes. The user must be notified in case of second fiber cable cut or degradation happens along the cable route before the first cut or degradation is repaired when second cut or degradation is at a shorter distance than the first cut distance. All the changes of event above configured thresholds should be available in alarm history.',
    procedure: 'Demonstration to be done',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    id: 'T5',
    testCaseNo: 'T5',
    description:
      'The RFMS will be able to provide alarm, alert notification, and automatic generation of customized reports to provide timely and valuable information  on  the  fiber  network health,   availability,   and   provide historical trends of these performance indicators. This capability would be extended to Operation In-charge of each RTU location via web browser (Google\tchrome\etc.)\ton mobile/tablet/laptop or any device which supports web browser (Google chrome etc.). The RFTS system must have a mobile application operating on android and iOS for remote P2P tests.',
    procedure: 'To be demonstrated at eMS/SNOC',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    id: 'T6',
    testCaseNo: 'T6',
    description:
      'For each monitored fiber, it should be possible to obtain fiber performance versus time. This graph should show the evolution of the fiber optic budget. The graph can be displayed for the last hour, day, week, month or year. By viewing the evolution of the fiber budget, user should immediately know whether this alarm is caused by a long term or short term effect.',
    procedure: 'To be demonstrated at eMS/SNOC',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'T7',
    testCaseNo: 'T7',
    description:
      'The system shall have a provision to tag .KMZ/.KML files to be associated to the relevant routes/ports to derive the co-ordinates of the fault or Google map link which can open in google map app which can be installed on PC/Tablet/Mobile phone.',
    procedure: 'To be demonstrated at eMS/SNOC',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  {
    id: 'T8',
    testCaseNo: 'T8',
    description:
      'Simulate a fibre cut by removing patch cord and/or cutting patch cord on active fibre and dark fibre separately.',
    procedure:
      'Check location and distance of the fault as detected by RFMS. How does is compare with the actual distance.',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    id: 'T9',
    testCaseNo: 'T9',
    description:
      'Simulate fibre deterioration scenario using variable optical attenuator.',
    procedure:
      'Check location and distance of the fault as detected by RFMS. How does is compare with the actual Distance',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
];

const RFMSForm = ({ blockId, existingData }: RFMSFormProps) => {
  const [items, setItems] = useState<RFMSItem[]>(
    rfmsTestCases.map((tc) => ({
      ...tc,
      compliance: '',
      remarks: '',
      images: [],
      documents: [],
    })),
  );
  const [expandedId, setExpandedId] = useState<string | null>('T1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingData?.tests) {
      const updatedItems = rfmsTestCases.map((tc) => {
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

      const data = await response.json();
      return data.data?.images || [];
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

      const rfmsData: Record<
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

        rfmsData[item.id] = {
          compliance: item.compliance,
          remarks: item.remarks,
          Image: allUrls.length > 0 ? `[${allUrls.join(',')}]` : '[]',
        };
      }

      const payload = {
        block_id: parseInt(blockId),
        ...rfmsData,
      };

      const response = await fetch(`${TraceBASEURL}/upload-rfms-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit RFMS data');
      }

      const result = await response.json();
      console.log('RFMS Submit Result:', result);
      alert('RFMS Checklist submitted successfully!');
      window.location.reload();
    } catch (error) {
      console.error('Error submitting RFMS:', error);
      alert('Failed to submit RFMS checklist. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = items.filter((item) => item.compliance !== '').length;
  const progress = Math.round((completedCount / items.length) * 100);

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
                RFMS Related Tests
              </h2>
              <p className="text-blue-100 text-sm">
                Remote Fiber Monitoring System Compliance
              </p>
            </div>
          </div>
          <div className="bg-white/20 p-2 rounded-xl">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Progress Bar */}
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

      {/* Test Cases */}
      <div className="space-y-3">
        {items.map((item) => {
          const tcInfo = rfmsTestCases.find((t) => t.id === item.id);
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
                  className={`${tcInfo?.iconBg || 'bg-blue-100'} p-2 md:p-3 rounded-xl ${tcInfo?.iconColor || 'text-blue-600'}`}
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
                      {tcInfo?.procedure}
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

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                  {/* Procedure */}
                  <div
                    className={`p-3 rounded-lg ${tcInfo?.iconBg || 'bg-blue-50'}`}
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Test Procedure
                    </p>
                    <p className="text-sm text-gray-700">{item.procedure}</p>
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
                            {' '}
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
                            {' '}
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
              Submit RFMS Checklist
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

export default RFMSForm;
