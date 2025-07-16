import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Eye, Download, RefreshCw } from 'lucide-react';
import { Activity, ImageUploadResponse, UpdatePhotosRequest } from '../../types/survey';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  baseUrl: string;
  onUpdate: () => void;
}

interface ImageItem {
  id: string;
  url: string;
  isNew: boolean;
  isReplaced: boolean;
  file?: File;
  fieldName: string;
  originalIndex?: number;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  activity,
  baseUrl,
  onUpdate
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const BASEURL = import.meta.env.VITE_API_BASE;
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;;
  const ImgbaseUrl = import.meta.env.VITE_Image_URL;

  // Event type to photo field mapping with primary and secondary fields
  const eventPhotoFields: Record<string, { primary: keyof Activity; secondary?: keyof Activity }> = {
    FPOI: { primary: "fpoiPhotos" },
    DEPTH: { primary: "depthPhoto" },
    JOINTCHAMBER: { primary: "jointChamberPhotos" },
    MANHOLES: { primary: "manholePhotos" },
    LANDMARK: { primary: "landmarkPhotos" },
    KILOMETERSTONE: { primary: "kilometerstonePhotos" },
    FIBERTURN: { primary: "fiberTurnPhotos" },
    ROUTEINDICATOR: { primary: "routeIndicatorPhotos" },
    STARTPIT: { primary: 'startPitPhotos' },
    ENDPIT: { primary: 'endPitPhotos', secondary: 'endPitDoc' },
    STARTSURVEY: { primary: 'startPointPhoto', secondary: 'vehicle_image' },
    ENDSURVEY: { primary: 'endPointPhoto' },
    ROADCROSSING: { primary: 'crossingPhotos' },
    HOLD:{primary:'holdPhotos'},
  };

  useEffect(() => {
    if (activity && isOpen) {
      loadExistingImages();
    }
  }, [activity, isOpen]);

