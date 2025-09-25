import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  Row
} from "@tanstack/react-table";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import ResponsivePagination from "./ResponsivePagination";
import { hasViewOnlyAccess } from "../../utils/accessControl";
import { ChevronDown, Eye, RotateCcw, Search, TableCellsMerge, User } from "lucide-react";

interface AerialSurvey {
  id: string;
  state_name: string;
  state_id: string;
  district_name: string;
  district_id: string;
  block_name: string;
  startGpName: string;
  startGpCoordinates: string;
  endGpName: string;
  endGpCoordinates: string;
  is_active: number;
  block_id: string;
  survey_id: string;
  company_id: string;
  user_id: string;
  startGpCode: string;
  endGpCode: string;
  created_at: string;
  updated_at: string;
  fullname: string,
  contact_no: number,
}

interface ApiResponse {
  data: AerialSurvey[];
  totalPages: number;
}

interface StateData {
  state_id: string;
  state_name: string;
  state_code: string;
}

interface District {
  district_id: string;
  district_name: string;
  state_code: string;
}

interface Block {
  block_id: string;
  block_name: string;
  district_code: string;
}
type StatusOption = {
  value: number;
  label: string;
};

const AerialSurvey: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const location = useLocation();
  const viewOnly = hasViewOnlyAccess();
  const [data, setData] = useState<AerialSurvey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editingRow, setEditingRow] = useState<AerialSurvey | null>(null);
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [globalsearch, setGlobalSearch] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersReady, setFiltersReady] = useState(false);

  const navigate = useNavigate();

  const statusMap: Record<number, string> = {
    1: "Accepted",
    2: "Rejected",
    0: "Pending",
  };

  const statusOptions: StatusOption[] = Object.entries(statusMap).map(
    ([value, label]) => ({
      value: Number(value),
      label,
    })
  );

  // Initialize from URL params or location state
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');

    if (statusParam) {
      setSelectedStatus(Number(statusParam));
    } else if (location.state?.selectedStatus !== undefined) {
      setSelectedStatus(location.state.selectedStatus);
    }

    if (location.state?.formdate) {
      setFromDate(location.state.formdate || '');
    }

    if (location.state?.todate) {
      setToDate(location.state.todate || '');
    }

    if (location.state?.selectedState) {
      setSelectedState(location.state.selectedState);
    }

    if (location.state?.selectedDistrict) {
      setSelectedDistrict(location.state.selectedDistrict);
    }

    if (location.state?.selectedBlock) {
      setSelectedBlock(location.state.selectedBlock);
    }

    if (location.state?.globalsearch) {
      setGlobalSearch(location.state.globalsearch);
    }

    if (location.state?.currentPage) {
      setPage(location.state.currentPage);
    }
  }, [location]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`${BASEURL}/aerial-surveys`, {
        params: {
          from_date: fromdate,
          to_date: todate,
          searchText: globalsearch,
          page,
          limit: pageSize,
          state: selectedState,
          district: selectedDistrict,
          block: selectedBlock,
          status: selectedStatus
        },
      });

      setData(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const state_id = searchParams.get('state_id') || null;
    const district_id = searchParams.get('district_id') || null;
    const block_id = searchParams.get('block_id') || null;
    const pageParam = searchParams.get('page') || '1';
    const status = searchParams.get('status') || null;
    const from_date = searchParams.get('from_date') || '';
    const to_date = searchParams.get('to_date') || "";
    const search = searchParams.get('search') || "";

    setSelectedState(state_id);
    setSelectedDistrict(district_id);
    setSelectedBlock(block_id);
    setSelectedStatus(status !== null ? Number(status) : null);
    setFromDate(from_date);
    setToDate(to_date);
    setGlobalSearch(search)
    setPage(Number(pageParam));
    setFiltersReady(true);
  }, []);

  useEffect(() => {
    if (!filtersReady) return;
    fetchData();
  }, [fromdate, todate, globalsearch, page, pageSize, selectedState, selectedDistrict, selectedBlock, selectedStatus, filtersReady]);

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${BASEURL}/aerial-surveys/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      alert("Failed to delete record.");
    }
  };

  const handleView = async (id: string) => {
    await navigate(`/survey/aerial-detail-view/${id}`, {
      state: {
        selectedState,
        selectedDistrict,
        selectedBlock,
        selectedStatus,
        globalsearch,
        fromdate,
        todate,
        currentPage: page
      }
    });
  };

  const handleEdit = async (id: string) => {
    await navigate(`/survey/Aerail-Edit/${id}`, {
      state: {
        selectedState,
        selectedDistrict,
        selectedBlock,
        selectedStatus,
        globalsearch,
        fromdate,
        todate,
        currentPage: page
      }
    });
  };

  const handleAccept = async (id: string) => {
    try {
      const response = await axios.post(`${BASEURL}/aerial-surveys/${id}/accept`);
      if (response.data.status === 1) {
        alert("Record accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting record:", error);
      alert("Failed to accept record.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await axios.post(`${BASEURL}/aerial-surveys/${id}/reject`);
      if (response.data.status === 1) {
        alert("Record rejected successfully!");
      }
    } catch (error) {
      console.error("Error rejecting record:", error);
      alert("Failed to reject record.");
    }
  };

  // Handle edit
  const handleEditSave = async () => {
    if (!editingRow) return;
    try {
      await axios.put(`${BASEURL}/aerial-surveys/${editingRow.id}`, editingRow);
      setData((prevData) => prevData.map((item) => (item.id === editingRow.id ? editingRow : item)));
      setEditingRow(null);
    } catch (error) {
      alert("Failed to update record.");
    }
  };

  useEffect(() => {
    axios.get(`${BASEURL}/states`)
      .then((res) => setStates(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch districts when state is selected
  useEffect(() => {
    if (selectedState) {
      axios.get(`${BASEURL}/districtsdata?state_code=${selectedState}`)
        .then((res) => setDistricts(res.data))
        .catch((err) => console.error(err));
    } else {
      setDistricts([]);
      // setSelectedDistrict(null);
    }
  }, [selectedState]);

  // Fetch blocks when district is selected
  useEffect(() => {
    if (selectedDistrict) {
      axios.get(`${BASEURL}/blocksdata?district_code=${selectedDistrict}`)
        .then((res) => setBlocks(res.data))
        .catch((err) => console.error(err));
    } else {
      setBlocks([]);
      // setSelectedBlock(null);
    }
  }, [selectedDistrict]);

  const columns = useMemo<ColumnDef<AerialSurvey>[]>(
    () => [
      {
        header: "Actions",
        cell: ({ row }: { row: Row<AerialSurvey> }) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleView(row.original.id)}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="View">
              <Eye className="w-4 h-4" />
            </button>
          </div>

        ),
      },
      { accessorKey: "state_name", header: "State Name" },
      { accessorKey: "district_name", header: "District Name" },
      { accessorKey: "block_name", header: "Block Name" },
      { accessorKey: "startGpName", header: " Start GP Name" },
      { accessorKey: "startGpCoordinates", header: "Start Gp Coordinates" },
      { accessorKey: "endGpName", header: "End GP Name" },
      { accessorKey: "endGpCoordinates", header: "End Gp Coordinates" },
      {
        accessorKey: "fullname", header: "Surveyor Name",
        cell: ({ row }) => (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{row.original.fullname}</div>
              <div className="text-sm text-gray-500">{row.original.contact_no}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }: { row: any }) => {
          const status = row.original.is_active as 0 | 1 | 2;
          const statusConfig = {
            0: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
            1: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
            2: { label: 'Rejected', className: 'bg-red-100 text-red-800' }
          };
          const config = statusConfig[status] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };

          return (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
              {config.label}
            </span>
          );
        }
      }
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const exportExcel = async () => {
    try {
      const response = await axios.get<ApiResponse>(`${BASEURL}/aerial-surveys`, {
        params:
        {
          from_date: fromdate,
          to_date: todate,
          isExport: 1,
          searchText: globalsearch,
          state: selectedState,
          district: selectedDistrict,
          block: selectedBlock,
          status: selectedStatus
        },
      });
      const allData: AerialSurvey[] = response.data.data;
      const rows = allData.map((data) => ({
        id: data.id,
        state_name: data.state_name,
        state_id: data.state_id,
        district_name: data.district_name,
        district_id: data.district_id,
        block_name: data.block_name,
        block_id: data.block_id,
        Surviour_Name: data.fullname,
        Surviour_Contact_Number: data.contact_no,
        survey_id: data.survey_id,
        company_id: data.company_id,
        user_id: data.user_id,
        startGpCode: data.startGpCode,
        startGpCoordinates: data.startGpCoordinates,
        startGpName: data.startGpName,
        endGpCode: data.endGpCode,
        endGpCoordinates: data.endGpCoordinates,
        endGpName: data.endGpName,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        Status: statusMap[data.is_active]
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Aerial Survey");

      // Customize header names
      XLSX.utils.sheet_add_aoa(worksheet, [
        ["ID", "State Name", "State ID", "District Name", "District ID", "Block Name", "Block ID", 'Surveyor Name', "Surveyor Contact Number", "Survey ID", "Company ID", "User ID",
          "Start GP Code", "Start GP Coordinates", "Start GP Name",
          "End GP Code", "End GP Coordinates", "End GP Name", "Is Active", "Created At", "Updated At", "Status"]
      ], { origin: "A1" });

      // Export file
      XLSX.writeFile(workbook, "AERIAL_SURVEY.xlsx", { compression: true });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const stateOptions = states.map((state) => ({
    value: String(state.state_id),
    label: state.state_name,
  }));

  const selectedStateOption = stateOptions.find(
    (opt) => opt.value === selectedState
  ) || null;

  const handleClearFilters = () => {
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedStatus(null);
    setGlobalSearch('');
    setFromDate('');
    setToDate('');
    setPage(1);
    const currentTab = searchParams.get('tab') || 'defaultTab';
    setSearchParams({
      tab: currentTab,
      page: '1',
    });
  };

  const handleFilterChange = (newState: string | null, newDistrict: string | null, newBlock: string | null, status: number | null, from_date: string | null, to_date: string | null, search: string | null, newPage = 1,) => {
    const currentTab = searchParams.get('tab') || 'defaultTab';
    const params: Record<string, string> = { tab: currentTab };
    if (newState) params.state_id = newState;
    if (newDistrict) params.district_id = newDistrict;
    if (newBlock) params.block_id = newBlock;
    if (status) params.status = String(status);
    if (from_date) params.from_date = from_date;
    if (to_date) params.to_date = to_date;
    if (search) params.search = search;
    params.page = newPage.toString();
    setSearchParams(params);
  };
  return (
    <div className="min-h-screen">
      {/* Search Bar and Filters Section */}
      <div className="mb-4 px-7">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
          {/* State Filter */}
          <div className="relative">
            <select
              value={selectedState || ''}
              onChange={(e) => {
                handleFilterChange(e.target.value, selectedDistrict, selectedBlock, selectedStatus, fromdate, todate, globalsearch, 1)
                setSelectedState(e.target.value || null);
                setPage(1);
              }}
              className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All States</option>
              {states.map((state) => (
                <option key={state.state_id} value={state.state_id}>
                  {state.state_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />

          </div>

          {/* District Filter */}
          <div className="relative">
            <select
              value={selectedDistrict || ''}
              onChange={(e) => {
                handleFilterChange(selectedState, e.target.value, selectedBlock, selectedStatus, fromdate, todate, globalsearch, 1)
                setSelectedDistrict(e.target.value || null);
                setPage(1);
              }}
              disabled={!selectedState}
              className="disabled:opacity-50 disabled:cursor-not-allowed w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Districts</option>
              {districts.map((district) => (
                <option key={district.district_id} value={district.district_id}>
                  {district.district_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />

          </div>

          {/* Block Filter */}
          <div className="relative">
            <select
              value={selectedBlock || ''}
              onChange={(e) => {
                handleFilterChange(selectedState, selectedDistrict, e.target.value, selectedStatus, fromdate, todate, globalsearch, 1)
                setSelectedBlock(e.target.value || null);
                setPage(1);
              }}
              disabled={!selectedDistrict}
              className="disabled:opacity-50 disabled:cursor-not-allowed w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Blocks</option>
              {blocks.map((block) => (
                <option key={block.block_id} value={block.block_id}>
                  {block.block_name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />

          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus !== null ? selectedStatus : ''}
              onChange={(e) => {
                handleFilterChange(selectedState, selectedDistrict, selectedBlock, Number(e.target.value), fromdate, todate, globalsearch, 1)
                setSelectedStatus(e.target.value !== '' ? Number(e.target.value) : null);
                setPage(1);
              }}
              className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />

          </div>

          {/* Date Filters */}
          <div className="relative">
            <input
              type="date"
              value={fromdate}
              onChange={(e) => {
                handleFilterChange(selectedState, selectedDistrict, selectedBlock, selectedStatus, e.target.value, todate, globalsearch, 1)
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="From Date"
            />
          </div>

          <div className="relative">
            <input
              type="date"
              value={todate}
              onChange={(e) => {
                handleFilterChange(selectedState, selectedDistrict, selectedBlock, selectedStatus, fromdate, e.target.value, globalsearch, 1)
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="To Date"
            />
          </div>
        </div>
        {/* Search Bar */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">

            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />

            <input
              type="text"
              placeholder="Search..."
              value={globalsearch}
              onChange={(e) => {
                handleFilterChange(selectedState, selectedDistrict, selectedBlock, selectedStatus, fromdate, todate, e.target.value, 1)
                setGlobalSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />

          </div>

          {/* Clear Filters Button */}
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"          >

            <RotateCcw className="w-4 h-4 mr-2" />
            <span>Reset Filters</span>
          </button>

          {/* Export Button */}
          {!viewOnly &&
            <button
              onClick={exportExcel}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"  >
              <TableCellsMerge className="w-4 h-4 mr-2" />
              Excel
            </button>}
        </div>
      </div>

      {/* Error message if API request failed */}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
          <span className="font-medium">Error loading data:</span> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-2">
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-2 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Responsive Pagination */}
      <ResponsivePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        itemsPerPage={data.length}
        totalItems={data.length}
      />

      {/* Edit Modal */}
      {editingRow && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-96 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Edit Record</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={editingRow.state_name}
                onChange={(e) => setEditingRow({ ...editingRow, state_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="State Name"
              />
              <input
                type="text"
                value={editingRow.district_name}
                onChange={(e) => setEditingRow({ ...editingRow, district_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="District Name"
              />
              <input
                type="text"
                value={editingRow.block_name}
                onChange={(e) => setEditingRow({ ...editingRow, block_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Block Name"
              />
              <input
                type="text"
                value={editingRow.startGpName}
                onChange={(e) => setEditingRow({ ...editingRow, startGpName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Start GP Name"
              />
              <input
                type="text"
                value={editingRow.startGpCoordinates}
                onChange={(e) => setEditingRow({ ...editingRow, startGpCoordinates: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Start GP Coordinates"
              />
              <input
                type="text"
                value={editingRow.endGpName}
                onChange={(e) => setEditingRow({ ...editingRow, endGpName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="End GP Name"
              />
              <input
                type="text"
                value={editingRow.endGpCoordinates}
                onChange={(e) => setEditingRow({ ...editingRow, endGpCoordinates: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="End GP Coordinates"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditSave}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-md hover:bg-green-700 outline-none"
              >
                Save
              </button>
              <button
                onClick={() => setEditingRow(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AerialSurvey;