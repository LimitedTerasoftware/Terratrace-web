// Word download for the AT Block Rack checklist, laid out like the print
// (atBlockRackPrint.ts): portrait pages 1-4 (cover, contents, introduction and memorandum,
// certification), then a landscape section 3.1 with one table per test followed by its
// photos. Positions are the same pt values (from the reference documents); header and
// footer use Word's PAGE / NUMPAGES fields.

import JSZip from 'jszip';
import type { CertificationKey } from '../forms/ATBlockRack';
import { RACK_DOC_CODE, type ATBlockRackPrintData } from './atBlockRackPrint';
import { RACK_TABLE_PAGES, RackCell, RackLine } from './atBlockRackTable';
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
import { Media, NAMESPACES, attachmentsXml, createMedia, runXml, saveDocx, twips } from './docxUtils';

const CAMBRIA_ASCENT = 0.9502;
const CAMBRIA_LINE = 1.1724;

// Portrait pages (pt)
const P = { top: 64, left: 53.3, right: 69, bottom: 61, width: 595.5, height: 842 };
// Landscape section 3.1 (pt)
const L = { top: 48.6, left: 17, right: 11, bottom: 61, width: 842, height: 595.5 };

// ─── Paragraph building ─────────────────────────────────────────────────────

interface RunStyle {
  size?: number;
  bold?: boolean;
  color?: string;
  scale?: number;
  font?: string;
  underline?: boolean;
}

const rPr = (s: RunStyle = {}) =>
  [
    s.font ? `<w:rFonts w:ascii="${s.font}" w:hAnsi="${s.font}" w:cs="${s.font}"/>` : '',
    s.bold ? '<w:b/>' : '',
    s.color ? `<w:color w:val="${s.color}"/>` : '',
    s.scale && s.scale !== 1 ? `<w:w w:val="${Math.round(s.scale * 100)}"/>` : '',
    s.size ? `<w:sz w:val="${Math.round(s.size * 2)}"/><w:szCs w:val="${Math.round(s.size * 2)}"/>` : '',
    s.underline ? '<w:u w:val="single"/>' : '',
  ].join('');

const run = (text: string, s: RunStyle = {}) => runXml(text, rPr(s));

interface ParaOptions extends RunStyle {
  base: number; // baseline of the first line (pt from the page top)
  x: number; // start of the text (pt from the page's left edge)
  right?: number; // right limit (pt from the page's left edge)
  align?: 'left' | 'center' | 'both';
  pitch?: number; // exact line pitch
  marker?: { text: string; x: number } & RunStyle; // list number in the hanging indent
  tabs?: number[]; // extra left tab stops (pt from the page's left edge)
  extra?: string; // runs appended after the text
  pageBreakBefore?: boolean;
}

