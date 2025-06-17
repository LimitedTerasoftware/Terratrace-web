import React from 'react';
import { MapPin, Layers, Info, Settings } from 'lucide-react';

interface KMLMetadataProps {
  showPlaceholder?: boolean;
}

const KMLMetadata: React.FC<KMLMetadataProps> = ({ 
  showPlaceholder = true 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-4">KML File Information</h2>
      
      {showPlaceholder ? (
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <MapPin className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Placemarks</h3>
              <p className="text-sm text-gray-500">Upload KML files to see placemark information</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <Layers className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Layers</h3>
              <p className="text-sm text-gray-500">Layer details will appear here</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <Info className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Additional Info</h3>
              <p className="text-sm text-gray-500">Geographic data and other details</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              <Settings className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Processing Options</h3>
              <p className="text-sm text-gray-500">Options for KML processing will appear here</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-gray-400">
          <p>Select a KML file to view metadata</p>
        </div>
      )}
    </div>
  );
};

export default KMLMetadata;