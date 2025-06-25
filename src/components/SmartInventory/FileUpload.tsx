import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import FileUploadModal from './Modalpopup';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading, error }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.toLowerCase().endsWith('.kmz') || file.name.toLowerCase().endsWith('.kml'))) {
      onFileUpload(file);
    } else if (file) {
      alert('Please select a .kmz or .kml file');
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-6">
      <button
         onClick={handleClick}
        disabled={isLoading}
        className={`
          w-full px-4 py-3 rounded-lg border-2 border-dashed 
          ${isLoading 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 cursor-pointer'
          }
          transition-all duration-200 flex items-center justify-center gap-2
          text-sm font-medium text-gray-700
        `}
      >
        {isLoading ? (
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

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".kmz,.kml"
        onChange={handleFileChange}
        className="hidden"
      />
    
    </div>
  );
};