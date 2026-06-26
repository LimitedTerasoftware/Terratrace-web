import { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, Eye, RefreshCw } from 'lucide-react';
import { PoleString } from '../../types/aerial-survey';
import { ImageUploadResponse } from '../../types/survey';
import axios from 'axios';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const BASEURL = import.meta.env.VITE_API_BASE;
const ImgbaseUrl = import.meta.env.VITE_Image_URL;

interface PoleStringImageModalProps {
  row: PoleString | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImageItem {
  id: string;
  url: string;
  isNew: boolean;
  isReplaced: boolean;
  file?: File;
  fieldName: string;
  subField?: string;
  originalUrl?: string;
}

export function PoleStringImageModal({
  row,
  isOpen,
  onClose,
  onSuccess,
}: PoleStringImageModalProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const originalSnapshot = useRef<Record<string, string[]>>({});

  useEffect(() => {
    if (row && isOpen) {
      loadExistingImages();
      setError(null);
    }
  }, [row, isOpen]);

  const stripBaseUrl = (url: string) => {
    return url.startsWith(ImgbaseUrl) ? url.slice(ImgbaseUrl.length) : url;
  };

  const loadExistingImages = () => {
    if (!row) return;
    const items: ImageItem[] = [];
    const snapshot: Record<string, string[]> = {};

    const addItems = (urls: string[], fieldName: string, prefix: string) => {
      snapshot[fieldName] = urls.filter(Boolean);
      urls.forEach((url, i) => {
        if (url) {
          items.push({
            id: `${prefix}-${i}`,
            url: url.startsWith('http') ? url : `${ImgbaseUrl}${url}`,
            originalUrl: url,
            isNew: false,
            isReplaced: false,
            fieldName,
          });
        }
      });
    };

    // const rowImages = (row.images as unknown as string[]) || [];
    // addItems(rowImages, 'images', 'image');

    if (row.image) {
      addItems([row.image], 'image', 'image-main');
    }

    if (row.road_crossing) {
      try {
        const rc =
          typeof row.road_crossing === 'string'
            ? JSON.parse(row.road_crossing)
            : row.road_crossing;
        if (Array.isArray(rc.crossingPhotos)) {
          addItems(rc.crossingPhotos, 'road_crossing', 'crossing');
        }
      } catch {}
    }

    if (row.landmark?.images?.length) {
      addItems(row.landmark.images, 'landmark', 'landmark');
    }

    if (row.joint_enclosure) {
      const je = row.joint_enclosure;
      const jeRaw = je as Record<string, any>;
      const subFields = [
        'jointImages',
        'trayImages',
        'startMeterImages',
        'endMeterImages',
      ];
      subFields.forEach((sub) => {
        const urls: string[] = Array.isArray(jeRaw[sub]) ? jeRaw[sub] : [];
        snapshot[`joint_enclosure_${sub}`] = urls.filter(Boolean);
        urls.forEach((url: string, i: number) => {
          if (url) {
            items.push({
              id: `joint-${sub}-${i}`,
              url: url.startsWith('http') ? url : `${ImgbaseUrl}${url}`,
              originalUrl: url,
              isNew: false,
              isReplaced: false,
              fieldName: 'joint_enclosure',
              subField: sub,
            });
          }
        });
      });
    }

    originalSnapshot.current = snapshot;
    setImages(items);
  };

  if (!isOpen || !row) return null;

  const getFieldLabel = (fieldName: string) => {
    const labels: Record<string, string> = {
      image: 'Main Image',
      road_crossing: 'Crossing Photos',
      landmark: 'Landmark Images',
      joint_enclosure: 'Joint Enclosure Images',
    };
    return labels[fieldName] || fieldName;
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    targetFieldName: string,
    targetSubField?: string,
  ) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImageItem = {
          id: `new-${Date.now()}-${index}`,
          url: e.target?.result as string,
          isNew: true,
          isReplaced: false,
          file,
          fieldName: targetFieldName,
          subField: targetSubField,
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const replaceImage = (imageId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId
            ? {
                ...img,
                url: e.target?.result as string,
                isNew: true,
                isReplaced: true,
                file,
              }
            : img,
        ),
      );
    };
    reader.readAsDataURL(file);
  };

  const uploadImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images[]', file);
    });

    const response = await fetch(`${BASEURL}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data: ImageUploadResponse = await response.json();
    return data.data.images || [];
  };

  const getFinalUrlsForField = (
    fieldName: string,
    uploadMap: Map<string, string>,
  ) => {
    return images
      .filter((img) => img.fieldName === fieldName)
      .map((img) => {
        if (img.isNew && img.file) {
          return uploadMap.get(img.id) || '';
        }
        return img.originalUrl || stripBaseUrl(img.url);
      })
      .filter(Boolean);
  };

  const hasFieldChanged = (fieldName: string) => {
    const fieldImages = images.filter((img) => img.fieldName === fieldName);
    if (fieldImages.some((img) => img.isNew)) return true;
    const original = originalSnapshot.current[fieldName] || [];
    if (original.length !== fieldImages.length) return true;
    return false;
  };

  const handleSave = async () => {
    setUploading(true);
    setError(null);

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      const newImages = images.filter((img) => img.isNew && img.file);
      const uploadMap = new Map<string, string>();

      if (newImages.length > 0) {
        const uploadedUrls = await uploadImages(
          newImages.map((img) => img.file!),
        );
        newImages.forEach((img, i) => {
          uploadMap.set(img.id, uploadedUrls[i] || '');
        });
      }

      const payload: Record<string, any> = {
        survey_id: row.survey_id,
        user_id: userData.id,
        user_name: userData.name,
      };

      // if (hasFieldChanged('images')) {
      //   payload.images = getFinalUrlsForField('images', uploadMap);
      // }
      if (hasFieldChanged('image')) {
        const urls = getFinalUrlsForField('image', uploadMap);
        payload.image = urls[0] || '';
      }

      if (hasFieldChanged('road_crossing')) {
        try {
          const rc = row.road_crossing
            ? typeof row.road_crossing === 'string'
              ? JSON.parse(row.road_crossing)
              : row.road_crossing
            : {};
          rc.crossingPhotos = getFinalUrlsForField('road_crossing', uploadMap);
          payload.road_crossing = rc;
        } catch {
          payload.road_crossing = {
            crossingPhotos: getFinalUrlsForField('road_crossing', uploadMap),
          };
        }
      }

      if (hasFieldChanged('landmark')) {
        const lm: Record<string, any> = row.landmark ? { ...row.landmark } : {};
        lm.images = getFinalUrlsForField('landmark', uploadMap);
        payload.landmark = lm;
      }

      if (hasFieldChanged('joint_enclosure')) {
        const je: Record<string, any> = row.joint_enclosure
          ? { ...row.joint_enclosure }
          : {};
        const subFields = [
          'jointImages',
          'trayImages',
          'startMeterImages',
          'endMeterImages',
        ];
        subFields.forEach((sub) => {
          const subItems = images.filter(
            (img) =>
              img.fieldName === 'joint_enclosure' && img.subField === sub,
          );
          je[sub] = subItems
            .map((img) => {
              if (img.isNew && img.file) return uploadMap.get(img.id) || '';
              return img.originalUrl || stripBaseUrl(img.url);
            })
            .filter(Boolean);
        });
        payload.joint_enclosure = je;
      }

      const resp = await axios.post(
        `${TraceBASEURL}/update-pole-stringing/${row.id}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } },
      );

      if (resp.status === 200 || resp.status === 201) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save images');
    } finally {
      setUploading(false);
    }
  };

  const getGroupKey = (img: ImageItem) => {
    if (img.fieldName === 'joint_enclosure' && img.subField) {
      return `joint_enclosure_${img.subField}`;
    }
    return img.fieldName;
  };

  const getGroupLabel = (groupKey: string) => {
    if (groupKey.startsWith('joint_enclosure_')) {
      const sub = groupKey.replace('joint_enclosure_', '');
      const labels: Record<string, string> = {
        jointImages: 'Joint Enclosure - Joint Images',
        trayImages: 'Joint Enclosure - Tray Images',
        startMeterImages: 'Joint Enclosure - Start Meter Images',
        endMeterImages: 'Joint Enclosure - End Meter Images',
      };
      return labels[sub] || groupKey;
    }
    return getFieldLabel(groupKey);
  };

  const groupedImages = images.reduce<Record<string, ImageItem[]>>(
    (acc, img) => {
      const key = getGroupKey(img);
      if (!acc[key]) acc[key] = [];
      acc[key].push(img);
      return acc;
    },
    {},
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            Manage Media - Pole #{row.id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            {Object.entries(groupedImages).map(([groupKey, fieldImages]) => {
              const first = fieldImages[0];
              const isJeSub = groupKey.startsWith('joint_enclosure_');
              const btnSubField = isJeSub ? first.subField : undefined;
              return (
                <div key={groupKey} className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      {getGroupLabel(groupKey)}
                    </h4>
                    {first.fieldName != 'image' && (
                    <label className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 cursor-pointer transition-colors">
                      <Upload size={14} className="inline mr-1" />
                      Add
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileSelect(e, first.fieldName, btnSubField)
                        }
                      />
                    </label>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fieldImages.map((image, index) => (
                      <div
                        key={image.id}
                        className="relative group border rounded-lg overflow-hidden"
                      >
                        <img
                          src={image.url}
                          alt={`${getGroupLabel(groupKey)} ${index + 1}`}
                          className="w-full h-48 object-cover cursor-pointer"
                          onClick={() => setPreviewImage(image.url)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setPreviewImage(image.url)}
                              className="p-2 bg-white rounded-full hover:bg-gray-100"
                              title="Preview"
                            >
                              <Eye size={16} />
                            </button>
                            <label
                              className="p-2 bg-white rounded-full hover:bg-gray-100 cursor-pointer"
                              title="Replace"
                            >
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
                              className="p-2 bg-white rounded-full hover:bg-gray-100"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50">
                          <p className="text-xs text-gray-600">
                            {getGroupLabel(groupKey)} #{index + 1}
                            {image.isReplaced && (
                              <span className="text-orange-600 ml-1">
                                (Replaced)
                              </span>
                            )}
                            {image.isNew && !image.isReplaced && (
                              <span className="text-green-600 ml-1">(New)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {images.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Upload size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No media found</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
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
}
