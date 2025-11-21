import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  Mail, 
  X, 
  Trophy, 
  AlertTriangle, 
  MoreHorizontal,
  RefreshCw,
  Zap,
  Users,
  Wrench,
  TrendingUp,
  TrendingDown,
  PackageCheck,
  Calendar,
  Building2
} from "lucide-react";
import DataTable, { TableColumn } from 'react-data-table-component';

// API Response Types for GP Installation
interface ApiResponse {
  success: boolean;
  summary: {
    total_ont_gps: number;
    total_survey_count: number;
    pending_count: string;
    accepted_count: string;
    rejected_count: string;
    progress_percent: string;
  };
  pagination: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  detailed_data: DetailedData[];
}

// API Response Types for Block Installation
interface BlockApiResponse {
  success: boolean;
  summary: {
    total_blocks: number;
    total_install_count: number;
    pending_count: string;
    accepted_count: string;
    rejected_count: string;
    progress_percent: string;
  };
  pagination: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  detailed_data: BlockDetailedData[];
}

// Detailed data interface for GP table
interface DetailedData {
  id: number;
  gp_name: string;
  gp_contact: string;
  key_person: string;
  status: string;
  gp_latitude: string;
  gp_longitude: string;
  created_at: string;
}

// Detailed data interface for Block table
interface BlockDetailedData {
  id: number;
  block_name: string;
  block_contacts: string;
  status: string;
  block_latitude: string;
  block_longitude: string;
  created_at: string;
  username: string;
}

// Location data types
interface StateData {
  state_id: string;
  state_code: string | number;
  state_name: string;
}

interface District {
  district_id: string;
  district_code: string | number;
  district_name: string;
}

interface Block {
  block_id: string;
  block_code: string | number;
  block_name: string;
}

interface StatesResponse {
  success: boolean;
  data: StateData[];
}

