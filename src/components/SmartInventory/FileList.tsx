import React from 'react';
import { FileText, Download, Trash2, MapPin, Check } from 'lucide-react';
import { KMZFile } from '../../types/kmz';
import { saveAs } from 'file-saver';

interface FileListProps {
  files: KMZFile[];
  selectedFileIds: string[];
  onFileSelect: (file: KMZFile, isMultiSelect?: boolean) => void;
  onFileDelete: (id: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ 
  files, 
  selectedFileIds, 
  onFileSelect, 
  onFileDelete 
}) => {
  const handleDownload = (file: KMZFile, event: React.MouseEvent) => {
    event.stopPropagation();
    const blob = new Blob([file.originalData], { type: 'application/vnd.google-earth.kmz' });
    saveAs(blob, `${file.name}.kmz`);
  };

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this file?')) {
      onFileDelete(id);
    }
  };

  const handleFileClick = (file: KMZFile, event: React.MouseEvent) => {
    const isMultiSelect = event.ctrlKey || event.metaKey;
    onFileSelect(file, isMultiSelect);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No KMZ files uploaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Saved Files ({files.length})
        </h3>
        {selectedFileIds.length > 1 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            {selectedFileIds.length} selected
          </span>
        )}
      </div>
      
      <div className="text-xs text-gray-500 mb-2">
        Hold Ctrl/Cmd to select multiple files
      </div>

      {files.map((file) => {
        const isSelected = selectedFileIds.includes(file.id);
        
        return (
          <div
            key={file.id}
            onClick={(e) => handleFileClick(file, e)}
            className={`
              p-3 rounded-lg border cursor-pointer transition-all duration-200 relative
              ${isSelected
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              }
            `}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {file.placemarks.length} markers
                  </span>
                  <span>{formatFileSize(file.size)}</span>
                  <span>{formatDate(file.uploadDate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={(e) => handleDownload(file, e)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(file.id, e)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};