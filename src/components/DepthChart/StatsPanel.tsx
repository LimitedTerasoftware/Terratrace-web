import React, { useEffect, useState } from 'react';
import { Activity as Activity2, MapPin, Clock} from 'lucide-react';
import { Activity } from '../../types/survey';
import { getMachineOptions } from '../Services/api';
import { Machine } from '../../types/machine';
import { useNavigate } from 'react-router-dom';

interface StatsPanelProps {
  activities: {[key: string]: {machine_id: number; registration_number: string; authorised_person: string; activities: Activity[]}};
  totalCount:number;
  isLoading: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ activities,isLoading }) => {
const navigate= useNavigate();
const last24Hours = Date.now() - 24 * 60 * 60 * 1000;

const machinesArray = Object.values(activities);
const allActivities = machinesArray.flatMap(machine =>
  machine?.activities?.map(activity => ({
    ...activity,
    machine_id: machine.machine_id,
    registration_number: machine.registration_number,
  })) || []
);

const recentOnly = allActivities.filter(a =>
  new Date(a.created_at).getTime() > last24Hours
);
const recentActivities = Object.values(
  recentOnly.reduce((acc, curr) => {
    if (
      !acc[curr.machine_id] ||
      new Date(curr.created_at) >
        new Date(acc[curr.machine_id].created_at)
    ) {
      acc[curr.machine_id] = curr;
    }
    return acc;
  }, {} as Record<number, typeof recentOnly[0]>)
);

const recentActivitiesCount = recentActivities.length;

const recentRegNumbers = recentActivities.map(a => a.registration_number);

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
      bgColor: 'bg-blue-50',
      id:0,
      regids:[]
    },
    {
      icon: MapPin,
      label: 'Total Active Machines',
      value: statusCounts.active || 0,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      id:1,
      regids:[]
    },
    {
      icon: MapPin,
      label: 'Total Inactive Machines',
      value: statusCounts.inactive || 0,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      id:2,
      regids:[]
    },
    {
      icon: Clock,
      label: 'Last 24h',
      value: recentActivitiesCount,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      id:3,
      regids:recentRegNumbers
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
  
  const handleredire = (id:number,regids:string[])=>{
    navigate('/machine-management/machines',{
      state:{
      Id:id,
      regids:regids
    }});
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} onClick={()=>handleredire(stat.id,stat.regids)} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
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