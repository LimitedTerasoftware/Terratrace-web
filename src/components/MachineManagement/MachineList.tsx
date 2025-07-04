import React, { useEffect, useState } from 'react';
import { Machine } from '../../types/machine';
import { Edit, Trash2, Search, Filter, Eye } from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';

interface MachineListProps {
  machines: Machine[];
  onEdit: (machine: Machine) => void;
  onDelete: (id: string) => void;
}

const MachineList: React.FC<MachineListProps> = ({ machines, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Machine['status'] | 'all'>('all');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = 
      (machine.digitrack_make || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (machine.firm_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (machine.machine_make || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (machine.authorised_person || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (machine.registration_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (machine.digitrack_model || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (machine.digitrack_make || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (machine.truck_make || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (machine.truck_model || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || machine.status === statusFilter;

    return matchesSearch && matchesStatus;
  });


  const getStatusBadge = (status: Machine['status']) => {
    const statusConfig = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      retired: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleDelete = (machine: Machine) => {
    if (window.confirm(`Are you sure you want to delete machine ${machine.serial_number}?`)) {
      onDelete(machine.id);
    }
  };


const columns: TableColumn<Machine>[] = [
  
  { name: "Firm Name", selector: row => row.firm_name, sortable: true },
  { name: "Authorised Person", selector: row => row.authorised_person, sortable: true },
  { name: "Machine Make", selector: row => row.machine_make, sortable: true },
  { name: "Digitrack Make", selector: row => row.digitrack_make, sortable: true },
  { name: "Digitrack Model", selector: row => row.digitrack_model, sortable: true },
  { name: "Truck Make", selector: row => row.truck_make, sortable: true },
  { name: "Truck Model", selector: row => row.truck_model, sortable: true },
  { name: "Registration Number", selector: row => row.registration_number, sortable: true },
  {
    name: 'Status',
    selector: (row) => row.status,
    sortable: true,
    cell: (row) => getStatusBadge(row.status),
  },
  {
    name: 'Actions',
    cell: (row) => (
      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedMachine(row)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(row)}
          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          title="Edit Machine"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete(row)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Machine"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
    ignoreRowClick: true,
    allowOverflow: true,
    button: true,
  },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900">Machine Inventory</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search machines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Machine['status'] | 'all')}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>
        </div>
        </div>

      {filteredMachines.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No machines found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'Add your first machine to get started.'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
        
          <DataTable
          columns={columns}
          data={filteredMachines}
          pagination
          highlightOnHover
          pointerOnHover
          striped
          dense
          responsive
        />

          </div>
      )}

      {/* Machine Details Modal */}
      {selectedMachine && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Machine Details</h3>
                <button
                  onClick={() => setSelectedMachine(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Serial Number
                  </label>
                  <p className="text-gray-900 font-medium">{selectedMachine.serial_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Status
                  </label>
                  {getStatusBadge(selectedMachine.status)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                      Firm Name
                  </label>
                  <p className="text-gray-900">{selectedMachine.firm_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Registration Number
                  </label>
                  <p className="text-gray-900">{selectedMachine.registration_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                     Authorised Person
                  </label>
                  <p className="text-gray-900">{selectedMachine.authorised_person}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                     Registration Valid Upto
                  </label>
                  <p className="text-gray-900">{selectedMachine.registration_valid_upto ? new Date(selectedMachine.registration_valid_upto).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Year of Manufacture
                  </label>
                  <p className="text-gray-900">{selectedMachine.year_of_manufacture}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Machine Make
                  </label>
                  <p className="text-gray-900">{selectedMachine.machine_make}</p>
                </div>
                 <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                 Capacity
                </label>
                <p className="text-gray-900">{selectedMachine.capacity}</p>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                 No Of Rods
                </label>
                <p className="text-gray-900">{selectedMachine.no_of_rods}</p>
              </div>
              </div>
             
             
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Created At
                  </label>
                  <p className="text-gray-900 text-sm">
                    {new Date(selectedMachine.created_at).toLocaleDateString()} at {new Date(selectedMachine.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Last Updated
                  </label>
                  <p className="text-gray-900 text-sm">
                    {new Date(selectedMachine.updated_at).toLocaleDateString()} at {new Date(selectedMachine.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedMachine(null);
                  onEdit(selectedMachine);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Edit Machine
              </button>
              <button
                onClick={() => setSelectedMachine(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineList;