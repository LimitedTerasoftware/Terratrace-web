import { useState, useEffect } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Menu,
  ArrowLeft,
  Wifi,
  Radio,
  FileText,
  ChevronDown,
  ChevronUp,
  Image,
  Video,
  MapPin,
  Building2,
} from 'lucide-react';
import {
  getRFMSData,
  getBlockRouterData,
} from '../../Services/api';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { RouterData } from '../../../types/block-router-checklist';
import MediaCarousel from '../../DepthChart/MediaCarousel';

const ImgbaseUrl = import.meta.env.VITE_Image_URL;

type FormType = 'RFMS' | 'BlockRouter' | 'FDMS';

interface TestItem {
  id: string;
  testCaseNo: string;
  description: string;
  compliance: string;
  remarks: string;
  images: string[];
}

const BlockRouterChecklistView = () => {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state_id, district_id, block_id } = (searchParams.get('state_id') && searchParams.get('district_id'))
    && {
        state_id: (searchParams.get('state_id')!),
        district_id: (searchParams.get('district_id')!),
        block_id: (searchParams.get('block_id')!),
      }
     || {};
  const [loadingData, setLoadingData] = useState(false);
  const [rfmsData, setRfmsData] = useState<RouterData | null>(null);
  const [routerData, setRouterData] = useState<RouterData | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [selectedFormType, setSelectedFormType] = useState<FormType>(
     'RFMS'
  );

  const [blockInfo, setBlockInfo] = useState<{
    state_name: string;
    district_name: string;
    block_name: string;
  } | null>(null);

   useEffect(() => {
     if (district_id && state_id && block_id) {
         setBlockInfo({
            state_name: state_id || '',
            district_name: district_id || '',
            block_name: block_id || '',
          });
        }
  }, [blockId,district_id,state_id,block_id]);

  const fetchFormData = async () => {
    if (!blockId) return;

    setLoadingData(true);
    try {
      const [rfms, blockRouter] = await Promise.all([
        getRFMSData(blockId).catch(() => null),
        getBlockRouterData(blockId).catch(() => null),
      ]);

      if (rfms?.status && rfms?.tests) {
        setRfmsData(rfms);
      }

      if (blockRouter?.status && blockRouter?.tests) {
        setRouterData(blockRouter);
      }
    } catch (error) {
      console.error('Error fetching form data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (blockId) {
      fetchFormData();
    }
  }, [blockId, selectedFormType]);

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

  const isVideoUrl = (url: string): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
    return videoExtensions.some((ext) => url.toLowerCase().includes(ext));
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const openCarousel = (images: string[], startIndex: number = 0) => {
    setCarouselItems(images.map((img) => getFullImageUrl(img)));
    setCarouselIndex(startIndex);
    setCarouselOpen(true);
  };

  const rfmsTestCases = [
    {
      id: 'T1',
      testCaseNo: '1',
      description: 'RFMS system installed at SNMS Site',
    },
    {
      id: 'T2',
      testCaseNo: '2',
      description: 'Power Supply connection (230V AC)',
    },
    {
      id: 'T3',
      testCaseNo: '3',
      description: 'Physical installation of RFMS unit',
    },
    {
      id: 'T4',
      testCaseNo: '4',
      description: 'Connection to ONU / Optical Splitter',
    },
    { id: 'T5', testCaseNo: '5', description: 'Fibre patch cord connectivity' },
    { id: 'T6', testCaseNo: '6', description: 'CLI / Web GUI Access' },
    { id: 'T7', testCaseNo: '7', description: 'RFMS server communication' },
    { id: 'T8', testCaseNo: '8', description: 'SNMP configuration' },
    {
      id: 'T9',
      testCaseNo: '9',
      description: 'Alerts / Notifications configuration',
    },
  ];

  const blockRouterTestCases = [
    {
      id: 'T1',
      testCaseNo: '4(a)',
      description: 'Router serial number and TSEC and QA certificate check',
    },
    {
      id: 'T2',
      testCaseNo: '4(b)',
      description: 'Dispatch condition check (15 days from Dispatch Advice)',
    },
    {
      id: 'T3',
      testCaseNo: '4(c)',
      description: 'Latest OS (TSEC Version or higher) check',
    },
    {
      id: 'T4',
      testCaseNo: '4(d)',
      description: 'All installed and configured ports up and active via CLI',
    },
    {
      id: 'T5',
      testCaseNo: '4(e)',
      description: 'Videos and photos of Router installation as per RFP',
    },
    {
      id: 'T6',
      testCaseNo: '4(f)',
      description: 'Trusted products certificate (DoT)',
    },
    {
      id: 'T7',
      testCaseNo: '4(g)',
      description: 'OEM undertaking for hardware/software originality',
    },
    {
      id: 'T8',
      testCaseNo: '4(h)',
      description: 'Undertaking for software updates/bug',
    },
    {
      id: 'T9',
      testCaseNo: '4(i)',
      description: 'Pre-AT done and Block availability >99.5%',
    },
    {
      id: 'T10',
      testCaseNo: '4(j)',
      description: 'Activation/Deactivation through CLI command from SNOC',
    },
  ];

  const fdmsTestCases = [
    {
      id: 'T1',
      testCaseNo: '1',
      description: 'FDMS system installation status',
    },
    { id: 'T2', testCaseNo: '2', description: 'Power connection verification' },
    { id: 'T3', testCaseNo: '3', description: 'Network connectivity check' },
    { id: 'T4', testCaseNo: '4', description: 'Database configuration' },
    { id: 'T5', testCaseNo: '5', description: 'Fiber management system setup' },
    { id: 'T6', testCaseNo: '6', description: 'Documentation verification' },
  ];

  const getTestCases = (): typeof rfmsTestCases => {
    switch (selectedFormType) {
      case 'RFMS':
        return rfmsTestCases;
      case 'BlockRouter':
        return blockRouterTestCases;
      case 'FDMS':
        return fdmsTestCases;
      default:
        return [];
    }
  };

  const getFormData = () => {
    switch (selectedFormType) {
      case 'RFMS':
        return rfmsData;
      case 'BlockRouter':
        return routerData;
      default:
        return null;
    }
  };

  const getTestItems = (): TestItem[] => {
    const testCases = getTestCases();
    const data = getFormData();

    return testCases.map((tc) => {
      const testData = data?.tests?.[tc.id];
      const images = testData?.Image ? parseImageUrls(testData.Image) : [];

      return {
        id: tc.id,
        testCaseNo: tc.testCaseNo,
        description: tc.description,
        compliance: testData?.compliance || '',
        remarks: testData?.remarks || '',
        images,
      };
    });
  };

  const formTypes: {
    type: FormType;
    label: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: 'RFMS',
      label: 'RFMS',
      icon: <Radio className="w-4 h-4" />,
      color: 'bg-blue',
    },
    {
      type: 'BlockRouter',
      label: 'Block Router',
      icon: <Wifi className="w-4 h-4" />,
      color: 'bg-purple',
    },
    {
      type: 'FDMS',
      label: 'FDMS',
      icon: <FileText className="w-4 h-4" />,
      color: 'bg-green',
    },
  ];

  const testItems = getTestItems();
  const completedCount = testItems.filter(
    (item) => item.compliance === 'Yes' || item.compliance === 'Y',
  ).length;
  const totalCount = testItems.length;

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading checklist data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
    

      <div
        className={`transition-all duration-300`}
      >
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/installation-block-checklist-list')}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    Block Checklist View
                  </h1>
                  {blockInfo && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span>{blockInfo.block_name}</span>
                      <span>•</span>
                      <Building2 className="w-3 h-3" />
                      <span>{blockInfo.district_name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-500">
                  {completedCount}/{totalCount} Completed
                </span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {formTypes.map((form) => (
                <button
                  key={form.type}
                  onClick={() => setSelectedFormType(form.type)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                    selectedFormType === form.type
                      ? `bg-blue-500 text-white shadow-md`
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {form.icon}
                  <span>{form.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="p-4">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {testItems.map((item) => {
                const isExpanded = expandedItems.has(item.id);
                const isCompleted =
                  item.compliance === 'Yes' || item.compliance === 'Y';

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                      isCompleted ? 'border-green-200' : 'border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50"
                    >
                      <div
                        className={`p-2 rounded-lg ${
                          isCompleted
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <XCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Test {item.testCaseNo}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-2">
                          {item.description}
                        </p>
                        {item.remarks && (
                          <p className="text-xs text-gray-500 mt-1">
                            Remarks: {item.remarks}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {item.images.length > 0 && (
                          <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                            <Image className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-medium text-orange-600">
                              {item.images.length}
                            </span>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Compliance
                            </label>
                            <div className="mt-1">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  isCompleted
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {isCompleted ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                       
                        </div>

                        {item.remarks && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Remarks
                            </label>
                            <p className="mt-1 text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                              {item.remarks}
                            </p>
                          </div>
                        )}

                        {item.images.length > 0 && (
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Media ({item.images.length})
                            </label>
                            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {item.images.map((img, idx) => {
                                const isVideo = isVideoUrl(img);
                                return (
                                  <button
                                    key={idx}
                                    onClick={() =>
                                      openCarousel(item.images, idx)
                                    }
                                    className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all group"
                                  >
                                    {isVideo ? (
                                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <Video className="w-6 h-6 text-gray-400" />
                                      </div>
                                    ) : (
                                      <img
                                        src={getFullImageUrl(img)}
                                        alt={`Media ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display =
                                            'none';
                                        }}
                                      />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      {isVideo ? (
                                        <Video className="w-6 h-6 text-white" />
                                      ) : (
                                        <Image className="w-6 h-6 text-white" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {testItems.every((item) => item.compliance === '') && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No Data Available
                  </h3>
                  <p className="text-gray-500">
                    No checklist data found for {selectedFormType} in this
                    block.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <MediaCarousel
        isOpen={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        mediaItems={carouselItems.map((url, index) => ({
          type: isVideoUrl(url) ? 'video' : 'image',
          url,
          label: `Media ${index + 1}`,
        }))}
        initialIndex={carouselIndex}
      />
    </div>
  );
};

export default BlockRouterChecklistView;
