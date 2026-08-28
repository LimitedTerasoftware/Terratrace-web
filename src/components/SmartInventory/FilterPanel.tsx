import React, { useEffect, useState } from 'react';
import { Search, Filter, X, ChevronUp, ChevronDown } from 'lucide-react';
import { FilterState } from '../../types/kmz';
import axios from 'axios';
import { getAuthHeaders } from '../../utils/accessControl';
import SearchableSelect from '../Forms/SearchableSelect';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilesCount: number;
  fileCategory?: string; // New optional prop
  onFileCategoryChange?: (category: string) => void; // New optional prop
}

interface StateData {
  state_id: string;
  state_name: string;
  state_code: string;
}

interface District {
  district_id: string;
  district_name: string;
  state_code: string;
}

interface Block {
  block_id: string;
  block_name: string;
  district_code: string;
}

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  selectedFilesCount,
  fileCategory = '',
  onFileCategoryChange
}) => {
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Category options for the dropdown - Updated to include BSNL
  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'Survey', label: 'Physical Survey' },
    { value: 'Desktop', label: 'Desktop Planning' },
    { value: 'BSNL_Cables', label: 'O & M' }
  ];

  useEffect(() => {
    axios.get(`${TraceBASEURL}/states`, { headers: getAuthHeaders() })
      .then((res) => setStates(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (filters.state) {
      axios.get(`${TraceBASEURL}/districtsdata?state_code=${filters.state}`, { headers: getAuthHeaders() })
        .then((res) => setDistricts(res.data))
        .catch((err) => console.error(err));
    } else {
      setDistricts([]);
      handleFilterChange('division', '')
    }
  }, [filters.state]);

  useEffect(() => {
    if (filters.division) {
      axios.get(`${TraceBASEURL}/blocksdata?district_code=${filters.division}`, { headers: getAuthHeaders() })
        .then((res) => setBlocks(res.data))
        .catch((err) => console.error(err));
    } else {
      setBlocks([]);
      handleFilterChange('block', '')
    }
  }, [filters.division]);

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '') || fileCategory !== '';

  const clearFilters = () => {
    onFiltersChange({});
    onSearchChange('');
    if (onFileCategoryChange) {
      onFileCategoryChange('');
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filters & Search
          {selectedFilesCount > 1 && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              {selectedFilesCount} files
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* File Category Filter - Always visible */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">File Category</label>
        <div className="relative">
          <SearchableSelect
            value={fileCategory}
            onChange={(value) => onFileCategoryChange?.(value)}
            options={categoryOptions.filter((option) => option.value !== '')}
            placeholder="All Categories"
            className="text-sm"
          />
        </div>
      </div>

      {isExpanded && (
        <div className="max-h-64 overflow-y-auto space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search placemarks..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Location Filters */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
              <SearchableSelect
                value={filters.state || ''}
                onChange={(value) => handleFilterChange('state', value)}
                options={states.map((state) => ({ value: String(state.state_id), label: state.state_name }))}
                placeholder="All States"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
              <SearchableSelect
                value={filters.division || ''}
                onChange={(value) => handleFilterChange('division', value)}
                options={districts.map((district) => ({ value: String(district.district_id), label: district.district_name }))}
                placeholder="All Districts"
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Block</label>
              <SearchableSelect
                value={filters.block || ''}
                onChange={(value) => handleFilterChange('block', value)}
                options={blocks.map((block) => ({ value: String(block.block_id), label: block.block_name }))}
                placeholder="All Blocks"
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};