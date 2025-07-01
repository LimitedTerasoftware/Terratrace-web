// import React, { useState } from 'react';
// import { MapPin, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
// import { Placemark } from '../../types/kmz';

// interface PlacemarkListProps {
//   placemarks: Placemark[];
//   visiblePlacemarks: Set<string>;
//   onPlacemarkVisibilityChange: (placemarkId: string, visible: boolean) => void;
//   onPlacemarkClick: (placemark: Placemark) => void;
//   highlightedPlacemark?: Placemark;
// }

// export const PlacemarkList: React.FC<PlacemarkListProps> = ({
//   placemarks,
//   visiblePlacemarks,
//   onPlacemarkVisibilityChange,
//   onPlacemarkClick,
//   highlightedPlacemark
// }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [selectAll, setSelectAll] = useState(true);

//   const handleSelectAll = () => {
//     const newSelectAll = !selectAll;
//     setSelectAll(newSelectAll);
//     placemarks.forEach(placemark => {
//       onPlacemarkVisibilityChange(placemark.id, newSelectAll);
//     });
//   };

//   const handlePlacemarkToggle = (placemark: Placemark) => {
//     const isVisible = visiblePlacemarks.has(placemark.id);
//     onPlacemarkVisibilityChange(placemark.id, !isVisible);
//   };

//   // if (placemarks.length === 0) {
//   //   return (
//   //     <div className="bg-white rounded-lg border border-gray-200 p-4">
//   //       <div className="text-center text-gray-500 py-4">
//   //         <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
//   //         <p className="text-sm">No placemarks available</p>
//   //       </div>
//   //     </div>
//   //   );
//   // }

//   return (
//     <div className="bg-white rounded-lg border border-gray-200">
//       {/* Header */}
//       <div className="p-4 border-b border-gray-200">
//         <div className="flex items-center justify-between">
//           <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
//             <MapPin className="h-4 w-4" />
//             Placemarks ({placemarks.length})
//           </h3>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={handleSelectAll}
//               className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
//             >
//               {selectAll ? 'Hide All' : 'Show All'}
//             </button>
//             <button
//               onClick={() => setIsExpanded(!isExpanded)}
//               className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
//             >
//               {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Placemark List */}
//       {isExpanded && (
//         <div className="max-h-64 overflow-y-auto">
//           {placemarks.map((placemark) => {
//             const isVisible = visiblePlacemarks.has(placemark.id);
//             const isHighlighted = highlightedPlacemark?.id === placemark.id;
            
