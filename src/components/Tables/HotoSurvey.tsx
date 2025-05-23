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
import ResponsivePagination from "./ResponsivePagination";
import BsnlActionsDropdown from "./BsnlActionsDropdown";

interface Hoto{
  id: string;
  user_id: number;
  state_id: number;
  state_name: string;
  district_id: number;
  district_name: string;
  block_id: number;
  block_name: string;
  gp_id: number;
  gpName: string;
  code: string;
  equipmentMake: string;
  otherEquipmentMake: string;
  buildingAddress: string;
  oltToFpoi: string;
  oltToFpoiLength: string;
  oltToFpoiFaultyFibers: string;
  fpoiToGp: string;
  fpoiToGpLength: string;
  fpoiToGpFaultyFibers: string;
  ont: string;
  ontMake: string;
  ontSerialNumber: string;
  ccu: string;
  ccuMake: string;
  ccuSerialNumber: string;
  battery: string;
  batteryMake: string;
  batterySerialNumber: string;
  solar: string;
  solarMake: string;
  solarSerialNumber: string;
  earthing: string;
  earthingCondition: string;
  enclosure: string;
  opticalPower: string;
  otdrTrace: string;
  splitter: string;
  ftbNoOfFiberTerminated: string;
  splitterPorts: string;
  ontPorts: string;
  csc: string;
  cscLocation: string;
  fullname:string;
  contact_no:string;
  is_active:number;

  // Parsed from JSON (TEXT column in DB)
  lessOverheadFiberModel: OverheadFiberModel[];
  moreOverheadFiberModel: OverheadFiberModel[];

  created_at?: string | null;
  updated_at?: string | null;
}

export interface OverheadFiberModel {
  endALatLang: string;
  endAPhoto: string;
  endBLatLang: string;
  endBPhoto: string;
  id: number;
  survey_id: string;
}

  

interface ApiResponse {
  data: Hoto[];
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


const HotoSurvey: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const location = useLocation();
  const [data, setData] = useState<Hoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editingRow, setEditingRow] = useState<Hoto | null>(null);
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

      const userData = JSON.parse(localStorage.getItem("userData") || "{}"); 
      const companyId = userData?.company_id ?? 1; 

      const response = await axios.get<ApiResponse>(`${BASEURL}/hoto-forms`, {
        params: {from_date:fromdate,to_date:todate,searchText:globalsearch, page, limit: pageSize, state: selectedState, district: selectedDistrict, block: selectedBlock, status: selectedStatus },
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
  }, [fromdate,todate,globalsearch,page, pageSize, selectedState, selectedDistrict, selectedBlock, selectedStatus, isStatusInitialized]);

  
 

  const handleView = async (id: string) => {
    await navigate(`/survey/hoto-detail-view/${id}`);
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
    console.log("states", states);
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

 
  const columns: ColumnDef<Hoto>[] = useMemo(
    () => [
      {
        header: "Actions",
        cell: ({ row }: { row: Row<Hoto> }) => (
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
      { accessorKey: "gpName", header: "GP Name" },
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

  const exportExcel = async () => {
    try {
    // const response = await fetch(`${BASEURL}/hoto-forms?limit=10000`); // increase limit as needed
    // const json = await response.json();
    // const allData: Hoto[] = json.data ?? json;
    const response = await axios.get<ApiResponse>(`${BASEURL}/hoto-forms`, {
      params: {
        from_date:fromdate,
        to_date:todate,
        isExport: 1,
        searchText:globalsearch, state: selectedState, district: selectedDistrict, block: selectedBlock, status: selectedStatus },
      });
    const allData: Hoto[] = response.data.data;
    const rows = allData.map((data) => ({
      id: data.id,
      state_id: data.state_id,
      state_name: data.state_name,
      district_id: data.district_id,
      district_name: data.district_name,
      block_id: data.block_id,
      block_name: data.block_name,
      gp_id: data.gp_id,
      gpName: data.gpName,
      Surviour_Name:data.fullname,
      Surviour_Contact_Number:data.contact_no,
      user_id: data.user_id,
      code: data.code,
      equipmentMake: data.equipmentMake,
      otherEquipmentMake: data.otherEquipmentMake,
      buildingAddress: data.buildingAddress,
      oltToFpoi: data.oltToFpoi,
      oltToFpoiLength: data.oltToFpoiLength,
      oltToFpoiFaultyFibers: data.oltToFpoiFaultyFibers,
      fpoiToGp: data.fpoiToGp,
      fpoiToGpLength: data.fpoiToGpLength,
      fpoiToGpFaultyFibers: data.fpoiToGpFaultyFibers,
      ont: data.ont,
      ontMake: data.ontMake,
      ontSerialNumber: data.ontSerialNumber,
      ccu: data.ccu,
      ccuMake: data.ccuMake,
      ccuSerialNumber: data.ccuSerialNumber,
      battery: data.battery,
      batteryMake: data.batteryMake,
      batterySerialNumber: data.batterySerialNumber,
      solar: data.solar,
      solarMake: data.solarMake,
      solarSerialNumber: data.solarSerialNumber,
      earthing: data.earthing,
      earthingCondition: data.earthingCondition,
      enclosure: data.enclosure,
      opticalPower: data.opticalPower,
      otdrTrace: data.otdrTrace,
      splitter: data.splitter,
      ftbNoOfFiberTerminated: data.ftbNoOfFiberTerminated,
      splitterPorts: data.splitterPorts,
      ontPorts: data.ontPorts,
      csc: data.csc,
      cscLocation: data.cscLocation,
      lessOverheadFiberModel: data.lessOverheadFiberModel,
      moreOverheadFiberModel: data.moreOverheadFiberModel,
      is_active:data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      Status:statusMap[data.is_active]
    }));
    
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet1 = XLSX.utils.json_to_sheet(rows);
  
    XLSX.utils.book_append_sheet(workbook, worksheet1, "HOTO Survey");
  
    // Customize header names
    XLSX.utils.sheet_add_aoa(worksheet1, [
        [
          "ID",
          "State ID",
          "State Name",
          "District ID",
          "District Name",
          "Block ID",
          "Block Name",
          "GP ID",
          "GP Name",
          "Surviour_Name",
          "Surviour_Contact_Number",
          "User ID",
          // "Company ID",
          "Code",
          "Equipment Make",
          "Other Equipment Make",
          "Building Address",
          "OLT to FPOI",
          "OLT to FPOI Length",
          "OLT to FPOI Faulty Fibers",
          "FPOI to GP",
          "FPOI to GP Length",
          "FPOI to GP Faulty Fibers",
          "ONT",
          "ONT Make",
          "ONT Serial Number",
          "CCU",
          "CCU Make",
          "CCU Serial Number",
          "Battery",
          "Battery Make",
          "Battery Serial Number",
          "Solar",
          "Solar Make",
          "Solar Serial Number",
          "Earthing",
          "Earthing Condition",
          "Enclosure",
          "Optical Power",
          "OTDR Trace",
          "Splitter",
          "FTB No. of Fiber Terminated",
          "Splitter Ports",
          "ONT Ports",
          "CSC",
          "CSC Location",
          "Less Overhead Fiber Model",
          "More Overhead Fiber Model",
          "Is Active",
          "Created At",
          "updated At",
          "Status"
        ],
      ], { origin: "A1" });
  
    XLSX.writeFile(workbook, "HOTO_SURVEY.xlsx", { compression: true });
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
      </div>*/}

      {/* Advanced Responsive Pagination */}
        <ResponsivePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          itemsPerPage={data.length}
          totalItems={data.length}
        />

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
};

export default HotoSurvey;
