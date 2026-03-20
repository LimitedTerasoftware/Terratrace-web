export default function StateProgress() {
  const states = [
    { name: 'West Bengal', progress: 85, color: 'bg-green-500' },
    { name: 'Maharashtra', progress: 60, color: 'bg-blue-500' },
    { name: 'Karnataka', progress: 42, color: 'bg-orange-500' },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">State-wise Progress</h3>
      <div className="space-y-6">
        {states.map((state) => (
          <div key={state.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{state.name}</span>
              <span className="text-sm font-semibold text-gray-900">{state.progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${state.color} rounded-full transition-all duration-500`}
                style={{ width: `${state.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
