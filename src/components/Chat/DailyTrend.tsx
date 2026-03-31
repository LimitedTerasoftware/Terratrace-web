export function DailyTrend() {
  const data = [
    { date: 'OCT 18', value: 400, height: '30%' },
    { date: 'OCT 19', value: 800, height: '60%' },
    { date: 'OCT 20', value: 600, height: '45%' },
    { date: 'OCT 21', value: 900, height: '68%' },
    { date: 'OCT 22', value: 550, height: '41%' },
    { date: 'OCT 23', value: 700, height: '52%' },
    { date: 'TODAY', value: 1100, height: '83%', highlight: true },
  ];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">DAILY INSTALLATION TREND</h3>
        <div className="flex gap-2">
          <button className="text-xs text-gray-600 font-medium px-2 py-1 hover:bg-gray-100 rounded">GP</button>
          <button className="text-xs text-gray-600 font-medium px-2 py-1 hover:bg-gray-100 rounded">BLOCK</button>
        </div>
      </div>

      <div className="flex items-end justify-between h-48 gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1">
            <div className={`w-full rounded-t transition-all duration-300 ${
              item.highlight ? 'bg-blue-600' : 'bg-blue-200'
            }`} style={{ height: item.height }} />
            <span className="text-xs text-gray-600 font-medium text-center leading-tight">{item.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
