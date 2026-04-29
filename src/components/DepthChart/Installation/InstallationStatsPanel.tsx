import React from 'react';
import {
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Server,
  Building,
} from 'lucide-react';



interface StatsData {
  total_ont_gps?: number;
  total_survey_count?: number;
  pending_count?: string | number;
  accepted_count?: string | number;
  rejected_count?: string | number;
  progress_percent?: string | number;
  total_blocks?: number;
  total_install_count?: number;
}

interface InstallationStatsPanelProps {
  isLoading: boolean;
  statsData?: StatsData | null;
  statsLoading?: boolean;
  activeTab?: 'GP_INSTALLATION' | 'BLOCK_INSTALLATION';
}

const InstallationStatsPanel: React.FC<InstallationStatsPanelProps> = ({
  isLoading,
  statsData,
  statsLoading = false,
  activeTab = 'GP_INSTALLATION',
}) => {
  // Use API stats if available, otherwise calculate from installations
  const getStatsConfig = () => {
    if (statsData && activeTab === 'GP_INSTALLATION') {
      // GP Installation stats from API
      return [
        {
          icon: Activity,
          label: 'Total ONT GPs',
          value: statsData.total_ont_gps || 0,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        },
        {
          icon: Server,
          label: 'Total Survey',
          value: statsData.total_survey_count || 0,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        },
        {
          icon: Clock,
          label: 'Pending',
          value:
            typeof statsData.pending_count === 'string'
              ? parseInt(statsData.pending_count) || 0
              : statsData.pending_count || 0,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        },
        {
          icon: CheckCircle,
          label: 'Accepted',
          value:
            typeof statsData.accepted_count === 'string'
              ? parseInt(statsData.accepted_count) || 0
              : statsData.accepted_count || 0,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
        },
        {
          icon: AlertCircle,
          label: 'Rejected',
          value:
            typeof statsData.rejected_count === 'string'
              ? parseInt(statsData.rejected_count) || 0
              : statsData.rejected_count || 0,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        },
        {
          icon: Activity,
          label: 'Progress %',
          value: `${
            typeof statsData.progress_percent === 'number'
              ? statsData.progress_percent
              : parseFloat(statsData.progress_percent as string) || 0
          }%`,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
        },
      ];
    } else if (statsData && activeTab === 'BLOCK_INSTALLATION') {
      // Block Installation stats from API
      return [
        {
          icon: Building,
          label: 'Total Blocks',
          value: statsData.total_blocks || 0,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        },
        {
          icon: Server,
          label: 'Total Installations',
          value: statsData.total_install_count || 0,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        },
        {
          icon: Clock,
          label: 'Pending',
          value: statsData.pending_count || 0,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        },
        {
          icon: CheckCircle,
          label: 'Accepted',
          value: statsData.accepted_count || 0,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
        },
        {
          icon: AlertCircle,
          label: 'Rejected',
          value: statsData.rejected_count || 0,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        },
        {
          icon: Activity,
          label: 'Progress %',
          value: `${statsData.progress_percent || 0}%`,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
        },
      ];
    } else {
      

    

      return [
        {
          icon: Activity,
          label: 'Total Installations',
          value: 0,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        },
        {
          icon: Server,
          label: 'GP Installations',
          value: 0,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        },
        {
          icon: Building,
          label: 'Block Installations',
          value: 0,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        },
        {
          icon: CheckCircle,
          label: 'Completed',
          value: 0,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
        },
        {
          icon: Clock,
          label: 'Active/Pending',
          value: 0  ,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        },
        {
          icon: Activity,
          label: 'Success Rate',
          value: `${ 0}%`,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
        },
      ];
    }
  };

  const statsConfig = getStatsConfig();

  if (isLoading || statsLoading) {
    return (
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-1 py-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse"
              >
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
                      {isLoading
                        ? '-'
                        : typeof stat.value === 'string'
                          ? stat.value
                          : stat.value.toLocaleString()}
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
