import { Zap, PanelBottom, Battery, CircleDot } from 'lucide-react';
import { FormData } from '../../../types/gp-checklist';

interface Form4Props {
  data: FormData['form4'];
  onChange: (data: FormData['form4']) => void;
}

export default function Form4({ data, onChange }: Form4Props) {
  const updateField = (field: string, value: string | boolean) => {
    onChange({ ...data, [field]: value });
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
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data?.solarPanelInstalled || false}
              onChange={(e) =>
                updateField('solarPanelInstalled', e.target.checked)
              }
              className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
            />
            <span className="ml-3 text-sm text-gray-700">Yes</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Solar panel installed and functional
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="solarPanelFunctional"
                value="yes"
                checked={data?.solarPanelFunctional === 'yes'}
                onChange={(e) =>
                  updateField('solarPanelFunctional', e.target.value)
                }
                className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="solarPanelFunctional"
                value="no"
                checked={data?.solarPanelFunctional === 'no'}
                onChange={(e) =>
                  updateField('solarPanelFunctional', e.target.value)
                }
                className="w-4 h-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
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
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="batteryBackup"
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
                name="batteryBackup"
                value="no"
                checked={data?.batteryBackup === 'no'}
                onChange={(e) => updateField('batteryBackup', e.target.value)}
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
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
            <option value="grid">Grid Power</option>
            <option value="solar">Solar Power</option>
            <option value="hybrid">Hybrid (Grid + Solar)</option>
            <option value="battery">Battery Only</option>
          </select>
        </div>
      </div>
    </div>
  );
}
