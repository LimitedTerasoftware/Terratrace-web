import { useState, useEffect, useCallback } from 'react';
import { Activity, ApiResponseMachine } from '../../types/survey';
import { AlertCircle, Loader2 } from 'lucide-react';

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

// 
export const LoadingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg flex items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <div>
          <p className="text-lg font-medium text-gray-900">Loading details...</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the information</p>
        </div>
      </div>
    </div>
  );
};

export const ErrorPage = (error:any) =>{
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error ? error : "No data found"}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
}
