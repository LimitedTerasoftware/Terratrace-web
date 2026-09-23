import { useEffect, useRef, useState } from 'react';
import { X, Save, Loader2, AlertCircle, Upload, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const BASEURL = import.meta.env.VITE_API_BASE;

type PoleType = 'new' | 'existing';

interface PoleFieldsState {
  line_type: string;
  pole_material: string;
  fitting_type: string;
  pole_owner: string;
  pole_owner_description: string;
  pole_height: string;
  drum_number: string;
  meter: string;
}

const emptyPoleFields: PoleFieldsState = {
  line_type: '',
  pole_material: '',
  fitting_type: '',
  pole_owner: '',
  pole_owner_description: '',
  pole_height: '',
  drum_number: '',
  meter: '',
};

interface ImagePickerState {
  files: File[];
  previews: string[];
}

const emptyImagePicker: ImagePickerState = { files: [], previews: [] };

type ModalTab = 'event' | 'gp';

interface AddPoleEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  surveyId: number | null | undefined;
  blockId: number | string | null | undefined;
  defaultStartLat?: string | number | null;
  defaultStartLng?: string | number | null;
  defaultEndLat?: string | number | null;
  defaultEndLng?: string | number | null;
}

export function AddPoleEventModal({
  isOpen,
  onClose,
  onSuccess,
  surveyId,
  blockId,
  defaultStartLat,
  defaultStartLng,
  defaultEndLat,
  defaultEndLng,
}: AddPoleEventModalProps) {
  const [modalTab, setModalTab] = useState<ModalTab>('event');
  const [poleType, setPoleType] = useState<PoleType>('new');
  const [poleFields, setPoleFields] = useState<PoleFieldsState>(emptyPoleFields);
  const [poleLat, setPoleLat] = useState('');
  const [poleLng, setPoleLng] = useState('');
  const [poleImages, setPoleImages] = useState<ImagePickerState>(emptyImagePicker);

  const [muffLat, setMuffLat] = useState('');
  const [muffLng, setMuffLng] = useState('');
  const [muffImages, setMuffImages] = useState<ImagePickerState>(emptyImagePicker);

  const [earthingLat, setEarthingLat] = useState('');
  const [earthingLng, setEarthingLng] = useState('');
  const [earthingImages, setEarthingImages] = useState<ImagePickerState>(emptyImagePicker);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gpStartLat, setGpStartLat] = useState('');
  const [gpStartLng, setGpStartLng] = useState('');
  const [gpEndLat, setGpEndLat] = useState('');
  const [gpEndLng, setGpEndLng] = useState('');
  const [gpSaving, setGpSaving] = useState(false);
  const [gpError, setGpError] = useState<string | null>(null);

  const poleFileRef = useRef<HTMLInputElement | null>(null);
  const muffFileRef = useRef<HTMLInputElement | null>(null);
  const earthingFileRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setModalTab('event');
    setPoleType('new');
    setPoleFields(emptyPoleFields);
    setPoleLat('');
    setPoleLng('');
    setPoleImages(emptyImagePicker);
    setMuffLat('');
    setMuffLng('');
    setMuffImages(emptyImagePicker);
    setEarthingLat('');
    setEarthingLng('');
    setEarthingImages(emptyImagePicker);
    setError(null);
    setGpStartLat('');
    setGpStartLng('');
    setGpEndLat('');
    setGpEndLng('');
    setGpError(null);
    [poleFileRef, muffFileRef, earthingFileRef].forEach((ref) => {
      if (ref.current) ref.current.value = '';
    });
  };

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  // Prefill the GP Boundaries tab from the survey's own start/end GP
  // coordinates every time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setGpStartLat(defaultStartLat != null ? String(defaultStartLat) : '');
    setGpStartLng(defaultStartLng != null ? String(defaultStartLng) : '');
    setGpEndLat(defaultEndLat != null ? String(defaultEndLat) : '');
    setGpEndLng(defaultEndLng != null ? String(defaultEndLng) : '');
  }, [isOpen, defaultStartLat, defaultStartLng, defaultEndLat, defaultEndLng]);

  if (!isOpen) return null;

  const handlePoleFieldChange = (field: keyof PoleFieldsState, value: string) => {
    setPoleFields((prev) => ({ ...prev, [field]: value }));
  };

  const pickImages = (
    setter: React.Dispatch<React.SetStateAction<ImagePickerState>>,
    files: FileList | null,
  ) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const previews = newFiles.map((file) => URL.createObjectURL(file));
    setter((prev) => ({
      files: [...prev.files, ...newFiles],
      previews: [...prev.previews, ...previews],
    }));
  };

  const removeImage = (
    setter: React.Dispatch<React.SetStateAction<ImagePickerState>>,
    index: number,
  ) => {
    setter((prev) => ({
      files: prev.files.filter((_, i) => i !== index),
      previews: prev.previews.filter((_, i) => i !== index),
    }));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    const formData = new FormData();
    files.forEach((file) => formData.append('images[]', file));

    const response = await fetch(`${BASEURL}/upload-image`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) throw new Error('Image upload failed');
    const data = await response.json();
    return data?.data?.images || [];
  };

  const imageUploadSection = (
    label: string,
    picker: ImagePickerState,
    setter: React.Dispatch<React.SetStateAction<ImagePickerState>>,
    fileRef: React.MutableRefObject<HTMLInputElement | null>,
  ) => (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <input
        ref={(el) => {
          fileRef.current = el;
        }}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => pickImages(setter, e.target.files)}
        className="hidden"
        disabled={isLoading}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
        disabled={isLoading}
      >
        <Upload className="w-5 h-5" />
        Click to upload images
      </button>
      {picker.previews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {picker.previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => removeImage(setter, index)}
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
  );

  const textField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options?: { type?: string; required?: boolean },
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {options?.required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={options?.type ?? 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
        disabled={isLoading}
      />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!surveyId) {
      setError('Missing survey. Please reopen this survey and try again.');
      return;
    }
    if (!poleLat.trim() || !poleLng.trim()) {
      setError('Pole latitude and longitude are required.');
      return;
    }
    if (poleType === 'new') {
      if (!muffLat.trim() || !muffLng.trim()) {
        setError('Muff latitude and longitude are required for a new pole.');
        return;
      }
      if (!earthingLat.trim() || !earthingLng.trim()) {
        setError('Earthing latitude and longitude are required for a new pole.');
        return;
      }
    }

    setIsLoading(true);
    try {
      const poleImageUrls = await uploadImages(poleImages.files);

      const polePayload = {
        ...poleFields,
        image: poleImageUrls,
      };

      const poleData: Record<string, any> = {
        pole_type: poleType,
        new_pole: poleType === 'new' ? polePayload : null,
        existing_pole: poleType === 'existing' ? polePayload : null,
        eventType: 'POLE',
        survey_id: surveyId,
        latitude: Number(poleLat),
        longitude: Number(poleLng),
      };

      const poleEntry: Record<string, any> = { pole_data: poleData };

      if (poleType === 'new') {
        const [muffImageUrls, earthingImageUrls] = await Promise.all([
          uploadImages(muffImages.files),
          uploadImages(earthingImages.files),
        ]);

        poleEntry.muff = {
          latitude: Number(muffLat),
          longitude: Number(muffLng),
          muff_images: muffImageUrls,
        };
        poleEntry.earthing = {
          latitude: Number(earthingLat),
          longitude: Number(earthingLng),
          earthing_images: earthingImageUrls,
        };
      }

      const payload = {
        survey_id: surveyId,
        block_id: blockId,
        poles: [poleEntry],
      };

      await axios.post(`${TraceBASEURL}/create-aerial-survey`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      onSuccess();
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating pole event:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create pole event',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGpBoundaries = async () => {
    setGpError(null);

    if (!surveyId) {
      setGpError('Missing survey. Please reopen this survey and try again.');
      return;
    }
    if (
      !gpStartLat.trim() ||
      !gpStartLng.trim() ||
      !gpEndLat.trim() ||
      !gpEndLng.trim()
    ) {
      setGpError('Start and end GP latitude/longitude are required.');
      return;
    }

    setGpSaving(true);
    try {
      await axios.post(`${TraceBASEURL}/insert-gp-boundaries`, {
        survey_id: surveyId,
        start_lat: Number(gpStartLat),
        start_lon: Number(gpStartLng),
        end_lat: Number(gpEndLat),
        end_lon: Number(gpEndLng),
      });
      toast.success('GP boundaries saved successfully.');
    } catch (err) {
      console.error('Error saving GP boundaries:', err);
      setGpError(
        err instanceof Error ? err.message : 'Failed to save GP boundaries',
      );
    } finally {
      setGpSaving(false);
    }
  };

  const gpField = (
    label: string,
    value: string,
    onChange: (value: string) => void,
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        <span className="text-red-500">*</span>
      </label>
      <input
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
        disabled={gpSaving}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
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

        <div className="flex gap-1 px-6 pt-4 border-b border-gray-200 dark:border-gray-700">
          {(
            [
              { id: 'event', label: 'Pole Event' },
              { id: 'gp', label: 'GP Boundaries' },
            ] as { id: ModalTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setModalTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg outline-none ${
                modalTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {modalTab === 'gp' ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="md:col-span-2 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2">
                Start GP
              </h3>
              {gpField('Latitude', gpStartLat, setGpStartLat)}
              {gpField('Longitude', gpStartLng, setGpStartLng)}

              <h3 className="md:col-span-2 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2 mt-2">
                End GP
              </h3>
              {gpField('Latitude', gpEndLat, setGpEndLat)}
              {gpField('Longitude', gpEndLng, setGpEndLng)}
            </div>

            {gpError && (
              <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{gpError}</p>
              </div>
            )}
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Pole type toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pole Type
            </label>
            <div className="flex gap-3">
              {(['new', 'existing'] as PoleType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPoleType(type)}
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    poleType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                  }`}
                >
                  {type === 'new' ? 'New Pole' : 'Existing Pole'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h3 className="md:col-span-2 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2">
              Pole Location
            </h3>
            {textField('Latitude', poleLat, setPoleLat, {
              type: 'number',
              required: true,
            })}
            {textField('Longitude', poleLng, setPoleLng, {
              type: 'number',
              required: true,
            })}

            <h3 className="md:col-span-2 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2 mt-2">
              Pole Parameters
            </h3>
            {textField('Line Type', poleFields.line_type, (v) =>
              handlePoleFieldChange('line_type', v),
            )}
            {textField('Pole Material', poleFields.pole_material, (v) =>
              handlePoleFieldChange('pole_material', v),
            )}
            {textField('Fitting Type', poleFields.fitting_type, (v) =>
              handlePoleFieldChange('fitting_type', v),
            )}
            {textField('Pole Owner', poleFields.pole_owner, (v) =>
              handlePoleFieldChange('pole_owner', v),
            )}
            {textField(
              'Pole Owner Description',
              poleFields.pole_owner_description,
              (v) => handlePoleFieldChange('pole_owner_description', v),
            )}
            {textField('Pole Height', poleFields.pole_height, (v) =>
              handlePoleFieldChange('pole_height', v),
            )}
            {textField('Drum Number', poleFields.drum_number, (v) =>
              handlePoleFieldChange('drum_number', v),
            )}
            {textField('Meter', poleFields.meter, (v) =>
              handlePoleFieldChange('meter', v),
            )}

            {imageUploadSection(
              'Pole Photos',
              poleImages,
              setPoleImages,
              poleFileRef,
            )}

            {poleType === 'new' && (
              <>
                <h3 className="md:col-span-2 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2 mt-2">
                  Muff
                </h3>
                {textField('Latitude', muffLat, setMuffLat, {
                  type: 'number',
                  required: true,
                })}
                {textField('Longitude', muffLng, setMuffLng, {
                  type: 'number',
                  required: true,
                })}
                {imageUploadSection(
                  'Muff Photos',
                  muffImages,
                  setMuffImages,
                  muffFileRef,
                )}

                <h3 className="md:col-span-2 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2 mt-2">
                  Earthing
                </h3>
                {textField('Latitude', earthingLat, setEarthingLat, {
                  type: 'number',
                  required: true,
                })}
                {textField('Longitude', earthingLng, setEarthingLng, {
                  type: 'number',
                  required: true,
                })}
                {imageUploadSection(
                  'Earthing Photos',
                  earthingImages,
                  setEarthingImages,
                  earthingFileRef,
                )}
              </>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </form>
        )}

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={modalTab === 'gp' ? gpSaving : isLoading}
          >
            {modalTab === 'gp' ? 'Close' : 'Cancel'}
          </button>
          {modalTab === 'event' ? (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Event
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveGpBoundaries}
              disabled={gpSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gpSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Boundaries
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
