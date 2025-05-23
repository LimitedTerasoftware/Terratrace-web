// BulkUploadModal component for handling GP point file uploads with color-coded status indicators
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, CloudUpload, CircleX, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '../AppContext';

// Type definitions
interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  showDetailedErrors?: boolean; // Optional prop to control detailed error visibility
}

interface NotificationState {
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  showDetailedErrors = false
}) => {
  // Context
  // const { setGPSApiResponse, setConctApiResponse } = useAppContext();
  
  // State management
  const [gpFiles, setGpFiles] = useState<File[]>([]);
  const [incrementalFiles, setIncrementalFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<{[key: number]: boolean}>({});
  const [uploadStatus, setUploadStatus] = useState<{[key: number]: 'idle' | 'ready' | 'uploading' | 'success' | 'error'}>({});
  const [notification, setNotification] = useState<NotificationState>({ type: 'success', message: '', visible: false });
  const [isSubmitting, setIsSubmitting] = useState(false); // Track if any submission is in progress
  
  // Ref to store the current notification timeout
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up timeouts when component unmounts
  useEffect(() => {
    // Cleanup function
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // Add an effect to prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Disable scrolling on the body when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup function to ensure scrolling is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  // Derived values
  const maxFiles = Math.max(gpFiles.length, incrementalFiles.length);
  
  // Helper functions
  const showNotification = (type: 'success' | 'error', message: string) => {
    // Clear any existing timeout to prevent multiple notifications
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    
    setNotification({ type, message, visible: true });
    
    // Auto-hide notification after 5 seconds for success, 10 seconds for error
    const hideDelay = type === 'success' ? 5000 : 10000;
    
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
      notificationTimeoutRef.current = null;
    }, hideDelay);
  };
  
  const handleClose = () => {
    // Clear any active timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    
    setGpFiles([]);
    setIncrementalFiles([]);
    setUploading({});
    setUploadStatus({});
    setNotification({ type: 'success', message: '', visible: false });
    setIsSubmitting(false); // Reset submission state when closing
    onClose();
  };
  
  const handleFileDrop = (files: FileList, fileType: 'gp' | 'incremental') => {
    const newFiles = Array.from(files).filter(file => file.name.toLowerCase().endsWith('.kml'));
    
    if (newFiles.length > 0) {
      if (fileType === 'gp') {
        const prevLength = gpFiles.length;
        setGpFiles(prev => [...prev, ...newFiles]);
        
        // Set status to 'idle' (grey) for newly dropped files
        newFiles.forEach((_, index) => {
          const fileIndex = prevLength + index;
          setUploadStatus(prevStatus => ({
            ...prevStatus,
            [fileIndex]: 'idle'
          }));
        });
      } else {
        const prevLength = incrementalFiles.length;
        setIncrementalFiles(prev => [...prev, ...newFiles]);
        
        // Set status to 'idle' (grey) for newly dropped files
        newFiles.forEach((_, index) => {
          const fileIndex = prevLength + index;
          setUploadStatus(prevStatus => ({
            ...prevStatus,
            [fileIndex]: 'idle'
          }));
        });
      }
    }
  };
  
  // Event handlers
  const handleGpFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setGpFiles(prev => {
        const updatedFiles = [...prev, ...newFiles];
        
        // Set status to 'idle' (grey) for new files
        newFiles.forEach((_, index) => {
          const fileIndex = prev.length + index;
          setUploadStatus(prevStatus => ({
            ...prevStatus,
            [fileIndex]: 'idle'
          }));
        });
        
        return updatedFiles;
      });
    }
  };
  
  const handleIncrementalFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setIncrementalFiles(prev => {
        const updatedFiles = [...prev, ...newFiles];
        
        // Set status to 'idle' (grey) for new files
        newFiles.forEach((_, index) => {
          const fileIndex = prev.length + index;
          setUploadStatus(prevStatus => ({
            ...prevStatus,
            [fileIndex]: 'idle'
          }));
        });
        
        return updatedFiles;
      });
    }
  };
  
  const removeGpFile = (index: number) => {
    setGpFiles(prev => prev.filter((_, i) => i !== index));
    // Reset upload status for this index
    setUploadStatus(prev => {
      const newStatus = {...prev};
      delete newStatus[index];
      return newStatus;
    });
  };
  
  const removeIncrementalFile = (index: number) => {
    setIncrementalFiles(prev => prev.filter((_, i) => i !== index));
    // Reset upload status for this index
    setUploadStatus(prev => {
      const newStatus = {...prev};
      delete newStatus[index];
      return newStatus;
    });
  };
  
  const handleSubmitPair = async (index: number) => {
    // Check if at least a GP file exists at this index
    if (!gpFiles[index]) {
      showNotification('error', "Please upload a GP Point file to continue");
      return;
    }
    
    // Check if another submission is already in progress
    if (isSubmitting) {
      showNotification('error', "Please wait for the current submission to complete");
      return;
    }
    
    try {
      // Set global submitting state
      setIsSubmitting(true);
      
      // Set uploading state for this index
      setUploading(prev => ({...prev, [index]: true}));
      setUploadStatus(prev => ({...prev, [index]: 'uploading'}));
      
      // Different API endpoints based on whether both files are present
      let apiEndpoint = '';
      let formData = new FormData();
      
      if (incrementalFiles[index]) {
        // If both files are present, use the upload endpoint
        apiEndpoint = 'https://traceapi.keeshondcoin.com/upload';
        formData.append('pointsFile', gpFiles[index]);
        formData.append('connectionsFile', incrementalFiles[index]);
      } else {
        // If only GP file is present, use the generate-route endpoint
        apiEndpoint = 'https://traceapi.keeshondcoin.com/generate-route';
        formData.append('pointsFile', gpFiles[index]);
      }
      
      // Upload file(s)
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        // Trying to get more detailed error information if available
        let errorDetails = '';
        try {
          const errorResponse = await response.text();
          if (errorResponse) {
            errorDetails = `: ${errorResponse}`;
          }
        } catch (e) {
          // If we can't parse the error response,we just use the status
          errorDetails = '';
        }
        
        // Handle different HTTP status codes
        const statusCode = response.status;
        let errorMessage = '';
        
        switch(true) {
          // Client errors (400-499)
          case statusCode === 400:
            errorMessage = "Your files couldn't be processed. Please check that they're valid KML files and try again.";
            break;
          case statusCode === 401:
            errorMessage = "Your login session has expired. Please refresh the page to continue.";
            break;
          case statusCode === 403:
            errorMessage = "You don't have permission to upload these files. Please contact your team administrator for access.";
            break;
          case statusCode === 404:
            errorMessage = "The upload service is currently unavailable. Please try again later.";
            break;
          case statusCode === 413:
            errorMessage = "Your files are too large to upload. Please try smaller files or split your data into multiple files.";
            break;
          case statusCode === 415:
            errorMessage = "Your files aren't in the correct format. Please make sure you're uploading valid KML files.";
            break;
          case statusCode === 429:
            errorMessage = "You've made too many upload attempts. Please wait a moment before trying again.";
            break;
            
          // Server errors (500-599)
          case statusCode >= 500 && statusCode < 600:
            errorMessage = "Try again, check file format or We're experiencing technical difficulties with our servers..";
            break;
            
          // Network errors
          case statusCode === 0:
            errorMessage = "Check your internet connection and try again. Your upload couldn't reach our servers.";
            break;
            
          // Default error message
          default:
            errorMessage = "Something went wrong with your upload, Please try again or contact your administrator if the problem continues.";
        }
        
        // Add the detailed error message if available, but only if allowed
        if (errorDetails && showDetailedErrors) {
          errorMessage += ` (Technical details: ${errorDetails})`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Update context with response data
      if (incrementalFiles[index]) {
        // Original behavior when both files are present
        // setGPSApiResponse(data.gpData || data);
        // setConctApiResponse(data.incrementalData || data);
      } else {
        // For GP file only uploads using generate-route endpoint
        // setGPSApiResponse(data);
      }
      
      // Set success status
      setUploadStatus(prev => ({...prev, [index]: 'success'}));
      
      // Show appropriate success message
      if (incrementalFiles[index]) {
        showNotification('success', `Files submitted successfully: ${gpFiles[index].name} and ${incrementalFiles[index].name}`);
      } else {
        showNotification('success', `GP Point file submitted successfully: ${gpFiles[index].name}`);
      }
    } catch (error) {
      setUploadStatus(prev => ({...prev, [index]: 'error'}));
      
      // Get the error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      showNotification('error', errorMessage);
    } finally {
      setUploading(prev => ({...prev, [index]: false}));
      setIsSubmitting(false); // Reset global submitting state
    }
  };
  
  // UI helper functions
  const getProgressBarColor = (index: number, fileType: 'gp' | 'incremental') => {
    const status = uploadStatus[index];
    const hasFile = fileType === 'gp' ? gpFiles[index] : incrementalFiles[index];
    
    if (!hasFile) return 'bg-gray-200'; // No file
    
    switch (status) {
      case 'idle': return 'bg-gray-400'; // Grey for newly added files (changed from blue to grey)
      case 'ready': return 'bg-gray-400'; // Grey for ready files
      case 'success': return 'bg-green-500'; // Green for success
      case 'error': return 'bg-red-500'; // Red for error
      case 'uploading': return 'bg-blue-500'; // Blue during upload
      default: return 'bg-gray-400'; // Default to grey (changed from blue to grey)
    }
  };
  
  // Early return if modal is not open
  if (!isOpen) return null;
  
  // Render component - with increased z-index
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-black">Bulk Upload</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        
        {/* Notification popup - also increased z-index */}
        {notification.visible && (
          <div 
            className={`fixed top-4 right-4 z-[10000] p-4 rounded-lg shadow-lg flex items-start max-w-md transform transition-all duration-500 ease-in-out ${
              notification.type === 'success' 
                ? 'bg-green-100 border-l-4 border-green-500 text-green-700' 
                : 'bg-red-100 border-l-4 border-red-500 text-red-700'
            } animate-fadeIn`}
            style={{animation: 'fadeIn 0.3s ease-out'}}
          >
            <div className="mr-3 mt-0.5">
              {notification.type === 'success' 
                ? <CheckCircle size={20} className="text-green-500" /> 
                : <AlertCircle size={20} className="text-red-500" />
              }
            </div>
            <div>
              <p className="font-bold text-sm">
                {notification.type === 'success' ? 'Success!' : 'Oops!'}
              </p>
              <p className="text-sm">
                {notification.message}
              </p>
            </div>
            <button 
              onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
              className="ml-auto p-1 hover:bg-opacity-20 hover:bg-gray-500 rounded"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {/* Main content */}
        <div className="p-4 mx-4 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-12 gap-6">
            {/* Headers Row */}
            <div className="col-span-5 text-center">
              <h3 className="text-xl font-medium text-black mb-0">Gp Point File</h3>
            </div>
            <div className="col-span-5 text-center">
              <h3 className="text-xl font-medium text-black mb-0">Incremental File</h3>
            </div>
            <div className="col-span-2 text-center">
              <h3 className="text-xl font-medium text-black mb-0">Instructions</h3>
            </div>
            
            {/* Upload Areas Row */}
            <div className="col-span-5"> 
              <div 
                className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center h-28"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileDrop(e.dataTransfer.files, 'gp');
                  }
                }}
              >
                <div className="mb-2 text-indigo-500">
                  <CloudUpload size={36} />
                </div>
                <p className="text-base font-normal text-black">Drag & drop files or <span className="text-indigo-600 font-medium cursor-pointer" onClick={() => document.getElementById('bulkGpFiles')?.click()}>Browse</span></p>
                <p className="text-sm text-gray-500 mt-1 font-light">Supported formats: KML</p>
                <input
                  type="file"
                  id="bulkGpFiles"
                  multiple
                  className="hidden"
                  onChange={handleGpFilesChange}
                  accept=".kml"
                />
              </div>
            </div>
            
            <div className="col-span-5">
              <div 
                className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center h-28"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileDrop(e.dataTransfer.files, 'incremental');
                  }
                }}
              >
                <div className="mb-2 text-indigo-500">
                  <CloudUpload size={36} />
                </div>
                <p className="text-base font-normal text-black">Drag & drop files or <span className="text-indigo-600 font-medium cursor-pointer" onClick={() => document.getElementById('bulkIncrementalFiles')?.click()}>Browse</span></p>
                <p className="text-sm text-gray-500 mt-1 font-light">Supported formats: KML</p>
                <input
                  type="file"
                  id="bulkIncrementalFiles"
                  multiple
                  className="hidden"
                  onChange={handleIncrementalFilesChange}
                  accept=".kml"
                />
              </div>
            </div>
            
            <div className="col-span-2">
              {/* Instruction box */}
              <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center h-32">
                <p className="text-xs text-gray-700 font-medium text-start pb-0.5">
                  Step 1: Upload GP Point File
                </p>
                <p className="text-xs text-gray-700 font-medium text-start pb-0.5">
                  Step 2: Upload Incremental File (Optional)
                </p>
                <p className="text-xs text-gray-700 font-medium text-start">
                  Step 3: Click On Submit
                </p>
              </div>
            </div>
            
            {/* Upload counters */}
            <div className="col-span-5 text-sm text-gray-600 mt-1">
              {gpFiles.length > 0 && (
                <div>Uploading - {gpFiles.length}/{gpFiles.length} files</div>
              )}
            </div>
            
            <div className="col-span-5 text-sm text-gray-600 mt-1">
              {incrementalFiles.length > 0 && (
                <div>Uploading - {incrementalFiles.length}/{incrementalFiles.length} files</div>
              )}
            </div>
            
            <div className="col-span-2">
              {/* Empty space for third column alignment */}
            </div>
          </div>
          
          {/* File pairs with progress indicators */}
          <div className="space-y-4 mt-4">
            {Array.from({ length: maxFiles }).map((_, index) => (
              <div key={index} className="grid grid-cols-12 gap-6 items-center border-b border-gray-100 py-3">
                {/* GP File */}
                <div className="col-span-5">
                  <div className="flex items-start">
                    {/* Number outside the border */}
                    <div className="mr-2 font-medium pt-2">{index + 1}</div>
                    <div className="flex-grow flex flex-col">
                      {/* Border applied to filename and X icon */}
                      <div className="border border-gray-200 border-b-0 rounded-t p-2 w-full">
                        <div className="flex items-center justify-between">
                          <div className="truncate max-w-xs">
                            {gpFiles[index]?.name || "Upload GP point file here"}
                          </div>
                          {gpFiles[index] && (
                            <button 
                              onClick={() => removeGpFile(index)}
                              className="p-1 rounded-full text-gray-400 hover:text-gray-600 ml-1"
                            >
                              <CircleX size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Progress indicator with dynamic color based on status */}
                      <div className="w-full h-1 bg-gray-200 border border-t-0 border-gray-200 rounded-b">
                        <div 
                          className={`h-1 rounded-b ${getProgressBarColor(index, 'gp')}`} 
                          style={{ width: gpFiles[index] ? '100%' : '0%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Incremental File */}
                <div className="col-span-5">
                  <div className="flex items-start">
                    {/* Number outside the border */}
                    <div className="mr-2 font-medium pt-2">{index + 1}</div>
                    <div className="flex-grow flex flex-col">
                      {/* Border applied to filename and X icon */}
                      <div className="border border-gray-200 border-b-0 rounded-t p-2 w-full">
                        <div className="flex items-center justify-between">
                          <div className="truncate max-w-xs">
                            {incrementalFiles[index]?.name || "Upload Incremental file here (Optional)"}
                          </div>
                          {incrementalFiles[index] && (
                            <button 
                              onClick={() => removeIncrementalFile(index)}
                              className="p-1 rounded-full text-gray-400 hover:text-gray-600 ml-1"
                            >
                              <CircleX size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                      {/* Progress indicator with dynamic color based on status */}
                      <div className="w-full h-1 bg-gray-200 border border-t-0 border-gray-200 rounded-b">
                        <div 
                          className={`h-1 rounded-b ${getProgressBarColor(index, 'incremental')}`}
                          style={{ width: incrementalFiles[index] ? '100%' : '0%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Submit Button with tooltip */}
                <div className="col-span-2 flex justify-center">
                  <div className="relative group">
                    <button 
                      onClick={() => handleSubmitPair(index)}
                      disabled={!gpFiles[index] || uploading[index] || uploadStatus[index] === 'success' || isSubmitting}
                      className={`px-4 py-2 rounded flex items-center gap-1 ${
                        uploadStatus[index] === 'success'
                          ? 'bg-green-600 text-white cursor-default'
                          : uploading[index]
                            ? 'bg-blue-600 text-white' // Keep it blue while loading
                            : gpFiles[index] && !uploading[index]
                              ? isSubmitting && !uploading[index] 
                                ? 'bg-gray-400 text-white cursor-not-allowed' // Another row is submitting
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                              : uploadStatus[index] === 'error'
                                ? 'bg-red-500 text-white cursor-not-allowed'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {uploadStatus[index] === 'success' 
                        ? 'Submitted' 
                        : uploading[index]
                          ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Submitting...
                            </span>
                          )
                          : 'Submit'
                      }
                      {!uploading[index] && uploadStatus[index] !== 'success' && <Upload size={14} className="ml-1" />}
                      {uploadStatus[index] === 'success' && <CheckCircle size={14} className="ml-1" />}
                    </button>
                    
                    {/* Case 1: Error tooltip */}
                    {uploadStatus[index] === 'error' && (
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-red-100 text-red-800 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-[10001]">
                        Server error occurred. Try again or check file format.
                      </div>
                    )}
                    
                    {/* Case 2: Missing GP file tooltip */}
                    {uploadStatus[index] !== 'error' && !gpFiles[index] && (
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-[10001]">
                        Upload GP Point File to submit
                      </div>
                    )}
                    
                    {/* Case 3: Submitting in progress tooltip */}
                    {isSubmitting && !uploading[index] && gpFiles[index] && (
                      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-[10001]">
                        Please wait for the current submission to complete
                      </div>
                    )}
                  </div>
                  
                  {uploadStatus[index] === 'error' && (
                    <div className="text-red-500 ml-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;