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
import { PLACEMARK_CATEGORIES } from './PlaceMark';

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
  const [isLayersExpanded, setIsLayersExpanded] = useState(true);

  const handleSelectAllLayers = () => {
    const allVisible = categories.every(cat => visibleCategories.has(cat.id));
    categories.forEach(category => {
      onCategoryVisibilityChange(category.id, !allVisible);
    });
  };

  const handleLayerSelection = (categoryId: string) => {
    const isVisible = visibleCategories.has(categoryId);
    onCategoryVisibilityChange(categoryId, !isVisible);
  };

  const getColorClass = (color: string) => {
    return `text-[${color}]`;
  };

  // Create default categories with zero counts when no data is available
  const displayCategories = categories.length === 0 
    ? Object.entries(PLACEMARK_CATEGORIES).map(([name, config]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        count: 0,
        visible: false,
        color: config.color,
        icon: config.icon
      }))
    : categories;

  const hasData = categories.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              LANDBASE LAYERS
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {hasData 
                ? `${placemarks.length} placemarks • ${categories.length} categories`
                : 'No data available'
              }
            </p>
          </div>
          <button
            onClick={() => setIsLayersExpanded(!isLayersExpanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            {isLayersExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Layers Content */}
      {isLayersExpanded && (
        <div className="p-3">
          {/* Select All - only show if there's data */}
          {hasData && (
            <div className="mb-3">
              <label className="flex items-center py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categories.every(cat => visibleCategories.has(cat.id))}
                  onChange={handleSelectAllLayers}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-medium">Select All</span>
              </label>
            </div>
          )}

          {/* Layers List */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {displayCategories.map((category) => (
              <div key={category.id} className="flex items-center justify-between group">
                <label className="flex items-center flex-1 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasData && visibleCategories.has(category.id)}
                    onChange={() => hasData && handleLayerSelection(category.id)}
                    disabled={!hasData}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span 
                    className="mr-2 text-lg"
                    style={{ color: hasData ? category.color : '#9CA3AF' }}
                  >
                    {category.icon}
                  </span>
                  <div className="flex items-center justify-between flex-1">
                    <span className={`text-sm ${hasData ? 'text-gray-600' : 'text-gray-400'}`}>
                      {category.name}
                    </span>
                    <span 
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ml-2 ${
                        hasData ? '' : 'opacity-50'
                      }`}
                      style={{ backgroundColor: hasData ? category.color : '#9CA3AF' }}
                    >
                      {category.count}
                    </span>
                  </div>
                </label>
                
                {/* Layer visibility toggle */}
                <div className="flex items-center ml-2">
                  <button
                    onClick={() => hasData && handleLayerSelection(category.id)}
                    disabled={!hasData}
                    className={`
                      p-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                      ${hasData && visibleCategories.has(category.id)
                        ? 'text-blue-600 hover:bg-blue-50' 
                        : 'text-gray-400 hover:bg-gray-100'
                      }
                    `}
                    title={hasData 
                      ? (visibleCategories.has(category.id) ? 'Hide layer' : 'Show layer')
                      : 'No data available'
                    }
                  >
                    {hasData && visibleCategories.has(category.id) ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Individual Placemarks (expandable sections) - only show if there's data */}
          {hasData && categories.map((category) => {
            const categoryPlacemarks = placemarks.filter(p => p.category === category.name);
            const isVisible = visibleCategories.has(category.id);
            
            if (!isVisible || categoryPlacemarks.length === 0) return null;

            return (
              <div key={`${category.id}-items`} className="mt-4 border-t border-gray-100 pt-3">
                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <span style={{ color: category.color }}>{category.icon}</span>
                  {category.name} Items
                </div>
                <div className="space-y-1 ml-4">
                  {categoryPlacemarks.slice(0, 5).map((placemark) => {
                    const isHighlighted = highlightedPlacemark?.id === placemark.id;
                    
                    return (
                      <div
                        key={placemark.id}
                        className={`
                          px-2 py-1 cursor-pointer transition-all text-xs rounded border-l-2
                          ${isHighlighted 
                            ? 'bg-blue-100 border-blue-400 text-blue-900' 
                            : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                          }
                        `}
                        onClick={() => onPlacemarkClick(placemark)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{placemark.name}</span>
                            <span className="text-xs text-gray-400 capitalize">
                              {placemark.type}
                            </span>
                          </div>
                          {placemark.distance && (
                            <span className="text-xs text-gray-400 ml-2">
                              {placemark.distance}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {categoryPlacemarks.length > 5 && (
                    <div className="px-2 py-1 text-xs text-gray-400 italic">
                      ... and {categoryPlacemarks.length - 5} more items
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* No data message */}
          {!hasData && (
            <div className="mt-4 text-center text-gray-400">
              <p className="text-xs">Select a KML/KMZ file or block to see placemark data</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};