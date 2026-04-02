import { Upload, Wrench, Router, QrCode, Wifi } from 'lucide-react';
import { FormData } from '../../../types/gp-checklist';

interface Form3Props {
  data: FormData['form3'];
  onChange: (data: FormData['form3']) => void;
}

export default function Form3({ data, onChange }: Form3Props) {
  const updateField = (field: string, value: string | File | null) => {
    onChange({ ...data, [field]: value });
  };

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
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="routerImage"
                value="yes"
                checked={data?.routerImage === 'yes'}
                onChange={(e) => updateField('routerImage', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="routerImage"
                value="no"
                checked={data?.routerImage === 'no'}
                onChange={(e) => updateField('routerImage', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            SNOC Image
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="snocImage"
                value="yes"
                checked={data?.snocImage === 'yes'}
                onChange={(e) => updateField('snocImage', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="snocImage"
                value="no"
                checked={data?.snocImage === 'no'}
                onChange={(e) => updateField('snocImage', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
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
            <option value="router">Router</option>
            <option value="snoc">SNOC</option>
            <option value="antenna">Antenna</option>
            <option value="battery">Battery</option>
          </select>

          <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-orange-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Upload QR Code Image</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                updateField('qrCodeImage', e.target.files?.[0] || null)
              }
              className="hidden"
            />
          </div>
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
      </div>
    </div>
  );
}
