// Print template for the AT Block Rack checklist.
//
// Reproduces the filled reference document for the Block Rack AT (107398.pdf,
// ABP/AT/BLRK/002 Ver1.0) page-for-page: four portrait pages (cover, contents,
// introduction and memorandum, certification) followed by landscape pages with the
// section 3.1 test table. Positions are in pt from the page's top-left corner, measured
// from that document. Evidence photos follow the test table (one block per test,
// repeating its row); PDFs are printed at the end of the document.

import type { CertificationKey } from '../forms/ATBlockRack';
import BharatNetLogo from '../../../images/logo/bharatnet-logo.jpg';
import BsnlLogo from '../../../images/logo/bsnl-logo.jpg';
import {
  BASE_STYLES,
  CAMBRIA_ASCENT,
  CAMBRIA_LINE,
  Cell,
  FALLBACK_FONTS_LINK,
  FOOTER_FONT_FACES,
  PrintFile,
  Row,
  TableGeometry,
  annexurePages,
  createAttachments,
  esc,
  flow,
  image,
  inlineValue,
  loadImages,
  makeText,
  marginBoxes,
  n,
  tabColon,
  table,
  tableHtml,
} from './printEngine';
import { RACK_TABLE_PAGES, RackCell, RackRow, RackTablePage } from './atBlockRackTable';

export { printHtmlDocument } from './printEngine';
export type { PrintFile } from './printEngine';

export const RACK_DOC_CODE = 'ABP/AT/BLRK/002 Ver1.0';

// ─── Data contract ──────────────────────────────────────────────────────────

export interface ATBlockRackPrintData {
  blockName: string;
  memorandum: {
    equipmentDescription: string;
    siteNameBlockCode: string;
    siteAddress: string;
    dateTime: string;
  };
  certifications: Record<CertificationKey, PrintFile | null>;
  tests: Record<string, { compliance: string; remarks: string; files: PrintFile[] }>;
  images: RackTemplateImages;
}

const RACK_TEMPLATE_IMAGE_SOURCES = { bharatNetLogo: BharatNetLogo, bsnlLogo: BsnlLogo };

export type RackTemplateImages = Record<keyof typeof RACK_TEMPLATE_IMAGE_SOURCES, string>;

export const loadRackTemplateImages = (toDataUrl: (src: string) => Promise<string>): Promise<RackTemplateImages> =>
  loadImages<keyof typeof RACK_TEMPLATE_IMAGE_SOURCES>(RACK_TEMPLATE_IMAGE_SOURCES, toDataUrl);

// ─── Page geometry (from the reference document) ────────────────────────────

// Portrait pages (the reference places text from x = 38.9, so the content area starts there)
const P_TOP = 64;
const P_LEFT = 36;
const P_RIGHT = 574.25;
// Landscape pages (test table); the top margin holds the header text.
const L_TOP = 48.6;
const L_LEFT = 17;
const L_RIGHT = 831;
const BOTTOM = 61;

const { text } = makeText({ x: 53.3, right: 526.5 });

// ─── Section 3.1 table ──────────────────────────────────────────────────────

const TABLE_BORDER = 0.5;
const HEADER_PITCH = 12 * CAMBRIA_LINE;
const BODY_PITCH = 11 * CAMBRIA_LINE;

/** Template text of a cell, placed line by line at its measured position. */
const staticCell = (cell: RackCell, rowTop: number, colLeft: number, header: boolean): Cell => {
  const size = header ? 12 : 11;
  const pitch = header ? HEADER_PITCH : BODY_PITCH;
  const ascent = size * CAMBRIA_ASCENT;
  let previous = 0;
  const html = cell.lines
    .map(([line, baseline, x, scale], i) => {
      const gap = i === 0 ? 0 : baseline - previous - pitch;
      previous = baseline;
      return `<div class="rl" style="margin-left:${n(x - colLeft - TABLE_BORDER / 2)}pt${
        gap ? `;margin-top:${n(gap)}pt` : ''
      }"><div class="sx" style="--sx:${scale}">${esc(line)}</div></div>`;
    })
    .join('');
  const firstTop = cell.lines.length ? cell.lines[0][1] - ascent - rowTop - TABLE_BORDER / 2 : 0;
  return { html, pad: 0, valign: 'top', padTop: Math.max(0, Math.round(firstTop * 20)), rowspan: cell.rowspan };
};

