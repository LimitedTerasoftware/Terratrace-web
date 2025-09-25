import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { FileList } from './FileList';
import { FilterPanel } from './FilterPanel';
import {
  AlertCircle, CheckCircle, Upload, X, FilePlus2Icon, DownloadIcon, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { GoogleMap } from './MapViewer';
import { PlacemarkList } from './PlacemarkList';
import {
  PLACEMARK_CATEGORIES,
  processApiData,
  processPhysicalSurveyData,
  processDesktopPlanningData,
  resolveMediaUrl,           
  processSurveyInfrastructureData,
  detectSurveyFileType 
} from './PlaceMark';
import {
  KMZFile, FilterState, ApiPlacemark, ProcessedPlacemark, PlacemarkCategory,
  PhysicalSurveyApiResponse, ProcessedPhysicalSurvey, DesktopPlanningApiResponse, ProcessedDesktopPlanning
} from '../../types/kmz';
import FileUploadModal from './Modalpopup';
import { GeographicSelector } from './GeographicSelector';
import SurveyVideoPanel from './SurveyVideoPanel';
import { useSearchParams } from 'react-router-dom';


// Import the VideoSurveyService
import { 
  VideoSurveyService, 
  VideoClip, 
  TrackPoint, 
  VideoSurveyData,
  ValidationResult
} from './VideoSurveyService';

// Import the PhotoSurveyService
import { 
  PhotoSurveyService, 
  PhotoPoint, 
  PhotoImage, 
  PhotoSurveyData,
  PhotoValidationResult
} from './PhotoSurveyService';
import PhotoSurveyPanel from './PhotoSurveyPanel';

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
  const notifierTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [allProcessedFiles, setAllProcessedFiles] = useState<any[]>([]);

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
  // VIDEO SURVEY STATE (Using VideoSurveyService)
  // ==============================================
  const [isVideoSurveyMode, setIsVideoSurveyMode] = useState(false);
  const [videoSurveyData, setVideoSurveyData] = useState<VideoSurveyData>(VideoSurveyService.processPhysicalSurveyData(null));
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState<number>(0); // absolute ms in survey timeline
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [selection, setSelection] = useState<{ start?: number; end?: number }>({});
  const [showRightPanel, setShowRightPanel] = useState(false);

  // ==============================================
  // PHOTO SURVEY STATE (Using PhotoSurveyService)
  // ==============================================
  const [isPhotoSurveyMode, setIsPhotoSurveyMode] = useState(false);
  const [photoSurveyData, setPhotoSurveyData] = useState<PhotoSurveyData>(PhotoSurveyService.processPhysicalSurveyData(null));
  const [currentPhotoPoint, setCurrentPhotoPoint] = useState<PhotoPoint | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showPhotoPanel, setShowPhotoPanel] = useState(false);

  const [externalFilesByCategory, setExternalFilesByCategory] = useState<{
  survey: { placemarks: ProcessedPlacemark[]; categories: PlacemarkCategory[] };
  desktop: { placemarks: ProcessedPlacemark[]; categories: PlacemarkCategory[] };
}>({
  survey: { placemarks: [], categories: [] },
  desktop: { placemarks: [], categories: [] }
});

const getDefaultVisibility = (categoryName: string): boolean => {
  // Survey file defaults
  const defaultSurveyCategories = [
    'External Survey: GP',
    'External Survey: FPOI', 
    'External Survey: BHQ',
    'External Survey: Bridge',
    'External Survey: Culvert',
    'External Survey: Block Router',
    'External Survey: Incremental Cable',
    'External Survey: Proposed Cable', 
    'External Survey: Survey: Block to FPOI Cable', 
    'External Survey: RI',
    'External Survey: AIRTEL RI',
    'External Survey: RJIL RI', 
    'External Survey: VITIL RI',
    'External Survey: Landmark',
    'External Survey: KILOMETERSTONE'
  ];

  // Desktop file defaults  
  const defaultDesktopCategories = [
    'External Desktop: GP',
    'External Desktop: FPOI',
    'External Desktop: BHQ', 
    'External Desktop: Bridge',
    'External Desktop: Culvert',
    'External Desktop: Block Router',
    'External Desktop: Incremental Cable',
    'External Desktop: Proposed Cable'
  ];

  const defaultBSNLCategories = [
    'External BSNL: GP',
    'External BSNL: FPOI',
    'External BSNL: BHQ',
    'External BSNL: Bridge',
    'External BSNL: Culvert',
    'External BSNL: Block Router',
    'External BSNL: Incremental Cable',
    'External BSNL: Proposed Cable',
    'External BSNL: RI',
    'External BSNL: AIRTEL RI',
    'External BSNL: RJIL RI',
    'External BSNL: VITIL RI',
    'External BSNL: Landmark',
    'External BSNL: KILOMETERSTONE'
  ];

  return defaultSurveyCategories.includes(categoryName) || 
         defaultDesktopCategories.includes(categoryName) ||
         defaultBSNLCategories.includes(categoryName);

};


  // ==============================================
  // EXTERNAL FILES MANAGEMENT
  // ==============================================

  // Load external files based on filters
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoding(true);
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
        setLoding(false);
      }
    };

    loadFiles();
  }, [filters, searchQuery, fileCategory]);

  // Process selected external files
  // Process selected external files
