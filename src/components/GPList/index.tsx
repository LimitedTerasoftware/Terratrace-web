import { BarChart3, Globe2Icon, ListFilter, ListIcon, Truck } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { GPList, GPListFormData, GPMainData } from '../../types/survey'
import GpForm from './GpForm';
import axios, { AxiosError } from 'axios';
import Modal from '../hooks/ModalPopup';
import GpListPage from './GpList';
import { getGpData } from '../Services/api';

interface ModalData {
  title: string;
  message: string;
  type: "success" | "error" | "info";
}
function GPListData() {
    const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
    const[GpList,setGPList]=useState<GPMainData|undefined>();
    const [editgp,seteditgp]=useState<GPList>();
    const[page,setPage]=useState<number>(1);
    const[stateId,setStateId]=useState<string>('');
    const[DistrictId,setDistrictId]=useState<string>('');
    const[BlockId,setBlockId]=useState<string>('');
    const [isModalOpen, setModalOpen] = useState(false);
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
            setModalData({
            title: "Success!",
            message: "GP updated successfully.",
            type: "success",
          });
           setModalOpen(true)
           window.location.reload()
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
        }

    const handleStartEdit = (GP: GPList) => {
        seteditgp(GP);
      };
    const handleDeleteGp = ()=>{

    }
    const handleCancelEdit = () => {
        seteditgp(undefined);
    }
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
        <div className='bg-white shadow-sm border-b border-gray-200'>
            <div className='max-w-7xl max-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex justify-between items-center py-6'>
                    <div className='flex items-center space-x-3'>
                        <div className='p-2 bg-blue-600 rounded-lg'>
                         <Globe2Icon className='w-6 h-6 text-white'/>
                        </div>
                        <div>
                            <h1 className='text-2xl font-bold text-gray-900'>
                                Gp List
                            </h1>
                            <p className='text-gray-600'>Keep track of all village-level governance units</p>
                        </div>
                    </div>
                    <div className='hidden md:flex space-x-6'>
                        <div className='text-center'>
                            <div className='text-2xl font-bold text-blue-600'>{GpList?.totalRows}</div>
                            <div className='text-sm text-gray-500'>Total Gps</div>
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
                <ListFilter className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-lg font-bold text-gray-900">{GpList?.totalRows}</div>
                  <div className="text-sm text-gray-500">Total Gps</div>
                </div>
              </div>
            </div>
          
          </div>
          <GpForm
            GpList = {editgp}
            onSubmit={editgp ? handleEditGp :handleAddGp}
            onCancel={handleCancelEdit}
            isEditing ={!!editgp}/>
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
       
        <Modal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            title={modalData.title}
            message={modalData.message}
            type={modalData.type}
            />
      </div>

    </div>
  )
}

export default GPListData