const geometry = (page: RackTablePage): TableGeometry => ({
  x: page.cols[0],
  cols: page.cols.slice(1).map((right, i) => (right - page.cols[i]) * 20),
  border: TABLE_BORDER,
  pad: 0,
  size: 11,
});

const rowTwips = (row: RackRow) => (row.bottom - row.top - TABLE_BORDER) * 20;

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = () => `${FOOTER_FONT_FACES}

  @page {
    size: A4;
    margin: ${P_TOP}pt 21.25pt ${BOTTOM}pt ${P_LEFT}pt;${marginBoxes({
      docCode: RACK_DOC_CODE,
      headerLeft: n(397.2 - P_LEFT),
      headerTop: 35.64,
      footerLeft: n(266.0 - P_LEFT),
      footerTop: 1.0,
    })}
  }
  @page landscape {
    size: A4 landscape;
    margin: ${L_TOP}pt 11pt ${BOTTOM}pt ${L_LEFT}pt;${marginBoxes({
      docCode: RACK_DOC_CODE,
      headerLeft: n(643.9 - L_LEFT),
      headerTop: 35.64,
      footerLeft: n(386.0 - L_LEFT),
      footerTop: 1.0,
    })}
  }
${BASE_STYLES}
  .page.land { page: landscape; }
  @media screen {
    body { margin: 20pt; }
    .page.port { width: ${n(P_RIGHT - P_LEFT)}pt; }
    .page.land { width: ${n(L_RIGHT - L_LEFT)}pt; }
    .page + .page { margin-top: 40pt; }
  }
  .rl { white-space: nowrap; }
  tr.hdr td { background: #D9D9D9; border-top-width: 0.96pt; border-bottom-width: 0.96pt; font-weight: 700; }
  .cell-val { padding: 0 2pt; }
  .cell-val .val-block { line-height: ${CAMBRIA_LINE}; }
  .cell-val .fchip { width: auto; max-width: 100%; font-size: 6pt; }
  .cell-val .fchip svg { width: 20pt; height: 24pt; }
  .rack-evidence { break-before: page; page-break-before: always; }
  .ev-group { margin-bottom: 10pt; }
  .ev-group > .row-copy { break-after: avoid; page-break-after: avoid; margin-bottom: 6pt; }
  .ev-images { display: flex; flex-wrap: wrap; gap: 8pt; align-items: flex-start; }
  .ev-images img.ev { max-width: 100%; margin: 0; }
  .cert-files { text-align: left; padding: 2pt 5.5pt 0; }
  .cert-files .files { margin-bottom: 2pt; }
  .annex { height: 700pt; }
`;

// ─── Document ───────────────────────────────────────────────────────────────

