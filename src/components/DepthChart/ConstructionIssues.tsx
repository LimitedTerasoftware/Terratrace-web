import { useEffect, useState } from 'react';
import { Download, AlertTriangle, TrendingDown, MapPin, Camera } from 'lucide-react';
import { IssueDetailsSidebar } from '../Chat/IssueDetailsSidebar';
import { Link } from 'react-router-dom';
import { machineApi } from '../Services/api';
import Filters from '../Checkboxes/Filters';
import RecentIssues from '../Chat/RecentIssues';

function ConstructionIssues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [stats, setStats] = useState<any>({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    critical: 0,
  });
  const [loading, setLoading] = useState(true);

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIssueType, setSelectedIssueType] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');

  const getDateRange = (period: string) => {
    if (period === 'all') {
      return { fromDate: undefined, toDate: undefined };
    }
    if (period === 'today') {
      const today = new Date();
      return {
        fromDate: today.toISOString().split('T')[0],
        toDate: today.toISOString().split('T')[0],
      };
    }
    const days = parseInt(period) || 30;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    return {
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
    };
  };

  useEffect(() => {
    const { fromDate, toDate } = getDateRange(selectedPeriod);
    fetchIssues(
      selectedState || undefined,
      selectedDistrict || undefined,
      fromDate,
      toDate,
      selectedVendor || undefined,
    );
  }, [selectedState, selectedDistrict, selectedPeriod, selectedVendor]);

  useEffect(() => {
    applyFilters();
  }, [issues, selectedIssueType, selectedSeverity, searchQuery]);

  const applyFilters = () => {
    let filtered = [...issues];

    if (selectedIssueType !== 'All') {
      filtered = filtered.filter(
        (issue) => issue.issue_type === selectedIssueType,
      );
    }

    if (selectedSeverity !== 'All') {
      filtered = filtered.filter(
        (issue) => issue.severity === selectedSeverity,
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.survey_id?.toString().includes(query) ||
          issue.location?.toLowerCase().includes(query) ||
          issue.vendor?.toLowerCase().includes(query) ||
          issue.status?.toLowerCase().includes(query) ||
          issue.severity?.toLowerCase().includes(query) ||
          issue.depth?.toLowerCase().includes(query) ||
          issue.category?.toLowerCase().includes(query) ||
          issue.machine?.toLowerCase().includes(query),
      );
    }

    setFilteredIssues(filtered);
    calculateStats(filtered);
  };

  const handleReset = () => {
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedVendor('');
    setSelectedPeriod('all');
    setSearchQuery('');
    setSelectedIssueType('All');
    setSelectedSeverity('All');
  };

  const fetchIssues = async (
    stateId?: string,
    districtId?: string,
    fromDate?: string,
    toDate?: string,
    firmId?: string,
  ) => {
    try {
      setLoading(true);
      const response = await machineApi.getIssues(
        stateId,
        districtId,
        undefined,
        fromDate,
        toDate,
        firmId,
      );

      if (response.status) {
        setIssues(response.data);
        calculateStats(response.data);
      } else {
        setIssues([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (issuesList: any[]) => {
    const newStats: any = {
      total: issuesList.length,
      open: issuesList.filter((i) => i.status === 'OPEN').length,
      inProgress: issuesList.filter((i) => i.status === 'IN_PROGRESS').length,
      closed: issuesList.filter((i) => i.status === 'RESOLVED').length,
      critical: issuesList.filter((i) => i.severity === 'HIGH').length,
    };
    setStats(newStats);
  };
 const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Depth Violation':
        return <TrendingDown className="w-4 h-4 text-gray-400" />;
      case 'GPS Offset':
        return <MapPin className="w-4 h-4 text-gray-400" />;
      case 'Missing Photo':
        return <Camera className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-7 py-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">
                Construction Issues
              </h1>
              <p className="text-sm text-gray-600 hidden md:block">
                Real-time monitoring and analytics dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav>
              <ol className="flex items-center gap-2 text-sm">
                <li>
                  <Link
                    className="font-medium"
                    to="/dashboards/construction-dashboard"
                  >
                    Dashboard /
                  </Link>
                </li>
                <li className="font-medium text-primary">Construction</li>
              </ol>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-2 py-2">
        <div className="space-y-6">
          <Filters
            selectedState={selectedState}
            selectedDistrict={selectedDistrict}
            selectedVendor={selectedVendor}
            selectedPeriod={selectedPeriod}
            searchQuery={searchQuery}
            onStateChange={setSelectedState}
            onDistrictChange={setSelectedDistrict}
            onVendorChange={setSelectedVendor}
            onPeriodChange={setSelectedPeriod}
            onSearchChange={setSearchQuery}
            onReset={handleReset}
          />

          {/* <div className="flex flex-wrap gap-3">
            <select
              value={selectedIssueType}
              onChange={(e) => setSelectedIssueType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Issue Type: All</option>
              <option value="DEPTH">Depth Variance</option>
              <option value="GPS_OFFSET">GPS Offset</option>
              <option value="MISSING_PHOTO">Missing Photo</option>
            </select>

            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">Severity: All</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>

            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors whitespace-nowrap">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 uppercase mb-2">
                Total Issues
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total}
                </p>
                {/* <span className="text-sm text-green-600">+2%</span> */}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 uppercase mb-2">Open</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">{stats.open}</p>
                <span className="text-sm text-blue-600">Active</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 uppercase mb-2">
                In Progress
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {stats.inProgress}
                </p>
                <span className="text-sm text-purple-600">Working</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 uppercase mb-2">Closed</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {stats.closed}
                </p>
                <span className="text-sm text-gray-600">Verified</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500 uppercase mb-2">Critical</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {stats.critical}
                </p>
                <span className="text-sm text-red-600">Immediate Action</span>
              </div>
            </div>
          </div>
          <RecentIssues
            data={filteredIssues}
            isLoading={loading}
            onView={(issue) => setSelectedIssue(issue)}
          />

        </div>
      </main>

      {selectedIssue && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 transition-opacity"
            onClick={() => setSelectedIssue(null)}
          />
          <IssueDetailsSidebar
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
          />
        </>
      )}
    </div>
  );
}

export default ConstructionIssues;
