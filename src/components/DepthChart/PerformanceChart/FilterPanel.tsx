import React from 'react';
import { Search, Calendar } from 'lucide-react';
import { FilterState } from '../../../types/survey';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApplyFilters: () => void;
  loading: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  loading
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Machine ID
          </label>
          <input
            type="text"
            value={filters.machineId}
            onChange={(e) => onFiltersChange({ ...filters, machineId: e.target.value })}
            placeholder="Enter machine ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Month
          </label>
          <select
            value={filters.month}
            onChange={(e) => onFiltersChange({ ...filters, month: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => onFiltersChange({ ...filters, year: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={onApplyFilters}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </div>
      </div>
    </div>
  );
};