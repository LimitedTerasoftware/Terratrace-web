// Print template for the AT Block Router checklist.
//
// Reproduces "Final AT template for Block router.docx" (ABP/AT/BLRT/001, Ver1.0)
// page-for-page. All geometry comes from that document:
//   - page size / margins / header / footer: the DOCX section properties
//   - table column widths and row heights: the DOCX table grid (twips)
//   - vertical positions (`base` = text baseline, `top`/`bottom` = table rules, in pt
//     from the top edge of the page) and x positions (pt from the left edge of the page):
//     measured from Word's own rendering of the DOCX.
// Each `page(...)` call below corresponds to one page of the DOCX, in order.
// Only the values entered in the AT Block Router form are dynamic.

import type { CertificationKey } from '../forms/ATBlockRouter';
import BharatNetLogo from '../../../images/logo/bharatnet-logo.jpg';
import BsnlLogo from '../../../images/logo/bsnl-logo.jpg';
import NetworkDiagram from '../../../images/at-block-router/network-diagram.png';
import SetupBrRemoteMachine from '../../../images/at-block-router/setup-br-remote-machine.png';
import SetupDutLaptop from '../../../images/at-block-router/setup-dut-laptop.jpeg';
import SetupDutTestTerminal from '../../../images/at-block-router/setup-dut-test-terminal.jpeg';
import SetupDutBsnlRouter from '../../../images/at-block-router/setup-dut-bsnl-router.jpeg';
import SetupSsh from '../../../images/at-block-router/setup-ssh.png';
import SetupTacacs from '../../../images/at-block-router/setup-tacacs.png';
import SetupMplsLdp from '../../../images/at-block-router/setup-mpls-ldp.jpeg';
import SetupLdpMd5 from '../../../images/at-block-router/setup-ldp-md5.jpeg';
import SetupVrfL3vpn from '../../../images/at-block-router/setup-vrf-l3vpn.jpeg';
import SetupL2vpn from '../../../images/at-block-router/setup-l2vpn.jpeg';
import SetupSrMpls from '../../../images/at-block-router/setup-sr-mpls.jpeg';

import {
  BASE_STYLES,
  Block,
  CELL_SCALE,
  CAMBRIA_ASCENT,
  Cell,
  FALLBACK_FONTS_LINK,
  FOOTER_FONT_FACES,
  LINE_11,
  PrintFile,
  TableGeometry,
  annexurePages,
  bullets,
  cellText,
  createAttachments,
  esc,
  flow,
  image,
  inlineValue,
  linesHtml,
  loadImages,
  makeText,
  marginBoxes,
  n,
  numbered,
  tabColon,
  table,
} from './printEngine';

export { printHtmlDocument } from './printEngine';
export type { PrintFile } from './printEngine';

export const DOC_CODE = 'ABP/AT/BLRT/001, Ver1.0';

// ─── Data contract ──────────────────────────────────────────────────────────

export interface ATBlockRouterPrintData {
  blockName: string;
  memorandum: {
    equipmentDescription: string;
    siteNameLGD: string;
    siteAddress: string;
    routerHostname: string;
    wanInterfaceIp: string;
    dateTime: string;
  };
  networkDiagram: PrintFile | null;
  qrCode: PrintFile | null;
  certifications: Record<CertificationKey, PrintFile | null>;
  basic: Record<string, { compliance: string; remarks: string; files: PrintFile[] }>;
  network: Record<
    string,
    {
      status: string;
      testConfiguration: string;
      testResults: string;
      remarks: string;
      files: PrintFile[];
    }
  >;
  images: TemplateImages;
}

export const TEMPLATE_IMAGE_SOURCES = {
  bharatNetLogo: BharatNetLogo,
  bsnlLogo: BsnlLogo,
  networkDiagram: NetworkDiagram,
  brRemoteMachine: SetupBrRemoteMachine,
  dutLaptop: SetupDutLaptop,
  dutTestTerminal: SetupDutTestTerminal,
  dutBsnlRouter: SetupDutBsnlRouter,
  ssh: SetupSsh,
  tacacs: SetupTacacs,
  mplsLdp: SetupMplsLdp,
  ldpMd5: SetupLdpMd5,
  vrfL3vpn: SetupVrfL3vpn,
  l2vpn: SetupL2vpn,
  srMpls: SetupSrMpls,
} as const;

export type TemplateImages = Record<keyof typeof TEMPLATE_IMAGE_SOURCES, string>;

/** Resolves every template image through `toDataUrl` so the print window is self-contained. */
export const loadTemplateImages = (toDataUrl: (src: string) => Promise<string>): Promise<TemplateImages> =>
  loadImages<keyof typeof TEMPLATE_IMAGE_SOURCES>(TEMPLATE_IMAGE_SOURCES, toDataUrl);

// ─── Page geometry (from the DOCX) ──────────────────────────────────────────

const PAGE_TOP = 56; // pgMar top 1120
const PAGE_LEFT = 63.75; // pgMar left 1275
const PAGE_RIGHT = 574.25; // 595.5 - pgMar right 425

const { text, textHtml } = makeText({ x: 72.0, right: PAGE_RIGHT });

// Standard test-table geometries (by w:tblInd), 0.25pt borders unless noted.
const T60 = (cols = [2425, 7568]): TableGeometry => ({ x: 66.3, cols, border: 0.5, pad: 105 });
const T112 = (cols = [2425, 7568]): TableGeometry => ({ x: 69.0, cols, border: 0.25, pad: 55 });
const T115 = (cols = [2425, 7568]): TableGeometry => ({ x: 69.1, cols, border: 0.25, pad: 57 });
const T161 = (cols: number[]): TableGeometry => ({ x: 71.1, cols, border: 0.75, pad: 11 });

const INSTRUMENTS = ['Test Instruments', 'Required'];

// Unbulleted lines (TACACS table), top-aligned.
const plainLines = (lines: string[]): Cell => ({ html: cellText(lines), valign: 'top', pad: 6 });

/** Test-setup diagram, `left`/`top` pt from the cell's left edge / top rule. */
const setup = (src: string, width: number, height: number, left: number, top: number): Cell => ({
  html: `<img src="${src}" alt="" style="width:${width}pt;height:${height}pt;margin-left:${left}pt" />`,
  pad: 0,
  valign: 'top',
  padTop: Math.round(top * 20),
});

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = (docCode: string) => `${FOOTER_FONT_FACES}

  @page {
    size: A4;
    margin: ${PAGE_TOP}pt 21.25pt 61pt ${PAGE_LEFT}pt;${marginBoxes({
      docCode,
      headerLeft: 331,
      headerTop: 35.64,
      footerLeft: 198.43,
      footerTop: 0.98,
    })}
  }
${BASE_STYLES}
  @media screen {
    body { width: ${n(PAGE_RIGHT - PAGE_LEFT)}pt; margin: ${PAGE_TOP}pt auto; }
    .page + .page { margin-top: ${PAGE_TOP + 61}pt; }
  }
  .run-a { position: absolute; top: -0.85pt; font-size: 12pt; transform: scaleX(1.1); transform-origin: 0 0; }
  .result { text-align: center; }
  .cert-files { padding-left: 5.5pt; text-align: left; }
  .annex { height: 720pt; }
`;

// ─── Document ───────────────────────────────────────────────────────────────

