import { useState, useEffect, act } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { Activity, StartDuct, EndDuct } from '../../types/survey';
import { sub } from 'date-fns';

interface EditModalProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  baseUrl: string;
}

interface DuctEntry {
  coil_number: string;
  meter: string;
  images: string[];
}

export function EditModal({
  activity,
  isOpen,
  onClose,
  onUpdate,
  baseUrl,
}: EditModalProps) {
  const [formData, setFormData] = useState<Partial<Activity>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [startDuctData, setStartDuctData] = useState<DuctEntry[]>([]);
  const [endDuctData, setEndDuctData] = useState<DuctEntry[]>([]);

  const parseDuctData = (data: any): DuctEntry[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }
    return [];
  };

  useEffect(() => {
    if (activity) {
      setFormData(activity);
      setError(null);
      setSuccess(false);
      if (activity.eventType === 'DUCT') {
        setStartDuctData(parseDuctData(activity.start_duct));
        setEndDuctData(parseDuctData(activity.end_duct));
      }
    }
  }, [activity]);

  const handleDuctChange = (
    type: 'start' | 'end',
    index: number,
    field: keyof DuctEntry,
    value: string,
  ) => {
    const data = type === 'start' ? [...startDuctData] : [...endDuctData];
    data[index] = { ...data[index], [field]: value };
    if (type === 'start') {
      setStartDuctData(data);
    } else {
      setEndDuctData(data);
    }
  };

  const addDuctEntry = (type: 'start' | 'end') => {
    const newEntry: DuctEntry = { coil_number: '', meter: '', images: [] };
    if (type === 'start') {
      setStartDuctData([...startDuctData, newEntry]);
    } else {
      setEndDuctData([...endDuctData, newEntry]);
    }
  };

  const removeDuctEntry = (type: 'start' | 'end', index: number) => {
    if (type === 'start') {
      setStartDuctData(startDuctData.filter((_, i) => i !== index));
    } else {
      setEndDuctData(endDuctData.filter((_, i) => i !== index));
    }
  };

  if (!isOpen || !activity) return null;

  const handleChange = (field: keyof Activity, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let submitData = { ...formData };

      if (activity.eventType === 'DUCT') {
        submitData.start_duct = JSON.stringify(startDuctData);
        submitData.end_duct = JSON.stringify(endDuctData);
      }else if(activity.eventType === 'DEPTH'){
        submitData.depth_capture_type = 'MANUAL';

      }

      const response = await fetch(`${baseUrl}/update-event/${activity.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      setSuccess(true);
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update activity',
      );
    } finally {
      setIsLoading(false);
    }
  };
  const getLatLongFieldForEvent = () => {
    switch (activity.eventType) {
      case 'FPOI':
        return { key: 'fpoiLatLong', label: 'FPOI Latitude/Longitude' };
      case 'DEPTH':
        return { key: 'depthLatlong', label: 'Depth Latitude/Longitude' };
      case 'JOINTCHAMBER':
        return {
          key: 'jointChamberLatLong',
          label: 'Joint Chamber Latitude/Longitude',
        };
      case 'MANHOLES':
        return { key: 'manholeLatLong', label: 'Manhole Latitude/Longitude' };
      case 'LANDMARK':
        return { key: 'landmarkLatLong', label: 'Landmark Latitude/Longitude' };
      case 'KILOMETERSTONE':
        return {
          key: 'kilometerstoneLatLong',
          label: 'Kilometerstone Latitude/Longitude',
        };
      case 'FIBERTURN':
        return {
          key: 'fiberTurnLatLong',
          label: 'Fiber Turn Latitude/Longitude',
        };
      case 'ROUTEINDICATOR':
        return {
          key: 'routeIndicatorLatLong',
          label: 'Route Indicator Latitude/Longitude',
        };
      case 'STARTPIT':
        return {
          key: 'startPitLatlong',
          label: 'Start Pit Latitude/Longitude',
        };
      case 'ENDPIT':
        return { key: 'endPitLatlong', label: 'End Pit Latitude/Longitude' };
      case 'STARTSURVEY':
        return {
          key: 'startPointCoordinates',
          label: 'Start Point Coordinates',
        };
      case 'ENDSURVEY':
        return { key: 'endPointCoordinates', label: 'End Point Coordinates' };
      case 'ROADCROSSING':
        return { key: 'crossingLatlong', label: 'Crossing Latitude/Longitude' };
      case 'HOLDSURVEY':
        return { key: 'holdLatlong', label: 'Hold Survey Latitude/Longitude' };
      case 'BLOWING':
        return { key: 'blowingLatLong', label: 'Blowing Latitude/Longitude' };
      case 'ROUTEFEATURE':
        return {
          key: 'routeFeatureLatLong',
          label: 'Route Feature Latitude/Longitude',
        };

      default:
        return null;
    }
  };

  const baseFields = [
    { key: 'eventType', label: 'Event Type', type: 'text' },
    { key: 'routeFeatureType', label: 'RouteFeature Type', type: 'text' },
    { key: 'routeBelongsTo', label: 'Route Belongs To', type: 'text' },
    { key: 'roadType', label: 'Road Type', type: 'text' },
    { key: 'soilType', label: 'Soil Type', type: 'text' },
    { key: 'area_type', label: 'Area Type', type: 'text' },
    { key: 'cableLaidOn', label: 'Cable Laid On', type: 'text' },
    { key: 'roadWidth', label: 'Road Width', type: 'text' },
    { key: 'road_margin', label: 'Road Margin', type: 'text' },
    { key: 'Roadfesibility', label: 'Road Feasibility', type: 'text' },
    { key: 'depthMeters', label: 'Depth (Meters)', type: 'text' },
    { key: 'distance', label: 'Distance (Meters)', type: 'text' },
    { key: 'offset', label: 'Offset', type: 'text' },
    { key: 'dgps_accuracy', label: 'DGPS Accuracy', type: 'text' },
    { key: 'dgps_siv', label: 'DGPS SIV', type: 'number' },
    { key: 'cable_stack', label: 'Cable Stack', type: 'text' },
    { key: 'executionModality', label: 'Execution Modality', type: 'text' },
    { key: 'crossingType', label: 'Crossing Type', type: 'text' },
    { key: 'crossingLength', label: 'Crossing Length', type: 'text' },
    { key: 'pole_type', label: 'Pole Type', type: 'text' },
    { key: 'existing_pole', label: 'Existing Pole', type: 'text' },
    { key: 'new_pole', label: 'New Pole', type: 'text' },
    { key: 'landmark_type', label: 'Landmark Type', type: 'text' },
    {
      key: 'landmark_description',
      label: 'Landmark Description',
      type: 'textarea',
    },
  ];
  const latLongField = getLatLongFieldForEvent();
  const editableFields = latLongField
    ? [
        { key: latLongField.key, label: latLongField.label, type: 'text' },
        ...baseFields,
      ]
    : baseFields;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Edit Activity #{activity.id}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {editableFields.map(({ key, label, type }) => (
              <div
                key={key}
                className={type === 'textarea' ? 'md:col-span-2' : ''}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {label}
                </label>
                {type === 'textarea' ? (
                  <textarea
                    value={(formData[key as keyof Activity] as string) || ''}
                    onChange={(e) =>
                      handleChange(key as keyof Activity, e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    rows={3}
                    disabled={isLoading}
                  />
                ) : (
                  <input
                    type={type}
                    value={
                      (formData[key as keyof Activity] as string | number) || ''
                    }
                    onChange={(e) =>
                      handleChange(
                        key as keyof Activity,
                        type === 'number'
                          ? Number(e.target.value) || 0
                          : e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                    disabled={isLoading}
                  />
                )}
              </div>
            ))}
          </div>

          {activity.eventType === 'DUCT' && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Duct Details
              </h3>

              {/* Start Duct Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
                    Start Duct
                  </h4>
                  <button
                    type="button"
                    onClick={() => addDuctEntry('start')}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Plus size={16} /> Add Entry
                  </button>
                </div>
                {startDuctData.map((duct, index) => (
                  <div key={index} className="flex gap-3 mb-3 items-start">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        Coil Number
                      </label>
                      <input
                        type="text"
                        value={duct.coil_number}
                        onChange={(e) =>
                          handleDuctChange(
                            'start',
                            index,
                            'coil_number',
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        Meter
                      </label>
                      <input
                        type="text"
                        value={duct.meter}
                        onChange={(e) =>
                          handleDuctChange(
                            'start',
                            index,
                            'meter',
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDuctEntry('start', index)}
                      className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {startDuctData.length === 0 && (
                  <p className="text-sm text-gray-500">No start duct entries</p>
                )}
              </div>

              {/* End Duct Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">
                    End Duct
                  </h4>
                  <button
                    type="button"
                    onClick={() => addDuctEntry('end')}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded"
                  >
                    <Plus size={16} /> Add Entry
                  </button>
                </div>
                {endDuctData.map((duct, index) => (
                  <div key={index} className="flex gap-3 mb-3 items-start">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        Coil Number
                      </label>
                      <input
                        type="text"
                        value={duct.coil_number}
                        onChange={(e) =>
                          handleDuctChange(
                            'end',
                            index,
                            'coil_number',
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">
                        Meter
                      </label>
                      <input
                        type="text"
                        value={duct.meter}
                        onChange={(e) =>
                          handleDuctChange(
                            'end',
                            index,
                            'meter',
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDuctEntry('end', index)}
                      className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {endDuctData.length === 0 && (
                  <p className="text-sm text-gray-500">No end duct entries</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                Activity updated successfully!
              </p>
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
