import { ColumnDef, flexRender, getCoreRowModel, getPaginationRowModel, Row, useReactTable } from '@tanstack/react-table';
import axios from 'axios';
import { ChevronDown, Eye, RotateCcw, Search, TableCellsMerge, User } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import ResponsivePagination from '../Tables/ResponsivePagination';
import { JointsApiResponse, JointsData, ProcessedJoints } from '../../types/survey';
import { hasDownloadAccess } from '../../utils/accessControl';
import * as XLSX from "xlsx";

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

const Joints: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const TraceBaseUrl = import.meta.env.VITE_TraceAPI_URL;
  const ImgBaseUrl = import.meta.env.VITE_Image_URL;
  const DownloadOnly = hasDownloadAccess();
  
  const navigate = useNavigate(); 
  const [selectedJointId, setSelectedJointId] = useState<string | null>(null); 
  const [data, setData] = useState<JointsData[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [globalsearch, setGlobalSearch] = useState<string>('');

  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filtersReady, setFiltersReady] = useState(false);
  const [isExcelExporting, setisExcelExporting] = useState(false);

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
 
  const fetchData = async () =>{
    setLoading(true);
    setError('');
    try {
      const response = await axios.get<JointsApiResponse>(`${TraceBaseUrl}/get-all-joints`,{
        params:{
          state_id:selectedState,
          district_id:selectedDistrict,
          block_id:selectedBlock,
          page,
          limit: 10,
        },
      });
      if(response.data.success){
       setData(response.data.data);
      setTotalPages(response.data.pagination.total_pages);


      }else{
        setError(response.data.message || "Something went wrong")

        setData([]);
      }

      
    } catch (error:any) {
      setError(error.response.data.message || "Something went wrong")
       setData([]);
    }finally{
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
    setGlobalSearch(search);
    setPage(Number(pageParam));
    setFiltersReady(true);
  }, []);

 useEffect(()=>{
  if(!filtersReady) return;
  fetchData();
}, [fromdate, todate, globalsearch, page,selectedState, selectedDistrict, selectedBlock, selectedStatus, filtersReady]);

  useEffect(() => {
    axios.get(`${BASEURL}/states`)
      .then((res) => setStates(res.data.data))
      .catch((err) => console.error(err));
  }, []);

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
    const columns: ColumnDef<JointsData>[] = useMemo(
    () => [
      {
        header: "Actions",
        cell: ({ row }: { row: Row<JointsData> }) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
              const jointId = `${row.original.joint_code}`;
              setSelectedJointId(jointId);
              navigate(`/joint/${jointId}`);
            }}
            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
            title="View">
            <Eye className="w-4 h-4" />
          </button>
          </div>

        ),
      },
      { accessorKey: "state_name", header: "State Name" },
      { accessorKey: "district_name", header: "District Name" },
      { accessorKey: "block_name", header: "Block Name" },
      { accessorKey: "joint_name", header: "Joint Name" },
      { accessorKey: "joint_code", header: "Joint Code" },
      {accessorKey:"joint_type",header:"Joint Type"},
      {accessorKey:"work_type",header:"Work Type"},
      {accessorKey:"gps_lat",header:"Gps Latitude"},
      {accessorKey:"gps_long",header:"Gps Longitude"},
      {
        header: "Photos",
        cell: ({ row }) => {
          const photo = row.original.photo_path;
          const proof = row.original.proof_photo;

          return (
            <div className="flex gap-2">
              {photo && (
                <img
                  src={`${ImgBaseUrl}${photo}`}
                  alt="Photo"
                  className="w-10 h-10 object-cover rounded cursor-pointer border"
                  onClick={() => window.open(`${ImgBaseUrl}${photo}`, "_blank")}
                />
              )}

              {proof && (
                <img
                  src={`${ImgBaseUrl}${proof}`}
                  alt="Proof Photo"
                  className="w-10 h-10 object-cover rounded cursor-pointer border"
                  onClick={() => window.open(`${ImgBaseUrl}${proof}`, "_blank")}
                />
              )}
            </div>
          );
        },
      },

      {
        accessorKey: "user_name",
        header: "Surveyor Name",
        cell: ({ row }) => (
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{row.original.user_name}</div>
            </div>
          </div>

        ),
      },
      {accessorKey:"address",header:"Address"},

      {accessorKey:"date_time",header:"Date"},


    
    ],
    [navigate]
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
      setisExcelExporting(true)
      const response = await axios.get<JointsApiResponse>(`${TraceBaseUrl}/get-all-joints`,{
        params:{
          state_id:selectedState,
          district_id:selectedDistrict,
          block_id:selectedBlock,
       
        },
      });
      const allData: JointsData[] = response.data.data;
      const rows = allData.map((data) => ({
        "State ID": data.state_id,
        "State Name": data.state_name,
        "District ID": data.district_id,
        "District Name": data.district_name,
        "Block ID": data.block_id,
        "Block Name": data.block_name,
        "Joint Name": data.joint_name,
        "Joint Code": data.joint_code,
        "Joint Type": data.joint_type,
        "Work Type": data.work_type || '',
        "Gps Latitude": data.gps_lat,
        "Gps Longitude": data.gps_long,
        "User Name": data.user_name,
        "Address": data.address,
        "Date": data.date_time,
    
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Joints Survey");

      // Export file
      XLSX.writeFile(workbook, "Joints_Survey.xlsx", { compression: true });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setisExcelExporting(false)
    }

  };

  return (
    <div className='min-h-screen'>
         {(isExcelExporting) && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
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
              className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="To Date"
            />
          </div>
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
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"          >
            <RotateCcw className="w-4 h-4 mr-2" />
            <span>Reset Filters</span>
          </button>
          {DownloadOnly && (
                      <button
                        onClick={exportExcel}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <TableCellsMerge className="w-4 h-4 mr-2" />
                        Excel
                      </button>
          )}

        </div>
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
            <span className="font-medium">Error loading data:</span> {error}
          </div>
        )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto"> {/* prevent horizontal scroll */}
              <table className="w-full table-auto text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          scope="col"
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words"
                        >
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
                          <svg
                            className="animate-spin h-5 w-5 mr-3 text-blue-500"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                    5.291A7.962 7.962 0 014 12H0c0 
                    3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-3 py-2 text-center text-gray-500"
                      >
                        No data available
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-2 whitespace-normal break-words text-sm font-medium text-gray-900"
                          >
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
          <ResponsivePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            itemsPerPage={data.length}
            totalItems={data.length}
          />


      </div>
    </div>
  )
}

export default Joints