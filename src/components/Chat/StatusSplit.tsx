interface StatusSplitProps {
  statsData?: any;
  activeTab?: 'GP_INSTALLATION' | 'BLOCK_INSTALLATION';

}

export function StatusSplit({ statsData ,activeTab = 'GP_INSTALLATION'}: StatusSplitProps) {
  const accept = statsData?.accepted_count || 0;
  const pending = statsData?.pending_count || 0;
  const reject = statsData?.rejected_count || 0;
  const totalSites =
  activeTab === 'GP_INSTALLATION'
    ? (statsData?.total_survey_count || 0)
    : (statsData?.total_install_count || 0);

  const acceptPercent = totalSites
    ? Math.round((accept / totalSites) * 100)
    : 69;
  const pendingPercent = totalSites
    ? Math.round((pending / totalSites) * 100)
    : 21;
  const rejectPercent = totalSites
    ? Math.round((reject / totalSites) * 100)
    : 10;

  const acceptDash = (acceptPercent / 100) * 360;
  const pendingDash = (pendingPercent / 100) * 360;
  const rejectDash = (rejectPercent / 100) * 360;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-6">
        STATUS SPLIT
      </h3>

      <div className="relative w-40 h-40 mb-8">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="12"
            strokeDasharray={`${pendingDash} 360`}
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#1e3a8a"
            strokeWidth="12"
            strokeDasharray={`${acceptDash} 360`}
            strokeDashoffset={`-${pendingDash}`}
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
            strokeDasharray={`${rejectDash} 360`}
            strokeDashoffset={`-${pendingDash + acceptDash}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {totalSites.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 uppercase">TOTAL Surveys</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-900" />
            <span className="text-sm text-gray-600">Accept</span>
          </div>
          <span className="font-semibold text-gray-900">{acceptPercent}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <span className="font-semibold text-gray-900">{pendingPercent}%</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-sm text-gray-600">Reject</span>
          </div>
          <span className="font-semibold text-gray-900">{rejectPercent}%</span>
        </div>
      </div>
    </div>
  );
}
