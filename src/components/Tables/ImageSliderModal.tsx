import { useState } from "react";
import { FaTimes, FaArrowLeft, FaArrowRight } from "react-icons/fa";

interface ImageSliderModalProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
}

const ImageSliderModal: React.FC<ImageSliderModalProps> = ({ images, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  if (!isOpen) return null;

  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const nextSlide = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="relative bg-white p-4 rounded-lg shadow-lg max-w-lg w-full">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          <FaTimes className="h-6 w-6" />
        </button>

        {/* Image Display */}
        <div className="flex items-center justify-center w-full h-64 overflow-hidden">
          <img src={images[currentIndex]} alt={`Slide ${currentIndex + 1}`} className="w-full h-auto rounded-lg" />
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <div className="flex justify-between mt-4">
            <button onClick={prevSlide} className="text-gray-600 hover:text-gray-800">
              <FaArrowLeft className="h-6 w-6" />
            </button>
            <button onClick={nextSlide} className="text-gray-600 hover:text-gray-800">
              <FaArrowRight className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageSliderModal;
