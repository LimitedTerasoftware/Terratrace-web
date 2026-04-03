import {
  ClipboardCheck,
  FileCheck,
  QrCode,
  PenTool,
  Upload,
} from 'lucide-react';
import { FormData } from '../../../types/gp-checklist';
import ImageCapture from './ImageCapture';

interface Form7Props {
  data: FormData['form7'] | undefined;
  onChange: (data: FormData['form7'] | undefined) => void;
}

export default function Form7({ data, onChange }: Form7Props) {
  const updateField = (
    field: string,
    value: string | File | null | FormData['form7']['qrTagImage'],
  ) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-emerald-100 rounded-xl">
          <ClipboardCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          Final Acceptance
        </h2>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-200 rounded-lg">
            <ClipboardCheck className="w-4 h-4 text-blue-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            PAT Completion
          </h3>
        </div>

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

        {data?.patCompleted === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload PAT Proof
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  updateField('patProof', e.target.files?.[0] || null)
                }
                className="hidden"
                id="pat-proof-upload"
              />
              <label htmlFor="pat-proof-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {data?.patProof
                    ? data.patProof.name
                    : 'Click to upload PAT proof'}
                </p>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-green-50 border border-green-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-200 rounded-lg">
            <FileCheck className="w-4 h-4 text-green-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">FAT Approval</h3>
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
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
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
                className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {data?.fatApproved === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload FAT Approval Proof
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  updateField('fatApprovalProof', e.target.files?.[0] || null)
                }
                className="hidden"
                id="fat-proof-upload"
              />
              <label htmlFor="fat-proof-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {data?.fatApprovalProof
                    ? data.fatApprovalProof.name
                    : 'Click to upload FAT proof'}
                </p>
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-orange-50 border border-orange-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-200 rounded-lg">
            <QrCode className="w-4 h-4 text-orange-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            QR Tag Verification
          </h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            QR tag verified to link with GIS asset record
          </label>
          <p className="text-sm text-gray-600 mb-3">
            QR Tag Verification Image
          </p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="qrTagVerified"
                value="yes"
                checked={data?.qrTagVerified === 'yes'}
                onChange={(e) => updateField('qrTagVerified', e.target.value)}
                className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
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
                className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {data?.qrTagVerified === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload QR Tag Verification Image
            </label>
            <ImageCapture
              images={data?.qrTagImage || []}
              onChange={(imgs) => updateField('qrTagImage', imgs)}
              maxImages={1}
            />
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-purple-50 border border-purple-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-200 rounded-lg">
            <PenTool className="w-4 h-4 text-purple-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">HOTO Memo</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            HOTO (Hand Over-Take Over) memo signed
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Sign Off Handover Ops Team
          </p>
          <p className="text-sm text-gray-600 mb-3">
            HOTO Memo Signature Image
          </p>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="hotoSigned"
                value="yes"
                checked={data?.hotoSigned === 'yes'}
                onChange={(e) => updateField('hotoSigned', e.target.value)}
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
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
                className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
        </div>

        {data?.hotoSigned === 'yes' && (
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Upload HOTO Memo Signature
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) =>
                  updateField('hotoMemoSignature', e.target.files?.[0] || null)
                }
                className="hidden"
                id="hoto-signature-upload"
              />
              <label htmlFor="hoto-signature-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {data?.hotoMemoSignature
                    ? data.hotoMemoSignature.name
                    : 'Click to upload signature'}
                </p>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
