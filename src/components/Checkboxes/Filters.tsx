import { useState, useEffect } from 'react';
import { Search, Download } from 'lucide-react';
import { getStateData, getDistrictData, getFirms } from '../Services/api';
import { District, StateData } from '../../types/survey';
import { Firm } from '../../types/firm';

interface FiltersProps {
  selectedState: string;
  selectedDistrict: string;
  selectedVendor: string;
  selectedPeriod: string;
  searchQuery: string;
  onStateChange: (state: string) => void;
  onDistrictChange: (district: string) => void;
  onVendorChange: (vendor: string) => void;
  onPeriodChange: (period: string) => void;
  onSearchChange: (query: string) => void;
  onReset: () => void;
}

export default function Filters({
  selectedState,
  selectedDistrict,
  selectedVendor,
  selectedPeriod,
  searchQuery,
  onStateChange,
  onDistrictChange,
  onVendorChange,
  onPeriodChange,
  onSearchChange,
  onReset,
}: FiltersProps) {
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [vendors, setVendors] = useState<Firm[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);

  useEffect(() => {
    fetchStates();
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
    } else {
      setDistricts([]);
    }
  }, [selectedState]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const data = await getStateData();
      setStates(data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchDistricts = async (stateCode: string) => {
    setLoadingDistricts(true);
    try {
      const data = await getDistrictData(stateCode);
      setDistricts(data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchVendors = async () => {
    setLoadingVendors(true);
    try {
      const data = await getFirms();
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoadingVendors(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[100px]"
          value={selectedState}
          onChange={(e) => onStateChange(e.target.value)}
          disabled={loadingStates}
        >
          <option value="">All States</option>
          {states.map((state) => (
            <option key={state.state_id} value={state.state_id}>
              {state.state_name}
            </option>
          ))}
        </select>

        <select
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[100px]"
          value={selectedDistrict}
          onChange={(e) => onDistrictChange(e.target.value)}
          disabled={loadingDistricts || !selectedState}
        >
          <option value="">All Districts</option>
          {districts.map((district) => (
            <option key={district.district_id} value={district.district_id}>
              {district.district_name}
            </option>
          ))}
        </select>

        <select
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[100px]"
          value={selectedVendor}
          onChange={(e) => onVendorChange(e.target.value)}
          disabled={loadingVendors}
        >
          <option value="">All Vendors</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id.toString()}>
              {vendor.firm_name}
            </option>
          ))}
        </select>

        <select
          className="px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[100px]"
          value={selectedPeriod}
          onChange={(e) => onPeriodChange(e.target.value)}
        >
          <option value="7">Last 7 Days</option>
          <option value="15">Last 15 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>

        <div className="flex-1 min-w-[100px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <button
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg"
          onClick={onReset}
        >
          Reset
        </button>

        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
