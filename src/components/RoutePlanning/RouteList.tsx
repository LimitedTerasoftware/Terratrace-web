import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Eye, MoreVertical, Trash, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

interface Filters {
  state: string;
  district: string;
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
  block_id: string;
  block_name: string;
  district_code: string;
}
interface StatesResponse {
  success: boolean;
  data: State[];
}

const RouteList = () => {
  const navigate = useNavigate();
  const { setPreviewKmlData } = useAppContext();
  const BASEURL = import.meta.env.VITE_API_BASE;
  const BASEURL_Val = import.meta.env.VITE_TraceAPI_URL;

  // Network data states
  const [unverifiedNetworks, setUnverifiedNetworks] = useState<UnverifiedNetwork[]>([]);
  const [verifiedNetworks, setVerifiedNetworks] = useState<VerifiedNetwork[]>([]);
  const [loadingUnverified, setLoadingUnverified] = useState<boolean>(false);
  const [loadingVerified, setLoadingVerified] = useState<boolean>(false);
  const [unverifiedError, setUnverifiedError] = useState<string | null>(null);
  const [verifiedError, setVerifiedError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'verified' | 'unverified'>('unverified');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [AllpreviewLoading, setAllPreviewLoading] = useState<boolean>(false);


  // Load status tracking
  const [unverifiedLoaded, setUnverifiedLoaded] = useState<boolean>(false);
  const [verifiedLoaded, setVerifiedLoaded] = useState<boolean>(false);

  // Selection states
  const [selectedUnverifiedNetworks, setSelectedUnverifiedNetworks] = useState<Set<number>>(new Set());
  const [selectedVerifiedNetworks, setSelectedVerifiedNetworks] = useState<Set<number>>(new Set());

  // Filter states
  const [filters, setFilters] = useState<Filters>({
    state: '',
    district: ''
  });

  // Dynamic filter data
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [globalsearch, setGlobalSearch] = useState<string>('');

  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingBlock, setLoadingBlock] = useState<boolean>(false);
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
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  
  // Navigate to GP List page
  const handleGPListClick = (networkId: number, networkName: string) => {
    navigate(`/route-planning/route-list/gplist/${networkId}`, {
      state: { networkName }
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
      setPreviewLoading(true);
      
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
      setPreviewLoading(false);
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
      
     const data = await response.json();
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
    
 const fetchBlock = async() =>{
   try {
      if(selectedDistrict === '') return;
      setLoadingBlock(true);
      
      const response = await fetch(`${BASEURL}/blocksdata?district_code=${selectedDistrict}`);
      if (!response.ok) throw new Error('Failed to fetch blocks');
      const data = await response.json();
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlock(false);
    }
 }

  useEffect(() => {
   fetchBlock();
  }, [selectedDistrict]);

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

  // Fetch verified networks
  const fetchVerifiedNetworks = async () => {
  
    try {
      setLoadingVerified(true);
      setVerifiedError(null);
      
      const response = await fetch(`${BASEURL_Val}/get-verified-netwrorks`);
      
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
      fetchVerifiedNetworks();
    }
  }, [activeTab, selectedState, selectedDistrict, states, districts]);

  // Handle tab switch
  const handleTabSwitch = (tab: 'verified' | 'unverified') => {
    setActiveTab(tab);
  };

  // Handle filter changes
  const handleStateChange = (value: string) => {
    setSelectedState(value);
    setSelectedDistrict(''); // Clear dependent filters
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedBlock(null);
    setGlobalSearch('');
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

  // Handle select all unverified
  const handleSelectAllUnverified = () => {
    if (selectedUnverifiedNetworks.size === unverifiedNetworks.length) {
      setSelectedUnverifiedNetworks(new Set());
    } else {
      setSelectedUnverifiedNetworks(new Set(unverifiedNetworks.map(network => network.id)));
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

  // Handle select all verified
  const handleSelectAllVerified = () => {
    if (selectedVerifiedNetworks.size === verifiedNetworks.length) {
      setSelectedVerifiedNetworks(new Set());
    } else {
      setSelectedVerifiedNetworks(new Set(verifiedNetworks.map(network => network.id)));
    }
  };

  return (
    <div className="sm:p-2 lg:p-4 bg-gray-100 dark:bg-gray-900 min-h-screen">
       {AllpreviewLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-blue-900 dark:text-blue-100">
          Route List
        </h1>
      </div>

      {/* Search and Filters */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={globalsearch}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
              }}

              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* State Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
             value={selectedState || ''}
              onChange={(e) => setSelectedState(e.target.value || '')}
              disabled={loadingStates}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
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
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>

          {/* District Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={selectedDistrict || ''}
              onChange={(e) => setSelectedDistrict(e.target.value || '')}
              disabled={!selectedState}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
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
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </div>
          </div>

          {/* Block Filter */}
          {/* <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={selectedBlock || ''}
              onChange={(e) => setSelectedBlock(e.target.value)}
              disabled={!selectedDistrict}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
            >
              <option value="">All Blocks</option>
               {blocks.map((block) => (
                <option key={block.block_id} value={block.block_id}>
                  {block.block_name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div> */}

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
          >
            <span className="text-red-500 dark:text-red-400 font-medium text-sm">✕</span>
            <span>Clear Filters</span>
          </button>
            <button
            onClick={handlePreview}
            className="flex-none h-10 px-4 py-2 text-sm font-medium  text-gray-400 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark: text-gray-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
          >
            <span className=" text-gray-400 font-medium text-sm">
              <Eye className="w-4 h-4" />
            </span>
            <span>Preview</span>
          </button>
        </div>
      </div>
      
      {/* Tabs */}
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
      
      {/* Unverified Networks Tab */}
      {activeTab === 'unverified' && (
        <div className="overflow-x-auto relative">
          {unverifiedError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
              <span className="font-medium">Error loading unverified networks:</span> {unverifiedError}
            </div>
          )}
          
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-200 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedUnverifiedNetworks.size === unverifiedNetworks.length && unverifiedNetworks.length > 0}
                    onChange={handleSelectAllUnverified}
                    className="w-4 h-4 rounded focus:ring-0 outline-none border-2 border-blue-900 checked:bg-blue-900 checked:border-blue-900"
                    style={{
                      accentColor: 'rgb(30, 58, 138)'
                    }}
                  />
                </th>
                <th scope="col" className="px-3 py-2">Network Name</th>
                <th scope="col" className="px-3 py-2">State Name</th>
                <th scope="col" className="px-3 py-2">District Name</th>
                <th scope="col" className="px-3 py-2">Total Length (km)</th>
                <th scope="col" className="px-3 py-2">User Name</th>
                <th scope="col" className="px-3 py-2">Created At</th>
                <th scope="col" className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingUnverified ? (
                <tr>
                  <td colSpan={8} className="px-3 py-2">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : unverifiedNetworks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-2">
                    No unverified networks found.
                  </td>
                </tr>
              ) : (
                unverifiedNetworks.map((network) => (
                  <tr key={network.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-3 py-2">
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
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {network.name}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {network.st_name || 'N/A'}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {network.dt_name || 'N/A'}
                    </td>
                    <td className="px-3 py-2">
                      {parseFloat(network.total_length).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      {network.user_name}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(network.created_at).toLocaleDateString()}
                    </td>
                  
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        {/* Preview Button */}
                        <button
                          onClick={() => handlePreviewClick(network.id)}
                          disabled={previewLoading}
                          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          title="Preview Route"
                        >
                          {previewLoading ? (
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
      )}
      
      {/* Verified Networks Tab */}
      {activeTab === 'verified' && (
        <div className="overflow-x-auto relative">
          {verifiedError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
              <span className="font-medium">Error loading verified networks:</span> {verifiedError}
            </div>
            )}
          
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-200 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedVerifiedNetworks.size === verifiedNetworks.length && verifiedNetworks.length > 0}
                    onChange={handleSelectAllVerified}
                    className="w-4 h-4 rounded focus:ring-0 outline-none border-2 border-blue-900 checked:bg-blue-900 checked:border-blue-900"
                    style={{
                      accentColor: 'rgb(30, 58, 138)'
                    }}
                  />
                </th>
                <th scope="col" className="px-3 py-2">Network Name</th>
                <th scope="col" className="px-3 py-2">State Name</th>
                <th scope="col" className="px-3 py-2">District Name</th>
                <th scope="col" className="px-3 py-2">Total Length (km)</th>
                <th scope="col" className="px-3 py-2">User Name</th>
                <th scope="col" className="px-3 py-2">Created At</th>
                <th scope="col" className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingVerified ? (
                <tr>
                  <td colSpan={8} className="px-3 py-2">
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
                  <td colSpan={8} className="px-3 py-2">
                    No verified networks found.
                  </td>
                </tr>
                ) : (
                verifiedNetworks.map((network) => (
                  <tr key={network.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-3 py-2">
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
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {network.name}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {network.st_name || 'N/A'}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {network.dt_name || 'N/A'}
                    </td>
                    <td className="px-3 py-2">
                      {parseFloat(network.total_length).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      {network.user_name}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(network.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        {/* Preview button */}
                        <button
                          onClick={() => handlePreviewClick(network.id)}
                          disabled={previewLoading}
                          className="flex items-center justify-center w-8 h-8 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          title="Preview Route"
                        >
                          {previewLoading ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                          <button
                          onClick={() => handleDeleteClick(network.id,network.name,'verified')}
                          className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 transition-colors duration-200"
                          title="Delete Route"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
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
      )}
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