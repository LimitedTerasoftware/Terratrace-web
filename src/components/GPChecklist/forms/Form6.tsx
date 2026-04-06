import {
  ShieldCheck,
  CheckCircle,
  ClipboardList,
  Tag,
  Upload,
  X,
  FileText,
} from 'lucide-react';
import { FormData, GeoTaggedImage } from '../../../types/gp-checklist';
import { useState } from 'react';
import ImageCapture from './ImageCapture';

interface Form6Props {
  data: FormData['form6'] | undefined;
  onChange: (data: FormData['form6'] | undefined) => void;
}

export default function Form6({ data, onChange }: Form6Props) {
  const updateField = (
    field: string,
    value: string | boolean | File | null,
  ) => {
    onChange({ ...data, [field]: value });
  };
 const [materialImages, setMaterialImages] = useState<GeoTaggedImage[]>(data?.materialImgages || []);
 const [siteLabelBoardImages, setSiteLabelBoardImages] = useState<GeoTaggedImage[]>(data?.siteLabelBoardImage || []);
  const handlematerialImageUpload = (image: GeoTaggedImage) => {
    const updated = [...materialImages, image];
    setMaterialImages(updated);
    onChange({ ...data, materialImgages: updated });
  };

  const handleSiteLabelBoardImageUpload = (image: GeoTaggedImage) => {
    const updated = [...siteLabelBoardImages, image];
    setSiteLabelBoardImages(updated);
    onChange({ ...data, siteLabelBoardImage: updated });
  }

  
   const removeImage = (
    imageId: string,
    images: GeoTaggedImage[],
    setImages: React.Dispatch<React.SetStateAction<GeoTaggedImage[]>>,
  ) => {
    const updated = images.filter((img) => img.id !== imageId);
    setImages(updated);
  };

   const ImagePreview = ({
    images,
    setImages,
    label,
  }: {
    images: GeoTaggedImage[];
    setImages: React.Dispatch<React.SetStateAction<GeoTaggedImage[]>>;
    label: string;
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
                onClick={() => removeImage(img.id, images, setImages)}
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


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Safe Quality Verification
        </h2>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-green-50 border border-green-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Site Cleanliness
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Site clear of loose cables, debris, or obstructions
          </label>
          <select
            value={data?.siteClean || ''}
            onChange={(e) => updateField('siteClean', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-white"
          >
            <option value="">Select</option>
            <option value="Loose cables">Loose cables</option>
            <option value="Debris">Debris</option>
            <option value="Obstructions">Obstructions</option>
          </select>
        </div>
            <>
             <ImageCapture
                          onCapture={handlematerialImageUpload}
                          label="Capture Photos"
               />
              <ImagePreview
                        images={materialImages}
                        setImages={setMaterialImages}
                        label="Photos of materials used"
              /></>
          

      </div>

      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-200 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Materials Verification
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            All materials used are BSNL/TEC approved
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data?.materialsApproved === 'yes'}
              onChange={(e) =>
                updateField('materialsApproved', e.target.checked ? 'yes' : 'no')
              }
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Yes</span>
          </label><br/>
           {data?.materialsApproved === 'yes' && (
          <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              id="verification-proof-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange({ ...data, verificationProof: file });
                }
              }}
            />
            <label htmlFor="verification-proof-upload" className="cursor-pointer">
              <FileText className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">
                {data?.verificationProof
                  ? (data.verificationProof as File).name
                  : 'Upload Verification Proof (PDF)'}
              </p>
            </label>
          </div>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-purple-50 border border-purple-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-200 rounded-lg">
            <ClipboardList className="w-4 h-4 text-purple-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Social Audit</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Social audit video (15–30 min) recorded involving local
            representatives
          </label>
          <p className="text-sm text-gray-600 mb-3">Social Audit</p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="socialAudit"
                value="yes"
                checked={data?.socialAudit === 'yes'}
                onChange={(e) => updateField('socialAudit', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="socialAudit"
                value="no"
                checked={data?.socialAudit === 'no'}
                onChange={(e) => updateField('socialAudit', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {data?.socialAudit === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload Social Audit Video (15-30 min)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={(e) =>
                  updateField('socialAuditVideo', e.target.files?.[0] || null)
                }
                className="hidden"
                id="social-audit-video-upload"
              />
              <label
                htmlFor="social-audit-video-upload"
                className="cursor-pointer"
              >
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {data?.socialAuditVideo
                    ? data.socialAuditVideo.name
                    : 'Click to upload video'}
                </p>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-orange-50 border border-orange-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-200 rounded-lg">
            <Tag className="w-4 h-4 text-orange-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Site Label Board
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Site label board installed showing GP name, Block, and BSNL logo
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data?.siteLabelBoard === 'yes'}
              onChange={(e) => updateField('siteLabelBoard', e.target.checked ? 'yes' : 'no')}
              className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="ml-3 text-sm text-gray-700">Yes</span>
          </label>
        </div>
        {data?.siteLabelBoard === 'yes' && (
          <>
              <ImageCapture
                onCapture={handleSiteLabelBoardImageUpload}
                label="Capture Photos"
              />
              <ImagePreview
                images={siteLabelBoardImages}
                setImages={setSiteLabelBoardImages}
                label="Photos of site label board"
              />
          </>
        )}


      </div>
    </div>
  );
}
