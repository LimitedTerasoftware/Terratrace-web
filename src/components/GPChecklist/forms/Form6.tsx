import { FormData } from "../../../types/gp-checklist";

interface Form6Props {
  data: FormData['form6'];
  onChange: (data: FormData['form6']) => void;
}

export default function Form6({ data, onChange }: Form6Props) {
  const updateField = (field: string, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Safe Quality Verification</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Site clear of loose cables, debris, or obstructions
          </label>
          <select
            value={data?.siteClean || ''}
            onChange={(e) => updateField('siteClean', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
          >
            <option value="">Select</option>
            <option value="yes">Yes - Site is clean</option>
            <option value="no">No - Requires cleanup</option>
            <option value="partial">Partially clean</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            All materials used are BSNL/TEC approved
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data?.materialsApproved || false}
              onChange={(e) => updateField('materialsApproved', e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Yes</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Social audit video (15–30 min) recorded involving local representatives
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
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Site label board installed showing GP name, Block, and BSNL logo
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data?.siteLabelBoard || false}
              onChange={(e) => updateField('siteLabelBoard', e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Yes</span>
          </label>
        </div>
      </div>
    </div>
  );
}
