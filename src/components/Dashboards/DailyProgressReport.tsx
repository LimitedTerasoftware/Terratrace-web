import React from 'react';

const BharatNetDashboard = () => {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">BharatNet Phase III - Maharashtra/Pune</h1>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>🏢 Tera Software + ITI</span>
              <span>📅 24/09/2025</span>
              <span>👤 Rajesh Kumar</span>
              <span>📞 +91 98765 43210</span>
            </div>
          </div>
          <div className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium text-center">
            📊 DPR<br />
            <span className="text-xs">Daily Progress Report</span>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Summary</h2>
          
          <div className="grid grid-cols-5 gap-6 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">78%</div>
              <div className="text-sm text-gray-600">Overall Completion</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">+5</div>
              <div className="text-sm text-gray-600">Days Behind Schedule</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-red-600 font-medium mb-1">Wayleave Delays</div>
              <div className="text-sm text-gray-600">Top Risk</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-orange-600 font-medium mb-1">Contractor B</div>
              <div className="text-sm text-gray-600">Key Watch</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-green-600 mb-1">20/05/2025</div>
              <div className="text-sm text-gray-600">Forecast Completion</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>On Track (≥95%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Slight Delay (85-95%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Critical Delay (&lt;85%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span>Pending/Not Started</span>
            </div>
          </div>
        </div>

        {/* A. Survey Progress */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">A. Survey Progress</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Metric</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Today</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cumulative</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Target</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Δ vs Target</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">% Achieved</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trend (7d)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Blocks Assigned</td>
                  <td className="px-4 py-3 text-sm text-gray-700">15</td>
                  <td className="px-4 py-3 text-sm text-gray-700">450</td>
                  <td className="px-4 py-3 text-sm text-gray-700">500</td>
                  <td className="px-4 py-3 text-sm text-red-600">-50</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-medium">90%</td>
                  <td className="px-4 py-3 text-sm">📈</td>
                  <td className="px-4 py-3 text-sm text-gray-600">In Progress</td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Blocks Completed</td>
                  <td className="px-4 py-3 text-sm text-gray-700">12</td>
                  <td className="px-4 py-3 text-sm text-gray-700">420</td>
                  <td className="px-4 py-3 text-sm text-gray-700">450</td>
                  <td className="px-4 py-3 text-sm text-red-600">-30</td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-medium">93%</td>
                  <td className="px-4 py-3 text-sm">📈</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Slight delay</td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Blocks Verified</td>
                  <td className="px-4 py-3 text-sm text-gray-700">8</td>
                  <td className="px-4 py-3 text-sm text-gray-700">380</td>
                  <td className="px-4 py-3 text-sm text-gray-700">420</td>
                  <td className="px-4 py-3 text-sm text-red-600">-40</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-medium">90%</td>
                  <td className="px-4 py-3 text-sm">📉</td>
                  <td className="px-4 py-3 text-sm text-gray-600">QC backlog</td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">QC Pass %</td>
                  <td className="px-4 py-3 text-sm text-gray-700">95%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">92%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">95%</td>
                  <td className="px-4 py-3 text-sm text-gray-600">N/A</td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-medium">92%</td>
                  <td className="px-4 py-3 text-sm">—</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Improving</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* B. Construction Progress */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">B. Construction Progress</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Metric</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Today</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cumulative</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Target</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Δ vs Target</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">% Achieved</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trend (7d)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Variance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Km Planned</td>
                  <td className="px-4 py-3 text-sm text-gray-700">25</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1250</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1500</td>
                  <td className="px-4 py-3 text-sm text-red-600">-250</td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-medium">83%</td>
                  <td className="px-4 py-3 text-sm">—</td>
                  <td className="px-4 py-3 text-sm text-red-600">-17%</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Km Completed</td>
                  <td className="px-4 py-3 text-sm text-gray-700">18</td>
                  <td className="px-4 py-3 text-sm text-gray-700">980</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1200</td>
                  <td className="px-4 py-3 text-sm text-red-600">-220</td>
                  <td className="px-4 py-3 text-sm text-red-700 font-medium">82%</td>
                  <td className="px-4 py-3 text-sm">📈</td>
                  <td className="px-4 py-3 text-sm text-red-600">-18%</td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Trenching (km)</td>
                  <td className="px-4 py-3 text-sm text-gray-700">22</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1100</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1250</td>
                  <td className="px-4 py-3 text-sm text-red-600">-150</td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-medium">88%</td>
                  <td className="px-4 py-3 text-sm">📉</td>
                  <td className="px-4 py-3 text-sm text-orange-600">-12%</td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Cable Blowing (km)</td>
                  <td className="px-4 py-3 text-sm text-gray-700">15</td>
                  <td className="px-4 py-3 text-sm text-gray-700">850</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1000</td>
                  <td className="px-4 py-3 text-sm text-red-600">-150</td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-medium">85%</td>
                  <td className="px-4 py-3 text-sm">📉</td>
                  <td className="px-4 py-3 text-sm text-orange-600">-15%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* C. Installation Progress */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">C. Installation Progress</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Metric</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Today</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cumulative</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Target</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Δ vs Target</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">% Achieved</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Trend (7d)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Sites Planned</td>
                  <td className="px-4 py-3 text-sm text-gray-700">45</td>
                  <td className="px-4 py-3 text-sm text-gray-700">2250</td>
                  <td className="px-4 py-3 text-sm text-gray-700">2500</td>
                  <td className="px-4 py-3 text-sm text-red-600">-250</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-medium">90%</td>
                  <td className="px-4 py-3 text-sm">—</td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Sites Installed</td>
                  <td className="px-4 py-3 text-sm text-gray-700">38</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1950</td>
                  <td className="px-4 py-3 text-sm text-gray-700">2200</td>
                  <td className="px-4 py-3 text-sm text-red-600">-250</td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-medium">89%</td>
                  <td className="px-4 py-3 text-sm">📈</td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">HOTO Completed</td>
                  <td className="px-4 py-3 text-sm text-gray-700">32</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1680</td>
                  <td className="px-4 py-3 text-sm text-gray-700">1900</td>
                  <td className="px-4 py-3 text-sm text-red-600">-220</td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-medium">88%</td>
                  <td className="px-4 py-3 text-sm">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pipeline Conversion Funnel */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Pipeline Conversion Funnel</h3>
          
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="bg-blue-500 text-white rounded-lg p-6 w-32">
                <div className="text-2xl font-bold">420</div>
                <div className="text-sm">Surveyed</div>
                <div className="text-xs mt-1">93%</div>
              </div>
            </div>
            
            <div className="text-2xl text-gray-400">→</div>
            
            <div className="text-center">
              <div className="bg-orange-500 text-white rounded-lg p-6 w-32">
                <div className="text-2xl font-bold">980</div>
                <div className="text-sm">Construction</div>
                <div className="text-xs mt-1">82%</div>
              </div>
            </div>
            
            <div className="text-2xl text-gray-400">→</div>
            
            <div className="text-center">
              <div className="bg-purple-500 text-white rounded-lg p-6 w-32">
                <div className="text-2xl font-bold">1950</div>
                <div className="text-sm">Installation</div>
                <div className="text-xs mt-1">89%</div>
              </div>
            </div>
            
            <div className="text-2xl text-gray-400">→</div>
            
            <div className="text-center">
              <div className="bg-green-500 text-white rounded-lg p-6 w-32">
                <div className="text-2xl font-bold">1680</div>
                <div className="text-sm">HOTO</div>
                <div className="text-xs mt-1">88%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contractor Benchmarking */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contractor Benchmarking</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contractor</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Survey SLA %</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Construction SLA %</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Installation SLA %</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">QC %</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">FTR %</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-green-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Contractor A</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-medium">95%</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-medium">92%</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-medium">94%</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-medium">93%</td>
                  <td className="px-4 py-3 text-sm text-green-700 font-medium">92%</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Low
                    </span>
                  </td>
                </tr>
                <tr className="bg-orange-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Contractor B</td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-medium">85%</td>
                  <td className="px-4 py-3 text-sm text-red-700 font-medium">80%</td>
                  <td className="px-4 py-3 text-sm text-red-700 font-medium">78%</td>
                  <td className="px-4 py-3 text-sm text-orange-700 font-medium">82%</td>
                  <td className="px-4 py-3 text-sm text-red-700 font-medium">75%</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Medium
                    </span>
                  </td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Contractor C</td>
                  <td className="px-4 py-3 text-sm text-red-700 font-medium">75%</td>
                  <td className="px-4 py-3 text-sm text-red-700 font-medium">70%</td>
                  <td className="px-4 py-3 text-sm text-red-700 font-medium">65%</td>
                  <td className="px-4 py-3 text-sm text-red-700 font-medium">70%</td>
                  <td className="px-4 py-3 text-sm text-red-700 font-medium">60%</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      High
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk, Delay & Escalation Log */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk, Delay & Escalation Log</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Stage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Issue</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Affected</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">SLA Impact</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action Taken</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Owner</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Days Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Survey</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Wayleave Clearance Delay</td>
                  <td className="px-4 py-3 text-sm text-gray-700">50 Blocks</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Local Authority Approval</td>
                  <td className="px-4 py-3 text-sm text-red-600 font-medium">+7 days</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Escalated to District Collector</td>
                  <td className="px-4 py-3 text-sm text-gray-700">PM Team</td>
                  <td className="px-4 py-3 text-sm text-center">12</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Construction</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Material Shortage</td>
                  <td className="px-4 py-3 text-sm text-gray-700">25 Km</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Supply Chain Disruption</td>
                  <td className="px-4 py-3 text-sm text-orange-600 font-medium">+3 days</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Alternative Supplier Engaged</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Logistics</td>
                  <td className="px-4 py-3 text-sm text-center">5</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Installation</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Power Connection Delay</td>
                  <td className="px-4 py-3 text-sm text-gray-700">15 Sites</td>
                  <td className="px-4 py-3 text-sm text-gray-700">MSEB Approval</td>
                  <td className="px-4 py-3 text-sm text-green-600 font-medium">Resolved</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Temporary Power Arranged</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Site Team</td>
                  <td className="px-4 py-3 text-sm text-center">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Milestones & Forecast */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Milestones & Forecast</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Milestone</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Target Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Forecast Completion</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Δ vs Target</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Survey 100%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">15/03/2025</td>
                  <td className="px-4 py-3 text-sm text-gray-700">85%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">20/03/2025</td>
                  <td className="px-4 py-3 text-sm text-orange-600 font-medium">+5 days</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Medium
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Construction 75%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">30/04/2025</td>
                  <td className="px-4 py-3 text-sm text-gray-700">62%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">07/05/2025</td>
                  <td className="px-4 py-3 text-sm text-red-600 font-medium">+7 days</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      High
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">Installation HOTO</td>
                  <td className="px-4 py-3 text-sm text-gray-700">15/05/2025</td>
                  <td className="px-4 py-3 text-sm text-gray-700">70%</td>
                  <td className="px-4 py-3 text-sm text-gray-700">15/05/2025</td>
                  <td className="px-4 py-3 text-sm text-green-600 font-medium">0 days</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Low
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-sm text-gray-500 pt-6 border-t">
          <div>Generated on 24/09/2025 at 09:45 AM</div>
          <div>BharatNet Phase III - DPR Report</div>
        </div>
      </div>
    </div>
  );
};

export default BharatNetDashboard;