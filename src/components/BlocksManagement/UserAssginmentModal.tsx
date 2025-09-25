import React, { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

// Types
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

interface Block {
  blockName: string;
  blockCode: number;
  blockId: number;
  district: string;
  length: string;
  stage: string;
  status: string | null;
  assignedTo: string;
  progress: string;
  startDate: string | null;
  endDate: string | null;
}

interface UserAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: Block[] | any[]; // Can be blocks or connections
  itemType: 'blocks' | 'connections';
  onAssignmentComplete: (success: boolean, message: string) => void;
  traceApiUrl: string;
  assignmentApiUrl: string;
  selectedStage?: string;
}

interface NotificationState {
  type: 'success' | 'error' | 'warning';
  message: string;
  show: boolean;
}

interface AssignmentRequest {
  block_ids: number[];
  user_id: number;
  user_name: string;
}

interface AssignmentResponse {
  success: boolean;
  message: string;
  data?: any;
}

const UserAssignmentModal: React.FC<UserAssignmentModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  itemType,
  onAssignmentComplete,
  traceApiUrl,
  assignmentApiUrl,
  selectedStage
}) => {
  // State management
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [assignmentInProgress, setAssignmentInProgress] = useState<boolean>(false);

  // Notification state
  const [notification, setNotification] = useState<NotificationState>({
    type: 'success',
    message: '',
    show: false
  });

  // Fetch users list
  const fetchUsersList = async () => {
    try {
      setLoadingUsers(true);
      setUsersError(null);
      
      const response = await fetch(`${traceApiUrl}/user-list`);
      
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

  // Assignment function
  const handleAssignment = async () => {
    if (selectedUsers.size === 0 || selectedItems.length === 0) {
      showNotification('warning', 'Please select at least one user and ensure blocks are selected.');
      return;
    }

    try {
      setAssignmentInProgress(true);

      // Get selected user details
      const selectedUserId = Array.from(selectedUsers)[0]; // Taking first selected user for now
      const selectedUser = usersList.find(user => user.id === selectedUserId);
      
      if (!selectedUser) {
        throw new Error('Selected user not found');
      }

      // Prepare block IDs from selected items
      const blockIds = selectedItems.map((block: Block) => block.blockId);

      // Prepare assignment payload
      const assignmentPayload: AssignmentRequest = {
        block_ids: blockIds,
        user_id: selectedUser.id,
        user_name: selectedUser.fullname
      };


      // Make assignment API call
      const response = await fetch(assignmentApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentPayload)
      });

      if (!response.ok) {
        throw new Error(`Assignment failed with status ${response.status}`);
      }

      const result: AssignmentResponse = await response.json();

      if (result.success) {
        // Success - show notification and close modal
        const successMessage = result.message || 
          `Successfully assigned ${blockIds.length} ${itemType} to ${selectedUser.fullname}`;
        
        showNotification('success', successMessage);
        
        // Close modal after a brief delay
        setTimeout(() => {
          onClose();
          onAssignmentComplete(true, successMessage);
        }, 1000);
        
      } else {
        throw new Error(result.message || 'Assignment failed');
      }

    } catch (error: any) {
      console.error('Assignment error:', error);
      const errorMessage = error.message || 'Failed to assign blocks';
      showNotification('error', errorMessage);
      onAssignmentComplete(false, errorMessage);
    } finally {
      setAssignmentInProgress(false);
    }
  };

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsersList();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUsers(new Set());
      setSearchQuery('');
      setNotification({ type: 'success', message: '', show: false });
      setUsersError(null);
    }
  }, [isOpen]);

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
        // For single selection, clear previous and add new
        newSet.clear();
        newSet.add(userId);
      }
      return newSet;
    });
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

  const filteredUsers = usersList.filter(user =>
    user.fullname.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const itemTypeName = itemType === 'blocks' ? 'block' : 'connection';
  const itemTypeNamePlural = itemType === 'blocks' ? 'blocks' : 'connections';

  if (!isOpen) return null;

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Assign {itemTypeNamePlural.charAt(0).toUpperCase() + itemTypeNamePlural.slice(1)}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={assignmentInProgress}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Selected {selectedItems.length} {selectedItems.length === 1 ? itemTypeName : itemTypeNamePlural}
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
              disabled={assignmentInProgress}
            />
          </div>

          {/* Users List */}
          <div className="px-6 py-4 max-h-60 overflow-y-auto">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-4">
                <Loader className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                <span className="text-gray-600 dark:text-gray-300">Loading users...</span>
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
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <input
                        type="radio"
                        name="selectedUser"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleUserSelection(user.id)}
                        disabled={assignmentInProgress}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={assignmentInProgress}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            
            {selectedUsers.size > 0 && (
              <button
                onClick={handleAssignment}
                disabled={assignmentInProgress || loadingUsers}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assignmentInProgress ? (
                  <div className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Assigning...
                  </div>
                ) : (
                  `Assign (${selectedUsers.size} user selected)`
                )}
              </button>
            )}
          </div>
        </div>
      </div>

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
    </>
  );
};

export default UserAssignmentModal;