import { BarChart3, Globe2Icon, ListFilter, ListIcon, Plus, Truck, MapPin } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { GPList, GPListFormData, GPMainData } from '../../types/survey'
import GpForm from './GpForm';
import axios, { AxiosError } from 'axios';
import Modal from '../hooks/ModalPopup';
import GpListPage from './GpList';
import { getGpData } from '../Services/api';
import { Link } from 'react-router-dom';

interface ModalData {
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

function GPListData() {
    const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
    const[GpList,setGPList]=useState<GPMainData|undefined>();
    const[editgp,seteditgp]=useState<GPList>();
    const[page,setPage]=useState<number>(1);
    const[stateId,setStateId]=useState<string>('');
    const[DistrictId,setDistrictId]=useState<string>('');
    const[BlockId,setBlockId]=useState<string>('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [modalData, setModalData] = useState<ModalData>({
        title: "",
        message: "",
        type: "info",
    });
    
    useEffect(()=>{
        getGpData(page,stateId,DistrictId,BlockId).then(data=>{
          setGPList(data)
        })
    },[page,stateId,DistrictId,BlockId])

    const handleEditGp = async(formData:GPListFormData) =>{
      if(editgp){
        try {
          const resp = await axios.post(`${TraceBASEURL}/update-gpslist/${editgp.id}`,formData,{
                headers:{
                    'Content-Type':'application/json'
                }
            });
          if(resp.status === 200 || resp.status === 201){
           setGPList(prev =>
              prev
                ? {
                    ...prev,
                    data: prev.data.map(gp =>
                      gp.id === editgp.id
                        ? { ...gp, ...formData, updated_at: new Date().toISOString() }
                        : gp
                    ),
                  }
                : prev
            );
          
            setModalData({
            title: "Success!",
            message: "GP updated successfully.",
            type: "success",
          });
           setModalOpen(true)
           setFormModalOpen(false);
          }else{
            setModalData({
            title: "Error!",
            message: resp.data || "Unexpected response",
            type: "error",
          });
          setModalOpen(true)
          }
        } catch (error) {
          const err = error as AxiosError;
          console.error("Error creating GP:", err.response?.data || err.message);  
        }
        seteditgp(undefined)
      }
    }

    const handleAddGp = async(formData:GPListFormData) =>{
        try {
            const resp = await axios.post(`${TraceBASEURL}/insert-fpoi`,formData,{
                headers:{
                    'Content-Type':'application/json'
                }
            });
            if(resp.status === 200 || resp.status === 201){
                setModalData({
                title: "Success!",
                message: "GP added successfully.",
                type: "success",
                });
                setModalOpen(true);
                setFormModalOpen(false);
                // Refresh data
                getGpData(page,stateId,DistrictId,BlockId).then(data=>{
                  setGPList(data)
                });
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
                console.error("Error creating GP:", err.response?.data || err.message); 
                setModalData({
                  title: "Error!",
                  message: err.message || "Unexpected response",
                  type: "error",
                });
                setModalOpen(true)
        }
    }

    const handleStartEdit = (GP: GPList) => {
        seteditgp(GP);
        setFormModalOpen(true);
    };

    const handleDeleteGp = ()=>{
        // Delete functionality to be implemented
    }

    const handleCancelEdit = () => {
        seteditgp(undefined);
        setFormModalOpen(false);
    }

    const handleOpenAddModal = () => {
        seteditgp(undefined);
        setFormModalOpen(true);
    }

    const getTypeCounts = () => {
        return GpList?.data?.reduce((acc, gp) => {
          acc[gp.type] = (acc[gp.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
    };

    const typeCounts = getTypeCounts();

    const GPHeader = () => {
        return (
            <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
                            <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">GP List</h1>
                            <p className="text-sm text-gray-600">Monitor and manage village-level governance units</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Add New GP Button */}
                        <button
                            onClick={handleOpenAddModal}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Add New GP
                        </button>
                        
                        {/* Breadcrumb Navigation */}
                        <nav>
                            <ol className="flex items-center gap-2">
                                <li>
                                    <Link className="font-medium" to="/dashboard">
                                        Dashboard /
                                    </Link>
                                </li>
                                <li className="font-medium text-primary">GP Management</li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </header>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <GPHeader />

            {/* Status Cards */}
            <div className="px-1 py-6">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{GpList?.totalRows || 0}</div>
                                <div className="text-sm text-gray-600">Total GPs</div>
                            </div>
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-green-600">{typeCounts.GP || 0}</div>
                                <div className="text-sm text-gray-600">GP Type</div>
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
                                <div className="text-2xl font-bold text-purple-600">{typeCounts.ONT || 0}</div>
                                <div className="text-sm text-gray-600">ONT Type</div>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-yellow-600">{typeCounts.BHQ || 0}</div>
                                <div className="text-sm text-gray-600">BHQ Type</div>
                            </div>
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Globe2Icon className="w-5 h-5 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-indigo-600">{typeCounts.OLT || 0}</div>
                                <div className="text-sm text-gray-600">OLT Type</div>
                            </div>
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                    <ListIcon className="w-3 h-3 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-red-600">{typeCounts.FPOI || 0}</div>
                                <div className="text-sm text-gray-600">FPOI Type</div>
                            </div>
                            <div className="p-2 bg-red-100 rounded-lg">
                                <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                                    <BarChart3 className="w-3 h-3 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-1">
                <div className="space-y-8">
                    {/* GP List Table */}
                    <GpListPage
                        GpList={GpList}
                        onEdit={handleStartEdit}
                        onDelete={handleDeleteGp}
                        OnPage={(e)=>setPage(e)}
                        Onstate={(e)=>setStateId(e)}
                        OnDist={(e)=>setDistrictId(e)}
                        OnBlock={(e)=>setBlockId(e)}
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

                {/* GP Form Modal */}
                {isFormModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <GpForm
                                GpList={editgp}
                                onSubmit={editgp ? handleEditGp : handleAddGp}
                                onCancel={handleCancelEdit}
                                isEditing={!!editgp}
                                isOpen={true}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default GPListData