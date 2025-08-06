import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { FileList } from './FileList';
import { FilterPanel } from './FilterPanel';
import { AlertCircle, CheckCircle, Upload, X, Menu, MapPin, File, FilePlusIcon, FilePlus2Icon, RefreshCcwIcon, RefreshCcwDotIcon, RefreshCwOffIcon, RefreshCwIcon } from 'lucide-react';
import axios from 'axios';
import { GoogleMap } from './MapViewer';
import { PlacemarkList } from './PlacemarkList';
import { PLACEMARK_CATEGORIES, processApiData } from './PlaceMark';
import { KMZFile, FilterState, ViewState, ApiPlacemark, ProcessedPlacemark, PlacemarkCategory, PhysicalSurveyData, EventTypeConfig, EventTypeCounts, PhysicalSurveyApiResponse } from '../../types/kmz';
import FileUploadModal from './Modalpopup';
import { GeographicSelector } from './GeographicSelector';

interface NotifierState {
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}
const BASEURL = import.meta.env.VITE_TraceAPI_URL;

function SmartInventory() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [Notifier, setNotifier] = useState<NotifierState>({ type: 'success', message: '', visible: false });
  const notifierTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [files, setFiles] = useState<KMZFile[][]>([]);
  const [selectedFiles, setSelectedFiles] = useState<KMZFile[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [PhysicalSurvey, setPhysicalSurvey] = useState<PhysicalSurveyData[]>([]);
  const [loading, setLoding] = useState<boolean>(false)
  const [ShowFiles, setShowFiles] = useState(false);
  // Placemark-related state
  const [processedPlacemarks, setProcessedPlacemarks] = useState<ProcessedPlacemark[]>([]);
  const [placemarkCategories, setPlacemarkCategories] = useState<PlacemarkCategory[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set());
  const [highlightedPlacemark, setHighlightedPlacemark] = useState<ProcessedPlacemark>();

  useEffect(() => {
    const PhysicalData = async () => {
      try {
        if (!filters.state || !filters.division || !filters.block) return;
        setLoding(true)
        const params: any = {};
        if (filters.state) params.state_id = filters.state;
        if (filters.division) params.district_id = filters.division;
        if (filters.block) params.block_id = filters.block;

        const Response = await axios.get(`${BASEURL}/get-physical-survey`, { params });
        const result: PhysicalSurveyApiResponse = Response.data;

        if (Response.status === 200 || Response.status === 201) {
          if (result.data.length > 0) {
            setPhysicalSurvey(result.data);

          }
        }
      } catch (error) {
        console.error('Failed to load files:', error);
        showNotification('error', 'Failed to load files');
      } finally {
        setLoding(false)
      }
    };
    PhysicalData();
  }, [filters, searchQuery]);



  // Load saved files on app start
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const params: any = {};
        if (filters.state) params.state_code = filters.state;
        if (filters.division) params.dtcode = filters.division;
        if (filters.block) params.blk_code = filters.block;
        if (searchQuery) params.filename = searchQuery;

        const savedFiles = await axios.get(`${BASEURL}/get-external-files`, { params });
        if (savedFiles.status === 200 || savedFiles.status === 201) {
          setFiles(savedFiles.data.data);
          if (savedFiles.data.data.length > 0) {
            setSelectedFiles([savedFiles.data.data[0][0]]);
          }
        }
      } catch (error) {
        console.error('Failed to load files:', error);
        showNotification('error', 'Failed to load files');
      }
    };
    loadFiles();
  }, [filters, searchQuery]);

  // // Load placemark data when files are selected
  useEffect(() => {
    const handleParsed = async () => {
      if (selectedFiles.length > 0) {
        try {
          const params: any = {};
          if (selectedFiles[0].filepath) params.filepath = selectedFiles[0].filepath;
          if (selectedFiles[0].file_type) params.fileType = selectedFiles[0].file_type;

          const resp = await axios.get(`${BASEURL}/preview-file`, { params });
          if (resp.status === 200 || resp.status === 201) {
            const apiData: ApiPlacemark = resp.data.data.parsed_data;
            const { placemarks, categories } = processApiData(apiData);

            setProcessedPlacemarks(placemarks);
            setPlacemarkCategories(categories);

            // Initially show all categories
            const allCategoryIds = new Set(categories.map(cat => cat.id));
            setVisibleCategories(allCategoryIds);

          } else {
            showNotification("error", resp.data.message);
          }
        } catch (error) {
          console.error('Failed to show preview:', error);
          showNotification("error", 'Failed to show preview');
        }
      } else {
        setProcessedPlacemarks([]);
        setPlacemarkCategories([]);
        setVisibleCategories(new Set());
      }
    };
    handleParsed();
  }, [selectedFiles]);

  // Handle file upload
  const handleFileUpload = async (
    desktopFile: File,
    // physicalFile: File,
    fileName: string,
    stateId: string,
    districtId: string,
    blockId: string
  ) => {
    setIsUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('desktop_planning', desktopFile);
      // formData.append('physical_survey', physicalFile);
      formData.append('state_code', stateId);
      formData.append('dtcode', districtId);
      formData.append('block_code', blockId);
      formData.append('FileName', fileName);

      const kmzFile = await axios.post(`${BASEURL}/upload-external-data`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (kmzFile.status === 200 || kmzFile.status === 201) {
        showNotification("success", `${desktopFile.name} files are saved`);
      }

      setFilters({});
      setSearchQuery('');
      setHighlightedPlacemark(undefined);
      setModalOpen(false);
    } catch (error) {
      console.error('Failed to upload file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      showNotification("error", "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  // Notification system
  const showNotification = (type: 'success' | 'error', message: string) => {
    // Clear any existing timeout to prevent multiple notifications
    if (notifierTimeoutRef.current) {
      clearTimeout(notifierTimeoutRef.current);
      notifierTimeoutRef.current = null;
    }

    setNotifier({ type, message, visible: true });

    // Auto-hide notification after 5 seconds for success, 10 seconds for error
    const hideDelay = type === 'success' ? 5000 : 10000;

    notifierTimeoutRef.current = setTimeout(() => {
      setNotifier(prev => ({ ...prev, visible: false }));
      notifierTimeoutRef.current = null;
    }, hideDelay);
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: KMZFile, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      setSelectedFiles(prev => {
        const isAlreadySelected = prev.some(f => f.id === file.id);
        if (isAlreadySelected) {
          return prev.filter(f => f.id !== file.id);
        } else {
          return [...prev, file];
        }
      });
    } else {
      setSelectedFiles([file]);
    }
    setHighlightedPlacemark(undefined);
  }, []);

  // Handle category visibility toggle
  const handleCategoryVisibilityChange = (categoryId: string, visible: boolean) => {
    setVisibleCategories(prev => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(categoryId);
      } else {
        newSet.delete(categoryId);
      }
      return newSet;
    });
  };

  // Handle placemark click
  const handlePlacemarkClick = (placemark: ProcessedPlacemark) => {
    setHighlightedPlacemark(placemark);
  };

  const handleSidebarToggle = useCallback(() => {
    try {
      setSidebarOpen(prev => !prev);
    } catch (error) {
      console.error('Error toggling sidebar:', error);
      // Fallback: force sidebar state
      setSidebarOpen(false);
    }
  }, []);

  const handleFileDelete = async (id: string) => {
    // try {
    //   await dbOperations.deleteKMZ(id);
    //   const updatedFiles = await dbOperations.getAllKMZ();
    //   // setFiles(updatedFiles);

    //   // Remove from selected files if it was selected
    //   setSelectedFiles(prev => prev.filter(f => f.id !== id));

    //   // If no files selected, select the first available
    //   if (selectedFiles.length === 1 && selectedFiles[0].id === id && updatedFiles.length > 0) {
    //     setSelectedFiles([updatedFiles[0]]);
    //   }

    //   setFilters({});
    //   setSearchQuery('');
    //   setHighlightedPlacemark(undefined);

    // } catch (error) {
    //   console.error('Failed to delete file:', error);
    // }
  };
  // Cleanup
  useEffect(() => {
    return () => {
      if (notifierTimeoutRef.current) {
        clearTimeout(notifierTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectionChange = (selectedStates: string[], selectedDistricts: string[]) => {
    console.log('Selected States:', selectedStates);
    console.log('Selected Districts:', selectedDistricts);
  };

  const handlePreview = (item: { type: 'state' | 'district'; id: string; name: string }) => {
    console.log('Preview:', item);
    // Implement preview functionality
  };

  const handleRefresh = (item: { type: 'state' | 'district'; id: string; name: string }) => {
    console.log('Refresh:', item);
    // Implement refresh functionality
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {loading && (
        <div className="absolute top-70 right-150 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800 mx-auto mb-4"></div>
        </div>
      )}
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle}>
        {/* <FileUpload
          onFileUpload={handleFileUpload}
          isLoading={isUploading}
          error={uploadError}
        /> */}
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => { setModalOpen(true); setUploadError('') }}
            disabled={isUploading}
            className={`
              w-full px-1 py-3 rounded-lg border-2 border-dashed 
              ${isUploading
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
              }
              transition-all duration-200 flex items-center justify-center gap-2
              text-sm font-medium text-gray-700
            `}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Kmz / Kml
              </>
            )}
          </button>
          <button
            onClick={() => { setShowFiles(!ShowFiles) }}
            className={`
              border-2 border-dashed 
              w-20 h-12 rounded-full flex items-center justify-center transition-colors 
              ${ShowFiles
                ? 'border-gray-300 bg-blue-100'
                : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
              }
              transition-all duration-200 flex items-center justify-center gap-2
              text-sm font-medium text-gray-700
            `}
            title='External Data'
          >
            <FilePlus2Icon size={18} />

          </button>
          <button
            onClick={() => { setShowFiles(!ShowFiles) }}
            className={`
              border-2 border-dashed 
              w-20 h-12 rounded-full flex items-center justify-center transition-colors 
              ${ShowFiles
                ? 'border-gray-300 bg-blue-100'
                : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
              }
              transition-all duration-200 flex items-center justify-center gap-2
              text-sm font-medium text-gray-700
            `}
            title='Reload'
          >
            <RefreshCwIcon size={18} />

          </button>
        </div>
        <GeographicSelector
          onSelectionChange={handleSelectionChange}
          onPreview={handlePreview}
          onRefresh={handleRefresh} />

        {/* <PlacemarkList
            placemarks={processedPlacemarks}
            categories={placemarkCategories}
            visibleCategories={visibleCategories}
            onCategoryVisibilityChange={handleCategoryVisibilityChange}
            onPlacemarkClick={handlePlacemarkClick}
            highlightedPlacemark={highlightedPlacemark}
          /> */}

      </Sidebar>
      
      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Header */}
        <FileUploadModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onUpload={handleFileUpload}
          isLoading={isUploading}
          error={uploadError}
        />
        {/* <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-white shadow-md hover:shadow-lg rounded-lg border border-gray-200 transition-all"
              title="Open sidebar"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div> */}

        {/* Map */}
        <GoogleMap
          placemarks={processedPlacemarks}
          categories={placemarkCategories}
          visibleCategories={visibleCategories}
          highlightedPlacemark={highlightedPlacemark}
          onPlacemarkClick={handlePlacemarkClick}
          className="w-full h-full"
        />


        {/* Stats Overlay */}
        {processedPlacemarks.length > 0 && (
          <div className="absolute bottom-4 left-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="text-sm text-gray-600">
              <div className="font-semibold text-gray-900 mb-1">Map Statistics</div>
              <div>Total Placemarks: {processedPlacemarks.length}</div>
              <div>Visible Categories: {visibleCategories.size}</div>
              <div>Points: {processedPlacemarks.filter(p => p.type === 'point').length}</div>
              <div>Polylines: {processedPlacemarks.filter(p => p.type === 'polyline').length}</div>
            </div>
          </div>
        )}
        {ShowFiles && (
          <div className="absolute top-0 right-0 h-full bg-white rounded-lg shadow-lg border border-gray-200 p-3 overflow-hidden">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedFilesCount={selectedFiles.length}
            /><br />
            <FileList
              files={files}
              selectedFileIds={selectedFiles.map(f => f.id)}
              onFileSelect={handleFileSelect}
              onFileDelete={handleFileDelete}
            />
          </div>
        )}
      </main>

      {/* Notification */}
      {Notifier.visible && (
        <div
          className={`fixed top-4 right-4 z-[10000] p-4 rounded-lg shadow-lg flex items-start max-w-md transform transition-all duration-500 ease-in-out ${Notifier.type === 'success'
            ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
            : 'bg-red-100 border-l-4 border-red-500 text-red-700'
            } animate-fadeIn`}
          style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
          <div className="mr-3 mt-0.5">
            {Notifier.type === 'success'
              ? <CheckCircle size={20} className="text-green-500" />
              : <AlertCircle size={20} className="text-red-500" />
            }
          </div>
          <div>
            <p className="font-bold text-sm">
              {Notifier.type === 'success' ? 'Success!' : 'Oops!'}
            </p>
            <p className="text-sm">
              {Notifier.message}
            </p>
          </div>
          <button
            onClick={() => setNotifier(prev => ({ ...prev, visible: false }))}
            className="ml-auto p-1 hover:bg-opacity-20 hover:bg-gray-500 rounded"
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default SmartInventory;