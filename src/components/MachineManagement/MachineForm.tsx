import React, { useState, useEffect } from 'react';
import { Machine, MachineFormData } from '../../types/machine';
import { Edit3, X } from 'lucide-react';

interface MachineFormProps {
  machine?: Machine;
  onSubmit: (data: MachineFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

const MachineForm: React.FC<MachineFormProps> = ({
  machine,
  onSubmit,
  onCancel,
  isEditing = false,
  isExpanded = false,
  onExpandChange,
}) => {
  const [formData, setFormData] = useState<MachineFormData>({
    firm_name: "",
    authorised_person: "",
    machine_make: "",
    capacity: "",
    no_of_rods: 0,
    digitrack_make: "",
    digitrack_model: "",
    truck_make: "",
    truck_model: "",
    registration_number: "",
    registration_valid_upto: new Date(),
    driver_batch_no: "",
    driver_valid_upto: new Date(),
    serial_number: "",
    year_of_manufacture: new Date().getFullYear(),
    status: 'active',
    machine_id: '',
    supervisor_name: '',
    supervisor_email: "",
    supervisor_phone: '',
    author_phone: ""
  });

  const [errors, setErrors] = useState<Partial<Record<keyof MachineFormData, string>>>({});

  // Use onExpandChange when needed
  const handleExpandToggle = () => {
    if (onExpandChange) {
      onExpandChange(!isExpanded);
    }
  };

  useEffect(() => {
    if (machine) {
      setFormData({
        firm_name: machine.firm_name,
        authorised_person: machine.authorised_person,
        machine_make: machine.machine_make,
        capacity: machine.capacity,
        no_of_rods: machine.no_of_rods,
        digitrack_make: machine.digitrack_make,
        digitrack_model: machine.digitrack_model,
        truck_make: machine.truck_make,
        truck_model: machine.truck_model,
        registration_number: machine.registration_number,
        registration_valid_upto: machine.registration_valid_upto,
        driver_batch_no: machine.driver_batch_no,
        driver_valid_upto: machine.driver_valid_upto,
        serial_number: machine.serial_number,
        year_of_manufacture: machine.year_of_manufacture,
        status: machine.status,
        machine_id: '',
        supervisor_name: machine.supervisor_name,
        supervisor_email: machine.supervisor_email,
        supervisor_phone: machine.supervisor_phone,
        author_phone: machine.author_phone
      });
    } else {
      // Reset form when not editing and no machine provided
      setFormData({
        firm_name: "",
        authorised_person: "",
        machine_make: "",
        capacity: "",
        no_of_rods: 0,
        digitrack_make: "",
        digitrack_model: "",
        truck_make: "",
        truck_model: "",
        registration_number: "",
        registration_valid_upto: new Date(),
        driver_batch_no: "",
        driver_valid_upto: new Date(),
        serial_number: "",
        year_of_manufacture: new Date().getFullYear(),
        status: 'active',
        machine_id: '',
        supervisor_name: '',
        supervisor_email: "",
        supervisor_phone: '',
        author_phone: ""
      });
    }
  }, [machine]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MachineFormData, string>> = {};

    if (!formData.serial_number.trim()) newErrors.serial_number = 'Serial number is required';
    if (!formData.author_phone.trim()) newErrors.author_phone = 'Authorised person number is required';
    if ((formData.author_phone).length < 10) newErrors.author_phone = 'Please enter a valid mobile number with 10 digits';
    if (formData.supervisor_phone && (formData.supervisor_phone).length < 10) newErrors.supervisor_phone = 'Please enter a valid mobile number with 10 digits';
    if (!formData.firm_name.trim()) newErrors.firm_name = 'Firm name is required';
    if (!formData.authorised_person.trim()) newErrors.authorised_person = 'Authorised person is required';
    if (!formData.registration_number.trim()) newErrors.registration_number = 'Registration number is required';
    if (formData.supervisor_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supervisor_email)) {
      newErrors.supervisor_email = 'Please enter a valid email address';
    }

    // Fixed: Ensure year_of_manufacture is a number and validate properly
    const currentYear = new Date().getFullYear();
    const year = Number(formData.year_of_manufacture);
    
    if (isNaN(year) || year < 1900 || year > currentYear + 1) {
      newErrors.year_of_manufacture = 'Please enter a valid year';
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

  const handleChange = (field: keyof MachineFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Show form when expanded OR editing
  if (!isExpanded && !isEditing) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Edit3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Machine' : 'Add New Machine'}
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
              Serial Number
            </label>
            <input
              type="text"
              value={formData.serial_number}
              onChange={(e) => handleChange('serial_number', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.serial_number ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter serial number" />
            {errors.serial_number && (
              <p className="mt-1 text-sm text-red-600">{errors.serial_number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Firm Name
            </label>
            <input
              type="text"
              value={formData.firm_name}
              onChange={(e) => handleChange('firm_name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.firm_name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter firm name" />
            {errors.firm_name && (
              <p className="mt-1 text-sm text-red-600">{errors.firm_name}</p>
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
              placeholder="Enter registration number" />
            {errors.registration_number && (
              <p className="mt-1 text-sm text-red-600">{errors.registration_number}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Valid Upto
            </label>
            <input
              type="date"
              value={
                formData.registration_valid_upto
                  ? new Date(formData.registration_valid_upto).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => handleChange('registration_valid_upto', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter registration_valid_upto" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authorised Person
            </label>
            <input
              type="text"
              value={formData.authorised_person}
              onChange={(e) => handleChange('authorised_person', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.authorised_person ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter authorised person name" />
            {errors.authorised_person && (
              <p className="mt-1 text-sm text-red-600">{errors.authorised_person}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authorised Person Mobile Number
            </label>
            <input
              type="text"
              value={formData.author_phone}
              onChange={(e) => handleChange('author_phone', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.author_phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter authorised person mobile number" />
            {errors.author_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.author_phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supervisor Name
            </label>
            <input
              type="text"
              value={formData.supervisor_name}
              onChange={(e) => handleChange('supervisor_name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter supervisor name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supervisor Mobile Number
            </label>
            <input
              type="text"
              value={formData.supervisor_phone}
              onChange={(e) => handleChange('supervisor_phone', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.supervisor_phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter supervisor mobile number" />
            {errors.supervisor_phone && (
              <p className="mt-1 text-sm text-red-600">{errors.supervisor_phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supervisor Email
            </label>
            <input
              type="email"
              value={formData.supervisor_email}
              onChange={(e) => handleChange('supervisor_email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.supervisor_email ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter supervisor email" />
            {errors.supervisor_email && (
              <p className="mt-1 text-sm text-red-600">{errors.supervisor_email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Machine Make
            </label>
            <input
              type="text"
              value={formData.machine_make}
              onChange={(e) => handleChange('machine_make', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter machine make" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year of Manufacture
            </label>
            <input
              type="number"
              value={formData.year_of_manufacture}
              onChange={(e) => handleChange('year_of_manufacture', parseInt(e.target.value) || new Date().getFullYear())}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.year_of_manufacture ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter year of manufacture"
              min="1900"
              max={new Date().getFullYear() + 1} />
            {errors.year_of_manufacture && (
              <p className="mt-1 text-sm text-red-600">{errors.year_of_manufacture}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacity
            </label>
            <input
              type="text"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter capacity" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No Of Rods
            </label>
            <input
              type="number"
              value={formData.no_of_rods}
              onChange={(e) => handleChange('no_of_rods', parseInt(e.target.value) || 0)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter No Of rods" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digitracker Make
            </label>
            <input
              type="text"
              value={formData.digitrack_make}
              onChange={(e) => handleChange('digitrack_make', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter digitrack make" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digitracker Model
            </label>
            <input
              type="text"
              value={formData.digitrack_model}
              onChange={(e) => handleChange('digitrack_model', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter digitrack model" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Truck Make
            </label>
            <input
              type="text"
              value={formData.truck_make}
              onChange={(e) => handleChange('truck_make', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter truck make" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Truck Model
            </label>
            <input
              type="text"
              value={formData.truck_model}
              onChange={(e) => handleChange('truck_model', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter truck model" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver Batch No
            </label>
            <input
              type="text"
              value={formData.driver_batch_no}
              onChange={(e) => handleChange('driver_batch_no', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter driver batch no" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver Valid Upto
            </label>
            <input
              type="date"
              value={
                formData.driver_valid_upto
                  ? new Date(formData.driver_valid_upto).toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => handleChange('driver_valid_upto', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
              placeholder="Enter driver valid date" />
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
            className={`px-8 py-3 rounded-lg text-white font-medium transition-all ${isEditing
                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'}`}
          >
            {isEditing ? 'Update Machine' : 'Add Machine'}
          </button>
        </div>
      </form>
      
      {/* Optional: Add expand/collapse functionality if needed */}
      {onExpandChange && (
        <button 
          onClick={handleExpandToggle}
          className="mt-4 text-blue-600 hover:text-blue-800 text-sm"
        >
          {isExpanded ? 'Collapse' : 'Expand'} Form
        </button>
      )}
    </div>
  );
};

export default MachineForm;