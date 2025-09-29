import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Construction, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle, 
  AlertTriangle, 
  Users,
  Search,
  User,
  Eye,
  X,
  SheetIcon,
  Folder,
  MoreVertical,
  Edit,
  GitBranch,
  Grid3X3,
  Loader,
  UserRoundCheck,
  List // Added for GP List icon
} from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';
import moment from 'moment';
import { useNavigate } from 'react-router-dom'; // Added for navigation
import UserAssignmentModal from './UserAssginmentModal';

// Types
interface Block {
  blockName: string;
  blockCode: number;
  blockId: number;
  district: string;
  length: string;
  no_of_gps: number;
  stage: string;
  status: string | null;
  assignedTo: string;
  progress: string;
  startDate: string | null;
  endDate: string | null;
}

interface District {
  district_id: number;
  district_code: string;
  district_name: string;
  state_code: string;
}

interface ApiStatsData {
  totalBlocks: number;
  assigned: number;
  unassigned: number;
  overdue: number;
  surveyProgress: string;
  constructionProgress: string;
  installationProgress: string;
}

interface ApiStatsResponse {
  status: boolean;
  level: string;
  state_code: string;
  data: ApiStatsData;
}

interface ApiDataResponse {
  status: boolean;
  data: Block[];
}

const BlocksManagementPage: React.FC = () => {
  const navigate = useNavigate(); // Added navigation hook
  
  // State management
  const [selectedRows, setSelectedRows] = useState<Block[]>([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [globalsearch, setGlobalSearch] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('survey');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedContractor, setSelectedContractor] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statsData, setStatsData] = useState<ApiStatsData | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [blocksData, setBlocksData] = useState<Block[]>([]);
  const [blocksLoading, setBlocksLoading] = useState<boolean>(true);
  const [blocksError, setBlocksError] = useState<string | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [showAssignPopup, setShowAssignPopup] = useState<boolean>(false);
  const [isAssigned, setIsAssigned] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
  type: 'success' | 'error' | 'warning';
  message: string;
  show: boolean;
}>({
  type: 'success',
  message: '',
  show: false
});
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

const refetchData = async () => {
  try {
    // Refetch both stats and blocks data
    await Promise.all([
      refetchStatsData(),
      refetchBlocksData()
    ]);
  } catch (error) {
    console.error('Error refetching data:', error);
    showNotification('error', 'Failed to refresh data');
  }
};

const refetchStatsData = async () => {
  try {
    setStatsLoading(true);
    const response = await fetch('https://api.tricadtrack.com/dashboard-count?state_code=19');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiResponse: ApiStatsResponse = await response.json();
    
    if (apiResponse.status && apiResponse.data) {
      setStatsData(apiResponse.data);
    }
  } catch (error) {
    console.error('Error refetching stats data:', error);
  } finally {
    setStatsLoading(false);
  }
};

const refetchBlocksData = async () => {
  try {
    setBlocksLoading(true);
    
    // Build API URL with current filters
    const params = new URLSearchParams({
      state_code: '19',
      stage: selectedStage || 'survey'
    });
    
    if (selectedDistrict) {
      params.append('district_code', selectedDistrict);
    }
    
    if (selectedStatus) {
      params.append('status', selectedStatus);
    }
    
    const response = await fetch(`https://api.tricadtrack.com/dashboard-data?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const apiResponse: ApiDataResponse = await response.json();
    
    if (apiResponse.status && apiResponse.data) {
      setBlocksData(apiResponse.data);
    }
  } catch (error) {
    console.error('Error refetching blocks data:', error);
  } finally {
    setBlocksLoading(false);
  }
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

  const BASEURL = import.meta.env.VITE_API_BASE;
  const TRACE_API_URL = import.meta.env.VITE_TraceAPI_URL;

  // Navigate to GP List page - Added this function
  const handleGPListClick = (blockId: number, blockName: string) => {
  navigate(`/blocks-management/gplist/${blockId}`, {
    state: { 
      blockName,
      returnTab: 'blocks'
    }
  });
};

  // Fetch stats data from API
  useEffect(() => {
    const fetchStatsData = async () => {
      setStatsLoading(true);
      setStatsError(null);
      
      try {
        const response = await fetch('https://api.tricadtrack.com/dashboard-count?state_code=19');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiResponse: ApiStatsResponse = await response.json();
        
        if (apiResponse.status && apiResponse.data) {
          setStatsData(apiResponse.data);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Error fetching stats data:', error);
        setStatsError(error instanceof Error ? error.message : 'Failed to fetch data');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatsData();
  }, []);

  // Fetch districts by state code - Using state_code=6
  const fetchDistricts = async () => {
    try {
      setLoadingDistricts(true);
      // Using state_code=6 as requested
      const response = await fetch(`${BASEURL}/districtsdata?state_code=6`);
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

  // Load districts on mount
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Fetch blocks data from API
  useEffect(() => {
    const fetchBlocksData = async () => {
      setBlocksLoading(true);
      setBlocksError(null);
      
      try {
        // Build API URL with filters
        const params = new URLSearchParams({
          state_code: '19',
          stage: selectedStage || 'survey'
        });
        
        if (selectedDistrict) {
          // Pass the district_code directly to the API
          params.append('district_code', selectedDistrict);
        }
        
        if (selectedStatus) {
          params.append('status', selectedStatus);
        }
        
        const response = await fetch(`https://api.tricadtrack.com/dashboard-data?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiResponse: ApiDataResponse = await response.json();
        
        if (apiResponse.status && apiResponse.data) {
          setBlocksData(apiResponse.data);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('Error fetching blocks data:', error);
        setBlocksError(error instanceof Error ? error.message : 'Failed to fetch blocks data');
      } finally {
        setBlocksLoading(false);
      }
    };

    // Only fetch blocks data if districts are loaded or no district is selected
    if (districts.length > 0 || selectedDistrict === '') {
      fetchBlocksData();
    }
  }, [selectedDistrict, selectedStage, selectedStatus, districts]);

  // Stats Panel Component
  const BlocksStatsPanel: React.FC = () => {
    if (statsLoading) {
      return (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="px-1 py-6">
            <div className="flex items-center justify-center py-8">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading dashboard data...</span>
            </div>
          </div>
        </div>
      );
    }

    if (statsError || !statsData) {
      return (
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="px-1 py-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-medium">Failed to load dashboard data</p>
              <p className="text-red-600 text-sm mt-1">{statsError || 'Unknown error'}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    const statsConfig = [
      {
        icon: Grid3X3,
        label: 'Total Blocks',
        value: statsData.totalBlocks,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        subtitle: `Assigned: ${statsData.assigned} | Unassigned: ${statsData.unassigned}`
      },
      {
        icon: AlertTriangle,
        label: 'Overdue',
        value: statsData.overdue,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        subtitle: 'Requires attention'
      },
      {
        icon: MapPin,
        label: 'Survey Progress',
        value: statsData.surveyProgress,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        subtitle: parseInt(statsData.surveyProgress) > 0 ? 'Completed' : 'Not started'
      },
      {
        icon: Construction,
        label: 'Construction',
        value: statsData.constructionProgress,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        subtitle: parseInt(statsData.constructionProgress) > 0 ? 'In progress' : 'Not started'
      },
      {
        icon: Users,
        label: 'Installation',
        value: statsData.installationProgress,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        subtitle: parseInt(statsData.installationProgress) > 0 ? 'In progress' : 'Not started'
      },
      {
        icon: CheckCircle,
        label: 'Assignment Rate',
        value: `${Math.round((statsData.assigned / statsData.totalBlocks) * 100)}%`,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        subtitle: `${statsData.assigned} of ${statsData.totalBlocks} assigned`
      }
    ];

    return (
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-1 py-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {statsConfig.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{stat.subtitle}</div>
                    </div>
                    <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const handleAssign = () => {
  if (selectedRows.length === 0) {
    alert('Please select at least one block to assign.');
    return;
  }
  setShowAssignPopup(true);
  };

  const handleAssignmentComplete = async (success: boolean, message: string) => {
  if (success) {
    // Clear selected rows and reset selection state
    setSelectedRows([]);
    setToggleCleared(!toggleCleared);
    
    // Show temporary assignment success indicator
    setIsAssigned(true);
    setTimeout(() => setIsAssigned(false), 3000);
    
    // Show success notification with API response message
    showNotification('success', message);
    
    // Refetch both stats and blocks data to reflect the assignment
    try {
      await refetchData();
    } catch (error) {
      console.error('Error refreshing data after assignment:', error);
      showNotification('warning', 'Assignment successful, but failed to refresh data. Please reload the page.');
    }
  } else {
    // Show error notification with API error message
    showNotification('error', message);
  }
};


  // Filter data - Remove district filtering since API handles it now
  const filteredData = useMemo(() => {
  return blocksData.filter((block) => {
    const matchesSearch = !globalsearch.trim() || 
      Object.values(block).some(value =>
        (typeof value === 'string' || typeof value === 'number') &&
        value.toString().toLowerCase().includes(globalsearch.toLowerCase())
      );
    
    const matchesStage = !selectedStage || block.stage.toLowerCase() === selectedStage.toLowerCase();
    
    // More explicit status filtering
    const matchesStatus = (() => {
      if (!selectedStatus) return true; // Show all when no filter selected
      if (selectedStatus === 'not-started') {
        return block.status === null || block.status === 'Unassigned';
      }
      return block.status === selectedStatus;
    })();
    
    return matchesSearch && matchesStage && matchesStatus;
  });
}, [globalsearch, selectedStage, selectedStatus, blocksData]);

  // Get unique contractors for filter dropdown - No change needed
  const uniqueContractors = useMemo(() => {
    return [...new Set(blocksData.map(block => block.assignedTo).filter(contractor => contractor !== "Unassigned"))].sort();
  }, [blocksData]);

  // Handlers
  const handleRowSelected = (state: { allSelected: boolean; selectedCount: number; selectedRows: Block[] }) => {
    setSelectedRows(state.selectedRows);
  };

  const handleClearRows = () => {
    setToggleCleared(!toggleCleared);
    setSelectedRows([]);
  };

  const clearFilters = () => {
    setGlobalSearch('');
    setSelectedDistrict('');
    setSelectedStage('survey');
    setSelectedStatus('');
    setSelectedContractor('');
  };
 
  const handleActionClick = (action: string, block: Block) => {
  switch (action) {
    case 'preview':
      null;
      break;
    case 'edit':
      handleEditBlock(block);
      break;
    case 'reassign':
      // Handle reassign action if needed
      break;
    case 'split':
      // Handle split action if needed
      break;
    case 'gplist':
      handleGPListClick(block.blockId, block.blockName);
      break;
    default:
  }
};

const handleEditBlock = (block: Block) => {
  setEditingBlock(block);
  // Simplified form data with just the essential fields
  setEditFormData({
    block_id: block.blockId,
    stage: block.stage.toLowerCase(), // Current stage of the block
    status: '',
    startDate: '',
    endDate: '',
    no_of_gps: '',
    proposed_length: '',
    incremental_length: '',
    assigned_to: '',
    progress: '',
    remark: ''
  });
};

const handleEditFormChange = (field: string, value: any) => {
  setEditFormData((prev: any) => ({
    ...prev,
    [field]: value
  }));
};

const handleEditSave = async () => {
  if (!editingBlock || !editFormData) return;

  try {
    setLoading(true);
    
    // Prepare updates object, only include non-empty values
    const updates: any = {};
    
    // Map generic fields to stage-specific API fields
    const stageFieldMapping: Record<string, any> = {
      desktop: {
        status: 'desktop_status',
        startDate: 'desktop_startDate',
        endDate: 'desktop_endDate'
      },
      survey: {
        status: 'physical_survey_status',
        startDate: 'physical_startDate',
        endDate: 'physical_endDate'
      },
      boq: {
        status: 'boq_status'
      },
      construction: {
        status: 'construction_status',
        startDate: 'construction_startDate',
        endDate: 'construction_endDate'
      },
      installation: {
        status: 'installation_status',
        startDate: 'installation_startDate',
        endDate: 'installation_endDate'
      }
    };

    // Apply stage-specific mappings
    const currentStageMapping = stageFieldMapping[editFormData.stage];
    if (currentStageMapping) {
      Object.keys(currentStageMapping).forEach(genericField => {
        const apiField = currentStageMapping[genericField];
        if (editFormData[genericField] && editFormData[genericField] !== '') {
          updates[apiField] = editFormData[genericField];
        }
      });
    }

    // Handle non-stage specific fields
    ['no_of_gps', 'proposed_length', 'incremental_length', 'assigned_to', 'progress'].forEach(field => {
      if (editFormData[field] !== '' && editFormData[field] !== null) {
        const numValue = parseFloat(editFormData[field]);
        if (!isNaN(numValue)) {
          updates[field] = numValue;
        }
      }
    });

    // Handle remark
    if (editFormData.remark && editFormData.remark !== '') {
      updates.remark = editFormData.remark;
    }

    const requestBody = {
      block_id: editFormData.block_id,
      updates: updates
    };

    const response = await fetch('https://api.tricadtrack.com/update-block', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status || result.success) {
      showNotification('success', 'Block updated successfully');
      setEditingBlock(null);
      setEditFormData(null);
      // Refresh data
      await refetchData();
    } else {
      throw new Error(result.message || 'Failed to update block');
    }
    
  } catch (error) {
    console.error('Error updating block:', error);
    showNotification('error', error instanceof Error ? error.message : 'Failed to update block');
  } finally {
    setLoading(false);
  }
};

  // Status Badge Component
  const getStatusBadge = (status: string | null) => {
    const getStatusColor = () => {
      switch (status) {
        case 'Completed':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'In Progress':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case null:
        case 'Unassigned':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const displayStatus = status || 'Not Started';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor()}`}>
        {displayStatus}
      </span>
    );
  };

  // Progress Component
  const getProgressComponent = (stage: string, progress: string) => {
    const progressValue = parseFloat(progress) || 0;
    
    const getStageLabel = () => {
      switch (stage.toLowerCase()) {
        case 'survey':
          return `Survey ${progressValue.toFixed(1)}%`;
        case 'construction':
          return `Constr ${progressValue.toFixed(1)}%`;
        case 'installation':
          return `Install ${progressValue.toFixed(1)}%`;
        default:
          return `${progressValue.toFixed(1)}%`;
      }
    };

    return (
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-900">{getStageLabel()}</div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${Math.min(progressValue, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Function to calculate dropdown position based on row index and total rows
  const getDropdownPosition = (rowIndex: number, totalRows: number) => {
    // If it's one of the last few rows, show dropdown above
    const threshold = Math.min(3, Math.ceil(totalRows * 0.2)); // Last 20% of rows or 3 rows, whichever is smaller
    const isNearBottom = rowIndex >= totalRows - threshold;
    
    return {
      positioning: isNearBottom ? 'bottom-8' : 'top-8',
      zIndex: 'z-[100]' // Higher z-index to ensure it appears above pagination
    };
  };

  // Table Columns
  const columns: TableColumn<Block>[] = [
    {
      name: "Block Name / Code",
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.blockName}</div>
          <div className="text-sm text-gray-500">#{row.blockCode}</div>
        </div>
      ),
      sortable: true,
      minWidth: "160px"
    },
    {
      name: "District",
      selector: row => row.district,
      sortable: true,
      maxWidth: "140px"
    },
    {
      name: "Length",
      selector: row => row.length,
      sortable: true,
      maxWidth: "100px"
    },
    {
      name: "GPS",
      cell: (row) => (
        <div className="text-sm font-medium text-gray-900">
          {(row as any).no_of_gps || 0}
        </div>
      ),
      sortable: true,
      maxWidth: "100px"
    },
    {
      name: "Stage",
      selector: row => row.stage,
      sortable: true,
      minWidth: "130px",
      cell: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
          row.stage.toLowerCase() === 'survey' ? 'bg-yellow-100 text-yellow-800' :
          row.stage.toLowerCase() === 'construction' ? 'bg-orange-100 text-orange-800' :
          row.stage.toLowerCase() === 'installation' ? 'bg-purple-100 text-purple-800' :
          row.stage.toLowerCase() === 'desktop' ? 'bg-blue-100 text-blue-800' :
          row.stage.toLowerCase() === 'boq' ? 'bg-indigo-100 text-indigo-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {row.stage}
        </span>
      )
    },
    {
      name: "Status",
      cell: (row) => getStatusBadge(row.status),
      sortable: true,
      minWidth: "130px"
    },
    {
      name: "Assigned To",
      cell: (row) => (
        <div className="flex items-center min-w-0">
          {row.assignedTo && row.assignedTo !== 'Unassigned' ? (
            <>
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                <User className="w-3 h-3 text-gray-600" />
              </div>
              <span className="truncate" title={row.assignedTo}>
                {row.assignedTo}
              </span>
            </>
          ) : (
            <span className="text-gray-500">Unassigned</span>
          )}
        </div>
      ),
      sortable: true,
      minWidth: "140px"
    },
    {
      name: "Progress",
      cell: (row) => getProgressComponent(row.stage, row.progress),
      sortable: true,
      minWidth: "140px"
    },
    {
      name: "Start Date",
      cell: (row) => (
        <div className="text-sm">
          {row.startDate ? (
            <div>{moment(row.startDate).format("DD MMM")}</div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
      sortable: true,
      maxWidth: "100px"
    },
    {
      name: "End Date",
      cell: (row) => (
        <div className="text-sm">
          {row.endDate ? (
            <div>{moment(row.endDate).format("DD MMM")}</div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
      sortable: true,
      maxWidth: "100px"
    },
    {
  name: 'Actions',
  cell: (row) => {
    return (
      <div className="flex items-center gap-1">
        {/* Preview Button */}
        <button
          onClick={() => handleActionClick('preview', row)}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Preview"
        >
          <Eye className="w-4 h-4" />
        </button>
        
        {/* Edit Button */}
        <button
          onClick={() => handleActionClick('edit', row)}
          className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        
        {/* Split Button */}
        <button
          onClick={() => handleActionClick('split', row)}
          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title="Split"
        >
          <GitBranch className="w-4 h-4" />
        </button>
        
        {/* GP List Button */}
        <button
          onClick={() => handleActionClick('gplist', row)}
          className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
          title="Go to GP List"
        >
          GP List
        </button>
      </div>
    );
  },
  ignoreRowClick: true,
  allowOverflow: false,
  button: true,
  width: "180px",
},
  ];

  const customStyles = {
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
    table: {
      style: {
        overflow: 'visible', // Allow dropdowns to overflow table boundaries
      },
    },
    tableWrapper: {
      style: {
        overflow: 'visible', // Allow dropdowns to overflow wrapper boundaries
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-black flex items-center justify-center">
              <Grid3X3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Block Assginment</h1>
              <p className="text-sm text-gray-600">Project Infrastructure Blocks</p>
            </div>
          </div>
          <button className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2">
            <span>+</span>
            New Block
          </button>
        </div>
      </header>

      {/* Stats Panel */}
      <BlocksStatsPanel />

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* District Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={loadingDistricts}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none disabled:opacity-50"
              >
                <option value="">District</option>
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

            {/* Stage Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
              >
                <option value="survey">Survey</option>
                <option value="construction">Construction</option>
                <option value="installation">Installation</option>
                <option value="desktop">Desktop</option>
                <option value="boq">BOQ</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
              >
                <option value="">Status</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Not started">Not Started</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Contractor Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
              >
                <option value="">Contractor</option>
                {uniqueContractors.map(contractor => (
                  <option key={contractor} value={contractor}>{contractor}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search Block..."
                value={globalsearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none"
              />
            </div>

            <button 
              onClick={handleAssign}
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
            >
              {isAssigned ? (
                <UserRoundCheck className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
              Bulk Assign
            </button>

            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
              Reassign
            </button>

            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
              <SheetIcon className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Selection Actions */}
        {selectedRows.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">
              {selectedRows.length} item(s) selected
            </span>
            <button
              onClick={handleClearRows}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Loading State */}
        {blocksLoading && (
          <div className="p-12 text-center">
            <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading blocks data...</p>
          </div>
        )}

        {/* Error State */}
        {blocksError && !blocksLoading && (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load blocks data</h3>
            <p className="text-gray-500 mb-4">{blocksError}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* No Data State */}
        {!blocksLoading && !blocksError && filteredData.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Folder className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blocks found</h3>
            <p className="text-gray-500">
              {globalsearch || selectedDistrict || selectedStatus
                ? 'Try adjusting your search or filter criteria.'
                : 'There are no blocks available for the selected stage.'
              }
            </p>
          </div>
        )}

        {/* Data Table */}
        {!blocksLoading && !blocksError && filteredData.length > 0 && (
          <div className="overflow-x-auto" style={{ overflow: 'visible' }}>
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              highlightOnHover
              pointerOnHover
              striped={false}
              dense={false}
              responsive
              customStyles={customStyles}
              noHeader
              selectableRows
              onSelectedRowsChange={handleRowSelected}
              clearSelectedRows={toggleCleared}
              progressPending={false}
            />
          </div>
        )}

        {/* Block Edit Modal */}
        {editingBlock && editFormData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Edit Block - {editingBlock.blockName}</h3>
                  <button
                    onClick={() => {
                      setEditingBlock(null);
                      setEditFormData(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of GPS</label>
                      <input
                        type="number"
                        value={editFormData.no_of_gps}
                        onChange={(e) => handleEditFormChange('no_of_gps', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter number of GPS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={editFormData.progress}
                        onChange={(e) => handleEditFormChange('progress', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter progress percentage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Proposed Length (km)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.proposed_length}
                        onChange={(e) => handleEditFormChange('proposed_length', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter proposed length"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Incremental Length (km)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editFormData.incremental_length}
                        onChange={(e) => handleEditFormChange('incremental_length', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter incremental length"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To (ID)</label>
                      <input
                        type="number"
                        value={editFormData.assigned_to}
                        onChange={(e) => handleEditFormChange('assigned_to', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter assigned user ID"
                      />
                    </div>
                  </div>
                </div>

                {/* Stage-specific Information */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      editFormData.stage === 'desktop' ? 'bg-blue-500' :
                      editFormData.stage === 'survey' ? 'bg-yellow-500' :
                      editFormData.stage === 'boq' ? 'bg-indigo-500' :
                      editFormData.stage === 'construction' ? 'bg-orange-500' :
                      editFormData.stage === 'installation' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}></div>
                    {editFormData.stage.charAt(0).toUpperCase() + editFormData.stage.slice(1)} Stage
                  </h4>
                  
                  {/* Stage Selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                    <select
                      value={editFormData.stage}
                      onChange={(e) => handleEditFormChange('stage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="desktop">Desktop Survey</option>
                      <option value="survey">Physical Survey</option>
                      <option value="boq">BOQ (Bill of Quantities)</option>
                      <option value="construction">Construction</option>
                      <option value="installation">Installation</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => handleEditFormChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Status</option>
                        <option value="Not started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    
                    {/* Only show date fields for stages that support them (not BOQ) */}
                    {editFormData.stage !== 'boq' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={editFormData.startDate}
                            onChange={(e) => handleEditFormChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                          <input
                            type="date"
                            value={editFormData.endDate}
                            onChange={(e) => handleEditFormChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Remarks</h4>
                  <div>
                    <textarea
                      value={editFormData.remark}
                      onChange={(e) => handleEditFormChange('remark', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Enter any remarks or comments..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditingBlock(null);
                    setEditFormData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <UserAssignmentModal
        isOpen={showAssignPopup}
        onClose={() => setShowAssignPopup(false)}
        selectedItems={selectedRows}
        itemType="blocks"
        onAssignmentComplete={handleAssignmentComplete}
        traceApiUrl={TRACE_API_URL}
        assignmentApiUrl="https://api.tricadtrack.com/assign-block"
        selectedStage={selectedStage}
      />

      {notification.show && (
        <div className={`fixed top-4 right-4 z-[60] min-w-80 max-w-md transform transition-all duration-300 ease-in-out ${
          notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}>
          <div className={`flex items-start p-4 rounded-lg shadow-lg border-l-4 ${
            notification.type === 'success' ? 'bg-green-500 text-white border-green-600' :
            notification.type === 'error' ? 'bg-red-500 text-white border-red-600' :
            'bg-yellow-500 text-white border-yellow-600'
          }`}>
            <div className="flex-shrink-0 mr-3">
              {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
               notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
               <AlertTriangle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium leading-5 whitespace-pre-line break-words">
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

export default BlocksManagementPage;