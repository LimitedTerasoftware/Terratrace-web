import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import SaveIcon from '../../../images/icon/save-file.svg';
import SearchableSelect from '../../Forms/SearchableSelect';

const ModeToggle: React.FC = () => {
  const { AutoMode, setAutoMode, AIMode, setAIMode, SaveFile, setSaveFile, setDownloadFile, DownloadFile ,VerifySaveFile,setVerifySaveFile,previewKmlData} = useAppContext();
  const [format, setFormat] = useState("");

  const handleChange = (value: string) => {
    setFormat(value);
    setDownloadFile(value);
  };
  
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${AutoMode === true
            ? 'bg-[#9D336C] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          onClick={() => { setAutoMode(!AutoMode) }}
        >
          Auto Mode
        </button>
        
        <button
          className={`w-full py-2 px-4 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${SaveFile === true ? 'bg-[#9D336C] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          // REMOVED: disabled={previewKmlData !== null} 
          // Now Save button works in both normal mode and preview mode
          onClick={() => setSaveFile(true)}
        >
          <img src={SaveIcon} alt="Save" className="w-3 h-5" />
          <span>{previewKmlData !== null ? 'Update' : 'Save'}</span>
        </button>
        
        {/* AI Mode - Commented out as requested
        <button
          className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${AIMode === true
            ? 'bg-[#9D336C] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } 
            disabled:opacity-50 disabled:cursor-not-allowed`}
             disabled={previewKmlData !== null} 
          onClick={() => { setAIMode(true); setAutoMode(false) }}
        >
          AI Mode
        </button>
        */}
      </div>
      
      {/*<div className="mb-4">
        <button
          className={`w-full py-2 px-4 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${VerifySaveFile === true ? 'bg-[#9D336C] text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-200'}`}
          disabled={previewKmlData === null} 
          onClick={() => setVerifySaveFile(true)}
        >
          <span>Verify</span>
        </button>
      </div>*/}
      <div className="relative">
              <SearchableSelect
                value={DownloadFile}
                onChange={handleChange}
                options={[
                  { value: 'kml', label: 'KML' },
                  { value: 'csv', label: 'CSV' },
                ]}
                placeholder="Download"
                className={`w-full text-sm font-medium`}
              />

            </div>
    </div>
  );
};

export default ModeToggle;