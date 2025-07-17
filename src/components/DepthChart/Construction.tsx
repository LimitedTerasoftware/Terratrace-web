import React, { useEffect, useState } from 'react'
import { StateData, District, Block } from '../../types/survey';
import Report from './UGConst';
import { ToastContainer } from 'react-toastify';
import Breadcrumb from '../Breadcrumbs/Breadcrumb';
import { SheetIcon } from 'lucide-react';

interface StatesResponse {
    success: boolean;
    data: StateData[];
}

type StatusOption = {
    value: number;
    label: string;
};

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

function Construction() {
    const [states, setStates] = useState<StateData[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
    const [globalsearch, setGlobalSearch] = useState<string>('');
    const [loadingStates, setLoadingStates] = useState<boolean>(false);
    const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
    const [loadingBlock, setLoadingBlock] = useState<boolean>(false);
    const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
    const [fromdate, setFromDate] = useState<string>('');
    const [todate, setToDate] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'UG'>('UG');
    const [excel,setExcel]=useState<boolean>(false);



    const statusMap: Record<number, string> = {
        1: "Completed",
        0: "Pending",
    };

    const statusOptions: StatusOption[] = Object.entries(statusMap).map(
        ([value, label]) => ({
            value: Number(value),
            label,
        })
    );

    // Fetch all states
    const fetchStates = async () => {
        try {
            setLoadingStates(true);
            const response = await fetch(`${BASEURL}/states`);
            if (!response.ok) throw new Error('Failed to fetch states');
            const result: StatesResponse = await response.json();
            setStates(result.success ? result.data : []);
        } catch (error) {
            console.error('Error fetching states:', error);
        } finally {
            setLoadingStates(false);
        }
    };

    useEffect(() => {
        fetchStates();
    }, []);

    // Fetch districts by state ID (not state_code)
    const fetchDistricts = async (stateId: string) => {
        if (!stateId) {
            setDistricts([]);
            return;
        }

        try {
            setLoadingDistricts(true);
            // Find the state_code for the selected state_id

            const response = await fetch(`${BASEURL}/districtsdata?state_code=${stateId}`);
            if (!response.ok) throw new Error('Failed to fetch districts');
            const data = await response.json();
            setDistricts(data || []);
        } catch (error) {
            console.error('Error fetching districts:', error);
            setDistricts([]);
        } finally {
            setLoadingDistricts(false);
        }
    };

    const fetchBlock = async () => {
        try {
            if (selectedDistrict === '') return;
            setLoadingBlock(true);

            const response = await fetch(`${BASEURL}/blocksdata?district_code=${selectedDistrict}`);
            if (!response.ok) throw new Error('Failed to fetch blocks');
            const data = await response.json();
            setBlocks(data || []);
        } catch (error) {
            console.error('Error fetching blocks:', error);
            setBlocks([]);
        } finally {
            setLoadingBlock(false);
        }
    }

    useEffect(() => {
        if (selectedState) {
            fetchDistricts(selectedState);
        } else {
            setDistricts([]);
            setSelectedDistrict('');
        }
    }, [selectedState, states]);

    useEffect(() => {
        fetchBlock();
    }, [selectedDistrict]);

    const clearFilters = () => {
        setSelectedState(null);
        setSelectedDistrict(null);
        setSelectedBlock(null);
        setSelectedStatus(null);
        setGlobalSearch('');
        setFromDate('');
        setToDate('');
    };
    return (
        <div className="sm:p-2 lg:p-4 min-h-screen">
            <div className="mb-6">
                <Breadcrumb pageName="Construction Data" />
            </div>
            {/* Search and Filters */}
            <div className="mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    {/* State Filter */}
                    <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                        <select
                            value={selectedState || ''}
                            onChange={(e) => setSelectedState(e.target.value || '')}
                            disabled={loadingStates}
                            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                        >
                            <option value="">All States</option>
                            {states.map((state) => (
                                <option key={state.state_id} value={state.state_id}>
                                    {state.state_name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            {loadingStates ? (
                                <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* District Filter */}
                    <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                        <select
                            value={selectedDistrict || ''}
                            onChange={(e) => setSelectedDistrict(e.target.value || '')}
                            disabled={!selectedState}
                            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                        >
                            <option value="">All Districts</option>
                            {districts.map((district) => (
                                <option key={district.district_id} value={district.district_id}>
                                    {district.district_name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            {loadingDistricts ? (
                                <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Block Filter */}
                    <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                        <select
                            value={selectedBlock || ''}
                            onChange={(e) => setSelectedBlock(e.target.value)}
                            disabled={!selectedDistrict}
                            className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
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
                                setSelectedStatus(e.target.value !== '' ? Number(e.target.value) : null);
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

                    {/* Clear Filters */}
                    <button
                        onClick={clearFilters}
                        className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
                    >
                        <span className="text-red-500 dark:text-red-400 font-medium text-sm">✕</span>
                        <span>Clear Filters</span>
                    </button>
                      <button
                        onClick={()=>setExcel(true)}
                        className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
                    >
                        <SheetIcon className="h-4 w-4 text-green-600"/>
                        Excel
                    </button>

                </div>
            </div>
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                    <li className="mr-2">
                        <button
                            className={`inline-block p-4 rounded-t-lg outline-none ${activeTab === 'UG'
                                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                                }`}
                            onClick={() => setActiveTab('UG')}
                        >
                            Underground Construction
                        </button>
                    </li>

                </ul>
            </div>
            
               {activeTab === 'UG' && (
                <Report 
                Data={{
                    selectedState,
                    selectedDistrict,
                    selectedBlock,
                    selectedStatus,
                    fromdate,
                    todate,
                    globalsearch,excel,
                    
                }}
                Onexcel={()=>setExcel(false)}
                />


               )}
        </div>

    )
}

export default Construction