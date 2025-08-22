import React, { useState, useEffect } from 'react';
import { Edit, Save, X, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface NotificationState {
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}

const PointDetails: React.FC = () => {
  const { PointProperties, setPointProperties, previewKmlData, apiGPSResponse, setGPSApiResponse } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ 
    type: 'success', 
    message: '', 
    visible: false 
  });
  const [showAddFieldDropdown, setShowAddFieldDropdown] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  const BASEURL_Val = import.meta.env.VITE_TraceAPI_URL;

  // Determine if we're in preview mode
  const isPreviewMode = !!previewKmlData;

  // Reset editing state when PointProperties changes
  useEffect(() => {
    if (PointProperties) {
      let updatedPointProperties = { ...PointProperties };
      
      // Auto-add lgd_code if missing in upload mode
      if (!isPreviewMode && PointProperties.properties) {
        const hasLgdCode = PointProperties.properties.lgd_code !== undefined;
        
        if (!hasLgdCode) {
          updatedPointProperties = {
            ...PointProperties,
            properties: {
              ...PointProperties.properties,
              lgd_code: '' // Automatically add empty lgd_code
            }
          };
          
          // Update context with the new lgd_code field WITHOUT triggering re-render loop
          setTimeout(() => {
            setPointProperties(updatedPointProperties);
          }, 0);
        }
      }
      
      setEditedData({
        ...updatedPointProperties,
        properties: { ...updatedPointProperties.properties }
      });
    }
    setIsEditing(false);
  }, [PointProperties?.name, isPreviewMode]); // Only depend on point name, not full object

  // Auto-hide notifications
  useEffect(() => {
    if (notification.visible) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.visible]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message, visible: true });
  };

  // Add custom field to properties
  const handleAddCustomField = () => {
    if (!newFieldKey.trim()) {
      showNotification('error', 'Please enter a field name');
      return;
    }

    if (PointProperties?.properties?.hasOwnProperty(newFieldKey.trim())) {
      showNotification('error', 'Field already exists');
      return;
    }

    if (PointProperties?.properties) {
      const updatedProperties = {
        ...PointProperties.properties,
        [newFieldKey.trim()]: newFieldValue.trim()
      };
      
      const updatedPointProperties = {
        ...PointProperties,
        properties: updatedProperties
      };
      
      // Update both the context and local edited data
      setPointProperties(updatedPointProperties);
      setEditedData(updatedPointProperties);
      
      // Reset form and close dropdown
      setNewFieldKey('');
      setNewFieldValue('');
      setShowAddFieldDropdown(false);
      
      showNotification('success', `Field "${newFieldKey.trim()}" added successfully!`);
    }
  };

  const handleCancelAddField = () => {
    setNewFieldKey('');
    setNewFieldValue('');
    setShowAddFieldDropdown(false);
  };

  // Check if lgd_code is missing from properties (only for upload mode)
  const isLgdCodeMissing = () => {
    if (isPreviewMode || !PointProperties?.properties) return false;
    const lgdCode = PointProperties.properties.lgd_code;
    return !lgdCode || lgdCode === 'NULL' || lgdCode === null || lgdCode === undefined || lgdCode === '';
  };

  // Add lgd_code to properties (only for upload mode)
  const handleAddLgdCode = () => {
    if (isPreviewMode) return; // Disable in preview mode
    
    if (PointProperties?.properties) {
      const updatedProperties = {
        ...PointProperties.properties,
        lgd_code: '' // Add empty lgd_code that user can fill
      };
      
      const updatedPointProperties = {
        ...PointProperties,
        properties: updatedProperties
      };
      
      // Update both the context and local edited data
      setPointProperties(updatedPointProperties);
      setEditedData(updatedPointProperties);
      
      showNotification('success', 'lgd_code field added. Click Edit to enter the value.');
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedData({
      ...PointProperties,
      properties: { ...PointProperties.properties }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({
      ...PointProperties,
      properties: { ...PointProperties.properties }
    });
  };

  const handleInputChange = (key: string, value: string, isProperty = true) => {
    if (isProperty) {
      setEditedData((prev: any) => ({
        ...prev,
        properties: {
          ...prev.properties,
          [key]: value
        }
      }));
    } else {
      setEditedData((prev: any) => ({
        ...prev,
        [key]: value
      }));
    }
  };

  const handleSave = async () => {
    if (!editedData) return;

    try {
      setIsLoading(true);
      
      if (isPreviewMode) {
        // PREVIEW MODE: Save to API (database)
        const isPoint = PointProperties.properties !== undefined;
        const type = isPoint ? "point" : "line";
        
        let updatePayload;
        
        if (isPoint) {
          // For GPS points with properties
          updatePayload = {
            type: "point",
            id: editedData.properties?.id || editedData.id || editedData.properties?.FID,
            properties: editedData.properties
          };
        } else {
          // For line/route connections
          updatePayload = {
            type: "line",
            id: editedData.id || editedData.connection_id,
            properties: {
              start: editedData.start,
              end: editedData.end,
              length: editedData.length,
              existing: editedData.existing,
              name: editedData.name || `${editedData.start} TO ${editedData.end}`,
              ...editedData.properties
            }
          };
        }

        // API call to save to database
        const response = await fetch('https://api.tricadtrack.com/save-properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Update failed: ${response.status}`);
        }

        showNotification('success', `${type === 'point' ? 'Point' : 'Line'} properties saved to database!`);
        
      } else {
        // UPLOAD MODE: Save to browser context (temporary data)
        // Update the underlying GPS response data to persist changes
        if (apiGPSResponse?.points && editedData.name) {
          const updatedPoints = apiGPSResponse.points.map((point: any) => {
            if (point.name === editedData.name) {
              return {
                ...point,
                ...editedData,
                properties: {
                  ...point.properties,
                  ...editedData.properties
                }
              };
            }
            return point;
          });
          
          // Update the GPS response to persist changes
          setGPSApiResponse({ points: updatedPoints });
        }
        
        
      }
      
      // Always update the current point context and exit editing mode
      setPointProperties(editedData);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error saving properties:', error);
      showNotification('error', `Failed to save properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderEditableField = (key: string, value: any, isProperty = true) => {
    const currentValue = isProperty ? editedData.properties?.[key] : editedData[key];
    
    // Special handling for certain fields
    const isReadOnly = ['FID', 'GlobalID', 'id'].includes(key);
    const isTextArea = ['remarks', 'obs', 'conn_str'].includes(key);
    const isNumeric = ['lat', 'long', 'blk_code', 'dt_code', 'st_code', 'cable_len', 'phase'].includes(key);

    if (isReadOnly) {
      return (
        <div className="text-gray-500 bg-gray-50 px-2 py-1 rounded text-sm min-w-0 break-words">
          {value !== 'NULL' && value !== null && value !== undefined ? String(value) : '-'}
        </div>
      );
    }

    if (isTextArea) {
      return (
        <textarea
          value={currentValue || ''}
          onChange={(e) => handleInputChange(key, e.target.value, isProperty)}
          className="w-full min-w-[200px] max-w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
          rows={2}
          placeholder={`Enter ${key}...`}
        />
      );
    }

    return (
      <input
        type={isNumeric ? 'number' : 'text'}
        value={currentValue || ''}
        onChange={(e) => handleInputChange(key, e.target.value, isProperty)}
        className="w-full min-w-[150px] max-w-full px-2 py-1 border border-gray-300 rounded text-sm"
        placeholder={`Enter ${key}...`}
        step={isNumeric && ['lat', 'long'].includes(key) ? '0.000001' : '1'}
      />
    );
  };

  if (!PointProperties) {
    return (
      <div className="border rounded-md p-4">
        <h3 className="font-medium text-sm mb-3 text-blue-800">Point Details</h3>
        <div>Hover over a marker to view details.</div>
      </div>
    );
  }

  return (
    <div className="border rounded-md p-4 relative">
      {/* Custom CSS for hiding scrollbars */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Safari and Chrome */
        }
      `}</style>
      
      {/* Notification */}
      {notification.visible && (
        <div 
          className={`absolute top-2 right-2 z-50 p-2 rounded-md shadow-lg flex items-center text-xs max-w-xs ${
            notification.type === 'success' 
              ? 'bg-green-100 border border-green-300 text-green-700' 
              : 'bg-red-100 border border-red-300 text-red-700'
          }`}
        >
          {notification.type === 'success' 
            ? <CheckCircle size={14} className="mr-1" /> 
            : <AlertCircle size={14} className="mr-1" />
          }
          <span className="truncate">{notification.message}</span>
        </div>
      )}

      {/* Header with Edit Controls */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-sm text-blue-800">
          {PointProperties.name || 'Point Details'}
        </h3>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
              title="Edit point details"
            >
              <Edit size={12} />
              Edit
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save changes"
              >
                {isLoading ? (
                  <div className="animate-spin w-3 h-3 border border-green-700 border-t-transparent rounded-full" />
                ) : (
                  <Save size={12} />
                )}
                Save
              </button>
              <button
                onClick={handleCancel}
                disabled={isLoading}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors disabled:opacity-50"
                title="Cancel editing"
              >
                <X size={12} />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Custom Field Dropdown - Only show in UPLOAD MODE */}
      {!isPreviewMode && PointProperties.properties && (
        <div className="mb-3 pb-3 border-b border-gray-200">
          {!showAddFieldDropdown ? (
            <button
              onClick={() => setShowAddFieldDropdown(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 rounded transition-colors border border-orange-300"
              title="Add custom field to this point"
            >
              <Plus size={12} />
              Add Field
            </button>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">Add Custom Field</h4>
                <button
                  onClick={handleCancelAddField}
                  className="text-gray-400 hover:text-gray-600"
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    placeholder="Enter field name (e.g., custom_field, remarks)"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Field Value
                  </label>
                  <input
                    type="text"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    placeholder="Enter field value"
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAddCustomField}
                  className="flex-1 px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors border border-green-300 font-medium"
                >
                  Add Field
                </button>
                <button
                  onClick={handleCancelAddField}
                  className="flex-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors border border-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2 overflow-x-auto max-h-96 overflow-y-auto scrollbar-hide">
  <div className="min-w-[600px] pr-2">
    {PointProperties.properties && Object.keys(PointProperties.properties).length > 0 ? (
      // Render detailed properties
      Object.entries(PointProperties.properties).map(([key, value], index) => (
        <div key={index}>
          <div className="flex text-sm gap-4 items-start py-1">
            <div className="w-32 text-gray-900 font-medium whitespace-nowrap flex-shrink-0">
              {key}
              {key === 'lgd_code' && (
                <span className="text-orange-600 text-xs ml-1" title="Location Government Directory Code">
                  *
                </span>
              )}
            </div>
            <div className="text-gray-600 flex-grow min-w-0">
              {isEditing ? (
                <div className="min-w-[200px]">
                  {renderEditableField(key, value, true)}
                </div>
              ) : (
                <span className="truncate block">
                  {value !== 'NULL' && value !== null && value !== undefined && value !== '' ? String(value) : '-'}
                </span>
              )}
            </div>
          </div>
          <hr className="border-gray-200" />
        </div>
      ))
    ) : (
      // Fallback: Show basic route info when no detailed properties available
      <div>
        {/* Add a header to show this is basic route info */}
        <div className="mb-3 p-2 bg-blue-50 rounded-md">
          <h4 className="text-sm font-medium text-blue-800">Route Connection Details</h4>
          <p className="text-xs text-blue-600">Basic connection information (detailed properties not available)</p>
        </div>
        
        {/* Existing basic route rendering */}
        <div className="flex text-sm gap-4 items-start py-1">
          <div className="w-32 text-gray-900 font-medium whitespace-nowrap flex-shrink-0">Point A</div>
          <div className="text-gray-600 flex-grow min-w-0">
            {isEditing ? (
              <div className="min-w-[200px]">
                {renderEditableField('start', PointProperties.start, false)}
              </div>
            ) : (
              PointProperties.start || '-'
            )}
          </div>
        </div>
        <hr />
        
        <div className="flex text-sm gap-4 items-start py-1">
          <div className="w-32 text-gray-900 font-medium whitespace-nowrap flex-shrink-0">Point B</div>
          <div className="text-gray-600 flex-grow min-w-0">
            {isEditing ? (
              <div className="min-w-[200px]">
                {renderEditableField('end', PointProperties.end, false)}
              </div>
            ) : (
              PointProperties.end || '-'
            )}
          </div>
        </div>
        <hr />
        
        <div className="flex text-sm gap-4 items-start py-1">
          <div className="w-32 text-gray-900 font-medium whitespace-nowrap flex-shrink-0">Length</div>
          <div className="text-gray-600 flex-grow min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-2 min-w-[200px]">
                <input
                  type="number"
                  value={Number(editedData.length) || 0}
                  onChange={(e) => handleInputChange('length', e.target.value, false)}
                  className="flex-grow min-w-[120px] px-2 py-1 border border-gray-300 rounded text-sm"
                  step="0.01"
                  min="0"
                />
                <span className="text-xs text-gray-500 whitespace-nowrap">km</span>
              </div>
            ) : (
              `${(Number(PointProperties.length) || 0).toFixed(2)} km`
            )}
          </div>
        </div>
        <hr />
        
        <div className="flex text-sm gap-4 items-start py-1">
          <div className="w-32 text-gray-900 font-medium whitespace-nowrap flex-shrink-0">Existing</div>
          <div className="text-gray-600 flex-grow min-w-0">
            {isEditing ? (
              <div className="min-w-[120px]">
                <select
                  value={editedData.existing ? 'true' : 'false'}
                  onChange={(e) => handleInputChange('existing', e.target.value === 'true', false)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            ) : (
              PointProperties.existing ? 'Yes' : 'No'
            )}
          </div>
        </div>
        <hr />
      </div>
    )}
  </div>
</div>
    </div>
  );
};

export default PointDetails;