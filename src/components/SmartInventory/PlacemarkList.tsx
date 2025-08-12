import React, { useState } from 'react';
import { MapPin, Eye, EyeOff, ChevronDown, ChevronUp, Layers, ChevronRight } from 'lucide-react';
import { ProcessedPlacemark, PlacemarkCategory, ProcessedPhysicalSurvey } from '../../types/kmz';
import { PLACEMARK_CATEGORIES } from './PlaceMark';

interface PlacemarkListProps {
  categories: PlacemarkCategory[];
  placemarks: (ProcessedPlacemark | ProcessedPhysicalSurvey)[];
  visibleCategories: Set<string>;
  onCategoryVisibilityChange: (categoryId: string, visible: boolean) => void;
  onPlacemarkClick: (placemark: ProcessedPlacemark | ProcessedPhysicalSurvey) => void;
  highlightedPlacemark?: ProcessedPlacemark | ProcessedPhysicalSurvey;
}

export const PlacemarkList: React.FC<PlacemarkListProps> = ({
  categories,
  placemarks,
  visibleCategories,
  onCategoryVisibilityChange,
  onPlacemarkClick,
  highlightedPlacemark,
}) => {
  const [isLayersExpanded, setIsLayersExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Default categories to show when no data is available
  const defaultCategories = [
    { id: 'LANDMARK', name: 'LANDMARK', count: 0, color: '#FF6B6B', icon: '📍' },
    { id: 'FIBERTURN', name: 'FIBERTURN', count: 0, color: '#4ECDC4', icon: '🔄' },
    { id: 'Bridge', name: 'Bridge', count: 0, color: '#45B7D1', icon: '🌉' },
    { id: 'Culvert', name: 'Culvert', count: 0, color: '#96CEB4', icon: '🚇' },
    { id: 'ROADCROSSING', name: 'ROADCROSSING', count: 0, color: '#FFEAA7', icon: '🛣️' },
    { id: 'Level Cross', name: 'Level Cross', count: 0, color: '#DDA0DD', icon: '🚂' },
    { id: 'Rail Under Bridge', name: 'Rail Under Bridge', count: 0, color: '#98D8C8', icon: '🚊' },
    { id: 'Causeways', name: 'Causeways', count: 0, color: '#F7DC6F', icon: '🌊' },
    { id: 'Rail Over Bridge', name: 'Rail Over Bridge', count: 0, color: '#BB8FCE', icon: '🚝' },
    { id: 'KILOMETERSTONE', name: 'KILOMETERSTONE', count: 0, color: '#85C1E9', icon: '📏' },
    { id: 'FPOI', name: 'FPOI', count: 0, color: '#F8C471', icon: '📌' },
    { id: 'JOINTCHAMBER', name: 'JOINTCHAMBER', count: 0, color: '#82E0AA', icon: '🔧' },
    { id: 'ROUTEINDICATOR', name: 'ROUTEINDICATOR', count: 0, color: '#F1948A', icon: '🧭' }
  ];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;
  const hasData = categories.length > 0;

  const handleSelectAllLayers = () => {
    if (!hasData) return;
    
    const allSelected = displayCategories.every(cat => visibleCategories.has(cat.id));
    displayCategories.forEach(category => {
      onCategoryVisibilityChange(category.id, !allSelected);
    });
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getColorClass = (color: string) => {
    return `text-[${color}]`;
  };

  const getCategoryPlacemarks = (categoryId: string) => {
    // Show both physical survey and external file placemarks
    return placemarks.filter(p => {
      if (p.id.startsWith('physical-')) {
        return p.category === categoryId || 
               (categoryId.startsWith('physical-') && categoryId.replace('physical-', '').toUpperCase() === p.category);
      } else {
        // External file placemarks
        return p.category === categoryId;
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div 
        className="p-4 border-b border-gray-200 cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50"
        onClick={() => setIsLayersExpanded(!isLayersExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
              LANDBASE LAYERS ({displayCategories.reduce((sum, cat) => sum + cat.count, 0)})
          </h3>
          <div className="flex items-center gap-2">
          
            <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
              {isLayersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLayersExpanded && (
        <div className="p-3">
          {/* Select All - only show when there's data */}
          {hasData && (
            <div className="mb-3">
              <label className="flex items-center py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayCategories.every(cat => visibleCategories.has(cat.id))}
                  onChange={handleSelectAllLayers}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-medium">Select All</span>
              </label>
            </div>
          )}

          {/* Layers List */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {displayCategories.map((category) => {
              const isVisible = visibleCategories.has(category.id);
              const categoryPlacemarks = getCategoryPlacemarks(category.id);
              // Only show physical survey categories that have data
              const isPhysicalCategory = category.id.startsWith('physical-');
              const isExternalCategory = !isPhysicalCategory && hasData;
              const showCategory = (isPhysicalCategory && category.count > 0) || (isExternalCategory && category.count > 0) || !hasData;
              const showItems = isVisible && categoryPlacemarks.length > 0;
              const isExpanded = expandedCategories.has(category.id);
              
              // Skip categories that shouldn't be shown
              if (!showCategory) {
                return null;
              }

              return (
                <div key={category.id}>
                  {/* Category Header */}
                  <div className="flex items-center justify-between group bg-gray-50 rounded-lg p-2 mb-1">
                    <label className="flex items-center flex-1 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => onCategoryVisibilityChange(category.id, !isVisible)}
                        disabled={!hasData}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className={`mr-2 ${hasData ? getColorClass(category.color) : 'text-gray-400'}`} >
                        {category.icon}
                      </span>
                      <span className={`text-sm flex-1 ${hasData ? 'text-gray-600' : 'text-gray-400'}`}>
                        {category.name}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ml-2 ${
                        hasData ? '' : 'opacity-50'
                      }`}
                        style={{ backgroundColor: hasData ? category.color : '#9CA3AF' }}>
                        {category.count}
                      </span>
                    </label>
                    
                    <div className="flex items-center gap-1">
                      {/* Expand/Collapse toggle */}
                      {categoryPlacemarks.length > 0 && (
                        <button
                          onClick={() => toggleCategoryExpansion(category.id)}
                          className="p-1 rounded transition-colors text-gray-500 hover:bg-gray-200"
                          title={isExpanded ? 'Collapse items' : 'Expand items'}
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      )}
                      
                      {/* Visibility toggle */}
                      <button
                        onClick={() => onCategoryVisibilityChange(category.id, !isVisible)}
                        disabled={!hasData}
                        className={`p-1 rounded transition-colors ${
                          hasData
                            ? isVisible 
                              ? 'text-blue-600 hover:bg-blue-50' 
                              : 'text-gray-400 hover:bg-gray-100'
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={isVisible ? 'Hide on map' : 'Show on map'}
                      >
                        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Individual Items */}
                  {showItems && isExpanded && (
                    <div className="ml-6 space-y-1 mt-1">
                      {categoryPlacemarks.map((placemark) => {
                        const isHighlighted = highlightedPlacemark?.id === placemark.id;
                        
                        return (
                          <div
                            key={placemark.id}
                            className={`
                              p-2 rounded cursor-pointer transition-all text-xs
                              ${isHighlighted 
                                ? 'bg-blue-50 border border-blue-200' 
                                : 'hover:bg-gray-50'
                              }
                            `}
                            onClick={() => onPlacemarkClick(placemark)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: category.color }}
                                  title={placemark.id.startsWith('physical-') ? `Event: ${placemark.category}` : `Type: ${(placemark as ProcessedPlacemark).pointType}`}
                                />
                                <span className="text-gray-600 truncate flex-1">
                                  {placemark.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {(placemark as ProcessedPlacemark).pointType && (
                                  <span className={`text-xs px-1 py-0.5 rounded ${
                                    (placemark as ProcessedPlacemark).pointType === 'FPOI' 
                                      ? 'bg-red-100 text-red-600' 
                                      : 'bg-teal-100 text-teal-600'
                                  }`}>
                                    {(placemark as ProcessedPlacemark).pointType}
                                  </span>
                                )}
                                {placemark.id.startsWith('physical-') && (
                                  <span className="text-xs bg-green-100 text-green-600 px-1 py-0.5 rounded">
                                    Survey
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* No data message */}
          {!hasData && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">
                No data available. Upload KML/KMZ files or load physical survey data to see layers.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};