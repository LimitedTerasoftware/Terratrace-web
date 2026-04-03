import { useState, useEffect } from 'react';
import {
  MapPin,
  Upload,
  Building2,
  QrCode,
  FileText,
  Camera,
  CheckSquare,
  Server,
} from 'lucide-react';
import { FormData } from '../../../types/gp-checklist';
import {
  getStateData,
  getDistrictData,
  getBlockData,
} from '../../Services/api';
import { StateData, District, Block } from '../../../types/survey';
import axios from 'axios';

interface Form1Props {
  data: FormData['form1'];
  onChange: (data: FormData['form1']) => void;
}
const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

export default function Form1({ data, onChange }: Form1Props) {
  const updateField = (field: string, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [Gps, setGPs] = useState<{ id: string; name: string }[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingGPs, setLoadingGPs] = useState(false);

  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedGP, setSelectedGP] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      fetchDistricts(selectedState);
    } else {
      setDistricts([]);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchBlocks(selectedDistrict);
    } else {
      setBlocks([]);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedBlock) {
      fetchGPs(selectedBlock);
    } else {
      setGPs([]);
    }
  }, [selectedBlock]);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const data = await getStateData();
      setStates(data || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchDistricts = async (stateCode: string) => {
    setLoadingDistricts(true);
    try {
      const data = await getDistrictData(stateCode);
      setDistricts(data || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchBlocks = async (districtCode: string) => {
    setLoadingBlocks(true);
    try {
      const data = await getBlockData(districtCode);
      setBlocks(data || []);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const fetchGPs = async (blockCode: string) => {
    setLoadingGPs(true);
    try {
      const res = await axios.get(`${BASEURL}/gpdata?block_code=${blockCode}`);
      const data = res.data;
      const options = data.map((g: any) => ({
        id: g.id.toString(),
        name: g.name.toString(),
      }));
      setGPs(options);
    } catch (error) {
      console.error('Error fetching GPs:', error);
    } finally {
      setLoadingGPs(false);
    }
  };

  const captureGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setGpsLoading(false);
      },
      (error) => {
        alert('Error getting location: ' + error.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-blue-100 rounded-xl">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          General Site Verification
        </h2>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-200 rounded-lg">
            <MapPin className="w-4 h-4 text-blue-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Location Details
          </h3>
        </div>
        <div className="space-y-3">
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={selectedState}
            onChange={(e) => {
              setSelectedState(e.target.value);
              setSelectedDistrict('');
              setSelectedBlock('');
            }}
            disabled={loadingStates}
          >
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state.state_id} value={state.state_id}>
                {state.state_name}
              </option>
            ))}
          </select>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedBlock('');
            }}
            disabled={loadingDistricts || !selectedState}
          >
            <option value="">Select District</option>
            {districts.map((district) => (
              <option key={district.district_id} value={district.district_id}>
                {district.district_name}
              </option>
            ))}
          </select>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            disabled={loadingBlocks || !selectedDistrict}
          >
            <option value="">Select Block</option>
            {blocks.map((block) => (
              <option key={block.block_id} value={block.block_id}>
                {block.block_name}
              </option>
            ))}
          </select>
          <select
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={selectedGP}
            onChange={(e) => setSelectedGP(e.target.value)}
            disabled={loadingGPs || !selectedBlock}
          >
            <option value="">Select GP</option>
            {Gps.map((gp) => (
              <option key={gp.id} value={gp.id}>
                {gp.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="bg-gradient-to-br from-gray-50 to-green-50 border border-green-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-200 rounded-lg">
            <MapPin className="w-4 h-4 text-green-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            GP Location Verification
          </h3>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Latitude"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
            />
            <input
              type="text"
              placeholder="Longitude"
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
            />
          </div>
          <button
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
            onClick={captureGPSLocation}
            disabled={gpsLoading}
          >
            <MapPin className="w-4 h-4" />
            {gpsLoading ? 'Capturing...' : 'CAPTURE GPS LOCATION'}
          </button>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Upload Site Image</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-purple-50 border border-purple-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-200 rounded-lg">
            <Building2 className="w-4 h-4 text-purple-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            GP Building Availability
          </h3>
        </div>
        <p className="text-sm text-gray-600 ml-7">
          Identify site infrastructure
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Select Building Type
            </label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option>Select Building</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Building Images
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-sm text-gray-600">Upload Building Image</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-orange-50 border border-orange-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-200 rounded-lg">
            <QrCode className="w-4 h-4 text-orange-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            QR Code Images
          </h3>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
          <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Upload QR Code Image</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-red-50 border border-red-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-200 rounded-lg">
            <FileText className="w-4 h-4 text-red-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Ensure route connectivity from Block to GP is complete and tested
          </h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            OTDR Report PDF
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Upload PDF</p>
          </div>
          <p className="text-sm text-gray-500 mt-2">No PDF Selected</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-cyan-50 border border-cyan-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-200 rounded-lg">
            <Camera className="w-4 h-4 text-cyan-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Geo-tagged site photo uploaded
          </h3>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="geo-tagged-site-photo"
              value="yes"
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">YES</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="geo-tagged-site-photo"
              value="no"
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">NO</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="geo-tagged-site-photo"
              value="na"
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">NA</span>
          </label>
        </div>
        <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          TAKE PHOTO
        </button>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-indigo-50 border border-indigo-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-200 rounded-lg">
            <CheckSquare className="w-4 h-4 text-indigo-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Site board installed
          </h3>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="site-board-installed"
              value="yes"
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">YES</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="site-board-installed"
              value="no"
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">NO</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="site-board-installed"
              value="na"
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">NA</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-red-600 mb-2">
            REMARK REQUIRED *
          </label>
          <textarea
            placeholder="Enter remark"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            rows={3}
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-pink-50 border border-pink-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-pink-200 rounded-lg">
            <Server className="w-4 h-4 text-pink-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Smart Rack Installed?
          </h3>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium">
            YES
          </button>
          <button className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-sm font-medium">
            NO
          </button>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
          <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
          <p className="text-sm text-gray-600">Upload Rack Photo</p>
        </div>
      </div>
    </div>
  );
}
