import { useEffect, useState } from 'react';
import { MessageSquareText, Search, ChevronDown } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { getRemarksHistory, Remark } from './Services/api';
import DataTable, { TableColumn } from 'react-data-table-component';
import axios from 'axios';

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'gp_installation', label: 'GP Installation' },
  { value: 'block_installation', label: 'Block Installation' },
  {value:'survey',label:'Survey'},
  {value:'construction',label:'Construction'}
];
interface UsersData {
  user_id:number;
  uname: string;
  email: string;
  version: string;
  is_active: string;
  company_id: string;
  machine_id: string;
}
const BASEURL = import.meta.env.VITE_API_BASE;

function AuditLogs() {
  const [data, setData] = useState<Remark[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersReady, setFiltersReady] = useState(false);

  const [fromdate, setFromDate] = useState<string>('');
  const [todate, setToDate] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [globalsearch, setGlobalSearch] = useState<string>('');
  const [Users, setUsers] = useState<UsersData[]>([]);
  const[selectedUser,setSelectedUser]=useState<string>('');
  const [survey_id,setsurvey_id]=useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const Header = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <MessageSquareText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Remarks History
              </h1>
              <p className="text-sm text-gray-600">
                View and manage all remarks
              </p>
            </div>
          </div>
          <nav>
            <ol className="flex items-center gap-2">
              <li>
                <Link className="font-medium" to="/dashboard">
                  Dashboard /
                </Link>
              </li>
              <li className="font-medium text-primary">Remarks History</li>
            </ol>
          </nav>
        </div>
      </header>
    );
  };

  const fetchRemarksHistory = async () => {
    try {
      setLoading(true);
      const response = await getRemarksHistory({
        offset: (currentPage - 1) * rowsPerPage,
        limit: rowsPerPage,
        from_date: fromdate || undefined,
        to_date: todate || undefined,
        type: selectedType || undefined,
        user_id:selectedUser || undefined,
        survey_id:survey_id || undefined,
      });

      if (response.status) {
        setData(response.data || []);
        setTotal(response.total || 0);
      } else {
        setData([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching remarks history:', error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };
  const fetchusers = async () => {
    try {
      const response = await axios.get(`${BASEURL}/allusers`);
      setUsers(response.data.data);
    } catch (err: any) {
      console.log(err.message || 'Failed to fetch data');
    }
  };

  useEffect(() => {
    const from_date = searchParams.get('from_date') || '';
    const to_date = searchParams.get('to_date') || '';
    const type = searchParams.get('type') || '';
    const search = searchParams.get('search') || '';
    const survey_id = searchParams.get('survey_id') || '';
    setFromDate(from_date);
    setToDate(to_date);
    setSelectedType(type);
    setGlobalSearch(search);
    setsurvey_id(survey_id);
    setFiltersReady(true);

  }, []);

  useEffect(() => {
    if (filtersReady) {
      fetchRemarksHistory();
    
    }
  }, [
    filtersReady,
    fromdate,
    todate,
    selectedType,
    globalsearch,
    currentPage,
    rowsPerPage,
    selectedUser,
    survey_id
  ]);
useEffect(()=>{
    fetchusers();
},[]);
  const handleFilterChange = (
    from_date: string | null,
    to_date: string | null,
    type: string | null,
    search: string | null,
    user:string,
  ) => {
    const params: Record<string, string> = {};
    if (from_date) params.from_date = from_date;
    if (to_date) params.to_date = to_date;
    if (type) params.type = type;
    if (search) params.search = search;
    if(user) params.user_id = user;
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedType('');
    setGlobalSearch('');
    setSearchParams({});
    setSelectedUser('');
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    handleFilterChange(value, todate, selectedType, globalsearch,selectedUser);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    handleFilterChange(fromdate, value, selectedType, globalsearch,selectedUser);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    handleFilterChange(fromdate, todate, value, globalsearch,selectedUser);
  };
  const handleuser=(value:string)=>{
    setSelectedUser(value);
    handleFilterChange(fromdate, todate, selectedType, globalsearch,value)

  }

  const handleSearchChange = (value: string) => {
    setGlobalSearch(value);
    handleFilterChange(fromdate, todate, selectedType, value,selectedUser);
  };

  const formatType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const columns: TableColumn<Remark>[] = [
    {
      name: 'Sl.No',
      selector: (_row, index = 0) =>
        (currentPage - 1) * rowsPerPage + index + 1,
      width: '70px',
    },
    {
      name: 'User Name',
      selector: (row) => row.user_name,
      cell: (row) => (
        <span className="text-sm font-medium text-gray-900">
          {row.user_name}
        </span>
      ),
    },
     {
      name: 'Name',
      selector: (row) => row.name,
      cell: (row) => (
        <span className="text-sm font-medium text-gray-900">
          {row.name}
        </span>
      ),
    },

    {
      name: 'Type',
      selector: (row) => row.type,
      cell: (row) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {formatType(row.type)}
        </span>
      ),
    },
     {
      name: 'Survey Id',
      selector: (row) => row.survey_id,
      cell: (row) => (
        <span className="text-sm font-medium text-gray-900">
          {row.survey_id}
        </span>
      ),
    },
    {
      name: 'Remarks',
      selector: (row) => row.remarks,
      minWidth:"350px",
      cell: (row) => (
        <span className="text-sm text-gray-600">{row.remarks}</span>
      ),
    },
    {
      name: 'Created At',
      selector: (row) => row.created_at,
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      name: 'Updated At',
      selector: (row) => row.updated_at,
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.updated_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (newRowsPerPage: number, newPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(newPage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <input
                type="date"
                value={fromdate}
                onChange={(e) => handleFromDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
                placeholder="From Date"
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
              <input
                type="date"
                value={todate}
                onChange={(e) => handleToDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
                placeholder="To Date"
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-40">
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
             <div className="relative flex-1 min-w-0 sm:flex-none sm:w-40">
              <select
                value={selectedUser}
                onChange={(e) => handleuser(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none"
              >
                <option value=''>Select User</option>
                {Users.map((option) => (
                  <option key={option.user_id} value={option.user_id}>
                    {option.uname}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>


            <button
              onClick={clearFilters}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none whitespace-nowrap flex items-center gap-2"
            >
              <span className="text-red-500 font-medium text-sm">✕</span>
              <span>Clear Filters</span>
            </button>
              <div className="flex items-center text-sm text-gray-500 ml-auto">
              <span>Total Records: {total}</span>
            </div>
          </div>

      
        </div>

        <div className="p-4">
          <DataTable
            columns={columns}
            data={data}
            pagination
            paginationServer
            paginationTotalRows={total}
            paginationPerPage={rowsPerPage}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handleRowsPerPageChange}
            highlightOnHover
            pointerOnHover
            progressPending={loading}
            progressComponent={
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            }
            noDataComponent={
              <div className="p-6 text-center text-gray-500">
                No remarks found
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