// Badge component
function Badge({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${className}`}>{children}</span>;
}

// Progress bar component
function ProgressBar({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2" aria-label="progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-2 rounded-full ${className}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

const BASEURL = import.meta.env.VITE_API_BASE;

const InstallationDashboard: React.FC = () => {
  const [activeTimeFilter, setActiveTimeFilter] = useState<'Today' | 'Week' | 'Month' | 'Custom'>('Today');
  const [activeTab, setActiveTab] = useState<'Teams' | 'Contractors'>('Teams');
  const [activeInstallationTab, setActiveInstallationTab] = useState<'GP Installation' | 'Block Installation'>('GP Installation');
  const [activeViewTab, setActiveViewTab] = useState<'Table' | 'Charts' | 'Insights'>('Table');
  
  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Location filter states
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  
  // Store both ID (for hierarchy APIs) and CODE (for installation APIs)
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedBlockCode, setSelectedBlockCode] = useState<string | null>(null);
  
  // Loading states for filters
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingBlocks, setLoadingBlocks] = useState<boolean>(false);
  
  // Pagination state for GP Installation
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  
  // Pagination state for Block Installation
  const [blockCurrentPage, setBlockCurrentPage] = useState(1);
  const [blockPerPage, setBlockPerPage] = useState(10);
  const [blockTotalRows, setBlockTotalRows] = useState(0);
  
  // API State for GP Installation
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // API State for Block Installation
  const [blockApiData, setBlockApiData] = useState<BlockApiResponse | null>(null);
  const [blockLoading, setBlockLoading] = useState<boolean>(false);
  const [blockError, setBlockError] = useState<string | null>(null);

  // Fetch states on mount
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

  // Fetch districts based on selected state
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

  // Fetch blocks based on selected district
  const fetchBlocks = async () => {
    try {
      if (!selectedDistrictId) return;
      setLoadingBlocks(true);

      const response = await fetch(`${BASEURL}/blocksdata?district_code=${selectedDistrictId}`);
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

  // Handle state change
  const handleStateChange = (value: string) => {
    if (!value) {
      // Clear all when no state selected
      setSelectedStateId(null);
      setSelectedStateCode(null);
      setSelectedDistrictId(null);
      setSelectedDistrictCode(null);
      setSelectedBlockId(null);
      setSelectedBlockCode(null);
      setDistricts([]);
      setBlocks([]);
      return;
    }
    
    // Find selected state to get both ID and code
    const selectedState = states.find(s => s.state_code.toString() === value);
    if (selectedState) {
      setSelectedStateId(selectedState.state_id);
      setSelectedStateCode(selectedState.state_code.toString());
      setSelectedDistrictId(null);
      setSelectedDistrictCode(null);
      setSelectedBlockId(null);
      setSelectedBlockCode(null);
      setDistricts([]);
      setBlocks([]);
    }
  };

  // Handle district change
  const handleDistrictChange = (value: string) => {
    if (!value) {
      setSelectedDistrictId(null);
      setSelectedDistrictCode(null);
      setSelectedBlockId(null);
      setSelectedBlockCode(null);
      setBlocks([]);
      return;
    }
    
    // Find selected district to get both ID and code
    const selectedDistrict = districts.find(d => d.district_code.toString() === value);
    if (selectedDistrict) {
      setSelectedDistrictId(selectedDistrict.district_id);
      setSelectedDistrictCode(selectedDistrict.district_code.toString());
      setSelectedBlockId(null);
      setSelectedBlockCode(null);
      setBlocks([]);
    }
  };

  // Handle block change
  const handleBlockChange = (value: string) => {
    if (!value) {
      setSelectedBlockId(null);
      setSelectedBlockCode(null);
      return;
    }
    
    // Find selected block to get both ID and code
    const selectedBlock = blocks.find(b => b.block_code.toString() === value);
    if (selectedBlock) {
      setSelectedBlockId(selectedBlock.block_id);
      setSelectedBlockCode(selectedBlock.block_code.toString());
    }
  };

  // Fetch states on mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch districts when state changes
  useEffect(() => {
    if (selectedStateId) {
      fetchDistricts(selectedStateId);
    } else {
      setDistricts([]);
    }
  }, [selectedStateId]);

  // Fetch blocks when district changes
  useEffect(() => {
    fetchBlocks();
  }, [selectedDistrictId]);

  // Fetch GP Installation data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build URL with filter parameters and pagination
        let apiUrl = `https://api.tricadtrack.com/get-gps-count?page=${currentPage}&limit=${perPage}`;
        
        // Add location filters - using CODES for the API
        if (selectedStateCode) {
          apiUrl += `&state_code=${selectedStateCode}`;
        }
        if (selectedDistrictCode) {
          apiUrl += `&district_code=${selectedDistrictCode}`;
        }
        if (selectedBlockCode) {
          apiUrl += `&block_code=${selectedBlockCode}`;
        }
        
        // Add date filters
        if (startDate && endDate) {
          apiUrl += `&from_date=${startDate}&to_date=${endDate}`;
        } else if (startDate) {
          // If only start date is provided, use it for both
          apiUrl += `&from_date=${startDate}&to_date=${startDate}`;
        } else if (endDate) {
          // If only end date is provided, use it for both
          apiUrl += `&from_date=${endDate}&to_date=${endDate}`;
        }
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.success) {
          setApiData(data);
          
          // Set total rows for pagination
          if (data.pagination?.total_records) {
            setTotalRows(data.pagination.total_records);
          } else {
            // Fallback: estimate if API doesn't provide total
            const estimatedTotal = (currentPage - 1) * perPage + data.detailed_data.length;
            setTotalRows(data.detailed_data.length === perPage ? estimatedTotal + 1 : estimatedTotal);
          }
          
          setError(null);
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        setError('Error fetching data from API');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStateCode, selectedDistrictCode, selectedBlockCode, startDate, endDate, currentPage, perPage]);

  // Fetch Block Installation data from API
  useEffect(() => {
    const fetchBlockData = async () => {
      try {
        setBlockLoading(true);
        
        // Build URL with filter parameters and pagination
        let apiUrl = `https://api.tricadtrack.com/get-block-count?page=${blockCurrentPage}&limit=${blockPerPage}`;
        
        // Add location filters - using CODES for the API
        if (selectedStateCode) {
          apiUrl += `&state_code=${selectedStateCode}`;
        }
        if (selectedDistrictCode) {
          apiUrl += `&district_code=${selectedDistrictCode}`;
        }
        if (selectedBlockCode) {
          apiUrl += `&block_code=${selectedBlockCode}`;
        }
        
        // Add date filters
        if (startDate && endDate) {
          apiUrl += `&from_date=${startDate}&to_date=${endDate}`;
        } else if (startDate) {
          apiUrl += `&from_date=${startDate}&to_date=${startDate}`;
        } else if (endDate) {
          apiUrl += `&from_date=${endDate}&to_date=${endDate}`;
        }
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.success) {
          setBlockApiData(data);
          
          // Set total rows for pagination
          if (data.pagination?.total_records) {
            setBlockTotalRows(data.pagination.total_records);
          } else {
            const estimatedTotal = (blockCurrentPage - 1) * blockPerPage + data.detailed_data.length;
            setBlockTotalRows(data.detailed_data.length === blockPerPage ? estimatedTotal + 1 : estimatedTotal);
          }
          
          setBlockError(null);
        } else {
          setBlockError('Failed to fetch block data');
        }
      } catch (err) {
        setBlockError('Error fetching block data from API');
        console.error(err);
      } finally {
        setBlockLoading(false);
      }
    };

    fetchBlockData();
  }, [selectedStateCode, selectedDistrictCode, selectedBlockCode, startDate, endDate, blockCurrentPage, blockPerPage]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACCEPT':
      case 'ACCEPTED': 
        return 'bg-green-100 text-green-800';
      case 'PENDING': 
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECT':
      case 'REJECTED': 
        return 'bg-red-100 text-red-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low Risk': return 'bg-green-100 text-green-800';
      case 'Medium Risk': return 'bg-yellow-100 text-yellow-800';
      case 'High Risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const resetFilters = () => {
    setSelectedStateId(null);
    setSelectedStateCode(null);
    setSelectedDistrictId(null);
    setSelectedDistrictCode(null);
    setSelectedBlockId(null);
    setSelectedBlockCode(null);
    setDistricts([]);
    setBlocks([]);
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
    setBlockCurrentPage(1);
  };

  // Handle page change for GP Installation
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle rows per page change for GP Installation
  const handlePerRowsChange = (newPerPage: number, page: number) => {
    setPerPage(newPerPage);
    setCurrentPage(page);
  };

  // Handle page change for Block Installation
  const handleBlockPageChange = (page: number) => {
    setBlockCurrentPage(page);
  };

  // Handle rows per page change for Block Installation
  const handleBlockPerRowsChange = (newPerPage: number, page: number) => {
    setBlockPerPage(newPerPage);
    setBlockCurrentPage(page);
  };

  // Parse JSON strings from API
  const parseJsonString = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  // Parse JSON array strings from API (for block_contacts)
  const parseJsonArrayString = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Custom styles for DataTable
  const customTableStyles = {
    headCells: {
      style: {
        fontSize: '11px',
        fontWeight: '500',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        color: '#9CA3AF',
        backgroundColor: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        fontSize: '14px',
        color: '#111827',
        borderBottom: '1px solid #F3F4F6',
      },
    },
    rows: {
      style: {
        '&:hover': {
          backgroundColor: '#F9FAFB',
        },
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #E5E7EB',
        minHeight: '56px',
        paddingTop: '8px',
        paddingBottom: '8px',
      },
      pageButtonsStyle: {
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: '4px',
        fill: '#4B5563',
        height: '32px',
        width: '32px',
        padding: '4px',
        margin: '0 2px',
        '&:disabled': {
          cursor: 'not-allowed',
          fill: '#D1D5DB',
          opacity: 0.5,
        },
        '&:hover:not(:disabled)': {
          backgroundColor: '#F3F4F6',
        },
      },
    },
  };

  // Table columns definition for GP Installation
  const tableColumns: TableColumn<DetailedData>[] = [
    {
      name: 'GP Name',
      selector: (row: DetailedData) => row.gp_name,
      sortable: true,
      cell: (row: DetailedData) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.gp_name}</div>
          <div className="text-xs text-gray-500">ID: {row.id}</div>
        </div>
      ),
    },
    {
      name: 'Contact Person',
      selector: (row: DetailedData) => {
        const contact = parseJsonString(row.gp_contact);
        return contact.name || 'N/A';
      },
      sortable: true,
    },
    {
      name: 'Phone',
      selector: (row: DetailedData) => {
        const contact = parseJsonString(row.gp_contact);
        return contact.phone || 'N/A';
      },
      sortable: true,
    },
    {
      name: 'Email',
      selector: (row: DetailedData) => {
        const contact = parseJsonString(row.gp_contact);
        return contact.email || 'N/A';
      },
      sortable: true,
    },
    {
      name: 'Key Person',
      cell: (row: DetailedData) => {
        const keyPerson = parseJsonString(row.key_person);
        return (
          <div>
            <div className="text-sm text-gray-900">{keyPerson.name || 'N/A'}</div>
            <div className="text-xs text-gray-500">{keyPerson.phone || 'N/A'}</div>
          </div>
        );
      },
    },
    {
      name: 'Coordinates',
      cell: (row: DetailedData) => (
        <div className="text-xs text-gray-900">
          {row.gp_latitude}, {row.gp_longitude}
        </div>
      ),
    },
    {
      name: 'Status',
      selector: (row: DetailedData) => row.status,
      sortable: true,
      cell: (row: DetailedData) => (
        <Badge className={getStatusColor(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      name: 'Created',
      selector: (row: DetailedData) => row.created_at,
      sortable: true,
      cell: (row: DetailedData) => (
        <span className="text-sm text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: (row: DetailedData) => (
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:text-blue-800">View</button>
          <button className="text-blue-600 hover:text-blue-800">Edit</button>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Table columns definition for Block Installation
  const blockTableColumns: TableColumn<BlockDetailedData>[] = [
    {
      name: 'Block Name',
      selector: (row: BlockDetailedData) => row.block_name,
      sortable: true,
      cell: (row: BlockDetailedData) => (
        <div>
          <div className="text-sm font-medium text-gray-900">{row.block_name}</div>
          <div className="text-xs text-gray-500">ID: {row.id}</div>
        </div>
      ),
    },
    {
      name: 'Contact Person',
      selector: (row: BlockDetailedData) => {
        const contacts = parseJsonArrayString(row.block_contacts);
        return contacts[0]?.name || 'N/A';
      },
      sortable: true,
      cell: (row: BlockDetailedData) => {
        const contacts = parseJsonArrayString(row.block_contacts);
        const contact = contacts[0] || {};
        return (
          <div>
            <div className="text-sm text-gray-900">{contact.name || 'N/A'}</div>
          </div>
        );
      },
    },
    {
      name: 'Phone',
      selector: (row: BlockDetailedData) => {
        const contacts = parseJsonArrayString(row.block_contacts);
        return contacts[0]?.phone || 'N/A';
      },
      sortable: true,
    },
    {
      name: 'Email',
      selector: (row: BlockDetailedData) => {
        const contacts = parseJsonArrayString(row.block_contacts);
        return contacts[0]?.email || 'N/A';
      },
      sortable: true,
      cell: (row: BlockDetailedData) => {
        const contacts = parseJsonArrayString(row.block_contacts);
        const email = contacts[0]?.email;
        return (
          <span className="text-sm text-gray-900">
            {email || 'N/A'}
          </span>
        );
      },
    },
    {
      name: 'Submitted By',
      selector: (row: BlockDetailedData) => row.username,
      sortable: true,
      cell: (row: BlockDetailedData) => (
        <span className="text-sm text-gray-900">{row.username}</span>
      ),
    },
    {
      name: 'Coordinates',
      cell: (row: BlockDetailedData) => (
        <div className="text-xs text-gray-900">
          {row.block_latitude}, {row.block_longitude}
        </div>
      ),
    },
    {
      name: 'Status',
      selector: (row: BlockDetailedData) => row.status,
      sortable: true,
      cell: (row: BlockDetailedData) => (
        <Badge className={getStatusColor(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      name: 'Created',
      selector: (row: BlockDetailedData) => row.created_at,
      sortable: true,
      cell: (row: BlockDetailedData) => (
        <span className="text-sm text-gray-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      name: 'Actions',
      cell: (row: BlockDetailedData) => (
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:text-blue-800">View</button>
          <button className="text-blue-600 hover:text-blue-800">Edit</button>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Determine which data to show based on active tab
  const isGPTab = activeInstallationTab === 'GP Installation';
  const currentLoading = isGPTab ? loading : blockLoading;
  const currentError = isGPTab ? error : blockError;
  const currentData = isGPTab ? apiData : blockApiData;

  if (currentLoading && !currentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (currentError && !currentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600">{currentError}</p>
        </div>
      </div>
    );
  }

  // Get summary based on active tab
  const summary = isGPTab 
    ? apiData?.summary 
    : blockApiData?.summary;
  
  const detailedData = isGPTab 
    ? apiData?.detailed_data || []
    : [];
  
  const blockDetailedData = !isGPTab 
    ? blockApiData?.detailed_data || []
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header and Filters Combined Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-6 h-6 text-blue-600" />
                <h1 className="text-lg font-bold text-gray-900">Installation Dashboard</h1>
              </div>
              <div className="text-sm text-gray-500">Performance Tracking & Control Tower</div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Calendar className="w-4 h-4" />
                Schedule Email
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Location Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* State Filter */}
                <div className="relative min-w-[140px]">
                  <select
                    value={selectedStateCode || ''}
                    onChange={(e) => handleStateChange(e.target.value)}
                    disabled={loadingStates}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md bg-white text-sm text-gray-700 appearance-none disabled:opacity-50"
                  >
                    <option value="">All States</option>
                    {states.map((state) => (
                      <option key={state.state_id} value={state.state_code}>
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
                <div className="relative min-w-[140px]">
                  <select
                    value={selectedDistrictCode || ''}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={!selectedStateId || loadingDistricts}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md bg-white text-sm text-gray-700 appearance-none disabled:opacity-50"
                  >
                    <option value="">All Districts</option>
                    {districts.map((district) => (
                      <option key={district.district_id} value={district.district_code}>
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
                <div className="relative min-w-[140px]">
                  <select
                    value={selectedBlockCode || ''}
                    onChange={(e) => handleBlockChange(e.target.value)}
                    disabled={!selectedDistrictId || loadingBlocks}
                    className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md bg-white text-sm text-gray-700 appearance-none disabled:opacity-50"
                  >
                    <option value="">All Blocks</option>
                    {blocks.map((block) => (
                      <option key={block.block_id} value={block.block_code}>
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
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {/* Date Filters and Reset */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 w-36 cursor-pointer"
                    aria-label="Start date"
                    placeholder="Start Date"
                  />
                  <span className="text-gray-500 text-sm">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 w-36 cursor-pointer"
                    aria-label="End date"
                    placeholder="End Date"
                  />
                </div>
                
                <button 
                  className="relative group px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  onClick={resetFilters}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Reset Filters
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards and Performance Info Combined */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6">
            {isGPTab ? (
              <>
                <div className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{summary?.total_ont_gps || 0}</div>
                  <div className="text-xs text-gray-500 mb-1">total</div>
                  <div className="text-sm font-medium text-gray-700">ONT GPS</div>
                </div>

                <div className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{summary?.total_survey_count || 0}</div>
                  <div className="text-xs text-gray-500 mb-1">of {summary?.total_ont_gps || 0}</div>
                  <div className="text-sm font-medium text-gray-700">Surveyed</div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{(summary as BlockApiResponse['summary'])?.total_blocks || 0}</div>
                  <div className="text-xs text-gray-500 mb-1">total</div>
                  <div className="text-sm font-medium text-gray-700">Total Blocks</div>
                </div>

                <div className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{(summary as BlockApiResponse['summary'])?.total_install_count || 0}</div>
                  <div className="text-xs text-gray-500 mb-1">of {(summary as BlockApiResponse['summary'])?.total_blocks || 0}</div>
                  <div className="text-sm font-medium text-gray-700">Installed</div>
                </div>
              </>
            )}
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">{summary?.pending_count || 0}</div>
              <div className="text-xs text-gray-500 mb-1">status</div>
              <div className="text-sm font-medium text-gray-700">Pending</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{summary?.accepted_count || 0}</div>
              <div className="text-xs text-gray-500 mb-1">status</div>
              <div className="text-sm font-medium text-gray-700">Accepted</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">{summary?.rejected_count || 0}</div>
              <div className="text-xs text-gray-500 mb-1">status</div>
              <div className="text-sm font-medium text-gray-700">Rejected</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{summary?.progress_percent || 0}%</div>
              <div className="text-xs text-gray-500 mb-1">completion</div>
              <div className="text-sm font-medium text-gray-700">Progress</div>
            </div>
          </div>

          {/* Performance Info */}
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600">Total Records:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {isGPTab 
                      ? apiData?.pagination?.total_records || 0
                      : blockApiData?.pagination?.total_records || 0
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-gray-600">Pending:</span>
                <span className="text-sm font-medium text-yellow-600">
                  {summary?.pending_count || 0} {isGPTab ? 'GPs' : 'Blocks'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                {/* Installation Type Tabs */}
                <div className="flex bg-gray-100 rounded-lg p-1" role="tablist" aria-label="Installation types">
                  <button 
                    className={`px-6 py-2 text-sm rounded font-medium transition-colors ${
                      activeInstallationTab === 'GP Installation' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    role="tab"
                    aria-selected={activeInstallationTab === 'GP Installation'}
                    onClick={() => setActiveInstallationTab('GP Installation')}
                  >
                    GP Installation
                  </button>
                  <button 
                    className={`px-6 py-2 text-sm rounded font-medium transition-colors ${
                      activeInstallationTab === 'Block Installation' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    role="tab"
                    aria-selected={activeInstallationTab === 'Block Installation'}
                    onClick={() => setActiveInstallationTab('Block Installation')}
                  >
                    Block Installation
                  </button>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1" role="tablist" aria-label="Data views">
                  <button 
                    className={`px-4 py-1 text-sm rounded ${activeViewTab === 'Table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
                    role="tab"
                    aria-selected={activeViewTab === 'Table'}
                    onClick={() => setActiveViewTab('Table')}
                  >
                    Table
                  </button>
                  <button 
                    className={`px-4 py-1 text-sm rounded ${activeViewTab === 'Charts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
                    role="tab"
                    aria-selected={activeViewTab === 'Charts'}
                    onClick={() => setActiveViewTab('Charts')}
                  >
                    Charts
                  </button>
                  <button 
                    className={`px-4 py-1 text-sm rounded ${activeViewTab === 'Insights' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
                    role="tab"
                    aria-selected={activeViewTab === 'Insights'}
                    onClick={() => setActiveViewTab('Insights')}
                  >
                    Insights
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* GP Installation Content */}
              {activeInstallationTab === 'GP Installation' && (
                <>
                  {activeViewTab === 'Table' && (
                    <div className="overflow-x-auto">
                      <DataTable
                        columns={tableColumns}
                        data={detailedData}
                        pagination
                        paginationServer
                        paginationTotalRows={totalRows}
                        paginationDefaultPage={currentPage}
                        onChangePage={handlePageChange}
                        onChangeRowsPerPage={handlePerRowsChange}
                        paginationPerPage={perPage}
                        paginationRowsPerPageOptions={[10, 25, 50, 100]}
                        highlightOnHover
                        pointerOnHover
                        striped={false}
                        dense={false}
                        responsive
                        customStyles={customTableStyles}
                        noHeader
                        defaultSortFieldId={1}
                        progressPending={loading}
                        progressComponent={
                          <div className="py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          </div>
                        }
                      />
                    </div>
                  )}

                  {activeViewTab === 'Charts' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Status Distribution Chart */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">Status Distribution</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium text-gray-700 flex items-center gap-2">
                                <div className="bg-yellow-100 p-1.5 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                </div>
                                Pending
                              </span>
                              <span className="text-gray-500">{apiData?.summary?.pending_count || 0}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="h-3 rounded-full bg-yellow-500"
                                style={{ width: `${apiData?.summary ? (parseInt(apiData.summary.pending_count) / apiData.summary.total_survey_count) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium text-gray-700 flex items-center gap-2">
                                <div className="bg-green-100 p-1.5 rounded-lg">
                                  <PackageCheck className="w-4 h-4 text-green-600" />
                                </div>
                                Accepted
                              </span>
                              <span className="text-gray-500">{apiData?.summary?.accepted_count || 0}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="h-3 rounded-full bg-green-500"
                                style={{ width: `${apiData?.summary ? (parseInt(apiData.summary.accepted_count) / apiData.summary.total_survey_count) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium text-gray-700 flex items-center gap-2">
                                <div className="bg-red-100 p-1.5 rounded-lg">
                                  <X className="w-4 h-4 text-red-600" />
                                </div>
                                Rejected
                              </span>
                              <span className="text-gray-500">{apiData?.summary?.rejected_count || 0}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="h-3 rounded-full bg-red-500"
                                style={{ width: `${apiData?.summary ? (parseInt(apiData.summary.rejected_count) / apiData.summary.total_survey_count) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Chart */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">Overall Progress</h4>
                        <div className="relative w-32 h-32 mx-auto">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="12"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeDasharray={`${parseFloat(apiData?.summary?.progress_percent || '0') * 2.51} ${(100 - parseFloat(apiData?.summary?.progress_percent || '0')) * 2.51}`}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{apiData?.summary?.progress_percent || 0}%</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center mt-4">
                          <div className="text-sm text-gray-600">Survey Completion Rate</div>
                          <div className="text-xs text-gray-500 mt-1">{apiData?.summary?.total_survey_count || 0} of {apiData?.summary?.total_ont_gps || 0} completed</div>
                        </div>
                      </div>

                      {/* GP List by Status */}
                      <div className="bg-gray-50 rounded-lg p-6 lg:col-span-2">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">GP Locations</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {detailedData.map((gp) => {
                            const contact = parseJsonString(gp.gp_contact);
                            return (
                              <div key={gp.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                      <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{gp.gp_name}</div>
                                      <div className="text-xs text-gray-500 mt-1">{contact.name}</div>
                                      <div className="text-xs text-gray-500">{contact.phone}</div>
                                    </div>
                                  </div>
                                  <Badge className={getStatusColor(gp.status)}>
                                    {gp.status}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeViewTab === 'Insights' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Survey Status Summary */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">Survey Status Summary</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <PackageCheck className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">Accepted GPs</div>
                                <div className="text-xs text-gray-500">Survey completed & approved</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-green-600">{apiData?.summary?.accepted_count || 0}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="bg-yellow-100 p-2 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">Pending GPs</div>
                                <div className="text-xs text-gray-500">Awaiting review</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-yellow-600">{apiData?.summary?.pending_count || 0}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="bg-red-100 p-2 rounded-lg">
                                <X className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">Rejected GPs</div>
                                <div className="text-xs text-gray-500">Needs revision</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-red-600">{apiData?.summary?.rejected_count || 0}</span>
                          </div>
                        </div>
                        
                        {apiData?.summary && parseInt(apiData.summary.pending_count) > 0 && (
                          <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800">Action Required</p>
                                <p className="text-xs text-yellow-600 mt-1">{apiData.summary.pending_count} GPs need review</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress Gauge */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4 text-center">Survey Progress</h4>
                        <div className="relative w-32 h-32 mx-auto">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="12"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeDasharray={`${parseFloat(apiData?.summary?.progress_percent || '0') * 2.51} ${(100 - parseFloat(apiData?.summary?.progress_percent || '0')) * 2.51}`}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{apiData?.summary?.progress_percent || 0}%</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>0</span>
                          <span>100</span>
                        </div>
                        <div className="text-center mt-4">
                          <div className="text-sm font-medium text-gray-900">{apiData?.summary?.total_survey_count || 0} / {apiData?.summary?.total_ont_gps || 0}</div>
                          <div className="text-xs text-gray-500">GPs Surveyed</div>
                        </div>
                      </div>

                      {/* Recent Activities */}
                      <div className="bg-gray-50 rounded-lg p-6 lg:col-span-2">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">Recent Survey Submissions</h4>
                        <div className="space-y-3">
                          {detailedData.slice(0, 3).map((gp) => {
                            const contact = parseJsonString(gp.gp_contact);
                            return (
                              <div key={gp.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="bg-blue-100 p-2 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{gp.gp_name}</div>
                                    <div className="text-xs text-gray-500">{contact.name} • {new Date(gp.created_at).toLocaleDateString()}</div>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(gp.status)}>
                                  {gp.status}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Block Installation Content */}
              {activeInstallationTab === 'Block Installation' && (
                <>
                  {activeViewTab === 'Table' && (
                    <div className="overflow-x-auto">
                      <DataTable
                        columns={blockTableColumns}
                        data={blockDetailedData}
                        pagination
                        paginationServer
                        paginationTotalRows={blockTotalRows}
                        paginationDefaultPage={blockCurrentPage}
                        onChangePage={handleBlockPageChange}
                        onChangeRowsPerPage={handleBlockPerRowsChange}
                        paginationPerPage={blockPerPage}
                        paginationRowsPerPageOptions={[10, 25, 50, 100]}
                        highlightOnHover
                        pointerOnHover
                        striped={false}
                        dense={false}
                        responsive
                        customStyles={customTableStyles}
                        noHeader
                        defaultSortFieldId={1}
                        progressPending={blockLoading}
                        progressComponent={
                          <div className="py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          </div>
                        }
                      />
                    </div>
                  )}

                  {activeViewTab === 'Charts' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Status Distribution Chart */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">Status Distribution</h4>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium text-gray-700 flex items-center gap-2">
                                <div className="bg-yellow-100 p-1.5 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                </div>
                                Pending
                              </span>
                              <span className="text-gray-500">{blockApiData?.summary?.pending_count || 0}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="h-3 rounded-full bg-yellow-500"
                                style={{ width: `${blockApiData?.summary ? (parseInt(blockApiData.summary.pending_count) / (blockApiData.summary.total_install_count || 1)) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium text-gray-700 flex items-center gap-2">
                                <div className="bg-green-100 p-1.5 rounded-lg">
                                  <PackageCheck className="w-4 h-4 text-green-600" />
                                </div>
                                Accepted
                              </span>
                              <span className="text-gray-500">{blockApiData?.summary?.accepted_count || 0}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="h-3 rounded-full bg-green-500"
                                style={{ width: `${blockApiData?.summary ? (parseInt(blockApiData.summary.accepted_count) / (blockApiData.summary.total_install_count || 1)) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium text-gray-700 flex items-center gap-2">
                                <div className="bg-red-100 p-1.5 rounded-lg">
                                  <X className="w-4 h-4 text-red-600" />
                                </div>
                                Rejected
                              </span>
                              <span className="text-gray-500">{blockApiData?.summary?.rejected_count || 0}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="h-3 rounded-full bg-red-500"
                                style={{ width: `${blockApiData?.summary ? (parseInt(blockApiData.summary.rejected_count) / (blockApiData.summary.total_install_count || 1)) * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Chart */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">Overall Progress</h4>
                        <div className="relative w-32 h-32 mx-auto">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="12"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeDasharray={`${parseFloat(blockApiData?.summary?.progress_percent || '0') * 2.51} ${(100 - parseFloat(blockApiData?.summary?.progress_percent || '0')) * 2.51}`}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{blockApiData?.summary?.progress_percent || 0}%</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-center mt-4">
                          <div className="text-sm text-gray-600">Installation Completion Rate</div>
                          <div className="text-xs text-gray-500 mt-1">{blockApiData?.summary?.total_install_count || 0} of {blockApiData?.summary?.total_blocks || 0} completed</div>
                        </div>
                      </div>

                      {/* Block List by Status */}
                      <div className="bg-gray-50 rounded-lg p-6 lg:col-span-2">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">Block Locations</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {blockDetailedData.map((block) => {
                            const contacts = parseJsonArrayString(block.block_contacts);
                            const contact = contacts[0] || {};
                            return (
                              <div key={block.id} className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="bg-purple-100 p-2 rounded-lg">
                                      <Building2 className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{block.block_name}</div>
                                      <div className="text-xs text-gray-500 mt-1">{contact.name || 'N/A'}</div>
                                      <div className="text-xs text-gray-500">{contact.phone || 'N/A'}</div>
                                    </div>
                                  </div>
                                  <Badge className={getStatusColor(block.status)}>
                                    {block.status}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeViewTab === 'Insights' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Installation Status Summary */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">Installation Status Summary</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <PackageCheck className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">Accepted Blocks</div>
                                <div className="text-xs text-gray-500">Installation completed & approved</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-green-600">{blockApiData?.summary?.accepted_count || 0}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="bg-yellow-100 p-2 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">Pending Blocks</div>
                                <div className="text-xs text-gray-500">Awaiting review</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-yellow-600">{blockApiData?.summary?.pending_count || 0}</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="bg-red-100 p-2 rounded-lg">
                                <X className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">Rejected Blocks</div>
                                <div className="text-xs text-gray-500">Needs revision</div>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-red-600">{blockApiData?.summary?.rejected_count || 0}</span>
                          </div>
                        </div>
                        
                        {blockApiData?.summary && parseInt(blockApiData.summary.pending_count) > 0 && (
                          <div className="mt-6 p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800">Action Required</p>
                                <p className="text-xs text-yellow-600 mt-1">{blockApiData.summary.pending_count} Blocks need review</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress Gauge */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-base font-semibold text-gray-900 mb-4 text-center">Installation Progress</h4>
                        <div className="relative w-32 h-32 mx-auto">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="12"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="40"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeDasharray={`${parseFloat(blockApiData?.summary?.progress_percent || '0') * 2.51} ${(100 - parseFloat(blockApiData?.summary?.progress_percent || '0')) * 2.51}`}
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900">{blockApiData?.summary?.progress_percent || 0}%</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>0</span>
                          <span>100</span>
                        </div>
                        <div className="text-center mt-4">
                          <div className="text-sm font-medium text-gray-900">{blockApiData?.summary?.total_install_count || 0} / {blockApiData?.summary?.total_blocks || 0}</div>
                          <div className="text-xs text-gray-500">Blocks Installed</div>
                        </div>
                      </div>

                      {/* Recent Activities */}
                      <div className="bg-gray-50 rounded-lg p-6 lg:col-span-2">
                        <h4 className="text-base font-semibold text-gray-900 mb-4">Recent Installation Submissions</h4>
                        <div className="space-y-3">
                          {blockDetailedData.slice(0, 3).map((block) => {
                            const contacts = parseJsonArrayString(block.block_contacts);
                            const contact = contacts[0] || {};
                            return (
                              <div key={block.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="bg-purple-100 p-2 rounded-lg">
                                    <Building2 className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{block.block_name}</div>
                                    <div className="text-xs text-gray-500">{block.username} • {new Date(block.created_at).toLocaleDateString()}</div>
                                  </div>
                                </div>
                                <Badge className={getStatusColor(block.status)}>
                                  {block.status}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallationDashboard;