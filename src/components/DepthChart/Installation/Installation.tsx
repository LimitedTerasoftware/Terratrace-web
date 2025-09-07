import { useEffect, useState } from 'react'
import { StateData, District, Block } from '../../../types/survey';
import MainInstallationReport from './MainInstallationReport';
import InstallationStatsPanel from './InstallationStatsPanel';
import { Group, Construction } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

interface StatesResponse {
    success: boolean;
    data: StateData[];
}

// Define installation data interface
interface InstallationData {
    id: string;
    status: 'active' | 'inactive' | 'pending' | 'completed';
    installation_date: string;
    state_name?: string;
    district_name?: string;
    block_name?: string;
    type?: 'GP' | 'BLOCK';
}

type StatusOption = {
    value: string;
    label: string;
};

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

function InstallationPage() {
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
    const [fromdate, setFromDate] = useState<string>('');
    const [todate, setToDate] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'GP_INSTALLATION' | 'BLOCK_INSTALLATION'>('GP_INSTALLATION');
    const [excel, setExcel] = useState<boolean>(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [filtersReady, setFiltersReady] = useState(false);
    
    // New state for stats panel
    const [installationData, setInstallationData] = useState<InstallationData[]>([]);
    const [loadingStats, setLoadingStats] = useState<boolean>(false);

    const statusOptions: StatusOption[] = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' }
    ];

    const InstallationHeader = () => {
        return (
            <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
                            <Group className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Equipment Installation</h1>
                            <p className="text-sm text-gray-600">Monitor and analyze equipment installation data</p>
                        </div>
                    </div>
                    <nav>
                        <ol className="flex items-center gap-2">
                            <li>
                                <Link className="font-medium" to="/dashboard">
                                    Dashboard /
                                </Link>
                            </li>
                            <li className="font-medium text-primary">Installation Data</li>
                        </ol>
                    </nav>
                </div>
            </header>
        );
    };

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

    // New function to fetch installation data for stats
    const fetchInstallationDataForStats = async () => {
    try {
        setLoadingStats(true);
        
        // Fetch both GP and Block installation data
        const [gpResponse, blockResponse] = await Promise.all([
            axios.get<{ status: boolean; data: any[] }>(
                `${TraceBASEURL}/get-gp-installation`
            ),
            axios.get<{ status: boolean; data: any[] }>(
                `${TraceBASEURL}/get-block-installation`
            )
        ]);
        
        const combinedData: InstallationData[] = [];
        
        // Process GP installations
        if (gpResponse.data.status && gpResponse.data.data) {
            const gpData = gpResponse.data.data.map((item: any) => ({
                id: item.id?.toString() || '',
                status: 'completed' as const, // All installations are completed
                installation_date: item.created_at || '',
                state_name: item.state_name || '',
                district_name: item.district_name || '',
                block_name: item.block_name || '',
                type: 'GP' as const
            }));
            combinedData.push(...gpData);
        }
        
        // Process Block installations
        if (blockResponse.data.status && blockResponse.data.data) {
            const blockData = blockResponse.data.data.map((item: any) => ({
                id: item.id?.toString() || '',
                status: 'completed' as const, // All installations are completed
                installation_date: item.created_at || '',
                state_name: item.state_code || '', // Note: block uses state_code
                district_name: item.district_code || '', // Note: block uses district_code
                block_name: item.block_name || '',
                type: 'BLOCK' as const
            }));
            combinedData.push(...blockData);
        }
        
        setInstallationData(combinedData);
    } catch (error) {
        console.error('Error fetching installation data for stats', error);
        setInstallationData([]);
    } finally {
        setLoadingStats(false);
    }
};

    useEffect(() => {
        fetchStates();
        fetchInstallationDataForStats(); // Fetch installation data for stats panel
    }, []);

    const fetchDistricts = async (stateId: string) => {
        if (!stateId) {
            setDistricts([]);
            return;
        }

        try {
            setLoadingDistricts(true);
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
            if (!selectedDistrict) return;
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
        }
    }, [selectedState, states]);

    useEffect(() => {
        fetchBlock();
    }, [selectedDistrict]);

    useEffect(() => {
        const state_id = searchParams.get('state_id') || null;
        const district_id = searchParams.get('district_id') || null;
        const block_id = searchParams.get('block_id') || null;
        const from_date = searchParams.get('from_date') || '';
        const to_date = searchParams.get('to_date') || "";
        const search = searchParams.get('search') || "";
        const tab = searchParams.get('tab') as 'GP_INSTALLATION' | 'BLOCK_INSTALLATION' || 'GP_INSTALLATION';

        setSelectedState(state_id);
        setSelectedDistrict(district_id);
        setSelectedBlock(block_id);
        setFromDate(from_date);
        setToDate(to_date);
        setGlobalSearch(search);
        setActiveTab(tab);
        setFiltersReady(true);
    }, []);

    const handleFilterChange = (newState: string | null, newDistrict: string | null, newBlock: string | null, from_date: string | null, to_date: string | null, search: string | null) => {
        const params: Record<string, string> = {};
        if (newState) params.state_id = newState;
        if (newDistrict) params.district_id = newDistrict;
        if (newBlock) params.block_id = newBlock;
        if (from_date) params.from_date = from_date;
        if (to_date) params.to_date = to_date;
        if (search) params.search = search;
        params.tab = activeTab;
        setSearchParams(params);
    };

    const handleTabChange = (tab: 'GP_INSTALLATION' | 'BLOCK_INSTALLATION') => {
        setActiveTab(tab);
        const params: Record<string, string> = {};
        if (selectedState) params.state_id = selectedState;
        if (selectedDistrict) params.district_id = selectedDistrict;
        if (selectedBlock) params.block_id = selectedBlock;
        if (fromdate) params.from_date = fromdate;
        if (todate) params.to_date = todate;
        if (globalsearch) params.search = globalsearch;
        params.tab = tab;
        setSearchParams(params);
    };

    const clearFilters = () => {
        setSelectedState(null);
        setSelectedDistrict(null);
        setSelectedBlock(null);
        setGlobalSearch('');
        setFromDate('');
        setToDate('');
        const params: Record<string, string> = {};
        params.tab = activeTab;
        setSearchParams(params);
    };

    const handleStateChange = (value: string) => {
        setSelectedState(value || null);
        setSelectedDistrict(null);  // Reset district when state changes
        setSelectedBlock(null);     // Reset block when state changes
        setDistricts([]);          // Clear districts
        setBlocks([]);             // Clear blocks
        handleFilterChange(value || null, null, null, fromdate, todate, globalsearch);
    };

    const handleDistrictChange = (value: string) => {
        setSelectedDistrict(value || null);
        setSelectedBlock(null);     // Reset block when district changes
        setBlocks([]);             // Clear blocks
        handleFilterChange(selectedState, value || null, null, fromdate, todate, globalsearch);
    };

    const handleBlockChange = (value: string) => {
        setSelectedBlock(value || null);
        handleFilterChange(selectedState, selectedDistrict, value || null, fromdate, todate, globalsearch);
    };

    const handleFromDateChange = (value: string) => {
        setFromDate(value);
        handleFilterChange(selectedState, selectedDistrict, selectedBlock, value, todate, globalsearch);
    };

    const handleToDateChange = (value: string) => {
        setToDate(value);
        handleFilterChange(selectedState, selectedDistrict, selectedBlock, fromdate, value, globalsearch);
    };

    const handleSearchChange = (value: string) => {
        setGlobalSearch(value);
        handleFilterChange(selectedState, selectedDistrict, selectedBlock, fromdate, todate, value);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <InstallationHeader />

            {/* Stats Panel */}
            <InstallationStatsPanel 
                installations={installationData} 
                isLoading={loadingStats} 
            />

            {/* Main Content Container */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Search and Filters */}
                <div className="p-6 border-b border-gray-200">

                    {/* First Row - Location Filters */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        {/* State Filter */}
                        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                            <select
                                value={selectedState || ''}
                                onChange={(e) => handleStateChange(e.target.value)}
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
                                onChange={(e) => handleDistrictChange(e.target.value)}
                                disabled={!selectedState || loadingDistricts}
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
                                onChange={(e) => handleBlockChange(e.target.value)}
                                disabled={!selectedDistrict || loadingBlock}
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
                                {loadingBlock ? (
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

                        {/* Date Filters */}
                        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                            <input
                                type="date"
                                value={fromdate}
                                onChange={(e) => handleFromDateChange(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="From Date"
                            />
                        </div>

                        <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                            <input
                                type="date"
                                value={todate}
                                onChange={(e) => handleToDateChange(e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="To Date"
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
                    </div>

                    {/* Second Row - Search and Excel Export */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search Bar */}
                        <div className="relative w-80">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder={`Search ${activeTab === 'GP_INSTALLATION' ? 'GP' : 'Block'} installations...`}
                                value={globalsearch}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                            />
                        </div>

                        {/* Excel Export Button */}
                        <button
                            onClick={() => setExcel(true)}
                            className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
                            title={`Export ${activeTab === 'GP_INSTALLATION' ? 'GP' : 'Block'} installation data to Excel`}
                        >
                            <Construction className="h-4 w-4 text-green-600"/>
                            Export Excel
                        </button>

                        {/* Results Count */}
                        <div className="flex items-center text-sm text-gray-500 ml-auto">
                            <span>Showing data for: {activeTab === 'GP_INSTALLATION' ? 'GP Installations' : 'Block Installations'}</span>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <MainInstallationReport 
                    Data={{
                        selectedState,
                        selectedDistrict,
                        selectedBlock,
                        fromdate,
                        todate,
                        globalsearch,
                        excel,
                        filtersReady
                    }}
                    Onexcel={() => setExcel(false)}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />
            </div>
        </div>
    );
}

export default InstallationPage;