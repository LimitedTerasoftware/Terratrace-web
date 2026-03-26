import {
  X,
  MapPin,
  Users,
  MessageSquare,
  CreditCard as Edit3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface IssueDetailsSidebarProps {
  issue: any;
  onClose: () => void;
  onViewMap?: (issue: any) => void;
}

export function IssueDetailsSidebar({
  issue,
  onClose,
  onViewMap,
}: IssueDetailsSidebarProps) {
  const navigate = useNavigate();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-700';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700';
      case 'LOW':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'RESOLVED':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const measuredDepth = parseFloat(issue.depth) || 0;
  const requiredDepth = 1.65;
  const variance = (measuredDepth - requiredDepth).toFixed(2);
  const isNegativeVariance = parseFloat(variance) < 0;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl font-bold">!</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">ISSUE DETAIL: {issue.survey_id}</p>
            <h2 className="text-xl font-semibold text-gray-900">
              {issue.category}
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex gap-2">
          <span
            className={`px-3 py-1 rounded-md text-xs font-medium ${getSeverityColor(issue.severity)}`}
          >
            {issue.severity}
          </span>
          <span
            className={`px-3 py-1 rounded-md text-xs font-medium ${getStatusColor(issue.status)}`}
          >
            {issue.status}
          </span>
        </div>

        {issue.depth !== null && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              MEASUREMENTS
            </h3>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Measured</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {measuredDepth.toFixed(2)} m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Required</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {requiredDepth.toFixed(2)} m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Variance</p>
                  <p
                    className={`text-lg font-semibold ${isNegativeVariance ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {variance} m
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {issue.evidence_url && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              FIELD EVIDENCE
            </h3>
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={issue.evidence_url}
                alt="Field Evidence"
                className="w-full h-64 object-cover"
              />
              {issue.location && (
                <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1 rounded text-xs">
                  {issue.location}
                </div>
              )}
              {issue.timestamp && (
                <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded text-xs">
                  {formatDate(issue.timestamp)}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => {
              if (onViewMap) {
                onViewMap(issue);
              } else {
                navigate('/construction-details', {
                  state: { row: issue.survey_id, multipreview: true },
                });
              }
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">View on Map</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Assign Issue</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Edit3 className="w-4 h-4" />
            <span className="text-sm font-medium">Change Status</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Add Comment</span>
          </button>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            ACTIVITY TIMELINE
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Detected</p>
                <p className="text-xs text-gray-500">
                  {issue.detected_by} • {formatDate(issue.timestamp)}
                </p>
              </div>
            </div>
            {issue.assigned_to && (
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Assigned</p>
                  <p className="text-xs text-gray-500">{issue.assigned_to}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Survey ID</p>
              <p className="font-medium text-gray-900">{issue.survey_id}</p>
            </div>
            <div>
              <p className="text-gray-500">Vendor</p>
              <p className="font-medium text-gray-900">{issue.vendor}</p>
            </div>
            <div>
              <p className="text-gray-500">Machine</p>
              <p className="font-medium text-gray-900">{issue.machine}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
