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
  Wrench,
  Network,
} from 'lucide-react';
import Tricad from '../../../images/logo/Tricad.png';
import BharatNetLogo from '../../../images/logo/bharatnet-logo.jpg';
import BsnlLogo from '../../../images/logo/bsnl-logo.jpg';
import NetworkDiagram from '../../../images/logo/at-router-network-diagram.png';
import SetupRouterPc from '../../../images/logo/at-setup-router-pc.png';
import SetupDutLaptop from '../../../images/logo/at-setup-dut-laptop.png';
import SetupDutPeerTerminal from '../../../images/logo/at-setup-dut-peer-terminal.png';
import SetupSsh from '../../../images/logo/at-setup-ssh.png';
import SetupTacacs from '../../../images/logo/at-setup-tacacs.png';
import SetupDut2PeerTerminal from '../../../images/logo/at-setup-dut-2peer-terminal.png';
import SetupVrf from '../../../images/logo/at-setup-vrf.png';
import SetupL2vpn from '../../../images/logo/at-setup-l2vpn.png';
import SetupSrMpls from '../../../images/logo/at-setup-srmpls.png';
import { ATRouterData } from '../../../types/block-router-checklist';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const ImgbaseUrl = import.meta.env.VITE_Image_URL;

const DOC_CODE = 'ABP/AT/BLRT/001, Ver1.0';

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

interface BasicCheckItem {
  id: string;
  testCaseNo: string;
  description: string;
  procedure: string;
  iconBg: string;
  iconColor: string;
}
interface BasicCheckFormItem extends BasicCheckItem {
  compliance: string;
  remarks: string;
  images: UploadedFile[];
  documents: UploadedFile[];
}

interface NetworkTestItem {
  id: string;
  testNo: string;
  title: string;
  testDetails: string;
  testInstruments: string;
  testSetup: string;
  testSetupImage: string;
  testProcedure: string[];
  testLimits: string;
  expectedResults: string[];
  iconBg: string;
  iconColor: string;
}
interface NetworkTestFormItem extends NetworkTestItem {
  testConfiguration: string;
  testResults: string;
  status: string;
  remarks: string;
  images: UploadedFile[];
  documents: UploadedFile[];
}

interface ATBlockRouterFormProps {
  blockId: string;
  existingData?: ATRouterData | null;
  blockName: string;
  onBack: () => void;
}

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
  { key: 'oemApproval', label: 'OEM Approval of BSNL' },
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

// Basic pre-AT checks - section "4" of ABP/AT/BLRT/001
const basicCheckTestsRaw: Omit<BasicCheckItem, 'iconBg' | 'iconColor'>[] = [
  {
    id: 'T1',
    testCaseNo: '4(a)',
    description:
      "Router serial number and it's TSEC and QA certificate: Check whether TSEC is available for this model number of Router. Check whether QA certificate is available for the Router serial number.",
    procedure:
      'Verify TSEC and QA certificate availability for the router model and serial number.',
  },
  {
    id: 'T2',
    testCaseNo: '4(b)',
    description:
      'Check whether the following condition is qualified: "If the items mentioned herein are not dispatched within 15 days from the date of Dispatch Advice, they shall be re-offered for inspection to BSNL-QA."',
    procedure: 'Verify dispatch timeline compliance with BSNL-QA requirements.',
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
      'Access router CLI and verify all ports status using: show interface status, show ip interface brief.',
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
      'Activation/Deactivation of Router through a CLI command from SNOC should be available.',
    procedure:
      'Test router activation/deactivation via CLI command from SNOC. Verify remote management capability.',
  },
];

const basicCheckTests: BasicCheckItem[] = basicCheckTestsRaw.map((tc, i) => ({
  ...tc,
  ...COLORS[i % COLORS.length],
}));

// Test Setup diagrams are static per test type (same topology used for every AT session)
const SETUP_IMAGE_BY_ID: Record<string, string> = {
  N1: SetupRouterPc,
  N2: SetupDutLaptop,
  N2A: SetupDutLaptop,
  N3: SetupDutPeerTerminal,
  N4: SetupDutPeerTerminal,
  N5: SetupDutPeerTerminal,
  N6: SetupDutPeerTerminal,
  N7: SetupDutPeerTerminal,
  N8: SetupSsh,
  N9: SetupTacacs,
  N10: SetupDutPeerTerminal,
  N11: SetupDutPeerTerminal,
  N12: SetupDutPeerTerminal,
  N13: SetupDutPeerTerminal,
  N14: SetupDut2PeerTerminal,
  N15: SetupDut2PeerTerminal,
  N16: SetupDutPeerTerminal,
  N17: SetupVrf,
  N18: SetupL2vpn,
  N20: SetupSrMpls,
};

// Network configuration tests - sections 4.1 - 4.19 of ABP/AT/BLRT/001
const networkTestsRaw: Omit<NetworkTestItem, 'iconBg' | 'iconColor' | 'testSetupImage'>[] = [
  {
    id: 'N1',
    testNo: '1',
    title: 'Verification of Router BOM as per RFP Requirements',
    testDetails: 'Verification of the router BOM as specified in the RFP.',
    testInstruments: 'Router, PC',
    testSetup: 'Router (DUT) connected to a Remote Machine.',
    testProcedure: ['Verify the BOM, by physical inspection and through CLI.'],
    testLimits: 'NA',
    expectedResults: ['Verified the Router BOM as per RFP.'],
  },
  {
    id: 'N2',
    testNo: '2',
    title: 'Hot Swappable Power Supply Unit Redundancy Checking',
    testDetails: 'Redundancy - PSU',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected to a Laptop for continuous ping.',
    testProcedure: [
      'Run the extended ping command between Router and laptop (from site/SNOC workstation).',
      'Remove 1 PSU, observe the ping.',
      'Re-insert the PSU. Observe the ping.',
      'Repeat by removing the other PSU.',
      'Check if the alert is visible in EMS/NMS.',
    ],
    testLimits: 'NA',
    expectedResults: ['Ping should continue while removing and re-inserting the PSU.'],
  },
  {
    id: 'N2A',
    testNo: '2A',
    title: 'Hot Swappable Fan Redundancy - High Availability',
    testDetails: 'Redundancy - Fan',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected to a Laptop.',
    testProcedure: [
      'Remove 1 fan module.',
      'Check if router reboots (router must not reboot).',
      'Insert the removed module.',
      'Repeat for the other fans.',
      'Check if the alert is visible in EMS/NMS at SNOC.',
    ],
    testLimits: 'NA',
    expectedResults: ['Check through CLI commands.'],
  },
  {
    id: 'N3',
    testNo: '3',
    title: '1G/10G Ethernet Link Bring Up (As Applicable)',
    testDetails: '1G/10G/100G Ethernet Link Bring-Up (As Applicable)',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to peer router, with Test Terminal.',
    testProcedure: ['Connect the physical port of routers using fiber.'],
    testLimits: 'NA',
    expectedResults: [
      "Verify that link comes up on both routers. In case of Block router, the other router can be BSNL Router providing ILL/DCN.",
      "Link status should show 'up' and speed as 1G/10G.",
      'Check if the link status up/down is visible in EMS/NMS.',
    ],
  },
  {
    id: 'N4',
    testNo: '4',
    title: 'Loopback Interface Tests',
    testDetails: 'Loopback interface Tests',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to peer router, with Test Terminal.',
    testProcedure: [
      'Configure loopback interfaces on routers.',
      'Configure the IP Address on physical interfaces.',
      'Add to IGP for loopback reachability.',
    ],
    testLimits: 'NA',
    expectedResults: [
      'Loopbacks are reachable from CLI command locally or SNOC.',
      'Ping is successful.',
    ],
  },
  {
    id: 'N5',
    testNo: '5',
    title: 'iBGP / eBGP',
    testDetails: 'iBGP / eBGP',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to BSNL Router, with Test Terminal.',
    testProcedure: [
      'Configure IP addresses on physical interfaces.',
      'Configure the loopback and assign the IP address.',
      'Configure BGP neighbour-ship. BSNL ILL/DCN Router can be used for this purpose.',
      'Set local/remote AS numbers.',
    ],
    testLimits: 'NA',
    expectedResults: [
      'iBGP/eBGP neighborship is established.',
      'Routes are exchanged successfully.',
    ],
  },
  {
    id: 'N6',
    testNo: '6',
    title: 'BFD (Fast Failure Detection)',
    testDetails: 'BFD (Fast Failure Detection)',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to peer router, with Test Terminal.',
    testProcedure: [
      'Configure IP addresses.',
      'Configure the loopback and assign the IP address.',
      'Configure the IGP protocol and advertise the interfaces.',
      'Enable BFD for all ISIS/OSPF interfaces.',
    ],
    testLimits: 'NA',
    expectedResults: ['BFD session comes up.'],
  },
  {
    id: 'N7',
    testNo: '7',
    title: 'Jumbo Frames / MTU Tests',
    testDetails: 'Jumbo Frames / MTU Tests',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to peer router, with Test Terminal.',
    testProcedure: [
      'Configure interfaces to support jumbo frames (9600 bytes).',
      'Send large ICMP packets (e.g., 9000 bytes).',
    ],
    testLimits: 'NA',
    expectedResults: ['Ping with large size is successful.'],
  },
  {
    id: 'N8',
    testNo: '8',
    title: 'SSH/Telnet, FTP/SCP Support',
    testDetails:
      'The Router shall support SSH/Telnet access to the LAN and FTP/SCP access to its configuration/boot files.',
    testInstruments: 'Routers, PC and Ethernet cable.',
    testSetup: 'DUT connected via SSH to a Remote Machine.',
    testProcedure: [
      'Enable SSH/Telnet access to the router.',
      'Enable FTP/SCP access.',
    ],
    testLimits: 'NA',
    expectedResults: [
      'Verify router supports SSH/Telnet access.',
      'Verify router supports FTP/SCP access.',
    ],
  },
  {
    id: 'N9',
    testNo: '9',
    title: 'TACACS Testing',
    testDetails:
      'Integration with TACACS server & login using TACACS user and fall-back user.',
    testInstruments: 'Routers, PC and Ethernet cable.',
    testSetup: 'TACACS server reachable via BSNL Network from DUT (Block), with Test Terminal.',
    testProcedure: [
      'Configure the IP address on the router.',
      'Configure the routing protocol to make TACACS reachable from DUT.',
      'Configure the TACACS server.',
    ],
    testLimits: 'NA',
    expectedResults: [
      'Verify local admin user is unable to login and same is recorded in AAA Server.',
      'Verify TACACS user is able to login and same is recorded in AAA Server.',
    ],
  },
  {
    id: 'N10',
    testNo: '10',
    title: 'LLDP Neighbour Discovery',
    testDetails: 'LLDP Neighbour Discovery',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to peer router, with Test Terminal.',
    testProcedure: [
      'Connect the physical port of routers using fiber.',
      'Enable LLDP globally.',
      'Enable LLDP on interfaces.',
    ],
    testLimits: 'NA',
    expectedResults: [
      'LLDP neighborship is established.',
      'Neighbor details are visible in LLDP table.',
    ],
  },
  {
    id: 'N11',
    testNo: '11',
    title: 'VLAN-based Sub-interfaces',
    testDetails: 'VLAN-based Sub-interfaces',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to peer router, with Test Terminal.',
    testProcedure: [
      'Create VLAN sub-interfaces on both routers.',
      'Assign IP addresses to VLAN interfaces.',
    ],
    testLimits: 'NA',
    expectedResults: [
      'VLAN interfaces are up.',
      'Ping between VLAN interfaces is successful.',
    ],
  },
  {
    id: 'N12',
    testNo: '12',
    title: 'ISIS/OSPF',
    testDetails: 'ISIS/OSPF',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to peer router, with Test Terminal.',
    testProcedure: [
      'Configure IP addresses on interfaces.',
      'Enable ISIS/OSPF and advertise interfaces.',
      'Configure the LDP/RSVP and bind the LDP/RSVP under interfaces.',
    ],
    testLimits: 'NA',
    expectedResults: [
      'ISIS/CLNS (or) OSPF neighbour must be up.',
      'Routing table should reflect learned prefixes.',
      'Ping across ISIS/OSPF routers should be successful.',
    ],
  },
  {
    id: 'N13',
    testNo: '13',
    title: 'ISIS/OSPF MD5 Authentication',
    testDetails: 'ISIS/OSPF MD5 Authentication',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to peer router, with Test Terminal.',
    testProcedure: [
      'Configure the IP under the interfaces.',
      'Configure the ISIS/OSPF and advertise the interfaces.',
      'Enable MD5 on ISIS/OSPF interfaces.',
      'Use matching keys on both sides.',
    ],
    testLimits: 'NA',
    expectedResults: ['ISIS/OSPF adjacency forms successfully with MD5 authentication.'],
  },
  {
    id: 'N14',
    testNo: '14',
    title: 'MPLS LDP/RSVP Ping & Traceroute',
    testDetails: 'MPLS LDP/RSVP Ping & Traceroute',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to two peer routers, with Test Terminal.',
    testProcedure: [
      'Configure the IP under the interfaces.',
      'Configure the Loopback and assign the interfaces.',
      'Configure the IGP protocol and make the Loopback reachable.',
      'Configure the LDP/RSVP.',
      'Enable MPLS and LDP/RSVP under the interfaces.',
      'Check the MPLS LDP/RSVP ping & traceroute the path.',
    ],
    testLimits: 'NA',
    expectedResults: ['MPLS LDP/RSVP ping & traceroute should work.'],
  },
  {
    id: 'N15',
    testNo: '15',
    title: 'LDP MD5 / Authentication',
    testDetails: 'LDP MD5 / Authentication',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to two peer routers, with Test Terminal.',
    testProcedure: [
      'Configure the IP under the interfaces.',
      'Configure the Loopback and assign the interfaces.',
      'Configure the IGP protocol and make the Loopback reachable.',
      'Configure the LDP/RSVP.',
      'Enable MPLS and LDP/RSVP on interfaces.',
      'Enable LDP/RSVP authentication with keys.',
      'Verify both routers use same credentials.',
    ],
    testLimits: 'NA',
    expectedResults: ['LDP sessions form securely.'],
  },
  {
    id: 'N16',
    testNo: '16',
    title: 'BGP MD5 Authentication',
    testDetails: 'BGP MD5 Authentication',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'DUT connected via 1/10G to peer router, with Test Terminal.',
    testProcedure: [
      'Configure IP addresses on physical interfaces.',
      'Configure the loopback and assign the IP address.',
      'Configure BGP neighbours.',
      'Set local/remote AS numbers.',
      'Configure MD5 keys on both BGP peers.',
    ],
    testLimits: 'NA',
    expectedResults: ['Session only comes up with the correct keys.'],
  },
  {
    id: 'N17',
    testNo: '17',
    title: 'VRF Configuration & L3VPN',
    testDetails: 'VRF Configuration / L3VPN',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs',
    testSetup: 'GP (RR Client) - DUT (RR) - GP (RR Client), with Test Terminal.',
    testProcedure: [
      'Configure the IP address and assign under interfaces.',
      'Configure the Loopback and assign the IP address.',
      'Configure the IGP protocol and advertise under interfaces.',
      'Configure the BGP and establish the neighbour-ship.',
      'Create VRFs on both routers.',
      'Bind the VRF under the physical interfaces.',
      "Advertise the L3VPN and VRF's under BGP.",
    ],
    testLimits: 'NA',
    expectedResults: ['VPNv4 routes are exchanged.', 'Ping the VRF IP address.'],
  },
  {
    id: 'N18',
    testNo: '18',
    title: 'L2 VPN',
    testDetails: 'L2 VPN',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs.',
    testSetup: 'GP - L2 Tunnel - DUT (Block), with Test Terminals on both ends.',
    testProcedure: [
      'Configure the IP address and assign under interfaces.',
      'Configure the Loopback and assign the IP address.',
      'Configure the IGP protocol and advertise under interfaces.',
      'Configure the LDP globally.',
      'Enable the LDP under the interfaces.',
      'Configure the L2VPN and bind under interfaces.',
    ],
    testLimits: 'NA',
    expectedResults: [
      'L2VPN comes up and is UP.',
      'End to end ping works fine between test terminals.',
    ],
  },
  {
    id: 'N20',
    testNo: '20',
    title: 'Segment Routing (SR-MPLS)',
    testDetails: 'Segment Routing (SR-MPLS)',
    testInstruments: 'Routers, SFPs, Fibre Cables, PCs.',
    testSetup: 'DUT (RR) connected to GP1 and GP-N, with a ring of GP2...GP5, and Test Terminal.',
    testProcedure: [
      'Configure the IP address and assign under interfaces.',
      'Configure the Loopback and assign the IP address.',
      'Configure the IGP protocol and advertise under interfaces.',
      'Configure SRGB and SIDs on routers.',
      'Enable IS-IS/OSPF with SR extensions.',
    ],
    testLimits: 'NA',
    expectedResults: [
      'SR-Ping returns the expected SID path.',
      'SR-Traceroute shows correct segment hops.',
    ],
  },
];

