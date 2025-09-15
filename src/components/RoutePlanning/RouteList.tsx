import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Eye, Trash, X, ChevronDown, RotateCcw, Search, User, Route, SheetIcon} from 'lucide-react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAppContext } from './AppContext';

interface NetworksResponse {
  success: boolean;
  data: Network[];
  message: string;
  total?: number; // Added for server-side pagination
  total_pages?: number; // Alternative if API returns total pages
}

interface Network {
  id: number;
  name: string;
  total_length: string;
  main_point_name: string;
  created_at: string;
  existing_length: string;
  proposed_length: string;
  status: string;
  st_code: string;
  st_name: string;
  dt_code: string;
  dt_name: string;
  user_id: number;
  user_name: string;
}

interface State {
  state_id: number;
  state_code: string;
  state_name: string;
  created_at: string;
  updated_at: string;
}

interface District {
  district_id: number;
  district_code: string;
  district_name: string;
  state_code: string;
}

interface Block {
  block_id: number;
  block_code: string;
  block_name: string;
  district_code: string;
}

interface StatesResponse {
  success: boolean;
  data: State[];
}

type StatusOption = {
  value: string;
  label: string;
};

const RouteList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setPreviewKmlData } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const BASEURL = import.meta.env.VITE_API_BASE;
  const BASEURL_Val = import.meta.env.VITE_TraceAPI_URL;

  // Header component for Route List
  const RouteListHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Route className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Route List Manager</h1>
              <p className="text-sm text-gray-600">Manage and monitor network route planning</p>
            </div>
          </div>
          <nav>
            <ol className="flex items-center gap-2">
              <li>
                <Link className="font-medium" to="/dashboard">
                  Dashboard /
                </Link>
              </li>
              <li className="font-medium text-primary">Route List</li>
            </ol>
          </nav>
        </div>
      </header>
    );
  };

  // Network data states
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<number | null>(null);
  const [AllpreviewLoading, setAllPreviewLoading] = useState<boolean>(false);

  // Load status tracking
  const [networksLoaded, setNetworksLoaded] = useState<boolean>(false);
  const [filtersReady, setFiltersReady] = useState(false);

  // Selection states
  const [selectedNetworks, setSelectedNetworks] = useState<Set<number>>(new Set());

  // Dynamic filter data
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [globalsearch, setGlobalSearch] = useState<string>('');

  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingBlocks, setLoadingBlocks] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    show: boolean;
  }>({
    type: 'success',
    message: '',
    show: false
  });
  
  // Selected filter values
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [excel, setExcel] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0); // For server-side pagination

  // Status options
  const statusOptions: StatusOption[] = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' }
  ];

  // Pagination calculations for server-side pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount);
  const currentNetworks = networks; // Use networks directly since API returns current page

  // Initialize filters from URL parameters
  useEffect(() => {
    const state_id = searchParams.get('state_id') || null;
    const district_id = searchParams.get('district_id') || null;
    const block_id = searchParams.get('block_id') || null;
    const status = searchParams.get('status') || null;
    const from_date = searchParams.get('from_date') || '';
    const to_date = searchParams.get('to_date') || '';
    const search = searchParams.get('search') || '';
    const page = searchParams.get('page') || '1';

    setSelectedState(state_id);
    setSelectedDistrict(district_id);
    setSelectedBlock(block_id);
    setSelectedStatus(status);
    setFromDate(from_date);
    setToDate(to_date);
    setGlobalSearch(search);
    setCurrentPage(parseInt(page));
    setFiltersReady(true);
  }, []);

  // Update URL parameters when filters change
  const handleFilterChange = (
    newState: string | null,
    newDistrict: string | null,
    newBlock: string | null,
    status: string | null,
    from_date: string | null,
    to_date: string | null,
    search: string | null,
    page: number = 1
  ) => {
    const params: Record<string, string> = {};
    if (newState) params.state_id = newState;
    if (newDistrict) params.district_id = newDistrict;
    if (newBlock) params.block_id = newBlock;
    if (status) params.status = status;
    if (from_date) params.from_date = from_date;
    if (to_date) params.to_date = to_date;
    if (search) params.search = search;
    if (page > 1) params.page = page.toString();
    setSearchParams(params);
  };
  
  // Navigate to GP List page
  const handleGPListClick = (networkId: number, networkName: string) => {
    navigate(`/route-planning/route-list/gplist/${networkId}`, {
      state: { 
        networkName
      }
    });
  };

  const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({
      type,
      message,
      show: true
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const getNotificationIcon = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  // Get notification styling
  const getNotificationStyles = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      case 'error':
        return 'bg-red-500 text-white border-red-600';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  // Handle preview button click
  const handlePreviewClick = async (networkId: number) => {
    try {
      setPreviewLoading(networkId);
      
      const response = await fetch(`${BASEURL_Val}/get-networks/${networkId}`);
      
      if (!response.ok) {
        throw new Error(`Preview API request failed with status ${response.status}`);
      }
      
      const data = await response.text();
      
      // Store preview data
      sessionStorage.setItem('previewKmlData', data);
      setPreviewKmlData(data);
      
      window.open('/route-planning/builder', '_blank');
      
    } catch (error) {
      console.error('Error fetching preview data:', error);
      alert(`Error loading preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPreviewLoading(null);
    }
  };
 
  const handleDeleteClick = async(Id: number, name: string) => {
    try {
      const response = await fetch(`${BASEURL_Val}/delete-network/${Id}`, {
        method: 'POST',
      });   
      if (!response.ok) {
        throw new Error(`Delete API request failed with status ${response.status}`);
      }
        
      await response.json();
      showNotification('success', `Successfully Deleted ${name}`);
      fetchNetworks();

    } catch (error) {
      showNotification('error', 'Something went wrong while deleting.');
    }
  }

  // Fetch all states
  const fetchStates = async () => {
    try {
      setLoadingStates(true);
      const response = await fetch(`${BASEURL}/states`);
      if (!response.ok) throw new Error('Failed to fetch states');
      const result: StatesResponse = await response.json();
      setStates(result.success ? result.data : []);
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  // Fetch districts by state ID
  const fetchDistricts = async (stateId: string) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }
    
    try {
      setLoadingDistricts(true);
      
      const response = await fetch(`${BASEURL}/districtsdata?state_code=${stateId}`);
      if (!response.ok) throw new Error('Failed to fetch districts');
      const data = await response.json();
      setDistricts(data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch blocks by district ID
  const fetchBlocks = async (districtId: string) => {
    if (!districtId) {
      setBlocks([]);
      return;
    }
    
    try {
      setLoadingBlocks(true);
      
      const response = await fetch(`${BASEURL}/blocksdata?district_code=${districtId}`);
      if (!response.ok) throw new Error('Failed to fetch blocks');
      const data = await response.json();
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlocks(false);
    }
  };

  // Fetch networks with filters - Updated for server-side pagination
  const fetchNetworks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let url = 'https://api.tricadtrack.com/get-verified-netwrorks';
      const params = new URLSearchParams();
      
      // Add pagination
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      // Send state_id instead of state_code
      const stateToUse = selectedState || '6'; // Default to West Bengal's state_id
      params.append('state_id', stateToUse);
      
      // Add other filters
      if (selectedDistrict) {
        params.append('district_id', selectedDistrict);
      }

      if (selectedBlock) {
        params.append('block_id', selectedBlock);
      }

      if (selectedStatus) {
        params.append('status', selectedStatus);
      }

      if (fromDate) {
        params.append('from_date', fromDate);
      }

      if (toDate) {
        params.append('to_date', toDate);
      }

      if (globalsearch.trim()) {
        params.append('search', globalsearch);
      }
      
      url += '?' + params.toString();
      console.log('Final API URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data: NetworksResponse = await response.json();
      console.log('API Response:', data);
      
      setNetworks(data.success ? data.data : []);
      // Updated to read from the correct API response structure
      const totalFromAPI = data.pagination?.totalRows || data.total || data.data.length;
      setTotalCount(totalFromAPI);
      
      console.log('API Response:', data);
      console.log('Total rows from pagination:', data.pagination?.totalRows);
      console.log('Total count set to:', totalFromAPI);
      
      setNetworksLoaded(true);
    } catch (error) {
      console.error('Error fetching networks:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Load states on mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Load districts when state changes
  useEffect(() => {
    if (selectedState) {
      const selectedStateData = states.find(state => state.state_id.toString() === selectedState);
      if (selectedStateData) {
        fetchDistricts(selectedStateData.state_code);
      }
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
    }
  }, [selectedState, states]);

  // Load blocks when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const selectedDistrictData = districts.find(district => district.district_id?.toString() === selectedDistrict);
      if (selectedDistrictData) {
        fetchBlocks(selectedDistrictData.district_code);
      }
    } else {
      setBlocks([]);
      setSelectedBlock(null);
    }
  }, [selectedDistrict, districts]);

  // Load data when filters change or page changes
  useEffect(() => {
    if (filtersReady) {
      setNetworksLoaded(false);
      fetchNetworks();
    }
  }, [selectedState, selectedDistrict, selectedBlock, selectedStatus, fromDate, toDate, globalsearch, currentPage, states, districts, blocks, filtersReady]);

  // Handle filter changes
  const handleStateChange = (value: string) => {
    const newState = value || null;
    setSelectedState(newState);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setCurrentPage(1);
    setSelectedNetworks(new Set());
    handleFilterChange(newState, null, null, selectedStatus, fromDate, toDate, globalsearch);
  };

  const handleDistrictChange = (value: string) => {
    const newDistrict = value || null;
    setSelectedDistrict(newDistrict);
    setSelectedBlock(null);
    setCurrentPage(1);
    setSelectedNetworks(new Set());
    handleFilterChange(selectedState, newDistrict, null, selectedStatus, fromDate, toDate, globalsearch);
  };

  const handleBlockChange = (value: string) => {
    const newBlock = value || null;
    setSelectedBlock(newBlock);
    setCurrentPage(1);
    setSelectedNetworks(new Set());
    handleFilterChange(selectedState, selectedDistrict, newBlock, selectedStatus, fromDate, toDate, globalsearch);
  };

  const handleStatusChange = (value: string) => {
    const newStatus = value || null;
    setSelectedStatus(newStatus);
    setCurrentPage(1);
    setSelectedNetworks(new Set());
    handleFilterChange(selectedState, selectedDistrict, selectedBlock, newStatus, fromDate, toDate, globalsearch);
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setCurrentPage(1);
    handleFilterChange(selectedState, selectedDistrict, selectedBlock, selectedStatus, value, toDate, globalsearch);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    setCurrentPage(1);
    handleFilterChange(selectedState, selectedDistrict, selectedBlock, selectedStatus, fromDate, value, globalsearch);
  };

  const handleSearchChange = (value: string) => {
    setGlobalSearch(value);
    setCurrentPage(1);
    handleFilterChange(selectedState, selectedDistrict, selectedBlock, selectedStatus, fromDate, toDate, value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedStatus(null);
    setGlobalSearch('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
    setSelectedNetworks(new Set());
    setSearchParams({});
  };

  const handlePreview = async() => {
    if(selectedNetworks.size === 0){
      alert("No rows selected");
      return;
    }
    
    let Data: any[] = [];
    setAllPreviewLoading(true);
    try {
      for(const item of selectedNetworks){
        const response = await fetch(`${BASEURL_Val}/get-networks/${item}`);
        const json = await response.json();
        const newData = json.data || {};
        Data.push({ success: true, data: newData });
      }
      
    } catch (error) {
      console.log(error)
      
    } finally {
      setAllPreviewLoading(false)
    }
    sessionStorage.setItem('previewKmlData', JSON.stringify(Data));
    setPreviewKmlData(JSON.stringify(Data));
  
    window.open('/route-planning/builder', '_blank');
  }

  // Handle network selection
  const handleNetworkSelection = (id: number) => {
    setSelectedNetworks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle select all (for current page)
  const handleSelectAll = () => {
    if (selectedNetworks.size === currentNetworks.length && currentNetworks.length > 0) {
      setSelectedNetworks(new Set());
    } else {
      setSelectedNetworks(new Set(currentNetworks.map(network => network.id)));
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    handleFilterChange(selectedState, selectedDistrict, selectedBlock, selectedStatus, fromDate, toDate, globalsearch, page);
  };

  const handleExcelExport = () => {
    setExcel(true);
    // Add your excel export logic here
    setTimeout(() => setExcel(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {AllpreviewLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      <RouteListHeader />

      {/* Main Content Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          {/* First Row - Location Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* State Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedState || ''}
                onChange={(e) => handleStateChange(e.target.value)}
                disabled={loadingStates}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none disabled:opacity-50"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state.state_id} value={state.state_id}>
                    {state.state_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                {loadingStates ? (
                  <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* District Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedDistrict || ''}
                onChange={(e) => handleDistrictChange(e.target.value)}
                disabled={!selectedState || loadingDistricts}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none disabled:opacity-50"
              >
                <option value="">All Districts</option>
                {districts.map((district) => (
                  <option key={district.district_id} value={district.district_id}>
                    {district.district_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                {loadingDistricts ? (
                  <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Block Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedBlock || ''}
                onChange={(e) => handleBlockChange(e.target.value)}
                disabled={!selectedDistrict || loadingBlocks}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none disabled:opacity-50"
              >
                <option value="">All Blocks</option>
                {blocks.map((block) => (
                  <option key={block.block_id} value={block.block_id}>
                    {block.block_name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                {loadingBlocks ? (
                  <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedStatus || ''}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
              >
                <option value="">All Status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Date Filters */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
                placeholder="From Date"
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <input
                type="date"
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
                placeholder="To Date"
              />
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>

          {/* Second Row - Search and Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={globalsearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none"
              />
            </div>

            {/* Preview Button */}
            <button
              onClick={handlePreview}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>

            {/* Excel Export Button */}
            <button
              onClick={handleExcelExport}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
            >
              <SheetIcon className="h-4 w-4 text-green-600"/>
              Excel
            </button>
          </div>
        </div>
        
        {/* Networks Table */}
        <>
          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
              <span className="font-medium">Error loading networks:</span> {error}
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th scope="col" className="px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedNetworks.size === currentNetworks.length && currentNetworks.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded focus:ring-0 outline-none border-2 border-blue-900 checked:bg-blue-900 checked:border-blue-900"
                      style={{
                        accentColor: 'rgb(30, 58, 138)'
                      }}
                    />
                  </th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network Name</th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State Name</th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District Name</th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Length (km)</th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th scope="col" className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : currentNetworks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      {globalsearch || selectedState || selectedDistrict || selectedBlock || selectedStatus || fromDate || toDate 
                        ? 'No networks match your search criteria.' 
                        : 'No networks found.'}
                    </td>
                  </tr>
                ) : (
                  currentNetworks.map((network) => (
                    <tr key={network.id} className="hover:bg-gray-50">
                      <td className="px-6 py-2 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedNetworks.has(network.id)}
                          onChange={() => handleNetworkSelection(network.id)}
                          className="w-4 h-4 rounded focus:ring-0 outline-none border-2 border-blue-900 checked:bg-blue-900 checked:border-blue-900"
                          style={{
                            accentColor: 'rgb(30, 58, 138)'
                          }}
                        />
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {network.name}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {network.st_name || 'N/A'}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {network.dt_name || 'N/A'}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {parseFloat(network.total_length).toFixed(2)}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>{network.user_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(network.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-3">
                          {/* Preview button */}
                          <button
                            onClick={() => handlePreviewClick(network.id)}
                            disabled={previewLoading === network.id}
                            className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            title="Preview Route"
                          >
                            {previewLoading === network.id ? (
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteClick(network.id, network.name)}
                            className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 transition-colors duration-200"
                            title="Delete Route"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                          
                          {/* GP List Button */}
                          <button 
                            onClick={() => handleGPListClick(network.id, network.name)}
                            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 outline-none dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800"
                          >
                            GP List
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Fixed for server-side pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm font-medium border rounded-md ${
                        currentPage === pageNum
                          ? 'text-blue-600 bg-blue-50 border-blue-500'
                          : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      </div>

      {notification.show && (
        <div className={`fixed top-4 right-4 z-[60] min-w-80 max-w-md transform transition-all duration-300 ease-in-out ${
          notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className={`flex items-start p-4 rounded-lg shadow-lg border-l-4 ${getNotificationStyles(notification.type)}`}>
            <div className="flex-shrink-0 mr-3">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-5">
                {notification.message}
              </p>
            </div>
            <button
              onClick={closeNotification}
              className="flex-shrink-0 ml-3 text-white hover:text-gray-200 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteList;