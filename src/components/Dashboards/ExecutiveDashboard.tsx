import React, { useState } from 'react';

const ExecutiveDashboard: React.FC = () => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('This Month');
  const [selectedView, setSelectedView] = useState('All');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header and Filters Combined Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Last updated: 2 minutes ago</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Report
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 012 0v4m0 0V3a1 1 0 012 0v4m0 0V7a1 1 0 011 1v8a2 2 0 01-2 2H6a2 2 0 01-2-2V8a1 1 0 011-1z" />
                </svg>
                Schedule Report
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[120px]">
                  <option>All Projects</option>
                  <option>Project A</option>
                  <option>Project B</option>
                </select>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[120px]">
                  <option>All States</option>
                  <option>State A</option>
                  <option>State B</option>
                </select>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[120px]">
                  <option>All Districts</option>
                  <option>District A</option>
                  <option>District B</option>
                </select>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[120px]">
                  <option>All Blocks</option>
                  <option>Block A</option>
                  <option>Block B</option>
                </select>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[120px]">
                  <option>All Contractors</option>
                  <option>Contractor A</option>
                  <option>Contractor B</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 rounded-md p-1">
                  {(['All', 'Survey', 'Construction', 'Installation'] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => setSelectedView(view)}
                      className={`px-4 py-2 text-sm rounded font-medium transition-colors ${
                        selectedView === view
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
                
                <select 
                  value={selectedTimeFrame}
                  onChange={(e) => setSelectedTimeFrame(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[120px]"
                >
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>Last Month</option>
                  <option>This Quarter</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Project Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Survey Card */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Survey</h3>
              <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                <span>4 Risks</span>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Assigned:</div>
                <div className="font-semibold text-gray-900">220</div>
              </div>
              <div>
                <div className="text-gray-600">Completed:</div>
                <div className="font-semibold text-gray-900">150</div>
              </div>
              <div>
                <div className="text-gray-600">Verified:</div>
                <div className="font-semibold text-gray-900">130</div>
              </div>
              <div>
                <div className="text-gray-600">QC:</div>
                <div className="font-semibold text-green-600">92%</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-600">SLA:</div>
                <div className="font-semibold text-orange-600">89%</div>
              </div>
            </div>
          </div>

          {/* Construction Card */}
          <div className="bg-orange-50 rounded-lg border border-orange-200 p-6 relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Construction</h3>
              <div className="flex items-center gap-1 text-sm font-medium text-orange-600">
                <span>3 Risks</span>
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Planned:</div>
                <div className="font-semibold text-gray-900">1,200 km</div>
              </div>
              <div>
                <div className="text-gray-600">Completed:</div>
                <div className="font-semibold text-gray-900">865 km</div>
              </div>
              <div>
                <div className="text-gray-600">QC:</div>
                <div className="font-semibold text-green-600">90%</div>
              </div>
              <div>
                <div className="text-gray-600">SLA:</div>
                <div className="font-semibold text-orange-600">85%</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-600">Variance:</div>
                <div className="font-semibold text-green-600">+8%</div>
              </div>
            </div>
          </div>

          {/* Installation Card */}
          <div className="bg-green-50 rounded-lg border border-green-200 p-6 relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Installation</h3>
              <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                <span>2 Risks</span>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Planned:</div>
                <div className="font-semibold text-gray-900">1,200 sites</div>
              </div>
              <div>
                <div className="text-gray-600">Installed:</div>
                <div className="font-semibold text-gray-900">950</div>
              </div>
              <div>
                <div className="text-gray-600">FTR:</div>
                <div className="font-semibold text-orange-600">88%</div>
              </div>
              <div>
                <div className="text-gray-600">QC:</div>
                <div className="font-semibold text-green-600">92%</div>
              </div>
              <div className="col-span-2">
                <div className="text-gray-600">HOTO Pending:</div>
                <div className="font-semibold text-gray-900">45</div>
              </div>
            </div>
          </div>
        </div>

        {/* End-to-End Pipeline Progress */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">End-to-End Pipeline Progress</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">Surveyed Blocks</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-blue-500 h-3 rounded-full" style={{ width: '68%' }}></div>
              </div>
              <div className="text-sm font-medium text-gray-900">150/220 (68%)</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600 mb-2">Construction Started</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-orange-500 h-3 rounded-full" style={{ width: '72%' }}></div>
              </div>
              <div className="text-sm font-medium text-gray-900">865/1200 km (72%)</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600 mb-2">Installation Done</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: '79%' }}></div>
              </div>
              <div className="text-sm font-medium text-gray-900">950/1200 (79%)</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-600 mb-2">HOTO Completed</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div className="bg-purple-500 h-3 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <div className="text-sm font-medium text-gray-900">905/1200 (75%)</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Stage-wise Completion Progress */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Stage-wise Completion Progress</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {[
                { name: 'Survey', completed: 68, inProgress: 22, pending: 10 },
                { name: 'Construction', completed: 72, inProgress: 18, pending: 10 },
                { name: 'Installation', completed: 79, inProgress: 15, pending: 6 }
              ].map((stage, index) => (
                <div key={index}>
                  <div className="text-sm font-medium text-gray-700 mb-2">{stage.name}</div>
                  <div className="flex h-8 rounded-lg overflow-hidden">
                    <div 
                      className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${stage.completed}%` }}
                    >
                      {stage.completed > 10 && `${stage.completed}%`}
                    </div>
                    <div 
                      className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${stage.inProgress}%` }}
                    >
                      {stage.inProgress > 10 && `${stage.inProgress}%`}
                    </div>
                    <div 
                      className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                      style={{ width: `${stage.pending}%` }}
                    >
                      {stage.pending > 5 && `${stage.pending}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
            </div>
          </div>

          {/* Project Milestones & Risk Alerts */}
          <div className="space-y-6">
            {/* Project Milestones */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Milestones</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Survey Completion</div>
                    <div className="text-xs text-green-600">On Track - Mar 15</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Construction 75%</div>
                    <div className="text-xs text-orange-600">At Risk - Apr 29</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Installation Go-Live</div>
                    <div className="text-xs text-red-600">Delayed - May 30</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">HOTO Deadline</div>
                    <div className="text-xs text-gray-600">Pending - Jun 15</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Risk & Alerts */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk & Alerts</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-red-800">3 overdue blocks in Nadia</div>
                    <div className="text-xs text-red-600">Survey stage</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <svg className="w-5 h-5 text-orange-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-orange-800">Team Beta 18% rectification</div>
                    <div className="text-xs text-orange-600">Construction stage</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <div className="text-sm font-medium text-red-800">45 sites HOTO pending 7 days</div>
                    <div className="text-xs text-red-600">Installation stage</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Risk Heatmap - Districts vs Stages */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Risk Heatmap - Districts vs Stages</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 mb-4">
              {[
                { district: 'Kolkata', survey: 'orange', construction: 'green', installation: 'yellow' },
                { district: 'Howrah', survey: 'green', construction: 'yellow', installation: 'orange' },
                { district: 'Hooghly', survey: 'yellow', construction: 'orange', installation: 'green' },
                { district: 'Nadia', survey: 'orange', construction: 'orange', installation: 'yellow' }
              ].map((row, index) => (
                <div key={index} className="grid grid-cols-4 gap-2">
                  <div className="text-sm font-medium text-gray-700 flex items-center p-2">
                    {row.district}
                  </div>
                  <div className={`h-12 rounded flex items-center justify-center text-white text-xs font-medium ${
                    row.survey === 'green' ? 'bg-green-500' : 
                    row.survey === 'yellow' ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}>
                    Survey
                  </div>
                  <div className={`h-12 rounded flex items-center justify-center text-white text-xs font-medium ${
                    row.construction === 'green' ? 'bg-green-500' : 
                    row.construction === 'yellow' ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}>
                    Construction
                  </div>
                  <div className={`h-12 rounded flex items-center justify-center text-white text-xs font-medium ${
                    row.installation === 'green' ? 'bg-green-500' : 
                    row.installation === 'yellow' ? 'bg-yellow-500' : 'bg-orange-500'
                  }`}>
                    Installation
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-600">Low Risk (0-2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-xs text-gray-600">Medium Risk (2-4)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-xs text-gray-600">High Risk (4-6)</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>0</span>
                <span>2</span>
                <span>4</span>
                <span>6</span>
              </div>
            </div>
          </div>

          {/* QC Pass vs Fail & SLA Compliance Trend */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QC Pass vs Fail */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">QC Pass vs Fail</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${85 * 2.51} ${(100 - 85) * 2.51}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">85%</div>
                    <div className="text-xs text-gray-500">Pass</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Pass</span>
                  </div>
                  <span className="text-sm font-medium">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">Fail</span>
                  </div>
                  <span className="text-sm font-medium">15%</span>
                </div>
              </div>
            </div>

            {/* SLA Compliance Trend */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">SLA Compliance Trend</h3>
                <button className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              
              <div className="h-24 relative mb-4">
                <svg className="w-full h-full" viewBox="0 0 300 80">
                  {/* Grid lines */}
                  <defs>
                    <pattern id="grid" width="75" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 75 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Survey line */}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    points="37.5,20 112.5,30 187.5,25 262.5,35"
                  />
                  {/* Construction line */}
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    points="37.5,25 112.5,35 187.5,30 262.5,40"
                  />
                  {/* Installation line */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    points="37.5,15 112.5,25 187.5,20 262.5,30"
                  />
                  
                  {/* Data points */}
                  <circle cx="37.5" cy="20" r="3" fill="#3b82f6" />
                  <circle cx="112.5" cy="30" r="3" fill="#3b82f6" />
                  <circle cx="187.5" cy="25" r="3" fill="#3b82f6" />
                  <circle cx="262.5" cy="35" r="3" fill="#3b82f6" />
                  
                  <circle cx="37.5" cy="25" r="3" fill="#f59e0b" />
                  <circle cx="112.5" cy="35" r="3" fill="#f59e0b" />
                  <circle cx="187.5" cy="30" r="3" fill="#f59e0b" />
                  <circle cx="262.5" cy="40" r="3" fill="#f59e0b" />
                  
                  <circle cx="37.5" cy="15" r="3" fill="#10b981" />
                  <circle cx="112.5" cy="25" r="3" fill="#10b981" />
                  <circle cx="187.5" cy="20" r="3" fill="#10b981" />
                  <circle cx="262.5" cy="30" r="3" fill="#10b981" />
                </svg>
                
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Survey</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Construction</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">Installation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Contractors Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contractors</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div>
                <div className="text-sm font-medium text-gray-900">Contractor A</div>
                <div className="text-xs text-gray-600">SLA: 95% | QC: 98% | FTR: 92%</div>
              </div>
              <div className="text-xl font-bold text-green-600">#1</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <div className="text-sm font-medium text-gray-900">Contractor B</div>
                <div className="text-xs text-gray-600">SLA: 89% | QC: 94% | FTR: 88%</div>
              </div>
              <div className="text-xl font-bold text-blue-600">#2</div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div>
                <div className="text-sm font-medium text-gray-900">Contractor C</div>
                <div className="text-xs text-gray-600">SLA: 82% | QC: 87% | FTR: 85%</div>
              </div>
              <div className="text-xl font-bold text-orange-600">#3</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;