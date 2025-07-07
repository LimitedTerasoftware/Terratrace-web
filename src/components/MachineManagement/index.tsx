import React, { useState, useEffect } from 'react';
import { Machine, MachineFormData } from '../../types/machine';
import MachineForm from './MachineForm';
import MachineList from './MachineList';
import { Settings, BarChart3, Truck } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import Modal from '../hooks/ModalPopup';

interface ModalData {
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

function MachineManagement() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [editingMachine, setEditingMachine] = useState<Machine | undefined>(undefined);
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({
    title: "",
    message: "",
    type: "info",
  });

  

  useEffect(()=>{

    const GetData = async() =>{
      try {
        const resp = await axios.get(`${TraceBASEURL}/get-all-machines`);
        if(resp.status === 200 || resp.status === 201){
         setMachines(resp.data.machines);
        }
        
      } catch (error) {
         console.log(error)
      }

    }
    GetData();

  },[])
  const handleAddMachine = async(formData: MachineFormData) => {
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
    setModalOpen(true)

    } else {
      setModalData({
      title: "Error!",
      message: resp.data || "Unexpected response",
      type: "error",
    });
    setModalOpen(true)


    }
  } catch (error) {
    const err = error as AxiosError;
    console.error("Error creating machine:", err.response?.data || err.message); 
    setModalData({
      title: "Error!",
      message: err.message || "Unexpected response",
      type: "error",
    });
    setModalOpen(true)

   }
      
  };

  const handleEditMachine = async(formData: MachineFormData) => {
    if (editingMachine) {
      try {
        const response = await axios.put(`${TraceBASEURL}/update-machine/${editingMachine.machine_id}`,formData,{
          headers:{
            'Content-Type':'application/json'
          }
        });
        if(response.status === 200 || response.status === 201){
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
        setModalOpen(true)
        }else{
          console.error("Unexpected response:", response.status, response.data);
            setModalData({
            title: "Error!",
            message: response.data || "Unexpected response",
            type: "error",
          });
          setModalOpen(true)

        }
      } catch (error) {
        const err = error as AxiosError;
        console.error("Error creating machine:", err.response?.data || err.message);  

      }
      setEditingMachine(undefined);
    }
  };

  const handleDeleteMachine = async(id: string) => {
    try {
      const resp = await axios.post(`${TraceBASEURL}/delete-machine/${id}`);
      if(resp.status === 200 || resp.status === 201){
           setModalData({
          title: "Success!",
          message: "Machine Deleted successfully.",
          type: "success",
        });
        setModalOpen(true)
        setMachines(prev => prev.filter(machine => machine.machine_id !== id));

      }
      
    } catch (error) {
        const err = error as AxiosError;
        console.error("Error deleting machine:", err.response?.data || err.message);  

    }

  };

  const handleStartEdit = (machine: Machine) => {
    setEditingMachine(machine);
  };

  const handleCancelEdit = () => {
    setEditingMachine(undefined);
  };

  const getStatusCounts = () => {
    return machines.reduce((acc, machine) => {
      acc[machine.status] = (acc[machine.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Machine Management</h1>
                <p className="text-gray-600">Manage your construction equipment inventory</p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="hidden md:flex space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{machines.length}</div>
                <div className="text-sm text-gray-500">Total Machines</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{statusCounts.active || 0}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.maintenance || 0}</div>
                <div className="text-sm text-gray-500">Maintenance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Quick Stats - Mobile */}
          <div className="md:hidden grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-lg font-bold text-gray-900">{machines.length}</div>
                  <div className="text-sm text-gray-500">Total Machines</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-lg font-bold text-gray-900">{statusCounts.active || 0}</div>
                  <div className="text-sm text-gray-500">Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Machine Form */}
          <MachineForm
            machine={editingMachine}
            onSubmit={editingMachine ? handleEditMachine : handleAddMachine}
            onCancel={handleCancelEdit}
            isEditing={!!editingMachine}
          />

          {/* Machine List */}
          <MachineList
            machines={machines}
            onEdit={handleStartEdit}
            onDelete={handleDeleteMachine}
          />
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
        />

      </div>
    </div>
  );
}

export default MachineManagement;