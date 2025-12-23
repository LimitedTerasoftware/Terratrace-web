import { useState } from 'react';
import { AerialPole, AerialRoadCrossing } from '../../types/aerial-survey';
import { parsePhotos } from '../../utils/map-helpers';

interface InfoWindowContentProps {
  type: 'start' | 'end' | 'pole' | 'crossing';
  data: any;
}

export default function InfoWindowContent({ type, data }: InfoWindowContentProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
const baseUrl_public = import.meta.env.VITE_Image_URL;

  const renderPhotos = (photos: string[]) => {
    if (!photos.length) return null;

    return (
      <div className="mt-2">
        <p className="text-xs font-semibold text-gray-700 mb-1">Photos:</p>
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, idx) => (
            <img
              key={idx}
               src={`${baseUrl_public}${photo}`}
              alt={`Photo ${idx + 1}`}
              className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedImage(`${baseUrl_public}${photo}`)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderStartEndGP = () => {
    const photos = parsePhotos(data.photos);
    return (
      <div className="p-3 max-w-xs">
        <h3 className="text-sm font-bold text-gray-800 mb-2">
          {type === 'start' ? '🔵 Start GP' : '🔴 End GP'}
        </h3>
        <div className="space-y-1 text-xs">
          <p><span className="font-semibold">Name:</span> {data.name}</p>
          <p><span className="font-semibold">Coordinates:</span> {data.coordinates}</p>
        </div>
        {renderPhotos(photos)}
      </div>
    );
  };

  const renderPole = () => {
    const poleData = data as AerialPole;
    const photos = poleData.polePhoto ? [poleData.polePhoto] : [];

    return (
      <div className="p-3 max-w-xs">
        <h3 className="text-sm font-bold text-gray-800 mb-2">⚡ Electric Pole</h3>
        <div className="space-y-1 text-xs">
          <p><span className="font-semibold">Type:</span> {poleData.typeOfPole || 'N/A'}</p>
          <p><span className="font-semibold">Height:</span> {poleData.poleHeight || 'N/A'}</p>
          <p><span className="font-semibold">Condition:</span> {poleData.poleCondition || 'N/A'}</p>
          <p><span className="font-semibold">Line Type:</span> {poleData.electricityLineType || 'N/A'}</p>
          <p><span className="font-semibold">Position:</span> {poleData.polePosition || 'N/A'}</p>
          <p><span className="font-semibold">Location:</span> {poleData.lattitude}, {poleData.longitude}</p>
        </div>
        {renderPhotos(photos)}
      </div>
    );
  };

  const renderCrossing = () => {
    const crossingData = data as AerialRoadCrossing;
    const photos = [crossingData.startPhoto, crossingData.endPhoto].filter(Boolean);

    return (
      <div className="p-3 max-w-xs">
        <h3 className="text-sm font-bold text-gray-800 mb-2">🚧 Road Crossing</h3>
        <div className="space-y-1 text-xs">
          <p><span className="font-semibold">Type:</span> {crossingData.typeOfCrossing || 'N/A'}</p>
          <p><span className="font-semibold">Length:</span> {crossingData.length || 'N/A'}</p>
          <p><span className="font-semibold">Start:</span> {crossingData.slattitude}, {crossingData.slongitude}</p>
          <p><span className="font-semibold">End:</span> {crossingData.elattitude}, {crossingData.elongitude}</p>
        </div>
        {renderPhotos(photos)}
      </div>
    );
  };

  const content = type === 'start' || type === 'end'
    ? renderStartEndGP()
    : type === 'pole'
    ? renderPole()
    : renderCrossing();

  return (
    <>
      {content}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
