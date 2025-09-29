import React, { useState } from 'react';
import { 
  Download, 
  Mail, 
  X, 
  Trophy, 
  AlertTriangle, 
  MoreHorizontal,
  Construction,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown
} from "lucide-react";

// Mock data for construction teams
const mockTeams = [
  {
    id: 1,
    name: "Team Alpha",
    company: "BuildCorp Ltd",
    avatar: "🏗️",
    blocks: 15,
    planned: "120 km",
    completed: "90 km",
    trenching: "65 km",
    ducting: "55 km",
    cable: "52 km",
    splices: 520,
    qcPass: "93%",
    sla: "95%",
    variance: "+3%",
    status: "Excellent",
    risk: "Low Risk"
  },
  {
    id: 2,
    name: "Team Beta",
    company: "FastTrack Construction",
    avatar: "🚧",
    blocks: 12,
    planned: "100 km",
    completed: "55 km",
    trenching: "40 km",
    ducting: "32 km",
    cable: "28 km",
    splices: 310,
    qcPass: "85%",
    sla: "78%",
    variance: "+12%",
    status: "Needs Attention",
    risk: "High Risk"
  },
  {
    id: 3,
    name: "Team Gamma",
    company: "BuildCorp Ltd", 
    avatar: "⚡",
    blocks: 10,
    planned: "80 km",
    completed: "72 km",
    trenching: "58 km",
    ducting: "48 km",
    cable: "45 km",
    splices: 420,
    qcPass: "91%",
    sla: "88%",
    variance: "+5%",
    status: "Good",
    risk: "Medium Risk"
  }
];

