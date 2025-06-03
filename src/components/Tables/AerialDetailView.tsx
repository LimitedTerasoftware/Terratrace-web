import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {hasViewOnlyAccess } from "../../utils/accessControl";


interface AerialSurvey {
  id: number;
  startGpName: string;
  startGpCoordinates: string;
  endGpName: string;
  endGpCoordinates: string;
  aerial_road_crossings: AerialRoadCrossing[];
  aerial_poles: AerialPole[];
}

interface AerialRoadCrossing {
  id: number;
  typeOfCrossing: string;
  slattitude: string;
  slongitude: string;
  elattitude: string;
  elongitude: string;
  startPhoto: string;
  endPhoto: string;
  length:string;
}

interface AerialPole {
  id: number;
  electricityLineType: string;
  lattitude: string;
  longitude: string;
  poleAvailabilityAt: string;
  poleCondition: string;
  poleHeight: string;
  polePhoto: string;
  polePosition: string;
  poleType: number;
  typeOfPole: string;
}

const BASEURL = import.meta.env.VITE_API_BASE;
const baseUrl_public = `${BASEURL}/public/`;
const AerialDetailView: React.FC = () => {
  const [data, setData] = useState<AerialSurvey | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
 
  const { id } = useParams();
  const navigate = useNavigate();
  

  const handleAccept = async () => {
    try {
      const response = await axios.post(`${BASEURL}/aerial-surveys/${id}/accept`);
      if (response.data.status === 1) {
        toast.success("Record Accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting record:", error);
      toast.error("Error accepting record");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${BASEURL}/aerial-surveys/${id}`);
       // Show success message
       toast.success("Record deleted successfully.");
    
    // Redirect to another page (e.g., list page)
     navigate("/survey?tab=aerial"); 
    } catch (error) {
      toast.error("Failed to delete record.");
    }
  };
  
  const handleReject = async () => {
    try {
      const response = await axios.post(`${BASEURL}/aerial-surveys/${id}/reject`);
      if (response.data.status === 1) {
        toast.success("Record Rejected successfully.");
      }
    } catch (error) {
      console.error("Error rejecting record:", error);
      alert("Failed to reject record.");
    }
  };

  useEffect(() => {
    axios
      .get( `${BASEURL}/aerial-surveys/${id}`)
      .then((response) => {
        setData(response.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
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
    <div className="container mx-auto p-6">
      <ToastContainer />
      <button
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
        onClick={() => window.history.back()}
      >
        <FaArrowLeft className="h-5 w-5" />
        Back
      </button>
      <h1 className="text-2xl font-bold mb-4">Aerial Survey Detail View</h1>

      <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg shadow">
        <div>
          <p><strong>Start GP Name:</strong> {data?.startGpName}</p>
          <p><strong>Start Coordinates:</strong> {data?.startGpCoordinates}</p>
        </div>
        <div>
          <p><strong>End GP Name:</strong> {data?.endGpName}</p>
          <p><strong>End Coordinates:</strong> {data?.endGpCoordinates}</p>
        </div>
      </div>
      
      <h2 className="text-xl font-semibold mt-6">Aerial Road Crossings</h2>
      <table className="w-full border-collapse border border-gray-400  bg-white mt-2">
      <thead>
        <tr className="bg-white-100">
          <th className="border border-gray-300 p-2">Crossing Type</th>
          <th className="border border-gray-300 p-2">Crossing Length</th>
          <th className="border border-gray-300 p-2">Crossing Start (Lat, Lng)</th>
          <th className="border border-gray-300 p-2">Crossing End (Lat, Lng)</th>
          <th className="border border-gray-300 p-2">Start Photo</th>
          <th className="border border-gray-300 p-2">End Photo</th>
        </tr>
      </thead>
      <tbody>
        {data?.aerial_road_crossings.map((crossing) => (
          <tr key={crossing.id} className="border border-gray-300">
            <td className="border border-gray-300 p-2 text-center">{crossing.typeOfCrossing}</td>
            <td className="border border-gray-300 p-2 text-center">{crossing.length}</td>
            <td className="border border-gray-300 p-2 text-center">
              {crossing.slattitude}, {crossing.slongitude}
            </td>
            <td className="border border-gray-300 p-2 text-center">
              {crossing.elattitude}, {crossing.elongitude}
            </td>
            <td className="border border-gray-300 p-2 text-center">
              <img src={`${baseUrl_public}${crossing.startPhoto}`} alt="Start" className="w-16 h-16 object-cover mx-auto rounded" onClick={() => setZoomImage(`${baseUrl_public}${crossing.startPhoto}`)}/>
            </td>
            <td className="border border-gray-300 p-2 text-center">
              <img src={`${baseUrl_public}${crossing.endPhoto}`} alt="End" className="w-16 h-16 object-cover mx-auto rounded" onClick={() => setZoomImage(`${baseUrl_public}${crossing.endPhoto}`)}/>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

      
      <h2 className="text-xl font-semibold mt-6">Aerial Poles</h2>
      <table className="w-full mt-2 border-collapse border border-gray-400 bg-white">
        <thead>
          <tr className="bg-white-200">
            <th className="border p-2">Pole Type</th>
            <th className="border p-2">Type Of Pole</th>
            <th className="border p-2">Pole Condition</th>
            <th className="border p-2">Pole Height</th>
            <th className="border p-2">Pole Position</th>
            <th className="border p-2">Pole Availablity</th>
            <th className="border p-2">Pole Photo</th>
          </tr>
        </thead>
        <tbody>
          {data?.aerial_poles.map((pole) => (
            <tr key={pole.id}>
              <td className="border p-2 text-center">{pole.poleType === 1 ? "Existing" : "New"}</td>
              <td className="border p-2 text-center">{pole.typeOfPole}</td>
              <td className="border p-2 text-center">{pole.poleCondition}</td>
              <td className="border p-2 text-center">{pole.poleHeight}</td>
              <td className="border p-2 text-center">{pole.polePosition}</td>
              <td className="border p-2 text-center">{pole.poleAvailabilityAt}</td>
              <td className="border p-2 text-center">
                {pole.polePhoto && <img src={`${baseUrl_public}${pole.polePhoto}`} alt="Pole" className="w-16 h-16 object-cover" onClick={() => setZoomImage(`${baseUrl_public}${pole.polePhoto}`)}/>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
       {/* Action Buttons */}
        {!viewOnly && (
            <div className="mt-6 flex gap-4 justify-center">
             <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                onClick={() => {
                  toast.success("Coming Soon this page!");
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

export default AerialDetailView;
