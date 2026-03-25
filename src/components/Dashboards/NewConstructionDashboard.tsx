import { useState, useEffect } from 'react';
import Filters from '../Checkboxes/Filters';
import ProgressTrendChart from '../Charts/ProgressTrendChart';
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

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

interface KmTrendData {
  date: string;
  daily_km: string;
  cumulative_km: string;
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
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [kmTrendData, setKmTrendData] = useState<KmTrendData[]>([]);
  const [kmTrendLoading, setKmTrendLoading] = useState(true);
  const [issuesData, setIssuesData] = useState<IssueData[]>([]);
  const [issuesSummary, setIssuesSummary] = useState<IssuesSummary | null>(
    null,
  );
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [todaySurveyCount, setTodaySurveyCount] = useState<number>(0);
  const [todayKm, setTodayKm] = useState<number>(0);
  const [yesterdayKm, setYesterdayKm] = useState<number>(0);

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
      fromDate,
      toDate,
      selectedVendor,
    );
    fetchIssues(
      selectedState,
      selectedDistrict,
      fromDate,
      toDate,
      selectedVendor,
    );
    fetchMachineDetails(
      selectedState,
      selectedDistrict,
      fromDate,
      toDate,
      searchQuery,
      selectedVendor,
    );
  }, [
    selectedState,
    selectedDistrict,
    selectedPeriod,
    searchQuery,
    selectedVendor,
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
        };

        if (selectedState) params.state_id = selectedState;
        if (selectedDistrict) params.district_id = selectedDistrict;
        if (selectedVendor) params.firm_id = selectedVendor;
        if (searchQuery) params.search = searchQuery;

        const response = await axios.get<{
          status: boolean;
          data: UGConstructionSurveyData[];
        }>(`${TraceBASEURL}/get-survey-data`, { params });
        if (response.data.status) {
          setTodaySurveyCount(response.data.data.length);
        }
      } catch (error) {
        console.error('Error fetching today survey count', error);
      }
    };
    fetchTodaySurveyCount();
  }, [selectedState, selectedDistrict, selectedVendor, searchQuery]);

  const fetchKmTrend = async (
    stateId?: string,
    districtId?: string,
    fromDate?: string,
    toDate?: string,
    firmId?: string,
  ) => {
    try {
      setKmTrendLoading(true);
      const response = await machineApi.getKmTrend(
        stateId,
        districtId,
        undefined,
        fromDate,
        toDate,
        firmId,
      );
      if (response.status && response.data) {
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
    fromDate?: string,
    toDate?: string,
    firmId?: string,
  ) => {
    try {
      setIssuesLoading(true);
      const response = await machineApi.getIssues(
        stateId,
        districtId,
        undefined,
        fromDate,
        toDate,
        firmId,
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
    fromDate?: string,
    toDate?: string,
    search?: string,
    firmId?: string,
  ) => {
    try {
      setLoading(true);
      const response = await machineApi.getFirmDistanceStats(
        stateId,
        districtId,
        undefined,
        fromDate,
        toDate,
        search,
        firmId,
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
    setSelectedPeriod('30');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Filters
        selectedState={selectedState}
        selectedDistrict={selectedDistrict}
        selectedVendor={selectedVendor}
        selectedPeriod={selectedPeriod}
        searchQuery={searchQuery}
        onStateChange={setSelectedState}
        onDistrictChange={setSelectedDistrict}
        onVendorChange={setSelectedVendor}
        onPeriodChange={setSelectedPeriod}
        onSearchChange={setSearchQuery}
        onReset={handleReset}
      />
      <KPICards
        Data={dashboardData}
        issuesSummary={issuesSummary}
        todaySurveyCount={todaySurveyCount}
        todayKm={todayKm}
        yesterdayKm={yesterdayKm}
      />

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProgressTrendChart data={kmTrendData} isLoading={kmTrendLoading} />
            <VendorPerformance data={dashboardData} />
          </div>

          <div className="lg:col-span-2 h-full">
            <div className="h-full min-h-[500px]">
              <MapView />
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SurveyInventory
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            selectedVendor={selectedVendor}
            searchQuery={searchQuery}
            selectedPeriod={selectedPeriod}
          />
          <RecentIssues data={issuesData} isLoading={issuesLoading} />
        </div>
      </div>
    </div>
  );
}
