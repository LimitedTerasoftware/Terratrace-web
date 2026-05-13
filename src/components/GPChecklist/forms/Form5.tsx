import {
  Globe,
  Camera,
  FileCheck,
  Map,
  UserCheck,
  Upload,
  X,
  FileText,
  Printer,
  Loader2,
} from 'lucide-react';
import { FormData, GeoTaggedImage } from '../../../types/gp-checklist';
import ImageCapture from './ImageCapture';
import { useState, useEffect } from 'react';
import {
  addImageAttachment,
  buildPrintPage,
  addPdfAttachment,
} from './printUtils';

interface Form5Props {
  data: FormData['form5'] | undefined;
  onChange: (data: FormData['form5'] | undefined) => void;
}

export default function Form5({ data, onChange }: Form5Props) {
  const updateField = (field: string, value: string | File | null) => {
    onChange({ ...data, [field]: value });
  };
  const [photosAngleImages, setPhotosAngleImages] = useState<GeoTaggedImage[]>(
    data?.photosAngleImages || [],
  );
  const [GISImgages, setGISImages] = useState<GeoTaggedImage[]>(
    data?.GISImgages || [],
  );
  const [IEimages, setIEImages] = useState<GeoTaggedImage[]>(
    data?.IEimages || [],
  );
  const [preparing, setPreparing] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      if (data.photosAngleImages) setPhotosAngleImages(data.photosAngleImages);
      if (data.GISImgages) setGISImages(data.GISImgages);
      if (data.IEimages) setIEImages(data.IEimages);
    }
  }, [data]);
  const handleAngleImagesChange = (image: GeoTaggedImage) => {
    const updated = [...photosAngleImages, image];
    setPhotosAngleImages(updated);
    onChange({ ...data, photosAngleImages: updated });
  };
  const handleGISImagesChange = (image: GeoTaggedImage) => {
    const updated = [...GISImgages, image];
    setGISImages(updated);
    onChange({ ...data, GISImgages: updated });
  };
  const handleIEImagesChange = (image: GeoTaggedImage) => {
    const updated = [...IEimages, image];
    setIEImages(updated);
    onChange({ ...data, ieVerification: 'yes', IEimages: updated });
  };

  const removeImage = (
    imageId: string,
    images: GeoTaggedImage[],
    setImages: React.Dispatch<React.SetStateAction<GeoTaggedImage[]>>,
    fieldName: 'photosAngleImages' | 'GISImgages' | 'IEimages',
  ) => {
    const updated = images.filter((img) => img.id !== imageId);
    setImages(updated);
    onChange({ ...data, [fieldName]: updated });
  };

  const ImagePreview = ({
    images,
    setImages,
    label,
    fieldName,
  }: {
    images: GeoTaggedImage[];
    setImages: React.Dispatch<React.SetStateAction<GeoTaggedImage[]>>;
    label: string;
    fieldName: 'photosAngleImages' | 'GISImgages' | 'IEimages';
  }) => (
    <>
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img
                src={img.watermarkedPreview || img.preview}
                alt={label}
                className="w-full h-24 object-cover rounded-lg"
              />

              <button
                onClick={() =>
                  removeImage(img.id, images, setImages, fieldName)
                }
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  const triggerPrint = async () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups for this site to print.');
      return;
    }
    printWindow.document
      .write(`<!DOCTYPE html><html><head><title>GP Checklist - Form 5</title>
    <style>body{display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#64748b;font-size:15pt;}</style>
    </head><body>⏳ Preparing report, please wait…</body></html>`);
    printWindow.document.close();

    const sections: string[] = [];
    const attachmentPages: string[] = [];
    const addSection = (title: string, content: string) => {
      sections.push(
        `<div class="section-card"><div class="section-header">${title}</div><div class="section-body">${content}</div></div>`,
      );
    };
    const addField = (label: string, value: string | undefined) =>
      `<div class="field-row"><span class="field-label">${label}</span><span class="field-value">${value || '—'}</span></div>`;
    const addImages = async (
      images: GeoTaggedImage[],
      label: string,
    ): Promise<string> => {
      if (!images.length) return '';
      const imgs = await Promise.all(
        images.map((img) => addImageAttachment(img, label, attachmentPages)),
      );
      return `<div class="images-grid">${imgs.join('')}</div>`;
    };

    addSection(
      'Photo Verification',
      `
      ${addField('Photos Geo-tagged (5 Angles)', data?.photosGeoTagged)}
      ${data?.photosGeoTagged === 'yes' && photosAngleImages.length > 0 ? `<div class="subsection-title">Angle Photos</div>${await addImages(photosAngleImages, 'Angle Photos')}` : ''}
      ${addField('Video Uploaded', data?.videoUploaded)}
      ${
        data?.videoUploaded === 'yes' && data?.videoUploadedFile
          ? typeof data.videoUploadedFile === 'string'
            ? `<div class="file-info">🎥 <a href="${data.videoUploadedFile}" target="_blank">View Video</a></div>`
            : `<div class="file-info">🎥 ${(data.videoUploadedFile as File).name}</div>`
          : ''
      }
    `,
    );
    const abdHtml =
      data?.abdUpdated === 'yes'
        ? data?.abdPDF
          ? await addPdfAttachment(data.abdPDF, 'ABD PDF', attachmentPages)
          : '<div class="text-value">ABD Updated</div>'
        : addField('ABD Updated', data?.abdUpdated);
    addSection(
      'Digital Documentation',
      `
      ${abdHtml}
      ${addField('GIS Entry Completed', data?.gisEntryCompleted)}
      ${data?.gisEntryCompleted === 'yes' && GISImgages.length > 0 ? `<div class="subsection-title">GIS Images</div>${await addImages(GISImgages, 'GIS Entry')}` : ''}
    `,
    );
    addSection(
      'Independent Engineer Verification',
      `
      ${addField('IE Verification', data?.ieVerification)}
      ${data?.ieVerification === 'yes' && IEimages.length > 0 ? `<div class="subsection-title">IE Images</div>${await addImages(IEimages, 'IE Verification')}` : ''}
    `,
    );

    const content = buildPrintPage(
      'GP Checklist — GIS Mapping',
      'Form 5 — GIS Mapping & Digital Documentation',
      sections.join(''),
      attachmentPages,
    );
    printWindow.document.open();
    printWindow.document.write(content);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-teal-100 rounded-xl">
          <Globe className="w-6 h-6 text-teal-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">GIS Mapping</h2>
        <div className="ml-auto">
          <button
            onClick={handlePrint}
            disabled={preparing}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-teal-200 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {preparing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Printer size={16} />
            )}
            {preparing ? 'Preparing…' : 'Print'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-teal-50 border border-teal-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-200 rounded-lg">
            <Camera className="w-4 h-4 text-teal-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Photo Verification
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Photos taken (5 angles: close-up + 4 directional) and geo-tagged
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="photosGeoTagged"
                value="yes"
                checked={data?.photosGeoTagged === 'yes'}
                onChange={(e) => updateField('photosGeoTagged', e.target.value)}
                className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="photosGeoTagged"
                value="no"
                checked={data?.photosGeoTagged === 'no'}
                onChange={(e) => updateField('photosGeoTagged', e.target.value)}
                className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {data?.photosGeoTagged === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload 5 Angle Photos (Close-up + 4 Directional)
            </label>
            <ImageCapture
              onCapture={handleAngleImagesChange}
              label="Capture Photos"
            />
            <ImagePreview
              images={photosAngleImages}
              setImages={setPhotosAngleImages}
              label="Photos (5 Angles)"
              fieldName="photosAngleImages"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Video of GP installation uploaded to BharatNet GIS app
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="videoUploaded"
                value="yes"
                checked={data?.videoUploaded === 'yes'}
                onChange={(e) => updateField('videoUploaded', e.target.value)}
                className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="videoUploaded"
                value="no"
                checked={data?.videoUploaded === 'no'}
                onChange={(e) => updateField('videoUploaded', e.target.value)}
                className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {data?.videoUploaded === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload Installation Video
            </label>
            {typeof data?.videoUploadedFile === 'string' &&
            data.videoUploadedFile ? (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <video
                      src={data.videoUploadedFile}
                      className="w-32 h-20 object-cover rounded"
                      controls
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Existing Video
                      </p>
                      <a
                        href={data.videoUploadedFile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Video
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ ...data, videoUploadedFile: null })
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    updateField(
                      'videoUploadedFile',
                      e.target.files?.[0] || null,
                    )
                  }
                  className="hidden"
                  id="gis-video-upload"
                />
                <label htmlFor="gis-video-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {data?.videoUploadedFile
                      ? (data.videoUploadedFile as File).name
                      : 'Click to upload video'}
                  </p>
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-200 rounded-lg">
            <FileCheck className="w-4 h-4 text-blue-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Digital Documentation
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Digital As-Built Drawing (ABD) updated for GP
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data?.abdUpdated === 'yes'}
              onChange={(e) =>
                updateField('abdUpdated', e.target.checked ? 'yes' : 'no')
              }
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Yes</span>
          </label>
          {data?.abdUpdated === 'yes' && (
            <div>
              {typeof data?.abdPDF === 'string' && data.abdPDF ? (
                <div className="border border-green-300 rounded-lg p-4 bg-green-50 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Existing ABD PDF
                        </p>
                        <button
                          onClick={() => {
                            setPdfUrl(data.abdPDF as string);
                            setIsPdfModalOpen(true);
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View PDF
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onChange({ ...data, abdPDF: null })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    id="abd-pdf-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange({ ...data, abdPDF: file });
                      }
                    }}
                  />
                  <label htmlFor="abd-pdf-upload" className="cursor-pointer">
                    <FileText className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="text-sm text-gray-600">
                      {data?.abdPDF
                        ? (data.abdPDF as File).name
                        : 'Upload ABD PDF'}
                    </p>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            GIS entry completed with latitude, longitude, route code, and asset
            type
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="gisEntryCompleted"
                value="yes"
                checked={data?.gisEntryCompleted === 'yes'}
                onChange={(e) =>
                  updateField('gisEntryCompleted', e.target.value)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="gisEntryCompleted"
                value="no"
                checked={data?.gisEntryCompleted === 'no'}
                onChange={(e) =>
                  updateField('gisEntryCompleted', e.target.value)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          {data?.gisEntryCompleted === 'yes' && (
            <>
              <ImageCapture
                onCapture={handleGISImagesChange}
                label="Capture Photos"
              />
              <ImagePreview
                images={GISImgages}
                setImages={setGISImages}
                label="Photos"
                fieldName="GISImgages"
              />
            </>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-indigo-50 border border-indigo-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-200 rounded-lg">
            <UserCheck className="w-4 h-4 text-indigo-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Independent Engineer Verification
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Verification by Independent Engineer (IE) completed and signed
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="ieVerification"
                value="yes"
                checked={data?.ieVerification === 'yes'}
                onChange={(e) => updateField('ieVerification', e.target.value)}
                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="ieVerification"
                value="no"
                checked={data?.ieVerification === 'no'}
                onChange={(e) => updateField('ieVerification', e.target.value)}
                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          {data?.ieVerification === 'yes' && (
            <>
              <ImageCapture
                onCapture={handleIEImagesChange}
                label="Capture Photos"
              />
              <ImagePreview
                images={IEimages}
                setImages={setIEImages}
                label="Photos of IE Verification"
                fieldName="IEimages"
              />
            </>
          )}
        </div>
      </div>
      {isPdfModalOpen && pdfUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setIsPdfModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">ABD Document</h3>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe
              src={pdfUrl}
              className="w-full h-[80vh]"
              title="ABD Document"
            />
          </div>
        </div>
      )}
    </div>
  );
}
