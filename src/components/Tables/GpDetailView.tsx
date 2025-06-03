import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import ImageSliderModal from "./ImageSliderModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {hasViewOnlyAccess } from "../../utils/accessControl";




interface GpDetail {
  id: string;
  state_name: string;
  district_name: string;
  block_name: string;
  gp_name: string;
  gpCoordinates: string;
  gpBuildingType: string;
  gpHouseType: string;
  gpBuildingHeight: string;
  gpNoRooms: string;
  ceilingHeight: string;
  gpPhotos: string;
  electricHours: string;
  switchBoardType: string;
  socketsCount: string;
  powerInterruptionCount: string;
  personName: string;
  personNumber: string;
  personEmail: string;
  keyPersonName: string;
  keyPersonNumber: string;
  ebMeter : string;
  flooring : string;
  ftb : string;
  gpLayoutPhoto : string;
  gpNoFloors : string;
  gpSpaceAvailableForPhase3 : string;
  meterToRackCableRequired : string;
  powerNonAvailableForPerDayHours : string;
  rackToEarthPitCableRequired : string;
  rackToSolarCableRequired : string;
  roofSeepage : string;
  roofSeepagePhoto : string;
  solarInstallationPossibility : string;
  solarPanelVegetation : string;
  gpEntirePhoto:string;
  roomSpace:string;
  roomSpacePhoto:string;
  solarPanelSpaceSize:string;
  loadCapacity:string;
  polePhoto:string;
  earthPitPhoto:string;
  earthPitCoordinates:string;
  poleCoordinates:string;
  equipmentPhoto:string;
  rack:string;
  rackCount:string;
  splitterCount:string;
  upsMake:string;
  upsCapacity:string;
  ont:string;
  ceilingType:string;
  engPersonCompany: string;
  engPersonEmail: string;
  engPersonName: string;
  engPersonNumber:string;
}

const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;


