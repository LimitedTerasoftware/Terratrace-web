import {
  ClipboardCheck,
  FileCheck,
  QrCode,
  PenTool,
  Upload,
  X,
  Printer,
  Loader2,
} from 'lucide-react';
import { FormData, GeoTaggedImage } from '../../../types/gp-checklist';
import ImageCapture from './ImageCapture';
import { useState, useEffect } from 'react';
import { addImageAttachment, buildPrintPage } from './printUtils';

interface Form7Props {
  data: FormData['form7'] | undefined;
  onChange: (data: FormData['form7'] | undefined) => void;
}

export default function Form7({ data, onChange }: Form7Props) {
  const updateField = (
    field: string,
    value: string | boolean | File | null,
  ) => {
    onChange({ ...data, [field]: value });
  };
  const [hotoSignatureImage, setHotoSignatureImage] = useState<
    GeoTaggedImage[]
  >(data?.hotoMemoSignature || []);

  const [patImgages, setPatImages] = useState<GeoTaggedImage[]>(
    data?.patProof || [],
  );

  const [fatApprovalProof, setFatApprovalProof] = useState<GeoTaggedImage[]>(
    data?.fatApprovalProof || [],
  );

  const [qrTagImages, setQrTagImages] = useState<GeoTaggedImage[]>(
    data?.qrTagImage || [],
  );
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    if (data) {
      if (data.hotoMemoSignature) setHotoSignatureImage(data.hotoMemoSignature);
      if (data.patProof) setPatImages(data.patProof);
      if (data.fatApprovalProof) setFatApprovalProof(data.fatApprovalProof);
      if (data.qrTagImage) setQrTagImages(data.qrTagImage);
    }
  }, [data]);

  const handleFatApprovalProofChange = (images: GeoTaggedImage) => {
    const updated = [...fatApprovalProof, images];
    setFatApprovalProof(updated);
    onChange({ ...data, fatApprovalProof: updated });
  };

  const handlePatProofChange = (images: GeoTaggedImage) => {
    const updated = [...patImgages, images];
    setPatImages(updated);
    onChange({ ...data, patProof: updated });
  };

  const handleHotoSignatureChange = (images: GeoTaggedImage) => {
    const updated = [...hotoSignatureImage, images];
    setHotoSignatureImage(updated);
    onChange({ ...data, hotoMemoSignature: updated });
  };

  const handleQrTagImageChange = (images: GeoTaggedImage) => {
    const updated = [...qrTagImages, images];
    setQrTagImages(updated);
    onChange({ ...data, qrTagImage: updated });
  };

  const removeImage = (
    imageId: string,
    images: GeoTaggedImage[],
    setImages: React.Dispatch<React.SetStateAction<GeoTaggedImage[]>>,
    fieldName:
      | 'patProof'
      | 'fatApprovalProof'
      | 'qrTagImage'
      | 'hotoMemoSignature',
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
    fieldName:
      | 'patProof'
      | 'fatApprovalProof'
      | 'qrTagImage'
      | 'hotoMemoSignature';
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
      .write(`<!DOCTYPE html><html><head><title>GP Checklist - Form 7</title>
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
      'PAT Completion',
      `
      ${addField('PAT Completed', data?.patCompleted)}
      ${data?.patCompleted === 'yes' && patImgages.length > 0 ? `<div class="subsection-title">PAT Proof Images</div>${await addImages(patImgages, 'PAT Proof')}` : ''}
    `,
    );
    addSection(
      'FAT Approval',
      `
      ${addField('FAT Approved', data?.fatApproved)}
      ${data?.fatApproved === 'yes' && fatApprovalProof.length > 0 ? `<div class="subsection-title">FAT Approval Images</div>${await addImages(fatApprovalProof, 'FAT Approval')}` : ''}
    `,
    );
    addSection(
      'QR Tag Verification',
      `
      ${addField('QR Tag Verified', data?.qrTagVerified)}
      ${data?.qrTagVerified === 'yes' && qrTagImages.length > 0 ? `<div class="subsection-title">QR Tag Images</div>${await addImages(qrTagImages, 'QR Tag')}` : ''}
    `,
    );
    addSection(
      'HOTO Memo',
      `
      ${addField('HOTO Signed', data?.hotoSigned)}
      ${data?.hotoSigned === 'yes' && hotoSignatureImage.length > 0 ? `<div class="subsection-title">HOTO Signature Images</div>${await addImages(hotoSignatureImage, 'HOTO Signature')}` : ''}
    `,
    );

    const content = buildPrintPage(
      'GP Checklist — Final Acceptance',
      'Form 7 — Final Acceptance & Handover',
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
        <div className="p-3 bg-emerald-100 rounded-xl">
          <ClipboardCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Final Acceptance
        </h2>
        <div className="ml-auto">
          <button
            onClick={handlePrint}
            disabled={preparing}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium disabled:opacity-50"
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

      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-200 rounded-lg">
            <ClipboardCheck className="w-4 h-4 text-blue-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            PAT Completion
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            PAT completed and results uploaded
          </label>
          <p className="text-sm text-gray-600 mb-3">PAT Completed Proof</p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="patCompleted"
                value="yes"
                checked={data?.patCompleted === 'yes'}
                onChange={(e) => updateField('patCompleted', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="patCompleted"
                value="no"
                checked={data?.patCompleted === 'no'}
                onChange={(e) => updateField('patCompleted', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {data?.patCompleted === 'yes' && (
          <>
            <ImageCapture
              onCapture={handlePatProofChange}
              label="Capture Photos"
            />
            <ImagePreview
              images={patImgages}
              setImages={setPatImages}
              label="Photos of PAT completion proof"
              fieldName="patProof"
            />
          </>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-green-50 border border-green-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-200 rounded-lg">
            <FileCheck className="w-4 h-4 text-green-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">FAT Approval</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            FAT scheduled and approved by IE/BSNL
          </label>
          <p className="text-sm text-gray-600 mb-3">FAT Approval Proof</p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="fatApproved"
                value="yes"
                checked={data?.fatApproved === 'yes'}
                onChange={(e) => updateField('fatApproved', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="fatApproved"
                value="no"
                checked={data?.fatApproved === 'no'}
                onChange={(e) => updateField('fatApproved', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {data?.fatApproved === 'yes' && (
          <>
            <ImageCapture
              onCapture={handleFatApprovalProofChange}
              label="Capture Photos"
            />
            <ImagePreview
              images={fatApprovalProof}
              setImages={setFatApprovalProof}
              label="Photos of FAT approval proof"
              fieldName="fatApprovalProof"
            />
          </>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-orange-50 border border-orange-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-200 rounded-lg">
            <QrCode className="w-4 h-4 text-orange-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            QR Tag Verification
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            QR tag verified to link with GIS asset record
          </label>
          <p className="text-sm text-gray-600 mb-3">
            QR Tag Verification Image
          </p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="qrTagVerified"
                value="yes"
                checked={data?.qrTagVerified === 'yes'}
                onChange={(e) => updateField('qrTagVerified', e.target.value)}
                className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="qrTagVerified"
                value="no"
                checked={data?.qrTagVerified === 'no'}
                onChange={(e) => updateField('qrTagVerified', e.target.value)}
                className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {data?.qrTagVerified === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload QR Tag Verification Image
            </label>
            <ImageCapture
              onCapture={handleQrTagImageChange}
              label="Capture Photos"
            />
            <ImagePreview
              images={qrTagImages}
              setImages={setQrTagImages}
              label="Photos of QR tag verification"
              fieldName="qrTagImage"
            />
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-purple-50 border border-purple-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-200 rounded-lg">
            <PenTool className="w-4 h-4 text-purple-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">HOTO Memo</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            HOTO (Hand Over-Take Over) memo signed
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Sign Off Handover Ops Team
          </p>
          <p className="text-sm text-gray-600 mb-3">
            HOTO Memo Signature Image
          </p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="hotoSigned"
                value="yes"
                checked={data?.hotoSigned === 'yes'}
                onChange={(e) => updateField('hotoSigned', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="hotoSigned"
                value="no"
                checked={data?.hotoSigned === 'no'}
                onChange={(e) => updateField('hotoSigned', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {data?.hotoSigned === 'yes' && (
          <>
            <ImageCapture
              onCapture={handleHotoSignatureChange}
              label="Capture Photos"
            />
            <ImagePreview
              images={hotoSignatureImage}
              setImages={setHotoSignatureImage}
              label="Photos of hoto signature"
              fieldName="hotoMemoSignature"
            />
          </>
        )}
      </div>
    </div>
  );
}
