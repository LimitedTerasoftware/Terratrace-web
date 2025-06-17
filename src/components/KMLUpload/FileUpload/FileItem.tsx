import React, { useState, useEffect } from 'react';
import { FileType2, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';

export type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FileItemProps {
  file: File;
  status: FileStatus;
  progress?: number;
  error?: string;
  onRemove: () => void;
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  status,
  progress = 0,
  error,
  onRemove,
}) => {
  // Animation for progress bar
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);

    return () => clearTimeout(timeout);
  }, [progress]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200 mb-2 group relative overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Progress bar (background) */}
      {status === 'uploading' && (
        <div 
          className="absolute left-0 top-0 h-full bg-blue-50 transition-all duration-700 ease-out"
          style={{ width: `${animatedProgress}%` }}
        />
      )}
      
      {/* File icon */}
      <div className="flex-shrink-0 mr-3">
        {status === 'uploading' ? (
          <div className="rounded-full bg-blue-100 p-2">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        ) : status === 'success' ? (
          <div className="rounded-full bg-green-100 p-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        ) : status === 'error' ? (
          <div className="rounded-full bg-red-100 p-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        ) : (
          <div className="rounded-full bg-gray-100 p-2">
            <FileType2 className="w-5 h-5 text-gray-500" />
          </div>
        )}
      </div>
      
      {/* File details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <div className="flex items-center text-xs text-gray-500 mt-0.5">
          <span className="mr-2">{formatFileSize(file.size)}</span>
          {status === 'uploading' && (
            <span>{progress}%</span>
          )}
          {status === 'error' && error && (
            <span className="text-red-500">{error}</span>
          )}
        </div>
      </div>
      
      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="p-1 ml-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FileItem;