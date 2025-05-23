import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import SaveIcon from '../../../images/icon/save-file.svg';

const ModeToggle: React.FC = () => {
  const { AutoMode, setAutoMode, AIMode, setAIMode, SaveFile, SetSaveFile, SetDownloadFile, DownloadFile } = useAppContext();
  const [format, setFormat] = useState("");

  const handleChange = (e: any) => {
    setFormat(e.target.value);
    SetDownloadFile(e.target.value);
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
          className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${AIMode === true
            ? 'bg-[#9D336C] text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } `}
          onClick={() => { setAIMode(true); setAutoMode(false) }}
        >
          AI Mode
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          className={`w-full py-2 px-4
          text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2
            ${SaveFile === true
                    ? 'bg-[#9D336C] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`
                }
                onClick={() => SetSaveFile(true)}
        >
          <img src={SaveIcon} alt="Save" className="w-3 h-5" />
          <span>Save</span>
        </button>

        <div className="relative">
          <select
            value={DownloadFile}
            onChange={handleChange}
            className={`w-full py-2 px-4 text-sm font-medium rounded-md transition-colors appearance-none items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200
       `}
          >
            <option value='' disabled>
               Download
            </option>
            <option value="kml">KML</option>
            <option value="csv">CSV</option>
          </select>

        </div>
      </div>

    </div>
  );
};

export default ModeToggle;