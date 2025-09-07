import React from 'react';
import { Construction, MapPin, Clock, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { UGConstructionSurveyData } from '../../types/survey';

interface ConstructionStatsPanelProps {
  surveys: UGConstructionSurveyData[];
  isLoading: boolean;
}

const ConstructionStatsPanel: React.FC<ConstructionStatsPanelProps> = ({ surveys, isLoading }) => {
  
  const getConstructionStats = () => {
    const totalSurveys = surveys.length;
    
    // Recent surveys (last 24 hours)
    const recentSurveys = surveys.filter(survey =>
      new Date(survey.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    // Unique locations (assuming completed surveys have some completion indicator)
    // Since we don't have a status field, we'll count unique start-end location pairs
    const uniqueRoutes = new Set(surveys.map(s => `${s.start_lgd_name}-${s.end_lgd_name}`)).size;
    
    // Unique surveyors
    const uniqueSurveyors = new Set(surveys.map(s => s.user_name)).size;
    
    // Active districts (districts with surveys)
    const activeDistricts = new Set(surveys.map(s => s.district_name)).size;
    
    // Active states
    const activeStates = new Set(surveys.map(s => s.state_name)).size;
    
    return {
      totalSurveys,
      recentSurveys: recentSurveys.length,
      uniqueRoutes,
      uniqueSurveyors,
      activeDistricts,
      activeStates
    };
  };

  const stats = getConstructionStats();

  const statsConfig = [
    {
      icon: Construction,
      label: 'Total Surveys',
      value: stats.totalSurveys,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      id: 'total'
    },
    {
      icon: MapPin,
      label: 'Active Routes',
      value: stats.uniqueRoutes,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      id: 'routes'
    },
    {
      icon: MapPin,
      label: 'Active Districts',
      value: stats.activeDistricts,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      id: 'districts'
    },
    {
      icon: Users,
      label: 'Active Surveyors',
      value: stats.uniqueSurveyors,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      id: 'surveyors'
    },
    {
      icon: MapPin,
      label: 'Active States',
      value: stats.activeStates,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      id: 'states'
    },
    {
      icon: Clock,
      label: 'Last 24h',
      value: stats.recentSurveys,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      id: 'recent'
    }
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
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
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

export default ConstructionStatsPanel;