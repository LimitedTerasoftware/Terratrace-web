import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, UserRoundCheck, X, CheckCircle, AlertCircle, AlertTriangle, Edit, Save } from 'lucide-react';

interface Connection {
  id?: number;
  start?: string;
  end?: string;
  length?: string | number;
  color?: string;
  status?: string;
  type?: string; 
  original_name?: string;
  user_id?: string | number;
  user_name?: string;
  properties?: string | Record<string, any>;
}

interface GPListResponse {
  success: boolean;
  data: any[] | { connections?: Connection[] };
  message: string;
}

interface User {
  id: number;
  company_id: number;
  fullname: string;
  email: string;
  contact_no: string;
}

interface UserListResponse {
  data: {
    usersList: User[];
  };
}

interface EditFormData {
  start: string;
  end: string;
  length: string;
  original_name: string;
  type: string;
  user_id: string;
  user_name: string;
}

const BASEURL_Val = import.meta.env.VITE_TraceAPI_URL;

const RouteGPList = () => {
  const { id: networkId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const networkName = location.state?.networkName || '';
  const returnTab = location.state?.returnTab || 'verified';
  
  // Main data states
  const [gpListData, setGpListData] = useState<any[] | { connections?: Connection[] }>([]);
  const [loadingGPList, setLoadingGPList] = useState<boolean>(false);
  const [gpListError, setGpListError] = useState<string | null>(null);
  
  // Assignment states
  const [isAssigned, setIsAssigned] = useState<boolean>(false);
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  
  // User popup states
  const [showAssignPopup, setShowAssignPopup] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());

  // Edit states
  const [editingConnection, setEditingConnection] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    start: '',
    end: '',
    length: '',
    original_name: '',
    type: '',
    user_id: '',
    user_name: ''
  });
  const [loadingEdit, setLoadingEdit] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<{
  start?: string;
  end?: string;
  original_name?: string;
  length?: string;
  }>({});

  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    show: boolean;
  }>({
    type: 'success',
    message: '',
    show: false
  });

  // Fetch GP connections list
  const fetchGPList = async () => {
    if (!networkId) {
      setGpListError('Network ID is required');
      return;
    }

    try {
      setLoadingGPList(true);
      setGpListError(null);
      
      const response = await fetch(`${BASEURL_Val}/get-gplist/${networkId}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data: GPListResponse = await response.json();
      
      if (data.success) {
        setGpListData(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to fetch GP list');
      }
    } catch (error: any) {
      console.error('Error fetching GP list:', error);
      setGpListError(error.message);
      setGpListData([]);
    } finally {
      setLoadingGPList(false);
    }
  };

  useEffect(() => {
    if (networkId) {
      fetchGPList();
    }
  }, [networkId]);

  // Edit functionality
  const handleEditClick = (connection: Connection) => {
  setEditingConnection(connection.id!);
  setEditFormData({
    start: connection.start || '',
    end: connection.end || '',
    length: String(connection.length || ''),
    original_name: connection.original_name || '',
    type: connection.type || 'proposed',
    user_id: String(connection.user_id || ''),
    user_name: connection.user_name || ''
  });
     setValidationErrors({});
  };

  const handleEditInputChange = (field: keyof EditFormData, value: string) => {
  setEditFormData(prev => ({
    ...prev,
    [field]: value
  }));
  
  // Validate the field in real-time
  validateField(field, value);
};

  const validateField = (field: keyof EditFormData, value: string) => {
  let error = '';
  
  switch (field) {
    case 'start':
    case 'end':
      const fieldName = field === 'start' ? 'Start point' : 'End point';
      const validation = validateCoordinateWithMessage(value, fieldName);
      if (!validation.isValid && value.trim() !== '') {
        error = validation.message;
      }
      break;
    case 'original_name':
      if (!value.trim()) {
        error = 'Route name is required';
      }
      break;
    case 'length':
      if (!value || parseFloat(value) <= 0) {
        error = 'Length must be a positive number';
      }
      break;
  }
  
  setValidationErrors(prev => ({
    ...prev,
    [field]: error
  }));
  
  return error === '';
};

  // Validation function for coordinates
const isValidCoordinate = (coordinate: string): boolean => {
  if (!coordinate || coordinate.trim() === '') {
    return false;
  }

  // Remove whitespace
  const trimmed = coordinate.trim();
  
  // Check if it's a simple number like 123, 1234, 0000 etc.
  if (/^\d+$/.test(trimmed)) {
    return false;
  }

  // Check for valid coordinate patterns
  // Decimal degrees: -90.123456, 180.654321
  const decimalPattern = /^-?(?:(?:1[0-7]\d|[1-9]?\d)(?:\.\d+)?|180(?:\.0+)?)$/;
  
  // DMS format: 40°26'46"N, 79°58'56"W or similar variations
  const dmsPattern = /^-?\d{1,3}[°]?\s*\d{1,2}['′]?\s*\d{1,2}(?:\.\d+)?["″]?\s*[NSEW]?$/i;
  
  // Coordinate pair format: "lat,lng" or "lat, lng"
  const coordPairPattern = /^-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?$/;
  
  // UTM format basic check
  const utmPattern = /^\d{1,2}[NSEW]\s+\d+\s+\d+$/i;

  return decimalPattern.test(trimmed) || 
         dmsPattern.test(trimmed) || 
         coordPairPattern.test(trimmed) ||
         utmPattern.test(trimmed);
};

// Enhanced validation function with more specific error messages
const validateCoordinateWithMessage = (coordinate: string, fieldName: string): { isValid: boolean; message: string } => {
  if (!coordinate || coordinate.trim() === '') {
    return { 
      isValid: false, 
      message: `${fieldName} is required` 
    };
  }

  const trimmed = coordinate.trim();
  
  // Check if it's just numbers (invalid)
  if (/^\d+$/.test(trimmed)) {
    return { 
      isValid: false, 
      message: `${fieldName} must be valid coordinates` 
    };
  }

  // Check if it's zeros (likely invalid)
  if (/^0+$/.test(trimmed)) {
    return { 
      isValid: false, 
      message: `${fieldName} cannot be all zeros` 
    };
  }

  if (!isValidCoordinate(coordinate)) {
    return { 
      isValid: false, 
      message: `${fieldName} must be valid coordinates.` 
    };
  }

  return { isValid: true, message: '' };
};

const getInputClassName = (field: keyof EditFormData) => {
  const baseClasses = "w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1";
  const hasError = validationErrors[field];
  
  if (hasError) {
    return `${baseClasses} border-red-300 focus:ring-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600 dark:text-white`;
  }
  
  return `${baseClasses} border-gray-300 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white`;
};

// Updated handleEditSave function with validation
const handleEditSave = async (connectionId: number) => {
  // Validate start point
  const startValidation = validateCoordinateWithMessage(editFormData.start, 'Start point');
  if (!startValidation.isValid) {
    showNotification('error', startValidation.message);
    return;
  }

  // Validate end point
  const endValidation = validateCoordinateWithMessage(editFormData.end, 'End point');
  if (!endValidation.isValid) {
    showNotification('error', endValidation.message);
    return;
  }

  // Validate other required fields
  if (!editFormData.original_name.trim()) {
    showNotification('error', 'Route name is required');
    return;
  }

  if (!editFormData.length || parseFloat(editFormData.length) <= 0) {
    showNotification('error', 'Length must be a positive number');
    return;
  }

  try {
    setLoadingEdit(true);
    
    const updateData = {
      start: editFormData.start.trim(),
      end: editFormData.end.trim(),
      length: editFormData.length,
      original_name: editFormData.original_name.trim(),
      type: editFormData.type,
      user_id: editFormData.user_id,
      user_name: editFormData.user_name
    };

    const response = await fetch(`${BASEURL_Val}/update-connections/${connectionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      // Try to get JSON error first, fallback to text
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      } catch {
        try {
          const errorText = await response.text();
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      }
      throw new Error(`Update failed: ${errorMessage}`);
    }

    const result = await response.json();      
    showNotification('success', 'Connection updated successfully!');
    setEditingConnection(null);
    fetchGPList(); // Refresh the list
    
  } catch (error: any) {
    console.error('Error updating connection:', error);
    showNotification('error', `Update failed: ${error.message}`);
  } finally {
    setLoadingEdit(false);
  }
};

  const handleEditCancel = () => {
    setEditingConnection(null);
    setEditFormData({
      start: '',
      end: '',
      length: '',
      original_name: '',
      type: '',
      user_id: '',
      user_name: ''
    });
  };

  // Updated getCableType function to use the type field from API response
  const getCableType = (connection: Connection): string => {
    // First check the top-level type field
    if (connection.type) {
      if (connection.type === 'existing') {
        return 'Existing Cable';
      } else if (connection.type === 'proposed') {
        return 'Proposed Cable';
      }
    }
    
    // Fallback to properties if available
    let parsedProperties: any = {};
    try {
      if (typeof connection.properties === 'string') {
        parsedProperties = JSON.parse(connection.properties);
      } else if (connection.properties) {
        parsedProperties = connection.properties;
      }
    } catch (error) {
      console.warn('Error parsing properties:', error);
    }
    
    // Check properties type field
    if (parsedProperties.type) {
      if (parsedProperties.type.toLowerCase().includes('existing')) {
        return 'Existing Cable';
      } else if (parsedProperties.type.toLowerCase().includes('proposed')) {
        return 'Proposed Cable';
      }
    }
    
    // Final fallback to status
    if (connection.status?.toLowerCase() === 'accepted') {
      return 'Existing Cable';
    } else if (connection.status?.toLowerCase() === 'proposed') {
      return 'Proposed Cable';
    }
    
    return 'Unknown';
  };

  const getCableTypeBadge = (type: string) => {
    const normalizedType = type?.toLowerCase() || '';
    
    if (normalizedType.includes('existing')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else if (normalizedType.includes('proposed')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    switch (normalizedStatus) {
      case 'assigned':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'in-progress':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'unassigned':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatStatus = (status: string): string => {
    if (!status) return 'Unassigned';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const getAssignedUserDisplay = (connection: Connection): string => {
    // Check if connection has assigned status and user information
    if (connection.status?.toLowerCase() === 'assigned' && connection.user_name) {
      return connection.user_name;
    }
    
    // Check if there's user info in properties
    let parsedProperties: any = {};
    try {
      if (typeof connection.properties === 'string') {
        parsedProperties = JSON.parse(connection.properties);
      } else if (connection.properties) {
        parsedProperties = connection.properties;
      }
    } catch (error) {
      console.warn('Error parsing properties for user info:', error);
    }
    
    // Check properties for user assignment
    if (parsedProperties.user_name && connection.status?.toLowerCase() === 'assigned') {
      return parsedProperties.user_name;
    }
    
    return 'Not Available';
  };

  const handleBackClick = () => {
    // Navigate back to route list with the return tab information
    navigate('/route-planning/route-list', {
      state: { returnTab: returnTab }
    });
  };

  const handleAssign = () => {
    if (selectedConnections.size === 0) {
      alert('Please select at least one connection to assign.');
      return;
    }
    setShowAssignPopup(true);
    fetchUsersList();
  };

  const fetchUsersList = async () => {
    try {
      setLoadingUsers(true);
      setUsersError(null);
      
      const response = await fetch(`${BASEURL_Val}/user-list`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data: UserListResponse = await response.json();
      setUsersList(data.data.usersList || []);
    } catch (error: any) {
      console.error('Error fetching users list:', error);
      setUsersError(error.message);
      setUsersList([]);
    } finally {
      setLoadingUsers(false);
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

  const handleUserSelection = (userId: number) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleFinalAssignment = async () => {
    if (selectedUsers.size === 0) {
      showNotification('error', 'Please select at least one user.');
      return;
    }

    try {
      setLoadingUsers(true);
      
      const selectedUsersList = Array.from(selectedUsers);
      const selectedConnectionsList = Array.from(selectedConnections);
      
      const assignmentPromises = [];
      
      for (const connectionId of selectedConnectionsList) {
        for (const userId of selectedUsersList) {
          const user = usersList.find(u => u.id === userId);
          if (!user) continue;
          
          const assignmentData = {
            connectionId: parseInt(connectionId),
            user_id: userId,
            user_name: user.fullname
          };
          
          const assignmentPromise = fetch(`${BASEURL_Val}/assign-segment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(assignmentData)
          }).then(async (response) => {
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Assignment failed for connection ${connectionId} to user ${user.fullname}: ${errorText}`);
            }
            return response.json();
          });
          
          assignmentPromises.push(assignmentPromise);
        }
      }
      
      const results = await Promise.allSettled(assignmentPromises);
      
      const failures = results.filter(result => result.status === 'rejected');
      const successes = results.filter(result => result.status === 'fulfilled');
      
      if (failures.length > 0) {
        console.error('Some assignments failed:', failures);
        showNotification('warning', `${successes.length} assignments succeeded, but ${failures.length} failed. Check console for details.`);
      } else {
        showNotification('success', `Successfully assigned ${selectedConnectionsList.length} connection(s) to ${selectedUsersList.length} user(s)!`);
      }
      
      setShowAssignPopup(false);
      setSelectedConnections(new Set());
      setSelectedUsers(new Set());
      setSearchQuery('');
      
      setIsAssigned(true);
      setTimeout(() => {
        setIsAssigned(false);
      }, 3000);
      
      fetchGPList();
      
    } catch (error: any) {
      console.error('Error during assignment:', error);
      showNotification('error', `Assignment failed: ${error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  const closeAssignPopup = () => {
    setShowAssignPopup(false);
    setSelectedUsers(new Set());
    setSearchQuery('');
  };

  const filteredUsers = usersList.filter(user =>
    user.fullname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRowSelection = (connectionId: string | number) => {
    const connectionKey = String(connectionId);
    
    setSelectedConnections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(connectionKey)) {
        newSet.delete(connectionKey);
      } else {
        newSet.add(connectionKey);
      }
      return newSet;
    });
  };

  const handleSelectAll = (connectionsData: Connection[]) => {
    if (selectedConnections.size === connectionsData.length) {
      setSelectedConnections(new Set());
    } else {
      setSelectedConnections(new Set(connectionsData.map((conn, index) => String(conn.id || index))));
    }
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

  const renderGPListContent = () => {
    if (loadingGPList) {
      return (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 mr-3 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading GP List...
        </div>
      );
    }

    if (gpListError) {
      return (
        <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">
          <span className="font-medium">Error:</span> {gpListError}
        </div>
      );
    }

    if (!gpListData) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No GP data found for this network.
        </div>
      );
    }

    let connectionsData: Connection[] = [];
    if (Array.isArray(gpListData)) {
      connectionsData = gpListData;
    } else if (gpListData && typeof gpListData === 'object' && 'connections' in gpListData && Array.isArray(gpListData.connections)) {
      connectionsData = gpListData.connections;
    } else {
      return (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium mb-2 text-gray-900 dark:text-white">GP Data:</h3>
          <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-96">
            {JSON.stringify(gpListData, null, 2)}
          </pre>
        </div>
      );
    }

    if (connectionsData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No connections found for this network.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto relative">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-200 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedConnections.size === connectionsData.length && connectionsData.length > 0}
                  onChange={() => handleSelectAll(connectionsData)}
                  className="w-4 h-4 rounded focus:ring-0 outline-none border-2 border-blue-900 checked:bg-blue-900 checked:border-blue-900"
                  style={{
                    accentColor: 'rgb(30, 58, 138)'
                  }}
                />
              </th>
              <th scope="col" className="px-3 py-2">Route Name</th>
              <th scope="col" className="px-3 py-2">Start Point</th>
              <th scope="col" className="px-3 py-2">End Point</th>
              <th scope="col" className="px-3 py-2">Length (km)</th>
              <th scope="col" className="px-3 py-2">Type</th>
              <th scope="col" className="px-3 py-2">Status</th>
              <th scope="col" className="px-3 py-2">Assigned To</th>
              <th scope="col" className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {connectionsData.map((connection, index) => {
              const connectionKey = String(connection.id || index);
              const isSelected = selectedConnections.has(connectionKey);
              const isEditing = editingConnection === connection.id;
              
              return (
                <tr key={connection.id || index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleRowSelection(connectionKey)}
                      className="w-4 h-4 rounded focus:ring-0 outline-none border-2 border-blue-900 checked:bg-blue-900 checked:border-blue-900"
                      style={{
                        accentColor: 'rgb(30, 58, 138)'
                      }}
                    />
                  </td>
                  
                  {/* Route Name */}
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFormData.original_name}
                        onChange={(e) => handleEditInputChange('original_name', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Route name"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {connection.original_name || 'N/A'}
                      </span>
                    )}
                  </td>
                  
                  {/* Start Point */}
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={editFormData.start}
                          onChange={(e) => handleEditInputChange('start', e.target.value)}
                          className={getInputClassName('start')}
                          placeholder="e.g., 40.7128, -74.0060"
                        />
                        {validationErrors.start && (
                          <p className="text-xs text-red-600 mt-1">{validationErrors.start}</p>
                        )}
                      </div>
                    ) : (
                      connection.start || '-'
                    )}
                  </td>
                  
                  {/* End Point */}
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={editFormData.end}
                          onChange={(e) => handleEditInputChange('end', e.target.value)}
                          className={getInputClassName('end')}
                          placeholder="e.g., 41.8781, -87.6298"
                        />
                        {validationErrors.end && (
                          <p className="text-xs text-red-600 mt-1">{validationErrors.end}</p>
                        )}
                      </div>
                    ) : (
                      connection.end || '-'
                    )}
                  </td>
                  
                  {/* Length */}
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.001"
                        value={editFormData.length}
                        onChange={(e) => handleEditInputChange('length', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Length"
                      />
                    ) : (
                      connection.length ? parseFloat(String(connection.length)).toFixed(3) : '-'
                    )}
                  </td>
                  
                  {/* Type */}
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <select
                        value={editFormData.type}
                        onChange={(e) => handleEditInputChange('type', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="proposed">Proposed</option>
                        <option value="existing">Existing</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCableTypeBadge(getCableType(connection))}`}>
                        {getCableType(connection)}
                      </span>
                    )}
                  </td>
                  
                  {/* Status */}
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(connection.status || '')}`}>
                      {formatStatus(connection.status || '')}
                    </span>
                  </td>
                  
                  {/* Assigned To */}
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={editFormData.user_name}
                          onChange={(e) => handleEditInputChange('user_name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="User name"
                        />
                        <input
                          type="text"
                          value={editFormData.user_id}
                          onChange={(e) => handleEditInputChange('user_id', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder="User ID"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        {getAssignedUserDisplay(connection) !== 'Not Available' ? (
                          <>
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                              <span className="text-white text-xs font-medium">
                                {getAssignedUserDisplay(connection).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {getAssignedUserDisplay(connection)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Not Available
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  {/* Actions */}
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleEditSave(connection.id!)}
                            disabled={loadingEdit}
                            className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Save changes"
                          >
                            {loadingEdit ? (
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={handleEditCancel}
                            disabled={loadingEdit}
                            className="p-1 text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleEditClick(connection)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="Edit connection"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="sm:p-2 lg:p-4 bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-1 px-2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-blue-900 dark:text-blue-100">
            GP List - {decodeURIComponent(networkName)}
          </h1>
          
          <button
            onClick={handleAssign}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 outline-none"
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

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {renderGPListContent()}
      </div>

      {/* Assignment Popup */}
      {showAssignPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Popup Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Assign Connections
                </h3>
                <button
                  onClick={closeAssignPopup}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Selected {selectedConnections.size} connection(s)
              </p>
            </div>

            {/* Search Input */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Users List */}
            <div className="px-6 py-4 max-h-60 overflow-y-auto">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-4">
                  <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-2">Loading users...</span>
                </div>
              ) : usersError ? (
                <div className="text-red-600 dark:text-red-400 text-sm">
                  Error: {usersError}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No users found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.fullname.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.fullname}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleUserSelection(user.id)}
                          className="w-4 h-4 rounded focus:ring-0 outline-none border-2 border-blue-900 checked:bg-blue-900 checked:border-blue-900"
                          style={{
                            accentColor: 'rgb(30, 58, 138)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Popup Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={closeAssignPopup}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              
              {selectedUsers.size > 0 && (
                <button
                  onClick={handleFinalAssignment}
                  disabled={loadingUsers}
                  className="px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#a855a7' }}
                >
                  {loadingUsers ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Assigning...
                    </div>
                  ) : (
                    `Assign (${selectedUsers.size} user${selectedUsers.size > 1 ? 's' : ''})`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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

export default RouteGPList;