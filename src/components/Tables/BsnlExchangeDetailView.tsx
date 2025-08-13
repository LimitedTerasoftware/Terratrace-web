import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { hasViewOnlyAccess } from "../../utils/accessControl";
import {
  ArrowLeft,
  MapPin,
  Zap,
  Server,
  Settings,
  Phone,
  Check,
  X,
  Edit3,
  Trash2,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Building2,
  Cable,
  HardDrive
} from "lucide-react";
import { Header } from "../Breadcrumbs/Header";

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
  bsnlCableEntryPhoto: string;
  bsnlCableExitPhoto: string;
  bsnlExistingRackPhoto: string;
  bsnlLayoutPhoto: string;
  bsnlProposedRackPhoto: string;
  bsnlUPSPhoto: string;
  designation1: string;
  designation2: string;
  designation3: string;
  noOfEarthPits: string;
  powerCableRequired: string;
  socketAvailability: string;
}

const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = import.meta.env.VITE_Image_URL;


const BsnlExchangeDetailView = () => {
  const [detail, setDetail] = useState<BsnlExchangeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);


  const { id } = useParams();
  const navigate = useNavigate();
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // Simple notification - replace with your preferred notification system
    alert(`${type.toUpperCase()}: ${message}`);
  };
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
      //  navigate("/survey"); 
      window.history.back()
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

  const InfoCard = ({ title, icon: Icon, children, className = "" }: {
    title: string;
    icon: any;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );

  const ImageDisplay = ({ src, alt, title }: { src: string; alt: string; title: string }) => (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <ImageIcon className="h-4 w-4" />
        {title}
      </h3>
      <div className="relative group cursor-pointer" onClick={() => setZoomImage(`${baseUrl}${src}`)}>
        <div className="w-full h-48 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={`${baseUrl}${src}`}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white p-2 rounded-full shadow-lg">
            <ImageIcon className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  );

  const DataRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <span className="text-sm text-gray-900 font-semibold">{value || 'N/A'}</span>
    </div>
  );

  const ActionButton = ({
    onClick,
    icon: Icon,
    label,
    variant = 'primary',
    loading = false
  }: {
    onClick: () => void;
    icon: any;
    label: string;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
    loading?: boolean;
  }) => {
    const variants = {
      primary: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white',
      success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white',
      warning: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white',
      danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
    };

    return (
      <button
        onClick={onClick}
        disabled={loading}
        className={`${variants[variant]} px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
        {label}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div>
            <p className="text-lg font-medium text-gray-900">Loading details...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch the information</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const viewOnly = hasViewOnlyAccess();
  return (
    <>
      {zoomImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50 p-4"
          onClick={() => setZoomImage(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <img
              src={zoomImage}
              alt="Zoomed"
              className="max-w-full max-h-full rounded-lg shadow-2xl"
            />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen">
        <div className="container mx-auto px-1">
          {/* Header */}
            <Header activeTab="bsnlaview" BackBut={true}/>
      

          {detail && (
            <>
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8 mt-3">
                {/* General Information */}
                <InfoCard title="General Information" icon={MapPin}>
                  <div className="space-y-1">
                    <DataRow label="State" value={detail.state_name} />
                    <DataRow label="District" value={detail.district_name} />
                    <DataRow label="Block" value={detail.block_name} />
                    <DataRow label="Coordinates" value={detail.bsnlCordinates} />
                  </div>

                  {detail.bsnlLayoutPhoto && (
                    <ImageDisplay
                      src={detail.bsnlLayoutPhoto}
                      alt="BSNL Layout"
                      title="Layout Photo"
                    />
                  )}
                  {detail.bsnlCableEntryPhoto && (
                    <ImageDisplay
                      src={detail.bsnlCableEntryPhoto}
                      alt="Cable Entry"
                      title="Cable Entry Photo"
                    />
                  )}
                  {detail.bsnlCableExitPhoto && (
                    <ImageDisplay
                      src={detail.bsnlCableExitPhoto}
                      alt="Cable Exit"
                      title="Cable Exit Photo"
                    />
                  )}
                </InfoCard>

                {/* Power Details */}
                <InfoCard title="Power & Infrastructure" icon={Zap}>
                  <div className="space-y-1 mb-4">
                    <DataRow label="Power Type" value={detail.powerType} />
                    <DataRow label="UPS/SMPS Capacity" value={detail.upsCapacity} />
                    <DataRow label="Socket Availability" value={`${detail.socketAvailability} Amp`} />
                    <DataRow label="Existing Load" value={`${detail.presentLoad} Amp`} />
                    <DataRow label="Power Cable Required" value={`${detail.powerCableRequired} Mtrs`} />
                  </div>

                  {detail.roomSpacePhoto && (
                    <ImageDisplay
                      src={detail.roomSpacePhoto}
                      alt="Room Space"
                      title="Room Space Photo"
                    />
                  )}

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Generator Details
                    </h3>
                    <div className="space-y-1">
                      <DataRow label="Generator Available" value={detail.generator} />
                      <DataRow label="Make" value={detail.generatorMake} />
                      <DataRow label="Model" value={detail.generatorModel} />
                      <DataRow label="Capacity" value={detail.generatorCapacity} />
                    </div>
                  </div>

                  {detail.bsnlUPSPhoto && (
                    <ImageDisplay
                      src={detail.bsnlUPSPhoto}
                      alt="UPS"
                      title="UPS Photo"
                    />
                  )}
                </InfoCard>

                {/* Earth Pit Details */}
                <InfoCard title="Earth Pit & Room" icon={Cable}>
                  <div className="space-y-1">
                    <DataRow label="No. of Earth Pits" value={detail.noOfEarthPits} />
                    <DataRow label="Earth Pit Resistance" value={`${detail.earthPitVoltage} Ohms`} />
                    <DataRow label="Earth Coordinates" value={detail.earthPitCoordinates} />
                  </div>

                  {detail.earthPitPhoto && (
                    <ImageDisplay
                      src={detail.earthPitPhoto}
                      alt="Earth Pit"
                      title="Earth Pit Photo"
                    />
                  )}
                </InfoCard>

                {/* Rack Details */}
                <InfoCard title="Rack Information" icon={Server}>
                  <div className="space-y-1">
                    <DataRow label="Rack Type" value={detail.rack} />
                  </div>

                  {detail.bsnlExistingRackPhoto && (
                    <ImageDisplay
                      src={detail.bsnlExistingRackPhoto}
                      alt="Existing Rack"
                      title="Existing Rack Photo"
                    />
                  )}
                  {detail.bsnlProposedRackPhoto && (
                    <ImageDisplay
                      src={detail.bsnlProposedRackPhoto}
                      alt="Proposed Rack"
                      title="Proposed Rack Photo"
                    />
                  )}
                </InfoCard>

                {/* Equipment Details */}
                <InfoCard title="Existing Equipment" icon={HardDrive}>
                  <div className="space-y-1">
                    <DataRow label="OLT Make" value={detail.oltMake} />
                    <DataRow label="OLT Count" value={detail.oltCount} />
                    <DataRow label="FDMS" value={detail.fdms} />
                    <DataRow label="Splitters" value={detail.splitters} />
                    <DataRow label="Router Make" value={detail.routerMake} />
                    <DataRow label="Router Count" value={detail.routerCount} />
                  </div>

                  {detail.equipmentPhoto && (
                    <ImageDisplay
                      src={detail.equipmentPhoto}
                      alt="Equipment"
                      title="Equipment Photo"
                    />
                  )}
                </InfoCard>

                {/* Contact Details */}
                <InfoCard title="Contact Information" icon={Phone}>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Contact Person 1</h4>
                      <div className="space-y-1">
                        <DataRow label="Name" value={detail.personName1} />
                        <DataRow label="Number" value={detail.personNumber1} />
                        <DataRow label="Designation" value={detail.designation1} />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Contact Person 2</h4>
                      <div className="space-y-1">
                        <DataRow label="Name" value={detail.personName2} />
                        <DataRow label="Number" value={detail.personNumber2} />
                        <DataRow label="Designation" value={detail.designation2} />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Contact Person 3</h4>
                      <div className="space-y-1">
                        <DataRow label="Name" value={detail.personName3} />
                        <DataRow label="Number" value={detail.personNumber3} />
                        <DataRow label="Designation" value={detail.designation3} />
                      </div>
                    </div>
                  </div>
                </InfoCard>
              </div>

              {/* Action Buttons */}
              {!viewOnly && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <ActionButton
                      onClick={handleEdit}
                      icon={Edit3}
                      label="Edit Record"
                      variant="primary"
                    />
                    <ActionButton
                      onClick={handleAccept}
                      icon={Check}
                      label="Accept"
                      variant="success"
                      loading={actionLoading === 'accept'}
                    />
                    <ActionButton
                      onClick={handleReject}
                      icon={X}
                      label="Reject"
                      variant="warning"
                      loading={actionLoading === 'reject'}
                    />
                    <ActionButton
                      onClick={handleDelete}
                      icon={Trash2}
                      label="Delete"
                      variant="danger"
                      loading={actionLoading === 'delete'}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BsnlExchangeDetailView;
