import { useState, useEffect } from 'react';
import Filters from '../Checkboxes/Filters';
import ProgressTrendChart from '../Charts/ProgressTrendChart';
import MachineStatusTrendChart, {
  MachineStatusTrendData,
} from '../Charts/MachineStatusTrendChart';
import KPICards from '../Chat/KPICards';
import StateProgress from '../Chat/StateProgress';
import MapView from '../Chat/MapView';
import SurveyInventory from '../Chat/SurveyInventory';
import VendorPerformance from '../Chat/VendorPerformance';
import RecentIssues from '../Chat/RecentIssues';
import { MachineDetailsResponse } from '../../types/machine';
import { machineApi } from '../Services/api';
import axios from 'axios';
import { UGConstructionSurveyData } from '../../types/survey';
import { Wrapper } from '@googlemaps/react-wrapper';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface KmTrendData {
  date: string;
  daily_km: string;
  cumulative_km: string;
}
interface KMresponse{
  status: boolean;
  summary: {
        total_km: string;
        total_days: string;
        average_km_per_day: string
    },
  data: KmTrendData[];
}

interface IssuesSummary {
  total: number;
  critical: number;
  warning: number;
  missing: number;
  depth_compliance: string;
}

interface IssueData {
  issue_type: string;
  category: string;
  severity: string;
  survey_id: number;
  point_id: number;
  depth: string;
  location: string;
  vendor: string;
  machine: string;
  timestamp: string;
  status: string;
}

