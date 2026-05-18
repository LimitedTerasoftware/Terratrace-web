import axios from 'axios';
import { Search, Eye, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import DataTable, { TableColumn } from 'react-data-table-component';

interface PoleSurveyData {
  id: number;
  user_id: number;
  company_id: number | null;
  state_id: number;
  district_id: number;
  block_id: number;
  gp_id: number;
  startLocation: number;
  endLocation: number;
  cableType: string | null;
  routeType: string | null;
  is_active: number;
  surveyType: string;
  construction_type: string;
  versions: string | null;
  machine_id: string | null;
  total_distance: number;
  workType: string;
  created_at: string;
  updated_at: string;
}

interface PolesProps {
  selectedState: string | null;
  selectedDistrict: string | null;
  selectedBlock: string | null;
  selectedStatus: number | null;
  worktype: string;
  fromdate: string;
  todate: string;
  globalsearch: string;
  filtersReady: boolean;
  OnData:()=>void;
}

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

const Poles: React.FC<PolesProps> = ({
  selectedState,
  selectedDistrict,
  selectedBlock,
  selectedStatus,
  worktype,
  fromdate,
  todate,
  globalsearch,
  filtersReady,
  OnData,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PoleSurveyData[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<PoleSurveyData | null>(
    null,
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPoleSurveyData = async () => {
      try {
        setLoading(true);
        setError('');
        const params: any = {};
        if (selectedState) params.state_id = selectedState;
        if (selectedDistrict) params.district_id = selectedDistrict;
        if (selectedBlock) params.block_id = selectedBlock;
        if (fromdate) params.from_date = fromdate;
        if (todate) params.to_date = todate;
        if (selectedStatus !== null) params.status = selectedStatus;
        if (worktype !== '') params.worktype = worktype;
        if (globalsearch.trim()) params.search = globalsearch.trim();

        const response = await axios.get<{
          status: boolean;
          data: PoleSurveyData[];
        }>(`${TraceBASEURL}/get-pole-survey-list`, { params });

        if (response.data.status) {
          setData(response.data.data);
          OnData();
        } else {
          console.error('API returned status=false', response.data);
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching pole survey data', error);
        setError('Failed to fetch pole survey data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (!filtersReady) return;
    fetchPoleSurveyData();
  }, [
    selectedState,
    selectedDistrict,
    selectedBlock,
    fromdate,
    todate,
    filtersReady,
    selectedStatus,
    worktype,
    globalsearch,
  ]);

  const filteredData = useMemo(() => {
    if (!globalsearch.trim()) return data;

    const lowerSearch = globalsearch.toLowerCase();

    return data.filter((row: PoleSurveyData) =>
      Object.values(row).some(
        (value) =>
          (typeof value === 'string' || typeof value === 'number') &&
          value.toString().toLowerCase().includes(lowerSearch),
      ),
    );
  }, [globalsearch, data]);

  const getStatusBadge = () => {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
        Active
      </span>
    );
  };

  const customStyles = {
    headCells: {
      style: {
        fontSize: '11px',
        fontWeight: '500',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        color: '#9CA3AF',
        backgroundColor: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        fontSize: '14px',
        color: '#111827',
        borderBottom: '1px solid #F3F4F6',
      },
    },
    rows: {
      style: {
        '&:hover': {
          backgroundColor: '#F9FAFB',
        },
      },
    },
  };

  const columns: TableColumn<PoleSurveyData>[] = [
    {
      name: 'Survey ID',
      selector: (row) => row.id,
      sortable: true,
    },
    {
      name: 'State ID',
      selector: (row) => row.state_id,
      sortable: true,
    },
    {
      name: 'District ID',
      selector: (row) => row.district_id,
      sortable: true,
    },
    {
      name: 'Block ID',
      selector: (row) => row.block_id,
      sortable: true,
    },
    {
      name: 'Construction Type',
      selector: (row) => row.construction_type || '-',
      sortable: true,
      cell: (row) => (
        <span
          title={row.construction_type || '-'}
          className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap truncate"
        >
          {row.construction_type || '-'}
        </span>
      ),
    },
    {
      name: 'Work Type',
      selector: (row) => row.workType || '-',
      sortable: true,
      cell: (row) => (
        <span title={row.workType || '-'}>{row.workType || '-'}</span>
      ),
    },
    {
      name: 'Cable Type',
      selector: (row) => row.cableType || '-',
      sortable: true,
      cell: (row) => (
        <span title={row.cableType || '-'}>{row.cableType || '-'}</span>
      ),
    },
    {
      name: 'Route Type',
      selector: (row) => row.routeType || '-',
      sortable: true,
      cell: (row) => (
        <span title={row.routeType || '-'}>{row.routeType || '-'}</span>
      ),
    },
    {
      name: 'Start Location',
      selector: (row) => row.startLocation,
      sortable: true,
    },
    {
      name: 'End Location',
      selector: (row) => row.endLocation,
      sortable: true,
    },
    {
      name: 'Total Distance',
      selector: (row) => row.total_distance || '0.00',
      sortable: true,
    },
    {
      name: 'Status',
      selector: (row) => row.is_active,
      sortable: true,
      cell: (row) => {
        const status = row.is_active as 0 | 1 | 2;
        const statusConfig = {
          0: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
          1: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
          2: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
        };
        const config = statusConfig[status] || {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800',
        };

        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      name: 'Created',
      selector: (row) => row.created_at,
      sortable: true,
      cell: (row) => moment(row.created_at).format('DD/MM/YYYY'),
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedSurvey(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      maxWidth: '120px',
    },
  ];

  if (error) {
    return (
      <div
        className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
        role="alert"
      >
        <span className="font-medium">Error loading data:</span> {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        {filteredData.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No pole survey data found
            </h3>
            <p className="text-gray-500">
              {globalsearch
                ? 'Try adjusting your search or filter criteria.'
                : 'There is no pole survey data available.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              highlightOnHover
              pointerOnHover
              striped={false}
              dense={false}
              responsive
              customStyles={customStyles}
              noHeader
              progressPending={loading}
              progressComponent={
                <div className="flex items-center justify-center py-8">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-500"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              }
            />
          </div>
        )}

        {selectedSurvey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Pole Survey Details
                  </h3>
                  <button
                    onClick={() => setSelectedSurvey(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Survey ID
                    </label>
                    <p className="text-gray-900 font-medium">
                      {selectedSurvey.id}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      State ID
                    </label>
                    <p className="text-gray-900">{selectedSurvey.state_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      District ID
                    </label>
                    <p className="text-gray-900">
                      {selectedSurvey.district_id}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Block ID
                    </label>
                    <p className="text-gray-900">{selectedSurvey.block_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Construction Type
                    </label>
                    <p className="text-gray-900">
                      {selectedSurvey.construction_type || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Work Type
                    </label>
                    <p className="text-gray-900">
                      {selectedSurvey.workType || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Start Location
                    </label>
                    <p className="text-gray-900">
                      {selectedSurvey.startLocation}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      End Location
                    </label>
                    <p className="text-gray-900">
                      {selectedSurvey.endLocation}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Total Distance
                    </label>
                    <p className="text-gray-900">
                      {selectedSurvey.total_distance}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    {getStatusBadge()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Created At
                    </label>
                    <p className="text-gray-900 text-sm">
                      {moment(selectedSurvey.created_at).format(
                        'DD/MM/YYYY, hh:mm A',
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Last Updated
                    </label>
                    <p className="text-gray-900 text-sm">
                      {moment(selectedSurvey.updated_at).format(
                        'DD/MM/YYYY, hh:mm A',
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedSurvey(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Poles;
