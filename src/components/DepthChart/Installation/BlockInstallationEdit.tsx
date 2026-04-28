import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { Header } from '../../Breadcrumbs/Header';

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

interface EquipmentItem {
  make: string;
  type: string;
  model: string;
  serial_no: string;
  photo: string;
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
const ImgbaseUrl = import.meta.env.VITE_Image_URL;
const VitBASEURL = import.meta.env.VITE_API_BASE;

const BlockInstallationEdit = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [installationData, setInstallationData] =
    useState<BlockInstallationData | null>(null);

  // Form state - Basic Information
  const [stateCode, setStateCode] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('');
  const [districtCode, setDistrictCode] = useState<string>('');
  const [blockCode, setBlockCode] = useState<string>('');
  const [blockName, setBlockName] = useState<string>('');
  const [blockLatitude, setBlockLatitude] = useState<string>('');
  const [blockLongitude, setBlockLongitude] = useState<string>('');
  const [blockPhotos, setBlockPhotos] = useState<string[]>([]);

  // Equipment State
  const [smartRack, setSmartRack] = useState<SmartRackItem[]>([]);
  const [fdmsShelf, setFdmsShelf] = useState<EquipmentItem[]>([]);
  const [ipMplsRouter, setIpMplsRouter] = useState<EquipmentItem[]>([]);
  const [rfms, setRfms] = useState<EquipmentItem[]>([]);
  const [sfp10g, setSfp10g] = useState<SFPItem[]>([]);
  const [sfp1g, setSfp1g] = useState<SFPItem[]>([]);
  const [sfp100g, setSfp100g] = useState<SFPItem[]>([]);
  const [equipmentPhotos, setEquipmentPhotos] = useState<string[]>([]);

  // Contact Information
  const [blockContacts, setBlockContacts] = useState<ContactInfo[]>([]);

  const { id } = useParams();
  const navigate = useNavigate();

  const blockPhotoFileInput = useRef<HTMLInputElement>(null);
  const equipmentPhotoFileInput = useRef<HTMLInputElement>(null);
  const smartRackFileInput = useRef<HTMLInputElement>(null);
  const fdmsFileInput = useRef<HTMLInputElement>(null);
  const routerFileInput = useRef<HTMLInputElement>(null);
  const [smartRackPhotoIndex, setSmartRackPhotoIndex] = useState<number | null>(
    null,
  );
  const [fdmsPhotoIndex, setFdmsPhotoIndex] = useState<number | null>(null);
  const [routerPhotoIndex, setRouterPhotoIndex] = useState<number | null>(null);

  const isDataUrl = (str: string): boolean => {
    return str.startsWith('data:image/');
  };

