import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Eye } from 'lucide-react';
import { AerialSurveyDetails, AerialPole, AerialRoadCrossing, EditType } from '../../types/aerial-survey';
import { updateAerialData } from '../Services/api';
import axios from 'axios';



interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AerialSurveyDetails | AerialPole | AerialRoadCrossing;
  type: EditType;
  onSuccess?: () => void;
}
const normalizeImages = (value: any): string[] => {
  if (!value) return [];

  // already array
  if (Array.isArray(value)) return value.filter(Boolean);

  // json string array
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (e) {
      // single string
      return [value];
    }
  }

  return [];
};
  const parsePhotosArray = (photos: string): string[] => {
    if (!photos) return [];

    if (Array.isArray(photos)) {
      return photos;
    }

    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: string) => p && p.trim() !== '');
        }
        return [parsed];
      } catch (e) {
        console.error('Error parsing photos array:', e, 'Input:', photos);
        return [];
      }
    }

    return [];
  };
const toBackendValue = (arr: string[], isMulti: boolean) => {
  if (isMulti) return JSON.stringify(arr); // aerial
  return arr[0] || ""; // pole / crossing
};

const BASE_URL = import.meta.env.VITE_API_BASE;
const ImG_URL = import.meta.env.VITE_Image_URL;


export const EditModal = ({
  isOpen,
  onClose,
  data,
  type,
  onSuccess
}: EditModalProps) => {
  const [formData, setFormData] = useState<any>({});
  const [startGpCoordinates, setStartGpCoordinates] = useState('');
  const [endGpCoordinates, setEndGpCoordinates] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<{ [key: string]: string }>({});
  const [newImages, setNewImages] = useState<{ [key: string]: File | null }>({});
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [gpOptions, setGpOptions] = useState<{ id: string; name: string,lgd_code:string,lat:string,long:string }[]>([]);
  const [loadingGPD, setLoadingGPD] = useState(false);

  useEffect(() => {
    if (isOpen && data) {
      setFormData({ ...data });
      setStartGpCoordinates((data as any).startGpCoordinates || '');
      setEndGpCoordinates((data as any).endGpCoordinates || '');
      setError(null);
      setNewImages({});
      setImagePreview({});
    }
  }, [isOpen, data]);

  if (!isOpen) return null;
     useEffect(() => {
    if (type=="aerial") {
      const blockCode = data?.block_id ; 
      if (!blockCode) return;
  
      setLoadingGPD(true);
      axios.get(`${BASE_URL}/gpdata?block_code=${blockCode}`)
        .then(res => {
          const data = res.data;
          const options = data.map((g: any) => ({
            id: g.id.toString(),
            name: g.name.toString(),
            lgd_code:g.lgd_code,
            lat:g.lattitude,
            long:g.longitude
          }));
          setGpOptions(options);
        })
        .catch(err => {
          console.error("Error fetching GP data:", err);
        })
        .finally(() => {
          setLoadingGPD(false);
        });
    }
  }, [type]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGPChange = (field: 'gp_id' | 'end_gp_id', value: string) => {
    const selectedGp = gpOptions.find((opt) => String(opt.id) === String(value));
    if (selectedGp) {
      if (field === 'gp_id') {
        setStartGpCoordinates(`${selectedGp.lat},${selectedGp.long}`);
        handleChange('startGpName', `${selectedGp.name}-${selectedGp.lgd_code}`);
      } else {
        setEndGpCoordinates(`${selectedGp.lat},${selectedGp.long}`);
        handleChange('endGpName', `${selectedGp.name}-${selectedGp.lgd_code}`);
      }
    }
    handleChange(field, value);
  };

const handleImageChange = (field: string, file: File | null, isMulti = false) => {
  if (!file) return;
  
  const reader = new FileReader();

  reader.onloadend = () => {
    const preview = reader.result as string;

    setImagePreview((prev) => ({
      ...prev,
      [field]: preview,
    }));

    setFormData((prev: any) => {
      // MULTI (Aerial)
      if (isMulti) {
        const oldArr = parsePhotosArray(prev[field] || "[]");
        const updatedArr = [...oldArr, preview]; // temporarily store base64
        return { ...prev, [field]: JSON.stringify(updatedArr) };
      }

      // SINGLE (Pole / Crossing)
      return { ...prev, [field]: preview };
    });
  };

  reader.readAsDataURL(file);
};


const handleClearImage = (field: string) => {
    setNewImages((prev) => ({
      ...prev,
      [field]: null,
    }));
    setImagePreview((prev) => ({
      ...prev,
      [field]: '',
    }));
    setFormData((prev: any) => ({
      ...prev,
      [field]: '',
    }));
  };

  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${ImG_URL}${imagePath}`;
  };

  const openImagePreview = (imagePath: string | undefined) => {
    if (imagePath) {
      setSelectedImageUrl(imagePath.startsWith("data:") ? imagePath : getImageUrl(imagePath) || '');
      setImageModalOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        type,
        id: formData.id,
      };

      if (type === 'aerial') {
        if (formData.startGpName) payload.startGpName = formData.startGpName;
        if (formData.endGpName) payload.endGpName = formData.endGpName;
        if (startGpCoordinates) payload.startGpCoordinates = startGpCoordinates;
        if (endGpCoordinates) payload.endGpCoordinates = endGpCoordinates;
        if (formData.startGpPhotos) payload.startGpPhotos = formData.startGpPhotos;
        if (formData.endGpPhotos) payload.endGpPhotos = formData.endGpPhotos;
      } else if (type === 'pole') {
        if (formData.poleHeight) payload.poleHeight = formData.poleHeight;
        if (formData.poleCondition) payload.poleCondition = formData.poleCondition;
        if (formData.typeOfPole) payload.typeOfPole = formData.typeOfPole;
        if (formData.polePosition) payload.polePosition = formData.polePosition;
        if (formData.poleAvailabilityAt) payload.poleAvailabilityAt = formData.poleAvailabilityAt;
        if (formData.polePhoto !== undefined) payload.polePhoto = formData.polePhoto;
      } else if (type === 'roadcrossing') {
        if (formData.length) payload.length = formData.length;
        if (formData.typeOfCrossing) payload.typeOfCrossing = formData.typeOfCrossing;
        if (formData.startPhoto !== undefined) payload.startPhoto = formData.startPhoto;
        if (formData.endPhoto !== undefined) payload.endPhoto = formData.endPhoto;
      }

      await updateAerialData(payload);

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update data');
    } finally {
      setIsSubmitting(false);
    }
  };


 const ImageField = ({
  label,
  field,
  isMulti = false,
}: {
  label: string;
  field: string;
  isMulti?: boolean;
}) => {
const images = isMulti ? parsePhotosArray(formData[field]) : [];
const singleImage = !isMulti ? formData[field] : null;
const previewImage = imagePreview[field];

const displayImages = isMulti
  ? images
  : singleImage
  ? [singleImage]
  : [];

const removeImageAtIndex = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setFormData((prev: any) => ({
      ...prev,
      [field]: toBackendValue(updated, isMulti),
    }));
  };
 return (
    <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label}
      </label>

      {/* Show images */}
      {displayImages.length > 0 && (

        <div className="grid grid-cols-3 gap-3 mb-3">
          {displayImages.map((img, index) => (
            <div
              key={index}
              className="relative w-full h-24 rounded border border-gray-300 overflow-hidden bg-white"
            >
              <img
               src={img.startsWith("data:") ? img : getImageUrl(img) || ""}
               alt="Preview"
                className="w-full h-full object-cover"
               onClick={() => openImagePreview(img)}

              />

              <button
                type="button"
                onClick={() => removeImageAtIndex(index)}
                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
        <Upload size={16} />
        {isMulti ? "Add Images" : "Upload Image"}
        
        <input
          type="file"
          accept="image/*"
          multiple={isMulti}
          onChange={(e) => {
            const files = e.target.files;
            if (!files) return;
             if (isMulti) {
               Array.from(files).forEach((file) => {
              handleImageChange(field, file, true);
            });
            } else {
               handleImageChange(field, e.target.files?.[0] || null, false)
            }

          
          }}
          className="hidden"
        />

      </label>
    </div>
  );
};

  const renderAerialForm = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start GP Name</label>
        {loadingGPD ? (
          <div className="mt-1 text-sm text-gray-500">Loading...</div>
        ) : (
          <select
            value={formData.gp_id || ''}
            onChange={(e) => handleGPChange('gp_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Start GP</option>
            {gpOptions.map((opt) => (
              <option value={opt.id} key={opt.id}>
                {opt.name}-{opt.lgd_code}
              </option>
            ))}
          </select>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start GP Coordinates</label>
        <input
          type="text"
          value={startGpCoordinates || ''}
          placeholder="latitude,longitude"
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
          readOnly
        />
      </div>
      <ImageField label="Start GP Photos" field="startGpPhotos" isMulti />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End GP Name</label>
        {loadingGPD ? (
          <div className="mt-1 text-sm text-gray-500">Loading...</div>
        ) : (
          <select
            value={formData.end_gp_id || ''}
            onChange={(e) => handleGPChange('end_gp_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select End GP</option>
            {gpOptions.map((opt) => (
              <option value={opt.id} key={opt.id}>
                {opt.name}-{opt.lgd_code}
              </option>
            ))}
          </select>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">End GP Coordinates</label>
        <input
          type="text"
          value={endGpCoordinates || ''}
          placeholder="latitude,longitude"
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
          readOnly
        />
      </div>
      <ImageField label="End GP Photos" field="endGpPhotos" isMulti />
    </>
  );

  const renderPoleForm = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pole Height</label>
        <input
          type="text"
          value={formData.poleHeight || ''}
          onChange={(e) => handleChange('poleHeight', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pole Condition</label>
        <select
          value={formData.poleCondition || ''}
          onChange={(e) => handleChange('poleCondition', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Condition</option>
          <option value="Accessible">Accessible </option>
          <option value="Non Accessible">Non Accessible</option>
        
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type of Pole</label>
          <select
          value={formData.typeOfPole || ''}
          onChange={(e) => handleChange('typeOfPole', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Type</option>
          <option value='Cement'>Cement</option>
          <option value='Iron'>Iron</option>
          <option value='GI'>GI</option>
          <option value='Tower Pole'>Tower Pole</option>
        
        </select>
       
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pole Position</label>
        <input
          type="text"
          value={formData.polePosition || ''}
          onChange={(e) => handleChange('polePosition', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Pole Availability At</label>
          <select
          value={formData.poleAvailabilityAt || ''}
          onChange={(e) => handleChange('poleAvailabilityAt', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Availability</option>
          <option value="Agriculture Land">Agriculture Land</option>
          <option value="Road Side">Road Side</option>
          <option value="Open Field">Open Field</option>
        
        </select>
     
      </div>
      <ImageField label="Pole Photo" field="polePhoto" />
    </>
  );

  const renderRoadCrossingForm = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
        <input
          type="text"
          value={formData.length || ''}
          onChange={(e) => handleChange('length', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Type of Crossing</label>
        <select
          value={formData.typeOfCrossing || ''}
          onChange={(e) => handleChange('typeOfCrossing', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Type</option>
          <option value='Bridge'>Bridge</option>
          <option value='Culvert'>Culvert</option>
          <option value='Rail Over & Under Bridge'>Rail Over &amp; Under Bridge</option>
          <option value='Cause Ways'>Cause Ways</option>
          <option value='Level Crossing'>Level Crossing</option>
          <option value="Road Crossing">Road Crossing</option>
        
        </select>
      </div>
      <ImageField label="Start Photo" field="startPhoto" />
      <ImageField label="End Photo" field="endPhoto" />
    </>
  );

  const getTitle = () => {
    switch (type) {
      case 'aerial':
        return 'Edit Aerial Survey';
      case 'pole':
        return 'Edit Pole';
      case 'roadcrossing':
        return 'Edit Road Crossing';
      default:
        return 'Edit';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <input
                  type="text"
                  value={formData.id || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                />
              </div>

              {type === 'aerial' && renderAerialForm()}
              {type === 'pole' && renderPoleForm()}
              {type === 'roadcrossing' && renderRoadCrossingForm()}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {imageModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-3xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 z-10 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
            >
              <X size={24} />
            </button>
            <img src={selectedImageUrl} alt="Image Preview" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </>
  );
};
