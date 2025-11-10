import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string;
  onSuccess: () => void;
}

interface RouteDetails {
  centerToMargin: string;
  roadWidth: string;
  routeBelongsTo: string;
  routeType: string;
  soilType: string;
}

interface RouteFeasibility {
  alternatePathAvailable: boolean;
  alternativePathDetails: string;
  routeFeasible: boolean;
}

interface FormData {
  surveyId: string;
  areaType: string;
  eventType: string;
  surveyUploaded: string;
  executionModality: string;
  latitude: string;
  longitude: string;
  altitude: string;
  accuracy: string;
  depth: string;
  distance_error: string;
  routeDetails: RouteDetails;
  routeFeasibility: RouteFeasibility;
  sideType: string;
  createdTime: string;
  
  // Event-specific fields
  routeIndicatorUrl?: string[];
  routeIndicatorType?: string;
  landMarkType?: string;
  landMarkDescription?: string;
  landMarkUrls?: string[];
  fpoiUrl?: string;
  jointChamberUrl?: string;
  kmtStoneUrl?: string;
  fiberTurnUrl?: string;
  roadCrossing?: {
    roadCrossing: string;
    length: string;
    startPhoto: string;
    endPhoto: string;
    startPhotoLat: string;
    startPhotoLong: string;
    endPhotoLat: string;
    endPhotoLong: string;
  };
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  surveyId,
  onSuccess
}) => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const API_URL = 'https://api.tricadtrack.com/underground-survey-insert';

  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    surveyId: surveyId,
    areaType: 'POPULATED',
    eventType: 'ROUTEINDICATOR',
    surveyUploaded: 'true',
    executionModality: 'NONE',
    latitude: '',
    longitude: '',
    altitude: '',
    accuracy: '',
    depth: '0',
    distance_error: '0',
    routeDetails: {
      centerToMargin: '',
      roadWidth: '',
      routeBelongsTo: 'NATIONALHIGHWAYS',
      routeType: 'THARROAD',
      soilType: 'NORMAL'
    },
    routeFeasibility: {
      alternatePathAvailable: false,
      alternativePathDetails: '',
      routeFeasible: true
    },
    sideType: 'LHS',
    createdTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Event type options
  const eventTypes = [
    'ROUTEINDICATOR',
    'LANDMARK',
    'FPOI',
    'JOINTCHAMBER',
    'KILOMETERSTONE',
    'FIBERTURN',
    'ROADCROSSING',
    'SURVEYSTART',
    'ENDSURVEY'
  ];

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData(prev => ({
        ...prev,
        surveyId: surveyId,
        createdTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }));
      setSelectedFiles([]);
      setPreviewUrls([]);
    }
  }, [isOpen, surveyId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('routeDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        routeDetails: {
          ...prev.routeDetails,
          [field]: value
        }
      }));
    } else if (name.startsWith('routeFeasibility.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        routeFeasibility: {
          ...prev.routeFeasibility,
          [field]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }
      }));
    } else if (name.startsWith('roadCrossing.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        roadCrossing: {
          ...prev.roadCrossing!,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const filesArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...filesArray]);

    // Create preview URLs
    filesArray.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrls(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images[]', file);
    });

    try {
      // Using the correct upload endpoint
      const response = await axios.post('https://traceapi.tricadtrack.com/api/v1/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Extract image URLs from response
      // Response format: { success: true, message: "...", data: { images: [...] } }
      if (response.data && response.data.success && response.data.data && response.data.data.images) {
        const imageUrls = response.data.data.images;
        console.log('Images uploaded successfully:', imageUrls);
        return imageUrls; // Returns array like ["uploads/images/1760356389_68ece82527985.png", ...]
      }
      
      throw new Error('Invalid response format from upload API');
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload images';
      throw new Error(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.latitude || !formData.longitude) {
      alert('Latitude and Longitude are required');
      return;
    }

    setLoading(true);
    try {
      let uploadedUrls: string[] = [];

      // Upload images if any
      if (selectedFiles.length > 0) {
        setUploadingImages(true);
        console.log(`Uploading ${selectedFiles.length} images...`);
        uploadedUrls = await uploadImages(selectedFiles);
        console.log('Uploaded image URLs:', uploadedUrls);
        setUploadingImages(false);
      }

      // Prepare payload based on event type
      const payload: any = {
        surveyId: formData.surveyId,
        areaType: formData.areaType,
        eventType: formData.eventType,
        surveyUploaded: formData.surveyUploaded,
        executionModality: formData.executionModality,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        altitude: formData.altitude,
        accuracy: formData.accuracy,
        depth: formData.depth,
        distance_error: formData.distance_error,
        routeDetails: formData.routeDetails,
        routeFeasibility: formData.routeFeasibility,
        sideType: formData.sideType,
        createdTime: formData.createdTime
      };

      // Add event-specific fields
      switch (formData.eventType) {
        case 'ROUTEINDICATOR':
          if (uploadedUrls.length > 0) {
            // Pass as array directly from API response
            payload.routeIndicatorUrl = uploadedUrls;
            console.log('ROUTEINDICATOR - routeIndicatorUrl:', payload.routeIndicatorUrl);
          }
          payload.routeIndicatorType = formData.routeIndicatorType || 'BSNL';
          break;

        case 'LANDMARK':
          if (uploadedUrls.length > 0) {
            // Pass as array directly from API response
            payload.landMarkUrls = uploadedUrls;
            console.log('LANDMARK - landMarkUrls:', payload.landMarkUrls);
          }
          payload.landMarkType = formData.landMarkType || 'STATUE';
          payload.landMarkDescription = formData.landMarkDescription || '';
          break;

        case 'FPOI':
          if (uploadedUrls.length > 0) {
            payload.fpoiUrl = uploadedUrls[0];
            console.log('FPOI - fpoiUrl:', payload.fpoiUrl);
          }
          break;

        case 'JOINTCHAMBER':
          if (uploadedUrls.length > 0) {
            payload.jointChamberUrl = uploadedUrls[0];
            console.log('JOINTCHAMBER - jointChamberUrl:', payload.jointChamberUrl);
          }
          break;

        case 'KILOMETERSTONE':
          if (uploadedUrls.length > 0) {
            payload.kmtStoneUrl = uploadedUrls[0];
            console.log('KILOMETERSTONE - kmtStoneUrl:', payload.kmtStoneUrl);
          }
          break;

        case 'FIBERTURN':
          if (uploadedUrls.length > 0) {
            payload.fiberTurnUrl = uploadedUrls[0];
            console.log('FIBERTURN - fiberTurnUrl:', payload.fiberTurnUrl);
          }
          break;

        case 'ROADCROSSING':
          payload.roadCrossing = {
            roadCrossing: formData.roadCrossing?.roadCrossing || '',
            length: formData.roadCrossing?.length || '',
            startPhoto: uploadedUrls[0] || '',
            endPhoto: uploadedUrls[1] || '',
            startPhotoLat: formData.roadCrossing?.startPhotoLat || '',
            startPhotoLong: formData.roadCrossing?.startPhotoLong || '',
            endPhotoLat: formData.roadCrossing?.endPhotoLat || '',
            endPhotoLong: formData.roadCrossing?.endPhotoLong || ''
          };
          console.log('ROADCROSSING - roadCrossing:', payload.roadCrossing);
          break;

        case 'SURVEYSTART':
          if (uploadedUrls.length > 0) {
            payload.start_photos = uploadedUrls;
            console.log('SURVEYSTART - start_photos:', payload.start_photos);
          }
          break;

        case 'ENDSURVEY':
          if (uploadedUrls.length > 0) {
            payload.end_photos = uploadedUrls;
            console.log('ENDSURVEY - end_photos:', payload.end_photos);
          }
          break;
      }

      console.log('Final payload being sent to API:', JSON.stringify(payload, null, 2));

      // Submit to API
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response.data);

      if (response.data) {
        alert('Event added successfully!');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      console.error('Error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add event. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  const renderEventSpecificFields = () => {
    switch (formData.eventType) {
      case 'ROUTEINDICATOR':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Route Indicator Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="routeIndicatorType"
              value={formData.routeIndicatorType || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'LANDMARK':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landmark Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="landMarkType"
                value={formData.landMarkType || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., STATUE, TEMPLE, MOSQUE, CHURCH"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landmark Description
              </label>
              <textarea
                name="landMarkDescription"
                value={formData.landMarkDescription || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter landmark description"
              />
            </div>
          </div>
        );

      case 'ROADCROSSING':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Road Crossing Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="roadCrossing.roadCrossing"
                value={formData.roadCrossing?.roadCrossing || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., CULVERT, BRIDGE, UNDERPASS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crossing Length (meters)
              </label>
              <input
                type="text"
                name="roadCrossing.length"
                value={formData.roadCrossing?.length || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter length"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Photo Latitude
                </label>
                <input
                  type="text"
                  name="roadCrossing.startPhotoLat"
                  value={formData.roadCrossing?.startPhotoLat || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Latitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Photo Longitude
                </label>
                <input
                  type="text"
                  name="roadCrossing.startPhotoLong"
                  value={formData.roadCrossing?.startPhotoLong || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Longitude"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Photo Latitude
                </label>
                <input
                  type="text"
                  name="roadCrossing.endPhotoLat"
                  value={formData.roadCrossing?.endPhotoLat || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Latitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Photo Longitude
                </label>
                <input
                  type="text"
                  name="roadCrossing.endPhotoLong"
                  value={formData.roadCrossing?.endPhotoLong || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Longitude"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Event - Survey ID: {surveyId}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* GPS Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 22.8070268"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 88.7564137"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Altitude
              </label>
              <input
                type="text"
                name="altitude"
                value={formData.altitude}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., -36.7"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accuracy
              </label>
              <input
                type="text"
                name="accuracy"
                value={formData.accuracy}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 3.427"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Depth
              </label>
              <input
                type="text"
                name="depth"
                value={formData.depth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance Error
              </label>
              <input
                type="text"
                name="distance_error"
                value={formData.distance_error}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 0"
              />
            </div>
          </div>

          {/* Side Type & Execution Modality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Side Type
              </label>
              <input
                type="text"
                name="sideType"
                value={formData.sideType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., LHS, RHS, BOTH, CENTER"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Execution Modality
              </label>
              <input
                type="text"
                name="executionModality"
                value={formData.executionModality}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NONE, BORING, TRENCHING, AERIAL"
              />
            </div>
          </div>

          {/* Event-Specific Fields */}
          {renderEventSpecificFields()}

          {/* Upload Images Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
              <label className="flex flex-col items-center cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600 mb-2">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500">
                  PNG, JPG up to 10MB
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {/* Preview Selected Images */}
              {previewUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Route Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Type
              </label>
              <input
                type="text"
                name="routeDetails.routeType"
                value={formData.routeDetails.routeType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., THARROAD, CONCRETEROAD"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Belongs To
              </label>
              <input
                type="text"
                name="routeDetails.routeBelongsTo"
                value={formData.routeDetails.routeBelongsTo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NATIONALHIGHWAYS, STATEHIGHWAYS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Soil Type
              </label>
              <input
                type="text"
                name="routeDetails.soilType"
                value={formData.routeDetails.soilType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NORMAL, ROCKY, SANDY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Area Type
              </label>
              <input
                type="text"
                name="areaType"
                value={formData.areaType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., POPULATED, UNPOPULATED"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Road Width (meters)
              </label>
              <input
                type="text"
                name="routeDetails.roadWidth"
                value={formData.routeDetails.roadWidth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Center to Margin (meters)
              </label>
              <input
                type="text"
                name="routeDetails.centerToMargin"
                value={formData.routeDetails.centerToMargin}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 3.5"
              />
            </div>
          </div>

          {/* Route Feasibility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route Feasible
              </label>
              <select
                name="routeFeasibility.routeFeasible"
                value={formData.routeFeasibility.routeFeasible.toString()}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    routeFeasibility: {
                      ...prev.routeFeasibility,
                      routeFeasible: e.target.value === 'true'
                    }
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alternate Path Available
              </label>
              <select
                name="routeFeasibility.alternatePathAvailable"
                value={formData.routeFeasibility.alternatePathAvailable.toString()}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    routeFeasibility: {
                      ...prev.routeFeasibility,
                      alternatePathAvailable: e.target.value === 'true'
                    }
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alternative Path Details
            </label>
            <textarea
              name="routeFeasibility.alternativePathDetails"
              value={formData.routeFeasibility.alternativePathDetails}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter alternative path details if available"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingImages}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 flex items-center gap-2"
            >
              {uploadingImages ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading Images...
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding Event...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;