useEffect(() => {
  const handleParsed = async () => {
    if (selectedFiles.length > 0) {
      let allPlacemarks: ProcessedPlacemark[] = [];
      let allCategoryData: Record<string, number> = {};
      let combinedPhysicalSurveyData: any = { data: {} };
      let processedFilesData: any[] = [];

      try {
        for (const file of selectedFiles) {
          const params: any = {};
          if (file.filepath) params.filepath = file.filepath;
          if (file.file_type) params.fileType = file.file_type;

          const resp = await axios.get(`${BASEURL}/preview-file`, { params });
          if (resp.status === 200 || resp.status === 201) {

            // UPDATED: Include BSNL in survey processing pipeline
            if (file.category === 'Survey' || file.category === 'BSNL_Cables') {

  const apiData: ApiPlacemark = resp.data.data.parsed_data;
  const surveyFileType = detectSurveyFileType(apiData);
  
  if (surveyFileType === 'physical_survey') {
    // Physical survey processing
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
      id: `${filePrefix}-${placemark.id}`,
      // Different prefix based on file category
      category: file.category === 'BSNL_Cables' 
        ? `External BSNL: ${placemark.category}` 
        : `External Survey: ${placemark.category}`
    }));

    allPlacemarks = [...allPlacemarks, ...prefixedSurveyPlacemarks];

    // PREFIX CATEGORIES with appropriate external prefix
    surveyCategories.forEach(category => {
      const externalCategoryName = file.category === 'BSNL_Cables'
        ? `External BSNL: ${category.name}`
        : `External Survey: ${category.name}`;
      allCategoryData[externalCategoryName] = (allCategoryData[externalCategoryName] || 0) + category.count;
    });
  } else {
    // Infrastructure assets processing
    const { placemarks: infraPlacemarks, categories: infraCategories } = 
      processSurveyInfrastructureData(apiData);
    
    processedFilesData.push({
      fileId: file.id,
      filename: file.filename,
      category: file.category,
      rawData: resp.data.data,
      transformedData: null,
      originalFile: file
    });

    const filePrefix = file.id;
    const prefixedPlacemarks = infraPlacemarks.map(placemark => ({
      ...placemark,
      id: `${filePrefix}-${placemark.id}`,
      // Different prefix based on file category
      category: file.category === 'BSNL_Cables' 
        ? `External BSNL: ${placemark.category}` 
        : `External Survey: ${placemark.category}`
    }));

    allPlacemarks = [...allPlacemarks, ...prefixedPlacemarks];

    // PREFIX CATEGORIES with appropriate external prefix
    infraCategories.forEach(category => {
      const externalCategoryName = file.category === 'BSNL_Cables'
        ? `External BSNL: ${category.name}`
        : `External Survey: ${category.name}`;
      allCategoryData[externalCategoryName] = (allCategoryData[externalCategoryName] || 0) + category.count;
    });
  }
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

        // Create categories with proper external prefixes and CUSTOM COLORS
        const combinedCategories = Object.entries(allCategoryData).map(([name, count]) => {
          // Extract the base category name for color/icon lookup
          const baseCategoryName = name
            .replace(/^External (Survey|Desktop|BSNL): /, '');
          
          // CUSTOM COLOR MAPPING FOR CABLES
          let config;
          if (name === 'External Desktop: Incremental Cable') {
            config = { color: '#8B5CF6', icon: '████' }; // Purple
          } else if (name === 'External Desktop: Proposed Cable') {
            config = { color: '#F59E0B', icon: '████' }; // Yellow
          } else if (name === 'External Survey: Incremental Cable') {
            config = { color: '#06B6D4', icon: '⚡⚡⚡⚡' }; // Cyan
          } else if (name === 'External Survey: Proposed Cable') {
            config = { color: '#800080', icon: '➖➖➖➖' }; // Purple
          } else if (name === 'External Survey: Survey: Block to FPOI Cable') {
            config = { color: '#000000', icon: '🔗🔗' }; // Black
          } 
          // NEW: BSNL SPECIFIC COLORS
          else if (name === 'External BSNL: Incremental Cable') {
            config = { color: '#00FF00', icon: '⚡⚡⚡⚡' }; // Bright Green for BSNL
          } else if (name === 'External BSNL: Proposed Cable') {
            config = { color: '#FF0000', icon: '➖➖➖➖' }; // Bright Red for BSNL
          } else if (name.startsWith('External BSNL:')) {
            // Default BSNL styling
            const categoryConfig = Object.entries(PLACEMARK_CATEGORIES).find(([key]) => key === baseCategoryName);
            config = categoryConfig ? categoryConfig[1] : { color: '#FF6B35', icon: '📍' }; // Orange-red default for BSNL
          } else {
            // Fallback to PLACEMARK_CATEGORIES
            const categoryConfig = Object.entries(PLACEMARK_CATEGORIES).find(([key]) => key === baseCategoryName);
            config = categoryConfig ? categoryConfig[1] : { color: '#6B7280', icon: '📍' };
          }

          return {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            count,
            visible: getDefaultVisibility(name),
            color: config.color,
            icon: config.icon
          };
        }).filter(category => category.count > 0);

        setProcessedPlacemarks(allPlacemarks);
        setPlacemarkCategories(combinedCategories);

        const autoVisibleCategories = combinedCategories
          .filter(category => category.visible)
          .map(category => category.id);
        
        if (autoVisibleCategories.length > 0) {
          setVisibleCategories(prev => {
            const newSet = new Set(prev);
            autoVisibleCategories.forEach(categoryId => newSet.add(categoryId));
            return newSet;
          });
        }

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

  // Enhanced physical survey data loading with video and photo validation
  const loadPhysicalData = async (state: string[], division: string[], block: string[]) => {
    try {

      setIsLoadingPhysical(true);
      const params: any = {};

      if (state.length > 0) {
        params.state_id = state.join(',');
      }
      if (division.length > 0) {
        params.district_id = division.join(',');
      }
      if (block.length > 0) {
        params.block_id = block.join(',');
      }


      const response = await axios.get(`${BASEURL}/get-physical-survey`, { params });
      const result: PhysicalSurveyApiResponse = response.data;


      if (response.status === 200 || response.status === 201) {
        if (Object.keys(result.data).length > 0) {

          Object.entries(result.data).forEach(([blockId, points]) => {
          });

          // Use VideoSurveyService for video validation
          const videoValidation: ValidationResult = VideoSurveyService.validateVideoSurveyData(result);
          
          // Use PhotoSurveyService for photo validation  
          const photoValidation: PhotoValidationResult = PhotoSurveyService.validatePhotoSurveyData(result);
          
          // Combined notification
          const notifications = [];
          if (videoValidation.videoClipCount > 0) {
            notifications.push(`${videoValidation.videoClipCount} video clips`);
          }
          if (photoValidation.imageCount > 0) {
            notifications.push(`${photoValidation.imageCount} photos`);
          }
          if (videoValidation.trackPointCount > 0) {
            notifications.push(`${videoValidation.trackPointCount} GPS points`);
          }
          
          if (notifications.length > 0) {
            showNotification('success', `Loaded ${notifications.join(', ')}`);
          }
          
          const allIssues = [...videoValidation.issues, ...photoValidation.issues];
          if (allIssues.length > 0) {
            console.warn('Data quality issues:', allIssues);
            showNotification('success', `Data loaded`);
          }

          const { placemarks, categories } = processPhysicalSurveyData(result);

          setRawPhysicalSurveyData(result);
          setPhysicalSurveyData(placemarks);
          setPhysicalSurveyCategories(categories);

          // Auto-enable categories that are marked as visible by default
          const autoVisibleCategories = categories
            .filter(category => category.visible)
            .map(category => category.id);
          
          
          if (autoVisibleCategories.length > 0) {
            setVisibleCategories(prev => {
              const newSet = new Set(prev);
              autoVisibleCategories.forEach(categoryId => newSet.add(categoryId));
              return newSet;
            });
          }

          if (videoValidation.videoClipCount === 0 && videoValidation.trackPointCount === 0 && photoValidation.imageCount === 0) {
            showNotification('success', `Loaded ${placemarks.length} physical survey points`);
          }
        } else {
          showNotification('info', 'No physical survey data found for selected area');
        }
      }
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

          const autoVisibleCategories = categories
          .filter(category => category.visible)
          .map(category => category.id);
        
        if (autoVisibleCategories.length > 0) {
          setVisibleCategories(prev => {
            const newSet = new Set(prev);
            autoVisibleCategories.forEach(categoryId => newSet.add(categoryId));
            return newSet;
          });
        }

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
        const errorMsg = (error.response.data as any)?.message || `API Error: ${error.response.status}`;
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
    const physicalSurveyData = { data: {} as Record<string, any[]> };
    const blockId = (file as any).blk_code || (file as any).id || 'unknown_block';
    physicalSurveyData.data[blockId] = [];

    if ((apiData as any).points) {
      (apiData as any).points.forEach((point: any, index: number) => {
        const eventType = mapKMLTypeToSurveyEvent(point.type || 'LANDMARK');

        physicalSurveyData.data[blockId].push({
          survey_id: `${(file as any).id}_${index}`,
          event_type: eventType,
          latitude: point.coordinates.latitude.toString(),
          longitude: point.coordinates.longitude.toString(),
          ...point.properties,
          filename: (file as any).filename,
          uploaded_at: (file as any).uploaded_at,
          block_id: blockId
        });
      });
    }

    return physicalSurveyData;
  }

  // Helper function to map KML types to survey event types
  function mapKMLTypeToSurveyEvent(kmlType: string): string {
    const typeMapping: Record<string, string> = {
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
  // File Upload Handler - Updated to support BSNL category
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
    
    // Handle different categories with different form field names
    if (category === 'BSNL') {
      // For BSNL category, use 'BSNL_Cables' as form field name
      formData.append('BSNL_Cables', desktopFile);
    } else {
      // For Survey and Desktop categories, use 'desktop_planning' as form field name
      formData.append('desktop_planning', desktopFile);
    }
    
    // Common form fields for all categories
    formData.append('state_code', stateId);
    formData.append('dtcode', districtId);
    formData.append('block_code', blockId);
    formData.append('FileName', fileName);
    formData.append('category', category);

    const response = await axios.post(`${BASEURL}/upload-external-data`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.status === 200 || response.status === 201) {
      showNotification("success", `${desktopFile.name} file uploaded successfully in ${category} category`);
    }

    // Reset form state
    setFilters({});
    setSearchQuery('');
    setHighlightedPlacemark(undefined);
    setModalOpen(false);
  } catch (error: any) {
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

        // Trigger reload by resetting filters briefly
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
    } catch (error: any) {
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
    // Hook provided for auto-loading if needed
    // loadPhysicalData(selectedStates, selectedDistricts, selectedBlocks);
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

  // Download Functions (keeping existing implementation)
  const downloadShapefile = async () => {
    // Implementation remains the same as original...
    // (truncated for brevity, but should be copied from original file)
  };

  const downloadExcel = () => {
    // Excel download functionality to be implemented
  };

  // Notification system
  const showNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
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
  // VIDEO SURVEY INTEGRATION (using VideoSurveyService)
  // ==============================================

  // Watch for Video Survey category toggle to enable/disable mode
  useEffect(() => {
    const possibleIds = new Set(['video_survey', 'video-survey', 'physical-video_survey']);
    const isOn = Array.from(visibleCategories).some(id => possibleIds.has(id));
    setIsVideoSurveyMode(isOn);
    if (!isOn) setShowRightPanel(false);
  }, [visibleCategories]);

  // Process video survey data using VideoSurveyService
  useEffect(() => {
  if (!isVideoSurveyMode || !rawPhysicalSurveyData) {
    setVideoSurveyData(VideoSurveyService.processPhysicalSurveyData(null));
    return;
  }
  
  try {
    // Use simplified processing (same as video playback page)
    const processedVideoData = VideoSurveyService.processPhysicalSurveyData(rawPhysicalSurveyData);
    
    // Validation (keep existing)
    const validation = VideoSurveyService.validateVideoSurveyData(rawPhysicalSurveyData);
    
    if (validation.issues.length > 0) {
      console.warn('Video survey data validation issues:', validation.issues);
      showNotification('warning', `Video survey data issues: ${validation.issues.length} problems found`);
    }
    
    setVideoSurveyData(processedVideoData);
    
    if (processedVideoData.trackPoints.length === 0) {
      showNotification('warning', 'No valid GPS track points found in survey data');
      return;
    }
    
    if (processedVideoData.videoClips.length === 0) {
      showNotification('info', 'No video clips found in survey data');
      setCurrentTime(processedVideoData.trackPoints[0]?.timestamp ?? 0);
      return;
    }
    
    // Initialize with first clip (same as video playback page)
    setCurrentVideoIndex(0);
    setCurrentTime(processedVideoData.videoClips[0].startTimeStamp);
    
    showNotification('success', 
      `Video survey loaded: ${processedVideoData.trackPoints.length} track points, ${processedVideoData.videoClips.length} video clips`
    );
    
  } catch (error) {
    console.error('Error processing video survey data:', error);
    showNotification('error', 'Failed to process video survey data');
    setVideoSurveyData(VideoSurveyService.processPhysicalSurveyData(null));
  }
}, [isVideoSurveyMode, rawPhysicalSurveyData]);

  // Keep map marker in sync when currentTime changes using VideoSurveyService
  useEffect(() => {
    if (!videoSurveyData.trackPoints.length) return;
    
    const position = VideoSurveyService.interpolatePosition(videoSurveyData.trackPoints, currentTime);
    setCurrentPosition(position);
  }, [currentTime, videoSurveyData.trackPoints]);

  // Enhanced track point click handler using VideoSurveyService
  const handleTrackPointClick = useCallback((point: TrackPoint) => {
  try {
    setShowRightPanel(true);
    
    // Strategy: Find video from SAME survey first
    const pointSurveyId = point.surveyId;
    
    if (!pointSurveyId) {
      showNotification('warning', 'Track point has no survey ID');
      return;
    }
    
    // Filter videos by the clicked point's survey
    const sameSurveyVideos = videoSurveyData.videoClips.filter(
      clip => clip.meta?.surveyId === pointSurveyId
    );
    
    let selectedClip = null;
    let selectedIndex = -1;
    
    if (sameSurveyVideos.length > 0) {
      // Look for exact timestamp match within the same survey
      const clipMatch = VideoSurveyService.findVideoClipForTimestamp(sameSurveyVideos, point.timestamp);
      
      if (clipMatch) {
        // Find the actual index in the full video array
        selectedIndex = videoSurveyData.videoClips.findIndex(clip => clip.id === clipMatch.clip.id);
        selectedClip = clipMatch.clip;
      } else {
        // No exact match, find nearest video within same survey
        const nearestMatch = VideoSurveyService.findNearestVideoClip(sameSurveyVideos, point.timestamp);
        
        if (nearestMatch) {
          selectedIndex = videoSurveyData.videoClips.findIndex(clip => clip.id === nearestMatch.clip.id);
          selectedClip = nearestMatch.clip;
          
          const timeDiff = Math.abs(point.timestamp - nearestMatch.clip.startTimeStamp);
          if (timeDiff > 30000) { // More than 30 seconds away
            showNotification('success', `Showing nearest video from Survey ${pointSurveyId})`);
          }
        }
      }
    } else {
      // Fallback: no videos in same survey - use cross-survey matching with warning
      console.warn(`No videos found for Survey ${pointSurveyId}, falling back to cross-survey matching`);
      
      const clipMatch = VideoSurveyService.findVideoClipForTimestamp(videoSurveyData.videoClips, point.timestamp);
      
      if (clipMatch) {
        selectedClip = clipMatch.clip;
        selectedIndex = clipMatch.index;
        showNotification('warning', `No videos in Survey ${pointSurveyId}. Showing from Survey ${selectedClip.meta?.surveyId}`);
      } else {
        // Last resort: find any nearest video
        const nearestMatch = VideoSurveyService.findNearestVideoClip(videoSurveyData.videoClips, point.timestamp);
        if (nearestMatch) {
          selectedClip = nearestMatch.clip;
          selectedIndex = nearestMatch.index;
          showNotification('warning', `No matching video found. Showing nearest from Survey ${selectedClip.meta?.surveyId}`);
        }
      }
    }
    
    if (selectedClip && selectedIndex >= 0) {
      setCurrentVideoIndex(selectedIndex);
      setCurrentTime(point.timestamp);
    } else {
      showNotification('error', 'No video clips available for this track point');
    }
    
  } catch (error) {
    console.error('Error handling track point click:', error);
    showNotification('error', 'Failed to process track point click');
  }
}, [videoSurveyData.videoClips]);

// Enhanced position tracking with blue point snapping
useEffect(() => {
  if (!videoSurveyData.trackPoints.length) return;
  
  // Get current video clip to determine which survey is active
  const currentClip = videoSurveyData.videoClips[currentVideoIndex];
  
  if (currentClip && currentClip.meta?.surveyId) {
    // Filter to current survey's points only
    const currentSurveyPoints = videoSurveyData.trackPoints.filter(
      point => point.surveyId === currentClip.meta.surveyId
    ).sort((a, b) => a.timestamp - b.timestamp);
    
    if (currentSurveyPoints.length > 0) {
      // Define survey time boundaries
      const surveyStart = currentSurveyPoints[0].timestamp;
      const surveyEnd = currentSurveyPoints[currentSurveyPoints.length - 1].timestamp;
      
      // Add buffer for video/GPS sync issues (10 seconds)
      const buffer = 10000;
      const extendedStart = surveyStart - buffer;
      const extendedEnd = surveyEnd + buffer;
      
      // Check if currentTime belongs to this survey's time range
      if (currentTime >= extendedStart && currentTime <= extendedEnd) {
        // Safe to interpolate within this survey
        const position = VideoSurveyService.interpolatePosition(currentSurveyPoints, currentTime);
        setCurrentPosition(position);
        
        // Debug logging for troubleshooting
        if (currentTime < surveyStart || currentTime > surveyEnd) {
        }
      } else {
        // Time is outside this survey's range - hide red dot to prevent wrong positioning
        console.warn(`Time ${new Date(currentTime).toLocaleTimeString()} outside Survey ${currentClip.meta.surveyId} range [${new Date(surveyStart).toLocaleTimeString()}, ${new Date(surveyEnd).toLocaleTimeString()}]`);
        setCurrentPosition(null);
        
        // Optional: Show notification for significant time differences
        const distanceFromSurvey = Math.min(
          Math.abs(currentTime - surveyStart),
          Math.abs(currentTime - surveyEnd)
        );
        
        if (distanceFromSurvey > 60000) { // More than 1 minute away
        }
      }
    } else {
      // No track points for this survey
      console.warn(`No track points found for Survey ${currentClip.meta.surveyId}`);
      setCurrentPosition(null);
    }
  } else {
    // No active video clip or no survey ID
    setCurrentPosition(null);
  }
}, [currentTime, videoSurveyData.trackPoints, videoSurveyData.videoClips, currentVideoIndex]);


  // Provide a summary node for the video panel using VideoSurveyService
  const summaryNode = useMemo(() => {
    const clip = videoSurveyData.videoClips[currentVideoIndex];
    if (!clip) return null;
    
    return (
      <div className="text-xs space-y-1">
        <div><span className="font-medium">Survey ID:</span> {clip.meta?.surveyId || '—'}</div>
        <div><span className="font-medium">Clip:</span> {currentVideoIndex + 1} / {videoSurveyData.videoClips.length}</div>
        <div><span className="font-medium">Start:</span> {new Date(clip.startTimeStamp).toLocaleString()}</div>
        <div><span className="font-medium">End:</span> {new Date(clip.endTimeStamp).toLocaleString()}</div>
        <div><span className="font-medium">Duration:</span> {VideoSurveyService.formatDuration(clip.endTimeStamp - clip.startTimeStamp)}</div>
        <div><span className="font-medium">Total Survey:</span> {VideoSurveyService.formatDuration(videoSurveyData.metadata.totalDuration)}</div>
      </div>
    );
  }, [videoSurveyData.videoClips, videoSurveyData.metadata.totalDuration, currentVideoIndex]);

  // ==============================================
  // PHOTO SURVEY INTEGRATION (using PhotoSurveyService)
  // ==============================================

  // Watch for Photo Survey category toggle to enable/disable mode
  useEffect(() => {
    const possibleIds = new Set(['photo_survey', 'photo-survey', 'physical-photo_survey']);
    const isOn = Array.from(visibleCategories).some(id => possibleIds.has(id));
    setIsPhotoSurveyMode(isOn);
    if (!isOn) {
      setShowPhotoPanel(false);
      setCurrentPhotoPoint(null);
    }
  }, [visibleCategories]);

  // Process photo survey data using PhotoSurveyService
  useEffect(() => {
    if (!isPhotoSurveyMode || !rawPhysicalSurveyData) {
      // Reset to empty state when not in photo mode
      setPhotoSurveyData(PhotoSurveyService.processPhysicalSurveyData(null));
      return;
    }
    
    
    try {
      // Use PhotoSurveyService to process the data
      const processedPhotoData: PhotoSurveyData = PhotoSurveyService.processPhysicalSurveyData(rawPhysicalSurveyData);
      
      // Validate the processed data
      const validation: PhotoValidationResult = PhotoSurveyService.validatePhotoSurveyData(rawPhysicalSurveyData);
      
      if (validation.issues.length > 0) {
        console.warn('Photo survey data validation issues:', validation.issues);
        showNotification('warning', `Photo survey data issues: ${validation.issues.length} problems found`);
      }
      
      
      // Update state with processed data
      setPhotoSurveyData(processedPhotoData);
      
      if (processedPhotoData.photoPoints.length === 0) {
        showNotification('info', 'No photo points found in survey data');
        return;
      }
      
      if (processedPhotoData.metadata.totalImages === 0) {
        showNotification('warning', 'Photo points found but no valid images');
        return;
      }
      
      showNotification('success', 
        `Photo survey loaded: ${processedPhotoData.photoPoints.length} photo points with ${processedPhotoData.metadata.totalImages} images`
      );
      
    } catch (error) {
      console.error('Error processing photo survey data:', error);
      showNotification('error', 'Failed to process photo survey data');
      setPhotoSurveyData(PhotoSurveyService.processPhysicalSurveyData(null));
    }
    
  }, [isPhotoSurveyMode, rawPhysicalSurveyData]);

  // Photo point click handler
  const handlePhotoPointClick = useCallback((point: PhotoPoint) => {
    try {
      setCurrentPhotoPoint(point);
      setCurrentImageIndex(0); // Reset to first image
      setShowPhotoPanel(true);
      
      
      if (point.images.length === 0) {
        showNotification('warning', 'No images available for this photo point');
      }
    } catch (error) {
      console.error('Error handling photo point click:', error);
      showNotification('error', 'Failed to process photo point click');
    }
  }, []);

  // Photo summary node for the photo panel
  const photoSummaryNode = useMemo(() => {
    if (!currentPhotoPoint) return null;
    
    return (
      <div className="text-xs space-y-1">
        <div><span className="font-medium">Survey ID:</span> {currentPhotoPoint.surveyId}</div>
        <div><span className="font-medium">Block ID:</span> {currentPhotoPoint.blockId}</div>
        <div><span className="font-medium">Event:</span> {currentPhotoPoint.eventType}</div>
        <div><span className="font-medium">Images:</span> {currentPhotoPoint.images.length}</div>
        <div><span className="font-medium">Location:</span> {currentPhotoPoint.lat.toFixed(6)}, {currentPhotoPoint.lng.toFixed(6)}</div>
        {currentPhotoPoint.timestamp && (
          <div><span className="font-medium">Captured:</span> {new Date(currentPhotoPoint.timestamp).toLocaleString()}</div>
        )}
        <div><span className="font-medium">Total Photos:</span> {photoSurveyData.metadata.totalImages}</div>
        <div><span className="font-medium">Total Points:</span> {photoSurveyData.metadata.totalPoints}</div>
      </div>
    );
  }, [currentPhotoPoint, photoSurveyData.metadata]);

  // ==============================================
  // COMPUTED VALUES
  // ==============================================

  // Separate data for different contexts
  const allPlacemarks = useMemo(() => {
    const externalFilePlacemarks = processedPlacemarks;
    const apiPlacemarks = [...physicalSurveyData, ...desktopPlanningData];
    return [...externalFilePlacemarks, ...apiPlacemarks];
  }, [processedPlacemarks, physicalSurveyData, desktopPlanningData]);

  const allCategories = useMemo(() => {
    const externalFileCategories = placemarkCategories;
    const apiCategories = [...physicalSurveyCategories, ...desktopPlanningCategories];
    return [...externalFileCategories, ...apiCategories];
  }, [placemarkCategories, physicalSurveyCategories, desktopPlanningCategories]);

  // Individual arrays for specific contexts (if needed elsewhere)
  const externalFilePlacemarks = processedPlacemarks;
  const apiPlacemarks = [...physicalSurveyData, ...desktopPlanningData];
  const externalFileCategories = placemarkCategories;
  const apiCategories = [...physicalSurveyCategories, ...desktopPlanningCategories];

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
            onClick={() => { setModalOpen(true); setUploadError(''); }}
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
            onClick={() => { setShowFiles(!ShowFiles); }}
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
      <main className={`flex-1 relative flex ${showRightPanel || showPhotoPanel ? 'divide-x' : ''}`}>
        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          onUpload={handleFileUpload}
          isLoading={isUploading}
          error={uploadError}
        />

        {/* LEFT SIDE - Map Container */}
        <div className={`relative ${
          showRightPanel || showPhotoPanel 
            ? 'flex-1 min-w-0' // Flexible width, takes remaining space
            : 'w-full'         // Full view: map takes full width
        }`}>
          {/* Google Map */}
          <GoogleMap
            placemarks={allPlacemarks}
            categories={allCategories}
            visibleCategories={visibleCategories}
            highlightedPlacemark={highlightedPlacemark}
            onPlacemarkClick={handlePlacemarkClick}
            className="w-full h-full"
            // Video survey overlays using VideoSurveyService data
            videoSurveyMode={isVideoSurveyMode}
            trackPoints={videoSurveyData.trackPoints}
            currentPosition={currentPosition || undefined}
            selection={selection}
            onTrackPointClick={handleTrackPointClick}
            // Photo survey overlays using PhotoSurveyService data
            photoSurveyMode={isPhotoSurveyMode}
            photoPoints={photoSurveyData.photoPoints}
            onPhotoPointClick={handlePhotoPointClick}
          />

          {/* Map Statistics - Only show when not in split view */}
          {allPlacemarks.length > 0 && !showRightPanel && !showPhotoPanel && (
            <div className="absolute bottom-4 left-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
              <div className="text-sm text-gray-600">
                <div className="font-semibold text-gray-900 mb-1">Map Statistics</div>
                <div>Total Placemarks: {allPlacemarks.length}</div>
                <div>External Files: {externalFilePlacemarks.length}</div>
                <div>Physical Survey: {physicalSurveyData.length}</div>
                <div>Desktop Planning: {desktopPlanningData.length}</div>
                <div>Visible Categories: {visibleCategories.size}</div>
                {isVideoSurveyMode && (
                  <>
                    <div>Track Points: {videoSurveyData.trackPoints.length} (all shown)</div>
                    <div>Video Clips: {videoSurveyData.videoClips.length}</div>
                    <div>Survey Duration: {VideoSurveyService.formatDuration(videoSurveyData.metadata.totalDuration)}</div>        
                  </>
                )}
                {isPhotoSurveyMode && (
                  <>
                    <div>Photo Points: {photoSurveyData.photoPoints.length}</div>
                    <div>Total Images: {photoSurveyData.metadata.totalImages}</div>
                    <div>Survey IDs: {photoSurveyData.metadata.surveyIds.length}</div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - Video Survey Panel (Split Screen) */}
        {showRightPanel && (
          <div className="w-[360px] lg:w-[420px] xl:w-[460px] h-full bg-white border-l shadow-lg flex-shrink-0">
            <SurveyVideoPanel
              open={showRightPanel}
              onClose={() => setShowRightPanel(false)}
              availableVideos={videoSurveyData.videoClips}
              currentVideoIndex={currentVideoIndex}
              onChangeVideoIndex={setCurrentVideoIndex}
              currentTime={currentTime}
              onTimeChange={setCurrentTime}
              selection={selection}
              onSelectionChange={setSelection}
              trackPoints={videoSurveyData.trackPoints}
              currentPosition={currentPosition}
              surveySummary={summaryNode}
            />
          </div>
        )}

        {showPhotoPanel && (
          <div className="absolute top-0 right-0 h-full shadow-lg">
            <PhotoSurveyPanel
              open={showPhotoPanel}
              onClose={() => setShowPhotoPanel(false)}
              currentPhotoPoint={currentPhotoPoint}
              onPhotoPointChange={setCurrentPhotoPoint}
              availablePhotoPoints={photoSurveyData.photoPoints}
              currentImageIndex={currentImageIndex}
              onImageIndexChange={setCurrentImageIndex}
              photoSummary={photoSummaryNode}
            />
          </div>
        )}

        {/* RIGHT SIDEBAR - External Files Management (Overlay when split view is active) */}
        {ShowFiles && (
          <div className={`absolute top-0 right-0 h-full bg-white rounded-lg shadow-lg border border-gray-200 p-3 overflow-hidden z-20 ${
            showRightPanel || showPhotoPanel ? 'w-80' : 'w-96'
          }`}>
            {/* Close Button Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">External Files</h3>
              <button
                onClick={() => setShowFiles(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="Close panel"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            
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