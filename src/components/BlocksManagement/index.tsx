import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Construction, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Users,
  Search,
  User,
  Eye,
  X,
  SheetIcon,
  Folder,
  MoreVertical,
  Edit,
  GitBranch,
  Grid3X3
} from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';
import moment from 'moment';

// Types
interface Block {
  id: string;
  name: string;
  district: string;
  length: string;
  stage: 'Survey' | 'Construction' | 'Installation';
  status: 'In Progress' | 'Completed' | 'Unassigned';
  assignedTo: string | null;
  progress: number;
  sla_due: string;
  dep: boolean;
  issues: number;
  created_at: string;
  updated_at: string;
}

interface StatsData {
  totalBlocks: number;
  overdue: number;
  surveyProgress: number;
  construction: number;
  installation: number;
  qcPassRate: number;
  assigned: number;
  unassigned: number;
}

// Mock Data based on API response
const mockBlocks: Block[] = [
  {
    id: 'WB-411-A',
    name: 'RAMNAGAR-II',
    district: 'MEDINIPUR EAST',
    length: '15.45 km',
    stage: 'Survey',
    status: 'In Progress',
    assignedTo: 'Admin User',
    progress: 65,
    sla_due: '2025-09-25',
    dep: true,
    issues: 2,
    created_at: '2025-09-15T12:00:07.000Z',
    updated_at: '2025-09-15T14:20:00Z'
  },
  {
    id: 'WB-410-B',
    name: 'EGRA-I',
    district: 'PURBA MEDINAPUR',
    length: '33.43 km',
    stage: 'Construction',
    status: 'Unassigned',
    assignedTo: null,
    progress: 0,
    sla_due: '2025-10-01',
    dep: false,
    issues: 0,
    created_at: '2025-09-15T11:58:41.000Z',
    updated_at: '2025-09-15T11:58:41.000Z'
  },
  {
    id: 'WB-409-C',
    name: 'HABRA-I',
    district: 'NORTH 24 PARGANAS',
    length: '58.56 km',
    stage: 'Installation',
    status: 'Completed',
    assignedTo: 'Admin User',
    progress: 100,
    sla_due: '2025-09-12',
    dep: true,
    issues: 0,
    created_at: '2025-09-15T11:58:14.000Z',
    updated_at: '2025-09-12T16:30:00Z'
  },
  {
    id: 'WB-408-D',
    name: 'KARIMPUR-I',
    district: 'NADIA',
    length: '56.60 km',
    stage: 'Survey',
    status: 'In Progress',
    assignedTo: 'Admin User',
    progress: 30,
    sla_due: '2025-09-28',
    dep: false,
    issues: 1,
    created_at: '2025-09-15T11:56:55.000Z',
    updated_at: '2025-09-14T13:10:00Z'
  },
  {
    id: 'WB-407-E',
    name: 'HABIBPUR',
    district: 'MALDA',
    length: '89.13 km',
    stage: 'Construction',
    status: 'In Progress',
    assignedTo: 'Admin User',
    progress: 45,
    sla_due: '2025-10-15',
    dep: true,
    issues: 3,
    created_at: '2025-09-15T11:55:29.000Z',
    updated_at: '2025-09-15T10:20:00Z'
  },
  {
    id: 'WB-406-F',
    name: 'CHANCHAL-I',
    district: 'MALDA',
    length: '49.87 km',
    stage: 'Survey',
    status: 'In Progress',
    assignedTo: 'Admin User',
    progress: 75,
    sla_due: '2025-09-20',
    dep: true,
    issues: 0,
    created_at: '2025-09-15T11:55:05.000Z',
    updated_at: '2025-09-15T11:55:05.000Z'
  },
  {
    id: 'WB-405-G',
    name: 'BAMONGOLA',
    district: 'MALDA',
    length: '53.03 km',
    stage: 'Construction',
    status: 'In Progress',
    assignedTo: 'Admin User',
    progress: 60,
    sla_due: '2025-10-05',
    dep: false,
    issues: 1,
    created_at: '2025-09-15T11:54:39.000Z',
    updated_at: '2025-09-15T11:54:39.000Z'
  },
  {
    id: 'WB-404-H',
    name: 'THAKURPUKUR MAHESTOLA',
    district: '24 PARAGANAS SOUTH',
    length: '30.86 km',
    stage: 'Installation',
    status: 'In Progress',
    assignedTo: 'Admin User',
    progress: 85,
    sla_due: '2025-09-30',
    dep: true,
    issues: 0,
    created_at: '2025-09-15T11:54:10.000Z',
    updated_at: '2025-09-15T11:54:10.000Z'
  },
  {
    id: 'WB-403-I',
    name: 'TEHATTA-II',
    district: 'NADIA',
    length: '48.74 km',
    stage: 'Survey',
    status: 'In Progress',
    assignedTo: 'Admin User',
    progress: 40,
    sla_due: '2025-10-10',
    dep: false,
    issues: 2,
    created_at: '2025-09-15T11:43:20.000Z',
    updated_at: '2025-09-15T11:43:20.000Z'
  },
  {
    id: 'WB-402-J',
    name: 'RANAGHAT-II',
    district: 'NADIA',
    length: '102.66 km',
    stage: 'Construction',
    status: 'In Progress',
    assignedTo: 'Admin User',
    progress: 25,
    sla_due: '2025-10-20',
    dep: true,
    issues: 1,
    created_at: '2025-09-15T11:42:53.000Z',
    updated_at: '2025-09-15T11:42:53.000Z'
  }
];

const mockStats: StatsData = {
  totalBlocks: 220,
  overdue: 12,
  surveyProgress: 65,
  construction: 42,
  installation: 20,
  qcPassRate: 88,
  assigned: 185,
  unassigned: 35
};

const BlocksManagementPage: React.FC = () => {
  // State management
  const [selectedRows, setSelectedRows] = useState<Block[]>([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [globalsearch, setGlobalSearch] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedContractor, setSelectedContractor] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stats Panel Component
  const BlocksStatsPanel: React.FC = () => {
    const statsConfig = [
      {
        icon: Grid3X3,
        label: 'Total Blocks',
        value: mockStats.totalBlocks,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        subtitle: `Assigned: ${mockStats.assigned} | Unassigned: ${mockStats.unassigned}`
      },
      {
        icon: AlertTriangle,
        label: 'Overdue',
        value: mockStats.overdue,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        subtitle: 'Requires attention'
      },
      {
        icon: MapPin,
        label: 'Survey Progress',
        value: `${mockStats.surveyProgress}%`,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        subtitle: 'On track'
      },
      {
        icon: Construction,
        label: 'Construction',
        value: `${mockStats.construction}%`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        subtitle: 'In progress'
      },
      {
        icon: Users,
        label: 'Installation',
        value: `${mockStats.installation}%`,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        subtitle: 'Early stage'
      },
      {
        icon: CheckCircle,
        label: 'QC Pass Rate',
        value: `${mockStats.qcPassRate}%`,
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        subtitle: 'Above target'
      }
    ];

    return (
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-1 py-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {statsConfig.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{stat.subtitle}</div>
                    </div>
                    <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Filter data
  const filteredData = useMemo(() => {
    return mockBlocks.filter((block) => {
      const matchesSearch = !globalsearch.trim() || 
        Object.values(block).some(value =>
          (typeof value === 'string' || typeof value === 'number') &&
          value.toString().toLowerCase().includes(globalsearch.toLowerCase())
        );
      
      const matchesDistrict = !selectedDistrict || block.district === selectedDistrict;
      const matchesStage = !selectedStage || block.stage === selectedStage;
      const matchesStatus = !selectedStatus || block.status === selectedStatus;
      
      return matchesSearch && matchesDistrict && matchesStage && matchesStatus;
    });
  }, [globalsearch, selectedDistrict, selectedStage, selectedStatus, mockBlocks]);

  // Handlers
  const handleRowSelected = (state: { allSelected: boolean; selectedCount: number; selectedRows: Block[] }) => {
    setSelectedRows(state.selectedRows);
  };

  const handleClearRows = () => {
    setToggleCleared(!toggleCleared);
    setSelectedRows([]);
  };

  const clearFilters = () => {
    setGlobalSearch('');
    setSelectedDistrict('');
    setSelectedStage('');
    setSelectedStatus('');
    setSelectedContractor('');
  };

  const handleDropdownToggle = (blockId: string) => {
    setOpenDropdown(openDropdown === blockId ? null : blockId);
  };

  const handleActionClick = (action: string, block: Block) => {
    setOpenDropdown(null);
    
    switch (action) {
      case 'preview':
        setSelectedBlock(block);
        break;
      case 'reassign':
        console.log('Reassign block:', block.name);
        // Handle reassign logic
        break;
      case 'split':
        console.log('Split block:', block.name);
        // Handle split logic
        break;
    }
  };

  // Status Badge Component
  const getStatusBadge = (status: string, progress: number) => {
    const getStatusColor = () => {
      switch (status) {
        case 'Completed':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'In Progress':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'Unassigned':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor()}`}>
        {status}
      </span>
    );
  };

  // Progress Component
  const getProgressComponent = (stage: string, progress: number) => {
    const getStageLabel = () => {
      switch (stage) {
        case 'Survey':
          return `Survey ${progress}%`;
        case 'Construction':
          return `Constr ${progress}%`;
        case 'Installation':
          return `Install ${progress}%`;
        default:
          return `${progress}%`;
      }
    };

    return (
      <div className="space-y-1">
        <div className="text-sm font-medium text-gray-900">{getStageLabel()}</div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Table Columns
  const columns: TableColumn<Block>[] = [
    {
      name: "Block Name / ID",
      cell: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500">{row.id}</div>
        </div>
      ),
      sortable: true,
      minWidth: "160px"
    },
    {
      name: "District",
      selector: row => row.district,
      sortable: true,
      maxWidth: "140px"
    },
    {
      name: "Length",
      selector: row => row.length,
      sortable: true,
      maxWidth: "100px"
    },
    {
      name: "Stage",
      selector: row => row.stage,
      sortable: true,
      minWidth: "130px",
      cell: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
          row.stage === 'Survey' ? 'bg-yellow-100 text-yellow-800' :
          row.stage === 'Construction' ? 'bg-orange-100 text-orange-800' :
          'bg-purple-100 text-purple-800'
        }`}>
          {row.stage}
        </span>
      )
    },
    {
      name: "Status",
      cell: (row) => getStatusBadge(row.status, row.progress),
      sortable: true,
      minWidth: "130px"
    },
    {
      name: "Assigned To",
      cell: (row) => (
        <div className="flex items-center min-w-0">
          {row.assignedTo ? (
            <>
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                <User className="w-3 h-3 text-gray-600" />
              </div>
              <span className="truncate" title={row.assignedTo}>
                {row.assignedTo}
              </span>
            </>
          ) : (
            <span className="text-gray-500">-</span>
          )}
        </div>
      ),
      sortable: true,
      minWidth: "140px"
    },
    {
      name: "Progress",
      cell: (row) => getProgressComponent(row.stage, row.progress),
      sortable: true,
      minWidth: "140px"
    },
    {
      name: "SLA Due",
      cell: (row) => (
        <div className="text-sm">
          <div>{moment(row.sla_due).format("DD MMM")}</div>
          {moment(row.sla_due).isBefore(moment()) && row.status !== 'Completed' && (
            <div className="text-red-500 text-xs">Overdue</div>
          )}
        </div>
      ),
      sortable: true,
      maxWidth: "100px"
    },
    {
      name: "DEP",
      cell: (row) => (
        <div className="text-center">
          {row.dep ? (
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
      maxWidth: "80px"
    },
    {
      name: "Issues",
      selector: row => row.issues,
      sortable: true,
      maxWidth: "80px",
      cell: (row) => (
        <div className="text-center">
          {row.issues > 0 ? (
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
              {row.issues}
            </span>
          ) : (
            <span className="text-gray-500">0</span>
          )}
        </div>
      )
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="relative" ref={openDropdown === row.id ? dropdownRef : null}>
          <button
            onClick={() => handleDropdownToggle(row.id)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="More actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {openDropdown === row.id && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                <button
                  onClick={() => handleActionClick('preview', row)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-3 text-blue-500" />
                  Preview
                </button>
                <button
                  onClick={() => handleActionClick('reassign', row)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-3 text-orange-500" />
                  Reassign
                </button>
                <button
                  onClick={() => handleActionClick('split', row)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <GitBranch className="w-4 h-4 mr-3 text-green-500" />
                  Split
                </button>
              </div>
            </div>
          )}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "80px",
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        fontSize: '11px',
        fontWeight: '500',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        color: '#9CA3AF',
        backgroundColor: '#F9FAFB',
        borderBottom: '1px solid #E5E7EB',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
        fontSize: '14px',
        color: '#111827',
        borderBottom: '1px solid #F3F4F6',
      },
    },
    rows: {
      style: {
        '&:hover': {
          backgroundColor: '#F9FAFB',
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-black flex items-center justify-center">
              <Grid3X3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Blocks Management</h1>
              <p className="text-sm text-gray-600">Project Infrastructure Blocks</p>
            </div>
          </div>
          <button className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center gap-2">
            <span>+</span>
            New Block
          </button>
        </div>
      </header>

      {/* Stats Panel */}
      <BlocksStatsPanel />

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* District Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
              >
                <option value="">District</option>
                <option value="MEDINIPUR EAST">MEDINIPUR EAST</option>
                <option value="PURBA MEDINAPUR">PURBA MEDINAPUR</option>
                <option value="NORTH 24 PARGANAS">NORTH 24 PARGANAS</option>
                <option value="NADIA">NADIA</option>
                <option value="MALDA">MALDA</option>
                <option value="24 PARAGANAS SOUTH">24 PARAGANAS SOUTH</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Stage Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
              >
                <option value="">Stage</option>
                <option value="Survey">Survey</option>
                <option value="Construction">Construction</option>
                <option value="Installation">Installation</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
              >
                <option value="">Status</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Unassigned">Unassigned</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Contractor Filter */}
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <select
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
              >
                <option value="">Contractor</option>
                <option value="Ramesh">Ramesh</option>
                <option value="Team Alpha">Team Alpha</option>
                <option value="Priya">Priya</option>
                <option value="Amit Kumar">Amit Kumar</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search Block..."
                value={globalsearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-sm outline-none"
              />
            </div>

            <button
              className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-medium"
            >
              Bulk Assign
            </button>

            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              Reassign
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium"
            >
              <SheetIcon className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Selection Actions */}
        {selectedRows.length > 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">
              {selectedRows.length} item(s) selected
            </span>
            <button
              onClick={handleClearRows}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Data Table */}
        {filteredData.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Folder className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blocks found</h3>
            <p className="text-gray-500">
              {globalsearch || selectedDistrict || selectedStage || selectedStatus
                ? 'Try adjusting your search or filter criteria.'
                : 'There are no blocks available.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50, 100]}
              highlightOnHover
              pointerOnHover
              striped={false}
              dense={false}
              responsive
              customStyles={customStyles}
              noHeader
              selectableRows
              onSelectedRowsChange={handleRowSelected}
              clearSelectedRows={toggleCleared}
              progressPending={loading}
            />
          </div>
        )}

        {/* Block Details Modal */}
        {selectedBlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Block Details</h3>
                  <button
                    onClick={() => setSelectedBlock(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Block Name</label>
                    <p className="text-gray-900 font-medium">{selectedBlock.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Block ID</label>
                    <p className="text-gray-900">{selectedBlock.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">District</label>
                    <p className="text-gray-900">{selectedBlock.district}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Length</label>
                    <p className="text-gray-900">{selectedBlock.length}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Stage</label>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedBlock.stage === 'Survey' ? 'bg-yellow-100 text-yellow-800' :
                      selectedBlock.stage === 'Construction' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedBlock.stage}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                    {getStatusBadge(selectedBlock.status, selectedBlock.progress)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Assigned To</label>
                    <p className="text-gray-900">{selectedBlock.assignedTo || 'Unassigned'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Progress</label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{selectedBlock.stage} Progress</span>
                        <span className="font-medium">{selectedBlock.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${selectedBlock.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">SLA Due Date</label>
                    <p className="text-gray-900">{moment(selectedBlock.sla_due).format("DD/MM/YYYY")}</p>
                    {moment(selectedBlock.sla_due).isBefore(moment()) && selectedBlock.status !== 'Completed' && (
                      <p className="text-red-500 text-sm mt-1">Overdue</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Issues Count</label>
                    <p className="text-gray-900">{selectedBlock.issues}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                    <p className="text-gray-900 text-sm">
                      {moment(selectedBlock.created_at).format("DD/MM/YYYY, hh:mm A")}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                    <p className="text-gray-900 text-sm">
                      {moment(selectedBlock.updated_at).format("DD/MM/YYYY, hh:mm A")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedBlock(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {selectedBlock.status === 'Unassigned' ? 'Assign Block' : 
                   selectedBlock.status === 'Completed' ? 'View Details' : 'Reassign Block'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlocksManagementPage;