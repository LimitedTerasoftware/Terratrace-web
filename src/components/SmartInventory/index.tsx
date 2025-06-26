import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { FilterPanel } from './FilterPanel';
import { PlacemarkList } from './PlacemarkList';
import { MapViewer } from './MapViewer';
import { KMZParser } from '../../utils/kmzParser';
import { dbOperations } from '../../utils/databasee';
import { useFiltering } from '../../hooks/useFiltering';
import { KMZFile, FilterState, ViewState, Placemark } from '../../types/kmz';
import FileUploadModal from './Modalpopup';
import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
import axios from 'axios';

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
  const [highlightedPlacemark, setHighlightedPlacemark] = useState<Placemark>();
  const [visiblePlacemarks, setVisiblePlacemarks] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [viewState, setViewState] = useState<ViewState>({
    center: { lat: 20.5937, lng: 78.9629 }, // Center of India
    zoom: 5,
    mapType: 'roadmap'
  });

  const filteredPlacemarks = [
    {id:'1',name:'Landmarks'},
    {id:'2',name:'Fiber Turns'},
    {id:'3',name:'Bridge'},
    {id:'4',name:'Culvert'},
    {id:'5',name:'Road Cross'},
    {id:'6',name:'Level Cross'},
    {id:'7',name:'Rail Under Bridge'},
    {id:'8',name:'Causeways'},
    {id:'9',name:'Rail Over Bridge'},
    {id:'10',name:'Kmt Stone'},
    {id:'11',name:'Fpoi'},
    {id:'12',name:'Joint Chamber'},
  ]
  // Combine placemarks from all selected files
   const allPlacemarks = selectedFiles.flatMap(file => file.placemarks);
  // Filter placemarks based on current filters and search
  
  // const filteredPlacemarks = useFiltering(
  //   allPlacemarks,
  //   filters,
  //   searchQuery
  // );
  // Get visible filtered placemarks
  const visibleFilteredPlacemarks = filteredPlacemarks.filter(placemark => 
    visiblePlacemarks.has(placemark.id)
  );
  // Memoize the view state change handler to prevent infinite loops
  const handleViewStateChange = useCallback((newViewState: ViewState) => {
    setViewState(prevState => {
      // Only update if there's a meaningful change
      const hasChanged = 
        Math.abs(prevState.center.lat - newViewState.center.lat) > 0.0001 ||
        Math.abs(prevState.center.lng - newViewState.center.lng) > 0.0001 ||
        prevState.zoom !== newViewState.zoom ||
        prevState.mapType !== newViewState.mapType;
      
      return hasChanged ? newViewState : prevState;
    });
  }, []);

  // Load saved files on app start
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const params:any ={};
        if (filters.state) params.state_code = filters.state;
        if(filters.division) params.dtcode = filters.division;
        if(filters.block) params.blk_code = filters.block;
        if(searchQuery) params.filename = searchQuery;

        const savedFiles = await axios.get(`${BASEURL}/get-external-files`,{params});
        if(savedFiles.status === 200 || savedFiles.status === 201){
          setFiles(savedFiles.data.data);
          if (savedFiles.data.length > 0) {
          setSelectedFiles([savedFiles.data.data[0]]);
          }
        }
      } catch (error) {
        console.error('Failed to load files:', error);
      }
    };
    loadFiles();
  }, [filters,searchQuery]);

  // Update visible placemarks when selected files change
  useEffect(() => {
    if (selectedFiles.length > 0) {
      const allPlacemarkIds = new Set(allPlacemarks.map(p => p.id));
     
      setVisiblePlacemarks(allPlacemarkIds);
    } else {
      setVisiblePlacemarks(new Set());
    }
  }, [selectedFiles]); 

  // Handle file upload
  const handleFileUpload = async (desktopFile:File,physicalFile:File,FileName:string,stateId:string,DistrictId:string,BlcokId:string) => {
      setIsUploading(true);
      setUploadError('');
       try {
        const formData = new FormData();
         formData.append('desktop_planning', desktopFile);  
         formData.append('physical_survey', physicalFile); 
         formData.append('state_code', stateId); 
         formData.append('dtcode', DistrictId);  
         formData.append('block_code', BlcokId); 
         formData.append('FileName', FileName);

      const kmzFile = await axios.post(`${BASEURL}/upload-external-data`,formData,{
         headers: {
        "Content-Type": "multipart/form-data",
      },
      });
      const data = kmzFile.data;
      if(kmzFile.status === 200 || kmzFile.status === 201){
        showNotification("success", `${desktopFile.name} and ${physicalFile.name} files are saved `);

      }
      
      setFilters({});
      setSearchQuery('');
      setHighlightedPlacemark(undefined);
      setModalOpen(false)
    } catch (error) {
      console.error('Failed to upload file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
      showNotification("error", "Failed to upload file");

    } finally {
      setIsUploading(false);
    }
    
  }

    useEffect(() => {
      // Cleanup function
      return () => {
        if (notifierTimeoutRef.current) {
          clearTimeout(notifierTimeoutRef.current);
        }
      };
    }, []);
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

  const handleFileParse = async (desktopFile:File,physicalFile:File,FileName:string,stateId:string,DistrictId:string,BlcokId:string) => {
    setIsUploading(true);
    setUploadError('');
    
    try {
      const kmzFile = await KMZParser.parseKMZ(desktopFile);
      await dbOperations.saveKMZ(kmzFile);
      
      const updatedFiles = await dbOperations.getAllKMZ();
      // setFiles(updatedFiles);
      setSelectedFiles([kmzFile]);
      
      // Reset filters when switching files
      setFilters({});
      setSearchQuery('');
      setHighlightedPlacemark(undefined);
      
    } catch (error) {
      console.error('Failed to upload file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection (multiple selection support)
  const handleFileSelect = useCallback((file: KMZFile, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      setSelectedFiles(prev => {
        const isAlreadySelected = prev.some(f => f.id === file.id);
        if (isAlreadySelected) {
          // Remove from selection
          return prev.filter(f => f.id !== file.id);
        } else {
          // Add to selection
          return [...prev, file];
        }
      });
    } else {
      // Single selection
      setSelectedFiles([file]);
    }
    
    // Reset filters and search when changing selection
    setFilters({});
    setSearchQuery('');
    setHighlightedPlacemark(undefined);
   
  }, []);

  // Handle file deletion
  const handleFileDelete = async (id: string) => {
    try {
      await dbOperations.deleteKMZ(id);
      const updatedFiles = await dbOperations.getAllKMZ();
      // setFiles(updatedFiles);
      
      // Remove from selected files if it was selected
      setSelectedFiles(prev => prev.filter(f => f.id !== id));
      
      // If no files selected, select the first available
      if (selectedFiles.length === 1 && selectedFiles[0].id === id && updatedFiles.length > 0) {
        setSelectedFiles([updatedFiles[0]]);
      }
      
      setFilters({});
      setSearchQuery('');
      setHighlightedPlacemark(undefined);
     
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  // Handle search with highlighting
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.trim() && allPlacemarks.length > 0) {
      // Find first matching placemark
      const matchingPlacemark = allPlacemarks.find(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchingPlacemark) {
        setHighlightedPlacemark(matchingPlacemark);
      }
    } else {
      setHighlightedPlacemark(undefined);
    }
  }, [allPlacemarks]);

  // Handle placemark click
  const handlePlacemarkClick = useCallback((placemark: Placemark) => {
    setHighlightedPlacemark(placemark);
  }, []);

  // Handle placemark visibility change
  const handlePlacemarkVisibilityChange = useCallback((placemarkId: string, visible: boolean) => {
    setVisiblePlacemarks(prev => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(placemarkId);
      } else {
        newSet.delete(placemarkId);
      }
      return newSet;
    });
  }, []);

  // Safe sidebar toggle function
  const handleSidebarToggle = useCallback(() => {
    try {
      setSidebarOpen(prev => !prev);
    } catch (error) {
      console.error('Error toggling sidebar:', error);
      // Fallback: force sidebar state
      setSidebarOpen(false);
    }
  }, []);


  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle}>
        {/* <FileUpload
          onFileUpload={handleFileUpload}
          isLoading={isUploading}
          error={uploadError}
        /> */}
        <div className="mb-6">
          <button
            onClick={()=>{setModalOpen(true);setUploadError('')}}
            disabled={isUploading}
            className={`
              w-full px-4 py-3 rounded-lg border-2 border-dashed 
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
                  Upload KMZ or KML File
                </>
              )}
          </button>
        </div>
      
        
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedFilesCount={selectedFiles.length}
        />

        <FileList
          files={files}
          selectedFileIds={selectedFiles.map(f => f.id)}
          onFileSelect={handleFileSelect}
          onFileDelete={handleFileDelete}
        />
        <PlacemarkList
          placemarks={filteredPlacemarks}
          visiblePlacemarks={visiblePlacemarks}
          onPlacemarkVisibilityChange={handlePlacemarkVisibilityChange}
          onPlacemarkClick={handlePlacemarkClick}
          highlightedPlacemark={highlightedPlacemark}
        />
      </Sidebar>

      <main className="flex-1 relative">
       
          <FileUploadModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            onUpload={handleFileUpload}
            isLoading={isUploading}
            error={uploadError}
          />
        
      
        <MapViewer
          placemarks={visibleFilteredPlacemarks}
          highlightedPlacemark={highlightedPlacemark}
          onPlacemarkClick={handlePlacemarkClick}
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
        />
      </main>
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