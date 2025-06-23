import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { FilterState } from '../../types/kmz';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  metadata: {
    states: string[];
    divisions: string[];
    blocks: string[];
    categories: string[];
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFilesCount: number;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  metadata,
  searchQuery,
  onSearchChange,
  selectedFilesCount
}) => {
  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  const clearFilters = () => {
    onFiltersChange({});
    onSearchChange('');
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    });
  };

  if (selectedFilesCount === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-500 py-4">
          <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select files to use filters</p>
        </div>
      </div>
    );
  }

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
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

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
        {metadata.states.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
            <select
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">All States</option>
              {metadata.states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        )}

        {metadata.divisions.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Division</label>
            <select
              value={filters.division || ''}
              onChange={(e) => handleFilterChange('division', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">All Divisions</option>
              {metadata.divisions.map((division) => (
                <option key={division} value={division}>{division}</option>
              ))}
            </select>
          </div>
        )}

        {metadata.blocks.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Block</label>
            <select
              value={filters.block || ''}
              onChange={(e) => handleFilterChange('block', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">All Blocks</option>
              {metadata.blocks.map((block) => (
                <option key={block} value={block}>{block}</option>
              ))}
            </select>
          </div>
        )}

        {metadata.categories.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">All Categories</option>
              {metadata.categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            Showing filtered results
          </div>
        </div>
      )}
    </div>
  );
};