// Updated PlacemarkList.tsx to properly separate external file categories

import React, { useState, useMemo } from 'react';
import { MapPin, Eye, EyeOff, ChevronDown, ChevronUp, Layers, ChevronRight, Database, FileText, Navigation, Upload } from 'lucide-react';
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

interface LayerSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  categories: PlacemarkCategory[];
  color: string;
}

export const PlacemarkList: React.FC<PlacemarkListProps> = ({
  categories,
  placemarks,
  visibleCategories,
  onCategoryVisibilityChange,
  onPlacemarkClick,
  highlightedPlacemark,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['physical-survey', 'desktop-planning', 'external-survey', 'external-desktop']));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Separate categories by data source with improved logic
  const layerSections: LayerSection[] = useMemo(() => {
    const physicalSurveyCategories = categories.filter(cat => 
      cat.id.startsWith('physical-') && !cat.name.startsWith('External')
    );
    
    const desktopPlanningCategories = categories.filter(cat => 
      cat.name.startsWith('Desktop:') && !cat.name.startsWith('External')
    );
    
    const externalSurveyCategories = categories.filter(cat => 
      cat.name.startsWith('External Survey:')
    );
    
    const externalDesktopCategories = categories.filter(cat => 
      cat.name.startsWith('External Desktop:')
    );
    
    const otherExternalCategories = categories.filter(cat => 
      !cat.id.startsWith('physical-') && 
      !cat.name.startsWith('Desktop:') && 
      !cat.name.startsWith('External Survey:') && 
      !cat.name.startsWith('External Desktop:')
    );

    const sections: LayerSection[] = [];

    if (physicalSurveyCategories.length > 0) {
      sections.push({
        id: 'physical-survey',
        title: 'API: PHYSICAL SURVEY DATA',
        icon: <Navigation className="h-4 w-4 text-green-600" />,
        categories: physicalSurveyCategories,
        color: 'from-green-50 to-emerald-50'
      });
    }

    if (desktopPlanningCategories.length > 0) {
      sections.push({
        id: 'desktop-planning',
        title: 'API: DESKTOP PLANNING',
        icon: <Database className="h-4 w-4 text-blue-600" />,
        categories: desktopPlanningCategories,
        color: 'from-blue-50 to-indigo-50'
      });
    }

    if (externalSurveyCategories.length > 0) {
      sections.push({
        id: 'external-survey',
        title: 'EXTERNAL: SURVEY FILES',
        icon: <Upload className="h-4 w-4 text-orange-600" />,
        categories: externalSurveyCategories,
        color: 'from-orange-50 to-amber-50'
      });
    }

    if (externalDesktopCategories.length > 0) {
      sections.push({
        id: 'external-desktop',
        title: 'EXTERNAL: DESKTOP FILES',
        icon: <FileText className="h-4 w-4 text-purple-600" />,
        categories: externalDesktopCategories,
        color: 'from-purple-50 to-violet-50'
      });
    }

    if (otherExternalCategories.length > 0) {
      sections.push({
        id: 'external-other',
        title: 'EXTERNAL: OTHER FILES',
        icon: <FileText className="h-4 w-4 text-gray-600" />,
        categories: otherExternalCategories,
        color: 'from-gray-50 to-slate-50'
      });
    }

    return sections;
  }, [categories]);

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
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

  const handleSectionSelectAll = (sectionCategories: PlacemarkCategory[]) => {
    const allSelected = sectionCategories.every(cat => visibleCategories.has(cat.id));
    sectionCategories.forEach(category => {
      onCategoryVisibilityChange(category.id, !allSelected);
    });
  };

  const getColorClass = (color: string) => {
    return `text-[${color}]`;
  };

  const getCategoryPlacemarks = (categoryId: string, categoryName: string) => {
    return placemarks.filter(p => {
      // Handle API Physical Survey data
      if (p.id.startsWith('physical-') && categoryId.startsWith('physical-')) {
        return p.category === categoryName || 
               (categoryId.startsWith('physical-') && categoryId.replace('physical-', '').toUpperCase() === p.category);
      } 
      // Handle API Desktop Planning data
      else if (p.id.startsWith('desktop-') && categoryName.startsWith('Desktop:')) {
        return p.category === categoryName;
      } 
      // Handle External file data
      else if (!p.id.startsWith('physical-') && !p.id.startsWith('desktop-')) {
        // For external files, match the full category name including prefix
        return p.category === categoryName;
      }
      
      return false;
    });
  };

  const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0);

  // Show default empty state when no data
  if (layerSections.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-500" />
              DATA LAYERS (0)
            </h3>
          </div>
        </div>
        
        <div className="p-4">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <Layers className="h-12 w-12 mx-auto opacity-50" />
            </div>
            <p className="text-sm text-gray-500 mb-2">No data layers available</p>
            <p className="text-xs text-gray-400">
              Upload KML/KMZ files or load survey data to see layers
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Main Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            DATA LAYERS ({totalCount})
          </h3>
          <div className="text-xs text-gray-500">
            {layerSections.length} source{layerSections.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Layer Sections */}
      <div className="divide-y divide-gray-100">
        {layerSections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          const sectionCount = section.categories.reduce((sum, cat) => sum + cat.count, 0);
          
          return (
            <div key={section.id} className="border-l-4 border-l-transparent hover:border-l-gray-200 transition-colors">
              {/* Section Header */}
              <div 
                className={`p-3 cursor-pointer bg-gradient-to-r ${section.color} hover:from-opacity-70 hover:to-opacity-70 transition-all`}
                onClick={() => toggleSectionExpansion(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <h4 className="text-xs font-semibold text-gray-800">
                      {section.title}
                    </h4>
                    <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full text-gray-600">
                      {sectionCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Section Select All */}
                    {isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSectionSelectAll(section.categories);
                        }}
                        className="text-xs text-gray-600 hover:text-blue-600 px-2 py-1 rounded hover:bg-white/50 transition-colors"
                        title="Toggle all in section"
                      >
                        {section.categories.every(cat => visibleCategories.has(cat.id)) ? 'Hide All' : 'Show All'}
                      </button>
                    )}
                    <button className="p-1 text-gray-600 hover:text-gray-800 transition-colors">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="p-3 bg-gray-50/30">
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {section.categories.map((category) => {
                      const isVisible = visibleCategories.has(category.id);
                      const categoryPlacemarks = getCategoryPlacemarks(category.id, category.name);
                      const isExpanded = expandedCategories.has(category.id);
                      const showItems = isVisible && categoryPlacemarks.length > 0;
                      
                      // Clean display name (remove prefixes for display)
                      const displayName = category.name
                        .replace('External Survey: ', '')
                        .replace('External Desktop: ', '')
                        .replace('Desktop: ', '')
                        .replace('Physical: ', '');
                      
                      return (
                        <div key={category.id}>
                          {/* Category Header */}
                          <div className="flex items-center justify-between group bg-white rounded-lg p-2 shadow-sm border border-gray-100 hover:border-gray-200 transition-all">
                            <label className="flex items-center flex-1 py-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={() => onCategoryVisibilityChange(category.id, !isVisible)}
                                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className={`mr-2 ${getColorClass(category.color)}`}>
                                {category.icon}
                              </span>
                              <span className="text-sm flex-1 text-gray-700 font-medium">
                                {displayName}
                              </span>
                              <span 
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ml-2"
                                style={{ backgroundColor: category.color }}
                              >
                                {category.count}
                              </span>
                            </label>
                            
                            <div className="flex items-center gap-1">
                              {/* Expand/Collapse toggle */}
                              {categoryPlacemarks.length > 0 && (
                                <button
                                  onClick={() => toggleCategoryExpansion(category.id)}
                                  className="p-1 rounded transition-colors text-gray-500 hover:bg-gray-100"
                                  title={isExpanded ? 'Collapse items' : 'Expand items'}
                                >
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                              )}
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
                                      p-2 rounded cursor-pointer transition-all text-xs bg-white border
                                      ${isHighlighted 
                                        ? 'bg-blue-50 border-blue-300 shadow-sm' 
                                        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
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
                                            API
                                          </span>
                                        )}
                                        {placemark.id.startsWith('desktop-') && (
                                          <span className="text-xs bg-blue-100 text-blue-600 px-1 py-0.5 rounded">
                                            API
                                          </span>
                                        )}
                                        {!placemark.id.startsWith('physical-') && !placemark.id.startsWith('desktop-') && (
                                          <span className="text-xs bg-orange-100 text-orange-600 px-1 py-0.5 rounded">
                                            File
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};