import React, { useState, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCw, ZoomIn, ZoomOut, Download, MapPin } from 'lucide-react';

// Types
export interface PhotoCapture {
  id: string;
  photoUrl: string;
  timestamp: number;
  coordinates: { lat: number; lng: number };
  meta?: {
    surveyId?: string;
    eventType?: string;
    area_type?: string;
    side_type?: string;
    photoType?: 'start' | 'end' | 'landmark' | 'route' | 'single';
    description?: string;
  };
}

interface SurveyPhotoProcessorProps {
  rawPhysicalSurveyData: any;
  isPhotoSurveyMode: boolean;
  onPhotoClick?: (photo: PhotoCapture) => void;
  onLocationClick?: (coordinates: { lat: number; lng: number }) => void;
}

interface PhotoViewerProps {
  photos: PhotoCapture[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onLocationClick?: (coordinates: { lat: number; lng: number }) => void;
}

// Utility functions
function parseTimestamp(timeStr: string | number | undefined): number {
  if (!timeStr) return NaN;
  
  if (typeof timeStr === 'number') {
    return timeStr;
  }
  
  const parsed = Number(timeStr);
  if (isFinite(parsed)) {
    if (parsed > 1000000000000) return parsed;
    if (parsed > 1000000000) return parsed * 1000;
  }
  
  return Date.parse(timeStr);
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    isFinite(lat) && isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    lat !== 0 && lng !== 0
  );
}

function resolveMediaUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  
  const trimmedPath = path.trim();
  if (!trimmedPath) return '';
  
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }
  
  const cleanPath = trimmedPath.replace(/^\/+/, '');
  const baseUrl = import.meta.env.VITE_Image_URL;
  
  if (!baseUrl) {
    console.error('VITE_Image_URL environment variable not set');
    return trimmedPath;
  }
  
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${cleanPath}`;
}

// Photo processing function
function buildPhotoCaptures(rawPhysical: any): PhotoCapture[] {
  
  if (!rawPhysical?.data) {
    console.warn('No data found in rawPhysical for photo processing');
    return [];
  }
  
  const photos: PhotoCapture[] = [];
  
  Object.entries(rawPhysical.data).forEach(([blockId, rows]) => {
    if (!Array.isArray(rows)) return;
    
    (rows as any[]).forEach((r, index) => {
      const lat = Number(r.latitude);
      const lng = Number(r.longitude);
      const ts = parseTimestamp(r.createdTime) || parseTimestamp(r.created_at);
      
      if (!isValidCoordinate(lat, lng) || !isFinite(ts)) return;
      
      // Process start_photos array
      try {
        const startPhotos = r.start_photos ? JSON.parse(r.start_photos) : [];
        if (Array.isArray(startPhotos)) {
          startPhotos.forEach((photoUrl: string, photoIndex: number) => {
            if (photoUrl && photoUrl.trim() !== '') {
              photos.push({
                id: `${r.survey_id}_start_${ts}_${photoIndex}`,
                photoUrl: resolveMediaUrl(photoUrl),
                timestamp: ts,
                coordinates: { lat, lng },
                meta: {
                  surveyId: r.survey_id,
                  eventType: r.event_type,
                  area_type: r.area_type,
                  side_type: r.side_type,
                  photoType: 'start',
                  description: 'Start photo'
                }
              });
            }
          });
        }
      } catch (error) {
        console.warn('Error parsing start_photos:', error);
      }
      
      // Process end_photos array
      try {
        const endPhotos = r.end_photos ? JSON.parse(r.end_photos) : [];
        if (Array.isArray(endPhotos)) {
          endPhotos.forEach((photoUrl: string, photoIndex: number) => {
            if (photoUrl && photoUrl.trim() !== '') {
              photos.push({
                id: `${r.survey_id}_end_${ts}_${photoIndex}`,
                photoUrl: resolveMediaUrl(photoUrl),
                timestamp: ts,
                coordinates: { lat, lng },
                meta: {
                  surveyId: r.survey_id,
                  eventType: r.event_type,
                  area_type: r.area_type,
                  side_type: r.side_type,
                  photoType: 'end',
                  description: 'End photo'
                }
              });
            }
          });
        }
      } catch (error) {
        console.warn('Error parsing end_photos:', error);
      }
      
      // Process landMarkUrls
      try {
        if (r.landMarkUrls) {
          const landmarkUrls = JSON.parse(r.landMarkUrls);
          if (Array.isArray(landmarkUrls)) {
            landmarkUrls.forEach((photoUrl: string, urlIndex: number) => {
              if (photoUrl && photoUrl.trim() !== '') {
                photos.push({
                  id: `${r.survey_id}_landmark_${ts}_${urlIndex}`,
                  photoUrl: resolveMediaUrl(photoUrl),
                  timestamp: ts,
                  coordinates: { lat, lng },
                  meta: {
                    surveyId: r.survey_id,
                    eventType: r.event_type,
                    area_type: r.area_type,
                    side_type: r.side_type,
                    photoType: 'landmark',
                    description: r.landMarkDescription || 'Landmark photo'
                  }
                });
              }
            });
          }
        }
      } catch (error) {
        console.warn('Error parsing landMarkUrls:', error);
      }
      
      // Process road_crossing photos
      try {
        if (r.road_crossing) {
          const roadCrossing = JSON.parse(r.road_crossing);
          if (roadCrossing.startPhoto && roadCrossing.startPhoto.trim() !== '') {
            photos.push({
              id: `${r.survey_id}_road_start_${ts}`,
              photoUrl: resolveMediaUrl(roadCrossing.startPhoto),
              timestamp: ts,
              coordinates: { lat, lng },
              meta: {
                surveyId: r.survey_id,
                eventType: r.event_type,
                area_type: r.area_type,
                side_type: r.side_type,
                photoType: 'route',
                description: 'Road crossing start photo'
              }
            });
          }
          if (roadCrossing.endPhoto && roadCrossing.endPhoto.trim() !== '') {
            photos.push({
              id: `${r.survey_id}_road_end_${ts}`,
              photoUrl: resolveMediaUrl(roadCrossing.endPhoto),
              timestamp: ts,
              coordinates: { lat, lng },
              meta: {
                surveyId: r.survey_id,
                eventType: r.event_type,
                area_type: r.area_type,
                side_type: r.side_type,
                photoType: 'route',
                description: 'Road crossing end photo'
              }
            });
          }
        }
      } catch (error) {
        console.warn('Error parsing road_crossing:', error);
      }
      
      // Process individual photo URL fields
      const photoFields = [
        { field: 'fpoiUrl', desc: 'FPOI photo' },
        { field: 'routeIndicatorUrl', desc: 'Route indicator photo' },
        { field: 'kmtStoneUrl', desc: 'Kilometer stone photo' },
        { field: 'fiberTurnUrl', desc: 'Fiber turn photo' },
        { field: 'jointChamberUrl', desc: 'Joint chamber photo' }
      ];
      
      photoFields.forEach(({ field, desc }) => {
        if (r[field] && r[field].trim() !== '') {
          photos.push({
            id: `${r.survey_id}_${field}_${ts}`,
            photoUrl: resolveMediaUrl(r[field]),
            timestamp: ts,
            coordinates: { lat, lng },
            meta: {
              surveyId: r.survey_id,
              eventType: r.event_type,
              area_type: r.area_type,
              side_type: r.side_type,
              photoType: 'route',
              description: desc
            }
          });
        }
      });
    });
  });
  
  // Sort by timestamp and remove duplicates
  const sortedPhotos = photos.sort((a, b) => a.timestamp - b.timestamp);
  const uniquePhotos = sortedPhotos.filter((photo, index, arr) => 
    index === 0 || photo.photoUrl !== arr[index - 1].photoUrl
  );
  
  return uniquePhotos;
}

// Photo Viewer Component
function PhotoViewer({ photos, currentIndex, isOpen, onClose, onNavigate, onLocationClick }: PhotoViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  const currentPhoto = photos[currentIndex];
  
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      setZoom(1);
      setRotation(0);
      setImageError(false);
    }
  }, [currentIndex, onNavigate]);
  
  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
      setZoom(1);
      setRotation(0);
      setImageError(false);
    }
  }, [currentIndex, photos.length, onNavigate]);
  
  const handleDownload = useCallback(() => {
    if (currentPhoto) {
      const link = document.createElement('a');
      link.href = currentPhoto.photoUrl;
      link.download = `survey_photo_${currentPhoto.meta?.surveyId || 'unknown'}_${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [currentPhoto, currentIndex]);
  
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);
  
  if (!isOpen || !currentPhoto) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-50 text-white">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">
            Photo {currentIndex + 1} of {photos.length}
          </h3>
          <span className="text-sm text-gray-300">
            {new Date(currentPhoto.timestamp).toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          
          {/* Rotation */}
          <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
            title="Rotate"
          >
            <RotateCw size={20} />
          </button>
          
          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
            title="Download Photo"
          >
            <Download size={20} />
          </button>
          
          {/* Show on map */}
          {onLocationClick && (
            <button
              onClick={() => onLocationClick(currentPhoto.coordinates)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
              title="Show on Map"
            >
              <MapPin size={20} />
            </button>
          )}
          
          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-4">
        {imageError ? (
          <div className="text-white text-center">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-xl mb-2">Failed to load image</p>
            <p className="text-gray-400">{currentPhoto.photoUrl}</p>
          </div>
        ) : (
          <img
            src={currentPhoto.photoUrl}
            alt={`Survey photo ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease'
            }}
            onError={handleImageError}
          />
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between items-center p-4 bg-black bg-opacity-50">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          <ChevronLeft size={20} />
          <span>Previous</span>
        </button>
        
        <div className="text-white text-center">
          <div className="text-sm text-gray-300">Survey ID: {currentPhoto.meta?.surveyId}</div>
          <div className="text-sm text-gray-300">Type: {currentPhoto.meta?.photoType}</div>
          {currentPhoto.meta?.description && (
            <div className="text-sm text-gray-300">{currentPhoto.meta.description}</div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            {currentPhoto.coordinates.lat.toFixed(6)}, {currentPhoto.coordinates.lng.toFixed(6)}
          </div>
        </div>
        
        <button
          onClick={handleNext}
          disabled={currentIndex === photos.length - 1}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          <span>Next</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

// Main Photo Processor Component
export function SurveyPhotoProcessor({ 
  rawPhysicalSurveyData, 
  isPhotoSurveyMode, 
  onPhotoClick,
  onLocationClick 
}: SurveyPhotoProcessorProps) {
  const [showViewer, setShowViewer] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Process photos from raw data
  const processedPhotos = useMemo(() => {
    if (!isPhotoSurveyMode || !rawPhysicalSurveyData) {
      return [];
    }
    return buildPhotoCaptures(rawPhysicalSurveyData);
  }, [rawPhysicalSurveyData, isPhotoSurveyMode]);
  
  // Handle photo click from map
  const handlePhotoClick = useCallback((photo: PhotoCapture) => {
    const index = processedPhotos.findIndex(p => p.id === photo.id);
    if (index >= 0) {
      setCurrentPhotoIndex(index);
      setShowViewer(true);
    }
    onPhotoClick?.(photo);
  }, [processedPhotos, onPhotoClick]);
  
  // Handle photo navigation
  const handlePhotoNavigate = useCallback((index: number) => {
    setCurrentPhotoIndex(index);
  }, []);
  
  // Handle viewer close
  const handleViewerClose = useCallback(() => {
    setShowViewer(false);
  }, []);
  
  // Photo summary component
  const PhotoSummary = useMemo(() => {
    if (!isPhotoSurveyMode || processedPhotos.length === 0) {
      return null;
    }
    
    const photoTypes = processedPhotos.reduce((acc, photo) => {
      const type = photo.meta?.photoType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
        <h4 className="font-semibold text-blue-800 mb-2">Photo Survey Summary</h4>
        <div className="text-sm text-blue-700">
          <div>Total Photos: {processedPhotos.length}</div>
          {Object.entries(photoTypes).map(([type, count]) => (
            <div key={type} className="capitalize">
              {type.replace('_', ' ')}: {count}
            </div>
          ))}
        </div>
        {processedPhotos.length > 0 && (
          <button
            onClick={() => {
              setCurrentPhotoIndex(0);
              setShowViewer(true);
            }}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            View Photos
          </button>
        )}
      </div>
    );
  }, [isPhotoSurveyMode, processedPhotos]);
  
  return (
    <>
      
      <PhotoViewer
        photos={processedPhotos}
        currentIndex={currentPhotoIndex}
        isOpen={showViewer}
        onClose={handleViewerClose}
        onNavigate={handlePhotoNavigate}
        onLocationClick={onLocationClick}
      />
    </>
  );
}

// Export helper functions for use in other components
export { buildPhotoCaptures, type PhotoCapture };