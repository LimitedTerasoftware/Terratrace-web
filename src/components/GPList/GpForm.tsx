import React, { useEffect, useState } from 'react'
import { Block, District, GPList, GPListFormData, StateData } from '../../types/survey'
import { Edit3, Plus, X } from 'lucide-react';
import { getBlockData, getDistrictData, getStateData } from '../Services/api';

interface GpFormProps {
    GpList?: GPList;
    onSubmit: (data: GPListFormData) => void;
    onCancel: () => void;
    isEditing?: boolean;
}

const GpForm: React.FC<GpFormProps> = ({
    GpList, onSubmit, onCancel, isEditing = false
}) => {
    const [states, setStates] = useState<StateData[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

    const [formData, setFormData] = useState<GPListFormData>({
        name: "",
        lattitude: "",
        longitude: "",
        type: "",
        blk_code: "",
        blk_name: "",
        dt_code: "",
        dt_name: "",
        st_code: "",
        st_name: "",
        lgd_code: "",
        remark: ""
    })
    const [errors, setErrors] = useState<Partial<GPListFormData>>({});
    const [isExpanded, setIsExpanded] = useState(false);
    useEffect(() => {
        getStateData().then(data => {
            setStates(data);
        })
    }, [])

    useEffect(() => {
        if (selectedState) {
            getDistrictData(selectedState).then(data => {
                setDistricts(data);
                if(formData.dt_code){
                    const DistCode = data.find((Id:District) =>Id.district_code === formData.dt_code);
                    if(DistCode) setSelectedDistrict(DistCode.district_id);

                }

            })

        } else {
            setDistricts([])
        }
    }, [selectedState,formData.st_code])
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
        if (GpList) {
            setFormData({
                name: GpList.name,
                lattitude: GpList.lattitude,
                longitude: GpList.longitude,
                type: GpList.type,
                blk_code: GpList.blk_code,
                blk_name: GpList.blk_name,
                dt_code: GpList.dt_code,
                dt_name: GpList.dt_name,
                st_code: GpList.st_code,
                st_name: GpList.st_name,
                lgd_code: GpList.lgd_code,
                remark: GpList.remark
            })
            const stateCode = states.find(Id=>Id.state_code === GpList?.st_code);
            if(stateCode) setSelectedState(stateCode?.state_id);
        }else{
              setFormData({
                    name: "",
                    lattitude: "",
                    longitude: "",
                    type: "",
                    blk_code: "",
                    blk_name: "",
                    dt_code: "",
                    dt_name: "",
                    st_code: "",
                    st_name: "",
                    lgd_code: "",
                    remark: ""
                })
            
        }
    }, [GpList])
    const handleChange = (field: keyof GPListFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };
    const validateForm = (): boolean => {
        const newErrors: Partial<GPListFormData> = {};

        if (!formData.name.trim()) newErrors.name = 'GP name is required';
        if (!formData.lattitude.trim()) newErrors.lattitude = 'Lattitude is required';
        if (formData.lattitude.trim()) {
            const lat = parseFloat(formData.lattitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                newErrors.lattitude = 'Latitude must be a number between -90 and 90';
            }
        }
        if (!formData.longitude.trim()) newErrors.longitude = 'Longitude is required';
        if (formData.longitude.trim()) {
            const lng = parseFloat(formData.longitude);
            if (isNaN(lng) || lng < -180 || lng > 180) {
                newErrors.longitude = 'Longitude must be a number between -180 and 180';
            }
        }
        if (!formData.type.trim()) newErrors.type = 'Type is required';
        if (!formData.st_code.trim()) newErrors.st_code = 'State is required';
        if (!formData.dt_code.trim()) newErrors.dt_code = 'District is required';
        if (!formData.blk_code.trim()) newErrors.blk_code = 'Block is required';
        if (!formData.lgd_code.trim()) newErrors.lgd_code = 'LGD Code is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
            if (!isEditing) {
                setFormData({
                    name: "",
                    lattitude: "",
                    longitude: "",
                    type: "",
                    blk_code: "",
                    blk_name: "",
                    dt_code: "",
                    dt_name: "",
                    st_code: "",
                    st_name: "",
                    lgd_code: "",
                    remark: ""
                })
            }

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
                            {isEditing ? 'Edit GPList' : 'Add New GP'}
                        </h2>
                    </div>
                </button>
            </div>


            {(isExpanded || isEditing) && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            {isEditing ? (
                                <Edit3 className="w-6 h-6 text-blue-600" />
                            ) : (
                                <Plus className="w-6 h-6 text-green-600" />
                            )}
                            <h2 className="text-xl font-semibold text-gray-900">
                                {isEditing ? 'Edit GP' : 'Add New GP'}
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
                                    State
                                </label>
                                <select
                                    value={formData.st_code || ''}
                                    onChange={(e) => {
                                        handleChange("st_code", e.target.value);
                                        const name = states.find((state) => state.state_code === e.target.value);
                                        if (name) {
                                            handleChange('st_name', name?.state_name);
                                            setSelectedState(name?.state_id)
                                        }
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">All States</option>
                                    {states.map((state) => (
                                        <option key={state.state_code} value={state.state_code}>
                                            {state.state_name}
                                        </option>
                                    ))}
                                </select>


                                {errors.st_code && (
                                    <p className="mt-1 text-sm text-red-600">{errors.st_code}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    District
                                </label>
                                <select
                                    value={formData.dt_code || ''}
                                    onChange={(e) => {
                                        handleChange("dt_code", e.target.value);
                                        const name = districts.find((district) => district.district_code === e.target.value);
                                        if (name) {
                                            handleChange('dt_name', name?.district_name);
                                            setSelectedDistrict(name?.district_id)
                                        }
                                    }}
                                    disabled={!formData.st_code}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50  disabled:cursor-not-allowed"
                                >
                                    <option value="">All Districts</option>
                                    {districts.map((district) => (
                                        <option key={district.district_code} value={district.district_code}>
                                            {district.district_name}
                                        </option>
                                    ))}
                                </select>


                                {errors.dt_code && (
                                    <p className="mt-1 text-sm text-red-600">{errors.dt_code}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Block
                                </label>
                                <select
                                    value={formData.blk_code || ''}
                                    onChange={(e) => {
                                        handleChange("blk_code", e.target.value);
                                        const name = blocks.find((block) => block.block_code === e.target.value);
                                        if (name) {
                                            handleChange('blk_name', name?.block_name);
                                            setSelectedBlock(name?.block_id)
                                        }
                                    }}
                                    disabled={!formData.dt_code}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all  disabled:opacity-50  disabled:cursor-not-allowed"
                                >
                                    <option value="">All Blocks</option>
                                    {blocks.map((block) => (
                                        <option key={block.block_code} value={block.block_code}>
                                            {block.block_name}
                                        </option>
                                    ))}
                                </select>


                                {errors.blk_code && (
                                    <p className="mt-1 text-sm text-red-600">{errors.blk_code}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleChange('type', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                >
                                    <option value="">Select Type</option>
                                    <option value="ONT">ONT</option>
                                    <option value="BHQ">BHQ</option>
                                    <option value="GP">GP</option>
                                    <option value="OLT">OLT</option>
                                    <option value="FPOI">FPOI</option>
                                </select>
                                {errors.type && (
                                    <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    GP Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Enter GP name" />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    LGD Code
                                </label>
                                <input
                                    type="text"
                                    value={formData.lgd_code}
                                    onChange={(e) => handleChange('lgd_code', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.lgd_code ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Enter LGD code" />
                                {errors.lgd_code && (
                                    <p className="mt-1 text-sm text-red-600">{errors.lgd_code}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Lattitude
                                </label>
                                <input
                                    type="text"
                                    value={formData.lattitude}
                                    onChange={(e) => handleChange('lattitude', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.lattitude ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Enter lattitude" />
                                {errors.lattitude && (
                                    <p className="mt-1 text-sm text-red-600">{errors.lattitude}</p>
                                )}

                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Longitude
                                </label>
                                <input
                                    type="text"
                                    value={formData.longitude}
                                    onChange={(e) => handleChange('longitude', e.target.value)}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.longitude ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="Enter longitude" />
                                {errors.longitude && (
                                    <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>
                                )}
                            </div>



                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Remarks
                            </label>
                            <textarea
                                value={formData.remark}
                                onChange={(e) => handleChange('remark', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all border-gray-300`}
                                placeholder="Enter Remarks"

                            />

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
                                {isEditing ? 'Update GP' : 'Add GP'}
                            </button>
                        </div>
                    </form>
                </div>
            )}</>
    )
}

export default GpForm