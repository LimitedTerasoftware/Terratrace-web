import React from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface UploadButtonProps {
  onClick: () => void;
  isUploading: boolean;
  disabled?: boolean;
  className?: string;
  text?: string;
}

const UploadButton: React.FC<UploadButtonProps> = ({
  onClick,
  isUploading,
  disabled = false,
  className = '',
  text = 'Upload Files',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isUploading}
      className={`relative inline-flex items-center justify-center px-6 py-3 font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isUploading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <Upload className="w-4 h-4 mr-2" />
          {text}
        </>
      )}
    </button>
  );
};

export default UploadButton;