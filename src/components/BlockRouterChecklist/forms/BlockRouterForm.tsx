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
  Video,
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



const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some((ext) => lowerUrl.includes(ext));
};

const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext));
};

interface UploadedFile {
  id: string;
  file?: File;
  preview: string;
  url?: string;
  isDocument?: boolean;
}

interface UploadedVideo {
  id: string;
  file?: File;
  preview: string;
  url?: string;
}

interface RouterCheckItem {
  id: string;
  testCaseNo: string;
  description: string;
  procedure: string;
  hasFileUpload: boolean;
  iconBg: string;
  iconColor: string;
}

interface RouterFormItem extends RouterCheckItem {
  compliance: string;
  remarks: string;
  images: UploadedFile[];
  documents: UploadedFile[];
  videos: UploadedVideo[];
}

interface ExistingRouterData {
  status: boolean;
  block_id?: number;
  completion_percentage?: string;
  filled_tests?: number;
  total_tests?: number;
  tests?: Record<
    string,
    {
      Image: string;
      remarks: string;
      compliance: string;
    } | null
  >;
  message?: string;
}

interface BlockRouterFormProps {
  blockId: string;
  existingData?: ExistingRouterData | null;
}

const routerTestCases: RouterCheckItem[] = [
  {
    id: 'T1',
    testCaseNo: '4(a)',
    description:
      'Router serial number and its TSEC and QA certificate: Check whether TSEC is available for this model number of Router. Check whether QA certificate is available for the Router serial number.',
    procedure:
      'Verify TSEC and QA certificate availability for the router model and serial number',
    hasFileUpload: true,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'T2',
    testCaseNo: '4(b)',
    description:
      'Check whether the following condition is qualified: "If the items mentioned herein are not dispatched within 15 days from the date of Dispatch Advice, they shall be re-offered for inspection to BSNL-QA."',
    procedure: 'Verify dispatch timeline compliance with BSNL-QA requirements',
    hasFileUpload: true,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 'T3',
    testCaseNo: '4(c)',
    description:
      'Check whether the Router has the latest OS (TSEC Version or higher). If not, then first get the OS upgraded to the latest version (TSEC Version or higher). OEM Undertaking for higher version complying to all RFP requirements need to be submitted. The latest version would be displayed on SNOC.',
    procedure:
      'Check router OS version against TSEC version displayed on SNOC. Verify OEM undertaking if version upgrade was performed.',
    hasFileUpload: true,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'T4',
    testCaseNo: '4(d)',
    description:
      'All installed and configured ports of the Router should be up and active. Check through Command Line Interface (CLI).',
    procedure:
      'Access router CLI and verify all ports status using: show interface status, show ip interface brief',
    hasFileUpload: true,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    id: 'T5',
    testCaseNo: '4(e)',
    description:
      'Videos and photos of the Router installation as per RFP should be available. Check PIA PM tool.',
    procedure:
      'Verify installation media in PIA PM tool. Check for video and photo evidence of router installation.',
    hasFileUpload: true,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  {
    id: 'T6',
    testCaseNo: '4(f)',
    description:
      'Whether the product qualifies the "Trusted products" as mandated by DoT vide File no- 20-271/2010 AS-I (Vol-III) dated 10.3.2021, along with its amendments, issued from time to time. The certificate can be provided once for one model number.',
    procedure:
      'Verify trusted product certificate from DoT. Certificate is valid for one model number.',
    hasFileUpload: true,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'T7',
    testCaseNo: '4(g)',
    description:
      'Whether OEM undertaking as per para 10.2 and 10.3 of Section-I of RFP regarding originality of hardware and software is submitted?',
    procedure:
      'Verify OEM undertaking document for hardware and software originality as per RFP Section-I para 10.2 and 10.3.',
    hasFileUpload: true,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
  },
  {
    id: 'T8',
    testCaseNo: '4(h)',
    description:
      'Whether undertaking as per S.No. 18 of Table - "Technical Specifications for Routers" regarding software updates/bug is submitted?',
    procedure:
      'Verify undertaking document for software updates/bug fixes as per S.No. 18 of Technical Specifications for Routers table.',
    hasFileUpload: true,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
  },
  {
    id: 'T9',
    testCaseNo: '4(i)',
    description:
      'Whether the PIA has done Pre-AT and the Block availability in last one week is more than 99.5%?',
    procedure:
      'Check Pre-AT completion status. Verify block availability reports showing >99.5% uptime in the last 7 days.',
    hasFileUpload: true,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    id: 'T10',
    testCaseNo: '4(j)',
    description:
      'Activation/Deactivation of Router through a CLI command from SNOC should be available. like RFMS form',
    procedure:
      'Test router activation/deactivation via CLI command from SNOC. Verify remote management capability.',
    hasFileUpload: true,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
  },
];

const BlockRouterForm = ({ blockId, existingData }: BlockRouterFormProps) => {
  const [items, setItems] = useState<RouterFormItem[]>(
    routerTestCases.map((tc) => ({
      ...tc,
      compliance: '',
      remarks: '',
      images: [],
      documents: [],
      videos: [],
    })),
  );
  const [expandedId, setExpandedId] = useState<string | null>('T1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existingData?.tests) {
      const updatedItems = routerTestCases.map((tc) => {
        const testData = existingData.tests?.[tc.id];
        if (testData) {
          const urls = parseImageUrls(testData.Image);
          const existingImages: UploadedFile[] = [];
          const existingDocs: UploadedFile[] = [];
          const existingVideos: UploadedVideo[] = [];

          urls.forEach((url, idx) => {
            if (isVideoUrl(url)) {
              existingVideos.push({
                id: `existing-video-${idx}`,
                preview: getFullImageUrl(url),
                url: url,
              });
            } else if (isImageUrl(url)) {
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
            videos: existingVideos,
          };
        }
        return {
          ...tc,
          compliance: '',
          remarks: '',
          images: [],
          documents: [],
          videos: [],
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
    type: 'images' | 'documents' | 'videos',
    fileId: string,
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          if (type === 'videos') {
            const videoToRemove = item.videos.find((v) => v.id === fileId);
            if (videoToRemove?.file) {
              URL.revokeObjectURL(videoToRemove.preview);
            }
            return {
              ...item,
              videos: item.videos.filter((v) => v.id !== fileId),
            };
          }
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

  const handleVideoUpload = (
    id: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    const newVideos: UploadedVideo[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
    }));

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, videos: [...item.videos, ...newVideos] }
          : item,
      ),
    );
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

      const data = await response.json();
      return data.data?.videos || [];
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

      const routerData: Record<
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

        const newVideos = item.videos.filter((v) => v.file);
        const existingVideoUrls = item.videos
          .filter((v) => v.url)
          .map((v) => stripBaseUrl(v.url as string));

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

        if (newVideos.length > 0) {
          const files = newVideos.map((v) => v.file as File);
          const uploadedVideoUrls = await uploadVideos(files);
          uploadedUrls.push(...uploadedVideoUrls);
        }

        const allUrls = [
          ...existingImageUrls,
          ...existingDocUrls,
          ...existingVideoUrls,
          ...uploadedUrls,
        ];

        routerData[item.id] = {
          compliance: item.compliance,
          remarks: item.remarks,
          Image: allUrls.length > 0 ? `[${allUrls.join(',')}]` : '[]',
        };
      }

      const payload = {
        block_id: parseInt(blockId),
        ...routerData,
      };

      const response = await fetch(`${TraceBASEURL}/upload-blockrouter-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to submit Router checklist data');
      }

      const result = await response.json();
      console.log('Router Submit Result:', result);
      alert('Router Checklist submitted successfully!');
       window.location.reload();
    } catch (error) {
      console.error('Error submitting Router checklist:', error);
      alert('Failed to submit Router checklist. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = items.filter((item) => item.compliance !== '').length;
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
            <img
              src={Tricad}
              alt="Logo"
              className="hidden md:block w-[140px] md:w-[180px]"
            />
            <div>
              <h2 className="text-xl md:text-2xl font-bold">
                Block Router Tests
              </h2>
              <p className="text-blue-100 text-sm">
                Router Installation Checklist Compliance
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

      <div className="space-y-3">
        {items.map((item) => {
          const tcInfo = routerTestCases.find((t) => t.id === item.id);
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

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                  <div
                    className={`p-3 rounded-lg ${tcInfo?.iconBg || 'bg-blue-50'}`}
                  >
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Test Procedure
                    </p>
                    <p className="text-sm text-gray-700">{item.procedure}</p>
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
                    {item.id !== 'T5' && (
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
                                  <span className="text-xs text-gray-700 truncate">
                                    {doc.file?.name || 'Document'}
                                  </span>
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
                    )}
                    {item.id === 'T5' && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Upload Videos
                        </label>
                        <div className="border-2 border-dashed border-orange-200 rounded-xl p-4 text-center bg-orange-50/50 hover:bg-orange-50 transition-colors">
                          <input
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={(e) => handleVideoUpload(item.id, e)}
                            className="hidden"
                            id={`videos-${item.id}`}
                          />
                          <label
                            htmlFor={`videos-${item.id}`}
                            className="cursor-pointer"
                          >
                            <Video className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                            <p className="text-sm text-orange-600 font-medium">
                              Tap to upload videos
                            </p>
                            <p className="text-xs text-orange-400 mt-1">
                              MP4, MOV, AVI supported
                            </p>
                          </label>
                        </div>
                        {item.videos.length > 0 && (
                          <div className="grid grid-cols-2 gap-3">
                            {item.videos.map((video) => (
                              <div key={video.id} className="relative group">
                                <video
                                  src={video.preview}
                                  controls
                                  className="w-full aspect-video rounded-lg border-2 border-gray-200"
                                />
                                <button
                                  onClick={() =>
                                    removeFile(item.id, 'videos', video.id)
                                  }
                                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
              Submit Router Checklist
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

export default BlockRouterForm;
