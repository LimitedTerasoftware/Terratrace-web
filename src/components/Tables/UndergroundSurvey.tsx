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
import { CameraOffIcon, ChartBar, CheckCircle, ChevronDown, Download, Edit2, Eye, EyeIcon, FolderOpen, Globe2Icon, Loader, MapPinIcon, RotateCcw, Search, SheetIcon, SquaresExcludeIcon, TableCellsMerge, User } from "lucide-react";
import { hasDownloadAccess, hasViewOnlyAccess } from "../../utils/accessControl";
import { FaArrowLeft } from "react-icons/fa";
import { UnderGroundSurveyData } from "../../types/survey";
import { BsCameraVideoFill } from "react-icons/bs";

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
  startLocation: string,
  endLocation: string,
  cableType: string,
  routeType: string
  versions: string
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
type StatusOption = {
  value: number;
  label: string;
};

const UndergroundSurvey: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
  const viewOnly = hasViewOnlyAccess();
  const DownloadOnly = hasDownloadAccess();
  const location = useLocation();
  const [data, setData] = useState<UndergroundSurvey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [editingRow, setEditingRow] = useState<UndergroundSurvey | null>(null);
  const [gpOptions, setGpOptions] = useState<{ id: string; name: string }[]>([]);
  const [loadingGPD, setLoadingGPD] = useState(false);

  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [globalsearch, setGlobalSearch] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [selectedRowsMap, setSelectedRowsMap] = useState<Record<string, UndergroundSurvey>>({});
  const [KmlLoader, setKMLLoader] = useState(false);

  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [BlockData, setBlockData] = useState<any>([]);
  const [isExcelExporting, setisExcelExporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, currentFile: '' });
  const [exportComplete, setExportComplete] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersReady, setFiltersReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<UndergroundSurvey | null>(null);

  const [tempSelectedState, setTempSelectedState] = useState<string | null>(null);
  const [tempSelectedDistrict, setTempSelectedDistrict] = useState<string | null>(null);
  const [tempSelectedBlock, setTempSelectedBlock] = useState<string | null>(null);
  const [tempSelectedStatus, setTempSelectedStatus] = useState<number | null>(null);
  const [tempFromDate, setTempFromDate] = useState<string>('');
  const [tempToDate, setTempToDate] = useState<string>('');
  const [tempGlobalSearch, setTempGlobalSearch] = useState<string>('');

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
  
  // Set temp values same as actual values
  setTempSelectedState(state_id);
  setTempSelectedDistrict(district_id);
  setTempSelectedBlock(block_id);
  setTempSelectedStatus(status !== null ? Number(status) : null);
  setTempFromDate(from_date);
  setTempToDate(to_date);
  setTempGlobalSearch(search);
  
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
        alert("Record rejected successfully!");
      }
    } catch (error) {
      console.error("Error rejecting record:", error);
      alert("Failed to reject record.");
    }
  };

