import React, { useState, useEffect } from 'react';
import { Machine, MachineFormData } from '../../types/machine';
import MachineForm from './MachineForm';
import MachineList from './MachineList';
import { Settings, BarChart3, Truck, Plus, Cog } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import Modal from '../hooks/ModalPopup';
import { getMachineOptions } from '../Services/api';
import { useLocation, Link } from 'react-router-dom';

interface ModalData {
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

function MachineManagement() {
  const location = useLocation();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [editingMachine, setEditingMachine] = useState<Machine | undefined>(undefined);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    getMachineOptions().then(data => {
      setMachines(data);
    });
  }, []);

  const handleAddMachine = async (formData: MachineFormData) => {
    try {
      const resp = await axios.post(`${TraceBASEURL}/create-machine`, formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (resp.status === 200 || resp.status === 201) {
        setModalData({
          title: "Success!",
          message: "Machine added successfully.",
          type: "success",
        });
        setModalOpen(true);
        setIsFormModalOpen(false);
        getMachineOptions().then(data => {
          setMachines(data);
        });
      } else {
        setModalData({
          title: "Error!",
          message: resp.data || "Unexpected response",
          type: "error",
        });
        setModalOpen(true);
      }
    } catch (error) {
      const err = error as AxiosError;
      console.error("Error creating machine:", err.response?.data || err.message);
      setModalData({
        title: "Error!",
        message: err.message || "Unexpected response",
        type: "error",
      });
      setModalOpen(true);
    }
  };

  const handleEditMachine = async (formData: MachineFormData) => {
    if (editingMachine) {
      try {
        const response = await axios.put(`${TraceBASEURL}/update-machine/${editingMachine.machine_id}`, formData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.status === 200 || response.status === 201) {
          setMachines(prev => prev.map(machine =>
            machine.machine_id === editingMachine.machine_id
              ? { ...machine, ...formData, updated_at: new Date() }
              : machine
          ));
          setModalData({
            title: "Success!",
            message: "Machine updated successfully.",
            type: "success",
          });
          setModalOpen(true);
          setIsFormModalOpen(false); // Close form after success
        } else {
          console.error("Unexpected response:", response.status, response.data);
          setModalData({
            title: "Error!",
            message: response.data || "Unexpected response",
            type: "error",
          });
          setModalOpen(true);
        }
      } catch (error) {
        const err = error as AxiosError;
        console.error("Error updating machine:", err.response?.data || err.message);
      }
      setEditingMachine(undefined);
    }
  };

  const handleDeleteMachine = async (id: string) => {
    try {
      const resp = await axios.post(`${TraceBASEURL}/delete-machine/${id}`);
      if (resp.status === 200 || resp.status === 201) {
        setModalData({
          title: "Success!",
          message: "Machine Deleted successfully.",
          type: "success",
        });
        setModalOpen(true);
        setMachines(prev => prev.filter(machine => machine.machine_id !== id));
      }
    } catch (error) {
      const err = error as AxiosError;
      console.error("Error deleting machine:", err.response?.data || err.message);
    }
  };

  const handleAddNewMachine = () => {
    setEditingMachine(undefined);
    setIsFormModalOpen(true);
  };

  const handleStartEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setIsFormModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingMachine(undefined);
    setIsFormModalOpen(false);
  };

  const getStatusCounts = () => {
    return machines.reduce((acc, machine) => {
      acc[machine.status] = (acc[machine.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  const MachineHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <Cog className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Machine Management</h1>
              <p className="text-sm text-gray-600">Monitor and manage equipment inventory</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Add New Machine Button */}
            <button
              onClick={handleAddNewMachine}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add New Machine
            </button>
            
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
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MachineHeader />

      {/* Status Cards */}
      <div className="px-1 py-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{machines.length}</div>
                <div className="text-sm text-gray-600">Total Machines</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{statusCounts.active || 0}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-600">{statusCounts.inactive || 0}</div>
                <div className="text-sm text-gray-600">Inactive</div>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.maintenance || 0}</div>
                <div className="text-sm text-gray-600">Under Maintenance</div>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Settings className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">12</div>
                <div className="text-sm text-gray-600">Due for Service</div>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                  <Settings className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">8</div>
                <div className="text-sm text-gray-600">GPS Offline</div>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-1">
        <div className="space-y-8">
          {/* Machine List */}
          <MachineList
            machines={machines}
            onEdit={handleStartEdit}
            onDelete={handleDeleteMachine}
            Id={location.state?.Id}
            regids={location.state?.regids}
          />
        </div>
        
        {/* Success/Error Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
        />

        {/* Machine Form Modal */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <MachineForm
                machine={editingMachine}
                onSubmit={editingMachine ? handleEditMachine : handleAddMachine}
                onCancel={handleCancelEdit}
                isEditing={!!editingMachine}
                isExpanded={true}
                onExpandChange={setIsFormExpanded}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MachineManagement;