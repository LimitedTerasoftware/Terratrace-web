import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {hasViewOnlyAccess } from "../../utils/accessControl";


interface OverheadFiberModel {
  endALatLang: string;
  endAPhoto: string;
  endBLatLang: string;
  endBPhoto: string;
  id: number;
  survey_id: string;
}

interface BsnlExchangeDetail{
  id: string;
  user_id: number;
  state_id: number;
  state_name: string;
  district_id: number;
  district_name: string;
  block_id: number;
  block_name: string;
  gp_id: number;
  gpName: string;
  code: string;
  equipmentMake: string;
  otherEquipmentMake: string;
  buildingAddress: string;
  oltToFpoi: string;
  oltToFpoiLength: string;
  oltToFpoiFaultyFibers: string;
  fpoiToGp: string;
  fpoiToGpLength: string;
  fpoiToGpFaultyFibers: string;
  ont: string;
  ontMake: string;
  ontSerialNumber: string;
  ccu: string;
  ccuMake: string;
  ccuSerialNumber: string;
  battery: string;
  batteryMake: string;
  batterySerialNumber: string;
  solar: string;
  solarMake: string;
  solarSerialNumber: string;
  earthing: string;
  earthingCondition: string;
  enclosure: string;
  opticalPower: string;
  otdrTrace: string;
  splitter: string;
  ftbNoOfFiberTerminated: string;
  splitterPorts: string;
  ontPorts: string;
  csc: string;
  cscLocation: string;
  fullname:string;
  contact_no:string;
  is_active:number;

  // Parsed from JSON (TEXT column in DB)
  lessOverheadFiberModel: OverheadFiberModel[];
  moreOverheadFiberModel: OverheadFiberModel[];

  created_at?: string | null;
  updated_at?: string | null;
}


const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;


