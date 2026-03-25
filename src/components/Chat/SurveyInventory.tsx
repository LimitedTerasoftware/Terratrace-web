import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable, { TableColumn } from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';
import { UGConstructionSurveyData } from '../../types/survey';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

interface SurveyInventoryProps {
  selectedState?: string;
  selectedDistrict?: string;
  selectedVendor?: string;
  searchQuery?: string;
  selectedPeriod?: string;
}

export default function SurveyInventory({
  selectedState,
  selectedDistrict,
  selectedVendor,
  searchQuery,
  selectedPeriod,
}: SurveyInventoryProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<UGConstructionSurveyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        const params: Record<string, string | number> = {
          limit: 10,
          sort: 'created_at.desc',
        };

        if (selectedState) params.state_id = selectedState;
        if (selectedDistrict) params.district_id = selectedDistrict;
        if (selectedVendor) params.firm_id = selectedVendor;
        if (searchQuery) params.search = searchQuery;

        const { fromDate, toDate } = getDateRange(selectedPeriod);
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;

        const response = await axios.get<{
          status: boolean;
          data: UGConstructionSurveyData[];
        }>(`${TraceBASEURL}/get-survey-data`, { params });
        if (response.data.status) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching survey data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurveyData();
  }, [
    selectedState,
    selectedDistrict,
    selectedVendor,
    searchQuery,
    selectedPeriod,
  ]);

  const getDateRange = (period?: string) => {
    if (period === 'all') {
      return { fromDate: undefined, toDate: undefined };
    }
    if (period === 'today') {
      const today = new Date();
      return {
        fromDate: today.toISOString().split('T')[0],
        toDate: today.toISOString().split('T')[0],
      };
    }
    if (period === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        fromDate: yesterday.toISOString().split('T')[0],
        toDate: yesterday.toISOString().split('T')[0],
      };
    }
    const days = parseInt(period || '30') || 30;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    return {
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
    };
  };

  const handleViewAll = () => {
    navigate('/construction');
  };

  const handleRowClicked = (row: UGConstructionSurveyData) => {
    navigate('/construction-details', {
      state: { row: row.id, multipreview: true },
    });
  };

  const formatDistance = (distance: string | null) => {
    if (!distance) return '0 km';
    const meters = parseFloat(distance);
    if (isNaN(meters)) return '0 km';
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const columns: TableColumn<UGConstructionSurveyData>[] = [
    {
      name: 'Survey ID',
      selector: (row) => row.id,
      sortable: true,
    },
    {
      name: 'State',
      selector: (row) => row.state_name,
      sortable: true,
      wrap: true,
      cell: (row) => <span title={row.state_name}>{row.state_name}</span>,
    },
    {
      name: 'District',
      selector: (row) => row.district_name,
      sortable: true,
      maxWidth: '150px',
      wrap: true,
      cell: (row) => <span title={row.district_name}>{row.district_name}</span>,
    },
    {
      name: 'Block',
      selector: (row) => row.block_name,
      cell: (row) => (
        <span className="text-sm font-medium text-gray-900">
          {row.block_name}
        </span>
      ),
    },
    {
      name: 'Link',
      selector: (row) => row.start_lgd_name,
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {row.start_lgd_name} -{row.end_lgd_name}
        </span>
      ),
    },

    {
      name: 'Construction Type',
      selector: (row) => row.construction_type || '-',
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {row.construction_type || '-'}
        </span>
      ),
    },
    {
      name: 'Distance',
      selector: (row) => row.total_distance || 0,
      cell: (row) => (
        <span className="text-sm font-medium text-gray-900">
          {formatDistance(row.total_distance)}
        </span>
      ),
    },
    {
      name: 'Created',
      selector: (row) => row.created_at,
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      name: 'User',
      selector: (row) => row.user_name,
      cell: (row) => (
        <span className="text-sm text-gray-600">{row.user_name}</span>
      ),
    },
  ];

  const surveys = data.slice(0, 10);

  return (
    <div className="bg-white rounded-lg border border-gray-200 ">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Surveys</h3>
        <button
          onClick={handleViewAll}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center"
        >
          View All
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      <div className="p-4 max-h-150 overflow-auto">
        <DataTable
          columns={columns}
          data={surveys}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10]}
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
            <div className="flex items-center justify-center h-48 text-gray-500">
              No survey data available
            </div>
          }
        />
      </div>
    </div>
  );
}
