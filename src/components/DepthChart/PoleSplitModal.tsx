import { useEffect, useState } from 'react';
import { X, Scissors, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { Block, District, StateData } from '../../types/survey';
import { getBlockData, getDistrictData, getStateData } from '../Services/api';
import { getAuthHeaders } from '../../utils/accessControl';
import SearchableSelect from '../Forms/SearchableSelect';

interface GpOption {
  id: number;
  name: string;
}

export interface PoleSplitLocation {
  state_id: number;
  district_id: number;
  block_id: number;
  startLocation: number;
  endLocation: number;
}

interface PoleSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (location: PoleSplitLocation) => void;
  selectedCount: number;
  isSubmitting: boolean;
  defaultStateId?: number | null;
  defaultDistrictId?: number | null;
  defaultBlockId?: number | null;
  defaultStartLocation?: number | null;
  defaultEndLocation?: number | null;
}

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

export function PoleSplitModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isSubmitting,
  defaultStateId,
  defaultDistrictId,
  defaultBlockId,
  defaultStartLocation,
  defaultEndLocation,
}: PoleSplitModalProps) {
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [gpOptions, setGpOptions] = useState<GpOption[]>([]);
  const [loadingGps, setLoadingGps] = useState(false);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [startLocation, setStartLocation] = useState<string>('');
  const [endLocation, setEndLocation] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Seed defaults + load states whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    getStateData()
      .then((data) => setStates(data || []))
      .catch((err) => console.error('Error fetching states:', err));

    setSelectedState(defaultStateId != null ? String(defaultStateId) : '');
    setSelectedDistrict(
      defaultDistrictId != null ? String(defaultDistrictId) : '',
    );
    setSelectedBlock(defaultBlockId != null ? String(defaultBlockId) : '');
    setStartLocation(
      defaultStartLocation != null ? String(defaultStartLocation) : '',
    );
    setEndLocation(
      defaultEndLocation != null ? String(defaultEndLocation) : '',
    );
  }, [
    isOpen,
    defaultStateId,
    defaultDistrictId,
    defaultBlockId,
    defaultStartLocation,
    defaultEndLocation,
  ]);

  useEffect(() => {
    if (!isOpen || !selectedState) {
      setDistricts([]);
      return;
    }
    getDistrictData(selectedState)
      .then((data) => setDistricts(data || []))
      .catch((err) => console.error('Error fetching districts:', err));
  }, [isOpen, selectedState]);

  useEffect(() => {
    if (!isOpen || !selectedDistrict) {
      setBlocks([]);
      return;
    }
    getBlockData(selectedDistrict)
      .then((data) => setBlocks(data || []))
      .catch((err) => console.error('Error fetching blocks:', err));
  }, [isOpen, selectedDistrict]);

  useEffect(() => {
    if (!isOpen || !selectedBlock) {
      setGpOptions([]);
      return;
    }
    const fetchGps = async () => {
      try {
        setLoadingGps(true);
        const response = await axios.get(`${TraceBASEURL}/gpdata`, {
          params: { block_code: selectedBlock },
          headers: getAuthHeaders(),
        });
        setGpOptions(response.data || []);
      } catch (err) {
        console.error('Error fetching GP data:', err);
        setGpOptions([]);
      } finally {
        setLoadingGps(false);
      }
    };
    fetchGps();
  }, [isOpen, selectedBlock]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (
      !selectedState ||
      !selectedDistrict ||
      !selectedBlock ||
      !startLocation ||
      !endLocation
    ) {
      setError('Please select State, District, Block, Start GP and End GP.');
      return;
    }
    setError(null);
    onConfirm({
      state_id: Number(selectedState),
      district_id: Number(selectedDistrict),
      block_id: Number(selectedBlock),
      startLocation: Number(startLocation),
      endLocation: Number(endLocation),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Scissors className="w-5 h-5" />
            Split Poles
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {selectedCount} row(s) selected — choose the new survey's
            location.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              State
            </label>
            <SearchableSelect
              value={selectedState}
              onChange={(value) => {
                setSelectedState(value);
                setSelectedDistrict('');
                setSelectedBlock('');
                setStartLocation('');
                setEndLocation('');
              }}
              options={states.map((s) => ({
                value: String(s.state_id),
                label: s.state_name,
              }))}
              placeholder="Select State"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              District
            </label>
            <SearchableSelect
              value={selectedDistrict}
              onChange={(value) => {
                setSelectedDistrict(value);
                setSelectedBlock('');
                setStartLocation('');
                setEndLocation('');
              }}
              disabled={!selectedState}
              options={districts.map((d) => ({
                value: String(d.district_id),
                label: d.district_name,
              }))}
              placeholder="Select District"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Block
            </label>
            <SearchableSelect
              value={selectedBlock}
              onChange={(value) => {
                setSelectedBlock(value);
                setStartLocation('');
                setEndLocation('');
              }}
              disabled={!selectedDistrict}
              options={blocks.map((b) => ({
                value: String(b.block_id),
                label: b.block_name,
              }))}
              placeholder="Select Block"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start GP
            </label>
            <SearchableSelect
              value={startLocation}
              onChange={setStartLocation}
              disabled={!selectedBlock || loadingGps}
              options={gpOptions.map((gp) => ({
                value: String(gp.id),
                label: gp.name,
              }))}
              placeholder={loadingGps ? 'Loading GPs...' : 'Select Start GP'}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End GP
            </label>
            <SearchableSelect
              value={endLocation}
              onChange={setEndLocation}
              disabled={!selectedBlock || loadingGps}
              options={gpOptions.map((gp) => ({
                value: String(gp.id),
                label: gp.name,
              }))}
              placeholder={loadingGps ? 'Loading GPs...' : 'Select End GP'}
              className="w-full"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Splitting...
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4" />
                Confirm Split
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