  const fetchInstallationData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASEURL}/get-block-installation`);

      if (response.data.status && response.data.data) {
        const foundRecord = response.data.data.find(
          (item: BlockInstallationData) => item.id.toString() === id,
        );

        if (foundRecord) {
          setInstallationData(foundRecord);

          // Set basic information
          setStateCode(foundRecord.state_code);
          setStateName(foundRecord.state_name);
          setDistrictCode(foundRecord.district_code);
          setDistrictName(foundRecord.district_name);
          setBlockCode(foundRecord.block_code);
          setBlockName(foundRecord.block_name);
          setBlockLatitude(foundRecord.block_latitude);
          setBlockLongitude(foundRecord.block_longitude);
          setBlockPhotos(
            Array.isArray(foundRecord.block_photos)
              ? foundRecord.block_photos
              : foundRecord.block_photos
                ? JSON.parse(foundRecord.block_photos)
                : [],
          );
          setEquipmentPhotos(
            Array.isArray(foundRecord.equipment_photo)
              ? foundRecord.equipment_photo
              : foundRecord.equipment_photo
                ? JSON.parse(foundRecord.equipment_photo)
                : [],
          );

          // Parse and set equipment data
          parseAndSetEquipmentData(foundRecord);
        } else {
          setError('Installation record not found');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch installation data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseAndSetEquipmentData = (data: BlockInstallationData) => {
    try {
      // Smart Rack
      if (data.smart_rack) {
        const parsed =
          typeof data.smart_rack === 'string'
            ? JSON.parse(data.smart_rack)
            : data.smart_rack;
        setSmartRack(Array.isArray(parsed) ? parsed : [parsed]);
      }

      // FDMS Shelf
      if (data.fdms_shelf) {
        const parsed =
          typeof data.fdms_shelf === 'string'
            ? JSON.parse(data.fdms_shelf)
            : data.fdms_shelf;
        setFdmsShelf(Array.isArray(parsed) ? parsed : [parsed]);
      }

      // IP MPLS Router
      if (data.ip_mpls_router) {
        const parsed =
          typeof data.ip_mpls_router === 'string'
            ? JSON.parse(data.ip_mpls_router)
            : data.ip_mpls_router;
        setIpMplsRouter(Array.isArray(parsed) ? parsed : [parsed]);
      }

      // RFMS
      if (data.rfms) {
        const parsed =
          typeof data.rfms === 'string' ? JSON.parse(data.rfms) : data.rfms;
        setRfms(Array.isArray(parsed) ? parsed : [parsed]);
      }

      // SFP Items
      if (data.sfp_10g) {
        const parsed =
          typeof data.sfp_10g === 'string'
            ? JSON.parse(data.sfp_10g)
            : data.sfp_10g;
        setSfp10g(Array.isArray(parsed) ? parsed : [parsed]);
      }

      if (data.sfp_1g) {
        const parsed =
          typeof data.sfp_1g === 'string'
            ? JSON.parse(data.sfp_1g)
            : data.sfp_1g;
        setSfp1g(Array.isArray(parsed) ? parsed : [parsed]);
      }

      if (data.sfp_100g) {
        const parsed =
          typeof data.sfp_100g === 'string'
            ? JSON.parse(data.sfp_100g)
            : data.sfp_100g;
        setSfp100g(Array.isArray(parsed) ? parsed : [parsed]);
      }

      // Block Contacts
      if (data.block_contacts) {
        const parsed =
          typeof data.block_contacts === 'string'
            ? JSON.parse(data.block_contacts)
            : data.block_contacts;
        setBlockContacts(Array.isArray(parsed) ? parsed : [parsed]);
      }
    } catch (e) {
      console.error('Error parsing equipment data:', e);
    }
  };

  useEffect(() => {
    fetchInstallationData();
  }, [id]);

  const uploadImagesToServer = async (dataUrls: string[]) => {
    const files: File[] = [];

    for (const dataUrl of dataUrls) {
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const matches = dataUrl.match(/^data:image\/(\w+);base64,/);
        const extension = matches ? matches[1] : 'jpg';
        const fileName = `photo_${Date.now()}_${Math.random()}.${extension}`;
        const file = new File([blob], fileName, { type: `image/${extension}` });
        files.push(file);
      } catch (e) {
        console.error('Error converting data URL to file:', e);
      }
    }

    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images[]', file);
    });

    try {
      const response = await fetch(`${VitBASEURL}/upload-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      return data.data?.images || [];
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const filteredBlockPhotos = blockPhotos.filter((photo) => photo.trim());
      const filteredEquipmentPhotos = equipmentPhotos.filter((photo) =>
        photo.trim(),
      );

      const newBlockPhotoUrls = filteredBlockPhotos.filter((photo) =>
        isDataUrl(photo),
      );
      const existingBlockPhotoUrls = filteredBlockPhotos.filter(
        (photo) => !isDataUrl(photo),
      );

      const newEquipmentPhotoUrls = filteredEquipmentPhotos.filter((photo) =>
        isDataUrl(photo),
      );
      const existingEquipmentPhotoUrls = filteredEquipmentPhotos.filter(
        (photo) => !isDataUrl(photo),
      );

      let uploadedBlockUrls: string[] = [];
      let uploadedEquipmentUrls: string[] = [];

      if (newBlockPhotoUrls.length > 0) {
        uploadedBlockUrls = await uploadImagesToServer(newBlockPhotoUrls);
      }

      if (newEquipmentPhotoUrls.length > 0) {
        uploadedEquipmentUrls = await uploadImagesToServer(
          newEquipmentPhotoUrls,
        );
      }

      const finalBlockPhotos = [
        ...existingBlockPhotoUrls,
        ...uploadedBlockUrls,
      ];
      const finalEquipmentPhotos = [
        ...existingEquipmentPhotoUrls,
        ...uploadedEquipmentUrls,
      ];

      const processEquipmentPhotos = async (items: EquipmentItem[]) => {
        const results = [];
        for (const item of items) {
          if (!item.make && !item.type && !item.model) continue;

          const newItem = { ...item };
          if (item.photo && isDataUrl(item.photo)) {
            const uploadedUrls = await uploadImagesToServer([item.photo]);
            newItem.photo = uploadedUrls[0] || '';
          }
          results.push(newItem);
        }
        return results;
      };

      const processSmartRackPhotos = async () => {
        const results = [];
        for (const item of smartRack) {
          if (!item.make && !item.type && !item.serial_no) continue;

          const newItem = { ...item };
          if (item.photo && isDataUrl(item.photo)) {
            const uploadedUrls = await uploadImagesToServer([item.photo]);
            newItem.photo = uploadedUrls[0] || '';
          }
          results.push(newItem);
        }
        return results;
      };

      const finalSmartRack = await processSmartRackPhotos();
      const finalFdmsShelf = await processEquipmentPhotos(fdmsShelf);
      const finalIpMplsRouter = await processEquipmentPhotos(ipMplsRouter);

      const updatePayload = {
        id: parseInt(id || '0'),
        state_code: stateCode,
        district_code: districtCode,
        block_code: blockCode,
        block_name: blockName,
        block_latitude: blockLatitude,
        block_longitude: blockLongitude,
        block_photos: finalBlockPhotos,
        smart_rack: finalSmartRack,
        fdms_shelf: finalFdmsShelf,
        ip_mpls_router: finalIpMplsRouter,
        rfms: rfms.filter((item) => item.make || item.type || item.model),
        sfp_10g: sfp10g.filter((item) => item.type || item.make || item.model),
        sfp_1g: sfp1g.filter((item) => item.type || item.make || item.model),
        sfp_100g: sfp100g.filter(
          (item) => item.type || item.make || item.model,
        ),
        equipment_photo: finalEquipmentPhotos,
        block_contacts: blockContacts.filter(
          (contact) => contact.name || contact.phone,
        ),
      };

      // Changed from PUT to POST
      const response = await axios.post(
        `${BASEURL}/update-block-installation`,
        updatePayload,
      );

      if (response.data.status) {
        toast.success('Block installation updated successfully!');
        setTimeout(() => {
          navigate(`/installation/block-detail/${id}`);
        }, 1500);
      } else {
        toast.error('Failed to update block installation');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(
        error.response?.data?.message || 'Failed to update block installation',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/installation/block-detail/${id}`);
  };

  // Generic handlers for different equipment types
  const handleSmartRackChange = (
    index: number,
    field: keyof SmartRackItem,
    value: string,
  ) => {
    const updated = [...smartRack];
    updated[index] = { ...updated[index], [field]: value };
    setSmartRack(updated);
  };

  const handleEquipmentChange = (
    type: 'fdms' | 'router' | 'rfms',
    index: number,
    field: keyof EquipmentItem,
    value: string,
  ) => {
    if (type === 'fdms') {
      const updated = [...fdmsShelf];
      updated[index] = { ...updated[index], [field]: value };
      setFdmsShelf(updated);
    } else if (type === 'router') {
      const updated = [...ipMplsRouter];
      updated[index] = { ...updated[index], [field]: value };
      setIpMplsRouter(updated);
    } else if (type === 'rfms') {
      const updated = [...rfms];
      updated[index] = { ...updated[index], [field]: value };
      setRfms(updated);
    }
  };

  const handleSFPChange = (
    type: '10g' | '1g' | '100g',
    index: number,
    field: keyof SFPItem,
    value: string,
  ) => {
    if (type === '10g') {
      const updated = [...sfp10g];
      updated[index] = { ...updated[index], [field]: value };
      setSfp10g(updated);
    } else if (type === '1g') {
      const updated = [...sfp1g];
      updated[index] = { ...updated[index], [field]: value };
      setSfp1g(updated);
    } else if (type === '100g') {
      const updated = [...sfp100g];
      updated[index] = { ...updated[index], [field]: value };
      setSfp100g(updated);
    }
  };

  const handleContactChange = (
    index: number,
    field: keyof ContactInfo,
    value: string,
  ) => {
    const updated = [...blockContacts];
    updated[index] = { ...updated[index], [field]: value };
    setBlockContacts(updated);
  };

  // Add/Remove handlers
  const addSmartRackItem = () => {
    setSmartRack([
      ...smartRack,
      { make: '', type: '', photo: '', serial_no: '' },
    ]);
  };

  const removeSmartRackItem = (index: number) => {
    setSmartRack(smartRack.filter((_, i) => i !== index));
  };

  const addEquipmentItem = (type: 'fdms' | 'router' | 'rfms') => {
    const newItem = { make: '', type: '', model: '', serial_no: '', photo: '' };
    if (type === 'fdms') {
      setFdmsShelf([...fdmsShelf, newItem]);
    } else if (type === 'router') {
      setIpMplsRouter([...ipMplsRouter, newItem]);
    } else if (type === 'rfms') {
      setRfms([...rfms, newItem]);
    }
  };

  const removeEquipmentItem = (
    type: 'fdms' | 'router' | 'rfms',
    index: number,
  ) => {
    if (type === 'fdms') {
      setFdmsShelf(fdmsShelf.filter((_, i) => i !== index));
    } else if (type === 'router') {
      setIpMplsRouter(ipMplsRouter.filter((_, i) => i !== index));
    } else if (type === 'rfms') {
      setRfms(rfms.filter((_, i) => i !== index));
    }
  };

  const addSFPItem = (type: '10g' | '1g' | '100g') => {
    const newItem = {
      type: '',
      make: '',
      model: '',
      serial_no: '',
      port_count: '',
    };
    if (type === '10g') {
      setSfp10g([...sfp10g, newItem]);
    } else if (type === '1g') {
      setSfp1g([...sfp1g, newItem]);
    } else if (type === '100g') {
      setSfp100g([...sfp100g, newItem]);
    }
  };

  const removeSFPItem = (type: '10g' | '1g' | '100g', index: number) => {
    if (type === '10g') {
      setSfp10g(sfp10g.filter((_, i) => i !== index));
    } else if (type === '1g') {
      setSfp1g(sfp1g.filter((_, i) => i !== index));
    } else if (type === '100g') {
      setSfp100g(sfp100g.filter((_, i) => i !== index));
    }
  };

  const addContact = () => {
    setBlockContacts([
      ...blockContacts,
      { name: '', phone: '', email: '', designation: '' },
    ]);
  };

  const removeContact = (index: number) => {
    setBlockContacts(blockContacts.filter((_, i) => i !== index));
  };

  const handlePhotoAdd = (type: 'block' | 'equipment', url: string) => {
    if (type === 'block') {
      setBlockPhotos([...blockPhotos, url]);
    } else {
      setEquipmentPhotos([...equipmentPhotos, url]);
    }
  };

  const handleFileUpload =
    (type: 'block' | 'equipment') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (type === 'block') {
            setBlockPhotos([...blockPhotos, dataUrl]);
          } else {
            setEquipmentPhotos([...equipmentPhotos, dataUrl]);
          }
        };
        reader.readAsDataURL(file);
      });

      event.target.value = '';
    };

  const triggerBlockPhotoUpload = () => {
    blockPhotoFileInput.current?.click();
  };

  const triggerEquipmentPhotoUpload = () => {
    equipmentPhotoFileInput.current?.click();
  };

  const triggerSmartRackPhotoUpload = (index: number) => {
    setSmartRackPhotoIndex(index);
    smartRackFileInput.current?.click();
  };

  const handleSmartRackPhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || smartRackPhotoIndex === null) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const updated = [...smartRack];
      updated[smartRackPhotoIndex] = {
        ...updated[smartRackPhotoIndex],
        photo: dataUrl,
      };
      setSmartRack(updated);
      setSmartRackPhotoIndex(null);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const triggerFdmsPhotoUpload = (index: number) => {
    setFdmsPhotoIndex(index);
    fdmsFileInput.current?.click();
  };

  const handleFdmsPhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || fdmsPhotoIndex === null) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const updated = [...fdmsShelf];
      updated[fdmsPhotoIndex] = { ...updated[fdmsPhotoIndex], photo: dataUrl };
      setFdmsShelf(updated);
      setFdmsPhotoIndex(null);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const triggerRouterPhotoUpload = (index: number) => {
    setRouterPhotoIndex(index);
    routerFileInput.current?.click();
  };

  const handleRouterPhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || routerPhotoIndex === null) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const updated = [...ipMplsRouter];
      updated[routerPhotoIndex] = {
        ...updated[routerPhotoIndex],
        photo: dataUrl,
      };
      setIpMplsRouter(updated);
      setRouterPhotoIndex(null);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handlePhotoRemove = (type: 'block' | 'equipment', index: number) => {
    if (type === 'block') {
      setBlockPhotos(blockPhotos.filter((_, i) => i !== index));
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h3>
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
        <Header activeTab ="installation" BackBut={true} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-3">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Block Installation
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Complete editing for all installation data
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State 
                  </label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed bg-gray-100"
                    placeholder="Enter state name"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District 
                  </label>
                  <input
                    type="text"
                    value={districtName}
                    onChange={(e) => setDistrictName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed bg-gray-100"
                    placeholder="Enter district name"
                    readOnly
                  />
                </div>

               
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block Name
                  </label>
                  <input
                    type="text"
                    value={blockName}
                    onChange={(e) => setBlockName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed bg-gray-100"
                    placeholder="Enter block name"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={blockLatitude}
                    onChange={(e) => setBlockLatitude(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed bg-gray-100"
                    placeholder="Enter latitude"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={blockLongitude}
                    onChange={(e) => setBlockLongitude(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed bg-gray-100"
                    placeholder="Enter longitude"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Block Photos Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Block Photos
                </h3>
                <button
                  onClick={triggerBlockPhotoUpload}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Photo
                </button>
              </div>
              <input
                type="file"
                ref={blockPhotoFileInput}
                onChange={handleFileUpload('block')}
                accept="image/*"
                multiple
                className="hidden"
              />

              {blockPhotos.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                  <p>No block photos added. Click "Add Photo" to add images.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {blockPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img
                          src={
                            isDataUrl(photo) ? photo : `${ImgbaseUrl}/${photo}`
                          }
                          alt={`Block Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = photo;
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handlePhotoRemove('block', index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Rack Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Smart Rack Equipment
                </h3>
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
                  <p>
                    No smart rack items configured. Click "Add Item" to add
                    equipment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {smartRack.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">
                          Smart Rack Item {index + 1}
                        </span>
                        <button
                          onClick={() => removeSmartRackItem(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Make
                          </label>
                          <input
                            type="text"
                            value={item.make}
                            onChange={(e) =>
                              handleSmartRackChange(
                                index,
                                'make',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Cisco"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <input
                            type="text"
                            value={item.type}
                            onChange={(e) =>
                              handleSmartRackChange(
                                index,
                                'type',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Type-A"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Serial Number
                          </label>
                          <input
                            type="text"
                            value={item.serial_no}
                            onChange={(e) =>
                              handleSmartRackChange(
                                index,
                                'serial_no',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., SR12345"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Photo
                          </label>
                          {item.photo ? (
                            <div className="relative mb-2">
                              <img
                                src={
                                  isDataUrl(item.photo)
                                    ? item.photo
                                    : `${ImgbaseUrl}/${item.photo}`
                                }
                                alt="Smart Rack"
                                className="h-20 w-auto rounded-md border border-gray-200 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    item.photo;
                                }}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleSmartRackChange(index, 'photo', '')
                                }
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => triggerSmartRackPhotoUpload(index)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            {item.photo ? 'Change Photo' : 'Upload Photo'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Continue with more sections - I'll create the remaining sections in subsequent parts due to length... */}

            {/* Contact Information */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Block Contacts
                </h3>
                <button
                  onClick={addContact}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Contact
                </button>
              </div>

              {blockContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p>
                    No contacts added. Click "Add Contact" to add contact
                    information.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blockContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">
                          Contact {index + 1}
                        </span>
                        <button
                          onClick={() => removeContact(index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={contact.name}
                            onChange={(e) =>
                              handleContactChange(index, 'name', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter contact name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={contact.phone}
                            onChange={(e) =>
                              handleContactChange(
                                index,
                                'phone',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter phone number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={contact.email}
                            onChange={(e) =>
                              handleContactChange(
                                index,
                                'email',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter email address"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Designation
                          </label>
                          <input
                            type="text"
                            value={contact.designation}
                            onChange={(e) =>
                              handleContactChange(
                                index,
                                'designation',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter designation"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FDMS Shelf Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  FDMS Shelf Equipment
                </h3>
                <button
                  onClick={() => addEquipmentItem('fdms')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {fdmsShelf.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p>No FDMS shelf items configured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fdmsShelf.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">
                          FDMS Shelf Item {index + 1}
                        </span>
                        <button
                          onClick={() => removeEquipmentItem('fdms', index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Make
                          </label>
                          <input
                            type="text"
                            value={item.make}
                            onChange={(e) =>
                              handleEquipmentChange(
                                'fdms',
                                index,
                                'make',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter make"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <input
                            type="text"
                            value={item.type}
                            onChange={(e) =>
                              handleEquipmentChange(
                                'fdms',
                                index,
                                'type',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter type"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model
                          </label>
                          <input
                            type="text"
                            value={item.model}
                            onChange={(e) =>
                              handleEquipmentChange(
                                'fdms',
                                index,
                                'model',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter model"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Serial Number
                          </label>
                          <input
                            type="text"
                            value={item.serial_no}
                            onChange={(e) =>
                              handleEquipmentChange(
                                'fdms',
                                index,
                                'serial_no',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter serial number"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Photo
                          </label>
                          {item.photo ? (
                            <div className="relative mb-2">
                              <img
                                src={
                                  isDataUrl(item.photo)
                                    ? item.photo
                                    : `${ImgbaseUrl}/${item.photo}`
                                }
                                alt="FDMS Shelf"
                                className="h-20 w-auto rounded-md border border-gray-200 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    item.photo;
                                }}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleEquipmentChange(
                                    'fdms',
                                    index,
                                    'photo',
                                    '',
                                  )
                                }
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => triggerFdmsPhotoUpload(index)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            {item.photo ? 'Change Photo' : 'Upload Photo'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* IP MPLS Router Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  IP MPLS Router Equipment
                </h3>
                <button
                  onClick={() => addEquipmentItem('router')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {ipMplsRouter.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p>No IP MPLS router items configured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ipMplsRouter.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">
                          Router Item {index + 1}
                        </span>
                        <button
                          onClick={() => removeEquipmentItem('router', index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Make
                          </label>
                          <input
                            type="text"
                            value={item.make}
                            onChange={(e) =>
                              handleEquipmentChange(
                                'router',
                                index,
                                'make',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter make"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <input
                            type="text"
                            value={item.type}
                            onChange={(e) =>
                              handleEquipmentChange(
                                'router',
                                index,
                                'type',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter type"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model
                          </label>
                          <input
                            type="text"
                            value={item.model}
                            onChange={(e) =>
                              handleEquipmentChange(
                                'router',
                                index,
                                'model',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter model"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Serial Number
                          </label>
                          <input
                            type="text"
                            value={item.serial_no}
                            onChange={(e) =>
                              handleEquipmentChange(
                                'router',
                                index,
                                'serial_no',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter serial number"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Photo
                          </label>
                          {item.photo ? (
                            <div className="relative mb-2">
                              <img
                                src={
                                  isDataUrl(item.photo)
                                    ? item.photo
                                    : `${ImgbaseUrl}/${item.photo}`
                                }
                                alt="IP MPLS Router"
                                className="h-20 w-auto rounded-md border border-gray-200 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    item.photo;
                                }}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleEquipmentChange(
                                    'router',
                                    index,
                                    'photo',
                                    '',
                                  )
                                }
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => triggerRouterPhotoUpload(index)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            {item.photo ? 'Change Photo' : 'Upload Photo'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SFP 10G Section */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  SFP 10G Components
                </h3>
                <button
                  onClick={() => addSFPItem('10g')}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </div>

              {sfp10g.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p>No SFP 10G items configured.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sfp10g.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-700">
                          SFP 10G Item {index + 1}
                        </span>
                        <button
                          onClick={() => removeSFPItem('10g', index)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <input
                            type="text"
                            value={item.type}
                            onChange={(e) =>
                              handleSFPChange(
                                '10g',
                                index,
                                'type',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter type"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Make
                          </label>
                          <input
                            type="text"
                            value={item.make}
                            onChange={(e) =>
                              handleSFPChange(
                                '10g',
                                index,
                                'make',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter make"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model
                          </label>
                          <input
                            type="text"
                            value={item.model}
                            onChange={(e) =>
                              handleSFPChange(
                                '10g',
                                index,
                                'model',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter model"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Serial Number
                          </label>
                          <input
                            type="text"
                            value={item.serial_no}
                            onChange={(e) =>
                              handleSFPChange(
                                '10g',
                                index,
                                'serial_no',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter serial number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Port Count
                          </label>
                          <input
                            type="text"
                            value={item.port_count}
                            onChange={(e) =>
                              handleSFPChange(
                                '10g',
                                index,
                                'port_count',
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter port count"
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
                <h3 className="text-lg font-semibold text-gray-900">
                  Equipment Photos
                </h3>
                <button
                  onClick={triggerEquipmentPhotoUpload}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Photo
                </button>
              </div>
              <input
                type="file"
                ref={equipmentPhotoFileInput}
                onChange={handleFileUpload('equipment')}
                accept="image/*"
                multiple
                className="hidden"
              />
              <input
                type="file"
                ref={smartRackFileInput}
                onChange={handleSmartRackPhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={fdmsFileInput}
                onChange={handleFdmsPhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={routerFileInput}
                onChange={handleRouterPhotoUpload}
                accept="image/*"
                className="hidden"
              />

              {equipmentPhotos.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                  <p>No equipment photos added.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {equipmentPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                        <img
                          src={
                            isDataUrl(photo) ? photo : `${ImgbaseUrl}/${photo}`
                          }
                          alt={`Equipment Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = photo;
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handlePhotoRemove('equipment', index)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
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

export default BlockInstallationEdit;
