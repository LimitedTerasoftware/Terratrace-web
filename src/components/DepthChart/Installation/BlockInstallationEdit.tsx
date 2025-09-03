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

interface BlockInstallationData {
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
  created_at: string;
  updated_at: string;
}

interface SmartRackItem {
  make: string;
  type: string;
  photo: string;
  serial_no: string;
}

const BASEURL = import.meta.env.VITE_TraceAPI_URL;

const BlockInstallationEdit = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [installationData, setInstallationData] = useState<BlockInstallationData | null>(null);
  
  // Form state
  const [smartRack, setSmartRack] = useState<SmartRackItem[]>([]);
  
  const { id } = useParams();
  const navigate = useNavigate();

  const fetchInstallationData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASEURL}/get-block-installation`);
      
      if (response.data.status && response.data.data) {
        const foundRecord = response.data.data.find((item: BlockInstallationData) => item.id.toString() === id);
        
        if (foundRecord) {
          setInstallationData(foundRecord);
          
          // Parse existing smart rack data
          if (foundRecord.smart_rack) {
            try {
              let parsedSmartRack;
              if (typeof foundRecord.smart_rack === 'string') {
                parsedSmartRack = JSON.parse(foundRecord.smart_rack);
              } else {
                parsedSmartRack = foundRecord.smart_rack;
              }
              setSmartRack(Array.isArray(parsedSmartRack) ? parsedSmartRack : [parsedSmartRack]);
            } catch (e) {
              setSmartRack([]);
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
    setSmartRack([...smartRack, { make: '', type: '', photo: '', serial_no: '' }]);
  };

  const removeSmartRackItem = (index: number) => {
    const updatedSmartRack = smartRack.filter((_, i) => i !== index);
    setSmartRack(updatedSmartRack);
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
          item.make || item.type || item.photo || item.serial_no
        );
      }

      const response = await axios.put(`${BASEURL}/update-block-installation`, updatePayload);
      
      if (response.data.status) {
        toast.success("Block installation updated successfully!");
        setTimeout(() => {
          navigate(`/installation/block-detail/${id}`);
        }, 1500);
      } else {
        toast.error("Failed to update block installation");
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || "Failed to update block installation");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/installation/block-detail/${id}`);
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
                <h2 className="text-xl font-semibold text-gray-900">Edit Block Installation</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {installationData?.block_name} - {installationData?.state_code}, {installationData?.district_code}
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
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p>No smart rack items configured. Click "Add Item" to add equipment.</p>
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
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <input
                            type="text"
                            value={item.type}
                            onChange={(e) => handleSmartRackChange(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Type-A"
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

            {/* Information Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Block Installation Information</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Block Name:</strong> {installationData?.block_name}</p>
                  <p><strong>Location:</strong> {installationData?.state_code}, {installationData?.district_code}</p>
                  <p><strong>Coordinates:</strong> {installationData?.block_latitude}, {installationData?.block_longitude}</p>
                  <p><strong>Last Updated:</strong> {installationData?.updated_at ? new Date(installationData.updated_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">Important Notes</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Only smart rack equipment can be edited through this interface</li>
                    <li>• Changes will be immediately reflected in the installation record</li>
                    <li>• Make sure all equipment details are accurate before saving</li>
                    <li>• Photo URLs should be accessible and point to valid images</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockInstallationEdit;