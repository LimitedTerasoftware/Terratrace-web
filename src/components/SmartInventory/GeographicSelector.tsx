import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Eye, 
  RotateCcw,
  Minus,
  Plus,
  HelpCircle,
  Printer
} from 'lucide-react';

interface District {
  id: string;
  name: string;
  code: string;
  selected: boolean;
}

interface State {
  id: string;
  name: string;
  code: string;
  selected: boolean;
  expanded: boolean;
  districts: District[];
}

interface Layer {
  id: string;
  name: string;
  selected: boolean;
  color: string;
  icon: string;
}

interface GeographicSelectorProps {
  onSelectionChange?: (selectedStates: string[], selectedDistricts: string[]) => void;
  onPreview?: (item: { type: 'state' | 'district'; id: string; name: string }) => void;
  onRefresh?: (item: { type: 'state' | 'district'; id: string; name: string }) => void;
}

// Sample data structure
const SAMPLE_DATA: State[] = [
 {
    id: 'west-bengal',
    name: 'West Bengal',
    code: 'WB',
    selected: false,
    expanded: true,
    districts: [
      {
        id: 'alipurduar',
        name: 'Alipurduar',
        code: 'ALI',
        selected: true
      },
      {
        id: 'baliganj',
        name: 'Baliganj',
        code: 'BALI',
        selected: false
      },
      {
        id: 'bankura',
        name: 'Bankura',
        code: 'BAN',
        selected: false
      },
      {
        id: 'barddhaman',
        name: 'Barddhaman',
        code: 'BAR',
        selected: false
      },
      {
        id: 'behiahanj',
        name: 'Behiahanj',
        code: 'BEHL',
        selected: false
      },
      {
        id: 'birbhum',
        name: 'Birbhum',
        code: 'BIR',
        selected: false
      },
      {
        id: 'dakshin-dinajpur',
        name: 'Dakshin Dinajpur',
        code: 'DD',
        selected: false
      },
      {
        id: 'darjiling',
        name: 'Darjiling',
        code: 'DAR',
        selected: false
      },
      {
        id: 'howrah',
        name: 'HOWRAH',
        code: 'HOW',
        selected: false
      },
      {
        id: 'hugli',
        name: 'Hugli',
        code: 'HUG',
        selected: false
      },
      {
        id: 'jalpaiguri',
        name: 'Jalpaiguri',
        code: 'JAL',
        selected: false
      },
      {
        id: 'jhargram',
        name: 'Jhargram',
        code: 'JHR',
        selected: false
      },
      {
        id: 'kalimpong',
        name: 'Kalimpong',
        code: 'KMG',
        selected: false
      },
      {
        id: 'koch-bihar',
        name: 'Koch Bihar',
        code: 'KOC',
        selected: false
      },
      {
        id: 'kolkata',
        name: 'Kolkata',
        code: 'KOL',
        selected: false
      },
      {
        id: 'maldah',
        name: 'Maldah',
        code: 'MAL',
        selected: false
      },
      {
        id: 'murshidabad',
        name: 'Murshidabad',
        code: 'MUR',
        selected: false
      },
      {
        id: 'nadia',
        name: 'Nadia',
        code: 'NAD',
        selected: false
      },
      {
        id: 'north-twenty-four-parganas',
        name: 'North Twenty Four P...',
        code: 'N24P',
        selected: false
      }
    ]
  },
 
];

const LAYER_DATA: Layer[] = [
  { id: 'route-indicator', name: 'Route Indicator', selected: false, color: 'yellow', icon: '●' },
  { id: 'railway', name: 'railway', selected: false, color: 'black', icon: '═' },
  { id: 'bridge', name: 'Bridge', selected: false, color: 'blue', icon: '═' },
  { id: 'road', name: 'Road', selected: false, color: 'orange', icon: '═' },
  { id: 'crossing', name: 'Crossing', selected: false, color: 'blue', icon: '═' },
  { id: 'road-edge', name: 'Road Edge', selected: false, color: 'red', icon: '📍' },
  { id: 'building', name: 'Building', selected: false, color: 'red', icon: '📍' },
  { id: 'electric-utility', name: 'Electric Utility', selected: false, color: 'orange', icon: '═' },
  { id: 'landmark', name: 'Landmark', selected: false, color: 'brown', icon: '📍' },
  { id: 'parcels', name: 'Parcels', selected: false, color: 'yellow', icon: '▢' },
  { id: 'critical-patch', name: 'Critical Patch', selected: false, color: 'brown', icon: '●' },
  { id: 'buildings', name: 'Buildings', selected: false, color: 'yellow', icon: '▢' },
  { id: 'hydrology', name: 'Hydrology', selected: false, color: 'cyan', icon: '═' },
  { id: 'pit', name: 'Pit', selected: false, color: 'black', icon: '●' },
  { id: 'depth-measurement', name: 'Depth Measurement', selected: false, color: 'pink', icon: '●' },
  { id: 'culvert', name: 'Culvert', selected: false, color: 'black', icon: '═' },
  { id: 'row', name: 'ROW', selected: false, color: 'black', icon: '═' },
  { id: 'double-track-railway', name: 'Double track Railway line', selected: false, color: 'orange', icon: '═' }
];

export const GeographicSelector: React.FC<GeographicSelectorProps> = ({
  onSelectionChange,
  onPreview,
  onRefresh
}) => {
  const [isDistrictExpanded, setIsDistrictExpanded] = useState(true);
  const [isLayersExpanded, setIsLayersExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<State[]>(SAMPLE_DATA);
  const [layers, setLayers] = useState<Layer[]>(LAYER_DATA);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    return data.map(state => ({
      ...state,
      districts: state.districts.filter(district =>
        district.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        district.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(state => 
      state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.districts.length > 0
    );
  }, [data, searchQuery]);

  const handleStateToggle = (stateId: string) => {
    setData(prev => prev.map(state => ({
      ...state,
      expanded: state.id === stateId ? !state.expanded : state.expanded
    })));
  };

  const handleStateSelection = (stateId: string) => {
    setData(prev => prev.map(state => {
      if (state.id === stateId) {
        const newSelected = !state.selected;
        return {
          ...state,
          selected: newSelected,
          districts: state.districts.map(district => ({
            ...district,
            selected: newSelected
          }))
        };
      }
      return state;
    }));
    
    // Trigger callback
    triggerSelectionCallback();
  };

  const handleDistrictSelection = (stateId: string, districtId: string) => {
    setData(prev => prev.map(state => {
      if (state.id === stateId) {
        const updatedDistricts = state.districts.map(district =>
          district.id === districtId 
            ? { ...district, selected: !district.selected }
            : district
        );
        
        // Only select state if ALL districts are selected
        const allSelected = updatedDistricts.every(d => d.selected);
        
        return {
          ...state,
          selected: allSelected,
          districts: updatedDistricts
        };
      }
      return state;
    }));

    // Trigger callback
    triggerSelectionCallback();
  };

  const triggerSelectionCallback = () => {
    const selectedStates: string[] = [];
    const selectedDistricts: string[] = [];
    
    data.forEach(state => {
      if (state.selected) selectedStates.push(state.id);
      state.districts.forEach(district => {
        if (district.selected) selectedDistricts.push(district.id);
      });
    });
    
    onSelectionChange?.(selectedStates, selectedDistricts);
  };

  const handleLayerSelection = (layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, selected: !layer.selected }
        : layer
    ));
  };

  const handleSelectAllLayers = () => {
    const allSelected = layers.every(layer => layer.selected);
    setLayers(prev => prev.map(layer => ({
      ...layer,
      selected: !allSelected
    })));
  };

  const handlePreview = (type: 'state' | 'district', id: string, name: string) => {
    onPreview?.({ type, id, name });
  };

  const handleRefresh = (type: 'state' | 'district', id: string, name: string) => {
    onRefresh?.({ type, id, name });
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      yellow: 'text-yellow-500',
      black: 'text-gray-800',
      blue: 'text-blue-500',
      orange: 'text-orange-500',
      red: 'text-red-500',
      brown: 'text-amber-700',
      cyan: 'text-cyan-500',
      pink: 'text-pink-500'
    };
    return colorMap[color] || 'text-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* District/Division Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Header */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setIsDistrictExpanded(!isDistrictExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900 text-sm">DISTRICT/DIVISION</span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDistrictExpanded(false);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Minus className="h-3 w-3 text-gray-500" />
              </button>
              {isDistrictExpanded ? (
                <Plus className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        {isDistrictExpanded && (
          <div className="p-3">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Geographic List */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredData.map((state) => (
                <div key={state.id}>
                  {/* State/Country Level */}
                  <div className="flex items-center group">
                    <button
                      onClick={() => handleStateToggle(state.id)}
                      className="p-1 hover:bg-gray-100 rounded mr-1"
                    >
                      {state.expanded ? (
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                      )}
                    </button>
                    
                    <label className="flex items-center flex-1 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.selected}
                        onChange={() => handleStateSelection(state.id)}
                        className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 font-medium">{state.name}</span>
                    </label>
                    
                    {/* State Action Buttons */}
                    {state.selected && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        <button
                          onClick={() => handlePreview('state', state.id, state.name)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Preview"
                        >
                          <Eye className="h-3 w-3 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleRefresh('state', state.id, state.name)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Refresh"
                        >
                          <RotateCcw className="h-3 w-3 text-gray-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Districts */}
                  {state.expanded && (
                    <div className="ml-8 space-y-1 border-l border-gray-200 pl-4">
                      {state.districts.map((district) => (
                        <div key={district.id} className="flex items-center justify-between group">
                          <label className="flex items-center flex-1 py-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={district.selected}
                              onChange={() => handleDistrictSelection(state.id, district.id)}
                              className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-600">
                              {district.name}
                              <span className="text-gray-400 ml-1">({district.code})</span>
                            </span>
                          </label>
                          
                          {/* Action Buttons */}
                          {district.selected && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handlePreview('district', district.id, district.name)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Preview"
                              >
                                <Eye className="h-3 w-3 text-gray-500" />
                              </button>
                              <button
                                onClick={() => handleRefresh('district', district.id, district.name)}
                                className="p-1 hover:bg-gray-100 rounded"
                                title="Refresh"
                              >
                                <RotateCcw className="h-3 w-3 text-gray-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Landbase Layers Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Header */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => setIsLayersExpanded(!isLayersExpanded)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-900 text-sm">LANDBASE LAYERS</span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLayersExpanded(false);
                }}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <Minus className="h-3 w-3 text-gray-500" />
              </button>
              {isLayersExpanded ? (
                <Minus className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </div>
          </button>
        </div>

        {/* Content */}
        {isLayersExpanded && (
          <div className="p-3">
            {/* Action Buttons */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Help"
                >
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Add Layer"
                >
                  <Plus className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Print"
                >
                  <Printer className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">L</span>
            </div>

            {/* Select All */}
            <div className="mb-3">
              <label className="flex items-center py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layers.every(layer => layer.selected)}
                  onChange={handleSelectAllLayers}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-medium">Select All</span>
              </label>
            </div>

            {/* Layers List */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {layers.map((layer) => (
                <div key={layer.id} className="flex items-center justify-between group">
                  <label className="flex items-center flex-1 py-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={layer.selected}
                      onChange={() => handleLayerSelection(layer.id)}
                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`mr-2 ${getColorClass(layer.color)}`}>
                      {layer.icon}
                    </span>
                    <span className="text-sm text-gray-600">{layer.name}</span>
                  </label>
                  
                  {/* Layer visibility toggle */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={layer.selected}
                      onChange={() => handleLayerSelection(layer.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};