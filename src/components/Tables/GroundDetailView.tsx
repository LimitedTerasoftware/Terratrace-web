import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MapComponent from "./MapComponent";
import * as XLSX from "xlsx";
import ResponsivePagination from "./ResponsivePagination";
import App from "../VideoPlayback/index";
import DataTable from "react-data-table-component";
import { hasViewOnlyAccess } from "../../utils/accessControl";
import ImageModal from "../DepthChart/ImageUploadModal";
import UnderGroundSurveyImageModal from "./UnderGroundSurveyImageModal";


interface PatrollerDetails {
  companyName: string;
  email: string;
  mobile: string;
  name: string;
}

interface RoadCrossing {
  endPhoto: string;
  endPhotoLat: number;
  endPhotoLong: number;
  length: string;
  roadCrossing: string;
  startPhoto: string;
  startPhotoLat: number;
  startPhotoLong: number;
}

interface RouteDetails {
  centerToMargin: string;
  roadWidth: string;
  routeBelongsTo: string;
  routeType: string;
  soilType: string;
}

interface RouteFeasibility {
  alternatePathAvailable: boolean;
  alternativePathDetails: string;
  routeFeasible: boolean;
}

interface UtilityFeaturesChecked {
  localInfo: string;
  selectedGroundFeatures: string[];
}

interface VideoDetails {
  startLatitude: number;
  startLongitude: number;
  startTimeStamp: number;
  endLatitude: number;
  endLongitude: number;
  endTimeStamp: number;
  videoUrl: string;
}
interface UnderGroundSurveyData {
  id: number;
  survey_id: string;
  area_type: string;
  event_type: string;
  fpoiUrl: string;
  routeIndicatorUrl: string;
  jointChamberUrl: string;
  execution_modality: string;
  latitude: string;
  longitude: string;
  patroller_details: PatrollerDetails;
  road_crossing: RoadCrossing;
  route_details: RouteDetails;
  route_feasibility: RouteFeasibility;
  side_type: string;
  start_photos: string[];
  end_photos: string[];
  utility_features_checked: UtilityFeaturesChecked;
  videoUrl: string;
  videoDetails?: VideoDetails;
  created_at: string;
  createdTime: string;
  surveyUploaded: string;
  altitude: string;
  accuracy: string;
  depth: string;
  distance_error: string;
  kmtStoneUrl: string;
  landMarkUrls: string;
  fiberTurnUrl: string;
  landMarkType: string;
  landMarkDescription:string;
  routeIndicatorType:string;

}
interface StartGp {
  name: string,
  blk_name: string,
  dt_name: string,
  st_name: string,
}
interface EndGp {
  name: string,
}
interface GroundSurvey {
  id: number;
  startLocation: string;
  endLocation: string;
  block_id: string;
  district_id: string;
  state_id: string;
  under_ground_survey_data: UnderGroundSurveyData[];
  start_gp: StartGp,
  end_gp: EndGp,
  routeType:string
}
interface Props {
  paginatedData: GroundSurvey[];
  baseUrl: string;
  setZoomImage: (url: string) => void;
  setSelectedVideoUrl: (url: string) => void;
}
const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = import.meta.env.VITE_Image_URL;

const GroundDetailView: React.FC = () => {
  const [data, setData] = useState<GroundSurvey | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'map' | 'video'>('details');
  const [searchTerm, setSearchTerm] = useState("");
  const [SelectedItem, setSelectedItem] = useState<any | null>(null);
  const [videoSizes, setVideoSizes] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedActivity, setSelectedActivity] = useState<UnderGroundSurveyData | null>(null);
  
  const { id } = useParams();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const totalItems = data?.under_ground_survey_data.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = data?.under_ground_survey_data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchVideoSize = async (url: string) => {
    try {
      const response = await axios.head(`${baseUrl}${url}`);
      const size = response.headers['content-length'];
      if (size) {
        setVideoSizes((prev) => ({ ...prev, [url]: parseInt(size, 10) }));
      }
    } catch (error) {
      console.error(`Failed to fetch video size for ${url}:`, error);
    }
  };

  const filteredData = [
    ...new Map(
      data?.under_ground_survey_data
        ?.filter(survey =>
          survey.event_type !== 'LIVELOCATION' &&
          survey?.surveyUploaded === "true" &&
          Object.values(survey).some(val =>
            typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
        .map(survey => [`${survey.latitude}-${survey.longitude}-${survey.event_type}`, survey])
    ).values()
  ];

  useEffect(() => {
    if (data) {
      data.under_ground_survey_data.forEach((row) => {
        if (row.event_type === "VIDEORECORD") {
          const mainUrl = row.videoUrl?.trim().replace(/^"|"$/g, "");
          const fallbackUrl = row.videoDetails?.videoUrl?.trim().replace(/^"|"$/g, "");
          const videoUrl = mainUrl || fallbackUrl;

          if (videoUrl && !videoSizes[videoUrl]) {
            fetchVideoSize(videoUrl);
          }
        }
      });
    }
  }, [data]);
  
  const openModal = (activity: UnderGroundSurveyData) => {
          setSelectedActivity(activity);
          setIsModalOpen(true);
      };
  
  const closeModal = () => {
          setIsModalOpen(false);
          setSelectedActivity(null);
      };
  const columns = [
    {
      name:"Actions",
      cell:(row:UnderGroundSurveyData)=>(
        <button onClick={()=>openModal(row)}
        className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 outline-none dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800 transition-colors">
          Edit Image
        </button>

      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,

    },
    {
      name: "Event Type",
      selector: (row: UnderGroundSurveyData) => row.event_type,
      sortable: true,
    },
    {
      name: "Latitude",
      selector: (row: UnderGroundSurveyData) => row.latitude,
    },
    {
      name: "Longitude",
      selector: (row: UnderGroundSurveyData) => row.longitude,
    },
    {
      name: "Side Type",
      selector: (row: UnderGroundSurveyData) => row.side_type || "-",
    },
    {
      name: "Execution Modality",
      selector: (row: UnderGroundSurveyData) => row.execution_modality || "-",
    },
    {
      name: "Landmark Type",
      selector: (row: UnderGroundSurveyData) => row.landMarkType || "-",
    },
    {
      name: "Landmark Description",
      selector: (row: UnderGroundSurveyData) => row.landMarkDescription || "-",
    },
    {
      name: "RouteIndicator Type",
      selector: (row: UnderGroundSurveyData) => row.routeIndicatorType || "-",
    },
    {
      name: "Image",
      cell: (row: UnderGroundSurveyData) => (
        <div className="text-blue-600">
          {row.event_type === "FPOI" && row.fpoiUrl && (
            <span className="underline cursor-pointer" onClick={() => setZoomImage(`${baseUrl}${row.fpoiUrl}`)}>
              fpoiUrl<br />
            </span>
          )}
          {row.event_type === "SURVEYSTART" &&
            row.start_photos?.map((p, i) => (
              <span key={i} className="underline cursor-pointer" onClick={() => setZoomImage(`${baseUrl}${p}`)}>
                start_photo_{i + 1}<br />
              </span>
            ))}
          {row.event_type === "ENDSURVEY" &&
            row.end_photos?.map((p, i) => (
              <span key={i} className="underline cursor-pointer" onClick={() => setZoomImage(`${baseUrl}${p}`)}>
                end_photo_{i + 1}<br />
              </span>
            ))}
          {row.event_type === "ROUTEINDICATOR" && row.routeIndicatorUrl && (() => {
            let urls = [];

            try {
              const parsed = JSON.parse(row.routeIndicatorUrl);
              if (Array.isArray(parsed)) {
                urls = parsed;
              } else if (typeof parsed === "string") {
                urls = [parsed];
              } else {
                urls = [];
              }
            } catch (e) {
              urls = [row.routeIndicatorUrl];
            }

            return urls.map((url, index) => (
              <span
                key={index}
                className="underline cursor-pointer block"
                onClick={() => setZoomImage(`${baseUrl}${url}`)}
              >
                RouteIndicatorUrl {urls.length > 1 ? index + 1 : ""}
                <br />
              </span>
            ));
          })()}
          {row.event_type === "JOINTCHAMBER" && row.jointChamberUrl && (
            <span className="underline cursor-pointer" onClick={() => setZoomImage(`${baseUrl}${row.jointChamberUrl}`)}>
              JointChamberUrl<br />
            </span>
          )}
          {row.event_type === "ROADCROSSING" && row.road_crossing?.startPhoto && (
            <span className="underline cursor-pointer" onClick={() => setZoomImage(`${baseUrl}${row.road_crossing?.startPhoto}`)}>
              startPhoto_URL<br />
            </span>
          )}
          {row.event_type === "ROADCROSSING" && row.road_crossing?.endPhoto && (
            <span className="underline cursor-pointer" onClick={() => setZoomImage(`${baseUrl}${row.road_crossing?.endPhoto}`)}>
              endPhoto_URL<br />
            </span>
          )}
          {row.event_type === "KILOMETERSTONE" && row.kmtStoneUrl && (
            <span className="underline cursor-pointer" onClick={() => setZoomImage(`${baseUrl}${row.kmtStoneUrl}`)}>
              KmStone_URL<br />
            </span>
          )}
          {row.event_type === "LANDMARK" &&
            row.landMarkUrls &&
            row.landMarkType !== "NONE" && (
              JSON.parse(row.landMarkUrls)
                .filter((url: string) => url)
                .map((url: string, index: number) => (
                  <span
                    key={index}
                    className="underline cursor-pointer block"
                    onClick={() => setZoomImage(`${baseUrl}${url}`)}
                  >
                    Landmark_URL {index + 1}
                  </span>
                ))
            )}

          {row.event_type === "FIBERTURN" && row.fiberTurnUrl && (
            <span className="underline cursor-pointer" onClick={() => setZoomImage(`${baseUrl}${row.fiberTurnUrl}`)}>
              Fiberturn_URL<br />
            </span>
          )}


          {!row.fpoiUrl &&
            (!row.start_photos || row.start_photos.length === 0) &&
            (!row.end_photos || row.end_photos.length === 0) &&
            !row.routeIndicatorUrl &&
            !row.jointChamberUrl &&
            !row.kmtStoneUrl &&
            !row.landMarkUrls &&
            !row.fiberTurnUrl &&
            (!row.road_crossing?.startPhoto || row.road_crossing.startPhoto === "") &&
            (!row.road_crossing?.endPhoto || row.road_crossing.endPhoto === "") && <span>-</span>}

        </div>
      ),
    },
    {
      name: "Video",
      cell: (row: UnderGroundSurveyData) => {
        if (row.event_type === "VIDEORECORD") {
          const mainUrl = row.videoUrl?.trim().replace(/^"|"$/g, "");
          const fallbackUrl = row.videoDetails?.videoUrl?.trim().replace(/^"|"$/g, "");
          const videoUrl = mainUrl || fallbackUrl;

          return videoUrl ? (
            <button className="text-blue-600 underline" onClick={() => setSelectedVideoUrl(videoUrl)}>
              Play Video
            </button>
          ) : (
            "-"
          );
        }
        return "-";
      },
    },
    {
      name: "Video Size",
      cell: (row: UnderGroundSurveyData) => {
        if (row.event_type === "VIDEORECORD") {
          const mainUrl = row.videoUrl?.trim().replace(/^"|"$/g, "");
          const fallbackUrl = row.videoDetails?.videoUrl?.trim().replace(/^"|"$/g, "");
          const videoUrl = mainUrl || fallbackUrl;

          const sizeInBytes = videoSizes[videoUrl || ""];
          if (sizeInBytes) {
            const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
            return `${sizeInMB} MB`;
          } else {
            return "Loading...";
          }
        }
        return "-";
      },
    },

    {
      name: "Route Type",
      selector: (row: UnderGroundSurveyData) => row.route_details.routeType || "-",
    },
    {
      name: "RouteBelongsTo",
      selector: (row: UnderGroundSurveyData) => row.route_details.routeBelongsTo || "-",
    },
    {
      name: "Soil Type",
      selector: (row: UnderGroundSurveyData) => row.route_details.soilType || "-",
    },
    {
      name: "Area Type",
      selector: (row: UnderGroundSurveyData) => row.area_type || "-",
    },
    {
      name: "Crossing Type",
      selector: (row: UnderGroundSurveyData) => row.road_crossing?.roadCrossing || "-",
    },
    {
      name: "Crossing Length",
      selector: (row: UnderGroundSurveyData) => row.road_crossing?.length || "-",
    },
    {
      name: "Road Width",
      selector: (row: UnderGroundSurveyData) => row.route_details.roadWidth || "-",
    },
    {
      name: "CenterToMargin",
      selector: (row: UnderGroundSurveyData) => row.route_details.centerToMargin || "-",
    },
    {
      name: "Route Feasible",
      selector: (row: UnderGroundSurveyData) => (row.route_feasibility?.routeFeasible ? "Yes" : "No"),
    },
    {
      name: "Alternate Path",
      selector: (row: UnderGroundSurveyData) => (row.route_feasibility?.alternatePathAvailable ? "Yes" : "No"),
    },
    {
      name: "Alt Path Details",
      selector: (row: UnderGroundSurveyData) => row.route_feasibility?.alternativePathDetails || "-",
    },
    {
      name: "Created At",
      selector: (row: UnderGroundSurveyData) =>
        new Date(row.createdTime || row.created_at || "").toLocaleString(),
    },
  ];

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

  const handleAccept = async () => {
    try {
      const response = await axios.post(`${BASEURL_Val}/underground-surveys/${id}/accept`);
      if (response.data.status === 1) {
        toast.success("Record Accepted successfully!");
      }
    } catch (error) {
      console.error("Error accepting record:", error);
      toast.error("Error accepting record");
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`${BASEURL_Val}/underground-surveys/${id}`);
      // Show success message
      toast.success("Record deleted successfully.");

      // Redirect to another page (e.g., list page)
      // navigate("/survey?tab=ground");
       window.history.back()
    } catch (error) {
      toast.error("Failed to delete record.");
    }
  };

  const handleReject = async () => {
    try {
      const response = await axios.post(`${BASEURL_Val}/underground-surveys/${id}/reject`);
      if (response.data.status === 1) {
        toast.success("Record Rejected successfully.");
      }
    } catch (error) {
      console.error("Error rejecting record:", error);
      alert("Failed to reject record.");
    }
  };

  const fetchSurveyData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASEURL_Val}/underground-surveys/${id}`);
      setData(response.data.data);
      setError(null); // clear error if any
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
      fetchSurveyData();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
  const viewOnly = hasViewOnlyAccess();


  const hasPatrollerData = data?.under_ground_survey_data.some(
    (survey) =>
      survey.patroller_details &&
      typeof survey.patroller_details === "object" &&
      (survey.patroller_details.companyName ||
        survey.patroller_details.email ||
        survey.patroller_details.mobile ||
        survey.patroller_details.name)
  );

  const hasRoadCrossingData = data?.under_ground_survey_data.some(
    (survey) =>
      survey.road_crossing &&
      typeof survey.road_crossing === "object" &&
      (survey.road_crossing.roadCrossing ||
        survey.road_crossing.length ||
        survey.road_crossing.startPhoto ||
        survey.road_crossing.endPhoto)
  );

  const hasRouteDetailsData = data?.under_ground_survey_data.some(
    (survey) =>
      survey.route_details &&
      typeof survey.route_details === "object" &&
      (survey.route_details.routeBelongsTo ||
        survey.route_details.routeType ||
        survey.route_details.roadWidth ||
        survey.route_details.soilType)
  );

  const hasRouteFeasibilityData = data?.under_ground_survey_data.some(
    (survey) =>
      survey.route_feasibility &&
      typeof survey.route_feasibility === "object" &&
      (survey.route_feasibility.routeFeasible !== undefined ||
        survey.route_feasibility.alternatePathAvailable ||
        survey.route_feasibility.alternativePathDetails)
  );

  const exportExcel = async () => {
    const filteredData = [
      ...new Map(
        data?.under_ground_survey_data
          ?.filter(survey =>
            Object.values(survey).some(val =>
              typeof val === 'string' && val.toLowerCase().includes(searchTerm.toLowerCase())
            )
          )
          .map(survey => [`${survey.latitude}-${survey.longitude}-${survey.event_type}`, survey])
      ).values()
    ];

    const AllData = filteredData || [];
    const MainData = data;
    const rows = AllData.map((data) => {
      let routeIndicatorItems: any = [];
      if (
        data.event_type === "ROUTEINDICATOR" &&
        data?.surveyUploaded === "true" &&
        data.routeIndicatorUrl
      ) {
        let urls = [];
        try {
          const parsed = JSON.parse(data.routeIndicatorUrl);

          if (Array.isArray(parsed)) {
            urls = parsed;
          } else if (typeof parsed === "string") {
            urls = [parsed];
          }
        } catch (e) {
          urls = [data.routeIndicatorUrl];
        }

        routeIndicatorItems = urls
          .filter((url) => !!url)
          .map((url) => ({
            text: `${baseUrl}${url}`,
            url: `${baseUrl}${url}`,
          }));
      }


      return {


        // Basic Info
        id: data.id,
        blk_name: MainData?.start_gp?.blk_name || '',
        dt_name: MainData?.start_gp?.dt_name || '',
        st_name: MainData?.start_gp?.st_name || '',
        startGp: MainData?.start_gp?.name || '',
        endGp: MainData?.end_gp?.name || '',
        survey_id: data.survey_id,
        area_type: data.area_type,
        event_type: data.event_type,
        surveyUploaded: data.surveyUploaded,
        execution_modality: data.execution_modality,

        // GPS Info
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        accuracy: data.accuracy,
        depth: data.depth,
        distance_error: data.distance_error,



        // Road Crossing Info
        crossing_Type: data.road_crossing?.roadCrossing || '',
        crossing_length: data.road_crossing?.length || '',
        crossing_startPhoto_URL: (data.event_type === "ROADCROSSING" && data?.surveyUploaded === "true" && data.road_crossing?.startPhoto) ? { text: `${baseUrl}${data.road_crossing?.startPhoto}`, url: `${baseUrl}${data.road_crossing?.startPhoto}` } : '',
        crossing_startphoto_Lat: data.road_crossing?.startPhotoLat || '',
        crossing_startphoto_Long: data.road_crossing?.startPhotoLong || '',
        crossing_endPhoto_URL: (data.event_type === "ROADCROSSING" && data?.surveyUploaded === "true" && data.road_crossing?.endPhoto) ? { text: `${baseUrl}${data.road_crossing?.endPhoto}`, url: `${baseUrl}${data.road_crossing?.endPhoto}` } : '',
        crossing_endphoto_Lat: data.road_crossing?.endPhotoLat || '',
        crossing_endphoto_Long: data.road_crossing?.endPhotoLong || '',

        // Route Details
        centerToMargin: data.route_details?.centerToMargin || '',
        roadWidth: data.route_details?.roadWidth || '',
        routeBelongsTo: data.route_details?.routeBelongsTo || '',
        routeType: data.route_details?.routeType || '',
        soilType: data.route_details?.soilType || '',

        // Route Feasibility
        routeFeasible: data.route_feasibility?.routeFeasible ?? '',
        alternatePathAvailable: data.route_feasibility?.alternatePathAvailable ?? '',
        alternativePathDetails: data.route_feasibility?.alternativePathDetails || '',

        // Side and Indicator
        side_type: data.side_type,
        // routeIndicatorUrl: (data.event_type === "ROUTEINDICATOR" && data?.surveyUploaded === "true" && data.routeIndicatorUrl)
        //   ? { text: `${baseUrl}${data.routeIndicatorUrl}`, url: `${baseUrl}${data.routeIndicatorUrl}` }
        //   : '',
        routeIndicatorUrl: routeIndicatorItems.length > 0 ? routeIndicatorItems : '',




        // Start/End Photos
        Survey_Start_Photo: data.event_type === "SURVEYSTART" && data?.surveyUploaded === "true" ? { text: `${baseUrl}${data.start_photos?.[0]}`, url: `${baseUrl}${data.start_photos?.[0]}` } : '',
        Survey_End_Photo: data.event_type === "ENDSURVEY" && data?.surveyUploaded === "true" ? { text: `${baseUrl}${data.end_photos?.[0]}`, url: `${baseUrl}${data.end_photos?.[0]}` } : '',

        // Utility Features
        localInfo: data.utility_features_checked?.localInfo || '',
        selectedGroundFeatures: (data.utility_features_checked?.selectedGroundFeatures || []).join(', '),

        // Video Details
        videoUrl: (data.event_type === "VIDEORECORD" && data?.surveyUploaded === "true" && data.videoDetails?.videoUrl?.trim().replace(/^"|"$/g, "")) ? { text: `${baseUrl}${data.videoDetails?.videoUrl}`, url: `${baseUrl}${data.videoDetails?.videoUrl}` } : '',
        video_startLatitude: data.videoDetails?.startLatitude || '',
        video_startLongitude: data.videoDetails?.startLongitude || '',
        video_startTimeStamp: data.videoDetails?.startTimeStamp || '',
        video_endLatitude: data.videoDetails?.endLatitude || '',
        video_endLongitude: data.videoDetails?.endLongitude || '',
        video_endTimeStamp: data.videoDetails?.endTimeStamp || '',

        // Joint Chamber and fpoi
        jointChamberUrl: (data.event_type === "JOINTCHAMBER" && data?.surveyUploaded === "true" && data.jointChamberUrl) ? { text: `${baseUrl}${data.jointChamberUrl}`, url: `${baseUrl}${data.jointChamberUrl}` } : '',
        fpoiUrl: (data.event_type === "FPOI" && data.fpoiUrl && data?.surveyUploaded === "true") ? { text: `${baseUrl}${data.fpoiUrl}`, url: `${baseUrl}${data.fpoiUrl}` } : '',
        kmtStoneUrl: (data.event_type === "KILOMETERSTONE" && data.kmtStoneUrl && data?.surveyUploaded === "true") ? { text: `${baseUrl}${data.kmtStoneUrl}`, url: `${baseUrl}${data.kmtStoneUrl}` } : '',
        landMarkType: data.landMarkType,landMarkDescription:data.landMarkDescription,
        LANDMARK: (data.event_type === "LANDMARK" && data?.surveyUploaded === "true" && data.landMarkUrls && data.landMarkType !== 'NONE') && `${baseUrl}${JSON.parse(data.landMarkUrls)
          .filter((url: string) => url)
          .map((url: string) => (
            { text: `${baseUrl}${url}`, url: `${baseUrl}${url}` }
          ))}` || '',routeIndicatorType:data.routeIndicatorType,
        FIBERTURN: (data.event_type === "FIBERTURN" && data?.surveyUploaded === "true" && data.fiberTurnUrl) ? { text: `${baseUrl}${data.fiberTurnUrl}`, url: `${baseUrl}${data.fiberTurnUrl}` } : '',

        // Patroller Details
        patroller_company: data.patroller_details?.companyName || '',
        patroller_name: data.patroller_details?.name || '',
        patroller_email: data.patroller_details?.email || '',
        patroller_mobile: data.patroller_details?.mobile || '',

        // Timestamps
        createdTime: data.createdTime,
        created_at: data.created_at,

      }
    });
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    rows.forEach((row, rowIndex) => {
      const excelRow = rowIndex + 2;
      const fieldsWithLinks = {
        crossing_startPhoto_URL: 'T',
        crossing_endPhoto_URL: 'W',
        routeIndicatorUrl: 'AI',
        Survey_Start_Photo: 'AJ',
        Survey_End_Photo: 'AK',
        videoUrl: 'AN',
        jointChamberUrl: 'AU',
        fpoiUrl: 'AV',
        kmtStoneUrl: 'AW',
        LANDMARK: 'AY',
        FIBERTURN: 'AZ'
      };

      Object.entries(fieldsWithLinks).forEach(([key, col]) => {
        const val = (row as any)[key];
    if (key === "routeIndicatorUrl" && Array.isArray(val)) {
      const combinedLinks = val.map((item, i) => `Image ${i + 1}`).join('\n');
      worksheet[`${col}${excelRow}`] = {
        t: "s",
        v: combinedLinks,
        l: { Target: val[0].url } 
      };
    }
 else if (val && typeof val === 'object' && val.url) {

          worksheet[`${col}${excelRow}`] = {
            t: "s",
            v: val.text || "View",
            l: { Target: val.url }
          };
        }
      });

    });

    XLSX.utils.book_append_sheet(workbook, worksheet, `UnderGround Survey_${AllData[0].survey_id}`);
    XLSX.utils.sheet_add_aoa(worksheet, [
      [
        "ID",
        "Block Name",
        "District Name",
        "State Name",
        "Start GP",
        "End GP",
        "Survey ID",
        "Area Type",
        "Event Type",
        "Survey Uploaded",
        "Execution Modality",
        "Latitude",
        "Longitude",
        "Altitude",
        "Accuracy",
        "Depth",
        "Distance Error",



        // Road Crossing
        "Crossing Type",
        "Crossing Length",
        "Crossing Start Photo URL",
        "Crossing Start Photo Latitude",
        "Crossing Start Photo Longitude",
        "Crossing End Photo URL",
        "Crossing End Photo Latitude",
        "Crossing End Photo Longitude",

        // Route Details
        "Center To Margin",
        "Road Width",
        "Route Belongs To",
        "Route Type",
        "Soil Type",

        // Route Feasibility
        "Route Feasible",
        "Alternate Path Available",
        "Alternative Path Details",

        // Side & Indicator
        "Side Type",
        "Route Indicator URL",

        // Survey Photos
        "Survey Start Photo",
        "Survey End Photo",

        // Utility Features
        "Local Info",
        "Selected Ground Features",

        // Video Details
        "Video URL",
        "Video Start Latitude",
        "Video Start Longitude",
        "Video Start TimeStamp",
        "Video End Latitude",
        "Video End Longitude",
        "Video End TimeStamp",

        // Joint Chamber & fpoi
        "Joint Chamber URL",
        "FPOI URL",
        "KmStone URL",
        "LandMark Type",
        "LandMark Desc",
        "LandMark URL",
        "Route Indicator Type",
        "Fiberturn URL",
        // Patroller Details
        "Patroller Company",
        "Patroller Name",
        "Patroller Email",
        "Patroller Mobile",
        // Timestamps
        "Created Time",
        "Created At",
      ]
    ], { origin: "A1" });
    XLSX.writeFile(workbook, `UnderGround Survey_${AllData[0].survey_id}.xlsx`, { compression: true });

  };

  const handleTabChange = (item: any) => {
    setActiveTab('video')
    setSelectedItem(item)
  }
 
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
        <button
          className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
          onClick={() => window.history.back()}
        >
          <FaArrowLeft className="h-5 w-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold mb-4">UnderGround Survey Detail View</h1>
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex flex-wrap justify-between items-center">
            {/* Left: Tabs */}
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button
                  className={`inline-block p-4 rounded-t-lg outline-none ${activeTab === 'details'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                    }`}
                  onClick={() => setActiveTab('details')}
                >
                  Details View
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block p-4 rounded-t-lg outline-none ${activeTab === 'map'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                    }`}
                  onClick={() => setActiveTab('map')}
                >
                  Map View
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block p-4 rounded-t-lg outline-none ${activeTab === 'video'
                    ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                    : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                    }`}
                  onClick={() => setActiveTab('video')}
                >
                  Video Details
                </button>
              </li>
            </ul>

            {/* Right: Export + Search */}
            <div className="flex items-center gap-2 mb-2">
              {!viewOnly &&
              <button
                className="border px-3 py-1 rounded bg-green-400 text-white hover:bg-green-300"
                onClick={exportExcel}
              >
                Export
              </button>
             }
              <input
                type="text"
                className="border px-3 py-1 rounded"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        {activeTab === 'details' && (
          <div className="p-4">
            <div className=" overflow-x-auto">
              <DataTable
                columns={columns}
                data={filteredData}
                pagination
                highlightOnHover
                striped
                dense
                responsive
                customStyles={customStyles} />

            </div>
            <h2 className="text-xl font-semibold mt-6">Patroller Details</h2>
            {hasPatrollerData ? (
              <table className="w-full mt-2 border-collapse border border-gray-400 bg-white">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Company Name</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Mobile</th>
                    <th className="border p-2">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.under_ground_survey_data.map((survey) => {
                    let details = survey.patroller_details;

                    // Ensure patroller_details is an object (handle JSON string case)
                    if (typeof details === "string") {
                      try {
                        details = JSON.parse(details);
                      } catch (error) {
                        details = {}; // In case of invalid JSON
                      }
                    }

                    const hasData =
                      details &&
                      (details.companyName || details.email || details.mobile || details.name);

                    return hasData ? (
                      <tr key={survey.id}>
                        <td className="border p-2">{details.companyName || "-"}</td>
                        <td className="border p-2">{details.email || "-"}</td>
                        <td className="border p-2">{details.mobile || "-"}</td>
                        <td className="border p-2">{details.name || "-"}</td>
                      </tr>
                    ) : null;
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 mt-2">No patroller details available.</p>
            )}


            {/* Action Buttons */}
            {!viewOnly && (
              <div className="mt-6 flex gap-4 justify-center">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                  onClick={() => {
                    toast.success("Coming Soon this page!");
                  }}
                >
                  Edit
                </button>

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
        )}

        {activeTab === 'map' && (
          <div className="h-[600px] p-4">
            {/* Map goes here */}
            <MapComponent data={data?.under_ground_survey_data || []} OnTabChange={handleTabChange} />
          </div>
        )}
        {activeTab === 'video' && (
          <div className="h-[600px] p-4">
            {/* Map goes here */}
            <App data={data?.under_ground_survey_data || []} SelectedEvent={SelectedItem} />
          </div>
        )}
      </div>
        <UnderGroundSurveyImageModal
          isOpen={isModalOpen}
          onClose={closeModal}
          surveyData={selectedActivity}
          baseUrl={baseUrl}
          onUpdate={() => fetchSurveyData()}
            />
      {/* Modal for video preview */}
      {selectedVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="relative w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 flex justify-end">
              <button
                onClick={() => setSelectedVideoUrl(null)}
                className="text-gray-600 hover:text-red-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="px-4 pb-4">
              <div className="relative pb-[56.25%] h-0">
                <iframe
                  src={`${baseUrl}${selectedVideoUrl}`}
                  title="Survey Video"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full rounded"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GroundDetailView;
