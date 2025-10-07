import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { Edit, Eye, Filter, Search, X, Plus, Users as UsersIcon, UserCheck, UserX, Building, Settings } from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';
import Modal from '../hooks/ModalPopup';
import { Machine } from "../../types/machine";

interface UsersData {
  user_id: string | number
  uname: string;
  email: string;
  version: string;
  is_active: string;
  company_id: string;
  machine_id: string;
}

interface UserFormData {
  user_id: string;
  fullname: string;
  email: string;
  contact_no: string;
  company_id: string;
  password: string;
  machine_id: string;
}

type Company = {
  id: number;
  name: string;
};

interface ModalData {
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

const Users = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
  const navigate = useNavigate();

  // State management
  const [data, setData] = useState<UsersData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({
    title: "",
    message: "",
    type: "info",
  });
  
  // Form states
  const [editingUser, setEditingUser] = useState<UsersData | undefined>(undefined);
  const [constructionUser, setConstructionUser] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({ 
    user_id: "", 
    fullname: "", 
    email: "", 
    contact_no: "", 
    company_id: "", 
    password: "", 
    machine_id: ""
  });
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UsersData | null>(null);

  // Data fetching
  const fetchData = async () => {
    try {
      const response = await axios.get(`${BASEURL}/allusers`);
      setData(response.data.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const GetData = async () => {
    try {
      const resp = await axios.get(`${TraceBASEURL}/get-all-machines`);
      if (resp.status === 200 || resp.status === 201) {
        setMachines(resp.data.machines);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${BASEURL}/companies`);
      const companiesData: Company[] = await response.json();
      setCompanies(companiesData);
    } catch (err) {
      console.error("Failed to load companies", err);
    }
  };

  useEffect(() => {
    fetchData();
    GetData();
    fetchCompanies();
  }, []);

  // Form handlers
  const resetFormData = () => {
    setFormData({ 
      user_id: "", 
      fullname: "", 
      email: "", 
      company_id: "", 
      contact_no: "", 
      password: "", 
      machine_id: ""
    });
  };

  const handleOpenAddModal = () => {
    setEditingUser(undefined);
    resetFormData();
    setConstructionUser(false);
    setIsFormModalOpen(true);
  };

  const handleStartEdit = (user: UsersData) => {
    setEditingUser(user);
    setFormData({
      user_id: user.user_id,
      fullname: user.uname,
      email: user.email,
      contact_no: "",
      password: "",
      company_id: user.company_id,
      machine_id: user.machine_id,
    });
    setConstructionUser(user.machine_id !== '0' && user.machine_id !== null && user.machine_id !== '');
    setIsFormModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingUser(undefined);
    resetFormData();
    setIsFormModalOpen(false);
  };

  const handleAddUser = async () => {
    if (!formData.fullname || !formData.email || !formData.contact_no || !formData.password) {
      setModalData({
        title: "Error!",
        message: "All fields are required!",
        type: "error",
      });
      setModalOpen(true);
      return;
    }

    if (constructionUser && !formData.machine_id) {
      setModalData({
        title: "Error!",
        message: "Registration number is required for construction users!",
        type: "error",
      });
      setModalOpen(true);
      return;
    }

    try {
      const response = await axios.post(`${BASEURL}/createuser`, formData);
      if (response.status === 200 || response.status === 201) {
        setModalData({
          title: "Success!",
          message: `User added successfully! User ID: ${response.data.data.user_id}`,
          type: "success",
        });
        setModalOpen(true);
        setIsFormModalOpen(false);
        fetchData(); // Refresh data
        resetFormData();
      } else {
        setModalData({
          title: "Error!",
          message: response.data?.message || response.data?.error || "Unexpected response",
          type: "error",
        });
        setModalOpen(true);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Something went wrong while adding the user.";
      setModalData({
        title: "Error!",
        message: `Failed to add user: ${errorMessage}`,
        type: "error",
      });
      setModalOpen(true);
    }
  };

  const handleEditUser = async () => {
    if (!formData.fullname || !formData.email) {
      setModalData({
        title: "Error!",
        message: "Username and Email are required!",
        type: "error",
      });
      setModalOpen(true);
      return;
    }

    try {
      await axios.post(`${BASEURL}/allusers/${formData.user_id}`, formData);
      setModalData({
        title: "Success!",
        message: "User updated successfully!",
        type: "success",
      });
      setModalOpen(true);
      setIsFormModalOpen(false);
      fetchData(); // Refresh data
      resetFormData();
    } catch (error) {
      setModalData({
        title: "Error!",
        message: "Failed to update user",
        type: "error",
      });
      setModalOpen(true);
    }
  };

  const handleStatusChange = async (user: UsersData) => {
    try {
      const newStatus = user.is_active === "1" ? "0" : "1";
      const payload = {
        user_id: user.user_id,
        is_active: newStatus,
      };

      const response = await axios.post(`${BASEURL}/updateStatus`, payload);
      if (response.status === 200) {
        setModalData({
          title: "Success!",
          message: "Status updated successfully!",
          type: "success",
        });
        setModalOpen(true);
        fetchData(); // Refresh data
      }
    } catch (error) {
      setModalData({
        title: "Error!",
        message: "Failed to update status",
        type: "error",
      });
      setModalOpen(true);
    }
  };

  // Filter data
  const filteredData = data.filter(user => {
  const matchesSearch = 
    (user.uname || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(user.user_id || "").toLowerCase().includes(searchTerm.toLowerCase()); // Convert to string first
  
  const matchesStatus = statusFilter === 'all' || 
    (statusFilter === 'active' && user.is_active === '1') ||
    (statusFilter === 'inactive' && user.is_active === '0');
  
  return matchesSearch && matchesStatus;
});


  // Status counts
  const getStatusCounts = () => {
    const activeCount = data.filter(user => user.is_active === '1').length;
    const inactiveCount = data.filter(user => user.is_active === '0').length;
    const constructionUsers = data.filter(user => user.machine_id && user.machine_id !== '0').length;
    const companyCount = new Set(data.map(user => user.company_id)).size;
    
    return { activeCount, inactiveCount, constructionUsers, companyCount };
  };

  const { activeCount, inactiveCount, constructionUsers, companyCount } = getStatusCounts();

  // Status badge
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

  // Table columns
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

  const columns: TableColumn<UsersData>[] = [
    { name: "User ID", selector: row => row.user_id, sortable: true },
    { name: "Username", selector: row => row.uname, sortable: true },
    { name: "Email", selector: row => row.email, sortable: true },
    { name: "Version", selector: row => row.version, sortable: true },
    {
      name: 'Status',
      selector: (row) => row.is_active,
      sortable: true,
      cell: (row) => getStatusBadge(row.is_active),
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedUser(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStartEdit(row)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit User"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStatusChange(row)}
            className={`p-2 rounded-lg transition-colors ${
              row.is_active === '1'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={row.is_active === '1' ? 'Deactivate User' : 'Activate User'}
          >
            {row.is_active === '1' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // Header component
  const UsersHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">All Users</h1>
              <p className="text-sm text-gray-600">Monitor and manage system users</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add New User
            </button>
            
            <nav>
              <ol className="flex items-center gap-2">
                <li>
                  <Link className="font-medium" to="/dashboard">
                    Dashboard /
                  </Link>
                </li>
                <li className="font-medium text-primary">User Management</li>
              </ol>
            </nav>
          </div>
        </div>
      </header>
    );
  };

  if (loading) return <p className="text-center py-4">Loading...</p>;
  if (error) return <p className="text-center py-4 text-red-500">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <UsersHeader />

      {/* Status Cards */}
      <div className="px-1 py-6">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{data.length}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <UsersIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
                <div className="text-sm text-gray-600">Inactive Users</div>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <UserX className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{constructionUsers}</div>
                <div className="text-sm text-gray-600">Construction Users</div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-indigo-600">{companyCount}</div>
                <div className="text-sm text-gray-600">Companies</div>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Building className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{machines.length}</div>
                <div className="text-sm text-gray-600">Available Machines</div>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Settings className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-1">
        <div className="space-y-8">
          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search users..."
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Add your first user to get started.'
                  }
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

        {/* Success/Error Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
        />

        {/* User Form Modal */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {editingUser ? (
                      <Edit className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Plus className="w-6 h-6 text-green-600" />
                    )}
                    <h2 className="text-xl font-semibold text-gray-900">
                      {editingUser ? 'Edit User' : 'Add New User'}
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
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  editingUser ? handleEditUser() : handleAddUser();
                }}>
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="userType"
                            value="normal"
                            checked={!constructionUser}
                            onChange={() => setConstructionUser(false)}
                            className="text-blue-500 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-gray-700">Normal User</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="userType"
                            value="construction"
                            checked={constructionUser}
                            onChange={() => setConstructionUser(true)}
                            className="text-blue-500 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-gray-700">Construction User</span>
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                      <select
                        value={formData.company_id}
                        onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select company</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id.toString()}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(constructionUser || (editingUser && formData.machine_id !== '0' && formData.machine_id !== '')) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Machine Registration Number</label>
                        <select
                          value={formData.machine_id}
                          onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                          required={constructionUser}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="">Select Registration Number</option>
                          {machines.map((machine) => (
                            <option key={machine.machine_id} value={machine.machine_id}>
                              {machine.registration_number}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        autoComplete="off"
                        placeholder="Enter full name"
                        value={formData.fullname}
                        onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        autoComplete="new-email"
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact No</label>
                      <input
                        type="tel"
                        autoComplete="tel"
                        placeholder="Enter contact number"
                        value={formData.contact_no}
                        onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                        required={!editingUser}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                          type="password"
                          autoComplete="new-password"
                          placeholder="Enter password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    )}
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
                        editingUser
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                          : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {editingUser ? 'Update User' : 'Add User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
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
                      User ID
                    </label>
                    <p className="text-gray-900 font-medium">{selectedUser.user_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    {getStatusBadge(selectedUser.is_active)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Username
                    </label>
                    <p className="text-gray-900">{selectedUser.uname}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Version
                    </label>
                    <p className="text-gray-900">{selectedUser.version}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Company ID
                    </label>
                    <p className="text-gray-900">{selectedUser.company_id}</p>
                  </div>
                  {selectedUser.machine_id && selectedUser.machine_id !== '0' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Machine ID
                      </label>
                      <p className="text-gray-900">{selectedUser.machine_id}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    handleStartEdit(selectedUser);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit User
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
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

export default Users;