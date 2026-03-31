export function ProgressBar({ percentage, color = 'bg-blue-600' }: { percentage: number; color?: string }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mt-3 mb-3">
      <div className={`h-full ${color} rounded-full transition-all duration-300`} style={{ width: `${percentage}%` }} />
    </div>
  );
}
