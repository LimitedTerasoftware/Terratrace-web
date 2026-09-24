// Shared layout engine for the AT checklist print templates (Block Router, Block Rack).
//
// The templates reproduce Word documents page-for-page. Positions are given in pt
// from the page's top-left corner as measured in Word's rendering of the reference
// document; this module turns them into HTML/CSS that the browser prints the same way.

// ─── Data contract ──────────────────────────────────────────────────────────

/**
 * An uploaded file. `pages` holds image data URLs: the image itself, the rendered pages
 * of a PDF, or nothing for other documents.
 */
export interface PrintFile {
  name: string;
  kind: 'image' | 'pdf' | 'other';
  pages: string[];
}

/** Resolves every template image through `toDataUrl` so the print window is self-contained. */
export const loadImages = async <K extends string>(
  sources: Record<K, string>,
  toDataUrl: (src: string) => Promise<string>,
): Promise<Record<K, string>> => {
  const entries = await Promise.all(
    (Object.entries(sources) as [K, string][]).map(async ([key, src]) => [key, await toDataUrl(src)] as const),
  );
  return Object.fromEntries(entries) as Record<K, string>;
};

/** Writes the document into the print window and prints once images and fonts are ready. */
export const printHtmlDocument = (printWindow: Window, html: string) => {
  const doc = printWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  const whenReady = () => {
    const images = Array.from(doc.images).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          }),
    );
    return Promise.all([...images, doc.fonts ? doc.fonts.ready : Promise.resolve()]);
  };
  const print = () =>
    whenReady().then(() => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 300);
    });

  if (doc.readyState === 'complete') print();
  else printWindow.addEventListener('load', print, { once: true });
};

// ─── Units ──────────────────────────────────────────────────────────────────

export const CAMBRIA_ASCENT = 0.9502; // Cambria hhea ascender / unitsPerEm
export const CAMBRIA_LINE = 1.1724; // Word "single" line pitch for Cambria
// The reference documents stretch almost every run horizontally (w:w 110-120%).
// Text blocks are scaled with the same factor.
export const DEFAULT_SCALE = 1.13;
// Table cell text: most runs there are 115-120% with condensed spaces.
export const CELL_SCALE = 1.2;
export const LINE_11 = 11 * CAMBRIA_LINE;

export const tw = (twips: number) => twips / 20;
export const n = (value: number) => Number(value.toFixed(2));

export const esc = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// ─── Block model ────────────────────────────────────────────────────────────
//
// Pages and top-aligned cells are "flows": each block knows its top and height
// in the reference rendering, and is rendered with the gap to the previous block
// as padding. Content that grows (entered values) pushes following blocks down
// instead of overlapping them. Raw strings are inserted without affecting the
// reference positions of the blocks after them.

export interface Block {
  top: number;
  height: number;
  render: (gap: number, originX: number) => string;
}

export const flow = (originY: number, originX: number, blocks: (Block | string | false)[]) => {
  let cursor = originY;
  return blocks
    .map((block) => {
      if (!block) return '';
      if (typeof block === 'string') return block;
      const html = block.render(Math.max(0, n(block.top - cursor)), originX);
      cursor = block.top + block.height;
      return html;
    })
    .join('');
};

export interface Marker {
  text: string;
  x: number;
  font?: string;
  size?: number;
  bold?: boolean;
  scale?: number;
}

export interface TextOptions {
  base: number; // baseline of the first line
  x?: number; // start of the text
  right?: number; // right limit (justified / centred text)
  size?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  align?: 'left' | 'center' | 'justify';
  scale?: number;
  pitch?: number; // line pitch; Word "single" by default
  marker?: Marker; // list number / bullet in the hanging indent
  extra?: string; // appended inside the block; positioned relative to the first line's top
}

const markerHtml = (m: Marker, width: number) => {
  const style = [
    `width:${n(width)}pt`,
    m.font ? `font-family:${m.font}` : '',
    m.size ? `font-size:${m.size}pt` : '',
    m.bold === undefined ? '' : `font-weight:${m.bold ? 700 : 400}`,
  ]
    .filter(Boolean)
    .join(';');
  const inner = m.scale ? `<span style="transform:scaleX(${m.scale})">${esc(m.text)}</span>` : esc(m.text);
  return `<span class="mk" style="${style}">${inner}</span>`;
};

