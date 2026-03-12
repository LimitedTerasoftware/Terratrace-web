import React, { useState } from 'react';
import { Firm } from '../../types/firm';
import { Edit, Trash2, Search, Eye } from 'lucide-react';
import DataTable, { TableColumn } from 'react-data-table-component';

interface FirmListProps {
  firms: Firm[];
  onEdit: (firm: Firm) => void;
}

const FirmList: React.FC<FirmListProps> = ({ firms, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null);

  const filteredFirms = firms.filter((firm) => {
    const matchesSearch =
      (firm.firm_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (firm.authorised_person || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (firm.authorised_mobile || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    
    return matchesSearch ;
  });

 



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

  const columns: TableColumn<Firm>[] = [
    { name: 'Firm Name', selector: (row) => row.firm_name, sortable: true },
    {
      name: 'Authorised Person',
      selector: (row) => row.authorised_person,
      sortable: true,
    },
    {
      name: 'Mobile Number',
      selector: (row) => row.authorised_mobile,
      sortable: true,
    },
  
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedFirm(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(row)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Edit Firm"
          >
            <Edit className="w-4 h-4" />
          </button>
        
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search firms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        
        </div>
      </div>

      {filteredFirms.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No firms found
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search or filter criteria.'
              : 'Add your first firm to get started.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredFirms}
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

      {selectedFirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  Firm Details
                </h3>
                <button
                  onClick={() => setSelectedFirm(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Firm Name
                  </label>
                  <p className="text-gray-900 font-medium">
                    {selectedFirm.firm_name}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Authorised Person
                  </label>
                  <p className="text-gray-900">
                    {selectedFirm.authorised_person}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Mobile Number
                  </label>
                  <p className="text-gray-900">
                    {selectedFirm.authorised_mobile}
                  </p>
                </div>
              </div>

             
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedFirm(null);
                  onEdit(selectedFirm);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Edit Firm
              </button>
              <button
                onClick={() => setSelectedFirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirmList;
