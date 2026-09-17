import { useState, useEffect } from 'react';
import {
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Video,
  MapPin,
  Building2,
  AlertCircle,
  ExternalLink,
  Printer,
  ClipboardCheck,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getATBlockRackData } from '../../Services/api';
import { RouterData } from '../../../types/block-router-checklist';
import {
  atRackTests,
  CERTIFICATION_FIELDS,
  CertificationKey,
} from '../forms/ATBlockRack';
import MediaCarousel from '../../DepthChart/MediaCarousel';
import TricadIcon from '../../../images/logo/favicon.png';
import BharatNetLogo from '../../../images/logo/bharatnet-logo.jpg';
import BsnlLogo from '../../../images/logo/bsnl-logo.jpg';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ImgbaseUrl = import.meta.env.VITE_Image_URL;
const DOC_CODE = 'ABP/AT/BLRK/002 Ver1.0';

interface TestItem {
  id: string;
  testCaseNo: string;
  clause: string;
  description: string;
  parameters: string;
  procedure: string;
  expectedResult: string;
  compliance: string;
  remarks: string;
  images: string[];
  documents: string[];
}

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

const getFileExt = (url: string): string => {
  const cleanUrl = url.split('?')[0].split('#')[0];
  return cleanUrl.split('.').pop()?.toLowerCase() || '';
};

const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['mp4', 'mov', 'avi', 'webm'];
  return videoExtensions.includes(getFileExt(url));
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

