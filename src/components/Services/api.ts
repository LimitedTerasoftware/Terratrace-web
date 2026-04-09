import axios from 'axios';
import { Firm } from '../../types/firm';
import {
  APIResponseLiveMachine,
  LiveMachines,
  MachineDataApiResponse,
} from '../../types/survey';
import {
  ApiResponse,
  MachineDetailsResponse,
  MachineLinkStatsResponse,
  MachineListApiResponse,
} from '../../types/machine';
import { useCallback, useEffect, useState } from 'react';
import { Activity, ApiResponseMachine, FilterState } from '../../types/survey';
import { EditPayload } from '../../types/aerial-survey';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const BASEURL = import.meta.env.VITE_API_BASE;

export const getFirms = async (): Promise<Firm[]> => {
  try {
    const resp = await axios.get(`${TraceBASEURL}/get-all-firms`);
    if (resp.status === 200 || resp.status === 201) {
      return resp.data.data;
    } else {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const fetchMachineData = async (
  machineId: string,
  fromDate?: string,
  toDate?: string,
): Promise<MachineDataApiResponse> => {
  try {
    let url = `${TraceBASEURL}/get-daily-distances?machine_id=${machineId}`;

    if (fromDate) {
      url += `&from_date=${fromDate}`;
    }

    if (toDate) {
      url += `&to_date=${toDate}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MachineDataApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching machine data:', error);
    throw error;
  }
};

export const getMachineOptions = async (firm_id?: string) => {
  try {
    const resp = await axios.get(`${TraceBASEURL}/get-all-machines`, {
      params: { firm_id: firm_id },
    });
    if (resp.status === 200 || resp.status === 201) {
      return resp.data.machines;
    } else {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getMachinePerformance = () => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (filters: FilterState) => {
    setLoading(true);
    setError(null);

    try {
      const url = `${TraceBASEURL}/machine-monthly-amount?machine_id=${filters.machineId}&month=${filters.month}&year=${filters.year}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (!result.status) {
        throw new Error('API returned error status');
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while fetching data',
      );
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchData };
};

export const useActivities = (
  selectedState: string | null,
  selectedDistrict: string | null,
  selectedBlock: string | null,
  Machine: string | null,
) => {
  const [activities, setActivities] = useState<LiveMachines[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
  const [machineData, setMachineData] = useState<{
    [key: string]: {
      machine_id: number;
      registration_number: string;
      authorised_person: string;
      activities: Activity[];
    };
  }>();

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (selectedState) params.append('state_id', selectedState);
      if (selectedDistrict) params.append('district_id', selectedDistrict);
      if (selectedBlock) params.append('block_id', selectedBlock);
      if (Machine) params.append('machine_id', Machine);

      const response = await fetch(
        `${TraceBASEURL}/get-depth-record?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: APIResponseLiveMachine = await response.json();

      if (data.status && data.data) {
        // const allActivities: Activity[] = [];
        // Object.values(data.latestActivities).forEach((machineInfo) => {
        //   if (machineInfo.activities && machineInfo.activities.length > 0) {
        //     allActivities.push(...machineInfo.activities);
        //   }
        // });

        setTotalCount(data.data.length);
        setActivities(data.data);
        // setMachineData(data.latestActivities);
      } else {
        setActivities([]);
        setMachineData({});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setActivities([]);
      setMachineData({});
    } finally {
      setIsLoading(false);
    }
  }, [selectedState, selectedDistrict, selectedBlock, Machine]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Auto refresh every 30 seconds
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchActivities();
  //   }, 30000);

  //   return () => clearInterval(interval);
  // }, [fetchActivities]);

  return {
    activities,
    machineData,
    totalCount,
    isLoading,
    error,
    refetch: fetchActivities,
  };
};

export const getStateData = async () => {
  try {
    const resp = await axios.get(`${BASEURL}/states`);
    if (resp.status === 200 || resp.status === 201) {
      return resp.data.data;
    } else {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
  } catch (error) {
    throw error;
  }
};

export const getDistrictData = async (selectedState: string | null) => {
  try {
    const resp = await axios.get(
      `${BASEURL}/districtsdata?state_code=${selectedState}`,
    );
    if (resp.status === 200 || resp.status === 201) {
      return resp.data;
    } else {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
  } catch (error) {
    throw error;
  }
};

export const getBlockData = async (selectedDistrict: string | null) => {
  try {
    const resp = await axios.get(
      `${BASEURL}/blocksdata?district_code=${selectedDistrict}`,
    );
    if (resp.status === 200 || resp.status === 201) {
      return resp.data;
    } else {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
  } catch (error) {
    throw error;
  }
};

export const getGpData = async (
  page: number = 1,
  st_code: string,
  dt_code: string,
  blk_code: string,
) => {
  try {
    const params: any = {};
    if (page) params.page = page;
    if (st_code) params.st_code = st_code;
    if (dt_code) params.dt_code = dt_code;
    if (blk_code) params.blk_code = blk_code;

    const resp = await axios.get(`${TraceBASEURL}/gpslist`, { params });
    if (resp.status === 200 || resp.status === 201) {
      return resp.data;
    } else {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
  } catch (error) {
    throw error;
  }
};

export interface GPChecklistData {
  id: number;
  state_id: number;
  district_id: number;
  block_id: number;
  gp_id: string;
  gp_name: string;
  latitude: string;
  longitude: string;
  site_images: string;
  building_images: string;
  building_type: string;
  user_id: string | null;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface GPChecklistResponse {
  status: boolean;
  message: string;
  data: GPChecklistData[];
  total?: number;
}

export const getChecklistData = async (filters: {
  state_id?: string;
  district_id?: string;
  block_id?: string;
  gp_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<GPChecklistResponse> => {
  try {
    const params = new URLSearchParams();
    if (filters.state_id) params.append('state_id', filters.state_id);
    if (filters.district_id) params.append('district_id', filters.district_id);
    if (filters.block_id) params.append('block_id', filters.block_id);
    if (filters.gp_id) params.append('gp_id', filters.gp_id);
    if (filters.from_date) params.append('from_date', filters.from_date);
    if (filters.to_date) params.append('to_date', filters.to_date);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.per_page)
      params.append('per_page', filters.per_page.toString());

    const queryString = params.toString();
    const urlSuffix = queryString ? `?${queryString}` : '';

    const resp = await axios.get(`${TraceBASEURL}/get-checklist${urlSuffix}`);
    if (resp.status === 200 || resp.status === 201) {
      return resp.data;
    } else {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
  } catch (error) {
    console.error('Error fetching checklist data:', error);
    throw error;
  }
};

export interface ChecklistItem {
  id: number;
  gp_main_id: number;
  gp_id: string | null;
  form_type: string;
  item_name: string;
  status: number;
  images: string | null;
  remark: string | null;
  item_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistMain {
  id: number;
  state_id: number;
  district_id: number;
  block_id: number;
  gp_id: string;
  gp_name: string;
  latitude: string;
  longitude: string;
  site_images: string;
  building_images: string;
  building_type: string;
  user_id: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  state_name: string;
  district_name: string;
  block_name: string;
}

export interface GPChecklistPreviewResponse {
  status: boolean;
  message: string;
  data: {
    main: ChecklistMain;
    items: ChecklistItem[];
  };
}

export const getChecklistPreview = async (
  gpMainId: number,
): Promise<GPChecklistPreviewResponse> => {
  try {
    const resp = await axios.get(
      `${TraceBASEURL}/get-checklist-preview?gp_main_id=${gpMainId}`,
    );
    if (resp.status === 200 || resp.status === 201) {
      return resp.data;
    } else {
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
  } catch (error) {
    console.error('Error fetching checklist preview:', error);
    throw error;
  }
};

export const updateAerialData = async (payload: EditPayload): Promise<any> => {
  try {
    const response = await fetch(`${TraceBASEURL}/aerial/update-by-type`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating aerial data:', error);
    throw error;
  }
};

export const machineApi = {
  getMachineDetails: async (
    stateId?: string,
  ): Promise<MachineDetailsResponse> => {
    const params = new URLSearchParams();
    if (stateId) {
      params.append('state_id', stateId);
    }
    const queryString = params.toString();
    const url = queryString
      ? `${TraceBASEURL}/api/getMachineDetails?${queryString}`
      : `${TraceBASEURL}/api/getMachineDetails`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch machine details');
    }
    return response.json();
  },

  getMachineLinkStats: async (
    machineId: number,
    stateId?: string,
    districtId?: string,
    blockId?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<MachineLinkStatsResponse> => {
    const params = new URLSearchParams({
      machine_id: machineId.toString(),
      state_id: stateId?.toString() || '',
      district_id: districtId?.toString() || '',
      block_id: blockId?.toString() || '',
      from_date: fromDate || '',
      to_date: toDate || '',
    });

    const response = await fetch(
      `${TraceBASEURL}/api/machine-link-stats?${params}`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch machine link stats');
    }
    return response.json();
  },

  getFirmDistanceStats: async (
    stateId?: string,
    districtId?: string,
    blockId?: string,
    fromDate?: string,
    toDate?: string,
    search?: string,
    firmId?: string,
  ): Promise<MachineDetailsResponse> => {
    const params = new URLSearchParams();
    if (stateId) {
      params.append('state_id', stateId);
    }
    if (districtId) {
      params.append('district_id', districtId);
    }
    if (blockId) {
      params.append('block_id', blockId);
    }
    if (fromDate) {
      params.append('from_date', fromDate);
    }
    if (toDate) {
      params.append('to_date', toDate);
    }
    if (search) {
      params.append('search', search);
    }
    if (firmId) {
      params.append('firm_id', firmId);
    }
    const queryString = params.toString();
    const url = queryString
      ? `${TraceBASEURL}/api/getFirmDistanceStats?${queryString}`
      : `${TraceBASEURL}/api/getFirmDistanceStats`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch firm distance stats');
    }
    return response.json();
  },

  getMachineBlockKML: async (
    blockId?: string,
    machineId?: string,
    stateId?: string,
    districtId?: string,
  ) => {
    const params = new URLSearchParams();
    if (blockId) params.append('block_id', blockId);
    if (machineId) params.append('machine_id', machineId);
    if (stateId) params.append('state_id', stateId);
    if (districtId) params.append('district_id', districtId);
    const queryString = params.toString();
    const url = queryString
      ? `${TraceBASEURL}/api/getMachineBlockKML?${queryString}`
      : `${TraceBASEURL}/api/getMachineBlockKML`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch machine block KML');
    }
    return response.json();
  },

  getConstructionPath: async (
    blockId?: string,
    machineId?: string,
    stateId?: string,
    districtId?: string,
  ) => {
    const params = new URLSearchParams();
    if (blockId) params.append('block_id', blockId);
    if (machineId) params.append('machine_id', machineId);
    if (stateId) params.append('state_id', stateId);
    if (districtId) params.append('district_id', districtId);
    const queryString = params.toString();
    const url = queryString
      ? `${TraceBASEURL}/api/getConstructionPath?${queryString}`
      : `${TraceBASEURL}/api/getConstructionPath`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch construction path');
    }
    return response.json();
  },

  getKmTrend: async (
    stateId?: string,
    districtId?: string,
    blockId?: string,
    fromDate?: string,
    toDate?: string,
    firmId?: string,
  ): Promise<{
    status: boolean;
    data: Array<{ date: string; daily_km: string; cumulative_km: string }>;
  }> => {
    const params = new URLSearchParams();
    if (stateId) params.append('state_id', stateId);
    if (districtId) params.append('district_id', districtId);
    if (blockId) params.append('block_id', blockId);
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    if (firmId) params.append('firm_id', firmId);
    const queryString = params.toString();
    const url = queryString
      ? `${TraceBASEURL}/api/km-trend?${queryString}`
      : `${TraceBASEURL}/api/km-trend`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch km trend');
    }
    return response.json();
  },

  getIssues: async (
    stateId?: string,
    districtId?: string,
    blockId?: string,
    fromDate?: string,
    toDate?: string,
    firmId?: string,
  ): Promise<{
    status: boolean;
    summary: {
      total: number;
      critical: number;
      warning: number;
      missing: number;
      depth_compliance: string;
    };
    data: Array<{
      issue_type: string;
      category: string;
      severity: string;
      survey_id: number;
      point_id: number;
      depth: string;
      location: string;
      vendor: string;
      machine: string;
      timestamp: string;
      status: string;
    }>;
  }> => {
    const params = new URLSearchParams();
    if (stateId) params.append('state_id', stateId);
    if (districtId) params.append('district_id', districtId);
    if (blockId) params.append('block_id', blockId);
    if (fromDate) params.append('from_date', fromDate);
    if (toDate) params.append('to_date', toDate);
    if (firmId) params.append('firm_id', firmId);
    const queryString = params.toString();
    const url = queryString
      ? `${TraceBASEURL}/api/get-issues?${queryString}`
      : `${TraceBASEURL}/api/get-issues`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch issues');
    }
    return response.json();
  },
};