export const linesHtml = (lines: string[], align: TextOptions['align'], scale = DEFAULT_SCALE) =>
  `<div class="sx" style="--sx:${scale}">${lines
    .map((line, i) => {
      const cls =
        align === 'justify' && i < lines.length - 1 ? 'ln j' : align === 'center' ? 'ln c' : 'ln';
      return `<div class="${cls}">${line}</div>`;
    })
    .join('')}</div>`;

/**
 * Text block factories for one page geometry: `x` is the default start of the text,
 * `right` the default right limit.
 */
export const makeText = (defaults: { x: number; right: number }) => {
  /** A paragraph reproduced with the line breaks Word produced (`lines` is pre-escaped HTML). */
  const textHtml = (o: TextOptions, lines: string[]): Block => {
    const size = o.size ?? 11;
    const pitch = o.pitch ?? size * CAMBRIA_LINE;
    const baselineOffset = (pitch - size * CAMBRIA_LINE) / 2 + size * CAMBRIA_ASCENT;
    const x = o.x ?? defaults.x;
    const left = o.marker ? o.marker.x : x;
    const right = o.right ?? defaults.right;
    const body = linesHtml(lines, o.align, o.scale);
    const cls = ['blk', o.bold ? 'b' : '', o.italic ? 'i' : ''].filter(Boolean).join(' ');
    return {
      top: o.base - baselineOffset,
      height: lines.length * pitch,
      render: (gap, originX) =>
        `<div class="${cls}" style="padding-top:${gap}pt;margin-left:${n(left - originX)}pt;width:${n(
          right - left,
        )}pt;font-size:${size}pt;line-height:${n(pitch)}pt${o.color ? `;color:${o.color}` : ''}"><div class="in">${
          o.marker
            ? `<div class="row">${markerHtml(o.marker, x - o.marker.x)}<div class="grow">${body}</div></div>`
            : body
        }${o.extra ?? ''}</div></div>`,
    };
  };
  const text = (o: TextOptions, lines: string[]) => textHtml(o, lines.map(esc));
  return { text, textHtml };
};

export const image = (top: number, x: number, width: number, height: number, src: string): Block => ({
  top,
  height,
  render: (gap, originX) =>
    `<div class="blk" style="padding-top:${gap}pt;margin-left:${n(x - originX)}pt"><img src="${src}" alt="" style="width:${width}pt;height:${height}pt" /></div>`,
});

// ─── Tables ─────────────────────────────────────────────────────────────────

export interface TableGeometry {
  x: number; // left border (rendered)
  cols: number[]; // column widths in twips
  border: number; // border width in pt (w:sz / 8)
  pad: number; // text indent inside cells, twips
  size?: number; // font size in pt (10pt by default)
}

export interface Cell {
  html: string;
  valign?: 'top' | 'middle';
  pad?: number; // twips; overrides the table indent
  padTop?: number; // twips; space before the first paragraph of a top-aligned cell
  align?: 'center';
  rowspan?: number; // vertically merged cell
}

export interface Row {
  h: number; // w:trHeight (atLeast), twips
  cells: (string | Cell)[];
  // Border overrides used in the Router template: the "Test Results" row has a 0.5pt
  // bottom border, the "Status" row is boxed with 0.5pt borders.
  edge?: 'results' | 'status';
  className?: string;
}

// Word draws each row as its w:trHeight plus the row's border width.
const rowHeight = (row: Row, g: TableGeometry) => tw(row.h) + (row.edge ? 0.5 : g.border);

/**
 * `top` is the position of the table's top rule. With collapsed borders the table box
 * extends half a border beyond the outer rules; negative margins cancel that so the
 * block occupies exactly the sum of its rows.
 */
export const table = (g: TableGeometry, top: number, rows: Row[]): Block => ({
  top,
  height: rows.reduce((sum, row) => sum + rowHeight(row, g), 0),
  render: (gap, originX) => `<div class="blk" style="padding-top:${gap}pt;margin-left:${n(g.x - originX)}pt">${tableHtml(g, rows)}</div>`,
});

