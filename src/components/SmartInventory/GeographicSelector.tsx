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
}

interface District {
  id: string;
  name: string;
  code: string;
  selected: boolean;
  expanded: boolean;
  blocks: Block[];
}

interface State {
  id: string;
  name: string;
  code: string;
  selected: boolean;
  expanded: boolean;
  districts: District[];
}



interface GeographicSelectorProps {
  BASEURL: string;
  onSelectionChange?: (selectedStates: string[], selectedDistricts: string[], selectedBlocks: string[]) => void;
  onPreview?: (item: { type: 'state' | 'district' | 'block'; selectedStates: string[]; selectedDistricts: string[]; selectedBlocks: string[]; name: string }) => void;
  onRefresh?: (item: { type: 'state' | 'district' | 'block' | 'universal'; selectedStates: string[]; selectedDistricts: string[]; selectedBlocks: string[]; name: string }) => void;
  isLoadingPhysical?: boolean
}

export const GeographicSelector: React.FC<GeographicSelectorProps> = ({
  BASEURL,
  onSelectionChange,
  onPreview,
  onRefresh,
  isLoadingPhysical
}) => {
  const [isDistrictExpanded, setIsDistrictExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);

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
  const fetchDistricts = async (stateCode: string) => {
    try {
      const data = await getDistrictData(stateCode);
      const districtsData = data.map((district: any) => ({
        id: district.district_id,
        name: district.district_name,
        code: district.district_code,
        selected: false,
        expanded: false,
        blocks: []
      }));

      return districtsData;

    } catch (error) {
      console.error('Error fetching districts:', error);
      return [];
    }
  };

  // Fetch blocks when district is expanded
  const fetchBlocks = async (districtCode: string) => {
    try {
      const data = await getBlockData(districtCode)
      const blocksData = data.map((block: any) => ({
        id: block.block_id,
        name: block.block_name,
        code: block.block_code,
        selected: false
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
                fetchBlocks(districtId).then(blocks => {
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



  const handlePreview = (type: 'state' | 'district' | 'block', id: string, name: string) => {
    const selectedIds = getSelectedIds();
    onPreview?.({
      type,
      selectedStates: selectedIds.states,
      selectedDistricts: selectedIds.districts,
      selectedBlocks: selectedIds.blocks,
      name
    });
    // onPreview?.({ type,stateId,DistId,BlockId,name });
  };

  const handleRefresh = (type: 'state' | 'district' | 'block', id: string, name: string) => {
    // onRefresh?.({ type,stateId,DistId,BlockId,name });
    const selectedIds = getSelectedIds();
    onRefresh?.({
      type,
      selectedStates: selectedIds.states,
      selectedDistricts: selectedIds.districts,
      selectedBlocks: selectedIds.blocks,
      name,

    });

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

  const handleUniversalRefresh = () => {
    const selectedIds = getSelectedIds();
    onRefresh?.({
      type: 'universal',
      selectedStates: selectedIds.states,
      selectedDistricts: selectedIds.districts,
      selectedBlocks: selectedIds.blocks,
      name: 'All Selected Items',
    });
  };




  return (
    <div className="space-y-4">

      {/* District/Division Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {/* Header */}
        <div className="border-b  border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">

          <button
            onClick={() => setIsDistrictExpanded(!isDistrictExpanded)}
            className="w-full flex items-center justify-between p-3 "
          >
            <span className="font-semibold text-gray-900 text-sm">DISTRICT/DIVISION</span>
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
                  ${isLoadingPhysical
                    ? 'border-gray-300 bg-blue-100'
                    : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
                  }
                  duration-200 gap-2
                  text-sm font-medium text-gray-700
                `}
                title='Reload'
              >
                {isLoadingPhysical ?
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
                placeholder="Search"
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
                                        onClick={() => handlePreview('block', block.id, block.name)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="Preview"
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