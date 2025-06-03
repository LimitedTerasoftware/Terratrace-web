import { useEffect, useState, useMemo, useRef } from "react";
import axios from "axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { FaSearch } from "react-icons/fa";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Interfaces
interface StateExchange {
  state_id: string;
  state_code: string;
  state_name: string;
  created_at?: string;
  updated_at?: string;
}

interface District {
  district_id: string;
  state_code: string;
  district_name: string;
  district_code: string;
  created_at?: string;
  updated_at?: string;
}

interface BlockExchange {
  block_id: string;
  block_name: string;
  block_code: string;
  district_code: string;
  state_code: string;
  created_at?: string;
  updated_at?: string;
}

interface MasterDataResponse {
  result: boolean;
  data: {
    states: StateExchange[];
    districts: District[];
    blocks: BlockExchange[];
  };
}

type TabType = 'states' | 'districts' | 'blocks';
type AllDataTypes = StateExchange | District | BlockExchange;

const LocationManagement = () => {
  // Use ref to store raw data to avoid unnecessary re-renders
  const masterDataRef = useRef<MasterDataResponse['data'] | null>(null);
  
  // Common state
  const [activeTab, setActiveTab] = useState<TabType>('states');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch master data once on component mount
  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    setLoading(true);
    setError(null);
    try {
      const BASEURL = import.meta.env.VITE_API_BASE;
      const response = await axios.get<MasterDataResponse>(
        `${BASEURL}/masterData`
      );
      
      if (response.data.result) {
        masterDataRef.current = response.data.data;
      } else {
        throw new Error("Failed to fetch master data");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      console.error("Error fetching master data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered data based on active tab and search term
  const filteredData = useMemo(() => {
    if (!masterDataRef.current) return [];
    
    let data: any[] = [];
    switch (activeTab) {
      case 'states':
        data = masterDataRef.current.states;
        break;
      case 'districts':
        data = masterDataRef.current.districts;
        break;
      case 'blocks':
        data = masterDataRef.current.blocks;
        break;
    }

    if (!searchTerm) return data;

    // Filter based on search term
    return data.filter((item) => {
      const searchableFields = Object.values(item).join(' ').toLowerCase();
      return searchableFields.includes(searchTerm.toLowerCase());
    });
  }, [activeTab, searchTerm, masterDataRef.current]);

  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
    setSearchTerm(""); // Reset search when switching tabs
  };

  // Column definitions (removed actions column)
  const statesColumns: ColumnDef<AllDataTypes>[] = [
    { accessorKey: "state_name", header: "State Name" },
    { accessorKey: "state_code", header: "State Code" },
  ];

  const districtsColumns: ColumnDef<AllDataTypes>[] = [
    { accessorKey: "district_name", header: "District Name" },
    { accessorKey: "state_code", header: "State Code" },
    { accessorKey: "district_code", header: "District Code" },
  ];

  const blocksColumns: ColumnDef<AllDataTypes>[] = [
    { accessorKey: "block_name", header: "Block Name" },
    { accessorKey: "block_code", header: "Block Code" },
    { accessorKey: "district_code", header: "District Code" },
    { accessorKey: "state_code", header: "State Code" },
  ];

  // Get current columns based on active tab
  const getCurrentColumns = (): ColumnDef<AllDataTypes>[] => {
    switch (activeTab) {
      case 'states': return statesColumns;
      case 'districts': return districtsColumns;
      case 'blocks': return blocksColumns;
      default: return [];
    }
  };

  // Table setup with pagination and filtering
  const table = useReactTable({
    data: filteredData as AllDataTypes[],
    columns: getCurrentColumns(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 20, // Show 20 items per page
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <ToastContainer />
      
      {/* Main Heading */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Location Administration</h1>
      
      {/* Tab Navigation with Search */}
      <div className="flex justify-between items-center border-b border-gray-200 mb-6">
        <div className="flex">
          {[
            { key: 'states', label: 'States' },
            { key: 'districts', label: 'Districts' },
            { key: 'blocks', label: 'Blocks' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabSwitch(tab.key as TabType)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4 mb-3">
          {/* Search Bar */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading master data...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-4">Error: {error}</p>
            <button
              onClick={fetchMasterData}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="w-full table-auto border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="bg-gray-100 text-gray-600 uppercase text-sm">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left border-b">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={getCurrentColumns().length} className="text-center py-8 text-gray-500">
                      {searchTerm ? `No ${activeTab} found matching "${searchTerm}"` : `No ${activeTab} available`}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b text-sm text-gray-700 hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                First
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Last
              </button>
            </div>
            
            <div className="text-sm text-gray-700">
              Showing {table.getRowModel().rows.length} of {filteredData.length} {activeTab}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LocationManagement;