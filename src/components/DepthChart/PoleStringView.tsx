import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable, { TableColumn } from 'react-data-table-component';
import { Folder, SheetIcon, Image as ImageIcon, Video } from 'lucide-react';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import moment from 'moment';
import MediaCarousel from './MediaCarousel';
import PoleStringMapComp from './PoleStringMapComp';
import * as XLSX from 'xlsx';
import {
  PoleString,
  PoleSurveyData,
  PolePreview,
} from '../../types/aerial-survey';
import { ToastContainer, toast } from 'react-toastify';
import { hasViewOnlyAccess, isAdminUser } from '../../utils/accessControl';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const IMGbaseUrl = import.meta.env.VITE_Image_URL;
const BASEURL_Val = import.meta.env.VITE_API_BASE;

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  label: string;
}

// ─── Event type badge config ──────────────────────────────────────────────────

export const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  POLE: {
    label: 'Pole',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  'JOINT ENCLOUSER': {
    label: 'Joint Enclosure',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
  },

  LANDMARK: {
    label: 'Landmark',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
  },
};

const getEventBadge = (eventType: string) => {
  const cfg = EVENT_TYPE_CONFIG[eventType] ?? {
    label: eventType,
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-300',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      {cfg.label}
    </span>
  );
};

// ─── Row highlight by eventType ───────────────────────────────────────────────

const ROW_HIGHLIGHT: Record<string, string> = {
  POLE: '#EFF6FF', // blue-50
  'JOINT ENCLOUSER': '#FAF5FF', // purple-50
  LANDMARK: '#F0FDF4', // green-50
};

// ─── Component ────────────────────────────────────────────────────────────────

