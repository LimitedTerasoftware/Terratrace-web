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
import {
  ATBlockRackPrintData,
  PrintFile,
  buildATBlockRackPrintHtml,
  loadRackTemplateImages,
  printHtmlDocument,
} from '../print/atBlockRackPrint';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const ImgbaseUrl = import.meta.env.VITE_Image_URL;

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

  const toPrintFile = async (
    url: string | undefined,
    fallbackName: string,
  ): Promise<PrintFile | null> => {
    if (!url) return null;
    const name = getFileName(url) || fallbackName;
    const kind = isImageUrl(url) ? 'image' : getFileExt(url) === 'pdf' ? 'pdf' : 'other';
    try {
      if (kind === 'image') {
        return { name, kind, pages: [await toBase64(getFullImageUrl(url))] };
      }
      if (kind === 'pdf') {
        return { name, kind, pages: await renderPdfToImages(url) };
      }
    } catch (error) {
      console.error('Attachment render failed:', name, error);
    }
    return { name, kind, pages: [] };
  };

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

    const certifications = {} as Record<CertificationKey, PrintFile | null>;
    for (const { key, label } of CERTIFICATION_FIELDS) {
      certifications[key] = await toPrintFile(certFiles?.[key], label);
    }

    const tests: ATBlockRackPrintData['tests'] = {};
    for (const item of testItems) {
      const files = await Promise.all(
        [...item.images, ...item.documents].map((url, index) =>
          toPrintFile(url, `${item.testCaseNo}-${index + 1}`),
        ),
      );
      tests[item.id] = {
        compliance: item.compliance,
        remarks: item.remarks,
        files: files.filter((file): file is PrintFile => file !== null),
      };
    }

    const html = buildATBlockRackPrintHtml({
      blockName,
      memorandum: {
        equipmentDescription: memorandum?.equipmentDescription || '',
        siteNameBlockCode: memorandum?.siteNameBlockCode || blockName,
        siteAddress: memorandum?.siteAddress || '',
        dateTime: memorandum?.dateTime || new Date().toLocaleString(),
      },
      certifications,
      tests,
      images: await loadRackTemplateImages(toBase64),
    });

    printHtmlDocument(printWindow, html);
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