// Badge component
function Badge({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${className}`}>{children}</span>;
}

// Progress bar component
function ProgressBar({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2" aria-label="progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-2 rounded-full ${className}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

const ConstructionDashboard: React.FC = () => {
  const [activeTimeFilter, setActiveTimeFilter] = useState<'Today' | 'Week' | 'Month' | 'Custom'>('Today');
  const [activeTab, setActiveTab] = useState<'Teams' | 'Contractors'>('Teams');
  const [activeViewTab, setActiveViewTab] = useState<'Table' | 'Charts' | 'Insights'>('Table');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Needs Attention': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low Risk': return 'bg-green-100 text-green-800';
      case 'Medium Risk': return 'bg-yellow-100 text-yellow-800';
      case 'High Risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header and Filters Combined Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Construction className="w-6 h-6 text-orange-600" />
                <h1 className="text-lg font-bold text-gray-900">Construction Dashboard</h1>
              </div>
              <div className="text-sm text-gray-500">Performance Tracking & Control Tower</div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <Mail className="w-4 h-4" />
                Schedule Email
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px]">
                  <option>All Districts</option>
                  <option>North District</option>
                  <option>South District</option>
                </select>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px]">
                  <option>All Blocks</option>
                  <option>Block A</option>
                  <option>Block B</option>
                </select>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px]">
                  <option>All Contractors</option>
                  <option>BuildCorp Ltd</option>
                  <option>FastTrack Construction</option>
                </select>
                
                <select className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 min-w-[140px]">
                  <option>All Teams</option>
                  <option>Team Alpha</option>
                  <option>Team Beta</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                {/* Time Filter Tabs */}
                <div className="flex bg-gray-100 rounded-md p-1">
                  {(['Today', 'Week', 'Month', 'Custom'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setActiveTimeFilter(period)}
                      className={`px-4 py-2 text-sm rounded transition-colors ${
                        activeTimeFilter === period
                          ? 'bg-orange-500 text-white font-medium'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
                
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
                
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Reset
                </button>
              </div>
            </div>

            {/* Active Filters */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-sm font-medium">
                North District
                <button className="ml-1 hover:bg-orange-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
              
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
                Today
                <button className="ml-1 hover:bg-blue-200 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards and Performance Info Combined */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10">
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">865</div>
              <div className="text-xs text-gray-500 mb-1">of 1,200 km</div>
              <div className="text-sm font-medium text-gray-700">Completed</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">720</div>
              <div className="text-xs text-gray-500 mb-1">km</div>
              <div className="text-sm font-medium text-gray-700">Trenching</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">600</div>
              <div className="text-xs text-gray-500 mb-1">km</div>
              <div className="text-sm font-medium text-gray-700">Duct Laid</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">550</div>
              <div className="text-xs text-gray-500 mb-1">km</div>
              <div className="text-sm font-medium text-gray-700">Cable Blown</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">2,340</div>
              <div className="text-xs text-gray-500 mb-1">count</div>
              <div className="text-sm font-medium text-gray-700">Splices</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">480</div>
              <div className="text-xs text-gray-500 mb-1">built</div>
              <div className="text-sm font-medium text-gray-700">Chambers</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">90%</div>
              <div className="text-xs text-gray-500 mb-1">pass rate</div>
              <div className="text-sm font-medium text-gray-700">QC Pass</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">85%</div>
              <div className="text-xs text-gray-500 mb-1">compliance</div>
              <div className="text-sm font-medium text-gray-700">SLA</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">+8%</div>
              <div className="text-xs text-gray-500 mb-1">material</div>
              <div className="text-sm font-medium text-gray-700">Variance</div>
            </div>
            
            <div className="p-4 text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">4</div>
              <div className="text-xs text-gray-500 mb-1">contractors</div>
              <div className="text-sm font-medium text-gray-700">At Risk</div>
            </div>
          </div>

          {/* Performance Info */}
          <div className="px-6 py-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Top Performer:</span>
                  <span className="text-sm font-medium text-blue-600">Team Alpha</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">At Risk:</span>
                <span className="text-sm font-medium text-red-600">1 team</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Team Performance</h2>
                <div className="flex bg-gray-100 rounded-lg p-1" role="tablist" aria-label="Data views">
                  <button 
                    className={`px-4 py-1 text-sm rounded ${activeViewTab === 'Table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
                    role="tab"
                    aria-selected={activeViewTab === 'Table'}
                    onClick={() => setActiveViewTab('Table')}
                  >
                    Table
                  </button>
                  <button 
                    className={`px-4 py-1 text-sm rounded ${activeViewTab === 'Charts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
                    role="tab"
                    aria-selected={activeViewTab === 'Charts'}
                    onClick={() => setActiveViewTab('Charts')}
                  >
                    Charts
                  </button>
                  <button 
                    className={`px-4 py-1 text-sm rounded ${activeViewTab === 'Insights' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
                    role="tab"
                    aria-selected={activeViewTab === 'Insights'}
                    onClick={() => setActiveViewTab('Insights')}
                  >
                    Insights
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {activeViewTab === 'Table' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team/Contractor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blocks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trenching</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ducting</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cable</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Splices</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QC Pass</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.blocks}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.planned}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{team.completed}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.trenching}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.ducting}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.cable}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{team.splices}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{team.qcPass}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{team.sla}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{team.variance}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <Badge className={getStatusColor(team.status)}>
                                {team.status}
                              </Badge>
                              <br />
                              <Badge className={getRiskColor(team.risk)}>
                                {team.risk}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <button className="text-blue-600 hover:text-blue-800">Reassign</button>
                              <button className="text-blue-600 hover:text-blue-800">Split</button>
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeViewTab === 'Charts' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Completion Progress Chart */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Completion Progress</h4>
                    <div className="space-y-4">
                      {mockTeams.map((team, index) => {
                        const completed = parseInt(team.completed.replace(' km', ''));
                        const planned = parseInt(team.planned.replace(' km', ''));
                        const percentage = (completed / planned) * 100;
                        return (
                          <div key={team.id}>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-medium text-gray-700 flex items-center gap-2">
                                <span className="text-lg">{team.avatar}</span>
                                {team.name}
                              </span>
                              <span className="text-gray-500">{team.completed}/{team.planned}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full ${
                                  index === 0 ? 'bg-green-500' : 
                                  index === 1 ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-right text-xs text-gray-500 mt-1">{Math.round(percentage)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Construction Activities Chart */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Construction Activities</h4>
                    <div className="space-y-6">
                      {mockTeams.map((team) => (
                        <div key={team.id} className="space-y-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{team.avatar}</span>
                            <span className="font-medium text-gray-900">{team.name}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-orange-100 p-2 rounded">
                              <div className="font-medium text-orange-800">Trenching</div>
                              <div className="text-orange-600">{team.trenching}</div>
                            </div>
                            <div className="bg-blue-100 p-2 rounded">
                              <div className="font-medium text-blue-800">Ducting</div>
                              <div className="text-blue-600">{team.ducting}</div>
                            </div>
                            <div className="bg-green-100 p-2 rounded">
                              <div className="font-medium text-green-800">Cable</div>
                              <div className="text-green-600">{team.cable}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* QC Performance Chart */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">Quality Control Performance</h4>
                    <div className="space-y-4">
                      {mockTeams.map((team) => {
                        const qcValue = parseInt(team.qcPass.replace('%', ''));
                        return (
                          <div key={team.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{team.avatar}</span>
                              <div>
                                <span className="text-sm font-medium text-gray-900">{team.name}</span>
                                <div className="text-xs text-gray-500">{team.company}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <ProgressBar
                                pct={qcValue}
                                className={qcValue >= 95 ? "bg-green-500" : qcValue >= 85 ? "bg-yellow-500" : "bg-red-500"}
                              />
                              <span className="text-sm font-medium text-gray-900 w-10">{team.qcPass}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SLA & Risk Overview */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">SLA & Risk Overview</h4>
                    <div className="space-y-4">
                      {mockTeams.map((team) => (
                        <div key={team.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{team.avatar}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{team.name}</div>
                              <div className="text-xs text-gray-500">{team.company}</div>
                              <div className="text-xs text-gray-600">SLA: {team.sla}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRiskColor(team.risk)}>
                              {team.risk}
                            </Badge>
                            <Badge className={getStatusColor(team.status)}>
                              {team.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeViewTab === 'Insights' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {/* Top Performers */}
                    <div className="lg:col-span-2">
                      <h4 className="text-base font-semibold text-gray-900 mb-4">Top Performers</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🏗️</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Team Alpha</div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-green-600">90 km</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">⚡</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Team Gamma</div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-green-600">72 km</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🚧</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Team Beta</div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-blue-600">55 km</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 p-3 bg-red-50 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Action Required</p>
                            <p className="text-xs text-red-600 mt-1">Team Beta needs immediate attention</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SLA Compliance Gauge */}
                    <div className="text-center">
                      <h4 className="text-base font-semibold text-gray-900 mb-4">SLA Compliance</h4>
                      <div className="relative w-32 h-32 mx-auto">
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
                            <div className="text-2xl font-bold text-gray-900">85%</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0</span>
                        <span>100</span>
                      </div>
                    </div>

                    {/* QC Distribution */}
                    <div className="text-center">
                      <h4 className="text-base font-semibold text-gray-900 mb-4">QC Distribution</h4>
                      <div className="relative w-32 h-32 mx-auto">
                        <svg className="w-full h-full" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="35" fill="none" stroke="#10b981" strokeWidth="20" strokeDasharray="175.93 43.98" transform="rotate(-90 60 60)" />
                          <circle cx="60" cy="60" r="35" fill="none" stroke="#ef4444" strokeWidth="20" strokeDasharray="21.99 197.92" strokeDashoffset="-175.93" transform="rotate(-90 60 60)" />
                          <circle cx="60" cy="60" r="35" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray="21.99 197.92" strokeDashoffset="-197.92" transform="rotate(-90 60 60)" />
                        </svg>
                      </div>
                      <div className="space-y-1 mt-4 text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600">Passed</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-gray-600">Failed</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-gray-600">Pending</span>
                        </div>
                      </div>
                    </div>

                    {/* Daily Progress */}
                    <div className="text-center">
                      <h4 className="text-base font-semibold text-gray-900 mb-4">Daily Progress</h4>
                      <div className="relative w-32 h-24 mx-auto">
                        <svg className="w-full h-full" viewBox="0 0 140 80">
                          <polyline
                            fill="none"
                            stroke="#f97316"
                            strokeWidth="3"
                            points="10,60 30,45 50,35 70,40 90,30 110,25 130,35"
                          />
                          {[
                            [10, 60], [30, 45], [50, 35], [70, 40], 
                            [90, 30], [110, 25], [130, 35]
                          ].map(([x, y], i) => (
                            <circle key={i} cx={x} cy={y} r="3" fill="#f97316" />
                          ))}
                          <line x1="10" y1="70" x2="130" y2="70" stroke="#e5e7eb" strokeWidth="1" />
                          {[10, 30, 50, 70, 90, 110, 130].map((x, i) => (
                            <line key={i} x1={x} y1="68" x2={x} y2="72" stroke="#e5e7eb" strokeWidth="1" />
                          ))}
                        </svg>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                        <span>Mon</span>
                        <span>Sun</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-2">
                        <div className="font-medium">25 km</div>
                        <div>avg/day</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstructionDashboard;