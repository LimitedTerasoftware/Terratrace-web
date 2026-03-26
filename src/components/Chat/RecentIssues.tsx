import { ChevronRight, AlertTriangle, Eye } from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';

interface IssueData {
  issue_type: string;
  category: string;
  severity: string;
  survey_id: number;
  point_id: number;
  depth: string;
  location: string;
  vendor: string;
  machine: string;
  timestamp: string;
  status: string;
}

interface RecentIssuesProps {
  data?: IssueData[];
  isLoading?: boolean;
  onView?: (issue: IssueData) => void;
}

export default function RecentIssues({
  data,
  isLoading,
  onView,
}: RecentIssuesProps) {
  const navigate = useNavigate();

  const columns: TableColumn<IssueData>[] = [
    {
      name: 'Type',
      selector: (row) => getTypeLabel(row.issue_type, row.category),
      cell: (row) => (
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              row.severity === 'HIGH'
                ? 'bg-red-100'
                : row.severity === 'MEDIUM'
                  ? 'bg-blue-100'
                  : 'bg-green-100'
            }`}
          >
            <AlertTriangle
              className={`w-3 h-3 ${
                row.severity === 'HIGH'
                  ? 'text-red-600'
                  : row.severity === 'MEDIUM'
                    ? 'text-blue-600'
                    : 'text-green-600'
              }`}
            />
          </div>
          <span className="text-sm font-medium text-gray-900">
            {getTypeLabel(row.issue_type, row.category)}
          </span>
        </div>
      ),
    },
    {
      name: 'Category',
      selector: (row) => row.category,
      cell: (row) => (
        <span className="text-sm text-blue-600 font-medium hover:underline">
          {row.category}
        </span>
      ),
    },
       {
      name: 'Severity',
      selector: (row) => row.severity,
      cell: (row) => (
        <div className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full mr-2 ${getSeverityDotColor(row.severity)}`}
          />
          <span className="text-sm text-gray-900">{row.severity}</span>
        </div>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.status,
      cell: (row) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(row.status)}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: 'Depth',
      selector: (row) => row.depth,
      cell: (row) => (
        <span className="text-sm text-gray-900">{row.depth} m</span>
      ),
    },
    {
      name: 'Location',
      selector: (row) => row.location,
      cell: (row) => (
        <span
          className="text-sm text-gray-600 max-w-[120px] truncate block"
          title={row.location}
        >
          {row.location}
        </span>
      ),
    },
    {
      name: 'Vendor',
      selector: (row) => row.vendor,
      cell: (row) => (
        <span
          className="text-sm text-gray-600 max-w-[150px] truncate block"
          title={row.vendor}
        >
          {row.vendor}
        </span>
      ),
    },
    {
      name: 'Machine',
      selector: (row) => row.machine,
      cell: (row) => (
        <span
          className="text-sm text-gray-600 max-w-[120px] truncate block"
          title={row.machine}
        >
          {row.machine}
        </span>
      ),
    },
    {
      name: 'Survey ID',
      selector: (row) => row.survey_id,
      cell: (row) => (
        <span className="text-sm text-blue-600 font-medium hover:underline">
          {row.survey_id}
        </span>
      ),
    },
    {
      name: 'Point ID',
      selector: (row) => row.point_id,
      cell: (row) => (
        <span className="text-sm text-gray-600">{row.point_id}</span>
      ),
    },
    {
      name: 'Timestamp',
      selector: (row) => row.timestamp,
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.timestamp)}
        </span>
      ),
    },
 
    {
      name: 'Actions',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onView) {
              onView(row);
            } else {
              handleRowClicked(row);
            }
          }}
          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
      ignoreRowClick: true,
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSeverityDotColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-red-600';
      case 'MEDIUM':
        return 'bg-blue-600';
      default:
        return 'bg-green-600';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (issueType: string, category: string) => {
    if (issueType === 'DEPTH') {
      return 'Depth Variance';
    }
    return category.replace(/_/g, ' ');
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRowClicked = (row: IssueData) => {
    navigate('/construction-details', {
      state: { row: row.survey_id, multipreview: true },
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Issues</h3>
        <button   onClick={() => navigate('/construction-issues')} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center">
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      <div className="p-4">
        <DataTable
          columns={columns}
          data={data || []}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          highlightOnHover
          pointerOnHover
          onRowClicked={handleRowClicked}
          progressPending={isLoading}
          progressComponent={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          }
          noDataComponent={
            <div className="p-6 text-center text-gray-500">No issues found</div>
          }
        />
      </div>
    </div>
  );
}
