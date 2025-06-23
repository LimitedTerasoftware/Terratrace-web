import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { FileUpload } from './FileUpload';
import { FileList } from './FileList';
import { FilterPanel } from './FilterPanel';
import { PlacemarkList } from './PlacemarkList';
import { MapViewer } from './MapViewer';
import { KMZParser } from '../../utils/kmzParser';
import { dbOperations } from '../../utils/databasee';
import { useFiltering } from '../../hooks/useFiltering';
import { KMZFile, FilterState, ViewState, Placemark } from '../../types/kmz';

function SmartInventory() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [files, setFiles] = useState<KMZFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<KMZFile[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedPlacemark, setHighlightedPlacemark] = useState<Placemark>();
  const [visiblePlacemarks, setVisiblePlacemarks] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [viewState, setViewState] = useState<ViewState>({
    center: { lat: 20.5937, lng: 78.9629 }, // Center of India
    zoom: 5,
    mapType: 'satellite'
  });

  // Combine placemarks from all selected files
  const allPlacemarks = selectedFiles.flatMap(file => file.placemarks);
  // Filter placemarks based on current filters and search
  const filteredPlacemarks = useFiltering(
    allPlacemarks,
    filters,
    searchQuery
  );
  // Get visible filtered placemarks
  const visibleFilteredPlacemarks = filteredPlacemarks.filter(placemark => 
    visiblePlacemarks.has(placemark.id)
  );
  // Memoize the view state change handler to prevent infinite loops
  const handleViewStateChange = useCallback((newViewState: ViewState) => {
    setViewState(prevState => {
      // Only update if there's a meaningful change
      const hasChanged = 
        Math.abs(prevState.center.lat - newViewState.center.lat) > 0.0001 ||
        Math.abs(prevState.center.lng - newViewState.center.lng) > 0.0001 ||
        prevState.zoom !== newViewState.zoom ||
        prevState.mapType !== newViewState.mapType;
      
      return hasChanged ? newViewState : prevState;
    });
  }, []);

  // Load saved files on app start
  useEffect(() => {
    const loadFiles = async () => {
      try {
        const savedFiles = await dbOperations.getAllKMZ();
        setFiles(savedFiles);
        if (savedFiles.length > 0) {
          setSelectedFiles([savedFiles[0]]);
        }
      } catch (error) {
        console.error('Failed to load files:', error);
      }
    };
    loadFiles();
  }, []);

  // Update visible placemarks when selected files change
  useEffect(() => {
    if (selectedFiles.length > 0) {
      const allPlacemarkIds = new Set(allPlacemarks.map(p => p.id));
     
      setVisiblePlacemarks(allPlacemarkIds);
    } else {
      setVisiblePlacemarks(new Set());
    }
  }, [selectedFiles]); // Only depend on length to avoid infinite loops
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError('');
    
    try {
      const kmzFile = await KMZParser.parseKMZ(file);
      await dbOperations.saveKMZ(kmzFile);
      
      const updatedFiles = await dbOperations.getAllKMZ();
      setFiles(updatedFiles);
      setSelectedFiles([kmzFile]);
      
      // Reset filters when switching files
      setFilters({});
      setSearchQuery('');
      setHighlightedPlacemark(undefined);
      
    } catch (error) {
      console.error('Failed to upload file:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file selection (multiple selection support)
  const handleFileSelect = useCallback((file: KMZFile, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      setSelectedFiles(prev => {
        const isAlreadySelected = prev.some(f => f.id === file.id);
        if (isAlreadySelected) {
          // Remove from selection
          return prev.filter(f => f.id !== file.id);
        } else {
          // Add to selection
          return [...prev, file];
        }
      });
    } else {
      // Single selection
      setSelectedFiles([file]);
    }
    
    // Reset filters and search when changing selection
    setFilters({});
    setSearchQuery('');
    setHighlightedPlacemark(undefined);
  }, []);

  // Handle file deletion
  const handleFileDelete = async (id: string) => {
    try {
      await dbOperations.deleteKMZ(id);
      const updatedFiles = await dbOperations.getAllKMZ();
      setFiles(updatedFiles);
      
      // Remove from selected files if it was selected
      setSelectedFiles(prev => prev.filter(f => f.id !== id));
      
      // If no files selected, select the first available
      if (selectedFiles.length === 1 && selectedFiles[0].id === id && updatedFiles.length > 0) {
        setSelectedFiles([updatedFiles[0]]);
      }
      
      setFilters({});
      setSearchQuery('');
      setHighlightedPlacemark(undefined);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  // Handle search with highlighting
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.trim() && allPlacemarks.length > 0) {
      // Find first matching placemark
      const matchingPlacemark = allPlacemarks.find(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchingPlacemark) {
        setHighlightedPlacemark(matchingPlacemark);
      }
    } else {
      setHighlightedPlacemark(undefined);
    }
  }, [allPlacemarks]);

  // Handle placemark click
  const handlePlacemarkClick = useCallback((placemark: Placemark) => {
    setHighlightedPlacemark(placemark);
  }, []);

  // Handle placemark visibility change
  const handlePlacemarkVisibilityChange = useCallback((placemarkId: string, visible: boolean) => {
    setVisiblePlacemarks(prev => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(placemarkId);
      } else {
        newSet.delete(placemarkId);
      }
      return newSet;
    });
  }, []);

  // Safe sidebar toggle function
  const handleSidebarToggle = useCallback(() => {
    try {
      setSidebarOpen(prev => !prev);
    } catch (error) {
      console.error('Error toggling sidebar:', error);
      // Fallback: force sidebar state
      setSidebarOpen(false);
    }
  }, []);

  // Create combined metadata for filtering
  const combinedMetadata = {
    states: [...new Set(selectedFiles.flatMap(f => f.metadata?.states || []))].sort(),
    divisions: [...new Set(selectedFiles.flatMap(f => f.metadata?.divisions || []))].sort(),
    blocks: [...new Set(selectedFiles.flatMap(f => f.metadata?.blocks || []))].sort(),
    categories: [...new Set(selectedFiles.flatMap(f => f.metadata?.categories || []))].sort(),
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle}>
        <FileUpload
          onFileUpload={handleFileUpload}
          isLoading={isUploading}
          error={uploadError}
        />
        
        <FileList
          files={files}
          selectedFileIds={selectedFiles.map(f => f.id)}
          onFileSelect={handleFileSelect}
          onFileDelete={handleFileDelete}
        />
        
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          metadata={combinedMetadata}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          selectedFilesCount={selectedFiles.length}
        />

        <PlacemarkList
          placemarks={filteredPlacemarks}
          visiblePlacemarks={visiblePlacemarks}
          onPlacemarkVisibilityChange={handlePlacemarkVisibilityChange}
          onPlacemarkClick={handlePlacemarkClick}
          highlightedPlacemark={highlightedPlacemark}
        />
      </Sidebar>

      <main className="flex-1 relative">
        <MapViewer
          placemarks={visibleFilteredPlacemarks}
          highlightedPlacemark={highlightedPlacemark}
          onPlacemarkClick={handlePlacemarkClick}
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
        />
      </main>
    </div>
  );
}

export default SmartInventory;