/** Tracks the vertical position so spacing reproduces the reference positions. */
const createFlow = (page: typeof P) => {
  let cursor = page.top;
  const reset = () => {
    cursor = page.top;
  };

  /** Paragraph with Word's line breaks (lines ending in a break are justified like the print). */
  const para = (o: ParaOptions, lines: string[]) => {
    const size = o.size ?? 11;
    const pitch = o.pitch ?? size * CAMBRIA_LINE;
    const top = o.base - ((pitch - size * CAMBRIA_LINE) / 2 + size * CAMBRIA_ASCENT);
    const before = o.pageBreakBefore ? top - page.top : top - cursor;
    cursor = top + lines.length * pitch;
    const left = o.x - page.left;
    const hanging = o.marker ? o.x - o.marker.x : 0;
    const right = o.right === undefined ? 0 : page.width - page.right - o.right;
    const pPr = [
      o.pageBreakBefore ? '<w:pageBreakBefore/>' : '',
      o.marker || o.tabs?.length
        ? `<w:tabs>${[...(o.marker ? [o.x] : []), ...(o.tabs ?? [])]
            .map((t) => `<w:tab w:val="left" w:pos="${twips(t - page.left)}"/>`)
            .join('')}</w:tabs>`
        : '',
      `<w:spacing w:before="${twips(Math.max(0, before))}" w:after="0" ${
        o.pitch ? `w:line="${twips(pitch)}" w:lineRule="exact"` : 'w:line="240" w:lineRule="auto"'
      }/>`,
      `<w:ind w:left="${twips(left)}" w:right="${twips(Math.max(0, right))}"${hanging ? ` w:hanging="${twips(hanging)}"` : ''}/>`,
      o.align && o.align !== 'left' ? `<w:jc w:val="${o.align}"/>` : '',
    ].join('');
    const style: RunStyle = { size, bold: o.bold, color: o.color, scale: o.scale, font: o.font };
    const marker = o.marker ? run(o.marker.text, { size, ...o.marker }) + '<w:r><w:tab/></w:r>' : '';
    const text = lines.map((line, i) => (i ? '<w:r><w:br/></w:r>' : '') + run(line, style)).join('');
    return `<w:p><w:pPr>${pPr}</w:pPr>${marker}${text}${o.extra ?? ''}</w:p>`;
  };

  /** Paragraph holding one image, placed at `top` / `x`. */
  const imagePara = (media: Media, image: Awaited<ReturnType<Media['add']>>, top: number, x: number, w: number, h: number) => {
    const before = top - cursor;
    cursor = top + h;
    return `<w:p><w:pPr><w:spacing w:before="${twips(Math.max(0, before))}" w:after="0"/><w:ind w:left="${twips(
      x - page.left,
    )}"/></w:pPr>${image ? media.imageRun(image, w, h) : ''}</w:p>`;
  };

  /** Empty paragraph that moves the next block (e.g. a table) down to `top`. */
  const spaceTo = (top: number) => {
    const gap = Math.max(1, top - cursor);
    cursor = top;
    return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${twips(gap)}" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>`;
  };

  const advance = (top: number) => {
    cursor = top;
  };

  return { para, imagePara, spaceTo, advance, reset };
};

// ─── Tables ─────────────────────────────────────────────────────────────────

const BORDER = '<w:top w:val="single" w:sz="4" w:color="000000"/><w:left w:val="single" w:sz="4" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:color="000000"/><w:right w:val="single" w:sz="4" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:color="000000"/><w:insideV w:val="single" w:sz="4" w:color="000000"/>';

const tableXml = (indent: number, cols: number[], rows: string) =>
  `<w:tbl><w:tblPr><w:tblInd w:w="${twips(indent)}" w:type="dxa"/><w:tblBorders>${BORDER}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${cols
    .map((c) => `<w:gridCol w:w="${twips(c)}"/>`)
    .join('')}</w:tblGrid>${rows}</w:tbl>`;

const rowXml = (height: number | null, cells: string, trPr = '') =>
  `<w:tr><w:trPr><w:cantSplit/>${height ? `<w:trHeight w:val="${twips(height)}" w:hRule="atLeast"/>` : ''}${trPr}</w:trPr>${cells}</w:tr>`;

const cellXml = (width: number, content: string, o: { vAlign?: 'top' | 'center'; shade?: string; tcBorders?: string; margin?: number } = {}) =>
  `<w:tc><w:tcPr><w:tcW w:w="${twips(width)}" w:type="dxa"/>${o.tcBorders ?? ''}${
    o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : ''
  }${o.margin !== undefined ? `<w:tcMar><w:left w:w="${twips(o.margin)}" w:type="dxa"/><w:right w:w="${twips(o.margin)}" w:type="dxa"/></w:tcMar>` : ''}<w:vAlign w:val="${
    o.vAlign ?? 'center'
  }"/></w:tcPr>${content || '<w:p/>'}</w:tc>`;

