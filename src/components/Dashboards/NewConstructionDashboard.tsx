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
import { District, StateData } from '../../types/survey';



export default function NewConstructionDashboard() {
  const [dashboardData, setDashboardData] = useState<MachineDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [loadingDistricts, setLoadingDistricts] = useState<boolean>(false);
  const [loadingBlock, setLoadingBlock] = useState<boolean>(false);

  useEffect(() => {
    fetchMachineDetails(
      selectedState,
      selectedDistrict,
      fromdate,
      todate,
    );
  }, [selectedState, selectedDistrict, fromdate, todate]);

const fetchMachineDetails = async (
      stateId?: string,
      districtId?: string,
      blockId?: string,
      fromDate?: string,
      toDate?: string,
    ) => {
      try {
        // setLoading(true);
        const response = await machineApi.getFirmDistanceStats(
          stateId,
          districtId,
          blockId,
          fromDate,
          toDate,
        );
        setDashboardData(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="min-h-screen bg-gray-50">
      <Filters />
      <KPICards Data={dashboardData} />

      <div className="px-6 pb-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProgressTrendChart />
          <MapView />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StateProgress />
          <VendorPerformance />
        </div>

        <SurveyInventory />
        <RecentIssues />
      </div>
    </div>
  );
}
