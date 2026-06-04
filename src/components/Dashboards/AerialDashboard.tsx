import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  getStateData,
  getDistrictData,
  getBlockData,
  getPoleDashboard,
  getAcceptedPoles,
} from '../Services/api';
import type { AcceptedPolesResponse } from '../Services/api';
import { Block, District, StateData } from '../../types/survey';
import GISMap from '../Chat/GISMap';
import ConstructionHealth from '../Charts/ConstructionHealth';
import InstallationProgress from '../Charts/InstallationProgress';
import PoleTrackingTable from '../Chat/PoleTrackingTable';
import SurveyorPerformance from '../Chat/SurveyorPerformance';
import BottleneckAnalysis from '../Charts/BottleneckAnalysis';
import StatsCard from '../Chat/StatsCard';

type PoleDashboardData =
  import('../Services/api').PoleDashboardResponse['data'];

const formatNumber = (num: number) => {
  return num.toLocaleString('en-IN');
};

export default function AerialDashboard() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedStateCode, setSelectedStateCode] = useState<string | ''>('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string | ''>(
    '',
  );
  const [selectedBlockCode, setSelectedBlockCode] = useState<string | ''>('');
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [poleData, setPoleData] = useState<PoleDashboardData | null>(null);
  const [loadingPoleData, setLoadingPoleData] = useState(false);
  const [acceptedPoles, setAcceptedPoles] = useState<
    AcceptedPolesResponse['data']
  >([]);
  const [loadingAcceptedPoles, setLoadingAcceptedPoles] = useState(false);

  const stats = poleData
    ? [
        {
          label: 'Total Poles',
          value: formatNumber(poleData.total_poles),
          accentColor: 'default' as const,
        },
        {
          label: 'New Poles',
          value: formatNumber(poleData.new_poles),
          accentColor: 'green' as const,
        },
        {
          label: 'Existing Poles',
          value: formatNumber(poleData.existing_poles),
          accentColor: 'default' as const,
        },
        {
          label: 'Pending Poles',
          value: formatNumber(poleData.pending_poles),
          accentColor: 'yellow' as const,
        },
        {
          label: 'Rejected Poles',
          value: formatNumber(poleData.rejected_poles),
          accentColor: 'red' as const,
        },
        {
          label: 'Accepted Poles',
          value: formatNumber(poleData.accepted_poles),
          accentColor: 'default' as const,
        },
        {
          label: 'Total Distance',
          value: formatNumber(poleData.total_distance_km),
          unit: 'KM',
          accentColor: 'default' as const,
        },
        {
          label: 'Completion Rate',
          value: `${poleData.completion_rate}%`,
          accentColor: 'blue' as const,
        },
      ]
    : [];

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
    } else {
      setDistricts([]);
      setSelectedDistrict('');
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchBlocks(selectedDistrict);
    } else {
      setBlocks([]);
      setSelectedBlock('');
    }
  }, [selectedDistrict]);

  const getDateRange = () => {
    const today = new Date();
    const toDate = today.toISOString().split('T')[0];
    let fromDate: string | null = null;

    switch (selectedPeriod) {
      case 'today':
        fromDate = toDate;
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        fromDate = yesterday.toISOString().split('T')[0];
        return { from_date: fromDate, to_date: fromDate };
      case '7':
      case '15':
      case '30':
        const daysAgo = new Date(today);
        daysAgo.setDate(daysAgo.getDate() - parseInt(selectedPeriod));
        fromDate = daysAgo.toISOString().split('T')[0];
        break;
      case 'all':
        return { from_date: null, to_date: null };
      default:
        fromDate = toDate;
    }
    return { from_date: fromDate, to_date: toDate };
  };

  useEffect(() => {
    fetchPoleDashboard();
  }, [selectedState, selectedDistrict, selectedBlock, selectedPeriod]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const data = await getStateData();
      setStates(data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchDistricts = async (stateCode: string) => {
    setLoadingDistricts(true);
    try {
      const data = await getDistrictData(stateCode);
      setDistricts(data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchBlocks = async (districtId: string) => {
    setLoadingBlocks(true);
    try {
      const data = await getBlockData(districtId);
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const fetchPoleDashboard = async () => {
    setLoadingPoleData(true);
    try {
      const { from_date, to_date } = getDateRange();
      const response = await getPoleDashboard({
        state_id: selectedState || undefined,
        district_id: selectedDistrict || undefined,
        block_id: selectedBlock || undefined,
        from_date: from_date,
        to_date: to_date,
      });
      if (response.status) {
        setPoleData(response.data);
      }
    } catch (error) {
      console.error('Error fetching pole dashboard:', error);
    } finally {
      setLoadingPoleData(false);
    }
  };

  useEffect(() => {
    fetchAcceptedPoles();
  }, [selectedState, selectedDistrict, selectedBlock, selectedPeriod]);

  const fetchAcceptedPoles = async () => {
    setLoadingAcceptedPoles(true);
    try {
      const params: Record<string, string | number> = {};
      if (selectedState) params.state_id = selectedState;
      if (selectedDistrict) params.district_id = selectedDistrict;
      if (selectedBlock) params.block_id = selectedBlock;
      const { from_date, to_date } = getDateRange();
      if (from_date) params.from_date = from_date;
      if (to_date) params.to_date = to_date;
      const response = await getAcceptedPoles(params);
      if (response.status) {
        setAcceptedPoles(response.data);
      }
    } catch (error) {
      console.error('Error fetching accepted poles:', error);
    } finally {
      setLoadingAcceptedPoles(false);
    }
  };

  const handleReset = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedBlock('');
    setSelectedPeriod('all');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200">
            <div className="px-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Aerial Command Center
                  </h1>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    POLE LIFECYCLE MANAGEMENT & AERIAL SURVEILLANCE
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Last Sync: Oct 24, 14:35</span>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <RefreshCw size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div className="flex items-center gap-4 flex-wrap px-3 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                FILTERS:
              </span>
              <select
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  const state = states.find(
                    (s) => s.state_id.toString() === e.target.value,
                  );
                  setSelectedStateCode(state ? state.state_code : '');
                }}
                disabled={loadingStates}
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state.state_id} value={state.state_id}>
                    {state.state_name}
                  </option>
                ))}
              </select>

              <select
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  const district = districts.find(
                    (d) => d.district_id.toString() === e.target.value,
                  );
                  setSelectedDistrictCode(
                    district ? district.district_code : '',
                  );
                }}
                disabled={loadingDistricts || !selectedState}
              >
                <option value="">All Districts</option>
                {districts.map((district) => (
                  <option
                    key={district.district_id}
                    value={district.district_id}
                  >
                    {district.district_name}
                  </option>
                ))}
              </select>

              <select
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={selectedBlock}
                onChange={(e) => {
                  setSelectedBlock(e.target.value);
                  const block = blocks.find(
                    (b) => b.block_id.toString() === e.target.value,
                  );
                  setSelectedBlockCode(block ? block.block_code : '');
                }}
                disabled={loadingBlocks || !selectedDistrict}
              >
                <option value="">All Blocks</option>
                {blocks.map((block) => (
                  <option key={block.block_id} value={block.block_id}>
                    {block.block_name}
                  </option>
                ))}
              </select>

              <select
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7">Last 7 Days</option>
                <option value="15">Last 15 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>

              <input
                type="text"
                placeholder="Search..."
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <main className="flex-1 min-w-0 overflow-y-auto">
              <div className="px-5 lg:px-8 py-6 max-w-screen-2xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
                  {stats.map((s) => (
                    <StatsCard
                      key={s.label}
                      label={s.label}
                      value={s.value}
                      unit={s.unit}
                      accentColor={s.accentColor}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
                  <div className="xl:col-span-2">
                    <GISMap acceptedPoles={acceptedPoles} />
                  </div>
                  <div className="flex flex-col gap-5">
                    <ConstructionHealth
                      percentage={poleData?.completion_rate ?? 0}
                      completed={
                        poleData
                          ? Math.round(
                              (poleData.total_poles *
                                poleData.completion_rate) /
                                100,
                            )
                          : 0
                      }
                      pending={poleData?.pending_poles ?? 0}
                    />
                    <InstallationProgress />
                  </div>
                </div>

                <div className="mb-5">
                  <PoleTrackingTable
                    data={acceptedPoles}
                    loading={loadingAcceptedPoles}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <SurveyorPerformance />
                  <BottleneckAnalysis />
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