const networkTests: NetworkTestItem[] = networkTestsRaw.map((tc, i) => ({
  ...tc,
  ...COLORS[i % COLORS.length],
  testSetupImage: SETUP_IMAGE_BY_ID[tc.id] || '',
}));

const ATBlockRouterForm = ({
  blockId,
  existingData,
  blockName,
  onBack,
}: ATBlockRouterFormProps) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'network'>(
    'basic',
  );
  const [memorandum, setMemorandum] = useState({
    equipmentDescription: '',
    siteNameLGD: '',
    siteAddress: '',
    routerHostname: '',
    wanInterfaceIp: '',
    dateTime: '',
  });
  const [networkDiagramFile, setNetworkDiagramFile] =
    useState<UploadedFile | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<UploadedFile | null>(null);
  const [certificationFiles, setCertificationFiles] = useState<
    Record<CertificationKey, UploadedFile | null>
  >({
    tsecCertificate: null,
    qaCertificate: null,
    qrCodeLogo: null,
    photoEvidence: null,
    oemApproval: null,
  });
  const [basicItems, setBasicItems] = useState<BasicCheckFormItem[]>(
    basicCheckTests.map((tc) => ({
      ...tc,
      compliance: '',
      remarks: '',
      images: [],
      documents: [],
    })),
  );
  const [networkItems, setNetworkItems] = useState<NetworkTestFormItem[]>(
    networkTests.map((tc) => ({
      ...tc,
      testConfiguration: '',
      testResults: '',
      status: '',
      remarks: '',
      images: [],
      documents: [],
    })),
  );
  const [expandedBasicId, setExpandedBasicId] = useState<string | null>('T1');
  const [expandedNetworkId, setExpandedNetworkId] = useState<string | null>(
    'N1',
  );
  const [submitting, setSubmitting] = useState(false);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    if (existingData?.memorandum) {
      setMemorandum(existingData.memorandum);
    }
    if (existingData?.memorandumFiles?.networkDiagram) {
      const url = existingData.memorandumFiles.networkDiagram;
      setNetworkDiagramFile({
        id: 'existing-network-diagram',
        preview: getFullImageUrl(url),
        url,
        isDocument: !isImageFile(undefined, url),
      });
    }
    if (existingData?.memorandumFiles?.qrCode) {
      const url = existingData.memorandumFiles.qrCode;
      setQrCodeFile({
        id: 'existing-qr-code',
        preview: getFullImageUrl(url),
        url,
        isDocument: !isImageFile(undefined, url),
      });
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
    if (existingData?.basic) {
      setBasicItems(
        basicCheckTests.map((tc) => {
          const testData = existingData.basic?.[tc.id];
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
        }),
      );
    }
    if (existingData?.network) {
      setNetworkItems(
        networkTests.map((tc) => {
          const testData = existingData.network?.[tc.id];
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
              testConfiguration: testData.testConfiguration || '',
              testResults: testData.testResults || '',
              status:
                testData.status === 'Pass' || testData.status === 'Fail'
                  ? testData.status
                  : '',
              remarks: testData.remarks || '',
              images: existingImages,
              documents: existingDocs,
            };
          }
          return {
            ...tc,
            testConfiguration: '',
            testResults: '',
            status: '',
            remarks: '',
            images: [],
            documents: [],
          };
        }),
      );
    }
  }, [existingData]);

  const handleBasicCompliance = (id: string, value: string) => {
    setBasicItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, compliance: value } : item,
      ),
    );
  };
  const handleBasicRemarks = (id: string, value: string) => {
    setBasicItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, remarks: value } : item)),
    );
  };
  const handleBasicFileUpload = (
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
    setBasicItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [type]: [...item[type], ...newFiles] }
          : item,
      ),
    );
  };
  const removeBasicFile = (
    itemId: string,
    type: 'images' | 'documents',
    fileId: string,
  ) => {
    setBasicItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const fileToRemove = item[type].find((f) => f.id === fileId);
          if (fileToRemove?.file) URL.revokeObjectURL(fileToRemove.preview);
          return { ...item, [type]: item[type].filter((f) => f.id !== fileId) };
        }
        return item;
      }),
    );
  };

  const handleNetworkField = (
    id: string,
    field: 'testConfiguration' | 'testResults' | 'remarks',
    value: string,
  ) => {
    setNetworkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };
  const handleNetworkStatus = (id: string, value: string) => {
    setNetworkItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: value } : item)),
    );
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

  const handleNetworkDiagramUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const uploaded = singleFileFromInput(event);
    if (uploaded) setNetworkDiagramFile(uploaded);
  };
  const removeNetworkDiagramFile = () => {
    if (networkDiagramFile?.file) URL.revokeObjectURL(networkDiagramFile.preview);
    setNetworkDiagramFile(null);
  };

  const handleQrCodeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = singleFileFromInput(event);
    if (uploaded) setQrCodeFile(uploaded);
  };
  const removeQrCodeFile = () => {
    if (qrCodeFile?.file) URL.revokeObjectURL(qrCodeFile.preview);
    setQrCodeFile(null);
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
  const handleNetworkFileUpload = (
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
    setNetworkItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [type]: [...item[type], ...newFiles] }
          : item,
      ),
    );
  };
  const removeNetworkFile = (
    itemId: string,
    type: 'images' | 'documents',
    fileId: string,
  ) => {
    setNetworkItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const fileToRemove = item[type].find((f) => f.id === fileId);
          if (fileToRemove?.file) URL.revokeObjectURL(fileToRemove.preview);
          return { ...item, [type]: item[type].filter((f) => f.id !== fileId) };
        }
        return item;
      }),
    );
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images[]', file));
    const response = await fetch(`${BASEURL}/upload-image`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.data?.images || [];
  };

  const uploadDocs = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('docs[]', file));
    const response = await fetch(`${BASEURL}/upload-image`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.data?.docs || [];
  };

  const collectUrls = async (item: {
    images: UploadedFile[];
    documents: UploadedFile[];
  }): Promise<string> => {
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
    return allUrls.length > 0 ? `[${allUrls.join(',')}]` : '[]';
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
    const completedBasic = basicItems.filter((item) => item.compliance !== '');
    const completedNetwork = networkItems.filter((item) => item.status !== '');
    if (completedBasic.length === 0 && completedNetwork.length === 0) {
      alert('Please complete at least one test case before submitting');
      return false;
    }
    try {
      const basic: Record<
        string,
        { compliance: string; remarks: string; Image: string }
      > = {};
      for (const item of completedBasic) {
        basic[item.id] = {
          compliance: item.compliance,
          remarks: item.remarks,
          Image: await collectUrls(item),
        };
      }

      const network: Record<
        string,
        {
          status: string;
          testConfiguration: string;
          testResults: string;
          remarks: string;
          Image: string;
        }
      > = {};
      for (const item of completedNetwork) {
        network[item.id] = {
          status: item.status,
          testConfiguration: item.testConfiguration,
          testResults: item.testResults,
          remarks: item.remarks,
          Image: await collectUrls(item),
        };
      }

      const memorandumFiles = {
        networkDiagram: await uploadSingleFile(networkDiagramFile),
        qrCode: await uploadSingleFile(qrCodeFile),
      };

      const certificationFilesPayload: Record<string, string | undefined> = {};
      for (const { key } of CERTIFICATION_FIELDS) {
        certificationFilesPayload[key] = await uploadSingleFile(
          certificationFiles[key],
        );
      }

      const payload = {
        block_id: parseInt(blockId),
        memorandum,
        memorandumFiles,
        certificationFiles: certificationFilesPayload,
        basic,
        network,
      };
      const response = await fetch(
        `${TraceBASEURL}/upload-at-blockrouter-data`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) throw new Error('Failed to submit AT Router checklist');
      return true;
    } catch (error) {
      console.error('Error submitting AT Router checklist:', error);
      alert('Failed to submit AT Router checklist. Please try again.');
      return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const success = await submitData();
      if (success) {
        alert('AT Block Router checklist submitted successfully!');
        window.location.reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Print helpers (official ABP/AT/BLRT/001 template design) ──────────────

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

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const triggerPrint = async () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.');
      return;
    }

    printWindow.document
      .write(`<!DOCTYPE html><html><head><title>AT Block Router Report</title>
      <style>body{display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#64748b;font-size:15pt;}</style>
      </head><body>⏳ Preparing report, please wait…</body></html>`);
    printWindow.document.close();

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
    let networkDiagramBase64 = '';
    try {
      networkDiagramBase64 = await toBase64(NetworkDiagram as unknown as string);
    } catch (_) {
      /* skip */
    }

    const attachmentPages: string[] = [];

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

    const collectImagesHtml = async (
      images: UploadedFile[],
      labelPrefix: string,
    ): Promise<string> => {
      const thumbs = await Promise.all(
        images.map(async (img, index) => {
          let src = img.preview;
          try {
            src = img.file ? await toBase64(img.file) : await toBase64(img.preview);
          } catch (_) {}
          const label =
            img.file?.name || img.url?.split('/').pop() || `${labelPrefix}-image-${index + 1}`;
          attachmentPages.push(`
            <div class="attachment-page">
              <div class="attachment-label">${escapeHtml(labelPrefix)} - ${escapeHtml(label)}</div>
              <img src="${src}" alt="${escapeHtml(label)}" />
            </div>
          `);
          return `<div class="image-thumb"><img src="${src}" alt="evidence" crossorigin="anonymous"/></div>`;
        }),
      );
      return thumbs.length
        ? `<div class="images-grid">${thumbs.join('')}</div>`
        : '';
    };

    const basicRowsHtml = await Promise.all(
      basicItems.map(async (item) => {
        const imagesHtml = await collectImagesHtml(item.images, item.testCaseNo);
        return `
          <tr>
            <td class="cell-code">${item.testCaseNo}</td>
            <td class="cell-desc">${escapeHtml(item.description)}<div class="mini-procedure"><strong>Procedure: </strong>${escapeHtml(item.procedure)}</div>${item.remarks ? `<div class="mini-remarks"><strong>Remarks: </strong>${escapeHtml(item.remarks)}</div>` : ''}${imagesHtml}</td>
            <td class="cell-status ${item.compliance === 'Yes' ? 'status-pass' : item.compliance === 'No' ? 'status-fail' : ''}">${item.compliance || 'Pending'}</td>
          </tr>`;
      }),
    );

    const setupImageBase64Cache: Record<string, string> = {};
    for (const src of new Set(networkItems.map((i) => i.testSetupImage).filter(Boolean))) {
      try {
        setupImageBase64Cache[src] = await toBase64(src as unknown as string);
      } catch (_) {
        /* skip */
      }
    }

    const networkSectionsHtml = await Promise.all(
      networkItems.map(async (item) => {
        const imagesHtml = await collectImagesHtml(item.images, `Test ${item.testNo}`);
        const docsHtml = item.documents.length
          ? `<div class="docs-list">${item.documents
              .map((doc) => `<div class="doc-chip">📎 ${escapeHtml(doc.file?.name || doc.url?.split('/').pop() || 'document')}</div>`)
              .join('')}</div>`
          : '';
        const setupImageHtml = setupImageBase64Cache[item.testSetupImage]
          ? `<img class="setup-diagram" src="${setupImageBase64Cache[item.testSetupImage]}" alt="Test setup" />`
          : '';
        return `
        <table class="test-table">
          <tr><td class="th">Test No</td><td colspan="3">${item.testNo}</td></tr>
          <tr><td class="th">Test Details</td><td colspan="3">${escapeHtml(item.title)}${item.testDetails && item.testDetails !== item.title ? ` — ${escapeHtml(item.testDetails)}` : ''}</td></tr>
          <tr><td class="th">Test Instruments Required</td><td colspan="3">${escapeHtml(item.testInstruments)}</td></tr>
          <tr><td class="th">Test Setup</td><td colspan="3">${setupImageHtml}${escapeHtml(item.testSetup)}</td></tr>
          <tr><td class="th">Test Procedure</td><td colspan="3"><ul>${item.testProcedure.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul></td></tr>
          <tr><td class="th">Test Configuration</td><td colspan="3">${item.testConfiguration ? escapeHtml(item.testConfiguration) : '&nbsp;'}</td></tr>
          <tr><td class="th">Test Limits</td><td colspan="3">${escapeHtml(item.testLimits)}</td></tr>
          <tr><td class="th">Expected Results</td><td colspan="3"><ul>${item.expectedResults.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul></td></tr>
          <tr><td class="th">Test Results</td><td colspan="3">${item.testResults ? escapeHtml(item.testResults) : '&nbsp;'}${imagesHtml}${docsHtml}${item.remarks ? `<div class="mini-remarks"><strong>Remarks: </strong>${escapeHtml(item.remarks)}</div>` : ''}</td></tr>
          <tr><td class="th">Status</td><td colspan="3" class="${item.status === 'Pass' ? 'status-pass' : item.status === 'Fail' ? 'status-fail' : ''}">${item.status || 'Pending'}</td></tr>
        </table>`;
      }),
    );

    const tocSubHtml = networkTests
      .map((t) => `<li>4.${t.testNo} ${escapeHtml(t.title)}</li>`)
      .join('');
    const tocHtml = `
      <li>1. Introduction</li>
      <li>2. Acceptance Testing Network Diagram</li>
      <li>3. Acceptance Memorandum</li>
      <li>4. Acceptance Testing Test Cases
        <ul class="toc-sublist">${tocSubHtml}</ul>
      </li>
    `;

    const networkDiagramFileHtml = await fileSlotHtml(
      networkDiagramFile,
      'Block network diagram',
    );
    const qrCodeFileHtml = await fileSlotHtml(qrCodeFile, 'QR code');
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

    const completedBasic = basicItems.filter((i) => i.compliance !== '').length;
    const completedNetwork = networkItems.filter((i) => i.status !== '').length;
    const totalTests = basicItems.length + networkItems.length;
    const completedTests = completedBasic + completedNetwork;
    const passCount =
      basicItems.filter((i) => i.compliance === 'Yes').length +
      networkItems.filter((i) => i.status === 'Pass').length;
    const failCount =
      basicItems.filter((i) => i.compliance === 'No').length +
      networkItems.filter((i) => i.status === 'Fail').length;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>AT Block Router - ${escapeHtml(blockName)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
  body {
    font-family: 'Times New Roman', Georgia, serif;
    font-size: 10.5pt;
    color: #111827;
    background:#fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: A4; margin: 18mm 16mm 16mm 16mm; }

  .doc-header {
    display:flex; justify-content:flex-end; font-size:8.5pt; color:#374151;
    padding-bottom:6px; margin-bottom:14px; border-bottom:1px solid #cbd5e1;
  }
  .cover {
    text-align:center; padding: 30px 0 20px; page-break-after: always; break-after: page;
  }
  .cover img.cover-logo { height:64px; margin: 0 auto 14px; display:block; }
  .cover h1 { font-size:14pt; font-weight:700; margin-bottom:4px; margin-top:10px; }
  .cover p { font-size:11pt; max-width:620px; margin:6px auto 0; line-height:1.5; }

  .toc-page { page-break-after: always; break-after: page; }
  .toc-list { list-style:none; padding-left:0; font-size:10pt; line-height:2; color:#1e293b; }
  .toc-sublist { list-style:none; padding-left:22px; font-size:9.3pt; line-height:1.85; color:#475569; }

  .network-diagram {
    display:block; width:100%; max-width:640px; margin:10px auto 6px;
    border:1px solid #e2e8f0; border-radius:6px;
  }
  .setup-diagram {
    display:block; max-width:320px; margin-bottom:8px;
    border:1px solid #e2e8f0; border-radius:4px;
  }
  .memo-file-image {
    display:block; max-width:220px; max-height:160px; border:1px solid #e2e8f0; border-radius:4px;
  }

  h2.section-title {
    font-size:13pt; font-weight:700; margin:22px 0 10px; padding-bottom:4px;
    border-bottom:2px solid #1565c0; color:#0d47a1;
  }
  h3.sub-title { font-size:11pt; font-weight:700; margin:16px 0 8px; color:#1565c0; }
  p.intro-text { font-size:9.5pt; line-height:1.55; margin-bottom:10px; color:#1e293b; }

  table.memo-table, table.cert-table, table.test-table {
    width:100%; border-collapse:collapse; margin-bottom:14px; font-size:9.2pt;
  }
  table.memo-table td, table.cert-table td, table.test-table td {
    border:1px solid #94a3b8; padding:6px 8px; vertical-align:top;
  }
  table.memo-table td.label, table.cert-table td.label { width:28%; font-weight:600; background:#f1f5f9; }
  table.test-table td.th { width:22%; font-weight:700; background:#eff6ff; color:#0d47a1; }

  .sig-table { width:100%; border-collapse:collapse; margin-top:8px; }
  .sig-table td { border:1px solid #94a3b8; padding:14px 10px; width:33.33%; vertical-align:top; font-size:9pt; }
  .sig-table .sig-title { font-weight:700; margin-bottom:26px; display:block; }

  .mini-procedure, .mini-remarks { font-size:8.5pt; color:#475569; margin-top:4px; }
  .mini-remarks { color:#92400e; }
  .images-grid { display:flex; flex-wrap:wrap; gap:6px; margin-top:6px; }
  .image-thumb { width:70px; height:52px; border:1px solid #cbd5e1; border-radius:3px; overflow:hidden; }
  .image-thumb img { width:100%; height:100%; object-fit:cover; }
  .docs-list { margin-top:6px; }
  .doc-chip { font-size:8pt; color:#4338ca; }

  td.status-pass, .status-pass { color:#166534; font-weight:700; }
  td.status-fail, .status-fail { color:#b91c1c; font-weight:700; }

  .basic-table { width:100%; border-collapse:collapse; font-size:9pt; margin-bottom:16px; }
  .basic-table th { background:#0d47a1; color:#fff; padding:6px 8px; text-align:left; font-size:8.8pt; }
  .basic-table td { border:1px solid #cbd5e1; padding:6px 8px; vertical-align:top; }
  .cell-code { width:8%; font-weight:700; text-align:center; }
  .cell-status { width:12%; text-align:center; font-weight:700; }

  .test-table { page-break-inside: avoid; break-inside: avoid; }

  .attachment-page {
    page-break-before: always; break-before: page; page-break-inside: avoid;
    height: 245mm; border:1px solid #cbd5e1; display:flex; flex-direction:column; overflow:hidden;
  }
  .attachment-label { padding:7px 10px; font-size:8.5pt; font-weight:700; background:#f8fafc; border-bottom:1px solid #cbd5e1; }
  .attachment-page img { flex:1 1 auto; width:100%; height:100%; object-fit:contain; }

  .summary-bar { display:flex; gap:10px; margin-bottom:16px; }
  .summary-chip { flex:1; border:1px solid #cbd5e1; border-radius:6px; padding:8px; text-align:center; }
  .summary-chip .val { font-size:16pt; font-weight:700; }
  .summary-chip .lbl { font-size:8pt; color:#64748b; }

  .page-footer { margin-top:20px; padding-top:8px; border-top:1px solid #cbd5e1; font-size:8pt; color:#64748b; display:flex; justify-content:space-between; }
</style>
</head>
<body>

  <div class="doc-header">${DOC_CODE}</div>

  <div class="cover">
    ${bharatNetLogoBase64 ? `<img class="cover-logo" src="${bharatNetLogoBase64}" alt="BharatNet Logo" />` : ''}
    ${bsnlLogoBase64 ? `<img class="cover-logo" src="${bsnlLogoBase64}" alt="BSNL Logo" />` : ''}
    <h1>Bharat Sanchar Nigam Limited</h1>
    <p>Acceptance Testing Test Cases document for Block Router — ${escapeHtml(blockName)}<br/>as per BSNL Bharatnet Tender No. MM/BNO&M/BN-III/T-791/2024 issued on 15.02.2024</p>
  </div>

  <div class="toc-page">
    <h2 class="section-title" style="border-bottom:none;">Table of Contents</h2>
    <ul class="toc-list">${tocHtml}</ul>
  </div>

  <h2 class="section-title">1. Introduction</h2>
  <p class="intro-text">This document outlines the Acceptance Testing (A/T) procedures for IP/MPLS Block Routers, Type-A and Type-B, in accordance with the requirements of BSNL BharatNet Tender No. MM/BNO&M/BN-III/T-791/2024 dated 15.02.2024. It covers the applicable test cases in line with industry best practices, relevant specifications and standards, and includes the acceptance testing template for quality assurance in accordance with the requirements specified in the RFP.</p>

  <h2 class="section-title">2. Acceptance Testing Network Diagram</h2>
  <p class="intro-text">The following topology is used for the AT test cases execution:</p>
  ${networkDiagramBase64 ? `<img class="network-diagram" src="${networkDiagramBase64}" alt="Acceptance Testing Network Diagram" />` : ''}
  <p class="intro-text" style="margin-top:10px;">Note: The IP addresses and network diagram in Section 4 are for illustration only. All test scenarios will be executed using the actual network configuration.</p>

  <h2 class="section-title">3. Acceptance Memorandum</h2>
  <table class="memo-table">
    <tr><td class="label">Equipment description</td><td>${escapeHtml(memorandum.equipmentDescription) || '&nbsp;'}</td></tr>
    <tr><td class="label">Site Name with LGD code</td><td>${escapeHtml(memorandum.siteNameLGD) || escapeHtml(blockName)}</td></tr>
    <tr><td class="label">Site Address</td><td>${escapeHtml(memorandum.siteAddress) || '&nbsp;'}</td></tr>
    <tr><td class="label">Router hostname</td><td>${escapeHtml(memorandum.routerHostname) || '&nbsp;'}</td></tr>
    <tr><td class="label">Router WAN interface / loopback0 IP address</td><td>${escapeHtml(memorandum.wanInterfaceIp) || '&nbsp;'}</td></tr>
    <tr><td class="label">Date &amp; Time</td><td>${escapeHtml(memorandum.dateTime) || new Date().toLocaleString()}</td></tr>
    <tr><td class="label">Block network diagram along with rings and child-rings</td><td>${networkDiagramFileHtml}</td></tr>
    <tr><td class="label">QR code</td><td>${qrCodeFileHtml}</td></tr>
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

  <h3 class="sub-title">Certification Verification</h3>
  <p class="intro-text" style="font-size:8pt;color:#64748b;">TEC/GR 48050:2022 with latest amendments if any.</p>
  <table class="cert-table">
    <tr><td class="label">TSEC Certificate</td><td>${certFileHtml.tsecCertificate}</td></tr>
    <tr><td class="label">QA Certificate</td><td>${certFileHtml.qaCertificate}</td></tr>
    <tr><td class="label">QR Code, logo</td><td>${certFileHtml.qrCodeLogo}</td></tr>
    <tr><td class="label">Photo evidence</td><td>${certFileHtml.photoEvidence}</td></tr>
    <tr><td class="label">OEM approval of BSNL</td><td>${certFileHtml.oemApproval}</td></tr>
  </table>

  <h3 class="sub-title">Documentation Requirements</h3>
  <table class="cert-table">
    <tr>
      <td class="label">Documentation requirements</td>
      <td>
        <strong>Test 1:</strong> The contractor shall provide the following documents: system description documents; installation, operation and maintenance documents; training document; repair manual.<br/>
        <strong>Test 2:</strong> All technical documents shall be in English language both in CD-ROM and in hard copy. All necessary interfaces, connectors, connecting cables and accessories required for satisfactory installation and convenient operations shall be supplied. Type of connectors/adapters used shall conform to the interfaces defined in this GR.<br/>
        <em>*All the above documents are to be handed over only once per model no.</em>
      </td>
    </tr>
  </table>

  <div class="summary-bar">
    <div class="summary-chip"><div class="val">${totalTests}</div><div class="lbl">Total Tests</div></div>
    <div class="summary-chip"><div class="val" style="color:#166534">${passCount}</div><div class="lbl">Pass</div></div>
    <div class="summary-chip"><div class="val" style="color:#b91c1c">${failCount}</div><div class="lbl">Fail</div></div>
    <div class="summary-chip"><div class="val">${completedTests}/${totalTests}</div><div class="lbl">Completed</div></div>
  </div>

  <h2 class="section-title">4. Acceptance Testing Test Cases</h2>
  <h3 class="sub-title">Basic Pre-AT Checks</h3>
  <p class="intro-text">Following basic checks are to be done before starting the Router AT. If any of the below is not qualified and/or not available, then AT cannot proceed.</p>
  <table class="basic-table">
    <tr><th>Clause</th><th>Description / Procedure</th><th>Status</th></tr>
    ${basicRowsHtml.join('')}
  </table>

  <h3 class="sub-title">Network Configuration Tests</h3>
  ${networkSectionsHtml.join('')}

  <div class="page-footer">
    <span>AT Block Router Compliance — Block Name: ${escapeHtml(blockName)}</span>
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
        alert('AT Block Router checklist submitted successfully!');
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

  const basicCompletedCount = basicItems.filter((i) => i.compliance !== '').length;
  const networkCompletedCount = networkItems.filter((i) => i.status !== '').length;
  const totalCount = basicItems.length + networkItems.length;
  const totalCompleted = basicCompletedCount + networkCompletedCount;
  const progress = Math.round((totalCompleted / totalCount) * 100);

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
                AT Block Router Tests
              </h2>
              <p className="text-blue-100 text-sm">
                Acceptance Test - BSNL BharatNet Block Router Compliance
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
              {totalCompleted} / {totalCount} Tests Completed ({progress}%)
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
            placeholder="Equipment description (e.g. Router make/model)"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            value={memorandum.siteNameLGD}
            onChange={(e) =>
              setMemorandum((m) => ({ ...m, siteNameLGD: e.target.value }))
            }
            placeholder="Site name with LGD code"
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
            value={memorandum.routerHostname}
            onChange={(e) =>
              setMemorandum((m) => ({ ...m, routerHostname: e.target.value }))
            }
            placeholder="Router hostname"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            value={memorandum.wanInterfaceIp}
            onChange={(e) =>
              setMemorandum((m) => ({ ...m, wanInterfaceIp: e.target.value }))
            }
            placeholder="WAN interface / loopback0 IP address"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {renderFileSlot(
            'Block network diagram along with rings and child-rings',
            networkDiagramFile,
            'at-router-network-diagram-upload',
            handleNetworkDiagramUpload,
            removeNetworkDiagramFile,
          )}
          {renderFileSlot(
            'QR code',
            qrCodeFile,
            'at-router-qr-code-upload',
            handleQrCodeUpload,
            removeQrCodeFile,
          )}
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
                `at-router-cert-${key}`,
                (e) => handleCertificationUpload(key, e),
                () => removeCertificationFile(key),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveSection('basic')}
          className={`flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm md:text-base ${
            activeSection === 'basic'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-white text-gray-600 hover:bg-blue-50 border-2 border-gray-200'
          }`}
        >
          <Wrench className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Basic Pre-AT Checks</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20 flex-shrink-0">
            {basicCompletedCount}/{basicItems.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSection('network')}
          className={`flex-1 py-2.5 md:py-3 px-3 md:px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm md:text-base ${
            activeSection === 'network'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-white text-gray-600 hover:bg-blue-50 border-2 border-gray-200'
          }`}
        >
          <Network className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Network Configuration Tests</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/20 flex-shrink-0">
            {networkCompletedCount}/{networkItems.length}
          </span>
        </button>
      </div>

      {activeSection === 'basic' && (
        <div className="space-y-3">
          {basicItems.map((item) => {
            const isExpanded = expandedBasicId === item.id;
            const isCompleted = item.compliance !== '';
            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${isCompleted ? 'ring-2 ring-green-400' : ''}`}
              >
                <button
                  onClick={() => setExpandedBasicId(isExpanded ? null : item.id)}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`${item.iconBg} p-2 md:p-3 rounded-xl ${item.iconColor}`}>
                    <span className="text-lg font-bold">{item.testCaseNo}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-medium text-gray-800">
                      {item.description}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        isCompleted
                          ? item.compliance === 'Yes'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isCompleted ? item.compliance : 'Pending'}
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-full ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                    <div className={`p-3 rounded-lg ${item.iconBg}`}>
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
                          onClick={() => handleBasicCompliance(item.id, 'Yes')}
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
                          onClick={() => handleBasicCompliance(item.id, 'No')}
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
                        onChange={(e) => handleBasicRemarks(item.id, e.target.value)}
                        placeholder="Add any additional notes or remarks..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Image className="w-4 h-4" /> Upload Images
                        </label>
                        <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleBasicFileUpload(item.id, 'images', e)}
                            className="hidden"
                            id={`at-router-basic-images-${item.id}`}
                          />
                          <label
                            htmlFor={`at-router-basic-images-${item.id}`}
                            className="cursor-pointer"
                          >
                            <Camera className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-sm text-blue-600 font-medium">
                              Tap to upload images
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
                                  onClick={() => removeBasicFile(item.id, 'images', img.id)}
                                  className="absolute bottom-1 left-1 right-1 bg-red-500 text-white text-xs py-1 rounded-md flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={12} /> Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Upload Documents
                        </label>
                        <div className="border-2 border-dashed border-purple-200 rounded-xl p-4 text-center bg-purple-50/50 hover:bg-purple-50 transition-colors">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            multiple
                            onChange={(e) => handleBasicFileUpload(item.id, 'documents', e)}
                            className="hidden"
                            id={`at-router-basic-docs-${item.id}`}
                          />
                          <label
                            htmlFor={`at-router-basic-docs-${item.id}`}
                            className="cursor-pointer"
                          >
                            <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                            <p className="text-sm text-purple-600 font-medium">
                              Tap to upload documents
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
                                  <FileText size={16} className="text-purple-500 flex-shrink-0" />
                                  <span className="text-xs text-gray-700 truncate">
                                    {doc.file?.name || 'Document'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeBasicFile(item.id, 'documents', doc.id)}
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
      )}

      {activeSection === 'network' && (
        <div className="space-y-3">
          {networkItems.map((item) => {
            const isExpanded = expandedNetworkId === item.id;
            const isCompleted = item.status !== '';
            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 ${isCompleted ? 'ring-2 ring-green-400' : ''}`}
              >
                <button
                  onClick={() =>
                    setExpandedNetworkId(isExpanded ? null : item.id)
                  }
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className={`${item.iconBg} p-2 md:p-3 rounded-xl ${item.iconColor}`}>
                    <span className="text-lg font-bold">{item.testNo}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm md:text-base font-medium text-gray-800">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isCompleted
                            ? item.status === 'Pass'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {isCompleted ? item.status : 'Pending'}
                      </span>
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        {item.testInstruments}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`p-2 rounded-full ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                    <div className="p-3 rounded-lg bg-indigo-50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Test Details
                      </p>
                      <p className="text-sm text-gray-700">{item.testDetails}</p>
                    </div>

                    <div className={`p-3 rounded-lg ${item.iconBg}`}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Test Instruments Required
                      </p>
                      <p className="text-sm text-gray-700">{item.testInstruments}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Test Setup
                      </p>
                      {item.testSetupImage && (
                        <img
                          src={item.testSetupImage}
                          alt={`Test setup - ${item.title}`}
                          className="max-w-full sm:max-w-sm rounded-lg border border-gray-200 bg-white mb-2"
                        />
                      )}
                      <p className="text-sm text-gray-700">{item.testSetup}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-sky-50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Test Procedure
                      </p>
                      <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                        {item.testProcedure.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Test Configuration
                      </label>
                      <textarea
                        value={item.testConfiguration}
                        onChange={(e) =>
                          handleNetworkField(item.id, 'testConfiguration', e.target.value)
                        }
                        placeholder="Enter the configuration applied for this test (CLI snippet, parameters, etc.)"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none font-mono"
                        rows={3}
                      />
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Test Limits
                      </p>
                      <p className="text-sm text-gray-700">{item.testLimits}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-green-50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Expected Results
                      </p>
                      <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                        {item.expectedResults.map((p, i) => (
                          <li key={i}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Test Results
                      </label>
                      <textarea
                        value={item.testResults}
                        onChange={(e) =>
                          handleNetworkField(item.id, 'testResults', e.target.value)
                        }
                        placeholder="Enter observed test output / CLI results"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none font-mono"
                        rows={3}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Status</p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleNetworkStatus(item.id, 'Pass')}
                          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                            item.status === 'Pass'
                              ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                          }`}
                        >
                          <CheckCircle
                            className={`w-5 h-5 mx-auto mb-1 ${item.status === 'Pass' ? '' : 'text-gray-400'}`}
                          />
                          Pass
                        </button>
                        <button
                          onClick={() => handleNetworkStatus(item.id, 'Fail')}
                          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                            item.status === 'Fail'
                              ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
                          }`}
                        >
                          <X
                            className={`w-5 h-5 mx-auto mb-1 ${item.status === 'Fail' ? '' : 'text-gray-400'}`}
                          />
                          Fail
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
                          handleNetworkField(item.id, 'remarks', e.target.value)
                        }
                        placeholder="Add any additional notes or remarks..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Image className="w-4 h-4" /> Upload Screenshots / Images
                        </label>
                        <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 text-center bg-blue-50/50 hover:bg-blue-50 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleNetworkFileUpload(item.id, 'images', e)}
                            className="hidden"
                            id={`at-router-network-images-${item.id}`}
                          />
                          <label
                            htmlFor={`at-router-network-images-${item.id}`}
                            className="cursor-pointer"
                          >
                            <Camera className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-sm text-blue-600 font-medium">
                              Tap to upload screenshots
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
                                  onClick={() => removeNetworkFile(item.id, 'images', img.id)}
                                  className="absolute bottom-1 left-1 right-1 bg-red-500 text-white text-xs py-1 rounded-md flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={12} /> Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Upload Documents
                        </label>
                        <div className="border-2 border-dashed border-purple-200 rounded-xl p-4 text-center bg-purple-50/50 hover:bg-purple-50 transition-colors">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            multiple
                            onChange={(e) => handleNetworkFileUpload(item.id, 'documents', e)}
                            className="hidden"
                            id={`at-router-network-docs-${item.id}`}
                          />
                          <label
                            htmlFor={`at-router-network-docs-${item.id}`}
                            className="cursor-pointer"
                          >
                            <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                            <p className="text-sm text-purple-600 font-medium">
                              Tap to upload documents
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
                                  <FileText size={16} className="text-purple-500 flex-shrink-0" />
                                  <span className="text-xs text-gray-700 truncate">
                                    {doc.file?.name || 'Document'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeNetworkFile(item.id, 'documents', doc.id)}
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
      )}

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
              Submit AT Router Checklist
              <span
                className="ml-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {totalCompleted}/{totalCount}
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
              <Printer size={18} /> Print / PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ATBlockRouterForm;
