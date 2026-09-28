// Shared helpers for the Word (.docx) downloads of the AT checklists.
// A .docx is a zip of XML parts; images are added as media parts with relationships.

import type JSZip from 'jszip';
import { saveAs } from 'file-saver';
import PdfIcon from './assets/pdf-icon.png';
import DocIcon from './assets/doc-icon.png';
import type { PrintFile } from './printEngine';

export const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Namespaces used by the fragments built here. */
export const NAMESPACES =
  'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
  'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
  'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
  'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
  'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

export const xmlEsc = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** pt → twips (1/20 pt) */
export const twips = (pt: number) => Math.round(pt * 20);

const EMU_PER_PT = 12700;

/** A run of text; newlines become line breaks. `rPr` is the run properties XML. */
export const runXml = (text: string, rPr = '') =>
  text
    .split('\n')
    .map((line, i) => `${i ? `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:br/></w:r>` : ''}<w:r>${
      rPr ? `<w:rPr>${rPr}</w:rPr>` : ''
    }<w:t xml:space="preserve">${xmlEsc(line)}</w:t></w:r>`)
    .join('');

/**
 * Image bytes for the document. Uploaded files are on another server (VITE_Image_URL)
 * that allows CORS only from the production site; in development a blocked request is
 * retried through the dev-server proxy (vite.config.ts, "/image-proxy/").
 */
const fetchImage = async (src: string) => {
  const get = async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
    return response.blob();
  };
  try {
    return await get(src);
  } catch (error) {
    const origin = import.meta.env.VITE_Image_URL ? new URL(import.meta.env.VITE_Image_URL).origin : '';
    if (!import.meta.env.DEV || !origin || !src.startsWith(`${origin}/`)) throw error;
    return get(`/image-proxy${src.slice(origin.length)}`);
  }
};

export interface MediaImage {
  rId: string;
  width: number; // natural size, pt (at 96 dpi)
  height: number;
}

/**
 * Adds images to the package: media part, relationship and content type.
 * `finalize()` writes the relationships part back.
 */
export const createMedia = async (zip: JSZip, relsPath = 'word/_rels/document.xml.rels') => {
  let rels = await zip.file(relsPath)!.async('string');
  const used = [...rels.matchAll(/Id="rId(\d+)"/g)].map((m) => Number(m[1]));
  let nextRid = Math.max(0, ...used) + 1;
  let nextName = 1;
  let nextDocPr = 1000;
  const types = new Set<string>();

  const add = async (src: string): Promise<MediaImage | null> => {
    try {
      let blob = await fetchImage(src);
      const bitmap = await createImageBitmap(blob);
      let ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/jpeg' ? 'jpeg' : '';
      if (!ext) {
        // Formats Word may not open (e.g. WebP) are converted to PNG.
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
        blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
        ext = 'png';
      }
      const name = `at-print-${nextName++}.${ext}`;
      zip.file(`word/media/${name}`, blob);
      types.add(ext);
      const rId = `rId${nextRid++}`;
      rels = rels.replace(
        '</Relationships>',
        `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${name}"/></Relationships>`,
      );
      return { rId, width: bitmap.width * 0.75, height: bitmap.height * 0.75 };
    } catch (error) {
      console.error('Image could not be added to the Word document:', error);
      return null;
    }
  };

  /** Inline picture run, scaled to fit `maxWidth` x `maxHeight` pt. */
  const imageRun = (image: MediaImage, maxWidth: number, maxHeight: number) => {
    const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
    const cx = Math.round(image.width * scale * EMU_PER_PT);
    const cy = Math.round(image.height * scale * EMU_PER_PT);
    const id = nextDocPr++;
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Picture ${id}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="Picture ${id}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${image.rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  };

  const finalize = async () => {
    zip.file(relsPath, rels);
    const typesPath = '[Content_Types].xml';
    let ct = await zip.file(typesPath)!.async('string');
    types.forEach((ext) => {
      if (!new RegExp(`Extension="${ext}"`, 'i').test(ct)) {
        ct = ct.replace('</Types>', `<Default Extension="${ext}" ContentType="image/${ext}"/></Types>`);
      }
    });
    zip.file(typesPath, ct);
  };

  return { add, imageRun, finalize };
};

export type Media = Awaited<ReturnType<typeof createMedia>>;

/**
 * Paragraphs for uploaded files, as in the print: documents as an icon with the file
 * name, images inline (scaled to `maxWidth` x `maxHeight` pt). `pPr` applies to each paragraph.
 */
export const attachmentsXml = async (
  media: Media,
  files: (PrintFile | null | undefined)[],
  o: { maxWidth: number; maxHeight: number; pPr?: string; imagesOnly?: boolean; documentsOnly?: boolean },
) => {
  const present = files.filter((file): file is PrintFile => !!file);
  const isImage = (file: PrintFile) => file.kind === 'image' && file.pages.length > 0;
  const pPr = o.pPr ? `<w:pPr>${o.pPr}</w:pPr>` : '';
  let xml = '';

  if (!o.imagesOnly) {
    const documents = present.filter((file) => !isImage(file));
    const chips: string[] = [];
    for (const file of documents) {
      const icon = await media.add(file.kind === 'pdf' ? PdfIcon : DocIcon);
      chips.push(
        (icon ? media.imageRun(icon, 16, 19) : '') +
          runXml(` ${file.name}`, '<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="14"/>'),
      );
    }
    if (chips.length) xml += `<w:p>${pPr}${chips.join(runXml('   '))}</w:p>`;
  }

  if (!o.documentsOnly) {
    const runs: string[] = [];
    for (const file of present.filter(isImage)) {
      const image = await media.add(file.pages[0]);
      if (image) runs.push(media.imageRun(image, o.maxWidth, o.maxHeight));
    }
    if (runs.length) xml += `<w:p>${pPr}${runs.join(runXml(' '))}</w:p>`;
  }
  return xml;
};

/** Parses an XML fragment (using the namespaces above) into nodes of `doc`. */
export const xmlNodes = (doc: Document, xml: string): Node[] => {
  const parsed = new DOMParser().parseFromString(`<w:root ${NAMESPACES}>${xml}</w:root>`, 'application/xml');
  return Array.from(parsed.documentElement.childNodes).map((node) => doc.importNode(node, true));
};

export const insertAfter = (reference: Node, nodes: Node[]) => {
  let anchor = reference;
  nodes.forEach((node) => {
    anchor.parentNode!.insertBefore(node, anchor.nextSibling);
    anchor = node;
  });
};

export const saveDocx = async (zip: JSZip, fileName: string) => {
  const blob = await zip.generateAsync({ type: 'blob', mimeType: DOCX_MIME });
  saveAs(blob, fileName.replace(/[\\/:*?"<>|]+/g, ' ').trim());
};
