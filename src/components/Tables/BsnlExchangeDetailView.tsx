import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


interface BsnlExchangeDetail {
  user_id: string;
  state_id: string;
  district_id: string;
  block_id: string;
  state_name: string;
  district_name: string;
  block_name: string;
  bsnlExchangeCondition: string;
  bsnlRoofTopPhoto: string;
  bsnlTotalEquipmentPhoto: string;
  bsnlFloorPhoto: string;
  bsnlOutsidePhoto: string;
  bsnlCordinates: string;
  roomSpace: string;
  roomSpacePhoto: string;
  powerType: string;
  upsCapacity: string;
  presentLoad: string;
  powerSystemVoltage: string;
  generator: string;
  generatorMake: string;
  generatorModel: string;
  generatorCapacity: string;
  earthPitVoltage: string;
  earthPitPhoto: string;
  earthPitCoordinates: string;
  oltMake: string;
  oltCount: string;
  rack: string;
  fdms: string;
  splitters: string;
  routerMake: string;
  routerCount: string;
  equipmentPhoto: string;
  personName1: string;
  personNumber1: string;
  personName2: string;
  personNumber2: string;
  personName3: string;
  personNumber3: string;
  bsnlCableEntryPhoto : string;
  bsnlCableExitPhoto : string;
  bsnlExistingRackPhoto : string;
  bsnlLayoutPhoto : string;
  bsnlProposedRackPhoto : string;
  bsnlUPSPhoto : string;
  designation1 : string;
  designation2 : string;
  designation3 : string;
  noOfEarthPits : string;
  powerCableRequired : string;
  socketAvailability : string;
}

const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;


