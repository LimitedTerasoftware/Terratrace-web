import { RefreshCw, Download } from 'lucide-react';
import { InstallationSections } from './InstallationSections';
import { DistrictPerformance } from '../Chat/DistrictPerformance';
import { CriticalSites } from '../Chat/CriticalSites';
import { ActivityFeed } from '../Chat/ActivityFeed';

function NewInstallationDashboard() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex h-screen">

                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-white border-b border-gray-200">
                        <div className="px-6">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Installation Command Center</h1>
                                    <p className="text-sm text-gray-500 uppercase tracking-wide">LIVE GP & BLOCK ROLLOUT STATUS</p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-8 px-6 py-3">
                                        <button className="pb-2 text-sm font-semibold text-blue-600 border-b-2 border-blue-600">GP Tracker</button>
                                        <button className="text-sm font-semibold text-gray-600 hover:text-gray-900">Block Tracker</button>
                                    </div>
                                    {/* <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>Last Sync: Oct 24, 14:35</span>
                                    </div>
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                                        <RefreshCw size={20} className="text-gray-600" />
                                    </button>
                                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                                        <Download size={20} className="text-gray-600" />
                                    </button>
                                    <button className="bg-blue-900 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-800 transition">
                                        REFRESH
                                    </button> */}
                                </div>
                            </div>
                        </div>
                    </header>
                    <div className="flex items-center gap-4 flex-wrap px-3 py-3 bg-white border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-700">FILTERS:</span>
                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">All States</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">District</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">Block</button>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Search GP..."
                                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200">GP Only</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">Status: All</button>
                            <input
                                type="date"
                                placeholder="dd-mm-yyyy"
                                className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">Checklist: Any</button>
                            <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">Evidence: Any</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <div className="p-6 max-w-full">
                            <InstallationSections />
                            <DistrictPerformance />

                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">CHECKLIST SUMMARY</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span className="text-sm text-gray-600">Passed</span>
                                        <span className="ml-auto font-semibold text-gray-900">11,204</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                        <span className="text-sm text-gray-600">In Audit</span>
                                        <span className="ml-auto font-semibold text-gray-900">2,480</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-red-500" />
                                        <span className="text-sm text-gray-600">Rejected</span>
                                        <span className="ml-auto font-semibold text-gray-900">596</span>
                                        </div>
                                    </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">EVIDENCE COMPLETENESS</h4>
                                    <div className="space-y-3">
                                        {[
                                        { label: 'RACK PHOTO', value: '98%' },
                                        { label: 'FDMS TERMINALS', value: '85%' },
                                        { label: 'ROUTER CONFIG', value: '73%' },
                                        { label: 'EARTHING TEST', value: '64%' },
                                        ].map((item, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="text-gray-600">{item.label}</span>
                                            <span className="font-semibold">{item.value}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                            <div className="h-full bg-blue-600" style={{ width: item.value }} />
                                            </div>
                                        </div>
                                        ))}
                                    </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">ACCEPTANCE READINESS</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                        <p className="text-2xl font-bold text-gray-900">842</p>
                                        <p className="text-xs text-gray-500 mt-1">PAT READY</p>
                                        </div>
                                        <div>
                                        <p className="text-2xl font-bold text-gray-900">310</p>
                                        <p className="text-xs text-gray-500 mt-1">HOTO READY</p>
                                        </div>
                                        <div>
                                        <p className="text-2xl font-bold text-gray-900">152</p>
                                        <p className="text-xs text-gray-500 mt-1">SWOC SYNC</p>
                                        </div>
                                        <div>
                                        <p className="text-2xl font-bold text-gray-900">48</p>
                                        <p className="text-xs text-gray-500 mt-1">DTR DELAY</p>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            <CriticalSites />
                            <ActivityFeed />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NewInstallationDashboard;
