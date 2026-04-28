import { useState, useEffect } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Wifi,
  Radio,
  FileText,
  Image,
  Video,
  MapPin,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { getRFMSData, getBlockRouterData } from '../../Services/api';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { RouterData } from '../../../types/block-router-checklist';
import MediaCarousel from '../../DepthChart/MediaCarousel';

const ImgbaseUrl = import.meta.env.VITE_Image_URL;

type FormType = 'RFMS' | 'BlockRouter' | 'FDMS';

interface TestItem {
  id: string;
  testCaseNo: string;
  description: string;
  procedure?: string;
  compliance: string;
  remarks: string;
  images: string[];
}

const BlockRouterChecklistView = () => {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state_id, district_id, block_id } =
    (searchParams.get('state_id') &&
      searchParams.get('district_id') && {
        state_id: searchParams.get('state_id')!,
        district_id: searchParams.get('district_id')!,
        block_id: searchParams.get('block_id')!,
      }) ||
    {};
  const [loadingData, setLoadingData] = useState(false);
  const [rfmsData, setRfmsData] = useState<RouterData | null>(null);
  const [routerData, setRouterData] = useState<RouterData | null>(null);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const [selectedFormType, setSelectedFormType] = useState<FormType>('RFMS');

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
  }, [blockId, district_id, state_id, block_id]);

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

  const openCarousel = (images: string[], startIndex: number = 0) => {
    setCarouselItems(images.map((img) => getFullImageUrl(img)));
    setCarouselIndex(startIndex);
    setCarouselOpen(true);
  };

  const rfmsTestCases = [
    {
      id: 'T1',
      testCaseNo: '1',
      description:
      'The Remote test unit (RTU) should have 48 ports within 2U with 10W power consumption. Connectors to be LC or SC type. Connectors should be in the front panel of RTU preferably. RTU should have Dual DC power input capability/provisioning. Each Nodes, about 50% ports shall be having live or active fiber monitoring facility at 24 Ports (out of 48 Ports) and 24 Ports for dark fiber monitoring. All types of telecom traffic to be considered in case of Live Fiber monitoring.',
      procedure: 'Physical Check',

    },
    {
      id: 'T2',
      testCaseNo: '2',
      description:
      'The OTDR module is required of 1650 nm (used for dark and live monitoring both) and dynamic range should be 40 dB or higher. Pulse width selectable between 6ns and 20μs and better. Event dead zone: = <1 Meter. Attenuation dead zone: 4 Meters; Optical distance accuracy: ±(0.75 + 0.0025%  x  distance  +  sampling resolution).',
       procedure:
      'Physical Check as well as on EMS/SNOC. 1650nm demo as per data sheet.',

    },
    {
      id: 'T3',
      testCaseNo: '3',
    description:
      'The system should have high availability feature with automatic switchover  from  active  server  to backup server in case of failure.',
    procedure: 'To be tested during eMS testing',
    },
    {
      id: 'T4',
      testCaseNo: '4',
    description:
      'It should be possible that the fiber is still being monitored after a fault is detected. Users are automatically notified if the fault severity or the fault location changes. The user must be notified in case of second fiber cable cut or degradation happens along the cable route before the first cut or degradation is repaired when second cut or degradation is at a shorter distance than the first cut distance. All the changes of event above configured thresholds should be available in alarm history.',
    procedure: 'Demonstration to be done',
    },
    { id: 'T5', testCaseNo: '5', 
    description:
      'The RFMS will be able to provide alarm, alert notification, and automatic generation of customized reports to provide timely and valuable information  on  the  fiber  network health,   availability,   and   provide historical trends of these performance indicators. This capability would be extended to Operation In-charge of each RTU location via web browser (Google\tchrome\etc.)\ton mobile/tablet/laptop or any device which supports web browser (Google chrome etc.). The RFTS system must have a mobile application operating on android and iOS for remote P2P tests.',
    procedure: 'To be demonstrated at eMS/SNOC',
     },
    { id: 'T6', testCaseNo: '6', 
    description:
      'For each monitored fiber, it should be possible to obtain fiber performance versus time. This graph should show the evolution of the fiber optic budget. The graph can be displayed for the last hour, day, week, month or year. By viewing the evolution of the fiber budget, user should immediately know whether this alarm is caused by a long term or short term effect.',
    procedure: 'To be demonstrated at eMS/SNOC',
    },
    { id: 'T7', testCaseNo: '7',
    description:
      'The system shall have a provision to tag .KMZ/.KML files to be associated to the relevant routes/ports to derive the co-ordinates of the fault or Google map link which can open in google map app which can be installed on PC/Tablet/Mobile phone.',
    procedure: 'To be demonstrated at eMS/SNOC',
      },
    { id: 'T8', testCaseNo: '8',
    description:
      'Simulate a fibre cut by removing patch cord and/or cutting patch cord on active fibre and dark fibre separately.',
    procedure:
      'Check location and distance of the fault as detected by RFMS. How does is compare with the actual distance.',
      },
    {
      id: 'T9',
      testCaseNo: '9',
    description:
      'Simulate fibre deterioration scenario using variable optical attenuator.',
    procedure:
      'Check location and distance of the fault as detected by RFMS. How does is compare with the actual Distance',
    },
  ];

  const blockRouterTestCases = [
    {
      id: 'T1',
      testCaseNo: '4(a)',
    description:
      'Router serial number and its TSEC and QA certificate: Check whether TSEC is available for this model number of Router. Check whether QA certificate is available for the Router serial number.',
    procedure:
      'Verify TSEC and QA certificate availability for the router model and serial number',
    },
    {
      id: 'T2',
      testCaseNo: '4(b)',
      description:
      'Check whether the following condition is qualified: "If the items mentioned herein are not dispatched within 15 days from the date of Dispatch Advice, they shall be re-offered for inspection to BSNL-QA."',
      procedure: 'Verify dispatch timeline compliance with BSNL-QA requirements',
    },
    {
      id: 'T3',
      testCaseNo: '4(c)',
     description:
      'Check whether the Router has the latest OS (TSEC Version or higher). If not, then first get the OS upgraded to the latest version (TSEC Version or higher). OEM Undertaking for higher version complying to all RFP requirements need to be submitted. The latest version would be displayed on SNOC.',
     procedure:
      'Check router OS version against TSEC version displayed on SNOC. Verify OEM undertaking if version upgrade was performed.',
    },
    {
      id: 'T4',
      testCaseNo: '4(d)',
      description:
      'All installed and configured ports of the Router should be up and active. Check through Command Line Interface (CLI).',
      procedure:
      'Access router CLI and verify all ports status using: show interface status, show ip interface brief',
    },
    {
      id: 'T5',
      testCaseNo: '4(e)',
    description:
      'Videos and photos of the Router installation as per RFP should be available. Check PIA PM tool.',
    procedure:
      'Verify installation media in PIA PM tool. Check for video and photo evidence of router installation.',
    },
    {
      id: 'T6',
      testCaseNo: '4(f)',
    description:
      'Whether the product qualifies the "Trusted products" as mandated by DoT vide File no- 20-271/2010 AS-I (Vol-III) dated 10.3.2021, along with its amendments, issued from time to time. The certificate can be provided once for one model number.',
    procedure:
      'Verify trusted product certificate from DoT. Certificate is valid for one model number.',
    },
    {
      id: 'T7',
      testCaseNo: '4(g)',
    description:
      'Whether OEM undertaking as per para 10.2 and 10.3 of Section-I of RFP regarding originality of hardware and software is submitted?',
    procedure:
      'Verify OEM undertaking document for hardware and software originality as per RFP Section-I para 10.2 and 10.3.',
    },
    {
      id: 'T8',
      testCaseNo: '4(h)',
    description:
      'Whether undertaking as per S.No. 18 of Table - "Technical Specifications for Routers" regarding software updates/bug is submitted?',
    procedure:
      'Verify undertaking document for software updates/bug fixes as per S.No. 18 of Technical Specifications for Routers table.',
    },
    {
      id: 'T9',
      testCaseNo: '4(i)',
    description:
      'Whether the PIA has done Pre-AT and the Block availability in last one week is more than 99.5%?',
    procedure:
      'Check Pre-AT completion status. Verify block availability reports showing >99.5% uptime in the last 7 days.',
    },
    {
      id: 'T10',
      testCaseNo: '4(j)',
    description:
      'Activation/Deactivation of Router through a CLI command from SNOC should be available. like RFMS form',
    procedure:
      'Test router activation/deactivation via CLI command from SNOC. Verify remote management capability.',
    },
  ];

  const fdmsTestCases = [
    {
      id: 'T1',
      testCaseNo: '1',
      description: 'FDMS system installation status',
      procedure: 'Check if the FDMS system is installed at the designated location as per the project requirements'
    },
    { id: 'T2', testCaseNo: '2', description: 'Power connection verification',
      procedure: 'Check if FDMS system is properly connected to power source and is powered on'
     },
    { id: 'T3', testCaseNo: '3', description: 'Network connectivity check' ,
      procedure: 'Verify that the FDMS system is connected to the network and can communicate with other devices as required'
    },
    { id: 'T4', testCaseNo: '4', description: 'Database configuration' ,
      procedure: 'Check if the database is properly configured and accessible by the FDMS system'
    },
    { id: 'T5', testCaseNo: '5', description: 'Fiber management system setup',
      procedure: 'Verify that the fiber management system is set up correctly and can manage fiber connections as intended'
     },
    { id: 'T6', testCaseNo: '6', description: 'Documentation verification',
      procedure: 'Check if all necessary documentation for the FDMS system is available and properly organized'
     },
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
        procedure: tc.procedure,
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
  }[] = [
    {
      type: 'RFMS',
      label: 'RFMS',
      icon: <Radio className="w-4 h-4" />,
    },
    {
      type: 'BlockRouter',
      label: 'Block Router',
      icon: <Wifi className="w-4 h-4" />,
    },
    {
      type: 'FDMS',
      label: 'FDMS',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  const testItems = getTestItems();
  const completedCount = testItems.filter(
    (item) => item.compliance === 'Yes' || item.compliance === 'Y',
  ).length;
  const totalCount = testItems.length;

  if (loadingData && !rfmsData && !routerData) {
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
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/installation-block-checklist-list')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Block Checklist
                </h1>
                {blockInfo && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>{blockInfo.block_name}</span>
                    <span className="text-gray-300">|</span>
                    <Building2 className="w-3 h-3" />
                    <span>{blockInfo.district_name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">
                  {completedCount}/{totalCount} Passed
                </div>
                <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700 rounded-full"
                    style={{
                      width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {formTypes.map((form) => (
              <button
                key={form.type}
                onClick={() => setSelectedFormType(form.type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all text-sm ${
                  selectedFormType === form.type
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {form.icon}
                <span>{form.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {testItems.every((item) => item.compliance === '') ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Data Available
            </h3>
            <p className="text-gray-400">
              No checklist data found for {selectedFormType} in this block.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {testItems.map((item, index) => {
              const isCompleted =
                item.compliance === 'Yes' || item.compliance === 'Y';
              const hasData = item.compliance !== '';

              return (
                <div
                  key={item.id}
                  className={`group bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
                    !hasData
                      ? 'border-gray-100 opacity-60'
                      : isCompleted
                        ? 'border-emerald-100 hover:border-emerald-200'
                        : 'border-red-100 hover:border-red-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            !hasData
                              ? 'bg-gray-100 text-gray-400'
                              : isCompleted
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {item.testCaseNo}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 mb-2 leading-relaxed">
                          {item.description}
                        </p>
                        {item.procedure && (
                          <p className="text-xs text-gray-500 mt-1 mb-1">
                            <b>Procedure:</b> {item.procedure}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          {hasData ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                  : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {isCompleted ? 'Compliance Status (Yes)' : 'Compliance Status (No)'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 ring-1 ring-gray-200">
                              <AlertCircle className="w-3 h-3" />
                              Pending
                            </span>
                          )}

                         

                          {item.images.length > 0 && (
                            <button
                              onClick={() => openCarousel(item.images, 0)}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-600 ring-1 ring-orange-200 hover:bg-orange-100 transition-colors"
                            >
                              <Image className="w-3 h-3" />
                              {item.images.length} Media
                            </button>
                          )}

                        </div>
                         {item.remarks && (
                            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                             <b>Remarks:</b> {item.remarks}
                            </span>
                          )}

                        {item.images.length > 0 && (
                          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                            {item.images.slice(0, 5).map((img, idx) => {
                              const isVideo = isVideoUrl(img);
                              return (
                                <button
                                  key={idx}
                                  onClick={() => openCarousel(item.images, idx)}
                                  className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all relative group/image"
                                >
                                  {isVideo ? (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                      <Video className="w-4 h-4 text-gray-400" />
                                    </div>
                                  ) : (
                                    <img
                                      src={getFullImageUrl(img)}
                                      alt={`Media ${idx + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (
                                          e.currentTarget as HTMLImageElement
                                        ).style.display = 'none';
                                      }}
                                    />
                                  )}
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                                    {isVideo ? (
                                      <Video className="w-3 h-3 text-white" />
                                    ) : (
                                      <Image className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                            {item.images.length > 5 && (
                              <button
                                onClick={() => openCarousel(item.images, 5)}
                                className="flex-shrink-0 w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                +{item.images.length - 5}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            !hasData
                              ? 'bg-gray-100'
                              : isCompleted
                                ? 'bg-emerald-100'
                                : 'bg-red-100'
                          }`}
                        >
                          {hasData &&
                            (isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
