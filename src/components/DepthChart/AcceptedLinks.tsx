import axios from 'axios';
import { useEffect, useState } from 'react';
import { Search, PenIcon, Check, X } from 'lucide-react';
import moment from 'moment';
import DataTable, { TableColumn } from 'react-data-table-component';
import { ToastContainer, toast } from 'react-toastify';

interface AcceptedLinkRow {
  id: number;
  state_id: number;
  district_id: number;
  block_id: number;
  start_location: number;
  end_location: number;
  link_name: string;
  total_distance_meters: number | null;
  actual_distance_meters: number | null;
  survey_count: number;
  updated_at: string;
  state_name: string;
  district_name: string;
  block_name: string;
  completion_percent: number | null;
}

interface AcceptedLinksProps {
  selectedState: string | null;
  selectedDistrict: string | null;
  selectedBlock: string | null;
  globalsearch: string;
  filtersReady: boolean;
}

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

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

const AcceptedLinks: React.FC<AcceptedLinksProps> = ({
  selectedState,
  selectedDistrict,
  selectedBlock,
  globalsearch,
  filtersReady,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AcceptedLinkRow[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!filtersReady) return;

    const fetchAcceptedLinks = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, string | number> = {
          page,
          limit: perPage,
        };
        if (selectedState) params.state_id = selectedState;
        if (selectedDistrict) params.district_id = selectedDistrict;
        if (selectedBlock) params.block_id = selectedBlock;
        if (globalsearch.trim()) params.search = globalsearch.trim();

        const response = await axios.get<{
          status: boolean;
          count: number;
          totalCount: number;
          totalPages: number;
          currentPage: number;
          pageSize: number;
          data: AcceptedLinkRow[];
        }>(`${TraceBASEURL}/get-accepted-links`, { params });

        if (response.data.status) {
          setData(response.data.data);
          setTotalRows(response.data.totalCount ?? response.data.count ?? 0);
        } else {
          setData([]);
          setTotalRows(0);
        }
      } catch (err) {
        console.error('Error fetching accepted links', err);
        setError('Failed to fetch accepted links');
        setData([]);
        setTotalRows(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAcceptedLinks();
  }, [
    selectedState,
    selectedDistrict,
    selectedBlock,
    globalsearch,
    filtersReady,
    page,
    perPage,
  ]);

  useEffect(() => {
    setPage(1);
  }, [selectedState, selectedDistrict, selectedBlock, globalsearch]);

  const startEdit = (row: AcceptedLinkRow) => {
    setEditingId(row.id);
    setEditValue(
      row.actual_distance_meters != null ? String(row.actual_distance_meters) : '',
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = (row: AcceptedLinkRow) => {
    const parsed = editValue.trim() === '' ? null : Number(editValue);
    if (editValue.trim() !== '' && Number.isNaN(parsed as number)) {
      toast.error('Enter a valid number for actual distance.');
      return;
    }

    setData((prev) =>
      prev.map((item) =>
        item.id === row.id ? { ...item, actual_distance_meters: parsed } : item,
      ),
    );
    setEditingId(null);
    setEditValue('');
    toast.success('Actual distance updated.');
  };

  const columns: TableColumn<AcceptedLinkRow>[] = [
    {
      name: 'Link Name',
      selector: (row) => row.link_name,
      sortable: true,
      wrap: true,
      minWidth: '220px',
    },
    {
      name: 'State',
      selector: (row) => row.state_name,
      sortable: true,
      wrap: true,
    },
    {
      name: 'District',
      selector: (row) => row.district_name,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Block',
      selector: (row) => row.block_name,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Total Distance (m)',
      selector: (row) => row.total_distance_meters ?? 0,
      sortable: true,
      cell: (row) => (row.total_distance_meters ?? 0).toFixed(2),
    },
    {
      name: 'Actual Distance (m)',
      minWidth: '170px',
      cell: (row) => {
        if (editingId === row.id) {
          return (
            <div className="flex items-center gap-1">
              <input
                type="number"
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(row);
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:border-blue-400"
              />
              <button
                onClick={() => saveEdit(row)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEdit}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span>
              {row.actual_distance_meters != null
                ? row.actual_distance_meters.toFixed(2)
                : '-'}
            </span>
            <button
              onClick={() => startEdit(row)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit actual distance"
            >
              <PenIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
    {
      name: 'Survey Count',
      selector: (row) => row.survey_count,
      sortable: true,
    },
    {
      name: 'Completion %',
      selector: (row) => row.completion_percent ?? 0,
      sortable: true,
      cell: (row) =>
        row.completion_percent != null ? `${row.completion_percent}%` : '-',
    },
    {
      name: 'Updated',
      selector: (row) => row.updated_at,
      sortable: true,
      maxWidth: '160px',
      cell: (row) => moment(row.updated_at).format('DD/MM/YYYY, hh:mm A'),
    },
  ];

  if (error) {
    return (
      <div
        className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
        role="alert"
      >
        <span className="font-medium">Error loading data:</span> {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        {data.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No accepted links found
            </h3>
            <p className="text-gray-500">
              {globalsearch
                ? 'Try adjusting your search or filter criteria.'
                : 'There are no accepted links available.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={data}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationPerPage={perPage}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              highlightOnHover
              pointerOnHover
              responsive
              customStyles={customStyles}
              noHeader
              onChangePage={(p) => setPage(p)}
              onChangeRowsPerPage={(newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
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
      </div>
      <ToastContainer />
    </div>
  );
};

export default AcceptedLinks;
