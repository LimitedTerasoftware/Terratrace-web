import { useState, useEffect } from 'react';
import Filters from '../Checkboxes/Filters';
import ProgressTrendChart from '../Charts/ProgressTrendChart';
import KPICards from '../Chat/KPICards';
import StateProgress from '../Chat/StateProgress';
import MapView from '../Chat/MapView';
import SurveyInventory from '../Chat/SurveyInventory';
import VendorPerformance from '../Chat/VendorPerformance';
import RecentIssues from '../Chat/RecentIssues';
import { MachineDetailsResponse } from '../../types/machine';
import { machineApi } from '../Services/api';

export default function NewConstructionDashboard() {
    const [dashboardData, setDashboardData] =
        useState<MachineDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedState, setSelectedState] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [selectedVendor, setSelectedVendor] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

    const getDateRange = (period: string) => {
        if (period === 'all') {
            return { fromDate: undefined, toDate: undefined };
        }
        const days = parseInt(period) || 30;
        const toDate = new Date();
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        return {
            fromDate: fromDate.toISOString().split('T')[0],
            toDate: toDate.toISOString().split('T')[0],
        };
    };

    useEffect(() => {
        const { fromDate, toDate } = getDateRange(selectedPeriod);
        fetchMachineDetails(
            selectedState,
            selectedDistrict,
            fromDate,
            toDate,
            searchQuery,
            selectedVendor,
        );
    }, [
        selectedState,
        selectedDistrict,
        selectedPeriod,
        searchQuery,
        selectedVendor,
    ]);

    const fetchMachineDetails = async (
        stateId?: string,
        districtId?: string,
        fromDate?: string,
        toDate?: string,
        search?: string,
        firmId?: string,
    ) => {
        try {
            setLoading(true);
            const response = await machineApi.getFirmDistanceStats(
                stateId,
                districtId,
                undefined,
                fromDate,
                toDate,
                search,
                firmId,
            );
            setDashboardData(response);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSelectedState('');
        setSelectedDistrict('');
        setSelectedVendor('');
        setSelectedPeriod('30');
        setSearchQuery('');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Filters
                selectedState={selectedState}
                selectedDistrict={selectedDistrict}
                selectedVendor={selectedVendor}
                selectedPeriod={selectedPeriod}
                searchQuery={searchQuery}
                onStateChange={setSelectedState}
                onDistrictChange={setSelectedDistrict}
                onVendorChange={setSelectedVendor}
                onPeriodChange={setSelectedPeriod}
                onSearchChange={setSearchQuery}
                onReset={handleReset}
            />
            <KPICards Data={dashboardData} />

            <div className="px-6 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">

                        <ProgressTrendChart />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <StateProgress />
                            <VendorPerformance data={dashboardData} />
                        </div>

                    </div>

                

                <div className="lg:col-span-1 h-full">
                    <div className="h-full min-h-[500px]">
                        <MapView /> 
                    </div>
                </div>
            </div>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    <SurveyInventory data={dashboardData?.data} isLoading={loading} />
                    <RecentIssues />
                </div>
            </div>
        </div>
    );
}