const GpDetailView = () => {
  const [detail, setDetail] = useState<GpDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  

  const handleAccept = async () => {
    try {
      const response = await axios.post(`${BASEURL_Val}/gp-surveys/${id}/accept`);
      if (response.data.status === 1) {
        toast.success("Record Accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting record:", error);
      toast.error("Error accepting record");
    }
  };

  const handleEdit = async () => {
    await navigate(`/survey/gp-edit/${id}`);
  };

    // Handle delete
    const handleDelete = async () => {
      if (!window.confirm("Are you sure you want to delete this record?")) return;
      try {
        await axios.delete(`${BASEURL_Val}/gp-surveys/${id}`);
         // Show success message
         toast.success("Record deleted successfully.");
      
      // Redirect to another page (e.g., list page)
       navigate("/survey?tab=gp"); 
      } catch (error) {
        toast.error("Failed to delete record.");
      }
    };
  
  const handleReject = async () => {
    try {
      const response = await axios.post(`${BASEURL_Val}/gp-surveys/${id}/reject`);
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
        `${BASEURL_Val}/gp-surveys/${id}` 
      );
      console.log(response.data.data[0]);
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

  console.log(detail?.state_name);

  if (loading) return <p className="text-center py-4">Loading...</p>;
  if (error) return <p className="text-center py-4 text-red-500">Error: {error}</p>;
  const viewOnly = hasViewOnlyAccess();
  
  if (!detail) return <p>No data available.</p>;

  let images: string[] = [];
  try {
    images = detail.roofSeepagePhoto ? JSON.parse(detail.roofSeepagePhoto).map((path: string) => `${baseUrl}${path}`) : [];
  } catch (error) {
    console.error("Error parsing images:", error);
  }

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

    <h1 className="text-2xl font-bold mb-6">GP Detail View</h1>
    {detail && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Location Details */}
        <div className="bg-white shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Location Details</h2>
          <p>
            <strong>State:</strong> {detail.state_name}
          </p>
          <p>
            <strong>District:</strong> {detail.district_name}
          </p>
          <p>
            <strong>Block:</strong> {detail.block_name}
          </p>
          <p>
            <strong>GP Name:</strong> {detail.gp_name}
          </p>
          <p>
            <strong>Coordinates:</strong> {detail.gpCoordinates}
          </p>
          {detail.gpLayoutPhoto && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">GP Layout Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.gpLayoutPhoto}`}
                  alt="GP Layout Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.gpLayoutPhoto}`)}
                />
                </div>
              </div>
            )}

            {detail.gpEntirePhoto && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">GP Entire Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.gpEntirePhoto}`}
                  alt="GP Entire Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.gpEntirePhoto}`)}
                />
                </div>
              </div>
            )}
        </div>

        {/* Building Information */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Building Information</h2>
          <p>
            <strong>Building Type:</strong> {detail.gpBuildingType}
          </p>
          <p>
            <strong>House Type:</strong> {detail.gpHouseType}
          </p>
          <p>
            <strong>Building Height(ft):</strong> {detail.gpBuildingHeight}
          </p>
          <p>
            <strong>Flooring Type:</strong> {detail.flooring}
          </p>
          <p>
            <strong> Space Availiable For Phase-3:</strong> {detail.gpSpaceAvailableForPhase3}
          </p>
          <p>
            <strong>Ceiling Type:</strong> {detail.ceilingType}
          </p>
          <p>
            <strong>Ceiling Height(ft):</strong> {detail.ceilingHeight}
          </p>
          <p>
            <strong>No of Gp floors:</strong> {detail.gpNoFloors}
          </p>
          <p>
            <strong>Room Space approx(Sq Ft):</strong> {detail.roomSpace}
          </p>
          <p>
            <strong>Solar Installation Possibility:</strong> {detail.solarInstallationPossibility}
          </p>
          <p>
            <strong>Space for Solar Panel(SQ FT):</strong> {detail.solarPanelSpaceSize}
          </p>
          <p>
            <strong>Vegetation Clearness:</strong> {detail.solarPanelVegetation}
          </p>
          <p>
            <strong>Roof Seepage:</strong> {detail.roofSeepage}
          </p>

          <div>
          {images.length > 0 && (
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2">Roof Seepage Photos</h3>

              {/* Single Image Display */}
              {images.length === 1 ? (
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                  <img src={images[0]} alt="Roof Seepage Photo" className="w-full h-auto rounded-lg shadow-lg" />
                </div>
              ) : (
                /* Multiple Images - Click to Open Modal */
                <div
                  className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg cursor-pointer"
                  onClick={() => setIsModalOpen(true)}
                >
                  <img src={images[0]} alt="Roof Seepage Photo" className="w-full h-auto rounded-lg shadow-lg" />
                </div>
              )}
            </div>
          )}

          {/* Image Slider Modal */}
          {images.length > 1 && <ImageSliderModal images={images} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}
        </div>

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
        </div>

        {/* GP Photo */}
        {detail.gpPhotos && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">GP Photo</h2>
            <img
              src={`${baseUrl}${detail.gpPhotos}`}
              alt="GP Photo"
              className="w-full h-auto rounded-lg shadow-lg"
              onClick={() => setZoomImage(`${baseUrl}${detail.gpPhotos}`)}
            />
          </div>
        )}

          

        {/* Electrical Details */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Electrical Details</h2>
          <p>
            <strong>EB Meter:</strong> {detail.ebMeter}
          </p>
          <p>
            <strong>Load Capacity(KW):</strong> {detail.loadCapacity}
          </p>
          <p>
            <strong>Approx Power Non Availability Per day in hours:</strong> {detail.powerNonAvailableForPerDayHours}
          </p>
          <p>
            <strong>Meter to Rack approx cable required(Mtrs):</strong> {detail.meterToRackCableRequired}
          </p>
          <p>
            <strong>Rack to Solar approx cable required(Mtrs):</strong> {detail.rackToSolarCableRequired}
          </p>
          <p>
            <strong>Rack to Earth Pit  approx cable required(Mtrs):</strong> {detail.rackToEarthPitCableRequired}
          </p>

          <p>
            <strong>Pole Space Coordinates:</strong> {detail.poleCoordinates}
          </p>

          <p>
            <strong>Earthpit Space Coordinates:</strong> {detail.earthPitCoordinates}
          </p>



          {detail.polePhoto && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Pole Space Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.polePhoto}`}
                  alt="Pole Space Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.polePhoto}`)}
                />
                </div>
              </div>
            )}
          
            {detail.earthPitPhoto && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Eartpit Space Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.earthPitPhoto}`}
                  alt="Eartpit Space Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.earthPitPhoto}`)}
                />
                </div>
              </div>
            )}

            
        </div>

        {/* Contact Information */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Existing Inventory Information</h2>
          <p>
            <strong>Rack:</strong> {detail.rack}
          </p>
          <p>
            <strong>Rack Count:</strong> {detail.rackCount}
          </p>
          <p>
            <strong>Splitter Count:</strong> {detail.splitterCount}
          </p>
          <p>
            <strong>UPS Make:</strong> {detail.upsMake}
          </p>
          <p>
            <strong>UPS Capacity:</strong> {detail.upsCapacity}
          </p>
          <p>
            <strong>FTB Count:</strong> {detail.ftb}
          </p>
          <p>
            <strong>ONT Count:</strong> {detail.ont}
          </p>

          {detail.equipmentPhoto && (
              <div className="mt-4">
                <h3 className="text-md font-semibold mb-2">Equipment Photo</h3>
                <div className="w-[250px] h-[200px] overflow-hidden flex items-center justify-center border rounded-lg shadow-lg">
                <img
                  src={`${baseUrl}${detail.equipmentPhoto}`}
                  alt="Equipment Photo"
                  className="w-full h-auto rounded-lg shadow-lg"
                  onClick={() => setZoomImage(`${baseUrl}${detail.equipmentPhoto}`)}
                />
                </div>
              </div>
            )}
        
        </div>

        {/* Contact Information */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Contact Information</h2>
          <p>
            <strong>Person Name:</strong> {detail.personName}
          </p>
          <p>
            <strong>Person Number:</strong> {detail.personNumber}
          </p>
          <p>
            <strong>Person Email:</strong> {detail.personEmail}
          </p>
          <p>
            <strong>Key Person Name:</strong> {detail.keyPersonName}
          </p>
          <p>
            <strong>Key Person Number:</strong> {detail.keyPersonNumber}
          </p>
          <p>
            <strong>Engineer Name:</strong> {detail.engPersonName}
          </p>
          <p>
            <strong>Engineer Number:</strong> {detail.engPersonNumber}
          </p>
          <p>
            <strong>Working Company Name:</strong> {detail.engPersonCompany}
          </p>
          <p>
            <strong>Engineer Email:</strong> {detail.engPersonEmail}
          </p>
        </div>
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
          onClick={() => handleAccept()}
        >
          Accept
        </button>
        <button
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          onClick={() => handleReject()}
        >
          Reject
        </button>
        <button
          className="bg-yellow-500 hover:bg-red-600 text-white py-2 px-4 rounded"
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

export default GpDetailView;
