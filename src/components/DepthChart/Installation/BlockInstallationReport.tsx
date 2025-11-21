import axios from 'axios';
import { Search, User, Eye, X, MapPin, Settings, Image } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'
import moment from 'moment';
import * as XLSX from "xlsx";
import DataTable, { TableColumn } from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';

// Block Installation Data Interface
interface BlockInstallationData {
    id: number;
    user_id: number;
    state_code: string;
    district_code: string;
    block_code: string;
    block_name: string;
    block_latitude: string;
    block_longitude: string;
    block_photos: string[];
    smart_rack: any;
    fdms_shelf: any;
    ip_mpls_router: any;
    sfp_10g_40: any; // Updated field name
    sfp_1g_10: any;  // Updated field name
    sfp_10g_10: any; // Updated field name
    rfms: any;
    RFMS_FILTERS: any;
    equipment_photo: string[];
    fiber_entry: any;
    splicing_photo: any;
    block_contacts: any;
    status?: string;
    created_at: string;
    updated_at: string;
    state_name?: string;      
    district_name?: string;
}

interface BlockInstallationReportProps {
  Data: {
    selectedState: string | null;
    selectedDistrict: string | null;
    selectedBlock: string | null;
    fromdate: string;
    todate: string;
    globalsearch: string;
    excel: boolean;
    filtersReady: boolean;
  };
  Onexcel: () => void;
}

const BASEURL = import.meta.env.VITE_TraceAPI_URL;
const baseUrl = import.meta.env.VITE_Image_URL;

