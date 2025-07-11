import { useState, useEffect, useCallback } from 'react';
import { Activity, ApiResponseMachine } from '../../types/survey';

const useActivities = ( 
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

export default useActivities;