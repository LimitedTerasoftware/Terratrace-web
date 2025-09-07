import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { 
  ArrowLeft, 
  Save, 
  X, 
  Plus, 
  Trash2,
  Loader2,
  AlertCircle,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { Header } from "../../Breadcrumbs/Header";

interface GPInstallationData {
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

interface SmartRackItem {
  type: string;
  photo: string;
  make: string;
  serial_no: string;
}

interface EquipmentItem {
  make: string;
  type: string;
  model: string;
  serial_no: string;
  photo: string;
}

interface PowerSystemItem {
  type: string;
  make: string;
  model: string;
  capacity: string;
  voltage: string;
  photo: string;
  serial_no: string;
}

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  designation: string;
}

interface SFPItem {
  type: string;
  make: string;
  model: string;
  serial_no: string;
  port_count: string;
}

const BASEURL = import.meta.env.VITE_TraceAPI_URL;

const GPInstallationEdit = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [installationData, setInstallationData] = useState<GPInstallationData | null>(null);
  
  // Form state - Basic Information
  const [stateCode, setStateCode] = useState<string>('');
  const [districtCode, setDistrictCode] = useState<string>('');
  const [blockCode, setBlockCode] = useState<string>('');
  const [gpCode, setGpCode] = useState<string>('');
  const [gpName, setGpName] = useState<string>('');
  const [gpLatitude, setGpLatitude] = useState<string>('');
  const [gpLongitude, setGpLongitude] = useState<string>('');
  const [gpPhotos, setGpPhotos] = useState<string[]>([]);
  
  // Equipment State
  const [smartRack, setSmartRack] = useState<SmartRackItem[]>([]);
  const [fdmsShelf, setFdmsShelf] = useState<EquipmentItem[]>([]);
  const [ipMplsRouter, setIpMplsRouter] = useState<EquipmentItem[]>([]);
  const [sfp10g, setSfp10g] = useState<SFPItem[]>([]);
  const [sfp1g, setSfp1g] = useState<SFPItem[]>([]);
  const [equipmentPhotos, setEquipmentPhotos] = useState<string[]>([]);
  
  // Power Systems
  const [powerSystemWithMppt, setPowerSystemWithMppt] = useState<PowerSystemItem[]>([]);
  const [powerSystemWithoutMppt, setPowerSystemWithoutMppt] = useState<PowerSystemItem[]>([]);
  const [mpptSolar1kw, setMpptSolar1kw] = useState<PowerSystemItem[]>([]);
  const [electricityMeter, setElectricityMeter] = useState<EquipmentItem[]>([]);
  const [earthpit, setEarthpit] = useState<EquipmentItem[]>([]);
  
  // Contact Information
  const [gpContact, setGpContact] = useState<ContactInfo>({
    name: '',
    phone: '',
    email: '',
    designation: ''
  });
  const [keyPerson, setKeyPerson] = useState<ContactInfo>({
    name: '',
    phone: '',
    email: '',
    designation: ''
  });
  
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchInstallationData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASEURL}/get-gp-installation`);
      
      if (response.data.status && response.data.data) {
        const foundRecord = response.data.data.find((item: GPInstallationData) => item.id.toString() === id);
        
        if (foundRecord) {
          setInstallationData(foundRecord);
          
          // Set basic information
          setStateCode(foundRecord.state_code);
          setDistrictCode(foundRecord.district_code);
          setBlockCode(foundRecord.block_code);
          setGpCode(foundRecord.gp_code);
          setGpName(foundRecord.gp_name);
          setGpLatitude(foundRecord.gp_latitude);
          setGpLongitude(foundRecord.gp_longitude);
          
          // Parse photos
          if (foundRecord.gp_photos) {
            try {
              const parsed = JSON.parse(foundRecord.gp_photos);
              setGpPhotos(Array.isArray(parsed) ? parsed : [parsed]);
            } catch {
              setGpPhotos([]);
            }
          }
          
          if (foundRecord.equipment_photo) {
            try {
              const parsed = JSON.parse(foundRecord.equipment_photo);
              setEquipmentPhotos(Array.isArray(parsed) ? parsed : [parsed]);
            } catch {
              setEquipmentPhotos([]);
            }
          }
          
          // Parse and set equipment data
          parseAndSetEquipmentData(foundRecord);
        } else {
          setError('Installation record not found');
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch installation data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseAndSetEquipmentData = (data: GPInstallationData) => {
    try {
      // Smart Rack
      if (data.smart_rack) {
        const parsed = JSON.parse(data.smart_rack);
        setSmartRack(Array.isArray(parsed) ? parsed : [parsed]);
      }
      
      // FDMS Shelf
      if (data.fdms_shelf) {
        const parsed = JSON.parse(data.fdms_shelf);
        setFdmsShelf(Array.isArray(parsed) ? parsed : [parsed]);
      }
      
      // IP MPLS Router
      if (data.ip_mpls_router) {
        const parsed = JSON.parse(data.ip_mpls_router);
        setIpMplsRouter(Array.isArray(parsed) ? parsed : [parsed]);
      }
      
      // SFP Items
      if (data.sfp_10g) {
        const parsed = JSON.parse(data.sfp_10g);
        setSfp10g(Array.isArray(parsed) ? parsed : [parsed]);
      }
      
      if (data.sfp_1g) {
        const parsed = JSON.parse(data.sfp_1g);
        setSfp1g(Array.isArray(parsed) ? parsed : [parsed]);
      }
      
      // Power Systems
      if (data.power_system_with_mppt) {
        const parsed = JSON.parse(data.power_system_with_mppt);
        setPowerSystemWithMppt(Array.isArray(parsed) ? parsed : [parsed]);
      }
      
      if (data.power_system_with_out_mppt) {
        const parsed = JSON.parse(data.power_system_with_out_mppt);
        setPowerSystemWithoutMppt(Array.isArray(parsed) ? parsed : [parsed]);
      }
      
      if (data.mppt_solar_1kw) {
        const parsed = JSON.parse(data.mppt_solar_1kw);
        setMpptSolar1kw(Array.isArray(parsed) ? parsed : [parsed]);
      }
      
      if (data.electricity_meter) {
        const parsed = JSON.parse(data.electricity_meter);
        setElectricityMeter(Array.isArray(parsed) ? parsed : [parsed]);
      }
      
      if (data.earthpit) {
        const parsed = JSON.parse(data.earthpit);
        setEarthpit(Array.isArray(parsed) ? parsed : [parsed]);
      }
      
      // Contacts
      if (data.gp_contact) {
        const parsed = JSON.parse(data.gp_contact);
        setGpContact(parsed);
      }
      
      if (data.key_person) {
        const parsed = JSON.parse(data.key_person);
        setKeyPerson(parsed);
      }
      
    } catch (e) {
      console.error('Error parsing equipment data:', e);
    }
  };

  useEffect(() => {
    fetchInstallationData();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updatePayload = {
        id: parseInt(id || '0'),
        state_code: stateCode,
        district_code: districtCode,
        block_code: blockCode,
        gp_code: gpCode,
        gp_name: gpName,
        gp_latitude: gpLatitude,
        gp_longitude: gpLongitude,
        gp_photos: gpPhotos.filter(photo => photo.trim()),
        smart_rack: smartRack.filter(item => item.make || item.type || item.serial_no),
        fdms_shelf: fdmsShelf.filter(item => item.make || item.type || item.model),
        ip_mpls_router: ipMplsRouter.filter(item => item.make || item.type || item.model),
        sfp_10g: sfp10g.filter(item => item.type || item.make || item.model),
        sfp_1g: sfp1g.filter(item => item.type || item.make || item.model),
        power_system_with_mppt: powerSystemWithMppt.filter(item => item.make || item.type || item.model),
        power_system_with_out_mppt: powerSystemWithoutMppt.filter(item => item.make || item.type || item.model),
        mppt_solar_1kw: mpptSolar1kw.filter(item => item.make || item.type || item.model),
        equipment_photo: equipmentPhotos.filter(photo => photo.trim()),
        electricity_meter: electricityMeter.filter(item => item.make || item.type || item.model),
        earthpit: earthpit.filter(item => item.make || item.type || item.model),
        gp_contact: gpContact.name || gpContact.phone ? gpContact : null,
        key_person: keyPerson.name || keyPerson.phone ? keyPerson : null
      };

      // Changed from PUT to POST
      const response = await axios.post(`${BASEURL}/update-gp-installation`, updatePayload);
      
      if (response.data.status) {
        toast.success("GP installation updated successfully!");
        setTimeout(() => {
          navigate(`/installation/gp-detail/${id}`);
        }, 1500);
      } else {
        toast.error("Failed to update GP installation");
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || "Failed to update GP installation");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/installation/gp-detail/${id}`);
  };

  // Generic handlers for different equipment types
  const handleSmartRackChange = (index: number, field: keyof SmartRackItem, value: string) => {
    const updated = [...smartRack];
    updated[index] = { ...updated[index], [field]: value };
    setSmartRack(updated);
  };

  const handleEquipmentChange = (
    type: 'fdms' | 'router' | 'electricity' | 'earthpit',
    index: number, 
    field: keyof EquipmentItem, 
    value: string
  ) => {
    if (type === 'fdms') {
      const updated = [...fdmsShelf];
      updated[index] = { ...updated[index], [field]: value };
      setFdmsShelf(updated);
    } else if (type === 'router') {
      const updated = [...ipMplsRouter];
      updated[index] = { ...updated[index], [field]: value };
      setIpMplsRouter(updated);
    } else if (type === 'electricity') {
      const updated = [...electricityMeter];
      updated[index] = { ...updated[index], [field]: value };
      setElectricityMeter(updated);
    } else if (type === 'earthpit') {
      const updated = [...earthpit];
      updated[index] = { ...updated[index], [field]: value };
      setEarthpit(updated);
    }
  };

  const handlePowerSystemChange = (
    type: 'with_mppt' | 'without_mppt' | 'solar_1kw',
    index: number,
    field: keyof PowerSystemItem,
    value: string
  ) => {
    if (type === 'with_mppt') {
      const updated = [...powerSystemWithMppt];
      updated[index] = { ...updated[index], [field]: value };
      setPowerSystemWithMppt(updated);
    } else if (type === 'without_mppt') {
      const updated = [...powerSystemWithoutMppt];
      updated[index] = { ...updated[index], [field]: value };
      setPowerSystemWithoutMppt(updated);
    } else if (type === 'solar_1kw') {
      const updated = [...mpptSolar1kw];
      updated[index] = { ...updated[index], [field]: value };
      setMpptSolar1kw(updated);
    }
  };

  const handleSFPChange = (
    type: '10g' | '1g',
    index: number,
    field: keyof SFPItem,
    value: string
  ) => {
    if (type === '10g') {
      const updated = [...sfp10g];
      updated[index] = { ...updated[index], [field]: value };
      setSfp10g(updated);
    } else if (type === '1g') {
      const updated = [...sfp1g];
      updated[index] = { ...updated[index], [field]: value };
      setSfp1g(updated);
    }
  };

  const handleContactChange = (type: 'gp' | 'key', field: keyof ContactInfo, value: string) => {
    if (type === 'gp') {
      setGpContact(prev => ({ ...prev, [field]: value }));
    } else {
      setKeyPerson(prev => ({ ...prev, [field]: value }));
    }
  };

  // Add/Remove handlers
  const addSmartRackItem = () => {
    setSmartRack([...smartRack, { type: '', photo: '', make: '', serial_no: '' }]);
  };

  const removeSmartRackItem = (index: number) => {
    setSmartRack(smartRack.filter((_, i) => i !== index));
  };

  const addEquipmentItem = (type: 'fdms' | 'router' | 'electricity' | 'earthpit') => {
    const newItem = { make: '', type: '', model: '', serial_no: '', photo: '' };
    if (type === 'fdms') {
      setFdmsShelf([...fdmsShelf, newItem]);
    } else if (type === 'router') {
      setIpMplsRouter([...ipMplsRouter, newItem]);
    } else if (type === 'electricity') {
      setElectricityMeter([...electricityMeter, newItem]);
    } else if (type === 'earthpit') {
      setEarthpit([...earthpit, newItem]);
    }
  };

  const removeEquipmentItem = (type: 'fdms' | 'router' | 'electricity' | 'earthpit', index: number) => {
    if (type === 'fdms') {
      setFdmsShelf(fdmsShelf.filter((_, i) => i !== index));
    } else if (type === 'router') {
      setIpMplsRouter(ipMplsRouter.filter((_, i) => i !== index));
    } else if (type === 'electricity') {
      setElectricityMeter(electricityMeter.filter((_, i) => i !== index));
    } else if (type === 'earthpit') {
      setEarthpit(earthpit.filter((_, i) => i !== index));
    }
  };

  const addPowerSystemItem = (type: 'with_mppt' | 'without_mppt' | 'solar_1kw') => {
    const newItem = { type: '', make: '', model: '', capacity: '', voltage: '', photo: '', serial_no: '' };
    if (type === 'with_mppt') {
      setPowerSystemWithMppt([...powerSystemWithMppt, newItem]);
    } else if (type === 'without_mppt') {
      setPowerSystemWithoutMppt([...powerSystemWithoutMppt, newItem]);
    } else if (type === 'solar_1kw') {
      setMpptSolar1kw([...mpptSolar1kw, newItem]);
    }
  };

  const removePowerSystemItem = (type: 'with_mppt' | 'without_mppt' | 'solar_1kw', index: number) => {
    if (type === 'with_mppt') {
      setPowerSystemWithMppt(powerSystemWithMppt.filter((_, i) => i !== index));
    } else if (type === 'without_mppt') {
      setPowerSystemWithoutMppt(powerSystemWithoutMppt.filter((_, i) => i !== index));
    } else if (type === 'solar_1kw') {
      setMpptSolar1kw(mpptSolar1kw.filter((_, i) => i !== index));
    }
  };

  const addSFPItem = (type: '10g' | '1g') => {
    const newItem = { type: '', make: '', model: '', serial_no: '', port_count: '' };
    if (type === '10g') {
      setSfp10g([...sfp10g, newItem]);
    } else if (type === '1g') {
      setSfp1g([...sfp1g, newItem]);
    }
  };

  const removeSFPItem = (type: '10g' | '1g', index: number) => {
    if (type === '10g') {
      setSfp10g(sfp10g.filter((_, i) => i !== index));
    } else if (type === '1g') {
      setSfp1g(sfp1g.filter((_, i) => i !== index));
    }
  };

  const handlePhotoAdd = (type: 'gp' | 'equipment', url: string) => {
    if (type === 'gp') {
      setGpPhotos([...gpPhotos, url]);
    } else {
      setEquipmentPhotos([...equipmentPhotos, url]);
    }
  };

  const handlePhotoRemove = (type: 'gp' | 'equipment', index: number) => {
    if (type === 'gp') {
      setGpPhotos(gpPhotos.filter((_, i) => i !== index));
    } else {
      setEquipmentPhotos(equipmentPhotos.filter((_, i) => i !== index));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading installation data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/installation')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Installation List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      
      <div className="container mx-auto px-1">
        <Header activeTab="installation" BackBut={true} />
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-3">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit GP Installation</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Complete editing for all GP installation data
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State Code</label>
                  <input
                    type="text"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter state code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District Code</label>
                  <input
                    type="text"
                    value={districtCode}
                    onChange={(e) => setDistrictCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter district code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Block Code</label>
                  <input
                    type="text"
                    value={blockCode}
                    onChange={(e) => setBlockCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter block code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GP Code</label>
                  <input
                    type="text"
                    value={gpCode}
                    onChange={(e) => setGpCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter GP code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GP Name</label>
                  <input
                    type="text"
                    value={gpName}
                    onChange={(e) => setGpName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter GP name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={gpLatitude}
                    onChange={(e) => setGpLatitude(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter latitude"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    value={gpLongitude}
                    onChange={(e) => setGpLongitude(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter longitude"
                  />
                </div>
              </div>
            </div>

            {/* GP Photos Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">GP Photos</h3>
                <button
                  onClick={() => {
                    const url = prompt('Enter photo URL:');
                    if (url) handlePhotoAdd('gp', url);
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Photo
                </button>
              </div>
              
              {gpPhotos.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                  <p>No GP photos added. Click "Add Photo" to add images.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gpPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <input
                          type="url"
                          value={photo}
                          onChange={(e) => {
                            const updated = [...gpPhotos];
                            updated[index] = e.target.value;
                            setGpPhotos(updated);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Photo URL"
                        />
                        <button
                          onClick={() => handlePhotoRemove('gp', index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* GP Contact */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">GP Contact</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={gpContact.name}
                        onChange={(e) => handleContactChange('gp', 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter contact name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={gpContact.phone}
                        onChange={(e) => handleContactChange('gp', 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={gpContact.email}
                        onChange={(e) => handleContactChange('gp', 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <input
                        type="text"
                        value={gpContact.designation}
                        onChange={(e) => handleContactChange('gp', 'designation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter designation"
                      />
                    </div>
                  </div>
                </div>

                {/* Key Person */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Key Person</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={keyPerson.name}
                        onChange={(e) => handleContactChange('key', 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter key person name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={keyPerson.phone}
                        onChange={(e) => handleContactChange('key', 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={keyPerson.email}
                        onChange={(e) => handleContactChange('key', 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email address"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <input
                        type="text"
                        value={keyPerson.designation}
                        onChange={(e) => handleContactChange('key', 'designation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter designation"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Rack Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Smart Rack Equipment</h3>
                <button
                  onClick={addSmartRackItem}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>
              
              {smartRack.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p>No smart rack items configured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {smartRack.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">Smart Rack Item {index + 1}</span>
                        <button
                          onClick={() => removeSmartRackItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <input
                            type="text"
                            value={item.type}
                            onChange={(e) => handleSmartRackChange(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter type"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                          <input
                            type="text"
                            value={item.make}
                            onChange={(e) => handleSmartRackChange(index, 'make', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter make"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                          <input
                            type="text"
                            value={item.serial_no}
                            onChange={(e) => handleSmartRackChange(index, 'serial_no', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter serial number"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                          <input
                            type="url"
                            value={item.photo}
                            onChange={(e) => handleSmartRackChange(index, 'photo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/photo.jpg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Power System with MPPT Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Power System with MPPT</h3>
                <button
                  onClick={() => addPowerSystemItem('with_mppt')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>
              
              {powerSystemWithMppt.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p>No power system with MPPT configured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {powerSystemWithMppt.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">Power System Item {index + 1}</span>
                        <button
                          onClick={() => removePowerSystemItem('with_mppt', index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <input
                            type="text"
                            value={item.type}
                            onChange={(e) => handlePowerSystemChange('with_mppt', index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter type"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                          <input
                            type="text"
                            value={item.make}
                            onChange={(e) => handlePowerSystemChange('with_mppt', index, 'make', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter make"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                          <input
                            type="text"
                            value={item.model}
                            onChange={(e) => handlePowerSystemChange('with_mppt', index, 'model', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter model"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                          <input
                            type="text"
                            value={item.capacity}
                            onChange={(e) => handlePowerSystemChange('with_mppt', index, 'capacity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter capacity"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Voltage</label>
                          <input
                            type="text"
                            value={item.voltage}
                            onChange={(e) => handlePowerSystemChange('with_mppt', index, 'voltage', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter voltage"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                          <input
                            type="text"
                            value={item.serial_no}
                            onChange={(e) => handlePowerSystemChange('with_mppt', index, 'serial_no', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter serial number"
                          />
                        </div>
                        
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                          <input
                            type="url"
                            value={item.photo}
                            onChange={(e) => handlePowerSystemChange('with_mppt', index, 'photo', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/photo.jpg"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Equipment Photos Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Equipment Photos</h3>
                <button
                  onClick={() => {
                    const url = prompt('Enter photo URL:');
                    if (url) handlePhotoAdd('equipment', url);
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Photo
                </button>
              </div>
              
              {equipmentPhotos.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                  <p>No equipment photos added.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {equipmentPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <input
                          type="url"
                          value={photo}
                          onChange={(e) => {
                            const updated = [...equipmentPhotos];
                            updated[index] = e.target.value;
                            setEquipmentPhotos(updated);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Photo URL"
                        />
                        <button
                          onClick={() => handlePhotoRemove('equipment', index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPInstallationEdit;