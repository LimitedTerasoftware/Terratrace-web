import React, { useState, useCallback } from 'react';
import DropZone from './DropZone';
import FileItem, { FileStatus } from './FileItem';
import UploadButton from './UploadButton';
import { CheckCircle } from 'lucide-react';
import axios from 'axios';

interface FileWithStatus {
  file: File;
  id: string;
  status: FileStatus;
  progress: number;
  error?: string;
}

interface FileUploadManagerProps {
  onUploadComplete?: (file: File) => void;
   className?: string;
}

const FileUploadManager: React.FC<FileUploadManagerProps> = ({
  onUploadComplete,
  className = '',
}) => {
  const [fileObj, setFileObj] = useState<FileWithStatus | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [KmlData,setKmlData]= useState([]);

  const handleFilesAdded = useCallback(
    (newFiles: File[]) => {
      if (uploadComplete) {
        setUploadComplete(false);
      }

      const file = newFiles[0]; // Only take the first file
      setFileObj({
        file,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        status: 'idle' as FileStatus,
        progress: 0,
      });
    },
    [uploadComplete]
  );

  const handleRemoveFile = useCallback(() => {
    setFileObj(null);
    setUploadComplete(false);
  }, []);

  
  const simulateUpload = useCallback(async () => {
    if (!fileObj || isUploading) return;

    setIsUploading(true);
    setUploadComplete(false);

    // Update file to uploading status
    setFileObj((prev) => prev ? {
      ...prev,
      status: 'uploading',
      progress: 0,
    } : null);

  try {
    const formData = new FormData();
    formData.append('filteredPointsFile', fileObj.file);

    const response = await axios.post(
      'https://traceapi.keeshondcoin.com/upload-filtered-points',
      formData,
      {
      // responseType: 'blob',
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setFileObj((prev) => prev ? { ...prev, progress: percentCompleted } : null);
        } else {
            setFileObj((prev) => prev ? { ...prev, progress: 50 } : null);
        }
        }

      }
     
    );
    const Data = response.data;
    setKmlData(Data.points)
    setFileObj((prev) => prev ? {
      ...prev,
      status: 'success',
      progress: 100,
    } : null);

    if (onUploadComplete && Data && response.status === 200) {
      onUploadComplete(Data);
      setUploadComplete(true);
    }

  } catch (error) {
      console.error('Upload error:', error);

    setFileObj((prev) => prev ? {
      ...prev,
      status: 'error',
      error: 'Upload failed. Please try again.',
    } : null);
  }

  setIsUploading(false);

  }, [fileObj, isUploading, onUploadComplete]);




 const handleDownload = (points: any[]) => {
  if (!points || !points.length) {
    alert('No filtered points to download.');
    return;
  }
   setIsDownloading(true)

  let kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n  <Document>\n    <name>Parsed KML Points</name>`;
  
  points.forEach(point => {
    if (
      Array.isArray(point.coordinates) &&
      point.coordinates.length >= 2 &&
      typeof point.coordinates[0] === 'number' && !isNaN(point.coordinates[0]) &&
      typeof point.coordinates[1] === 'number' && !isNaN(point.coordinates[1])
    ) {
      kml += `
    <Placemark>
      <name>${point.name || 'Unnamed'}</name>`;
      if (point.properties && typeof point.properties === 'object') {
        kml += `
      <ExtendedData>`;
        Object.entries(point.properties)
          .filter(([_, value]) => value !== null && value !== '' && value !== 'NULL')
          .forEach(([key, value]) => {
            kml += `
        <Data name="${key}">
          <value>${value}</value>
        </Data>`;
          });
        kml += `
      </ExtendedData>`;
      }
      kml += `
      <Point>
        <coordinates>${point.coordinates[0]},${point.coordinates[1]}</coordinates>
      </Point>
    </Placemark>`;
    }
  });

  kml += `
  </Document>
</kml>`;

  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'parsed_kml_points.kml';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a); 
  setIsDownloading(false)
}


  const canUpload = fileObj && !isUploading && fileObj.status !== 'success';

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Success message */}
      {uploadComplete && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4 text-green-800 flex items-center animate-fadeIn">
          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
          <span>File has been successfully uploaded!</span>
        </div>
     
      )}

      {/* Drop zone */}
      {!fileObj && (
        <DropZone
          onFilesAdded={handleFilesAdded}
          multiple={false}
          className="mb-4"
        />
      )}

      {/* File item */}
      {fileObj && (
        <div className="mb-4">
          <div className="mb-2 text-sm font-medium text-gray-700">Selected file</div>
          <FileItem
            file={fileObj.file}
            status={fileObj.status}
            progress={fileObj.progress}
            error={fileObj.error}
            onRemove={handleRemoveFile}
          />
        </div>
      )}

      {/* Upload button */}
      {fileObj && !uploadComplete && (
        <div className="flex justify-end">
          <UploadButton
            onClick={simulateUpload}
            isUploading={isUploading}
            disabled={!canUpload}
            text="Upload File"
          />
        </div>
      )}
      {uploadComplete && fileObj && (
        <div className="flex justify-end">
          <UploadButton
            onClick={()=>handleDownload(KmlData)}
            isUploading={isDownloading}
            // disabled={!canUpload}
            text="Download"
           
          />
        </div>
      )}
    </div>
  );
};

export default FileUploadManager;