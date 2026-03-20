import { MapPin, Plus, Minus, Navigation } from 'lucide-react';

export default function MapView() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative h-full">
      
      <div className="h-full min-h-[500px] relative">
        
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3684156.3864543885!2d85.28900899999999!3d23.417350899999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4e104aa5db7dd%3A0xdc09d49d6899f43e!2sWest%20Bengal!5e0!3m2!1sen!2sin!4v1234567890"
          className="absolute inset-0 w-full h-full border-0"
          loading="lazy"
        />

        {/* Controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50">
            <Navigation className="w-5 h-5 text-gray-700" />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50">
            <Plus className="w-5 h-5 text-gray-700" />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50">
            <Minus className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Info Card */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-4 max-w-xs">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">
                West Bengal Zone
              </h4>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-semibold text-green-600">85.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Links:</span>
                  <span className="font-semibold">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Critical Issues:</span>
                  <span className="font-semibold text-red-600">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}