import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, UserRoundCheck, X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

interface GPListResponse {
  success: boolean;
  data: any[];
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

const RouteGPList = () => {
  const { id: networkId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const networkNameFromState = location.state?.networkName || '';
  
  // Main data states
  const [gpListData, setGpListData] = useState<any[]>([]);
  const [loadingGPList, setLoadingGPList] = useState<boolean>(false);
  const [gpListError, setGpListError] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>(networkNameFromState);
  
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
      
      const response = await fetch(`https://traceapi.keeshondcoin.com/get-gplist/${networkId}`);
      
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

  // Load data on mount
  useEffect(() => {
    fetchGPList();
  }, [networkId]);

  // Get cable type from color
  const getCableType = (color: string): string => {
    switch (color) {
      case '#000000':
        return 'Existing Cable';
      case '#00FFFF':
        return 'Proposed Cable';
      default:
        return 'Unknown';
    }
  };

  // Get badge styling for cable type
  const getCableTypeBadge = (color: string) => {
    const cableType = getCableType(color);
    switch (cableType) {
      case 'Existing Cable':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Proposed Cable':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Navigate back to route list
  const handleBackClick = () => {
    navigate('/route-planning/route-list');
  };

  // Open assignment popup
  const handleAssign = () => {
    if (selectedConnections.size === 0) {
      alert('Please select at least one connection to assign.');
      return;
    }
    setShowAssignPopup(true);
    fetchUsersList();
  };

  // Fetch available users
  const fetchUsersList = async () => {
    try {
      setLoadingUsers(true);
      setUsersError(null);
      
      const response = await fetch('https://traceapi.keeshondcoin.com/user-list');
      
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

  // Show toast notification
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

  // Toggle user selection
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

  // Submit assignments to API
  const handleFinalAssignment = async () => {
    if (selectedUsers.size === 0) {
      showNotification('error', 'Please select at least one user.');
      return;
    }

    try {
      setLoadingUsers(true);
      
      const selectedUsersList = Array.from(selectedUsers);
      const selectedConnectionsList = Array.from(selectedConnections);
      
      // Create assignment for each connection-user pair
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
          
          const assignmentPromise = fetch('https://traceapi.keeshondcoin.com/assign-segment', {
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
      
      // Wait for all assignments
      const results = await Promise.allSettled(assignmentPromises);
      
      const failures = results.filter(result => result.status === 'rejected');
      const successes = results.filter(result => result.status === 'fulfilled');
      
      if (failures.length > 0) {
        console.error('Some assignments failed:', failures);
        showNotification('warning', `${successes.length} assignments succeeded, but ${failures.length} failed. Check console for details.`);
      } else {
        console.log('All assignments completed successfully');
        showNotification('success', `Successfully assigned ${selectedConnectionsList.length} connection(s) to ${selectedUsersList.length} user(s)!`);
      }
      
      // Reset states
      setShowAssignPopup(false);
      setSelectedConnections(new Set());
      setSelectedUsers(new Set());
      setSearchQuery('');
      
      setIsAssigned(true);
      setTimeout(() => {
        setIsAssigned(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error during assignment:', error);
      showNotification('error', `Assignment failed: ${error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Close assignment popup
  const closeAssignPopup = () => {
    setShowAssignPopup(false);
    setSelectedUsers(new Set());
    setSearchQuery('');
  };

  // Filter users by search query
  const filteredUsers = usersList.filter(user =>
    user.fullname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle connection selection
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

  // Toggle select all connections
  const handleSelectAll = (connectionsData: any[]) => {
    if (selectedConnections.size === connectionsData.length) {
      setSelectedConnections(new Set());
    } else {
      setSelectedConnections(new Set(connectionsData.map((conn, index) => String(conn.id || index))));
    }
  };

  // Close notification toast
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  // Get notification icon
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

  // Render connections table
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

    // Handle different data structures
    let connectionsData = [];
    if (gpListData.connections && Array.isArray(gpListData.connections)) {
      connectionsData = gpListData.connections;
    } else if (Array.isArray(gpListData)) {
      connectionsData = gpListData;
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
              <th scope="col" className="px-3 py-2">Start Point</th>
              <th scope="col" className="px-3 py-2">End Point</th>
              <th scope="col" className="px-3 py-2">Length (km)</th>
              <th scope="col" className="px-3 py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {connectionsData.map((connection, index) => {
              const connectionKey = String(connection.id || index);
              const isSelected = selectedConnections.has(connectionKey);
              
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
                  <td className="px-3 py-2">
                    {connection.start || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {connection.end || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {connection.length ? parseFloat(connection.length).toFixed(3) : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCableTypeBadge(connection.color)}`}>
                      {getCableType(connection.color)}
                    </span>
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
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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