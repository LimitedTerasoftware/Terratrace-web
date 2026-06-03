import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { getStateData, getDistrictData, getBlockData } from '../Services/api';
import { Block, District, StateData } from '../../types/survey';
import GISMap from '../Chat/GISMap';
import ConstructionHealth from '../Charts/ConstructionHealth';
import InstallationProgress from '../Charts/InstallationProgress';
import PoleTrackingTable from '../Chat/PoleTrackingTable';
import SurveyorPerformance from '../Chat/SurveyorPerformance';
import BottleneckAnalysis from '../Charts/BottleneckAnalysis';
import StatsCard from '../Chat/StatsCard';

const stats = [
  { label: 'Total Poles', value: '12,450', accentColor: 'default' as const },
  { label: 'New Poles', value: '9,870', accentColor: 'green' as const },
  { label: 'Existing Poles', value: '450', accentColor: 'default' as const },

  { label: 'Pending Poles', value: '2,580', accentColor: 'yellow' as const },
  { label: 'Rejected Poles', value: '430', accentColor: 'red' as const },
  { label: 'Accepted Poles', value: '1,120', accentColor: 'default' as const },
  {
    label: 'Total Distance',
    value: '342',
    unit: 'KM',
    accentColor: 'default' as const,
  },
  { label: 'Completion Rate', value: '79.3%', accentColor: 'blue' as const },
];

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
                    <GISMap />
                  </div>
                  <div className="flex flex-col gap-5">
                    <ConstructionHealth
                      percentage={79}
                      completed={9870}
                      pending={2580}
                    />
                    <InstallationProgress />
                  </div>
                </div>

                <div className="mb-5">
                  <PoleTrackingTable />
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
