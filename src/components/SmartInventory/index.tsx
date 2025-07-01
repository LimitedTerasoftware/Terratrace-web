// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { Sidebar } from './Sidebar';
// import { FileUpload } from './FileUpload';
// import { FileList } from './FileList';
// import { FilterPanel } from './FilterPanel';
// import { PlacemarkList } from './PlacemarkList';
// import { MapViewer } from './MapViewer';
// import { KMZParser } from '../../utils/kmzParser';
// import { dbOperations } from '../../utils/databasee';
// import { useFiltering } from '../../hooks/useFiltering';
// import { KMZFile, FilterState, ViewState, Placemark } from '../../types/kmz';
// import FileUploadModal from './Modalpopup';
// import { AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
// import axios from 'axios';

// interface NotifierState {
//   type: 'success' | 'error';
//   message: string;
//   visible: boolean;
// }
// const BASEURL = import.meta.env.VITE_TraceAPI_URL;

// function SmartInventory() {
//   const [isModalOpen, setModalOpen] = useState(false);
//   const [Notifier, setNotifier] = useState<NotifierState>({ type: 'success', message: '', visible: false });
//   const notifierTimeoutRef = useRef<NodeJS.Timeout | null>(null);
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [files, setFiles] = useState<KMZFile[][]>([]);
//   const [selectedFiles, setSelectedFiles] = useState<KMZFile[]>([]);
//   const [filters, setFilters] = useState<FilterState>({});
//   const [searchQuery, setSearchQuery] = useState('');
//   const [highlightedPlacemark, setHighlightedPlacemark] = useState<Placemark>();
//   const [visiblePlacemarks, setVisiblePlacemarks] = useState<Set<string>>(new Set());
//   const [isUploading, setIsUploading] = useState(false);
//   const [uploadError, setUploadError] = useState('');
//   const [viewState, setViewState] = useState<ViewState>({
//     center: { lat: 20.5937, lng: 78.9629 }, // Center of India
//     zoom: 5,
//     mapType: 'roadmap'
//   });

//   const filteredPlacemarks = [
//     {id:'1',name:'LANDMARK'},
//     {id:'2',name:'FIBERTURN'},
//     {id:'3',name:'Bridge'},
//     {id:'4',name:'Culvert'},
//     {id:'5',name:'ROADCROSSING'},
//     {id:'6',name:'Level Cross'},
//     {id:'7',name:'Rail Under Bridge'},
//     {id:'8',name:'Causeways'},
//     {id:'9',name:'Rail Over Bridge'},
//     {id:'10',name:'KILOMETERSTONE'},
//     {id:'11',name:'FPOI'},
//     {id:'12',name:'JOINTCHAMBER'},
//     {id:'13',name:'ROUTEINDICATOR'}
//   ]
//   const handleViewStateChange = useCallback((newViewState: ViewState) => {
//     setViewState(prevState => {
//       // Only update if there's a meaningful change
//       const hasChanged = 
//         Math.abs(prevState.center.lat - newViewState.center.lat) > 0.0001 ||
//         Math.abs(prevState.center.lng - newViewState.center.lng) > 0.0001 ||
//         prevState.zoom !== newViewState.zoom ||
//         prevState.mapType !== newViewState.mapType;
      
//       return hasChanged ? newViewState : prevState;
//     });
//   }, []);

//   // Load saved files on app start
//   useEffect(() => {
//     const loadFiles = async () => {
//       try {
//         const params:any ={};
//         if (filters.state) params.state_code = filters.state;
//         if(filters.division) params.dtcode = filters.division;
//         if(filters.block) params.blk_code = filters.block;
//         if(searchQuery) params.filename = searchQuery;

//         const savedFiles = await axios.get(`${BASEURL}/get-external-files`,{params});
//         if(savedFiles.status === 200 || savedFiles.status === 201){
//           setFiles(savedFiles.data.data);
//           if (savedFiles.data.data.length > 0) {
//           setSelectedFiles([savedFiles.data.data[0][0]]);
//           }
//         }
//       } catch (error) {
//         console.error('Failed to load files:', error);
//       }
//     };
//     loadFiles();
//   }, [filters,searchQuery]);

 
//     useEffect(() => {
//     const HandleParsed = async() =>{
      
//       if (selectedFiles.length > 0) {
//         try {
//          const params:any ={};
//         if (selectedFiles[0].filepath) params.filepath = selectedFiles[0].filepath;
//         if (selectedFiles[0].file_type) params.fileType = selectedFiles[0].file_type;

//            const resp = await axios.get(`${BASEURL}/preview-file`,{params});
//            if(resp.status === 200 || resp.status === 201){
//             const Data = resp.data;
//             setVisiblePlacemarks(Data.data.parsed_data);
//            }else{
//             showNotification("error", resp.data.message);

//            }
          
//         } catch (error) {
//            showNotification("error", 'Failed to show preview');
//         }
//       } else {
//         setVisiblePlacemarks(new Set());
//       }
//     }
//       HandleParsed();
//   }, [selectedFiles]); 

