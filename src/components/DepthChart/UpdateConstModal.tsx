import { useState, useEffect, useRef } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { Block, District, StateData, UpdateSurveyPayload } from '../../types/survey';
import axios from 'axios';
import {
  getBlockData,
  getDistrictData,
  getFirms,
  getMachineOptions,
  getStateData,
  updateSurvey,
} from '../Services/api';
import { Machine } from '../../types/machine';
import { Firm } from '../../types/firm';
import { UGConstructionSurveyData } from '../../types/survey';

interface FormErrors {
  [key: string]: string;
}

interface UpdateConstModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  surveyData: UGConstructionSurveyData | null;
}

interface UsersData {
  user_id: string | number;
  uname: string;
  email: string;
  version: string;
  is_active: string;
  company_id: string;
  machine_id: string;
}

interface GpData {
  id: number;
  name: string;
  lattitude: string;
  longitude: string;
  type: string;
  blk_code: number;
  blk_name: string;
  dt_code: number;
  dt_name: string;
  st_code: number;
  st_name: string;
  lgd_code: number;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

const BASEURL = import.meta.env.VITE_API_BASE;

export function UpdateConstModal({
  isOpen,
  onClose,
  onSuccess,
  surveyData,
}: UpdateConstModalProps) {
  const [formData, setFormData] = useState<{ [key: string]: string | number | null }>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [Users, setUsers] = useState<UsersData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [Gp, setGp] = useState<GpData[]>([]);
  const [Vehical, setVehical] = useState<Machine[]>([]);
  const [firmname, setFirmName] = useState<Firm[] | []>([]);
  const [Selectfirmname, seSelecttFirmName] = useState<string | ''>('');

  const fetchusers = async () => {
    try {
      const response = await axios.get(`${BASEURL}/allusers`);
      setUsers(response.data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    }
  };

  const fetchGps = async (selectedBlock: string) => {
    if (!selectedBlock) return;
    try {
      const response = await axios.get(`${BASEURL}/gpdata`, {
        params: { block_code: selectedBlock },
      });
      setGp(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    }
  };

  const getFirm = async () => {
    try {
      const response = await getFirms();
      setFirmName(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    }
  };

  const getMachines = async (Selectfirmname: string) => {
    try {
      const response = await getMachineOptions(Selectfirmname);
      setVehical(response);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    getStateData().then((data) => setStates(data));
  }, [isOpen]);

  useEffect(() => {
    if (selectedState) {
      getDistrictData(selectedState).then((data) => setDistricts(data));
    } else {
      setDistricts([]);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) {
      getBlockData(selectedDistrict).then((data) => setBlocks(data));
    } else {
      setBlocks([]);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedBlock) {
      fetchGps(selectedBlock);
    }
  }, [selectedBlock]);

  useEffect(() => {
    if (Selectfirmname) {
      getMachines(Selectfirmname);
    }
  }, [Selectfirmname]);

  useEffect(() => {
    if (!isOpen) return;
    fetchusers();
    getFirm();
  }, [isOpen]);

  useEffect(() => {
    if (surveyData && isOpen) {
      setFormData({
        id: surveyData.id,
        user_id: surveyData.user_id || '',
        company_id: surveyData.company_id || null,
        state_id: surveyData.state_id || '',
        district_id: surveyData.district_id || '',
        block_id: surveyData.block_id || '',
        gp_id: surveyData.gp_id || 0,
        startLocation: surveyData.startLocation?.toString() || '',
        endLocation: surveyData.endLocation?.toString() || '',
        construction_type: surveyData.construction_type || '',
        machine_id: (surveyData as any).machine_id || '',
        workType: surveyData.workType || '',
        cableType: surveyData.cableType || '',
        created_at: surveyData.created_at || '',
      });
      setSelectedState(surveyData.state_id?.toString() || null);
      setSelectedDistrict(surveyData.district_id?.toString() || null);
      setSelectedBlock(surveyData.block_id?.toString() || null);
      if ((surveyData as any).firm_id) {
        seSelecttFirmName((surveyData as any).firm_id.toString());
      }
    }
  }, [surveyData, isOpen]);

  if (!isOpen) return null;

  const fields = [
    { key: 'user_id', label: 'Surveyor Name', type: 'text', required: true },
    { key: 'state_id', label: 'State', type: 'text', required: true },
    { key: 'district_id', label: 'District', type: 'text', required: true },
    { key: 'block_id', label: 'Block', type: 'text', required: true },
    { key: 'startLocation', label: 'Start Gp', type: 'text', required: true },
    { key: 'endLocation', label: 'End Gp', type: 'text', required: true },
    // { key: 'firm', label: 'Firm Name', type: 'text', required: true },
    // { key: 'vehicleserialno', label: 'Vehicle', type: 'text', required: true },
    {
      key: 'construction_type',
      label: 'Construction Type',
      type: 'text',
      required: true,
    },
    { key: 'workType', label: 'Work Type', type: 'text', required: true },
    { key: 'cableType', label: 'Cable Type', type: 'text', required: true },
    { key: 'created_at', label: 'Created At', type: 'text', required: false },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    fields.forEach(({ key, required }) => {
      const value = formData[key];
      if (
        required &&
        (!value || (typeof value === 'string' && value.trim() === ''))
      ) {
        newErrors[key] = 'This field is required';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
const formatForInput = (value: string) => {
  if (!value) return '';
  return value.replace(' ', 'T').slice(0, 16);
};
const formatForApi = (value: string) => {
  if (!value) return '';

  if (value.includes('Z')) {
    const d = new Date(value);

    const pad = (n: number) => String(n).padStart(2, '0');

    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  if (value.includes('T')) {
    return value.replace('T', ' ') + ':00';
  }

  return value;
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload: UpdateSurveyPayload = {
        id: formData.id as  number,
        user_id: formData.user_id as number,
        company_id:
          (formData.company_id as number ),
        state_id: formData.state_id as  number,
        district_id: formData.district_id as  number,
        block_id: formData.block_id as  number,
        gp_id: formData.gp_id as  number,
        startLocation: formData.startLocation as number,
        endLocation: formData.endLocation as number,
        construction_type: formData.construction_type as string,
          workType: formData.workType as string,
          cableType: formData.cableType as string,
        machine_id:
          (formData.machine_id as  number),
        created_at: formatForApi(formData.created_at as string) as string,
      };

      await updateSurvey(payload);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update survey');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-900">
            Update Survey
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map(({ key, label, required }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {label}
                  {required && <span className="text-red-500">*</span>}
                </label>
                {key === 'user_id' ? (
                  <select
                    value={(formData[key] as string) || ''}
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
                ) : key === 'state_id' ? (
                  <select
                    value={selectedState || ''}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      handleChange('state_id', e.target.value);
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
                ) : key === 'district_id' ? (
                  <select
                    value={selectedDistrict || ''}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      handleChange('district_id', e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option
                        key={district.district_id}
                        value={district.district_id}
                      >
                        {district.district_name}
                      </option>
                    ))}
                  </select>
                ) : key === 'block_id' ? (
                  <select
                    value={selectedBlock || ''}
                    onChange={(e) => {
                      setSelectedBlock(e.target.value);
                      handleChange('block_id', e.target.value);
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
                ) : key === 'startLocation' ? (
                  <select
                    value={(formData[key] as string) || ''}
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
                ) : key === 'endLocation' ? (
                  <select
                    value={(formData[key] as string) || ''}
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
                ) : key === 'firm' ? (
                  <select
                    value={Selectfirmname || ''}
                    onChange={(e) => {
                      seSelecttFirmName(e.target.value);
                      handleChange('firm', e.target.value);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Firm</option>
                    {firmname.map((code) => (
                      <option key={code.id} value={code.id}>
                        {code.firm_name}
                      </option>
                    ))}
                  </select>
                ) : key === 'vehicleserialno' ? (
                  <select
                    value={(formData[key] as string) || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Vehicle</option>
                    {Vehical.map((code) => (
                      <option
                        key={code.registration_number}
                        value={code.registration_number}
                      >
                        {code.registration_number}
                      </option>
                    ))}
                  </select>
                ) : key === 'construction_type' ? (
                  <select
                    value={(formData[key] as string) || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Construction Type</option>
                    <option value="Hdd">HDD</option>
                    <option value="OpenTrench">OpenTrench</option>
                  </select>
                ) : key === 'workType' ? (
                    <select
                      value={(formData[key] as string) || ''}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select Work Type</option>
                      <option value="New Construction">New Construction</option>
                      <option value="Rectification">Rectification</option>
                    </select>
                  ): 
                 key === 'created_at' ? (
                  <input
                  type="datetime-local"
                  value={formData[key] ? formatForInput(formData[key] as string) : ''}
                  onChange={(e) =>
                    handleChange(key, e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    errors[key] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                ) : (
                  <input
                    type="text"
                    value={(formData[key] as string | number) || ''}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      errors[key] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                )}
                {errors[key] && (
                  <div className="mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-600">{errors[key]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">
                Survey updated successfully!
              </p>
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Update Survey
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
