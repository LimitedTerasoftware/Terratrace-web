import React from 'react';
import { Activity, CheckCircle, Clock, AlertCircle, Server, Building } from 'lucide-react';

// Define the installation data type based on your actual data structure
interface InstallationData {
    id: string;
    status: 'active' | 'inactive' | 'pending' | 'completed';
    installation_date: string;
    state_name?: string;
    district_name?: string;
    block_name?: string;
    type?: 'GP' | 'BLOCK';
}

interface InstallationStatsPanelProps {
    installations: InstallationData[];
    isLoading: boolean;
}

const InstallationStatsPanel: React.FC<InstallationStatsPanelProps> = ({ 
    installations, 
    isLoading 
}) => {
    // Calculate stats
    const totalInstallations = installations.length;
    const gpInstallations = installations.filter(item => item.type === 'GP').length;
    const blockInstallations = installations.filter(item => item.type === 'BLOCK').length;
    const activeInstallations = installations.filter(item => item.status === 'active').length;
    const completedInstallations = installations.filter(item => item.status === 'completed').length;
    const pendingInstallations = installations.filter(item => item.status === 'pending').length;

    // Calculate completion rate
    const completionRate = totalInstallations > 0 
        ? ((completedInstallations / totalInstallations) * 100).toFixed(1)
        : '0';

    const statsConfig = [
        {
            icon: Activity,
            label: 'Total Installations',
            value: totalInstallations,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            icon: Server,
            label: 'GP Installations',
            value: gpInstallations,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            icon: Building,
            label: 'Block Installations',
            value: blockInstallations,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            icon: CheckCircle,
            label: 'Completed',
            value: completedInstallations,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            icon: Clock,
            label: 'Active/Pending',
            value: activeInstallations + pendingInstallations,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            icon: Activity,
            label: 'Success Rate',
            value: `${completionRate}%`,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
        },
    ];

    if (isLoading) {
        return (
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="px-1 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="h-8 bg-gray-200 rounded mb-2 w-12"></div>
                                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    </div>
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <div className="w-5 h-5 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 border-b border-gray-200">
            <div className="px-1 py-6">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {statsConfig.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div 
                                key={index} 
                                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {isLoading ? '-' : (typeof stat.value === 'string' ? stat.value : stat.value.toLocaleString())}
                                        </div>
                                        <div className="text-sm text-gray-600">{stat.label}</div>
                                    </div>
                                    <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                                        <Icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default InstallationStatsPanel;