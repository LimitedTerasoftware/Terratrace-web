import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { hasViewOnlyAccess } from "../../../utils/accessControl";
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
  Server,
  Cable,
  Users,
  Settings
} from "lucide-react";
import { ErrorPage, LoadingPage } from "../../hooks/useActivities";
import { Header } from "../../Breadcrumbs/Header";

interface BlockInstallationDetail {
  id: number;
  user_id: number;
  state_code: string;
  district_code: string;
  block_code: string;
  block_name: string;
  block_latitude: string;
  block_longitude: string;
  block_photos: string[];
  smart_rack: any;
  fdms_shelf: any;
  ip_mpls_router: any;
  sfp_10g: string[];
  sfp_1g: string[];
  sfp_100g: string[];
  rfms: any;
  equipment_photo: string[];
  block_contacts: any;
  status?: string;
  created_at: string;
  updated_at: string;
  state_name?: string;
  district_name?: string;
}

const BASEURL = import.meta.env.VITE_TraceAPI_URL;
const baseUrl = import.meta.env.VITE_Image_URL;

const BlockInstallationDetailView = () => {
  const [detail, setDetail] = useState<BlockInstallationDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const { id } = useParams();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDetails = async () => {
    try {
      const response = await axios.get(`${BASEURL}/get-block-installation`);
      if (response.data.status && response.data.data) {
        const foundRecord = response.data.data.find((item: BlockInstallationDetail) => item.id.toString() === id);
        if (foundRecord) {
          setDetail(foundRecord);
        } else {
          setError('Installation record not found');
        }
      } else {
        setError('No installation data found');
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch installation data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this installation record?")) return;
    try {
      setActionLoading('delete');
      await axios.delete(`${BASEURL}/block-installation/${id}`);
      toast.success("Installation record deleted successfully.");
      window.history.back();
    } catch (error) {
      toast.error("Failed to delete installation record.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = async () => {
    navigate(`/installation/block-edit/${id}`);
  };

  const handleStatusUpdate = async (status: 'ACCEPT' | 'REJECT') => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this installation?`)) return;
    
    try {
      setActionLoading(status.toLowerCase());
      
      const response = await axios.post(`${BASEURL}/update-status`, {
        type: "block-installation",
        id: id,
        status: status
      });

      if (response.data.status) {
        toast.success(`Installation ${status.toLowerCase()}ed successfully.`);
        
        // Update local state to reflect the new status
        if (detail) {
          setDetail({
            ...detail,
            status: status
          });
        }
        
        // Optionally refresh the data
        await fetchDetails();
      } else {
        toast.error(response.data.message || `Failed to ${status.toLowerCase()} installation.`);
      }
    } catch (error: any) {
      console.error(`Error ${status.toLowerCase()}ing installation:`, error);
      toast.error(error.response?.data?.message || `Failed to ${status.toLowerCase()} installation.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = () => handleStatusUpdate('ACCEPT');
  const handleReject = () => handleStatusUpdate('REJECT');

  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage error={error} />;
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

  const MultiImageDisplay = ({ photos, title }: { photos: string[] | string; title: string }) => {
    let photoArray: string[] = [];
    
    if (Array.isArray(photos)) {
      photoArray = photos;
    } else {
      try {
        const parsed = JSON.parse(photos);
        photoArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err) {
        photoArray = [photos];
      }
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
              onClick={() => setZoomImage(`${baseUrl}${photoUrl}`)}
            >
              <div className="w-full h-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <img
                  src={`${baseUrl}${photoUrl}`}
                  alt={`${title} ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
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

  const EquipmentDetails = ({ equipmentData, title }: { equipmentData: any; title: string }) => {
    if (!equipmentData) return null;

    let data: any = equipmentData;
    if (typeof equipmentData === 'string') {
      try {
        data = JSON.parse(equipmentData);
      } catch {
        return null;
      }
    }

    const renderValue = (key: string, value: any) => {
      // Check if the value looks like an image URL
      if (typeof value === 'string' && (
        value.includes('.jpg') || 
        value.includes('.jpeg') || 
        value.includes('.png') || 
        value.includes('.gif') ||
        value.startsWith('http') && (value.includes('photo') || value.includes('image'))
      )) {
        return (
          <div className="mt-2">
            <div className="relative group cursor-pointer" onClick={() => setZoomImage(value.startsWith('http') ? value : `${baseUrl}${value}`)}>
              <div className="w-24 h-24 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <img
                  src={value.startsWith('http') ? value : `${baseUrl}${value}`}
                  alt={`${key} image`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        );
      }
      return <span className="font-medium">{value || 'N/A'}</span>;
    };

    return (
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">{title}</h4>
        {Array.isArray(data) ? (
          data.map((item: any, index: number) => (
            <div key={index} className="bg-gray-50 p-3 rounded mb-2">
              {typeof item === 'object' ? Object.entries(item).map(([key, value]) => (
                <div key={key} className="flex justify-between items-start text-sm mb-2 last:mb-0">
                  <span className="text-gray-600 capitalize font-medium">{key.replace(/_/g, ' ')}:</span>
                  <div className="text-right">
                    {renderValue(key, value)}
                  </div>
                </div>
              )) : (
                <div className="text-sm">
                  <span className="font-medium">{item}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-gray-50 p-3 rounded">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between items-start text-sm mb-2 last:mb-0">
                <span className="text-gray-600 capitalize font-medium">{key.replace(/_/g, ' ')}:</span>
                <div className="text-right">
                  {renderValue(key, value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ActionButton = ({ 
    onClick, 
    icon: Icon, 
    label, 
    variant = 'primary',
    loading = false,
    disabled = false
  }: {
    onClick: () => void;
    icon: any;
    label: string;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
    loading?: boolean;
    disabled?: boolean;
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
        disabled={loading || disabled}
        className={`${variants[variant]} px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
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
          <p className="text-gray-600">No installation data available.</p>
        </div>
      </div>
    );
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
          <Header activeTab="installation" BackBut={true} />
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8 mt-3">
            {/* Location Details */}
            <InfoCard title="Location Details" icon={MapPin}>
              <div className="space-y-1">
                {detail.state_name && <DataRow label="State" value={detail.state_name} />}
                {detail.district_name && <DataRow label="District" value={detail.district_name} />}
                <DataRow label="State Code" value={detail.state_code} />
                <DataRow label="District Code" value={detail.district_code} />
                <DataRow label="Block Code" value={detail.block_code} />
                <DataRow label="Block Name" value={detail.block_name} />
                <DataRow label="Latitude" value={detail.block_latitude} />
                <DataRow label="Longitude" value={detail.block_longitude} />
              </div>
              
              {detail.block_photos && detail.block_photos.length > 0 && (
                <MultiImageDisplay photos={detail.block_photos} title="Block Photos" />
              )}
            </InfoCard>

            {/* Equipment Information */}
            <InfoCard title="Equipment Information" icon={Server}>
              <div className="space-y-4">
                {detail.smart_rack && (
                  <EquipmentDetails equipmentData={detail.smart_rack} title="Smart Rack" />
                )}
                {detail.fdms_shelf && (
                  <EquipmentDetails equipmentData={detail.fdms_shelf} title="FDMS Shelf" />
                )}
                {detail.ip_mpls_router && (
                  <EquipmentDetails equipmentData={detail.ip_mpls_router} title="IP MPLS Router" />
                )}
                {detail.rfms && (
                  <EquipmentDetails equipmentData={detail.rfms} title="RFMS" />
                )}
              </div>

              {detail.equipment_photo && detail.equipment_photo.length > 0 && (
                <MultiImageDisplay photos={detail.equipment_photo} title="Equipment Photos" />
              )}
            </InfoCard>

            {/* Network Components */}
            <InfoCard title="Network Components" icon={Cable}>
              <div className="space-y-4">
                {detail.sfp_10g && detail.sfp_10g.length > 0 && (
                  <EquipmentDetails equipmentData={detail.sfp_10g} title="SFP 10G" />
                )}
                {detail.sfp_1g && detail.sfp_1g.length > 0 && (
                  <EquipmentDetails equipmentData={detail.sfp_1g} title="SFP 1G" />
                )}
                {detail.sfp_100g && detail.sfp_100g.length > 0 && (
                  <EquipmentDetails equipmentData={detail.sfp_100g} title="SFP 100G" />
                )}
              </div>
            </InfoCard>

            {/* Contact Information */}
            <InfoCard title="Contact Information" icon={Phone}>
              <div className="space-y-4">
                {detail.block_contacts && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Block Contacts</h4>
                    <EquipmentDetails equipmentData={detail.block_contacts} title="" />
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Installation Details */}
            <InfoCard title="Installation Details" icon={Settings}>
              <div className="space-y-1">
                {detail.status && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-600 font-medium">Status</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      detail.status === 'ACCEPT' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : detail.status === 'REJECT'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {detail.status === 'ACCEPT' ? 'Accepted' : detail.status === 'REJECT' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>
                )}
                <DataRow label="Installation ID" value={detail.id.toString()} />
                <DataRow label="Created At" value={new Date(detail.created_at).toLocaleString()} />
                <DataRow label="Updated At" value={new Date(detail.updated_at).toLocaleString()} />
                <DataRow label="User ID" value={detail.user_id.toString()} />
              </div>
            </InfoCard>
          </div>

          {/* Action Buttons */}
          {!viewOnly && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              
              {/* Current Status Display */}
              {detail.status && (
                <div className="mb-4 p-3 rounded-lg bg-gray-50 text-center">
                  <span className="text-sm text-gray-600">Current Status: </span>
                  <span className={`font-semibold ${
                    detail.status === 'ACCEPT' ? 'text-green-600' : 
                    detail.status === 'REJECT' ? 'text-red-600' : 
                    'text-yellow-600'
                  }`}>
                    {detail.status === 'ACCEPT' ? 'Accepted' : detail.status === 'REJECT' ? 'Rejected' : 'Pending'}
                  </span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-4 justify-center">
                {/* Accept Button */}
                <ActionButton
                  onClick={handleAccept}
                  icon={Check}
                  label={detail.status === 'ACCEPT' ? 'Accepted' : 'Accept Installation'}
                  variant="success"
                  loading={actionLoading === 'accept'}
                  disabled={detail.status === 'ACCEPT'}
                />
                
                {/* Reject Button */}
                <ActionButton
                  onClick={handleReject}
                  icon={X}
                  label={detail.status === 'REJECT' ? 'Rejected' : 'Reject Installation'}
                  variant="danger"
                  loading={actionLoading === 'reject'}
                  disabled={detail.status === 'REJECT'}
                />
                
                {/* Edit Button */}
                <ActionButton
                  onClick={handleEdit}
                  icon={Edit3}
                  label="Edit Installation"
                  variant="primary"
                />
                
                {/* Delete Button */}
                <ActionButton
                  onClick={handleDelete}
                  icon={Trash2}
                  label="Delete Installation"
                  variant="danger"
                  loading={actionLoading === 'delete'}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BlockInstallationDetailView;