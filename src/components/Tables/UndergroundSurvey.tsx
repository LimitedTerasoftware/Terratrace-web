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
import { FaEye, FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import { useNavigate, Link, useLocation } from "react-router-dom";
import ActionsDropdown from "./ActionsDropdown";
import Select, { SingleValue } from "react-select";
import ResponsivePagination from "./ResponsivePagination";
import * as XLSX from "xlsx";


interface UndergroundSurvey {
  id: string;
  state_name: string;
  district_name: string;
  block_name: string;
  startGpName: string;
  startGpCoordinates: string;
  endGpName: string;
  endGpCoordinates: string;
  is_active:number;
  block_id: string;
  survey_id: string;
  company_id: string;
  user_id: string;
  state_id: string;
  start_location_name:string;
  end_location_name:string;
  startGpCode: string;
  endGpCode: string;
  created_at: string;
  district_id: string;
  updated_at:string;
  fullname:string,
  contact_no:number,


 

}


interface ApiResponse {
  data: UndergroundSurvey[];
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

interface StateOption {
  value: string;
  label: string;
}

interface DistrictOption {
  value: string;
  label: string;
}

interface BlockOption {
  value: string;
  label: string;
}

type StatusOption = {
  value: number;
  label: string;
};

const UndergroundSurvey: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const location = useLocation();
  const [data, setData] = useState<UndergroundSurvey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editingRow, setEditingRow] = useState<UndergroundSurvey | null>(null);
  const [filters, setFilters] = useState({ state: "", district: "", block: "" });

  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [globalsearch,setGlobalSearch] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [isStatusInitialized, setIsStatusInitialized] = useState<boolean | null>(false);
  const[fromdate,setFromDate]= useState<string>('');
  const[todate,setToDate]=useState<string>('');
    
    
  

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

  useEffect(() => {
      const params = new URLSearchParams(location.search);
      const statusParam = params.get('status');
      if (statusParam) {
        setSelectedStatus(Number(statusParam));
      }
      if (location.state?.formdate) {
        setFromDate(location.state?.formdate || '');
      }
    
      if (location.state?.todate) {
        setToDate(location.state?.todate || '');
      }
      setIsStatusInitialized(true);
    }, [location]);
  useEffect(() => {
    if (states.length && location.state?.state) {
      setSelectedState(location.state.state);
    }
  }, [states, location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`${BASEURL}/underground-surveys`, {
        params: { from_date:fromdate,to_date:todate,searchText:globalsearch,page, limit: pageSize, state: selectedState, district: selectedDistrict, block: selectedBlock, status: selectedStatus },
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
    if (isStatusInitialized) {
      fetchData();
       }
  }, [fromdate,todate,globalsearch,page, pageSize, selectedState, selectedDistrict, selectedBlock, selectedStatus, isStatusInitialized]);

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
    await navigate(`/survey/underground-detail-view/${id}`);
  };

  const handleAccept = async (id: string) => {
    try {
      const response = await axios.post(`${BASEURL}/aerial-surveys/${id}/accept`);
      if (response.data.status === 1) {
        console.log("Record accepted successfully!");
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
        console.log("Record rejected successfully!");
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
      setSelectedDistrict(null);
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
      setSelectedBlock(null);
    }
  }, [selectedDistrict]);


  const columns = useMemo<ColumnDef<UndergroundSurvey>[]>(
    () => [
     {
             header: "Actions",
             cell: ({ row }: { row: Row<UndergroundSurvey> }) => (
               <button
                 onClick={() => handleView(row.original.id)} // Pass the correct ID
                 className="px-3 py-1 text-white bg-blue-500 rounded-md hover:bg-blue-600"
               >
                 View
               </button>
             ),
           },
      { accessorKey: "state_name", header: "State Name" },
      { accessorKey: "district_name", header: "District Name" },
      { accessorKey: "block_name", header: "Block Name" },
      { accessorKey: "start_location_name", header: " Start GP Name" },
      { accessorKey: "end_location_name", header: "End GP Name" },
      {
        accessorKey: "fullname",
        header: "Surviour Name",
        cell: ({ row }) => (
          <span>
            {row.original.fullname} 
          </span>
        ),
      },
      {
        accessorKey: "contact_no",
        header: "Surviour Contact Number",
        cell: ({ row }) => (
          <span>
            {row.original.contact_no}
          </span>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => (
          <span>{statusMap[row.original.is_active] || "Unknown"}</span>
        ),
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
  
   {/*const renderPageNumbers = () => {
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
  };*/}

const exportExcel = async() => {
  const response = await axios.get<ApiResponse>(`${BASEURL}/underground-surveys`, {
    params: { from_date:fromdate,
      to_date:todate,
      isExport: 1,
      searchText:globalsearch,
      state: selectedState, district: selectedDistrict, block: selectedBlock, status: selectedStatus },
  });
  const allData: UndergroundSurvey[] = response.data.data;
  const rows = allData.map((data) => ({
    id: data.id,
    state_id: data.state_id,
    state_name: data.state_name,
    district_id: data.district_id,
    district_name: data.district_name,
    block_id: data.block_id,
    block_name: data.block_name,
    Surviour_Name:data.fullname,
    Surviour_Contact_Number:data.contact_no,
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
    Status:statusMap[data.is_active]
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Aerial Survey");

  // Customize header names
  XLSX.utils.sheet_add_aoa(worksheet, [
    ["ID", "State ID", "State Name", "District ID", "District Name","Block ID", "Block Name","Surviour Name","Surviour Contact Number","Survey ID", "Company ID", "User ID", 
     "Start GP Code", "Start GP Coordinates", "Start GP Name",
     "End GP Code", "End GP Coordinates", "End GP Name", "Is Active", "Created At", "Updated At",'Status']
  ], { origin: "A1" });

  // Export file
  XLSX.writeFile(workbook, "AERIAL_SURVEY.xlsx", { compression: true });
};
  

const stateOptions = states.map((state) => ({
  value: String(state.state_id), 
  label: state.state_name,
}));

const selectedStateOption = stateOptions.find(
  (opt) => opt.value === selectedState
) || null;
  return (
    <div className="container mx-auto px-4 py-6">

        {/* Filters */}
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 mb-4">
      <div className="w-full sm:w-[300px]">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="state">
          Select State
        </label>
        {/* <Select
          id="state"
          options={states.map((state) => ({
            value: state.state_id,
            label: state.state_name,
          })) as StateOption[]} // Explicitly define the type
          placeholder="Select State"
          value={states.find((s) => s.state_id === selectedState)
            ? { value: selectedState!, label: states.find((s) => s.state_id === selectedState)!.state_name }
            : null}
          onChange={(selectedOption: SingleValue<StateOption>) => setSelectedState(selectedOption?.value || null)}
          className="w-full"
        /> */}
           <Select
        id="state"
        options={stateOptions}
        placeholder="Select State"
        value={selectedStateOption}
        onChange={(selectedOption: SingleValue<StateOption>) =>
          setSelectedState(selectedOption?.value ?? null)
        }
        className="w-full"
      />

      </div>

      <div className="w-full sm:w-[300px]">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="district">
          Select District
        </label>
        <Select
          id="district"
          options={districts.map((district) => ({
            value: district.district_id,
            label: district.district_name,
          })) as DistrictOption[]}
          placeholder="Select District"
          value={districts.find((d) => d.district_id === selectedDistrict)
            ? { value: selectedDistrict!, label: districts.find((d) => d.district_id === selectedDistrict)!.district_name }
            : null}
          onChange={(selectedOption: SingleValue<DistrictOption>) => setSelectedDistrict(selectedOption?.value || null)}
          className="w-full"
          isDisabled={!selectedState}
        />
      </div>

      <div className="w-full sm:w-[300px]">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="block">
          Select Block
        </label>
        <Select
          id="block"
          options={blocks.map((block) => ({
            value: block.block_id,
            label: block.block_name,
          })) as BlockOption[]}
          placeholder="Select Block"
          value={blocks.find((b) => b.block_id === selectedBlock)
            ? { value: selectedBlock!, label: blocks.find((b) => b.block_id === selectedBlock)!.block_name }
            : null}
          onChange={(selectedOption: SingleValue<BlockOption>) => setSelectedBlock(selectedOption?.value || null)}
          className="w-full"
          isDisabled={!selectedDistrict}
        />
      </div>

      <div className="w-full sm:w-[300px]">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="status">
          Select Status
        </label>
        <Select
          id="status"
          options={statusOptions}
          placeholder="Select Status"
          value={
            statusOptions.find((option) => option.value === selectedStatus) || null
          }
          onChange={(selectedOption: SingleValue<StatusOption>) =>
            setSelectedStatus(selectedOption?.value ?? null)
          }
          className="w-full"
        />
      </div>

      <div className="w-full sm:w-[300px]">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="search">
          Search
        </label>
        <input id="search" type="text" placeholder="Search ..." 
          value={globalsearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="h-9.5 w-full px-3  border border-gray-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />

      </div>
      <button
        onClick={() => {
          setSelectedState(null);
          setSelectedDistrict(null);
          setSelectedBlock(null);
          setSelectedStatus(null);
          setGlobalSearch('');
        }}
        className="w-full sm:w-auto h-10 mt-7 text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-3 py-2 text-center"
      >
        Clear Filters
      </button>
      <button className="bg-green-400 text-white h-10 w-30 px-3 mt-7  rounded-lg" onClick={exportExcel}>Export </button>

    </div>

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
	  
	   {/* Pagination 
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
      </div> */}

      {/* Advanced Responsive Pagination */}
      <ResponsivePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          itemsPerPage={data.length}
          totalItems={data.length}
        />

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {/* Edit Modal */}
      {editingRow && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md w-96">
            <h2 className="text-xl font-semibold mb-4">Edit Record</h2>
            <input
              type="text"
              value={editingRow.state_name}
              onChange={(e) => setEditingRow({ ...editingRow, state_name: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.district_name}
              onChange={(e) => setEditingRow({ ...editingRow, district_name: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.block_name}
              onChange={(e) => setEditingRow({ ...editingRow, block_name: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.startGpName}
              onChange={(e) => setEditingRow({ ...editingRow, startGpName: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.startGpCoordinates}
              onChange={(e) => setEditingRow({ ...editingRow, startGpCoordinates: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.endGpName}
              onChange={(e) => setEditingRow({ ...editingRow, endGpCoordinates: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.endGpCoordinates}
              onChange={(e) => setEditingRow({ ...editingRow, endGpCoordinates: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
           
            <button onClick={handleEditSave} className="bg-green-500 text-white px-4 py-2 rounded-lg mr-2">
              Save
            </button>
            <button onClick={() => setEditingRow(null)} className="bg-gray-400 text-white px-4 py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default UndergroundSurvey;

