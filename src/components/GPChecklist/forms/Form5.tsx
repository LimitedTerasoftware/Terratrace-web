import { Globe, Camera, FileCheck, Map, UserCheck } from 'lucide-react';
import { FormData } from '../../../types/gp-checklist';

interface Form5Props {
  data: FormData['form5'];
  onChange: (data: FormData['form5']) => void;
}

export default function Form5({ data, onChange }: Form5Props) {
  const updateField = (field: string, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

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
              checked={data?.abdUpdated || false}
              onChange={(e) => updateField('abdUpdated', e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Yes</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            GIS entry completed with latitude, longitude, route code, and asset
            type
          </label>
          <div className="flex gap-4">
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
          <div className="flex gap-4">
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
        </div>
      </div>
    </div>
  );
}
