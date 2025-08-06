import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import ResponsivePagination from "./ResponsivePagination";
import * as XLSX from "xlsx";
import MapComponent from "./MapComponent";
import { MediaExportService } from "../hooks/useFullscreen";
import {ChartBar, CheckCircle, Download, EyeIcon, FolderOpen, Loader, MapPinIcon, SheetIcon, SquaresExcludeIcon } from "lucide-react";
import { hasViewOnlyAccess } from "../../utils/accessControl";
import { FaArrowLeft } from "react-icons/fa";


interface UndergroundSurvey {
  id: string;
  state_name: string;
  district_name: string;
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
  state_id: string;
  start_location_name: string;
  end_location_name: string;
  startGpCode: string;
  endGpCode: string;
  created_at: string;
  district_id: string;
  updated_at: string;
  fullname: string,
  contact_no: number,
  startLocation:string,       
  endLocation:string,
  cableType:string,
  routeType:string       
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
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
  const viewOnly = hasViewOnlyAccess();
  const location = useLocation();
  const [data, setData] = useState<UndergroundSurvey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editingRow, setEditingRow] = useState<UndergroundSurvey | null>(null);

  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [globalsearch, setGlobalSearch] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedRowsMap, setSelectedRowsMap] = useState<Record<string, UndergroundSurvey>>({});
  const [KmlLoader,setKMLLoader]=useState(false);

  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [BlockData,setBlockData]=useState<any>([])
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, currentFile: '' });
  const [exportComplete, setExportComplete] = useState(false);
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

      const response = await axios.get<ApiResponse>(`${BASEURL}/underground-surveys`, {
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
      await axios.delete(`${BASEURL}/underground-surveys/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {
      alert("Failed to delete record.");
    }
  };

  const handleView = async (id: string) => {
    await navigate(`/survey/underground-detail-view/${id}`, {
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
    await navigate(`/survey/underground-edit/${id}`, {
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
      const response = await axios.post(`${BASEURL}/underground-surveys/${id}/accept`);
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
      const response = await axios.post(`${BASEURL}/underground-surveys/${id}/reject`);
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
      await axios.put(`${BASEURL}/underground-surveys/${editingRow.id}`, editingRow);
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
    if(selectedState) {
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

  const columns = useMemo<ColumnDef<UndergroundSurvey>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => {
          const allSelected = table.getRowModel().rows.every(row => selectedRowsMap[row.original.id]);
          const someSelected = table.getRowModel().rows.some(row => selectedRowsMap[row.original.id]);

          return (
            <input
              type="checkbox"
              checked={allSelected}
              ref={el => {
                if (el) el.indeterminate = !allSelected && someSelected;
              }}
              onChange={(e) => {
                const checked = e.target.checked;
                const newMap = { ...selectedRowsMap };
                table.getRowModel().rows.forEach(row => {
                  if (checked) {
                    newMap[row.original.id] = row.original;
                  } else {
                    delete newMap[row.original.id];
                  }
                });
                setSelectedRowsMap(newMap);
              }}
            />
          );
        },
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={!!selectedRowsMap[row.original.id]}
            onChange={(e) => {
              const checked = e.target.checked;
              setSelectedRowsMap(prev => {
                const newMap = { ...prev };
                if (checked) newMap[row.original.id] = row.original;
                else delete newMap[row.original.id];
                return newMap;
              });
            }}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },


      {
        header: "Actions",
        cell: ({ row }: { row: Row<UndergroundSurvey> }) => (
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
      { accessorKey: "start_location_name", header: " Start GP Name" },
      { accessorKey: "end_location_name", header: "End GP Name" },
      {accessorKey:  "routeType",header:"Route Type"},
      {accessorKey: "cableType",header:"Cable Type"},
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

    [selectedRowsMap]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
    getRowId: row => String(row.id)
  });

  const handleGenerateKML = async () => {
    const selected = Object.values(selectedRowsMap);
    if (selected.length === 0) {
      alert("No rows selected");
      return;
    }

    const selectedEventTypes = ["KILOMETERSTONE", "FIBERTURN", "FPOI", "ROUTEFEASIBILITY", "JOINTCHAMBER", "LANDMARK",
      "ROADCROSSING", "ROUTEINDICATOR", "LIVELOCATION", "SIDE"
    ];
    const blueIcon = "http://maps.google.com/mapfiles/kml/paddle/blu-circle.png";

    let allPlacemarks = "";

    for (const item of selected) {
      setKMLLoader(true)
      try {
        const res = await fetch(`${BASEURL}/underground-surveys/${item.id}`);
        const json = await res.json();

        const filteredPoints = [
          ...new Map(
            json.data?.under_ground_survey_data
              ?.filter((survey: any) =>
                survey.event_type === 'LIVELOCATION' ||  survey?.surveyUploaded === "true" &&
                selectedEventTypes.includes(survey.event_type)
              )
              .map((survey: any) => [`${survey.latitude}-${survey.longitude}-${survey.event_type}`, survey])
          ).values()
        ];

        if (filteredPoints.length === 0) continue;
        const roundCoord = (value: string | number) => {
          return parseFloat(Number(value).toFixed(5));
        };

        const uniquePoints = filteredPoints.filter((point: any, index, self) => {
          const lat = roundCoord(point.latitude);
          const lng = roundCoord(point.longitude);

          return (
            index ===
            self.findIndex((p: any) =>
              roundCoord(p.latitude) === lat && roundCoord(p.longitude) === lng
            )
          );
        });

        const coordString = uniquePoints
          .map((p: any) => `${p.longitude},${p.latitude},0`)
          .join(" ");

        // const coordString = filteredPoints.map(p => `${p.longitude},${p.latitude},0`).join(" ");

        const linePlacemark = `
        <Placemark>
          <name>Line ${item.id}</name>
          <Style>
            <LineStyle>
              <color>ff0000ff</color>
              <width>3</width>
            </LineStyle>
          </Style>
          <LineString>
            <tessellate>1</tessellate>
            <coordinates>${coordString}</coordinates>
          </LineString>
        </Placemark>
      `;

        let eventPlacemarks = "";
        const excludedTypes = ["LIVELOCATION"];

        filteredPoints
          .filter((e: any) => !excludedTypes.includes(e.event_type)).forEach((p: any) => {
            eventPlacemarks += `
          <Placemark>
            <name>${p.event_type || "UNKNOWN"}</name>
            <description>
              Survey ID: ${p.survey_id}<br/>
              ID: ${p.id}<br/>
              Area Type: ${p.area_type}<br/>
              Depth: ${p.depth}<br/>
            
            </description>
            <Style>
              <IconStyle>
                <scale>1.1</scale>
                <Icon><href>${blueIcon}</href></Icon>
              </IconStyle>
            </Style>
            <Point>
              <coordinates>${p.longitude},${p.latitude},0</coordinates>
            </Point>
          </Placemark>
        `;
          });

        allPlacemarks += eventPlacemarks + linePlacemark;
      } catch (err) {
        console.error(`Error fetching for ID ${item.id}`, err);
      }
    }
    setKMLLoader(false)
    const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
      <Document>
        ${allPlacemarks}
      </Document>
    </kml>`;

    const blob = new Blob([kmlContent], { type: "application/vnd.google-earth.kml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data[0]?.block_name || ''}_GroundSurvey.kml`;
    a.click();
  };

const mediaExportService = new MediaExportService();

const handlePreview = async (id:number) => {
  const selected = Object.values(selectedRowsMap);
  if (selected.length === 0) {
    alert("No rows selected");
    return;
  }

  let Data: any[] = [];
  let MediaData: any[] = [];
  if(id === 1){
     setIsExporting(true);
    setExportComplete(false);
    setExportProgress({ current: 0, total: 0, currentFile: '' });
  }else{
   setKMLLoader(true);
  }
  

  try {
    for (const item of selected) {
      const res = await fetch(`${BASEURL}/underground-surveys/${item.id}`);
      const json = await res.json();

      const newData = json.data?.under_ground_survey_data || [];
        const enrichedData = newData.map((entry: any) => ({
                              ...entry,
                              start_gp_name: json.data.start_gp?.name || '',
                              end_gp_name: json.data.end_gp?.name || '',
                              start_lgd:json.data.start_gp?.lgd_code || '',
                              end_lgd:json.data.end_gp?.lgd_code || '',
                              routeType:json.data?.routeType || ''
                            }));

      Data.push(...enrichedData);
      // Data.push(...newData); 
      if (json.data) {
        MediaData.push(json.data); 
      }
    }
  if(id === 1){
  await mediaExportService.exportMediaWithStructure(
        MediaData,
          (current, total, currentFile) => {
          setExportProgress({ current, total, currentFile });
        }
      );
    setExportComplete(true);
  }else{
    setBlockData(Data); 
  }
  } catch (error) {
    console.error("Preview fetch error:", error);
  } finally {
    setKMLLoader(false);
    setIsExporting(false);
  }
};

const exportExcel = async () => {
    try {
      setKMLLoader(true)
      const response = await axios.get<ApiResponse>(`${BASEURL}/underground-surveys`, {
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

      const allData: UndergroundSurvey[] = response.data.data;

      // Map data with column names that match your headers exactly
      const rows = allData.map((data) => ({
        "ID": data.id,
        "State ID": data.state_id,
        "State Name": data.state_name,
        "District ID": data.district_id,
        "District Name": data.district_name,
        "Block ID": data.block_id,
        "Block Name": data.block_name,
        "Surviour Name": data.fullname,
        "Surviour Contact Number": data.contact_no,
        "Survey ID": data.survey_id,
        "Company ID": data.company_id,
        "User ID": data.user_id,
        "Cable Type":data.cableType,
        "Start GP Code": data.startGpCode,
        "Start GP Coordinates": data.startGpCoordinates,
        "Start GP Name": data.startGpName,
        "End GP Code": data.endGpCode,
        "End GP Coordinates": data.endGpCoordinates,
        "End GP Name": data.endGpName,
        "Is Active": data.is_active,
        "Created At": data.created_at,
        "Updated At": data.updated_at,
        "Status": statusMap[data.is_active]
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Underground Survey");
      
      // Export file
      XLSX.writeFile(workbook, "UNDERGROUND_SURVEY.xlsx", { compression: true });
    } catch (error) {
      console.error("Export failed:", error);
    }finally{
      setKMLLoader(false)
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
    setSelectedRowsMap({})
    setBlockData([]);
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
console.log(BlockData,'BlockData')
return (
    <>
    {BlockData.length > 0 ? (
       <><button
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
        onClick={() => {setBlockData([]);}}
      >
        <FaArrowLeft className="h-5 w-5" />
        Back
      </button><MapComponent data={BlockData || []} /></>
    ):(
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      {/* Search Bar and Filters Section */}
      {KmlLoader && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* State Filter */}
          <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={selectedState || ''}
              onChange={(e) => {
                setSelectedState(e.target.value || null);
                handleFilterChange(e.target.value ,selectedDistrict,selectedBlock,selectedStatus,fromdate,todate,globalsearch,1)
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
          <><button
                  onClick={exportExcel}
                  className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
                >
                  <SheetIcon className="h-4 w-4 text-green-600" />
                  Excel
                </button><button
                  onClick={handleGenerateKML}
                  className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap"
                >

                    KML
                  </button>
                 
                  <button
                    onClick={() => handlePreview(1)}
                    disabled={isExporting}
                    className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  > {isExporting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export Selected Media
                    </>
                  )}
                  </button></>
                  }
                   <button
                    onClick={() => handlePreview(0)}
                    className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
                  >
                    <EyeIcon className="h-4 w-4 text-green-600" />
                    Preview
                  </button>
           
        </div>
      </div>

      {/* Error message if API request failed */}
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
          <span className="font-medium">Error loading data:</span> {error}
        </div>
      )}
         {isExporting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Loader className="h-4 w-4 animate-spin text-blue-600" />
                <span className="font-medium text-blue-900">
                  Downloading files... ({exportProgress.current}/{exportProgress.total})
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress.total > 0 ? (exportProgress.current / exportProgress.total) * 100 : 0}%` }}
                />
              </div>
              {exportProgress.currentFile && (
                <p className="text-sm text-gray-600">Current: {exportProgress.currentFile}</p>
              )}
            </div>
          )}

          {/* Success Message */}
          {exportComplete && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Export completed successfully!</span>
              </div>
              <p className="text-sm text-green-700 mt-1">Your Media_Folder.zip file has been downloaded.</p>
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
     )}
   
    </>
  );
};

export default UndergroundSurvey;