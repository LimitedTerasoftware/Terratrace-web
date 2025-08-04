import axios from 'axios';
import { MachineDataApiResponse } from '../../types/survey';
import { ApiResponse} from '../../types/machine';
import { useCallback, useEffect, useState } from 'react';
import { Activity, ApiResponseMachine ,FilterState} from '../../types/survey';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const BASEURL = import.meta.env.VITE_API_BASE;


export const fetchMachineData = async (
  machineId: string,
  fromDate?: string,
  toDate?: string
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

export const getMachineOptions = async() => {
    try {
    const resp = await axios.get(`${TraceBASEURL}/get-all-machines`);
    if(resp.status === 200 || resp.status === 201){
        return resp.data.machines;
    }else{
       throw new Error(`HTTP error! status: ${resp.status}`);
    }
    
    } catch (error) {
        console.log(error)
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
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
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
  Machine:string|null) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount,setTotalCount]=useState<number>(0);
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
       const params = new URLSearchParams();

      if (selectedState) params.append('state_id', selectedState);
      if (selectedDistrict) params.append('district_id', selectedDistrict);
      if (selectedBlock) params.append('block_id', selectedBlock);
      if (Machine) params.append('machine_id', Machine);

      const response = await fetch(`${TraceBASEURL}/machine/latest-activity?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponseMachine = await response.json();
      
      if (data.status && data.latestActivities) {
       
        const validActivities = data.latestActivities.filter(
          (item): item is Activity => 'id' in item && typeof item.id === 'number'
        );
        setTotalCount(data.latestActivities.length)
        setActivities(validActivities);
      } else {
        setActivities([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedState, selectedDistrict, selectedBlock,Machine]);

  useEffect(() => {
    
    fetchActivities();
  }, [fetchActivities]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivities();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchActivities]);

  return {
    activities,
    totalCount,
    isLoading,
    error,
    refetch: fetchActivities
  };
};

export const getStateData = async() => {
  try {
    const resp = await axios.get(`${BASEURL}/states`);
    if(resp.status === 200 || resp.status === 201){
      return resp.data.data;
    }else{
      throw new Error(`HTTP error! status: ${resp.status}`);
    }
    
  } catch (error) {
    throw error;
  }

}

export const getDistrictData = async(selectedState:string | null)=>{
  try{
    const resp = await axios.get(`${BASEURL}/districtsdata?state_code=${selectedState}`);
    if(resp.status === 200 || resp.status === 201){
      return resp.data
    }else{
        throw new Error(`HTTP error! status: ${resp.status}`);

    }
    
  } catch (error) {
        throw error;

  }

}

export const getBlockData = async(selectedDistrict:string | null)=>{
  try{
    const resp = await axios.get(`${BASEURL}/blocksdata?district_code=${selectedDistrict}`);
    if(resp.status === 200 || resp.status === 201){
      return resp.data
    }else{
        throw new Error(`HTTP error! status: ${resp.status}`);

    }
    
  } catch (error) {
        throw error;

  }

}

export const getGpData = async(page:number=1,st_code:string,dt_code:string,blk_code:string)=>{
  try {
    const params: any = {};
    if (page) params.page = page;
    if (st_code) params.st_code = st_code;
    if (dt_code) params.dt_code = dt_code;
    if (blk_code) params.blk_code = blk_code;

    const resp = await axios.get(`${TraceBASEURL}/gpslist`,{params});
     if(resp.status === 200 || resp.status === 201){
      return resp.data
    }else{
        throw new Error(`HTTP error! status: ${resp.status}`);

    }
    
  } catch (error) {
      throw error;

  }
}
  