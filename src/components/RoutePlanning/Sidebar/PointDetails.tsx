import React, { useState, useEffect } from 'react';
import { Edit, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface NotificationState {
  type: 'success' | 'error';
  message: string;
  visible: boolean;
}

const PointDetails: React.FC = () => {
  const { PointProperties, setPointProperties } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ 
    type: 'success', 
    message: '', 
    visible: false 
  });

  const BASEURL_Val = import.meta.env.VITE_TraceAPI_URL;

  // Reset editing state when PointProperties changes
  useEffect(() => {
    if (PointProperties) {
      setEditedData({
        ...PointProperties,
        properties: { ...PointProperties.properties }
      });
    }
    setIsEditing(false);
  }, [PointProperties]);

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
      
      // Determine if this is a point or line based on the data structure
      const isPoint = PointProperties.properties !== undefined;
      const type = isPoint ? "point" : "line";
      
      // Prepare the update payload according to your API structure
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
            // Include any other line-specific properties
            ...editedData.properties
          }
        };
      }

      // API call to your specific endpoint
      const response = await fetch('https://traceapi.keeshondcoin.com/save-properties', {
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

      const result = await response.json();
      
      // Update the context with the new data
      setPointProperties(editedData);
      setIsEditing(false);
      
      showNotification('success', `${type === 'point' ? 'Point' : 'Line'} properties updated successfully!`);
      
    } catch (error) {
      console.error('Error updating properties:', error);
      showNotification('error', `Failed to update properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      {/* Content */}
      <div className="space-y-2 overflow-x-auto max-h-96 overflow-y-auto scrollbar-hide">
        <div className="min-w-[600px] pr-2">
          {PointProperties.properties ? (
            // Render properties
            Object.entries(PointProperties.properties).map(([key, value], index) => (
              <div key={index}>
                <div className="flex text-sm gap-4 items-start py-1">
                  <div className="w-32 text-gray-900 font-medium whitespace-nowrap flex-shrink-0">
                    {key}
                  </div>
                  <div className="text-gray-600 flex-grow min-w-0">
                    {isEditing ? (
                      <div className="min-w-[200px]">
                        {renderEditableField(key, value, true)}
                      </div>
                    ) : (
                      <span className="truncate block">
                        {value !== 'NULL' && value !== null && value !== undefined ? String(value) : '-'}
                      </span>
                    )}
                  </div>
                </div>
                <hr className="border-gray-200" />
              </div>
            ))
          ) : (
            // Render route connection details
            <div>
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
                        value={editedData.length || 0}
                        onChange={(e) => handleInputChange('length', e.target.value, false)}
                        className="flex-grow min-w-[120px] px-2 py-1 border border-gray-300 rounded text-sm"
                        step="0.01"
                        min="0"
                      />
                      <span className="text-xs text-gray-500 whitespace-nowrap">km</span>
                    </div>
                  ) : (
                    `${(PointProperties.length || 0).toFixed(2)} km`
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