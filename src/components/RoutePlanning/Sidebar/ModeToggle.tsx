import React from 'react';
import { useAppContext } from '../AppContext';

const ModeToggle: React.FC = () => {
  const {AutoMode,setAutoMode,AIMode,setAIMode } = useAppContext();

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            AutoMode === true
              ? 'bg-[#9D336C] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setAutoMode(!AutoMode)}
        >
          Auto Mode
        </button>
        <button
          className={`py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            AIMode === true
              ? 'bg-[#9D336C] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => setAIMode(!AIMode)}
        >
          AI Mode
        </button>
      </div>

      <button
        className="w-full py-2 px-4 bg-blue-800 hover:bg-blue-900 text-white font-medium rounded-md transition-colors"
      >
        Submit
      </button>
    </div>
  );
};

export default ModeToggle;