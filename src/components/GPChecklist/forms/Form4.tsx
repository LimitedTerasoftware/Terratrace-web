import { FormData } from "../../../types/gp-checklist";

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
      <h2 className="text-2xl font-semibold text-gray-900">Power & Earthing</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Solar panel installed and functional
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data?.solarPanelInstalled || false}
              onChange={(e) => updateField('solarPanelInstalled', e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                onChange={(e) => updateField('solarPanelFunctional', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="solarPanelFunctional"
                value="no"
                checked={data?.solarPanelFunctional === 'no'}
                onChange={(e) => updateField('solarPanelFunctional', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
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
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
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
                onChange={(e) => updateField('earthingVerified', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="earthingVerified"
                value="no"
                checked={data?.earthingVerified === 'no'}
                onChange={(e) => updateField('earthingVerified', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Power Source Details
          </label>
          <p className="text-sm text-gray-600 mb-3">Enter power source (Grid / Solar) details updated in GIS</p>
          <select
            value={data?.powerSource || ''}
            onChange={(e) => updateField('powerSource', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
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
