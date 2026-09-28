// Print template for the AT Block Rack checklist.
//
// Reproduces the filled reference documents for the Block Rack AT (ABP/AT/BLRK/002 Ver1.0):
// four portrait pages (cover, contents, introduction and memorandum, certification) as in
// 107398.pdf, then landscape pages for section 3.1 where, as in "INDPUR Rack Pre AT.pdf",
// each test is a table of its own (header row and the test's row) followed by its photos.
// Positions are in pt from the page's top-left corner, measured from those documents.
// PDFs and other documents appear as an icon with the file name.

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
  attachmentDocuments,
  attachmentImages,
  attachmentsHtml,
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
import {
  CERT_STANDARDS,
  COVER_TITLE,
  DECLARATION,
  DOC_REQUIREMENTS,
  INTRO_1,
  INTRO_2,
  NOTE_1,
  NOTE_2,
  SIGN_OFF,
  SIGN_OFF_LINES,
  rackTestColumns,
} from './atBlockRackContent';

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
  /* Section 3.1: one table per test, followed by its photos */
  /* A test's table and its photos stay on one page. */
  .rack-test { margin-top: 18pt; break-inside: avoid; page-break-inside: avoid; }
  .rack-test table { break-inside: avoid; page-break-inside: avoid; }
  .rack-test .tc { padding: 2pt 3pt; }
  .rack-test .files { justify-content: center; }
  .rack-photos { display: flex; flex-wrap: wrap; gap: 2pt; align-items: flex-end; margin-top: 10pt; }
  .rack-photos img.ev { max-width: 100%; margin: 0; }
  .cert-files { text-align: left; padding: 2pt 5.5pt 0; }
  .cert-files .files { margin-bottom: 2pt; }
`;

// ─── Document ───────────────────────────────────────────────────────────────

export const buildATBlockRackPrintHtml = (data: ATBlockRackPrintData): string => {
  const { memorandum: memo, images: img } = data;
  const test = (id: string) => data.tests[id] ?? { compliance: '', remarks: '', files: [] };

  const pages: string[] = [];
  const portrait = (...blocks: (ReturnType<typeof text> | string | false)[]) =>
    pages.push(`<section class="page port">${flow(P_TOP, P_LEFT, blocks)}</section>`);

  // ── Page 1: cover ──────────────────────────────────────────────────────────
  portrait(
    image(93.5, 162.4, 215.9, 126.0, img.bharatNetLogo),
    image(293.8, 219.4, 152.7, 113.7, img.bsnlLogo),
    text({ base: 429.31, x: 186.17, scale: 1.15 }, ['Bharat Sanchar Nigam Limited']),
    text({ base: 455.83, x: 66.26, right: 560, size: 12, scale: 1.145 }, [COVER_TITLE[0]]),
    text({ base: 469.99, x: 38.88, right: 560, size: 12, scale: 1.145 }, [COVER_TITLE[1]]),
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
    `<div class="in" style="padding:5pt 5.5pt 0;font-size:10pt">${[title, ...SIGN_OFF_LINES]
      .map((line, i) => `<div style="height:${i === 0 ? 22 : 23}pt">${esc(line)}</div>`)
      .join('')}<div>Signature<span style="display:inline-block;width:70pt;border-bottom:0.6pt solid #000000"></span></div></div>`;
  portrait(
    heading(90.26, '1.', 'Introduction'),
    text({ base: 121.1, right: 520.3, align: 'justify', scale: 1.15 }, INTRO_1),
    text({ base: 173.9, right: 520.6, align: 'justify', scale: 1.15 }, INTRO_2),
    heading(235.1, '2.', 'Acceptance Memorandum'),
    memoItem(258.17, 'a)', 'Equipment description', memo.equipmentDescription),
    memoItem(277.01, 'b)', 'Site Name with Block code', memo.siteNameBlockCode),
    memoItem(296.45, 'c)', 'Site Address', memo.siteAddress, 2),
    memoItem(328.61, 'd)', 'Date & Time', memo.dateTime),
    text({ base: 382.73, scale: 1.1, pitch: 26.88 }, DECLARATION),
    table({ x: 53.2, cols: [3155, 3155, 3156], border: 0.5, pad: 0, size: 11 }, 426.0, [
      {
        h: (554.2 - 426.0 - 0.5) * 20,
        cells: [
          ...SIGN_OFF.map((title) => ({ html: signCell(title), valign: 'top' as const })),
        ],
      },
    ]),
    text({ base: 621.34, scale: 1.1 }, ['*Note:']),
    text(
      { base: 648.22, x: 89.3, right: 526.3, align: 'justify', scale: 1.1, marker: { text: '1.', x: 71.3, scale: 1.24 } },
      NOTE_1,
    ),
    text(
      { base: 686.98, x: 89.3, right: 525.8, align: 'justify', scale: 1.15, marker: { text: '2.', x: 71.3, scale: 1.24 } },
      NOTE_2,
    ),
  );

  // ── Page 4: certification verification ─────────────────────────────────────
  const CERT: TableGeometry = { x: 66.7, cols: [3968, 5954], border: 0.5, pad: 0, size: 11 };
  const certLines = (lines: string[], size: number, scale: number, center = true) =>
    `<div style="font-size:${size}pt">${lines
      .map((line) => `<div class="sx" style="--sx:${scale}"><div class="ln${center ? ' c' : ''}">${esc(line)}</div></div>`)
      .join('')}</div>`;
  const certFiles = (keys: CertificationKey[]) => {
    const html = attachmentsHtml(keys.map((key) => data.certifications[key]), 200);
    return html ? `<div class="cert-files">${html}</div>` : '';
  };
  const cert = (label: string, lines: string[], keys: CertificationKey[], rowH: number, top = false): Row => ({
    h: (rowH - 0.5) * 20,
    cells: [
      { html: certLines([label], 12, 1.14), valign: top ? 'top' : 'middle', padTop: top ? 24 : 0 },
      { html: certFiles(keys) + certLines(lines, 11, 1.15), valign: top ? 'top' : 'middle', padTop: top ? 24 : 0 },
    ],
  });
  portrait(
    text({ base: 81.98, x: 72.0, scale: 1.1 }, ['Certification verification']),
    table(CERT, 98.4, [
      {
        h: (215.1 - 98.4 - 0.5) * 20,
        cells: [
          {
            html: `<div style="padding-left:5.75pt">${certLines(CERT_STANDARDS, 11, 1.15, false)}</div>`,
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
            html: `<div style="padding-left:4.4pt">${flow(
              363.65,
              266.7,
              DOC_REQUIREMENTS.map(([base, lines, scale]) => text({ base, x: 271.1, right: 560, scale }, lines)),
            )}</div>`,
            valign: 'top',
          },
        ],
      },
    ]),
  );

  // ── Landscape pages: 3. Acceptance Testing Test Cases, 3.1 table ───────────
  const { text: landText } = makeText({ x: 72.0, right: L_RIGHT });
  const values = (id: string): Cell[] => {
    const t = test(id);
    const remarks =
      (t.remarks ? `<div class="val-block" style="font-size:9pt">${esc(t.remarks)}</div>` : '') +
      attachmentDocuments(t.files);
    return [
      { html: t.compliance ? `<div class="val cell-val">${esc(t.compliance)}</div>` : '', align: 'center', pad: 0 },
      { html: remarks ? `<div class="cell-val">${remarks}</div>` : '', align: 'center', pad: 0 },
    ];
  };

  const testText = rackTestColumns();

  // Columns 0-1 (test number, clause) are centred, the others left-aligned.
  const testCell = (cells: RackCell[], c: number): Cell => {
    const lines = cells.flatMap((cell) => cell.lines);
    const html = lines
      .map(([line, , , scale]) => `<div class="sx" style="--sx:${scale}"><div class="ln${c < 2 ? ' c' : ''}">${esc(line)}</div></div>`)
      .join('');
    return { html: `<div class="tc">${html}</div>`, pad: 0 };
  };

  const firstPage = RACK_TABLE_PAGES[0];
  const header = firstPage.rows[0];
  const headerRow: Row = {
    h: rowTwips(header),
    className: 'hdr',
    cells: header.cells.map((cell, c) => staticCell(cell!, header.top, firstPage.cols[c], true)),
  };

  // One block per test, as in the filled reference: a table with the header row and the
  // test's row, followed by the test's photos.
  const testBlocks = [...testText.keys()]
    .map((id) => {
      const columns = testText.get(id)!;
      const row: Row = {
        h: 0,
        cells: [...columns.map(testCell), ...values(id)],
      };
      const photos = attachmentImages(test(id).files, 250);
      return `<div class="rack-test" style="margin-left:${n(firstPage.cols[0] - L_LEFT)}pt">${tableHtml(geometry(firstPage), [
        headerRow,
        row,
      ])}${photos ? `<div class="rack-photos">${photos}</div>` : ''}</div>`;
    })
    .join('');

  pages.push(
    `<section class="page land">${flow(L_TOP, L_LEFT, [
      landText(
        // The reference has this heading at 52.2, inside the landscape header band.
        { base: L_TOP + 12 * CAMBRIA_ASCENT, x: 93.38, size: 12, bold: true, scale: 1.15, marker: { text: '3.', x: 75.36, scale: 1.23 } },
        ['Acceptance Testing Test Cases'],
      ),
      landText(
        { base: 80.3, x: 108.02, size: 12, bold: true, scale: 1.2, marker: { text: '3.1', x: 72.0, scale: 1.17 } },
        ['TEST CASES FOR BLOCK RACK:'],
      ),
    ])}${testBlocks}</section>`,
  );

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
</body>
</html>`;
};
