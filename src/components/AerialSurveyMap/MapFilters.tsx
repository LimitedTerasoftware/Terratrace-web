import { MapFilters as MapFiltersType } from '../../types/aerial-survey';

interface MapFiltersProps {
  filters: MapFiltersType;
  onFilterChange: (filters: MapFiltersType) => void;
  surveyCount: number;
}

export default function MapFilters({ filters, onFilterChange, surveyCount }: MapFiltersProps) {
  const handleToggle = (key: keyof MapFiltersType) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 w-64">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Map Filters</h3>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showStartEndGP}
              onChange={() => handleToggle('showStartEndGP')}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Start & End GP</span>
          </label>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showPoles}
              onChange={() => handleToggle('showPoles')}
              className="w-4 h-4 text-orange-500 rounded focus:ring-2 focus:ring-orange-400"
            />
            <span className="ml-2 text-sm text-gray-700">Poles New & Existing</span>
          </label>
           <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showCrossings}
              onChange={() => handleToggle('showCrossings')}
              className="w-4 h-4 rounded focus:ring-2 focus:ring-purple-500"
              style={{ accentColor: '#8b5cf6' }}
            />
            <span className="ml-2 text-sm text-gray-700">Road Crossings</span>
          </label>
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
        </div>

        {/* <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.showPolylines}
              onChange={() => handleToggle('showPolylines')}
              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <span className="ml-2 text-sm text-gray-700">Survey Lines</span>
          </label>
          <div className="w-8 h-0.5 bg-green-500"></div>
        </div> */}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <span className="font-semibold">{surveyCount}</span> survey{surveyCount !== 1 ? 's' : ''} loaded
        </p>
      </div>
    </div>
  );
}
