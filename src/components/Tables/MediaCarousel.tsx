import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Video } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  label: string;
}

interface MediaCarouselProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  initialIndex?: number;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({
  isOpen,
  onClose,
  mediaItems,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || mediaItems.length === 0) return null;

  const currentItem = mediaItems[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div
        className="relative w-full max-w-5xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X size={32} />
        </button>

        {/* Media Container */}
        <div className="bg-black rounded-lg overflow-hidden">
          <div className="relative" style={{ minHeight: '350px', maxHeight: '60vh' }}>
            {currentItem.type === 'image' ? (
              <img
                src={currentItem.url}
                alt={currentItem.label}
                className="w-full h-full object-contain"
                style={{ maxHeight: '60vh' }}
              />
            ) : (
              <video
                src={currentItem.url}
                controls
                className="w-full h-full object-contain"
                style={{ maxHeight: '60vh' }}
              />
            )}
          </div>

          {/* Navigation Arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 transition-all"
              >
                <ChevronLeft size={24} className="text-gray-800" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 transition-all"
              >
                <ChevronRight size={24} className="text-gray-800" />
              </button>
            </>
          )}

          {/* Media Info Footer */}
          <div className="bg-gray-900 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {currentItem.type === 'image' ? (
                  <ImageIcon size={20} className="text-blue-400" />
                ) : (
                  <Video size={20} className="text-purple-400" />
                )}
                <span className="text-sm font-medium">{currentItem.label}</span>
              </div>
              <div className="text-sm text-gray-400">
                {currentIndex + 1} / {mediaItems.length}
              </div>
            </div>
          </div>

          {/* Thumbnail Navigation */}
          {mediaItems.length > 1 && (
            <div className="bg-gray-800 p-4">
              <div className="flex gap-2 overflow-x-auto">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                      index === currentIndex
                        ? 'border-blue-500 scale-110'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {item.type === 'image' ? (
                      <img
                        src={item.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <Video size={24} className="text-purple-400" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Keyboard Hints */}
        {mediaItems.length > 1 && (
          <div className="absolute -bottom-12 left-0 right-0 text-center text-white text-sm opacity-60">
            Use ← → arrow keys to navigate | ESC to close
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaCarousel;