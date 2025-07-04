import React, { useEffect, useMemo, useState } from 'react'
import { DepthDataPoint } from '../../types/survey';
import { useLocation, useNavigate } from 'react-router-dom';
import DataTable, { TableColumn } from 'react-data-table-component';
import { Folder, FolderLock, Search, Settings } from 'lucide-react';
import axios from 'axios';

export interface EventData {
    id: number;
    state_id: number | null;
    distrct_id: number | null;
    block_id: number | null;
    gp_id: number | null;
    link_name: string | null;
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
    start_lgd_name:string;
    end_lgd_name:string;
}

const hasImages = (row: EventData): boolean =>
    !!(
        row.fpoiPhotos ||
        row.depthPhoto ||
        row.jointChamberPhotos ||
        row.manholePhotos ||
        row.landmarkPhotos ||
        row.kilometerstonePhotos ||
        row.fiberTurnPhotos
    );

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;

function Eventreport() {
    const location = useLocation();
    let sgp = location.state?.sgp || '';
    let egp = location.state?.egp || '';
    const [depthData, setdepthData] = useState<EventData[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>('');
    const [globalsearch, setGlobalSearch] = useState<string>('');
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const EventData = [
        'DEPTH',
        'ROADCROSSING',
        'FPOI',
        'JOINTCHAMBER',
        'MANHOLE',
        'ROUTEINDICATOR',
        'LANDMARK',
        'FIBERTURN',
        'KILOMETERSTONE',
        'STARTPIT',
        'ENDPIT'
    ];
    useEffect(() => {
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
        getData()
    }, [sgp, egp,selectedEvent])
    const filteredData = useMemo(() => {
        if (!globalsearch.trim()) return depthData;

        const lowerSearch = globalsearch.toLowerCase();

        return depthData.filter((row: EventData) =>
            Object.values(row).some((value) =>
                (typeof value === 'string' || typeof value === 'number') &&
                value.toString().toLowerCase().includes(lowerSearch)
            )
        );
    }, [globalsearch, depthData]);

    const columns: TableColumn<EventData>[] = [
        {
            name: "Actions",
            cell: row =>
                row.eventType === "DEPTH" ? (
                    <button
                        onClick={() => handleDepthChart(row.start_lgd, row.end_lgd)}
                        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 outline-none dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800"
                    >
                        Depth Chart
                    </button>
                ) : (<span className="text-gray-400 text-xs">-</span>),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
        },

        { name: "ID", selector: row => row.id, sortable: true, wrap: true },
        { name: "Link Name", selector: row => row.link_name || "-", sortable: true },
        { name: "Event Type", selector: row => row.eventType, sortable: true },
        { name: "Start LGD", selector: row => row.start_lgd_name || "-", sortable: true },
        { name: "End LGD", selector: row => row.end_lgd_name || "-", sortable: true },
        { name: "Depth Meters", selector: row => row.depthMeters || "-", sortable: true },
        { name: "Distance", selector: row => row.distance || "-", sortable: true },
        { name: "Machine ID", selector: row => row.machine_id || "-", sortable: true },
        {
            name: "Images",
            cell: (row: EventData) => (
                <div className="text-blue-600 space-y-1">
                    {row.eventType === "FPOI" && row.fpoiPhotos &&
                        JSON.parse(row.fpoiPhotos).map((url: string, i: number) => (
                            <span key={i} className="underline cursor-pointer block" onClick={() => setZoomImage(`${baseUrl}${url}`)}>
                                FPOI_Photo_{i + 1}
                            </span>
                        ))}
                    {row.eventType === "DEPTH" && row.depthPhoto &&
                        JSON.parse(row.depthPhoto).map((url: string, i: number) => (
                            <span key={i} className="underline cursor-pointer block" onClick={() => setZoomImage(`${baseUrl}${url}`)}>
                                Depth_Photo_{i + 1}
                            </span>
                        ))}
                    {row.eventType === "JOINTCHAMBER" && row.jointChamberPhotos &&
                        JSON.parse(row.jointChamberPhotos).map((url: string, i: number) => (
                            <span key={i} className="underline cursor-pointer block" onClick={() => setZoomImage(`${baseUrl}${url}`)}>
                                JointChamber_Photo_{i + 1}
                            </span>
                        ))}
                    {row.eventType === "MANHOLE" && row.manholePhotos &&
                        JSON.parse(row.manholePhotos).map((url: string, i: number) => (
                            <span key={i} className="underline cursor-pointer block" onClick={() => setZoomImage(`${baseUrl}${url}`)}>
                                Manhole_Photo_{i + 1}
                            </span>
                        ))}
                    {row.eventType === "LANDMARK" && row.landmarkPhotos &&
                        JSON.parse(row.landmarkPhotos).map((url: string, i: number) => (
                            <span key={i} className="underline cursor-pointer block" onClick={() => setZoomImage(`${baseUrl}${url}`)}>
                                Landmark_Photo_{i + 1}
                            </span>
                        ))}
                    {row.eventType === "KILOMETERSTONE" && row.kilometerstonePhotos &&
                        JSON.parse(row.kilometerstonePhotos).map((url: string, i: number) => (
                            <span key={i} className="underline cursor-pointer block" onClick={() => setZoomImage(`${baseUrl}${url}`)}>
                                KmStone_Photo_{i + 1}
                            </span>
                        ))}
                    {row.eventType === "FIBERTURN" && row.fiberTurnPhotos &&
                        JSON.parse(row.fiberTurnPhotos).map((url: string, i: number) => (
                            <span key={i} className="underline cursor-pointer block" onClick={() => setZoomImage(`${baseUrl}${url}`)}>
                                FiberTurn_Photo_{i + 1}
                            </span>
                        ))}
                    {/* fallback if no images */}
                    {!hasImages(row) && <span>-</span>}
                </div>
            ),
        },
        { name: "Created At", selector: row => new Date(row.created_at).toLocaleString(), sortable: true },

    ];

    const handleClearFilters = () => {
        setSelectedEvent('');
        setGlobalSearch('');

    };
    const handleDepthChart = async (sgp: string | number, egp: number | string) => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {};
            if (sgp) params.start_lgd = sgp;
            if (egp) params.end_lgd = egp;
            params.eventType = 'DEPTH';


            const resp = await axios.get(`${TraceBASEURL}/get-depth-data`, { params });
            if (resp.status === 200 || resp.status === 201) {
                const Data = resp.data;
                const depthData = Data.data;
                navigate('/depth-chart', { state: { depthData } });
            } else {
                setError('Error Occured')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');

        } finally {
            setLoading(false);
        }

    }
    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            {loading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            )}
            <div className="bg-white shadow-sm border-b border-gray-200 mb-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-600 rounded-lg">
                                <Folder className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">All Events Report</h1>
                                <p className="text-gray-600">Manage your event data</p>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
            <div className="mb-4">
                <div className="flex flex-wrap items-center gap-3">
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

                </div>
            </div>
            {filteredData.length === 0 ? (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
                    <p className="text-gray-500">
                        {globalsearch
                            ? 'Try adjusting your search or filter criteria.'
                            : 'There is no data.'
                        }
                    </p>
                </div>
            ) : (
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
                />
            )}
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