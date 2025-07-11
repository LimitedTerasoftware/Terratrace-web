import axios from 'axios';
import { MachineDataApiResponse } from '../../types/survey';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

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