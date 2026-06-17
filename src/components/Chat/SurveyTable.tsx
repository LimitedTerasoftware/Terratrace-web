const surveys = [
  { type: 'Gram Panchayat', purpose: 'Site Feasibility', total: '4,289', approved: '3,104', pending: '1,057', rejected: '128', nextStage: 'Installation', stageColor: '#3b82f6' },
  { type: 'Block Level', purpose: 'POP Infrastructure', total: '142', approved: '112', pending: '22', rejected: '8', nextStage: 'Installation', stageColor: '#3b82f6' },
  { type: 'Underground (UG)', purpose: 'Trenching/Blowing', total: '6,200 KM', approved: '5,420 KM', pending: '650 KM', rejected: '130 KM', nextStage: 'Construction', stageColor: '#f59e0b' },
  { type: 'Aerial', purpose: 'Pole Survey', total: '18,500 P', approved: '14,200 P', pending: '3,100 P', rejected: '1,200 P', nextStage: 'Construction', stageColor: '#f59e0b' },
  { type: 'HOTO', purpose: 'Final Handover', total: '1,200', approved: '45', pending: '1,152', rejected: '3', nextStage: 'Acceptance', stageColor: '#22c55e' },
];

export default function SurveyTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800">Survey Status by Purpose</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Survey Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Purpose</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rejected</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Stage</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {surveys.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-5 py-3.5 font-medium text-gray-800">{row.type}</td>
                <td className="px-4 py-3.5 text-gray-500">{row.purpose}</td>
                <td className="px-4 py-3.5 text-right text-gray-700 font-medium">{row.total}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-emerald-600">{row.approved}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-amber-500">{row.pending}</td>
                <td className="px-4 py-3.5 text-right font-semibold text-red-500">{row.rejected}</td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: row.stageColor, backgroundColor: row.stageColor + '1a' }}>
                    {row.nextStage}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors">View Logs</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
