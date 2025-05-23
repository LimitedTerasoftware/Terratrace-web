import React, { useState, useEffect } from 'react';
import { User, UserRoundCheck } from 'lucide-react';

// Interface for the API responses
interface KmlFilesResponse {
  files: string[];
}

interface VerifiedNetworksResponse {
  success: boolean;
  data: VerifiedNetwork[];
  message: string;
}

interface VerifiedNetwork {
  id: number;
  name: string;
  total_length: string;
  main_point_name: string;
  created_at: string;
}

// Interface for filters
interface Filters {
  district: string;
  block: string;
  gramPanchayat: string;
  status: string;
  assignedTo: string;
}

const RouteListWithApi = () => {
  const [unverifiedFiles, setUnverifiedFiles] = useState<string[]>([]);
  const [verifiedNetworks, setVerifiedNetworks] = useState<VerifiedNetwork[]>([]);
  const [loadingUnverified, setLoadingUnverified] = useState<boolean>(false);
  const [loadingVerified, setLoadingVerified] = useState<boolean>(false);
  const [unverifiedError, setUnverifiedError] = useState<string | null>(null);
  const [verifiedError, setVerifiedError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'verified' | 'unverified'>('unverified');
  
  // Track whether each tab's data has been loaded
  const [unverifiedLoaded, setUnverifiedLoaded] = useState<boolean>(false);
  const [verifiedLoaded, setVerifiedLoaded] = useState<boolean>(false);

  // State for assign button icon toggle
  const [isAssigned, setIsAssigned] = useState<boolean>(false);

  // Selection states
  const [selectedUnverifiedFiles, setSelectedUnverifiedFiles] = useState<Set<number>>(new Set());
  const [selectedVerifiedNetworks, setSelectedVerifiedNetworks] = useState<Set<number>>(new Set());

  // Filter states
  const [filters, setFilters] = useState<Filters>({
    district: '',
    block: '',
    gramPanchayat: '',
    status: '',
    assignedTo: ''
  });

  // Sample data for dropdowns (you can replace with API calls)
  const filterOptions = {
    districts: ['All Districts', 'Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    blocks: ['All Blocks', 'Block 1', 'Block 2', 'Block 3', 'Block 4'],
    gramPanchayats: ['All Gram Panchayats', 'GP 1', 'GP 2', 'GP 3', 'GP 4'],
    statuses: ['All Status', 'Pending', 'In Progress', 'Completed', 'On Hold'],
    assignedTo: ['All Assigned', 'John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson']
  };

  // Function to handle assign button click
  const handleAssignClick = () => {
    setIsAssigned(true);
    
    // Reset back to User icon after 3 seconds
    setTimeout(() => {
      setIsAssigned(false);
    }, 3000);
  };

  // Function to fetch unverified files
  const fetchUnverifiedFiles = async () => {
    if (unverifiedLoaded) return; // Skip if already loaded
    
    try {
      setLoadingUnverified(true);
      setUnverifiedError(null);
      
      const response = await fetch('https://traceapi.keeshondcoin.com/list-kml-files');
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data: KmlFilesResponse = await response.json();
      setUnverifiedFiles(data.files || []);
      setUnverifiedLoaded(true);
    } catch (error) {
      console.error('Error fetching unverified files:', error);
      setUnverifiedError(error.message);
    } finally {
      setLoadingUnverified(false);
    }
  };

  // Function to fetch verified networks
  const fetchVerifiedNetworks = async () => {
    if (verifiedLoaded) return; // Skip if already loaded
    
    try {
      setLoadingVerified(true);
      setVerifiedError(null);
      
      const response = await fetch('https://traceapi.keeshondcoin.com/get-verified-netwrorks');
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data: VerifiedNetworksResponse = await response.json();
      setVerifiedNetworks(data.success ? data.data : []);
      setVerifiedLoaded(true);
    } catch (error) {
      console.error('Error fetching verified networks:', error);
      setVerifiedError(error.message);
    } finally {
      setLoadingVerified(false);
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'unverified') {
      fetchUnverifiedFiles();
    } else if (activeTab === 'verified') {
      fetchVerifiedNetworks();
    }
  }, [activeTab]);

  // Extract location from filename
  const extractLocation = (filename: string): string => {
    // Look for patterns like LOCATION-SOMETHING or LOCATION SOMETHING
    const parts = filename.split('_')[0]; // Get everything before first underscore
    
    // Replace hyphens and handle exchange/olt naming
    return parts
      .replace(/-/g, ' ')
      .replace('BSNL EXCHANGE', '')
      .replace('TELEPHONE EXCHANGE', '')
      .replace('OLT', '')
      .trim();
  };

  // Extract type from filename
  const extractRouteType = (filename: string): string => {
    // Order matters here - check for dummy first since some dummy files also contain AI
    if (filename.includes('_dummy_')) return 'DUMMY';
    if (filename.includes('_AI_')) return 'AI';
    if (filename.includes('_AUTO_')) return 'AUTO';
    return 'UNKNOWN';
  };

  // Get badge style based on route type
  const getRouteBadge = (routeType: string) => {
    switch (routeType.toUpperCase()) {
      case 'AI':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'AUTO':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'DUMMY':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Handle tab switch
  const handleTabSwitch = (tab: 'verified' | 'unverified') => {
    setActiveTab(tab);
  };

  // Handle filter changes
  const handleFilterChange = (filterType: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      district: '',
      block: '',
      gramPanchayat: '',
      status: '',
      assignedTo: ''
    });
  };

  // Handle individual row selection for unverified files
  const handleUnverifiedFileSelection = (index: number) => {
    setSelectedUnverifiedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Handle select all for unverified files
  const handleSelectAllUnverified = () => {
    if (selectedUnverifiedFiles.size === unverifiedFiles.length) {
      setSelectedUnverifiedFiles(new Set());
    } else {
      setSelectedUnverifiedFiles(new Set(unverifiedFiles.map((_, index) => index)));
    }
  };

  // Handle individual row selection for verified networks
  const handleVerifiedNetworkSelection = (id: number) => {
    setSelectedVerifiedNetworks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle select all for verified networks
  const handleSelectAllVerified = () => {
    if (selectedVerifiedNetworks.size === verifiedNetworks.length) {
      setSelectedVerifiedNetworks(new Set());
    } else {
      setSelectedVerifiedNetworks(new Set(verifiedNetworks.map(network => network.id)));
    }
  };

  return (
    <div className="sm:p-2 lg:p-4 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-100">
          Route List
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Filters Section - Above Tabs */}
      <div className="mb-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* District Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={filters.district}
              onChange={(e) => handleFilterChange('district', e.target.value)}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {filterOptions.districts.map((district) => (
                <option key={district} value={district === 'All Districts' ? '' : district}>
                  {district}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Block Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={filters.block}
              onChange={(e) => handleFilterChange('block', e.target.value)}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {filterOptions.blocks.map((block) => (
                <option key={block} value={block === 'All Blocks' ? '' : block}>
                  {block}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Gram Panchayat Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={filters.gramPanchayat}
              onChange={(e) => handleFilterChange('gramPanchayat', e.target.value)}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {filterOptions.gramPanchayats.map((gp) => (
                <option key={gp} value={gp === 'All Gram Panchayats' ? '' : gp}>
                  {gp}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-28">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {filterOptions.statuses.map((status) => (
                <option key={status} value={status === 'All Status' ? '' : status}>
                  {status}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Assigned To Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={filters.assignedTo}
              onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {filterOptions.assignedTo.map((person) => (
                <option key={person} value={person === 'All Assigned' ? '' : person}>
                  {person}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={clearFilters}
            className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
          >
            <span className="text-red-500 dark:text-red-400 font-medium text-sm">✕</span>
            <span>Clear Filters</span>
          </button>

          {/* Assign Button */}
          <button
            onClick={handleAssignClick}
            className="flex-none h-10 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 outline-none whitespace-nowrap flex items-center gap-1.5"
            style={{ backgroundColor: '#a855a7' }}
          >
            {isAssigned ? (
              <UserRoundCheck className="w-4 h-4" />
            ) : (
              <User className="w-4 h-4" />
            )}
            <span>Assign</span>
          </button>
        </div>
      </div>
      
      {/* Tabs - Below Filters */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg outline-none ${
                activeTab === 'unverified'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => handleTabSwitch('unverified')}
            >
              Unverified Files
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg outline-none ${
                activeTab === 'verified'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => handleTabSwitch('verified')}
            >
              Verified Files
            </button>
          </li>
        </ul>
      </div>
      
      {/* Unverified Files Tab */}
      {activeTab === 'unverified' && (
        <div className="overflow-x-auto relative">
          {/* Error message if API request failed */}
          {unverifiedError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
              <span className="font-medium">Error loading unverified files:</span> {unverifiedError}
            </div>
          )}
          
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3"></th>
                <th scope="col" className="px-6 py-3">File Name</th>
                <th scope="col" className="px-6 py-3">Location</th>
                <th scope="col" className="px-6 py-3">Route Type</th>
              </tr>
            </thead>
            <tbody>
              {loadingUnverified ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : unverifiedFiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    No unverified files found.
                  </td>
                </tr>
              ) : (
                unverifiedFiles.map((filename, index) => {
                  const routeType = extractRouteType(filename);
                  return (
                    <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUnverifiedFiles.has(index)}
                          onChange={() => handleUnverifiedFileSelection(index)}
                          className="w-4 h-4 rounded focus:ring-0 outline-none border-2 border-blue-900 checked:bg-blue-900 checked:border-blue-900"
                          style={{
                            accentColor: 'rgb(30, 58, 138)' // text-blue-900 equivalent
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {filename}
                      </td>
                      <td className="px-6 py-4">{extractLocation(filename)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${getRouteBadge(routeType)}`}>
                          {routeType}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Verified Networks Tab */}
      {activeTab === 'verified' && (
        <div className="overflow-x-auto relative">
          {/* Error message if API request failed */}
          {verifiedError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
              <span className="font-medium">Error loading verified networks:</span> {verifiedError}
            </div>
          )}
          
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3"></th>
                <th scope="col" className="px-6 py-3">Network Name</th>
                <th scope="col" className="px-6 py-3">Main Point</th>
                <th scope="col" className="px-6 py-3">Total Length (km)</th>
                <th scope="col" className="px-6 py-3">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loadingVerified ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : verifiedNetworks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    No verified networks found.
                  </td>
                </tr>
              ) : (
                verifiedNetworks.map((network) => (
                  <tr key={network.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedVerifiedNetworks.has(network.id)}
                        onChange={() => handleVerifiedNetworkSelection(network.id)}
                        className="w-4 h-4 rounded focus:ring-0 outline-none border-2 border-blue-900 checked:bg-blue-900 checked:border-blue-900"
                        style={{
                          accentColor: 'rgb(30, 58, 138)' // text-blue-900 equivalent
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {network.name}
                    </td>
                    <td className="px-6 py-4">
                      {network.main_point_name}
                    </td>
                    <td className="px-6 py-4">
                      {parseFloat(network.total_length).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(network.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RouteListWithApi;