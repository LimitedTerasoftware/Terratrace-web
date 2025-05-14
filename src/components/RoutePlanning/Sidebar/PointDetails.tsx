import React from 'react';
import { useAppContext } from '../AppContext';

interface PointDetail {
  label: string;
  value: string;
}

const PointDetails: React.FC = () => {
  const {PointProperties} = useAppContext()

  return (
  <div className="border rounded-md p-4">
  <h3 className="font-medium text-sm mb-3 text-blue-800">
    {PointProperties != null ? PointProperties.name : 'Point Details'}
  </h3>

  <div className="space-y-2 overflow-x-auto">
    <div className="min-w-[600px]">
      {PointProperties != null ? (
        Object.entries(PointProperties.properties).map(([key, value], index) => (
          <div key={index}>
            <div className="flex text-sm gap-4">
              <div className="w-25 text-gray-900 font-medium whitespace-nowrap">{key}</div>
              <div className="text-gray-600  truncate">
                {value !== 'NULL' ? String(value) : '-'}
              </div>
            </div>
            <hr />
          </div>
        ))
      ) : (
        <div>Hover over a marker to view details.</div>
      )}
    </div>
  </div>
</div>

  );
};

export default PointDetails;