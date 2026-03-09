import { useState, useRef, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, Upload, Trash2 } from 'lucide-react';
import { ImageUploadResponse, UGConstructionSurveyData } from '../../types/survey';
import axios from 'axios';
import { Machine } from '../../types/machine';

interface FormErrors {
  [key: string]: string;
}

interface AddEventModalProps {
  isOpen: boolean;
  Data:UGConstructionSurveyData;
  onClose: () => void;
  onSuccess: () => void;
  baseUrl: string;
}

interface ImageFieldState {
  files: File[];
  previews: string[];
}

const EVENT_TYPES = [
//   'FPOI',
  'DEPTH',
//   'JOINTCHAMBER',
//   'MANHOLES',
//   'LANDMARK',
//   'KILOMETERSTONE',
//   'FIBERTURN',
//   'ROUTEINDICATOR',
//   'STARTPIT',
//   'ENDPIT',
//   'STARTSURVEY',
//   'ENDSURVEY',
//   'ROADCROSSING',
//   'HOLDSURVEY',
//   'BLOWING',
//   'ROUTEFEATURE',
];

const getEventSpecificFields = (eventType: string) => {
  const baseFields = [
    { key: 'start_lgd', label: 'Start LGD', type: 'text', required: true },
    { key: 'end_lgd', label: 'End LGD', type: 'text', required: true },
    { key: 'survey_id', label: 'Survey ID', type: 'number', required: true },
    { key: 'machine_id', label: 'Machine ID', type: 'text', required: true },
    { key: 'roadType', label: 'Road Type', type: 'text', required: false },
    { key: 'roadWidth', label: 'Road Width', type: 'text', required: false },
    { key: 'road_margin', label: 'Road Margin', type: 'text', required: false },
    { key: 'routeBelongsTo', label: 'Route Belongs To', type: 'text', required: false },
    { key: 'soilType', label: 'Soil Type', type: 'text', required: false },
  ];

  const eventSpecificFieldsMap: { [key: string]: Array<{ key: string; label: string; type: string; required: boolean }> } = {
    FPOI: [
      { key: 'fpoiLatLong', label: 'FPOI Latitude/Longitude', type: 'text', required: true },
      { key: 'fpoiPhotos', label: 'FPOI Photos (JSON array)', type: 'textarea', required: false },
    ],
    DEPTH: [
      { key: 'depthLatlong', label: 'Depth Latitude/Longitude', type: 'text', required: true },
      { key: 'depthMeters', label: 'Depth (Meters)', type: 'text', required: true },
      { key: 'depthPhoto', label: 'Depth Photos (JSON array)', type: 'textarea', required: false },
    ],
    JOINTCHAMBER: [
      { key: 'jointChamberLatLong', label: 'Joint Chamber Latitude/Longitude', type: 'text', required: true },
      { key: 'jointChamberPhotos', label: 'Joint Chamber Photos (JSON array)', type: 'textarea', required: false },
    ],
    MANHOLES: [
      { key: 'manholeLatLong', label: 'Manhole Latitude/Longitude', type: 'text', required: true },
      { key: 'manholePhotos', label: 'Manhole Photos (JSON array)', type: 'textarea', required: false },
    ],
    LANDMARK: [
      { key: 'landmarkLatLong', label: 'Landmark Latitude/Longitude', type: 'text', required: true },
      { key: 'landmarkPhotos', label: 'Landmark Photos (JSON array)', type: 'textarea', required: false },
      { key: 'landmark_type', label: 'Landmark Type', type: 'text', required: false },
      { key: 'landmark_description', label: 'Landmark Description', type: 'textarea', required: false },
    ],
    KILOMETERSTONE: [
      { key: 'kilometerstoneLatLong', label: 'Kilometerstone Latitude/Longitude', type: 'text', required: true },
      { key: 'kilometerstonePhotos', label: 'Kilometerstone Photos (JSON array)', type: 'textarea', required: false },
    ],
    FIBERTURN: [
      { key: 'fiberTurnLatLong', label: 'Fiber Turn Latitude/Longitude', type: 'text', required: true },
      { key: 'fiberTurnPhotos', label: 'Fiber Turn Photos (JSON array)', type: 'textarea', required: false },
    ],
    ROUTEINDICATOR: [
      { key: 'routeIndicatorLatLong', label: 'Route Indicator Latitude/Longitude', type: 'text', required: true },
      { key: 'routeIndicatorPhotos', label: 'Route Indicator Photos (JSON array)', type: 'textarea', required: false },
    ],
    STARTPIT: [
      { key: 'startPitLatlong', label: 'Start Pit Latitude/Longitude', type: 'text', required: true },
      { key: 'startPitPhotos', label: 'Start Pit Photos (JSON array)', type: 'textarea', required: false },
    ],
    ENDPIT: [
      { key: 'endPitLatlong', label: 'End Pit Latitude/Longitude', type: 'text', required: true },
      { key: 'endPitPhotos', label: 'End Pit Photos (JSON array)', type: 'textarea', required: false },
    ],
    STARTSURVEY: [
      { key: 'startPointCoordinates', label: 'Start Point Coordinates', type: 'text', required: true },
      { key: 'startPointPhoto', label: 'Start Point Photo (JSON array)', type: 'textarea', required: false },
    ],
    ENDSURVEY: [
      { key: 'endPointCoordinates', label: 'End Point Coordinates', type: 'text', required: true },
      { key: 'endPointPhoto', label: 'End Point Photo (JSON array)', type: 'textarea', required: false },
    ],
    ROADCROSSING: [
      { key: 'crossingLatlong', label: 'Crossing Latitude/Longitude', type: 'text', required: true },
      { key: 'crossingPhotos', label: 'Crossing Photos (JSON array)', type: 'textarea', required: false },
      { key: 'crossingType', label: 'Crossing Type', type: 'text', required: false },
      { key: 'crossingLength', label: 'Crossing Length', type: 'text', required: false },
    ],
    HOLDSURVEY: [
      { key: 'holdLatlong', label: 'Hold Survey Latitude/Longitude', type: 'text', required: true },
      { key: 'holdPhotos', label: 'Hold Photos (JSON array)', type: 'textarea', required: false },
    ],
    BLOWING: [
      { key: 'blowingLatLong', label: 'Blowing Latitude/Longitude', type: 'text', required: true },
      { key: 'blowingPhotos', label: 'Blowing Photos (JSON array)', type: 'textarea', required: false },
    ],
    ROUTEFEATURE: [
      { key: 'routeFeatureLatLong', label: 'Route Feature Latitude/Longitude', type: 'text', required: true },
      { key: 'routeFeaturePhotos', label: 'Route Feature Photos (JSON array)', type: 'textarea', required: false },
      { key: 'routeFeatureType', label: 'Route Feature Type', type: 'text', required: false },
    ],
  };

  return [...baseFields, ...(eventSpecificFieldsMap[eventType] || [])];
};
  const BASEURL = import.meta.env.VITE_API_BASE;

