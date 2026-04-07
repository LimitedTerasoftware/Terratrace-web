import {
  Network,
  Gauge,
  FileText,
  X,
} from 'lucide-react';
import { FormData, GeoTaggedImage } from '../../../types/gp-checklist';
import { useState } from 'react';
import ImageCapture from './ImageCapture';

interface Form2Props {
  data: FormData['form2'] | undefined;
  onChange: (data: FormData['form2'] | undefined) => void;
}

export default function Form2({ data, onChange }: Form2Props) {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };
  const [ofcRouteImages, setOfcRouteImages] = useState<GeoTaggedImage[]>([]);
  const [opticalPowerImages, setOpticalPowerImages] = useState<
    GeoTaggedImage[]
  >([]);
  const [splicingImages, setSplicingImages] = useState<GeoTaggedImage[]>([]);
  const [routeIndicatorImages, setRouteIndicatorImages] = useState<
    GeoTaggedImage[]
  >([]);

  const handleOfcRouteCapture = (image: GeoTaggedImage) => {
    const updated = [...ofcRouteImages, image];
    setOfcRouteImages(updated);
    onChange({ ...data, ofcRouteImages: updated });
  };

  const handleOpticalPowerCapture = (image: GeoTaggedImage) => {
    const updated = [...opticalPowerImages, image];
    setOpticalPowerImages(updated);
    onChange({ ...data, opticalPowerImages: updated });
  };

  const handleSplicingCapture = (image: GeoTaggedImage) => {
    const updated = [...splicingImages, image];
    setSplicingImages(updated);
    onChange({ ...data, splicingImages: updated });
  };

  const handleRouteIndicatorCapture = (image: GeoTaggedImage) => {
    const updated = [...routeIndicatorImages, image];
    setRouteIndicatorImages(updated);
    onChange({ ...data, routeIndicatorImages: updated });
  };

  const removeImage = (
    imageId: string,
    images: GeoTaggedImage[],
    setImages: React.Dispatch<React.SetStateAction<GeoTaggedImage[]>>,
    fieldName:
      | 'ofcRouteImages'
      | 'opticalPowerImages'
      | 'splicingImages'
      | 'routeIndicatorImages',
  ) => {
    const updated = images.filter((img) => img.id !== imageId);
    setImages(updated);
    onChange({ ...data, [fieldName]: updated });
  };

  const ImagePreview = ({
    images,
    setImages,
    fieldName,
    label,
  }: {
    images: GeoTaggedImage[];
    setImages: React.Dispatch<React.SetStateAction<GeoTaggedImage[]>>;
    fieldName:
      | 'ofcRouteImages'
      | 'opticalPowerImages'
      | 'splicingImages'
      | 'routeIndicatorImages';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 rounded-xl">
          <Network className="w-6 h-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          OFC and Connectivity
        </h2>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-green-50 border border-green-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-200 rounded-lg">
            <Gauge className="w-4 h-4 text-green-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Verification Checklist
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            OFC Route Images
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="ofcRouteImages"
                value="yes"
                checked={data?.ofcConnected === 'yes'}
                onChange={(e) => updateField('ofcConnected', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="ofcRouteImages"
                value="no"
                checked={data?.ofcConnected === 'no'}
                onChange={(e) => updateField('ofcConnected', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          <ImageCapture
            onCapture={handleOfcRouteCapture}
            label="Capture OFC Route Image"
            show={data?.ofcConnected === 'yes' || ofcRouteImages.length > 0}
          />
          <ImagePreview
            images={ofcRouteImages}
            setImages={setOfcRouteImages}
            fieldName="ofcRouteImages"
            label="OFC Route"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Optical Power Images
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="opticalPowerImages"
                value="yes"
                checked={data?.opticalPowerConnected === 'yes'}
                onChange={(e) =>
                  updateField('opticalPowerConnected', e.target.value)
                }
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="opticalPowerImages"
                value="no"
                checked={data?.opticalPowerConnected === 'no'}
                onChange={(e) =>
                  updateField('opticalPowerConnected', e.target.value)
                }
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          <ImageCapture
            onCapture={handleOpticalPowerCapture}
            label="Capture Optical Power Image"
            show={
              data?.opticalPowerConnected === 'yes' ||
              opticalPowerImages.length > 0
            }
          />
          <ImagePreview
            images={opticalPowerImages}
            setImages={setOpticalPowerImages}
            fieldName="opticalPowerImages"
            label="Optical Power"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            OTDR PDF
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="otdrPdf"
                value="yes"
                checked={data?.isOtdrReportUploaded === 'yes'}
                onChange={(e) => updateField('isOtdrReportUploaded', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="otdrPdf"
                value="no"
                checked={data?.isOtdrReportUploaded === 'no'}
                onChange={(e) => updateField('isOtdrReportUploaded', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          {data?.isOtdrReportUploaded === 'yes' && (
          <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors cursor-pointer">
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              id="otdr-pdf-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onChange({ ...data, otdrPdf: file });
                }
              }}
            />
            <label htmlFor="otdr-pdf-upload" className="cursor-pointer">
              <FileText className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-sm text-gray-600">
                {data?.otdrPdf
                  ? (data.otdrPdf as File).name
                  : 'Upload OTDR PDF'}
              </p>
            </label>
          </div>
          )}
        </div>
               

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Splicing Images
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="splicingImages"
                value="yes"
                checked={(data?.splicingConnected === 'yes') }
                onChange={(e) => updateField('splicingConnected', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="splicingImages"
                value="no"
                checked={data?.splicingConnected === 'no'}
                onChange={(e) => updateField('splicingConnected', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          <ImageCapture
            onCapture={handleSplicingCapture}
            label="Capture Splicing Image"
            show={data?.splicingConnected === 'yes' || splicingImages.length > 0}
          />
          <ImagePreview
            images={splicingImages}
            setImages={setSplicingImages}
            fieldName="splicingImages"
            label="Splicing"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Route Indicator Images
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="routeIndicatorImages"
                value="yes"
                checked={(data?.routeIndicatorConnected === 'yes') }
                onChange={(e) =>
                  updateField('routeIndicatorConnected', e.target.value)
                }
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="routeIndicatorImages"
                value="no"
                checked={data?.routeIndicatorConnected === 'no'}
                onChange={(e) =>
                  updateField('routeIndicatorConnected', e.target.value)
                }
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          <div className="mt-3">
            <ImageCapture
              onCapture={handleRouteIndicatorCapture}
              label="Capture Route Indicator Image"
              show={
                data?.routeIndicatorConnected === 'yes' ||
                routeIndicatorImages.length > 0
              }
            />
            <ImagePreview
              images={routeIndicatorImages}
              setImages={setRouteIndicatorImages}
              fieldName="routeIndicatorImages"
              label="Route Indicator"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
