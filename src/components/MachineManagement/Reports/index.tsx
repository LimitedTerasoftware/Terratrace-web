import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Factory, Activity, TrendingUp, Eye, CogIcon, Search } from 'lucide-react';
import { MachineDataReport, MachineDetailsResponse } from '../../../types/machine';
import StatusCard from './SummaryCards';
import { machineApi } from '../../Services/api';
import DataTable, { TableColumn } from 'react-data-table-component';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<MachineDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMachineDetails();
  }, []);

  const fetchMachineDetails = async () => {
    try {
      setLoading(true);
      const response = await machineApi.getMachineDetails();
      setData(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<MachineDataReport>[] = [
    {
      name: "Machine ID",
      selector: row => row.machine_id,
      sortable: true,
      width: "120px"
    },
    {
      name: "Firm Name",
      selector: row => row.firm_name,
      sortable: true,
      wrap: true,
      grow: 2
    },
    {
      name: "Registration Number",
      selector: row => row.registration_number,
      sortable: true
    },
    {
      name: "Authorised Person",
      selector: row => row.authorised_person,
      sortable: true,
      wrap: true
    },
    {
      name: "Action",
      cell: row => (
        <button
          onClick={() =>
            navigate(`/machine-management/machine-details/${row.machine_id}`)
          }
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      ),
      center: true,
      width: "120px"
    }
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
              <h1 className="text-xl font-bold text-gray-900">Vendor MIS Monitoring System</h1>
              <p className="text-sm text-gray-600">Real-time monitoring and analytics dashboard</p>
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


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2 px-1 py-6">
        <StatusCard
          title="Total Machines"
          value={data?.summary.total_machines || 0}
          icon={Factory}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatusCard
          title="Active Machines"
          value={data?.summary.active_machines || 0}
          icon={Activity}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <StatusCard
          title="Inactive Machines"
          value={data?.summary.inactive_machines || 0}
          icon={TrendingUp}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Registered Firms
          </h2>
        </div>
        {data?.machines.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>

          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="p-4">
              <DataTable
                columns={columns}
                data={data?.machines || []}
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

      </div>
    </div>

  );
}