function PoleStringView() {
  const location = useLocation();
  const MainData = location.state?.row || '';
  const multipreview = location.state?.multipreview || false;
  const selectedState = location.state?.selectedState || '';
  const selectedDistrict = location.state?.selectedDistrict || '';
  const selectedBlock = location.state?.selectedBlock || '';

  const [poleData, setPoleData] = useState<PoleString[]>([]);
  const [polePreviewData, setPolePreviewData] = useState<PolePreview[]>([]);
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

  // ── Data fetch ──────────────────────────────────────────────────────────────

  const getData = async () => {
    try {
      setLoading(true);
      setError(null);

      const surveyId = multipreview ? MainData : MainData.id;
      const params: any = {};
      if (surveyId) {
        params.survey_ids = Array.isArray(surveyId)
          ? surveyId.join(',')
          : surveyId;
      }
      const resp = await axios.get(`${TraceBASEURL}/get-pole-stringing`, {
        params,
      });

      if (resp.status === 200 || resp.status === 201) {
        const raw = resp.data.data || [];
        setPoleData(Array.isArray(raw) ? raw : Object.values(raw).flat());
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
    if (!multipreview || !selectedState || !selectedDistrict || !selectedBlock)
      return;
    const fetchPolesdata = async () => {
      try {
        const params: any = {};
        if (selectedState) params.state_id = selectedState;
        if (selectedDistrict) params.district_id = selectedDistrict;
        if (selectedBlock) params.block_id = selectedBlock;

        const response = await axios.get<{
          status: boolean;
          data: PoleSurveyData[];
        }>(`${TraceBASEURL}/get-pole-survey`, { params });

        if (response.data.status) {
          const surveyList = response.data.data;
          const ids = surveyList.map((item) => item.id);
          if (ids.length > 0) {
            const previewResp = await axios.get(
              `${TraceBASEURL}/get-pole-preview`,
              {
                params: { survey_ids: ids.join(',') },
              },
            );
            if (previewResp.status === 200 || previewResp.status === 201) {
              setPolePreviewData(previewResp.data.data || []);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching pole preview:', error);
      }
    };
    fetchPolesdata();
  }, [multipreview, selectedState, selectedDistrict, selectedBlock]);

  // ── road_crossing helper ────────────────────────────────────────────────────

  const parseRoadCrossing = (row: PoleString) => {
    if (!row.road_crossing) return null;
    try {
      return JSON.parse(row.road_crossing) as {
        crossingLength: string;
        crossingPhotos: string[];
        crossingType: string;
        endcrossingLatlong: string;
        startcrossingLatlong: string;
      };
    } catch {
      return null;
    }
  };

  // ── Media helpers ───────────────────────────────────────────────────────────

  const extractMediaFromRow = (row: PoleString): MediaItem[] => {
    const items: MediaItem[] = [];

    if (row.images && row.images.length > 0) {
      row.images.forEach((url) => {
        if (url) {
          items.push({
            type: 'image',
            url: `${IMGbaseUrl}${url}`,
            label: 'Pole Image',
          });
        }
      });
    }

    if (row.video) {
      items.push({
        type: 'video',
        url: `${IMGbaseUrl}${row.video}`,
        label: 'Video',
      });
    }

    if (row.joint_enclosure?.jointImages?.length) {
      row.joint_enclosure.jointImages.forEach((url, i) => {
        if (url) {
          items.push({
            type: 'image',
            url: url.startsWith('http') ? url : `${IMGbaseUrl}${url}`,
            label: `Joint Image ${i + 1}`,
          });
        }
      });
    }
    if (row.landmark?.images?.length) {
      row.landmark.images.forEach((url, i) => {
        if (url) {
          items.push({
            type: 'image',
            url: url.startsWith('http') ? url : `${IMGbaseUrl}${url}`,
            label: `Landmark Image ${i + 1}`,
          });
        }
      });
    }

    const rc = parseRoadCrossing(row);
    if (rc?.crossingPhotos?.length) {
      rc.crossingPhotos.forEach((url, i) => {
        if (url) {
          items.push({
            type: 'image',
            url: url.startsWith('http') ? url : `${IMGbaseUrl}${url}`,
            label: `Crossing Photo ${i + 1}`,
          });
        }
      });
    }

    return items;
  };

  const openCarousel = (row: PoleString, initialIndex: number = 0) => {
    const media = extractMediaFromRow(row);
    if (!media || media.length === 0) return;
    const safeIndex = Math.min(Math.max(initialIndex, 0), media.length - 1);
    setCarouselMedia(media);
    setCarouselInitialIndex(safeIndex);
    setTimeout(() => setIsCarouselOpen(true), 0);
  };

  // ── Columns ─────────────────────────────────────────────────────────────────

  const columns: TableColumn<PoleString>[] = [
    {
      name: 'ID',
      selector: (row) => row.id,
      sortable: true,
      width: '70px',
    },
    {
      name: 'Survey ID',
      selector: (row) => row.survey_id ?? '-',
      sortable: true,
    },
    {
      name: 'Pit Id',
      cell: (row) => row.pit_id ?? '-',
      sortable: true,
    },
    {
      name: 'Event Type',
      cell: (row) => getEventBadge(row.eventType),
      sortable: true,
      width: '160px',
    },
   {
    name: 'Pole Type',
    cell: (row) => {
      return (
        <span
          className={
            row.pole_type === 'existing'
              ? 'text-blue-700'
              : 'text-red-700'
          }
        >
          {row.pole_type?.toUpperCase() || '-'}
        </span>
      );
    },
  },
    {
      name: 'Latitude',
      selector: (row) => row.latitude,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Longitude',
      selector: (row) => row.longitude,
      sortable: true,
      wrap: true,
    },
    {
      name: 'Distance (m)',
      selector: (row) => (row.distance ? row.distance.toFixed(2) + ' m' : '-'),
      sortable: true,
      wrap: true,
    },
    {
      name: 'Line Type',
      selector: (row) => row.line_type || '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Pole Material',
      selector: (row) => row.pole_material || '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Pole Owner',
      selector: (row) => row.pole_owner || '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Fitting Type',
      selector: (row) => row.fitting_type || row.fitting_type_new || '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Pole Height',
      selector: (row) => row.pole_height || '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Drum Number',
      selector: (row) => row.drum_number || '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Meter',
      selector: (row) => row.meter || '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Landmark Type',
      selector: (row) => row.landmark?.type || '-',
      sortable: true,
    },
    {
      name: 'Landmark Desc',
      selector: (row) => row.landmark?.description || '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Joint Type',
      selector: (row) => row.joint_enclosure?.jointType || '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Start Drum',
      selector: (row) =>
        row.joint_enclosure
          ? `${row.joint_enclosure.startDrumNumber} / ${row.joint_enclosure.startDrumMeter}m`
          : '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'End Drum',
      selector: (row) =>
        row.joint_enclosure
          ? `${row.joint_enclosure.endDrumNumber} / ${row.joint_enclosure.endDrumMeter}m`
          : '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Media',
      cell: (row) => {
        const mediaItems = extractMediaFromRow(row);
        if (mediaItems.length === 0)
          return <span className="text-gray-400 text-xs">-</span>;
        const imageCount = mediaItems.filter(
          (item) => item.type === 'image',
        ).length;
        const videoCount = mediaItems.filter(
          (item) => item.type === 'video',
        ).length;
        const hasImages = imageCount > 0;
        const hasVideos = videoCount > 0;
        return (
          <button
            onClick={() => openCarousel(row)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer hover:bg-gray-100"
            title="Click to view media"
          >
            {hasImages && (
              <div className="flex items-center gap-1">
                <ImageIcon size={16} className="text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">
                  {imageCount}
                </span>
              </div>
            )}
            {hasVideos && (
              <div className="flex items-center gap-1">
                <Video size={16} className="text-purple-600" />
                <span className="text-xs text-purple-600 font-medium">
                  {videoCount}
                </span>
              </div>
            )}
          </button>
        );
      },
      ignoreRowClick: true,
      button: true,
      width: '140px',
    },

    {
      name: 'Crossing Type',
      selector: (row) => parseRoadCrossing(row)?.crossingType ?? '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Crossing Length',
      selector: (row) => parseRoadCrossing(row)?.crossingLength ?? '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'Start Crossing',
      selector: (row) => parseRoadCrossing(row)?.startcrossingLatlong ?? '-',
      sortable: true,
      wrap: true,
    },
    {
      name: 'End Crossing',
      selector: (row) => parseRoadCrossing(row)?.endcrossingLatlong ?? '-',
      sortable: true,
      wrap: true,
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

  // ── Excel export ─────────────────────────────────────────────────────────────

  const handleExcel = () => {
    setLoading(true);
    const workbook = XLSX.utils.book_new();

    const headers = [
      'ID',
      'Survey ID',
      'Event Type',
      'Pit ID',
      'Pole Type',
      'Latitude',
      'Longitude',
      'Line Type',
      'Pole Material',
      'Pole Owner',
      'Pole Owner Desc',
      'Fitting Type',
      'Pole Height',
      'Drum Number',
      'Meter',
      'Landmark Type',
      'Landmark Desc',
      'Landmark Images',
      'Joint Type',
      'Start Drum No',
      'Start Drum Meter',
      'End Drum No',
      'End Drum Meter',
      'Joint Images',
      'Work Type',
      'Construction Type',
      'State',
      'District',
      'Block',
      'Start GP',
      'End GP',
      'User Name',
      'Mobile',
      'Image',
      'Created At',
      'Updated At',
    ];

    const makeHyperlink = (url: string | null, label: string) =>
      url
        ? `=HYPERLINK("${url.startsWith('http') ? url : IMGbaseUrl + url}", "${label}")`
        : '-';

    const dataRows = poleData.map((item) => [
      item.id,
      item.survey_id ?? '-',
      item.eventType,
      item.pit_id ?? '-',
      item.pole_type ?? '-',
      item.latitude,
      item.longitude,
      item.line_type ?? '-',
      item.pole_material ?? '-',
      item.pole_owner ?? '-',
      item.pole_owner_description ?? '-',
      item.fitting_type ?? item.fitting_type_new ?? '-',
      item.pole_height ?? '-',
      item.drum_number ?? '-',
      item.meter ?? '-',
      item.landmark?.type ?? '-',
      item.landmark?.description ?? '-',
      item.landmark?.images?.length
        ? item.landmark.images
            .map((u, i) => makeHyperlink(u, `Landmark_${i + 1}`))
            .join(', ')
        : '-',
      item.joint_enclosure?.jointType ?? '-',
      item.joint_enclosure?.startDrumNumber ?? '-',
      item.joint_enclosure?.startDrumMeter ?? '-',
      item.joint_enclosure?.endDrumNumber ?? '-',
      item.joint_enclosure?.endDrumMeter ?? '-',
      item.joint_enclosure?.jointImages?.length
        ? item.joint_enclosure.jointImages
            .map((u, i) => makeHyperlink(u, `Joint_${i + 1}`))
            .join(', ')
        : '-',
      item.workType ?? '-',
      item.construction_type ?? '-',
      item.state_name ?? '-',
      item.district_name ?? '-',
      item.block_name ?? '-',
      item.start_lgd_name ?? '-',
      item.end_lgd_name ?? '-',
      item.user_name ?? '-',
      item.user_mobile ?? '-',
      item.images && item.images.length > 0
        ? item.images
            .map((url, i) => makeHyperlink(url, `Image_${i + 1}`))
            .join(', ')
        : '-',
      item.created_at,
      item.updated_at,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pole Stringing');
    XLSX.writeFile(workbook, 'Pole_Stringing_Details.xlsx', {
      compression: true,
    });
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
      style: { whiteSpace: 'nowrap' as const },
    },
  };
  const handleAccept = async () => {
    try {
      const resp = await axios.post(
        `${BASEURL_Val}/underground-surveys/${MainData.id}/accept`,
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
      const response = await axios.post(
        `${BASEURL_Val}/underground-surveys/${MainData.id}/reject`,
      );
      if (response.data.status === 1) {
        toast.success('Record Rejected successfully.');
      }
    } catch (error) {
      console.error('Error rejecting record:', error);
      alert('Failed to reject record.');
    }
  };

  // Row highlight based on eventType
  const conditionalRowStyles = Object.entries(ROW_HIGHLIGHT).map(
    ([eventType, bg]) => ({
      when: (row: PoleString) => row.eventType === eventType,
      style: { backgroundColor: bg },
    }),
  );

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
                <h1 className="text-2xl font-bold text-gray-900">
                  Pole Stringing
                </h1>
                <p className="text-gray-600">Pole stringing details</p>
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

          {/* Toolbar — Excel only */}
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              onClick={handleExcel}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-green-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-green-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
            >
              <SheetIcon className="h-4 w-4 text-green-600" />
              Excel
            </button>
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
            striped={false}
            dense
            responsive
            customStyles={customStyles}
            conditionalRowStyles={conditionalRowStyles}
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
          <PoleStringMapComp data={poleData} previewData={polePreviewData} />
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

export default PoleStringView;