const HotoDetailView = () => {
  const [detail, setDetail] = useState<BsnlExchangeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  
  
  const { id } = useParams();
  const navigate = useNavigate();

  const handleAccept = async () => {
    try {
      const response = await axios.post(`${BASEURL_Val}/hoto-forms/${id}/accept`);
      if (response.data.status === 1) {
        toast.success("Record Accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting record:", error);
      toast.error("Error accepting record");
    }
  };
cl
  const handleEdit = async () => {
    await navigate(`/survey/hoto-edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${BASEURL_Val}/hoto-forms/${id}`);
       // Show success message
       toast.success("Record deleted successfully.");
    
    // Redirect to another page (e.g., list page)
     navigate("/survey&tab=hoto"); 
    } catch (error) {
      toast.error("Failed to delete record.");
    }
  };
  
  const handleReject = async () => {
    try {
      const response = await axios.post(`${BASEURL_Val}/hoto-forms/${id}/reject`);
      if (response.data.status === 1) {
        toast.success("Record Rejected successfully.");
      }
    } catch (error) {
      console.error("Error rejecting record:", error);
      alert("Failed to reject record.");
    }
  };

  const fetchDetails = async () => {
    try {
      const response = await axios.get(
        `${BASEURL_Val}/hoto-forms/${id}` 
      );
      
      setDetail(response.data.data[0]); // Adjust based on actual API response structure
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const parseFiberModel = (data: unknown): OverheadFiberModel[] => {
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      } catch (error) {
        console.error("Invalid JSON string", error);
      }
    } else if (Array.isArray(data)) {
      return data;
    }
    return [];
  };
  
  const lessOverheadFiberModel = useMemo(() => {
    return parseFiberModel(detail?.lessOverheadFiberModel);
  }, [detail]);  
  
  const moreOverheadFiberModel = useMemo(() => {
    return parseFiberModel(detail?.moreOverheadFiberModel);
  }, [detail]);

  if (loading) return <p className="text-center py-4">Loading...</p>;
  if (error) return <p className="text-center py-4 text-red-500">Error: {error}</p>;
  const viewOnly = hasViewOnlyAccess();
  

  return (
    <>
    {zoomImage && (
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50"
        onClick={() => setZoomImage(null)}
      >
        <img
          src={zoomImage}
          alt="Zoomed"
          className="max-w-full max-h-full p-4 rounded-lg"
        />
      </div>
    )}
    <div className="container mx-auto px-4 py-6">
      <ToastContainer />
      <button
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
        onClick={() => window.history.back()}
      >
        <FaArrowLeft className="h-5 w-5" />
        Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Hoto Detail View</h1>

      {detail && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* General Info */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">General Information</h2>
            <p><strong>State:</strong> {detail?.state_name}</p>
            <p><strong>District:</strong> {detail?.district_name}</p>
            <p><strong>Block:</strong> {detail.block_name}</p>
            <p><strong>GP:</strong> {detail.gpName}</p>
            <p><strong>Code:</strong> {detail.code}</p>
          </div>

          {/* Power Details */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Make & OLT Details</h2>
            <p><strong>Equipment Type:</strong> {detail.equipmentMake}</p>
            <p><strong>Other Equipment Type:</strong> {detail.otherEquipmentMake}</p>
            <p><strong>Address:</strong> {detail.buildingAddress}</p>
            <p><strong>OLT to FPOI:</strong> {detail.oltToFpoi}</p>
            <p><strong>OLT to FPOI Length(Mtrs):</strong> {detail.oltToFpoiLength}</p>
            <p><strong>OLT to FPOI faulty Fibres:</strong> {detail.oltToFpoiFaultyFibers}</p>
            <p><strong>FPOI to GP:</strong> {detail.fpoiToGp}</p>
            <p><strong>FPOI to GP Length(Mtrs) :</strong> {detail.fpoiToGpLength}</p>
            <p><strong>FPOI to GP faulty Fibres:</strong> {detail.fpoiToGpFaultyFibers}</p>
        
          </div>

          {/* Router and Gate Info */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Existing Inventory Details</h2>
            <p><strong>ONT:</strong> {detail.ont}</p>
            <p><strong>ONT Make:</strong> {detail.ontMake}</p>
            <p><strong>ONT Serial Number:</strong> {detail.ontSerialNumber}</p>
            <p><strong>CCU:</strong> {detail.ccu}</p>
            <p><strong>CCU Make:</strong> {detail.ccuMake}</p>
            <p><strong>CCU Serial Number:</strong> {detail.ccuSerialNumber}</p>
            <p><strong>Battery:</strong> {detail.battery}</p>
            <p><strong>Battery Make:</strong> {detail.batteryMake}</p>
            <p><strong>Battery Serial Number:</strong> {detail.batterySerialNumber}</p>
            <p><strong>Solar:</strong> {detail.solar}</p>
            <p><strong>Solar Make:</strong> {detail.solarMake}</p>
            <p><strong>Solar Serial Number:</strong> {detail.solarSerialNumber}</p>
            <p><strong>Earthing:</strong> {detail.earthing}</p>
            <p><strong>Earthing Condition:</strong> {detail.earthingCondition}</p>
            <p><strong>Enclosure:</strong> {detail.enclosure}</p>
            <p><strong>Optical Power:</strong> {detail.opticalPower}</p>
           
          </div>

          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Other Details</h2>
            <p><strong>OTDR Trace & Distance of Fault:</strong> {detail.otdrTrace}</p>
            <p><strong>Splitter:</strong> {detail.splitter}</p>
            <p><strong>Splitter Ports:</strong> {detail.splitterPorts}</p>
            <p><strong>ONT Ports:</strong> {detail.ontPorts}</p>
            <p><strong>FTB Fiber Terminated:</strong> {detail.ftbNoOfFiberTerminated}</p>
            <p><strong>CSC Shifted Location:</strong> {detail.csc}</p>
            {/* <p><strong>CCU Serial Number:</strong> {detail.ccuSerialNumber}</p> */}
            <p><strong>CSC Address:</strong> {detail.cscLocation ? detail.cscLocation : '-'}</p>
            </div>

            {detail ? (
            <div className="bg-white shadow rounded-lg p-4 space-y-6">
              <div>
                <p><strong>More Overhead Fiber Model:</strong></p>
                {moreOverheadFiberModel.length > 0 ? (
                  moreOverheadFiberModel.map((item, index) => (
                    <div key={`more-${index}`} className="mb-4">
                      <p>End A Lat/Lng: {item.endALatLang}</p>
                      <img src={`${baseUrl}${item.endAPhoto}`} alt={`End A ${index}`} width="200" />
                    
                      <p>End B Lat/Lng: {item.endBLatLang}</p>
                      <img src={`${baseUrl}${item.endBPhoto}`} alt={`End B ${index}`} width="200" />
                    
                      
                      </div>

                  ))
                ) : (
                  <p>—</p>
                )}
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}

         {detail ? (
            <div className="bg-white shadow rounded-lg p-4 space-y-6">
              <div>
                <p><strong>Less Overhead Fiber Model:</strong></p>
                {lessOverheadFiberModel.length > 0 ? (
                  lessOverheadFiberModel.map((item, index) => (
                    <div key={`less-${index}`} className="mb-4">
                      <p>End A Lat/Lng: {item.endALatLang}</p>
                      <img src={`${baseUrl}${item.endAPhoto}`} alt={`End B ${index}`} width="200" />
                      <p>End B Lat/Lng: {item.endBLatLang}</p>
                      <img src={`${baseUrl}${item.endBPhoto}`} alt={`End B ${index}`} width="200" />
                    </div>
                  ))
                ) : (
                  <p>—</p>
                )}
              </div>
            </div>
          ) : (
            <p>Loading...</p>
          )}


        </div>
      )}

      {/* Action Buttons */}
      {!viewOnly && (
      <div className="mt-6 flex gap-4 justify-center">
       <button
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          onClick={() => {
            handleEdit();
          }}
        >
          Edit
        </button> 

        <button
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          onClick={() => {
            handleAccept();
          }}
        >
          Accept
        </button>
        <button
          className="bg-yellow-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          onClick={() => {
            handleReject();
          }}
        >
          Reject
        </button>
        <button
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          onClick={() => {
            handleDelete();
          }}
        >
          Delete
        </button>
      </div>
      )}
    </div>
    </>
  );
};

export default HotoDetailView;
