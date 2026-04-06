import { Globe, Camera, FileCheck, Map, UserCheck, Upload, X, FileText } from 'lucide-react';
import { FormData, GeoTaggedImage } from '../../../types/gp-checklist';
import ImageCapture from './ImageCapture';
import { useState } from 'react';

interface Form5Props {
  data: FormData['form5'] | undefined;
  onChange: (data: FormData['form5'] | undefined) => void;
}

export default function Form5({ data, onChange }: Form5Props) {

   const updateField = (field: string, value: string | File | null) => {
    onChange({ ...data, [field]: value });
  };
 const [photosAngleImages, setPhotosAngleImages] = useState<GeoTaggedImage[]>([]);
 const [GISImgages, setGISImages] = useState<GeoTaggedImage[]>([]);
 const [IEimages, setIEImages] = useState<GeoTaggedImage[]>([]);
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
        <div className="p-3 bg-teal-100 rounded-xl">
          <Globe className="w-6 h-6 text-teal-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">GIS Mapping</h2>
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
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
              <input
                type="file"
                accept="video/*"
                onChange={(e) =>
                  updateField('videoUploadedFile', e.target.files?.[0] || null)
                }
                className="hidden"
                id="gis-video-upload"
              />
              <label htmlFor="gis-video-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {data?.videoUploadedFile
                    ? data.videoUploadedFile.name
                    : 'Click to upload video'}
                </p>
              </label>
            </div>
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
              onChange={(e) => updateField('abdUpdated', e.target.checked ? 'yes' : 'no')}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Yes</span>
          </label>
           {data?.abdUpdated === 'yes' && (
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
            <><ImageCapture
              onCapture={handleGISImagesChange}
              label="Capture Photos" />
              <ImagePreview
                images={GISImgages}
                setImages={setGISImages}
                label="Photos" /></>
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
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