export function AddEventModal({ isOpen,Data,onClose, onSuccess, baseUrl }: AddEventModalProps) {
   
  const [eventType, setEventType] = useState('');
  const [formData, setFormData] = useState<{ [key: string]: string | number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFields, setImageFields] = useState<{ [key: string]: ImageFieldState }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [machines, setMachines] = useState<Machine[]>([]);
    const GetMachineData = async () => {
    try {
      const resp = await axios.get(`${baseUrl}/get-all-machines`);
      if (resp.status === 200 || resp.status === 201) {
        setMachines(resp.data.machines);
      }
    } catch (error) {
      console.log(error);
    }
  };
 useEffect(()=>{
   GetMachineData();
  },[])

  if (!isOpen) return null;
  
  const fields = eventType ? getEventSpecificFields(eventType) : [];



  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!eventType) {
      newErrors.eventType = 'Event type is required';
    }

    fields.forEach(({ key, required }) => {
      const value = formData[key];
      if (required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        newErrors[key] = 'This field is required';
      }

      if (key.includes('Latlong') || key.includes('Coordinates')) {
        const value = formData[key] as string;
        if (value && !validateLatLong(value)) {
          newErrors[key] = 'Invalid latitude/longitude format (use: lat,long)';
        }
      }

      if (key === 'survey_id' || key === 'machine_id') {
        const value = formData[key];
        if (value && isNaN(Number(value))) {
          newErrors[key] = 'Must be a valid number';
        }
      }

      if (key.includes('Photos') || key.includes('Photo')) {
        const value = formData[key] as string;
        if (value && !isValidJSON(value)) {
          newErrors[key] = 'Must be valid JSON array';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLatLong = (value: string): boolean => {
    const latLongRegex = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
    return latLongRegex.test(value.trim());
  };

  const isValidJSON = (value: string): boolean => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleImageSelect = (fieldKey: string, files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const previews = newFiles.map((file) => URL.createObjectURL(file));

    setImageFields((prev) => ({
      ...prev,
      [fieldKey]: {
        files: [...(prev[fieldKey]?.files || []), ...newFiles],
        previews: [...(prev[fieldKey]?.previews || []), ...previews],
      },
    }));
  };

  const handleRemoveImage = (fieldKey: string, index: number) => {
    setImageFields((prev) => ({
      ...prev,
      [fieldKey]: {
        files: prev[fieldKey].files.filter((_, i) => i !== index),
        previews: prev[fieldKey].previews.filter((_, i) => i !== index),
      },
    }));
  };

    const uploadImages = async (files: File[]): Promise<string[]> => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images[]', file);
      });
  
      try {
        const response = await fetch(`${BASEURL}/upload-image`, {
          method: 'POST',
          body: formData
        });
  
        if (!response.ok) {
          throw new Error('Upload failed');
        }
  
        const data: ImageUploadResponse = await response.json();
  
        return data.data.images || [];
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: { [key: string]: any } = {
        eventType,
        ...formData,
      };

      const imageFieldsWithFiles = Object.entries(imageFields).filter(
        ([_, state]) => state.files.length > 0
      );

      for (const [fieldKey, state] of imageFieldsWithFiles) {
        try {
          const uploadedPaths = await uploadImages(state.files);
          payload[fieldKey] = JSON.stringify(uploadedPaths);
        } catch (uploadError) {
          throw new Error(`Failed to upload images for ${fieldKey}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      }

      const response = await fetch(`${baseUrl}/create-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Creation failed: ${response.statusText}`);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleReset();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setEventType('');
    setFormData({});
    setErrors({});
    setImageFields({});
    Object.values(fileInputRefs.current).forEach((ref) => {
      if (ref) ref.value = '';
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Add New Event
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setFormData((prev) => ({
                    start_lgd: Data?.startLocation || "",
                    end_lgd: Data?.endLocation || "",
                    survey_id: Data?.id || "",
                }));
                setErrors({});
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              disabled={isLoading}
            >
              <option value="">Select an event type</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.eventType && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.eventType}</p>
            )}
          </div>

          {eventType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.filter(({key})=> !key.includes('Photos') && !key.includes('Photo')).map(({ key, label, type, required }) => (
                <div key={key} className={type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label}
                    {required && <span className="text-red-500">*</span>}
                  </label>
                  {key === "machine_id" ? (
                    <select
                        value={(formData[key] as string) || ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 
                        dark:bg-gray-700 dark:text-white ${
                        errors[key]
                            ? "border-red-500 dark:border-red-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                        disabled={isLoading}
                    >
                        <option value="">Select Machine</option>

                        {machines.map((machine) => (
                        <option key={machine.machine_id} value={machine.machine_id}>
                            {machine.registration_number}
                        </option>
                        ))}
                    </select>
                    ) : type === 'textarea' ? (
                  
                    <textarea
                      value={(formData[key] as string) || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                        errors[key]
                          ? 'border-red-500 dark:border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      rows={4}
                      disabled={isLoading}
                      placeholder={key.includes('Photos') || key.includes('Photo') ? '["image1.jpg", "image2.jpg"]' : ''}
                    />
                  ) : (
                    <input
                      type={type}
                      value={(formData[key] as string | number) || ''}
                      readOnly={key === "start_lgd" || key === "end_lgd" || key === "survey_id"}
                      onChange={(e) =>
                        handleChange(
                          key,
                          type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors 
                        ${key === "start_lgd" || key === "end_lgd" || key === "survey_id"
                        ? "bg-gray-100 cursor-not-allowed"
                        : ""}
                        ${
                        errors[key]
                          ? 'border-red-500 dark:border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      } `}
                      disabled={isLoading}
                      placeholder={
                        key.includes('Latlong') || key.includes('Coordinates')
                          ? '17.4303925, 78.4062873'
                          : ''
                      }
                    />
                  )}
                  {errors[key] && (
                    <div className="mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <p className="text-sm text-red-600 dark:text-red-400">{errors[key]}</p>
                    </div>
                  )}
                </div>
              ))}

              {fields
                .filter(({ key }) => key.includes('Photos') || key.includes('Photo'))
                .map(({ key, label }) => (
                  <div key={`file-${key}`} className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {label.replace('(JSON array)', '')} (Upload Images)
                    </label>
                    <input
                      ref={(el) => {
                        if (el) fileInputRefs.current[key] = el;
                      }}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageSelect(key, e.target.files)}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[key]?.click()}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      disabled={isLoading}
                    >
                      <Upload className="w-5 h-5" />
                      Click to upload images
                    </button>

                    {imageFields[key] && imageFields[key].previews.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        {imageFields[key].previews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(key, index)}
                              className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={isLoading}
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Event created successfully!</p>
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !eventType}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Event
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
