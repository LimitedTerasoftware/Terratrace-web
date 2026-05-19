import React from 'react';
import { Activity as Activity2, MapPin } from 'lucide-react';
import { LiveMachines } from '../../types/survey';
import { useNavigate } from 'react-router-dom';

interface StatsPanelProps {
  activities: LiveMachines[];
  totalCount: number;
  isLoading: boolean;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ activities, isLoading }) => {
  const navigate = useNavigate();

  const getLiveMachineStats = () => {
    const machineStats = new Map<
      string,
      {
        registrationNumber: string;
        isActive: boolean;
      }
    >();

    const today = new Date();

    activities
      .filter((item) => item.status !== 1)
      .forEach((item) => {
        const machineId = item.machine_id || item.machine_registration_number;
        const created = new Date(item.created_at);

        const isToday =
          created.getDate() === today.getDate() &&
          created.getMonth() === today.getMonth() &&
          created.getFullYear() === today.getFullYear();

        const existingMachineStats = machineStats.get(machineId);

        machineStats.set(machineId, {
          registrationNumber:
            item.machine_registration_number ||
            existingMachineStats?.registrationNumber ||
            machineId,
          isActive: Boolean(existingMachineStats?.isActive || isToday),
        });
      });

    const allMachines = Array.from(machineStats.values());
    const activeMachines = allMachines.filter((machine) => machine.isActive);
    const inactiveMachines = allMachines.filter((machine) => !machine.isActive);

    return {
      total: allMachines.length,
      active: activeMachines.length,
      inactive: inactiveMachines.length,
      activeRegIds: activeMachines.map((machine) => machine.registrationNumber),
      inactiveRegIds: inactiveMachines.map(
        (machine) => machine.registrationNumber,
      ),
      allRegIds: allMachines.map((machine) => machine.registrationNumber),
    };
  };

  const liveStatusCounts = getLiveMachineStats();

  const stats = [
    {
      icon: Activity2,
      label: 'Total Machines',
      value: liveStatusCounts.total || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      id: 0,
      regids: liveStatusCounts.allRegIds,
    },
    {
      icon: MapPin,
      label: 'Total Active Machines',
      value: liveStatusCounts.active || 0,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      id: 1,
      regids: liveStatusCounts.activeRegIds,
    },
    {
      icon: MapPin,
      label: 'Total Inactive Machines',
      value: liveStatusCounts.inactive || 0,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      id: 2,
      regids: liveStatusCounts.inactiveRegIds,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const handleredire = (id: number, regids: string[]) => {
    navigate('/machine-management/machines', {
      state: {
        Id: id,
        regids: regids,
      },
    });
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            onClick={() => handleredire(stat.id, stat.regids)}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-default"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
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
