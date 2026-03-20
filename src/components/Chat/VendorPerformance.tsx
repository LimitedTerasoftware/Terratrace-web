import { ApexOptions } from 'apexcharts';
import ReactApexChart from 'react-apexcharts';
import { MachineDetailsResponse } from '../../types/machine';

interface VendorPerformanceProps {
  data?: MachineDetailsResponse | null;
}

const options: ApexOptions = {
  chart: {
    fontFamily: 'Satoshi, sans-serif',
    type: 'bar',
    height: 300,
    toolbar: {
      show: false,
    },
  },
  colors: ['#3C50E0'],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '50%',
      borderRadius: 4,
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent'],
  },
  grid: {
    xaxis: {
      lines: {
        show: false,
      },
    },
    yaxis: {
      lines: {
        show: true,
      },
    },
  },
  xaxis: {
    type: 'category',
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      rotate: -45,
      style: {
        fontSize: '11px',
      },
    },
  },
  yaxis: {
    title: {
      text: 'Total Distance (m)',
      style: {
        fontSize: '12px',
        color: '#6B7280',
      },
    },
  },
  fill: {
    opacity: 1,
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val.toLocaleString()} m`,
    },
  },
};

export default function VendorPerformance({ data }: VendorPerformanceProps) {
  const vendorData = data?.data || [];

  const categories = vendorData.map((v) => v.firm_name);
  const seriesData = vendorData.map(
    (v) => parseFloat(v.total_distance_meters) || 0,
  );

  const series = [
    {
      name: 'Total Distance',
      data: seriesData,
    },
  ];
   const chartOptions: ApexOptions = {
    ...options,
    xaxis: {
      ...options.xaxis,
      categories: categories, 
    },
  };
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Vendor Performance
      </h3>
      {vendorData.length > 0 ? (
        <ReactApexChart
          options={chartOptions}
          series={series}
          type="bar"
          height={300}
        />
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No vendor data available
        </div>
      )}
    </div>
  );
}