  const loadExistingImages = () => {
    if (!activity) return;

    const fieldMapping = eventPhotoFields[activity.eventType];
    if (!fieldMapping) return;

    const imageItems: ImageItem[] = [];

    // Load primary field images
    const primaryData = activity[fieldMapping.primary];
    if (primaryData && typeof primaryData === 'string' && primaryData.trim() !== '') {
      try {
        const urls = JSON.parse(primaryData);
        if (Array.isArray(urls)) {
          urls.forEach((url, index) => {
            imageItems.push({
              id: `primary-${index}`,
              url: `${ImgbaseUrl}${url}`,
              isNew: false,
              isReplaced: false,
              fieldName: fieldMapping.primary as string,
              originalIndex: index
            });
          });
        }
      } catch (e) {
        // Single image string
        imageItems.push({
          id: 'primary-0',
          url: `${ImgbaseUrl}${primaryData}`,
          isNew: false,
          isReplaced: false,
          fieldName: fieldMapping.primary as string,
          originalIndex: 0
        });
      }
    }

    // Load secondary field images (for STARTSURVEY and ENDPIT)
    if (fieldMapping.secondary) {
      const secondaryData = activity[fieldMapping.secondary];
      if (secondaryData && typeof secondaryData === 'string' && secondaryData.trim() !== '') {
        imageItems.push({
          id: 'secondary-0',
          url: `${ImgbaseUrl}${secondaryData}`,
          isNew: false,
          isReplaced: false,
          fieldName: fieldMapping.secondary as string,
          originalIndex: 0
        });
      }
    }

    setImages(imageItems);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, targetFieldName?: string) => {
    const files = event.target.files;
    if (!files || !activity) return;

    const fieldMapping = eventPhotoFields[activity.eventType];
    if (!fieldMapping) return;

    // Use targetFieldName if provided (for specific field uploads), otherwise use primary field
    const fieldName = targetFieldName || (fieldMapping.primary as string);

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImageItem = {
          id: `new-${Date.now()}-${index}`,
          url: e.target?.result as string,
          isNew: true,
          isReplaced: false,
          file,
          fieldName
        };
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    // Clear the input
    event.target.value = '';
  };

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const replaceImage = (imageId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImages(prev => prev.map(img =>
        img.id === imageId
          ? {
            ...img,
            url: e.target?.result as string,
            isNew: true,
            isReplaced: true,
            file
          }
          : img
      ));
    };
    reader.readAsDataURL(file);
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images[]', file);
    });

    try {
      const response = await fetch(`${BASEURL}/upload-image`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data: ImageUploadResponse = await response.json();

      return data.data.images || [];
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const updatePhotos = async (updateData: UpdatePhotosRequest) => {
    try {
      const response = await fetch(`${TraceBASEURL}/update-photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!activity) return;

    setUploading(true);
    try {
      const fieldMapping = eventPhotoFields[activity.eventType];
      if (!fieldMapping) return;

      // Group images by field
      const primaryImages = images.filter(img => img.fieldName === fieldMapping.primary);
      const secondaryImages = images.filter(img => img.fieldName === fieldMapping.secondary);

      // Upload new images (including replaced ones)
      const newPrimaryFiles = primaryImages.filter(img => img.isNew && img.file).map(img => img.file!);
      const newSecondaryFiles = secondaryImages.filter(img => img.isNew && img.file).map(img => img.file!);

      let uploadedPrimaryUrls: string[] = [];
      let uploadedSecondaryUrls: string[] = [];

      if (newPrimaryFiles.length > 0) {
        uploadedPrimaryUrls = await uploadImages(newPrimaryFiles);
      }

      if (newSecondaryFiles.length > 0) {
        uploadedSecondaryUrls = await uploadImages(newSecondaryFiles);
      }

      // Process primary field images
      const finalPrimaryUrls: string[] = [];
      let uploadedPrimaryIndex = 0;

      primaryImages.forEach(img => {
        if (img.isNew) {
          // Use uploaded URL for new/replaced images
          if (uploadedPrimaryIndex < uploadedPrimaryUrls.length) {
            finalPrimaryUrls.push(uploadedPrimaryUrls[uploadedPrimaryIndex]);
            uploadedPrimaryIndex++;
          }
        } else {
          // Keep existing URL (remove baseUrl prefix)
          finalPrimaryUrls.push(img.url.replace(baseUrl, ''));
        }
      });

      // Process secondary field images
      const finalSecondaryUrls: string[] = [];
      let uploadedSecondaryIndex = 0;

      secondaryImages.forEach(img => {
        if (img.isNew) {
          // Use uploaded URL for new/replaced images
          if (uploadedSecondaryIndex < uploadedSecondaryUrls.length) {
            finalSecondaryUrls.push(uploadedSecondaryUrls[uploadedSecondaryIndex]);
            uploadedSecondaryIndex++;
          }
        } else {
          // Keep existing URL (remove baseUrl prefix)
          finalSecondaryUrls.push(img.url.replace(baseUrl, ''));
        }
      });

      // Prepare update data
      const updateData: UpdatePhotosRequest = {
        id: activity.id,
      };

      // Handle primary field
      if (finalPrimaryUrls.length > 0) {
        updateData[fieldMapping.primary as string] = finalPrimaryUrls.length === 1
          ? finalPrimaryUrls[0]
          : JSON.stringify(finalPrimaryUrls);
      } else {
        // If no images, send empty string or null
        updateData[fieldMapping.primary as string] = '';
      }

      // Handle secondary field
      if (fieldMapping.secondary) {
        if (finalSecondaryUrls.length > 0) {
          updateData[fieldMapping.secondary as string] = finalSecondaryUrls[0];
        } else {
          updateData[fieldMapping.secondary as string] = '';
        }
      }

      // Update photos
      await updatePhotos(updateData);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isDocument = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension && ['pdf', 'doc', 'docx', 'txt'].includes(extension);
  };

  const getFieldDisplayName = (fieldName: string) => {
    const fieldNames: Record<string, string> = {
      'startPointPhoto': 'Start Point Photo',
      'vehicle_image': 'Vehicle Image',
      'endPitPhotos': 'End Pit Photos',
      'endPitDoc': 'End Pit Document',
      'fpoiPhotos': 'FPOI Photos',
      'depthPhoto': 'Depth Photo',
      'jointChamberPhotos': 'Joint Chamber Photos',
      'manholePhotos': 'Manhole Photos',
      'landmarkPhotos': 'Landmark Photos',
      'kilometerstonePhotos': 'Kilometer Stone Photos',
      'fiberTurnPhotos': 'Fiber Turn Photos',
      'routeIndicatorPhotos': 'Route Indicator Photos',
      'startPitPhotos': 'Start Pit Photos',
      'endPointPhoto': 'End Point Photo',
      'crossingPhotos': 'Crossing Photos',
    };
    return fieldNames[fieldName] || fieldName;
  };

  if (!isOpen || !activity) return null;

  const fieldMapping = eventPhotoFields[activity.eventType];
  const hasSecondaryField = fieldMapping?.secondary;

  // Group images by field for display
  const primaryImages = images.filter(img => img.fieldName === fieldMapping?.primary);
  const secondaryImages = images.filter(img => img.fieldName === fieldMapping?.secondary);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            Manage Images - {activity.eventType}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Primary Field Section */}
          {fieldMapping?.primary && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">
                  {getFieldDisplayName(fieldMapping.primary as string)}
                </h3>
                <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
                  <Upload size={16} className="inline mr-2" />
                  Add Images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, fieldMapping.primary as string)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {primaryImages.map((image, index) => (
                  <div key={image.id} className="relative group border rounded-lg overflow-hidden">
                    {isDocument(image.url) ? (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <Download size={48} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Document</p>
                          <a
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            View/Download
                          </a>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={image.url}
                        alt={`${activity.eventType} image ${index + 1}`}
                        className="w-full h-48 object-cover cursor-pointer"
                        onClick={() => setPreviewImage(image.url)}
                      />
                    )}

                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPreviewImage(image.url)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        <label className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors cursor-pointer" title="Replace">
                          <RefreshCw size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) replaceImage(image.id, file);
                            }}
                          />
                        </label>
                        <button
                          onClick={() => removeImage(image.id)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 bg-gray-50">
                      <p className="text-xs text-gray-600 truncate">
                        {getFieldDisplayName(image.fieldName)} #{index + 1}
                        {image.isReplaced && <span className="text-orange-600 ml-1">(Replaced)</span>}
                        {image.isNew && !image.isReplaced && <span className="text-green-600 ml-1">(New)</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {primaryImages.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No images found for {getFieldDisplayName(fieldMapping.primary as string)}</p>
                </div>
              )}
            </div>
          )}

          {/* Secondary Field Section */}
          {hasSecondaryField && fieldMapping.secondary && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800">
                  {getFieldDisplayName(fieldMapping.secondary as string)}
                </h3>
                <label className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer transition-colors">
                  <Upload size={16} className="inline mr-2" />
                  Add {fieldMapping.secondary === 'endPitDoc' ? 'Document' : 'Image'}
                  <input
                    type="file"
                    accept={fieldMapping.secondary === 'endPitDoc' ? '.pdf,.doc,.docx,.txt' : 'image/*'}
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, fieldMapping.secondary as string)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {secondaryImages.map((image, index) => (
                  <div key={image.id} className="relative group border rounded-lg overflow-hidden">
                    {isDocument(image.url) ? (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <Download size={48} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">Document</p>
                          <a
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                          >
                            View/Download
                          </a>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={image.url}
                        alt={`${fieldMapping.secondary} ${index + 1}`}
                        className="w-full h-48 object-cover cursor-pointer"
                        onClick={() => setPreviewImage(image.url)}
                      />
                    )}

                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setPreviewImage(image.url)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        <label className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors cursor-pointer" title="Replace">
                          <RefreshCw size={16} />
                          <input
                            type="file"
                            accept={fieldMapping.secondary === 'endPitDoc' ? '.pdf,.doc,.docx,.txt' : 'image/*'}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) replaceImage(image.id, file);
                            }}
                          />
                        </label>
                        <button
                          onClick={() => removeImage(image.id)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="p-2 bg-gray-50">
                      <p className="text-xs text-gray-600 truncate">
                        {getFieldDisplayName(image.fieldName)}
                        {image.isReplaced && <span className="text-orange-600 ml-1">(Replaced)</span>}
                        {image.isNew && !image.isReplaced && <span className="text-green-600 ml-1">(New)</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {secondaryImages.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">No {fieldMapping.secondary === 'endPitDoc' ? 'document' : 'images'} found for {getFieldDisplayName(fieldMapping.secondary as string)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {uploading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (

        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Zoomed"
            className="max-w-full max-h-full p-4 rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default ImageModal;

