import { useState, useRef, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, Upload, Trash2 } from 'lucide-react';
import { Block, District, ImageUploadResponse, StateData } from '../../types/survey';
import axios from 'axios';
import { getBlockData, getDistrictData, getStateData, machineApi } from '../Services/api';
import { MachineDetailsResponse } from '../../types/machine';

interface FormErrors {
    [key: string]: string;
}

interface AddEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    baseUrl: string;
}

interface ImageFieldState {
    files: File[];
    previews: string[];
}
interface UsersData {
    user_id: string | number
    uname: string;
    email: string;
    version: string;
    is_active: string;
    company_id: string;
    machine_id: string;
}
interface GpData{
    id: number,
    name: string,
    lattitude: string,
    longitude: string,
    type: string,
    blk_code: number,
    blk_name: string,
    dt_code: number,
    dt_name: string,
    st_code: number,
    st_name: string,
    lgd_code: number,
    remark: string|null,
    created_at: string,
    updated_at: string
}


const getEventSpecificFields = () => {
    const baseFields = [
        { key: 'user_id', label: 'User Name', type: 'text', required: true },
        { key: 'state_id', label: 'State', type: 'text', required: true },
        { key: 'district_id', label: 'District', type: 'text', required: true },
        { key: 'block_id', label: 'Block', type: 'text', required: true },

        { key: 'startLocation', label: 'Start Gp', type: 'text', required: true },
        { key: 'endLocation', label: 'End Gp', type: 'text', required: true },
        { key: 'firm', label: 'Firm Name', type: 'text', required: true },
        { key: 'vehicleserialno', label: 'Vehical', type: 'text', required: true },
        { key: 'construction_type', label: 'Construction Type', type: 'text', required: true },

        { key: 'eventType', label: 'Event Type', type: 'text', required: true },
        { key: 'dgps_accuracy', label: 'DGPS Accuracy', type: 'text', required: false },
        { key: 'dgps_siv', label: 'DGPS SIV', type: 'text', required: false },

        { key: 'vehicle_image', label: 'Vehical Photo (JSON array)', type: 'text', required: false },

        { key: 'startPointCoordinates', label: 'Start Point Coordinates', type: 'text', required: true },
        { key: 'startPointPhoto', label: 'Start Point Photo (JSON array)', type: 'text', required: false },
    ];



    return [...baseFields];
};
const BASEURL = import.meta.env.VITE_API_BASE;

