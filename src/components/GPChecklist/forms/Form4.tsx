import {
  Zap,
  PanelBottom,
  Battery,
  CircleDot,
  Upload,
  X,
  Printer,
  Loader2,
} from 'lucide-react';
import { FormData, GeoTaggedImage } from '../../../types/gp-checklist';
import { useState, useEffect } from 'react';
import ImageCapture from './ImageCapture';
import { addImageAttachment, buildPrintPage } from './printUtils';

interface Form4Props {
  data: FormData['form4'] | undefined;
  onChange: (data: FormData['form4'] | undefined) => void;
}

export default function Form4({ data, onChange }: Form4Props) {
  const updateField = (
    field: string,
    value: string | boolean | File | null,
  ) => {
    onChange({ ...data, [field]: value });
  };
  const [solarImg, setSolarImg] = useState<GeoTaggedImage[]>(
    data?.solarPanelImage || [],
  );
  const [batteryImg, setBatteryImg] = useState<GeoTaggedImage[]>(
    data?.batteryBackupImage || [],
  );
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    if (data) {
      if (data.solarPanelImage) setSolarImg(data.solarPanelImage);
      if (data.batteryBackupImage) setBatteryImg(data.batteryBackupImage);
    }
  }, [data]);

  const handleSolarCapture = (image: GeoTaggedImage) => {
    const updated = [...solarImg, image];
    setSolarImg(updated);
    onChange({ ...data, solarPanelImage: updated });
  };
  const handleBatteryCapture = (image: GeoTaggedImage) => {
    const updated = [...batteryImg, image];
    setBatteryImg(updated);
    onChange({ ...data, batteryBackupImage: updated });
  };
  const removeImage = (
    imageId: string,
    images: GeoTaggedImage[],
    setImages: React.Dispatch<React.SetStateAction<GeoTaggedImage[]>>,
    fieldName: 'solarPanelImage' | 'batteryBackupImage',
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
    fieldName: 'solarPanelImage' | 'batteryBackupImage';
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
      .write(`<!DOCTYPE html><html><head><title>GP Checklist - Form 4</title>
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
      'Solar Panel',
      `
      ${addField('Solar Panel Installed', data?.solarPanelInstalled)}
      ${data?.solarPanelInstalled === 'yes' && solarImg.length > 0 ? `<div class="subsection-title">Images</div>${await addImages(solarImg, 'Solar Panel')}` : ''}
    `,
    );
    addSection(
      'Battery Backup',
      `
      ${addField('Battery Backup', data?.batteryBackup)}
      ${data?.batteryBackup === 'yes' && batteryImg.length > 0 ? `<div class="subsection-title">Images</div>${await addImages(batteryImg, 'Battery Backup')}` : ''}
    `,
    );
    const earthingHtml =
      data?.earthingVerified === 'yes' && data?.earthingVideo
        ? typeof data.earthingVideo === 'string'
          ? `<div class="file-info">🎥 <a href="${data.earthingVideo}" target="_blank">View Earthing Video</a></div>`
          : `<div class="file-info">🎥 ${(data.earthingVideo as File).name}</div>`
        : addField('Earthing Verified', data?.earthingVerified);
    addSection(
      'Earthing Verification',
      `
      ${earthingHtml}
      ${addField('Power Source', data?.powerSource)}
    `,
    );

    const content = buildPrintPage(
      'GP Checklist — Power & Earthing',
      'Form 4 — Power Source & Earthing Verification',
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
        <div className="p-3 bg-yellow-100 rounded-xl">
          <Zap className="w-6 h-6 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Power & Earthing
        </h2>
        <div className="ml-auto">
          <button
            onClick={handlePrint}
            disabled={preparing}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-yellow-200 text-yellow-700 rounded-lg hover:bg-yellow-50 transition-colors text-sm font-medium disabled:opacity-50"
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

      <div className="bg-gradient-to-br from-gray-50 to-yellow-50 border border-yellow-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-yellow-200 rounded-lg">
            <PanelBottom className="w-4 h-4 text-yellow-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Solar Panel</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Solar panel installed and functional
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="solarPanelImage"
                value="yes"
                checked={data?.solarPanelInstalled === 'yes'}
                onChange={(e) =>
                  updateField('solarPanelInstalled', e.target.value)
                }
                className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="solarPanelImage"
                value="no"
                checked={data?.solarPanelInstalled === 'no'}
                onChange={(e) =>
                  updateField('solarPanelInstalled', e.target.value)
                }
                className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          {data?.solarPanelInstalled === 'yes' && (
            <>
              <ImageCapture
                onCapture={handleSolarCapture}
                label="Capture Solar Panel Image"
              />
              <ImagePreview
                images={solarImg}
                setImages={setSolarImg}
                label="Solar Panel"
                fieldName="solarPanelImage"
              />
            </>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-green-50 border border-green-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-200 rounded-lg">
            <Battery className="w-4 h-4 text-green-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Battery Backup
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Battery backup installed, charged
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="batteryBackupImage"
                value="yes"
                checked={data?.batteryBackup === 'yes'}
                onChange={(e) => updateField('batteryBackup', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="batteryBackupImage"
                value="no"
                checked={data?.batteryBackup === 'no'}
                onChange={(e) => updateField('batteryBackup', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          {data?.batteryBackup === 'yes' && (
            <>
              <ImageCapture
                onCapture={handleBatteryCapture}
                label="Capture Battery Backup Image"
              />
              <ImagePreview
                images={batteryImg}
                setImages={setBatteryImg}
                label="Battery Backup"
                fieldName="batteryBackupImage"
              />
            </>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-red-50 border border-red-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-200 rounded-lg">
            <CircleDot className="w-4 h-4 text-red-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Earthing Verification
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Proper earthing resistance verified (Upload 2 min video)
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="earthingVerified"
                value="yes"
                checked={data?.earthingVerified === 'yes'}
                onChange={(e) =>
                  updateField('earthingVerified', e.target.value)
                }
                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="earthingVerified"
                value="no"
                checked={data?.earthingVerified === 'no'}
                onChange={(e) =>
                  updateField('earthingVerified', e.target.value)
                }
                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Power Source Details
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Enter power source (Grid / Solar) details updated in GIS
          </p>
          <select
            value={data?.powerSource || ''}
            onChange={(e) => updateField('powerSource', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white"
          >
            <option value="">Select Power Source</option>
            <option value="Grid">Grid</option>
            <option value="Solar">Solar</option>
          </select>
        </div>

        {data?.earthingVerified === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Earthing Verification Video (2 min)
            </label>
            {typeof data?.earthingVideo === 'string' && data.earthingVideo ? (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <video
                      src={data.earthingVideo}
                      className="w-32 h-20 object-cover rounded"
                      controls
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Existing Video
                      </p>
                      <a
                        href={data.earthingVideo}
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
                    onClick={() => onChange({ ...data, earthingVideo: null })}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) =>
                    updateField('earthingVideo', e.target.files?.[0] || null)
                  }
                  className="hidden"
                  id="earthing-video-upload"
                />
                <label
                  htmlFor="earthing-video-upload"
                  className="cursor-pointer"
                >
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    {data?.earthingVideo
                      ? (data.earthingVideo as File).name
                      : 'Click to upload video'}
                  </p>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
