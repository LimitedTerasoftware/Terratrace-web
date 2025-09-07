import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Edit, Eye, Filter, Search, X, Plus, Building, Users, MapPin, Phone } from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';
import Modal from '../hooks/ModalPopup';

type Company = {
  id: number;
  name: string;
  address?: string;
  contact_number?: string;
};

interface CompanyFormData {
  name: string;
  address: string;
  contact_number: string;
}

interface ModalData {
  title: string;
  message: string;
  type: "success" | "error" | "info";
}

const CompaniesTable: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  
  // State management
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
  const [editingCompany, setEditingCompany] = useState<Company | undefined>(undefined);
  const [formData, setFormData] = useState<CompanyFormData>({ 
    name: '', 
    address: '', 
    contact_number: '' 
  });
  
  // Filter states - Updated to have separate search terms
  const [nameSearch, setNameSearch] = useState('');
  const [addressSearch, setAddressSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const API_URL = `${BASEURL}/companies`;

  // Data fetching
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await axios.get<Company[]>(API_URL);
      setCompanies(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const resetFormData = () => {
    setFormData({ name: '', address: '', contact_number: '' });
  };

  const handleOpenAddModal = () => {
    setEditingCompany(undefined);
    resetFormData();
    setIsFormModalOpen(true);
  };

  const handleStartEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      address: company.address || '',
      contact_number: company.contact_number || '',
    });
    setIsFormModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingCompany(undefined);
    resetFormData();
    setIsFormModalOpen(false);
  };

  const handleAddCompany = async () => {
    if (!formData.name.trim() || !formData.address.trim() || !formData.contact_number.trim()) {
      setModalData({
        title: "Error!",
        message: "All fields are required!",
        type: "error",
      });
      setModalOpen(true);
      return;
    }

    try {
      const response = await axios.post(API_URL, formData);
      if (response.status === 200 || response.status === 201) {
        setModalData({
          title: "Success!",
          message: "Company added successfully!",
          type: "success",
        });
        setModalOpen(true);
        setIsFormModalOpen(false);
        fetchCompanies(); // Refresh data
        resetFormData();
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Something went wrong while adding the company.";
      setModalData({
        title: "Error!",
        message: `Failed to add company: ${errorMessage}`,
        type: "error",
      });
      setModalOpen(true);
    }
  };

  const handleEditCompany = async () => {
    if (!formData.name.trim() || !formData.address.trim() || !formData.contact_number.trim()) {
      setModalData({
        title: "Error!",
        message: "All fields are required!",
        type: "error",
      });
      setModalOpen(true);
      return;
    }

    if (!editingCompany) return;

    try {
      const response = await axios.put(`${API_URL}/${editingCompany.id}`, formData);
      if (response.status === 200 || response.status === 201) {
        setModalData({
          title: "Success!",
          message: "Company updated successfully!",
          type: "success",
        });
        setModalOpen(true);
        setIsFormModalOpen(false);
        fetchCompanies(); // Refresh data
        resetFormData();
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Something went wrong while updating the company.";
      setModalData({
        title: "Error!",
        message: `Failed to update company: ${errorMessage}`,
        type: "error",
      });
      setModalOpen(true);
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this company?')) {
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      if (response.status === 200 || response.status === 204) {
        setModalData({
          title: "Success!",
          message: "Company deleted successfully!",
          type: "success",
        });
        setModalOpen(true);
        fetchCompanies(); // Refresh data
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || "Something went wrong while deleting the company.";
      setModalData({
        title: "Error!",
        message: `Failed to delete company: ${errorMessage}`,
        type: "error",
      });
      setModalOpen(true);
    }
  };

  // Clear all search filters
  const clearAllFilters = () => {
    setNameSearch('');
    setAddressSearch('');
    setContactSearch('');
  };

  // Filter data - Updated to use separate search terms
  const filteredData = companies.filter(company => {
    const matchesName = nameSearch === '' || 
      (company.name || "").toLowerCase().includes(nameSearch.toLowerCase());
    
    const matchesAddress = addressSearch === '' || 
      (company.address || "").toLowerCase().includes(addressSearch.toLowerCase());
    
    const matchesContact = contactSearch === '' || 
      (company.contact_number || "").toLowerCase().includes(contactSearch.toLowerCase());
    
    return matchesName && matchesAddress && matchesContact;
  });

  // Statistics
  const getStats = () => {
    const totalCompanies = companies.length;
    const companiesWithAddress = companies.filter(c => c.address && c.address.trim() !== '').length;
    const companiesWithContact = companies.filter(c => c.contact_number && c.contact_number.trim() !== '').length;
    
    return { totalCompanies, companiesWithAddress, companiesWithContact };
  };

  const { totalCompanies, companiesWithAddress, companiesWithContact } = getStats();

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

  const columns: TableColumn<Company>[] = [
    { name: "ID", selector: row => row.id, sortable: true, width: '80px' },
    { name: "Company Name", selector: row => row.name, sortable: true },
    { name: "Address", selector: row => row.address || 'N/A', sortable: true },
    { name: "Contact Number", selector: row => row.contact_number || 'N/A', sortable: true },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedCompany(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleStartEdit(row)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Company"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '120px',
    },
  ];

  // Header component
  const CompaniesHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Companies</h1>
              <p className="text-sm text-gray-600">Monitor and manage company information</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add New Company
            </button>
            
            <nav>
              <ol className="flex items-center gap-2">
                <li>
                  <Link className="font-medium" to="/dashboard">
                    Dashboard /
                  </Link>
                </li>
                <li className="font-medium text-primary">Company Management</li>
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
      <CompaniesHeader />

      {/* Status Cards */}
      <div className="px-1 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalCompanies}</div>
                <div className="text-sm text-gray-600">Total Companies</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{companiesWithAddress}</div>
                <div className="text-sm text-gray-600">With Address</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">{companiesWithContact}</div>
                <div className="text-sm text-gray-600">With Contact</div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-indigo-600">{Math.round((companiesWithContact / totalCompanies) * 100) || 0}%</div>
                <div className="text-sm text-gray-600">Complete Profiles</div>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-1">
        <div className="space-y-8">
          {/* Companies Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col space-y-4">
                {/* Three Search Bars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={nameSearch}
                      onChange={(e) => setNameSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by address..."
                      value={addressSearch}
                      onChange={(e) => setAddressSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search by contact..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Clear Filters Button */}
                <div className="flex justify-start">
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>

            {filteredData.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                <p className="text-gray-500">
                  {nameSearch || addressSearch || contactSearch
                    ? 'Try adjusting your search criteria.'
                    : 'Add your first company to get started.'
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

        {/* Company Form Modal */}
        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {editingCompany ? (
                      <Edit className="w-6 h-6 text-blue-600" />
                    ) : (
                      <Plus className="w-6 h-6 text-green-600" />
                    )}
                    <h2 className="text-xl font-semibold text-gray-900">
                      {editingCompany ? 'Edit Company' : 'Add New Company'}
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
                  editingCompany ? handleEditCompany() : handleAddCompany();
                }}>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        placeholder="Enter company name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        placeholder="Enter company address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Enter contact number"
                        value={formData.contact_number}
                        onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
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
                        editingCompany
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                          : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {editingCompany ? 'Update Company' : 'Add Company'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Company Details Modal */}
        {selectedCompany && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Company Details</h3>
                  <button
                    onClick={() => setSelectedCompany(null)}
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
                      Company ID
                    </label>
                    <p className="text-gray-900 font-medium">{selectedCompany.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Company Name
                    </label>
                    <p className="text-gray-900 font-medium">{selectedCompany.name}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Address
                    </label>
                    <p className="text-gray-900">{selectedCompany.address || 'No address provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Contact Number
                    </label>
                    <p className="text-gray-900">{selectedCompany.contact_number || 'No contact number provided'}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedCompany(null);
                    handleStartEdit(selectedCompany);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Edit Company
                </button>
                <button
                  onClick={() => setSelectedCompany(null)}
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

export default CompaniesTable;