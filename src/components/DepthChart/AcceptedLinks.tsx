import axios from 'axios';
import { useEffect, useState } from 'react';
import { Search, PenIcon, Check, X, Trash2 } from 'lucide-react';
import moment from 'moment';
import DataTable, { TableColumn } from 'react-data-table-component';
import { ToastContainer, toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { isAdminUser } from '../../utils/accessControl';

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
  ofc_distance_meters:number | null;
  distance_diff_meters:number | null;
  status:number;
  ofc_status:number;
  ofc_distance_diff_meters:number;
}

interface AcceptedLinksSummary {
  totalLinks: number;
  totalDistanceMeters: number;
  actualDistanceMeters: number;
  ofcDistanceMeters: number;
  totalSurveyCount: number;
  overallCompletionPercent: number | null;
}

interface AcceptedLinksProps {
  selectedState: string | null;
  selectedDistrict: string | null;
  selectedBlock: string | null;
  globalsearch: string;
  filtersReady: boolean;
  tdStatus?: string;
  ofcStatus?: string;
  onSummaryChange?: (summary: AcceptedLinksSummary | null) => void;
  excel?: boolean;
  onExcel?: () => void;
  onExcelLoadingChange?: (loading: boolean) => void;
}

export type { AcceptedLinksSummary };

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
  tdStatus,
  ofcStatus,
  onSummaryChange,
  excel,
  onExcel,
  onExcelLoadingChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AcceptedLinkRow[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const adminAccess = isAdminUser();

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
        if (tdStatus) params.td_status = tdStatus;
        if (ofcStatus) params.ofc_status = ofcStatus;

        const response = await axios.get<{
          status: boolean;
          count: number;
          totalCount: number;
          totalPages: number;
          currentPage: number;
          pageSize: number;
          data: AcceptedLinkRow[];
          summary?: AcceptedLinksSummary;
        }>(`${TraceBASEURL}/get-accepted-links`, { params });

        if (response.data.status) {
          setData(response.data.data);
          setTotalRows(response.data.totalCount ?? response.data.count ?? 0);
          onSummaryChange?.(response.data.summary ?? null);
        } else {
          setData([]);
          setTotalRows(0);
          onSummaryChange?.(null);
        }
      } catch (err) {
        console.error('Error fetching accepted links', err);
        setError('Failed to fetch accepted links');
        setData([]);
        setTotalRows(0);
        onSummaryChange?.(null);
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
    tdStatus,
    ofcStatus,
    filtersReady,
    page,
    perPage,
  ]);

  useEffect(() => {
    setPage(1);
  }, [selectedState, selectedDistrict, selectedBlock, globalsearch, tdStatus, ofcStatus]);

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

  const saveEdit = async (row: AcceptedLinkRow) => {
    const trimmed = editValue.trim();
    const parsed = Number(trimmed);
    if (trimmed === '' || Number.isNaN(parsed)) {
      toast.error('Enter a valid number for actual distance.');
      return;
    }

    setSavingId(row.id);
    try {
      await axios.post(`${TraceBASEURL}/update-link`, {
        link_id: String(row.id),
        actual_distance_meters: String(parsed),
      });

      setData((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? { ...item, actual_distance_meters: parsed }
            : item,
        ),
      );
      setEditingId(null);
      setEditValue('');
      toast.success('BOQ distance updated.');
    } catch (err) {
      console.error('Error updating BOQ distance', err);
      toast.error('Failed to update BOQ distance.');
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusChange = async (
    row: AcceptedLinkRow,
    field: 'status' | 'ofc_status',
    value: number,
  ) => {
    const newStatus = field === 'status' ? value : row.status;
    const newOfcStatus = field === 'ofc_status' ? value : row.ofc_status;

    setStatusUpdatingId(row.id);
    try {
      await axios.post(`${TraceBASEURL}/update-link-status`, {
        link_id: String(row.id),
        status: newStatus,
        ofc_status: newOfcStatus,
      });

      setData((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? { ...item, status: newStatus, ofc_status: newOfcStatus }
            : item,
        ),
      );
      toast.success('Status updated.');
    } catch (err) {
      console.error('Error updating status', err);
      toast.error('Failed to update status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteLink = async (row: AcceptedLinkRow) => {
    if (
      !window.confirm(`Delete link "${row.link_name}"? This cannot be undone.`)
    )
      return;

    setDeletingId(row.id);
    try {
      await axios.post(`${TraceBASEURL}/delete-link/${row.id}`);
      setData((prev) => prev.filter((item) => item.id !== row.id));
      setTotalRows((prev) => Math.max(0, prev - 1));
      toast.success('Link deleted.');
    } catch (err) {
      console.error('Error deleting link', err);
      toast.error('Failed to delete link.');
    } finally {
      setDeletingId(null);
    }
  };

  const statusLabel = (status: number) => (status === 1 ? 'Completed' : 'Pending');

  const handleExportExcel = async () => {
    try {
      onExcelLoadingChange?.(true);
      const params: Record<string, string | number> = {
        page: 1,
        limit: totalRows > 0 ? totalRows : 10000,
      };
      if (selectedState) params.state_id = selectedState;
      if (selectedDistrict) params.district_id = selectedDistrict;
      if (selectedBlock) params.block_id = selectedBlock;
      if (globalsearch.trim()) params.search = globalsearch.trim();
      if (tdStatus) params.td_status = tdStatus;
      if (ofcStatus) params.ofc_status = ofcStatus;

      const response = await axios.get<{
        status: boolean;
        data: AcceptedLinkRow[];
      }>(`${TraceBASEURL}/get-accepted-links`, { params });

      const rows = response.data.status ? response.data.data : [];
      if (rows.length === 0) {
        toast.error('No data available to export.');
        return;
      }

      const headers = [
        'State',
        'District',
        'Block',
        'Link Name',
        'Survey Count',
        'BOQ Distance (m)',
        'T&D Distance (m)',
        'BOQ - T&D Distance Difference (m)',
        'Completion %',
        'T&D Status',
        'OFC/Blowing Distance',
        'T&D - OFC Distance Difference (m)',
        'OFC Completion %',
        'OFC Status',
        'Updated At',
      ];

      const dataRows = rows.map((row) => [
        row.state_name,
        row.district_name,
        row.block_name,
        row.link_name,
        row.survey_count,
        row.actual_distance_meters != null
          ? row.actual_distance_meters.toFixed(2)
          : '-',
        (row.total_distance_meters ?? 0).toFixed(2),
        (row.distance_diff_meters ?? 0).toFixed(2),
        row.completion_percent != null ? `${row.completion_percent}%` : '-',
        statusLabel(row.status),
        (row.ofc_distance_meters ?? 0).toFixed(2),
        (row.ofc_distance_diff_meters ?? 0).toFixed(2),
        '-',
        statusLabel(row.ofc_status),
        moment(row.updated_at).format('DD/MM/YYYY, hh:mm A'),
      ]);

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Accepted Links');
      XLSX.writeFile(workbook, 'Accepted_Links.xlsx', { compression: true });
    } catch (err) {
      console.error('Error exporting accepted links', err);
      toast.error('Failed to export data.');
    } finally {
      onExcelLoadingChange?.(false);
      onExcel?.();
    }
  };

  useEffect(() => {
    if (!excel) return;
    handleExportExcel();
  }, [excel]);

  const columns: TableColumn<AcceptedLinkRow>[] = [
 
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
      name: 'Link Name',
      selector: (row) => row.link_name,
      sortable: true,
      wrap: true,
      minWidth: '220px',
    },
    {
      name: 'Survey Count',
      selector: (row) => row.survey_count,
      sortable: true,
    },
     {
      name: 'BOQ Distance (m)',
      minWidth: '170px',
      cell: (row) => {
        if (adminAccess && editingId === row.id) {
          const isSaving = savingId === row.id;
          return (
            <div className="flex items-center gap-1">
              <input
                type="number"
                autoFocus
                value={editValue}
                disabled={isSaving}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(row);
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded outline-none focus:border-blue-400 disabled:opacity-50"
              />
              <button
                onClick={() => saveEdit(row)}
                disabled={isSaving}
                className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="p-1 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
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
            {adminAccess && (
              <button
                onClick={() => startEdit(row)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit actual distance"
              >
                <PenIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
    {
      name: 'T&D Distance (m)',
      selector: (row) => row.total_distance_meters ?? 0,
      sortable: true,
      cell: (row) => (row.total_distance_meters ?? 0).toFixed(2),
    },
    {
      name :'BOQ - T&D Distance Difference (mt)',
      selector:(row)=>row.distance_diff_meters ?? 0,
      sortable: true,
      cell: (row) =>(row.distance_diff_meters ?? 0).toFixed(2) ,

    },
    {
      name: 'Completion %',
      selector: (row) => row.completion_percent ?? 0,
      sortable: true,
      cell: (row) =>
        row.completion_percent != null ? `${row.completion_percent}%` : '-',
    },
      {
      name: 'T & D Status',
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => {
        const status = row.status as 0 | 1 ;
        const statusConfig = {
          0: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
          1: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
        };
        const config = statusConfig[status] || {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };

        if (!adminAccess) {
          return (
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.className}`}
            >
              {config.label}
            </span>
          );
        }

        const isUpdating = statusUpdatingId === row.id;

        return (
          <select
            value={status}
            disabled={isUpdating}
            onChange={(e) =>
              handleStatusChange(row, 'status', Number(e.target.value))
            }
            className={`text-xs font-semibold rounded-full px-2 py-1 border outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${config.className}`}
          >
            <option value={0}>Pending</option>
            <option value={1}>Completed</option>
          </select>
        );
      },
    },
    {
      name :'OFC/Blowing Distance',
      selector:(row)=>row.ofc_distance_meters ?? 0,
     sortable: true,
      cell: (row) =>(row.ofc_distance_meters ?? 0).toFixed(2),
    },
    {
      name :'T&D - OFC Distance Difference(mt)',
      selector:(row)=>row.ofc_distance_diff_meters ?? 0,
      sortable: true,
      cell: (row) =>(row.ofc_distance_diff_meters ?? 0).toFixed(2),

    },
   {
      name: 'OFC Completion %',
      selector: (row) => 0,
      sortable: true,
      cell: (row) =>
        '-',
    },
      {
      name: 'OFC Status',
      selector: (row) => row.ofc_status,
      sortable: true,
      cell: (row) => {
        const status = row.ofc_status as 0 | 1 ;
        const statusConfig = {
          0: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
          1: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
        };
        const config = statusConfig[status] || {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };

        if (!adminAccess) {
          return (
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${config.className}`}
            >
              {config.label}
            </span>
          );
        }

        const isUpdating = statusUpdatingId === row.id;

        return (
          <select
            value={status}
            disabled={isUpdating}
            onChange={(e) =>
              handleStatusChange(row, 'ofc_status', Number(e.target.value))
            }
            className={`text-xs font-semibold rounded-full px-2 py-1 border outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${config.className}`}
          >
            <option value={0}>Pending</option>
            <option value={1}>Completed</option>
          </select>
        );
      },
    },
    {
      name :'JointChamber Count',
      selector:(row)=>'-',
     sortable: true,
      cell: (row) =>'-',
    },
   {
      name: 'Updated',
      selector: (row) => row.updated_at,
      sortable: true,
      maxWidth: '160px',
      cell: (row) => moment(row.updated_at).format('DD/MM/YYYY, hh:mm A'),
    },
    ...(adminAccess
      ? [
          {
            name: 'Actions',
            cell: (row: AcceptedLinkRow) => {
              const isDeleting = deletingId === row.id;
              return (
                <button
                  onClick={() => handleDeleteLink(row)}
                  disabled={isDeleting}
                  className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  title="Delete link"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              );
            },
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: '80px',
          } as TableColumn<AcceptedLinkRow>,
        ]
      : []),
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
              paginationRowsPerPageOptions={[10, 25, 50, 100,150,200,250,300,400,500]}
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