export default function NewConstructionDashboard() {
  const [dashboardData, setDashboardData] =
    useState<MachineDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedworkType, setSelectedWorkType] = useState<string>('');
  const [kmTrendData, setKmTrendData] = useState<KmTrendData[]>([]);
  const[kmTotalData, setKmTotalData] = useState<KMresponse>({ status: false, summary: { total_km: '0', total_days: '0', average_km_per_day: '0' }, data: [] });
  const [kmTrendLoading, setKmTrendLoading] = useState(true);
  const [issuesData, setIssuesData] = useState<IssueData[]>([]);
  const [issuesSummary, setIssuesSummary] = useState<IssuesSummary | null>(
    null,
  );
  const[selectIssueType, setSelectedIssueType] = useState<string>('');
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [todaySurveyCount, setTodaySurveyCount] = useState<number>(0);
  const [todayKm, setTodayKm] = useState<number>(0);
  const [yesterdayKm, setYesterdayKm] = useState<number>(0);
  const [constructionPathData, setConstructionPathData] =
    useState<unknown>(null);
  // TODO: replace sample data with a real API call once the backend trend endpoint is available.
  const [machineStatusTrendData] = useState<MachineStatusTrendData[]>(
    Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString(),
        active_machines: 18 + i,
        inactive_machines: 6 - Math.min(i, 4),
      };
    }),
  );
  const [machineStatusTrendLoading] = useState(false);

  const getDateRange = (period: string) => {
    if (period === 'all') {
      return { fromDate: undefined, toDate: undefined };
    }
    if (period === 'today') {
      const today = new Date();
      return {
        fromDate: today.toISOString().split('T')[0],
        toDate: today.toISOString().split('T')[0],
      };
    }
    if (period === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        fromDate: yesterday.toISOString().split('T')[0],
        toDate: yesterday.toISOString().split('T')[0],
      };
    }
    const days = parseInt(period) || 30;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    return {
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
    };
  };

  useEffect(() => {
    const { fromDate, toDate } = getDateRange(selectedPeriod);
    fetchKmTrend(
      selectedState,
      selectedDistrict,
      selectedBlock,
      fromDate,
      toDate,
      selectedVendor,
    );
    fetchIssues(
      selectedState,
      selectedDistrict,
      selectedBlock,
      fromDate,
      toDate,
      selectedVendor,
      selectIssueType,
    );
    fetchMachineDetails(
      selectedState,
      selectedDistrict,
      selectedBlock,
      fromDate,
      toDate,
      searchQuery,
      selectedVendor,
      selectedworkType,
    );
  }, [
    selectedState,
    selectedDistrict,
    selectedBlock,
    selectedPeriod,
    searchQuery,
    selectedVendor,
    selectedworkType,
    selectIssueType,
  ]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const getDateOnly = (dateStr: string) => dateStr.split('T')[0];

    const todayData = kmTrendData.find((d) => getDateOnly(d.date) === today);
    const yesterdayData = kmTrendData.find(
      (d) => getDateOnly(d.date) === yesterdayStr,
    );

    setTodayKm(todayData ? parseFloat(todayData.daily_km) || 0 : 0);
    setYesterdayKm(yesterdayData ? parseFloat(yesterdayData.daily_km) || 0 : 0);
  }, [kmTrendData]);

  useEffect(() => {
    const fetchTodaySurveyCount = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const params: Record<string, string> = {
          from_date: today,
          to_date: today,
          status:'1',
        };

        if (selectedState) params.state_id = selectedState;
        if (selectedDistrict) params.district_id = selectedDistrict;
        if (selectedBlock) params.block_id = selectedBlock;
        if (selectedVendor) params.firm_id = selectedVendor;
        if (searchQuery) params.search = searchQuery;

        const response = await axios.get<{
          status: boolean;
          data: UGConstructionSurveyData[];
        }>(`${TraceBASEURL}/get-survey-data`, { params });
        if (response.data.status) {
          setTodaySurveyCount(response.data.data.length);

          const pathResponse = await machineApi.getConstructionPath(
          selectedBlock || undefined,
          '',
          selectedState || undefined,
          selectedDistrict || undefined,
          );

          setConstructionPathData(pathResponse);
        }
      } catch (error) {
        console.error('Error fetching today survey count', error);
      }
    };
    fetchTodaySurveyCount();
  }, [selectedState, selectedDistrict, selectedBlock, selectedVendor, searchQuery]);

  const fetchKmTrend = async (
    stateId?: string,
    districtId?: string,
    blockId?: string,
    fromDate?: string,
    toDate?: string,
    firmId?: string,
  ) => {
    try {
      setKmTrendLoading(true);
      const response = await machineApi.getKmTrend(
        stateId,
        districtId,
        blockId,
        fromDate,
        toDate,
        firmId,
      );
      if (response.status && response.data) {
        setKmTotalData({
          status: response.status,
          summary: response.summary,
          data: response.data,
        });
        setKmTrendData(response.data);
      } else {
        setKmTrendData([]);
      }
    } catch (err) {
      console.error('Error fetching km trend:', err);
      setKmTrendData([]);
    } finally {
      setKmTrendLoading(false);
    }
  };

  const fetchIssues = async (
    stateId?: string,
    districtId?: string,
    blockId?: string,
    fromDate?: string,
    toDate?: string,
    firmId?: string,
    issueType?: string,
  ) => {
    try {
      setIssuesLoading(true);
      const response = await machineApi.getIssues(
        stateId,
        districtId,
        blockId,
        fromDate,
        toDate,
        firmId,
        issueType
      );
      if (response.status) {
        setIssuesSummary(response.summary);
        setIssuesData(response.data);
      } else {
        setIssuesSummary(null);
        setIssuesData([]);
      }
    } catch (err) {
      console.error('Error fetching issues:', err);
      setIssuesSummary(null);
      setIssuesData([]);
    } finally {
      setIssuesLoading(false);
    }
  };

  const fetchMachineDetails = async (
    stateId?: string,
    districtId?: string,
    blockId?: string,
    fromDate?: string,
    toDate?: string,
    search?: string,
    firmId?: string,
    workType?: string,
  ) => {
    try {
      setLoading(true);
      const response = await machineApi.getFirmDistanceStats(
        stateId,
        districtId,
        blockId,
        fromDate,
        toDate,
        search,
        firmId,
        workType,
      );
      setDashboardData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedVendor('');
    setSelectedBlock('');
    setSelectedPeriod('30');
    setSearchQuery('');
    setSelectedWorkType('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Filters
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        selectedBlock={selectedBlock}
        selectedVendor={selectedVendor}
        selectedPeriod={selectedPeriod}
        searchQuery={searchQuery}
        selectedWorkType={selectedworkType}
        selectedIssueType={selectIssueType}
        onStateChange={setSelectedState}
        onDistrictChange={setSelectedDistrict}
        onBlockChange={setSelectedBlock}
        onVendorChange={setSelectedVendor}
        onPeriodChange={setSelectedPeriod}
        onSearchChange={setSearchQuery}
        onReset={handleReset}
        onWorkTypeChange={setSelectedWorkType}
        onIssueTypeChange={setSelectedIssueType}
      />
      <KPICards
        Data={dashboardData}
        issuesSummary={issuesSummary}
        todaySurveyCount={todaySurveyCount}
        todayKm={todayKm}
        yesterdayKm={yesterdayKm}
        selectIssueType={selectIssueType}
      />

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProgressTrendChart data={kmTotalData} isLoading={kmTrendLoading} />
            <VendorPerformance data={dashboardData} />
          </div>

          <div className="lg:col-span-2 space-y-6">
             <MachineStatusTrendChart
              data={machineStatusTrendData}
              isLoading={machineStatusTrendLoading}
            />
            <div className="h-[500px]">
              <Wrapper
                apiKey={GOOGLE_MAPS_API_KEY}
                render={(status) => {
                  if (status) {
                    return (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <p className="text-gray-500">Failed to load map</p>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                      <p className="text-gray-500">Loading map...</p>
                    </div>
                  );
                }}
              >
                <MapView constructionPathData={constructionPathData} />
              </Wrapper>
            </div>
           
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SurveyInventory
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            selectedBlock={selectedBlock}
            selectedVendor={selectedVendor}
            searchQuery={searchQuery}
            selectedPeriod={selectedPeriod}
          />
          <RecentIssues data={issuesData} isLoading={issuesLoading} IssueType={selectIssueType} />
        </div>
      </div>
    </div>
  );
}