export const tableHtml = (g: TableGeometry, rows: Row[]) => {
  const first = rows[0];
  const last = rows[rows.length - 1];
  const topBorder = first.edge === 'status' ? 0.5 : g.border;
  const bottomBorder = last.edge ? 0.5 : g.border;
  const width = g.cols.reduce((sum, c) => sum + tw(c), 0);
  const body = rows
    .map((row) => {
      const edge =
        row.edge === 'status' ? 'border-width:0.5pt;' : row.edge === 'results' ? 'border-bottom-width:0.5pt;' : '';
      const cells = row.cells
        .map((c) => {
          const cell: Cell = typeof c === 'string' ? { html: c } : c;
          const style = [
            cell.rowspan ? '' : `height:${n(rowHeight(row, g))}pt`,
            `padding-left:${n(tw(cell.pad ?? g.pad))}pt`,
            cell.valign === 'top' ? 'vertical-align:top' : '',
            cell.padTop ? `padding-top:${n(tw(cell.padTop))}pt` : '',
            cell.align === 'center' ? 'text-align:center' : '',
            edge,
          ]
            .filter(Boolean)
            .join(';');
          return `<td${cell.rowspan ? ` rowspan="${cell.rowspan}"` : ''} style="${style}">${cell.html}</td>`;
        })
        .join('');
      return `<tr${row.className ? ` class="${row.className}"` : ''}>${cells}</tr>`;
    })
    .join('');
  return `<table class="t" style="--bw:${g.border}pt;width:${n(width)}pt;margin:-${n(topBorder / 2)}pt 0 -${n(
    bottomBorder / 2,
  )}pt${g.size ? `;font-size:${g.size}pt` : ''}"><colgroup>${g.cols
    .map((c) => `<col style="width:${n(tw(c))}pt" />`)
    .join('')}</colgroup>${body}</table>`;
};

/** Static cell text; `lines` follow Word's line breaks. */
export const cellText = (lines: string | string[], scale = CELL_SCALE) =>
  linesHtml((Array.isArray(lines) ? lines : [lines]).map(esc), 'left', scale);

export interface ListOptions {
  left?: number; // paragraph indent, twips
  hanging?: number; // hanging indent (marker position), twips
  before?: number; // space before the first item, twips
  marker?: (index: number) => string;
  markerFont?: string;
}

/**
 * List cell (top-aligned, as in the DOCX). `left`/`hanging`/`before` are the DOCX
 * paragraph values; an item given as an array keeps Word's line breaks.
 */
export const bullets = (items: (string | string[])[], o: ListOptions = {}): Cell => {
  const { left = 777, hanging = 360, before = 0, marker = () => '•', markerFont } = o;
  const font = markerFont ? `font-family:${markerFont};` : '';
  const html = items
    .map((item, i) => {
      const lines = (Array.isArray(item) ? item : [item]).map(esc);
      return `<div class="li" style="padding-left:${n(tw(left))}pt${i ? ';margin-top:1.15pt' : ''}"><span class="bu" style="${font}left:${n(
        tw(left - hanging),
      )}pt">${marker(i)}</span>${linesHtml(lines, 'left', CELL_SCALE)}</div>`;
    })
    .join('');
  return { html, pad: 0, valign: 'top', padTop: before };
};

export const numbered = (items: string[], markerFont: string) =>
  bullets(items, { left: 1090, hanging: 359, marker: (i) => `${i + 1}.`, markerFont });

// ─── Entered values ─────────────────────────────────────────────────────────

/**
 * An entered value starting on the first line of a text block (of `lines` 11pt lines),
 * at `offset` pt from its left edge.
 */
export const inlineValue = (value: string, offset: number, lines = 1) =>
  value ? `<div class="val" style="margin-left:${n(offset)}pt;margin-top:-${n(lines * LINE_11)}pt">${esc(value)}</div>` : '';

/** The ":" at a tab stop, `offset` pt from the left edge of the block. */
export const tabColon = (offset: number) => `<span class="colon" style="left:${n(offset)}pt">:</span>`;

interface Annexure {
  number: number;
  label: string;
  file: PrintFile;
}

const PDF_ICON =
  '<svg viewBox="0 0 16 19" aria-hidden="true"><path d="M1 .5h10l4.5 4.5v13.5H1z" fill="#FFFFFF" stroke="#8C8C8C" stroke-width=".6"/><path d="M11 .5V5h4.5" fill="none" stroke="#8C8C8C" stroke-width=".6"/><rect x="2.5" y="9" width="11" height="5.2" rx=".6" fill="#D93831"/><text x="8" y="13.1" text-anchor="middle" font-family="Arial, sans-serif" font-size="4.2" font-weight="700" fill="#FFFFFF">PDF</text></svg>';