const ATBlockRackView = () => {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const blockName = searchParams.get('block_name') || '';
  const stateName = searchParams.get('state_name') || '';
  const districtName = searchParams.get('district_name') || '';

  const [loadingData, setLoadingData] = useState(false);
  const [rackData, setRackData] = useState<RouterData | null>(null);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [preparing, setPreparing] = useState(false);

  const fetchData = async () => {
    if (!blockId) return;
    setLoadingData(true);
    try {
      const data = await getATBlockRackData(blockId);
      setRackData(data?.status ? data : null);
    } catch (error) {
      console.error('Error fetching AT Block Rack data:', error);
      setRackData(null);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [blockId]);

  const openDocument = (url: string) => {
    window.open(getFullImageUrl(url), '_blank', 'noopener,noreferrer');
  };

  const openCarousel = (images: string[], startIndex: number = 0) => {
    setCarouselItems(images.map((img) => getFullImageUrl(img)));
    setCarouselIndex(startIndex);
    setCarouselOpen(true);
  };

  const testItems: TestItem[] = atRackTests.map((tc) => {
    const testData = rackData?.tests?.[tc.id];
    const attachments = testData?.Image ? parseImageUrls(testData.Image) : [];
    const { images, documents } = splitAttachments(attachments);

    return {
      id: tc.id,
      testCaseNo: tc.testCaseNo,
      clause: tc.clause,
      description: tc.description,
      parameters: tc.parameters,
      procedure: tc.procedure,
      expectedResult: tc.expectedResult,
      compliance: testData?.compliance || '',
      remarks: testData?.remarks || '',
      images,
      documents,
    };
  });

  const completedCount = testItems.filter((item) => item.compliance !== '')
    .length;
  const passedCount = testItems.filter((item) => item.compliance === 'Yes')
    .length;
  const totalCount = testItems.length;

  const certFiles = rackData?.certificationFiles;
  const memorandum = rackData?.memorandum;

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

  const getDocMeta = (
    doc: string,
  ): { ext: string; label: string; color: string; bg: string; icon: string } => {
    const name = getFileName(doc);
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf')
      return { ext: 'PDF', label: name, color: '#dc2626', bg: '#fef2f2', icon: '📄' };
    if (ext === 'doc' || ext === 'docx')
      return { ext: 'WORD', label: name, color: '#2563eb', bg: '#eff6ff', icon: '📝' };
    if (ext === 'xls' || ext === 'xlsx')
      return { ext: 'EXCEL', label: name, color: '#16a34a', bg: '#f0fdf4', icon: '📊' };
    return {
      ext: ext.toUpperCase() || 'FILE',
      label: name,
      color: '#7c3aed',
      bg: '#f5f3ff',
      icon: '📎',
    };
  };

  const buildDocumentCardHtml = async (
    doc: string,
    label: string,
    attachmentPages: string[],
  ): Promise<string> => {
    const meta = getDocMeta(doc);
    const fullLabel = `${label} - ${meta.label}`;

    if (meta.ext === 'PDF') {
      let pdfPages: string[] = [];
      try {
        pdfPages = await renderPdfToImages(doc);
        pdfPages.forEach((src, index) => {
          attachmentPages.push(`
            <div class="attachment-page pdf-attachment-page">
              <div class="attachment-label">${escapeHtml(fullLabel)} - Page ${index + 1}</div>
              <img src="${src}" alt="${escapeHtml(fullLabel)} page ${index + 1}" />
            </div>
          `);
        });
      } catch (error) {
        console.error('PDF render failed:', doc, error);
      }
      return `
        <div class="doc-card compact-doc-card">
          <div class="doc-card-meta">
            <span class="doc-ext-badge" style="background:${meta.bg};color:${meta.color};">${meta.icon} ${meta.ext}</span>
            <span class="doc-filename">${escapeHtml(meta.label)}</span>
          </div>
          <div class="doc-card-info" style="border-left:3px solid ${meta.color};">
            <p style="color:${meta.color};font-weight:600;margin-bottom:4px;">PDF Document</p>
            <p style="color:#64748b;font-size:8pt;">${pdfPages.length > 0 ? 'Full PDF content is included in the attachment appendix.' : 'Preview unavailable.'}</p>
          </div>
        </div>`;
    }

    return `
      <div class="doc-card">
        <div class="doc-card-meta">
          <span class="doc-ext-badge" style="background:${meta.bg};color:${meta.color};">${meta.icon} ${meta.ext}</span>
          <span class="doc-filename">${escapeHtml(meta.label)}</span>
        </div>
        <div class="doc-card-info" style="border-left:3px solid ${meta.color};">
          <p style="color:${meta.color};font-weight:600;margin-bottom:4px;">${meta.ext} Document</p>
          <p style="color:#64748b;font-size:8pt;">This file type cannot be rendered inline. The document has been attached and submitted with this checklist.</p>
        </div>
      </div>`;
  };

  const buildImageThumbHtml = async (
    image: string,
    label: string,
    index: number,
    attachmentPages: string[],
  ): Promise<string> => {
    const fullUrl = getFullImageUrl(image);
    const src = await toBase64(fullUrl);
    const fullLabel = `${label} - ${getFileName(image) || `Image ${index + 1}`}`;

    attachmentPages.push(`
      <div class="attachment-page image-attachment-page">
        <div class="attachment-label">${escapeHtml(fullLabel)}</div>
        <img src="${src}" alt="${escapeHtml(fullLabel)}" />
      </div>
    `);

    return `<div class="image-thumb"><img src="${src}" alt="${escapeHtml(fullLabel)}" /></div>`;
  };

  const fileSlotHtml = async (
    url: string | undefined,
    label: string,
  ): Promise<string> => {
    if (!url) return '&nbsp;';
    if (isImageUrl(url)) {
      let src = getFullImageUrl(url);
      try {
        src = await toBase64(src);
      } catch (_) {}
      return `<img src="${src}" alt="${escapeHtml(label)}" class="memo-file-image" />`;
    }
    return `<div class="doc-chip">📎 ${escapeHtml(getFileName(url))}</div>`;
  };

  const buildPrintStyles = (): string => `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      color: #1a1a2e;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4; margin: 14mm 16mm 18mm 16mm; }

    .cover { text-align:center; padding: 30px 0 20px; page-break-after: always; break-after: page; }
    .cover img.cover-logo { height:60px; margin: 0 auto 14px; display:block; }
    .cover h1 { font-size:15pt; font-weight:700; margin: 10px 0 4px; color:#0d47a1; }
    .cover p { font-size:10.5pt; max-width:600px; margin:6px auto 0; line-height:1.5; color:#1e293b; }

    .toc-page { page-break-after: always; break-after: page; }
    .toc-title { font-size:13pt; font-weight:700; margin-bottom:14px; color:#0d47a1; border-bottom:2px solid #1565c0; padding-bottom:4px; }
    .toc-list { list-style:none; padding-left:0; font-size:9.5pt; line-height:1.9; color:#1e293b; }
    .toc-sublist { list-style:none; padding-left:22px; font-size:8.8pt; line-height:1.7; color:#475569; }

    h2.section-title {
      font-size:13pt; font-weight:700; margin:18px 0 10px; padding-bottom:4px;
      border-bottom:2px solid #1565c0; color:#0d47a1;
    }
    p.intro-text { font-size:9.5pt; line-height:1.55; margin-bottom:10px; color:#1e293b; }
    table.memo-table, table.cert-table {
      width:100%; border-collapse:collapse; margin-bottom:14px; font-size:9.2pt;
    }
    table.memo-table td, table.cert-table td {
      border:1px solid #94a3b8; padding:6px 8px; vertical-align:top;
    }
    table.memo-table td.label, table.cert-table td.label { width:32%; font-weight:600; background:#f1f5f9; }
    .memo-file-image {
      display:block; max-width:220px; max-height:160px; border:1px solid #e2e8f0; border-radius:4px;
    }
    .doc-chip { font-size:8pt; color:#4338ca; }
    .doc-header {
      display:flex; justify-content:flex-end; font-size:8.5pt; color:#374151;
      padding-bottom:6px; margin-bottom:14px; border-bottom:1px solid #cbd5e1;
    }
    .sig-table { width:100%; border-collapse:collapse; margin-top:8px; margin-bottom:16px; }
    .sig-table td { border:1px solid #94a3b8; padding:14px 10px; width:33.33%; vertical-align:top; font-size:9pt; }
    .sig-table .sig-title { font-weight:700; margin-bottom:26px; display:block; }

    .report-header {
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: 14px; border-bottom: 3px solid #1565c0; margin-bottom: 22px;
    }
    .report-header img { height: 48px; }
    .report-header-title { text-align: right; }
    .report-header-title h1 { font-size: 17pt; font-weight: 700; color: #0d47a1; }
    .report-header-title p { font-size: 9pt; color: #5f6b8c; margin-top: 2px; }

    .summary-bar { display: flex; gap: 10px; margin-bottom: 20px; }
    .summary-chip { flex: 1; padding: 10px 12px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
    .chip-value { font-size: 18pt; font-weight: 700; line-height: 1; }
    .chip-label { font-size: 8pt; color: #64748b; margin-top: 3px; }
    .chip-total   { background:#eff6ff; } .chip-total .chip-value   { color:#1d4ed8; }
    .chip-yes     { background:#f0fdf4; } .chip-yes .chip-value     { color:#15803d; }
    .chip-no      { background:#fef2f2; } .chip-no .chip-value      { color:#b91c1c; }
    .chip-pending { background:#fafafa; } .chip-pending .chip-value { color:#64748b; }

    .progress-wrap { margin-bottom: 24px; padding: 12px 16px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; }
    .progress-label { display:flex; justify-content:space-between; font-size:9pt; color:#475569; margin-bottom:6px; }
    .progress-track { height:10px; background:#e2e8f0; border-radius:99px; overflow:hidden; }
    .progress-fill  { height:100%; border-radius:99px; background:linear-gradient(90deg,#2563eb,#16a34a); }

    .test-card { border:1px solid #e2e8f0; border-radius:10px; margin-bottom:16px; overflow:hidden; break-inside:auto; page-break-inside:auto; }
    .test-card-header { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; background:#f8fafc; border-bottom:1px solid #e2e8f0; }
    .test-badge { font-size:11pt; font-weight:700; color:#1d4ed8; background:#dbeafe; padding:4px 10px; border-radius:6px; white-space:nowrap; flex-shrink:0; }
    .test-description { flex:1; font-size:9.5pt; color:#1e293b; line-height:1.45; }
    .compliance-badge { padding:4px 12px; border-radius:99px; font-size:9pt; font-weight:600; white-space:nowrap; flex-shrink:0; }
    .badge-yes     { background:#dcfce7; color:#166534; border:1px solid #86efac; }
    .badge-no      { background:#fee2e2; color:#991b1b; border:1px solid #fca5a5; }
    .badge-pending { background:#f1f5f9; color:#64748b; border:1px solid #cbd5e1; }

    .test-card-body { padding: 12px 14px; }
    .clause-box    { background:#eef2ff; border:1px solid #c7d2fe; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:8.5pt; color:#3730a3; }
    .clause-box strong { color:#312e81; }
    .params-box    { background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:9pt; color:#334155; }
    .params-box strong { color:#0f172a; }
    .procedure-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:9pt; color:#0c4a6e; }
    .procedure-box strong { color:#075985; }
    .result-box    { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:9pt; color:#14532d; }
    .result-box strong { color:#166534; }
    .remarks-box   { background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:9pt; color:#78350f; }

    .section-title { font-size:9pt; font-weight:600; color:#374151; margin-bottom:8px; display:flex; align-items:center; gap:6px; }
    .section-title::before { content:''; display:inline-block; width:3px; height:12px; border-radius:2px; }
    .blue-bar::before   { background:#3b82f6; }
    .purple-bar::before { background:#8b5cf6; }

    .images-section { margin-top:10px; }
    .images-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
    .image-thumb { border:1px solid #e2e8f0; border-radius:6px; overflow:hidden; aspect-ratio:4/3; }
    .image-thumb img { width:100%; height:100%; object-fit:cover; display:block; }

    .docs-section { margin-top:12px; }
    .doc-card {
      border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;
      margin-bottom:10px; page-break-inside:avoid;
    }
    .doc-card-meta {
      display:flex; align-items:center; gap:10px; padding:8px 12px;
      background:#fafafa; border-bottom:1px solid #e2e8f0;
    }
    .doc-ext-badge {
      font-size:8pt; font-weight:700; padding:3px 8px;
      border-radius:4px; white-space:nowrap; flex-shrink:0;
    }
    .doc-filename { font-size:9pt; color:#1e293b; font-weight:500; flex:1; word-break:break-all; }
    .doc-card-info { padding:10px 14px; background:#fff; }

    .test-card-header, .clause-box, .params-box, .procedure-box, .result-box, .remarks-box, .images-section, .compact-doc-card {
      break-inside:avoid;
      page-break-inside:avoid;
    }

    .attachment-page {
      page-break-before: always;
      break-before: page;
      page-break-inside: avoid;
      break-inside: avoid;
      height: 245mm;
      border: 1px solid #e2e8f0;
      background: #fff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .attachment-label {
      flex: 0 0 auto;
      padding: 7px 10px;
      font-size: 8.5pt;
      font-weight: 700;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
      word-break: break-word;
    }
    .attachment-page img {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      background: #fff;
    }

    .signature-section { margin-top:28px; padding-top:18px; border-top:2px solid #e2e8f0; page-break-inside:avoid; }
    .signature-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; }
    .signature-block { text-align:center; }
    .signature-line { border-bottom:1px solid #94a3b8; margin-bottom:6px; height:40px; }
    .signature-label { font-size:8.5pt; color:#64748b; }

    .report-footer { margin-top:18px; padding-top:10px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:8pt; color:#94a3b8; }
  `;

  const triggerPrint = async () => {
    if (testItems.every((item) => item.compliance === '')) {
      alert('No checklist data found for this block.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.');
      return;
    }

    printWindow.document
      .write(`<!DOCTYPE html><html><head><title>AT Block Rack Report</title>
      <style>body{display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#64748b;font-size:15pt;}</style>
      </head><body>⏳ Preparing report, please wait…</body></html>`);
    printWindow.document.close();

    let iconBase64 = '';
    try {
      iconBase64 = await toBase64(TricadIcon as unknown as string);
    } catch (_) {
      /* skip */
    }
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

    const attachmentPages: string[] = [];

    const itemsHtml = await Promise.all(
      testItems.map(async (item) => {
        const imagesHtml = await Promise.all(
          item.images.map((image, index) =>
            buildImageThumbHtml(image, item.testCaseNo, index, attachmentPages),
          ),
        );
        const docsHtml = await Promise.all(
          item.documents.map((doc) =>
            buildDocumentCardHtml(doc, item.testCaseNo, attachmentPages),
          ),
        );

        const complianceBadgeClass =
          item.compliance === 'Yes'
            ? 'badge-yes'
            : item.compliance === 'No'
              ? 'badge-no'
              : 'badge-pending';

        return `
          <div class="test-card">
            <div class="test-card-header">
              <span class="test-badge">${escapeHtml(item.testCaseNo)}</span>
              <span class="test-description">${escapeHtml(item.description)}</span>
              <span class="compliance-badge ${complianceBadgeClass}">${escapeHtml(item.compliance || 'Pending')}</span>
            </div>
            <div class="test-card-body">
              <div class="clause-box"><strong>RFP Clause: </strong>${escapeHtml(item.clause)}</div>
              <div class="params-box"><strong>Test Parameters: </strong>${escapeHtml(item.parameters)}</div>
              <div class="procedure-box"><strong>Test Procedure: </strong>${escapeHtml(item.procedure)}</div>
              <div class="result-box"><strong>Expected Result: </strong>${escapeHtml(item.expectedResult)}</div>
              ${item.remarks ? `<div class="remarks-box"><strong>Remarks: </strong>${escapeHtml(item.remarks)}</div>` : ''}
              ${
                imagesHtml.length > 0
                  ? `
              <div class="images-section">
                <div class="section-title blue-bar">Images (${imagesHtml.length})</div>
                <div class="images-grid">${imagesHtml.join('')}</div>
              </div>`
                  : ''
              }
              ${
                docsHtml.length > 0
                  ? `
              <div class="docs-section">
                <div class="section-title purple-bar">Documents (${docsHtml.length})</div>
                ${docsHtml.join('')}
              </div>`
                  : ''
              }
            </div>
          </div>`;
      }),
    );

    const yesCount = passedCount;
    const noCount = testItems.filter((item) => item.compliance === 'No').length;
    const pendingCount = testItems.length - completedCount;
    const progress = Math.round((completedCount / testItems.length) * 100);

    const tocHtml = `
      <li>1. Introduction</li>
      <li>2. Acceptance Memorandum</li>
      <li>3. Acceptance testing test cases
        <ul class="toc-sublist"><li>3.1 Test cases for BLOCK smart rack</li></ul>
      </li>
    `;

    const certFileHtml: Record<CertificationKey, string> = {
      tsecCertificate: '',
      qaCertificate: '',
      qrCodeLogo: '',
      photoEvidence: '',
      oemApproval: '',
    };
    for (const { key, label } of CERTIFICATION_FIELDS) {
      certFileHtml[key] = await fileSlotHtml(certFiles?.[key], label);
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AT Block Rack Compliance Report</title>
  <style>${buildPrintStyles()}</style>
</head>
<body>
  <div class="doc-header">${DOC_CODE}</div>
  <div class="cover">
    ${bharatNetLogoBase64 ? `<img class="cover-logo" src="${bharatNetLogoBase64}" alt="BharatNet Logo" />` : ''}
    ${bsnlLogoBase64 ? `<img class="cover-logo" src="${bsnlLogoBase64}" alt="BSNL Logo" />` : ''}
    <h1>Bharat Sanchar Nigam Limited</h1>
    <p>Acceptance Testing Test Cases document for Block Rack — ${escapeHtml(blockName)}<br/>as per BSNL Bharatnet Tender No. MM/BNO&M/BN-III/T-791/2024 issued on 15.02.2024</p>
  </div>

  <div class="toc-page">
    <div class="toc-title">Table of Contents</div>
    <ul class="toc-list">${tocHtml}</ul>
  </div>

  <h2 class="section-title">1. Introduction</h2>
  <p class="intro-text">This document outlines the Acceptance Testing (A/T) procedures for Smart Rack at Block, in accordance with the requirements of BSNL BharatNet Tender No. MM/BNO&M/BN-III/T-791/2024 dated 15.02.2024. It covers the applicable test cases in line with industry best practices, relevant specifications and standards, and includes the acceptance testing template for quality assurance in accordance with the requirements specified in the RFP.</p>

  <h2 class="section-title">2. Acceptance Memorandum</h2>
  <table class="memo-table">
    <tr><td class="label">Equipment description</td><td>${memorandum?.equipmentDescription ? escapeHtml(memorandum.equipmentDescription) : '&nbsp;'}</td></tr>
    <tr><td class="label">Site Name with Block code</td><td>${escapeHtml(memorandum?.siteNameBlockCode || blockName)}</td></tr>
    <tr><td class="label">Site Address</td><td>${memorandum?.siteAddress ? escapeHtml(memorandum.siteAddress) : '&nbsp;'}</td></tr>
    <tr><td class="label">Date &amp; Time</td><td>${memorandum?.dateTime ? escapeHtml(memorandum.dateTime) : new Date().toLocaleString()}</td></tr>
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

  <h3 style="font-size:11pt;font-weight:700;margin:14px 0 8px;color:#1565c0;">Certification Verification</h3>
  <table class="cert-table">
    <tr><td class="label">Rack</td><td>DIN41491, DIN41494, and IEC297.</td></tr>
    <tr><td class="label">All products/OEM</td><td>ISO 9001, 14001, ISO 45001 and IS13252: PART1 (2010) &amp; IEC 60950-1.</td></tr>
    <tr><td class="label">Protection category</td><td>IP55: IS/IEC60529:2001. Certificate from NABL accredited lab shall be attached.</td></tr>
    <tr><td class="label">TSEC Certificate</td><td>${certFileHtml.tsecCertificate}</td></tr>
    <tr><td class="label">QA Certificate</td><td>${certFileHtml.qaCertificate}</td></tr>
    <tr><td class="label">QR Code, logo</td><td>${certFileHtml.qrCodeLogo}</td></tr>
    <tr><td class="label">Photo evidence</td><td>${certFileHtml.photoEvidence}</td></tr>
    <tr><td class="label">OEM approval by BSNL</td><td>${certFileHtml.oemApproval}</td></tr>
  </table>

  <h3 style="font-size:11pt;font-weight:700;margin:14px 0 8px;color:#1565c0;">Documentation Requirements</h3>
  <table class="cert-table">
    <tr>
      <td class="label">Documentation requirements</td>
      <td>
        <strong>Test 1:</strong> The contractor shall provide the following documents: system description documents; installation, operation and maintenance documents.<br/>
        <strong>Test 2:</strong> All technical documents shall be in English language both in CD-ROM and in hard copy. To be provided by PIA along with first Block AT offered for the package.
      </td>
    </tr>
  </table>

  <h2 class="section-title">3. Acceptance Testing Test Cases</h2>
  <div class="report-header">
    ${iconBase64 ? `<img src="${iconBase64}" alt="Logo" />` : '<div></div>'}
    <div class="report-header-title">
      <h1>AT Block Rack Tests - ${escapeHtml(blockName)}</h1>
      <p>Acceptance Test - BSNL BharatNet Block Rack Compliance Report</p>
      <p style="font-size:8pt;color:#94a3b8;margin-top:2px;">Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <div class="summary-bar">
    <div class="summary-chip chip-total"><div class="chip-value">${testItems.length}</div><div class="chip-label">Total Tests</div></div>
    <div class="summary-chip chip-yes"><div class="chip-value">${yesCount}</div><div class="chip-label">Compliant</div></div>
    <div class="summary-chip chip-no"><div class="chip-value">${noCount}</div><div class="chip-label">Non-Compliant</div></div>
    <div class="summary-chip chip-pending"><div class="chip-value">${pendingCount}</div><div class="chip-label">Pending</div></div>
  </div>

  <div class="progress-wrap">
    <div class="progress-label"><span>Completion Progress</span><span>${completedCount} / ${testItems.length} completed (${progress}%)</span></div>
    <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
  </div>

  ${itemsHtml.join('')}

  <div class="signature-section">
    <div class="signature-grid">
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">PIA Representative</div></div>
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">IE Representative</div></div>
      <div class="signature-block"><div class="signature-line"></div><div class="signature-label">BSNL Representative</div></div>
    </div>
  </div>

  <div class="report-footer">
    <span>AT Block Rack Compliance Checklist — Block Name: ${escapeHtml(blockName)}</span>
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
    const isCompleted = item.compliance !== '';
    const isPassed = item.compliance === 'Yes';

    return (
      <div
        key={item.id}
        className={`group bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
          !isCompleted
            ? 'border-gray-100 opacity-60'
            : isPassed
              ? 'border-emerald-100 hover:border-emerald-200'
              : 'border-red-100 hover:border-red-200'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div
                className={`w-10 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  !isCompleted
                    ? 'bg-gray-100 text-gray-400'
                    : isPassed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                }`}
              >
                {item.testCaseNo}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 mb-1 leading-relaxed">
                {item.description}
              </p>
              <p className="text-xs text-gray-400 mb-2">{item.clause}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <p className="text-xs text-gray-500">
                  <b>Parameters:</b> {item.parameters}
                </p>
                <p className="text-xs text-gray-500">
                  <b>Procedure:</b> {item.procedure}
                </p>
              </div>
              <p className="text-xs text-emerald-700 mb-2">
                <b>Expected Result:</b> {item.expectedResult}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {isCompleted ? (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isPassed
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-red-50 text-red-700 ring-1 ring-red-200'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {isPassed ? 'Compliance (Yes)' : 'Compliance (No)'}
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
                    <ImageIcon className="w-3 h-3" />
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
                <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg mt-2 inline-block">
                  <b>Remarks:</b> {item.remarks}
                </p>
              )}

              {item.images.length > 0 && (
                <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                  {item.images.slice(0, 6).map((img, idx) => {
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
                              (e.currentTarget as HTMLImageElement).style.display =
                                'none';
                            }}
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                          {isVideo ? (
                            <Video className="w-3 h-3 text-white" />
                          ) : (
                            <ImageIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                  {item.images.length > 6 && (
                    <button
                      onClick={() => openCarousel(item.images, 6)}
                      className="flex-shrink-0 w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      +{item.images.length - 6}
                    </button>
                  )}
                </div>
              )}
              {renderDocuments(item)}
            </div>

            <div className="flex-shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  !isCompleted
                    ? 'bg-gray-100'
                    : isPassed
                      ? 'bg-emerald-100'
                      : 'bg-red-100'
                }`}
              >
                {isCompleted &&
                  (isPassed ? (
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

  const renderCertFile = (key: CertificationKey, label: string) => {
    const url = certFiles?.[key];
    return (
      <div key={key} className="border border-gray-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>
        {url ? (
          isImageUrl(url) ? (
            <button
              onClick={() => openCarousel([url], 0)}
              className="flex items-center gap-2"
            >
              <img
                src={getFullImageUrl(url)}
                alt={label}
                className="w-14 h-14 object-cover rounded-lg border border-gray-200"
              />
              <span className="text-xs text-blue-600 hover:underline truncate">
                {getFileName(url)}
              </span>
            </button>
          ) : (
            <button
              onClick={() => openDocument(url)}
              className="flex items-center gap-2 text-purple-700 hover:text-purple-900"
            >
              <FileText className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs truncate">{getFileName(url)}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </button>
          )
        ) : (
          <p className="text-xs text-gray-400">Not uploaded</p>
        )}
      </div>
    );
  };

  if (loadingData && !rackData) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/at-checklist-data-list')}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                <ClipboardCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  AT Block Rack Checklist
                </h1>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{blockName || blockId}</span>
                  {districtName && (
                    <>
                      <span className="text-gray-300">|</span>
                      <Building2 className="w-3 h-3" />
                      <span>{districtName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-500 mb-1">
                  {completedCount}/{totalCount} Tests ({passedCount} Passed)
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
                {preparing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                <span>{preparing ? 'Preparing...' : 'Print'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Acceptance Memorandum */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Acceptance Memorandum
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Equipment Description</p>
              <p className="text-gray-800">
                {memorandum?.equipmentDescription || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Site Name with Block code</p>
              <p className="text-gray-800">
                {memorandum?.siteNameBlockCode || blockName || '—'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400">Site Address</p>
              <p className="text-gray-800">{memorandum?.siteAddress || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date &amp; Time</p>
              <p className="text-gray-800">{memorandum?.dateTime || '—'}</p>
            </div>
          </div>
        </div>

        {/* Certification Verification */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3">
            Certification Verification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {CERTIFICATION_FIELDS.map(({ key, label }) =>
              renderCertFile(key, label),
            )}
          </div>
        </div>

        {testItems.every((item) => item.compliance === '') && !loadingData ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Data Available
            </h3>
            <p className="text-gray-400">
              No checklist data found for this block.
            </p>
          </div>
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

export default ATBlockRackView;
