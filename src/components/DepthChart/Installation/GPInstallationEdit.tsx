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
  AlertCircle
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

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

const BASEURL = import.meta.env.VITE_TraceAPI_URL;

const GPInstallationEdit = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [installationData, setInstallationData] = useState<GPInstallationData | null>(null);
  
  // Form state
  const [smartRack, setSmartRack] = useState<SmartRackItem[]>([]);
  const [gpContact, setGpContact] = useState<ContactInfo>({
    name: '',
    phone: '',
    email: ''
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
          
          // Parse existing data
          if (foundRecord.smart_rack) {
            try {
              const parsedSmartRack = JSON.parse(foundRecord.smart_rack);
              setSmartRack(Array.isArray(parsedSmartRack) ? parsedSmartRack : [parsedSmartRack]);
            } catch (e) {
              setSmartRack([]);
            }
          }
          
          if (foundRecord.gp_contact) {
            try {
              const parsedContact = JSON.parse(foundRecord.gp_contact);
              setGpContact(parsedContact);
            } catch (e) {
              setGpContact({ name: '', phone: '', email: '' });
            }
          }
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

  useEffect(() => {
    fetchInstallationData();
  }, [id]);

  const handleSmartRackChange = (index: number, field: keyof SmartRackItem, value: string) => {
    const updatedSmartRack = [...smartRack];
    updatedSmartRack[index] = { ...updatedSmartRack[index], [field]: value };
    setSmartRack(updatedSmartRack);
  };

  const addSmartRackItem = () => {
    setSmartRack([...smartRack, { type: '', photo: '', make: '', serial_no: '' }]);
  };

  const removeSmartRackItem = (index: number) => {
    const updatedSmartRack = smartRack.filter((_, i) => i !== index);
    setSmartRack(updatedSmartRack);
  };

  const handleContactChange = (field: keyof ContactInfo, value: string) => {
    setGpContact(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updatePayload: any = {
        id: parseInt(id || '0')
      };

      // Add smart_rack if there are items
      if (smartRack.length > 0) {
        updatePayload.smart_rack = smartRack.filter(item => 
          item.type || item.photo || item.make || item.serial_no
        );
      }

      // Add gp_contact if filled
      if (gpContact.name || gpContact.phone || gpContact.email) {
        updatePayload.gp_contact = gpContact;
      }

      const response = await axios.put(`${BASEURL}/update-gp-installation`, updatePayload);
      
      if (response.data.status) {
        toast.success("Installation updated successfully!");
        setTimeout(() => {
          navigate(`/installation/gp-detail/${id}`);
        }, 1500);
      } else {
        toast.error("Failed to update installation");
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || "Failed to update installation");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/installation/gp-detail/${id}`);
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
                  {installationData?.gp_name} - {installationData?.state_name}, {installationData?.district_name}
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
            {/* Smart Rack Section */}
            <div>
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
                <div className="text-center py-8 text-gray-500">
                  <p>No smart rack items configured. Click "Add Item" to add equipment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {smartRack.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">Item {index + 1}</span>
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
                            placeholder="e.g., Type-99"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                          <input
                            type="text"
                            value={item.make}
                            onChange={(e) => handleSmartRackChange(index, 'make', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Cisco"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                          <input
                            type="text"
                            value={item.serial_no}
                            onChange={(e) => handleSmartRackChange(index, 'serial_no', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., SR12345"
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

            {/* GP Contact Section */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GP Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={gpContact.name}
                    onChange={(e) => handleContactChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter contact name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={gpContact.phone}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="9876543210"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={gpContact.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPInstallationEdit;