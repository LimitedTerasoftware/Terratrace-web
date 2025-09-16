import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Eye,
  RotateCcw,
  Minus,
  Plus,
  RefreshCwIcon,
  Loader
} from 'lucide-react';
import { getBlockData, getDistrictData, getStateData } from '../Services/api';

interface Block {
  id: string;
  name: string;
  code: string;
  selected: boolean;
  parentDistrictId: string; // Track parent district
  parentStateId: string;   // Track parent state
}

interface District {
  id: string;
  name: string;
  code: string;
  selected: boolean;
  expanded: boolean;
  blocks: Block[];
  parentStateId: string;   // Track parent state
}

interface State {
  id: string;
  name: string;
  code: string;
  selected: boolean;
  expanded: boolean;
  districts: District[];
}

interface PreviewDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onPhysicalSurvey: () => void;
  onDesktopPlanning: () => void;
  position: { x: number; y: number };
  dataTypeFilter?: 'physical' | 'desktop';
}

const PreviewDropdown: React.FC<PreviewDropdownProps> = ({
  isOpen,
  onClose,
  onPhysicalSurvey,
  onDesktopPlanning,
  position,
  dataTypeFilter
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      <div 
        className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px]"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        {/* Show Physical Survey option only if not filtered or if filter is 'physical' */}
        {(!dataTypeFilter || dataTypeFilter === 'physical') && (
          <button
            onClick={() => {
              onPhysicalSurvey();
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Physical Survey
          </button>
        )}
        
        {/* Show Desktop Planning option only if not filtered or if filter is 'desktop' */}
        {(!dataTypeFilter || dataTypeFilter === 'desktop') && (
          <button
            onClick={() => {
              onDesktopPlanning();
              onClose();
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Desktop Planning
          </button>
        )}
        
        {/* Show message if both are filtered out (shouldn't happen in practice) */}
        {dataTypeFilter && dataTypeFilter !== 'physical' && dataTypeFilter !== 'desktop' && (
          <div className="px-4 py-2 text-sm text-gray-500">
            No options available
          </div>
        )}
      </div>
    </>
  );
};

interface GeographicSelectorProps {
  BASEURL: string;
  onSelectionChange?: (selectedStates: string[], selectedDistricts: string[], selectedBlocks: string[]) => void;
  onPreview?: (item: { 
    type: 'state' | 'district' | 'block'; 
    selectedStates: string[]; 
    selectedDistricts: string[]; 
    selectedBlocks: string[]; 
    name: string;
    dataType: 'physical' | 'desktop';
    // Add hierarchy context for specific selections
    hierarchyContext?: {
      stateId?: string;
      districtId?: string;
      blockId?: string;
    };
  }) => void;
  onRefresh?: (item: { 
    type: 'state' | 'district' | 'block' | 'universal'; 
    selectedStates: string[]; 
    selectedDistricts: string[]; 
    selectedBlocks: string[]; 
    name: string;
    dataType: 'physical' | 'desktop';
    hierarchyContext?: {
      stateId?: string;
      districtId?: string;
      blockId?: string;
    };
  }) => void;
  isLoadingPhysical?: boolean;
  isLoadingDesktopPlanning?: boolean;
  dataTypeFilter?: 'physical' | 'desktop'; // New prop to filter preview options
}

export const GeographicSelector: React.FC<GeographicSelectorProps> = ({
  BASEURL,
  onSelectionChange,
  onPreview,
  onRefresh,
  isLoadingPhysical,
  isLoadingDesktopPlanning,
  dataTypeFilter
}) => {
  const [isDistrictExpanded, setIsDistrictExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Dropdown state
  const [dropdownState, setDropdownState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    currentItem: {
      type: 'state' | 'district' | 'block' | 'universal';
      id: string;
      name: string;
      // Add hierarchy context for the current item
      hierarchyContext?: {
        stateId?: string;
        districtId?: string;
        blockId?: string;
      };
    } | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    currentItem: null
  });

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      setLoading(true);
      try {
        getStateData().then(data => {
          const statesData = data.map((state: any) => ({
            id: state.state_id,
            name: state.state_name,
            code: state.state_code,
            selected: false,
            expanded: false,
            districts: []
          }));
          setData(statesData);
        })

      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, [BASEURL]);

  // Fetch districts when state is expanded
  const fetchDistricts = async (stateId: string) => {
    try {
      const data = await getDistrictData(stateId);
      const districtsData = data.map((district: any) => ({
        id: district.district_id,
        name: district.district_name,
        code: district.district_code,
        selected: false,
        expanded: false,
        blocks: [],
        parentStateId: stateId  // Track parent state
      }));

      return districtsData;

    } catch (error) {
      console.error('Error fetching districts:', error);
      return [];
    }
  };

  // Fetch blocks when district is expanded
  const fetchBlocks = async (districtId: string, stateId: string) => {
    try {
      const data = await getBlockData(districtId)
      const blocksData = data.map((block: any) => ({
        id: block.block_id,
        name: block.block_name,
        code: block.block_code,
        selected: false,
        parentDistrictId: districtId,  // Track parent district
        parentStateId: stateId         // Track parent state
      }));
      return blocksData;

    } catch (error) {
      console.error('Error fetching blocks:', error);
      return [];
    }
  };

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    return data.map(state => ({
      ...state,
      districts: state.districts.map(district => ({
        ...district,
        blocks: district.blocks.filter(block =>
          block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          block.code.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(district =>
        district.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        district.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        district.blocks.length > 0
      )
    })).filter(state =>
      state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.districts.length > 0
    );
  }, [data, searchQuery]);

  const handleStateToggle = async (stateId: string) => {
    setData(prev => prev.map(state => {
      if (state.id === stateId) {
        const newExpanded = !state.expanded;
        // Fetch districts if expanding and districts not loaded
        if (newExpanded && state.districts.length === 0) {
          fetchDistricts(stateId).then(districts => {
            setData(prevData => prevData.map(s =>
              s.id === stateId ? { ...s, districts } : s
            ));
          });
        }

        return { ...state, expanded: newExpanded };
      }
      return state;
    }));
  };

  const handleDistrictToggle = async (stateId: string, districtId: string) => {
    setData(prev => prev.map(state => {
      if (state.id === stateId) {
        return {
          ...state,
          districts: state.districts.map(district => {
            if (district.id === districtId) {
              const newExpanded = !district.expanded;
              // Fetch blocks if expanding and blocks not loaded
              if (newExpanded && district.blocks.length === 0) {
                fetchBlocks(districtId, stateId).then(blocks => {
                  setData(prevData => prevData.map(s =>
                    s.id === stateId ? {
                      ...s,
                      districts: s.districts.map(d =>
                        d.id === districtId ? { ...d, blocks } : d
                      )
                    } : s
                  ));
                });
              }
              return { ...district, expanded: newExpanded };
            }
            return district;
          })
        };
      }
      return state;
    }));
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
            selected: newSelected,
            blocks: district.blocks.map(block => ({
              ...block,
              selected: newSelected
            }))
          }))
        };
      }
      return state;
    }));

    triggerSelectionCallback();
  };

  const handleDistrictSelection = (stateId: string, districtId: string) => {
    setData(prev => prev.map(state => {
      if (state.id === stateId) {
        const updatedDistricts = state.districts.map(district => {
          if (district.id === districtId) {
            const newSelected = !district.selected;
            return {
              ...district,
              selected: newSelected,
              blocks: district.blocks.map(block => ({
                ...block,
                selected: newSelected
              }))
            };
          }
          return district;
        });

        // Only select state if ALL districts are selected
        const allDistrictsSelected = updatedDistricts.some(d => d.selected);

        return {
          ...state,
          selected: allDistrictsSelected,
          districts: updatedDistricts
        };
      }
      return state;
    }));

    triggerSelectionCallback();
  };

  const handleBlockSelection = (stateId: string, districtId: string, blockId: string) => {
    setData(prev => prev.map(state => {
      if (state.id === stateId) {
        const updatedDistricts = state.districts.map(district => {
          if (district.id === districtId) {
            const updatedBlocks = district.blocks.map(block =>
              block.id === blockId
                ? { ...block, selected: !block.selected }
                : block
            );

            // Only select district if ALL blocks are selected
            const allBlocksSelected = updatedBlocks.some(b => b.selected);

            return {
              ...district,
              selected: allBlocksSelected,
              blocks: updatedBlocks
            };
          }
          return district;
        });

        // Only select state if ALL districts are selected
        const allDistrictsSelected = updatedDistricts.some(d => d.selected);

        return {
          ...state,
          selected: allDistrictsSelected,
          districts: updatedDistricts
        };
      }
      return state;
    }));

    triggerSelectionCallback();
  };

  const triggerSelectionCallback = () => {
    const selectedStates: string[] = [];
    const selectedDistricts: string[] = [];
    const selectedBlocks: string[] = [];

    data.forEach(state => {
      if (state.selected) selectedStates.push(state.id);
      state.districts.forEach(district => {
        if (district.selected) selectedDistricts.push(district.id);
        district.blocks.forEach(block => {
          if (block.selected) selectedBlocks.push(block.id);
        });
      });
    });
    onSelectionChange?.(selectedStates, selectedDistricts, selectedBlocks);
  };

  const getSelectedIds = () => {
    const selectedStates: string[] = [];
    const selectedDistricts: string[] = [];
    const selectedBlocks: string[] = [];

    data.forEach(state => {
      if (state.selected) selectedStates.push(state.id);
      state.districts.forEach(district => {
        if (district.selected) selectedDistricts.push(district.id);
        district.blocks.forEach(block => {
          if (block.selected) selectedBlocks.push(block.id);
        });
      });
    });

    return {
      states: selectedStates,
      districts: selectedDistricts,
      blocks: selectedBlocks
    };
  };

  // Handle preview dropdown with hierarchy context
  const handlePreviewClick = (
    event: React.MouseEvent,
    type: 'state' | 'district' | 'block' | 'universal',
    id: string,
    name: string
  ) => {
    event.stopPropagation();
    
    // Find hierarchy context based on the clicked item
    let hierarchyContext: { stateId?: string; districtId?: string; blockId?: string } = {};
    
    if (type === 'block') {
      // Find the block and its parents
      data.forEach(state => {
        state.districts.forEach(district => {
          const block = district.blocks.find(b => b.id === id);
          if (block) {
            hierarchyContext = {
              stateId: state.id,
              districtId: district.id,
              blockId: block.id
            };
          }
        });
      });
    } else if (type === 'district') {
      // Find the district and its parent state
      data.forEach(state => {
        const district = state.districts.find(d => d.id === id);
        if (district) {
          hierarchyContext = {
            stateId: state.id,
            districtId: district.id
          };
        }
      });
    } else if (type === 'state') {
      hierarchyContext = {
        stateId: id
      };
    }
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const dropdownWidth = 180; // min-width from dropdown
    
    setDropdownState({
      isOpen: true,
      position: {
        // Position to the left of the button, but ensure it doesn't go off-screen
        x: Math.max(10, rect.left - dropdownWidth + rect.width),
        // Position below the button with some spacing
        y: rect.bottom + 5
      },
      currentItem: { type, id, name, hierarchyContext }
    });
  };

  const handlePhysicalSurvey = () => {
    if (!dropdownState.currentItem) return;
    
    const selectedIds = getSelectedIds();
    onPreview?.({
      type: dropdownState.currentItem.type,
      selectedStates: selectedIds.states,
      selectedDistricts: selectedIds.districts,
      selectedBlocks: selectedIds.blocks,
      name: dropdownState.currentItem.name,
      dataType: 'physical',
      hierarchyContext: dropdownState.currentItem.hierarchyContext
    });
  };

  const handleDesktopPlanning = () => {
    if (!dropdownState.currentItem) return;
    
    const selectedIds = getSelectedIds();
    onPreview?.({
      type: dropdownState.currentItem.type,
      selectedStates: selectedIds.states,
      selectedDistricts: selectedIds.districts,
      selectedBlocks: selectedIds.blocks,
      name: dropdownState.currentItem.name,
      dataType: 'desktop',
      hierarchyContext: dropdownState.currentItem.hierarchyContext
    });
  };

  const handleRefresh = (type: 'state' | 'district' | 'block', id: string, name: string) => {
    const selectedIds = getSelectedIds();
    onRefresh?.({
      type,
      selectedStates: selectedIds.states,
      selectedDistricts: selectedIds.districts,
      selectedBlocks: selectedIds.blocks,
      name,
      dataType: dataTypeFilter || 'physical' // Use dataTypeFilter or default to physical
    });
  };

  const handleUniversalRefresh = () => {
    const selectedIds = getSelectedIds();
    onRefresh?.({
      type: 'universal',
      selectedStates: selectedIds.states,
      selectedDistricts: selectedIds.districts,
      selectedBlocks: selectedIds.blocks,
      name: 'All Selected Items',
      dataType: dataTypeFilter || 'physical' // Use dataTypeFilter or default to physical
    });
  };

  // Determine loading state based on data type filter
  const isUniversalLoading = dataTypeFilter === 'physical' ? isLoadingPhysical : 
                            dataTypeFilter === 'desktop' ? isLoadingDesktopPlanning : 
                            (isLoadingPhysical || isLoadingDesktopPlanning);

  return (
    <div className="space-y-4">
      {/* Preview Dropdown */}
      <PreviewDropdown
        isOpen={dropdownState.isOpen}
        onClose={() => setDropdownState(prev => ({ ...prev, isOpen: false }))}
        onPhysicalSurvey={handlePhysicalSurvey}
        onDesktopPlanning={handleDesktopPlanning}
        position={dropdownState.position}
        dataTypeFilter={dataTypeFilter}
      />

      {/* District/Division Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <button
            onClick={() => setIsDistrictExpanded(!isDistrictExpanded)}
            className="w-full flex items-center justify-between p-3"
          >
            <span className="font-semibold text-gray-900 text-sm">
              {dataTypeFilter === 'physical' ? 'PHYSICAL SURVEY AREAS' :
               dataTypeFilter === 'desktop' ? 'DESKTOP PLANNING AREAS' :
               'DISTRICT/DIVISION'}
            </span>
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
              <button
                onClick={handleUniversalRefresh}
                className={`
                  border-2 border-dashed 
                  w-10 h-10 rounded-full flex items-center justify-center transition-colors 
                  ${isUniversalLoading
                    ? 'border-gray-300 bg-blue-100'
                    : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
                  }
                  duration-200 gap-2
                  text-sm font-medium text-gray-700
                `}
                title={`Reload ${dataTypeFilter === 'physical' ? 'Physical Survey' : 
                                  dataTypeFilter === 'desktop' ? 'Desktop Planning' : 'All'} Data`}
              >
                {isUniversalLoading ?
                  <Loader className="h-4 w-4 animate-spin text-blue-400" /> :
                  <RefreshCwIcon size={18} />
                }
              </button>
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
                placeholder={`Search ${dataTypeFilter === 'physical' ? 'survey' : 
                                     dataTypeFilter === 'desktop' ? 'planning' : ''} areas...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="text-center py-4">
                <div className="text-sm text-gray-500">Loading states...</div>
              </div>
            )}

            {/* Geographic List */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredData.map((state) => (
                <div key={state.id}>
                  {/* State Level */}
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
                          onClick={(e) => handlePreviewClick(e, 'state', state.id, state.name)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Preview Options"
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
                        <div key={district.id}>
                          {/* District Level */}
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center flex-1">
                              <button
                                onClick={() => handleDistrictToggle(state.id, district.id)}
                                className="p-1 hover:bg-gray-100 rounded mr-1"
                              >
                                {district.expanded ? (
                                  <ChevronDown className="h-3 w-3 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-gray-500" />
                                )}
                              </button>

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
                            </div>

                            {/* District Action Buttons */}
                            {district.selected && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => handlePreviewClick(e, 'district', district.id, district.name)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Preview Options"
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

                          {/* Blocks */}
                          {district.expanded && (
                            <div className="ml-8 space-y-1 border-l border-gray-200 pl-4">
                              {district.blocks.map((block) => (
                                <div key={block.id} className="flex items-center justify-between group">
                                  <label className="flex items-center flex-1 py-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={block.selected}
                                      onChange={() => handleBlockSelection(state.id, district.id, block.id)}
                                      className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-600">
                                      {block.name}
                                      <span className="text-gray-400 ml-1">({block.code})</span>
                                    </span>
                                  </label>

                                  {/* Block Action Buttons */}
                                  {block.selected && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => handlePreviewClick(e, 'block', block.id, block.name)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="Preview Options"
                                      >
                                        <Eye className="h-3 w-3 text-gray-500" />
                                      </button>
                                      <button
                                        onClick={() => handleRefresh('block', block.id, block.name)}
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
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};