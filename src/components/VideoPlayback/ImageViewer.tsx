import React from 'react';
import { X } from 'lucide-react';

interface ImageViewerProps {
  images: string[];
  onClose: () => void;
  baseUrl?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, onClose, baseUrl = '' }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (images.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative max-w-3xl w-full mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        >
          <X size={24} />
        </button>
        
        <div className="relative">
          <img
            src={`${baseUrl}${images[currentIndex]}`}
            alt={`Survey image ${currentIndex + 1}`}
            className="max-h-[80vh] w-auto mx-auto rounded-lg object-contain"
          />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 text-white rounded-b-lg">
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                className={`px-4 py-2 rounded ${
                  currentIndex > 0
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
                disabled={currentIndex === 0}
              >
                Previous
              </button>
              
              <span>
                Image {currentIndex + 1} of {images.length}
              </span>
              
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
              >
                {currentIndex === images.length - 1 ? 'Close' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;