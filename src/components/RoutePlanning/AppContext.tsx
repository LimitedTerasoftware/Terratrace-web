import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types
interface AppContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  mode: 'auto' | 'ai';
  setMode: (mode: 'auto' | 'ai') => void;
  transportMode: 'car' | 'bike' | 'walk';
  setTransportMode: (mode: 'car' | 'bike' | 'walk') => void;
  apiGPSResponse: any;
  setGPSApiResponse: (data: any) => void;
  apiConctResponse: any;
  setConctApiResponse: (data: any) => void;
  PointProperties:any;
  setPointProperties: (data: any) => void;
  AutoMode:boolean;
  setAutoMode: (data: boolean) => void;
  AIMode:boolean;
  setAIMode: (data: boolean) => void;
  SaveFile:boolean;
  setSaveFile:(data:boolean) => void;
  DownloadFile:any;
  setDownloadFile: (data: any) => void;
  gpFile:File | null;
  setGpFile:(data:File | null) => void;
  incrementalFile:File | null;
  setIncrementalFile:(data:File | null) => void;
  
  // *****Related to the bulk Upload Modal*****
  // Controls visibility of the bulk upload modal throughout the application
  isBulkUploadModalOpen: boolean;
  // Function to toggle or set the visibility state of the bulk upload modal
  setBulkUploadModalOpen: (isOpen: boolean) => void;
  lineSummary:boolean;
  setLineSummary:(data:boolean) => void;
  VerifySaveFile:boolean;
  setVerifySaveFile:(data:boolean) => void;

  // *****Session Storage Data*****
  // Preview KML data from session storage
  previewKmlData: string | null;
  setPreviewKmlData: (data: string | null) => void;
  // Function to check and load session storage data
  loadPreviewKmlData: () => void;
}

// Create context with default values
const AppContext = createContext<AppContextType>({
  isSidebarOpen: true,
  toggleSidebar: () => {},
  mode: 'auto',
  setMode: () => {},
  transportMode: 'car',
  setTransportMode: () => {},
  apiGPSResponse:() => {},
  setGPSApiResponse:() => {},
  apiConctResponse:() => {},
  setConctApiResponse:() => {},
  PointProperties:() => {},
  setPointProperties:() => {},
  AutoMode:false,
  setAutoMode:()=>{},
  AIMode:false,
  setAIMode:()=>{},
  SaveFile:false,
  setSaveFile:()=>{},
  DownloadFile:()=>{},
  setDownloadFile:()=>{},
  gpFile:null,
  setGpFile:()=>{},
  incrementalFile: null,
  setIncrementalFile:()=>{},
  
  // *****Related to the bulk Upload Modal*****
  // Default state is closed (false)
  isBulkUploadModalOpen: false,
  // Empty function placeholder for the setter
  setBulkUploadModalOpen: () => {},
  lineSummary:true,
  setLineSummary:() => {},
  VerifySaveFile:false,
  setVerifySaveFile:()=>{},

  // *****Session Storage Data*****
  previewKmlData: null,
  setPreviewKmlData: () => {},
  loadPreviewKmlData: () => {},
});

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mode, setMode] = useState<'auto' | 'ai'>('auto');
  const [transportMode, setTransportMode] = useState<'car' | 'bike' | 'walk'>('car');
  const [apiGPSResponse, setGPSApiResponse] = useState<any>(null);
  const [apiConctResponse, setConctApiResponse] = useState<any>(null);
  const [PointProperties, setPointProperties] = useState<any>(null);
  const [AutoMode,setAutoMode]=useState(false);
  const [AIMode,setAIMode]=useState(false);
  const[SaveFile,setSaveFile]=useState(false);
  const[DownloadFile,setDownloadFile]=useState<any>('');
  const [gpFile, setGpFile] = useState<File | null>(null);
  const [incrementalFile, setIncrementalFile] = useState<File | null>(null);
  const [lineSummary, setLineSummary] = useState(true);
  const[VerifySaveFile,setVerifySaveFile]=useState(false);

  // *****Related to the bulk Upload Modal*****
  // State to track if the bulk upload modal is currently visible
  const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);

  // *****Session Storage Data*****
  const [previewKmlData, setPreviewKmlData] = useState<string | null>(null);

  // Function to load preview KML data from session storage
  const loadPreviewKmlData = () => {
    try {
      const data = sessionStorage.getItem('previewKmlData');
      setPreviewKmlData(data);
      
      // Optional: Clear session storage after loading
      if (data) {
        console.log('Preview KML data loaded successfully from sessionStorage');
      } else {
        console.log('No previewKmlData found in sessionStorage');
      }
    } catch (error) {
      console.error('Error loading previewKmlData from sessionStorage:', error);
      setPreviewKmlData(null);
    }
  };

  // Effect to handle window resize and adjust sidebar state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Effect to automatically load preview KML data on component mount
  useEffect(() => {
    loadPreviewKmlData();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const value = {
    isSidebarOpen,
    toggleSidebar,
    mode,
    setMode,
    transportMode,
    setTransportMode,
    apiGPSResponse,
    setGPSApiResponse,
    apiConctResponse,
    setConctApiResponse,
    PointProperties,
    setPointProperties,
    AutoMode,
    setAutoMode,
    AIMode,
    setAIMode,
    SaveFile,
    setSaveFile,
    DownloadFile,
   setDownloadFile,
    gpFile,
    setGpFile,
    incrementalFile,
    setIncrementalFile,
    
    // *****Related to the bulk Upload Modal*****
    // Expose the bulk upload modal visibility state to all components
    isBulkUploadModalOpen,
    // Expose the setter function to allow components to open/close the modal
    setBulkUploadModalOpen,
    lineSummary,
    setLineSummary,
    VerifySaveFile,
    setVerifySaveFile,

    // *****Session Storage Data*****
    previewKmlData,
    setPreviewKmlData,
    loadPreviewKmlData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);