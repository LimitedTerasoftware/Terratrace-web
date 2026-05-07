import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

interface TrendDataItem {
  date: string;
  gp_installed: number;
  block_installed: number;
}

interface DailyTrendProps {
  trendData?: TrendDataItem[];
  loading?: boolean;
  activeTab?: 'GP_INSTALLATION' | 'BLOCK_INSTALLATION';
}

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const fmt = (s: string) => {
  const d = new Date(s);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2,'0')}`;
};

const COLOR = { GP_INSTALLATION: '#185FA5', BLOCK_INSTALLATION: '#D85A30' };
const COLOR_FILL = { GP_INSTALLATION: 'rgba(24,95,165,0.08)', BLOCK_INSTALLATION: 'rgba(216,90,48,0.08)' };

export function DailyTrend({ trendData = [], loading, activeTab = 'GP_INSTALLATION' }: DailyTrendProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const values = trendData?.map(r => activeTab === 'GP_INSTALLATION' ? r.gp_installed : r.block_installed);
  const labels = trendData?.map(r => fmt(r.date));
  const total = values?.reduce((a, b) => a + b, 0);
  const peak = values?.length ? Math.max(...values) : 0;
  const avg = values?.length ? (total / values?.length).toFixed(1) : '0';

  const minWidth = Math.max(600, trendData?.length * 60);

  useEffect(() => {
    if (!canvasRef.current || loading) return;
    chartRef.current?.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: activeTab === 'GP_INSTALLATION' ? 'GP Installations' : 'Block Installations',
          data: values,
          borderColor: COLOR[activeTab],
          backgroundColor: COLOR_FILL[activeTab],
          borderWidth: 2,
          pointBackgroundColor: COLOR[activeTab],
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { autoSkip: false, maxRotation: 45, font: { size: 11 } } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
    return () => chartRef.current?.destroy();
  }, [trendData, activeTab, loading]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      {/* header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Daily Installation Trend</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded ${activeTab === 'GP_INSTALLATION' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
          {activeTab === 'GP_INSTALLATION' ? 'GP' : 'Block'}
        </span>
      </div>
      {/* stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[['Total', total], ['Peak day', peak], ['Avg / day', avg]].map(([label, val]) => (
          <div key={label as string} className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-medium text-gray-900">{val}</p>
          </div>
        ))}
      </div>
      {/* chart */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ position: 'relative', height: 260, width: minWidth }}>
            <canvas ref={canvasRef} />
          </div>
        </div>
      )}
    </div>
  );
}