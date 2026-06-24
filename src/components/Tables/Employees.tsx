import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Edit,
  Eye,
  Filter,
  Search,
  X,
  Plus,
  Users as UsersIcon,
  UserCheck,
  UserX,
} from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';
import Modal from '../hooks/ModalPopup';

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  is_active?: string;
}

interface EmployeeFormData {
  id: string;
  name: string;
  email: string;
  password: string;
}

interface ModalData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const Employees = () => {
  const BASEURL = import.meta.env.VITE_TraceAPI_URL;
  
  const [data, setData] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({
    title: '',
    message: '',
    type: 'info',
  });

  const [editingEmployee, setEditingEmployee] = useState<
    EmployeeData | undefined
  >(undefined);
  const [formData, setFormData] = useState<EmployeeFormData>({
    id: '',
    name: '',
    email: '',
    password: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(
    null,
  );

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BASEURL}/get-admins`);
      setData(response.data.data);
    } catch (err: any) {
      // setError(err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetFormData = () => {
    setFormData({
      id: '',
      name: '',
      email: '',
      password: '',
    });
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(undefined);
    resetFormData();
    setIsFormModalOpen(true);
  };

  const handleStartEdit = (employee: EmployeeData) => {
    setEditingEmployee(employee);
    setFormData({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      password: '',
    });
    setIsFormModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingEmployee(undefined);
    resetFormData();
    setIsFormModalOpen(false);
  };

  const handleAddEmployee = async () => {
    if (
      !formData.name ||
      !formData.email ||
      !formData.password
    ) {
      setModalData({
        title: 'Error!',
        message: 'All fields are required!',
        type: 'error',
      });
      setModalOpen(true);
      return;
    }

    try {
      const response = await axios.post(`${BASEURL}/create-admin`, formData);
      if (response.status === 200 || response.status === 201) {
        setModalData({
          title: 'Success!',
          message: 'Employee added successfully!',
          type: 'success',
        });
        setModalOpen(true);
        setIsFormModalOpen(false);
        fetchData();
        resetFormData();
      } else {
        setModalData({
          title: 'Error!',
          message:
            response.data?.message ||
            response.data?.error ||
            'Unexpected response',
          type: 'error',
        });
        setModalOpen(true);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        'Something went wrong while adding the employee.';
      setModalData({
        title: 'Error!',
        message: `Failed to add employee: ${errorMessage}`,
        type: 'error',
      });
      setModalOpen(true);
    }
  };

  const handleEditEmployee = async () => {
    if (!formData.name || !formData.email) {
      setModalData({
        title: 'Error!',
        message: 'Name and Email are required!',
        type: 'error',
      });
      setModalOpen(true);
      return;
    }

    try {
      const {...payload } = formData;

      await axios.post(`${BASEURL}/update-admin/${formData.id}`, payload);
      setModalData({
        title: 'Success!',
        message: 'Employee updated successfully!',
        type: 'success',
      });
      setModalOpen(true);
      setIsFormModalOpen(false);
      fetchData();
      resetFormData();
    } catch (error) {
      setModalData({
        title: 'Error!',
        message: 'Failed to update employee',
        type: 'error',
      });
      setModalOpen(true);
    }
  };

  const handleStatusChange = async (employee: EmployeeData) => {
    try {
      const newStatus = employee.is_active === '1' ? '0' : '1';
      const payload = {
        id: employee.id,
        is_active: newStatus,
      };

      const response = await axios.post(`${BASEURL}/employees/status`, payload);
      if (response.status === 200) {
        setModalData({
          title: 'Success!',
          message: 'Status updated successfully!',
          type: 'success',
        });
        setModalOpen(true);
        fetchData();
      }
    } catch (error) {
      setModalData({
        title: 'Error!',
        message: 'Failed to update status',
        type: 'error',
      });
      setModalOpen(true);
    }
  };

  const filteredData = data.filter((employee) => {
    const matchesSearch =
      (employee.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (employee.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(employee.id || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && employee.is_active === '1') ||
      (statusFilter === 'inactive' && employee.is_active === '0');

    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    const activeCount = data.filter((emp) => emp.is_active === '1').length;
    const inactiveCount = data.filter((emp) => emp.is_active === '0').length;
    return { activeCount, inactiveCount };
  };

  const { activeCount, inactiveCount } = getStatusCounts();

  const getStatusBadge = (status: string) => {
    return status === '1' ? (
      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
        Active
      </span>
    ) : (
      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-800 border-red-200">
        Inactive
      </span>
    );
  };

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

  const columns: TableColumn<EmployeeData>[] = [
    { name: 'Employee ID', selector: (row) => row.id, sortable: true },
    { name: 'Full Name', selector: (row) => row.name, sortable: true },
    { name: 'Email', selector: (row) => row.email, sortable: true },
    // {
    //   name: 'Status',
    //   selector: (row) => row.is_active,
    //   sortable: true,
    //   cell: (row) => getStatusBadge(row.is_active),
    // },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedEmployee(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStartEdit(row)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Employee"
          >
            <Edit className="w-4 h-4" />
          </button>
          {/* <button
            onClick={() => handleStatusChange(row)}
            className={`p-2 rounded-lg transition-colors ${
              row.is_active === '1'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={row.is_active === '1' ? 'Deactivate' : 'Activate'}
          >
            {row.is_active === '1' ? (
              <UserX className="w-4 h-4" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </button> */}
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  const EmployeesHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Employees</h1>
              <p className="text-sm text-gray-600">
                Monitor and manage employees
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add New Employee
            </button>

            <nav>
              <ol className="flex items-center gap-2">
                <li>
                  <Link className="font-medium" to="/dashboard">
                    Dashboard /
                  </Link>
                </li>
                <li className="font-medium text-primary">
                  Employee Management
                </li>
              </ol>
            </nav>
          </div>
        </div>
      </header>
    );
  };

  if (loading) return <p className="text-center py-4">Loading...</p>;
  if (error)
    return <p className="text-center py-4 text-red-500">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeesHeader />

      <div className="px-1 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.length}
                </div>
                <div className="text-sm text-gray-600">Total Employees</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {activeCount}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {inactiveCount}
                </div>
                <div className="text-sm text-gray-600">Inactive</div>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-1">
        <div className="space-y-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              </div>
            </div>

            {filteredData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No employees found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Add your first employee to get started.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  pagination
                  highlightOnHover
                  pointerOnHover
                  striped={false}
                  dense={false}
                  responsive
                  customStyles={customStyles}
                  noHeader
                />
              </div>
            )}
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
        />

        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {editingEmployee ? (
                      <Edit className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Plus className="w-6 h-6 text-green-600" />
                    )}
                    <h2 className="text-xl font-semibold text-gray-900">
                      {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                    </h2>
                  </div>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    editingEmployee
                      ? handleEditEmployee()
                      : handleAddEmployee();
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        autoComplete="new-email"
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                   

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Enter password"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-8 py-3 rounded-lg text-white font-medium transition-all ${
                        editingEmployee
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                          : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {editingEmployee ? 'Update Employee' : 'Add Employee'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Employee Details
                  </h3>
                  <button
                    onClick={() => setSelectedEmployee(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Employee ID
                    </label>
                    <p className="text-gray-900 font-medium">
                      {selectedEmployee.id}
                    </p>
                  </div>
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    {getStatusBadge(selectedEmployee.is_active)}
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-900">{selectedEmployee.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{selectedEmployee.email}</p>
                  </div>
                 
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedEmployee(null);
                    handleStartEdit(selectedEmployee);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit Employee
                </button>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Employees;
