import { Sliders } from 'lucide-react';

export function InstallationFunnel() {
  const stages = [
    { name: 'Site Surveyed', value: 14280 },
    { name: 'Material Requisition', value: 12852 },
    { name: 'Rack Installation', value: 11709 },
    { name: 'Cabling & Power', value: 10710 },
    { name: 'Network Config', value: 9710 },
    { name: 'Final Checklist', value: 8282 },
    { name: 'FAT Completion', value: 6884 },
    { name: 'HOTO Done', value: 4570 },
  ];

  const maxValue = Math.max(...stages.map(s => s.value));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          INSTALLATION FUNNEL
        </h3>
        <Sliders size={16} className="text-gray-400" />
      </div>

      {/* Funnel */}
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const width = (stage.value / maxValue) * 100;

          return (
            <div key={idx} className="flex justify-start">
              <div
                className="relative h-9 flex items-center justify-between px-4 text-white text-sm font-medium rounded-md transition-all"
                style={{
                  width: `${width}%`,
                  background: `linear-gradient(to right, #2b2f8f, #4f46e5)`,
                }}
              >
                <span>{stage.name}</span>
                <span className="text-xs font-semibold ml-2">
                  {stage.value.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}