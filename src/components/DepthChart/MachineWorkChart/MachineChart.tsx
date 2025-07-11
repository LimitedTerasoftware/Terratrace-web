import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MachineData } from '../../../types/survey';
import { formatDate, parseDistance } from '../../../utils/dateUtils';
import { Activity, TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MachineChartProps {
  data: MachineData[];
  machineId: string;
  machineName:string;
  isLoading: boolean;
}

const MachineChart: React.FC<MachineChartProps> = ({ data, machineId, machineName,isLoading }) => {
  const chartData = {
    labels: data.map(item => formatDate(item.date)),
    datasets: [
      {
        label: `Machine ${machineName} Daily Distance`,
        data: data.map(item => parseDistance(item.totalDistance)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: 'rgb(37, 99, 235)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `Distance: ${context.parsed.y.toFixed(2)} km`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return `${value} km`;
          },
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
  };

  const totalDistance = data.reduce((sum, item) => sum + parseDistance(item.totalDistance), 0);
  const avgDistance = data.length > 0 ? totalDistance / data.length : 0;
  const workingDays = data.filter(item => parseDistance(item.totalDistance) > 0).length;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-800">
            Machine {machineName} Work Activity
          </h2>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span>{data.length} days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Total Distance</div>
          <div className="text-2xl font-bold text-blue-700">{totalDistance.toFixed(2)} km</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Average Distance</div>
          <div className="text-2xl font-bold text-green-700">{avgDistance.toFixed(2)} km</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium">Working Days</div>
          <div className="text-2xl font-bold text-purple-700">{workingDays}</div>
        </div>
      </div>

      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default MachineChart;