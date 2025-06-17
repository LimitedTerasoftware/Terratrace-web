import React from 'react';
import { Map, Globe } from 'lucide-react';

interface KMLVisualizerProps {
  showPlaceholder?: boolean;
}

const KMLVisualizer: React.FC<KMLVisualizerProps> = ({ 
  showPlaceholder = true 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Map className="h-5 w-5 text-blue-500 mr-2" />
          <h2 className="text-sm font-medium text-gray-900">Map Preview</h2>
        </div>
        <div className="text-xs text-gray-500">Preview KML data</div>
      </div>
      
      {showPlaceholder ? (
        <div className="bg-gray-50 h-60 flex flex-col items-center justify-center p-4">
          <Globe className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-sm text-center">
            Upload KML files to view map data
          </p>
          <p className="text-gray-400 text-xs text-center mt-2">
            Geographic visualizations will appear here
          </p>
        </div>
      ) : (
        <div className="h-60 bg-gray-100 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-10 w-10 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2.5"></div>
            <div className="h-3 bg-gray-200 rounded w-36"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KMLVisualizer;