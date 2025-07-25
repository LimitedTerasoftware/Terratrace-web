import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { useLocation, useSearchParams } from 'react-router-dom';

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
import { hasViewOnlyAccess } from "../../utils/accessControl";

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
  const viewOnly = hasViewOnlyAccess();
  const [data, setData] = useState<Hoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editingRow, setEditingRow] = useState<Hoto | null>(null);

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
      const userData = JSON.parse(localStorage.getItem("userData") || "{}"); 
      const companyId = userData?.company_id ?? 1; 

      const response = await axios.get<ApiResponse>(`${BASEURL}/hoto-forms`, {
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
    const status =searchParams.get('status') || null;
    const from_date =searchParams.get('from_date') ||'' ;
    const to_date =searchParams.get('to_date') || "";
    const search =searchParams.get('search') || "";
  
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
    if(!filtersReady) return;
    fetchData();
  }, [fromdate, todate, globalsearch, page, pageSize, selectedState, selectedDistrict, selectedBlock, selectedStatus,filtersReady]);

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${BASEURL}/hoto-forms/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      alert("Failed to delete record.");
    }
  };

  const handleView = async (id: string) => {
    await navigate(`/survey/hoto-detail-view/${id}`, {
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
    await navigate(`/survey/hoto-edit/${id}`, {
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
      const response = await axios.post(`${BASEURL}/hoto-forms/${id}/accept`);
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
      const response = await axios.post(`${BASEURL}/hoto-forms/${id}/reject`);
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
      await axios.put(`${BASEURL}/hoto-forms/${editingRow.id}`, editingRow);
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

  const columns: ColumnDef<Hoto>[] = useMemo(
    () => [
      {
        header: "Actions",
        cell: ({ row }: { row: Row<Hoto> }) => (
          <button
            onClick={() => handleView(row.original.id)} // Pass the correct ID
            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 outline-none dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800"
          >
            View
          </button>
        ),
      },
      { accessorKey: "state_name", header: "State Name" },
      { accessorKey: "district_name", header: "District Name" },
      { accessorKey: "block_name", header: "Block Name" },
      { accessorKey: "gpName", header: "GP Name" },
      {
        accessorKey: "fullname",
        header: "Surveyor Name",
        cell: ({ row }) => (
          <span>
            {row.original.fullname} 
          </span>
        ),
      },
      {
        accessorKey: "contact_no",
        header: "Surveyor Contact Number",
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

  const exportExcel = async () => {
    try {
      const response = await axios.get<ApiResponse>(`${BASEURL}/hoto-forms`, {
        params: {
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
    
      // Customize header names with comprehensive headers
      XLSX.utils.sheet_add_aoa(worksheet1, [
        ["ID", "State ID", "State Name", "District ID", "District Name", "Block ID", "Block Name", "GP ID", "GP Name", "Surveyor Name", "Surveyor Contact Number", "User ID", "Code", "Equipment Make", "Other Equipment Make", "Building Address", "OLT to FPOI", "OLT to FPOI Length", "OLT to FPOI Faulty Fibers", "FPOI to GP", "FPOI to GP Length", "FPOI to GP Faulty Fibers", "ONT", "ONT Make", "ONT Serial Number", "CCU", "CCU Make", "CCU Serial Number", "Battery", "Battery Make", "Battery Serial Number", "Solar", "Solar Make", "Solar Serial Number", "Earthing", "Earthing Condition", "Enclosure", "Optical Power", "OTDR Trace", "Splitter", "FTB No of Fiber Terminated", "Splitter Ports", "ONT Ports", "CSC", "CSC Location", "Less Overhead Fiber Model", "More Overhead Fiber Model", "Is Active", "Created At", "Updated At", "Status"],
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
const handleFilterChange = (newState: string | null, newDistrict: string | null,newBlock:string|null,status:number|null,from_date:string|null,to_date:string|null,search:string|null,newPage = 1,) => {
  const currentTab = searchParams.get('tab') || 'defaultTab';
  const params: Record<string, string> = { tab: currentTab };
  if (newState) params.state_id = newState;
  if(newDistrict) params.district_id = newDistrict;
  if(newBlock) params.block_id = newBlock;
  if(status) params.status=String(status);
  if(from_date) params.from_date = from_date;
  if(to_date) params.to_date = to_date;
  if(search) params.search = search;
  params.page = newPage.toString();
  setSearchParams(params);
};
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Search Bar and Filters Section */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* State Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={selectedState || ''}
              onChange={(e) => {
                handleFilterChange(e.target.value ,selectedDistrict,selectedBlock,selectedStatus,fromdate,todate,globalsearch,1)
                setSelectedState(e.target.value || null);
                setPage(1);
              }}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All States</option>
              {states.map((state) => (
                <option key={state.state_id} value={state.state_id}>
                  {state.state_name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* District Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={selectedDistrict || ''}
              onChange={(e) => {
                 handleFilterChange(selectedState,e.target.value,selectedBlock,selectedStatus,fromdate,todate,globalsearch ,1)
                setSelectedDistrict(e.target.value || null);
                setPage(1);
              }}
              disabled={!selectedState}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Districts</option>
              {districts.map((district) => (
                <option key={district.district_id} value={district.district_id}>
                  {district.district_name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Block Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={selectedBlock || ''}
              onChange={(e) => {
                 handleFilterChange(selectedState,selectedDistrict,e.target.value ,selectedStatus,fromdate,todate,globalsearch,1)
                setSelectedBlock(e.target.value || null);
                setPage(1);
              }}
              disabled={!selectedDistrict}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Blocks</option>
              {blocks.map((block) => (
                <option key={block.block_id} value={block.block_id}>
                  {block.block_name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={selectedStatus !== null ? selectedStatus : ''}
              onChange={(e) => {
                 handleFilterChange(selectedState,selectedDistrict,selectedBlock ,Number(e.target.value),fromdate,todate,globalsearch,1)
                setSelectedStatus(e.target.value !== '' ? Number(e.target.value) : null);
                setPage(1);
              }}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All Status</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Date Filters */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <input
              type="date"
              value={fromdate}
              onChange={(e) => {
                 handleFilterChange(selectedState,selectedDistrict,selectedBlock ,selectedStatus,e.target.value,todate,globalsearch,1)
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="From Date"
            />
          </div>

          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <input
              type="date"
              value={todate}
              onChange={(e) => {
                handleFilterChange(selectedState,selectedDistrict,selectedBlock ,selectedStatus,fromdate,e.target.value,globalsearch,1)
                setToDate(e.target.value);
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="To Date"
            />
          </div>

          {/* Search Bar */}
          <div className="relative w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={globalsearch}
              onChange={(e) => {
                handleFilterChange(selectedState,selectedDistrict,selectedBlock ,selectedStatus,fromdate,todate,e.target.value,1)
                setGlobalSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Clear Filters Button */}
          <button
            onClick={handleClearFilters}
            className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
          >
            <span className="text-red-500 dark:text-red-400 font-medium text-sm">✕</span>
            <span>Clear Filters</span>
          </button>

          {/* Export Button */}
          {!viewOnly &&
          <button 
            onClick={exportExcel}
            className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap"
          >
            Export
          </button>
          }
        </div>
      </div>

      {/* Error message if API request failed */}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
          <span className="font-medium">Error loading data:</span> {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-blue-300 dark:bg-gray-700 dark:text-gray-400">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} scope="col" className="px-3 py-2">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
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
                <td colSpan={columns.length} className="px-3 py-2">
                  No data available
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                value={editingRow.gpName}
                onChange={(e) => setEditingRow({ ...editingRow, gpName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="GP Name"
              />
              <input
                type="text"
                value={editingRow.code}
                onChange={(e) => setEditingRow({ ...editingRow, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Code"
              />
              <input
                type="text"
                value={editingRow.equipmentMake}
                onChange={(e) => setEditingRow({ ...editingRow, equipmentMake: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Equipment Make"
              />
              <input
                type="text"
                value={editingRow.buildingAddress}
                onChange={(e) => setEditingRow({ ...editingRow, buildingAddress: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Building Address"
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

export default HotoSurvey;