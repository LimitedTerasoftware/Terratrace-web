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

interface GPInstallationDetail {
  id: number;
  user_id: number;
  state_code: string;
  district_code: string;
  block_code: string;
  gp_code: string;
  gp_name: string;
  gp_latitude: string;
  gp_longitude: string;
  gp_photos: string;
  smart_rack: string;
  fdms_shelf: string;
  ip_mpls_router: string;
  sfp_10g: string;
  sfp_1g: string;
  power_system_with_mppt: string;
  power_system_with_out_mppt: string;
  mppt_solar_1kw: string;
  equipment_photo: string;
  electricity_meter: string;
  earthpit: string;
  gp_contact: string;
  key_person: string;
  created_at: string;
  updated_at: string;
  state_name: string;
  district_name: string;
  block_name: string;
}

const BASEURL = import.meta.env.VITE_TraceAPI_URL;
const baseUrl = import.meta.env.VITE_Image_URL;

const GPInstallationDetailView = () => {
  const [detail, setDetail] = useState<GPInstallationDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const { id } = useParams();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchDetails = async () => {
    try {
      const response = await axios.get(`${BASEURL}/get-gp-installation`);
      if (response.data.status && response.data.data) {
        const foundRecord = response.data.data.find((item: GPInstallationDetail) => item.id.toString() === id);
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
      await axios.delete(`${BASEURL}/gp-installation/${id}`);
      toast.success("Installation record deleted successfully.");
      window.history.back();
    } catch (error) {
      toast.error("Failed to delete installation record.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEdit = async () => {
    navigate(`/installation/gp-edit/${id}`);
  };

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

  const EquipmentDetails = ({ equipmentData, title }: { equipmentData: string; title: string }) => {
    let data: any = null;
    try {
      data = JSON.parse(equipmentData);
    } catch {
      return null;
    }

    if (!data) return null;

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
                <DataRow label="State" value={detail.state_name} />
                <DataRow label="District" value={detail.district_name} />
                <DataRow label="Block" value={detail.block_name} />
                <DataRow label="GP Name" value={detail.gp_name} />
                <DataRow label="GP Code" value={detail.gp_code} />
                <DataRow label="Latitude" value={detail.gp_latitude} />
                <DataRow label="Longitude" value={detail.gp_longitude} />
              </div>
              
              {detail.gp_photos && (
                <MultiImageDisplay photos={detail.gp_photos} title="GP Photos" />
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
              </div>

              {detail.equipment_photo && (
                <MultiImageDisplay photos={detail.equipment_photo} title="Equipment Photos" />
              )}
            </InfoCard>

            {/* Network Components */}
            <InfoCard title="Network Components" icon={Cable}>
              <div className="space-y-4">
                {detail.sfp_10g && (
                  <EquipmentDetails equipmentData={detail.sfp_10g} title="SFP 10G" />
                )}
                {detail.sfp_1g && (
                  <EquipmentDetails equipmentData={detail.sfp_1g} title="SFP 1G" />
                )}
              </div>
            </InfoCard>

            {/* Power Systems */}
            <InfoCard title="Power Systems" icon={Zap}>
              <div className="space-y-4">
                {detail.power_system_with_mppt && (
                  <EquipmentDetails equipmentData={detail.power_system_with_mppt} title="Power System with MPPT" />
                )}
                {detail.power_system_with_out_mppt && (
                  <EquipmentDetails equipmentData={detail.power_system_with_out_mppt} title="Power System without MPPT" />
                )}
                {detail.mppt_solar_1kw && (
                  <EquipmentDetails equipmentData={detail.mppt_solar_1kw} title="MPPT Solar 1KW" />
                )}
                {detail.electricity_meter && (
                  <EquipmentDetails equipmentData={detail.electricity_meter} title="Electricity Meter" />
                )}
                {detail.earthpit && (
                  <EquipmentDetails equipmentData={detail.earthpit} title="Earth Pit" />
                )}
              </div>
            </InfoCard>

            {/* Contact Information */}
            <InfoCard title="Contact Information" icon={Phone}>
              <div className="space-y-4">
                {detail.gp_contact && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">GP Contact</h4>
                    <EquipmentDetails equipmentData={detail.gp_contact} title="" />
                  </div>
                )}
                
                {detail.key_person && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Key Person</h4>
                    <EquipmentDetails equipmentData={detail.key_person} title="" />
                  </div>
                )}
              </div>
            </InfoCard>

            {/* Installation Details */}
            <InfoCard title="Installation Details" icon={Settings}>
              <div className="space-y-1">
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
              <div className="flex flex-wrap gap-4 justify-center">
                <ActionButton
                  onClick={handleEdit}
                  icon={Edit3}
                  label="Edit Installation"
                  variant="primary"
                />
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

export default GPInstallationDetailView;