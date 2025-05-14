import React from 'react';
import { Car, Bike, PersonStanding } from 'lucide-react';
import { useAppContext } from '../AppContext';

const TransportModes: React.FC = () => {
  const { transportMode, setTransportMode } = useAppContext();

  return (
    <div className="mb-6">
      <div className="flex bg-gray-100 rounded-md p-1 mb-2">
        <button
          className={`flex items-center justify-center flex-1 py-2 rounded-md transition-colors ${
            transportMode === 'car' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
          }`}
          onClick={() => setTransportMode('car')}
          aria-label="Car"
        >
          <Car size={18} className={transportMode === 'car' ? 'text-blue-700' : 'text-gray-600'} />
        </button>
        <button
          className={`flex items-center justify-center flex-1 py-2 rounded-md transition-colors ${
            transportMode === 'bike' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
          }`}
          onClick={() => setTransportMode('bike')}
          aria-label="Bike"
        >
          <Bike size={18} className={transportMode === 'bike' ? 'text-blue-700' : 'text-gray-600'} />
        </button>
        <button
          className={`flex items-center justify-center flex-1 py-2 rounded-md transition-colors ${
            transportMode === 'walk' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
          }`}
          onClick={() => setTransportMode('walk')}
          aria-label="Walk"
        >
          <PersonStanding size={18} className={transportMode === 'walk' ? 'text-blue-700' : 'text-gray-600'} />
        </button>
      </div>
    </div>
  );
};

export default TransportModes;