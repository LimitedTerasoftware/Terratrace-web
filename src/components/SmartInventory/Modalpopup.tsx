import axios from "axios";
import { AlertCircle, FilePenLine, Upload } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (desktopFile:File,physicalFile:File,FileName:string,stateId:string,DistrictId:string,BlcokId:string) => void;
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
const BASEURL = import.meta.env.VITE_API_BASE;

const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose, onUpload, isLoading, error }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [desktopFile, setDesktopFile] = useState<File | null>(null);
    const [physicalFile, setPhysicalFile] = useState<File | null>(null);
    const [FileName, setFileName] = useState<string | ''>('');
    const [states, setStates] = useState<StateData[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
    

    useEffect(() => {
        axios.get(`${BASEURL}/states`)
        .then((res) => setStates(res.data.data))
        .catch((err) => console.error(err));
        setDesktopFile(null);
        setPhysicalFile(null);
        setFileName('');
        setSelectedState(null);
        setSelectedDistrict(null);
        setSelectedBlock(null);
    }, []);

    useEffect(() => {
    if (selectedState) {
      axios.get(`${BASEURL}/districtsdata?state_code=${selectedState}`)
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
      axios.get(`${BASEURL}/blocksdata?district_code=${selectedDistrict}`)
        .then((res) => setBlocks(res.data))
        .catch((err) => console.error(err));
    } else {
      setBlocks([]);
      setSelectedBlock(null);
    }
  }, [selectedDistrict]);

    const handleUpload = () => {
        if(desktopFile !== null && physicalFile !== null &&  FileName !== '' && selectedBlock !== null && selectedDistrict !== null && selectedState !==  null){
         onUpload(desktopFile,physicalFile,FileName,selectedState,selectedDistrict,selectedBlock)
        }
        // setDesktopFile(null);
        // setPhysicalFile(null);
        // setFileName('');
        // onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-xl">
                <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
              
                <div className="space-y-4 mb-6">
                    <div className="border rounded-md p-4">
                        
                   <div className="flex items-center gap-8 mb-4">
                        {/* State Filter */}
                        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                            <select
                            value={selectedState || ''}
                            onChange={(e) => {
                                setSelectedState(e.target.value || null);
                            
                            }}
                            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                            <option value="">Select State</option>
                            {states.map((state) => (
                                <option key={state.state_id} value={state.state_id}>
                                {state.state_name}
                                </option>
                            ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            </div>
                        </div>

                        {/* District Filter */}
                        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                            <select
                            value={selectedDistrict || ''}
                            onChange={(e) => {
                                setSelectedDistrict(e.target.value || null);
                                
                            }}
                            disabled={!selectedState}
                            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                            <option value="">Select District</option>
                            {districts.map((district) => (
                                <option key={district.district_id} value={district.district_id}>
                                {district.district_name}
                                </option>
                            ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            </div>
                        </div>

                        {/* Block Filter */}
                        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                            <select
                            value={selectedBlock || ''}
                            onChange={(e) => {
                                setSelectedBlock(e.target.value || null);
                                
                            }}
                            disabled={!selectedDistrict}
                            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                            <option value="">Select Block</option>
                            {blocks.map((block) => (
                                <option key={block.block_id} value={block.block_id}>
                                {block.block_name}
                                </option>
                            ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                            </div>
                        </div>
                    </div>

                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium text-sm">Desktop Survey File</h3>
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

                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium text-sm">Physical Survey File</h3>
                            <span className="text-xs text-gray-500">KML/KMZ</span>
                        </div>
                        <div className="relative mb-4">
                            <input
                                type="file"
                                id="PhysicalFile"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file && (file.name.toLowerCase().endsWith('.kmz') || file.name.toLowerCase().endsWith('.kml'))) {

                                        setPhysicalFile(file)
                                    } else if (file) {
                                        alert('Please select a .kmz or .kml file');
                                    }

                                }}
                                accept=".kmz,.kml"
                            />
                            <label
                                htmlFor="PhysicalFile"
                                className="flex items-center justify-between cursor-pointer text-sm p-2 bg-gray-50 border rounded hover:bg-gray-100 transition-colors"
                            >
                                <span className="truncate">{physicalFile ? physicalFile.name : 'Choose file...'}</span>
                                <Upload size={16} className="text-gray-500" />
                            </label>
                        </div>
                        <div className="justify-between items-center mb-2">
                            <h3 className="font-medium text-sm">File Name</h3>
                        </div>
                        <input
                            type="text"
                            id="FileName"
                            placeholder="Enter file name"
                            className="items-center w-full text-sm p-2 bg-gray-50 border rounded hover:bg-gray-100 transition-colors cursor-text"
                            value={FileName}
                            onChange={(e) => setFileName(e.target.value)}
                        />

                    </div>
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                        onClick={()=>{onClose();setPhysicalFile(null);setDesktopFile(null);setFileName('');  setSelectedState(null);
                        setSelectedDistrict(null);
                        setSelectedBlock(null);}}
                    >
                        Cancel
                    </button>
                    <button
                        className={`flex items-center gap-2 px-4 py-2 rounded  ${isLoading || FileName === '' || physicalFile === null || desktopFile === null
                            ? 'border-blue-200 bg-blue-50 text-black cursor-not-allowed'
                            : 'border-blue-300 bg-blue-950 text-white hover:bg-blue-900 hover:border-blue-400 cursor-pointer'
                            }`}
                        onClick={handleUpload}
                        disabled={FileName === '' || physicalFile === null || desktopFile === null || isLoading}
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
                {error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadModal;
