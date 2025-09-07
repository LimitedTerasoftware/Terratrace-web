import React, { useEffect, useState } from 'react'
import { Block, District, GPList, GPListFormData, GPMainData, StateData } from '../../types/survey'
import DataTable, { TableColumn } from 'react-data-table-component';
import { Edit, Eye, Filter, Search, X } from 'lucide-react';
import moment from 'moment';
import { getBlockData, getDistrictData, getStateData } from '../Services/api';

interface GPListProps {
  GpList?: GPMainData;
  onEdit: (GP: GPList) => void;
  onDelete: (id: string) => void;
  OnPage: (id: number) => void;
  Onstate: (id: string) => void;
  OnDist: (id: string) => void;
  OnBlock: (id: string) => void;
}

const GpListPage: React.FC<GPListProps> = ({ GpList, onEdit, onDelete, OnPage, Onstate, OnDist, OnBlock }) => {
  const [selectedGp, setSelectedGp] = useState<GPList | null>(null);
  const [totalRows, setTotalRows] = useState(GpList?.totalRows || 0);
  const [currentPage, setCurrentPage] = useState(GpList?.currentPage || 0);
  const [perPage, setPerPage] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  useEffect(() => {
    setTotalRows(GpList?.totalRows || 0);
    setCurrentPage(GpList?.currentPage || 0)
  }, [GpList])

  useEffect(() => {
    getStateData().then(data => {
      setStates(data);
    })
  }, [])

  useEffect(() => {
    if (selectedState) {
      getDistrictData(selectedState).then(data => {
        setDistricts(data);
      })
    } else {
      setDistricts([])
    }
  }, [selectedState])

  useEffect(() => {
    if (selectedDistrict) {
      getBlockData(selectedDistrict).then(data => {
        setBlocks(data);
      })
    } else {
      setBlocks([])
    }
  }, [selectedDistrict])

  // Filter data locally for search and type filter
  const filteredData = GpList?.data?.filter(gp => {
    const matchesSearch = 
      (gp.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gp.st_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gp.dt_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gp.blk_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gp.lgd_code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (gp.type || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || gp.type === typeFilter;
    
    return matchesSearch && matchesType;
  }) || [];

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, string> = {
      GP: 'bg-green-100 text-green-800 border-green-200',
      ONT: 'bg-purple-100 text-purple-800 border-purple-200',
      BHQ: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      OLT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      FPOI: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${typeConfig[type] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {type}
      </span>
    );
  };

  // Custom header styling to match the machine management
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

  const columns: TableColumn<GPList>[] = [
    { name: "GP Name", selector: row => row.name, sortable: true },
    { name: "State", selector: row => row.st_name, sortable: true },
    { name: "District", selector: row => row.dt_name, sortable: true },
    { name: "Block", selector: row => row.blk_name, sortable: true },
    {
      name: 'Type',
      selector: (row) => row.type,
      sortable: true,
      cell: (row) => getTypeBadge(row.type),
    },
    { name: "LGD Code", selector: row => row.lgd_code, sortable: true },
    { name: "Latitude", selector: row => row.lattitude, sortable: true },
    { name: "Longitude", selector: row => row.longitude, sortable: true },
    { name: "Created at", selector: row => moment(row.created_at).format("DD/MM/YYYY, hh:mm A"), sortable: true },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedGp(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(row)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit GP"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ]

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    OnPage(page)
  };

  const handlePerRowsChange = async (newPerPage: number, page: number) => {
    setPerPage(newPerPage);
    setCurrentPage(page);
    OnPage(page)
  };

  const handleClearFilters = () => {
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSearchTerm('');
    setTypeFilter('all');
    Onstate('');
    OnDist('');
    OnBlock('');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col space-y-4">
          {/* Search and Type Filter Row */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search GPs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="GP">GP</option>
                <option value="ONT">ONT</option>
                <option value="BHQ">BHQ</option>
                <option value="OLT">OLT</option>
                <option value="FPOI">FPOI</option>
              </select>
            </div>
          </div>

          {/* Geographic Filters Row */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedState || ''}
                onChange={(e) => {
                  const name = states.find((state) => state.state_id == e.target.value);
                  if (name) {
                    Onstate(name.state_code);
                    setSelectedState(e.target.value)
                  }
                }}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state.state_id} value={state.state_id}>
                    {state.state_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedDistrict || ''}
                onChange={(e) => {
                  const name = districts.find((district) => district.district_id == e.target.value);
                  if (name) {
                    OnDist(name.district_code);
                    setSelectedDistrict(e.target.value)
                  }
                }}
                disabled={!selectedState}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Districts</option>
                {districts.map((district) => (
                  <option key={district.district_id} value={district.district_id}>
                    {district.district_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedBlock || ''}
                onChange={(e) => {
                  const name = blocks.find((block) => block.block_id == e.target.value);
                  if (name) {
                    OnBlock(name?.block_code);
                    setSelectedBlock(e.target.value)
                  }
                }}
                disabled={!selectedDistrict}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Blocks</option>
                {blocks.map((block) => (
                  <option key={block.block_id} value={block.block_id}>
                    {block.block_name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No GPs found</h3>
          <p className="text-gray-500">
            {searchTerm || typeFilter !== 'all' || selectedState || selectedDistrict || selectedBlock
              ? 'Try adjusting your search or filter criteria.'
              : 'Add your first GP to get started.'
            }
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationDefaultPage={1}
            paginationPerPage={perPage}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handlePerRowsChange}
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

      {/* GP Details Modal */}
      {selectedGp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">GP Details</h3>
                <button
                  onClick={() => setSelectedGp(null)}
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
                    GP Name
                  </label>
                  <p className="text-gray-900 font-medium">{selectedGp.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Type
                  </label>
                  {getTypeBadge(selectedGp.type)}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    State
                  </label>
                  <p className="text-gray-900">{selectedGp.st_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    District
                  </label>
                  <p className="text-gray-900">{selectedGp.dt_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Block
                  </label>
                  <p className="text-gray-900">{selectedGp.blk_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    LGD Code
                  </label>
                  <p className="text-gray-900">{selectedGp.lgd_code}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Latitude
                  </label>
                  <p className="text-gray-900">{selectedGp.lattitude}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Longitude
                  </label>
                  <p className="text-gray-900">{selectedGp.longitude}</p>
                </div>
              </div>

              {selectedGp.remark && (
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Remarks
                  </label>
                  <p className="text-gray-900">{selectedGp.remark}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Created At
                  </label>
                  <p className="text-gray-900 text-sm">
                    {new Date(selectedGp.created_at).toLocaleDateString()} at {new Date(selectedGp.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Last Updated
                  </label>
                  <p className="text-gray-900 text-sm">
                    {new Date(selectedGp.updated_at).toLocaleDateString()} at {new Date(selectedGp.updated_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedGp(null);
                  onEdit(selectedGp);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Edit GP
              </button>
              <button
                onClick={() => setSelectedGp(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GpListPage