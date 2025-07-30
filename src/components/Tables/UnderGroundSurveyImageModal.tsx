import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Eye, Download, RefreshCw, Video } from 'lucide-react';

interface UnderGroundSurveyImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyData: UnderGroundSurveyData | null;
  baseUrl: string;
  onUpdate: () => void;
}

interface VideoDetails {
  startLatitude: number;
  startLongitude: number;
  startTimeStamp: number;
  endLatitude: number;
  endLongitude: number;
  endTimeStamp: number;
  videoUrl: string;
}

interface UnderGroundSurveyData {
  id: number;
  survey_id: string;
  area_type: string;
  event_type: string;
  fpoiUrl: string;
  routeIndicatorUrl: string;
  jointChamberUrl: string;
  execution_modality: string;
  latitude: string;
  longitude: string;
  patroller_details: any;
  road_crossing: RoadCrossing;
  route_details: any;
  route_feasibility: any;
  side_type: string;
  start_photos: string[];
  end_photos: string[];
  utility_features_checked: any;
  videoUrl: string;
  videoDetails?: VideoDetails;
  created_at: string;
  createdTime: string;
  surveyUploaded: string;
  altitude: string;
  accuracy: string;
  depth: string;
  distance_error: string;
  kmtStoneUrl: string;
  landMarkUrls: string;
  fiberTurnUrl: string;
  landMarkType: string;
  landMarkDescripition: string;
}

interface RoadCrossing {
  endPhoto: string;
  endPhotoLat: number;
  endPhotoLong: number;
  length: string;
  roadCrossing: string;
  startPhoto: string;
  startPhotoLat: number;
  startPhotoLong: number;
}

interface ImageUploadResponse {
  success: boolean;
  data: {
    images: string[];
  };
}

interface VideoUploadResponse {
  success: boolean;
  data: {
    videoUrl: string;
  };
}

interface ImageItem {
  id: string;
  url: string;
  isNew: boolean;
  isReplaced: boolean;
  file?: File;
  fieldName: string;
  originalIndex?: number;
  isVideo?: boolean;
}

const UnderGroundSurveyImageModal: React.FC<UnderGroundSurveyImageModalProps> = ({
  isOpen,
  onClose,
  surveyData,
  baseUrl,
  onUpdate
}) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const BASEURL = import.meta.env.VITE_API_BASE;
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
  const ImgbaseUrl = import.meta.env.VITE_Image_URL;

  // Event type to photo field mapping
  const eventPhotoFields: Record<string, Array<{ key: string; name: string; type: 'single' | 'array' | 'nested'; accept: string; isVideo?: boolean }>> = {
    FPOI: [
      { key: 'fpoiUrl', name: 'FPOI Photo', type: 'single', accept: 'image/*' }
    ],
    SURVEYSTART: [
      { key: 'start_photos', name: 'Start Photos', type: 'array', accept: 'image/*' }
    ],
    ENDSURVEY: [
      { key: 'end_photos', name: 'End Photos', type: 'array', accept: 'image/*' }
    ],
    ROUTEINDICATOR: [
      { key: 'routeIndicatorUrl', name: 'Route Indicator Photos', type: 'single', accept: 'image/*' }
    ],
    JOINTCHAMBER: [
      { key: 'jointChamberUrl', name: 'Joint Chamber Photo', type: 'single', accept: 'image/*' }
    ],
    ROADCROSSING: [
      { key: 'road_crossing.startPhoto', name: 'Road Crossing Start Photo', type: 'nested', accept: 'image/*' },
      { key: 'road_crossing.endPhoto', name: 'Road Crossing End Photo', type: 'nested', accept: 'image/*' }
    ],
    KILOMETERSTONE: [
      { key: 'kmtStoneUrl', name: 'KM Stone Photo', type: 'single', accept: 'image/*' }
    ],
    LANDMARK: [
      { key: 'landMarkUrls', name: 'Landmark Photos', type: 'single', accept: 'image/*' }
    ],
    FIBERTURN: [
      { key: 'fiberTurnUrl', name: 'Fiber Turn Photo', type: 'single', accept: 'image/*' }
    ],
    VIDEORECORD: [
      { key: 'videoDetails.videoUrl', name: 'Survey Video', type: 'single', accept: 'video/*', isVideo: true }
    ]
  };

  useEffect(() => {
    if (surveyData && isOpen) {
      loadExistingImages();
    }
  }, [surveyData, isOpen]);

  const loadExistingImages = () => {
    if (!surveyData) return;

    const fields = eventPhotoFields[surveyData.event_type];
    if (!fields) return;

    const imageItems: ImageItem[] = [];

    fields.forEach(field => {
      let data: any;
      
      // Handle nested fields
      if (field.key.includes('.')) {
        const [parent, child] = field.key.split('.');
        data = surveyData[parent as keyof UnderGroundSurveyData]?.[child as keyof any];
      } else {
        data = surveyData[field.key as keyof UnderGroundSurveyData];
      }

      if (!data) return;

      if (field.type === 'array' && Array.isArray(data)) {
        data.forEach((url, index) => {
          if (url && url.trim() !== '') {
            imageItems.push({
              id: `${field.key}-${index}`,
              url: `${ImgbaseUrl}${url}`,
              isNew: false,
              isReplaced: false,
              fieldName: field.key,
              originalIndex: index,
              isVideo: field.isVideo
            });
          }
        });
      } else if ((field.type === 'single' || field.type === 'nested') && typeof data === 'string' && data.trim() !== '') {
        // Handle JSON string arrays (like routeIndicatorUrl, landMarkUrls)
        if (field.key === 'routeIndicatorUrl' || field.key === 'landMarkUrls') {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              parsed.forEach((url, index) => {
                if (url && url.trim() !== '') {
                  imageItems.push({
                    id: `${field.key}-${index}`,
                    url: `${ImgbaseUrl}${url}`,
                    isNew: false,
                    isReplaced: false,
                    fieldName: field.key,
                    originalIndex: index,
                    isVideo: field.isVideo
                  });
                }
              });
            } else {
              imageItems.push({
                id: `${field.key}-0`,
                url: `${ImgbaseUrl}${parsed}`,
                isNew: false,
                isReplaced: false,
                fieldName: field.key,
                originalIndex: 0,
                isVideo: field.isVideo
              });
            }
          } catch (e) {
            // If parsing fails, treat as single string
            imageItems.push({
              id: `${field.key}-0`,
              url: `${ImgbaseUrl}${data}`,
              isNew: false,
              isReplaced: false,
              fieldName: field.key,
              originalIndex: 0,
              isVideo: field.isVideo
            });
          }
        } else {
          // Handle video URLs (remove quotes if present)
          const cleanUrl = data.trim().replace(/^"|"$/g, '');
          if (cleanUrl) {
            imageItems.push({
              id: `${field.key}-0`,
              url: field.isVideo ? `${ImgbaseUrl}${cleanUrl}` : `${ImgbaseUrl}${data}`,
              isNew: false,
              isReplaced: false,
              fieldName: field.key,
              originalIndex: 0,
              isVideo: field.isVideo
            });
          }
        }
      }
    });

    setImages(imageItems);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const files = event.target.files;
    if (!files || !surveyData) return;

    const fields = eventPhotoFields[surveyData.event_type];
    if (!fields) return;

    const field = fields.find(f => f.key === fieldName);
    if (!field) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImageItem = {
          id: `new-${Date.now()}-${index}`,
          url: e.target?.result as string,
          isNew: true,
          isReplaced: false,
          file,
          fieldName,
          isVideo: field.isVideo
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

  const uploadImages = async (files: File[], type: string): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => {
      if (type === 'video') {
        formData.append('videos[]', file);
      } else if (type === 'img') {
        formData.append('images[]', file);
      }
    });

    try {
      const response = await fetch(`${BASEURL}/upload-image`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      if (type === 'video') {
        return data.data.videos || [data.data.videoUrl] || [];
      } else {
        return data.data.images || [];
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

 const updateSurveyData = async (updateData: any) => {
    try {
      const response = await fetch(`${TraceBASEURL}/update-physical-survey`, {
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
    if (!surveyData) return;

    const fields = eventPhotoFields[surveyData.event_type];
    if (!fields) return;

    setUploading(true);
    try {
      // Group images by field
      const imagesByField: Record<string, ImageItem[]> = {};
      images.forEach(img => {
        if (!imagesByField[img.fieldName]) {
          imagesByField[img.fieldName] = [];
        }
        imagesByField[img.fieldName].push(img);
      });

      const updatedData: any = {};

      for (const fieldName of Object.keys(imagesByField)) {
        const fieldImages = imagesByField[fieldName];
        const field = fields.find(f => f.key === fieldName);
        if (!field) continue;

        // Separate new files from existing ones
        const newFiles = fieldImages.filter(img => img.isNew && img.file).map(img => img.file!);

        let uploadedUrls: string[] = [];

        // Upload new files
        if (newFiles.length > 0) {
          const uploadType = field.isVideo ? 'video' : 'img';
          uploadedUrls = await uploadImages(newFiles, uploadType);
        }

        // Combine existing and new URLs
        const finalUrls: string[] = [];
        let uploadedIndex = 0;

        fieldImages.forEach(img => {
          if (img.isNew) {
            if (uploadedIndex < uploadedUrls.length) {
              finalUrls.push(uploadedUrls[uploadedIndex]);
              uploadedIndex++;
            }
          } else {
            // Keep existing URL (remove baseUrl prefix)
            finalUrls.push(img.url.replace(ImgbaseUrl, ''));
          }
        });

        // Update the data structure
        if (field.key.includes('.')) {
          // Handle nested fields
          const [parent, child] = field.key.split('.');
          if (!updatedData[parent]) {
            updatedData[parent] = { ...surveyData[parent as keyof UnderGroundSurveyData] };
          }
          updatedData[parent][child] = finalUrls.length > 0 ? finalUrls[0] : '';
        } else {
          // Handle direct fields
          if (field.type === 'array') {
            updatedData[field.key] = finalUrls;
          } else if (field.key === 'routeIndicatorUrl' || field.key === 'landMarkUrls') {
            // Handle JSON string arrays
            // updatedData[field.key] = finalUrls.length > 1 ? JSON.stringify(finalUrls) : (finalUrls[0] || '');
              updatedData[field.key] = JSON.stringify(finalUrls);
          } else {
            updatedData[field.key] = finalUrls.length > 0 ? finalUrls[0] : '';
          }
        }
      }

      // Prepare the update request
      const updateRequest = {
        id: surveyData.id,
        ...updatedData
      };

      // Update survey data
      await updateSurveyData(updateRequest);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save media. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isVideo = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension && ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension);
  };

  const isDocument = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension && ['pdf', 'doc', 'docx', 'txt'].includes(extension);
  };

  if (!isOpen || !surveyData) return null;

  const fields = eventPhotoFields[surveyData.event_type];
  if (!fields) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">No Media Fields</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <p className="text-gray-600">No media fields available for event type: {surveyData.event_type}</p>
          <div className="flex justify-end mt-4">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md">Close</button>
          </div>
        </div>
      </div>
    );
  }

  // Group images by field for display
  const groupedImages: Record<string, ImageItem[]> = {};
  images.forEach(img => {
    if (!groupedImages[img.fieldName]) {
      groupedImages[img.fieldName] = [];
    }
    groupedImages[img.fieldName].push(img);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            Manage Media - Survey ID: {surveyData.survey_id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {fields.map(field => {
            const fieldImages = groupedImages[field.key] || [];
            
            return (
              <div key={field.key} className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    {field.name}
                  </h3>
                  <label className={`px-4 py-2 ${field.isVideo ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md cursor-pointer transition-colors`}>
                    <Upload size={16} className="inline mr-2" />
                    Add {field.isVideo ? 'Video' : 'Images'}
                    <input
                      type="file"
                      multiple={field.type === 'array'}
                      accept={field.accept}
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, field.key)}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fieldImages.map((image, index) => (
                    <div key={image.id} className="relative group border rounded-lg overflow-hidden">
                      {isVideo(image.url) ? (
                        <div className="h-48 bg-gray-100 flex items-center justify-center">
                          <div className="text-center">
                            <Video size={48} className="mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">Video</p>
                            <video
                              src={image.url}
                              className="w-full h-32 object-cover mt-2"
                              controls
                              preload="metadata"
                            />
                          </div>
                        </div>
                      ) : isDocument(image.url) ? (
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
                          alt={`${field.name} ${index + 1}`}
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
                              accept={field.accept}
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
                          {field.name} {field.type === 'array' ? `#${index + 1}` : ''}
                          {image.isReplaced && <span className="text-orange-600 ml-1">(Replaced)</span>}
                          {image.isNew && !image.isReplaced && <span className="text-green-600 ml-1">(New)</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {fieldImages.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No {field.isVideo ? 'video' : 'images'} found for {field.name}</p>
                  </div>
                )}
              </div>
            );
          })}
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

      {/* Media Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50"
          onClick={() => setPreviewImage(null)}
        >
          {isVideo(previewImage) ? (
            <video
              src={previewImage}
              controls
              className="max-w-full max-h-full p-4 rounded-lg"
            />
          ) : (
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full p-4 rounded-lg"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default UnderGroundSurveyImageModal;