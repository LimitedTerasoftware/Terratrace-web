export default function VendorPerformance() {
  const vendors = [
    { name: 'V1', value: 65 },
    { name: 'V2', value: 55 },
    { name: 'V3', value: 85 },
    { name: 'V4', value: 75 },
    { name: 'V5', value: 80 },
  ];

  const maxValue = Math.max(...vendors.map((v) => v.value));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Vendor Performance</h3>
      <div className="flex items-end justify-between h-48 space-x-3">
        {vendors.map((vendor, index) => (
          <div key={vendor.name} className="flex-1 flex flex-col items-center justify-end">
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${
                index === 2 ? 'bg-blue-600' : 'bg-blue-300'
              }`}
              style={{ height: `${(vendor.value / maxValue) * 100}%` }}
            ></div>
            <span className="text-xs font-medium text-gray-600 mt-2">{vendor.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
