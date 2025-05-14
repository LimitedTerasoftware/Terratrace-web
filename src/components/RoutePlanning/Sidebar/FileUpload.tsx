import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { useAppContext } from '../AppContext';

const FileUpload: React.FC = () => {
  const {setGPSApiResponse,setConctApiResponse} = useAppContext();
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [gpFile, setGpFile] = useState<File | null>(null);
  const [incrementalFile, setIncrementalFile] = useState<File | null>(null);

const handleGpPoints = async (file:File) => {

  try {
    const formData = new FormData();
    formData.append('pointsFile', file);

    const response = await fetch(`http://traceapi.keeshondcoin.com/upload-points`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json(); 
    setGPSApiResponse(data);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

const handleIncrementalPoints = async (file:File) => {

  try {
    const formData = new FormData();
    formData.append('connectionsFile', file);

    const response = await fetch(`http://traceapi.keeshondcoin.com/upload-connections`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json(); 
     setConctApiResponse(data);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

  return (
    <div className="space-y-4 mb-6">
      <div className="border rounded-md p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Gp Points File</h3>
          <span className="text-xs text-gray-500">KML-text/kml</span>
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
            <Upload size={16} className="text-gray-500" />
          </label>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium text-sm">Incremental File</h3>
          <span className="text-xs text-gray-500">KML-text/kml</span>
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
            <Upload size={16} className="text-gray-500" />
          </label>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;