import { Wrench, Router, QrCode, Wifi, X } from 'lucide-react';
import { FormData, GeoTaggedImage } from '../../../types/gp-checklist';
import { useState } from 'react';
import ImageCapture from './ImageCapture';

interface Form3Props {
  data: FormData['form3'] | undefined;
  onChange: (data: FormData['form3'] | undefined) => void;
}

export default function Form3({ data, onChange }: Form3Props) {
  const updateField = (field: string, value: string | File | null) => {
    onChange({ ...data, [field]: value });
  };

  const [routerImages, setRouterImages] = useState<GeoTaggedImage[]>([]);
  const [snocImages, setSnocImages] = useState<GeoTaggedImage[]>([]);
  const [qrCodeImages, setQrCodeImages] = useState<GeoTaggedImage[]>([]);
  const [pingProofImages, setPingProofImages] = useState<GeoTaggedImage[]>([]);

  const handleRouterCapture = (image: GeoTaggedImage) => {
    const updated = [...routerImages, image];
    setRouterImages(updated);
    onChange({ ...data, routerImage: updated });
  };

  const handleSnocCapture = (image: GeoTaggedImage) => {
    const updated = [...snocImages, image];
    setSnocImages(updated);
    onChange({ ...data, snocImage: updated });
  };

  const handleQrCodeCapture = (image: GeoTaggedImage) => {
    const updated = [...qrCodeImages, image];
    setQrCodeImages(updated);
    onChange({ ...data, qrCodeImage: updated });
  };
  const handlePingProofCapture= (image: GeoTaggedImage) => {
    const updated = [...(data?.pingProofImg || []), image];
    setPingProofImages(updated);
    onChange({ ...data, pingProofImg: updated });
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
        <div className="p-3 bg-purple-100 rounded-xl">
          <Wrench className="w-6 h-6 text-purple-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Equipment Installation
        </h2>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-purple-50 border border-purple-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-200 rounded-lg">
            <Router className="w-4 h-4 text-purple-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Installation Verification
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Router Image
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="routerImage"
                value="yes"
                checked={data?.routerConnected as string === 'yes'}
                onChange={(e) => updateField('routerConnected', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="routerImage"
                value="no"
                checked={data?.routerConnected as string === 'no'}
                onChange={(e) => updateField('routerConnected', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          {data?.routerConnected as string === 'yes' && (
            <ImageCapture
              onCapture={handleRouterCapture}
              label="Capture Router Image"
            />
          )}
          <ImagePreview
            images={routerImages}
            setImages={setRouterImages}
            label="Router"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            SNOC Image
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="snocImage"
                value="yes"
                checked={data?.snocImageConnected as string === 'yes'}
                onChange={(e) => updateField('snocImageConnected', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="snocImage"
                value="no"
                checked={data?.snocImageConnected as string === 'no'}
                onChange={(e) => updateField('snocImageConnected', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          {data?.snocImageConnected as string === 'yes' && (
            <ImageCapture
              onCapture={handleSnocCapture}
              label="Capture SNOC Image"
            />
          )}
          <ImagePreview
            images={snocImages}
            setImages={setSnocImages}
            label="SNOC"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-indigo-50 border border-indigo-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-200 rounded-lg">
            <Wrench className="w-4 h-4 text-indigo-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Equipment Serial & MAC Details
          </h3>
        </div>
        <p className="text-sm text-gray-600 ml-7">
          Enter details updated in GIS / Inventory
        </p>
        <div className="space-y-3">
          <input
            type="text"
            value={data?.serialNumber || ''}
            onChange={(e) => updateField('serialNumber', e.target.value)}
            placeholder="Enter Serial Number"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <input
            type="text"
            value={data?.macId || ''}
            onChange={(e) => updateField('macId', e.target.value)}
            placeholder="Enter MAC ID"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-orange-50 border border-orange-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-200 rounded-lg">
            <QrCode className="w-4 h-4 text-orange-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            QR Code Tag Verification
          </h3>
        </div>
        <p className="text-sm text-gray-600 ml-7">
          Select device and upload QR code image
        </p>
        <div className="space-y-3">
          <select
            value={data?.qrType || ''}
            onChange={(e) => updateField('qrType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
          >
            <option value="">Select Qr Type</option>
            <option value="ONT">ONT</option>
            <option value="Enclosure">Enclosure</option>
            <option value="Solar Panel">Solar Panel</option>
            <option value="Battery">Battery</option>
          </select>

          <ImageCapture
            onCapture={handleQrCodeCapture}
            label="Capture QR Code Image"
          />
          <ImagePreview
            images={qrCodeImages}
            setImages={setQrCodeImages}
            label="QR Code"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-cyan-50 border border-cyan-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-200 rounded-lg">
            <Wifi className="w-4 h-4 text-cyan-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Device Ping Image
          </h3>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="devicePing"
              value="yes"
              checked={data?.devicePing === 'yes'}
              onChange={(e) => updateField('devicePing', e.target.value)}
              className="w-4 h-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"
            />
            <span className="ml-2 text-sm text-gray-700">Yes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="devicePing"
              value="no"
              checked={data?.devicePing === 'no'}
              onChange={(e) => updateField('devicePing', e.target.value)}
              className="w-4 h-4 text-cyan-600 border-gray-300 focus:ring-cyan-500"
            />
            <span className="ml-2 text-sm text-gray-700">No</span>
          </label>
        </div>
        {data?.devicePing === 'yes' && (
          <div className="mt-4">
            <ImageCapture
              onCapture={handlePingProofCapture}
              label="Capture Ping Proof Image"
            />
            <ImagePreview
              images={pingProofImages}
              setImages={setPingProofImages}
              label="Ping Proof"
            />
          </div>
        )}
      </div>
    </div>
  );
}