export function AddConstModal({ isOpen, onClose, onSuccess, baseUrl }: AddEventModalProps) {

    const [eventType, setEventType] = useState('STARTSURVEY');
    const [formData, setFormData] = useState<{ [key: string]: string | number }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [imageFields, setImageFields] = useState<{ [key: string]: ImageFieldState }>({});
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
    const [Users, setUsers] = useState<UsersData[]>([]);
    const [states, setStates] = useState<StateData[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
    const [Gp, setGp] = useState<GpData[]>([]);
    const [Vehical, setVehical] = useState<any[]>([]);
    const [firmname,setFirmName]=useState<MachineDetailsResponse | null>(null);
    const [Selectfirmname,seSelecttFirmName]=useState<string | ''>('');

    const fetchusers = async () => {
        try {
            const response = await axios.get(`${BASEURL}/allusers`);
            setUsers(response.data.data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch data");
        }
    };
   const fetchGps = async (selectedBlock:string) => {
    if (!selectedBlock) return;
    try {
        const response = await axios.get(`${BASEURL}/gpdata`, {
            params: { block_code: selectedBlock }
        });
        setGp(response.data);
    } catch (err:any) {
        setError(err.message || "Failed to fetch data");
    }
};

    const getFirm= async () => {
        try {
           const response = await machineApi.getMachineDetails();
          
            setFirmName(response);
        } catch (err: any) {
            setError(err.message || "Failed to fetch data");
        }
    };
    const getMachines = async (Selectfirmname:string) => {
        try {
            const response = await axios.get(`${baseUrl}/get-machines`,{
                 params: { firm_name: Selectfirmname }
            });
            setVehical(response.data.data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch data");
        }
    };

    useEffect(() => {
         if (!isOpen) return;
        try {

            getStateData().then(data => {
                setStates(data);
            })
        } catch (error) {
            console.error('Error fetching states:', error);

        }

    }, [isOpen])

    useEffect(() => {
        if (selectedState) {

            getDistrictData(selectedState).then(data => {
                setDistricts(data);
            })
        } else {
            setDistricts([])

        }
    }, [selectedState])
    useEffect(() => {
        if (selectedDistrict) {
            getBlockData(selectedDistrict).then(data => {
                setBlocks(data);
            })
        } else {
            setBlocks([])
        }
    }, [selectedDistrict])
     useEffect(() => {
        if (selectedBlock) {
           
            fetchGps(selectedBlock);
        } 
    }, [selectedBlock])
         useEffect(() => {
        if (Selectfirmname) {
           
            getMachines(Selectfirmname);
        } 
    }, [Selectfirmname])

    useEffect(() => {
        if (!isOpen) return;
        fetchusers();
      
        getFirm();
        setFormData((prev) => ({
            ...prev,
            eventType: "STARTSURVEY",
            
        }));
    }, [isOpen]);

    if (!isOpen) return null;

    const fields = getEventSpecificFields() || [];



    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

      
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

          

            if (key.includes('image') || key.includes('Photo')) {
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
                gp_id:0,
                ...formData,
            };

            const imageFieldsWithFiles = Object.entries(imageFields).filter(
                ([_, state]) => state.files.length > 0
            );
            for (const [fieldKey, state] of imageFieldsWithFiles) {
                try {
                    const uploadedPaths = await uploadImages(state.files);

                    if (fieldKey === "vehicle_image") {
                    payload[fieldKey] = uploadedPaths[0] || "";
                    } else {
                    payload[fieldKey] = JSON.stringify(uploadedPaths);
                    }

                } catch (uploadError) {
                    throw new Error(
                    `Failed to upload images for ${fieldKey}: ${
                        uploadError instanceof Error ? uploadError.message : "Unknown error"
                    }`
                    );
                }
                }

          
            const response = await fetch(`${baseUrl}/survey/create`, {
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


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fields.filter(({ key }) => !key.includes('image') && !key.includes('Photo')).map(({ key, label, type, required }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {label}
                                    {required && <span className="text-red-500">*</span>}
                                </label>
                                {key === "user_id" ? (
                                    <select
                                        value={(formData[key] as string) || ""}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select User</option>
                                        {Users.map((user) => (
                                            <option key={user.user_id} value={user.user_id}>
                                                {user.uname}
                                            </option>
                                        ))}
                                    </select>

                                ) : key === "state_id" ? (
                                    <select
                                        value={selectedState || ""}
                                        onChange={(e) => {
                                            setSelectedState(e.target.value);
                                            handleChange("state_id", e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select State</option>
                                        {states.map((state) => (
                                            <option key={state.state_id} value={state.state_id}>
                                                {state.state_name}
                                            </option>
                                        ))}
                                    </select>

                                ) : key === "district_id" ? (
                                    <select
                                        value={selectedDistrict || ""}
                                        onChange={(e) => {
                                            setSelectedDistrict(e.target.value);
                                            handleChange("district_id", e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select District</option>
                                        {districts.map((district) => (
                                            <option key={district.district_id} value={district.district_id}>
                                                {district.district_name}
                                            </option>
                                        ))}
                                    </select>

                                ) : key === "block_id" ? (
                                    <select
                                        value={selectedBlock || ""}
                                        onChange={(e) => {
                                            setSelectedBlock(e.target.value);
                                            handleChange("block_id", e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select Block</option>
                                        {blocks.map((block) => (
                                            <option key={block.block_id} value={block.block_id}>
                                                {block.block_name}
                                            </option>
                                        ))}
                                    </select>
                                   ) : key === "startLocation" ? (
                                    <select
                                       value={(formData[key] as string) || ""}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select Start Gp</option>
                                        {Gp.map((code) => (
                                            <option key={code.id} value={code.id}>
                                                {code.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : key === "endLocation" ? (
                                    <select
                                       value={(formData[key] as string) || ""}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select End Gp</option>
                                        {Gp.map((code) => (
                                            <option key={code.id} value={code.id}>
                                                {code.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : key === "firm" ? (
                                    <select
                                        value={Selectfirmname || ""}
                                        onChange={(e) => {
                                            seSelecttFirmName(e.target.value);
                                            handleChange("firm", e.target.value);
                                        }}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select Firm</option>
                                        {firmname?.firms.map((code) => (
                                            <option key={code.firm_name} value={code.firm_name}>
                                                {code.firm_name}
                                            </option>
                                        ))}
                                    </select>
                                ) : key === "vehicleserialno" ? (
                                    <select
                                         value={(formData[key] as string) || ""}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select Vehicle Serial No</option>
                                        {Vehical.map((code) => (
                                            <option key={code.registration_number} value={code.registration_number}>
                                                {code.registration_number}
                                            </option>
                                        ))}
                                    </select>
                                ) : key === "construction_type" ? (
                                    <select
                                         value={(formData[key] as string) || ""}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        <option value="">Select Construction Type</option>
                                        <option value="Hdd">HDD</option>
                                        <option value="OpenTrench">OpenTrench</option>
                                   </select>
                                    
                                ) : (
                                    <input
                                        type={type}
                                        value={(formData[key] as string | number) || ''}
                                        readOnly={key === "eventType"}
                                        onChange={(e) =>
                                            handleChange(
                                                key,
                                                type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                                            )
                                        }
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors 
                                        ${key === "eventType"
                                                                ? "bg-gray-100 cursor-not-allowed"
                                                                : ""}
                                        ${errors[key]
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
                            .filter(({ key }) => key.includes('image') || key.includes('Photo'))
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
