import React, { useEffect, useMemo, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { Machine } from "../../types/machine";
import { Search } from "lucide-react";

export interface TableRow {
  id: number;
  state_id: number | null;
  distrct_id: number | null;
  block_id: number | null;
  gp_id: number | null;
  link_name: string;
  startPointPhoto: string | null;
  startPointCoordinates: string | null;
  routeBelongsTo: string | null;
  roadType: string | null;
  cableLaidOn: string | null;
  soilType: string | null;
  crossingType: string | null;
  crossingLength: string | null;
  crossingLatlong: string | null;
  crossingPhotos: string | null;
  executionModality: string | null;
  depthLatlong: string | null;
  depthPhoto: string | null;
  depthMeters: string | null;
  fpoiLatLong: string | null;
  fpoiPhotos: string | null;
  jointChamberLatLong: string | null;
  jointChamberPhotos: string | null;
  manholeLatLong: string | null;
  manholePhotos: string | null;
  routeIndicatorLatLong: string | null;
  routeIndicatorPhotos: string | null;
  landmarkLatLong: string | null;
  landmarkPhotos: string | null;
  fiberTurnLatLong: string | null;
  fiberTurnPhotos: string | null;
  kilometerstoneLatLong: string | null;
  kilometerstonePhotos: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  start_lgd: string;
  end_lgd: string;
  machine_id: string;
  contractor_details: string | null;
  vehicleserialno: string | null;
  distance: string | null;
  startPitLatlong: string | null;
  startPitPhotos: string | null;
  endPitLatlong: string | null;
  endPitPhotos: string | null;
  roadWidthLatlong: string | null;
  roadWidth: string | null;
  roadWidthPhotos: string | null;
  eventType: string;
  survey_id: number;
  vehicle_image: string | null;
  endPitDoc: string | null;
}

  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;

const MachineDataTable = () => {
      const [loading, setLoading] = useState<boolean>(false);
      const [error, setError] = useState<string | null>(null);
      const [fromdate, setFromDate] = useState<string>('');
      const [todate, setToDate] = useState<string>('');
      const [Machine,setMachine]=useState('');
      const [machinesData, setMachinesData] = useState<Machine[]>([]);
      const [tableData, setTableData] = useState<TableRow[]>([]);
      const [searchTerm, setSearchTerm] = useState('');
      const [zoomImage, setZoomImage] = useState<string | null>(null);
      const [globalsearch, setGlobalSearch] = useState<string>('');

   const GetData = async() =>{
      try {
        const resp = await axios.get(`${TraceBASEURL}/get-all-machines`);
        if(resp.status === 200 || resp.status === 201){
         setMachinesData(resp.data.machines);
        }
        
      } catch (error) {
         console.log(error)
      }

    }
  useEffect(()=>{
    GetData();
  },[])
  useEffect(()=>{
  const handleMachineData = async() =>{
    try {
      setError('')
      setLoading(true)
    const params:any={};
    if(Machine) params.machine_id = Machine;
    if(fromdate) params.from_date = fromdate;
    if(todate) params.to_date = todate;

    const resp = await axios.get(`${TraceBASEURL}/get-filtered-data`,{params});
       if(resp.status === 200 || resp.status === 201){
        const Data = resp.data.data;
       setTableData(Data)
       }else{
        setError('Error Occured')

       }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');

    }finally{
      setLoading(false)
    }
  }
  handleMachineData()
 },[Machine,fromdate,todate])
 const parseAndRenderUrls = (
  jsonString: string,
  labelPrefix: string,
  baseUrl: string
): JSX.Element[] => {
  let urls: string[] = [];
  try {
    urls = JSON.parse(jsonString);
  } catch (e) {
    console.error(`Invalid JSON in ${labelPrefix}:`, jsonString);
  }

  return urls
    .filter((url) => url)
    .map((url, index) => (
      <span
        key={`${labelPrefix}_${index}`}
        className="underline cursor-pointer block"
        onClick={() => setZoomImage(`${baseUrl}${url}`)}
      >
        {`${labelPrefix}_Image_${index + 1}`}
      </span>
    ));
};

 const columns: TableColumn<TableRow>[] = [
  { name: "survey_id", selector: row => row.survey_id, sortable: true },
  { name: "State", selector: row => row.state_id ?? '-', sortable: true },
  { name: "District", selector: row => row.distrct_id ?? '-', sortable: true },
  { name: "Block", selector: row => row.block_id ?? '-', sortable: true },
  { name: "GP", selector: row => row.gp_id ?? '-', sortable: true },
  { name: "Link Name", selector: row => row.link_name, sortable: true },
  { name: "Start Coordinates", selector: row => row.startPointCoordinates ?? '-', sortable: true },
  {
    name: "Event Type",
    selector: row => row.eventType,
    sortable: true,
  },
  {
  name: "Images",
  cell: (row: TableRow) => (
    <div className="text-blue-600">
      {/* FPOI Photos */}
      {row.fpoiPhotos && row.eventType === 'FPOI' && parseAndRenderUrls(row.fpoiPhotos, 'FPOI', baseUrl)}
      {row.startPointPhoto && parseAndRenderUrls(row.startPointPhoto, 'startPoint', baseUrl)}

      {/* Crossing Photos */}
      {row.crossingPhotos && row.eventType === 'ROADCROSSING'&& parseAndRenderUrls(row.crossingPhotos, 'Crossing', baseUrl)}

      {/* Joint Chamber Photos */}
      {row.jointChamberPhotos && row.eventType === 'JOINTCHAMBER'  && parseAndRenderUrls(row.jointChamberPhotos, 'JointChamber', baseUrl)}

      {/* Manhole Photos */}
      {row.manholePhotos && row.eventType === 'MANHOLE' && parseAndRenderUrls(row.manholePhotos, 'Manhole', baseUrl)}

      {/* Route Indicator Photos */}
      {row.routeIndicatorPhotos && row.eventType === 'ROUTEINDICATOR' && parseAndRenderUrls(row.routeIndicatorPhotos, 'RouteIndicator', baseUrl)}

      {/* Landmark Photos */}
      {row.landmarkPhotos && row.eventType === 'LANDMARK' && parseAndRenderUrls(row.landmarkPhotos, 'Landmark', baseUrl)}

      {/* Fiber Turn Photos */}
      {row.fiberTurnPhotos && row.eventType === 'FIBERTURN' && parseAndRenderUrls(row.fiberTurnPhotos, 'FiberTurn', baseUrl)}

      {/* Kilometer Stone Photos */}
      {row.kilometerstonePhotos && row.eventType === 'KILOMETERSTONE' && parseAndRenderUrls(row.kilometerstonePhotos, 'KmStone', baseUrl)}

      {/* Start Pit Photos */}
      {row.startPitPhotos && row.eventType === 'STARTPIT' && parseAndRenderUrls(row.startPitPhotos, 'StartPit', baseUrl)}

      {/* End Pit Photos */}
      {row.endPitPhotos && row.eventType === 'ENDPIT' && parseAndRenderUrls(row.endPitPhotos, 'EndPit', baseUrl)}

      {/* Road Width Photos */}
      {row.roadWidthPhotos && parseAndRenderUrls(row.roadWidthPhotos, 'RoadWidth', baseUrl)}
      {row.depthPhoto && parseAndRenderUrls(row.depthPhoto, 'depth', baseUrl)}

      {/* Vehicle Image */}
      {row.vehicle_image && (
        <span
          className="underline cursor-pointer block"
          onClick={() => setZoomImage(`${baseUrl}${row.vehicle_image}`)}
        >
          Vehicle_Image
        </span>
      )}

      {/* Fallback */}
      {!row.fpoiPhotos && !row.crossingPhotos && !row.jointChamberPhotos &&
       !row.manholePhotos && !row.routeIndicatorPhotos && !row.landmarkPhotos &&
       !row.fiberTurnPhotos && !row.kilometerstonePhotos && !row.startPitPhotos && !row.startPointPhoto&&
       !row.depthPhoto &&!row.endPitPhotos && !row.roadWidthPhotos && !row.vehicle_image && (
         <span className="text-gray-400 text-xs">-</span>
       )}
    </div>
  ),
},

  { name: "Route Belongs To", selector: row => row.routeBelongsTo ?? '-', sortable: true },
  { name: "Road Type", selector: row => row.roadType ?? '-', sortable: true },
  { name: "CableLaidOn", selector: row => row.cableLaidOn ?? '-', sortable: true },
  { name: "SoilType", selector: row => row.soilType ?? '-', sortable: true },
  { name: "CrossingType", selector: row => row.crossingType ?? '-', sortable: true },
  { name: "CrossingLength", selector: row => row.crossingLength ?? '-', sortable: true },
  { name: "ExecutionModality", selector: row => row.executionModality ?? '-', sortable: true },
  { name: "ExecutionModality", selector: row => row.executionModality ?? '-', sortable: true },
  { name: "Distance (m)", selector: row => row.distance ?? '-', sortable: true },
  { name: "Depth (m)", selector: row => row.depthMeters ?? '-', sortable: true },

  {
    name: "Status",
    selector: row => row.status.toString(),
    sortable: true,
  },
    {
    name: "Created At",
    selector: row => new Date(row.created_at).toLocaleString(),
    sortable: true,
  },
];


    const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#64B5F6',
        color: '#616161',
        fontWeight: 600,
        fontSize: '14px',
        padding: '10px',

      },
    },
    headCells: {
      style: {
        whiteSpace: 'nowrap',
      },
    },
    cells: {
      style: {
        width: "150px",
      },
    },
  };
   const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setMachine('');
    setGlobalSearch('');
    setTableData([]);

  };
  const filteredData = useMemo(() => {
  if (!globalsearch.trim()) return tableData;

  const lowerSearch = globalsearch.toLowerCase();

  return tableData.filter((row: TableRow) =>
    Object.values(row).some((value) =>
      (typeof value === 'string' || typeof value === 'number') &&
      value.toString().toLowerCase().includes(lowerSearch)
    )
  );
}, [globalsearch, tableData]);

  return (
    <div className="container mx-auto p-6">
        {zoomImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50"
          onClick={() => setZoomImage(null)}
        >
          <img
            src={zoomImage}
            alt="Zoomed"
            className="max-w-full max-h-full p-4 rounded-lg"
          />
        </div>
      )}
       {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
            <select
              value={Machine !== '' ? Machine : ''}
              onChange={(e) => {
              setMachine(e.target.value !== '' ? (e.target.value) :'');

              }}
              className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All</option>
                {machinesData.map((machine) => (
                  <option key={machine.machine_id} value={machine.machine_id}>
                    {machine.registration_number}
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
                setFromDate(e.target.value);
               
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
                setToDate(e.target.value);
               
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
                setGlobalSearch(e.target.value);
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

          </div>
        </div>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        {error && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
            <span className="font-medium">Error loading data:</span> {error}
          </div>
        )}
       {tableData.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No today data found</h3>
          <p className="text-gray-500">
            {searchTerm  
              ? 'Try adjusting your search or filter criteria.' 
              : 'Add your first machine data to get started.'
            }
          </p>
        </div>
      ) : (
      <DataTable
        columns={columns}
        data={filteredData}
        pagination
        highlightOnHover
        responsive
        striped
        dense
        customStyles={customStyles} 
      />
      )}
    </div>
     </div>
  );
};

export default MachineDataTable;
