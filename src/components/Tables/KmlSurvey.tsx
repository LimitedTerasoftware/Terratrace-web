import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useLocation } from 'react-router-dom';


import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  Row
} from "@tanstack/react-table";
import { useNavigate } from 'react-router-dom';
import Select, { SingleValue } from "react-select";
import BsnlActionsDropdown from "./BsnlActionsDropdown";

interface Kml{
  id: string;
  link_name: string;
  description: string;
  latitude: string;
  longitude: string;
  created_at?: string | null;
  updated_at?: string | null;
}
  

interface ApiResponse {
    status: number;
    message: string;
    data: Kml[];
    totalPages: number;
    totalRecords: number;
    currentPage: number;
    pageSize: number;
}

const KmlSurvey: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const location = useLocation();
  const [data, setData] = useState<Kml[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editingRow, setEditingRow] = useState<Kml | null>(null);
  const [filters, setFilters] = useState({ state: "", district: "", block: "" });

  const [globalsearch,setGlobalSearch] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [isStatusInitialized, setIsStatusInitialized] = useState<boolean | null>(false);
  const[fromgp,setFromGp]= useState<string>('');
  const[togp,setToGp]=useState<string>('');
  


  const navigate = useNavigate();

  const statusMap: Record<number, string> = {
    1: "Accepted",
    2: "Rejected",
    0: "Pending",
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    if (statusParam) {
      setSelectedStatus(Number(statusParam));
    }
    setIsStatusInitialized(true);
  }, [location]);

  const fetchData = async () => {
    setLoading(true);
    try {

      const userData = JSON.parse(localStorage.getItem("userData") || "{}"); 
      const companyId = userData?.company_id ?? 1; 

      const response = await axios.get<ApiResponse>(`${BASEURL}/kml-points`, {
        params: { page, pageSize },
        });
     // console.log("response", response);
      setData(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ page, pageSize]);
 
  const columns: ColumnDef<Kml>[] = useMemo(
    () => [
      { accessorKey: "link_name", header: "Link Name" },
      { accessorKey: "latitude", header: "Latitude" },
      { accessorKey: "longitude", header: "Longitude" },
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
  
   const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          className={`px-3 py-2 mx-1 rounded-lg ${
            page === i ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }
    return pageNumbers;
  };
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="w-full border-collapse text-center">
          <thead className="bg-blue-300 text-gray-600 uppercase text-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b text-sm text-gray-700 hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2">
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
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          disabled={page === 1}
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
        >
          Previous
        </button>

        {renderPageNumbers()}

        <button
          className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default KmlSurvey;
