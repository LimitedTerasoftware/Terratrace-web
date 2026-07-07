import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable, { TableColumn } from 'react-data-table-component';
import {
  PoleSurveyorDetails,
  PoleSurveyorDetailsResponse,
} from '../../types/aerial-survey';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

const rankColors = ['bg-blue-600', 'bg-gray-400', 'bg-yellow-600'];

const columns: TableColumn<PoleSurveyorDetails>[] = [
  {
    name: 'RANK',
    selector: (row) => row.rank,
    width: '70px',
    cell: (row) => (
      <span
        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${rankColors[row.rank - 1] || 'bg-gray-300'}`}
      >
        {row.rank}
      </span>
    ),
  },
  {
    name: 'SURVEYOR NAME',
    cell: (row) => (
      <div>
        <p className="font-medium text-gray-800">{row.surveyor_name}</p>
        <p className="text-xs text-gray-400">{row.contact_no}</p>
      </div>
    ),
  },
  {
    name: 'POLES',
    selector: (row) => row.poles,
    right: true,
    cell: (row) => (
      <span className="font-medium text-gray-700">
        {row.poles.toLocaleString()}
      </span>
    ),
  },
  {
    name: 'DIST. (KM)',
    selector: (row) => row.distance_km,
    right: true,
    cell: (row) => <span className="text-gray-600">{row.distance_km}</span>,
  },
  {
    name: 'COMPL. %',
    selector: (row) => row.completion_percentage,
    right: true,
    cell: (row) => (
      <span className="font-semibold text-green-600">
        {row.completion_percentage}%
      </span>
    ),
  },
];

export default function SurveyorPerformance({
  state,
  district,
  block,
  formDate,
  toDate,
}: {
  state: string;
  district: string;
  block: string;
  formDate: string | null;
  toDate: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [surveyors, setSurveyors] = useState<PoleSurveyorDetails[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {};
      if (state) params.state_id = state;
      if (district) params.district_id = district;
      if (block) params.block_id = block;
      if (formDate) params.from_date = formDate;
      if (toDate) params.to_date = toDate;

      const response = await axios.get<PoleSurveyorDetailsResponse>(
        `${TraceBASEURL}/get-surveyor-performance`,
        { params },
      );
      if (response.data.status) {
        setSurveyors(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching surveyor performance', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [block, district, state, formDate, toDate]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Surveyor Performance
        </h2>
        {/* <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          VIEW ALL <ExternalLink size={12} />
        </button> */}
      </div>

      <DataTable
        columns={columns}
        data={surveyors}
        pagination
        paginationPerPage={10}
        paginationRowsPerPageOptions={[10, 25, 50, 100]}
        highlightOnHover
        pointerOnHover
        progressPending={loading}
        progressComponent={
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }
        noDataComponent={
          <div className="p-6 text-center text-gray-500">No data available</div>
        }
        customStyles={{
          headRow: {
            style: {
              borderBottom: '1px solid #f1f5f9',
            },
          },
          headCells: {
            style: {
              fontSize: '11px',
              fontWeight: 600,
              color: '#9ca3af',
              letterSpacing: '0.05em',
              paddingTop: '10px',
              paddingBottom: '10px',
            },
          },
          rows: {
            style: {
              borderBottom: '1px solid #f8fafc',
              fontSize: '14px',
            },
            highlightOnHoverStyle: {
              backgroundColor: '#f8fafc',
              transition: 'all 0.1s ease',
            },
          },
          cells: {
            style: {
              paddingTop: '14px',
              paddingBottom: '14px',
            },
          },
        }}
      />
    </div>
  );
}
