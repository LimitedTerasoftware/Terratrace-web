import { FormData } from "../../../types/gp-checklist";

interface Form7Props {
  data: FormData['form7'];
  onChange: (data: FormData['form7']) => void;
}

export default function Form7({ data, onChange }: Form7Props) {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Final Acceptance</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            PAT completed and results uploaded
          </label>
          <p className="text-sm text-gray-600 mb-3">PAT Completed Proof</p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="patCompleted"
                value="yes"
                checked={data?.patCompleted === 'yes'}
                onChange={(e) => updateField('patCompleted', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="patCompleted"
                value="no"
                checked={data?.patCompleted === 'no'}
                onChange={(e) => updateField('patCompleted', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            FAT scheduled and approved by IE/BSNL
          </label>
          <p className="text-sm text-gray-600 mb-3">FAT Approval Proof</p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="fatApproved"
                value="yes"
                checked={data?.fatApproved === 'yes'}
                onChange={(e) => updateField('fatApproved', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="fatApproved"
                value="no"
                checked={data?.fatApproved === 'no'}
                onChange={(e) => updateField('fatApproved', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            QR tag verified to link with GIS asset record
          </label>
          <p className="text-sm text-gray-600 mb-3">QR Tag Verification Image</p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="qrTagVerified"
                value="yes"
                checked={data?.qrTagVerified === 'yes'}
                onChange={(e) => updateField('qrTagVerified', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="qrTagVerified"
                value="no"
                checked={data?.qrTagVerified === 'no'}
                onChange={(e) => updateField('qrTagVerified', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            HOTO (Hand Over-Take Over) memo signed
          </label>
          <p className="text-sm text-gray-600 mb-3">Sign Off Handover Ops Team</p>
          <p className="text-sm text-gray-600 mb-3">HOTO Memo Signature Image</p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="hotoSigned"
                value="yes"
                checked={data?.hotoSigned === 'yes'}
                onChange={(e) => updateField('hotoSigned', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="hotoSigned"
                value="no"
                checked={data?.hotoSigned === 'no'}
                onChange={(e) => updateField('hotoSigned', e.target.value)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
