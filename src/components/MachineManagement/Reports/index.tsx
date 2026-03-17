import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Factory,
  Activity,
  TrendingUp,
  Eye,
  CogIcon,
  Search,
  X,
} from 'lucide-react';
import {
  MachineDataReport,
  MachineDetailsResponse,
  MachineList,
} from '../../../types/machine';
import StatusCard from './SummaryCards';
import { getStateData, machineApi } from '../../Services/api';
import DataTable, { TableColumn } from 'react-data-table-component';

interface StateData {
  state_id: number;
  state_name: string;
}

interface FirmStats {
  firm_id: number;
  firm_name: string;
  total_machines: number;
  total_links: number;
  total_distance_meters: string;
  total_days: number;
  avg_distance_per_day: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<MachineDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState<boolean>(false);
  const [machineData, setMachineData] = useState<MachineList[] | []>([]);
  const [firmStats, setFirmStats] = useState<Record<number, FirmStats>>({});
  const [statsLoading, setStatsLoading] = useState<Record<number, boolean>>({});
  const [states, setStates] = useState<StateData[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    fetchMachineDetails(selectedState);
  }, [selectedState]);

  useEffect(() => {
    if (data?.firms) {
      data.firms.forEach((firm) => {
        fetchFirmStats(firm.firm_id);
      });
    }
  }, [data]);

  const fetchStates = async () => {
    try {
    getStateData().then(data => {
            setStates(data);
          })     
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchFirmStats = async (firmId: number) => {
    try {
      setStatsLoading((prev) => ({ ...prev, [firmId]: true }));
      const response = await machineApi.getFirmDistanceStats(firmId);
      if (response.status && response.data && response.data.length > 0) {
        setFirmStats((prev) => ({
          ...prev,
          [firmId]: response.data[0],
        }));
      }
    } catch (err) {
      console.error(`Error fetching stats for firm ${firmId}:`, err);
    } finally {
      setStatsLoading((prev) => ({ ...prev, [firmId]: false }));
    }
  };

  const fetchMachineDetails = async (stateId?: string) => {
    try {
      setLoading(true);
      const response = await machineApi.getMachineDetails(stateId);
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  const fetchMachineList = async (id: number) => {
    try {
      const resp = await machineApi.getMachineList(id);
      setMachineData(resp.machines);
      setShow(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const filteredFirms = useMemo(() => {
    if (!data?.firms) return [];
    if (!searchQuery) return data.firms;
    const query = searchQuery.toLowerCase();
    return data.firms.filter(
      (firm) =>
        firm.firm_name.toLowerCase().includes(query) ||
        firm.authorised_person.toLowerCase().includes(query) ||
        firm.authorised_mobile.toString().includes(query),
    );
  }, [data?.firms, searchQuery]);

  const totals = useMemo(() => {
    let totalDistance = 0;
    let totalDays = 0;
    let totalMachines = 0;
    let totalLinks = 0;

    filteredFirms.forEach((firm) => {
      const stats = firmStats[firm.firm_id];
      if (stats) {
        totalDistance += parseFloat(stats.total_distance_meters) || 0;
        totalDays += stats.total_days || 0;
        totalMachines += stats.total_machines || 0;
        totalLinks += stats.total_links || 0;
      }
    });

    const avgDistance = totalDays > 0 ? totalDistance / totalDays : 0;

    return {
      totalDistance: totalDistance.toFixed(2),
      totalDays,
      totalMachines,
      totalLinks,
      avgDistance: avgDistance.toFixed(2),
    };
  }, [filteredFirms, firmStats]);

  const columns: TableColumn<MachineDataReport>[] = [
    {
      name: 'Firm Name',
      selector: (row) => row.firm_name,
      sortable: true,
      wrap: true,
      grow: 2,
    },
    {
      name: 'Authorised Mobile Number',
      selector: (row) => row.authorised_mobile,
      sortable: true,
    },
    {
      name: 'Authorised Person',
      selector: (row) => row.authorised_person,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Total Machines',
      cell: (row) => {
        if (statsLoading[row.firm_id]) {
          return <span className="text-gray-400">Loading...</span>;
        }
        const stats = firmStats[row.firm_id];
        return stats ? stats.total_machines : '-';
      },
      sortable: true,
      width: '130px',
    },
    {
      name: 'Total Links',
      cell: (row) => {
        const stats = firmStats[row.firm_id];
        return stats ? stats.total_links : '-';
      },
      sortable: true,
      width: '110px',
    },
    {
      name: 'Total Distance (m)',
      cell: (row) => {
        const stats = firmStats[row.firm_id];
        return stats ? parseFloat(stats.total_distance_meters).toFixed(2) : '-';
      },
      sortable: true,
      width: '150px',
    },
    {
      name: 'Total Days',
      cell: (row) => {
        const stats = firmStats[row.firm_id];
        return stats ? stats.total_days : '-';
      },
      sortable: true,
      width: '100px',
    },
    {
      name: 'Avg Distance/Day (m)',
      cell: (row) => {
        const stats = firmStats[row.firm_id];
        return stats ? parseFloat(stats.avg_distance_per_day).toFixed(2) : '-';
      },
      sortable: true,
      width: '160px',
    },
    {
      name: 'Action',
      cell: (row) => (
        <button
          onClick={() => fetchMachineList(row.firm_id)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      ),
      center: true,
      width: '120px',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-medium">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <CogIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Vendor MIS Monitoring System
              </h1>
              <p className="text-sm text-gray-600">
                Real-time monitoring and analytics dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Breadcrumb Navigation */}
            <nav>
              <ol className="flex items-center gap-2">
                <li>
                  <Link className="font-medium" to="/dashboard">
                    Dashboard /
                  </Link>
                </li>
                <li className="font-medium text-primary">Machine Management</li>
              </ol>
            </nav>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-2 px-1 py-6">
        <StatusCard
          title="Total Machines"
          value={totals.totalMachines}
          icon={Factory}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatusCard
          title="Active Machines"
          value={parseInt(data?.summary.active_machines || '0')}
          icon={Activity}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatusCard
          title="Inactive Machines"
          value={parseInt(data?.summary.inactive_machines || '0')}
          icon={TrendingUp}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
        <StatusCard
          title="Total Distance"
          value={totals.totalDistance}
          icon={TrendingUp}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />
        <StatusCard
          title="Avg Distance"
          value={totals.avgDistance}
          icon={TrendingUp}
          iconColor="text-indigo-600"
          bgColor="bg-indigo-50"
        />
        <StatusCard
          title="Total Days"
          value={totals.totalDays}
          icon={TrendingUp}
          iconColor="text-teal-600"
          bgColor="bg-teal-50"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Registered Firms
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[180px]"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state.state_id} value={state.state_id}>
                    {state.state_name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search firms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-[250px]"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        {filteredFirms.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No data found
            </h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="p-4">
              <DataTable
                columns={columns}
                data={filteredFirms}
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50, 100]}
                highlightOnHover
                pointerOnHover
                responsive
                striped
                noHeader
                progressPending={loading}
                progressComponent={
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                }
              />
            </div>
          </div>
        )}

        {show && machineData.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Machine Details
                  </h3>
                  <button
                    onClick={() => setShow(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  {machineData.map((machine) => (
                    <div
                      key={machine.machine_id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Machine ID</p>
                          <p className="font-semibold">{machine.machine_id}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Registration</p>
                          <p className="font-semibold">
                            {machine.registration_number}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Machine Make</p>
                          <p className="font-semibold">
                            {machine.machine_make}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Serial Number</p>
                          <p className="font-semibold">
                            {machine.serial_number}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Firm</p>
                          <p className="font-semibold">{machine.firm_name}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Capacity</p>
                          <p className="font-semibold">{machine.capacity}</p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Supervisor</p>
                          <p className="font-semibold">
                            {machine.supervisor_name}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-semibold">
                            {machine.supervisor_phone}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            navigate(
                              `/machine-management/machine-details/${machine.machine_id}`,
                            )
                          }
                          className="mt-3 px-3 py-1 text-xs bg-green-600 text-white rounded"
                        >
                          Track Machine
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