//             return (
//               <div
//                 key={placemark.id}
//                 className={`
//                   p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-all
//                   ${isHighlighted ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}
//                 `}
//                 onClick={() => onPlacemarkClick(placemark)}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-2 mb-1">
//                       <h4 className="text-sm font-medium text-gray-900 truncate">
//                         {placemark.name}
//                       </h4>
//                     </div>
//                     {/* {placemark.description && (
//                       <p className="text-xs text-gray-500 truncate mb-1">
//                         {placemark.description}
//                       </p>
//                     )} */}
//                     {/* <div className="flex items-center gap-2 text-xs text-gray-400">
//                       {placemark.state && <span>{placemark.state}</span>}
//                       {placemark.division && <span>• {placemark.division}</span>}
//                       {placemark.block && <span>• {placemark.block}</span>}
//                     </div> */}
//                   </div>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handlePlacemarkToggle(placemark);
//                     }}
//                     className={`
//                       p-1 rounded transition-colors
//                       ${isVisible 
//                         ? 'text-blue-600 hover:bg-blue-50' 
//                         : 'text-gray-400 hover:bg-gray-100'
//                       }
//                     `}
//                     title={isVisible ? 'Hide on map' : 'Show on map'}
//                   >
//                     {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };
import React, { useState } from 'react';
import { MapPin, Eye, EyeOff, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { ProcessedPlacemark, PlacemarkCategory } from '../../types/kmz';

interface PlacemarkListProps {
  placemarks: ProcessedPlacemark[];
  categories: PlacemarkCategory[];
  visibleCategories: Set<string>;
  onCategoryVisibilityChange: (categoryId: string, visible: boolean) => void;
  onPlacemarkClick: (placemark: ProcessedPlacemark) => void;
  highlightedPlacemark?: ProcessedPlacemark;
}

export const PlacemarkList: React.FC<PlacemarkListProps> = ({
  placemarks,
  categories,
  visibleCategories,
  onCategoryVisibilityChange,
  onPlacemarkClick,
  highlightedPlacemark
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const totalPlacemarks = placemarks.length;
  const visiblePlacemarks = placemarks.filter(p => 
    visibleCategories.has(categories.find(c => c.name === p.category)?.id || '')
  ).length;

  const handleSelectAll = () => {
    const allVisible = categories.every(cat => visibleCategories.has(cat.id));
    categories.forEach(category => {
      onCategoryVisibilityChange(category.id, !allVisible);
    });
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryPlacemarks = (categoryName: string) => {
    return placemarks.filter(p => p.category === categoryName);
  };

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No placemarks available</p>
          <p className="text-xs text-gray-400 mt-1">Upload a KML/KMZ file to see placemarks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              Placemarks
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {visiblePlacemarks} of {totalPlacemarks} visible • {categories.length} categories
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs px-3 py-1.5 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors font-medium"
            >
              {categories.every(cat => visibleCategories.has(cat.id)) ? 'Hide All' : 'Show All'}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Categories List */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto">
          {categories.map((category) => {
            const isVisible = visibleCategories.has(category.id);
            const isExpanded = expandedCategories.has(category.id);
            const categoryPlacemarks = getCategoryPlacemarks(category.name);
            
            return (
              <div key={category.id} className="border-b border-gray-100 last:border-b-0">
                {/* Category Header */}
                <div
                  className={`
                    p-3 cursor-pointer transition-all hover:bg-gray-50
                    ${isVisible ? 'bg-white' : 'bg-gray-50'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-lg">{category.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {category.name}
                          </h4>
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-xs text-gray-500">
                            {categoryPlacemarks.filter(p => p.type === 'point').length} points, {' '}
                            {categoryPlacemarks.filter(p => p.type === 'polyline').length} lines
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategoryExpansion(category.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title={isExpanded ? 'Collapse category' : 'Expand category'}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCategoryVisibilityChange(category.id, !isVisible);
                        }}
                        className={`
                          p-1 rounded transition-colors
                          ${isVisible 
                            ? 'text-blue-600 hover:bg-blue-50' 
                            : 'text-gray-400 hover:bg-gray-100'
                          }
                        `}
                        title={isVisible ? 'Hide category' : 'Show category'}
                      >
                        {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Category Placemarks */}
                {isExpanded && isVisible && (
                  <div className="bg-gray-50">
                    {categoryPlacemarks.slice(0, 10).map((placemark) => {
                      const isHighlighted = highlightedPlacemark?.id === placemark.id;
                      
                      return (
                        <div
                          key={placemark.id}
                          className={`
                            px-6 py-2 cursor-pointer transition-all text-sm border-l-2
                            ${isHighlighted 
                              ? 'bg-blue-100 border-blue-400 text-blue-900' 
                              : 'hover:bg-white border-transparent hover:border-gray-200'
                            }
                          `}
                          onClick={() => onPlacemarkClick(placemark)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                              <span className="truncate font-medium">{placemark.name}</span>
                              <span className="text-xs text-gray-500 capitalize">
                                {placemark.type}
                              </span>
                            </div>
                            {placemark.distance && (
                              <span className="text-xs text-gray-500 ml-2">
                                {placemark.distance}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {categoryPlacemarks.length > 10 && (
                      <div className="px-6 py-2 text-xs text-gray-500 italic">
                        ... and {categoryPlacemarks.length - 10} more items
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};