import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { FileList } from './FileList';
import { FilterPanel } from './FilterPanel';
import { AlertCircle, CheckCircle, Upload, X, Menu, MapPin, File, FilePlusIcon, FilePlus2Icon, RefreshCcwIcon, RefreshCcwDotIcon, RefreshCwOffIcon, RefreshCwIcon, DownloadIcon, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { GoogleMap } from './MapViewer';
import { PlacemarkList } from './PlacemarkList';
import { PLACEMARK_CATEGORIES, processApiData, processPhysicalSurveyData, processDesktopPlanningData } from './PlaceMark';
import { KMZFile, FilterState, ViewState, ApiPlacemark, ProcessedPlacemark, PlacemarkCategory, EventTypeConfig, EventTypeCounts, PhysicalSurveyApiResponse, ProcessedPhysicalSurvey, DesktopPlanningApiResponse, ProcessedDesktopPlanning } from '../../types/kmz';
import FileUploadModal from './Modalpopup';
import { GeographicSelector } from './GeographicSelector';

interface NotifierState {
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}
const BASEURL = import.meta.env.VITE_TraceAPI_URL;

function SmartInventory() {
  // ==============================================
  // UI STATE MANAGEMENT
  // ==============================================
  const [isModalOpen, setModalOpen] = useState(false);
  const [Notifier, setNotifier] = useState<NotifierState>({ type: 'success', message: '', visible: false });
  const notifierTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoding] = useState<boolean>(false);
  const [ShowFiles, setShowFiles] = useState(false);
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // ==============================================
  // EXTERNAL FILES STATE (Right Sidebar)
  // ==============================================
  const [files, setFiles] = useState<KMZFile[][]>([]);
  const [selectedFiles, setSelectedFiles] = useState<KMZFile[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [fileCategory, setFileCategory] = useState<string>('');
  const [allProcessedFiles, setAllProcessedFiles] = useState([]);
  
  // External Files - Processed Data
  const [processedPlacemarks, setProcessedPlacemarks] = useState<ProcessedPlacemark[]>([]);
  const [placemarkCategories, setPlacemarkCategories] = useState<PlacemarkCategory[]>([]);

  // ==============================================
  // API DATA STATE (Left Sidebar)
  // ==============================================
  // Physical Survey Data
  const [physicalSurveyData, setPhysicalSurveyData] = useState<ProcessedPhysicalSurvey[]>([]);
  const [physicalSurveyCategories, setPhysicalSurveyCategories] = useState<PlacemarkCategory[]>([]);
  const [isLoadingPhysical, setIsLoadingPhysical] = useState(false);
  const [rawPhysicalSurveyData, setRawPhysicalSurveyData] = useState<any>(null);
  
  // Desktop Planning Data
  const [desktopPlanningData, setDesktopPlanningData] = useState<ProcessedDesktopPlanning[]>([]);
  const [desktopPlanningCategories, setDesktopPlanningCategories] = useState<PlacemarkCategory[]>([]);
  const [isLoadingDesktopPlanning, setIsLoadingDesktopPlanning] = useState(false);
  const [rawDesktopPlanningData, setRawDesktopPlanningData] = useState<any>(null);

  // ==============================================
  // MAP STATE
  // ==============================================
  const [visibleCategories, setVisibleCategories] = useState<Set<string>>(new Set());
  const [highlightedPlacemark, setHighlightedPlacemark] = useState<ProcessedPlacemark>();

  // ==============================================
  // EXTERNAL FILES MANAGEMENT
  // ==============================================
  
  // Load external files based on filters
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoding(true)
        const params: any = {};
        
        if (filters.state) params.state_code = filters.state;
        if (filters.division) params.dtcode = filters.division;
        if (filters.block) params.blk_code = filters.block;
        if (searchQuery) params.filename = searchQuery;
        if (fileCategory) params.category = fileCategory;

        const savedFiles = await axios.get(`${BASEURL}/get-external-files`, { params });
        
        if (savedFiles.status === 200 || savedFiles.status === 201) {
          setFiles(savedFiles.data.data);
        }
      } catch (error) {
        console.error('Failed to load files:', error);
        showNotification('error', 'Failed to load files');
      } finally {
        setLoding(false)
      }
    };
    
    loadFiles();
  }, [filters, searchQuery, fileCategory]);

  // Process selected external files
  useEffect(() => {
    const handleParsed = async () => {
      if (selectedFiles.length > 0) {
        let allPlacemarks: ProcessedPlacemark[] = [];
        let allCategoryData: Record<string, number> = {};
        let combinedPhysicalSurveyData: any = { data: {} };
        let processedFilesData = [];
        
        try {
          for (const file of selectedFiles) {
            const params: any = {};
            if (file.filepath) params.filepath = file.filepath;
            if (file.file_type) params.fileType = file.file_type;

            const resp = await axios.get(`${BASEURL}/preview-file`, { params });
            if (resp.status === 200 || resp.status === 201) {
              
              if (file.category === 'Survey') {
                const apiData: ApiPlacemark = resp.data.data.parsed_data;
                const physicalSurveyData = transformKMLToPhysicalSurvey(apiData, file);
                
                processedFilesData.push({
                  fileId: file.id,
                  filename: file.filename,
                  category: file.category,
                  rawData: resp.data.data,
                  transformedData: physicalSurveyData,
                  originalFile: file
                });
                
                if (physicalSurveyData && physicalSurveyData.data) {
                  Object.keys(physicalSurveyData.data).forEach(blockId => {
                    if (!combinedPhysicalSurveyData.data[blockId]) {
                      combinedPhysicalSurveyData.data[blockId] = [];
                    }
                    combinedPhysicalSurveyData.data[blockId] = [
                      ...combinedPhysicalSurveyData.data[blockId],
                      ...physicalSurveyData.data[blockId]
                    ];
                  });
                }
                
                const { placemarks: surveyPlacemarks, categories: surveyCategories } = 
                  processPhysicalSurveyData(physicalSurveyData);
                
                const filePrefix = file.id;
                const prefixedSurveyPlacemarks = surveyPlacemarks.map(placemark => ({
                  ...placemark,
                  id: `${filePrefix}-${placemark.id}`
                }));
                
                allPlacemarks = [...allPlacemarks, ...prefixedSurveyPlacemarks];
                
                surveyCategories.forEach(category => {
                  allCategoryData[category.name] = (allCategoryData[category.name] || 0) + category.count;
                });
                
              } else {
                // DESKTOP FILE: Process normally
                const apiData: ApiPlacemark = resp.data.data.parsed_data;
                
                processedFilesData.push({
                  fileId: file.id,
                  filename: file.filename,
                  category: file.category,
                  rawData: resp.data.data,
                  transformedData: null,
                  originalFile: file
                });
                
                const { placemarks, categories } = processApiData(apiData);
                
                const filePrefix = file.id;
                const prefixedPlacemarks = placemarks.map(placemark => ({
                  ...placemark,
                  id: `${filePrefix}-${placemark.id}`
                }));
                
                allPlacemarks = [...allPlacemarks, ...prefixedPlacemarks];
                
                categories.forEach(category => {
                  allCategoryData[category.name] = (allCategoryData[category.name] || 0) + category.count;
                });
              }
              
            } else {
              showNotification("error", `Failed to load ${file.filename}: ${resp.data.message}`);
            }
          }
          
          setAllProcessedFiles(processedFilesData);
          
          if (Object.keys(combinedPhysicalSurveyData.data).length > 0) {
            setRawPhysicalSurveyData(prevData => {
              if (prevData && prevData.data) {
                const mergedData = { ...prevData.data };
                Object.keys(combinedPhysicalSurveyData.data).forEach(blockId => {
                  if (!mergedData[blockId]) {
                    mergedData[blockId] = [];
                  }
                  mergedData[blockId] = [
                    ...mergedData[blockId],
                    ...combinedPhysicalSurveyData.data[blockId]
                  ];
                });
                return { ...prevData, data: mergedData };
              }
              return combinedPhysicalSurveyData;
            });
          }
          
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
          
          const allCategoryIds = new Set(combinedCategories.map(cat => cat.id));
          setVisibleCategories(prev => new Set([...prev, ...allCategoryIds]));
          
          if (selectedFiles.length > 1) {
            showNotification("success", `Successfully loaded ${selectedFiles.length} files with ${allPlacemarks.length} placemarks`);
          }
          
        } catch (error) {
          console.error('Failed to show preview:', error);
          showNotification("error", 'Failed to show preview');
        }
      } else {
        // Clear external file data when no files selected
        setProcessedPlacemarks([]);
        setPlacemarkCategories([]);
        setAllProcessedFiles([]);
        
        // Remove external file categories from visible categories
        setVisibleCategories(prev => {
          const newSet = new Set(prev);
          placemarkCategories.forEach(cat => newSet.delete(cat.id));
          return newSet;
        });
      }
    };
    handleParsed();
  }, [selectedFiles]);

  // ==============================================
  // API DATA MANAGEMENT (Physical Survey & Desktop Planning)
  // ==============================================
  
  // Load physical survey data
  const loadPhysicalData = async (state: string[], division: string[], block: string[]) => {
  try {
    // Add console logging here
    console.log('=== Physical Survey API Call ===');
    console.log('Selected States:', state);
    console.log('Selected Districts:', division);
    console.log('Selected Blocks:', block);
    
    setIsLoadingPhysical(true);
    const params: any = {};

    if (state.length > 0) {
      params.state_id = state.join(',');
      console.log('State IDs parameter:', params.state_id);
    }
    if (division.length > 0) {
      params.district_id = division.join(',');
      console.log('District IDs parameter:', params.district_id);
    }
    if (block.length > 0) {
      params.block_id = block.join(',');
      console.log('Block IDs parameter:', params.block_id);
    }

    console.log('Final API params:', params);
    console.log('API URL:', `${BASEURL}/get-physical-survey`);

    const response = await axios.get(`${BASEURL}/get-physical-survey`, { params });
    const result: PhysicalSurveyApiResponse = response.data;

    console.log('API Response:', response);
    console.log('Response Data:', result);

    if (response.status === 200 || response.status === 201) {
      if (Object.keys(result.data).length > 0) {
        console.log('Number of blocks in response:', Object.keys(result.data).length);
        
        // Log each block's data
        Object.entries(result.data).forEach(([blockId, points]) => {
          console.log(`Block ${blockId}: ${points.length} survey points`);
        });

        const { placemarks, categories } = processPhysicalSurveyData(result);
        console.log('Processed placemarks count:', placemarks.length);
        console.log('Processed categories:', categories);
        
        setRawPhysicalSurveyData(result);
        setPhysicalSurveyData(placemarks);
        setPhysicalSurveyCategories(categories);
        
        const physicalCategoryIds = new Set(categories.map(cat => cat.id));
        setVisibleCategories(prev => new Set([...prev, ...physicalCategoryIds]));
        
        showNotification('success', `Loaded ${placemarks.length} physical survey points`);
      } else {
        console.log('No data found in API response');
      }
    }
    console.log('=== End Physical Survey API Call ===');
  } catch (error) {
    console.error('=== Physical Survey API Error ===');
    console.error('Error details:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    }
    console.error('=== End Physical Survey API Error ===');
    
    showNotification('error', 'Failed to load physical survey data');
  } finally {
    setIsLoadingPhysical(false);
  }
};


  // Load desktop planning data
  const loadDesktopPlanningData = async (
    state: string[], 
    division: string[], 
    block: string[], 
    hierarchyContext?: {
      stateId?: string;
      districtId?: string;
      blockId?: string;
    }
  ) => {
    try {
      setIsLoadingDesktopPlanning(true);
      
      const stateId = hierarchyContext?.stateId || state[0];
      const districtId = hierarchyContext?.districtId || division[0];
      const blockId = hierarchyContext?.blockId || block[0];

      if (!stateId || !districtId || !blockId) {
        showNotification('error', 'Please select a state, district, and block to load desktop planning data');
        setIsLoadingDesktopPlanning(false);
        return;
      }

      const requestData = { stateId, districtId, blockId };

      const response = await axios.post(`${BASEURL}/get-desktop-planning`, requestData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result: DesktopPlanningApiResponse = response.data;

      if (response.status === 200 || response.status === 201) {
        if (result.status && result.data.length > 0) {
          const { placemarks, categories } = processDesktopPlanningData(result);
          setRawDesktopPlanningData(result);
          setDesktopPlanningData(placemarks);
          setDesktopPlanningCategories(categories);
          
          const desktopCategoryIds = new Set(categories.map(cat => cat.id));
          setVisibleCategories(prev => new Set([...prev, ...desktopCategoryIds]));
          
          showNotification('success', `Loaded ${placemarks.length} desktop planning items from ${result.data.length} network(s) for the selected area`);
        } else {
          showNotification('info', 'No desktop planning data found for selected area');
          setDesktopPlanningData([]);
          setDesktopPlanningCategories([]);
          setRawDesktopPlanningData(null);
        }
      }
    } catch (error) {
      console.error('Failed to load desktop planning data:', error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMsg = error.response.data?.message || `API Error: ${error.response.status}`;
        showNotification('error', `Failed to load desktop planning data: ${errorMsg}`);
      } else {
        showNotification('error', 'Failed to load desktop planning data: Network error');
      }
    } finally {
      setIsLoadingDesktopPlanning(false);
    }
  };

  // ==============================================
  // UTILITY FUNCTIONS
  // ==============================================

  // Transform KML/KMZ data to Physical Survey format
  function transformKMLToPhysicalSurvey(apiData: ApiPlacemark, file: KMZFile): any {
    const physicalSurveyData = { data: {} };
    const blockId = file.blk_code || file.id || 'unknown_block';
    physicalSurveyData.data[blockId] = [];
    
    if (apiData.points) {
      apiData.points.forEach((point, index) => {
        const eventType = mapKMLTypeToSurveyEvent(point.type || 'LANDMARK');
        
        physicalSurveyData.data[blockId].push({
          survey_id: `${file.id}_${index}`,
          event_type: eventType,
          latitude: point.coordinates.latitude.toString(),
          longitude: point.coordinates.longitude.toString(),
          ...point.properties,
          filename: file.filename,
          uploaded_at: file.uploaded_at,
          block_id: blockId
        });
      });
    }
    
    return physicalSurveyData;
  }

  // Helper function to map KML types to survey event types
  function mapKMLTypeToSurveyEvent(kmlType: string): string {
    const typeMapping = {
      'LANDMARK': 'LANDMARK',
      'GP': 'LANDMARK',
      'FPOI': 'ROUTEINDICATOR',
      'BHQ': 'LANDMARK',
      'BR': 'LANDMARK',
      'Bridge': 'LANDMARK',
      'Culvert': 'LANDMARK',
      'ROADCROSSING': 'ROUTEFEASIBILITY',
    };
    
    return typeMapping[kmlType] || 'LANDMARK';
  }

  // ==============================================
  // EVENT HANDLERS
  // ==============================================

  // File Upload
  const handleFileUpload = async (
    desktopFile: File,
    fileName: string,
    stateId: string,
    districtId: string,
    blockId: string,
    category: string
  ) => {
    setIsUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('desktop_planning', desktopFile);
      formData.append('state_code', stateId);
      formData.append('dtcode', districtId);
      formData.append('block_code', blockId);
      formData.append('FileName', fileName);
      formData.append('category', category);

      const kmzFile = await axios.post(`${BASEURL}/upload-external-data`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (kmzFile.status === 200 || kmzFile.status === 201) {
        showNotification("success", `${desktopFile.name} file uploaded successfully in ${category} category`);
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

  // File Selection
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

  // File Deletion
  const handleFileDelete = async (id: string) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this file? This action cannot be undone.');
      
      if (!confirmed) return;

      setLoding(true);
      const response = await axios.post(`${BASEURL}/delete-physicalsurvey/${id}`);

      if (response.status === 200 || response.status === 201) {
        showNotification('success', 'File deleted successfully');
        setSelectedFiles(prev => prev.filter(f => f.id !== id));
        setHighlightedPlacemark(undefined);

        // Trigger reload by resetting filters
        const currentFilters = { ...filters };
        const currentSearch = searchQuery;
        const currentCategory = fileCategory;
        
        setFilters({});
        setSearchQuery('');
        setFileCategory('');
        
        setTimeout(() => {
          setFilters(currentFilters);
          setSearchQuery(currentSearch);
          setFileCategory(currentCategory);
        }, 100);

      } else {
        showNotification('error', 'Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || 'Failed to delete file';
        showNotification('error', errorMessage);
      } else {
        showNotification('error', 'Failed to delete file');
      }
    } finally {
      setLoding(false);
    }
  };

  // Geographic Selection Handlers
  const handleSelectionChange = (selectedStates: string[], selectedDistricts: string[], selectedBlocks: string[]) => {
    // Currently commented out - can be enabled for auto-loading
    // loadPhysicalData(selectedStates,selectedDistricts,selectedBlocks)
  };

  const handlePreview = (item: { 
    type: 'state' | 'district' | 'block' | 'universal'; 
    selectedStates: string[];
    selectedDistricts: string[];
    selectedBlocks: string[];
    name: string;
    dataType: 'physical' | 'desktop';
    hierarchyContext?: {
      stateId?: string;
      districtId?: string;
      blockId?: string;
    };
  }) => {
    if (item.dataType === 'physical') {
      loadPhysicalData(item.selectedStates, item.selectedDistricts, item.selectedBlocks);
    } else if (item.dataType === 'desktop') {
      loadDesktopPlanningData(item.selectedStates, item.selectedDistricts, item.selectedBlocks, item.hierarchyContext);
    }
  };

  const handleRefresh = (item: { 
    type: 'state' | 'district' | 'block' | 'universal'; 
    selectedStates: string[];
    selectedDistricts: string[];
    selectedBlocks: string[];
    name: string;
    dataType: 'physical' | 'desktop';
    hierarchyContext?: {
      stateId?: string;
      districtId?: string;
      blockId?: string;
    };
  }) => {
    if (item.dataType === 'physical') {
      loadPhysicalData(item.selectedStates, item.selectedDistricts, item.selectedBlocks);
    } else if (item.dataType === 'desktop') {
      loadDesktopPlanningData(item.selectedStates, item.selectedDistricts, item.selectedBlocks, item.hierarchyContext);
    }
  };

  // Map Handlers
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

  const handlePlacemarkClick = (placemark: ProcessedPlacemark) => {
    setHighlightedPlacemark(placemark);
  };

  const handleSidebarToggle = useCallback(() => {
    try {
      setSidebarOpen(prev => !prev);
    } catch (error) {
      console.error('Error toggling sidebar:', error);
      setSidebarOpen(false);
    }
  }, []);

  // Download Functions
  const downloadShapefile = async () => {
    try {
      setLoding(true);
      const shapefileData: any = { parsed_data: {} };

      // Process External Files
      allProcessedFiles.forEach(fileData => {
        if (fileData.category === 'Desktop') {
          const apiData = fileData.rawData.parsed_data;
          
          if (apiData.points && Array.isArray(apiData.points)) {
            if (!shapefileData.parsed_data.points) {
              shapefileData.parsed_data.points = [];
            }
            
            apiData.points.forEach((point: any) => {
              shapefileData.parsed_data.points.push({
                name: point.name,
                coordinates: {
                  longitude: parseFloat(point.coordinates.longitude),
                  latitude: parseFloat(point.coordinates.latitude)
                },
                type: point.type || point.properties?.asset_type || point.properties?.type || 'FPOI',
                properties: {
                  ...point.properties,
                  id: point.id,
                  name: point.name,
                  network_id: point.network_id,
                  network_name: point.network_name,
                  filename: fileData.filename,
                  file_id: fileData.fileId
                }
              });
            });
          }

          if (apiData.polylines && Array.isArray(apiData.polylines)) {
            if (!shapefileData.parsed_data.polylines) {
              shapefileData.parsed_data.polylines = [];
            }
            
            apiData.polylines.forEach((polyline: any) => {
              shapefileData.parsed_data.polylines.push({
                name: polyline.name,
                type: polyline.type || 'fiber_connection',
                styleUrl: polyline.styleUrl || null,
                distance: polyline.distance || null,
                coordinates: polyline.coordinates
              });
            });
          }
          
        } else if (fileData.category === 'Survey') {
          const transformedData = fileData.transformedData;
          
          if (transformedData && transformedData.data) {
            Object.entries(transformedData.data).forEach(([blockId, points]: [string, any]) => {
              if (Array.isArray(points)) {
                points.forEach((point: any) => {
                  const eventType = point.event_type;
                  const categoryKey = eventType.toLowerCase();
                  
                  if (!shapefileData.parsed_data[categoryKey]) {
                    shapefileData.parsed_data[categoryKey] = [];
                  }
                  
                  shapefileData.parsed_data[categoryKey].push({
                    name: `${eventType} - Survey ${point.survey_id}`,
                    coordinates: {
                      longitude: parseFloat(point.longitude),
                      latitude: parseFloat(point.latitude)
                    },
                    type: eventType,
                    properties: {
                      ...point,
                      survey_id: point.survey_id,
                      event_type: eventType,
                      block_id: blockId,
                      filename: fileData.filename,
                      file_id: fileData.fileId
                    }
                  });
                });
              }
            });
          }
        }
      });

      // Process Physical Survey Data (from API)
      if (rawPhysicalSurveyData && rawPhysicalSurveyData.data) {
        Object.entries(rawPhysicalSurveyData.data).forEach(([blockId, points]: [string, any]) => {
          if (Array.isArray(points)) {
            points.forEach((point: any) => {
              if (point.event_type === 'LIVELOCATION' || point.filename) {
                return;
              }
              
              const eventType = point.event_type;
              const categoryKey = eventType.toLowerCase();
              
              if (!shapefileData.parsed_data[categoryKey]) {
                shapefileData.parsed_data[categoryKey] = [];
              }
              
              shapefileData.parsed_data[categoryKey].push({
                name: `${eventType} - Survey ${point.survey_id}`,
                coordinates: {
                  longitude: parseFloat(point.longitude),
                  latitude: parseFloat(point.latitude)
                },
                type: eventType,
                properties: {
                  ...point,
                  survey_id: point.survey_id,
                  event_type: eventType,
                  block_id: blockId,
                  source: 'geographic_selector'
                }
              });
            });
          }
        });
      }

      // Process Desktop Planning Data (from API)
      if (rawDesktopPlanningData && rawDesktopPlanningData.data) {
        rawDesktopPlanningData.data.forEach((network: any) => {
          network.points.forEach((point: any) => {
            try {
              const coordinates = JSON.parse(point.coordinates);
              const properties = JSON.parse(point.properties);
              
              if (!shapefileData.parsed_data.points) {
                shapefileData.parsed_data.points = [];
              }
              
              shapefileData.parsed_data.points.push({
                name: point.name,
                coordinates: {
                  longitude: parseFloat(coordinates[0]),
                  latitude: parseFloat(coordinates[1])
                },
                type: properties.asset_type || properties.type || 'FPOI',
                properties: {
                  ...point,
                  ...properties,
                  network_id: network.id,
                  network_name: network.name,
                  source: 'geographic_selector'
                }
              });
            } catch (error) {
              console.warn('Error processing desktop planning point:', error);
            }
          });

          network.connections.forEach((connection: any) => {
            try {
              const coordinates = JSON.parse(connection.coordinates);
              
              if (!shapefileData.parsed_data.polylines) {
                shapefileData.parsed_data.polylines = [];
              }
              
              shapefileData.parsed_data.polylines.push({
                name: connection.original_name,
                coordinates: coordinates.map((coord: [number, number]) => ({
                  longitude: coord[1],
                  latitude: coord[0]
                })),
                type: connection.type || 'fiber_connection'
              });
            } catch (error) {
              console.warn('Error processing desktop planning connection:', error);
            }
          });
        });
      }

      const response = await axios.post(`${BASEURL}/download-shape`, shapefileData, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'blob'
      });

      if (response.status === 200) {
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
    } finally {
      setLoding(false);
    }
  };

  const downloadExcel = () => {
    // Excel download functionality to be implemented
  };

  // Notification system
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    if (notifierTimeoutRef.current) {
      clearTimeout(notifierTimeoutRef.current);
      notifierTimeoutRef.current = null;
    }

    setNotifier({ type: type as 'success' | 'error', message, visible: true });
    const hideDelay = type === 'success' ? 5000 : 10000;

    notifierTimeoutRef.current = setTimeout(() => {
      setNotifier(prev => ({ ...prev, visible: false }));
      notifierTimeoutRef.current = null;
    }, hideDelay);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (notifierTimeoutRef.current) {
        clearTimeout(notifierTimeoutRef.current);
      }
    };
  }, []);

  // ==============================================
  // COMPUTED VALUES
  // ==============================================
  
  // Separate data for different contexts
  const externalFilePlacemarks = processedPlacemarks;
  const apiPlacemarks = [...physicalSurveyData, ...desktopPlanningData];
  const allPlacemarks = [...externalFilePlacemarks, ...apiPlacemarks];
  
  const externalFileCategories = placemarkCategories;
  const apiCategories = [...physicalSurveyCategories, ...desktopPlanningCategories];
  const allCategories = [...externalFileCategories, ...apiCategories];

  // ==============================================
  // RENDER
  // ==============================================

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Loading Indicator */}
      {(loading || isLoadingPhysical || isLoadingDesktopPlanning) && (
        <div className="absolute top-70 right-150 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800 mx-auto mb-4"></div>
        </div>
      )}

      {/* LEFT SIDEBAR - API Data Management */}
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle}>
        {/* Upload Controls */}
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
        </div>

        {/* Download Controls */}
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

        {/* Geographic Selector - API Data Controls */}
        <GeographicSelector
          BASEURL={BASEURL}
          onSelectionChange={handleSelectionChange}
          onPreview={handlePreview}
          onRefresh={handleRefresh}
          isLoadingPhysical={isLoadingPhysical}
          isLoadingDesktopPlanning={isLoadingDesktopPlanning}
        />

        {/* Placemark List - ALL Data Display */}
        <PlacemarkList
          placemarks={allPlacemarks}
          categories={allCategories}
          visibleCategories={visibleCategories}
          onCategoryVisibilityChange={handleCategoryVisibilityChange}
          onPlacemarkClick={handlePlacemarkClick}
          highlightedPlacemark={highlightedPlacemark}
        />
      </Sidebar>
      
      {/* MAIN CONTENT - Map */}
      <main className="flex-1 relative">
        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onUpload={handleFileUpload}
          isLoading={isUploading}
          error={uploadError}
        />

        {/* Google Map */}
        <GoogleMap
          placemarks={allPlacemarks}
          categories={allCategories}
          visibleCategories={visibleCategories}
          highlightedPlacemark={highlightedPlacemark}
          onPlacemarkClick={handlePlacemarkClick}
          className="w-full h-full"
        />

        {/* Map Statistics */}
        {allPlacemarks.length > 0 && (
          <div className="absolute bottom-4 left-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <div className="text-sm text-gray-600">
              <div className="font-semibold text-gray-900 mb-1">Map Statistics</div>
              <div>Total Placemarks: {allPlacemarks.length}</div>
              <div>External Files: {externalFilePlacemarks.length}</div>
              <div>Physical Survey: {physicalSurveyData.length}</div>
              <div>Desktop Planning: {desktopPlanningData.length}</div>
              <div>Visible Categories: {visibleCategories.size}</div>
            </div>
          </div>
        )}

        {/* RIGHT SIDEBAR - External Files Management */}
        {ShowFiles && (
          <div className="absolute top-0 right-0 h-full bg-white rounded-lg shadow-lg border border-gray-200 p-3 overflow-hidden">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedFilesCount={selectedFiles.length}
              fileCategory={fileCategory}
              onFileCategoryChange={setFileCategory}
            />
            <br />
            <FileList
              files={files}
              selectedFileIds={selectedFiles.map(f => f.id)}
              onFileSelect={handleFileSelect}
              onFileDelete={handleFileDelete}
            />
          </div>
        )}
      </main>

      {/* Notification System */}
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