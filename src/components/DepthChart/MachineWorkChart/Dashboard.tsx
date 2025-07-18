import React, { useState, useEffect } from 'react';
import { BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import FilterPanel from './FilterPanel';
import MachineChart from './MachineChart';
import { FilterState, MachineData } from '../../../types/survey';
import { fetchMachineData } from '../../Services/api';
import { getTodayDate, getLastWeekDate } from '../../../utils/dateUtils';
import { useLocation } from 'react-router-dom';

interface DashboardProps {
  MachineId: string;
  View:boolean;
}
const Dashboard: React.FC<DashboardProps> = ({MachineId,View}) => {
    const [filters, setFilters] = useState<FilterState>({
        machineId: MachineId || '1',
        machineName:'',
        fromDate: '',
        toDate:'',
        // fromDate: getLastWeekDate(),
        // toDate: getTodayDate(),
    });
    const [data, setData] = useState<MachineData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetchMachineData(
                filters.machineId,
                filters.fromDate,
                filters.toDate
            );

            if (response.status && response.data) {
                setData(response.data);
            } else {
                setError('Failed to load data');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleFiltersChange = (newFilters: FilterState) => {
        setFilters(newFilters);
    };

    const handleApplyFilters = () => {
        loadData();
    };

    const handleRefresh = () => {
        loadData();
    };

    return (
        <>
       
            <div className="min-h-screen bg-gray-50">

                <div className="container mx-auto px-4 py-8">
                    {View && (
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-blue-600" />
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Machine Work Dashboard</h1>
                                <p className="text-gray-600 mt-1">Track and analyze machine work activity</p>
                            </div>
                        </div>
                        <div className='flex items-center gap-1'>
                         <FilterPanel
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                            onApplyFilters={handleApplyFilters}
                            isLoading={isLoading} />
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-1 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        </div>
                    </div>
                     )}
                     <div className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-700 font-medium">Error loading data</span>
                                </div>
                                <p className="text-red-600 mt-1">{error}</p>
                            </div>
                        )}
                        <MachineChart
                            data={data}
                            machineId={filters.machineId}
                            machineName={filters.machineName}
                            isLoading={isLoading} />
                    </div>
                </div>
            </div></>
    );
};

export default Dashboard;