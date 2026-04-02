import { ShieldCheck, CheckCircle, ClipboardList, Tag } from 'lucide-react';
import { FormData } from '../../../types/gp-checklist';

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
            <option value="yes">Yes - Site is clean</option>
            <option value="no">No - Requires cleanup</option>
            <option value="partial">Partially clean</option>
          </select>
        </div>
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
              checked={data?.materialsApproved || false}
              onChange={(e) =>
                updateField('materialsApproved', e.target.checked)
              }
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700">Yes</span>
          </label>
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
              checked={data?.siteLabelBoard || false}
              onChange={(e) => updateField('siteLabelBoard', e.target.checked)}
              className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="ml-3 text-sm text-gray-700">Yes</span>
          </label>
        </div>
      </div>
    </div>
  );
}
