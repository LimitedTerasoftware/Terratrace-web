import { Upload } from 'lucide-react';
import { FormData } from "../../../types/gp-checklist";

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
      <h2 className="text-2xl font-semibold text-gray-900">Equipment Installation</h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Installation Verification</h3>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">Router Image</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="routerImage"
                value="yes"
                checked={data?.routerImage === 'yes'}
                onChange={(e) => updateField('routerImage', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">SNOC Image</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="snocImage"
                value="yes"
                checked={data?.snocImage === 'yes'}
                onChange={(e) => updateField('snocImage', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Equipment Serial & MAC Details
        </label>
        <p className="text-sm text-gray-600 mb-3">Enter details updated in GIS / Inventory</p>
        <div className="space-y-3">
          <input
            type="text"
            value={data?.serialNumber || ''}
            onChange={(e) => updateField('serialNumber', e.target.value)}
            placeholder="Enter Serial Number"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <input
            type="text"
            value={data?.macId || ''}
            onChange={(e) => updateField('macId', e.target.value)}
            placeholder="Enter MAC ID"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          QR Code Tag Verification
        </label>
        <p className="text-sm text-gray-600 mb-3">Select device and upload QR code image</p>
        <div className="space-y-3">
          <select
            value={data?.qrType || ''}
            onChange={(e) => updateField('qrType', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
          >
            <option value="">Select Qr Type</option>
            <option value="router">Router</option>
            <option value="snoc">SNOC</option>
            <option value="antenna">Antenna</option>
            <option value="battery">Battery</option>
          </select>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Upload QR Code Image</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => updateField('qrCodeImage', e.target.files?.[0] || null)}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">Device Ping Image</label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="devicePing"
              value="yes"
              checked={data?.devicePing === 'yes'}
              onChange={(e) => updateField('devicePing', e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">No</span>
          </label>
        </div>
      </div>
    </div>
  );
}
