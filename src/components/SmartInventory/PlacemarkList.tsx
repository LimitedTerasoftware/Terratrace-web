import React, { useState } from 'react';
import { MapPin, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { Placemark } from '../../types/kmz';

interface PlacemarkListProps {
  placemarks: Placemark[];
  visiblePlacemarks: Set<string>;
  onPlacemarkVisibilityChange: (placemarkId: string, visible: boolean) => void;
  onPlacemarkClick: (placemark: Placemark) => void;
  highlightedPlacemark?: Placemark;
}

export const PlacemarkList: React.FC<PlacemarkListProps> = ({
  placemarks,
  visiblePlacemarks,
  onPlacemarkVisibilityChange,
  onPlacemarkClick,
  highlightedPlacemark
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectAll, setSelectAll] = useState(true);

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    placemarks.forEach(placemark => {
      onPlacemarkVisibilityChange(placemark.id, newSelectAll);
    });
  };

  const handlePlacemarkToggle = (placemark: Placemark) => {
    const isVisible = visiblePlacemarks.has(placemark.id);
    onPlacemarkVisibilityChange(placemark.id, !isVisible);
  };

  if (placemarks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500 py-4">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No placemarks available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Placemarks ({placemarks.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            >
              {selectAll ? 'Hide All' : 'Show All'}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Placemark List */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto">
          {placemarks.map((placemark) => {
            const isVisible = visiblePlacemarks.has(placemark.id);
            const isHighlighted = highlightedPlacemark?.id === placemark.id;
            
            return (
              <div
                key={placemark.id}
                className={`
                  p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all
                  ${isHighlighted ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
                `}
                onClick={() => onPlacemarkClick(placemark)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {placemark.name}
                      </h4>
                    </div>
                    {placemark.description && (
                      <p className="text-xs text-gray-500 truncate mb-1">
                        {placemark.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {placemark.state && <span>{placemark.state}</span>}
                      {placemark.division && <span>• {placemark.division}</span>}
                      {placemark.block && <span>• {placemark.block}</span>}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlacemarkToggle(placemark);
                    }}
                    className={`
                      p-1 rounded transition-colors
                      ${isVisible 
                        ? 'text-blue-600 hover:bg-blue-50' 
                        : 'text-gray-400 hover:bg-gray-100'
                      }
                    `}
                    title={isVisible ? 'Hide on map' : 'Show on map'}
                  >
                    {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};