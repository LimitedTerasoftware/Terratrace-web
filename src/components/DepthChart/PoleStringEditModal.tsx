import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { PoleString } from '../../types/aerial-survey';
import axios from 'axios';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

interface PoleStringEditModalProps {
  row: PoleString | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PoleStringEditModal({
  row,
  isOpen,
  onClose,
  onSuccess,
}: PoleStringEditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (row) {
      const initial: Record<string, any> = {
        survey_id: row.survey_id ?? '',
        version: row.version,
        pit_id: row.pit_id ?? null,
        pole_type: row.pole_type ?? null,
        eventType: row.eventType ?? null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        distance: row.distance ?? null,
        line_type: row.line_type ?? null,
        pole_material: row.pole_material ?? null,
        pole_owner: row.pole_owner ?? null,
        pole_owner_description: row.pole_owner_description ?? null,
        fitting_type: row.fitting_type ?? null,
        fitting_type_new: row.fitting_type_new ?? null,
        pole_height: row.pole_height ?? null,
        drum_number: row.drum_number ?? null,
        meter: row.meter ?? null,
        road_crossing:null,
        landmark: row.landmark ? { ...row.landmark } : null,
        joint_enclosure: row.joint_enclosure
          ? { ...row.joint_enclosure }
          : null,
        is_active: row.is_active,
      };

      if (row.road_crossing) {
        try {
          const rc = JSON.parse(row.road_crossing);
          initial.road_crossing = rc;
          initial.crossingLength = rc.crossingLength ?? '';
          initial.crossingType = rc.crossingType ?? '';
        } catch {
          initial.road_crossing = null;
        }
      }

      setFormData(initial);
      setError(null);
    }
  }, [row]);

  if (!isOpen || !row) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      const payload: Record<string, any> = {
        survey_id: formData.survey_id,
        version: formData.version,
        pit_id: formData.pit_id,
        pole_type: formData.pole_type,
        eventType: formData.eventType,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        distance: Number(formData.distance),
        line_type: formData.line_type,
        pole_material: formData.pole_material,
        pole_owner: formData.pole_owner,
        pole_owner_description: formData.pole_owner_description,
        fitting_type: formData.fitting_type,
        fitting_type_new: formData.fitting_type_new,
        pole_height: formData.pole_height,
        drum_number: formData.drum_number,
        meter: formData.meter,
        crossingLength: formData.crossingLength,
        crossingType: formData.crossingType,
        road_crossing: formData.road_crossing
          ? JSON.stringify({
              ...(typeof row?.road_crossing === 'string'
                ? (() => {
                    try {
                      return JSON.parse(row.road_crossing);
                    } catch {
                      return {};
                    }
                  })()
                : row?.road_crossing || null),
              ...formData.road_crossing,
            })
          : null,
        landmark: row?.landmark
          ? { ...row.landmark, ...formData.landmark }
          : formData.landmark,
        joint_enclosure: row?.joint_enclosure
          ? { ...row.joint_enclosure, ...formData.joint_enclosure }
          : formData.joint_enclosure,
        is_active: formData.is_active,
        user_id: userData.id,
        user_name: userData.name,
      };

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
      setError(err instanceof Error ? err.message : 'Failed to update record');
    } finally {
      setIsLoading(false);
    }
  };

  const textField = (
    field: string,
    label: string,
    options?: { type?: string; placeholder?: string; className?: string },
  ) => (
    <div className={options?.className ?? ''}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type={options?.type ?? 'text'}
        value={formData[field] ?? ''}
        onChange={(e) =>
          handleChange(
            field,
            options?.type === 'number'
              ? Number(e.target.value) || 0
              : e.target.value,
          )
        }
        placeholder={options?.placeholder}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        disabled={isLoading}
      />
    </div>
  );

  const nestedTextField = (parent: string, field: string, label: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={formData[parent]?.[field] ?? ''}
        onChange={(e) => handleNestedChange(parent, field, e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        disabled={isLoading}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Pole Stringing #{row.id}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Basic Info */}
            <h3 className="md:col-span-3 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2">
              Basic Information
            </h3>
            {textField('survey_id', 'Survey ID', { type: 'number' })}
            {textField('version', 'Version')}
            {textField('pit_id', 'Pit ID')}
            {textField('pole_type', 'Pole Type')}
            {textField('eventType', 'Event Type')}
            {textField('latitude', 'Latitude', { type: 'number' })}
            {textField('longitude', 'Longitude', { type: 'number' })}
            {textField('distance', 'Distance (m)', { type: 'number' })}
            {textField('is_active', 'Is Active', { type: 'number' })}

            {/* Pole Details */}
            {(formData.eventType === "POLE") && (<>
            <h3 className="md:col-span-3 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2 mt-2">
              Pole Details
            </h3>
            {textField('line_type', 'Line Type')}
            {textField('pole_material', 'Pole Material')}
            {textField('pole_owner', 'Pole Owner')}
            {textField('pole_owner_description', 'Pole Owner Description')}
            {textField('fitting_type', 'Fitting Type')}
            {textField('fitting_type_new', 'Fitting Type (New)')}
            {textField('pole_height', 'Pole Height')}
            {textField('drum_number', 'Drum Number')}
            {textField('meter', 'Meter')}
            </>)}

            {(formData.eventType === 'ROADCROSSING') && (
              <>
                <h3 className="md:col-span-3 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2 mt-2">
                  Crossing Details
                </h3>
                {nestedTextField(
                  'road_crossing',
                  'crossingLength',
                  'Crossing Length',
                )}
                {nestedTextField(
                  'road_crossing',
                  'crossingType',
                  'Crossing Type',
                )}
                {nestedTextField(
                  'road_crossing',
                  'startcrossingLatlong',
                  'Start Crossing Lat/Lng',
                )}
                {nestedTextField(
                  'road_crossing',
                  'endcrossingLatlong',
                  'End Crossing Lat/Lng',
                )}
              </>
            )}

            {formData.eventType === 'LANDMARK' && (
              <>
                <h3 className="md:col-span-3 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2 mt-2">
                  Landmark
                </h3>
                {nestedTextField('landmark', 'name', 'Landmark Name')}
                {nestedTextField('landmark', 'distance', 'Landmark Distance')}
              </>
            )}

            {formData.eventType === 'JOINTENCLOSURE' && (
              <>
                <h3 className="md:col-span-3 text-lg font-medium text-gray-800 dark:text-gray-200 border-b pb-2 mt-2">
                  Joint Enclosure
                </h3>
                {nestedTextField('joint_enclosure', 'jointType', 'Joint Type')}
                {nestedTextField(
                  'joint_enclosure',
                  'startDrumNumber',
                  'Start Drum Number',
                )}
                {nestedTextField(
                  'joint_enclosure',
                  'startDrumMeter',
                  'Start Drum Meter',
                )}
                {nestedTextField(
                  'joint_enclosure',
                  'endDrumNumber',
                  'End Drum Number',
                )}
                {nestedTextField(
                  'joint_enclosure',
                  'endDrumMeter',
                  'End Drum Meter',
                )}
              </>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