const DOC_ICON =
  '<svg viewBox="0 0 16 19" aria-hidden="true"><path d="M1 .5h10l4.5 4.5v13.5H1z" fill="#FFFFFF" stroke="#8C8C8C" stroke-width=".6"/><path d="M11 .5V5h4.5" fill="none" stroke="#8C8C8C" stroke-width=".6"/><path d="M3.5 9h9M3.5 11h9M3.5 13h9M3.5 15h6" stroke="#2B579A" stroke-width=".8"/></svg>';

/**
 * Renders uploaded files where they belong, as in the filled reference documents:
 * images inline, other documents as an icon with the file name. PDF pages are
 * additionally printed as annexures at the end of the document.
 */
export const createAttachments = () => {
  const annexures: Annexure[] = [];
  const addAnnexure = (file: PrintFile, label: string) => {
    annexures.push({ number: annexures.length + 1, label, file });
    return annexures.length;
  };
  const isRenderedPdf = (file: PrintFile) => file.kind === 'pdf' && file.pages.length > 0;
  const present = (files: (PrintFile | null | undefined)[]) => files.filter((file): file is PrintFile => !!file);

  /** Images of `files`. */
  const images = (files: (PrintFile | null | undefined)[], maxHeight: number) =>
    present(files)
      .filter((file) => file.kind === 'image' && file.pages.length > 0)
      .map((file) => `<img class="ev" src="${file.pages[0]}" alt="${esc(file.name)}" style="max-height:${maxHeight}pt" />`)
      .join('');

  /**
   * Icons for the documents of `files` (PDFs are also queued as annexures; `annexureNote`
   * adds the annexure number under the icon).
   */
  const documents = (files: (PrintFile | null | undefined)[], label: string, pdfInline = true, annexureNote = true) => {
    const chips = present(files)
      .filter((file) => file.kind !== 'image' || file.pages.length === 0)
      .map((file) => {
        if (!isRenderedPdf(file)) {
          return `<div class="fchip">${file.kind === 'pdf' ? PDF_ICON : DOC_ICON}<div>${esc(file.name)}</div></div>`;
        }
        const number = addAnnexure(file, label);
        const note = annexureNote ? `<div>(Annexure-${number})</div>` : '';
        return pdfInline ? `<div class="fchip">${PDF_ICON}<div>${esc(file.name)}</div>${note}</div>` : '';
      })
      .filter(Boolean);
    return chips.length ? `<div class="files">${chips.join('')}</div>` : '';
  };

  // `pdfInline: false` prints PDFs only at the end of the document (no icon in place).
  const html = (files: (PrintFile | null | undefined)[], label: string, maxHeight: number, pdfInline = true) =>
    documents(files, label, pdfInline) + images(files, maxHeight);

  return { annexures, html, images, documents };
};

export const annexurePages = (list: Annexure[], pageClass = 'page annex') =>
  list
    .flatMap(({ number, label, file }) =>
      file.pages.map(
        (src, index) => `
  <section class="${pageClass}">
    <div class="annex-label">Annexure-${number}: ${esc(label)}${
      file.pages.length > 1 ? ` (page ${index + 1} of ${file.pages.length})` : ''
    }</div>
    <div class="annex-name">${esc(file.name)}</div>
    <img src="${src}" alt="${esc(label)}" />
  </section>`,
      ),
    )
    .join('');

// ─── Styles ─────────────────────────────────────────────────────────────────

/**
 * Footer "Page N of M": "Page"/"of" are Arial 11pt, the numbers Arial Bold 12pt.
 * A margin box holds a single string, so the digits get their own face.
 */
export const FOOTER_FONT_FACES = `
  @font-face {
    font-family: 'AT Footer';
    src: local('Arial'), local('ArialMT'), local('Arimo'), local('Liberation Sans');
    unicode-range: U+0000-002F, U+003A-FFFF;
  }
  @font-face {
    font-family: 'AT Footer';
    src: local('Arial Bold'), local('Arial-BoldMT'), local('Arimo Bold'), local('Liberation Sans Bold');
    unicode-range: U+0030-0039;
    size-adjust: 109.09%;
  }`;

/**
 * Header (document code, Arial 11pt) and footer margin boxes. `headerLeft` / `footerLeft`
 * are the text positions relative to the left margin; `headerTop` / `footerTop` the top
 * of the text relative to the top of the margin box.
 */
