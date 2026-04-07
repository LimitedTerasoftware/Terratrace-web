import { useState, useEffect } from 'react';
import {
  MapPin,
  Building2,
  QrCode,
  FileText,
  Camera,
  CheckSquare,
  Server,
  X,
} from 'lucide-react';
import { FormData, GeoTaggedImage } from '../../../types/gp-checklist';
import {
  getStateData,
  getDistrictData,
  getBlockData,
} from '../../Services/api';
import { StateData, District, Block } from '../../../types/survey';
import axios from 'axios';
import ImageCapture from './ImageCapture';

interface Form1Props {
  data: FormData['form1'] | undefined;
  onChange: (data: FormData['form1'] | undefined) => void;
  validate?: () => boolean;
}
const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

export default function Form1({ data, onChange }: Form1Props) {
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [Gps, setGPs] = useState<{ id: string; name: string }[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingGPs, setLoadingGPs] = useState(false);

  const [selectedState, setSelectedState] = useState(data?.stateId || '');
  const [selectedDistrict, setSelectedDistrict] = useState(
    data?.districtId || '',
  );
  const [selectedBlock, setSelectedBlock] = useState(data?.blockId || '');
  const [selectedGP, setSelectedGP] = useState(data?.gpId || '');
  const [latitude, setLatitude] = useState(data?.latitude || '');
  const [longitude, setLongitude] = useState(data?.longitude || '');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [siteImages, setSiteImages] = useState<GeoTaggedImage[]>([]);
  const [geotaggedSiteImages, setGeotaggedSiteImages] = useState<
    GeoTaggedImage[]
  >([]);
  const [buildingImages, setBuildingImages] = useState<GeoTaggedImage[]>([]);
  const [qrCodeImages, setQrCodeImages] = useState<GeoTaggedImage[]>([]);
  const [smartRackImages, setSmartRackImages] = useState<GeoTaggedImage[]>([]);
  const [dataLoadedFromParent, setDataLoadedFromParent] = useState(false);

  useEffect(() => {
    if (data) {
      setDataLoadedFromParent(true);
      setSelectedState(data.stateId || '');
      setSelectedDistrict(data.districtId || '');
      setSelectedBlock(data.blockId || '');
      setSelectedGP(data.gpId || '');
      setLatitude(data.latitude || '');
      setLongitude(data.longitude || '');
      setGeotaggedSiteImages(data.geotaggedSiteImages || []);
      setSiteImages(data.siteImages || []);
      setBuildingImages(data.buildingImages || []);
      setQrCodeImages(data.qrCodeImages || []);
      setSmartRackImages(data.smartRackPhoto || []);

      if (data.stateId) fetchDistricts(data.stateId);
    }
  }, [data]);

  useEffect(() => {
    if (dataLoadedFromParent && data?.districtId) {
      fetchBlocks(data.districtId);
    }
  }, [dataLoadedFromParent]);

  useEffect(() => {
    if (dataLoadedFromParent && data?.blockId) {
      fetchGPs(data.blockId);
    }
  }, [dataLoadedFromParent]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedState) newErrors.state = 'State is required';
    if (!selectedDistrict) newErrors.district = 'District is required';
    if (!selectedBlock) newErrors.block = 'Block is required';
    if (!selectedGP) newErrors.gp = 'GP is required';
    if (!latitude) newErrors.latitude = 'Latitude is required';
    if (!longitude) newErrors.longitude = 'Longitude is required';
    if (!data?.building_type)
      newErrors.building_type = 'Building type is required';
    if (siteImages.length === 0)
      newErrors.siteImages = 'At least one site image is required';
    if (buildingImages.length === 0)
      newErrors.buildingImages = 'At least one building image is required';
    if (qrCodeImages.length === 0)
      newErrors.qrCodeImages = 'At least one QR code image is required';
    if (!data?.geoTaggedPhoto)
      newErrors.geoTaggedPhoto = 'Geo-tagged photo selection is required';
    if (data?.geoTaggedPhoto === 'yes' && geotaggedSiteImages.length === 0) {
      newErrors.geotaggedSiteImages =
        'At least one geo-tagged image is required';
    }
    if (!data?.siteBoardInstalled)
      newErrors.siteBoardInstalled =
        'Site board installed selection is required';
    if (
      (data?.siteBoardInstalled === 'no' ||
        data?.siteBoardInstalled === 'na') &&
      !data?.siteBoardRemark
    ) {
      newErrors.siteBoardRemark = 'Remark is required when No/NA';
    }
    if (!data?.otdrReport) newErrors.otdrReport = 'OTDR Report PDF is required';
    if (!data?.smartRackInstalled)
      newErrors.smartRackInstalled =
        'Smart Rack installation selection is required';
    if (data?.smartRackInstalled === 'yes' && smartRackImages.length === 0) {
      newErrors.smartRackPhoto = 'At least one rack photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState && data?.stateId && !dataLoadedFromParent) {
      fetchDistricts(selectedState);
    } else if (selectedState) {
      fetchDistricts(selectedState);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict && data?.districtId && !dataLoadedFromParent) {
      fetchBlocks(selectedDistrict);
    } else if (selectedDistrict) {
      fetchBlocks(selectedDistrict);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedBlock && data?.blockId && !dataLoadedFromParent) {
      fetchGPs(selectedBlock);
    } else if (selectedBlock) {
      fetchGPs(selectedBlock);
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

  useEffect(() => {
    if (data && data.stateId && data.districtId && data.blockId && data.gpId) {
      setSelectedState(data.stateId);
      setSelectedDistrict(data.districtId);
      setSelectedBlock(data.blockId);
      setSelectedGP(data.gpId);
      setLatitude(data.latitude || '');
      setLongitude(data.longitude || '');
      setGeotaggedSiteImages(data.geotaggedSiteImages || []);
      setSiteImages(data.siteImages || []);
      setBuildingImages(data.buildingImages || []);
      setQrCodeImages(data.qrCodeImages || []);
      setSmartRackImages(data.smartRackPhoto || []);

      getDistrictData(data.stateId).then((res) => {
        setDistricts(res || []);
        getBlockData(data.districtId || '').then((res2) => {
          setBlocks(res2 || []);
          axios
            .get(`${BASEURL}/gpdata`, { params: { block_code: data.blockId } })
            .then((res3) => {
              const gpOptions = Array.isArray(res3.data.data)
                ? res3.data.data.map((gp: any) => ({
                    id: gp.id.toString(),
                    name: gp.gp_name || gp.name,
                  }))
                : Array.isArray(res3.data)
                  ? res3.data.map((gp: any) => ({
                      id: gp.id.toString(),
                      name: gp.gp_name || gp.name,
                    }))
                  : [];
              setGPs(gpOptions);
            })
            .catch(() => setGPs([]));
        });
      });
    }
  }, [data]);

  const captureGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lng = position.coords.longitude.toString();
        setLatitude(lat);
        setLongitude(lng);
        onChange({ ...data, latitude: lat, longitude: lng });
        setGpsLoading(false);
      },
      (error) => {
        alert('Error getting location: ' + error.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    setSelectedDistrict('');
    setSelectedBlock('');
    setSelectedGP('');
    onChange({
      ...data,
      stateId,
      districtId: '',
      blockId: '',
      gpId: '',
      gpName: '',
    });
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedBlock('');
    setSelectedGP('');
    onChange({ ...data, districtId, blockId: '', gpId: '', gpName: '' });
  };

  const handleBlockChange = (blockId: string) => {
    setSelectedBlock(blockId);
    setSelectedGP('');
    onChange({ ...data, blockId, gpId: '', gpName: '' });
  };

  const handleGPChange = (gpId: string) => {
    const gp = Gps.find((g) => g.id === gpId);
    setSelectedGP(gpId);
    onChange({ ...data, gpId, gpName: gp?.name || '' });
  };

  const handleBuildingTypeChange = (buildingType: string) => {
    onChange({ ...data, building_type: buildingType });
  };

  const handleGeoTaggedChange = (value: string) => {
    onChange({ ...data, geoTaggedPhoto: value });
  };

  const handleSiteBoardChange = (value: string) => {
    onChange({ ...data, siteBoardInstalled: value });
  };

  const handleSiteBoardRemarkChange = (value: string) => {
    onChange({ ...data, siteBoardRemark: value });
  };

  const handleSmartRackChange = (value: string) => {
    onChange({ ...data, smartRackInstalled: value });
  };

  const handleSiteImageCapture = (image: GeoTaggedImage) => {
    const updatedImages = [...siteImages, image];
    setSiteImages(updatedImages);
    onChange({ ...data, siteImages: updatedImages });
  };

  const handleGeotaggedSiteImageCapture = (image: GeoTaggedImage) => {
    const updatedImages = [...geotaggedSiteImages, image];
    setGeotaggedSiteImages(updatedImages);
    onChange({ ...data, geotaggedSiteImages: updatedImages });
  };
  const handleBuildingImageCapture = (image: GeoTaggedImage) => {
    const updatedImages = [...buildingImages, image];
    setBuildingImages(updatedImages);
    onChange({ ...data, buildingImages: updatedImages });
  };

  const handleQRCodeImageCapture = (image: GeoTaggedImage) => {
    const updatedImages = [...qrCodeImages, image];
    setQrCodeImages(updatedImages);
    onChange({ ...data, qrCodeImages: updatedImages });
  };

  const handleSmartRackImageCapture = (image: GeoTaggedImage) => {
    const updatedImages = [...smartRackImages, image];
    setSmartRackImages(updatedImages);
    onChange({ ...data, smartRackPhoto: updatedImages });
  };

  const removeImage = (
    imageId: string,
    images: GeoTaggedImage[],
    setImages: React.Dispatch<React.SetStateAction<GeoTaggedImage[]>>,
    fieldName:
      | 'siteImages'
      | 'buildingImages'
      | 'qrCodeImages'
      | 'smartRackPhoto'
      | 'geotaggedSiteImages',
  ) => {
    const updated = images.filter((img) => img.id !== imageId);
    setImages(updated);
    onChange({ ...data, [fieldName]: updated });
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
          <div>
            <select
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              disabled={loadingStates}
            >
              <option value="">Select State</option>
              {states.map((state) => (
                <option key={state.state_id} value={state.state_id}>
                  {state.state_name}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="text-red-500 text-sm mt-1">{errors.state}</p>
            )}
          </div>
          <div>
            <select
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.district ? 'border-red-500' : 'border-gray-300'}`}
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              disabled={loadingDistricts || !selectedState}
            >
              <option value="">Select District</option>
              {districts.map((district) => (
                <option key={district.district_id} value={district.district_id}>
                  {district.district_name}
                </option>
              ))}
            </select>
            {errors.district && (
              <p className="text-red-500 text-sm mt-1">{errors.district}</p>
            )}
          </div>
          <div>
            <select
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.block ? 'border-red-500' : 'border-gray-300'}`}
              value={selectedBlock}
              onChange={(e) => handleBlockChange(e.target.value)}
              disabled={loadingBlocks || !selectedDistrict}
            >
              <option value="">Select Block</option>
              {blocks.map((block) => (
                <option key={block.block_id} value={block.block_id}>
                  {block.block_name}
                </option>
              ))}
            </select>
            {errors.block && (
              <p className="text-red-500 text-sm mt-1">{errors.block}</p>
            )}
          </div>
          <div>
            <select
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.gp ? 'border-red-500' : 'border-gray-300'}`}
              value={selectedGP}
              onChange={(e) => handleGPChange(e.target.value)}
              disabled={loadingGPs || !selectedBlock}
            >
              <option value="">Select GP</option>
              {Gps.map((gp) => (
                <option key={gp.id} value={gp.id}>
                  {gp.name}
                </option>
              ))}
            </select>
            {errors.gp && (
              <p className="text-red-500 text-sm mt-1">{errors.gp}</p>
            )}
          </div>
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
            <div>
              <input
                type="text"
                placeholder="Latitude"
                className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full ${errors.latitude ? 'border-red-500' : 'border-gray-300'}`}
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
              />
              {errors.latitude && (
                <p className="text-red-500 text-sm mt-1">{errors.latitude}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Longitude"
                className={`px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full ${errors.longitude ? 'border-red-500' : 'border-gray-300'}`}
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
              />
              {errors.longitude && (
                <p className="text-red-500 text-sm mt-1">{errors.longitude}</p>
              )}
            </div>
          </div>
          <button
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50"
            onClick={captureGPSLocation}
            disabled={gpsLoading}
          >
            <MapPin className="w-4 h-4" />
            {gpsLoading ? 'Capturing...' : 'CAPTURE GPS LOCATION'}
          </button>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-900">
              Site Images
            </label>
            <ImageCapture
              onCapture={handleSiteImageCapture}
              label="Capture Site Image"
            />
            {siteImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {siteImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.preview}
                      alt="Site"
                      className="w-full h-24 object-cover rounded-lg"
                    />

                    <button
                      onClick={() =>
                        removeImage(
                          img.id,
                          siteImages,
                          setSiteImages,
                          'siteImages',
                        )
                      }
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={data?.building_type || ''}
              onChange={(e) => handleBuildingTypeChange(e.target.value)}
            >
              <option value="">Select Building</option>
              <option value="Panchayat Bhawan">Panchayat Bhawan</option>
              <option value="School">School</option>
              <option value="CSC (Common Service Center)">
                CSC (Common Service Center)
              </option>
              <option value="Anganwadi">Anganwadi</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Building Images
            </label>
            <ImageCapture
              onCapture={handleBuildingImageCapture}
              label="Capture Building Image"
            />
            {buildingImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {buildingImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.preview}
                      alt="Building"
                      className="w-full h-24 object-cover rounded-lg"
                    />

                    <button
                      onClick={() =>
                        removeImage(
                          img.id,
                          buildingImages,
                          setBuildingImages,
                          'buildingImages',
                        )
                      }
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
        <ImageCapture
          onCapture={handleQRCodeImageCapture}
          label="Capture QR Code Image"
        />
        {qrCodeImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {qrCodeImages.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.preview}
                  alt="QR Code"
                  className="w-full h-24 object-cover rounded-lg"
                />

                <button
                  onClick={() =>
                    removeImage(
                      img.id,
                      qrCodeImages,
                      setQrCodeImages,
                      'qrCodeImages',
                    )
                  }
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
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

          <input
            type="file"
            accept="application/pdf"
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer
              block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              "
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onChange({ ...data, otdrReport: file });
              }
            }}
          />
          {data?.otdrReport && (
            <p className="text-sm text-green-600 mt-2">
              Selected: {(data.otdrReport as File).name}
            </p>
          )}
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
              checked={data?.geoTaggedPhoto === 'yes'}
              onChange={(e) => handleGeoTaggedChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">YES</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="geo-tagged-site-photo"
              value="no"
              checked={data?.geoTaggedPhoto === 'no'}
              onChange={(e) => handleGeoTaggedChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">NO</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="geo-tagged-site-photo"
              value="na"
              checked={data?.geoTaggedPhoto === 'na'}
              onChange={(e) => handleGeoTaggedChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">NA</span>
          </label>
        </div>
        <div className="space-y-2">
          {data?.geoTaggedPhoto === 'yes' && (
            <ImageCapture
              onCapture={handleGeotaggedSiteImageCapture}
              label="TAKE PHOTO"
            />
          )}
          {geotaggedSiteImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {geotaggedSiteImages.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.watermarkedPreview || img.preview}
                    alt="Geo-tagged Site"
                    className="w-full h-24 object-cover rounded-lg"
                  />

                  <button
                    onClick={() =>
                      removeImage(
                        img.id,
                        geotaggedSiteImages,
                        setGeotaggedSiteImages,
                        'geotaggedSiteImages',
                      )
                    }
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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
              checked={data?.siteBoardInstalled === 'yes'}
              onChange={(e) => handleSiteBoardChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">YES</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="site-board-installed"
              value="no"
              checked={data?.siteBoardInstalled === 'no'}
              onChange={(e) => handleSiteBoardChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">NO</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="site-board-installed"
              value="na"
              checked={data?.siteBoardInstalled === 'na'}
              onChange={(e) => handleSiteBoardChange(e.target.value)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">NA</span>
          </label>
        </div>
        {(data?.siteBoardInstalled === 'no' ||
          data?.siteBoardInstalled === 'na') && (
          <div>
            <label className="block text-sm font-medium text-red-600 mb-2">
              REMARK REQUIRED *
            </label>
            <textarea
              placeholder="Enter remark"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows={3}
              value={data?.siteBoardRemark || ''}
              onChange={(e) => handleSiteBoardRemarkChange(e.target.value)}
            />
          </div>
        )}
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
          <button
            className={`flex-1 px-6 py-3 border-2 rounded-lg transition-colors text-sm font-medium ${
              data?.smartRackInstalled === 'yes'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
            onClick={() => handleSmartRackChange('yes')}
          >
            YES
          </button>
          <button
            className={`flex-1 px-6 py-3 border-2 rounded-lg transition-colors text-sm font-medium ${
              data?.smartRackInstalled === 'no'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
            }`}
            onClick={() => handleSmartRackChange('no')}
          >
            NO
          </button>
        </div>
        {data?.smartRackInstalled === 'yes' && (
          <div className="space-y-2">
            <ImageCapture
              onCapture={handleSmartRackImageCapture}
              label="Capture Rack Photo"
            />
            {smartRackImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {smartRackImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <img
                      src={img.watermarkedPreview || img.preview}
                      alt="Rack"
                      className="w-full h-24 object-cover rounded-lg"
                    />

                    <button
                      onClick={() =>
                        removeImage(
                          img.id,
                          smartRackImages,
                          setSmartRackImages,
                          'smartRackPhoto',
                        )
                      }
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
