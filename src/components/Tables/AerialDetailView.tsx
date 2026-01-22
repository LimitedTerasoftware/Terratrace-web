import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { hasViewOnlyAccess } from "../../utils/accessControl";
import DataTable from "react-data-table-component";
import { Edit2, Image as ImageIcon } from "lucide-react";
import MediaCarousel from "./MediaCarousel";
import { EditType } from "../../types/aerial-survey";
import { EditModal } from "../AerialSurveyMap/EditModal";

interface AerialSurvey {
  id: number;
  startGpName: string;
  startGpCoordinates: string;
  startGpPhotos: string;
  endGpName: string;
  endGpCoordinates: string;
  endGpPhotos: string;
  aerial_road_crossings: AerialRoadCrossing[];
  aerial_poles: AerialPole[];
  block_id:number;
  gp_id:number;
  end_gp_id:number
}

interface AerialRoadCrossing {
  id: number;
  typeOfCrossing: string;
  slattitude: string;
  slongitude: string;
  elattitude: string;
  elongitude: string;
  startPhoto: string;
  endPhoto: string;
  length: string;
}

interface AerialPole {
  id: number;
  electricityLineType: string;
  lattitude: string;
  longitude: string;
  poleAvailabilityAt: string;
  poleCondition: string;
  poleHeight: string;
  polePhoto: string;
  polePosition: string;
  poleType: number;
  typeOfPole: string;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
  label: string;
}
const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
};


const BASEURL = import.meta.env.VITE_API_BASE;
const baseUrl_public = import.meta.env.VITE_Image_URL;
const TricadBASEURL = import.meta.env.VITE_TraceAPI_URL;

