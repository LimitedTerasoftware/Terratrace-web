import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import ImageSliderModal from "./ImageSliderModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {hasViewOnlyAccess } from "../../utils/accessControl";
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Zap, 
  Phone, 
  Check, 
  X, 
  Edit3, 
  Trash2,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Home,
  Server,
  Cable,
  Users,
  Settings
} from "lucide-react";
import { ErrorPage, LoadingPage } from "../hooks/useActivities";
import { Header } from "../Breadcrumbs/Header";




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
const baseUrl = import.meta.env.VITE_Image_URL;


const GpDetailView = () => {
  const [detail, setDetail] = useState<GpDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const navigate = useNavigate();
  

  const handleAccept = async () => {
    try {
      setActionLoading('accept');

      const response = await axios.post(`${BASEURL_Val}/gp-surveys/${id}/accept`);
      if (response.data.status === 1) {
        toast.success("Record Accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting record:", error);
      toast.error("Error accepting record");
    }finally {
      setActionLoading(null);
    }
  };

  const handleEdit = async () => {
    await navigate(`/survey/gp-edit/${id}`);
  };

    // Handle delete
    const handleDelete = async () => {
      if (!window.confirm("Are you sure you want to delete this record?")) return;
      try {
        setActionLoading('delete');

        await axios.delete(`${BASEURL_Val}/gp-surveys/${id}`);
         // Show success message
         toast.success("Record deleted successfully.");
      
      // Redirect to another page (e.g., list page)
      //  navigate("/survey?tab=gp"); 
       window.history.back()
      } catch (error) {
        toast.error("Failed to delete record.");
      }finally {
      setActionLoading(null);
    }
    };
  
  const handleReject = async () => {
    try {
        setActionLoading('reject');
      const response = await axios.post(`${BASEURL_Val}/gp-surveys/${id}/reject`);
      if (response.data.status === 1) {
        toast.success("Record Rejected successfully.");
      }
    } catch (error) {
      console.error("Error rejecting record:", error);
      alert("Failed to reject record.");
    }finally {
      setActionLoading(null);
    }
  };

  const fetchDetails = async () => {
    try {
      const response = await axios.get(
        `${BASEURL_Val}/gp-surveys/${id}` 
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


 
   if (loading) {
    return(
      <LoadingPage/>
    )
   }
 
   if (error) {
    return(
      <ErrorPage error={error}/>

    )
   }

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
      <div className="relative group cursor-pointer" onClick={() => setZoomImage(src)}>
        <div className="w-full h-48 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={src}
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

 const MultiImageDisplay = ({ photos, title }: { photos: string; title: string }) => {
    let photoArray: string[] = [];
    
    try {
      const parsed = JSON.parse(photos);
      photoArray = Array.isArray(parsed) ? parsed : [parsed];
    } catch (err) {
      photoArray = [photos];
    }

    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          {title}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {photoArray.map((photoUrl, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
              onClick={() => setZoomImage(`${baseUrl}/${photoUrl}`)}
            >
              <div className="w-full h-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <img
                  src={`${baseUrl}/${photoUrl}`}
                  alt={`${title} ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white p-2 rounded-full shadow-lg">
                  <ImageIcon className="h-3 w-3 text-gray-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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


  const viewOnly = hasViewOnlyAccess();
  
  if (!detail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No data available.</p>
        </div>
      </div>
    );
  }

  let roofSeepageImages: string[] = [];
  try {
    roofSeepageImages = detail.roofSeepagePhoto ? JSON.parse(detail.roofSeepagePhoto).map((path: string) => `${baseUrl}${path}`) : [];
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
  
     <div className="min-h-screen">
        <ToastContainer />

        <div className="container mx-auto px-1">
          {/* Header */}
          <Header activeTab="gpview" BackBut={true}/>
           {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8 mt-3">
            {/* Location Details */}
            <InfoCard title="Location Details" icon={MapPin}>
              <div className="space-y-1">
                <DataRow label="State" value={detail.state_name} />
                <DataRow label="District" value={detail.district_name} />
                <DataRow label="Block" value={detail.block_name} />
                <DataRow label="GP Name" value={detail.gp_name} />
                <DataRow label="Coordinates" value={detail.gpCoordinates} />
              </div>
              
              {detail.gpLayoutPhoto && (
                <MultiImageDisplay photos={detail.gpLayoutPhoto} title="GP Layout Photos" />
              )}
              
              {detail.gpEntirePhoto && (
                <ImageDisplay 
                  src={`${baseUrl}${detail.gpEntirePhoto}`} 
                  alt="GP Entire Photo" 
                  title="GP Entire Photo" 
                />
              )}
            </InfoCard>

            {/* Building Information */}
            <InfoCard title="Building Information" icon={Building2}>
              <div className="space-y-1 mb-4">
                <DataRow label="Building Type" value={detail.gpBuildingType} />
                <DataRow label="House Type" value={detail.gpHouseType} />
                <DataRow label="Building Height (ft)" value={detail.gpBuildingHeight} />
                <DataRow label="Flooring Type" value={detail.flooring} />
                <DataRow label="Space Available For Phase-3" value={detail.gpSpaceAvailableForPhase3} />
                <DataRow label="Ceiling Type" value={detail.ceilingType} />
                <DataRow label="Ceiling Height (ft)" value={detail.ceilingHeight} />
                <DataRow label="No of GP Floors" value={detail.gpNoFloors} />
                <DataRow label="Room Space (Sq Ft)" value={detail.roomSpace} />
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Solar Installation Details
                </h3>
                <div className="space-y-1">
                  <DataRow label="Solar Installation Possibility" value={detail.solarInstallationPossibility} />
                  <DataRow label="Space for Solar Panel (SQ FT)" value={detail.solarPanelSpaceSize} />
                  <DataRow label="Vegetation Clearness" value={detail.solarPanelVegetation} />
                  <DataRow label="Roof Seepage" value={detail.roofSeepage} />
                </div>
              </div>

              {roofSeepageImages.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Roof Seepage Photos
                  </h3>
                  {roofSeepageImages.length === 1 ? (
                    <div className="relative group cursor-pointer" onClick={() => setZoomImage(roofSeepageImages[0])}>
                      <div className="w-full h-48 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                          src={roofSeepageImages[0]}
                          alt="Roof Seepage Photo"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <div className="w-full h-48 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                          src={roofSeepageImages[0]}
                          alt="Roof Seepage Photo"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                        +{roofSeepageImages.length - 1} more
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detail.roomSpacePhoto && (
                <ImageDisplay 
                  src={`${baseUrl}${detail.roomSpacePhoto}`} 
                  alt="Room Space Photo" 
                  title="Room Space Photo" 
                />
              )}
            </InfoCard>

            {/* GP Photo */}
            {detail.gpPhotos && (
              <InfoCard title="GP Photo" icon={ImageIcon}>
                <div className="relative group cursor-pointer" onClick={() => setZoomImage(`${baseUrl}${detail.gpPhotos}`)}>
                  <div className="w-full h-64 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                    <img
                      src={`${baseUrl}${detail.gpPhotos}`}
                      alt="GP Photo"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-lg flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white p-2 rounded-full shadow-lg">
                      <ImageIcon className="h-4 w-4 text-gray-600" />
                    </div>
                  </div>
                </div>
              </InfoCard>
            )}

            {/* Electrical Details */}
            <InfoCard title="Electrical Details" icon={Zap}>
              <div className="space-y-1">
                <DataRow label="EB Meter" value={detail.ebMeter} />
                <DataRow label="Load Capacity (KW)" value={detail.loadCapacity} />
                <DataRow label="Power Non Availability (hrs/day)" value={detail.powerNonAvailableForPerDayHours} />
                <DataRow label="Meter to Rack Cable (Mtrs)" value={detail.meterToRackCableRequired} />
                <DataRow label="Rack to Solar Cable (Mtrs)" value={detail.rackToSolarCableRequired} />
                <DataRow label="Rack to Earth Pit Cable (Mtrs)" value={detail.rackToEarthPitCableRequired} />
                <DataRow label="Pole Coordinates" value={detail.poleCoordinates} />
                <DataRow label="Earth Pit Coordinates" value={detail.earthPitCoordinates} />
              </div>

              {detail.polePhoto && (
                <ImageDisplay 
                  src={`${baseUrl}${detail.polePhoto}`} 
                  alt="Pole Space Photo" 
                  title="Pole Space Photo" 
                />
              )}
              
              {detail.earthPitPhoto && (
                <ImageDisplay 
                  src={`${baseUrl}${detail.earthPitPhoto}`} 
                  alt="Earth Pit Space Photo" 
                  title="Earth Pit Space Photo" 
                />
              )}
            </InfoCard>

            {/* Existing Inventory */}
            <InfoCard title="Existing Inventory" icon={Server}>
              <div className="space-y-1">
                <DataRow label="Rack" value={detail.rack} />
                <DataRow label="Rack Count" value={detail.rackCount} />
                <DataRow label="Splitter Count" value={detail.splitterCount} />
                <DataRow label="UPS Make" value={detail.upsMake} />
                <DataRow label="UPS Capacity" value={detail.upsCapacity} />
                <DataRow label="FTB Count" value={detail.ftb} />
                <DataRow label="ONT Count" value={detail.ont} />
              </div>

              {detail.equipmentPhoto && (
                <ImageDisplay 
                  src={`${baseUrl}${detail.equipmentPhoto}`} 
                  alt="Equipment Photo" 
                  title="Equipment Photo" 
                />
              )}
            </InfoCard>

            {/* Contact Information */}
            <InfoCard title="Contact Information" icon={Phone}>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Primary Contact</h4>
                  <div className="space-y-1">
                    <DataRow label="Name" value={detail.personName} />
                    <DataRow label="Number" value={detail.personNumber} />
                    <DataRow label="Email" value={detail.personEmail} />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Key Person</h4>
                  <div className="space-y-1">
                    <DataRow label="Name" value={detail.keyPersonName} />
                    <DataRow label="Number" value={detail.keyPersonNumber} />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Engineer Details</h4>
                  <div className="space-y-1">
                    <DataRow label="Name" value={detail.engPersonName} />
                    <DataRow label="Number" value={detail.engPersonNumber} />
                    <DataRow label="Company" value={detail.engPersonCompany} />
                    <DataRow label="Email" value={detail.engPersonEmail} />
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
        </div>
      </div>

      {/* Image Slider Modal */}
      {roofSeepageImages.length > 1 && (
        <ImageSliderModal 
          images={roofSeepageImages} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
};


export default GpDetailView;
