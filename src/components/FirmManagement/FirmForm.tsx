import React, { useState, useEffect } from 'react';
import { Firm, FirmFormData } from '../../types/firm';
import { Edit3, X } from 'lucide-react';

interface FirmFormProps {
  firm?: Firm;
  onSubmit: (data: FirmFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const FirmForm: React.FC<FirmFormProps> = ({
  firm,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<FirmFormData>({
    firm_name: '',
    authorised_person: '',
    authorised_mobile: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FirmFormData, string>>
  >({});

  useEffect(() => {
    if (firm) {
      setFormData({
        firm_name: firm.firm_name,
        authorised_person: firm.authorised_person,
        authorised_mobile: firm.authorised_mobile,
      });
    } else {
      setFormData({
        firm_name: '',
        authorised_person: '',
        authorised_mobile: '',
      });
    }
  }, [firm]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FirmFormData, string>> = {};

    if (!formData.firm_name?.trim())
      newErrors.firm_name = 'Firm name is required';
    if (!formData.authorised_person?.trim())
      newErrors.authorised_person = 'Authorised person is required';
    if (!formData.authorised_mobile?.trim())
      newErrors.authorised_mobile = 'Mobile number is required';
    if (
      formData.authorised_mobile &&
      formData.authorised_mobile.length !== 10
    ) {
      newErrors.authorised_mobile =
        'Please enter a valid 10-digit mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof FirmFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Edit3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Firm' : 'Add New Firm'}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firm Name
            </label>
            <input
              type="text"
              value={formData.firm_name}
              onChange={(e) => handleChange('firm_name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.firm_name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter firm name"
            />
            {errors.firm_name && (
              <p className="mt-1 text-sm text-red-600">{errors.firm_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authorised Person
            </label>
            <input
              type="text"
              value={formData.authorised_person}
              onChange={(e) =>
                handleChange('authorised_person', e.target.value)
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.authorised_person ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter authorised person name"
            />
            {errors.authorised_person && (
              <p className="mt-1 text-sm text-red-600">
                {errors.authorised_person}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authorised Person Mobile Number
            </label>
            <input
              type="text"
              value={formData.authorised_mobile}
              onChange={(e) =>
                handleChange('authorised_mobile', e.target.value)
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.authorised_mobile ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter mobile number"
            />
            {errors.authorised_mobile && (
              <p className="mt-1 text-sm text-red-600">
                {errors.authorised_mobile}
              </p>
            )}
          </div>
        </div>

        {Object.values(errors).filter(Boolean).length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mt-4">
            <p className="text-sm">
              Please enter valid values for all required fields:
            </p>
            <ul className="mt-2 list-disc list-inside text-sm">
              {Object.entries(errors)
                .filter(([_, error]) => error)
                .map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-8 py-3 rounded-lg text-white font-medium transition-all ${
              isEditing
                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isEditing ? 'Update Firm' : 'Add Firm'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FirmForm;