//   // Handle file upload
//   const handleFileUpload = async (desktopFile:File,physicalFile:File,FileName:string,stateId:string,DistrictId:string,BlcokId:string) => {
//       setIsUploading(true);
//       setUploadError('');
//        try {
//         const formData = new FormData();
//          formData.append('desktop_planning', desktopFile);  
//          formData.append('physical_survey', physicalFile); 
//          formData.append('state_code', stateId); 
//          formData.append('dtcode', DistrictId);  
//          formData.append('block_code', BlcokId); 
//          formData.append('FileName', FileName);

//       const kmzFile = await axios.post(`${BASEURL}/upload-external-data`,formData,{
//          headers: {
//         "Content-Type": "multipart/form-data",
//       },
//       });
//       const data = kmzFile.data;
//       if(kmzFile.status === 200 || kmzFile.status === 201){
//         showNotification("success", `${desktopFile.name} and ${physicalFile.name} files are saved `);

//       }
      
//       setFilters({});
//       setSearchQuery('');
//       setHighlightedPlacemark(undefined);
//       setModalOpen(false)
//     } catch (error) {
//       console.error('Failed to upload file:', error);
//       setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
//       showNotification("error", "Failed to upload file");

//     } finally {
//       setIsUploading(false);
//     }
    
//   }

//     useEffect(() => {
//       // Cleanup function
//       return () => {
//         if (notifierTimeoutRef.current) {
//           clearTimeout(notifierTimeoutRef.current);
//         }
//       };
//     }, []);
//    const showNotification = (type: 'success' | 'error', message: string) => {
//     // Clear any existing timeout to prevent multiple notifications
//     if (notifierTimeoutRef.current) {
//       clearTimeout(notifierTimeoutRef.current);
//       notifierTimeoutRef.current = null;
//     }

//     setNotifier({ type, message, visible: true });

//     // Auto-hide notification after 5 seconds for success, 10 seconds for error
//     const hideDelay = type === 'success' ? 5000 : 10000;

//     notifierTimeoutRef.current = setTimeout(() => {
//       setNotifier(prev => ({ ...prev, visible: false }));
//       notifierTimeoutRef.current = null;
//     }, hideDelay);
//   };


//   // Handle file selection (multiple selection support)
//   const handleFileSelect = useCallback((file: KMZFile, isMultiSelect: boolean = false) => {
//     if (isMultiSelect) {
//       setSelectedFiles(prev => {
//         const isAlreadySelected = prev.some(f => f.id === file.id);
//         if (isAlreadySelected) {
//           // Remove from selection
//           return prev.filter(f => f.id !== file.id);
//         } else {
//           // Add to selection
//           return [...prev, file];
//         }
//       });
//     } else {
//       // Single selection
//       setSelectedFiles([file]);
//     }
//      setHighlightedPlacemark(undefined);
   
//   }, []);

//   // Handle file deletion
//   const handleFileDelete = async (id: string) => {
//     try {
//       await dbOperations.deleteKMZ(id);
//       const updatedFiles = await dbOperations.getAllKMZ();
//       // setFiles(updatedFiles);
      
//       // Remove from selected files if it was selected
//       setSelectedFiles(prev => prev.filter(f => f.id !== id));
      
//       // If no files selected, select the first available
//       if (selectedFiles.length === 1 && selectedFiles[0].id === id && updatedFiles.length > 0) {
//         setSelectedFiles([updatedFiles[0]]);
//       }
      
//       setFilters({});
//       setSearchQuery('');
//       setHighlightedPlacemark(undefined);
     
//     } catch (error) {
//       console.error('Failed to delete file:', error);
//     }
//   };

//   // Safe sidebar toggle function
//   const handleSidebarToggle = useCallback(() => {
//     try {
//       setSidebarOpen(prev => !prev);
//     } catch (error) {
//       console.error('Error toggling sidebar:', error);
//       // Fallback: force sidebar state
//       setSidebarOpen(false);
//     }
//   }, []);


//   return (
//     <div className="h-screen flex bg-gray-50">
//       <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle}>
//         {/* <FileUpload
//           onFileUpload={handleFileUpload}
//           isLoading={isUploading}
//           error={uploadError}
//         /> */}
//         <div className="mb-6">
//           <button
//             onClick={()=>{setModalOpen(true);setUploadError('')}}
//             disabled={isUploading}
//             className={`
//               w-full px-4 py-3 rounded-lg border-2 border-dashed 
//               ${isUploading 
//                 ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
//                 : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
//               }
//               transition-all duration-200 flex items-center justify-center gap-2
//               text-sm font-medium text-gray-700
//             `}
//           >
//               {isUploading ? (
//                 <>
//                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
//                   Processing...
//                 </>
//               ) : (
//                 <>
//                   <Upload className="h-4 w-4" />
//                   Upload KMZ or KML File
//                 </>
//               )}
//           </button>
//         </div>
      
        
//         <FilterPanel
//           filters={filters}
//           onFiltersChange={setFilters}
//           searchQuery={searchQuery}
//           onSearchChange={setSearchQuery}
//           selectedFilesCount={selectedFiles.length}
//         />

//         <FileList
//           files={files}
//           selectedFileIds={selectedFiles.map(f => f.id)}
//           onFileSelect={handleFileSelect}
//           onFileDelete={handleFileDelete}
//         />
//         {/* <PlacemarkList
//           placemarks={filteredPlacemarks}
//           visiblePlacemarks={visiblePlacemarks}
//           onPlacemarkVisibilityChange={handlePlacemarkVisibilityChange}
//           onPlacemarkClick={handlePlacemarkClick}
//           highlightedPlacemark={highlightedPlacemark}
//         /> */}
//       </Sidebar>

//       <main className="flex-1 relative">
       
//           <FileUploadModal
//             isOpen={isModalOpen}
//             onClose={() => setModalOpen(false)}
//             onUpload={handleFileUpload}
//             isLoading={isUploading}
//             error={uploadError}
//           />
        
      
//         {/* <MapViewer
//           placemarks={visibleFilteredPlacemarks}
//           highlightedPlacemark={highlightedPlacemark}
//           onPlacemarkClick={handlePlacemarkClick}
//           viewState={viewState}
//           onViewStateChange={handleViewStateChange}
//         /> */}
//       </main>
//         {Notifier.visible && (
//         <div
//           className={`fixed top-4 right-4 z-[10000] p-4 rounded-lg shadow-lg flex items-start max-w-md transform transition-all duration-500 ease-in-out ${Notifier.type === 'success'
//             ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
//             : 'bg-red-100 border-l-4 border-red-500 text-red-700'
//             } animate-fadeIn`}
//           style={{ animation: 'fadeIn 0.3s ease-out' }}
//         >
//           <div className="mr-3 mt-0.5">
//             {Notifier.type === 'success'
//               ? <CheckCircle size={20} className="text-green-500" />
//               : <AlertCircle size={20} className="text-red-500" />
//             }
//           </div>
//           <div>
//             <p className="font-bold text-sm">
//               {Notifier.type === 'success' ? 'Success!' : 'Oops!'}
//             </p>
//             <p className="text-sm">
//               {Notifier.message}
//             </p>
//           </div>
//           <button
//             onClick={() => setNotifier(prev => ({ ...prev, visible: false }))}
//             className="ml-auto p-1 hover:bg-opacity-20 hover:bg-gray-500 rounded"
//             aria-label="Close notification"
//           >
//             <X size={16} />
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// export default SmartInventory;


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { FileList } from './FileList';
import { FilterPanel } from './FilterPanel';
import { AlertCircle, CheckCircle, Upload, X, Menu, MapPin } from 'lucide-react';
import axios from 'axios';
import { GoogleMap } from './MapViewer';
import { PlacemarkList } from './PlacemarkList';
import { processApiData } from './PlaceMark';
import {KMZFile, FilterState, ViewState,ApiPlacemark, ProcessedPlacemark, PlacemarkCategory } from '../../types/kmz';
import FileUploadModal from './Modalpopup';

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
  
  // Placemark-related state
  const [processedPlacemarks, setProcessedPlacemarks] = useState<ProcessedPlacemark[]>([]);
  const [placemarkCategories, setPlacemarkCategories] = useState<PlacemarkCategory[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set());
  const [highlightedPlacemark, setHighlightedPlacemark] = useState<ProcessedPlacemark>();

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

  // Load placemark data when files are selected
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
    physicalFile: File,
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
      formData.append('physical_survey', physicalFile);
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
        showNotification("success", `${desktopFile.name} and ${physicalFile.name} files are saved`);
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

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
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
        {/* <PlacemarkList
          placemarks={filteredPlacemarks}
          visiblePlacemarks={visiblePlacemarks}
          onPlacemarkVisibilityChange={handlePlacemarkVisibilityChange}
          onPlacemarkClick={handlePlacemarkClick}
          highlightedPlacemark={highlightedPlacemark}
        /> */}
         <PlacemarkList
            placemarks={processedPlacemarks}
            categories={placemarkCategories}
            visibleCategories={visibleCategories}
            onCategoryVisibilityChange={handleCategoryVisibilityChange}
            onPlacemarkClick={handlePlacemarkClick}
            highlightedPlacemark={highlightedPlacemark}
          />
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
          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="text-sm text-gray-600">
              <div className="font-semibold text-gray-900 mb-1">Map Statistics</div>
              <div>Total Placemarks: {processedPlacemarks.length}</div>
              <div>Visible Categories: {visibleCategories.size}</div>
              <div>Points: {processedPlacemarks.filter(p => p.type === 'point').length}</div>
              <div>Polylines: {processedPlacemarks.filter(p => p.type === 'polyline').length}</div>
            </div>
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