const BsnlExchangeDetailView = () => {
  const [detail, setDetail] = useState<BsnlExchangeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  
  const { id } = useParams();
  const navigate = useNavigate();

  const handleAccept = async () => {
    try {
      const response = await axios.post(`${BASEURL_Val}/bsnl-exchanges/${id}/accept`);
      if (response.data.status === 1) {
        toast.success("Record Accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting record:", error);
      toast.error("Error accepting record");
    }
  };

  const handleEdit = async () => {
    await navigate(`/survey/bsnl-edit/${id}`);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${BASEURL_Val}/bsnl-exchanges/${id}`);
       // Show success message
       toast.success("Record deleted successfully.");
    
    // Redirect to another page (e.g., list page)
     navigate("/survey"); 
    } catch (error) {
      toast.error("Failed to delete record.");
    }
  };
  
  const handleReject = async () => {
    try {
      const response = await axios.post(`${BASEURL_Val}/bsnl-exchanges/${id}/reject`);
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
        `${BASEURL_Val}/bsnl-exchanges/${id}` 
      );
      console.log(response.data.data);
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

  if (loading) return <p className="text-center py-4">Loading...</p>;
  if (error) return <p className="text-center py-4 text-red-500">Error: {error}</p>;

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

      <h1 className="text-2xl font-bold mb-6">BSNL Exchange Detail View</h1>

      {detail && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* General Info */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">General Information</h2>
            <p><strong>State:</strong> {detail?.state_name}</p>
            <p><strong>District:</strong> {detail?.district_name}</p>
            <p><strong>Block:</strong> {detail.block_name}</p>
            <p><strong>Coordinates:</strong> {detail.bsnlCordinates}</p>
            {detail.bsnlLayoutPhoto && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">BSNL Layout Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.bsnlLayoutPhoto}`}
                  alt="BSNL Layout Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.bsnlLayoutPhoto}`)}
                />
                </div>
              </div>
            )}
            {detail.bsnlCableEntryPhoto && (
               <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">BSNL Cable Entry Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.bsnlCableEntryPhoto}`}
                  alt="BSNL Cable Entry Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.bsnlCableEntryPhoto}`)}
                />
                </div>
              </div>
            )}
            {detail.bsnlCableExitPhoto && (
               <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">BSNL Cable Exit Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.bsnlCableExitPhoto}`}
                  alt="BSNL Cable Exit Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.bsnlCableExitPhoto}`)}
                />
                </div>
              </div>
            )}
          </div>

          {/* Power Details */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Power Details</h2>
            <p><strong>Power Type:</strong> {detail.powerType}</p>
            <p><strong>UPS/SMPS Capacity(KW/KVA):</strong> {detail.upsCapacity}</p>
            <p><strong>Socket Availability (Amp):</strong> {detail.socketAvailability}</p>
            <p><strong>Existing Load in (Amp):</strong> {detail.presentLoad}</p>
            <p><strong>Power Cable Requirement(Mtrs):</strong> {detail.powerCableRequired}</p>
            {detail.roomSpacePhoto && (
               <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Room Space Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.roomSpacePhoto}`}
                  alt="Room Space Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.roomSpacePhoto}`)}
                />
                </div>
              </div>
            )}
            <h2 className="text-lg font-semibold mb-2 mt-4">Generator Details</h2>
            <p><strong>Generator Available:</strong> {detail.generator}</p>
            <p><strong>Generator Make:</strong> {detail.generatorMake}</p>
            <p><strong>Generator Model:</strong> {detail.generatorModel}</p>
            <p><strong>Generator Capacity:</strong> {detail.generatorCapacity}</p>
            {detail.bsnlUPSPhoto && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">BSNL UPS Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.bsnlUPSPhoto}`}
                  alt="BSNL Ups Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.bsnlUPSPhoto}`)}
                />
                </div>
              </div>
            )}
          </div>

          {/* Earth Pit and Room Details */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Earth Pit and Room</h2>
            <p><strong>No Of Earthpits available:</strong> {detail.noOfEarthPits}</p>
            <p><strong>Earth Pit(Ohms):</strong> {detail.earthPitVoltage}</p>
            <p><strong>Earth Coordinates:</strong> {detail.earthPitCoordinates}</p>
            {detail.earthPitPhoto && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Earth Pit Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.earthPitPhoto}`}
                  alt="Earth Pit Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.earthPitPhoto}`)}
                />
                </div>
              </div>
            )}
          </div>

          {/* Rack Details */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Rack Details</h2>
            <p><strong>Rack:</strong> {detail.rack}</p>

            {detail.bsnlExistingRackPhoto && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">BSNL Existing Rack Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.bsnlExistingRackPhoto}`}
                  alt="BSNL Existing Rack Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.bsnlExistingRackPhoto}`)}
                />
                </div>
              </div>
            )}
           
           {detail.bsnlProposedRackPhoto && (
             <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">BSNL Proposed Rack Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.bsnlProposedRackPhoto}`}
                  alt="BSNL Proposed Rack Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.bsnlProposedRackPhoto}`)}
                />
                </div>
              </div>
            )}
          </div>

          {/* Router and Gate Info */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Existing Inventory Details</h2>
            <p><strong>OLT Make:</strong> {detail.oltMake}</p>
            <p><strong>OLT Count:</strong> {detail.oltCount}</p>
            <p><strong>Fdms:</strong> {detail.fdms}</p>
            <p><strong>Splitters:</strong> {detail.splitters}</p>
            <p><strong>Router Make:</strong> {detail.routerMake}</p>
            <p><strong>Router Count:</strong> {detail.routerCount}</p>
            {detail.equipmentPhoto && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Equipment Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.equipmentPhoto}`}
                  alt="Router Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.equipmentPhoto}`)}
                />
                </div>
              </div>
            )}
          </div>

          {/* Exchange and Contact Info */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Exchange Contact Details</h2>
            <p><strong>Contact Person 1:</strong> {detail.personName1}</p>
            <p><strong>Contact Number 1:</strong> {detail.personNumber1}</p>
            <p><strong>Designation :</strong> {detail.designation1}</p>
            <p><strong>Contact Person 2:</strong> {detail.personName2}</p>
            <p><strong>Contact Number 2:</strong> {detail.personNumber2}</p>
            <p><strong>Designation2 :</strong> {detail.designation2}</p>

            <p><strong>Contact Person 3:</strong> {detail.personName3}</p>
            <p><strong>Contact Number 3:</strong> {detail.personNumber3}</p>
            <p><strong>Designation 3 :</strong> {detail.designation3}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
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
    </div>
    </>
  );
};

export default BsnlExchangeDetailView;
