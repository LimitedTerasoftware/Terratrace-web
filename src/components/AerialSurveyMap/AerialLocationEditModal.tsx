import { useEffect, useState } from 'react';
import axios from 'axios';
import { X, Loader2 } from 'lucide-react';
import SearchableSelect from '../Forms/SearchableSelect';
import { getAuthHeaders } from '../../utils/accessControl';
import { updateAerialData } from '../Services/api';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

/** The row fields this modal reads and edits */
export interface AerialLocationRow {
  id: string | number;
  state_id?: string | number;
  district_id?: string | number;
  block_id?: string | number;
  gp_id?: string | number;
  end_gp_id?: string | number;
  startGpName?: string;
  startGpCoordinates?: string;
  endGpName?: string;
  endGpCoordinates?: string;
}

interface Props {
  row: AerialLocationRow;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Option { value: string; label: string }

interface GpOption {
  id: string;
  name: string;
  lgd_code: string;
  lat: string;
  long: string;
}

const toStr = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export const AerialLocationEditModal = ({ row, onClose, onSuccess }: Props) => {
  const [stateId, setStateId] = useState(toStr(row.state_id));
  const [districtId, setDistrictId] = useState(toStr(row.district_id));
  const [blockId, setBlockId] = useState(toStr(row.block_id));
  const [startGpId, setStartGpId] = useState(toStr(row.gp_id));
  const [endGpId, setEndGpId] = useState(toStr(row.end_gp_id));

  const [states, setStates] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [blocks, setBlocks] = useState<Option[]>([]);
  const [gps, setGps] = useState<GpOption[]>([]);
  const [loadingGps, setLoadingGps] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${TraceBASEURL}/states`, { headers: getAuthHeaders() })
      .then(res => setStates((res.data.data || []).map((s: any) => ({
        value: String(s.state_id), label: s.state_name,
      }))))
      .catch(err => console.error('Error fetching states:', err));
  }, []);

  useEffect(() => {
    if (!stateId) { setDistricts([]); return; }
    axios.get(`${TraceBASEURL}/districtsdata?state_code=${stateId}`, { headers: getAuthHeaders() })
      .then(res => setDistricts((res.data || []).map((d: any) => ({
        value: String(d.district_id), label: d.district_name,
      }))))
      .catch(err => console.error('Error fetching districts:', err));
  }, [stateId]);

  useEffect(() => {
    if (!districtId) { setBlocks([]); return; }
    axios.get(`${TraceBASEURL}/blocksdata?district_code=${districtId}`, { headers: getAuthHeaders() })
      .then(res => setBlocks((res.data || []).map((b: any) => ({
        value: String(b.block_id), label: b.block_name,
      }))))
      .catch(err => console.error('Error fetching blocks:', err));
  }, [districtId]);

  useEffect(() => {
    if (!blockId) { setGps([]); return; }
    setLoadingGps(true);
    axios.get(`${TraceBASEURL}/gpdata?block_code=${blockId}`, { headers: getAuthHeaders() })
      .then(res => setGps((res.data || []).map((g: any) => ({
        id: String(g.id),
        name: String(g.name),
        lgd_code: g.lgd_code,
        lat: g.lattitude,
        long: g.longitude,
      }))))
      .catch(err => console.error('Error fetching GP data:', err))
      .finally(() => setLoadingGps(false));
  }, [blockId]);

  const gpOptions = gps.map(g => ({ value: g.id, label: `${g.name}-${g.lgd_code}` }));
  const startGp = gps.find(g => g.id === startGpId);
  const endGp = gps.find(g => g.id === endGpId);

  // Fall back to the row's saved values until the GP list has loaded
  const startCoordinates = startGp ? `${startGp.lat},${startGp.long}` : toStr(row.startGpCoordinates);
  const endCoordinates = endGp ? `${endGp.lat},${endGp.long}` : toStr(row.endGpCoordinates);

  const handleStateChange = (value: string) => {
    setStateId(value);
    setDistrictId('');
    setBlockId('');
    setStartGpId('');
    setEndGpId('');
  };

  const handleDistrictChange = (value: string) => {
    setDistrictId(value);
    setBlockId('');
    setStartGpId('');
    setEndGpId('');
  };

  const handleBlockChange = (value: string) => {
    setBlockId(value);
    setStartGpId('');
    setEndGpId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateId || !districtId || !blockId || !startGpId || !endGpId) {
      setError('Please select State, District, Block, Start GP and End GP.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await updateAerialData({
        type: 'aerial',
        id: Number(row.id),
        state_id: Number(stateId),
        district_id: Number(districtId),
        block_id: Number(blockId),
        gp_id: Number(startGpId),
        end_gp_id: Number(endGpId),
        startGpName: startGp ? `${startGp.name}-${startGp.lgd_code}` : toStr(row.startGpName),
        endGpName: endGp ? `${endGp.name}-${endGp.lgd_code}` : toStr(row.endGpName),
        startGpCoordinates: startCoordinates,
        endGpCoordinates: endCoordinates,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const readOnlyInput = 'w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Aerial Survey Location</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <SearchableSelect
                value={stateId}
                onChange={handleStateChange}
                options={states}
                placeholder="Select State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <SearchableSelect
                value={districtId}
                onChange={handleDistrictChange}
                options={districts}
                disabled={!stateId}
                placeholder="Select District"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
              <SearchableSelect
                value={blockId}
                onChange={handleBlockChange}
                options={blocks}
                disabled={!districtId}
                placeholder="Select Block"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start GP</label>
              {loadingGps ? (
                <div className="mt-1 text-sm text-gray-500">Loading...</div>
              ) : (
                <SearchableSelect
                  value={startGpId}
                  onChange={setStartGpId}
                  options={gpOptions}
                  disabled={!blockId}
                  placeholder="Select Start GP"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start GP Coordinates</label>
              <input type="text" value={startCoordinates} className={readOnlyInput} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End GP</label>
              {loadingGps ? (
                <div className="mt-1 text-sm text-gray-500">Loading...</div>
              ) : (
                <SearchableSelect
                  value={endGpId}
                  onChange={setEndGpId}
                  options={gpOptions}
                  disabled={!blockId}
                  placeholder="Select End GP"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End GP Coordinates</label>
              <input type="text" value={endCoordinates} className={readOnlyInput} readOnly />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AerialLocationEditModal;
