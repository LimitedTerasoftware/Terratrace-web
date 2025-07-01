import React, { useState, useEffect } from 'react';
import { Machine, MachineFormData } from '../../types/machine';
import { Plus, Edit3, X } from 'lucide-react';

interface MachineFormProps {
  machine?: Machine;
  onSubmit: (data: MachineFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const MachineForm: React.FC<MachineFormProps> = ({
  machine,
  onSubmit,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<MachineFormData>({
    serial_number: '',
    contractor_name: '',
    registration_number: '',
    model: '',
    manufacturer: '',
    year_of_manufacture: new Date().getFullYear(),
    gps_tracker_id: '',
    status: 'active',
    assigned_project: '',
  });

  const [errors, setErrors] = useState<Partial<MachineFormData>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (machine) {
      setFormData({
        serial_number: machine.serial_number,
        contractor_name: machine.contractor_name,
        registration_number: machine.registration_number,
        model: machine.model,
        manufacturer: machine.manufacturer,
        year_of_manufacture: machine.year_of_manufacture,
        gps_tracker_id: machine.gps_tracker_id,
        status: machine.status,
        assigned_project: machine.assigned_project,
      });
    }
  }, [machine]);

  const validateForm = (): boolean => {
    const newErrors: Partial<MachineFormData> = {};

    if (!formData.serial_number.trim()) newErrors.serial_number = 'Serial number is required';
    if (!formData.contractor_name.trim()) newErrors.contractor_name = 'Contractor name is required';
    if (!formData.registration_number.trim()) newErrors.registration_number = 'Registration number is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    if (!formData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.gps_tracker_id.trim()) newErrors.gps_tracker_id = 'GPS tracker ID is required';
    if (!formData.assigned_project.trim()) newErrors.assigned_project = 'Assigned project is required';

    if (formData.year_of_manufacture < 1900 || formData.year_of_manufacture > new Date().getFullYear() + 1) {
      newErrors.year_of_manufacture = 'Please enter a valid year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      if (!isEditing) {
        setFormData({
          serial_number: '',
          contractor_name: '',
          registration_number: '',
          model: '',
          manufacturer: '',
          year_of_manufacture: new Date().getFullYear(),
          gps_tracker_id: '',
          status: 'active',
          assigned_project: '',
        });
      }
    }
  };

  const handleChange = (field: keyof MachineFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
     <>
     
    <div className="flex justify-end w-full -mt-10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="-mt-10 p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <div className="flex items-center">
          {isEditing ? (
            <Edit3 className="w-6 h-6 text-blue-600" />
          ) : (
            <Plus className="w-6 h-6 text-green-600" />
          )}
          <h2 className="text-xl font-semibold text-gray-900 ml-2">
            {isEditing ? 'Edit Machine' : 'Add New Machine'}
          </h2>
        </div>
      </button>
    </div>

      
      {isExpanded  || isEditing && (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <Edit3 className="w-6 h-6 text-blue-600" />
            ) : (
              <Plus className="w-6 h-6 text-green-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Machine' : 'Add New Machine'}
            </h2>
          </div>
          {isEditing && (
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Serial Number
              </label>
              <input
                type="text"
                value={formData.serial_number}
                onChange={(e) => handleChange('serial_number', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.serial_number ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="e.g., SN-XYZ-1001" />
              {errors.serial_number && (
                <p className="mt-1 text-sm text-red-600">{errors.serial_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contractor Name
              </label>
              <input
                type="text"
                value={formData.contractor_name}
                onChange={(e) => handleChange('contractor_name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.contractor_name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="e.g., Alpha Constructions" />
              {errors.contractor_name && (
                <p className="mt-1 text-sm text-red-600">{errors.contractor_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={(e) => handleChange('registration_number', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.registration_number ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="e.g., REG-2024-001" />
              {errors.registration_number && (
                <p className="mt-1 text-sm text-red-600">{errors.registration_number}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleChange('model', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.model ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="e.g., HDD-X900" />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600">{errors.model}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => handleChange('manufacturer', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.manufacturer ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="e.g., Vermeer" />
              {errors.manufacturer && (
                <p className="mt-1 text-sm text-red-600">{errors.manufacturer}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year of Manufacture
              </label>
              <input
                type="number"
                value={formData.year_of_manufacture}
                onChange={(e) => handleChange('year_of_manufacture', parseInt(e.target.value))}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.year_of_manufacture ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="2021"
                min="1900"
                max={new Date().getFullYear() + 1} />
              {errors.year_of_manufacture && (
                <p className="mt-1 text-sm text-red-600">{errors.year_of_manufacture}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GPS Tracker ID
              </label>
              <input
                type="text"
                value={formData.gps_tracker_id}
                onChange={(e) => handleChange('gps_tracker_id', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.gps_tracker_id ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="e.g., GPS12345678" />
              {errors.gps_tracker_id && (
                <p className="mt-1 text-sm text-red-600">{errors.gps_tracker_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value as Machine['status'])}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Project
            </label>
            <input
              type="text"
              value={formData.assigned_project}
              onChange={(e) => handleChange('assigned_project', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.assigned_project ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="e.g., Fiber Line North Zone" />
            {errors.assigned_project && (
              <p className="mt-1 text-sm text-red-600">{errors.assigned_project}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            {isEditing && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className={`px-8 py-3 rounded-lg text-white font-medium transition-all ${isEditing
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                  : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'}`}
            >
              {isEditing ? 'Update Machine' : 'Add Machine'}
            </button>
          </div>
        </form>
      </div>
      )}</>
  );
};

export default MachineForm;