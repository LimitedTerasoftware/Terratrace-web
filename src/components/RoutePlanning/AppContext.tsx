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
  SetSaveFile:(data:boolean) => void;
  DownloadFile:any;
  SetDownloadFile: (data: any) => void;
  gpFile:File | null;
  setGpFile:(data:File | null) => void;
  incrementalFile:File | null;
  setIncrementalFile:(data:File | null) => void;


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
  SetSaveFile:()=>{},
  DownloadFile:()=>{},
  SetDownloadFile:()=>{},
  gpFile:null,
  setGpFile:()=>{},
  incrementalFile: null,
  setIncrementalFile:()=>{},
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
  const[SaveFile,SetSaveFile]=useState(false);
  const[DownloadFile,SetDownloadFile]=useState<any>('');
  const [gpFile, setGpFile] = useState<File | null>(null);
  const [incrementalFile, setIncrementalFile] = useState<File | null>(null);


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
    SetSaveFile,
    DownloadFile,
    SetDownloadFile,
    gpFile,
    setGpFile,
    incrementalFile,
    setIncrementalFile,

  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useAppContext = () => useContext(AppContext);