import { useState, useEffect } from 'react';
import SummaryCards from './SummaryCards';
import Filters from './Filters';
import MachineItem from './MachineItem';
import Pagination from './Pagination';
import { MachineDataReport } from '../../../types/machine';
import { getBlockData, getDistrictData, getStateData, machineApi } from '../../Services/api';
import { Block, District, StateData } from '../../../types/survey';

export default function MachineReports() {
  const [machines, setMachines] = useState<MachineDataReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMachines, setTotalMachines] = useState(0);
  const [activeMachines, setActiveMachines] = useState(0);
  const [inactiveMachines, setInactiveMachines] = useState(0);
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  useEffect(() => {
      getStateData().then(data => {
        setStates(data);
      })
    }, [])
  
    useEffect(() => {
      if (selectedState) {
        getDistrictData(selectedState).then(data => {
          setDistricts(data);
        })
      } else {
        setDistricts([])
      }
    }, [selectedState])
  
    useEffect(() => {
      if (selectedDistrict) {
        getBlockData(selectedDistrict).then(data => {
          setBlocks(data);
        })
      } else {
        setBlocks([])
      }
    }, [selectedDistrict])
  

  useEffect(() => {
    fetchMachineDetails();
  }, []);

  const fetchMachineDetails = async () => {
    setLoading(true);
    try {
      const response = await machineApi.getMachineDetails();
      setMachines(response.machines);
      setTotalMachines(response.summary.total_machines);
      setActiveMachines(parseInt(response.summary.active_machines));
      setInactiveMachines(parseInt(response.summary.inactive_machines));
    } catch (error) {
      console.error('Failed to fetch machine details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedBlock('');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(machines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMachines = machines.slice(startIndex, endIndex);

  const startEntry = machines.length > 0 ? startIndex + 1 : 0;
  const endEntry = Math.min(endIndex, machines.length);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <h1 className="text-2xl font-semibold text-gray-900">Vendor MIS Monitoring System</h1>
        <p className="text-sm text-gray-600 mt-1">Real-time monitoring and analytics dashboard</p>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <SummaryCards
          totalMachines={totalMachines}
          activeMachines={activeMachines}
          inactiveMachines={inactiveMachines}
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Registered Firms</h2>
              <p className="text-sm text-gray-600 mt-1">
                Click on any firm to view and filter detailed link information
              </p>
            </div>
            <span className="text-sm text-blue-600 font-medium">
              Total {machines.length} firms
            </span>
          </div>

          <Filters
            states={states}
            districts={districts}
            blocks={blocks}
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            selectedBlock={selectedBlock}
            fromDate={fromDate}
            toDate={toDate}
            searchQuery={searchQuery}
            onStateChange={setSelectedState}
            onDistrictChange={setSelectedDistrict}
            onBlockChange={setSelectedBlock}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onSearchChange={setSearchQuery}
            onReset={handleReset}
          />

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : currentMachines.length > 0 ? (
            <>
              {currentMachines.map((machine) => (
                <MachineItem
                  key={machine.machine_id}
                  machine={machine}
                  searchQuery={searchQuery}
                  selectedState={selectedState}
                  selectedDistrict={selectedDistrict}
                  selectedBlock={selectedBlock}
                  fromDate={fromDate}
                  toDate={toDate}
                />
              ))}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                startEntry={startEntry}
                endEntry={endEntry}
                totalEntries={machines.length}
              />
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">No machines found</div>
          )}
        </div>
      </div>
    </div>
  );
}
