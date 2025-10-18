import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel, ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "use-debounce";
import { useSearchParams } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

interface GpExchange {
  id: string;
  name: string;
  lattitude: string; 
  longitude: string;
  type: string;
  blk_name: string;
  dt_name: string;
  st_name: string;
  lgd_code?: string;
}

interface StateExchange {
  state_id: string;
  state_code: string;
  state_name: string;
}

interface District {
  district_id: string;
  state_code: string;
  district_name: string;
  district_code: string;
}

interface BlockExchange {
  block_id: string;
  block_name: string;
  block_code: string;
  district_code: string;
  state_code: string;
}

interface MasterDataResponse {
  result: boolean;
  data: {
    states: StateExchange[];
    districts: District[];
    blocks: BlockExchange[];
    gplist: GpExchange[];
  };
}

const Gpslist = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  
  // Master data state
  const [masterData, setMasterData] = useState<MasterDataResponse['data'] | null>(null);
  const [filteredGpsData, setFilteredGpsData] = useState<GpExchange[]>([]);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();

  // Enhanced filters with hierarchical dropdowns
  const [filters, setFilters] = useState({
    name: searchParams.get("name") || "",
    selectedState: searchParams.get("state") || "",
    selectedDistrict: searchParams.get("district") || "",
    selectedBlock: searchParams.get("block") || "",
  });

  // Debounce filter values to reduce processing
  const [debouncedFilters] = useDebounce(filters, 500);

  // Fetch master data on component mount
  useEffect(() => {
    fetchMasterData();
  }, []);

  // Apply filters when master data or filters change
  useEffect(() => {
    if (masterData) {
      applyFilters();
      setSearchParams({
        name: debouncedFilters.name,
        state: debouncedFilters.selectedState,
        district: debouncedFilters.selectedDistrict,
        block: debouncedFilters.selectedBlock,
      });
    }
  }, [masterData, debouncedFilters]);

  const fetchMasterData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<MasterDataResponse>(`${BASEURL}/masterData`);
      
      if (response.data.result) {
        setMasterData(response.data.data);
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

  const applyFilters = () => {
    if (!masterData?.gplist) {
      setFilteredGpsData([]);
      return;
    }

    let filtered = masterData.gplist;

    // Apply filters
    if (debouncedFilters.name) {
      filtered = filtered.filter(gp => 
        gp.name.toLowerCase().includes(debouncedFilters.name.toLowerCase())
      );
    }

    if (debouncedFilters.selectedState) {
      filtered = filtered.filter(gp => gp.st_name === debouncedFilters.selectedState);
    }

    if (debouncedFilters.selectedDistrict) {
      filtered = filtered.filter(gp => gp.dt_name === debouncedFilters.selectedDistrict);
    }

    if (debouncedFilters.selectedBlock) {
      filtered = filtered.filter(gp => gp.blk_name === debouncedFilters.selectedBlock);
    }

    setFilteredGpsData(filtered);
    setTotalPages(Math.ceil(filtered.length / pageSize) || 1);
    setPageIndex(0); // Reset to first page when filters change
  };

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredGpsData.slice(startIndex, endIndex);
  };

  // Get unique values for dropdowns based on current selections
  const getUniqueStates = () => {
    if (!masterData?.gplist) return [];
    const states = [...new Set(masterData.gplist.map(gp => gp.st_name))];
    return states.filter(Boolean).sort();
  };

  const getUniqueDistricts = () => {
    if (!masterData?.gplist || !filters.selectedState) return [];
    const districts = [...new Set(
      masterData.gplist
        .filter(gp => gp.st_name === filters.selectedState)
        .map(gp => gp.dt_name)
    )];
    return districts.filter(Boolean).sort();
  };

  const getUniqueBlocks = () => {
    if (!masterData?.gplist || !filters.selectedDistrict) return [];
    const blocks = [...new Set(
      masterData.gplist
        .filter(gp => gp.st_name === filters.selectedState && gp.dt_name === filters.selectedDistrict)
        .map(gp => gp.blk_name)
    )];
    return blocks.filter(Boolean).sort();
  };

  // Handle cascading dropdown changes
  const handleStateChange = (stateName: string) => {
    setFilters({
      ...filters,
      selectedState: stateName,
      selectedDistrict: "", // Reset district when state changes
      selectedBlock: ""     // Reset block when state changes
    });
  };

  const handleDistrictChange = (districtName: string) => {
    setFilters({
      ...filters,
      selectedDistrict: districtName,
      selectedBlock: "" // Reset block when district changes
    });
  };

  // Memoized columns for better performance (removed actions column)
  const columns: ColumnDef<GpExchange>[] = useMemo(
    () => [
      { accessorKey: "st_name", header: "State Name" },
      { accessorKey: "dt_name", header: "District Name" },
      { accessorKey: "blk_name", header: "Block Name" },
      { accessorKey: "name", header: "GP Name" },
      { accessorKey: "lgd_code", header: "LGD Code" },
      { accessorKey: "lattitude", header: "Latitude" },
      { accessorKey: "longitude", header: "Longitude" },
      { accessorKey: "type", header: "Type" },
    ],
    []
  );

  const table = useReactTable({
    data: getCurrentPageData(),
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    initialState: {
      pagination: {
        pageSize: 20, // Show 20 items per page
      },
    },
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading GPS data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">GPS List</h1>
      </div>

      {/* Enhanced Filters with Cascading Dropdowns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* GP Name Filter */}
        <input
          type="text"
          placeholder="Filter by GP Name"
          className="border px-3 py-2 rounded"
          value={filters.name}
          onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
        />

        {/* State Dropdown */}
        <select
          className="border px-3 py-2 rounded"
          value={filters.selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
        >
          <option value="">All States</option>
          {getUniqueStates().map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>

        {/* District Dropdown */}
        <select
          className="border px-3 py-2 rounded"
          value={filters.selectedDistrict}
          onChange={(e) => handleDistrictChange(e.target.value)}
          disabled={!filters.selectedState}
        >
          <option value="">All Districts</option>
          {getUniqueDistricts().map(district => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>

        {/* Block Dropdown */}
        <select
          className="border px-3 py-2 rounded"
          value={filters.selectedBlock}
          onChange={(e) => setFilters(prev => ({ ...prev, selectedBlock: e.target.value }))}
          disabled={!filters.selectedDistrict}
        >
          <option value="">All Blocks</option>
          {getUniqueBlocks().map(block => (
            <option key={block} value={block}>{block}</option>
          ))}
        </select>
      </div>



      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="w-full table-auto border-collapse text-center">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-100 text-gray-600 uppercase text-sm">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-2">
                    {header.column.columnDef.header as string}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {getCurrentPageData().length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-gray-500">
                  No GPS locations found matching your criteria
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b text-sm text-gray-700 hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2">
                      {cell.renderValue() as React.ReactNode}
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
          Page {pageIndex + 1} of {totalPages}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageIndex(0)}
            disabled={pageIndex === 0}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
            disabled={pageIndex === 0}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPageIndex((prev) => (prev + 1 < totalPages ? prev + 1 : prev))}
            disabled={pageIndex + 1 >= totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => setPageIndex(totalPages - 1)}
            disabled={pageIndex + 1 >= totalPages}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
        
        <div className="text-sm text-gray-700">
          Showing {getCurrentPageData().length} of {filteredGpsData.length} GPS locations
        </div>
      </div>
    </div>
  );
};

export default Gpslist;