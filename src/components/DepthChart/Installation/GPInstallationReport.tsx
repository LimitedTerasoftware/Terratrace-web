import axios from 'axios';
import { Search, User, Eye, X, MapPin, Settings, Image } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'
import moment from 'moment';
import * as XLSX from "xlsx";
import DataTable, { TableColumn } from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';

// GP Installation Data Interface
interface GPInstallationData {
    id: number;
    user_id: number;
    state_code: string;
    district_code: string;
    block_code: string;
    gp_code: string;
    gp_name: string;
    gp_latitude: string;
    gp_longitude: string;
    gp_photos: string;
    smart_rack: string;
    fdms_shelf: string;
    ip_mpls_router: string;
    sfp_10g: string;
    sfp_1g: string;
    power_system_with_mppt: string;
    power_system_with_out_mppt: string;
    mppt_solar_1kw: string;
    equipment_photo: string;
    electricity_meter: string;
    earthpit: string;
    gp_contact: string;
    key_person: string;
    created_at: string;
    updated_at: string;
    state_name: string;
    district_name: string;
    block_name: string;
}

interface GPInstallationReportProps {
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

const GPInstallationReport: React.FC<GPInstallationReportProps> = ({ Data, Onexcel }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GPInstallationData[]>([]);
  const [selectedRows, setSelectedRows] = useState<GPInstallationData[]>([]);
  const [toggleCleared, setToggleCleared] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<GPInstallationData | null>(null);
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
        
        const response = await axios.get<{ status: boolean; data: GPInstallationData[] }>(
          `${BASEURL}/get-gp-installation`,
          { params }
        );
        
        if (response.data.status) {
          setData(response.data.data);
        } else {
          console.error('API returned status=false', response.data);
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching GP installation data', error);
        setError('Failed to fetch GP installation data');
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

    return data.filter((row: GPInstallationData) =>
      Object.values(row).some((value) =>
        (typeof value === 'string' || typeof value === 'number') &&
        value.toString().toLowerCase().includes(lowerSearch)
      )
    );
  }, [Data.globalsearch, data]);

  const handleRowSelected = (state: { allSelected: boolean; selectedCount: number; selectedRows: GPInstallationData[] }) => {
    setSelectedRows(state.selectedRows);
  };

  const handleClearRows = () => {
    setToggleCleared(!toggleCleared);
    setSelectedRows([]);
  };

  const getStatusBadge = () => {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200 whitespace-nowrap">
        Installed
      </span>
    );
  };

  const parsePhotosArray = (photosString: string): string[] => {
    try {
      if (!photosString || typeof photosString !== 'string') return [];
      const parsed = JSON.parse(photosString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseEquipmentData = (dataString: string) => {
    try {
      if (!dataString || typeof dataString !== 'string') return null;
      return JSON.parse(dataString);
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

  const columns: TableColumn<GPInstallationData>[] = [
    {
      name: "State",
      selector: row => row.state_name || '',
      sortable: true,
      maxWidth: "140px",
      cell: (row) => (
        <span title={row.state_name || ''} className="truncate">
          {row.state_name || 'N/A'}
        </span>
      ),
    },
    {
      name: "District", 
      selector: row => row.district_name || '',
      sortable: true,
      maxWidth: "150px",
      cell: (row) => (
        <span title={row.district_name || ''} className="truncate">
          {row.district_name || 'N/A'}
        </span>
      ),
    },
    {
      name: "Block",
      selector: row => row.block_name || '',
      sortable: true,
      maxWidth: "130px",
      cell: (row) => (
        <span title={row.block_name || ''} className="truncate">
          {row.block_name || 'N/A'}
        </span>
      ),
    },
    {
      name: "GP Name",
      selector: row => row.gp_name || '',
      sortable: true,
      maxWidth: "200px",
      cell: (row) => (
        <span title={row.gp_name || ''} className="truncate">
          {row.gp_name || 'N/A'}
        </span>
      ),
    },
    {
      name: "Location",
      selector: row => `${row.gp_latitude || ''}, ${row.gp_longitude || ''}`,
      sortable: true,
      maxWidth: "180px",
      cell: (row) => (
        <div className="flex items-center min-w-0 w-full">
          <MapPin className="w-3 h-3 text-gray-600 mr-1 flex-shrink-0" />
          <span 
            className="truncate min-w-0 text-xs" 
            title={`${row.gp_latitude || 'N/A'}, ${row.gp_longitude || 'N/A'}`}
          >
            {safeSubstring(row.gp_latitude, 0, 8) || 'N/A'}, {safeSubstring(row.gp_longitude, 0, 8) || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      name: "Contact Person",
      cell: (row) => {
        const contact = parseEquipmentData(row.gp_contact);
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
      selector: () => 'installed',
      sortable: true,
      maxWidth: "100px",
      cell: () => getStatusBadge(),
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
          onClick={() => navigate(`/installation/gp-detail/${row.id}`)}
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
          "State Name", "District Name", "Block Name", "GP Name", 
          "GP Code", "GP Latitude", "GP Longitude",
          "Smart Rack Details", "FDMS Shelf Details", "IP MPLS Router",
          "SFP 10G", "SFP 1G", "Power System MPPT", "Solar 1KW",
          "Equipment Photos", "Electricity Meter", "Earthpit Details",
          "GP Contact", "Key Person", "Created At", "Updated At"
        ];

        const dataRows = filteredData.map(row => [
          row.state_name || '', row.district_name || '', row.block_name || '', row.gp_name || '',
          row.gp_code || '', row.gp_latitude || '', row.gp_longitude || '',
          row.smart_rack || '', row.fdms_shelf || '', row.ip_mpls_router || '',
          row.sfp_10g || '', row.sfp_1g || '', row.power_system_with_mppt || '', row.mppt_solar_1kw || '',
          row.equipment_photo || '', row.electricity_meter || '', row.earthpit || '',
          row.gp_contact || '', row.key_person || '', row.created_at || '', row.updated_at || ''
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
        XLSX.utils.book_append_sheet(workbook, worksheet, "GP Installation");
        XLSX.writeFile(workbook, "GP_Installation_Data.xlsx", { compression: true });
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

  const renderEquipmentDetails = (equipmentData: string, title: string) => {
    const data = parseEquipmentData(equipmentData);
    if (!data) return null;

    if (Array.isArray(data)) {
      return (
        <div className="mb-4">
          <h4 className="font-medium text-gray-700 mb-2">{title}</h4>
          {data.map((item: any, index: number) => (
            <div key={index} className="bg-gray-50 p-3 rounded mb-2">
              {Object.entries(item).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                  <span className="font-medium">{value as string}</span>
                </div>
              ))}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No GP installation data found</h3>
            <p className="text-gray-500">
              {Data.globalsearch
                ? 'Try adjusting your search or filter criteria.'
                : 'There is no GP installation data available.'
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
                alt="GP Installation Photo"
                className="max-w-full max-h-full rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPInstallationReport;