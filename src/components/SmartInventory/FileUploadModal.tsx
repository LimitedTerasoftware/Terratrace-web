import axios from "axios";
import { AlertCircle, FilePenLine, Upload } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { getAuthHeaders } from "../../utils/accessControl";
import SearchableSelect from "../Forms/SearchableSelect";

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (desktopFile: File, FileName: string, stateId: string, DistrictId: string, BlockId: string, category: string) => void;
    isLoading: boolean;
    error?: string;
}

interface StateData {
  state_id: string;
  state_name: string;
  state_code: string;
}

interface District {
  district_id: string;
  district_name: string;
  state_code: string;
}

interface Block {
  block_id: string;
  block_name: string;
  district_code: string;
}

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose, onUpload, isLoading, error }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [desktopFile, setDesktopFile] = useState<File | null>(null);
    const [physicalFile, setPhysicalFile] = useState<File | null>(null);
    const [FileName, setFileName] = useState<string | ''>('');
    const [category, setCategory] = useState<string>(''); // New category state
    const [states, setStates] = useState<StateData[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
    
    // Updated category options to include BSNL
    const categoryOptions = [
        { value: 'Survey', label: 'Survey' },
        { value: 'Desktop', label: 'Desktop' },
        { value: 'BSNL_Cables', label: 'O & M' }
    ];

    useEffect(() => {
        axios.get(`${TraceBASEURL}/states`, { headers: getAuthHeaders() })
        .then((res) => setStates(res.data.data))
        .catch((err) => console.error(err));
        setDesktopFile(null);
        setPhysicalFile(null);
        setFileName('');
        setCategory(''); // Reset category
        setSelectedState(null);
        setSelectedDistrict(null);
        setSelectedBlock(null);
    }, []);

    useEffect(() => {
        if (selectedState) {
            axios.get(`${TraceBASEURL}/districtsdata?state_code=${selectedState}`, { headers: getAuthHeaders() })
                .then((res) => setDistricts(res.data))
                .catch((err) => console.error(err));
        } else {
            setDistricts([]);
            setSelectedDistrict(null);
        }
    }, [selectedState]);

    // Fetch blocks when district is selected
    useEffect(() => {
        if (selectedDistrict) {
            axios.get(`${TraceBASEURL}/blocksdata?district_code=${selectedDistrict}`, { headers: getAuthHeaders() })
                .then((res) => setBlocks(res.data))
                .catch((err) => console.error(err));
        } else {
            setBlocks([]);
            setSelectedBlock(null);
        }
    }, [selectedDistrict]);

    const handleUpload = () => {
        if(desktopFile !== null && FileName !== '' && category !== '' && selectedBlock !== null && selectedDistrict !== null && selectedState !== null) {
            onUpload(desktopFile, FileName, selectedState, selectedDistrict, selectedBlock, category);
        }
    };

    const handleClose = () => {
        onClose();
        setPhysicalFile(null);
        setDesktopFile(null);
        setFileName('');
        setCategory(''); // Reset category on close
        setSelectedState(null);
        setSelectedDistrict(null);
        setSelectedBlock(null);
    };

    // Check if form is valid
    const isFormValid = desktopFile !== null && FileName !== '' && category !== '' && selectedBlock !== null && selectedDistrict !== null && selectedState !== null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-xl">
                <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
              
                <div className="space-y-4 mb-6">
                    <div className="border rounded-md p-4">
                        
                        {/* Category Selection */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                            <div className="relative">
                                <SearchableSelect
                                    value={category}
                                    onChange={setCategory}
                                    options={categoryOptions}
                                    placeholder="Select Category"
                                    className="text-sm"
                                />
                            </div>
                        </div>

                        {/* Location Selectors */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* State Filter */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-700 mb-1">State *</label>
                                <SearchableSelect
                                    value={selectedState || ''}
                                    onChange={(value) => {
                                        setSelectedState(value || null);
                                    }}
                                    options={states.map((state) => ({ value: String(state.state_id), label: state.state_name }))}
                                    placeholder="Select State"
                                    className="text-sm"
                                />
                            </div>

                            {/* District Filter */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-700 mb-1">District *</label>
                                <SearchableSelect
                                    value={selectedDistrict || ''}
                                    onChange={(value) => {
                                        setSelectedDistrict(value || null);
                                    }}
                                    disabled={!selectedState}
                                    options={districts.map((district) => ({ value: String(district.district_id), label: district.district_name }))}
                                    placeholder="Select District"
                                    className="text-sm"
                                />
                            </div>

                            {/* Block Filter */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Block *</label>
                                <SearchableSelect
                                    value={selectedBlock || ''}
                                    onChange={(value) => {
                                        setSelectedBlock(value || null);
                                    }}
                                    disabled={!selectedDistrict}
                                    options={blocks.map((block) => ({ value: String(block.block_id), label: block.block_name }))}
                                    placeholder="Select Block"
                                    className="text-sm"
                                />
                            </div>
                        </div>

                        {/* File Upload */}
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium text-sm">File *</h3>
                            <span className="text-xs text-gray-500">KML/KMZ</span>
                        </div>
                        <div className="relative mb-4">
                            <input
                                type="file"
                                id="DeskTopFile"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file && (file.name.toLowerCase().endsWith('.kmz') || file.name.toLowerCase().endsWith('.kml'))) {
                                        setDesktopFile(file)
                                    } else if (file) {
                                        alert('Please select a .kmz or .kml file');
                                    }
                                }}
                                accept=".kmz,.kml"
                            />
                            <label
                                htmlFor="DeskTopFile"
                                className="flex items-center justify-between cursor-pointer text-sm p-2 bg-gray-50 border rounded hover:bg-gray-100 transition-colors"
                            >
                                <span className="truncate">{desktopFile ? desktopFile.name : 'Choose file...'}</span>
                                <Upload size={16} className="text-gray-500" />
                            </label>
                        </div>

                        {/* File Name */}
                        <div className="justify-between items-center mb-2">
                            <h3 className="font-medium text-sm">File Name *</h3>
                        </div>
                        <input
                            type="text"
                            id="FileName"
                            placeholder="Enter file name"
                            className="w-full text-sm p-2 bg-gray-50 border rounded focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                            value={FileName}
                            onChange={(e) => setFileName(e.target.value)}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                    <button
                        className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                            isLoading || !isFormValid
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-950 text-white hover:bg-blue-900 cursor-pointer'
                        }`}
                        onClick={handleUpload}
                        disabled={!isFormValid || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4" />
                                Upload
                            </>
                        )}
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadModal