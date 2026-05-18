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
  ExternalLink,
  Printer,
} from 'lucide-react';
import { getRFMSData, getBlockRouterData, getBlockRackData } from '../../Services/api';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { RackData, RouterData } from '../../../types/block-router-checklist';
import MediaCarousel from '../../DepthChart/MediaCarousel';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ImgbaseUrl = import.meta.env.VITE_Image_URL;

type FormType = 'RFMS' | 'BlockRouter' | 'BlockRack';

interface TestItem {
  id: string;
  testCaseNo: string;
  description: string;
  procedure?: string;
  compliance: string;
  remarks: string;
  images: string[];
  documents: string[];
}

const RACK_TEST_ID_TO_API_KEY: Record<string, keyof RackData> = {
  A1:  'infrastructure_T1',
  A2:  'infrastructure_T2',
  A3:  'infrastructure_T3',
  A4:  'infrastructure_T4',
  A5:  'infrastructure_T5',
  A6:  'infrastructure_T6',
  A7:  'infrastructure_T7',
  A8:  'infrastructure_T8',
  A9:  'infrastructure_T9',
  A10: 'infrastructure_T10',
  B1:  'functional_T1',
  B2:  'functional_T2',
  B3:  'functional_T3',
  B4:  'functional_T4',
  B5:  'functional_T5',
  B6:  'functional_T6',
};
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
  const[rackData,setRackData]=useState<RackData | null>(null);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [preparing, setPreparing] = useState(false);

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
      const [rfms, blockRouter,blockRack] = await Promise.all([
        getRFMSData(blockId).catch(() => null),
        getBlockRouterData(blockId).catch(() => null),
        getBlockRackData(blockId).catch(()=>null),
      ]);

      if (rfms?.status && rfms?.tests) {
        setRfmsData(rfms);
      }

      if (blockRouter?.status && blockRouter?.tests) {
        setRouterData(blockRouter);
      }
      if(blockRack?.status && blockRack?.data){
        setRackData(blockRack.data)
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
  const getFileExt = (url: string): string => {
  const cleanUrl = url.split('?')[0].split('#')[0];
  return cleanUrl.split('.').pop()?.toLowerCase() || '';
};

const isImageUrl = (url: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  return imageExtensions.includes(getFileExt(url));
};

const isDocumentUrl = (url: string): boolean => {
  const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
  return documentExtensions.includes(getFileExt(url));
};

const getFileName = (url: string): string => {
  return url.split('/').pop()?.split('?')[0] || 'Document';
};

const splitAttachments = (urls: string[]) => ({
  images: urls.filter((url) => isImageUrl(url) || isVideoUrl(url)),
  documents: urls.filter((url) => isDocumentUrl(url)),
});

const openDocument = (url: string) => {
  window.open(getFullImageUrl(url), '_blank', 'noopener,noreferrer');
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

 const RackTestCases = [
  // Part A: Infrastructure
  { id: 'A1', testCaseNo: '1', part: 'A', description: 'Location Alignment and Rigidity (LAR)', procedure: 'As per approved Layout plan - Layout plan to be submitted.' },
  { id: 'A2', testCaseNo: '2', part: 'A', description: 'LI-Bty, HUPS', procedure: 'ATC to be submitted.' },
  { id: 'A3', testCaseNo: '3', part: 'A', description: 'Check of Firefighting Equipment', procedure: 'Physical verification for availability of fire fighting equipment.' },
  { id: 'A4', testCaseNo: '4', part: 'A', description: 'Illumination and Power outlets', procedure: 'Should be adequate.' },
  { id: 'A5', testCaseNo: '5', part: 'A', description: 'Check of Earthing system', procedure: 'As per Inspection & QA (T&D) Circle E.I. No 1-001. Earth measurement < 0.5 ohm.' },
  { id: 'A6', testCaseNo: '6', part: 'A', description: 'QA / FTR certification of all equipment', procedure: 'TSEC Certificate and IC/RR to be submitted.' },
  { id: 'A7', testCaseNo: '7', part: 'A', description: 'Check of Documentation', procedure: 'User manual, System Administration manual, product specification, Installation and O&M Manual.' },
  { id: 'A8', testCaseNo: '8', part: 'A', description: 'Voltage drop test', procedure: 'Should be less than 1 volt (in case of DC supply).' },
  { id: 'A9', testCaseNo: '9', part: 'A', description: 'Cabling, Labelling & Sign Writing', procedure: 'Physical check of terminal blocks, controls, switches, indicators.' },
  { id: 'A10', testCaseNo: '10', part: 'A', description: 'Check of power supply', procedure: 'Equipment at GP shall be AC operated; at Block, all equipment shall be DC operated.' },
  // Part B: Functional
  { id: 'B1', testCaseNo: '1', part: 'B', description: 'Physical Check: Dimensioning, Surface finishing, Power supply, Smart meter provision', procedure: 'As per BoM / TSEC (addl. 20% space). Power switch inside RACK. Smart meter provision as required.' },
  { id: 'B2', testCaseNo: '2', part: 'B', description: 'Check earthing for the Rack', procedure: 'All enclosure panels are single walled boltable from inside with Earthing on all flat parts.' },
  { id: 'B3', testCaseNo: '3', part: 'B', description: 'Check for Cooling / Fan (N+1)', procedure: '3 fans above 25°C, 2 more above 35°C, standby above 60°C or fan failure. Self-starting axial fans 5+1.' },
  { id: 'B4', testCaseNo: '4', part: 'B', description: 'Access Control and Monitoring System (IP/SNMP/Web browser)', procedure: 'Electromagnetic lock, 9-digit keypad, remote password reset, IR camera snapshots stored 15 days at NOC.' },
  { id: 'B5', testCaseNo: '5', part: 'B', description: 'Check of SNMP traps (IP/SNMP/Web Browser control and monitoring)', procedure: 'SNMP traps for temperature, humidity, water logging, fan fail, fire detection, door open. Battery monitoring.' },
  { id: 'B6', testCaseNo: '6', part: 'B', description: 'Check for Grouting bolts & RCC Plinth (outside building only)', procedure: 'Install rack on RCC plinth min 2 feet height with 2 pipes for power and OFC (external installation only).' },
];

  const getTestCases = (): typeof rfmsTestCases => {
    switch (selectedFormType) {
      case 'RFMS':
        return rfmsTestCases;
      case 'BlockRouter':
        return blockRouterTestCases;
      case 'BlockRack':
        return RackTestCases;
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
        case 'BlockRack':
          return rackData;
      default:
        return null;
    }
  };

 const getTestItems = (): TestItem[] => {
  const testCases = getTestCases();

  if (selectedFormType === 'BlockRack') {
    return RackTestCases.map((tc) => {
      const apiKey = RACK_TEST_ID_TO_API_KEY[tc.id];
      const testData = rackData
        ? (rackData[apiKey] as { Image: string; compliance: string; remarks: string } | null)
        : null;

      const attachments = testData?.Image ? parseImageUrls(testData.Image) : [];
     const { images, documents } = splitAttachments(attachments);

      

      // const images = testData?.Image ? parseImageUrls(testData.Image) : [];

      return {
        id: tc.id,
        testCaseNo: tc.testCaseNo,
        description: tc.description,
        procedure: tc.procedure,
        compliance: testData?.compliance || '',
        remarks: testData?.remarks || '',
        images,
         documents,
      };
    });
  }

  // RFMS and BlockRouter use tests object
  const data = getFormData() as RouterData | null;
  return testCases.map((tc) => {
    const testData = data?.tests?.[tc.id];
    // const images = testData?.Image ? parseImageUrls(testData.Image) : [];
      const attachments = testData?.Image ? parseImageUrls(testData.Image) : [];
     const { images, documents } = splitAttachments(attachments);

    return {
      id: tc.id,
      testCaseNo: tc.testCaseNo,
      description: tc.description,
      procedure: tc.procedure,
      compliance: testData?.compliance || '',
      remarks: testData?.remarks || '',
      images,
       documents,
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
      type: 'BlockRack',
      label: 'Block Rack',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  const testItems = getTestItems();
  const completedCount = testItems.filter(
    (item) => item.compliance === 'Yes' || item.compliance === 'Y',
  ).length;
  const totalCount = testItems.length;

  if (loadingData && !rfmsData && !routerData && !rackData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading checklist data...</p>
        </div>
      </div>
    );
  }
  const escapeHtml = (value: string | number | null | undefined): string =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const toBase64 = async (source: string): Promise<string> => {
    try {
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
    } catch (error) {
      console.error('Base64 conversion failed:', source, error);
      return source;
    }
  };

  const renderPdfToImages = async (source: string): Promise<string[]> => {
    const fullUrl = getFullImageUrl(source);
    const arrayBuffer = await fetch(fullUrl, {
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-cache',
    }).then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch PDF: ${fullUrl}`);
      return response.arrayBuffer();
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

  const buildDocumentCardHtml = async (
    doc: string,
    item: TestItem,
    attachmentPages: string[],
  ): Promise<string> => {
    const ext = getFileExt(doc).toUpperCase() || 'FILE';
    const name = getFileName(doc);
    const label = `${item.testCaseNo} - ${name}`;

    if (ext === 'PDF') {
      try {
        const pdfPages = await renderPdfToImages(doc);
        pdfPages.forEach((src, index) => {
          attachmentPages.push(`
            <div class="attachment-page">
              <div class="attachment-label">${escapeHtml(label)} - Page ${index + 1}</div>
              <img src="${src}" alt="${escapeHtml(label)} page ${index + 1}" />
            </div>
          `);
        });
        return `<div class="doc-card pdf-doc"><strong>PDF:</strong> ${escapeHtml(name)} <span>${pdfPages.length} page(s) included in attachments</span></div>`;
      } catch (error) {
        console.error('PDF render failed:', doc, error);
        return `<div class="doc-card pdf-doc"><strong>PDF:</strong> ${escapeHtml(name)} <span>Preview unavailable</span></div>`;
      }
    }

    return `<div class="doc-card"><strong>${escapeHtml(ext)}:</strong> ${escapeHtml(name)} <span>Attached file</span></div>`;
  };

  const buildImageThumbHtml = async (
    image: string,
    item: TestItem,
    index: number,
    attachmentPages: string[],
  ): Promise<string> => {
    const fullUrl = getFullImageUrl(image);
    const src = await toBase64(fullUrl);
    const label = `${item.testCaseNo} - ${getFileName(image) || `Image ${index + 1}`}`;

    attachmentPages.push(`
      <div class="attachment-page">
        <div class="attachment-label">${escapeHtml(label)}</div>
        <img src="${src}" alt="${escapeHtml(label)}" />
      </div>
    `);

    return `<div class="image-thumb"><img src="${src}" alt="${escapeHtml(label)}" /></div>`;
  };

  const buildPrintStyles = (): string => `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #1e293b; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { size: A4; margin: 14mm 16mm 18mm 16mm; }
    .report-header { display:flex; justify-content:space-between; gap:16px; padding-bottom:14px; border-bottom:3px solid #1565c0; margin-bottom:18px; }
    .report-title h1 { font-size:17pt; color:#0d47a1; margin-bottom:4px; }
    .report-title p { font-size:9pt; color:#64748b; margin-top:2px; }
    .summary-bar { display:flex; gap:10px; margin-bottom:18px; }
    .summary-chip { flex:1; border:1px solid #e2e8f0; border-radius:8px; padding:9px 10px; text-align:center; background:#f8fafc; }
    .chip-value { font-size:17pt; font-weight:700; color:#1d4ed8; line-height:1; }
    .chip-label { font-size:8pt; color:#64748b; margin-top:3px; }
    .test-card { border:1px solid #e2e8f0; border-radius:10px; margin-bottom:14px; overflow:hidden; break-inside:auto; page-break-inside:auto; }
    .test-card-header { display:flex; align-items:flex-start; gap:10px; padding:11px 13px; background:#f8fafc; border-bottom:1px solid #e2e8f0; break-inside:avoid; page-break-inside:avoid; }
    .test-badge { font-size:10pt; font-weight:700; color:#1d4ed8; background:#dbeafe; padding:4px 9px; border-radius:6px; white-space:nowrap; }
    .test-description { flex:1; font-size:9pt; line-height:1.42; color:#1e293b; }
    .compliance-badge { padding:4px 10px; border-radius:99px; font-size:8.5pt; font-weight:700; white-space:nowrap; border:1px solid #cbd5e1; background:#f1f5f9; color:#64748b; }
    .badge-yes { background:#dcfce7; color:#166534; border-color:#86efac; }
    .badge-no { background:#fee2e2; color:#991b1b; border-color:#fca5a5; }
    .test-card-body { padding:11px 13px; }
    .procedure-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:7px 10px; margin-bottom:8px; font-size:8.8pt; color:#0c4a6e; break-inside:avoid; page-break-inside:avoid; }
    .remarks-box { background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:7px 10px; margin-bottom:8px; font-size:8.8pt; color:#78350f; break-inside:avoid; page-break-inside:avoid; }
    .section-title { font-size:8.8pt; font-weight:700; color:#475569; margin:9px 0 7px; }
    .images-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    .image-thumb { border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; aspect-ratio:4/3; }
    .image-thumb img { width:100%; height:100%; object-fit:cover; display:block; }
    .doc-card { border:1px solid #e2e8f0; border-radius:7px; padding:8px 10px; margin-bottom:7px; font-size:8.8pt; color:#334155; background:#fafafa; break-inside:avoid; page-break-inside:avoid; }
    .doc-card strong { color:#7c3aed; }
    .pdf-doc strong { color:#dc2626; }
    .doc-card span { color:#64748b; margin-left:8px; }
    .video-note { background:#fff7ed; border:1px solid #fed7aa; border-radius:6px; padding:8px 10px; font-size:8.8pt; color:#9a3412; }
    .signature-section { margin-top:26px; padding-top:16px; border-top:2px solid #e2e8f0; page-break-inside:avoid; }
    .signature-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; }
    .signature-block { text-align:center; }
    .signature-line { border-bottom:1px solid #94a3b8; margin-bottom:6px; height:38px; }
    .signature-label { font-size:8.5pt; color:#64748b; }
    .report-footer { margin-top:16px; padding-top:10px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:8pt; color:#94a3b8; }
    .attachment-page { page-break-before:always; break-before:page; page-break-inside:avoid; break-inside:avoid; height:235mm; border:1px solid #e2e8f0; background:#fff; display:flex; flex-direction:column; overflow:hidden; }
    .attachment-label { flex:0 0 auto; padding:7px 10px; font-size:8.5pt; font-weight:700; color:#1e293b; border-bottom:1px solid #e2e8f0; background:#f8fafc; word-break:break-word; }
    .attachment-page img { flex:1 1 auto; min-height:0; width:100%; height:100%; object-fit:contain; display:block; background:#fff; }
  `;

  const triggerPrint = async () => {
    if (testItems.length === 0 || testItems.every((item) => item.compliance === '')) {
      alert(`No checklist data found for ${selectedFormType} in this block.`);
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.');
      return;
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Preparing Report</title><style>body{display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#64748b;font-size:15pt;}</style></head><body>Preparing report, please wait...</body></html>`);
    printWindow.document.close();

    const attachmentPages: string[] = [];
    const itemsHtml = await Promise.all(
      testItems.map(async (item) => {
        const imagesHtml = await Promise.all(
          item.images.map((image, index) => buildImageThumbHtml(image, item, index, attachmentPages)),
        );
        const docsHtml = await Promise.all(
          item.documents.map((doc) => buildDocumentCardHtml(doc, item, attachmentPages)),
        );
        const complianceClass =
          item.compliance === 'Yes' || item.compliance === 'Y'
            ? 'badge-yes'
            : item.compliance === 'No' || item.compliance === 'N'
              ? 'badge-no'
              : '';

        return `
          <div class="test-card">
            <div class="test-card-header">
              <span class="test-badge">${escapeHtml(item.testCaseNo)}</span>
              <span class="test-description">${escapeHtml(item.description)}</span>
              <span class="compliance-badge ${complianceClass}">${escapeHtml(item.compliance || 'Pending')}</span>
            </div>
            <div class="test-card-body">
              ${item.procedure ? `<div class="procedure-box"><strong>Procedure: </strong>${escapeHtml(item.procedure)}</div>` : ''}
              ${item.remarks ? `<div class="remarks-box"><strong>Remarks: </strong>${escapeHtml(item.remarks)}</div>` : ''}
              ${imagesHtml.length > 0 ? `<div class="section-title">Images / Videos (${item.images.length})</div><div class="images-grid">${imagesHtml.join('')}</div>` : ''}
              ${docsHtml.length > 0 ? `<div class="section-title">Documents (${item.documents.length})</div>${docsHtml.join('')}` : ''}
              ${item.images.some((image) => isVideoUrl(image)) ? `<div class="video-note">Video file(s) are attached and can be viewed from the checklist screen.</div>` : ''}
            </div>
          </div>`;
      }),
    );

    const formLabel = formTypes.find((form) => form.type === selectedFormType)?.label ?? selectedFormType;
    const completed = testItems.filter((item) => item.compliance === 'Yes' || item.compliance === 'Y').length;
    const failed = testItems.filter((item) => item.compliance === 'No' || item.compliance === 'N').length;
    const pending = testItems.length - completed - failed;
    const generatedAt = new Date().toLocaleString();
    const fullHtml = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(formLabel)} Checklist Report</title>
        <style>${buildPrintStyles()}</style>
      </head>
      <body>
        <div class="report-header">
          <div class="report-title">
            <h1>${escapeHtml(formLabel)} Checklist</h1>
            <p>Block Checklist Report</p>
            <p>Generated: ${escapeHtml(generatedAt)}</p>
          </div>
          <div class="report-title" style="text-align:right;">
            <p><strong>Block:</strong> ${escapeHtml(blockInfo?.block_name || block_id || blockId || '')}</p>
            <p><strong>District:</strong> ${escapeHtml(blockInfo?.district_name || district_id || '')}</p>
            <p><strong>State:</strong> ${escapeHtml(blockInfo?.state_name || state_id || '')}</p>
          </div>
        </div>

        <div class="summary-bar">
          <div class="summary-chip"><div class="chip-value">${testItems.length}</div><div class="chip-label">Total Tests</div></div>
          <div class="summary-chip"><div class="chip-value">${completed}</div><div class="chip-label">Compliant</div></div>
          <div class="summary-chip"><div class="chip-value">${failed}</div><div class="chip-label">Non-Compliant</div></div>
          <div class="summary-chip"><div class="chip-value">${pending}</div><div class="chip-label">Pending</div></div>
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
          <span>${escapeHtml(formLabel)} Checklist - Block ID: ${escapeHtml(blockId)}</span>
          <span>Confidential - Internal Use Only</span>
        </div>
        ${attachmentPages.join('')}
      </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();

    const images = Array.from(printWindow.document.images);
    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) return resolve();
            image.onload = () => resolve();
            image.onerror = () => resolve();
          }),
      ),
    );

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const handlePrint = async () => {
    setPreparing(true);
    try {
      await triggerPrint();
    } finally {
      setPreparing(false);
    }
  };

  const renderDocuments = (item: TestItem) => {
    if (item.documents.length === 0) return null;

    return (
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {item.documents.map((doc, idx) => {
          const ext = getFileExt(doc).toUpperCase();
          const name = getFileName(doc);

          return (
            <button
              key={idx}
              onClick={() => openDocument(doc)}
              className="flex-shrink-0 min-w-[160px] max-w-[220px] rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-left hover:bg-purple-100 hover:border-purple-300 transition-all"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="text-[10px] font-bold text-purple-700 bg-white px-1.5 py-0.5 rounded">
                  {ext || 'FILE'}
                </span>
                <ExternalLink className="w-3 h-3 text-purple-500 ml-auto flex-shrink-0" />
              </div>
              <p className="text-xs text-purple-900 mt-1 truncate">{name}</p>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTestCard = (item: TestItem) => {
    const isCompleted = item.compliance === 'Yes' || item.compliance === 'Y';
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

                {item.documents.length > 0 && (
                  <button
                    onClick={() => openDocument(item.documents[0])}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600 ring-1 ring-purple-200 hover:bg-purple-100 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    {item.documents.length} Documents
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
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
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
              {renderDocuments(item)}
            </div>

            <div className="flex-shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  !hasData ? 'bg-gray-100' : isCompleted ? 'bg-emerald-100' : 'bg-red-100'
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
  };


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
              <div className="text-right hidden sm:block">
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
              <button
                onClick={handlePrint}
                disabled={preparing || loadingData || testItems.every((item) => item.compliance === '')}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 bg-white text-blue-700 text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {preparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                <span>{preparing ? 'Preparing...' : 'Print'}</span>
              </button>
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
        ) : selectedFormType === 'BlockRack' ? (
          (['A', 'B'] as const).map((part) => {
            const partItems = testItems.filter((item) => item.id.startsWith(part));
            const partLabel =
              part === 'A' ? 'Part A: Infrastructure Tests' : 'Part B: Functional Tests';

            return (
              <div key={part} className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                      part === 'A' ? 'bg-blue-500' : 'bg-emerald-500'
                    }`}
                  >
                    {partLabel}
                  </div>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">
                    {partItems.filter((item) => item.compliance === 'Yes' || item.compliance === 'Y').length}/
                    {partItems.length} passed
                  </span>
                </div>
                <div className="grid gap-3">{partItems.map(renderTestCard)}</div>
              </div>
            );
          })
        ) : (
          <div className="grid gap-3">{testItems.map(renderTestCard)}</div>
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
