import { useState, useEffect, useMemo } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Eye, Trash, X, ChevronDown, RotateCcw, Search, User, Route} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAppContext } from './AppContext';

interface UnverifiedNetworksResponse {
  success: boolean;
  data: UnverifiedNetwork[];
  message: string;
}

interface UnverifiedNetwork {
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

interface StatesResponse {
  success: boolean;
  data: State[];
}

const RouteList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setPreviewKmlData } = useAppContext();
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
  const [unverifiedNetworks, setUnverifiedNetworks] = useState<UnverifiedNetwork[]>([]);
  const [verifiedNetworks, setVerifiedNetworks] = useState<VerifiedNetwork[]>([]);
  const [loadingUnverified, setLoadingUnverified] = useState<boolean>(false);
  const [loadingVerified, setLoadingVerified] = useState<boolean>(false);
  const [unverifiedError, setUnverifiedError] = useState<string | null>(null);
  const [verifiedError, setVerifiedError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'verified' | 'unverified'>('unverified');
  const [previewLoading, setPreviewLoading] = useState<number | null>(null);
  const [AllpreviewLoading, setAllPreviewLoading] = useState<boolean>(false);

  // Load status tracking
  const [unverifiedLoaded, setUnverifiedLoaded] = useState<boolean>(false);
  const [verifiedLoaded, setVerifiedLoaded] = useState<boolean>(false);

  // Selection states
  const [selectedUnverifiedNetworks, setSelectedUnverifiedNetworks] = useState<Set<number>>(new Set());
  const [selectedVerifiedNetworks, setSelectedVerifiedNetworks] = useState<Set<number>>(new Set());

  // Dynamic filter data
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [globalsearch, setGlobalSearch] = useState<string>('');

  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    show: boolean;
  }>({
    type: 'success',
    message: '',
    show: false
  });
  // Selected filter values (using IDs like the example)
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  // Add filtered data using useMemo
  const filteredUnverifiedNetworks = useMemo(() => {
    if (!globalsearch.trim()) return unverifiedNetworks;
    
    const lowerSearch = globalsearch.toLowerCase();
    return unverifiedNetworks.filter((network) =>
      Object.values(network).some((value) =>
        (typeof value === 'string' || typeof value === 'number') &&
        value.toString().toLowerCase().includes(lowerSearch)
      )
    );
  }, [globalsearch, unverifiedNetworks]);

  const filteredVerifiedNetworks = useMemo(() => {
    if (!globalsearch.trim()) return verifiedNetworks;
    
    const lowerSearch = globalsearch.toLowerCase();
    return verifiedNetworks.filter((network) =>
      Object.values(network).some((value) =>
        (typeof value === 'string' || typeof value === 'number') &&
        value.toString().toLowerCase().includes(lowerSearch)
      )
    );
  }, [globalsearch, verifiedNetworks]);
  
  // Navigate to GP List page
  const handleGPListClick = (networkId: number, networkName: string) => {
    navigate(`/route-planning/route-list/gplist/${networkId}`, {
      state: { 
        networkName,
        returnTab: 'verified' // Pass the current tab information
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
      setPreviewLoading(networkId); // Set specific network ID
      
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
      setPreviewLoading(null); // Reset to null
    }
  };
 
  const handleDeleteClick = async(Id:number,name:string,type:string) =>{
    try {
    const response = await fetch(`${BASEURL_Val}/delete-network/${Id}`, {
      method: 'POST',
    });   
    if (!response.ok) {
        throw new Error(`Preview API request failed with status ${response.status}`);
    }
      
     await response.json();
     showNotification('success', `Successfully Deleted ${name}`);
   if(type === 'unverified'){
        fetchUnverifiedNetworks();
     }else{
      fetchVerifiedNetworks()
    }

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

  // Fetch districts by state ID (not state_code)
  const fetchDistricts = async (stateId: string) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }
    
    try {
      setLoadingDistricts(true);
      // Find the state_code for the selected state_id
      
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

  // Fetch unverified networks with filters
  const fetchUnverifiedNetworks = async () => {
    try {
      setLoadingUnverified(true);
      setUnverifiedError(null);
      
      let url = `${BASEURL_Val}/get-unverified-networks`;
      const params = new URLSearchParams();
      
      // Convert state_id to state_code for API
      if (selectedState) {
        const selectedStateData = states.find(state => state.state_id.toString() === selectedState);
        if (selectedStateData) {
          params.append('st_code', selectedStateData.state_code);
        }
      }
      
      // Convert district_id to district_code for API  
      if (selectedDistrict) {
        const selectedDistrictData = districts.find(district => district.district_id?.toString() === selectedDistrict);
        if (selectedDistrictData) {
          params.append('dt_code', selectedDistrictData.district_code);
        }
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data: UnverifiedNetworksResponse = await response.json();
      setUnverifiedNetworks(data.success ? data.data : []);
      setUnverifiedLoaded(true);
    } catch (error) {
      console.error('Error fetching unverified networks:', error);
      setUnverifiedError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoadingUnverified(false);
    }
  };

  // Fetch verified networks with filters (UPDATED)
  const fetchVerifiedNetworks = async () => {
    try {
      setLoadingVerified(true);
      setVerifiedError(null);
      
      let url = `${BASEURL_Val}/get-verified-netwrorks`;
      const params = new URLSearchParams();
      
      // Add same filter logic as unverified networks
      if (selectedState) {
        const selectedStateData = states.find(state => state.state_id.toString() === selectedState);
        if (selectedStateData) {
          params.append('st_code', selectedStateData.state_code);
        }
      }
      
      if (selectedDistrict) {
        const selectedDistrictData = districts.find(district => district.district_id?.toString() === selectedDistrict);
        if (selectedDistrictData) {
          params.append('dt_code', selectedDistrictData.district_code);
        }
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data: VerifiedNetworksResponse = await response.json();
      setVerifiedNetworks(data.success ? data.data : []);
      setVerifiedLoaded(true);
    } catch (error) {
      console.error('Error fetching verified networks:', error);
      setVerifiedError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoadingVerified(false);
    }
  };

  // Load states on mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Handle return from GP List page
  useEffect(() => {
    // Check if returning from GP List with a specific tab
    const returnTab = location.state?.returnTab;
    if (returnTab === 'verified') {
      setActiveTab('verified');
      // Clear the state to prevent this from running again on future navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Load districts when state changes
  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedState, states]);

  // Load data when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'unverified') {
      setUnverifiedLoaded(false); // Reset to refetch with filters
      fetchUnverifiedNetworks();
    } else if (activeTab === 'verified') {
      setVerifiedLoaded(false); // Reset to refetch with filters
      fetchVerifiedNetworks();
    }
  }, [activeTab, selectedState, selectedDistrict, states, districts]);

  // Handle tab switch
  const handleTabSwitch = (tab: 'verified' | 'unverified') => {
    setActiveTab(tab);
    // Clear selections when switching tabs
    setSelectedUnverifiedNetworks(new Set());
    setSelectedVerifiedNetworks(new Set());
  };

  // Handle filter changes
  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedDistrict(''); // Clear dependent filters
    // Clear selections when filters change
    setSelectedUnverifiedNetworks(new Set());
    setSelectedVerifiedNetworks(new Set());
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    // Clear selections when filters change
    setSelectedUnverifiedNetworks(new Set());
    setSelectedVerifiedNetworks(new Set());
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setGlobalSearch('');
    // Clear selections when clearing filters
    setSelectedUnverifiedNetworks(new Set());
    setSelectedVerifiedNetworks(new Set());
  };

  const handlePreview = async() =>{
    if(selectedUnverifiedNetworks.size === 0 && selectedVerifiedNetworks.size === 0){
      alert("No rows selected");
      return;
    }
    const Networks = selectedUnverifiedNetworks.size > 0
      ? selectedUnverifiedNetworks
      : selectedVerifiedNetworks;
    let Data:any[]=[];
    setAllPreviewLoading(true);
    try {
      for(const item of Networks){
       const response = await fetch(`${BASEURL_Val}/get-networks/${item}`);
       const json = await response.json();
       const newData = json.data|| {};
       Data.push({ success: true, data: newData });      }
      
    } catch (error) {
      console.log(error)
      
    }finally{
      setAllPreviewLoading(false)
    }
        sessionStorage.setItem('previewKmlData', JSON.stringify(Data));
        setPreviewKmlData(JSON.stringify(Data));
      
      window.open('/route-planning/builder', '_blank');
  }
  // Handle unverified network selection
  const handleUnverifiedNetworkSelection = (id: number) => {
    setSelectedUnverifiedNetworks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle select all unverified (UPDATED to use filtered data)
  const handleSelectAllUnverified = () => {
    if (selectedUnverifiedNetworks.size === filteredUnverifiedNetworks.length) {
      setSelectedUnverifiedNetworks(new Set());
    } else {
      setSelectedUnverifiedNetworks(new Set(filteredUnverifiedNetworks.map(network => network.id)));
    }
  };

  // Handle verified network selection
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

  // Handle select all verified (UPDATED to use filtered data)
  const handleSelectAllVerified = () => {
    if (selectedVerifiedNetworks.size === filteredVerifiedNetworks.length) {
      setSelectedVerifiedNetworks(new Set());
    } else {
      setSelectedVerifiedNetworks(new Set(filteredVerifiedNetworks.map(network => network.id)));
    }
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
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center px-6">
              <li className="mr-2">
                <button
                  className={`inline-block p-4 rounded-t-lg outline-none ${
                    activeTab === 'unverified'
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                      : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  }`}
                  onClick={() => handleTabSwitch('unverified')}
                >
                  Unverified Networks
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
                  Verified Networks
                </button>
              </li>
            </ul>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            {/* All filters and actions in one row */}
            <div className="flex items-center space-x-4">
              
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={globalsearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* State Filter */}
              <div className="relative min-w-[160px]">
                <select
                  value={selectedState || ''}
                  onChange={(e) => handleStateChange(e.target.value)}
                  disabled={loadingStates}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">All States</option>
                  {states.map((state) => (
                    <option key={state.state_id} value={state.state_id}>
                      {state.state_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>

              {/* District Filter */}
              <div className="relative min-w-[160px]">
                <select
                  value={selectedDistrict || ''}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!selectedState || loadingDistricts}
                  className="disabled:opacity-50 disabled:cursor-not-allowed w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Districts</option>
                  {districts.map((district) => (
                    <option key={district.district_id} value={district.district_id}>
                      {district.district_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                <span>Reset Filters</span>
              </button>

              {/* Preview Button */}
              <button
                onClick={handlePreview}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
              >
                <Eye className="w-4 h-4 mr-2" />
                <span>Preview</span>
              </button>
            </div>
          </div>
          
          {/* Unverified Networks Tab */}
          {activeTab === 'unverified' && (
            <>
              {unverifiedError && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                  <span className="font-medium">Error loading unverified networks:</span> {unverifiedError}
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUnverifiedNetworks.size === filteredUnverifiedNetworks.length && filteredUnverifiedNetworks.length > 0}
                          onChange={handleSelectAllUnverified}
                          className="w-4 h-4 rounded focus:ring-0 outline-none border-2 border-blue-900 checked:bg-blue-900 checked:border-blue-900"
                          style={{
                            accentColor: 'rgb(30, 58, 138)'
                          }}
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Length (km)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingUnverified ? (
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
                    ) : filteredUnverifiedNetworks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                          {globalsearch ? 'No networks match your search criteria.' : 'No unverified networks found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredUnverifiedNetworks.map((network) => (
                        <tr key={network.id} className="hover:bg-gray-50">
                          <td className="px-6 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedUnverifiedNetworks.has(network.id)}
                              onChange={() => handleUnverifiedNetworkSelection(network.id)}
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
                              {/* Preview Button */}
                              <button
                                onClick={() => handlePreviewClick(network.id)}
                                disabled={previewLoading === network.id}
                                className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                title="Preview Route"
                              >
                                {previewLoading === network.id ? (
                                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                      fill="none"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteClick(network.id,network.name,'unverified')}
                                className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 transition-colors duration-200"
                                title="Delete Route"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
          
          {/* Verified Networks Tab */}
          {activeTab === 'verified' && (
            <>
              {verifiedError && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                  <span className="font-medium">Error loading verified networks:</span> {verifiedError}
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedVerifiedNetworks.size === filteredVerifiedNetworks.length && filteredVerifiedNetworks.length > 0}
                          onChange={handleSelectAllVerified}
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
                    {loadingVerified ? (
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
                    ) : filteredVerifiedNetworks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                          {globalsearch ? 'No networks match your search criteria.' : 'No verified networks found.'}
                        </td>
                      </tr>
                      ) : (
                      filteredVerifiedNetworks.map((network) => (
                        <tr key={network.id} className="hover:bg-gray-50">
                          <td className="px-6 py-2 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedVerifiedNetworks.has(network.id)}
                              onChange={() => handleVerifiedNetworkSelection(network.id)}
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
                                onClick={() => handleDeleteClick(network.id,network.name,'verified')}
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
            </>
          )}
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