import React from 'react';
import { X, Play } from 'lucide-react';
import { ProcessedPhysicalSurvey } from './PlaceMark';

interface LandmarkModalProps {
  isOpen: boolean;
  landmarks: ProcessedPhysicalSurvey[];
  onClose: () => void;
  onContinueVideo: () => void;
  currentPosition?: { lat: number; lng: number };
}

export const LandmarkModal: React.FC<LandmarkModalProps> = ({ 
  isOpen,
  landmarks,
  onClose,
  onContinueVideo,
  currentPosition
}) => {
  if (!isOpen || landmarks.length === 0) return null;
  
  const landmark = landmarks[0]; // Show first landmark if multiple
  
  const handleContinueVideo = () => {
    onContinueVideo();
  };
  
  const handleClose = () => {
    onClose();
  };
  
  // Handle escape key
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Landmark Detected</h3>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-800 transition-colors p-1 rounded"
            title="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Type:</span> 
            <span className="text-gray-900">{landmark.eventType || landmark.category}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Survey ID:</span> 
            <span className="text-gray-900">{landmark.surveyId}</span>
          </div>
          
          {landmark.blockId && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Block ID:</span> 
              <span className="text-gray-900">{landmark.blockId}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Location:</span> 
            <span className="text-gray-900 font-mono text-sm">
              {landmark.coordinates.lat.toFixed(6)}, {landmark.coordinates.lng.toFixed(6)}
            </span>
          </div>
          
          {landmarks.length > 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="text-blue-800 text-sm font-medium">
                Multiple landmarks detected ({landmarks.length} total)
              </div>
              <div className="text-blue-600 text-xs mt-1">
                {landmarks.slice(1).map(l => l.eventType || l.category).join(', ')}
              </div>
            </div>
          )}
          
          {/* Images Section - Only show if images exist */}
          {landmark.hasImages && landmark.images && landmark.images.length > 0 && (
            <div>
              <div className="font-medium text-gray-700 mb-2">Images ({landmark.images.length}):</div>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {landmark.images.slice(0, 4).map((image, idx) => (
                  <div key={idx} className="relative">
                    <img 
                      src={image.url} 
                      alt={image.label}
                      className="w-full h-20 object-cover rounded border hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(image.url, '_blank')}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 rounded-b">
                      {image.label}
                    </div>
                  </div>
                ))}
              </div>
              {landmark.images.length > 4 && (
                <div className="text-xs text-gray-500 mt-1 text-center">
                  +{landmark.images.length - 4} more images
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleContinueVideo}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 font-medium"
          >
            <Play size={16} />
            <span>Continue Video</span>
          </button>
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};