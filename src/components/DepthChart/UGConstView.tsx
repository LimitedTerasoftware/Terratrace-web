import React, { useEffect, useMemo, useState } from 'react'
import { Activity, } from '../../types/survey';
import { useLocation } from 'react-router-dom';
import DataTable, { TableColumn } from 'react-data-table-component';
import { Folder, SheetIcon } from 'lucide-react';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import IndexChart from './index';
import MapComp from './MapComp';
import moment from 'moment';
import ImageModal from './ImageUploadModal';
import * as XLSX from "xlsx";
import { getDistanceFromLatLonInMeters } from '../../utils/calculations';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = import.meta.env.VITE_Image_URL;

function Eventreport() {
    const location = useLocation();
    let sgp = location.state?.sgp || '';
    let egp = location.state?.egp || '';
    let MainData = location.state?.row || ''; 
    const [depthData, setdepthData] = useState<Activity[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>('');
    const [globalsearch, setGlobalSearch] = useState<string>('');
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'map' | 'chart'>('details');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const EventData = [
        'STARTSURVEY',
        'DEPTH',
        'ROADCROSSING',
        'FPOI',
        'JOINTCHAMBER',
        'MANHOLES',
        'ROUTEINDICATOR',
        'LANDMARK',
        'FIBERTURN',
        'KILOMETERSTONE',
        'STARTPIT',
        'ENDPIT',
        'ENDSURVEY',
        'HOLDSURVEY',
        "BLOWING"
    ];
    const getData = async () => {
        try {
            setLoading(true);
            setError('');
            const params: any = {};
            if (sgp) params.start_lgd = sgp;
            if (egp) params.end_lgd = egp;
            if (selectedEvent) params.eventType = selectedEvent;

            const resp = await axios.get(`${TraceBASEURL}/get-depth-data`, { params });
            if (resp.status === 200 || resp.status === 201) {
                const Data = resp.data;
                const depthData = Data.data;
                setdepthData(depthData)
            } else {
                setError('Error Occured')
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');

        } finally {
            setLoading(false);
        }

    }

    useEffect(() => {
        getData()
    }, [sgp, egp, selectedEvent])

    const openModal = (activity: Activity) => {
        setSelectedActivity(activity);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedActivity(null);
    };
    const getLatLongForEvent = (row: Activity) => {
        switch (row.eventType) {
            case "FPOI": return row.fpoiLatLong;
            case "DEPTH": return row.depthLatlong;
            case "JOINTCHAMBER": return row.jointChamberLatLong;
            case "MANHOLES": return row.manholeLatLong;
            case "LANDMARK": return row.landmarkLatLong;
            case "KILOMETERSTONE": return row.kilometerstoneLatLong;
            case "FIBERTURN": return row.fiberTurnLatLong;
            case "ROUTEINDICATOR": return row.routeIndicatorLatLong;
            case "STARTPIT": return row.startPitLatlong;
            case "ENDPIT": return row.endPitLatlong;
            case "STARTSURVEY": return row.startPointCoordinates;
            case "ENDSURVEY": return row.endPointCoordinates;
            case "ROADCROSSING": return row.crossingLatlong;
            case 'HOLDSURVEY':return row.holdLatlong;
            case "BLOWING":return row.blowingLatLong;
            default: return null;
        }
    };

   const addDistancesToData = (data: Activity[]) => {
    return data.map((row, index) => {
        if (index === 0) {
            return { ...row, distance: "0.00" }; 
        }

        const latLong1 = getLatLongForEvent(row);
        const prevRow = data[index - 1];
        const latLong2 = prevRow ? getLatLongForEvent(prevRow) : null;

        if (!latLong1 || !latLong2) return { ...row, distance: "-" };

        const [lat1, lon1] = latLong1.split(',').map(Number);
        const [lat2, lon2] = latLong2.split(',').map(Number);

        const distance = getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2);
        return { ...row, distance: distance.toFixed(2) };
    });
};


    const filteredData = useMemo(() => {
    const dataToFilter = globalsearch.trim()
        ? depthData.filter((row: Activity) =>
              Object.values(row).some((value) =>
                  (typeof value === 'string' || typeof value === 'number') &&
                  value.toString().toLowerCase().includes(globalsearch.toLowerCase())
              )
          )
        : depthData;

    return addDistancesToData(dataToFilter);
}, [globalsearch, depthData]);
   

   
    const markers = filteredData
        .map((row: Activity) => {
            const latLongStr = getLatLongForEvent(row);
            if (
                typeof latLongStr === "string" &&
                latLongStr.includes(",")
            ) {
                const [latStr, lngStr] = latLongStr.split(",");
                const lat = parseFloat(latStr.trim());
                const lng = parseFloat(lngStr.trim());

                if (
                    !isNaN(lat) &&
                    !isNaN(lng) &&
                    Math.abs(lat) <= 90 &&
                    Math.abs(lng) <= 180
                ) {
                    return {
                        lat,
                        lng,
                        eventType: row.eventType,
                        id: row.id,
                    };
                }
            }
            return null;
        })
        .filter(
            (
                m
            ): m is { lat: number; lng: number; eventType: string; id: number } =>
                m !== null
        );

    const eventPhotoFields: Record<string, keyof Activity> = {
        FPOI: "fpoiPhotos",
        DEPTH: "depthPhoto",
        JOINTCHAMBER: "jointChamberPhotos",
        MANHOLES: "manholePhotos",
        LANDMARK: "landmarkPhotos",
        KILOMETERSTONE: "kilometerstonePhotos",
        FIBERTURN: "fiberTurnPhotos",
        ROUTEINDICATOR: "routeIndicatorPhotos",
        STARTPIT: 'startPitPhotos',
        ENDPIT: 'endPitPhotos',
        STARTSURVEY: 'startPointPhoto',
        ENDSURVEY: 'endPointPhoto',
        ROADCROSSING: 'crossingPhotos',
        HOLDSURVEY:'holdPhotos',
        BLOWING:'blowingPhotos'
    };

    const columns: TableColumn<Activity>[] = [
        {
            name: "Actions",
            cell: (row: Activity) => (
                <button
                    onClick={() => openModal(row)}
                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 outline-none dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800 transition-colors"
                >
                    Edit Image
                </button>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },
        { name: "Machine ID", selector: row => row.machine_registration_number || "-", sortable: true },
        { name: "Firm Name", selector: row => row.firm_name || "-", sortable: true },
        {
            name: "Event Type",
            selector: row => row.eventType,
            sortable: true,
        },
        {
            name: "Latitude",
            selector: row => {
                const latlong = getLatLongForEvent(row);
                return latlong ? latlong.split(",")[0] : "-";
            },
        },
        {
            name: "Longitude",
            selector: row => {
                const latlong = getLatLongForEvent(row);
                return latlong ? latlong.split(",")[1] : "-";
            },
        },
        {
            name: "Images",
            cell: (row: Activity) => {
                const photoField = eventPhotoFields[row.eventType];
                const rawPhotoData = photoField ? row[photoField] : null;

                if (typeof rawPhotoData === "string" && rawPhotoData.trim() !== "") {
                    let urls: string[];
                    try {
                        urls = JSON.parse(rawPhotoData);
                    } catch (e) {
                        return (
                            <span
                                className="text-blue-600 space-y-1 underline cursor-pointer block"
                                onClick={() => setZoomImage(`${baseUrl}${rawPhotoData}`)}
                            >
                                {`${row.eventType}_Img`}
                            </span>
                        )

                    }

                    return (
                        <div className="text-blue-600 space-y-1">
                            {urls.map((url: string, i: number) => (
                                <span
                                    key={i}
                                    className="underline cursor-pointer block"
                                    onClick={() => setZoomImage(`${baseUrl}${url}`)}
                                >
                                    {`${row.eventType}_Photo_${i + 1}`}
                                </span>
                            ))}
                        </div>
                    );
                }

                return <span>-</span>;

            },
        },
        { name: "Execution Modality", selector: row => row.executionModality || "-", sortable: true },
        { name: "Landmark Type", selector: row => row.landmark_type || "-", sortable: true },
        { name: "Landmark Desc", selector: row => row.landmark_description || "-", sortable: true },
        { name: "Route Belongs To", selector: row => row.routeBelongsTo || "-", sortable: true },
        { name: "Road Type", selector: row => row.roadType || "-", sortable: true },
        { name: "Soil Type", selector: row => row.soilType || "-", sortable: true },
        { name: "Area Type", selector: row => row.area_type || "-", sortable: true },
        { name: "Side Type", selector: row => row.cableLaidOn || "-", sortable: true },
        { name: "Crossing Type", selector: row => row.crossingType || "-", sortable: true },
        { name: "Crossing Length", selector: row => row.crossingLength || "-", sortable: true },
        { name: "Road Width", selector: row => row.roadWidth || "-", sortable: true },
        { name: "Center To Margin", selector: row => row.road_margin || "-", sortable: true },
        { name: "Offset", selector: row => '', sortable: true },
        { name: "Route Feasible", selector: row => row.Roadfesibility || "-", sortable: true },
        { name: "Depth Meters", selector: row => row.depthMeters || "-", sortable: true },
        { name: "Distance Meters", selector: row => row.distance  || "-", sortable: true },
        { name: "DGPS Accuracy", selector: row => row.dgps_accuracy  || "-", sortable: true },
        { name: "DGPS SIV", selector: row => row.dgps_siv  || "-", sortable: true },
        {
            name: "Vehicle Image",
            cell: (row: Activity) => {
                const imageUrl = row.vehicle_image?.trim();

                if (imageUrl) {
                    return (
                        <span
                            className="text-blue-600 underline cursor-pointer block"
                            onClick={() => setZoomImage(`${baseUrl}${imageUrl}`)}
                        >
                            Vehicle_Img
                        </span>
                    );
                }

                return "-";
            },
            sortable: true,
        },
        {
            name: "End Pit Doc",
            cell: row => {
                if (row.endPitDoc) {
                    const downloadUrl = `${baseUrl}${row.endPitDoc}`;
                    return (
                        <a
                            href={downloadUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-blue-600 hover:text-blue-800"
                        >
                            Download EndPitDoc
                        </a>
                    );
                }
                return "-";
            },
            sortable: true,
        },
        {
            name: "Created At",
            selector: row => moment(row.created_at).format("DD/MM/YYYY, hh:mm A"), sortable: true,
        }

    ];

    const handleClearFilters = () => {
        setSelectedEvent('');
        setGlobalSearch('');
    };
     
    const handleExcel = ()=> {
     setLoading(true);
     const workbook = XLSX.utils.book_new();

  const headers = [
    "State Name", "District Name", "Block Name", "Start GP Name",  "End GP Name","Machine Registration Number","Firm Name","Event Type","Latitude","Longitude",
    "Images","Route Belongs To", "Road Type","Cable Laid On", "Soil Type", "Crossing Type", "Crossing Length","Execution Modality", "Depth (Meters)",
    "Distance","Road Width","Landmark Type","Landmark Description", "Road Feasibility", "Area Type",
    "Road Margin","Vehicle Image", "End Pit Doc", "Authorised Person","Contractor Details", "Vehicle Serial No","Created At", "Updated At",
  ];

  // Map Data in the Same Order as Headers
    const dataRows = filteredData.map(item => {

    const latlong = getLatLongForEvent(item);
    const [latitude, longitude] = latlong ? latlong.split(",") : ["-", "-"];
    let VehicalImg = '-'
    if(item.vehicle_image?.trim()){
     VehicalImg = `=HYPERLINK("${baseUrl}${VehicalImg}", "Vehical_Img")`;
    } 
    const downloadUrl =item.endPitDoc? `=HYPERLINK("${baseUrl}${item.endPitDoc}", "EndpicDoc")` : '-';
    // Get Image Links
    const photoField = eventPhotoFields[item.eventType];
    const rawPhotoData = photoField ? (item as any)[photoField] : null;

    let imageLinks = "-";
    if (typeof rawPhotoData === "string" && rawPhotoData.trim() !== "") {
      try {
        const urls: string[] = JSON.parse(rawPhotoData);
        if (Array.isArray(urls) && urls.length > 0) {
          imageLinks = urls.map((url, i) => `=HYPERLINK("${baseUrl}${url}", "${item.eventType}_Photo_${i + 1}")`).join(", ");
        }
      } catch (e) {
        imageLinks = `=HYPERLINK("${baseUrl}${rawPhotoData}", "${item.eventType}_Img")`;
      }
    }
   return [
    MainData.state_name, MainData.district_name, MainData.block_name, item.start_lgd_name, item.end_lgd_name,item.machine_registration_number,
    item.firm_name,item.eventType,latitude,longitude,imageLinks,item.routeBelongsTo, item.roadType,
    item.cableLaidOn, item.soilType, item.crossingType,item.crossingLength, item.executionModality,item.depthMeters,
    item.distance,item.roadWidth, item.landmark_type,item.landmark_description,item.Roadfesibility, item.area_type,
    item.road_margin,VehicalImg,downloadUrl,item.authorised_person,item.contractor_details, item.vehicleserialno,item.created_at, item.updated_at
  ];});

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

  XLSX.utils.book_append_sheet(workbook, worksheet, "Underground Construcion Details");

  XLSX.writeFile(workbook, "Underground_Construcion_Details.xlsx", { compression: true });

    setLoading(false);
    }
    const customStyles = {
        headRow: {
            style: {
                backgroundColor: '#dee2e6',
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
    return (
        <div className="min-h-screen">
            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
            <div className="mb-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Folder className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Underground Survey view</h1>
                                <p className="text-gray-600">UGconstruction details</p>
                            </div>

                        </div>
                        <button
                            className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
                            onClick={() => window.history.back()}
                        >
                            <FaArrowLeft className="h-5 w-5" />
                            Back
                        </button>
                    </div>
                </div>
            </div>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex flex-wrap justify-between items-center">

                    <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                        <li className="mr-2">
                            <button
                                className={`inline-block p-4 rounded-t-lg outline-none ${activeTab === 'details'
                                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                                    }`}
                                onClick={() => setActiveTab('details')}
                            >
                                Details View
                            </button>
                        </li>
                        <li className="mr-2">
                            <button
                                className={`inline-block p-4 rounded-t-lg outline-none ${activeTab === 'map'
                                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                                    }`}
                                onClick={() => setActiveTab('map')}
                            >
                                Map View
                            </button>
                        </li>
                        <li className="mr-2">
                            <button
                                className={`inline-block p-4 rounded-t-lg outline-none ${activeTab === 'chart'
                                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                                    }`}
                                onClick={() => { setActiveTab('chart') }}
                            >
                                Depth Analysis
                            </button>
                        </li>
                    </ul>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                            <select
                                value={selectedEvent || ''}
                                onChange={(e) => {
                                    setSelectedEvent(e.target.value || '');

                                }}
                                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">All Events</option>
                                {EventData.map((event, idx) => (
                                    <option key={idx} value={event}>
                                        {event}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
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
                        <button
                            onClick={handleExcel}
                            className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
                        >
                            <SheetIcon className="h-4 w-4 text-green-600"/>
                            Excel
                        </button>

                    </div>
                </div>
            </div>
            {activeTab === 'details' && (
                <div className=" overflow-x-auto">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        progressPending={loading}
                        pagination
                        highlightOnHover
                        pointerOnHover
                        striped
                        dense
                        responsive
                        customStyles={customStyles}
                    />
                </div>

            )}
            {activeTab === 'chart' && (
                <div className="h-[600px] p-4">
                    <IndexChart MainData={{
                        start_lgd: filteredData[0]?.start_lgd || '',
                        end_lgd: filteredData[0]?.end_lgd || ''
                    }} />

                </div>
            )}
            {activeTab === 'map' && (
                <div className="h-[600px] p-4">
                    <MapComp data={markers} eventData={filteredData} />
                </div>
            )}

            {/* Image Upload Modal */}
            <ImageModal
                isOpen={isModalOpen}
                onClose={closeModal}
                activity={selectedActivity}
                baseUrl={baseUrl}
                onUpdate={() => getData()}
            />

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
        </div>
    )
}

export default Eventreport