import { useState, useEffect } from 'react';
import {
  Loader2,
  X,
  Upload,
  Camera,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { getStateData, getDistrictData, getBlockData } from '../Services/api';
import { Block, District, StateData } from '../../types/survey';
import RFMSForm from './forms/RFMSForm';
import BlockRouterForm from './forms/BlockRouterForm';
import FDMSForm from './forms/FDMSForm';

type FormType = 'RFMS' | 'Block Router' | 'FDMS';

const BlockRouterChecklist = () => {
  const [showModal, setShowModal] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedFormType, setSelectedFormType] = useState<FormType | ''>('');
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const stateData = await getStateData();
        setStates(stateData);
      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStates();
  }, []);

  const handleStateChange = async (stateId: string) => {
    setSelectedState(stateId);
    setSelectedDistrict('');
    setSelectedBlock('');
    setLoadingDistricts(true);
    try {
      const districtData = await getDistrictData(stateId);
      setDistricts(districtData);
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (districtId: string) => {
    setSelectedDistrict(districtId);
    setSelectedBlock('');
    setLoadingBlocks(true);
    try {
      const blockData = await getBlockData(districtId);
      setBlocks(blockData);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoadingBlocks(false);
    }
  };

  const handleBlockChange = (blockId: string) => {
    setSelectedBlock(blockId);
  };

  const handleFormTypeChange = (formType: FormType) => {
    setSelectedFormType(formType);
  };

  const handleSubmit = () => {
    if (
      !selectedState ||
      !selectedDistrict ||
      !selectedBlock ||
      !selectedFormType
    ) {
      alert('Please fill all fields');
      return;
    }
    setShowModal(false);
  };

  const formTypes: FormType[] = ['RFMS', 'Block Router', 'FDMS'];

  const renderForm = () => {
    switch (selectedFormType) {
      case 'RFMS':
        return <RFMSForm />;
      case 'Block Router':
        return <BlockRouterForm />;
      case 'FDMS':
        return <FDMSForm />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                Block Router Checklist
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.state_id} value={state.state_id}>
                      {state.state_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!selectedState || loadingDistricts}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingDistricts ? 'Loading...' : 'Select District'}
                  </option>
                  {districts.map((district) => (
                    <option
                      key={district.district_id}
                      value={district.district_id}
                    >
                      {district.district_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Block <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBlock}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  disabled={!selectedDistrict || loadingBlocks}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingBlocks ? 'Loading...' : 'Select Block'}
                  </option>
                  {blocks.map((block) => (
                    <option key={block.block_id} value={block.block_id}>
                      {block.block_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {formTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleFormTypeChange(type)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        selectedFormType === type
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !selectedState ||
                  !selectedDistrict ||
                  !selectedBlock ||
                  !selectedFormType
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {!showModal && (
        <div>
          {/* <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {selectedFormType} Checklist
            </h2>
            <p className="text-sm text-gray-600">
              State:{' '}
              {states.find((s) => s.state_id === selectedState)?.state_name} |
              District:{' '}
              {
                districts.find((d) => d.district_id === selectedDistrict)
                  ?.district_name
              }{' '}
              | Block:{' '}
              {blocks.find((b) => b.block_id === selectedBlock)?.block_name}
            </p>
          </div> */}
          {renderForm()}
        </div>
      )}
    </>
  );
};

export default BlockRouterChecklist;
