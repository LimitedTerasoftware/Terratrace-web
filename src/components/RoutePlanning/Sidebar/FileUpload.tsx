import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { useAppContext } from '../AppContext';

const FileUpload: React.FC = () => {
  const {setGPSApiResponse,setConctApiResponse,gpFile, setGpFile,incrementalFile, setIncrementalFile,setPreviewKmlData} = useAppContext();
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [loadingpoints, setLoadingPoints] = useState(false);
  const [loadingconnections, setLoadingConnections] = useState(false);
  const BASEURL_Val = import.meta.env.VITE_TraceAPI_URL;

const handleGpPoints = async (file:File) => {

  try {
    const formData = new FormData();
    formData.append('pointsFile', file);
    setLoadingPoints(true);
    const response = await fetch(`${BASEURL_Val}/upload-points`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json(); 
    setPreviewKmlData(null)
    setGPSApiResponse(data);
  } catch (error) {
    console.error('Error uploading file:', error);
  }finally{
      setLoadingPoints(false);
  }
};

const handleIncrementalPoints = async (file:File) => {

  try {
    const formData = new FormData();
    formData.append('connectionsFile', file);
   setLoadingConnections(true);
    const response = await fetch(`${BASEURL_Val}/upload-connections`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json(); 
      setPreviewKmlData(null)
     setConctApiResponse(data);
  } catch (error) {
    console.error('Error uploading file:', error);
  }finally{
      setLoadingConnections(false);
  }
};

  return (
    <div className="space-y-4 mb-6">
      <div className="border rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Gp Points File</h3>
          <span className="text-xs text-gray-500">KML/kml</span>
        </div>
        <div className="relative mb-4">
          <input
            type="file"
            id="gpFile"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setGpFile(e.target.files?.[0] || null);
              if (file) handleGpPoints(file);
            }}
            accept=".kml,.txt"
          />
          <label
            htmlFor="gpFile"
            className="flex items-center justify-between cursor-pointer text-sm p-2 bg-gray-50 border rounded hover:bg-gray-100 transition-colors"
          >
            <span className="truncate">{gpFile ? gpFile.name : 'Choose file...'}</span>

            {loadingpoints ? (
              <svg className="animate-spin h-4 w-4 text-gray-500 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Upload size={16} className="text-gray-500" />
            )}

          </label>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Incremental File</h3>
          <span className="text-xs text-gray-500">KML/kml</span>
        </div>
        <div className="relative">
          <input
            type="file"
            id="incrementalFile"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setIncrementalFile(e.target.files?.[0] || null);
              if (file) handleIncrementalPoints(file);
            }}
            accept=".kml,.txt"
          />
          <label
            htmlFor="incrementalFile"
            className="flex items-center justify-between cursor-pointer text-sm p-2 bg-gray-50 border rounded hover:bg-gray-100 transition-colors"
          >
            <span className="truncate">{incrementalFile ? incrementalFile.name : 'Choose file...'}</span>
              {loadingconnections ? (
              <svg className="animate-spin h-4 w-4 text-gray-500 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <Upload size={16} className="text-gray-500" />
            )}
          </label>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;