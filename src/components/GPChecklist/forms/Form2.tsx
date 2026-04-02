import { Upload } from 'lucide-react';
import { FormData } from '../../../types/gp-checklist';

interface Form2Props {
  data: FormData['form2'];
  onChange: (data: FormData['form2']) => void;
}

export default function Form2({ data, onChange }: Form2Props) {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">
        OFC and Connectivity
      </h2>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-medium text-gray-900">
          Verification Checklist
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            OFC Route Images
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="ofcRouteImages"
                value="yes"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="ofcRouteImages"
                value="no"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Upload OFC Route Images</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Optical Power Images
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="opticalPowerImages"
                value="yes"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="opticalPowerImages"
                value="no"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Upload Optical Power Images</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            OTDR PDF
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="otdrPdf"
                value="yes"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="otdrPdf"
                value="no"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Upload OTDR PDF</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Splicing Images
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="splicingImages"
                value="yes"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="splicingImages"
                value="no"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">No</span>
            </label>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Upload Splicing Images</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Route Indicator Images
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="routeIndicatorImages"
                value="yes"
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="routeIndicatorImages"
                value="no"
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