/** Cell paragraph: lines with their own horizontal scale. */
const linesPara = (lines: RackLine[] | [string, number][], o: RunStyle & { center?: boolean; keepNext?: boolean; before?: number } = {}) =>
  `<w:p><w:pPr>${o.keepNext ? '<w:keepNext/>' : ''}<w:spacing w:before="${twips(o.before ?? 0)}" w:after="0" w:line="240" w:lineRule="auto"/>${
    o.center ? '<w:jc w:val="center"/>' : ''
  }</w:pPr>${lines
    .map((line, i) => {
      const [text, scale] = line.length === 4 ? [line[0], line[3]] : [line[0], line[1]];
      return (i ? '<w:r><w:br/></w:r>' : '') + run(text, { size: o.size ?? 11, bold: o.bold, scale });
    })
    .join('')}</w:p>`;

// ─── Header / footer ────────────────────────────────────────────────────────

const headerXml = (indent: number) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NAMESPACES}><w:p><w:pPr><w:ind w:left="${twips(indent)}"/></w:pPr>${run(
    RACK_DOC_CODE,
    { font: 'Arial', size: 11 },
  )}</w:p></w:hdr>`;

const field = (instr: string) => {
  const s = rPr({ font: 'Arial', size: 12, bold: true });
  return `<w:r><w:rPr>${s}</w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr>${s}</w:rPr><w:instrText xml:space="preserve"> ${instr} </w:instrText></w:r><w:r><w:rPr>${s}</w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr>${s}</w:rPr><w:t>1</w:t></w:r><w:r><w:rPr>${s}</w:rPr><w:fldChar w:fldCharType="end"/></w:r>`;
};

const footerXml = (indent: number) =>
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NAMESPACES}><w:p><w:pPr><w:ind w:left="${twips(indent)}"/></w:pPr>${run('Page ', {
    font: 'Arial',
    size: 11,
  })}${field('PAGE')}${run(' of ', { font: 'Arial', size: 11 })}${field('NUMPAGES')}</w:p></w:ftr>`;

const sectPr = (page: typeof P, header: string, footer: string, landscape: boolean) =>
  `<w:sectPr><w:headerReference w:type="default" r:id="${header}"/><w:footerReference w:type="default" r:id="${footer}"/><w:pgSz w:w="${twips(
    page.width,
  )}" w:h="${twips(page.height)}"${landscape ? ' w:orient="landscape"' : ''}/><w:pgMar w:top="${twips(page.top)}" w:right="${twips(
    page.right,
  )}" w:bottom="${twips(page.bottom)}" w:left="${twips(page.left)}" w:header="712" w:footer="966" w:gutter="0"/></w:sectPr>`;

// ─── Package parts ──────────────────────────────────────────────────────────

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/header2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/word/footer2.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header2.xml"/><Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/></Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Cambria" w:hAnsi="Cambria" w:eastAsia="Cambria" w:cs="Cambria"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;

const SETTINGS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="720"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;

// ─── Document ───────────────────────────────────────────────────────────────

