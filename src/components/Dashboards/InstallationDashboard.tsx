import React, { useState } from 'react';

// Mock data for installation teams
const mockTeams = [
  {
    id: 1,
    name: "Team Alpha",
    company: "Alpha Tech Solutions",
    avatar: "🛠️",
    planned: 120,
    installed: 95,
    onts: 90,
    ccus: 25,
    batteries: 20,
    hoto: "90%",
    ftr: "94%",
    qcPass: "96%",
    sla: "97%",
    risk: "Low",
    status: "Excellent"
  },
  {
    id: 2,
    name: "Team Beta",
    company: "Beta Solutions Ltd",
    avatar: "⚡",
    planned: 100,
    installed: 60,
    onts: 55,
    ccus: 15,
    batteries: 10,
    hoto: "66%",
    ftr: "70%",
    qcPass: "82%",
    sla: "75%",
    risk: "High",
    status: "Needs Attention"
  }
];

const InstallationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'Teams' | 'Contractors'>('Teams');
  const [activeView, setActiveView] = useState<'Table View' | 'Charts & Analytics'>('Table View');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Needs Attention': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header and Filters Combined Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">Installation Dashboard</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                A
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
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
                  <option>Alpha Tech Solutions</option>
                  <option>Beta Solutions Ltd</option>
                </select>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[120px]">
                  <option>All Teams</option>
                  <option>Team Alpha</option>
                  <option>Team Beta</option>
                </select>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[120px]">
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 rounded-md p-0.5">
                  <button 
                    className={`px-4 py-1.5 text-sm rounded font-medium ${
                      activeTab === 'Teams' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                    onClick={() => setActiveTab('Teams')}
                  >
                    Teams
                  </button>
                  <button 
                    className={`px-4 py-1.5 text-sm rounded font-medium ${
                      activeTab === 'Contractors' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                    onClick={() => setActiveTab('Contractors')}
                  >
                    Contractors
                  </button>
                </div>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </button>
                
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>
            </div>

            {/* Active Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                District A
                <button className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
              
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                This Week
                <button className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="bg-white rounded-lg shadow-sm border mb-6 p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">1,200 / 950</div>
              <div className="text-sm text-gray-600 mb-2">Planned / Installed</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '79%' }}></div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">920</div>
              <div className="text-sm text-gray-600">ONTs Installed</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">210</div>
              <div className="text-sm text-gray-600">CCUs Installed</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">180</div>
              <div className="text-sm text-gray-600">Batteries Installed</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">88%</div>
              <div className="text-sm text-gray-600">First-Time-Right</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">92%</div>
              <div className="text-sm text-gray-600">QC Pass Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">87%</div>
              <div className="text-sm text-gray-600">SLA Compliance</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">45</div>
              <div className="text-sm text-gray-600">HOTO Pending</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">3</div>
              <div className="text-sm text-gray-600">At-Risk Contractors</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600 mb-1">15</div>
              <div className="text-sm text-gray-600">Swaps/Returns</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* View Toggle and New Assignment */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex bg-gray-100 rounded-md p-1">
              <button 
                className={`px-4 py-2 text-sm rounded font-medium ${
                  activeView === 'Table View' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
                onClick={() => setActiveView('Table View')}
              >
                Table View
              </button>
              <button 
                className={`px-4 py-2 text-sm rounded font-medium ${
                  activeView === 'Charts & Analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
                onClick={() => setActiveView('Charts & Analytics')}
              >
                Charts & Analytics
              </button>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Assignment
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team/Contractor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ONTs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CCUs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batteries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HOTO %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FTR %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QC Pass</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">{team.avatar}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{team.name}</div>
                          <div className="text-sm text-gray-500">{team.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.planned}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{team.installed}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.onts}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.ccus}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.batteries}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{team.hoto}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{team.ftr}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{team.qcPass}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{team.sla}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(team.risk)}`}>
                        {team.risk}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(team.status)}`}>
                        {team.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-800">Reassign</button>
                        <button className="text-blue-600 hover:text-blue-800">Split</button>
                        <button className="text-blue-600 hover:text-blue-800">Escalate</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallationDashboard;