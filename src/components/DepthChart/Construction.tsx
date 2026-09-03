import { act, useEffect, useRef, useState } from 'react';
import { StateData, District, Block } from '../../types/survey';
import Report from './UGConst';
import AcceptedLinks from './AcceptedLinks';
import type { AcceptedLinksSummary } from './AcceptedLinks';
import ConstructionStatsPanel from './ConstructionStatsPanel';
import {
  SheetIcon,
  Construction,
  EyeIcon,
  PlusCircleIcon,
  Globe2Icon,
  GitMerge,
  PenSquare,
  Loader2,
  FileText,
} from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { UGConstructionSurveyData } from '../../types/survey';
import { isAdminUser, isIEUser, getAuthHeaders } from '../../utils/accessControl';
import SearchableSelect from '../Forms/SearchableSelect';
import { machineApi } from '../Services/api';
import { MachineDetailsResponse } from '../../types/machine';
interface StatesResponse {
  success: boolean;
  data: StateData[];
}

interface ConstructionSummary {
  totalSurveys: number;
  acceptedSurveys: number;
  rejectedSurveys: number;
  totalDistanceMeters: number;
  totalKm: number;
  pendingSurveys:number;
}

type StatusOption = {
  value: number;
  label: string;
};

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

function ConstructionPage() {
  const AdminAcess = isAdminUser();
  const IEUser = isIEUser();
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(()=> IEUser ? '6' : null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [globalsearch, setGlobalSearch] = useState<string>('');
  const [loadingStates, setLoadingStates] = useState<boolean>(false);
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingBlock, setLoadingBlock] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<number[]>([]);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'UG' | 'AcceptedLinks'>('UG');
  const [excel, setExcel] = useState<boolean>(false);
  const [pdf, setPdf] = useState<boolean>(false);
  const [acceptedPdfLoading, setAcceptedPdfLoading] = useState<boolean>(false);
  const [kml, setkml] = useState<boolean>(false);
  const [preview, setPreview] = useState<boolean>(false);
  const [progressmap, setProgressmap] = useState<boolean>(false);
  const [mergeSurveys, setMergeSurveys] = useState<boolean>(false);
  const [mergeLoading, setMergeLoading] = useState<boolean>(false);
  const [editLink, setEditLink] = useState<boolean>(false);
  const [acceptedExcelLoading, setAcceptedExcelLoading] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersReady, setFiltersReady] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [connections, setConnections] = useState<
    { route_name: string; startLocation: string; endLocation: string }[]
  >([]);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(
    null,
  );
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [vendors, setVendors] = useState<MachineDetailsResponse['data']>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  // New state for stats panel
  const [surveyData, setSurveyData] = useState<UGConstructionSurveyData[]>([]);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [constructionSummary, setConstructionSummary] =
    useState<ConstructionSummary | null>(null);
  const [acceptedLinksSummary, setAcceptedLinksSummary] =
    useState<AcceptedLinksSummary | null>(null);
  const [worktype, setworktype] = useState<string[]>([]);
  const [workTypeDropdownOpen, setWorkTypeDropdownOpen] = useState(false);
  const workTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [constType, setConstType] = useState<string>('Hdd');
  const [cords, setcords] = useState<string>('');
  const [tdStatus, setTdStatus] = useState<string>('');
  const [ofcStatus, setOfcStatus] = useState<string>('');
  const [page, setPage] = useState<number>(() => {
    const pageParam = Number(new URLSearchParams(window.location.search).get('page'));
    return pageParam > 0 ? pageParam : 1;
  });

  const statusMap: Record<number, string> = {
    1: 'Accepted',
    2: 'Rejected',
    0: 'Pending',
  };

  const statusOptions: StatusOption[] = Object.entries(statusMap).map(
    ([value, label]) => ({
      value: Number(value),
      label,
    }),
  );

  const workTypeOptions = [
    { value: 'New Construction', label: 'New Construction' },
    { value: 'Rectification', label: 'Rectification' },
    { value: 'OFC Blowing/ JointChamber', label: 'OFC Blowing / Joint Chamber' },
    { value: 'Protection', label: 'Protection' },
  ];

  const ConstructionHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
              <Construction className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {activeTab === 'UG' ? 'Construction' : 'T&D Links'}{' '}
                Management
              </h1>
              <p className="text-sm text-gray-600">
                Monitor and analyze{' '}
                {activeTab === 'UG' ? 'construction' : 'T&D link'}{' '}
                project data
              </p>
            </div>
          </div>
          <nav>
            <ol className="flex items-center gap-2">
              <li>
                <Link className="font-medium" to="/dashboard">
                  Dashboard /
                </Link>
              </li>
              <li className="font-medium text-primary">
                {activeTab === 'UG' ? 'Construction' : 'T&D Links'}{' '}
                Data
              </li>
            </ol>
          </nav>
        </div>
      </header>
    );
  };

  const fetchStates = async () => {
    try {
      setLoadingStates(true);
      const response = await fetch(`${TraceBASEURL}/states`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch states');
      const result: StatesResponse = await response.json();
      const stateData = result.success ? result.data : [];

      if (IEUser) {
        const filtered = stateData.filter(
          (state: any) =>
            String(state.state_id) === '6' ||
            String(state.state_code) === '19'||
            String(state.state_id) === '1'||String(state.state_code) === '35',
        );
        setStates(filtered);
        if (filtered.length > 0) {
          setSelectedState('6');
        }
      } else {
        setStates(stateData);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  useEffect(() => {
    fetchStates();
    // const params: Record<string, string> = {};
    // const tab = searchParams.get('tab') || 'UG';
    // if (tab) params.tab = tab;
    // setSearchParams(params);
  }, []);

  const fetchDistricts = async (stateId: string) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }

    try {
      setLoadingDistricts(true);
      const response = await fetch(
        `${TraceBASEURL}/districtsdata?state_code=${stateId}`,
        { headers: getAuthHeaders() },
      );
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

      const response = await fetch(
        `${TraceBASEURL}/blocksdata?district_code=${selectedDistrict}`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) throw new Error('Failed to fetch blocks');
      const data = await response.json();
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      setBlocks([]);
    } finally {
      setLoadingBlock(false);
    }
  };

  const fetchVerifiedNetworks = async () => {
    try {
      if (!selectedBlock) {
        return;
      }
      setLoadingConnections(true);

      const response = await fetch(
        `${TraceBASEURL}/get-linknames?block_id=${selectedBlock}`,
      );
      const result = await response.json();
      if (result.status && result.data?.length > 0) {
        setConnections(result.data);
      } else {
        setConnections([]);
      }
    } catch (error) {
      console.error('Error fetching verified networks:', error);
      setLoadingConnections(false);
    } finally {
      setLoadingConnections(false);
    }
  };

  const fetchVendors = async () => {
    try {
      if (!selectedBlock) {
        setVendors([]);
        return;
      }
      setLoadingVendors(true);
      const response = await machineApi.getFirmDistanceStats(
        selectedState || undefined,
        selectedDistrict || undefined,
        selectedBlock || undefined,
      );
      setVendors(response.data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [selectedState, selectedDistrict, selectedBlock]);

  const fetchConstructionSummary = async () => {
    try {
      setLoadingStats(true);
      const params: Record<string, string> = {};
      if (selectedState) params.state_id = selectedState;
      if (selectedDistrict) params.district_id = selectedDistrict;
      if (selectedBlock) params.block_id = selectedBlock;
      if (selectedStatus.length > 0) params.status = selectedStatus.join(',');
      if (constType) params.construction_type = constType;
      if (worktype.length > 0) params.worktype = worktype.join(',');
      if (fromdate) params.from_date = fromdate;
      if (todate) params.to_date = todate;
      if (globalsearch.trim()) params.search = globalsearch.trim();
      if (cords) params.coords = cords;
      if (selectedVendor) params.firm_id = selectedVendor;
      const start = getSelectedConnectionDetails()?.startLocation;
      const end =getSelectedConnectionDetails()?.endLocation;
      if(start) params.start = start;
      if(end) params.end = end;

      const response = await fetch(
        `${TraceBASEURL}/getConstructionSummary?${new URLSearchParams(params).toString()}`,
          {
          headers: getAuthHeaders(),
        }
      );
      const result = await response.json();
      setConstructionSummary(result.status ? result.summary : null);
    } catch (error) {
      console.error('Error fetching construction summary:', error);
      setConstructionSummary(null);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (!filtersReady || activeTab !== 'UG') return;
    fetchConstructionSummary();
  }, [
    filtersReady,
    activeTab,
    selectedState,
    selectedDistrict,
    selectedBlock,
    selectedStatus,
    constType,
    worktype,
    fromdate,
    todate,
    globalsearch,
    cords,
    selectedConnection,
    selectedVendor
  ]);

  useEffect(() => {
    fetchVerifiedNetworks();
  }, [selectedState, selectedDistrict, selectedBlock]);

  const getSelectedConnectionDetails = () => {
    if (!selectedConnection) return null;
    return connections.find((c) => c.route_name === selectedConnection);
  };

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
    const status = searchParams.get('status') || null;
    const from_date = searchParams.get('from_date') || '';
    const to_date = searchParams.get('to_date') || '';
    const search = searchParams.get('search') || '';
    const worktypeParam = searchParams.get('worktype') || '';
    const constType = searchParams.get('constType') || 'Hdd';
    const cords = searchParams.get('cords') || '';
    const tab = searchParams.get('tab') || 'UG';
    const td_status = searchParams.get('td_status') || '';
    const ofc_status = searchParams.get('ofc_status') || '';
    const firm_id = searchParams.get('firm_id') || null;

    setcords(cords);
    setSelectedState(state_id || (IEUser ? '6' : null));
    setSelectedDistrict(district_id);
    setSelectedBlock(block_id);
    setSelectedStatus(
      IEUser
        ? [1]
        : status !== null && status !== ''
          ? status
              .split(',')
              .map(Number)
              .filter((n) => !Number.isNaN(n))
          : [],
    );
    setFromDate(from_date);
    setToDate(to_date);
    setGlobalSearch(search);
    setworktype(worktypeParam ? worktypeParam.split(',').filter(Boolean) : []);
    setFiltersReady(true);
    setConstType(constType);
    setActiveTab(IEUser ? 'UG' : tab === 'AcceptedLinks' ? 'AcceptedLinks' : 'UG');
    setTdStatus(td_status);
    setOfcStatus(ofc_status);
    setSelectedVendor(firm_id);
  }, []);

  useEffect(() => {
    const pageParam = Number(searchParams.get('page'));
    setPage(pageParam > 0 ? pageParam : 1);
  }, [searchParams]);

  const handleFilterChange = (
    newState: string | null,
    newDistrict: string | null,
    newBlock: string | null,
    newLink: string | null,
    status: number[],
    worktype: string[],
    from_date: string | null,
    to_date: string | null,
    search: string | null,
    constType: string | '',
    tab?: 'UG' | 'AcceptedLinks',
    cords?: string | '',
    page?: number,
    tdStatus?: string,
    ofcStatus?: string,
    firmId?: string | null,
  ) => {
    const params: Record<string, string> = {};
    if (newState) params.state_id = newState;
    if (newDistrict) params.district_id = newDistrict;
    if (newBlock) params.block_id = newBlock;
    if (newLink) params.link = newLink;
    if (status.length > 0) {
      params.status = status.join(',');
    }
    if (worktype.length > 0) params.worktype = worktype.join(',');
    if (from_date) params.from_date = from_date;
    if (to_date) params.to_date = to_date;
    if (search) params.search = search;
    if (constType) params.constType = constType;
    if (tab) params.tab = tab;
    if (cords) params.cords = cords;
    if (page && page > 1) params.page = String(page);
    if (tdStatus) params.td_status = tdStatus;
    if (ofcStatus) params.ofc_status = ofcStatus;
    if (firmId) params.firm_id = firmId;
    setSearchParams(params);
    if (!page) setPage(1);
  };

  const clearFilters = () => {
    setSelectedState(IEUser ? '6' : null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    setSelectedVendor(null);
    setSelectedStatus(IEUser ? [1] : []);
    setGlobalSearch('');
    setFromDate('');
    setToDate('');
    setSearchParams({});
    setworktype([]);
    setConstType('Hdd');
    setcords('');
    setTdStatus('');
    setOfcStatus('');
    setPage(1);
  };

  const handleTabChange = (tab: 'UG' | 'AcceptedLinks') => {
    setActiveTab(tab);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      tab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      selectedVendor,
    );
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value || null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    setSelectedVendor(null);

    handleFilterChange(
      value || null,
      null,
      null,
      null,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      null,
    );
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value || null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    setSelectedVendor(null);
    handleFilterChange(
      selectedState,
      value || null,
      null,
      null,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      null,
    );
  };

  const handleBlockChange = (value: string) => {
    setSelectedBlock(value || null);
    setSelectedConnection(null);
    setSelectedVendor(null);

    handleFilterChange(
      selectedState,
      selectedDistrict,
      value || null,
      null,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      null,
    );
  };
  const handleLinkChange = (value: string) => {
    setSelectedConnection(value || null);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      selectedVendor,
    );
  };

  const handleStatusToggle = (value: number) => {
    const statusValue = selectedStatus.includes(value)
      ? selectedStatus.filter((s) => s !== value)
      : [...selectedStatus, value];
    setSelectedStatus(statusValue);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      statusValue,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      selectedVendor,
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
      if (
        workTypeDropdownRef.current &&
        !workTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setWorkTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleWorkTypeToggle = (value: string) => {
    const updated = worktype.includes(value)
      ? worktype.filter((w) => w !== value)
      : [...worktype, value];
    setworktype(updated);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      updated,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      selectedVendor,
    );
  };
  const handleConstTypeChange = (value: string) => {
    setConstType(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      value,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      selectedVendor,
    );
  };
  const handleCordsChange = (value: string) => {
    setcords(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      value,
      page,
      tdStatus,
      ofcStatus,
      selectedVendor,
    );
  };

  const handleTdStatusChange = (value: string) => {
    setTdStatus(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      value,
      ofcStatus,
      selectedVendor,
    );
  };

  const handleOfcStatusChange = (value: string) => {
    setOfcStatus(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      value,
      selectedVendor,
    );
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      value,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      selectedVendor,
    );
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      value,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      selectedVendor,
    );
  };

  const handleSearchChange = (value: string) => {
    setGlobalSearch(value);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      value,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      selectedVendor,
    );
  };
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      newPage,
      tdStatus,
      ofcStatus,
      selectedVendor,
    );
  };

  const handleVendorChange = (value: string) => {
    setSelectedVendor(value || null);
    handleFilterChange(
      selectedState,
      selectedDistrict,
      selectedBlock,
      selectedConnection,
      selectedStatus,
      worktype,
      fromdate,
      todate,
      globalsearch,
      constType,
      activeTab,
      cords,
      page,
      tdStatus,
      ofcStatus,
      value || null,
    );
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <ConstructionHeader />

      {/* Stats Panel */}
      {!IEUser && (activeTab === 'UG' || activeTab === 'AcceptedLinks') &&  (
        <ConstructionStatsPanel
          surveys={activeTab === 'UG' ? surveyData :null}
          isLoading={loadingStats}
          summary={constructionSummary}
          acceptedLinksSummary={activeTab === 'AcceptedLinks'?acceptedLinksSummary:null}
        />
      )}

      {/* Main Content Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        {!IEUser && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center px-6">
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg outline-none ${
                  activeTab === 'UG'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                onClick={() => handleTabChange('UG')}
              >
                Construction
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg outline-none ${
                  activeTab === 'AcceptedLinks'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                onClick={() => handleTabChange('AcceptedLinks')}
              >
                T&D Links
              </button>
            </li>
          </ul>
        </div>
        )}

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          {/* First Row - Location Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* State Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <SearchableSelect
                value={selectedState || ''}
                onChange={handleStateChange}
                options={states.map((state) => ({
                  value: String(state.state_id),
                  label: state.state_name,
                }))}
                placeholder="All States"
                disabled={loadingStates}
              />
            </div>

            {/* District Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <SearchableSelect
                value={selectedDistrict || ''}
                onChange={handleDistrictChange}
                options={districts.map((district) => ({
                  value: String(district.district_id),
                  label: district.district_name,
                }))}
                placeholder="All Districts"
                disabled={!selectedState || loadingDistricts}
              />
            </div>

            {/* Block Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <SearchableSelect
                value={selectedBlock || ''}
                onChange={handleBlockChange}
                options={blocks.map((block) => ({
                  value: String(block.block_id),
                  label: block.block_name,
                }))}
                placeholder="All Blocks"
                disabled={!selectedDistrict || loadingBlock}
              />
            </div>

            {/* Vendor Filter */}
            {activeTab === 'UG' && !IEUser && (
              <div className="relative flex-1 min-w-0 sm:flex-none sm:w-40">
                <SearchableSelect
                  value={selectedVendor || ''}
                  onChange={handleVendorChange}
                  options={vendors.map((vendor) => ({
                    value: vendor.firm_id.toString(),
                    label: vendor.firm_name,
                  }))}
                  placeholder="All Vendors"
                  disabled={!selectedBlock || loadingVendors}
                />
              </div>
            )}
            {/* T&D and OFC Status Filters */}
            {activeTab === 'AcceptedLinks' && (
              <>
                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-40">
                  <SearchableSelect
                    value={tdStatus}
                    onChange={handleTdStatusChange}
                    options={statusOptions
                      .filter((val) => val.value != 2)
                      .map((option) => ({
                        value: String(option.value),
                        label: option.label == "Accepted" ? 'Completed' : option.label,
                      }))}
                    placeholder="All T&D Status"
                  />
                </div>

                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-40">
                  <SearchableSelect
                    value={ofcStatus}
                    onChange={handleOfcStatusChange}
                    options={statusOptions
                      .filter((val) => val.value != 2)
                      .map((option) => ({
                        value: String(option.value),
                        label: option.label == "Accepted" ? 'Completed' : option.label,
                      }))}
                    placeholder="All OFC Status"
                  />
                </div>

                <button
                  onClick={() => setExcel(true)}
                  disabled={acceptedExcelLoading}
                  className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                >
                  {acceptedExcelLoading ? (
                    <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                  ) : (
                    <SheetIcon className="h-4 w-4 text-green-600" />
                  )}
                  {acceptedExcelLoading ? 'Exporting...' : 'Excel'}
                </button>

                <button
                  onClick={() => setPdf(true)}
                  disabled={acceptedPdfLoading}
                  className="flex-none h-10 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-blue-400 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                >
                  {acceptedPdfLoading ? (
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 text-blue-600" />
                  )}
                  {acceptedPdfLoading ? 'Generating...' : 'PDF'}
                </button>
              </>
            )}
            {/* Links Filter */}
            {activeTab === 'UG' && (
            <>
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-56">
              <SearchableSelect
                value={selectedConnection || ''}
                onChange={handleLinkChange}
                options={connections.map((conn) => ({
                  value: conn.route_name,
                  label: conn.route_name,
                }))}
                placeholder="Select Links"
                disabled={!selectedBlock || loadingConnections}
              />
            </div>

            {/* Status Filter */}
            {!IEUser && (
            <>
            <div
              className="relative flex-1 min-w-0 sm:flex-none sm:w-44"
              ref={statusDropdownRef}
            >
              <button
                type="button"
                onClick={() => setStatusDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <span className="truncate text-left">
                  {selectedStatus.length === 0
                    ? 'All Status'
                    : selectedStatus.map((s) => statusMap[s]).join(', ')}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {statusDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600">
                  {statusOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatus.includes(option.value)}
                        onChange={() => handleStatusToggle(option.value)}
                        className="rounded border-gray-300"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
             </>
           
             )}

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
           
            </>
            )}
          {/* </div> */}

          {/* Second Row - Search and Excel Export */}
          {/* <div className="flex flex-wrap items-center gap-3"> */}
            {activeTab === 'UG' && !IEUser && (
              <>
                <div
                  className="relative flex-1 min-w-0 sm:flex-none sm:w-44"
                  ref={workTypeDropdownRef}
                >
                  <button
                    type="button"
                    onClick={() => setWorkTypeDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <span className="truncate text-left">
                      {worktype.length === 0
                        ? 'All Work Type'
                        : worktype
                            .map(
                              (value) =>
                                workTypeOptions.find(
                                  (option) => option.value === value,
                                )?.label ?? value,
                            )
                            .join(', ')}
                    </span>
                    <svg
                      className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {workTypeDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600">
                      {workTypeOptions.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={worktype.includes(option.value)}
                            onChange={() => handleWorkTypeToggle(option.value)}
                            className="rounded border-gray-300"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                  <SearchableSelect
                    value={constType !== '' ? constType : ''}
                    onChange={handleConstTypeChange}
                    options={[
                      { value: 'Hdd', label: 'HDD' },
                      { value: 'OpenTrench', label: 'OpenTrench' },
                      { value: 'Protection', label: 'Protection' },
                    ]}
                    placeholder="All Construction Type"
                  />
                </div>
                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                  <SearchableSelect
                    value={cords !== '' ? cords : ''}
                    onChange={handleCordsChange}
                    options={[
                      { value: 'true', label: 'True' },
                      { value: 'false', label: 'False' },
                    ]}
                    placeholder="ALL CORS"
                  />
                </div>
              </>
            )}

            {/* Search Bar */}
           
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={globalsearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            

            {activeTab === 'UG' && (
              <>
                {/* Excel Export Button */}
                <button
                  onClick={() => setExcel(true)}
                  className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
                >
                  <SheetIcon className="h-4 w-4 text-green-600" />
                  Excel
                </button>
                {!IEUser && (
                <>
                <button
                  onClick={() => setkml(true)}
                  className="flex items-center gap-2 flex-none h-10 px-4 py-2 text-sm font-medium text-yellow-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap"
                >
                  <Globe2Icon className="h-4 w-4" />
                  KML
                </button>
                <button
                  onClick={() => setPreview(!preview)}
                  className="flex-none h-10 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4 text-blue-600" />
                  Preview
                </button>
                <button
                  onClick={() => setProgressmap(!progressmap)}
                  className="flex-none h-10 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4 text-blue-600" />
                  Progress Map
                </button>
                </>
                )}
              </>
            )}
            {activeTab === 'UG' && AdminAcess && (
              <>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-none h-10 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-blue-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
              >
                <PlusCircleIcon className="h-4 w-4 text-blue-600" />
                Add New Event
              </button>
              <button
                onClick={() => setMergeSurveys(true)}
                disabled={mergeLoading}
                className="flex-none h-10 px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-indigo-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
              >
                {mergeLoading ? (
                  <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <GitMerge className="h-4 w-4 text-indigo-600" />
                )}
                {mergeLoading ? 'Merging...' : 'Merge Surveys'}
              </button>
              <button
                onClick={() => setEditLink(true)}
                className="flex-none h-10 px-4 py-2 text-sm font-medium text-orange-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-orange-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
              >
                <PenSquare className="h-4 w-4 text-orange-600" />
                Edit Link
              </button>
              </>
            )}

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
            >
              <span className="text-red-500 dark:text-red-400 font-medium text-sm">
                ✕
              </span>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'UG' && (
          <Report
            Data={{
              selectedState,
              selectedDistrict,
              selectedBlock,
              selectedStatus,
              worktype,
              constType,
              cords,
              fromdate,
              todate,
              globalsearch,
              excel,
              kml,
              filtersReady,
              preview,
              progressmap,
              isAddModalOpen,
              selectedConnection,
              connectionStart: getSelectedConnectionDetails()?.startLocation,
              connectionEnd: getSelectedConnectionDetails()?.endLocation,
              page,
              mergeSurveys,
              editLink,
              selectedVendor,
            }}
            Onexcel={() => setExcel(false)}
            OnPreview={() => setPreview(false)}
            OnProgressMap={() => setProgressmap(false)}
            OnKml={() => setkml(false)}
            OnModal={() => setIsAddModalOpen(false)}
            OnData={(data: any) => setSurveyData(data)}
            OnPageChange={handlePageChange}
            OnMergeSurveys={() => setMergeSurveys(false)}
            OnMergeLoadingChange={setMergeLoading}
            OnEditLink={() => setEditLink(false)}
          />
        )}
        {activeTab === 'AcceptedLinks' && (
          <>
           
            <AcceptedLinks
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              selectedBlock={selectedBlock}
              globalsearch={globalsearch}
              filtersReady={filtersReady}
              tdStatus={tdStatus}
              ofcStatus={ofcStatus}
              onSummaryChange={setAcceptedLinksSummary}
              excel={excel}
              onExcel={() => setExcel(false)}
              onExcelLoadingChange={setAcceptedExcelLoading}
              pdf={pdf}
              onPdf={() => setPdf(false)}
              onPdfLoadingChange={setAcceptedPdfLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ConstructionPage;
