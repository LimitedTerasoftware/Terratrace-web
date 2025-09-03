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
    sfp_10g: string[];
    sfp_1g: string[];
    sfp_100g: string[];
    rfms: any;
    equipment_photo: string[];
    block_contacts: any;
    created_at: string;
    updated_at: string;
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

  const getStatusBadge = () => {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200 whitespace-nowrap">
        Installed
      </span>
    );
  };

  const parsePhotosArray = (photosData: string[] | string): string[] => {
    try {
      if (Array.isArray(photosData)) {
        return photosData;
      }
      const parsed = JSON.parse(photosData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseEquipmentData = (dataString: string | any) => {
    try {
      if (typeof dataString === 'object') {
        return dataString;
      }
      return JSON.parse(dataString);
    } catch {
      return null;
    }
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
      selector: row => row.state_code,
      sortable: true,
      maxWidth: "140px",
      cell: (row) => (
        <span title={row.state_code} className="truncate">
          {row.state_code}
        </span>
      ),
    },
    {
      name: "District", 
      selector: row => row.district_code,
      sortable: true,
      maxWidth: "150px",
      cell: (row) => (
        <span title={row.district_code} className="truncate">
          {row.district_code}
        </span>
      ),
    },
    {
      name: "Block Name",
      selector: row => row.block_name,
      sortable: true,
      maxWidth: "200px",
      cell: (row) => (
        <span title={row.block_name} className="truncate">
          {row.block_name}
        </span>
      ),
    },
    {
      name: "Location",
      selector: row => `${row.block_latitude}, ${row.block_longitude}`,
      sortable: true,
      maxWidth: "180px",
      cell: (row) => (
        <div className="flex items-center min-w-0 w-full">
          <MapPin className="w-3 h-3 text-gray-600 mr-1 flex-shrink-0" />
          <span className="truncate min-w-0 text-xs" title={`${row.block_latitude}, ${row.block_longitude}`}>
            {row.block_latitude.substring(0, 8)}, {row.block_longitude.substring(0, 8)}
          </span>
        </div>
      ),
    },
    {
      name: "Contact Person",
      cell: (row) => {
        const contacts = parseEquipmentData(row.block_contacts);
        const contact = Array.isArray(contacts) ? contacts[0] : contacts;
        return contact ? (
          <div className="flex items-center min-w-0 w-full">
            <User className="w-3 h-3 text-gray-600 mr-1 flex-shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{contact.name}</div>
              <div className="truncate text-xs text-gray-500">{contact.phone}</div>
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
      selector: row => row.created_at,
      sortable: true,
      maxWidth: "140px",
      cell: (row) => moment(row.created_at).format("DD/MM/YYYY"),
    },
{
  name: 'Actions',
  cell: (row) => (
    <div className="flex space-x-2">
      <button
        onClick={() => navigate(`/installation/block-detail/${row.id}`)}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        onClick={() => navigate(`/installation/block-detail/${row.id}`)}
        className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 outline-none"
      >
        View
      </button>
    </div>
  ),
  ignoreRowClick: true,
  allowOverflow: true,
  button: true,
  maxWidth: "120px",
},
  ];

  useEffect(() => {
    if (Data.excel === true && filteredData.length > 0) {
      const exportExcel = async () => {
        setLoading(true);
        const workbook = XLSX.utils.book_new();

        const headers = [
          "State Code", "District Code", "Block Code", "Block Name", 
          "Block Latitude", "Block Longitude", "Block Photos",
          "Smart Rack Details", "FDMS Shelf Details", "IP MPLS Router",
          "SFP 10G", "SFP 1G", "SFP 100G", "RFMS",
          "Equipment Photos", "Block Contacts", "Created At", "Updated At"
        ];

        const dataRows = filteredData.map(row => [
          row.state_code, row.district_code, row.block_code, row.block_name,
          row.block_latitude, row.block_longitude, JSON.stringify(row.block_photos),
          JSON.stringify(row.smart_rack), JSON.stringify(row.fdms_shelf), JSON.stringify(row.ip_mpls_router),
          JSON.stringify(row.sfp_10g), JSON.stringify(row.sfp_1g), JSON.stringify(row.sfp_100g), JSON.stringify(row.rfms),
          JSON.stringify(row.equipment_photo), JSON.stringify(row.block_contacts), row.created_at, row.updated_at
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

        {/* Block Installation Details Modal */}
        {selectedInstallation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Block Installation Details</h3>
                  <button
                    onClick={() => setSelectedInstallation(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Block Name</label>
                    <p className="text-gray-900 font-medium">{selectedInstallation.block_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">State Code</label>
                    <p className="text-gray-900">{selectedInstallation.state_code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">District Code</label>
                    <p className="text-gray-900">{selectedInstallation.district_code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Block Code</label>
                    <p className="text-gray-900">{selectedInstallation.block_code}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Block Latitude</label>
                    <p className="text-gray-900">{selectedInstallation.block_latitude}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Block Longitude</label>
                    <p className="text-gray-900">{selectedInstallation.block_longitude}</p>
                  </div>
                </div>

                {/* Block Photos Section */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Image className="w-4 h-4 text-blue-600" />
                    Block Photos
                  </h4>
                  {(() => {
                    const photos = parsePhotosArray(selectedInstallation.block_photos);
                    return photos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {photos.map((photo, index) => (
                          <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                            <img
                              src={`${baseUrl}${photo}`}
                              alt={`Block Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                              onClick={() => setZoomImage(`${baseUrl}${photo}`)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No block photos available</p>
                    );
                  })()}
                </div>

                {/* Equipment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {renderEquipmentDetails(selectedInstallation.smart_rack, "Smart Rack")}
                    {renderEquipmentDetails(selectedInstallation.fdms_shelf, "FDMS Shelf")}
                    {renderEquipmentDetails(selectedInstallation.ip_mpls_router, "IP MPLS Router")}
                    {renderEquipmentDetails(selectedInstallation.rfms, "RFMS")}
                  </div>
                  <div>
                    {renderEquipmentDetails(selectedInstallation.sfp_10g, "SFP 10G")}
                    {renderEquipmentDetails(selectedInstallation.sfp_1g, "SFP 1G")}
                    {renderEquipmentDetails(selectedInstallation.sfp_100g, "SFP 100G")}
                  </div>
                </div>

                {/* Equipment Photos */}
                {selectedInstallation.equipment_photo && selectedInstallation.equipment_photo.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Image className="w-4 h-4 text-blue-600" />
                      Equipment Photos
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selectedInstallation.equipment_photo.map((photo, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                          <img
                            src={`${baseUrl}${photo}`}
                            alt={`Equipment Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                            onClick={() => setZoomImage(`${baseUrl}${photo}`)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-700 mb-3">Block Contacts</h4>
                  {(() => {
                    const contacts = parseEquipmentData(selectedInstallation.block_contacts);
                    const contactList = Array.isArray(contacts) ? contacts : [contacts].filter(Boolean);
                    return contactList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {contactList.map((contact: any, index: number) => (
                          <div key={index} className="bg-gray-50 p-3 rounded">
                            <div className="text-sm">
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">{contact.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Phone:</span>
                                <span className="font-medium">{contact.phone}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <span className="text-gray-400">No contact info</span>;
                  })()}
                </div>

                {/* Timestamps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                    <p className="text-gray-900 text-sm">
                      {moment(selectedInstallation.created_at).format("DD/MM/YYYY, hh:mm A")}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                    <p className="text-gray-900 text-sm">
                      {moment(selectedInstallation.updated_at).format("DD/MM/YYYY, hh:mm A")}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedInstallation(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
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