export const buildATBlockRouterPrintHtml = (data: ATBlockRouterPrintData): string => {
  const { memorandum: memo, images: img } = data;
  const attach = createAttachments();

  // Values for the numbered network tests (keyed by the form's test ids).
  const network = (id: string) =>
    data.network[id] ?? { status: '', testConfiguration: '', testResults: '', remarks: '', files: [] };

  const configCell = (id: string): Cell => {
    const value = network(id).testConfiguration;
    return value ? { html: `<div class="val-cell val-block">${esc(value)}</div>`, valign: 'top' } : { html: '' };
  };

  // Entered results and remarks, followed by the evidence images inside the cell.
  const resultsCell = (id: string, testNo: string): Cell => {
    const t = network(id);
    const lines = [t.testResults, t.remarks].filter(Boolean).join('\n');
    const html =
      (lines ? `<div class="val-block">${esc(lines)}</div>` : '') +
      attach.html(t.files, `Test ${testNo} evidence`, 330);
    return html ? { html: `<div class="val-cell">${html}</div>`, valign: 'top' } : { html: '' };
  };

  // The recorded status replaces the template's "Pass / Fail".
  const statusCell = (id: string, pad?: number): Cell => {
    const status = network(id).status;
    return { html: linesHtml([status ? esc(status) : 'Pass / Fail'], 'left', CELL_SCALE), pad };
  };

  const label = (lines: string | string[]) => cellText(lines);

  // Section heading of a numbered test ("4.x  Title").
  const testHeading = (base: number, number: string, numberX: number, title: string, x: number, scale = 1.1) =>
    text(
      {
        base,
        x,
        bold: true,
        scale,
        marker: { text: number, x: numberX, font: "'Times New Roman', Tinos, serif", bold: false, scale: 1.11 },
      },
      [title],
    );

  const heading1 = (base: number, number: string, title: string) =>
    text(
      { base, x: 89.95, size: 18, scale: 1.1, marker: { text: number, x: 72.02, scale: 1.21 } },
      [title],
    );

  // Acceptance Memorandum item "a)  Label  : value" (f and g have no colon or value).
  const MEMO_MARKER_X = 108.05;
  const memoItem = (
    base: number,
    letter: string,
    labelText: string,
    textX: number,
    value: string,
    colonX: number | null,
  ) =>
    text(
      {
        base,
        x: textX,
        scale: 1.12,
        marker: { text: letter, x: MEMO_MARKER_X, scale: 0.78 },
        extra:
          colonX === null
            ? ''
            : tabColon(colonX - MEMO_MARKER_X) + inlineValue(value, colonX + 8 - MEMO_MARKER_X),
      },
      [labelText],
    );

  const basic = (id: string) => data.basic[id] ?? { compliance: '', remarks: '', files: [] };

  // Remarks of a pre-AT check, placed below it in the body text column.
  const checkEvidence = (id: string): string | false => {
    const { remarks } = basic(id);
    return remarks
      ? `<div class="blk evidence" style="margin-left:${n(72 - PAGE_LEFT)}pt"><div class="val-block">${esc(remarks)}</div></div>`
      : false;
  };

  // Attachments of all pre-AT checks, shown together at the bottom of the section;
  // their PDFs are printed at the end of the document.
  const BASIC_CHECKS: [string, string][] = [
    ['T1', '4(a)'], ['T2', '4(b)'], ['T3', '4(c)'], ['T4', '4(d)'], ['T5', '4(e)'],
    ['T6', '4(f)'], ['T7', '4(g)'], ['T8', '4(h)'], ['T9', '4(i)'], ['T10', '4(j)'],
  ];
  const basicAttachments = (): string | false => {
    const html = BASIC_CHECKS.map(([id, tag]) => attach.html(basic(id).files, `${tag} evidence`, 300, false)).join('');
    return html ? `<div class="blk evidence" style="margin-left:${n(72 - PAGE_LEFT)}pt">${html}</div>` : false;
  };

  // "Result ______" line of the pre-AT checks (underlined tab ends at 4866 twips):
  // compliance Yes/No is printed as Pass/Fail on the line.
  const resultLine = (base: number, id: string): [Block, string | false] => {
    const { compliance } = basic(id);
    const result = compliance === 'Yes' ? 'Pass' : compliance === 'No' ? 'Fail' : compliance;
    const underline = `<span class="rule" style="left:${n(105.6 - 72)}pt;width:${n(307.1 - 105.6)}pt;top:${n(
      11 * CAMBRIA_ASCENT + 1.2,
    )}pt"></span>`;
    const entered = result
      ? `<div class="val result" style="margin-left:${n(108.4 - 72)}pt;width:${n(307.1 - 108.4)}pt;margin-top:-${n(
          LINE_11,
        )}pt">${esc(result)}</div>`
      : '';
    return [text({ base, scale: 1.15, extra: underline + entered }, ['Result']), checkEvidence(id)];
  };

  const pages: string[] = [];
  const page = (...blocks: (Block | string | false)[]) =>
    pages.push(`<section class="page">${flow(PAGE_TOP, PAGE_LEFT, blocks)}</section>`);

  // ── Page 1: cover ──────────────────────────────────────────────────────────
  page(
    image(82.5, 190.1, 216.0, 126.0, img.bharatNetLogo),
    image(282.8, 219.4, 152.8, 113.7, img.bsnlLogo),
    text({ base: 419.09, x: 206.45, size: 12, scale: 1.15 }, ['Bharat Sanchar Nigam Limited']),
    text({ base: 447.43, x: PAGE_LEFT, right: 499.4, size: 12, scale: 1.15, align: 'center' }, [
      'Acceptance Testing Test Cases document for Block Router as per BSNL',
      'Bharatnet Tender No. MM/BNO&M/BN-III/T-791/2024 issued on',
      '15.02.2024',
    ]),
  );

  // ── Page 2: table of contents ──────────────────────────────────────────────
  const toc = (base: number, number: string, title: string, level: 0 | 1, x?: number, scale = 1.12) =>
    text(
      {
        base,
        x: x ?? (level === 0 ? 108.0 : 126.0),
        size: 12,
        pitch: 14,
        scale,
        marker: { text: number, x: 90.0, scale: level === 0 ? 1.23 : 1.18 },
      },
      [title],
    );
  page(
    text({ base: 85.8, size: 12, bold: true, scale: 1.1 }, ['Table of Contents']),
    toc(114.0, '1.', 'Introduction', 0, undefined, 1.1),
    toc(128.1, '2.', 'Acceptance Testing Network Diagram', 0, undefined, 1.1),
    toc(142.3, '3.', 'Acceptance Memorandum', 0, undefined, 1.15),
    toc(156.3, '4.', 'Acceptance testing test cases', 0, undefined, 1.15),
    toc(170.3, '4.1', 'Verification of Router BOM as per RFP Requirements', 1, undefined, 1.1),
    toc(184.6, '4.2', 'Hot Swappable Power supply unit redundancy checking', 1, undefined, 1.15),
    toc(198.7, '4.2 A', 'Hot Swappable fans for high availability', 1, 132.3, 1.1),
    toc(212.8, '4.3', '1G/10G Ethernet link bring up (as applicable)', 1, undefined, 1.15),
    toc(226.7, '4.4', 'Loopback interface tests', 1, undefined, 1.1),
    toc(241.0, '4.5', 'iBGP/eBGP', 1, undefined, 1.2),
    toc(254.9, '4.6', 'BFD (Fast failure detection)', 1, undefined, 1.1),
    toc(269.0, '4.7', 'Jumbo Frames / MTU tests', 1, undefined, 1.15),
    toc(283.2, '4.8', 'SSH/Telnet, FTP/SCP support', 1, undefined, 1.15),
    toc(297.3, '4.9', 'TACAS testing', 1, undefined, 1.15),
    toc(311.3, '4.10', 'LLDP Neighbour Discovery', 1, 125.8, 1.1),
    toc(325.5, '4.11', 'VLAN based sub-interfaces', 1, 125.8, 1.15),
    toc(339.5, '4.12', 'ISIS/OSPF', 1, 125.8, 1.2),
    toc(353.4, '4.13', 'ISIS/OSPF MD5 authentication', 1, 125.8, 1.15),
    toc(367.7, '4.14', 'MPLS LDP ping and traceroute', 1, 125.8, 1.15),
    toc(382.0, '4.15', 'LDP MD5 authentication', 1, 125.8, 1.15),
    toc(395.9, '4.16', 'BGP MD5 authentication', 1, 125.8, 1.15),
    toc(410.0, '4.17', 'VRF configuration & L3VPN', 1, 125.8, 1.15),
    toc(424.2, '4.18', 'L2 VPN', 1, 125.8, 1.1),
    toc(438.4, '4.19', 'Segment routing (SR-MPLS)', 1, 125.8, 1.15),
  );

  // ── Page 3: introduction, network diagram ──────────────────────────────────
  page(
    heading1(77.52, '1.', 'Introduction'),
    text({ base: 107.66, right: 520.6, align: 'justify', scale: 1.15 }, [
      'This document outlines the Acceptance Testing (A/T) procedures for IP/MPLS',
      'Block Routers, Type-A and Type-B, in accordance with the requirements of BSNL',
      'BharatNet Tender No. MM/BNO&M/BN-III/T-791/2024 dated 15.02.2024.',
    ]),
    text({ base: 160.46, right: 520.4, align: 'justify', scale: 1.15 }, [
      'It covers the applicable test cases in line with industry best practices, relevant',
      'specifications and standards, and includes the acceptance testing template for',
      'quality assurance in accordance with the requirements specified in the RFP.',
    ]),
    heading1(219.86, '2.', 'Acceptance Testing Network Diagram'),
    text({ base: 250.1, scale: 1.1 }, ['The following topology will be used for the AT test cases execution:']),
    image(266.5, 79.9, 466.1, 223.5, img.networkDiagram),
    text({ base: 517.03, right: 520.1, align: 'justify', scale: 1.15 }, [
      'Note: The IP addresses and network diagram in Section 4 are for illustration only.',
      'All test scenarios will be executed using the actual network configuration.',
    ]),
  );

  // ── Page 4: acceptance memorandum ──────────────────────────────────────────
  const wanItem = text(
    { base: 175.46, x: 120.7, scale: 1.12, marker: { text: 'e)', x: 108.05, scale: 0.78 } },
    ['Router WAN interface, loopback0, southbound interface, IPaddress:'],
  );
  // Sign-off cell; "PIA"/"BSNL" are followed by a tab to 982 twips (`tabX`).
  const signCell = (x: number, title: string[], lead?: { text: string; tabX: number }) => {
    const textX = x + (lead ? 5.5 : 5.25);
    const signatureRule = `<span class="rule" style="left:57pt;width:76.2pt;top:${n(
      569.1 - 437.8 - 0.25,
    )}pt;border-top-width:0.6pt"></span>`;
    const blocks = flow(437.8 + 0.25, x, [
      lead
        ? text({ base: 448.75, x: lead.tabX, scale: 1.1, marker: { text: lead.text, x: textX, scale: 1.1 } }, [title[0]])
        : text({ base: 448.75, x: textX, scale: 1.1 }, [title[0]]),
      text({ base: 461.83, x: textX, scale: 1.1 }, [title[1]]),
      text({ base: 488.47, x: x + 5.5, scale: 1.1 }, ['Representative Name:']),
      text({ base: 515.23, x: x + 5.5, scale: 1.15 }, ['Designation:']),
      text({ base: 542.23, x: x + 5.5, scale: 1.15 }, ['Date:']),
      text({ base: 568.39, x: x + 5.5, scale: 1.15 }, ['Signature']),
      signatureRule, // underlined tab after "Signature", to 2654 twips
    ]);
    return `<div class="in">${blocks}</div>`;
  };
  page(
    heading1(77.52, '3.', 'Acceptance Memorandum'),
    memoItem(99.86, 'a)', 'Equipment description', 121.4, memo.equipmentDescription, 288.17),
    memoItem(118.82, 'b)', 'Site Name with LGD code', 121.85, memo.siteNameLGD, 288.17),
    memoItem(137.78, 'c)', 'Site Address', 120.7, memo.siteAddress, 288.17),
    memoItem(156.5, 'd)', 'Router hostname', 121.85, memo.routerHostname, 252.05),
    wanItem,
    // The label of e) fills the line, so its value goes on the line below.
    memo.wanInterfaceIp
      ? `<div class="blk val" style="margin-left:${n(120.7 - PAGE_LEFT)}pt">${esc(memo.wanInterfaceIp)}</div>`
      : false,
    memoItem(194.42, 'f)', 'Block network diagram along with rings and child-rings', 118.55, '', null),
    memoItem(213.38, 'g)', 'QR code', 120.9, '', null),
    // Uploaded network diagram / QR code, below the list.
    (() => {
      const files = attach.html([data.networkDiagram, data.qrCode], 'Block network diagram / QR code', 180);
      return files ? `<div class="blk evidence" style="margin-left:${n(72 - PAGE_LEFT)}pt">${files}</div>` : false;
    })(),
    text({ base: 270.05, scale: 1.15, extra: tabColon(216.05 - 72) + inlineValue(memo.dateTime, 224 - 72) }, [
      'Date & Time',
    ]),
    text({ base: 323.93, scale: 1.1 }, ['We hereby declare that all tests in this form were successfully completed.']),
    text({ base: 350.93, scale: 1.1 }, ['Note (if any):']),
    table({ x: 66.3, cols: [3309, 3303, 3309], border: 0.5, pad: 0 }, 437.8, [
      {
        h: 2669,
        cells: [
          { html: signCell(66.3, ['Representative’s', 'Sign off'], { text: 'PIA', tabX: 115.8 }), valign: 'top' },
          { html: signCell(231.8, ['IE Representative’s Sign', 'off']), valign: 'top' },
          { html: signCell(396.9, ['Representative’s', 'Sign off*'], { text: 'BSNL', tabX: 446.5 }), valign: 'top' },
        ],
      },
    ]),
    text({ base: 596.59, scale: 1.1 }, ['*Note:']),
    text(
      { base: 623.62, x: 108.0, right: 526.6, align: 'justify', scale: 1.1, marker: { text: '1.', x: 90.02, scale: 1.24 } },
      [
        'For first time AT of Block Router, GP Router, Block Rack, GP Rack, Route',
        'and Ring, one BSNL person may be kept mandatorily and his/her signatures',
        'are required on the AT document.',
      ],
    ),
    text(
      { base: 662.38, x: 108.0, right: 525.8, align: 'justify', scale: 1.12, marker: { text: '2.', x: 90.02, scale: 1.24 } },
      [
        'For subsequent ATs, BSNL may assign person on need basis or as requested',
        'by any PIA. Decision regarding the same shall be taken by BharatNet State',
        'Head on case-to-case basis.',
      ],
    ),
  );

  // ── Page 5: certification verification ─────────────────────────────────────
  const certCol = (lines: string[], size: number, scale = 1.15) =>
    `<div style="font-size:${size}pt">${linesHtml(lines.map(esc), 'center', scale)}</div>`;
  const docFlow = flow(182.9 + 0.25, 265.25, [
    text({ base: 193.8, x: 270.6, scale: 1.1 }, ['Test 1: The contractor shall provide following', 'documents:']),
    text({ base: 219.5, x: 284.1, scale: 1.12, marker: { text: 'a.', x: 270.6, scale: 1.19 } }, ['System description documents']),
    text({ base: 232.5, x: 284.1, scale: 1.12, marker: { text: 'b.', x: 270.6, scale: 1.19 } }, ['Installation, Operation and Maintenance']),
    text({ base: 245.4, x: 270.6, scale: 1.15 }, ['documents']),
    text({ base: 258.4, x: 284.1, scale: 1.12, marker: { text: 'c.', x: 270.6, scale: 1.19 } }, ['Training document']),
    text({ base: 271.4, x: 284.1, scale: 1.12, marker: { text: 'd.', x: 270.6, scale: 1.19 } }, ['Repair manual']),
    text({ base: 297.0, x: 270.6, scale: 1.15 }, [
      'Test 2: All technical documents shall be in English',
      'language both in CD- ROM and in hard copy.',
    ]),
    text({ base: 323.0, x: 270.6, scale: 1.15 }, [
      'All necessary interfaces, connectors, connecting',
      'cables and accessories required for satisfactory',
      'installation and convenient operations shall be',
      'supplied. Type of connectors, adapters to be used',
    ]),
    text({ base: 374.6, x: 270.6, scale: 1.15 }, ['shall be in conformity with the interfaces defined in', 'this GR.']),
    text({ base: 412.2, x: 270.6, scale: 1.15, pitch: 13.1 }, [
      '*All the above documents are to be handed over only',
      'once per model no.',
    ]),
  ]);
  // Right-hand column: the template text, followed by the uploaded files.
  const certValue = (templateText: string, keys: CertificationKey[], label: string): Cell => {
    const files = attach.html(keys.map((key) => data.certifications[key]), label, 250);
    return {
      html: `<div style="font-size:11pt">${templateText ? certCol([templateText], 11) : ''}${
        files ? `<div class="evidence cert-files">${files}</div>` : ''
      }</div>`,
      pad: 0,
    };
  };
  page(
    text({ base: 71.0, scale: 1.1 }, ['Certification verification']),
    table({ x: 66.3, cols: [3966, 5954], border: 0.5, pad: 0 }, 87.5, [
      {
        h: 618,
        cells: [
          { html: `<div style="line-height:14pt">${certCol(['TEC/GR 48050:2022 with', 'latest amendments if any'], 12, 1.12)}</div>`, pad: 0 },
          { html: certCol(['Declaration'], 11), pad: 0 },
        ],
      },
      { h: 312, cells: [{ html: certCol(['TSEC Certificate'], 12, 1.14), pad: 0 }, certValue('Date of TSEC', ['tsecCertificate'], 'TSEC Certificate')] },
      { h: 311, cells: [{ html: certCol(['QA Certificate'], 12, 1.14), pad: 0 }, certValue('Date of QA', ['qaCertificate'], 'QA Certificate')] },
      {
        h: 306,
        cells: [
          { html: certCol(['QR Code, logo'], 12, 1.14), pad: 0 },
          certValue('Photo evidence', ['qrCodeLogo', 'photoEvidence'], 'QR Code, logo / Photo evidence'),
        ],
      },
      { h: 311, cells: [{ html: certCol(['OEM approval of BSNL'], 12, 1.14), pad: 0 }, certValue('', ['oemApproval'], 'OEM approval of BSNL')] },
      {
        h: 4906,
        cells: [
          { html: certCol(['Documentation requirements'], 12, 1.14), pad: 0 },
          { html: docFlow, pad: 0, valign: 'top' },
        ],
      },
    ]),
  );

  // ── Page 6: basic checks 4(a) - 4(h) ───────────────────────────────────────
  page(
    heading1(77.52, '4.', 'Acceptance Testing Test Cases'),
    text({ base: 97.7, scale: 1.1 }, ['Following basic checks are to be done before starting the Router AT:']),
    text({ base: 123.5, scale: 1.1 }, ['4(a): Router serial number and it’s TSEC and QA certificate:']),
    text({ base: 136.58, x: 111.85, scale: 1.1, marker: { text: 'i)', x: 93.35, scale: 0.91 } }, [
      'Check whether TSEC is available for this model number of Router.',
    ]),
    text({ base: 149.54, x: 111.85, scale: 1.1, marker: { text: 'ii)', x: 93.35, scale: 0.91 } }, [
      'Check  whether  QA certificate  is available  for  the  Router  serial',
      'number.',
    ]),
    ...resultLine(188.06, 'T1'),
    text({ base: 213.98, right: 528.9, align: 'justify', scale: 1.1 }, [
      '4(b): Check whether the following condition is qualified – “If the items mentioned',
      'herein are not dispatched within 15 days from the date of Dispatch Advice, they',
      'shall be re-offered for inspection to BSNL-QA.”',
    ]),
    ...resultLine(265.58, 'T2'),
    text({ base: 291.29, right: 528.7, align: 'justify', scale: 1.1 }, [
      '4(c): Check whether the Router has the latest OS (TSEC Version or higher). If not,',
      'then first get the OS upgraded to the latest version (TSEC Version or higher). OEM',
      'Undertaking for higher version complying to all RFP requirements need to be',
      'submitted. The latest version would be displayed on SNOC.',
    ]),
    ...resultLine(355.85, 'T3'),
    text({ base: 394.73, scale: 1.1 }, [
      '4(d): All installed and configured ports of the Router should be up and active. Check',
      'through Command Line Interface (CLI).',
    ]),
    ...resultLine(433.49, 'T4'),
    text({ base: 472.27, scale: 1.15 }, [
      '4(e): Videos and photos of the Router installation as per RFP should be available.',
      'Check PIA PM tool.',
    ]),
    ...resultLine(510.91, 'T5'),
    text({ base: 537.79, right: 526.4, align: 'justify', scale: 1.1 }, [
      '4(f): Whether the product qualifies the ‘Trusted products’ as mandated by DoT vide',
      'File no- 20-271/2010 AS-I (Vol-III) dated 10.3.2021, along with its amendments,',
      'issued from time to time. The certificate can be provided once for one model',
      'number.',
    ]),
    ...resultLine(603.55, 'T6'),
    text({ base: 630.46, scale: 1.15 }, [
      '4(g): Whether OEM undertaking as per para 10.2 and 10.3 of Section-I of RFP',
      'regarding originality of hardware and software is submitted?',
    ]),
    ...resultLine(670.3, 'T7'),
    text({ base: 697.3, scale: 1.15 }, [
      '4(h): Whether undertaking as per S.No. 18 of Table – “Technical Specifications for',
      'Routers” regarding software updates/bug is submitted?',
    ]),
    ...resultLine(737.14, 'T8'),
  );

  // ── Page 7: basic checks 4(i), 4(j) ────────────────────────────────────────
  page(
    text({ base: 71.0, right: 526.3, align: 'justify', scale: 1.1 }, [
      '4 (i): Whether the PIA has done Pre-AT and the Block availability in last one week is',
      'more than 99.5%.?',
    ]),
    checkEvidence('T9'),
    text({ base: 110.8, right: 526.0, align: 'justify', scale: 1.1 }, [
      '4 (j): Activation/Deactivation of Router through a CLI command from SNOC should',
      'be available.',
    ]),
    checkEvidence('T10'),
    text({ base: 177.6, right: 526.4, align: 'justify', bold: true, scale: 1.1 }, [
      '*The above checks/tests are pre-requisite before proceeding to the actual AT',
      'tests. If any of the above is not qualified and/or not available, then AT cannot',
      'proceed.',
    ]),
    basicAttachments(),
  );

  // ── Page 8: 4.1 Router BOM ─────────────────────────────────────────────────
  // S/N | Requirement | Observation table; cells are top-aligned flows.
  const SN: TableGeometry = { x: 66.3, cols: [1133, 7087, 1699], border: 0.5, pad: 105, size: 11 };
  const cellFlow = (originY: number, originX: number, blocks: (Block | string)[]): Cell => ({
    html: flow(originY, originX, blocks),
    valign: 'top',
    pad: 0,
  });
  page(
    text({ base: 71.04, x: 110.8, bold: true, scale: 1.1, marker: { text: '4.1', x: 90.0, bold: false, scale: 1.12 } }, [
      'Verification of Router BOM as per RFP Requirements',
    ]),
    table(T60(), 79.6, [
      { h: 460, cells: [label('Test No'), label('1')] },
      { h: 461, cells: [label('Test Details'), label('Verification the router BOM as specified in the RFP.')] },
      { h: 906, cells: [label(INSTRUMENTS), label('Router, PC')] },
      { h: 1583, cells: [label('Test Setup'), setup(img.brRemoteMachine, 193.4, 49.9, 83.8, 12.18)] },
      { h: 460, cells: [label('Test Procedure'), bullets(['Verify the BOM, by physical inspection and through CLI'], { left: 825, hanging: 361, before: 96 })] },
      { h: 941, cells: [label('Test Configuration'), configCell('N1')] },
      { h: 445, cells: [label('Test Limits'), label('NA')] },
      { h: 460, cells: [label('Expected Results'), bullets(['Verified the Router BOM as per RFP'], { left: 825, hanging: 361, before: 38 })] },
      { h: 1175, cells: [label('Test Results'), resultsCell('N1', '1')] },
      { h: 460, cells: [label('Status'), statusCell('N1')] },
    ]),
    table(SN, 477.9, [
      {
        h: 498,
        cells: [
          { html: cellText('S/N', 1.2), pad: 110 },
          cellText('Requirement', 1.1),
          { html: cellText('Observation', 1.1), pad: 106 },
        ],
      },
      {
        h: 5093,
        cells: [
          cellFlow(503.55, 66.55, [text({ base: 520.15, x: 72.3, scale: 1.1 }, ['i'])]),
          cellFlow(503.55, 123.2, [
            text({ base: 520.15, x: 128.66, right: 474.9, align: 'justify', scale: 1.1 }, [
              'The router can be Chassis based for Type A with Control plane',
              '& Data plane redundancy. Routers shall be as per requirement',
              'of chasis and non chasis router defined in GR 48050:2022.',
              'Router should support switching capacity of minimum 800',
              'Gbps.',
            ]),
            text({ base: 590.71, x: 128.66, scale: 1.1, pitch: 18.96 }, [
              'The router should be enabled with the following configuration:',
              '4 ports of 100G (with 40km pluggable)',
            ]),
            text({ base: 628.18, x: 128.66, scale: 1.1, pitch: 12.65 }, ['12 ports of 10 G (with 40km pluggable)']),
            text({ base: 647.38, x: 128.66, right: 474.5, align: 'justify', scale: 1.1 }, [
              '4 ports of 1G/10G (All ports should be usable for both 1G as',
              'well as 10G as per plugged SFP)',
            ]),
            text({ base: 679.18, x: 128.66, bold: true, scale: 1.1 }, ['Clarification No. 450 of 08-May-2024 in RFP:']),
            text({ base: 698.02, x: 128.66, right: 475.2, align: 'justify', scale: 1.15 }, [
              'Query - As per Section IV-C, the router can be Chassis based',
              'for Type A with Control plane & Data plane redundancy but',
              'shall be of non-chassis based 1RU form-factor for Type B.',
            ]),
            text({ base: 742.06, x: 128.66, right: 475.1, align: 'justify', scale: 1.15 }, [
              'Clarification received: The redundancy shall have to be same as',
              'prescribed for non-chassis-based router type A, irrespective of',
            ]),
          ]),
          '',
        ],
      },
    ]),
  );

  // ── Page 9: BOM (cont.), 4.2 PSU redundancy ────────────────────────────────
  page(
    table(SN, 60.6, [
      { h: 378, cells: ['', { html: cellText('the router type A being chassis based or non-chassis based', 1.1), valign: 'top' }, ''] },
      {
        h: 3043,
        cells: [
          cellFlow(80.25, 66.55, [text({ base: 96.9, x: 72.3, scale: 1.1 }, ['ii'])]),
          cellFlow(80.25, 123.2, [
            text({ base: 96.9, x: 128.66, right: 475.4, align: 'justify', scale: 1.15 }, [
              'The router shall be of non-chassis based 1RU form-factor for',
              'Type B. Routers shall be as per requirement of chassis and',
              'non-chassis router defined in GR 48050:2022. Router should',
              'support switching capacity of minimum 300 Gbps.',
            ]),
            text({ base: 154.6, x: 128.66, scale: 1.1, pitch: 18.9 }, [
              'The router should be enabled with the following configuration:',
              '2 ports of 100G (with 40km pluggable)',
            ]),
            text({ base: 192.4, x: 128.66, scale: 1.1 }, ['8 ports of 10G (with 40km pluggable)']),
            text({ base: 211.1, x: 128.66, right: 463.8, align: 'justify', scale: 1.1 }, [
              '4 ports of 1G/10G (All ports should be usable for both 1G as',
              'well as 10G as per plugged SFP)',
            ]),
          ]),
          '',
        ],
      },
    ]),
    testHeading(275.57, '4.2', 90.0, 'Hot Swappable Power Supply Unit Redundancy Checking', 126.0),
    table(T115(), 284.1, [
      { h: 461, cells: [label('Test No'), label('2')] },
      { h: 460, cells: [label('Test Details'), label('Redundancy – PSU')] },
      { h: 907, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 1819, cells: [label('Test Setup'), setup(img.dutLaptop, 127.2, 51.5, 10.25, 27.89)] },
      {
        h: 1594,
        cells: [
          label('Test Procedure'),
          bullets([
              ['Run the extended ping command between Router and', 'laptop (from site/SNOC workstation)'],
              'Remove 1 PSU, Observe the ping',
              'Re-insert the PSU. Observe the ping',
              'Repeat by removing the other PSU',
              'Check if the alert is visible in EMS/NMS',
            ]),
        ],
      },
      { h: 940, cells: [label('Test Configuration'), configCell('N2')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      { h: 518, cells: [label('Expected Results'), bullets([['Ping should continue while removing and re-inserting', 'the PSU.']])] },
      { h: 1175, cells: [label('Test Results'), resultsCell('N2', '2')], edge: 'results' },
      { h: 461, cells: [label('Status'), statusCell('N2', 54)], edge: 'status' },
    ]),
    // "4.2 A": the "A" is a separate 12pt run between the number and the title.
    text(
      {
        base: 766.06,
        x: 122.2,
        bold: true,
        scale: 1.1,
        marker: { text: '4.2', x: 90.0, bold: true, scale: 1.11 },
        extra: `<span class="run-a" style="left:${n(109.7 - 90.0)}pt">A</span>`,
      },
      ['Hot Swappable fan redundancy – high availability'],
    ),
  );

  // ── Page 10: 4.2 A fan redundancy, 4.3 Ethernet link bring-up ──────────────
  page(
    table(T115(), 60.5, [
      { h: 460, cells: [label('Test No'), label('2A')] },
      { h: 460, cells: [label('Test Details'), label('Redundancy – Fan')] },
      { h: 907, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 2510, cells: [label('Test Setup'), setup(img.dutLaptop, 169.5, 68.7, 12.85, 33.35)] },
      {
        h: 1603,
        cells: [
          label('Test Procedure'),
          bullets([
              'Remove 1 fan module',
              'Check if routers reboot. (Router must not reboot)',
              'Insert the removed module',
              'Repeat for the other fans',
              'Check if the alert is visible in EMS/NMS at SNOC',
            ]),
        ],
      },
      { h: 940, cells: [label('Test Configuration'), configCell('N2A')] },
      { h: 441, cells: [label('Test Limits'), label('NA')] },
      { h: 465, cells: [label('Expected Results'), bullets(['Check through CLI commands'], { before: 101 })] },
      { h: 1877, cells: [label('Test Results'), resultsCell('N2A', '2A')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N2A', 54)], edge: 'status' },
    ]),
    testHeading(598.63, '4.3', 90.0, '1G/10G Ethernet Link Bring Up (As Applicable)', 126.0),
    table(T112(), 607.3, [
      { h: 461, cells: [label('Test No'), label('3')] },
      { h: 460, cells: [label('Test Details'), label('1G/10G/100G Ethernet Link Bring-Up (As Applicable),')] },
      { h: 906, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 461, cells: [label('Test Setup'), ''] },
    ]),
  );

  // ── Page 11: 4.3 (cont.), 4.4 loopback ─────────────────────────────────────
  page(
    table(T115(), 60.5, [
      { h: 2246, cells: ['', setup(img.dutTestTerminal, 150.1, 92.6, 2.75, 5.34)] },
      { h: 460, cells: [label('Test Procedure'), bullets(['Connect the physical port of routers using fiber.'], { before: 96 })] },
      { h: 461, cells: [label('Test Configuration'), configCell('N3')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      {
        h: 1493,
        cells: [
          label('Expected Results'),
          bullets([
              ['Verify that link comes up on both routers. In case', 'of Block router, the other router can be BSNL', 'Router providing ILL/DCN'],
              "Link status should show 'up' and speed as 1G /10G.",
              'Check if the link status up / down is visible in EMS/NMS',
            ]),
        ],
      },
      { h: 1881, cells: [label('Test Results'), resultsCell('N3', '3')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N3', 54)], edge: 'status' },
    ]),
    testHeading(464.11, '4.4', 89.5, 'Loopback interface Tests', 111.35),
    table(T112(), 472.6, [
      { h: 460, cells: [label('Test No'), label('4')] },
      { h: 460, cells: [label('Test Details'), label('Loopback interface Tests')] },
      { h: 907, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 2923, cells: [label('Test Setup'), setup(img.dutTestTerminal, 111.9, 111.8, 130.65, 18.08)] },
      {
        h: 811,
        cells: [
          label('Test Procedure'),
          bullets(['Configure loopback interfaces on routers.', 'Configure the IP Address on physical interfaces.', 'Add to IGP for loopback reachability'], { left: 775, before: 6 }),
        ],
      },
    ]),
  );

  // ── Page 12: 4.4 (cont.), 4.5 iBGP / eBGP ──────────────────────────────────
  const C2430 = [2430, 7558];
  page(
    table(T115(), 60.5, [
      { h: 1877, cells: [label('Test Configuration'), configCell('N4')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      {
        h: 792,
        cells: [
          label('Expected Results'),
          bullets([['Loopbacks are reachable from CLI command locally or', 'SNOC.'], 'Ping is successful.'], { left: 778, hanging: 361 }),
        ],
      },
      { h: 460, cells: [label('Test Results'), resultsCell('N4', '4')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N4', 54)], edge: 'status' },
    ]),
    testHeading(292.73, '4.5', 89.5, 'iBGP / eBGP', 111.35, 1.15),
    table(T112(C2430), 301.5, [
      { h: 460, cells: [label('Test No'), { html: label('5'), pad: 54 }] },
      { h: 460, cells: [label('Test Details'), { html: label('iBGP / eBGP'), pad: 54 }] },
      { h: 907, cells: [label(INSTRUMENTS), { html: label('Routers, SFPs, Fibre Cables, PCs'), pad: 54 }] },
      { h: 3024, cells: [label('Test Setup'), setup(img.dutBsnlRouter, 221.8, 112.2, 82.1, 27.65)] },
      {
        h: 1319,
        cells: [
          label('Test Procedure'),
          bullets([
                'Configure IP addresses on physical interfaces.',
                'Configure the loopback and assign the IP address.',
                ['Configure BGP neighbour-ship. BSNL ILL/DCN Router', 'can be used for this purpose.'],
                'Set local/remote AS numbers.',
              ], { left: 775, hanging: 361 }),
        ],
      },
      { h: 1641, cells: [label('Test Configuration'), configCell('N5')] },
      { h: 446, cells: [label('Test Limits'), { html: label('NA'), pad: 54 }] },
      {
        h: 542,
        cells: [
          label('Expected Results'),
          bullets(['iBGP/eBGP neighborship is established.', 'Routes are exchanged successfully.'], { left: 775, hanging: 361 }),
        ],
      },
      { h: 465, cells: [label('Test Results'), ''] },
    ]),
  );

  // ── Page 13: 4.5 (cont.), 4.6 BFD, 4.7 Jumbo frames ────────────────────────
  page(
    table(T115(C2430), 60.5, [
      { h: 1170, cells: ['', resultsCell('N5', '5')], edge: 'results' },
      { h: 465, cells: [{ html: label('Status'), pad: 54 }, statusCell('N5', 54)], edge: 'status' },
    ]),
    testHeading(171.98, '4.6', 89.5, 'BFD (Fast Failure Detection)', 111.35),
    table(T115(C2430), 180.5, [
      { h: 460, cells: [label('Test No'), label('6')] },
      { h: 460, cells: [label('Test Details'), label('BFD (Fast Failure Detection)')] },
      { h: 906, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 3082, cells: [label('Test Setup'), setup(img.dutTestTerminal, 120.6, 120.6, 126.7, 18.53)] },
      {
        h: 1065,
        cells: [
          label('Test Procedure'),
          bullets([
              'Configure IP addresses.',
              'Configure the loopback and assign the IP address.',
              'Configure the IGP protocol and advertise the interfaces.',
              'Enable BFD for all ISIS/OSPF interfaces.',
            ]),
        ],
      },
      { h: 1680, cells: [label('Test Configuration'), configCell('N6')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      { h: 460, cells: [label('Expected Results'), bullets(['BFD session come up.'], { before: 96 })] },
      { h: 940, cells: [label('Test Results'), resultsCell('N6', '6')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N6', 54)], edge: 'status' },
    ]),
    testHeading(710.62, '4.7', 89.5, 'Jumbo Frames / MTU Tests', 111.35, 1.15),
    table(T112([2521, 7553]), 719.3, [
      { h: 460, cells: [label('Test No'), { html: label('7'), pad: 50 }] },
      { h: 460, cells: [label('Test Details'), { html: label('Jumbo Frames / MTU Tests'), pad: 50 }] },
    ]),
  );

  // ── Page 14: 4.7 (cont.), 4.8 SSH/Telnet ───────────────────────────────────
  const SSH = T161([2603, 7386]);
  page(
    table(T115([2521, 7553]), 60.5, [
      { h: 907, cells: [label(INSTRUMENTS), { html: label('Routers, SFPs, Fibre Cables, PCs.'), pad: 52 }] },
      { h: 3648, cells: [label('Test Setup'), setup(img.dutTestTerminal, 145.1, 145.0, 113.15, 20.13)] },
      {
        h: 792,
        cells: [
          label('Test Procedure'),
          bullets([['Configure interfaces to support jumbo frames (9600', 'bytes).'], 'Send large ICMP packets (e.g., 9000 bytes).'], { left: 773, hanging: 361 }),
        ],
      },
      { h: 1641, cells: [label('Test Configuration'), configCell('N7')] },
      { h: 446, cells: [label('Test Limits'), { html: label('NA'), pad: 52 }] },
      { h: 460, cells: [label('Expected Results'), bullets(['Ping with large size is successful.'], { left: 773, hanging: 361, before: 96 })] },
      { h: 1646, cells: [label('Test Results'), resultsCell('N7', '7')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N7', 50)], edge: 'status' },
    ]),
    testHeading(592.03, '4.8', 89.5, 'SSH/Telnet, FTP/SCP support', 111.35, 1.15),
    table(SSH, 600.5, [
      { h: 296, cells: [label('Test No'), label('8')] },
      {
        h: 470,
        cells: [
          label('Test Details'),
          { html: label(['The Router shall support SSH/Telnet access to the LAN and FTP/SCP', 'access to its configuration/ boot files.']), valign: 'top' },
        ],
      },
      { h: 469, cells: [label(INSTRUMENTS), label('Routers, PC and Ethernet cable.')] },
      { h: 1512, cells: [label('Test Setup'), setup(img.ssh, 167.9, 43.6, 3.65, 12.83)] },
      {
        h: 503,
        cells: [
          label('Test Procedure'),
          numbered(['Enable SSH/telnet access to the router.', 'Enable FTP/SCP access.'], "Arial, Arimo, sans-serif"),
        ],
      },
    ]),
  );

  // ── Page 15: 4.8 (cont.), 4.9 TACACS ───────────────────────────────────────
  page(
    table(SSH, 60.6, [
      { h: 1238, cells: [label('Test Configuration'), configCell('N8')] },
      { h: 302, cells: [label('Test Limits'), label('NA')] },
      {
        h: 513,
        cells: [
          label('Expected Results'),
          numbered(['Verify router supports SSH/Telnet access.', 'Verify router supports FTP/SCP access.'], "Calibri, Carlito, sans-serif"),
        ],
      },
      { h: 935, cells: [label('Test Results'), resultsCell('N8', '8')] },
      { h: 301, cells: [label('Status'), statusCell('N8', 73)] },
    ]),
    textHtml(
      {
        base: 257.9,
        x: 111.35,
        bold: true,
        scale: 1.15,
        marker: { text: '4.9', x: 89.5, font: "'Times New Roman', Tinos, serif", bold: false, scale: 1.11 },
      },
      ['TACACS <span style="font-size:10pt">Testing</span>'],
    ),
    table(T161([2603, 7295]), 266.7, [
      { h: 469, cells: [label('Test No'), { html: label('9'), pad: 6, valign: 'top' }] },
      {
        h: 628,
        cells: [
          label('Test Details'),
          { html: label(['Integration with TACACS server & Login using TACACS user and fall-back', 'user']), pad: 6, valign: 'top' },
        ],
      },
      { h: 536, cells: [label(INSTRUMENTS), { html: label('Routers, PC and Ethernet cable.'), pad: 6, valign: 'top', padTop: 150 }] },
      { h: 2625, cells: [label('Test Setup'), setup(img.tacacs, 253.8, 86.6, 50.05, 12.29)] },
      {
        h: 704,
        cells: [
          label('Test Procedure'),
          plainLines([
            'Configure the IP address on the router',
            'Configure the routing protocol make TACACS reachable from DUT',
            'Configure the TACACS',
          ]),
        ],
      },
      { h: 2275, cells: [label('Test Configuration'), configCell('N9')] },
      { h: 296, cells: [label('Test Limits'), { html: label('NA'), pad: 6 }] },
      {
        h: 757,
        cells: [
          label('Expected Results'),
          plainLines([
            'Verify Local admin user is Unable to login and same is recorded in AAA',
            'Server.',
            'Verify TACACS user is able to login and same is recorded in AAA Server.',
          ]),
        ],
      },
      { h: 296, cells: [label('Test Results'), resultsCell('N9', '9')] },
      { h: 302, cells: [label('Status'), statusCell('N9', 68)] },
    ]),
  );

  // ── Page 16: 4.10 LLDP, 4.11 VLAN sub-interfaces ───────────────────────────
  page(
    text({ base: 71.04, bold: true, scale: 1.1 }, ['The following tests can be performed at the time of Ring AT']),
    testHeading(101.9, '4.10', 90.0, 'LLDP Neighbour Discovery', 126.0),
    table(T115(C2430), 110.4, [
      { h: 461, cells: [label('Test No'), label('10')] },
      { h: 460, cells: [label('Test Details'), label('LLDP Neighbour Discovery')] },
      { h: 907, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 2688, cells: [label('Test Setup'), setup(img.dutTestTerminal, 101.3, 101.4, 137.0, 17.57)] },
      {
        h: 797,
        cells: [
          label('Test Procedure'),
          bullets(['Connect the physical port of routers using fiber.', 'Enable LLDP globally', 'Enable LLDP on interfaces']),
        ],
      },
      { h: 1881, cells: [label('Test Configuration'), configCell('N10')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      {
        h: 508,
        cells: [
          label('Expected Results'),
          bullets(['LLDP neighborship is established.', 'Neighbor details are visible in LLDP table']),
        ],
      },
      { h: 1176, cells: [label('Test Results'), resultsCell('N10', '10')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N10', 54)], edge: 'status' },
    ]),
    testHeading(631.66, '4.11', 90.0, 'VLAN-based Sub-interfaces', 126.0),
    table(T112(), 640.3, [
      { h: 460, cells: [label('Test No'), label('11')] },
      { h: 460, cells: [label('Test Details'), label('VLAN-based Sub-interfaces')] },
      { h: 907, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 460, cells: [label('Test Setup'), ''] },
    ]),
  );

  // ── Page 17: 4.11 (cont.), 4.12 ISIS/OSPF ──────────────────────────────────
  page(
    table(T115(), 60.5, [
      { h: 2721, cells: ['', setup(img.dutTestTerminal, 113.6, 113.6, 130.35, 6.56)] },
      {
        h: 533,
        cells: [
          label('Test Procedure'),
          bullets(['Create VLAN sub-interfaces on both routers.', 'Assign IP addresses to VLAN interfaces.']),
        ],
      },
      { h: 1877, cells: [label('Test Configuration'), configCell('N11')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      {
        h: 532,
        cells: [
          label('Expected Results'),
          bullets(['VLAN interfaces are up.', 'Ping between VLAN interfaces is successful.']),
        ],
      },
      { h: 1411, cells: [label('Test Results'), resultsCell('N11', '11')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N11', 54)], edge: 'status' },
    ]),
    testHeading(490.63, '4.12', 89.5, 'ISIS/OSPF', 144.0),
    table(T112(C2430), 499.3, [
      { h: 460, cells: [label('Test No'), label('12')] },
      { h: 461, cells: [label('Test Details'), label('ISIS/OSPF')] },
      { h: 907, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 3303, cells: [label('Test Setup'), setup(img.dutTestTerminal, 129.4, 129.3, 121.5, 19.08)] },
    ]),
  );

  // ── Page 18: 4.12 (cont.), 4.13 ISIS/OSPF MD5 ──────────────────────────────
  page(
    table(T115(C2430), 60.5, [
      {
        h: 1050,
        cells: [
          label('Test Procedure'),
          bullets([
              'Configure IP addresses on interfaces.',
              'Enable ISIS/OSPF and advertise interfaces.',
              ['Configure the LDP/RSVP and bind the LDP/RSVP', 'under interfaces.'],
            ]),
        ],
      },
      { h: 725, cells: [label('Test Configuration'), configCell('N12')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      {
        h: 1061,
        cells: [
          label('Expected Results'),
          bullets([
              'ISIS /CLNS (or) OSPF neighbour must be up.',
              'Routing table should reflect learned prefixes.',
              'Ping across ISIS /OSPF routers should be successful.',
            ]),
        ],
      },
      { h: 1175, cells: [label('Test Results'), resultsCell('N12', '12')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N12', 54)], edge: 'status' },
    ]),
    testHeading(337.13, '4.13', 89.5, 'ISIS /OSPF MD5 Authentication', 144.0),
    table(T112(C2430), 345.9, [
      { h: 460, cells: [label('Test No'), label('13')] },
      { h: 696, cells: [label('Test Details'), { html: `<div style="padding-top:11.72pt">${label('ISIS/OSPF  MD5  Authentication')}</div>` }] },
      { h: 911, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 2957, cells: [label('Test Setup'), setup(img.dutTestTerminal, 113.6, 113.6, 129.8, 18.13)] },
      {
        h: 1075,
        cells: [
          label('Test Procedure'),
          bullets([
                'Configure the IP under the interfaces.',
                'Configure the ISIS / OSPF and advertise the interfaces.',
                'Enable MD5 on ISIS/ OSPF interfaces.',
                'Use matching keys on both sides.',
              ], { left: 775 }),
        ],
      },
      { h: 1641, cells: [label('Test Configuration'), configCell('N13')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
    ]),
  );

  // ── Page 19: 4.13 (cont.), 4.14 MPLS LDP/RSVP ──────────────────────────────
  page(
    table(T115(C2430), 60.5, [
      {
        h: 518,
        cells: [label('Expected Results'), bullets([['ISIS/ OSPF adjacency forms successfully with MD5', 'authentication']])],
      },
      { h: 1881, cells: [label('Test Results'), resultsCell('N13', '13')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N13', 54)], edge: 'status' },
    ]),
    testHeading(233.42, '4.14', 89.5, 'MPLS LDP/RSVP Ping & Traceroute', 144.0),
    table(T112(C2430), 242.2, [
      { h: 460, cells: [label('Test No'), label('14')] },
      { h: 460, cells: [label('Test Details'), label('MPLS LDP/RSVP Ping & Traceroute')] },
      { h: 907, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 2847, cells: [label('Test Setup'), setup(img.mplsLdp, 200.8, 111.5, 95.0, 19.88)] },
      {
        h: 1613,
        cells: [
          label('Test Procedure'),
          bullets([
                'Configure the IP under the interfaces.',
                'Configure the Loopback and assign the interfaces.',
                'Configure the IGP protocol and make the Loopback reachable.',
                'Configure the LDP/RSVP',
                'Enable MPLS and LDP/RSVP under the interfaces.',
                'Check the MPLS LDP/RSVP ping & Traceroute the path.',
              ], { left: 775 }),
        ],
      },
      { h: 2534, cells: [label('Test Configuration'), configCell('N14')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      { h: 461, cells: [label('Expected Results'), bullets(['MPLS LDP/RSVP ping & traceroute should work.'], { left: 775, before: 97 })] },
      { h: 700, cells: [label('Test Results'), ''] },
    ]),
  );

  // ── Page 20: 4.14 (cont.), 4.15 LDP MD5 ────────────────────────────────────
  page(
    table(T115(C2430), 60.5, [
      { h: 940, cells: ['', resultsCell('N14', '14')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N14', 54)], edge: 'status' },
    ]),
    testHeading(160.22, '4.15', 89.5, 'LDP MD5/ Authentication', 144.0),
    table(T115(C2430), 168.7, [
      { h: 460, cells: [label('Test No'), label('15')] },
      { h: 460, cells: [label('Test Details'), label('LDP MD5 / Authentication')] },
      { h: 907, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 3164, cells: [label('Test Setup'), setup(img.ldpMd5, 244.7, 124.9, 7.0, 21.98)] },
      {
        h: 1886,
        cells: [
          label('Test Procedure'),
          bullets([
              'Configure the IP under the interfaces.',
              'Configure the Loopback and assign the interfaces.',
              'Configure the IGP protocol and make the Loopback reachable.',
              'Configure the LDP/RSVP',
              'Enable MPLS and LDP/RSVP on interfaces.',
              'Enable LDP/RSVP authentication with keys.',
              'Verify both routers use same credentials.',
            ]),
        ],
      },
      { h: 1445, cells: [label('Test Configuration'), configCell('N15')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      { h: 460, cells: [label('Expected Results'), bullets(['LDP sessions form securely.'], { before: 106 })] },
      { h: 1641, cells: [label('Test Results'), resultsCell('N15', '15')], edge: 'results' },
      { h: 465, cells: [label('Status'), statusCell('N15', 54)], edge: 'status' },
    ]),
  );

  // ── Page 21: 4.16 BGP MD5, 4.17 VRF / L3VPN ────────────────────────────────
  page(
    testHeading(71.04, '4.16', 89.5, 'BGP MD5 Authentication', 144.0),
    table(T115(C2430), 79.4, [
      { h: 460, cells: [label('Test No'), label('16')] },
      { h: 461, cells: [label('Test Details'), label('BGP MD5 Authentication')] },
      { h: 906, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 3240, cells: [label('Test Setup'), setup(img.dutTestTerminal, 127.6, 127.6, 123.3, 30.75)] },
      {
        h: 1339,
        cells: [
          label('Test Procedure'),
          bullets([
              'Configure IP addresses on physical interfaces.',
              'Configure the loopback and assign the IP address.',
              'Configure BGP neighbours.',
              'Set local/remote AS numbers.',
              'Configure MD5 keys on both BGP peers.',
            ]),
        ],
      },
      { h: 1876, cells: [label('Test Configuration'), configCell('N16')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      { h: 460, cells: [label('Expected Results'), bullets(['Session only comes up with the correct keys.'], { before: 96 })] },
      { h: 465, cells: [label('Test Results'), resultsCell('N16', '16')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N16', 54)], edge: 'status' },
    ]),
    testHeading(617.11, '4.17', 89.5, 'VRF Configuration & L3VPN', 144.0),
    table(T112(), 625.8, [
      { h: 460, cells: [label('Test No'), label('17')] },
      { h: 460, cells: [label('Test Details'), label('VRF Configuration / L3VPN')] },
      { h: 907, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs')] },
      { h: 460, cells: [label('Test Setup'), ''] },
    ]),
  );

  // ── Page 22: 4.17 (cont.), 4.18 L2 VPN ─────────────────────────────────────
  page(
    table(T115(), 60.5, [
      { h: 2913, cells: ['', setup(img.vrfL3vpn, 236.5, 121.1, 74.75, 12.68)] },
      {
        h: 1882,
        cells: [
          label('Test Procedure'),
          bullets([
              'Configure the IP address and assign under interfaces.',
              'Configure the Loopback and assign the IP address.',
              'Configure the IGP protocol and advertise under interfaces.',
              'Configure the BGP and established the neighbour ship',
              'Create VRFs on both routers.',
              'Bind the VRF under the physical interfaces.',
              'Advertise the L3VPN and VRF’s under BGP.',
            ]),
        ],
      },
      { h: 460, cells: [label('Test Configuration'), configCell('N17')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      { h: 537, cells: [label('Expected Results'), bullets(['VPNv4 routes are exchanged.', 'Ping the VRF IP address.'])] },
      { h: 1641, cells: [label('Test Results'), resultsCell('N17', '17')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N17', 54)], edge: 'status' },
    ]),
    testHeading(508.63, '4.18', 89.5, 'L2 VPN', 144.0),
    table(T112(), 517.3, [
      { h: 460, cells: [label('Test No'), label('18')] },
      { h: 461, cells: [label('Test Details'), label('L2 VPN')] },
      { h: 907, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs.')] },
      { h: 3096, cells: [label('Test Setup'), setup(img.l2vpn, 128.1, 111.0, 132.35, 32.95)] },
    ]),
  );

  // ── Page 23: 4.18 (cont.), 4.19 Segment routing ────────────────────────────
  const C2516 = [2516, 7476];
  page(
    table(T115(), 60.5, [
      {
        h: 1613,
        cells: [
          label('Test Procedure'),
          bullets([
              'Configure the IP address and assign under interfaces.',
              'Configure the Loopback and assign the IP address.',
              'Configure the IGP protocol and advertise under interfaces.',
              'Configure the LDP globally',
              'Enable the LDP under the interfaces.',
              'Configure the L2VPN and bind under interfaces.',
            ]),
        ],
      },
      { h: 1877, cells: [label('Test Configuration'), configCell('N18')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      {
        h: 797,
        cells: [
          label('Expected Results'),
          bullets(['L2VPN comes up is UP.', ' END to END ping work fine btw test terminal.']),
        ],
      },
      { h: 1170, cells: [label('Test Results'), resultsCell('N18', '18')], edge: 'results' },
      { h: 465, cells: [label('Status'), statusCell('N18', 54)], edge: 'status' },
    ]),
    testHeading(409.73, '4.19', 89.5, 'Segment Routing (SR-MPLS)', 144.0),
    table(T112(C2516), 418.1, [
      { h: 465, cells: [label('Test No'), label('20')] },
      { h: 460, cells: [label('Test Details'), label('Segment Routing (SR-MPLS)')] },
      { h: 906, cells: [label(INSTRUMENTS), label('Routers, SFPs, Fibre Cables, PCs.')] },
      { h: 3989, cells: [label('Test Setup'), setup(img.srMpls, 278.0, 167.5, 16.2, 21.28)] },
      {
        h: 1075,
        cells: [
          label('Test Procedure'),
          bullets([
                'Configure the IP address and assign under interfaces.',
                'Configure the Loopback and assign the IP address.',
                'Configure the IGP protocol and advertise under interfaces.',
                'Configure SRGB and SIDs on routers.',
              ], { left: 775, hanging: 361 }),
        ],
      },
    ]),
  );

  // ── Page 24: 4.19 (cont.) ──────────────────────────────────────────────────
  page(
    table(T115(C2516), 60.5, [
      { h: 460, cells: ['', bullets(['Enable IS-IS/OSPF with SR extensions.'], { left: 778, hanging: 361 })] },
      { h: 941, cells: [label('Test Configuration'), configCell('N20')] },
      { h: 446, cells: [label('Test Limits'), label('NA')] },
      {
        h: 633,
        cells: [
          label('Expected Results'),
          bullets(['SR-Ping returns the expected SID path.', 'SR-Traceroute shows correct segment hops.'], { left: 778, hanging: 361 }),
        ],
      },
      { h: 940, cells: [label('Test Results'), resultsCell('N20', '20')], edge: 'results' },
      { h: 460, cells: [label('Status'), statusCell('N20', 54)], edge: 'status' },
    ]),
  );

  // ── Page 25: additional tests, EMS ─────────────────────────────────────────
  page(
    text({ base: 71.0, scale: 1.1 }, ['Additional Tests']),
    text(
      {
        base: 93.5,
        x: 108.0,
        right: 526.0,
        align: 'justify',
        scale: 1.15,
        pitch: 13.9,
        marker: { text: '•', x: 90.0 },
      },
      [
        'If any additional features/design parameters are being followed in any',
        'package and approved in LLD, the same may be included as additional test',
        'cases by the IEs.',
      ],
    ),
    table({ x: 66.3, cols: [2833, 7088], border: 0.5, pad: 110 }, 133.1, [
      {
        h: 3946,
        cells: [
          { html: flow(133.1 + 0.25, 66.55, [text({ base: 144.5, x: 72.3, size: 12, scale: 1.2 }, ['EMS'])]), pad: 0, valign: 'top' },
          {
            html: flow(133.1 + 0.25, 208.2, [
              text({ base: 145.0, x: 214.0, size: 12, scale: 1.1, pitch: 14.1 }, [
                'Test 1: Single EMS of adequate capacity is to be supplied',
                'for all routers in the offered package. eMS will be as per',
                'Section 3.22 of TEC- GR 48050:2022 dated on March',
                '2022 or its latest version.',
                'Test 2: Requirement of EMS network redundancy and',
                'network elements as per RFP',
                'Test 3: Category and Type of Server, Type of Storage,',
                'Requirement of Optional EMS features, Scalability',
                'requirements for the SLA Management system like no.of',
                'business customers, maximum leads per customer etc',
                'may be provided, North Bound interface required towards',
                'NMS, Requirement of Optional Features',
              ]),
              text({ base: 314.4, x: 214.0, size: 12, bold: true, italic: true, scale: 1.12, pitch: 14.0 }, [
                'EMS tests to be taken care at the time of SNOC',
                'AT/validation',
              ]),
            ]),
            pad: 0,
            valign: 'top',
          },
        ],
      },
    ]),
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>AT Block Router - ${esc(data.blockName)}</title>
${FALLBACK_FONTS_LINK}
<style>${styles(DOC_CODE)}</style>
</head>
<body>
${pages.join('\n')}
${annexurePages(attach.annexures)}
</body>
</html>`;
};
