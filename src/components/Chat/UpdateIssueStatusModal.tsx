import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { machineApi } from '../Services/api';

interface IssueData {
  issue_type: string;
  category: string;
  severity: string;
  survey_id: number;
  point_id: number;
  status: string;
}

interface UpdateIssueStatusModalProps {
  issue: IssueData;
  onClose: () => void;
  onSuccess: (status: string, remarks: string) => void;
}

const STATUS_OPTIONS = ['OPEN', 'CHECKED'];

export default function UpdateIssueStatusModal({
  issue,
  onClose,
  onSuccess,
}: UpdateIssueStatusModalProps) {
  const [status, setStatus] = useState(
    STATUS_OPTIONS.includes(issue.status) ? issue.status : 'OPEN',
  );
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!remarks.trim()) {
      setError('Remarks are required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await machineApi.updateIssueStatus({
        survey_id: issue.survey_id,
        point_id: issue.issue_type === 'SPLIT' ? 0 : issue.point_id,
        category: issue.category,
        issue_type: issue.issue_type,
        status,
        remarks: remarks.trim(),
      });
      onSuccess(status, remarks.trim());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update status',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Update Issue Status
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status<span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks<span className="text-red-500">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (error) setError(null);
              }}
              disabled={isSubmitting}
              rows={3}
              placeholder="Enter remarks"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