// inside your component:
const handleEditSave = async () => {
  if (!editingRow) return;

  try {
    const payload = {
      id: editingRow.id,                  
      endLocation: editingRow.endLocation,   
      startLocation: editingRow.startLocation, 
    
    };


    const res = await axios.post(
      `${TraceBASEURL}/edit-fiber-survey`,
      payload,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    if (res.data) {
      alert("Survey updated successfully!");
      setEditingRow(null);
    }
  } catch (err: any) {
    console.error("Error updating survey:", err);
    alert("Failed to update survey");
  }
};

  // const handleEditSave = async () => {
  //   if (!editingRow) return;
  //   try {
  //     await axios.put(`${TraceBASEURL}/edit-fiber-survey/${editingRow.id}`, editingRow);
  //     setData((prevData) => prevData.map((item) => (item.id === editingRow.id ? editingRow : item)));
  //     setEditingRow(null);
  //   } catch (error) {
  //     alert("Failed to update record.");
  //   }
  // };

  useEffect(() => {
    axios.get(`${BASEURL}/states`)
      .then((res) => setStates(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch districts when state is selected
  useEffect(() => {
  if (tempSelectedState) {
    axios.get(`${BASEURL}/districtsdata?state_code=${tempSelectedState}`)
      .then((res) => setDistricts(res.data))
      .catch((err) => console.error(err));
  } else {
    setDistricts([]);
  }
}, [tempSelectedState]);

  // Fetch blocks when district is selected
  useEffect(() => {
  if (tempSelectedDistrict) {
    axios.get(`${BASEURL}/blocksdata?district_code=${tempSelectedDistrict}`)
      .then((res) => setBlocks(res.data))
      .catch((err) => console.error(err));
  } else {
    setBlocks([]);
  }
}, [tempSelectedDistrict]);

 useEffect(() => {
  if (editingRow) {
    const blockCode = editingRow.block_id; 
    if (!blockCode) return;

    setLoadingGPD(true);
    axios.get(`${BASEURL}/gpdata?block_code=${blockCode}`)
      .then(res => {
        const data = res.data;
        const options = data.map((g: any) => ({
          id: g.id.toString(),
          name: g.name.toString(),
        }));
        setGpOptions(options);
      })
      .catch(err => {
        console.error("Error fetching GP data:", err);
      })
      .finally(() => {
        setLoadingGPD(false);
      });
  }
}, [editingRow?.block_id
]);


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
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleView(row.original.id)}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="View">
              <Eye className="w-4 h-4" />
            </button>
             <button
              onClick={() => setEditingRow(row.original)}
              className="text-blue-600 hover:text-blue-900 p-1"
              title="View">
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

        ),
      },
      { accessorKey: "state_name", header: "State Name" },
      { accessorKey: "district_name", header: "District Name" },
      { accessorKey: "block_name", header: "Block Name" },
      { accessorKey: "start_location_name", header: " Start GP Name" },
      { accessorKey: "end_location_name", header: "End GP Name" },
      {
  accessorKey: "routeType",
  header: "Route Type",
  cell: ({ row }) => {
    const type = row.original.routeType?.toUpperCase() || '';
    
    let colorClass = 'text-gray-600'; // default color
    
    if (type === 'PROPOSED') {
      colorClass = 'text-red-600';
    } else if (type === 'INCREMENTAL' || type === 'EXISTING') {
      colorClass = 'text-green-600';
    } else if (type === 'RECTIFICATION') {
      colorClass = 'text-blue-700';
    }
    
    return (
      <span className={colorClass}>
        {type}
      </span>
    );
  },
},
      { accessorKey: "cableType", header: "Cable Type" },
      {
        accessorKey: "fullname",
        header: "Surveyor Name",
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
        accessorKey: "version",
        header: "Version",
        cell: ({ row }) => (
          <span className="text-sm text-gray-700">{row.original.versions || 'N/A'}</span>
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
  const selected = Object.values(selectedRowsMap);

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
                survey.event_type === 'LIVELOCATION' || survey?.surveyUploaded === "true" &&
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

  const handlePreview = async (id: number) => {
    const selected = Object.values(selectedRowsMap);
    if (selected.length === 0) {
      alert("No rows selected");
      return;
    }

    let Data: any[] = [];
    let MediaData: any[] = [];

    if (id === 1) {
      setIsExporting(true);
      setExportComplete(false);
      setExportProgress({ current: 0, total: 0, currentFile: '' });
    } else if (id === 0) {
      setKMLLoader(true);
    } else {
      setisExcelExporting(true);
    }

    try {
      for (const item of selected) {
        const res = await fetch(`${BASEURL}/underground-surveys/${item.id}`);
        const json = await res.json();

        const newData = json.data?.under_ground_survey_data || [];
        const enrichedData = newData.map((entry: any) => ({
          ...entry,
          blk_name: json.data.start_gp?.blk_name || '',
          dt_name: json.data.start_gp?.dt_name || '',
          st_name: json.data.start_gp?.st_name || '',
          startGp: json.data.start_gp?.name || '',
          endGp: json.data.end_gp?.name || '',
          start_lgd: json.data.start_gp?.lgd_code || '',
          end_lgd: json.data.end_gp?.lgd_code || '',
          routeType: json.data?.routeType || '',
          startLat: json.data.start_gp?.lattitude || '',
          startLng: json.data.start_gp?.longitude || '',
          endLat: json.data.end_gp?.lattitude || '',
          endLng: json.data.end_gp?.longitude || '',
        }));

        Data.push(...enrichedData);
        // Data.push(...newData); 
        if (json.data) {
          MediaData.push(json.data);
        }
      }
      if (id === 1) {
        await mediaExportService.exportMediaWithStructure(
          MediaData,
          (current, total, currentFile) => {
            setExportProgress({ current, total, currentFile });
          }
        );
        setExportComplete(true);
      } else if (id === 0) {
        setBlockData(Data);
      } else {
        exportBlockExcel(Data)
      }
    } catch (error) {
      console.error("Preview fetch error:", error);
    } finally {
      setKMLLoader(false);
      setIsExporting(false);
      setisExcelExporting(false);
    }
  };


  const exportBlockExcel = async (BlockData: UnderGroundSurveyData[]) => {
    setisExcelExporting(true);
    const filteredData = [
      ...new Map(
        BlockData.map(survey => [`${survey.latitude}-${survey.longitude}-${survey.event_type}`, survey])
      ).values()
    ];

    const AllData = filteredData || [];
    const rows = AllData.map((data) => {
      let routeIndicatorItems: any = [];
      if (
        data.event_type === "ROUTEINDICATOR" &&
        data?.surveyUploaded === "true" &&
        data.routeIndicatorUrl
      ) {
        let urls = [];
        try {
          const parsed = JSON.parse(data.routeIndicatorUrl);

          if (Array.isArray(parsed)) {
            urls = parsed;
          } else if (typeof parsed === "string") {
            urls = [parsed];
          }
        } catch (e) {
          urls = [data.routeIndicatorUrl];
        }

        routeIndicatorItems = urls
          .filter((url) => !!url)
          .map((url) => ({
            text: `${BASEURL}${url}`,
            url: `${BASEURL}${url}`,
          }));
      }
      return {
        id: data.id,
        blk_name: data?.blk_name || '',
        dt_name: data.dt_name || '',
        st_name: data.st_name || '',
        startGp: data.startGp || '',
        endGp: data?.endGp || '',
        survey_id: data.survey_id,
        area_type: data.area_type,
        event_type: data.event_type,
        surveyUploaded: data.surveyUploaded,
        execution_modality: data.execution_modality,

        // GPS Info
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        accuracy: data.accuracy,
        depth: data.depth,
        distance_error: data.distance_error,
        // Road Crossing Info
        crossing_Type: data.road_crossing?.roadCrossing || '',
        crossing_length: data.road_crossing?.length || '',
        crossing_startPhoto_URL: (data.event_type === "ROADCROSSING" && data?.surveyUploaded === "true" && data.road_crossing?.startPhoto) ? { text: `${BASEURL}${data.road_crossing?.startPhoto}`, url: `${BASEURL}${data.road_crossing?.startPhoto}` } : '',
        crossing_startphoto_Lat: data.road_crossing?.startPhotoLat || '',
        crossing_startphoto_Long: data.road_crossing?.startPhotoLong || '',
        crossing_endPhoto_URL: (data.event_type === "ROADCROSSING" && data?.surveyUploaded === "true" && data.road_crossing?.endPhoto) ? { text: `${BASEURL}${data.road_crossing?.endPhoto}`, url: `${BASEURL}${data.road_crossing?.endPhoto}` } : '',
        crossing_endphoto_Lat: data.road_crossing?.endPhotoLat || '',
        crossing_endphoto_Long: data.road_crossing?.endPhotoLong || '',
        // Route Details
        centerToMargin: data.route_details?.centerToMargin || '',
        roadWidth: data.route_details?.roadWidth || '',
        routeBelongsTo: data.route_details?.routeBelongsTo || '',
        routeType: data.route_details?.routeType || '',
        soilType: data.route_details?.soilType || '',
        // Route Feasibility
        routeFeasible: data.route_feasibility?.routeFeasible ?? '',
        alternatePathAvailable: data.route_feasibility?.alternatePathAvailable ?? '',
        alternativePathDetails: data.route_feasibility?.alternativePathDetails || '',
        // Side and Indicator
        side_type: data.side_type,
        routeIndicatorUrl: routeIndicatorItems.length > 0 ? routeIndicatorItems : '',
        // Start/End Photos
        Survey_Start_Photo: data.event_type === "SURVEYSTART" && data?.surveyUploaded === "true" ? { text: `${BASEURL}${data.start_photos?.[0]}`, url: `${BASEURL}${data.start_photos?.[0]}` } : '',
        Survey_End_Photo: data.event_type === "ENDSURVEY" && data?.surveyUploaded === "true" ? { text: `${BASEURL}${data.end_photos?.[0]}`, url: `${BASEURL}${data.end_photos?.[0]}` } : '',
        // Utility Features
        localInfo: data.utility_features_checked?.localInfo || '',
        selectedGroundFeatures: (data.utility_features_checked?.selectedGroundFeatures || []).join(', '),
        // Video Details
        videoUrl: (data.event_type === "VIDEORECORD" && data?.surveyUploaded === "true" && data.videoDetails?.videoUrl?.trim().replace(/^"|"$/g, "")) ? { text: `${BASEURL}${data.videoDetails?.videoUrl}`, url: `${BASEURL}${data.videoDetails?.videoUrl}` } : '',
        video_startLatitude: data.videoDetails?.startLatitude || '',
        video_startLongitude: data.videoDetails?.startLongitude || '',
        video_startTimeStamp: data.videoDetails?.startTimeStamp || '',
        video_endLatitude: data.videoDetails?.endLatitude || '',
        video_endLongitude: data.videoDetails?.endLongitude || '',
        video_endTimeStamp: data.videoDetails?.endTimeStamp || '',

        // Joint Chamber and fpoi
        jointChamberUrl: (data.event_type === "JOINTCHAMBER" && data?.surveyUploaded === "true" && data.jointChamberUrl) ? { text: `${BASEURL}${data.jointChamberUrl}`, url: `${BASEURL}${data.jointChamberUrl}` } : '',
        fpoiUrl: (data.event_type === "FPOI" && data.fpoiUrl && data?.surveyUploaded === "true") ? { text: `${BASEURL}${data.fpoiUrl}`, url: `${BASEURL}${data.fpoiUrl}` } : '',
        kmtStoneUrl: (data.event_type === "KILOMETERSTONE" && data.kmtStoneUrl && data?.surveyUploaded === "true") ? { text: `${BASEURL}${data.kmtStoneUrl}`, url: `${BASEURL}${data.kmtStoneUrl}` } : '',
        landMarkType: data.landMarkType, landMarkDescription: data.landMarkDescription,
        LANDMARK: (data.event_type === "LANDMARK" && data?.surveyUploaded === "true" && data.landMarkUrls && data.landMarkType !== 'NONE') && `${BASEURL}${JSON.parse(data.landMarkUrls)
          .filter((url: string) => url)
          .map((url: string) => (
            { text: `${BASEURL}${url}`, url: `${BASEURL}${url}` }
          ))}` || '', routeIndicatorType: data.routeIndicatorType,
        FIBERTURN: (data.event_type === "FIBERTURN" && data?.surveyUploaded === "true" && data.fiberTurnUrl) ? { text: `${BASEURL}${data.fiberTurnUrl}`, url: `${BASEURL}${data.fiberTurnUrl}` } : '',

        // Patroller Details
        patroller_company: data.patroller_details?.companyName || '',
        patroller_name: data.patroller_details?.name || '',
        patroller_email: data.patroller_details?.email || '',
        patroller_mobile: data.patroller_details?.mobile || '',

        // Timestamps
        createdTime: data.createdTime,
        created_at: data.created_at,

      }
    });
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    rows.forEach((row, rowIndex) => {
      const excelRow = rowIndex + 2;
      const fieldsWithLinks = {
        crossing_startPhoto_URL: 'T',
        crossing_endPhoto_URL: 'W',
        routeIndicatorUrl: 'AI',
        Survey_Start_Photo: 'AJ',
        Survey_End_Photo: 'AK',
        videoUrl: 'AN',
        jointChamberUrl: 'AU',
        fpoiUrl: 'AV',
        kmtStoneUrl: 'AW',
        LANDMARK: 'AY',
        FIBERTURN: 'AZ'
      };

      Object.entries(fieldsWithLinks).forEach(([key, col]) => {
        const val = (row as any)[key];
        if (key === "routeIndicatorUrl" && Array.isArray(val)) {
          const combinedLinks = val.map((item, i) => `Image ${i + 1}`).join('\n');
          worksheet[`${col}${excelRow}`] = {
            t: "s",
            v: combinedLinks,
            l: { Target: val[0].url }
          };
        }
        else if (val && typeof val === 'object' && val.url) {

          worksheet[`${col}${excelRow}`] = {
            t: "s",
            v: val.text || "View",
            l: { Target: val.url }
          };
        }
      });

    });

    XLSX.utils.book_append_sheet(workbook, worksheet, `UnderGround Survey_${AllData[0].survey_id}`);
    XLSX.utils.sheet_add_aoa(worksheet, [
      [
        "ID",
        "Block Name",
        "District Name",
        "State Name",
        "Start GP",
        "End GP",
        "Survey ID",
        "Area Type",
        "Event Type",
        "Survey Uploaded",
        "Execution Modality",
        "Latitude",
        "Longitude",
        "Altitude",
        "Accuracy",
        "Depth",
        "Distance Error",



        // Road Crossing
        "Crossing Type",
        "Crossing Length",
        "Crossing Start Photo URL",
        "Crossing Start Photo Latitude",
        "Crossing Start Photo Longitude",
        "Crossing End Photo URL",
        "Crossing End Photo Latitude",
        "Crossing End Photo Longitude",

        // Route Details
        "Center To Margin",
        "Road Width",
        "Route Belongs To",
        "Route Type",
        "Soil Type",

        // Route Feasibility
        "Route Feasible",
        "Alternate Path Available",
        "Alternative Path Details",

        // Side & Indicator
        "Side Type",
        "Route Indicator URL",

        // Survey Photos
        "Survey Start Photo",
        "Survey End Photo",

        // Utility Features
        "Local Info",
        "Selected Ground Features",

        // Video Details
        "Video URL",
        "Video Start Latitude",
        "Video Start Longitude",
        "Video Start TimeStamp",
        "Video End Latitude",
        "Video End Longitude",
        "Video End TimeStamp",

        // Joint Chamber & fpoi
        "Joint Chamber URL",
        "FPOI URL",
        "KmStone URL",
        "LandMark Type",
        "LandMark Desc",
        "LandMark URL",
        "Route Indicator Type",
        "Fiberturn URL",
        // Patroller Details
        "Patroller Company",
        "Patroller Name",
        "Patroller Email",
        "Patroller Mobile",
        // Timestamps
        "Created Time",
        "Created At",
      ]
    ], { origin: "A1" });
    XLSX.writeFile(workbook, `UnderGround Survey_${AllData[0].blk_name}.xlsx`, { compression: true });
    setisExcelExporting(false);

  }

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
        "Version": data.versions || 'N/A',
        "Survey ID": data.survey_id,
        "Company ID": data.company_id,
        "User ID": data.user_id,
        "Route Type": data.routeType || '',
        "Start GP Code": data.startGpCode,
        "Start GP Coordinates": data.startGpCoordinates,
        "Start GP Name": data.startGpName,
        "End GP Code": data.endGpCode,
        "End GP Coordinates": data.endGpCoordinates,
        "End GP Name": data.endGpName,
        "Is Active": data.is_active,
        "Created At": data.created_at,
        "Updated At": data.updated_at,
        "Status": statusMap[data.is_active],
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);

      XLSX.utils.book_append_sheet(workbook, worksheet, "Underground Survey");

      // Export file
      XLSX.writeFile(workbook, "UNDERGROUND_SURVEY.xlsx", { compression: true });
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setKMLLoader(false)
    }

  };

const handleMediaFiles = async () => {

  if (!tempSelectedBlock) {
    alert("Please select a block first.");
    return;
  }

  try {
    setIsExporting(true);

    const url = `${TraceBASEURL}/download-media/${tempSelectedBlock}`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to download media.");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `media_${tempSelectedBlock}.zip`;
    a.click();
    window.URL.revokeObjectURL(downloadUrl);

    setExportComplete(true);
  } catch (err) {
    console.error(err);
    alert("Something went wrong while downloading.");
  } finally {
    setIsExporting(false);
  }
};


  const stateOptions = states.map((state) => ({
    value: String(state.state_id),
    label: state.state_name,
  }));

  const selectedStateOption = stateOptions.find(
    (opt) => opt.value === selectedState
  ) || null;

  const handleApplyFilters = () => {
  setSelectedState(tempSelectedState);
  setSelectedDistrict(tempSelectedDistrict);
  setSelectedBlock(tempSelectedBlock);
  setSelectedStatus(tempSelectedStatus);
  setFromDate(tempFromDate);
  setToDate(tempToDate);
  setGlobalSearch(tempGlobalSearch);
  setPage(1);
  
  handleFilterChange(
    tempSelectedState,
    tempSelectedDistrict,
    tempSelectedBlock,
    tempSelectedStatus,
    tempFromDate,
    tempToDate,
    tempGlobalSearch,
    1
  );
};

  const handleClearFilters = () => {
  setSelectedState(null);
  setSelectedDistrict(null);
  setSelectedBlock(null);
  setSelectedStatus(null);
  setGlobalSearch('');
  setFromDate('');
  setToDate('');
  
  // Clear temp values as well
  setTempSelectedState(null);
  setTempSelectedDistrict(null);
  setTempSelectedBlock(null);
  setTempSelectedStatus(null);
  setTempGlobalSearch('');
  setTempFromDate('');
  setTempToDate('');
  
  setPage(1);
  setSelectedRowsMap({});
  setBlockData([]);
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
    <>
      {BlockData.length > 0 ? (
        <><button
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
          onClick={() => { setBlockData([]); }}
        >
          <FaArrowLeft className="h-5 w-5" />
          Back
        </button><MapComponent data={BlockData || []} /></>
      ) : (
        <div className="min-h-screen">
          {/* Search Bar and Filters Section */}
          {(KmlLoader || isExcelExporting) && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          <div className="mb-4 px-7">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
              {/* State Filter */}
              <div className="relative">
                <select
                  value={tempSelectedState || ''}
                  onChange={(e) => {
                    setTempSelectedState(e.target.value || null);
                    setTempSelectedDistrict(null); // Reset dependent filters
                    setTempSelectedBlock(null);
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
                  value={tempSelectedDistrict || ''}
                  onChange={(e) => {
                    setTempSelectedDistrict(e.target.value || null);
                    setTempSelectedBlock(null); // Reset dependent filter
                  }}
                  disabled={!tempSelectedState}
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
                  value={tempSelectedBlock || ''}
                  onChange={(e) => {
                    setTempSelectedBlock(e.target.value || null);
                  }}
                  disabled={!tempSelectedDistrict}
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
                  value={tempSelectedStatus !== null ? tempSelectedStatus : ''}
                  onChange={(e) => {
                    setTempSelectedStatus(e.target.value !== '' ? Number(e.target.value) : null);
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
                  value={tempFromDate}
                  onChange={(e) => {
                    setTempFromDate(e.target.value);
                  }}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="From Date"
                />
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={tempToDate}
                  onChange={(e) => {
                    setTempToDate(e.target.value);
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
                  value={tempGlobalSearch}
                  onChange={(e) => {
                    setTempGlobalSearch(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Apply Filters Button */}
              <button
                onClick={handleApplyFilters}
                className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Search className="w-4 h-4 mr-2" />
                <span>Apply Filters</span>
              </button>

              {/* Clear Filters Button */}
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {selected.length} item(s) selected
                </span>
              </div>
              <div className="flex space-x-2">
                {DownloadOnly && (
                  <><button
                    onClick={() => handlePreview(2)}
                    disabled={isExcelExporting}
                    className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExcelExporting ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <SheetIcon className="h-4 w-4 text-green-600" />
                        Excel (Block-wise Data)
                      </>
                    )}

                  </button><button
                    onClick={handleGenerateKML}
                    className="flex items-center gap-2 flex-none h-10 px-4 py-2 text-sm font-medium text-yellow-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap"
                  >
                      <Globe2Icon className="h-4 w-4" />
                      KML
                    </button>
                    {/* <button
                      onClick={() => handleMediaFiles()}
                      disabled={isExporting}
                      className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    > {isExporting ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <BsCameraVideoFill className="h-4 w-4" />
                        Media Files
                      </>
                    )}
                    </button> */}
                    </>
                )}
                <button
                  onClick={() => handlePreview(0)}
                  className="flex-none h-10 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4 text-blue-600" />
                  Preview
                </button>


              </div>
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
                    readOnly
                  />
                  <input
                    type="text"
                    value={editingRow.district_name}
                    onChange={(e) => setEditingRow({ ...editingRow, district_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="District Name"
                    readOnly
                  />
                  <input
                    type="text"
                    value={editingRow.block_name}
                    onChange={(e) => setEditingRow({ ...editingRow, block_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Block Name"
                    readOnly
                  />
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start GP Name</label>
                      { loadingGPD ? (
                        <div className="mt-1">Loading...</div>
                      ) : (
                        <select
                          value={editingRow.startLocation || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingRow({ ...editingRow, startLocation: val });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Select Start GP</option>
                          {gpOptions.map(opt => (
                            <option value={opt.id} key={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End GP Name</label>
                      { loadingGPD ? (
                        <div className="mt-1">Loading...</div>
                      ) : (
                        <select
                          value={editingRow?.endLocation || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingRow({ ...editingRow, endLocation: val });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="">Select End GP</option>
                          {gpOptions.map(opt => (
                            <option value={opt.id} key={opt.id}>
                              {opt.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                 
                  {/* <input
                    type="text"
                    value={editingRow.startGpName}
                    onChange={(e) => setEditingRow({ ...editingRow, startGpName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Start GP Name"
                    readOnly
                  /> */}
                  {/* <input
                    type="text"
                    value={editingRow.startGpCoordinates}
                    onChange={(e) => setEditingRow({ ...editingRow, startGpCoordinates: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Start GP Coordinates"
                  /> */}
                  {/* <input
                    type="text"
                    value={editingRow.endGpName}
                    onChange={(e) => setEditingRow({ ...editingRow, endGpName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="End GP Name"
                    readOnly
                  /> */}
                  {/* <input
                    type="text"
                    value={editingRow.endGpCoordinates}
                    onChange={(e) => setEditingRow({ ...editingRow, endGpCoordinates: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="End GP Coordinates"
                  /> */}
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