import React, { useMemo, useState, useCallback } from 'react';
import type { PhotoCapture } from './SurveyPhotoProcessor';

interface SurveyPhotoPanelProps {
  open: boolean;
  onClose: () => void;

  photos: PhotoCapture[];
  currentIndex: number;
  onChangeIndex: (i: number) => void;

  // optional: center the map on this photo’s location
  onLocate?: (coords: { lat: number; lng: number }) => void;

  // optional: small summary block (like your video summary)
  surveySummary?: React.ReactNode;
}

export default function SurveyPhotoPanel({
  open, onClose,
  photos, currentIndex, onChangeIndex,
  onLocate,
  surveySummary,
}: SurveyPhotoPanelProps) {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);

  const photo = photos[currentIndex];
  const tsText = useMemo(() => photo ? new Date(photo.timestamp).toLocaleString() : '—', [photo]);

  const handlePrev = useCallback(() => {
    if (!photos.length) return;
    const i = Math.max(0, currentIndex - 1);
    onChangeIndex(i);
    setRotation(0); setZoom(1);
  }, [photos.length, currentIndex, onChangeIndex]);

  const handleNext = useCallback(() => {
    if (!photos.length) return;
    const i = Math.min(photos.length - 1, currentIndex + 1);
    onChangeIndex(i);
    setRotation(0); setZoom(1);
  }, [photos.length, currentIndex, onChangeIndex]);

  const handleRotate = useCallback(() => setRotation(r => (r + 90) % 360), []);
  const handleZoomIn = useCallback(() => setZoom(z => Math.min(4, z + 0.25)), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(0.5, z - 0.25)), []);
  const handleLocate = useCallback(() => {
    if (photo && onLocate) onLocate(photo.coordinates);
  }, [photo, onLocate]);

  if (!open) return null;

  return (
    <aside className="w-full md:w-[250px] xl:w-[350px] h-full border-l bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="text-sm font-semibold">Photo Survey</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 w-6 h-6 flex items-center justify-center rounded" aria-label="Close photo panel">✕</button>
      </div>

      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden flex items-center justify-center">
  {photo ? (
    <img
      src={photo.photoUrl}
      alt={photo.meta?.description || 'Survey photo'}
      className="max-w-full max-h-full object-contain"
      style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
    />
  ) : (
    <div className="text-white text-sm">No photo</div>
  )}
</div>
    </aside>
  );
}
