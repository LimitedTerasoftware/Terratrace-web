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
  firm_name:"",
  authorised_person:"",
  machine_make:"",
  capacity:"",
  no_of_rods:0,
  digitrack_make:"",
  digitrack_model:"",
  truck_make:"",
  truck_model:"",
  registration_number: "",
  registration_valid_upto:new Date(),
  driver_batch_no:"",
  driver_valid_upto:new Date(),
  serial_number: "",
  year_of_manufacture: new Date().getFullYear(),
  status: 'active',
  machine_id:'',

  });

  const [errors, setErrors] = useState<Partial<MachineFormData>>({});
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (machine) {
      setFormData({
        firm_name:machine.firm_name,
        authorised_person:machine.authorised_person,
        machine_make:machine.machine_make,
        capacity:machine.capacity,
        no_of_rods:machine.no_of_rods,
        digitrack_make:machine.digitrack_make,
        digitrack_model:machine.digitrack_model,
        truck_make:machine.truck_make,
        truck_model:machine.truck_model,
        registration_number:machine.registration_number,
        registration_valid_upto:machine.registration_valid_upto,
        driver_batch_no:machine.driver_batch_no,
        driver_valid_upto:machine.driver_valid_upto,
        serial_number: machine.serial_number,
        year_of_manufacture: machine.year_of_manufacture,
        status: machine.status,
        machine_id:'',

      });
    }
  }, [machine]);

  const validateForm = (): boolean => {
    const newErrors: Partial<MachineFormData> = {};

    if (!formData.serial_number.trim()) newErrors.serial_number = 'Serial number is required';
    if (!formData.registration_number.trim()) newErrors.registration_number = 'Registration number is required';
    if (!formData.firm_name.trim()) newErrors.firm_name = 'Firm name is required';
    if (!formData.authorised_person.trim()) newErrors.authorised_person = 'Authorised person is required';
    if (!formData.machine_make.trim()) newErrors.machine_make = 'Machine make is required';
    if (!formData.capacity.trim()) newErrors.capacity = 'capacity is required';
    if (!formData.digitrack_make.trim()) newErrors.digitrack_make = 'Digitrack make is required';
    if (!formData.digitrack_model.trim()) newErrors.digitrack_model = 'Digitrack model is required';
    if (!formData.truck_make.trim()) newErrors.truck_make = 'Truck make is required';
    if (!formData.truck_model.trim()) newErrors.truck_model = 'Truck model is required';
    if (!formData.driver_batch_no.trim()) newErrors.driver_batch_no = 'Driver batch_no is required';
    if (!formData.driver_batch_no.trim()) newErrors.driver_batch_no = 'Driver batch_no is required';
    // if (formData.year_of_manufacture < 1900 || formData.year_of_manufacture > new Date().getFullYear() + 1) {
    //   newErrors.year_of_manufacture = 'Please enter a valid year';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      if (!isEditing) {
        setFormData({
          firm_name:"",
          authorised_person:"",
          machine_make:"",
          capacity:"",
          no_of_rods:0,
          digitrack_make:"",
          digitrack_model:"",
          truck_make:"",
          truck_model:"",
          registration_number: "",
          registration_valid_upto:new Date(),
          driver_batch_no:"",
          driver_valid_upto:new Date(),
          serial_number: '',
          year_of_manufacture: new Date().getFullYear(),
          status: 'active',
          machine_id:'',

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

      
     {(isExpanded || isEditing )&&(
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
                placeholder="Enter authorised person" />
              {errors.authorised_person && (
                <p className="mt-1 text-sm text-red-600">{errors.authorised_person}</p>
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.machine_make ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Enter machine make" />
              {errors.machine_make && (
                <p className="mt-1 text-sm text-red-600">{errors.machine_make}</p>
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                placeholder="Enter capacity" />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
              )}
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No Of Rods
            </label>
            <input
              type="text"
              value={formData.no_of_rods}
              onChange={(e) => handleChange('no_of_rods', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.no_of_rods ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter No Of rods" />
            {errors.no_of_rods && (
              <p className="mt-1 text-sm text-red-600">{errors.no_of_rods}</p>
            )}
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digitracker Make
            </label>
            <input
              type="text"
              value={formData.digitrack_make}
              onChange={(e) => handleChange('digitrack_make', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.digitrack_make ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter digitrack make" />
              {errors.digitrack_make && (
              <p className="mt-1 text-sm text-red-600">{errors.digitrack_make}</p>
            )}
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digitracker Modal
            </label>
            <input
              type="text"
              value={formData.digitrack_model}
              onChange={(e) => handleChange('digitrack_model', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.digitrack_model ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter digitrack modal" />
               {errors.digitrack_model && (
              <p className="mt-1 text-sm text-red-600">{errors.digitrack_model}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
             Truck Make
            </label>
            <input
              type="text"
              value={formData.truck_make}
              onChange={(e) => handleChange('truck_make', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.truck_make ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter truck make" />
                {errors.truck_make && (
              <p className="mt-1 text-sm text-red-600">{errors.truck_make}</p>
            )}
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
             Truck Modal
            </label>
            <input
              type="text"
              value={formData.truck_model}
              onChange={(e) => handleChange('truck_model', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.truck_model ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter truck modal" />
                {errors.truck_model && (
              <p className="mt-1 text-sm text-red-600">{errors.truck_model}</p>
            )}
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
             Driver Batch No
            </label>
            <input
              type="text"
              value={formData.driver_batch_no}
              onChange={(e) => handleChange('driver_batch_no', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.driver_batch_no ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="Enter truck modal" />
                {errors.driver_batch_no && (
              <p className="mt-1 text-sm text-red-600">{errors.driver_batch_no}</p>
            )}
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
              placeholder="Enter truck modal" />
              
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