const BlockInstallationReport: React.FC<BlockInstallationReportProps> = ({ Data, Onexcel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BlockInstallationData[]>([]);
  const [selectedRows, setSelectedRows] = useState<BlockInstallationData[]>([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<BlockInstallationData | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstallationData = async () => {
      try {
        setLoading(true);
        setError('');
        const params: any = {};
        if (Data.selectedState) params.state_code = Data.selectedState;
        if (Data.selectedDistrict) params.district_code = Data.selectedDistrict;
        if (Data.selectedBlock) params.block_code = Data.selectedBlock;
        if (Data.fromdate) params.from_date = Data.fromdate;
        if (Data.todate) params.to_date = Data.todate;
        
        const response = await axios.get<{ status: boolean; data: BlockInstallationData[] }>(
          `${BASEURL}/get-block-installation`,
          { params }
        );
        
        if (response.data.status) {
          setData(response.data.data);
        } else {
          console.error('API returned status=false', response.data);
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching Block installation data', error);
        setError('Failed to fetch Block installation data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (!Data.filtersReady) return;
    fetchInstallationData();
  }, [Data.selectedState, Data.selectedDistrict, Data.selectedBlock, Data.fromdate, Data.todate, Data.filtersReady]);

  const filteredData = useMemo(() => {
    if (!Data.globalsearch.trim()) return data;

    const lowerSearch = Data.globalsearch.toLowerCase();

    return data.filter((row: BlockInstallationData) =>
      Object.values(row).some((value) =>
        (typeof value === 'string' || typeof value === 'number') &&
        value.toString().toLowerCase().includes(lowerSearch)
      )
    );
  }, [Data.globalsearch, data]);

  const handleRowSelected = (state: { allSelected: boolean; selectedCount: number; selectedRows: BlockInstallationData[] }) => {
    setSelectedRows(state.selectedRows);
  };

  const handleClearRows = () => {
    setToggleCleared(!toggleCleared);
    setSelectedRows([]);
  };

  // Updated getStatusBadge to accept status parameter
  type StatusType = 'ACCEPT' | 'PENDING' | 'REJECT';

  interface StatusConfig {
    bg: string;
    text: string;
    border: string;
    label: string;
  }

  const isValidStatus = (status: string): status is StatusType => {
    return ['ACCEPT', 'PENDING', 'REJECT'].includes(status);
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<StatusType, StatusConfig> = {
      'ACCEPT': { 
        bg: 'bg-green-100', 
        text: 'text-green-800', 
        border: 'border-green-200', 
        label: 'Accepted' 
      },
      'PENDING': { 
        bg: 'bg-yellow-100', 
        text: 'text-yellow-800', 
        border: 'border-yellow-200', 
        label: 'Pending' 
      },
      'REJECT': { 
        bg: 'bg-red-100', 
        text: 'text-red-800', 
        border: 'border-red-200', 
        label: 'Rejected' 
      }
    };
    
    // Default to PENDING if no status or invalid status
    const validStatus = status && isValidStatus(status.toUpperCase()) 
      ? status.toUpperCase() as StatusType 
      : 'PENDING';
    
    const config = statusConfig[validStatus];
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} whitespace-nowrap`}>
        {config.label}
      </span>
    );
  };

  const parsePhotosArray = (photosData: string[] | string): string[] => {
    try {
      if (Array.isArray(photosData)) {
        return photosData;
      }
      if (typeof photosData === 'string') {
        const parsed = JSON.parse(photosData);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch {
      return [];
    }
  };

  const parseEquipmentData = (dataString: string | any) => {
    try {
      if (typeof dataString === 'object') {
        return dataString;
      }
      if (typeof dataString === 'string') {
        return JSON.parse(dataString);
      }
      return null;
    } catch {
      return null;
    }
  };

  // Safe string operations with null checks
  const safeSubstring = (str: string | null | undefined, start: number, end?: number): string => {
    if (!str || typeof str !== 'string') return '';
    return str.substring(start, end);
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

  const columns: TableColumn<BlockInstallationData>[] = [
    {
      name: "State",
      selector: row => row.state_name || row.state_code || '',
      sortable: true,
      maxWidth: "160px",
      cell: (row) => (
        <span title={row.state_name || row.state_code || ''} className="truncate">
          {row.state_name || row.state_code || 'N/A'}
        </span>
      ),
    },
    {
      name: "District", 
      selector: row => row.district_name || row.district_code || '',
      sortable: true,
      maxWidth: "160px",
      cell: (row) => (
        <span title={row.district_name || row.district_code || ''} className="truncate">
          {row.district_name || row.district_code || 'N/A'}
        </span>
      ),
    },
    {
      name: "Block Name",
      selector: row => row.block_name || '',
      sortable: true,
      maxWidth: "200px",
      cell: (row) => (
        <span title={row.block_name || ''} className="truncate">
          {row.block_name || 'N/A'}
        </span>
      ),
    },
    {
      name: "Location",
      cell: (row) => (
        <div className="flex items-center min-w-0 w-full">
          <MapPin className="w-3 h-3 text-gray-600 mr-1 flex-shrink-0" />
          <span 
            className="truncate text-xs"
            title={`${row.block_latitude || 'N/A'}, ${row.block_longitude || 'N/A'}`}
          >
            {safeSubstring(row.block_latitude, 0, 8) || 'N/A'}, {safeSubstring(row.block_longitude, 0, 8) || 'N/A'}
          </span>
        </div>
      ),
      minWidth: "150px",
      maxWidth: "180px",
    },
    {
      name: "Contact Person",
      cell: (row) => {
        const contacts = parseEquipmentData(row.block_contacts);
        const contact = contacts && contacts.length > 0 ? contacts[0] : null;
        return contact && contact.name ? (
          <div className="flex items-center min-w-0 w-full">
            <User className="w-3 h-3 text-gray-600 mr-1 flex-shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{contact.name}</div>
              <div className="truncate text-xs text-gray-500">{contact.phone || 'N/A'}</div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
      minWidth: "150px",
      maxWidth: "200px",
    },
    {
      name: 'Status',
      selector: (row) => row.status || 'PENDING',
      sortable: true,
      maxWidth: "120px",
      cell: (row) => getStatusBadge(row.status),
    },
    {
      name: "Created",
      selector: row => row.created_at || '',
      sortable: true,
      maxWidth: "140px",
      cell: (row) => row.created_at ? moment(row.created_at).format("DD/MM/YYYY") : 'N/A',
    },
    {
      name: 'Actions',
      cell: (row) => (
        <button
          onClick={() => navigate(`/installation/block-detail/${row.id}`)}
          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors outline-none"
        >
          View
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      maxWidth: "80px",
    },
  ];

  useEffect(() => {
    if (Data.excel === true && filteredData.length > 0) {
      const exportExcel = async () => {
        setLoading(true);
        const workbook = XLSX.utils.book_new();

        const headers = [
          "State Name", "State Code", "District Name", "District Code", 
          "Block Code", "Block Name", "Block Latitude", "Block Longitude", 
          "Block Photos", "Smart Rack Details", "FDMS Shelf Details", 
          "IP MPLS Router", "SFP 10G/40", "SFP 1G/10", "SFP 10G/10", "RFMS", "RFMS Filters",
          "Equipment Photos", "Fiber Entry", "Splicing Photos", "Block Contacts", "Status", "Created At", "Updated At"
        ];

        const dataRows = filteredData.map(row => [
          row.state_name || '', 
          row.state_code || '', 
          row.district_name || '',
          row.district_code || '', 
          row.block_code || '', 
          row.block_name || '',
          row.block_latitude || '', 
          row.block_longitude || '', 
          JSON.stringify(row.block_photos || []),
          JSON.stringify(row.smart_rack || {}), 
          JSON.stringify(row.fdms_shelf || {}), 
          JSON.stringify(row.ip_mpls_router || {}),
          JSON.stringify(row.sfp_10g_40 || []), 
          JSON.stringify(row.sfp_1g_10 || []), 
          JSON.stringify(row.sfp_10g_10 || []), 
          JSON.stringify(row.rfms || {}),
          JSON.stringify(row.RFMS_FILTERS || {}),
          JSON.stringify(row.equipment_photo || []), 
          JSON.stringify(row.fiber_entry || {}),
          JSON.stringify(row.splicing_photo || []),
          JSON.stringify(row.block_contacts || {}),
          row.status || 'PENDING',
          row.created_at || '', 
          row.updated_at || ''
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Block Installation");
        XLSX.writeFile(workbook, "Block_Installation_Data.xlsx", { compression: true });
        Onexcel();
        setLoading(false);
      };
      exportExcel();
    }
  }, [Data.excel, filteredData, Onexcel]);


  if (error) {
    return (
      <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
        <span className="font-medium">Error loading data:</span> {error}
      </div>
    );
  }

  const renderEquipmentDetails = (equipmentData: string | any, title: string) => {
    const data = parseEquipmentData(equipmentData);
    if (!data) return null;

    if (Array.isArray(data)) {
      return (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">{title}</h4>
          {data.map((item: any, index: number) => (
            <div key={index} className="bg-gray-50 p-3 rounded mb-2">
              {typeof item === 'object' ? Object.entries(item).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                  <span className="font-medium">{value as string}</span>
                </div>
              )) : (
                <div className="text-sm">
                  <span className="font-medium">{item}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    } else {
      return (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">{title}</h4>
          <div className="bg-gray-50 p-3 rounded">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                <span className="font-medium">{value as string}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
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

        {filteredData.length === 0 && !loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No block installation data found</h3>
            <p className="text-gray-500">
              {Data.globalsearch
                ? 'Try adjusting your search or filter criteria.'
                : 'There is no block installation data available.'
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
              progressComponent={
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              }
            />
          </div>
        )}

        {/* Image Zoom Modal */}
        {zoomImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            onClick={() => setZoomImage(null)}
          >
            <div className="relative max-w-4xl max-h-4xl p-4">
              <button
                onClick={() => setZoomImage(null)}
                className="absolute top-2 right-2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
              >
                <X size={20} />
              </button>
              <img
                src={zoomImage}
                alt="Block Installation Photo"
                className="max-w-full max-h-full rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockInstallationReport;