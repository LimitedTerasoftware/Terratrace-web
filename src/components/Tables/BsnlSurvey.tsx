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

interface BsnlExchange {
  id: string;
  state_name: string;
  earthPitCoordinates:String;
  district_name: string;
  earthPitVoltage:string;
  fdms:string;
  generator:string;
  generatorCapacity:string;
  generatorMake:string;
  generatorModel:string;
  oltCount:string;
  oltMake:string;
  powerSystemVoltage:string;
  presentLoad:string;
  routerCount:string;
  routerMake:string;
  splitters:string;
  updated_at:string;
  upsCapacity:string;
  block_name: string;
  bsnlExchangeCondition: string;
  powerType: string; 
  bsnlCordinates:string,
  personName1: string;
  personNumber1: string;
  personName2: string;
  personNumber2: string;
  personName3: string;
  personNumber3: string;
  designation1: string;
  designation2: string;
  designation3: string;
  is_active:number;
  state_id:number,
  block_id:number,
  district_id:number,
  fullname:string,
  contact_no:number,
}

interface ApiResponse {
  data: BsnlExchange[];
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


const BsnlSurvey: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const location = useLocation();
  const [data, setData] = useState<BsnlExchange[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editingRow, setEditingRow] = useState<BsnlExchange | null>(null);
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
  
    setIsStatusInitialized(true);
  }, [location]);
  
  useEffect(() => {
    if (states.length && location.state?.selectedState) {
      setSelectedState(location.state.selectedState);
    }
  }, [states, location.state]);
  
  const fetchData = async () => {
    setLoading(true);
    try {

      const userData = JSON.parse(localStorage.getItem("userData") || "{}"); 
      const companyId = userData?.company_id ?? 1; 

      const response = await axios.get<ApiResponse>(`${BASEURL}/bsnl-exchanges`, {
        params: {searchText:globalsearch, page, limit: pageSize, state: selectedState, district: selectedDistrict, block: selectedBlock, status: selectedStatus },
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
    if (isStatusInitialized) {
    fetchData();
     }
  }, [globalsearch,page, pageSize, selectedState, selectedDistrict, selectedBlock, selectedStatus, isStatusInitialized]);

  
  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${BASEURL}/bsnl-exchanges/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      alert("Failed to delete record.");
    }
  };

  const handleView = async (id: string) => {
    await navigate(`/survey/bsnl-detail-view/${id}`);
  };
  const handleEdit = async (id: string) => {
    await navigate(`/survey/bsnl-edit/${id}`);
  };

  const handleAccept = async (id: string) => {
    try {
      const response = await axios.post(`${BASEURL}/bsnl-exchanges/${id}/accept`);
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
      const response = await axios.post(`${BASEURL}/bsnl-exchanges/${id}/reject`);
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
      await axios.put(`${BASEURL}/bsnl-exchanges/${editingRow.id}`, editingRow);
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

 
  const columns: ColumnDef<BsnlExchange>[] = useMemo(
    () => [
      {
        header: "Actions",
        cell: ({ row }: { row: Row<BsnlExchange> }) => (
          <button
            onClick={() => handleView(row.original.id)} // Pass the correct ID
            className="px-3 py-1 text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            View
          </button>
        ),
      },
      //{ accessorKey: "id", header: "S.No", cell: (row) => row.row.index + 1 },
      { accessorKey: "state_name", header: "State Name" },
      { accessorKey: "district_name", header: "District Name" },
      { accessorKey: "block_name", header: "Block Name" },
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
  const exportExcel = async () => {
    try {
    // const response = await fetch(`/Tracking/api/v1/bsnl-exchanges?limit=10000`); 
    // const json = await response.json();
    // const allData: BsnlExchange[] = json.data ?? json;
    const allData = data;
    const rows = allData.map((data) => ({
      id: data.id,
      state_name: data.state_name,
      district_name: data.district_name,
      block_name: data.block_name,
      block_id: data.block_id,
      Surviour_Name:data.fullname,
      Surviour_Contact_Number:data.contact_no,
      bsnlCordinates: data.bsnlCordinates,
      bsnlExchangeCondition: data.bsnlExchangeCondition,
      earthPitCoordinates: data.earthPitCoordinates,
      earthPitVoltage: data.earthPitVoltage,
      fdms: data.fdms,
      generator: data.generator,
      generatorCapacity: data.generatorCapacity,
      generatorMake: data.generatorMake,
      generatorModel: data.generatorModel,
      is_active: data.is_active,
      oltCount: data.oltCount,
      oltMake: data.oltMake,
      personName1: data.personName1,
      personName2: data.personName2,
      personName3: data.personName3,
      personNumber1: data.personNumber1,
      personNumber2: data.personNumber2,
      personNumber3: data.personNumber3,
      powerSystemVoltage: data.powerSystemVoltage,
      powerType: data.powerType,
      presentLoad: data.presentLoad,
      routerCount: data.routerCount,
      routerMake: data.routerMake,
      splitters: data.splitters,
      state_id: data.state_id,
      updated_at: data.updated_at,
      upsCapacity: data.upsCapacity,
      Status:statusMap[data.is_active]
    }));
  
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet1 = XLSX.utils.json_to_sheet(rows);
  
    XLSX.utils.book_append_sheet(workbook, worksheet1, "BLOCK Survey");
  
    // Customize header names
    XLSX.utils.sheet_add_aoa(worksheet1, [
      ["ID",  "State Name", "District Name","Block Name","Block ID", 'Surviour Name','Surviour Contact Number',"BSNL Coordinates", "BSNL Exchange Condition",],
    ], { origin: "A1" });
  
    XLSX.writeFile(workbook, "BLOCK_SURVEY.xlsx", { compression: true });
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
          value={
            states.find((s) => s.state_id === selectedState)
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
        className="mt-7 w-full sm:w-auto h-10  text-white bg-red-500 hover:bg-red-600 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-3 py-2 text-center"
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
              value={editingRow.powerType}
              onChange={(e) => setEditingRow({ ...editingRow, powerType: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.personName1}
              onChange={(e) => setEditingRow({ ...editingRow, personName1: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.personNumber1}
              onChange={(e) => setEditingRow({ ...editingRow, personNumber1: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.personName2}
              onChange={(e) => setEditingRow({ ...editingRow, personName2: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.personNumber2}
              onChange={(e) => setEditingRow({ ...editingRow, personNumber2: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.personName3}
              onChange={(e) => setEditingRow({ ...editingRow, personName3: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />
            <input
              type="text"
              value={editingRow.personNumber3}
              onChange={(e) => setEditingRow({ ...editingRow, personNumber3: e.target.value })}
              className="border rounded px-3 py-2 w-full mb-2"
            />

            <button onClick={handleEditSave} className="bg-green-500 text-white px-4 py-2 rounded-lg mr-2">
              Save
            </button>
            <button onClick={() => setEditingRow(null)} className="bg-gray-400 hover:bg-gray-800 text-white px-4 py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BsnlSurvey;
