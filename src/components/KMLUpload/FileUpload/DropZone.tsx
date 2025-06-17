import React, { useState, useRef, useCallback } from 'react';
import { Upload, AlertCircle} from 'lucide-react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  multiple?: boolean;
  className?: string;
}

const DropZone: React.FC<DropZoneProps> = ({
  onFilesAdded,
  multiple = false,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = useCallback(
    (file: File): boolean => {
    // Check file type (KML only)
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'kml') {
        setError('Only KML files are allowed');
        return false;
      }

      setError(null);
      return true;
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const { files } = e.dataTransfer;
      if (!files || files.length === 0) return;

      const validFiles = Array.from(files).filter(validateFile);
      
      if (validFiles.length > 0) {
        onFilesAdded(multiple ? validFiles : [validFiles[0]]);
      }
    },
    [onFilesAdded, validateFile, multiple]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (!files || files.length === 0) return;

      const validFiles = Array.from(files).filter(validateFile);
      
      if (validFiles.length > 0) {
        onFilesAdded(multiple ? validFiles : [validFiles[0]]);
      }
      
      // Reset the input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onFilesAdded, validateFile, multiple]
  );

  const handleButtonClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg transition-all duration-300 ease-in-out ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          accept=".kml"
          multiple={multiple}
        />
        
        <div className="flex flex-col items-center">
          <Upload
            className={`w-12 h-12 mb-3 ${
              isDragging ? 'text-blue-500' : 'text-gray-400'
            }`}
          />
          <p className="mb-2 text-sm text-gray-700">
            <span className="font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">KML files only</p>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center text-red-500 text-sm mt-2">
            <AlertCircle className="w-4 h-4 mr-1" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DropZone;