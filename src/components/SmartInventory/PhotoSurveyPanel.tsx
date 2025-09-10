import React, { useState, useCallback, useMemo } from 'react';
import { PhotoSurveyService, PhotoPoint, PhotoImage } from './PhotoSurveyService';

interface PhotoSurveyPanelProps {
  open: boolean;
  onClose: () => void;
  
  // Current photo point being viewed
  currentPhotoPoint: PhotoPoint | null;
  onPhotoPointChange?: (point: PhotoPoint | null) => void;
  
  // All available photo points for navigation
  availablePhotoPoints: PhotoPoint[];
  
  // Current image index within the photo point
  currentImageIndex: number;
  onImageIndexChange: (index: number) => void;
  
  // Photo point summary information
  photoSummary?: React.ReactNode;
}

// Helper function to format timestamp
function formatDateTime(timestamp: number): string {
  if (!Number.isFinite(timestamp)) return '--:--:--';
  const date = new Date(timestamp);
  return date.toLocaleString();
}

// Image viewer component
const PhotoViewer = React.memo(function PhotoViewer({
  image,
  onLoad,
  onError
}: {
  image: PhotoImage;
  onLoad?: () => void;
  onError?: () => void;
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
    onError?.();
  }, [onError]);

  const handleImageClick = useCallback(() => {
    // Open image in new tab for full view
    window.open(image.url, '_blank');
  }, [image.url]);

  return (
    <div className="relative w-full bg-gray-100 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}
      
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
          <div className="text-2xl mb-2">📷</div>
          <div className="text-sm text-center px-4">
            <div className="font-medium">Failed to load image</div>
            <div className="text-xs mt-1 break-all">{image.label}</div>
          </div>
        </div>
      )}
      
      <img
        src={image.url}
        alt={image.label}
        className={`w-full h-full object-contain cursor-pointer transition-opacity ${
          imageLoading || imageError ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        onClick={handleImageClick}
        title="Click to view full size"
      />
      
      {/* Image overlay info */}
      {!imageLoading && !imageError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="text-white text-sm font-medium">{image.label}</div>
          {image.coordinates && (
            <div className="text-white/80 text-xs">
              📍 {image.coordinates.lat.toFixed(6)}, {image.coordinates.lng.toFixed(6)}
            </div>
          )}
          {image.timestamp && (
            <div className="text-white/80 text-xs">
              🕒 {formatDateTime(image.timestamp)}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function PhotoSurveyPanel(props: PhotoSurveyPanelProps) {
  const {
    open,
    onClose,
    currentPhotoPoint,
    onPhotoPointChange,
    availablePhotoPoints,
    currentImageIndex,
    onImageIndexChange,
    photoSummary
  } = props;

  const [showMetadata, setShowMetadata] = useState(false);

  // Current image from current photo point
  const currentImage = useMemo(() => {
    if (!currentPhotoPoint || !currentPhotoPoint.images.length) return null;
    return currentPhotoPoint.images[currentImageIndex] || currentPhotoPoint.images[0];
  }, [currentPhotoPoint, currentImageIndex]);

  // Navigation helpers
  const currentPhotoIndex = useMemo(() => {
    if (!currentPhotoPoint) return -1;
    return availablePhotoPoints.findIndex(p => p.id === currentPhotoPoint.id);
  }, [currentPhotoPoint, availablePhotoPoints]);

  // Navigation handlers
  const handlePreviousImage = useCallback(() => {
    if (!currentPhotoPoint || currentPhotoPoint.images.length <= 1) return;
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : currentPhotoPoint.images.length - 1;
    onImageIndexChange(newIndex);
  }, [currentPhotoPoint, currentImageIndex, onImageIndexChange]);

  const handleNextImage = useCallback(() => {
    if (!currentPhotoPoint || currentPhotoPoint.images.length <= 1) return;
    const newIndex = currentImageIndex < currentPhotoPoint.images.length - 1 ? currentImageIndex + 1 : 0;
    onImageIndexChange(newIndex);
  }, [currentPhotoPoint, currentImageIndex, onImageIndexChange]);

  const handlePreviousPhotoPoint = useCallback(() => {
    if (currentPhotoIndex <= 0) return;
    const newPoint = availablePhotoPoints[currentPhotoIndex - 1];
    onPhotoPointChange?.(newPoint);
    onImageIndexChange(0); // Reset to first image
  }, [currentPhotoIndex, availablePhotoPoints, onPhotoPointChange, onImageIndexChange]);

  const handleNextPhotoPoint = useCallback(() => {
    if (currentPhotoIndex >= availablePhotoPoints.length - 1) return;
    const newPoint = availablePhotoPoints[currentPhotoIndex + 1];
    onPhotoPointChange?.(newPoint);
    onImageIndexChange(0); // Reset to first image
  }, [currentPhotoIndex, availablePhotoPoints, onPhotoPointChange, onImageIndexChange]);

  const handleToggleMetadata = useCallback(() => {
    setShowMetadata(prev => !prev);
  }, []);

  if (!open) return null;

  return (
    <aside className="w-full md:w-[250px] xl:w-[350px] h-full border-l bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="text-sm font-semibold">Photo Survey</h2>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-800 w-6 h-6 flex items-center justify-center rounded"
          aria-label="Close photo panel"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        {currentPhotoPoint && currentImage ? (
          <>
            {/* Photo Viewer */}
            <PhotoViewer image={currentImage} />
            
            {/* Image Navigation Controls */}
            <div className="flex items-center gap-1 flex-wrap">
              {/* Photo Point Navigation */}
              <button 
                className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={currentPhotoIndex <= 0}
                onClick={handlePreviousPhotoPoint}
                title="Previous photo point"
              >
                ◀ Prev Point
              </button>
              <button 
                className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={currentPhotoIndex >= availablePhotoPoints.length - 1}
                onClick={handleNextPhotoPoint}
                title="Next photo point"
              >
                Next Point ▶
              </button>
              
              {/* Image Navigation (within point) */}
              {currentPhotoPoint.images.length > 1 && (
                <>
                  <button 
                    className="px-2 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors" 
                    onClick={handlePreviousImage}
                    title="Previous image"
                  >
                    ◀ Prev
                  </button>
                  <button 
                    className="px-2 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors" 
                    onClick={handleNextImage}
                    title="Next image"
                  >
                    Next ▶
                  </button>
                </>
              )}
              
              {/* Metadata Toggle */}
              <button 
                className="px-2 py-1 text-xs rounded bg-gray-500 text-white hover:bg-gray-600 transition-colors ml-auto" 
                onClick={handleToggleMetadata}
                title="Toggle metadata"
              >
                Info
              </button>
            </div>

            {/* Photo Point Info */}
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              <div>Point {currentPhotoIndex + 1} of {availablePhotoPoints.length}</div>
              {currentPhotoPoint.images.length > 1 && (
                <div>Image {currentImageIndex + 1} of {currentPhotoPoint.images.length}</div>
              )}
              <div>Event: {currentPhotoPoint.eventType}</div>
              <div>Survey ID: {currentPhotoPoint.surveyId}</div>
              <div>Block ID: {currentPhotoPoint.blockId}</div>
              <div>Coordinates: {currentPhotoPoint.lat.toFixed(6)}, {currentPhotoPoint.lng.toFixed(6)}</div>
              {currentPhotoPoint.timestamp && (
                <div>Captured: {formatDateTime(currentPhotoPoint.timestamp)}</div>
              )}
            </div>

            {/* Image Metadata (collapsible) */}
            {showMetadata && (
              <div className="p-2 bg-blue-50 rounded text-xs">
                <div className="font-medium text-blue-800 mb-1">Image Details</div>
                <div className="text-blue-700">
                  <div>Label: {currentImage.label}</div>
                  <div>Type: {currentImage.type}</div>
                  {currentImage.description && (
                    <div>Description: {currentImage.description}</div>
                  )}
                  {currentImage.coordinates && (
                    <div>Image Location: {currentImage.coordinates.lat.toFixed(6)}, {currentImage.coordinates.lng.toFixed(6)}</div>
                  )}
                  {currentImage.timestamp && (
                    <div>Timestamp: {formatDateTime(currentImage.timestamp)}</div>
                  )}
                  <div className="mt-2">
                    <a 
                      href={currentImage.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Open full size →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Image Thumbnails (if multiple) */}
            {currentPhotoPoint.images.length > 1 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">All Images ({currentPhotoPoint.images.length})</div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {currentPhotoPoint.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => onImageIndexChange(index)}
                      className={`flex-shrink-0 w-16 h-12 bg-gray-100 rounded overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                      }`}
                      title={img.label}
                    >
                      <img 
                        src={img.url} 
                        alt={img.label}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.setAttribute('style', 'display: flex');
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center text-gray-400 text-xs">
                        📷
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Summary */}
            <div className="mt-3 p-3 border rounded-lg bg-gray-50">
              <h3 className="text-sm font-semibold mb-2">Survey Summary</h3>
              {photoSummary || (
                <div className="text-xs text-gray-600">
                  <div>Event Type: {currentPhotoPoint.eventType}</div>
                  <div>Total Images: {currentPhotoPoint.images.length}</div>
                  <div>Survey ID: {currentPhotoPoint.surveyId}</div>
                  <div>Block: {currentPhotoPoint.blockId}</div>
                  {currentPhotoPoint.meta?.description && (
                    <div>Description: {currentPhotoPoint.meta.description}</div>
                  )}
                </div>
              )}
            </div>

            {/* Instructions 
            <div className="mt-3 p-3 border rounded-lg">
              <h3 className="text-sm font-semibold mb-2">Instructions</h3>
              <ol className="text-xs text-gray-700 list-decimal pl-4 space-y-1">
                <li>Click on photo points (camera icons) on the map to view images</li>
                <li>Use "Prev Point/Next Point" to navigate between different survey locations</li>
                <li>Use "Prev/Next" to view multiple images at the same location</li>
                <li>Click on any image to open it in full size in a new tab</li>
                <li>Use thumbnail strip to quickly jump between images</li>
                <li>Toggle "Info" to show/hide detailed image metadata</li>
                <li>Images are organized by survey event type and location</li>
              </ol>
            </div>*/}

            {/* Technical Info (for debugging/development) 
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3 p-3 border rounded-lg bg-yellow-50">
                <h3 className="text-sm font-semibold mb-2">Debug Info</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Photo Point ID: {currentPhotoPoint.id}</div>
                  <div>Current Image Index: {currentImageIndex}</div>
                  <div>Total Images: {currentPhotoPoint.images.length}</div>
                  <div>Image URL: {currentImage.url.substring(0, 50)}...</div>
                  <div>Image Type: {currentImage.type}</div>
                  <div>Coordinates: {currentPhotoPoint.lat}, {currentPhotoPoint.lng}</div>
                </div>
              </div>
            )}*/}
          </>
        ) : (
          <div className="text-sm text-gray-600 p-4 text-center">
            <div className="mb-2">No photos available for this survey.</div>
            <div className="text-xs text-gray-500">
              {availablePhotoPoints.length === 0 
                ? 'Make sure photo survey data has been loaded and contains valid images.'
                : 'Click on a camera icon on the map to view photos from that location.'
              }
            </div>
            {availablePhotoPoints.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-2">Available photo points:</div>
                <div className="max-h-32 overflow-y-auto">
                  {availablePhotoPoints.slice(0, 10).map((point, index) => (
                    <button
                      key={point.id}
                      onClick={() => {
                        onPhotoPointChange?.(point);
                        onImageIndexChange(0);
                      }}
                      className="block w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded mb-1"
                    >
                      <div className="font-medium">{point.eventType}</div>
                      <div className="text-gray-500">Survey {point.surveyId} • {point.images.length} images</div>
                    </button>
                  ))}
                  {availablePhotoPoints.length > 10 && (
                    <div className="text-xs text-gray-400 text-center mt-2">
                      ... and {availablePhotoPoints.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}