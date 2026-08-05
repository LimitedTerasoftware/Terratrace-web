import { useEffect, useState } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getAuthHeaders } from '../../utils/accessControl';

interface GpOption {
  id: number;
  name: string;
}

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  blockId: string | number | null;
  surveyIds: number[];
  baseUrl: string;
}

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

export function EditLinkModal({
  isOpen,
  onClose,
  onSuccess,
  blockId,
  surveyIds,
  baseUrl,
}: EditLinkModalProps) {
  const [gpOptions, setGpOptions] = useState<GpOption[]>([]);
  const [loadingGps, setLoadingGps] = useState(false);
  const [startLocation, setStartLocation] = useState<string>('');
  const [endLocation, setEndLocation] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !blockId) return;

    const fetchGps = async () => {
      try {
        setLoadingGps(true);
        setError(null);
        const response = await axios.get(`${TraceBASEURL}/gpdata`, {
          params: { block_code: blockId },
          headers: getAuthHeaders(),
        });
        setGpOptions(response.data || []);
      } catch (err) {
        console.error('Error fetching GP data:', err);
        setError('Failed to fetch GP list');
        setGpOptions([]);
      } finally {
        setLoadingGps(false);
      }
    };

    fetchGps();
  }, [isOpen, blockId]);

  useEffect(() => {
    if (!isOpen) {
      setStartLocation('');
      setEndLocation('');
      setGpOptions([]);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!startLocation || !endLocation) {
      setError('Please select both Start GP and End GP');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await axios.post(`${baseUrl}/surveys/bulk-location`, {
        survey_ids: surveyIds,
        startLocation,
        endLocation,
      });
      onSuccess();
    } catch (err) {
      console.error('Error updating link:', err);
      setError('Failed to update link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Link
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {surveyIds.length} survey(s) selected
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start GP
            </label>
            <select
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              disabled={loadingGps}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="">
                {loadingGps ? 'Loading GPs...' : 'Select Start GP'}
              </option>
              {gpOptions.map((gp) => (
                <option key={gp.id} value={gp.id}>
                  {gp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End GP
            </label>
            <select
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              disabled={loadingGps}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="">
                {loadingGps ? 'Loading GPs...' : 'Select End GP'}
              </option>
              {gpOptions.map((gp) => (
                <option key={gp.id} value={gp.id}>
                  {gp.name}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || loadingGps}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