export const marginBoxes = (o: { docCode: string; headerLeft: number; headerTop: number; footerLeft: number; footerTop: number }) => `
    @top-left {
      content: '${o.docCode}';
      font-family: Arial, Arimo, 'Liberation Sans', sans-serif;
      font-size: 11pt;
      line-height: 1.1172;
      color: #000000;
      vertical-align: top;
      padding-top: ${o.headerTop}pt;
      padding-left: ${o.headerLeft}pt;
      white-space: pre;
    }
    @bottom-left {
      content: 'Page ' counter(page) ' of ' counter(pages);
      font-family: 'AT Footer', Arial, sans-serif;
      font-size: 11pt;
      line-height: 10pt;
      color: #000000;
      vertical-align: top;
      padding-top: ${o.footerTop}pt;
      padding-left: ${o.footerLeft}pt;
      white-space: pre;
    }`;

export const BASE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #FFFFFF; }
  body {
    color: #000000;
    font-family: Cambria, Caladea, Georgia, serif;
    font-size: 11pt;
    line-height: ${CAMBRIA_LINE};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page { display: flow-root; position: relative; }
  .page + .page { break-before: page; page-break-before: always; }
  .blk { position: relative; }
  .blk > img, td > img { display: block; }
  .b { font-weight: 700; }
  .i { font-style: italic; }

  .sx { width: calc(100% / var(--sx)); transform: scaleX(var(--sx)); transform-origin: 0 0; }
  .ln { white-space: nowrap; }
  .ln.j { text-align: justify; text-align-last: justify; }
  .ln.c { text-align: center; }
  .row { display: flex; align-items: baseline; }
  .grow { flex: 1 1 auto; min-width: 0; }
  /* line-height 0: a marker in another font must not make the line taller */
  .mk { flex: none; white-space: pre; line-height: 0; }
  .mk > span { display: inline-block; transform-origin: 0 0; }

  table.t { border-collapse: collapse; table-layout: fixed; font-size: 10pt; line-height: ${CAMBRIA_LINE}; }
  table.t td { border: var(--bw) solid #000000; padding: 0; vertical-align: middle; overflow-wrap: anywhere; }
  table.t tr { break-inside: avoid; page-break-inside: avoid; }
  /* The Symbol-font bullet has a taller ascent than Cambria: Word sets each item's
     first baseline 0.55pt lower (item pitch 13.35pt). */
  .li { position: relative; padding-top: 0.55pt; }
  .bu { position: absolute; top: 0.55pt; }
  .in { position: relative; }
  .colon { position: absolute; top: 0; display: inline-block; transform: scaleX(1.15); transform-origin: 0 0; }

  /* Values entered in the form: not stretched, wrap inside their cell. */
  .val { white-space: pre-wrap; overflow-wrap: anywhere; }
  .val-cell { padding: 2pt 3pt 2pt 0; }
  .val-block { white-space: pre-wrap; overflow-wrap: anywhere; }
  .rule { position: absolute; border-top: 0.48pt solid #000000; }

  /* Uploaded evidence, placed where it belongs (as in the filled reference documents). */
  .evidence { padding: 4pt 0; }
  .val-cell .files, .val-cell .ev { margin-top: 3pt; }
  img.ev { display: block; max-width: 100%; object-fit: contain; object-position: left top; margin-bottom: 4pt; break-inside: avoid; }
  .files { display: flex; flex-wrap: wrap; gap: 4pt 16pt; margin-bottom: 4pt; }
  .fchip { width: 72pt; text-align: center; font-family: Arial, Arimo, sans-serif; font-size: 6.5pt; line-height: 1.2; overflow-wrap: anywhere; break-inside: avoid; }
  .fchip svg { display: block; width: 16pt; height: 19pt; margin: 0 auto 2pt; }

  .annex { display: flex; flex-direction: column; }
  .annex-label { font-weight: 700; }
  .annex-name { font-size: 10pt; margin-bottom: 6pt; overflow-wrap: anywhere; }
  .annex img { flex: 1 1 auto; min-height: 0; width: 100%; object-fit: contain; object-position: center top; }
`;

export const FALLBACK_FONTS_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link href="https://fonts.googleapis.com/css2?family=Caladea:ital,wght@0,400;0,700;1,400;1,700&family=Arimo:wght@400;700&family=Tinos&family=Carlito&display=block" rel="stylesheet" />';
