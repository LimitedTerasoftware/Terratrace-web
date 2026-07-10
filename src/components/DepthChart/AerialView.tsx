import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable, { TableColumn } from 'react-data-table-component';
import {
  Folder,
  SheetIcon,
  Image as ImageIcon,
  Columns3,
} from 'lucide-react';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import moment from 'moment';
import MediaCarousel from './MediaCarousel';
import * as XLSX from 'xlsx';
import { PolePreview } from '../../types/aerial-survey';
import AerialMapComp from './AerialMapComp';
import { hasViewOnlyAccess, isAdminUser } from '../../utils/accessControl';
import { ToastContainer, toast } from 'react-toastify';

const BASEURL_Val = import.meta.env.VITE_TraceAPI_URL;
const baseUrl = import.meta.env.VITE_Image_URL;
const BASEURL = import.meta.env.VITE_API_BASE;

// ─── Types ────────────────────────────────────────────────────────────────────


interface MediaItem {
  type: 'image' | 'video';
  url: string;
  label: string;
}

// ─── Status badge config ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  MUFF_DONE: { label: 'Muff Done', color: 'bg-green-100 text-green-700 border-green-300' },
  PIT_DONE: { label: 'Pit Done', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  EARTHING_DONE: { label: 'Earthing Done', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  POLE_DONE: { label: 'Pole Done', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

// ─── Component ────────────────────────────────────────────────────────────────

function AerialView() {
  const location = useLocation();
  const MainData = location.state?.row || '';
  const multipreview = location.state?.multipreview || false;

  const [poleData, setPoleData] = useState<PolePreview[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'map'>('view');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Carousel state
  const [isCarouselOpen, setIsCarouselOpen] = useState<boolean>(false);
  const [carouselMedia, setCarouselMedia] = useState<MediaItem[]>([]);
  const [carouselInitialIndex, setCarouselInitialIndex] = useState<number>(0);
  const viewOnly = hasViewOnlyAccess();
  const AdminAcess = isAdminUser();
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // ── Data fetch ──────────────────────────────────────────────────────────────

  const getData = async () => {
    try {
      setLoading(true);
      setError(null);

      const surveyIds = multipreview ? MainData : MainData.id;
      const params: Record<string, string> = {};
      if (surveyIds) {
        params.survey_ids = Array.isArray(surveyIds)
          ? surveyIds.join(',')
          : String(surveyIds);
      }

      const resp = await axios.get(`${BASEURL_Val}/get-pole-preview`, { params });
      if (resp.status === 200 || resp.status === 201) {
        setPoleData(resp.data.data || []);
      } else {
        setError('Error occurred while fetching data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (!showColumnMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnMenuRef.current &&
        !columnMenuRef.current.contains(event.target as Node)
      ) {
        setShowColumnMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnMenu]);

  // ── Media helpers ───────────────────────────────────────────────────────────

  const extractMediaFromRow = (row: PolePreview): MediaItem[] => {
    const items: MediaItem[] = [];

    const addImages = (urls: string[], labelPrefix: string) => {
      urls.forEach((url, i) => {
        if (url) {
          items.push({
            type: 'image',
            url: `${baseUrl}${url}`,
            label: urls.length > 1 ? `${labelPrefix} ${i + 1}` : labelPrefix,
          });
        }
      });
    };

    addImages(row.pit_images || [], 'Pit Image');
    addImages(row.muff_images || [], 'Muff Image');
    addImages(row.earthing_images || [], 'Earthing Image');
    addImages(row.pole_images || [], 'Pole Image');

    return items;
  };

  const openCarousel = (row: PolePreview, initialIndex: number = 0) => {
    const media = extractMediaFromRow(row);
    if (!media || media.length === 0) return;
    const safeIndex = Math.min(Math.max(initialIndex, 0), media.length - 1);
    setCarouselMedia(media);
    setCarouselInitialIndex(safeIndex);
    setTimeout(() => setIsCarouselOpen(true), 0);
  };

  // ── Map markers ─────────────────────────────────────────────────────────────

  const markers = useMemo(() => {
    return poleData
      .map((row) => {
        const lat = parseFloat(row.latitude);
        const lng = parseFloat(row.longitude);
        if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          return {
            lat,
            lng,
            eventType: row.status,
            id: row.id,
            survey_id: row.survey_id ?? 0,
            index_id: row.id,
          };
        }
        return null;
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [poleData]);

  // ── Columns ─────────────────────────────────────────────────────────────────

  const allColumns: TableColumn<PolePreview>[] = [
    {
      name: 'ID',
      selector: (row) => row.id,
      sortable: true,
      width: '70px',
    },
    {
      name: 'Pit ID',
      selector: (row) => row.pit_id || '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Survey ID',
      selector: (row) => row.survey_id ?? '-',
      sortable: true,
    },
    {
      name: 'Latitude',
      selector: (row) => row.latitude || '-',
      sortable: true,
        wrap: true,
    },
    {
      name: 'Longitude',
      selector: (row) => row.longitude || '-',
      sortable: true,
        wrap: true,
    },
    {
      name:'Muff Type',
      selector:(row)=>row.muff_type || '-',
      sortable:true,
    },
   
    {
      name: 'Work Type',
      selector: (row) => row.workType ?? '-',
      sortable: true,
        wrap: true,
    },
    {
      name: 'Construction Type',
      selector: (row) => row.construction_type ?? '-',
      sortable: true,
      wrap: true,
    },
   
    {
      name: 'Status',
      cell: (row) => {
        const config = STATUS_CONFIG[row.status] ?? {
          label: row.status,
          color: 'bg-gray-100 text-gray-600 border-gray-300',
        };
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${config.color}`}
          >
            {config.label}
          </span>
        );
      },
      sortable: true,
    },
    {
      name: 'Media',
      cell: (row) => {
        const media = extractMediaFromRow(row);
        if (media.length === 0) return <span className="text-gray-400">-</span>;
        const imageCount = media.filter((m) => m.type === 'image').length;
        return (
          <button
            onClick={() => openCarousel(row)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer hover:bg-gray-100"
            title="Click to view images"
          >
            <ImageIcon size={16} className="text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">{imageCount}</span>
          </button>
        );
      },
      ignoreRowClick: true,
      button: true,
      width: '100px',
    },
    {
      name: 'Created At',
      selector: (row) => moment(row.created_at).format('DD/MM/YYYY, hh:mm A'),
      sortable: true,
      wrap: true,
    },
    {
      name: 'Updated At',
      selector: (row) => moment(row.updated_at).format('DD/MM/YYYY, hh:mm A'),
      sortable: true,
      wrap: true,
    },
  ];

  const toggleableColumns = allColumns.filter(
    (col) => typeof col.name === 'string',
  );

  const columns = allColumns.filter(
    (col) => typeof col.name !== 'string' || !hiddenColumns.has(col.name),
  );

  const toggleColumnVisibility = (name: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAccept = async () => {
    try {
      const resp = await axios.post(
        `${BASEURL}/underground-surveys/${MainData.id}/accept`,
      );
      if (resp.data.status === 1) {
        toast.success('Record Accepted successfully!');
      } else {
        toast.error('Failed to accept record');
      }
    } catch (error) {
      toast.error('Error accepting record');
    }
  };
  
   const handleReject = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
        const response = await axios.post(
          `${BASEURL}/underground-surveys/${MainData.id}/reject`,
          {
            admin_id: userData.id,
          },
        );
        if (response.data.status === 1) {
          toast.success('Record Rejected successfully.');
        }
      } catch (error) {
        console.error('Error rejecting record:', error);
        alert('Failed to reject record.');
      }
    };
  

  // ── Excel export ─────────────────────────────────────────────────────────────

  const handleExcel = () => {
    setLoading(true);
    const workbook = XLSX.utils.book_new();

    const headers = [
      'ID',
      'Pit ID',
      'Survey ID',
      'Latitude',
      'Longitude',
      'Muff Type',
      'Muff Latitude',
      'Muff Longitude',
      'Earthing Latitude',
      'Earthing Longitude',
      'Pole Latitude',
      'Pole Longitude',
      'Work Type',
      'Construction Type',
      'State',
      'District',
      'Block',
      'Start GP',
      'End GP',
      'User Name',
      'Mobile',
      'Status',
      'Pit Images',
      'Muff Images',
      'Earthing Images',
      'Pole Images',
      'Created At',
      'Updated At',
    ];

    const makeHyperlinks = (urls: string[], prefix: string) =>
      urls.length > 0
        ? urls
            .map(
              (url, i) =>
                `=HYPERLINK("${baseUrl}${url}", "${prefix}_${i + 1}")`,
            )
            .join(', ')
        : '-';

    const dataRows = poleData.map((item) => [
      item.id,
      item.pit_id,
      item.survey_id ?? '-',
      item.latitude,
      item.longitude,
      item.muff_type ?? '-',
      item.muff_latitude ?? '-',
      item.muff_longitude ?? '-',
      item.earthing_latitude ?? '-',
      item.earthing_longitude ?? '-',
      item.pole_latitude ?? '-',
      item.pole_longitude ?? '-',
      item.workType ?? '-',
      item.construction_type ?? '-',
      item.state_name ?? '-',
      item.district_name ?? '-',
      item.block_name ?? '-',
      item.start_lgd_name ?? '-',
      item.end_lgd_name ?? '-',
      item.user_name ?? '-',
      item.user_mobile ?? '-',
      item.status,
      makeHyperlinks(item.pit_images || [], 'Pit_Img'),
      makeHyperlinks(item.muff_images || [], 'Muff_Img'),
      makeHyperlinks(item.earthing_images || [], 'Earthing_Img'),
      makeHyperlinks(item.pole_images || [], 'Pole_Img'),
      item.created_at,
      item.updated_at,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aerial View');
    XLSX.writeFile(workbook, 'Aerial_View_Details.xlsx', { compression: true });
    setLoading(false);
  };

  // ── Custom table styles ──────────────────────────────────────────────────────

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#dee2e6',
        color: '#616161',
        fontWeight: 600,
        fontSize: '14px',
        padding: '10px',
      },
    },
    headCells: {
      style: {
        whiteSpace: 'nowrap' as const,
      },
    },
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        </div>
      )}

      <ToastContainer />

      {/* ── Header ── */}
      <div className="mb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Folder className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Aerial View</h1>
                <p className="text-gray-600">Pole preview details</p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
              onClick={() => window.history.back()}
            >
              <FaArrowLeft className="h-5 w-5" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs + toolbar ── */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-wrap justify-between items-center">
          {/* Tabs */}
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg outline-none ${
                  activeTab === 'view'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('view')}
              >
                Details View
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block p-4 rounded-t-lg outline-none ${
                  activeTab === 'map'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('map')}
              >
                Map View
              </button>
            </li>
          </ul>

          {/* Toolbar — Excel + Columns */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={handleExcel}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
            >
              <SheetIcon className="h-4 w-4 text-green-600" />
              Excel
            </button>
            <div className="relative" ref={columnMenuRef}>
              <button
                onClick={() => setShowColumnMenu((prev) => !prev)}
                className="flex-none h-10 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
              >
                <Columns3 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                Columns
              </button>
              {showColumnMenu && (
                <div className="absolute right-0 z-20 mt-2 w-64 max-h-80 overflow-y-auto rounded-md border border-gray-300 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-600">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-600">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Toggle Columns
                    </span>
                    <button
                      onClick={() => setHiddenColumns(new Set())}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      Show All
                    </button>
                  </div>
                  {toggleableColumns.map((col) => (
                    <label
                      key={col.name as string}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.has(col.name as string)}
                        onChange={() =>
                          toggleColumnVisibility(col.name as string)
                        }
                      />
                      {col.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* ── Details tab ── */}
      {activeTab === 'view' && (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={poleData}
            progressPending={loading}
            pagination
            highlightOnHover
            pointerOnHover
            striped
            dense
            responsive
            customStyles={customStyles}
          />
        </div>
      )}
      {!viewOnly && activeTab === 'view' && (
        <div className="mt-6 flex gap-4 justify-center">
          <button
            className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
            onClick={() => {
              handleAccept();
            }}
          >
            Accept
          </button>
          <button
            className="bg-yellow-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            onClick={() => {
              handleReject();
            }}
          >
            Reject
          </button>
        </div>
      )}
      {/* ── Map tab ── */}
      {activeTab === 'map' && (
        <div className="h-[600px] p-4">
            <AerialMapComp data={poleData} />
        </div>
        )}

      {/* ── Zoom image modal ── */}
      {zoomImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50"
          onClick={() => setZoomImage(null)}
        >
          <img
            src={zoomImage}
            alt="Zoomed"
            className="max-w-full max-h-full p-4 rounded-lg"
          />
        </div>
      )}

      {/* ── Media carousel ── */}
      <MediaCarousel
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
        mediaItems={carouselMedia}
        initialIndex={carouselInitialIndex}
      />
    </div>
  );
}

export default AerialView;