export const buildATBlockRackPrintHtml = (data: ATBlockRackPrintData): string => {
  const { memorandum: memo, images: img } = data;
  const attach = createAttachments();
  const test = (id: string) => data.tests[id] ?? { compliance: '', remarks: '', files: [] };

  const pages: string[] = [];
  const portrait = (...blocks: (ReturnType<typeof text> | string | false)[]) =>
    pages.push(`<section class="page port">${flow(P_TOP, P_LEFT, blocks)}</section>`);

  // ── Page 1: cover ──────────────────────────────────────────────────────────
  portrait(
    image(93.5, 162.4, 215.9, 126.0, img.bharatNetLogo),
    image(293.8, 219.4, 152.7, 113.7, img.bsnlLogo),
    text({ base: 429.31, x: 186.17, scale: 1.15 }, ['Bharat Sanchar Nigam Limited']),
    text({ base: 455.83, x: 66.26, right: 560, size: 12, scale: 1.145 }, [
      'Acceptance Testing Test Cases document for Block Rack as per BSNL',
    ]),
    text({ base: 469.99, x: 38.88, right: 560, size: 12, scale: 1.145 }, [
      'Bharatnet Tender No. MM/BNO&M/BN-III/T-791/2024 issued on 15.02.2024',
    ]),
  );

  // ── Page 2: table of contents ──────────────────────────────────────────────
  const toc = (base: number, number: string, title: string, level: 0 | 1, scale: number) =>
    text(
      {
        base,
        x: level === 0 ? 108.0 : 126.0,
        size: 12,
        pitch: 14,
        scale,
        marker: { text: number, x: 90.0, scale: level === 0 ? 1.23 : 1.18 },
      },
      [title],
    );
  portrait(
    text({ base: 96.74, x: 72.0, size: 12, bold: true, scale: 1.1 }, ['Table of Contents']),
    toc(124.94, '1.', 'Introduction', 0, 1.1),
    toc(138.98, '2.', 'Acceptance Memorandum', 0, 1.14),
    toc(153.26, '3.', 'Acceptance testing test cases', 0, 1.14),
    toc(167.42, '3.1', 'Test cases for BLOCK smart rack', 1, 1.14),
  );

  // ── Page 3: introduction, acceptance memorandum ────────────────────────────
  const heading = (base: number, number: string, title: string) =>
    text(
      {
        base,
        x: 71.18,
        size: 20,
        scale: 1.1,
        color: '#2E5395',
        marker: { text: number, x: 53.3, size: 16, bold: true, scale: 1.19 },
      },
      [title],
    );
  const MEMO_MARKER_X = 89.3;
  const COLON_X = 269.5;
  // `lines`: lines the item takes in the reference (the site address wraps to two).
  const memoItem = (base: number, letter: string, label: string, value: string, lines = 1) =>
    text(
      {
        base,
        x: 102.62,
        scale: 1.15,
        marker: { text: letter, x: MEMO_MARKER_X, scale: 0.78 },
        extra: tabColon(COLON_X - MEMO_MARKER_X) + inlineValue(value, COLON_X + 5 - MEMO_MARKER_X, lines),
      },
      [label, ...Array(lines - 1).fill(' ')],
    );
  // Sign-off table (in the reference document this area holds the signed copy).
  const signCell = (title: string) =>
    `<div class="in" style="padding:5pt 5.5pt 0;font-size:10pt">${[
      title,
      'Representative Name:',
      'Designation:',
      'Date:',
    ]
      .map((line, i) => `<div style="height:${i === 0 ? 22 : 23}pt">${esc(line)}</div>`)
      .join('')}<div>Signature<span style="display:inline-block;width:70pt;border-bottom:0.6pt solid #000000"></span></div></div>`;
  portrait(
    heading(90.26, '1.', 'Introduction'),
    text({ base: 121.1, right: 520.3, align: 'justify', scale: 1.15 }, [
      'This document outlines the Acceptance Testing (A/T) procedures for Smart Rack at',
      'Block, in accordance with the requirements of BSNL BharatNet Tender No.',
      'MM/BNO&M/BN-III/T-791/2024 dated 15.02.2024.',
    ]),
    text({ base: 173.9, right: 520.6, align: 'justify', scale: 1.15 }, [
      'It covers the applicable test cases in line with industry best practices, relevant',
      'specifications and standards, and includes the acceptance testing template for quality',
      'assurance in accordance with the requirements specified in the RFP.',
    ]),
    heading(235.1, '2.', 'Acceptance Memorandum'),
    memoItem(258.17, 'a)', 'Equipment description', memo.equipmentDescription),
    memoItem(277.01, 'b)', 'Site Name with Block code', memo.siteNameBlockCode),
    memoItem(296.45, 'c)', 'Site Address', memo.siteAddress, 2),
    memoItem(328.61, 'd)', 'Date & Time', memo.dateTime),
    text({ base: 382.73, scale: 1.1, pitch: 26.88 }, [
      'We hereby declare that all tests in this form were successfully completed. Note (if',
      'any):',
    ]),
    table({ x: 53.2, cols: [3155, 3155, 3156], border: 0.5, pad: 0, size: 11 }, 426.0, [
      {
        h: (554.2 - 426.0 - 0.5) * 20,
        cells: [
          { html: signCell('PIA Representative’s Sign off'), valign: 'top' },
          { html: signCell('IE Representative’s Sign off'), valign: 'top' },
          { html: signCell('BSNL Representative’s Sign off*'), valign: 'top' },
        ],
      },
    ]),
    text({ base: 621.34, scale: 1.1 }, ['*Note:']),
    text(
      { base: 648.22, x: 89.3, right: 526.3, align: 'justify', scale: 1.1, marker: { text: '1.', x: 71.3, scale: 1.24 } },
      [
        'For first time AT of Block Router, GP Router, Block Rack, GP Rack, Route and',
        'Ring, one BSNL person may be kept mandatorily and his/her signatures are',
        'required on the AT document.',
      ],
    ),
    text(
      { base: 686.98, x: 89.3, right: 525.8, align: 'justify', scale: 1.15, marker: { text: '2.', x: 71.3, scale: 1.24 } },
      [
        'For subsequent ATs, BSNL may assign person on need basis or as requested by',
        'any PIA. Decision regarding the same shall be taken by BharatNet State Head on',
        'case-to-case basis.',
      ],
    ),
  );

  // ── Page 4: certification verification ─────────────────────────────────────
  const CERT: TableGeometry = { x: 66.7, cols: [3968, 5954], border: 0.5, pad: 0, size: 11 };
  const certLines = (lines: string[], size: number, scale: number, center = true) =>
    `<div style="font-size:${size}pt">${lines
      .map((line) => `<div class="sx" style="--sx:${scale}"><div class="ln${center ? ' c' : ''}">${esc(line)}</div></div>`)
      .join('')}</div>`;
  const certFiles = (keys: CertificationKey[], label: string) => {
    const html = attach.html(keys.map((key) => data.certifications[key]), label, 200);
    return html ? `<div class="cert-files">${html}</div>` : '';
  };
  const cert = (label: string, lines: string[], keys: CertificationKey[], rowH: number, top = false): Row => ({
    h: (rowH - 0.5) * 20,
    cells: [
      { html: certLines([label], 12, 1.14), valign: top ? 'top' : 'middle', padTop: top ? 24 : 0 },
      { html: certFiles(keys, label) + certLines(lines, 11, 1.15), valign: top ? 'top' : 'middle', padTop: top ? 24 : 0 },
    ],
  });
  portrait(
    text({ base: 81.98, x: 72.0, scale: 1.1 }, ['Certification verification']),
    table(CERT, 98.4, [
      {
        h: (215.1 - 98.4 - 0.5) * 20,
        cells: [
          {
            html: `<div style="padding-left:5.75pt">${certLines(
              [
                'Rack: DIN41491, DIN41494, and',
                'IEC297.',
                'All products/OEM: ISO 9001,',
                '14001, ISO 45001 and IS13252:',
                'PART1 (2010) & IEC 60950-1.',
                'Protection category: IP55:',
                'IS/IEC60529:2001. Certificate',
                'from NABL accredited lab shall be',
                'attached',
              ],
              11,
              1.15,
              false,
            )}</div>`,
            valign: 'top',
            padTop: 22,
          },
          { html: certLines(['Declaration'], 11, 1.15) },
        ],
      },
      cert('TSEC Certificate', ['Date of TSEC'], ['tsecCertificate'], 16.0),
      cert('QA Certificate', ['Date of QA and check Unique S.No. of', 'rack'], ['qaCertificate'], 28.0, true),
      cert('QR Code, logo', ['Photo evidence'], ['qrCodeLogo', 'photoEvidence'], 15.9),
      cert('OEM approval by BSNL', [], ['oemApproval'], 16.0, true),
      {
        h: (506.0 - 363.4 - 0.5) * 20,
        cells: [
          { html: certLines(['Documentation requirements'], 12, 1.14) },
          {
            html: `<div style="padding-left:4.4pt">${flow(363.65, 266.7, [
              text({ base: 374.33, x: 271.1, right: 560, scale: 1.1 }, ['Test 1: The contractor shall provide following', 'documents:']),
              text({ base: 400.01, x: 271.1, right: 560, scale: 1.15 }, ['a. System description documents']),
              text({ base: 412.97, x: 271.1, right: 560, scale: 1.15 }, ['b. Installation, Operation and Maintenance', 'documents']),
              text({ base: 451.75, x: 271.1, right: 560, scale: 1.15 }, [
                'Test 2: All technical documents shall be in English',
                'language both in CD- ROM and in hard copy.',
              ]),
              text({ base: 489.43, x: 271.1, right: 560, scale: 1.1 }, [
                'To be provided by PIA along with first BLOCK AT',
                'offered for the package',
              ]),
            ])}</div>`,
            valign: 'top',
          },
        ],
      },
    ]),
  );

  // ── Landscape pages: 3. Acceptance Testing Test Cases, 3.1 table ───────────
  const { text: landText } = makeText({ x: 72.0, right: L_RIGHT });
  const values = (row: RackRow): Cell[] => {
    if (!row.test) return [{ html: '' }, { html: '' }];
    const t = test(row.test);
    const remarks =
      (t.remarks ? `<div class="val-block" style="font-size:9pt">${esc(t.remarks)}</div>` : '') +
      attach.documents(t.files, `${row.test.replace('T', 'T-')} document`, true, false);
    return [
      { html: t.compliance ? `<div class="val cell-val">${esc(t.compliance)}</div>` : '', valign: 'top', pad: 4 },
      { html: remarks ? `<div class="cell-val">${remarks}</div>` : '', valign: 'top', pad: 0, padTop: 22 },
    ];
  };
  const rackRows = (page: RackTablePage, rows: RackRow[]): Row[] =>
    rows.map((row) => {
      const cells: Cell[] = [];
      row.cells.forEach((cell, c) => {
        if (cell) cells.push(staticCell(cell, row.top, page.cols[c], !!row.header));
      });
      return {
        h: rowTwips(row),
        className: row.header ? 'hdr' : undefined,
        cells: row.header ? cells : [...cells, ...values(row)],
      };
    });

  RACK_TABLE_PAGES.forEach((page, index) => {
    const blocks = [];
    if (index === 0) {
      blocks.push(
        landText(
          // The reference has this heading at 52.2, inside the landscape header band.
          { base: L_TOP + 12 * CAMBRIA_ASCENT, x: 93.38, size: 12, bold: true, scale: 1.15, marker: { text: '3.', x: 75.36, scale: 1.23 } },
          ['Acceptance Testing Test Cases'],
        ),
        landText(
          { base: 80.3, x: 108.02, size: 12, bold: true, scale: 1.2, marker: { text: '3.1', x: 72.0, scale: 1.17 } },
          ['TEST CASES FOR BLOCK RACK:'],
        ),
      );
    }
    blocks.push(table(geometry(page), page.rows[0].top, rackRows(page, page.rows)));
    pages.push(`<section class="page land">${flow(L_TOP, L_LEFT, blocks)}</section>`);
  });

  // ── Evidence: photos of each test below its repeated row ───────────────────
  const firstRow = new Map<string, { page: RackTablePage; row: RackRow; covered: (RackCell | undefined)[] }>();
  RACK_TABLE_PAGES.forEach((page) => {
    const spanning: (RackCell | undefined)[] = [];
    page.rows.forEach((row) => {
      row.cells.forEach((cell, c) => {
        if (cell?.rowspan) spanning[c] = cell;
        else if (cell) spanning[c] = undefined;
      });
      if (row.test && !firstRow.has(row.test)) firstRow.set(row.test, { page, row, covered: [...spanning] });
    });
  });
  const rowCopy = (id: string) => {
    const entry = firstRow.get(id);
    if (!entry) return '';
    const { page, row, covered } = entry;
    const cells: Cell[] = row.cells.map((cell, c) => {
      const source = cell ?? covered[c];
      if (!source) return { html: '' };
      const rendered = staticCell({ lines: source.lines }, row.top, page.cols[c], false);
      // Text of a merged cell is centred in the single copied row.
      return cell && !cell.rowspan ? rendered : { ...rendered, valign: 'middle', padTop: 0 };
    });
    return `<div class="row-copy">${tableHtml(geometry(page), [
      { h: rowTwips(row), cells: [...cells, ...values(row)] },
    ])}</div>`;
  };
  const evidence = RACK_TABLE_PAGES.flatMap((page) => page.rows)
    .filter((row) => row.test && firstRow.get(row.test)?.row === row)
    .map((row) => {
      const photos = attach.images(test(row.test!).files, 230);
      return photos ? `<div class="ev-group">${rowCopy(row.test!)}<div class="ev-images">${photos}</div></div>` : '';
    })
    .join('');
  if (evidence) pages.push(`<section class="page land rack-evidence">${evidence}</section>`);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>AT Block Rack - ${esc(data.blockName)}</title>
${FALLBACK_FONTS_LINK}
<style>${styles()}</style>
</head>
<body>
${pages.join('\n')}
${annexurePages(attach.annexures, 'page port annex')}
</body>
</html>`;
};
