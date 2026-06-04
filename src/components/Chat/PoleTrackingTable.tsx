import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';

interface AcceptedPole {
  id: number;
  survey_id: number;
  pole_type: string;
  latitude: number;
  longitude: number;
  distance: number;
  created_at: string;
  state_id: number;
  district_id: number;
  block_id: number;
  startLocation: number;
  endLocation: number;
  is_active: number;
  construction_type: string;
  state_name: string;
  district_name: string;
  block_name: string;
  block_code: number;
}

interface PoleTrackingTableProps {
  data: AcceptedPole[];
  loading: boolean;
}

export default function PoleTrackingTable({
  data,
  loading,
}: PoleTrackingTableProps) {
  const [search, setSearch] = useState('');

  const filtered = data.filter(
    (r) =>
      r.survey_id.toString().includes(search.toLowerCase()) ||
      r.state_name.toLowerCase().includes(search.toLowerCase()) ||
      r.district_name.toLowerCase().includes(search.toLowerCase()) ||
      r.block_name.toLowerCase().includes(search.toLowerCase()) ||
      r.pole_type.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: TableColumn<AcceptedPole>[] = [
    {
      name: 'SURVEY ID',
      selector: (row) => row.survey_id,
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-blue-600 cursor-pointer hover:underline">
          {row.survey_id}
        </span>
      ),
      width: '120px',
    },
    {
      name: 'POLE TYPE',
      selector: (row) => row.pole_type,
      sortable: true,
      cell: (row) => (
        <span
          className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-wide ${
            row.pole_type === 'existing'
              ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          {row.pole_type.toUpperCase()}
        </span>
      ),
    },
    {
      name:'STATE',
      selector: (row) => row.state_name,
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-gray-700">{row.state_name}</span>
      ),

    },
    {
      name:'DISTRICT',
      selector: (row) => row.district_name,
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-gray-700">{row.district_name}</span>
      ),
    },
    {
      name:'BLOCK',
      selector: (row) => row.block_name,
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-gray-700">{row.block_name}</span>
      ),
    },
    // {
    //   name: 'LOCATION',
    //   selector: (row) => `${row.state_name}, ${row.district_name}`,
    //   sortable: true,
    //   cell: (row) => (
    //     <div className="text-gray-700">
    //       <span className="block text-xs text-gray-500">{row.block_name}</span>
    //       <span className="text-sm">
    //         {row.state_name}, {row.district_name}
    //       </span>
    //     </div>
    //   ),
    // },
    {
      name: 'COORDINATES',
      cell: (row) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {row.latitude.toFixed(4)}, {row.longitude.toFixed(4)}
        </span>
      ),
    },
    {
      name: 'DISTANCE',
      selector: (row) => row.distance,
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-gray-700">
          {row.distance.toFixed(2)} m
        </span>
      ),
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
      name: 'CREATED AT',
      selector: (row) => row.created_at,
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-gray-900">
          Pole Tracking Table
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search ID or Location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-52"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <SlidersHorizontal size={14} />
            Filter
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
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
          <div className="p-6 text-center text-gray-500">
            No accepted poles found
          </div>
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
