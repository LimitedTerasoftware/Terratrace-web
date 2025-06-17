import React from 'react';
import { HelpCircle, Link, AlertCircle, MapPin } from 'lucide-react';

const KMLHelpCard: React.FC = () => {
  return (
    <div className="bg-blue-50 rounded-lg border border-blue-100 p-5">
      <div className="flex items-center mb-3">
        <HelpCircle className="h-5 w-5 text-blue-500 mr-2" />
        <h3 className="font-medium text-blue-900">About KML Files</h3>
      </div>
      
      <p className="text-sm text-blue-800 mb-4">
        KML (Keyhole Markup Language) is an XML-based file format used to display geographic data in applications like Google Earth and Google Maps.
      </p>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-start">
          <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span className="ml-2 text-blue-800">
            Contains geographical features like placemarks, images, polygons, and 3D models
          </span>
        </div>
        
        <div className="flex items-start">
          <Link className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span className="ml-2 text-blue-800">
            Can include styles to specify feature appearance
          </span>
        </div>
        
        <div className="flex items-start">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <span className="ml-2 text-blue-800">
            Maximum recommended file size: 10MB for optimal processing
          </span>
        </div>
      </div>
    </div>
  );
};

export default KMLHelpCard;