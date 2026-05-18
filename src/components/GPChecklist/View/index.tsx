import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  Printer,
} from 'lucide-react';
import MediaCarousel from '../../DepthChart/MediaCarousel';
import { getChecklistPreview } from '../../Services/api';
import { Header } from '../../Breadcrumbs/Header';
import { addPdfAttachment, buildPrintPage, toBase64 } from '../forms/printUtils';

interface ChecklistItem {
  id: number;
  gp_main_id: number;
  gp_id: string | null;
  form_type: string;
  item_name: string;
  status: number;
  images: string | null;
  remark: string | null;
  item_type: string | null;
  created_at: string;
  updated_at: string;
}

interface ChecklistMain {
  id: number;
  state_id: number;
  district_id: number;
  block_id: number;
  gp_id: string;
  gp_name: string;
  latitude: string;
  longitude: string;
  site_images: string;
  building_images: string;
  building_type: string;
  user_id: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  state_name: string;
  district_name: string;
  block_name: string;
}

const ImgbaseUrl = import.meta.env.VITE_Image_URL;

const parseMediaUrls = (raw: string | null): string[] => {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

function GPChecklistView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [main, setMain] = useState<ChecklistMain | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isCarouselOpen, setIsCarouselOpen] = useState<boolean>(false);
  const [carouselMedia, setCarouselMedia] = useState<
    { type: string; url: string; label: string }[]
  >([]);
  const [carouselInitialIndex, setCarouselInitialIndex] = useState<number>(0);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getChecklistPreview(Number(id));
        if (response.status) {
          setMain(response.data.main);
          setItems(response.data.items);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.form_type]) {
        acc[item.form_type] = [];
      }
      acc[item.form_type].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>,
  );

  const parseStatus = (status: number) => {
    switch (status) {
      case 1:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <Check className="w-3 h-3" />With Proof
          </span>
        );
      case 0:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            <X className="w-3 h-3" /> Without Proof
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getItemImages = (images: string | null) => {
    const urls = parseMediaUrls(images);
    if (urls.length === 0) return null;
    return urls.map((url) => `${ImgbaseUrl}${url}`);
  };

  const isVideoOrPdf = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ext === 'pdf' || ext === 'mp4' || ext === 'webm';
  };

  const getMediaType = (url: string): 'image' | 'video' | 'pdf' => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (ext === 'mp4' || ext === 'webm') return 'video';
    if (ext === 'pdf') return 'pdf';
    return 'image';
  };

  const isPdf = (url: string) => url.toLowerCase().endsWith('.pdf');

  const openSiteImagesCarousel = () => {
    if (!main?.site_images) return;
    const urls = parseMediaUrls(main.site_images).map(
      (url) => `${ImgbaseUrl}${url}`,
    );
    if (urls.length > 0) {
      const pdfUrls = urls.filter(isPdf);
      const mediaUrls = urls.filter((url) => !isPdf(url));

      if (pdfUrls.length > 0) {
        setZoomImage(pdfUrls[0]);
      }

      if (mediaUrls.length > 0) {
        setCarouselMedia(
          mediaUrls.map((url, idx) => ({
            type: getMediaType(url),
            url,
            label: `Site Image ${idx + 1}`,
          })),
        );
        setCarouselInitialIndex(0);
        setIsCarouselOpen(true);
      }
    }
  };

  const openBuildingImagesCarousel = () => {
    if (!main?.building_images) return;
    const urls = parseMediaUrls(main.building_images).map(
      (url) => `${ImgbaseUrl}${url}`,
    );
    if (urls.length > 0) {
      const pdfUrls = urls.filter(isPdf);
      const mediaUrls = urls.filter((url) => !isPdf(url));

      if (pdfUrls.length > 0) {
        setZoomImage(pdfUrls[0]);
      }

      if (mediaUrls.length > 0) {
        setCarouselMedia(
          mediaUrls.map((url, idx) => ({
            type: getMediaType(url),
            url,
            label: `Building Image ${idx + 1}`,
          })),
        );
        setCarouselInitialIndex(0);
        setIsCarouselOpen(true);
      }
    }
  };

  const openItemImagesCarousel = (images: string[]) => {
    if (!images || images.length === 0) return;

    const pdfFiles = images.filter((url) => url.toLowerCase().endsWith('.pdf'));
    const mediaFiles = images.filter(
      (url) => !url.toLowerCase().endsWith('.pdf'),
    );

    if (pdfFiles.length > 0) {
      setZoomImage(pdfFiles[0]);
    }

    if (mediaFiles.length > 0) {
      const mediaItems = mediaFiles.map((url, idx) => {
        const isVideo =
          url.toLowerCase().endsWith('.mp4') ||
          url.toLowerCase().endsWith('.webm');
        return {
          type: isVideo ? 'video' : 'image',
          url,
          label: isVideo ? `Video ${idx + 1}` : `Image ${idx + 1}`,
        };
      });
      setCarouselMedia(mediaItems);
      setCarouselInitialIndex(0);
      setIsCarouselOpen(true);
    }
  };

  const InfoCard = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );

  const DataRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <span className="text-sm text-gray-900 font-semibold">
        {value || 'N/A'}
      </span>
    </div>
  );


  const escapeHtml = (value: string | number | null | undefined): string =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const getFullMediaUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${ImgbaseUrl}${url}`;
  };

  const getFileName = (url: string): string =>
    url.split('/').pop()?.split('?')[0] || 'Attachment';

  const isPrintableImage = (url: string): boolean => {
    const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
  };

  const isPrintablePdf = (url: string): boolean =>
    url.split('?')[0].split('#')[0].toLowerCase().endsWith('.pdf');

  const addRemoteImageAttachment = async (
    url: string,
    label: string,
    attachmentPages: string[],
  ): Promise<string> => {
    const fullUrl = getFullMediaUrl(url);
    const src = await toBase64(fullUrl);
    const safeLabel = escapeHtml(label);

    attachmentPages.push(`
      <div class="attachment-page">
        <div class="attachment-label">${safeLabel}</div>
        <img src="${src}" alt="${safeLabel}" />
      </div>
    `);

    return `<div class="image-thumb"><img src="${src}" alt="${safeLabel}" /></div>`;
  };

  const addPrintableAttachment = async (
    url: string,
    label: string,
    attachmentPages: string[],
  ): Promise<string> => {
    const fullUrl = getFullMediaUrl(url);
    const name = getFileName(url);

    if (isPrintablePdf(url)) {
      return addPdfAttachment(fullUrl, label, attachmentPages);
    }

    if (isPrintableImage(url)) {
      return addRemoteImageAttachment(fullUrl, label, attachmentPages);
    }

    return `<div class="file-info">Attached file: ${escapeHtml(name)}</div>`;
  };

  const addField = (label: string, value: string | number | null | undefined) =>
    `<div class="field-row"><span class="field-label">${escapeHtml(label)}</span><span class="field-value">${escapeHtml(value || 'N/A')}</span></div>`;

  const addSection = (sections: string[], title: string, content: string) => {
    sections.push(
      `<div class="section-card"><div class="section-header">${escapeHtml(title)}</div><div class="section-body">${content}</div></div>`,
    );
  };

  const getStatusLabel = (status: number): string => {
    if (status === 1) return 'With Proof';
    if (status === 0) return 'Without Proof';
    return 'Unknown';
  };

  const getStatusBadgeClass = (status: number): string => {
    if (status === 1) return 'badge-yes';
    if (status === 0) return 'badge-no';
    return 'badge-pending';
  };

  const triggerPrint = async () => {
    if (!main) return;

    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.');
      return;
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><title>GP Checklist</title>
      <style>body{display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#64748b;font-size:15pt;}</style>
      </head><body>Preparing report, please wait...</body></html>`);
    printWindow.document.close();

    const sections: string[] = [];
    const attachmentPages: string[] = [];

    addSection(
      sections,
      'Location Details',
      `
        ${addField('State', main.state_name)}
        ${addField('District', main.district_name)}
        ${addField('Block', main.block_name)}
        ${addField('GP Name', main.gp_name)}
        ${addField('Building Type', main.building_type)}
        ${addField('Latitude', main.latitude)}
        ${addField('Longitude', main.longitude)}
      `,
    );

    const siteImages = parseMediaUrls(main.site_images);
    if (siteImages.length > 0) {
      const thumbs = await Promise.all(
        siteImages.map((url, index) =>
          addPrintableAttachment(url, `Site Image ${index + 1}`, attachmentPages),
        ),
      );
      addSection(
        sections,
        `Site Images (${siteImages.length})`,
        `<div class="images-grid">${thumbs.join('')}</div>`,
      );
    }

    const buildingImages = parseMediaUrls(main.building_images);
    if (buildingImages.length > 0) {
      const thumbs = await Promise.all(
        buildingImages.map((url, index) =>
          addPrintableAttachment(url, `Building Image ${index + 1}`, attachmentPages),
        ),
      );
      addSection(
        sections,
        `Building Images (${buildingImages.length})`,
        `<div class="images-grid">${thumbs.join('')}</div>`,
      );
    }

    for (const [formType, formItems] of Object.entries(groupedItems)) {
      const itemCards = await Promise.all(
        formItems.map(async (item) => {
          const urls = parseMediaUrls(item.images);
          const attachments = await Promise.all(
            urls.map((url, index) =>
              addPrintableAttachment(
                url,
                `${formType} - ${item.item_name} - Attachment ${index + 1}`,
                attachmentPages,
              ),
            ),
          );

          return `
            <div class="checklist-item-card">
              <div class="checklist-item-head">
                <strong>${escapeHtml(item.item_name)}</strong>
                <span class="${getStatusBadgeClass(item.status)}">${escapeHtml(getStatusLabel(item.status))}</span>
              </div>
              ${item.item_type ? `<div class="text-value"><strong>Type:</strong> ${escapeHtml(item.item_type)}</div>` : ''}
              ${item.remark ? `<div class="remark-box"><strong>Remark:</strong> ${escapeHtml(item.remark)}</div>` : ''}
              ${attachments.length > 0 ? `<div class="subsection-title">Attachments (${attachments.length})</div><div class="images-grid">${attachments.join('')}</div>` : ''}
            </div>
          `;
        }),
      );

      addSection(sections, formType, `<div class="checklist-items-grid">${itemCards.join('')}</div>`);
    }

    const content = buildPrintPage(
      'GP Checklist Complete Verification Report',
      `All Forms ${main.gp_name || 'GP Checklist'}`,
      sections.join(''),
      attachmentPages,
      main.block_name,
    );

    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();

    const images = Array.from(printWindow.document.images);
    await Promise.all(
      images.map(
        (image) =>
          new Promise<void>((resolve) => {
            if (image.complete) return resolve();
            image.onload = () => resolve();
            image.onerror = () => resolve();
          }),
      ),
    );

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const handlePrint = async () => {
    setPreparing(true);
    try {
      await triggerPrint();
    } finally {
      setPreparing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/gp-checklist-list')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {zoomImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          {isVideoOrPdf(zoomImage) ? (
            <div className="bg-white p-4 rounded-lg">
              <a  href={zoomImage}  target="_blank"
                 rel="noopener noreferrer" download className="text-blue-600 underline">
                Download {zoomImage.split('.').pop()?.toUpperCase()} File
              </a>
            </div>
          ) : (
            <img
              src={zoomImage}
              alt="Zoomed"
              className="max-w-full max-h-full p-4 rounded-lg"
            />
          )}
        </div>
      )}

      <MediaCarousel
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
        mediaItems={carouselMedia}
        initialIndex={carouselInitialIndex}
      />

      <div className="min-h-screen bg-gray-50">
        <Header activeTab="installation-gpchecklistview" BackBut={true} />

        <div className="container mx-auto px-4 py-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GP Checklist Preview</h1>
              <p className="text-sm text-gray-500">{main?.gp_name || 'All checklist forms'}</p>
            </div>
            <button
              onClick={handlePrint}
              disabled={preparing || !main}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-white text-blue-700 text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {preparing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              {preparing ? 'Preparing...' : 'Print All Forms'}
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <InfoCard title="Location Details" icon={MapPin}>
              <div className="space-y-1">
                <DataRow label="State" value={main?.state_name || ''} />
                <DataRow label="District" value={main?.district_name || ''} />
                <DataRow label="Block" value={main?.block_name || ''} />
                <DataRow label="GP Name" value={main?.gp_name || ''} />
                <DataRow
                  label="Building Type"
                  value={main?.building_type || ''}
                />
                <DataRow label="Latitude" value={main?.latitude || ''} />
                <DataRow label="Longitude" value={main?.longitude || ''} />
              </div>
            </InfoCard>

            {main?.site_images && (
              <InfoCard title="Site Images" icon={ImageIcon}>
                <div className="grid grid-cols-2 gap-2">
                  {parseMediaUrls(main.site_images).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group cursor-pointer"
                      onClick={openSiteImagesCarousel}
                    >
                      <div className="w-full h-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                          src={`${ImgbaseUrl}${url}`}
                          alt={`Site Image ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {parseMediaUrls(main.site_images).length > 1 && (
                  <button
                    onClick={openSiteImagesCarousel}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    View all {parseMediaUrls(main.site_images).length} images
                  </button>
                )}
              </InfoCard>
            )}

            {main?.building_images && (
              <InfoCard title="Building Images" icon={ImageIcon}>
                <div className="grid grid-cols-2 gap-2">
                  {parseMediaUrls(main.building_images).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group cursor-pointer"
                      onClick={openBuildingImagesCarousel}
                    >
                      <div className="w-full h-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                          src={`${ImgbaseUrl}${url}`}
                          alt={`Building Image ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {parseMediaUrls(main.building_images).length > 1 && (
                  <button
                    onClick={openBuildingImagesCarousel}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    View all {parseMediaUrls(main.building_images).length}{' '}
                    images
                  </button>
                )}
              </InfoCard>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Checklist Items
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {Object.entries(groupedItems).map(([formType, formItems]) => (
              <div
                key={formType}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-950 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">
                    {formType}
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formItems.map((item) => {
                      const images = getItemImages(item.images);
                      return (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.item_name}
                            </h4>
                            {parseStatus(item.status)}
                          </div>
                          {item.item_type && (
                            <p className="text-xs text-gray-500 mb-2">
                              Type: {item.item_type}
                            </p>
                          )}
                          {item.remark && (
                            <p className="text-xs text-gray-600 mb-2 italic">
                              Remark: {item.remark}
                            </p>
                          )}
                          {images && images.length > 0 && (
                            <div className="mt-2">
                              <button
                                onClick={() => openItemImagesCarousel(images)}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {images.length}{' '}
                                {images.length === 1
                                  ? 'attachment'
                                  : 'attachments'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default GPChecklistView;