export const downloadATBlockRackDocx = async (data: ATBlockRackPrintData) => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CONTENT_TYPES);
  zip.file('_rels/.rels', ROOT_RELS);
  zip.file('word/_rels/document.xml.rels', DOCUMENT_RELS);
  zip.file('word/styles.xml', STYLES);
  zip.file('word/settings.xml', SETTINGS);
  zip.file('word/header1.xml', headerXml(397.2 - P.left));
  zip.file('word/footer1.xml', footerXml(266.0 - P.left));
  zip.file('word/header2.xml', headerXml(643.9 - L.left));
  zip.file('word/footer2.xml', footerXml(386.0 - L.left));
  const media = await createMedia(zip);

  const { memorandum: memo } = data;
  const test = (id: string) => data.tests[id] ?? { compliance: '', remarks: '', files: [] };
  const body: string[] = [];
  const f = createFlow(P);

  // ── Page 1: cover ──────────────────────────────────────────────────────────
  body.push(f.imagePara(media, await media.add(data.images.bharatNetLogo), 93.5, 162.4, 215.9, 126.0));
  body.push(f.imagePara(media, await media.add(data.images.bsnlLogo), 293.8, 219.4, 152.7, 113.7));
  body.push(f.para({ base: 429.31, x: 186.17, scale: 1.15 }, ['Bharat Sanchar Nigam Limited']));
  body.push(f.para({ base: 455.83, x: 66.26, size: 12, scale: 1.145 }, [COVER_TITLE[0]]));
  body.push(f.para({ base: 469.99, x: 38.88, size: 12, scale: 1.145 }, [COVER_TITLE[1]]));

  // ── Page 2: table of contents ──────────────────────────────────────────────
  const toc = (base: number, number: string, title: string, level: 0 | 1, scale: number) =>
    f.para(
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
  body.push(f.para({ base: 96.74, x: 72.0, size: 12, bold: true, scale: 1.1, pageBreakBefore: true }, ['Table of Contents']));
  body.push(toc(124.94, '1.', 'Introduction', 0, 1.1));
  body.push(toc(138.98, '2.', 'Acceptance Memorandum', 0, 1.14));
  body.push(toc(153.26, '3.', 'Acceptance testing test cases', 0, 1.14));
  body.push(toc(167.42, '3.1', 'Test cases for BLOCK smart rack', 1, 1.14));

  // ── Page 3: introduction, acceptance memorandum ────────────────────────────
  const heading = (base: number, number: string, title: string, pageBreakBefore = false) =>
    f.para(
      {
        base,
        x: 71.18,
        size: 20,
        scale: 1.1,
        color: '2E5395',
        pageBreakBefore,
        marker: { text: number, x: 53.3, size: 16, bold: true, scale: 1.19, color: '000000' },
      },
      [title],
    );
  const COLON_X = 269.5;
  const memoItem = (base: number, letter: string, label: string, value: string, lines = 1) => {
    const p = f.para(
      {
        base,
        x: 102.62,
        scale: 1.15,
        tabs: [COLON_X],
        marker: { text: letter, x: 89.3, scale: 0.78 },
        extra: `<w:r><w:tab/></w:r>${run(':', { scale: 1.15 })}${value ? run(` ${value}`) : ''}`,
      },
      [label],
    );
    if (lines > 1) f.advance(base - 11 * CAMBRIA_ASCENT + lines * 11 * CAMBRIA_LINE);
    return p;
  };
  body.push(heading(90.26, '1.', 'Introduction', true));
  body.push(f.para({ base: 121.1, x: 53.3, right: 520.3, align: 'both', scale: 1.15 }, INTRO_1));
  body.push(f.para({ base: 173.9, x: 53.3, right: 520.6, align: 'both', scale: 1.15 }, INTRO_2));
  body.push(heading(235.1, '2.', 'Acceptance Memorandum'));
  body.push(memoItem(258.17, 'a)', 'Equipment description', memo.equipmentDescription));
  body.push(memoItem(277.01, 'b)', 'Site Name with Block code', memo.siteNameBlockCode));
  body.push(memoItem(296.45, 'c)', 'Site Address', memo.siteAddress, 2));
  body.push(memoItem(328.61, 'd)', 'Date & Time', memo.dateTime));
  body.push(f.para({ base: 382.73, x: 53.3, scale: 1.1, pitch: 26.88 }, DECLARATION));

  // Sign-off table
  body.push(f.spaceTo(426.0));
  const signCell = (title: string) =>
    [title, ...SIGN_OFF_LINES]
      .map((line, i) => `<w:p><w:pPr><w:spacing w:before="${i ? 0 : 100}" w:after="0" w:line="${i === 0 ? 440 : 460}" w:lineRule="exact"/><w:ind w:left="110"/></w:pPr>${run(line, { size: 10 })}</w:p>`)
      .join('') +
    `<w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="2660"/></w:tabs><w:spacing w:before="0" w:after="0" w:line="460" w:lineRule="exact"/><w:ind w:left="110"/></w:pPr>${run('Signature', { size: 10 })}<w:r><w:rPr>${rPr({
      size: 10,
      underline: true,
    })}</w:rPr><w:tab/></w:r></w:p>`;
  body.push(
    tableXml(0, [157.75, 157.75, 157.8], rowXml(128.2, SIGN_OFF.map((title) => cellXml(157.75, signCell(title), { vAlign: 'top' })).join(''))),
  );
  f.advance(554.2);
  body.push(f.para({ base: 621.34, x: 53.3, scale: 1.1 }, ['*Note:']));
  body.push(f.para({ base: 648.22, x: 89.3, right: 526.3, align: 'both', scale: 1.1, marker: { text: '1.', x: 71.3, scale: 1.24 } }, NOTE_1));
  body.push(f.para({ base: 686.98, x: 89.3, right: 525.8, align: 'both', scale: 1.15, marker: { text: '2.', x: 71.3, scale: 1.24 } }, NOTE_2));

  // ── Page 4: certification verification ─────────────────────────────────────
  body.push(f.para({ base: 81.98, x: 72.0, scale: 1.1, pageBreakBefore: true }, ['Certification verification']));
  body.push(f.spaceTo(98.4));
  const CERT_COLS = [198.4, 297.7];
  const centred = (lines: string[], size: number, scale: number) =>
    linesPara(lines.map((line) => [line, scale] as [string, number]), { size, scale, center: true });
  const certFiles = (keys: CertificationKey[]) =>
    attachmentsXml(media, keys.map((key) => data.certifications[key]), { maxWidth: 280, maxHeight: 200, pPr: '<w:ind w:left="110"/>' });
  const certRow = async (label: string, lines: string[], keys: CertificationKey[], height: number, top = false) =>
    rowXml(
      height,
      cellXml(CERT_COLS[0], centred([label], 12, 1.14), { vAlign: top ? 'top' : 'center' }) +
        cellXml(CERT_COLS[1], (await certFiles(keys)) + (lines.length ? centred(lines, 11, 1.15) : ''), { vAlign: top ? 'top' : 'center' }),
    );
  let docFlowCursor = 363.65;
  const docRequirements = DOC_REQUIREMENTS.map(([base, lines, scale]) => {
    const top = base - 11 * CAMBRIA_ASCENT;
    const before = top - docFlowCursor;
    docFlowCursor = top + lines.length * 11 * CAMBRIA_LINE;
    return `<w:p><w:pPr><w:spacing w:before="${twips(Math.max(0, before))}" w:after="0"/><w:ind w:left="88"/></w:pPr>${lines
      .map((line, i) => (i ? '<w:r><w:br/></w:r>' : '') + run(line, { scale }))
      .join('')}</w:p>`;
  }).join('');
  body.push(
    tableXml(
      66.7 - P.left,
      CERT_COLS,
      rowXml(
        116.2,
        cellXml(CERT_COLS[0], `<w:p><w:pPr><w:spacing w:before="22" w:after="0"/><w:ind w:left="115"/></w:pPr>${CERT_STANDARDS.map(
          (line, i) => (i ? '<w:r><w:br/></w:r>' : '') + run(line, { scale: 1.15 }),
        ).join('')}</w:p>`, { vAlign: 'top' }) + cellXml(CERT_COLS[1], centred(['Declaration'], 11, 1.15)),
      ) +
        (await certRow('TSEC Certificate', ['Date of TSEC'], ['tsecCertificate'], 15.5)) +
        (await certRow('QA Certificate', ['Date of QA and check Unique S.No. of', 'rack'], ['qaCertificate'], 27.5, true)) +
        (await certRow('QR Code, logo', ['Photo evidence'], ['qrCodeLogo', 'photoEvidence'], 15.4)) +
        (await certRow('OEM approval by BSNL', [], ['oemApproval'], 15.5, true)) +
        rowXml(142.1, cellXml(CERT_COLS[0], centred(['Documentation requirements'], 12, 1.14)) + cellXml(CERT_COLS[1], docRequirements, { vAlign: 'top' })),
    ),
  );
  // End of the portrait section.
  body.push(`<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/>${sectPr(P, 'rId3', 'rId4', false)}</w:pPr></w:p>`);

  // ── Landscape: 3. Acceptance Testing Test Cases, 3.1 one table per test ───
  const lf = createFlow(L);
  body.push(lf.para({ base: L.top + 12 * CAMBRIA_ASCENT, x: 93.38, size: 12, bold: true, scale: 1.15, marker: { text: '3.', x: 75.36, scale: 1.23 } }, ['Acceptance Testing Test Cases']));
  body.push(lf.para({ base: 80.3, x: 108.02, size: 12, bold: true, scale: 1.2, marker: { text: '3.1', x: 72.0, scale: 1.17 } }, ['TEST CASES FOR BLOCK RACK:']));

  const firstPage = RACK_TABLE_PAGES[0];
  const cols = firstPage.cols.slice(1).map((right, i) => right - firstPage.cols[i]);
  const header = firstPage.rows[0];
  const headerBorders = '<w:tcBorders><w:top w:val="single" w:sz="8" w:color="000000"/><w:bottom w:val="single" w:sz="8" w:color="000000"/></w:tcBorders>';
  const headerRow = rowXml(
    header.bottom - header.top,
    header.cells
      .map((cell, c) => cellXml(cols[c], linesPara((cell as RackCell).lines, { size: 12, bold: true, center: true, keepNext: true }), { shade: 'D9D9D9', tcBorders: headerBorders }))
      .join(''),
    '<w:tblHeader/>',
  );

  // Test text flows in the cell (Word wraps it): lines are joined, keeping hyphenated words whole.
  const flowingText = (lines: RackLine[]) => {
    const text = lines.reduce((all, [line]) => (!all ? line : all.endsWith('-') ? all + line : `${all} ${line}`), '');
    const scale = lines.reduce((sum, line) => sum + line[3], 0) / Math.max(1, lines.length);
    return [[text, 0, 0, Math.round(scale * 100) / 100]] as RackLine[];
  };

  const testText = rackTestColumns();
  for (const [id, columns] of testText) {
    const t = test(id);
    const cells = columns.map((cellsOfColumn, c) =>
      cellXml(cols[c], linesPara(flowingText(cellsOfColumn.flatMap((cell) => cell.lines)), { center: c < 2, keepNext: true }), { margin: 2 }),
    );
    const remarks =
      (t.remarks ? `<w:p><w:pPr><w:keepNext/><w:jc w:val="center"/></w:pPr>${run(t.remarks, { size: 9 })}</w:p>` : '') +
      (await attachmentsXml(media, t.files, { maxWidth: 60, maxHeight: 40, documentsOnly: true, pPr: '<w:keepNext/><w:jc w:val="center"/>' }));
    cells.push(
      cellXml(cols[6], `<w:p><w:pPr><w:keepNext/><w:jc w:val="center"/></w:pPr>${t.compliance ? run(t.compliance) : ''}</w:p>`),
      cellXml(cols[7], remarks),
    );
    // Space between tests, then the test's table and its photos.
    body.push(`<w:p><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="0" w:line="${twips(18)}" w:lineRule="exact"/></w:pPr></w:p>`);
    body.push(tableXml(firstPage.cols[0] - L.left, cols, headerRow + rowXml(null, cells.join(''))));
    body.push(
      (await attachmentsXml(media, t.files, { maxWidth: L.width - L.left - L.right, maxHeight: 250, imagesOnly: true, pPr: '<w:spacing w:before="200" w:after="0"/>' })) ||
        '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/></w:pPr></w:p>',
    );
  }

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NAMESPACES}><w:body>${body.join('')}${sectPr(
    L,
    'rId5',
    'rId6',
    true,
  )}</w:body></w:document>`;
  zip.file('word/document.xml', document);
  await media.finalize();
  await saveDocx(zip, `AT Block Rack - ${data.blockName || 'Checklist'}.docx`);
};