const AerialDetailView: React.FC = () => {
  const [data, setData] = useState<AerialSurvey | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editType, setEditType] = useState<EditType>('aerial');

  // Media Carousel States
  const [isCarouselOpen, setIsCarouselOpen] = useState<boolean>(false);
  const [carouselMedia, setCarouselMedia] = useState<MediaItem[]>([]);
  const [carouselInitialIndex, setCarouselInitialIndex] = useState<number>(0);

  const { id } = useParams();
  const navigate = useNavigate();

  const parsePhotosArray = (photos: string): string[] => {
    if (!photos) return [];

    if (Array.isArray(photos)) {
      return photos;
    }

    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: string) => p && p.trim() !== '');
        }
        return [parsed];
      } catch (e) {
        console.error('Error parsing photos array:', e, 'Input:', photos);
        return [];
      }
    }

    return [];
  };

  const extractMediaFromSurvey = (): MediaItem[] => {
    const mediaItems: MediaItem[] = [];

    if (data?.startGpPhotos) {
      const photos = parsePhotosArray(data.startGpPhotos);
      photos.forEach((photo, index) => {
        mediaItems.push({
          type: 'image',
          url: `${baseUrl_public}${photo}`,
          label: `Start GP Photo ${index + 1}`
        });
      });
    }

    if (data?.endGpPhotos) {
      const photos = parsePhotosArray(data.endGpPhotos);
      photos.forEach((photo, index) => {
        mediaItems.push({
          type: 'image',
          url: `${baseUrl_public}${photo}`,
          label: `End GP Photo ${index + 1}`
        });
      });
    }

    return mediaItems;
  };

  const extractMediaFromCrossing = (crossing: AerialRoadCrossing): MediaItem[] => {
    const mediaItems: MediaItem[] = [];

    if (crossing.startPhoto && crossing.startPhoto.trim() !== '') {
      mediaItems.push({
        type: 'image',
        url: `${baseUrl_public}${crossing.startPhoto}`,
        label: 'Crossing Start Photo'
      });
    }

    if (crossing.endPhoto && crossing.endPhoto.trim() !== '') {
      mediaItems.push({
        type: 'image',
        url: `${baseUrl_public}${crossing.endPhoto}`,
        label: 'Crossing End Photo'
      });
    }

    return mediaItems;
  };

  const extractMediaFromPole = (pole: AerialPole): MediaItem[] => {
    const mediaItems: MediaItem[] = [];

    if (pole.polePhoto && pole.polePhoto.trim() !== '') {
      mediaItems.push({
        type: 'image',
        url: `${baseUrl_public}${pole.polePhoto}`,
        label: 'Pole Photo'
      });
    }

    return mediaItems;
  };

  const openCarousel = (media: MediaItem[], initialIndex: number = 0) => {
    if (media.length === 0) {
      toast.warning('No images available to display');
      return;
    }
    setCarouselMedia(media);
    setCarouselInitialIndex(initialIndex);
    setIsCarouselOpen(true);
  };

  const handleAccept = async () => {
    try {
      const response = await axios.post(`${BASEURL}/aerial-surveys/${id}/accept`);
      if (response.data.status === 1) {
        toast.success("Record Accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting record:", error);
      toast.error("Error accepting record");
    }
  };
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${TricadBASEURL}/aerial-survey/${id}`);
      toast.success("Record deleted successfully.");
      window.history.back();
    } catch (error) {
      toast.error("Failed to delete record.");
    }
  };

  const handleReject = async () => {
    try {
      const response = await axios.post(`${BASEURL}/aerial-surveys/${id}/reject`);
      if (response.data.status === 1) {
        toast.success("Record Rejected successfully.");
      }
    } catch (error) {
      console.error("Error rejecting record:", error);
      toast.error("Failed to reject record.");
    }
  };

  useEffect(() => {
    axios
      .get(`${BASEURL}/aerial-surveys/${id}`)
      .then((response) => {
        setData(response.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, [id]);

  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#64B5F6',
        color: '#616161',
        fontWeight: 600,
        fontSize: '14px',
        padding: '10px',
      },
    },
    headCells: {
      style: {
        whiteSpace: 'nowrap',
      },
    },
    cells: {
      style: {
        width: "150px",
      },
    },
  };

  const surveyColumns = useMemo(() => [
    {
  name: "Action",
  cell: () => (
    <button
      onClick={() => handleEdit(data,'aerial')}
      className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
    >
      Edit
    </button>
  ),
  ignoreRowClick: true,
  button: true,
  width: "120px",
},

    {
      name: "Start GP Name",
      selector: () => data?.startGpName || "-",
      sortable: true,
    },
    {
      name: "Start Coordinates",
      selector: () => data?.startGpCoordinates || "-",
    },
    {
      name: "Start GP Photos",
      cell: () => {
        if (!data?.startGpPhotos) {
          return <span className="text-gray-400">-</span>;
        }

        const photos = parsePhotosArray(data.startGpPhotos);
        if (photos.length === 0) {
          return <span className="text-gray-400">-</span>;
        }

        const mediaItems: MediaItem[] = photos.map((photo, index) => ({
          type: 'image',
          url: `${baseUrl_public}${photo}`,
          label: `Start GP Photo ${index + 1}`
        }));

        return (
          <button
            onClick={() => openCarousel(mediaItems)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Click to view Start GP photos"
          >
            <div className="flex items-center gap-1">
              <ImageIcon size={16} className="text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">
                {photos.length}
              </span>
            </div>
          </button>
        );
      },
      ignoreRowClick: true,
      button: true,
      width: '140px',
    },
    {
      name: "End GP Name",
      selector: () => data?.endGpName || "-",
      sortable: true,
    },
    {
      name: "End Coordinates",
      selector: () => data?.endGpCoordinates || "-",
    },
    {
      name: "End GP Photos",
      cell: () => {
        if (!data?.endGpPhotos) {
          return <span className="text-gray-400">-</span>;
        }

        const photos = parsePhotosArray(data.endGpPhotos);
        if (photos.length === 0) {
          return <span className="text-gray-400">-</span>;
        }

        const mediaItems: MediaItem[] = photos.map((photo, index) => ({
          type: 'image',
          url: `${baseUrl_public}${photo}`,
          label: `End GP Photo ${index + 1}`
        }));

        return (
          <button
            onClick={() => openCarousel(mediaItems)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Click to view End GP photos"
          >
            <div className="flex items-center gap-1">
              <ImageIcon size={16} className="text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                {photos.length}
              </span>
            </div>
          </button>
        );
      },
      ignoreRowClick: true,
      button: true,
      width: '140px',
    },
  ], [data]);

  const crossingColumns = useMemo(() => [
    {
      name: "Action",
      cell: (row: AerialRoadCrossing) => (
        <button
          onClick={() => handleEdit(row,'roadcrossing')}
          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Edit
        </button>
      ),
      ignoreRowClick: true,
      button: true,
      width: "120px",
    },

    {name:"ID",
      selector:(row:AerialRoadCrossing) => row.id,
      sortable:true,
    },
    {
      name: "Crossing Type",
      selector: (row: AerialRoadCrossing) => row.typeOfCrossing || "-",
      sortable: true,
    },
    {
      name: "Length",
      selector: (row: AerialRoadCrossing) => row.length || "-",
    },
    {
      name: "Start Coordinates",
      selector: (row: AerialRoadCrossing) => `${row.slattitude}, ${row.slongitude}`,
    },
    {
      name: "Start Photo",
      cell: (row: AerialRoadCrossing) => {
        if (!row.startPhoto || row.startPhoto.trim() === '') {
          return <span className="text-gray-400">-</span>;
        }

        const mediaItems: MediaItem[] = [{
          type: 'image',
          url: `${baseUrl_public}${row.startPhoto}`,
          label: 'Crossing Start Photo'
        }];

        return (
          <button
            onClick={() => openCarousel(mediaItems)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Click to view Start photo"
          >
            <div className="flex items-center gap-1">
              <ImageIcon size={16} className="text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">
                1
              </span>
            </div>
          </button>
        );
      },
      ignoreRowClick: true,
      button: true,
      width: '140px',
    },
    {
      name: "End Coordinates",
      selector: (row: AerialRoadCrossing) => `${row.elattitude}, ${row.elongitude}`,
    },
    {
      name: "End Photo",
      cell: (row: AerialRoadCrossing) => {
        if (!row.endPhoto || row.endPhoto.trim() === '') {
          return <span className="text-gray-400">-</span>;
        }

        const mediaItems: MediaItem[] = [{
          type: 'image',
          url: `${baseUrl_public}${row.endPhoto}`,
          label: 'Crossing End Photo'
        }];

        return (
          <button
            onClick={() => openCarousel(mediaItems)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Click to view End photo"
          >
            <div className="flex items-center gap-1">
              <ImageIcon size={16} className="text-green-600" />
              <span className="text-xs text-green-600 font-medium">
                1
              </span>
            </div>
          </button>
        );
      },
      ignoreRowClick: true,
      button: true,
      width: '140px',
    },
  ], []);


const aerialPolesWithDistance = useMemo(() => {
  const poles = data?.aerial_poles || [];

  return poles.map((pole, index) => {
    if (index === 0) {
      return { ...pole, distanceFromPrev: null };
    }

    const prev = poles[index - 1];

    const distance = getDistanceInMeters(
      Number(prev.lattitude),
      Number(prev.longitude),
      Number(pole.lattitude),
      Number(pole.longitude)
    );

    return {
      ...pole,
      distanceFromPrev: distance,
    };
  });
}, [data?.aerial_poles]);


  const poleColumns = useMemo(() => [
    {
      name: "Action",
      cell: (row: AerialPole) => (
        <button
          onClick={() => handleEdit(row,'pole')}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
         Edit
        </button>
      ),
      ignoreRowClick: true,
      button: true,
      width: "120px",
    },

    {name:"ID",
      selector:(row:AerialPole) => row.id,
      sortable:true,
    },
    {
      name: "Pole Type",
      selector: (row: AerialPole) => row.poleType === 1 ? "Existing" : "New",
      sortable: true,
    },
    {
      name: "Type Of Pole",
      selector: (row: AerialPole) => row.typeOfPole || "-",
    },
    {
      name: "Pole Condition",
      selector: (row: AerialPole) => row.poleCondition || "-",
    },
    {
      name: "Pole Height",
      selector: (row: AerialPole) => row.poleHeight || "-",
    },
    {
      name: "Pole Position",
      selector: (row: AerialPole) => row.polePosition || "-",
    },
   {
    name: "Distance From Previous Pole",
    selector: (row: any) => {
      if (row.distanceFromPrev == null) return "-";

      // meters -> km format
      if (row.distanceFromPrev >= 1000) {
        return `${(row.distanceFromPrev / 1000).toFixed(2)} km`;
      }

      return `${row.distanceFromPrev.toFixed(2)} m`;
    },
    sortable: true,
  },
    {
      name: "Pole Availability",
      selector: (row: AerialPole) => row.poleAvailabilityAt || "-",
    },
    {
      name: "Coordinates",
      selector: (row: AerialPole) => `${row.lattitude}, ${row.longitude}`,
    },
    {
      name: "Pole Photo",
      cell: (row: AerialPole) => {
        if (!row.polePhoto || row.polePhoto.trim() === '') {
          return <span className="text-gray-400">-</span>;
        }

        const mediaItems: MediaItem[] = [{
          type: 'image',
          url: `${baseUrl_public}${row.polePhoto}`,
          label: 'Pole Photo'
        }];

        return (
          <button
            onClick={() => openCarousel(mediaItems)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Click to view Pole photo"
          >
            <div className="flex items-center gap-1">
              <ImageIcon size={16} className="text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">
                1
              </span>
            </div>
          </button>
        );
      },
      ignoreRowClick: true,
      button: true,
      width: '140px',
    },
  ], []);


   const handleEdit = (rowData: any, type: EditType) => {
    setEditData(rowData);
    setEditType(type);
    setIsEditModalOpen(true);
  };
  const handleEditSuccess = () => {
   setIsEditModalOpen(false);
  };
 
  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
  const viewOnly = hasViewOnlyAccess();

  return (
    <>
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

      <div className="container mx-auto p-6">
        <ToastContainer />
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
          >
            <FaArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="h-6 border-l border-gray-300"></div>

          <h1 className="text-2xl font-bold text-gray-800">
            Aerial Survey Detail View
          </h1>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Survey Details</h2>
          <div className="overflow-x-auto">
            <DataTable
              columns={surveyColumns}
              data={data ? [data] : []}
              highlightOnHover
              striped
              dense
              responsive
              customStyles={customStyles}
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Aerial Road Crossings</h2>
          <div className="overflow-x-auto">
            <DataTable
              columns={crossingColumns}
              data={data?.aerial_road_crossings || []}
              pagination
              highlightOnHover
              striped
              dense
              responsive
              customStyles={customStyles}
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Aerial Poles</h2>
          <div className="overflow-x-auto">
            <DataTable
              columns={poleColumns}
             data={aerialPolesWithDistance}
              pagination
              highlightOnHover
              striped
              dense
              responsive
              customStyles={customStyles}
            />
          </div>
        </div>

        {!viewOnly && (
          <div className="mt-6 flex gap-4 justify-center">
            {/* <button
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              onClick={() => {
                toast.success("Coming Soon this page!");
              }}
            >
              Edit
            </button> */}

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
            <button
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
              onClick={() => {
                handleDelete();
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <MediaCarousel
        isOpen={isCarouselOpen}
        onClose={() => setIsCarouselOpen(false)}
        mediaItems={carouselMedia}
        initialIndex={carouselInitialIndex}
      />
       {isEditModalOpen && editData && (
              <EditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                data={editData}
                type={editType}
                onSuccess={handleEditSuccess}
              />
            )}
    </>
  );
};

export default AerialDetailView;