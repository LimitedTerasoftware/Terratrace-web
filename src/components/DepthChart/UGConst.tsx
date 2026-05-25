import axios from 'axios';
import { Search, User, Eye, X, PenIcon, View } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UGConstructionSurveyData } from '../../types/survey';
import moment from 'moment';
import * as XLSX from 'xlsx';
import DataTable, { TableColumn } from 'react-data-table-component';
import { AddConstModal } from './AddConstModal';
import { UpdateConstModal } from './UpdateConstModal';

interface ReportProps {
  Data: {
    selectedState: string | null;
    selectedDistrict: string | null;
    selectedBlock: string | null;
    selectedStatus: number | null;
    worktype:string;
    constType:string;
    fromdate: string;
    todate: string;
    globalsearch: string;
    excel: boolean;
    kml: boolean;
    filtersReady: boolean;
    preview: boolean;
    isAddModalOpen: boolean;
    selectedConnection: string | null;
    connectionStart?: string;
    connectionEnd?: string;
  };
  Onexcel: () => void;
  OnPreview: () => void;
  OnKml: () => void;
  OnModal: () => void;
  OnData: (data: UGConstructionSurveyData[]) => void;
}

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

const Report: React.FC<ReportProps> = ({
  Data,
  Onexcel,
  OnPreview,
  OnKml,
  OnModal,
  OnData,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UGConstructionSurveyData[]>([]);
  const [selectedRows, setSelectedRows] = useState<UGConstructionSurveyData[]>(
    [],
  );
  const [toggleCleared, setToggleCleared] = useState(false);
  const [selectedSurvey, setSelectedSurvey] =
    useState<UGConstructionSurveyData | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [surveyToUpdate, setSurveyToUpdate] =
    useState<UGConstructionSurveyData | null>(null);
  const navigate = useNavigate();
  const [kmlLoading, setKmlLoading] = useState(false);

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        setLoading(true);
        setError('');
        const params: any = {};
        if (Data.selectedState) params.state_id = Data.selectedState;
        if (Data.selectedDistrict) params.district_id = Data.selectedDistrict;
        if (Data.selectedBlock) params.block_id = Data.selectedBlock;
        if (Data.connectionStart) params.start = Data.connectionStart;
        if (Data.connectionEnd) params.end = Data.connectionEnd;
        if (Data.fromdate) params.from_date = Data.fromdate;
        if (Data.todate) params.to_date = Data.todate;
        if (Data.selectedStatus !== null) params.status = Data.selectedStatus;
        if(Data.worktype !== "") params.worktype = Data.worktype;
        if(Data.constType !== "") params.construction_type = Data.constType;
        if (Data.globalsearch.trim()) params.search = Data.globalsearch.trim();

        const response = await axios.get<{
          status: boolean;
          data: UGConstructionSurveyData[];
        }>(`${TraceBASEURL}/get-survey-data`, { params });

        if (response.data.status) {
          setData(response.data.data);
          OnData(response.data.data);
        } else {
          console.error('API returned status=false', response.data);
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching survey data', error);
        setError('Failed to fetch survey data');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (!Data.filtersReady) return;
    fetchSurveyData();
  }, [
    Data.selectedState,
    Data.selectedDistrict,
    Data.selectedBlock,
    Data.connectionStart,
    Data.connectionEnd,
    Data.fromdate,
    Data.todate,
    Data.filtersReady,
    Data.selectedStatus,
    Data.worktype,
    Data.constType,
    Data.globalsearch,
    Data.isAddModalOpen,
  ]);

const handleView = async (
  row: UGConstructionSurveyData | UGConstructionSurveyData[] | number[],
  check: boolean,
) => {
  const selectedRows = Array.isArray(row)
    ? filteredData.filter((d) => row.includes((d.id) as any))
    : [row];
    

  const hasAerial = selectedRows.some(
    (d) => d.construction_type === "Aerial"
  );

  if (
    hasAerial ||
    Data.constType === "Aerial" ||
    (check && filteredData.some((d) => d.construction_type === "Aerial"))
  ) {
    navigate('/pole-stringing-details-aerial', {
      state: {
        row,
        multipreview: check,
      },
    });
  } else {
    navigate('/construction-details', {
      state: {
        row,
        multipreview: check,
      },
    });
  }
};
  const handleUpdate = (id: number) => {
    const survey = data.find((item) => item.id === id) || null;
    setSurveyToUpdate(survey);
    setIsUpdateModalOpen(true);
  };

  const filteredData = useMemo(() => {
    if (!Data.globalsearch.trim()) return data;

    const lowerSearch = Data.globalsearch.toLowerCase();

    return data.filter((row: UGConstructionSurveyData) =>
      Object.values(row).some(
        (value) =>
          (typeof value === 'string' || typeof value === 'number') &&
          value.toString().toLowerCase().includes(lowerSearch),
      ),
    );
  }, [Data.globalsearch, data]);

  const handleRowSelected = (state: {
    allSelected: boolean;
    selectedCount: number;
    selectedRows: UGConstructionSurveyData[];
  }) => {
    setSelectedRows(state.selectedRows);
  };

  const handleClearRows = () => {
    setToggleCleared(!toggleCleared);
    setSelectedRows([]);
  };

  const getStatusBadge = () => {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200">
        Active
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
  const linkColumn: TableColumn<UGConstructionSurveyData> = {
    name: 'Link Name',
    selector: () => Data?.selectedConnection || '-',
    wrap: true,
    sortable: true,
  };

  const columns: TableColumn<UGConstructionSurveyData>[] = [
    {
      name: 'Survey ID',
      selector: (row) => row.id,
      sortable: true,
    },
    {
      name: 'State',
      selector: (row) => row.state_name,
      sortable: true,
      wrap: true,
      cell: (row) => <span title={row.state_name}>{row.state_name}</span>,
    },
    {
      name: 'District',
      selector: (row) => row.district_name,
      sortable: true,
      maxWidth: '150px',
      wrap: true,
      cell: (row) => <span title={row.district_name}>{row.district_name}</span>,
    },
    {
      name: 'Block',
      selector: (row) => row.block_name,
      sortable: true,
      maxWidth: '130px',
      wrap: true,
      cell: (row) => <span title={row.block_name}>{row.block_name}</span>,
    },
    {
      name: 'Construction Type',
      selector: (row) => row.construction_type || '-',
      sortable: true,
      minWidth: '150px',
      cell: (row) => (
        <span
          title={row.construction_type || '-'}
          className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap truncate"
        >
          {row.construction_type || '-'}
        </span>
      ),
    },
    {
      name: 'Work Type',
      selector: (row) => row.workType || '-',
      sortable: true,
      wrap: true,
      minWidth: '120px',
      cell: (row) => (
        <span title={row.workType || '-'}>{row.workType || '-'}</span>
      ),
    },
    {
      name: 'Cable Type',
      selector: (row) => row.cableType || '-',
      sortable: true,
      wrap: true,
      minWidth: '120px',
      cell: (row) => (
        <span title={row.cableType || '-'}>{row.cableType || '-'}</span>
      ),
    },
    {
      name: 'Start GP',
      selector: (row) => row.start_lgd_name,
      sortable: true,
      maxWidth: '160px',
      wrap: true,
      cell: (row) => (
        <span title={row.start_lgd_name}>{row.start_lgd_name}</span>
      ),
    },
    {
      name: 'End GP',
      selector: (row) => row.end_lgd_name,
      sortable: true,
      maxWidth: '160px',
      wrap: true,
      cell: (row) => <span title={row.end_lgd_name}>{row.end_lgd_name}</span>,
    },
    ...(Data?.selectedConnection ? [linkColumn] : []),
    {
      name: 'Distance (m)',
      selector: (row) => row.total_distance || '0.00',
      sortable: true,
    },
    {
      name: 'Surveyor',
      selector: (row) => row.user_name,
      sortable: true,
      minWidth: '160px',
      maxWidth: '200px',
      cell: (row) => (
        <div className="flex items-center min-w-0 w-full">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
            <User className="w-3 h-3 text-gray-600" />
          </div>
          <span className="truncate min-w-0" title={row.user_name}>
            {row.user_name}
          </span>
        </div>
      ),
    },
    {
      name: 'Phone',
      selector: (row) => row.user_mobile,
      sortable: true,
      minWidth: '130px',
      maxWidth: '140px',
      cell: (row) => (
        <span className="font-mono text-sm">{row.user_mobile}</span>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.is_active,
      sortable: true,
      cell: (row) => {
        const status = row.is_active as 0 | 1 | 2;
        const statusConfig = {
          0: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
          1: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
          2: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
        };
        const config = statusConfig[status] || {
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800',
        };

        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}
          >
            {config.label}
          </span>
        );
      },
    },

    {
      name: 'Created',
      selector: (row) => row.created_at,
      sortable: true,
      maxWidth: '140px',
      cell: (row) => moment(row.created_at).format('DD/MM/YYYY'),
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(row, false)}
            className="px-1 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 outline-none"
          >
            <View className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedSurvey(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleUpdate(row.id)}
            className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Update"
          >
            <PenIcon className="w-4 h-4" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      maxWidth: '120px',
    },
  ];

  useEffect(() => {
    if (Data.excel === true && filteredData.length > 0) {
      const exportExcel = async () => {
        setLoading(true);
        const workbook = XLSX.utils.book_new();

        const headers = [
          'Survey ID',
          'State Name',
          'District Name',
          'Block Name',
          'Start Location',
          'End Location',
          'Construction Type',
          'Work Type',
          'Cable Type',
          'Distance (m)',
          'Surveyor Name',
          'Surveyor Mobile',
          'Status',
          'Created At',
          'Updated At',
        ];

        const dataRows = filteredData.map((row) => [
          row.id,
          row.state_name,
          row.district_name,
          row.block_name,
          row.start_lgd_name,
          row.end_lgd_name,
          row.construction_type || '-',
          row.workType || '-',
          row.cableType || '-',
          row.total_distance || '0.00',
          row.user_name,
          row.user_mobile,
          row.is_active === 0
            ? 'Pending'
            : row.is_active === 1
              ? 'Accepted'
              : 'Rejected',
          row.created_at,
          row.updated_at,
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          'Underground Construction',
        );
        XLSX.writeFile(workbook, 'Underground_Construction.xlsx', {
          compression: true,
        });
        Onexcel();
        setLoading(false);
      };
      exportExcel();
    }
  }, [Data.excel]);

  useEffect(() => {
    if (Data.preview === true) {
      if (selectedRows.length === 0) {
        alert('Please select at least one row to preview the data.');
        return;
      }
      const rowIds = selectedRows.map((row) => row.id);
      handleView(rowIds, true);
      OnPreview();
    }
  }, [Data.preview]);

  useEffect(() => {
    if (!Data.kml) return;
    if (selectedRows.length === 0) {
      alert('Please select at least one row to kml the data.');
      OnKml();
      return;
    }
    handleGenerateKML();
  }, [Data.kml]);

 const handleGenerateKML = async () => {
  if (selectedRows.length === 0) {
    alert('No rows selected');
    return;
  }

  const selectedEventTypes = [
    'STARTSURVEY',
    'DEPTH',
    'ROADCROSSING',
    'FPOI',
    'JOINTCHAMBER',
    'MANHOLES',
    'ROUTEINDICATOR',
    'LANDMARK',
    'FIBERTURN',
    'KILOMETERSTONE',
    'STARTPIT',
    'ENDPIT',
    'ENDSURVEY',
    'HOLDSURVEY',
    'BLOWING',
    'ROUTEFEATURE',
    'DUCT',
  ];

  const ICON_MAP: Record<string, string> = {
    STARTSURVEY:    'http://maps.google.com/mapfiles/kml/paddle/grn-circle.png',
    ENDSURVEY:      'http://maps.google.com/mapfiles/kml/paddle/red-circle.png',
    DEPTH:          'http://maps.google.com/mapfiles/kml/paddle/blu-circle.png',
    ROADCROSSING:   'http://maps.google.com/mapfiles/kml/paddle/ylw-circle.png',
    FPOI:           'http://maps.google.com/mapfiles/kml/paddle/red-stars.png',
    JOINTCHAMBER:   'http://maps.google.com/mapfiles/kml/paddle/purple-circle.png',
    MANHOLES:       'http://maps.google.com/mapfiles/kml/paddle/ltblu-circle.png',
    STARTPIT:       'http://maps.google.com/mapfiles/kml/paddle/wht-circle.png',
    ENDPIT:         'http://maps.google.com/mapfiles/kml/paddle/wht-square.png',
    HOLDSURVEY:     'http://maps.google.com/mapfiles/kml/paddle/orange-circle.png',
  };
  const defaultIcon = 'http://maps.google.com/mapfiles/kml/paddle/blu-circle.png';

  let allPlacemarks = '';
  const allCoords: { lat: number; lng: number }[] = [];

  setKmlLoading(true);

  try {
    const surveyIds = selectedRows.map((row) => row.id).join(',');
    const resp = await axios.get(`${TraceBASEURL}/construction-forms`, {
      params: { survey_ids: surveyIds },
    });

    if (resp.status !== 200 && resp.status !== 201) {
      throw new Error('Failed to fetch survey data');
    }

    const activities = resp.data?.data.filter((data: any) => data.status == 0) || [];

    if (activities.length === 0) {
      alert('No survey data found for selected rows');
      setKmlLoading(false);
      OnKml();
      return;
    }

    const getLatLongForEvent = (row: any): string | null => {
      switch (row.eventType) {
        case 'FPOI':          return row.fpoiLatLong;
        case 'DEPTH':         return row.depthLatlong;
        case 'JOINTCHAMBER':  return row.jointChamberLatLong;
        case 'MANHOLES':      return row.manholeLatLong;
        case 'LANDMARK':      return row.landmarkLatLong;
        case 'KILOMETERSTONE':return row.kilometerstoneLatLong;
        case 'FIBERTURN':     return row.fiberTurnLatLong;
        case 'ROUTEINDICATOR':return row.routeIndicatorLatLong;
        case 'STARTPIT':      return row.startPitLatlong;
        case 'ENDPIT':        return row.endPitLatlong;
        case 'STARTSURVEY':   return row.startPointCoordinates;
        case 'ENDSURVEY':     return row.endPointCoordinates;
        case 'ROADCROSSING':  return row.crossingLatlong;
        case 'HOLDSURVEY':    return row.holdLatlong;
        case 'BLOWING':       return row.blowingLatLong;
        case 'ROUTEFEATURE':  return row.routeFeatureLatLong;
        default:              return null;
      }
    };

    // ── Group activities by survey_id for polyline drawing ─────────────────
    const surveyGroups: Record<string, { lat: number; lng: number }[]> = {};

    activities.forEach((activity: any) => {
      const eventType = activity.eventType;
      if (!selectedEventTypes.includes(eventType)) return;

      const latLongStr = getLatLongForEvent(activity);
      if (!latLongStr) return;

      const [latStr, lngStr] = latLongStr.split(',');
      const lat = parseFloat(latStr?.trim());
      const lng = parseFloat(lngStr?.trim());
      if (isNaN(lat) || isNaN(lng)) return;

      // Collect every valid coord for the LookAt bounding box
      allCoords.push({ lat, lng });

      const name = activity.survey_id || activity.id || 'Unknown';
      const icon = ICON_MAP[eventType] ?? defaultIcon;

      // All event types → Point placemark (fixed: no more broken single-coord LineString)
      allPlacemarks += `
      <Placemark>
        <name>${eventType}</name>
        <description><![CDATA[
          <b>Survey ID:</b> ${activity.survey_id || 'N/A'}<br/>
          <b>ID:</b> ${activity.id || 'N/A'}<br/>
          <b>Area Type:</b> ${activity.area_type || 'N/A'}<br/>
          <b>Depth:</b> ${activity.depthMeters || 'N/A'}<br/>
          <b>Coordinates:</b> ${lat}, ${lng}
        ]]></description>
        <Style>
          <IconStyle>
            <scale>1.1</scale>
            <Icon><href>${icon}</href></Icon>
          </IconStyle>
          <LabelStyle><scale>0</scale></LabelStyle>
        </Style>
        <Point>
          <coordinates>${lng},${lat},0</coordinates>
        </Point>
      </Placemark>`;

      // Collect points per survey for route polyline
      const sid = String(activity.survey_id || activity.id);
      if (!surveyGroups[sid]) surveyGroups[sid] = [];
      surveyGroups[sid].push({ lat, lng });
    });

    // ── Polyline per survey_id ──────────────────────────────────────────────
    Object.entries(surveyGroups).forEach(([sid, points]) => {
      if (points.length < 2) return;
      const coords = points.map(({ lat, lng }) => `${lng},${lat},0`).join('\n              ');
      allPlacemarks += `
      <Placemark>
        <name>Route ${sid}</name>
        <Style>
          <LineStyle>
            <color>ff0000ff</color>
            <width>3</width>
          </LineStyle>
          <PolyStyle><fill>0</fill></PolyStyle>
        </Style>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>${coords}</coordinates>
        </LineString>
      </Placemark>`;
    });

  } catch (err) {
    console.error('Error fetching survey data:', err);
    alert('Failed to generate KML');
    setKmlLoading(false);
    return;
  }

  setKmlLoading(false);

  if (!allPlacemarks || allCoords.length === 0) {
    alert('No valid coordinates found for KML generation');
    OnKml();
    return;
  }

  // ── Compute bounding box center + range for LookAt ─────────────────────────
  const lats = allCoords.map((c) => c.lat);
  const lngs = allCoords.map((c) => c.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Rough altitude: 1 degree ≈ 111 km; scale so all points fit in view
  const spanDeg = Math.max(maxLat - minLat, maxLng - minLng, 0.001);
  const altitudeMeters = Math.min(spanDeg * 111_000 * 2.5, 2_000_000);

  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${selectedRows[0]?.block_name || 'UGConst'} Ground Survey</name>
    <LookAt>
      <longitude>${centerLng}</longitude>
      <latitude>${centerLat}</latitude>
      <altitude>0</altitude>
      <heading>0</heading>
      <tilt>0</tilt>
      <range>${altitudeMeters}</range>
      <altitudeMode>relativeToGround</altitudeMode>
    </LookAt>
    ${allPlacemarks}
  </Document>
</kml>`;

  const blob = new Blob([kmlContent], {
    type: 'application/vnd.google-earth.kml+xml',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedRows[0]?.block_name || 'UGConst'}_GroundSurvey.kml`;
  a.click();
  URL.revokeObjectURL(url);
  OnKml();
};

  if (error) {
    return (
      <div
        className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
        role="alert"
      >
        <span className="font-medium">Error loading data:</span> {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {(loading || kmlLoading) && (
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No construction data found
            </h3>
            <p className="text-gray-500">
              {Data.globalsearch
                ? 'Try adjusting your search or filter criteria.'
                : 'There is no construction data available.'}
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
                  <svg
                    className="animate-spin h-8 w-8 text-blue-500"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              }
            />
          </div>
        )}

        {/* Survey Details Modal */}
        {selectedSurvey && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Underground Construction Details
                  </h3>
                  <button
                    onClick={() => setSelectedSurvey(null)}
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
                      State
                    </label>
                    <p className="text-gray-900 font-medium">
                      {selectedSurvey.state_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      District
                    </label>
                    <p className="text-gray-900">
                      {selectedSurvey.district_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Block
                    </label>
                    <p className="text-gray-900">{selectedSurvey.block_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    {getStatusBadge()}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Start Location
                    </label>
                    <p className="text-gray-900">
                      {selectedSurvey.start_lgd_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      End Location
                    </label>
                    <p className="text-gray-900">
                      {selectedSurvey.end_lgd_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Surveyor Name
                    </label>
                    <p className="text-gray-900">{selectedSurvey.user_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Surveyor Mobile
                    </label>
                    <p className="text-gray-900">
                      {selectedSurvey.user_mobile}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Created At
                    </label>
                    <p className="text-gray-900 text-sm">
                      {moment(selectedSurvey.created_at).format(
                        'DD/MM/YYYY, hh:mm A',
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Last Updated
                    </label>
                    <p className="text-gray-900 text-sm">
                      {moment(selectedSurvey.updated_at).format(
                        'DD/MM/YYYY, hh:mm A',
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedSurvey(null);
                    handleView(selectedSurvey, false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View Details
                </button>
                <button
                  onClick={() => setSelectedSurvey(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AddConstModal
        isOpen={Data.isAddModalOpen}
        onClose={() => OnModal()}
        onSuccess={() => {
          OnModal();
        }}
        baseUrl={TraceBASEURL}
      />
      <UpdateConstModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={() => {
          setIsUpdateModalOpen(false);
          if (Data.filtersReady) {
            const fetchSurveyData = async () => {
              try {
                setLoading(true);
                const params: any = {};
                if (Data.selectedState) params.state_id = Data.selectedState;
                if (Data.selectedDistrict)
                  params.district_id = Data.selectedDistrict;
                if (Data.selectedBlock) params.block_id = Data.selectedBlock;
                if (Data.connectionStart) params.start = Data.connectionStart;
                if (Data.connectionEnd) params.end = Data.connectionEnd;
                if (Data.fromdate) params.from_date = Data.fromdate;
                if (Data.todate) params.to_date = Data.todate;
                if (Data.selectedStatus !== null)
                  params.status = Data.selectedStatus;
                if(Data.worktype !== "") params.worktype = Data.worktype;
                if (Data.globalsearch.trim())
                  params.search = Data.globalsearch.trim();

                const response = await axios.get<{
                  status: boolean;
                  data: UGConstructionSurveyData[];
                }>(`${TraceBASEURL}/get-survey-data`, { params });

                if (response.data.status) {
                  setData(response.data.data);
                  OnData(response.data.data);
                }
              } catch (error) {
                console.error('Error fetching survey data', error);
              } finally {
                setLoading(false);
              }
            };
            fetchSurveyData();
          }
        }}
        surveyData={surveyToUpdate}
      />
    </div>
  );
};

export default Report;
