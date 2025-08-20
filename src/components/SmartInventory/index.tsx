import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { FileList } from './FileList';
import { FilterPanel } from './FilterPanel';
import { AlertCircle, CheckCircle, Upload, X, Menu, MapPin, File, FilePlusIcon, FilePlus2Icon, RefreshCcwIcon, RefreshCcwDotIcon, RefreshCwOffIcon, RefreshCwIcon, DownloadIcon, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { GoogleMap } from './MapViewer';
import { PlacemarkList } from './PlacemarkList';
import { PLACEMARK_CATEGORIES, processApiData, processPhysicalSurveyData } from './PlaceMark';
import { KMZFile, FilterState, ViewState, ApiPlacemark, ProcessedPlacemark, PlacemarkCategory, EventTypeConfig, EventTypeCounts, PhysicalSurveyApiResponse, ProcessedPhysicalSurvey } from '../../types/kmz';
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
  const [loading, setLoding] = useState<boolean>(false)
  const [ShowFiles, setShowFiles] = useState(false);
  const [processedPlacemarks, setProcessedPlacemarks] = useState<ProcessedPlacemark[]>([]);
  const [placemarkCategories, setPlacemarkCategories] = useState<PlacemarkCategory[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set());
  const [highlightedPlacemark, setHighlightedPlacemark] = useState<ProcessedPlacemark>();
  const [physicalSurveyData, setPhysicalSurveyData] = useState<ProcessedPhysicalSurvey[]>([]);
  const [physicalSurveyCategories, setPhysicalSurveyCategories] = useState<PlacemarkCategory[]>([]);
  const [isLoadingPhysical, setIsLoadingPhysical] = useState(false);
  const [shapData, setShapData] = useState<any>(null);
  const [rawPhysicalSurveyData, setRawPhysicalSurveyData] = useState<any>(null);
  const [open, setOpen] = useState(false);

 // Load  external files
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoding(true)
        const params: any = {};
        if (filters.state) params.state_code = filters.state;
        if (filters.division) params.dtcode = filters.division;
        if (filters.block) params.blk_code = filters.block;
        if (searchQuery) params.filename = searchQuery;

        const savedFiles = await axios.get(`${BASEURL}/get-external-files`, { params });
        if (savedFiles.status === 200 || savedFiles.status === 201) {
          setFiles(savedFiles.data.data);
        }
      } catch (error) {
        console.error('Failed to load files:', error);
        showNotification('error', 'Failed to load files');
      }finally{
        setLoding(false)
      }
    };
    loadFiles();
  }, [filters, searchQuery]);


  useEffect(() => {
    const handleParsed = async () => {
      if (selectedFiles.length > 0) {
        let allPlacemarks: ProcessedPlacemark[] = [];
        let allCategoryData: Record<string, number> = {};
        
        try {
          // Process each selected file
          for (const file of selectedFiles) {
            const params: any = {};
            if (file.filepath) params.filepath = file.filepath;
            if (file.file_type) params.fileType = file.file_type;

            const resp = await axios.get(`${BASEURL}/preview-file`, { params });
            if (resp.status === 200 || resp.status === 201) {
              const apiData: ApiPlacemark = resp.data.data.parsed_data;
              setShapData(resp.data.data);
              const { placemarks, categories } = processApiData(apiData);
              
              // Combine placemarks with unique IDs
              const filePrefix = file.id;
              const prefixedPlacemarks = placemarks.map(placemark => ({
                ...placemark,
                id: `${filePrefix}-${placemark.id}`
              }));
              
              allPlacemarks = [...allPlacemarks, ...prefixedPlacemarks];
              
              // Combine category counts
              categories.forEach(category => {
                allCategoryData[category.name] = (allCategoryData[category.name] || 0) + category.count;
              });
              
            } else {
              showNotification("error", `Failed to load ${file.filename}: ${resp.data.message}`);
            }
          }
          
          // Create combined categories
          const combinedCategories = Object.entries(allCategoryData).map(([name, count]) => {
            const categoryConfig = Object.entries(PLACEMARK_CATEGORIES).find(([key]) => key === name);
            const config = categoryConfig ? categoryConfig[1] : { color: '#6B7280', icon: '📍' };
            
            return {
              id: name.toLowerCase().replace(/\s+/g, '-'),
              name,
              count,
              visible: true,
              color: config.color,
              icon: config.icon
            };
          }).filter(category => category.count > 0);
          
          setProcessedPlacemarks(allPlacemarks);
          setPlacemarkCategories(combinedCategories);
          
          // Initially show all categories
          const allCategoryIds = new Set(combinedCategories.map(cat => cat.id));
          setVisibleCategories(allCategoryIds);
          
          if (selectedFiles.length > 1) {
            showNotification("success", `Successfully loaded ${selectedFiles.length} files with ${allPlacemarks.length} placemarks`);
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


  // Load physical survey data
  const loadPhysicalData = async (state: string[], division: string[], block: string[]) => {
    try {
      setIsLoadingPhysical(true);
      const params: any = {};

      if (state.length > 0) params.state_id = state.join(',');
      if (division.length > 0) params.district_id = division.join(',');
      if (block.length > 0) params.block_id = block.join(',');

      const response = await axios.get(`${BASEURL}/get-physical-survey`, { params });
      const result: PhysicalSurveyApiResponse = response.data;

      if (response.status === 200 || response.status === 201) {
        if (Object.keys(result.data).length > 0) {
          const { placemarks, categories } = processPhysicalSurveyData(result);
          setRawPhysicalSurveyData(result);
          setPhysicalSurveyData(placemarks);
          setPhysicalSurveyCategories(categories);
          
          // Add physical survey categories to visible categories
          const physicalCategoryIds = new Set(categories.map(cat => cat.id));
          setVisibleCategories(prev => new Set([...prev, ...physicalCategoryIds]));
          
          showNotification('success', `Loaded ${placemarks.length} physical survey points`);
        }
      }
    } catch (error) {
      console.error('Failed to load physical survey data:', error);
      showNotification('error', 'Failed to load physical survey data');
    } finally {
      setIsLoadingPhysical(false);
    }
  };

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


  // download shapefile
  const downloadShapefile = async () => {
    try {
      setLoding(true)
      const shapefileData: any = {
        parsed_data: {
          points: [],
          polylines: []
        }
      };

      // Add external data if available
      if (shapData && shapData.parsed_data) {
        shapefileData.parsed_data.points = shapData.parsed_data.points || [];
        shapefileData.parsed_data.polylines = shapData.parsed_data.polylines || [];
      }

      // Add physical survey data grouped by event type
      if (rawPhysicalSurveyData && rawPhysicalSurveyData.data) {
        // Group physical survey points by event type
        const groupedByEventType: Record<string, any[]> = {};
        
        Object.entries(rawPhysicalSurveyData.data).forEach(([blockId, points]: [string, any]) => {
          if (Array.isArray(points)) {
            points.forEach((point: any) => {
              // Skip LIVELOCATION events
              if (point.event_type === 'LIVELOCATION') {
                return;
              }
              
              if (!groupedByEventType[point.event_type]) {
                groupedByEventType[point.event_type] = [];
              }
              
              groupedByEventType[point.event_type].push({
                name: `${point.event_type} - Survey ${point.survey_id}`,
                coordinates: {
                  longitude: parseFloat(point.longitude),
                  latitude: parseFloat(point.latitude)
                },
                type: point.event_type,
                properties: {
                  ...point,
                }
              });
            });
          }
        });

        // Add grouped data to shapefile structure
        Object.entries(groupedByEventType).forEach(([eventType, points]) => {
          shapefileData.parsed_data[eventType] = points;
        });
      }

      // Send request to shapefile download API
      const response = await axios.post(`${BASEURL}/download-shape`, shapefileData, {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'blob' // Important for file download
      });

      if (response.status === 200) {
        // Create download link
        const blob = new Blob([response.data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'shapefile.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showNotification('success', 'Shapefile downloaded successfully');
      }
    } catch (error) {
      console.error('Failed to download shapefile:', error);
      showNotification('error', 'Failed to download shapefile');
    }finally{
      setLoding(false)
    }
  };

  const downloadExcel = () =>{

  }


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

  const allPlacemarks = [...processedPlacemarks, ...physicalSurveyData];
  const allCategories = [...placemarkCategories, ...physicalSurveyCategories];
  // console.log(allPlacemarks,'allPlacemarks')

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

   const handleSelectionChange = (selectedStates: string[], selectedDistricts: string[], selectedBlocks: string[]) => {
    //  loadPhysicalData(selectedStates,selectedDistricts,selectedBlocks)
  };

  const handlePreview = (item: { 
    type: 'state' | 'district' | 'block' | 'universal'; 
    selectedStates: string[];
    selectedDistricts: string[];
    selectedBlocks: string[];
    name: string;

  }) => {
    loadPhysicalData( item.selectedStates, item.selectedDistricts,item.selectedBlocks)

  };

  const handleRefresh = (item: { 
    type: 'state' | 'district' | 'block' | 'universal'; 
    selectedStates: string[];
    selectedDistricts: string[];
    selectedBlocks: string[];
    name: string;

  }) => {
    loadPhysicalData( item.selectedStates, item.selectedDistricts,item.selectedBlocks)
    };



  return (
    <div className="h-screen flex bg-gray-50">
      {(loading || isLoadingPhysical) && (
        <div className="absolute top-70 right-150 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800 mx-auto mb-4"></div>
        </div>
      )}
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle}>
       
        <div className="flex items-center gap-2">
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
           {/* <button
            onClick={downloadShapefile}
            className={`
              border-2 border-dashed 
              w-20 h-12 rounded-full flex items-center justify-center transition-colors 
              ${loading
                ? 'border-gray-300 bg-blue-100'
                : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
              }
              transition-all duration-200 flex items-center justify-center gap-2
              text-sm font-medium text-gray-700
            `}
            title='Download Shap'
          >
            <DownloadIcon size={18} />

          </button> */}

         
        </div>
        <div className="relative inline-block w-full text-left">
  <button
    onClick={() => setOpen(!open)}
    className={`
          w-full px-1 py-3 rounded-lg border-2 border-dashed 
          ${loading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
          }
          transition-all duration-200 flex items-center justify-center gap-2
          text-sm font-medium text-gray-700
        `}
  >
     <DownloadIcon size={18} />
      <span>Download</span>
      <ChevronDown size={16} />
  </button>

  {open && (
    <div className="absolute mt-2 left-0 right-0 w-full rounded-lg shadow-lg bg-white border border-gray-200 z-50">
      <ul className="py-1 text-sm text-gray-700">
        <li>
          <button
            onClick={() => { downloadShapefile(); setOpen(false); }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            Shapefile
          </button>
        </li>
        <li>
          <button
            onClick={() => { downloadExcel(); setOpen(false); }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            Excel
          </button>
        </li>
      </ul>
    </div>
  )}
</div>

     
         <GeographicSelector
            BASEURL={BASEURL}
            onSelectionChange={handleSelectionChange}
            onPreview={handlePreview}
            onRefresh={handleRefresh}
            isLoadingPhysical={isLoadingPhysical}

          />

       
          <PlacemarkList
            placemarks={allPlacemarks}
            categories={allCategories}
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
      

        {/* Map */}
        
        <GoogleMap
          placemarks={allPlacemarks}
          categories={allCategories}
          visibleCategories={visibleCategories}
          highlightedPlacemark={highlightedPlacemark}
          onPlacemarkClick={handlePlacemarkClick}
          className="w-full h-full"
        />


        {/* Stats Overlay */}
        {allPlacemarks.length > 0 && (
          <div className="absolute bottom-4 left-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="text-sm text-gray-600">
              <div className="font-semibold text-gray-900 mb-1">Map Statistics</div>
              <div>Total Placemarks: {allPlacemarks.length}</div>
              <div>KML/KMZ Points: {processedPlacemarks.filter(p => p.type === 'point').length}</div>
              <div>KML/KMZ Polylines: {processedPlacemarks.filter(p => p.type === 'polyline').length}</div>
              <div>Physical Survey: {physicalSurveyData.length}</div>
              <div>Visible Categories: {visibleCategories.size}</div>

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