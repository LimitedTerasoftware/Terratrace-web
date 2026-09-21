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
import { getATBlockRouterData } from '../../Services/api';
import { ATRouterData } from '../../../types/block-router-checklist';
import {
  basicCheckTests,
  networkTests,
  CERTIFICATION_FIELDS,
  CertificationKey,
  DOC_CODE,
} from '../forms/ATBlockRouter';
import MediaCarousel from '../../DepthChart/MediaCarousel';
import BharatNetLogo from '../../../images/logo/bharatnet-logo.jpg';
import BsnlLogo from '../../../images/logo/bsnl-logo.jpg';
import NetworkDiagram from '../../../images/logo/at-router-network-diagram.png';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ImgbaseUrl = import.meta.env.VITE_Image_URL;

interface BasicTestItem {
  id: string;
  testCaseNo: string;
  description: string;
  procedure: string;
  compliance: string;
  remarks: string;
  images: string[];
  documents: string[];
}

interface NetworkTestItemView {
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
  testConfiguration: string;
  testResults: string;
  status: string;
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

const ATBlockRouterView = () => {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const blockName = searchParams.get('block_name') || '';
  const stateName = searchParams.get('state_name') || '';
  const districtName = searchParams.get('district_name') || '';

  const [loadingData, setLoadingData] = useState(false);
  const [routerData, setRouterData] = useState<ATRouterData | null>(null);
  const [activeSection, setActiveSection] = useState<'basic' | 'network'>(
    'basic',
  );
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselItems, setCarouselItems] = useState<string[]>([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [preparing, setPreparing] = useState(false);

  const fetchData = async () => {
    if (!blockId) return;
    setLoadingData(true);
    try {
      const data = await getATBlockRouterData(blockId);
      setRouterData(data?.status ? data : null);
    } catch (error) {
      console.error('Error fetching AT Block Router data:', error);
      setRouterData(null);
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

  const basicItems: BasicTestItem[] = basicCheckTests.map((tc) => {
    const testData = routerData?.basic?.[tc.id];
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

  const networkItems: NetworkTestItemView[] = networkTests.map((tc) => {
    const testData = routerData?.network?.[tc.id];
    const attachments = testData?.Image ? parseImageUrls(testData.Image) : [];
    const { images, documents } = splitAttachments(attachments);
    return {
      id: tc.id,
      testNo: tc.testNo,
      title: tc.title,
      testDetails: tc.testDetails,
      testInstruments: tc.testInstruments,
      testSetup: tc.testSetup,
      testSetupImage: tc.testSetupImage,
      testProcedure: tc.testProcedure,
      testLimits: tc.testLimits,
      expectedResults: tc.expectedResults,
      testConfiguration: testData?.testConfiguration || '',
      testResults: testData?.testResults || '',
      status: testData?.status || '',
      remarks: testData?.remarks || '',
      images,
      documents,
    };
  });

  const basicCompletedCount = basicItems.filter((i) => i.compliance !== '')
    .length;
  const networkCompletedCount = networkItems.filter((i) => i.status !== '')
    .length;
  const totalCount = basicItems.length + networkItems.length;
  const completedCount = basicCompletedCount + networkCompletedCount;
  const passCount =
    basicItems.filter((i) => i.compliance === 'Yes').length +
    networkItems.filter((i) => i.status === 'Pass').length;

  const memorandum = routerData?.memorandum;
  const memorandumFiles = routerData?.memorandumFiles;
  const certFiles = routerData?.certificationFiles;

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

  const buildPrintStyles = (): string => `
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
  `;

  const triggerPrint = async () => {
    if (totalCount === 0 || (basicCompletedCount === 0 && networkCompletedCount === 0)) {
      alert('No checklist data found for this block.');
      return;
    }

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
      url: string | undefined,
      label: string,
    ): Promise<string> => {
      if (!url) return '&nbsp;';
      if (isImageUrl(url)) {
        let src = getFullImageUrl(url);
        try {
          src = await toBase64(src);
        } catch (_) {}
        attachmentPages.push(`
          <div class="attachment-page image-attachment-page">
            <div class="attachment-label">${escapeHtml(label)}</div>
            <img src="${src}" alt="${escapeHtml(label)}" />
          </div>
        `);
        return `<img src="${src}" alt="${escapeHtml(label)}" class="memo-file-image" />`;
      }

      if (getFileExt(url) === 'pdf') {
        try {
          const pdfPages = await renderPdfToImages(url);
          pdfPages.forEach((src, index) => {
            attachmentPages.push(`
              <div class="attachment-page pdf-attachment-page">
                <div class="attachment-label">${escapeHtml(label)} - Page ${index + 1}</div>
                <img src="${src}" alt="${escapeHtml(label)} page ${index + 1}" />
              </div>
            `);
          });
        } catch (error) {
          console.error('Certification PDF render failed:', label, error);
        }
      }
      return `<div class="doc-chip">📎 ${escapeHtml(getFileName(url))}</div>`;
    };

    const buildDocsListHtml = async (
      documents: string[],
      labelPrefix: string,
    ): Promise<string> => {
      if (documents.length === 0) return '';
      const chips = await Promise.all(
        documents.map(async (doc) => {
          const name = getFileName(doc);
          if (getFileExt(doc) === 'pdf') {
            try {
              const pdfPages = await renderPdfToImages(doc);
              pdfPages.forEach((src, index) => {
                attachmentPages.push(`
                  <div class="attachment-page pdf-attachment-page">
                    <div class="attachment-label">${escapeHtml(labelPrefix)} - ${escapeHtml(name)} - Page ${index + 1}</div>
                    <img src="${src}" alt="${escapeHtml(name)} page ${index + 1}" />
                  </div>
                `);
              });
            } catch (error) {
              console.error('Document PDF render failed:', name, error);
            }
          }
          return `<div class="doc-chip">📎 ${escapeHtml(name)}</div>`;
        }),
      );
      return `<div class="docs-list">${chips.join('')}</div>`;
    };

    const collectImagesHtml = async (
      images: string[],
      labelPrefix: string,
    ): Promise<string> => {
      const thumbs = await Promise.all(
        images.map(async (image, index) => {
          const fullUrl = getFullImageUrl(image);
          let src = fullUrl;
          try {
            src = await toBase64(fullUrl);
          } catch (_) {}
          const label = getFileName(image) || `${labelPrefix}-image-${index + 1}`;
          attachmentPages.push(`
            <div class="attachment-page">
              <div class="attachment-label">${escapeHtml(labelPrefix)} - ${escapeHtml(label)}</div>
              <img src="${src}" alt="${escapeHtml(label)}" />
            </div>
          `);
          return `<div class="image-thumb"><img src="${src}" alt="evidence" /></div>`;
        }),
      );
      return thumbs.length
        ? `<div class="images-grid">${thumbs.join('')}</div>`
        : '';
    };

    const basicRowsHtml = await Promise.all(
      basicItems.map(async (item) => {
        const imagesHtml = await collectImagesHtml(item.images, item.testCaseNo);
        const docsHtml = await buildDocsListHtml(item.documents, item.testCaseNo);
        return `
          <tr>
            <td class="cell-code">${item.testCaseNo}</td>
            <td class="cell-desc">${escapeHtml(item.description)}<div class="mini-procedure"><strong>Procedure: </strong>${escapeHtml(item.procedure)}</div>${item.remarks ? `<div class="mini-remarks"><strong>Remarks: </strong>${escapeHtml(item.remarks)}</div>` : ''}${imagesHtml}${docsHtml}</td>
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
        const docsHtml = await buildDocsListHtml(item.documents, `Test ${item.testNo}`);
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
      memorandumFiles?.networkDiagram,
      'Block network diagram',
    );
    const qrCodeFileHtml = await fileSlotHtml(memorandumFiles?.qrCode, 'QR code');
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

    const failCount =
      basicItems.filter((i) => i.compliance === 'No').length +
      networkItems.filter((i) => i.status === 'Fail').length;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>AT Block Router - ${escapeHtml(blockName)}</title>
<style>${buildPrintStyles()}</style>
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
    <tr><td class="label">Equipment description</td><td>${memorandum?.equipmentDescription ? escapeHtml(memorandum.equipmentDescription) : '&nbsp;'}</td></tr>
    <tr><td class="label">Site Name with LGD code</td><td>${escapeHtml(memorandum?.siteNameLGD || blockName)}</td></tr>
    <tr><td class="label">Site Address</td><td>${memorandum?.siteAddress ? escapeHtml(memorandum.siteAddress) : '&nbsp;'}</td></tr>
    <tr><td class="label">Router hostname</td><td>${memorandum?.routerHostname ? escapeHtml(memorandum.routerHostname) : '&nbsp;'}</td></tr>
    <tr><td class="label">Router WAN interface / loopback0 IP address</td><td>${memorandum?.wanInterfaceIp ? escapeHtml(memorandum.wanInterfaceIp) : '&nbsp;'}</td></tr>
    <tr><td class="label">Date &amp; Time</td><td>${memorandum?.dateTime ? escapeHtml(memorandum.dateTime) : new Date().toLocaleString()}</td></tr>
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
    <div class="summary-chip"><div class="val">${totalCount}</div><div class="lbl">Total Tests</div></div>
    <div class="summary-chip"><div class="val" style="color:#166534">${passCount}</div><div class="lbl">Pass</div></div>
    <div class="summary-chip"><div class="val" style="color:#b91c1c">${failCount}</div><div class="lbl">Fail</div></div>
    <div class="summary-chip"><div class="val">${completedCount}/${totalCount}</div><div class="lbl">Completed</div></div>
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

    const waitForImages = (doc: Document): Promise<void> => {
      const imgs = Array.from(doc.images);
      if (imgs.length === 0) return Promise.resolve();
      return Promise.all(
        imgs.map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.addEventListener('load', () => resolve());
                  img.addEventListener('error', () => resolve());
                }),
        ),
      ).then(() => undefined);
    };

    printWindow.onload = () => {
      waitForImages(printWindow.document).then(() => {
        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
        }, 300);
      });
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

  const renderAttachments = (images: string[], documents: string[]) => (
    <>
      {images.length > 0 && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {images.slice(0, 6).map((img, idx) => {
            const isVideo = isVideoUrl(img);
            return (
              <button
                key={idx}
                onClick={() => openCarousel(images, idx)}
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
                    <ImageIcon className="w-3 h-3 text-white" />
                  )}
                </div>
              </button>
            );
          })}
          {images.length > 6 && (
            <button
              onClick={() => openCarousel(images, 6)}
              className="flex-shrink-0 w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              +{images.length - 6}
            </button>
          )}
        </div>
      )}
      {documents.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {documents.map((doc, idx) => {
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
      )}
    </>
  );

  const renderBasicCard = (item: BasicTestItem) => {
    const isCompleted = item.compliance !== '';
    const isPassed = item.compliance === 'Yes';
    return (
      <div
        key={item.id}
        className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
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
              <p className="text-xs text-gray-500 mb-2">
                <b>Procedure:</b> {item.procedure}
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
              </div>
              {item.remarks && (
                <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg mt-2 inline-block">
                  <b>Remarks:</b> {item.remarks}
                </p>
              )}
              {renderAttachments(item.images, item.documents)}
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

  const renderNetworkCard = (item: NetworkTestItemView) => {
    const isCompleted = item.status !== '';
    const isPassed = item.status === 'Pass';
    return (
      <div
        key={item.id}
        className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${
          !isCompleted
            ? 'border-gray-100 opacity-60'
            : isPassed
              ? 'border-emerald-100 hover:border-emerald-200'
              : 'border-red-100 hover:border-red-200'
        }`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3 mb-3">
            <div
              className={`flex-shrink-0 w-10 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                !isCompleted
                  ? 'bg-gray-100 text-gray-400'
                  : isPassed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              N{item.testNo}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {item.title}
              </p>
              {item.testDetails && item.testDetails !== item.title && (
                <p className="text-xs text-gray-400">{item.testDetails}</p>
              )}
            </div>
            {isCompleted ? (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
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
                {item.status}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400 ring-1 ring-gray-200 flex-shrink-0">
                <AlertCircle className="w-3 h-3" />
                Pending
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
            <p>
              <b>Test Instruments:</b> {item.testInstruments}
            </p>
            <p>
              <b>Test Limits:</b> {item.testLimits}
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            <b>Test Setup:</b> {item.testSetup}
          </p>
          {item.testSetupImage && (
            <img
              src={item.testSetupImage}
              alt="Test setup"
              className="max-w-[220px] rounded-lg border border-gray-200 mb-2"
            />
          )}
          <div className="text-xs text-gray-500 mb-2">
            <b>Test Procedure:</b>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {item.testProcedure.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-emerald-700 mb-2">
            <b>Expected Results:</b>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {item.expectedResults.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2">
            <p>
              <b>Test Configuration:</b> {item.testConfiguration || '—'}
            </p>
            <p>
              <b>Test Results:</b> {item.testResults || '—'}
            </p>
          </div>

          {item.remarks && (
            <p className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg mt-2 inline-block">
              <b>Remarks:</b> {item.remarks}
            </p>
          )}

          {renderAttachments(item.images, item.documents)}
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

  const renderMemoFile = (url: string | undefined, label: string) => (
    <div className="border border-gray-200 rounded-lg p-3">
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

  const noData = totalCount > 0 && completedCount === 0 && !loadingData;

  if (loadingData && !routerData) {
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
                  AT Block Router Checklist
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
                  {completedCount}/{totalCount} Tests ({passCount} Passed)
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
                disabled={preparing || loadingData || completedCount === 0}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-3">
            <div>
              <p className="text-xs text-gray-400">Equipment Description</p>
              <p className="text-gray-800">
                {memorandum?.equipmentDescription || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Site Name with LGD code</p>
              <p className="text-gray-800">
                {memorandum?.siteNameLGD || blockName || '—'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-gray-400">Site Address</p>
              <p className="text-gray-800">{memorandum?.siteAddress || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Router hostname</p>
              <p className="text-gray-800">
                {memorandum?.routerHostname || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">
                Router WAN interface / loopback0 IP
              </p>
              <p className="text-gray-800">
                {memorandum?.wanInterfaceIp || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Date &amp; Time</p>
              <p className="text-gray-800">{memorandum?.dateTime || '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {renderMemoFile(
              memorandumFiles?.networkDiagram,
              'Block network diagram (rings and child-rings)',
            )}
            {renderMemoFile(memorandumFiles?.qrCode, 'QR code')}
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

        {noData ? (
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
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveSection('basic')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === 'basic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Basic Pre-AT Checks ({basicCompletedCount}/{basicItems.length})
              </button>
              <button
                onClick={() => setActiveSection('network')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === 'network'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Network Configuration Tests ({networkCompletedCount}/
                {networkItems.length})
              </button>
            </div>

            <div className="grid gap-3">
              {activeSection === 'basic'
                ? basicItems.map(renderBasicCard)
                : networkItems.map(renderNetworkCard)}
            </div>
          </>
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

export default ATBlockRouterView;
