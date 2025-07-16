import React, { useEffect, useState } from 'react';
import { Activity as Activity2, MapPin, Clock, TrendingUp } from 'lucide-react';
import { Activity } from '../../types/survey';
import { getMachineOptions } from '../Services/api';
import { Machine } from '../../types/machine';

interface StatsPanelProps {
  activities: Activity[];
  totalCount:number;
  isLoading: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ activities, totalCount,isLoading }) => {
  const totalActivities = activities.length;
  const uniqueMachines = new Set(activities.map(a => a.machine_id)).size;
  const eventTypes = new Set(activities.map(a => a.eventType)).size;
  const recentActivities = activities.filter(a => 
    new Date(a.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;
  const [machines, setMachines] = useState<Machine[]>([]);

  useEffect(()=>{
      getMachineOptions().then(data => {
            setMachines(data);
        });
    },[])

  const getStatusCounts = () => {
    return machines.reduce((acc, machine) => {
      acc[machine.status] = (acc[machine.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  const stats = [
    {
      icon: Activity2,
      label: 'Total Machines',
      value: machines.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: MapPin,
      label: 'Total Active Machines',
      value: statusCounts.active || 0,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      icon: MapPin,
      label: 'Total Inactive Machines',
      value: statusCounts.inactive || 0,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: Clock,
      label: 'Last 24h',
      value: recentActivities,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const handleredire = ()=>{
    console.log('kjhgvc')
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} onClick={handleredire}className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsPanel;