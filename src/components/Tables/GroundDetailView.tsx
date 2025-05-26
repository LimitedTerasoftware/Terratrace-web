import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MapComponent from "./MapComponent";

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
}

interface GroundSurvey {
  id: number;
  startLocation: string;
  endLocation: string;
  under_ground_survey_data: UnderGroundSurveyData[];
}

const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;

const GroundDetailView: React.FC = () => {
  const [data, setData] = useState<GroundSurvey | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'map'>('details');
  console.log("selectedVideoUrl324", selectedVideoUrl);


  const { id } = useParams();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalItems = data?.under_ground_survey_data.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = data?.under_ground_survey_data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


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
      navigate("/survey?tab=ground");
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

  useEffect(() => {
    axios
      .get(`${BASEURL_Val}/underground-surveys/${id}`)
      .then((response) => {
        console.log(response.data.data);
        setData(response.data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch data");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;

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

        <div className="flex flex-end gap-4 px-4 py-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded ${activeTab === 'details' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Details View
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded ${activeTab === 'map' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Map View
          </button>
        </div>
        {activeTab === 'details' && (
          <div className="p-4">
            <div className=" overflow-x-auto">
              <table className="w-full mt-2 border-collapse border border-gray-400 bg-white">
                <thead>
                  <tr className="bg-white-200">
                    <th className="border p-2">Event Type</th>
                    {/* <th  className="border p-2">FPOI</th> */}
                    <th className="border p-2">Latitude</th>
                    <th className="border p-2">Longitude</th>
                    <th className="border p-2">Side Type</th>
                    <th className="border p-2">Execution Modality</th>
                    <th className="border p-2">Image</th>
                    {/* <th  className="border p-2">End Photos</th> */}
                    <th className="border p-2">Video</th>
                    {/* <th  className="border p-2">Route Indicator</th>
            <th  className="border p-2">Joint Chamber</th> */}
                    <th className="border p-2">Route Type</th>
                    <th className="border p-2">RouteBelongsTo</th>
                    <th className="border p-2">Soil Type</th>
                    <th className="border p-2">Area Type</th>
                    <th className="border p-2">Crossing Type</th>
                    <th className="border p-2">Road Length</th>
                    <th className="border p-2">Road Width</th>
                    <th className="border p-2">CenterToMargin</th>
                    <th className="border p-2">Route Feasible</th>
                    <th className="border p-2">Alternate Path Available</th>
                    <th className="border p-2">Alternative Path Details</th>
                    <th className="border p-2">Created At</th>
                  </tr>
                </thead>
                <tbody>

                  {paginatedData?.filter(survey => survey.event_type !== 'LIVELOCATION').map((survey) => (
                    <tr key={survey.id}>
                      <td className="border p-2 text-center">{survey.event_type}</td>
                      {/* <td className="border p-2">
                  {survey.fpoiUrl ? (
                    <img src={`${baseUrl}${survey.fpoiUrl}`} alt="fpoi Photo" className="w-16 h-16"  onClick={() => setZoomImage(`${baseUrl}${survey.fpoiUrl}`)}/>
                  ) : (
                    "-"
                  )}
                </td> */}
                      <td className="border p-2 text-center">{survey.latitude}</td>
                      <td className="border p-2 text-center">{survey.longitude}</td>
                      <td className="border p-2 text-center">{survey.side_type}</td>
                      <td className="border p-2 text-center">{survey.execution_modality}</td>
                      <td className="border p-2 text-center">
                        {/* fpoiUrl */}
                        {survey.fpoiUrl &&  survey.event_type !== 'VIDEORECORD' && (
                          <span
                            className="text-blue-600 underline cursor-pointer"
                            onClick={() => setZoomImage(`${baseUrl}${survey.fpoiUrl}`)}
                          >
                            fpoiUrl <br />
                          </span>
                        )}

                        {/* start_photos */}
                        {survey.start_photos?.map((photo, index) => (
                          <span
                            key={`start-${index}`}
                            className="text-blue-600 underline cursor-pointer"
                            onClick={() => setZoomImage(`${baseUrl}${photo}`)}
                          >
                            start_photo_{index + 1} <br />
                          </span>
                        ))}

                        {/* end_photos */}
                        {survey.end_photos?.map((photo, index) => (
                          <span
                            key={`end-${index}`}
                            className="text-blue-600 underline cursor-pointer"
                            onClick={() => setZoomImage(`${baseUrl}${photo}`)}
                          >
                            end_photo_{index + 1} <br />
                          </span>
                        ))}

                        {/* routeIndicatorUrl */}
                        {survey.routeIndicatorUrl  && survey.event_type !== 'VIDEORECORD' && (
                          <span
                            className="text-blue-600 underline cursor-pointer"
                            onClick={() => setZoomImage(`${baseUrl}${survey.routeIndicatorUrl}`)}
                          >
                            routeIndicatorUrl <br />
                          </span>
                        )}

                        {/* jointChamberUrl */}
                        {survey.jointChamberUrl && survey.event_type !== 'VIDEORECORD' && (
                          <span
                            className="text-blue-600 underline cursor-pointer"
                            onClick={() => setZoomImage(`${baseUrl}${survey.jointChamberUrl}`)}
                          >
                            jointChamberUrl <br />
                          </span>
                        )}

                        {/* road_crossing */}
                        {survey.road_crossing?.startPhoto && survey.event_type !== 'VIDEORECORD'  && (
                          <span
                            className="text-blue-600 underline cursor-pointer"
                            onClick={() => setZoomImage(`${baseUrl}${survey.road_crossing.startPhoto}`)}
                          >
                            startPhoto_{survey.road_crossing.roadCrossing} <br />
                          </span>
                        )}

                        {/* endPhoto from photoDetails */}
                        {survey.road_crossing?.endPhoto  && survey.event_type !== 'VIDEORECORD' && (
                          <span
                            className="text-blue-600 underline cursor-pointer"
                            onClick={() => setZoomImage(`${baseUrl}${survey.road_crossing.endPhoto}`)}
                          >
                            endPhoto_{survey.road_crossing.roadCrossing} <br />
                          </span>
                        )}

                        {/* No URLs fallback */}
                        {!survey.fpoiUrl &&
                          (!survey.start_photos || survey.start_photos.length === 0) &&
                          (!survey.end_photos || survey.end_photos.length === 0) &&
                          !survey.routeIndicatorUrl &&
                          !survey.jointChamberUrl &&
                          (!survey.road_crossing?.startPhoto || survey.road_crossing.startPhoto === "") &&
                          (!survey.road_crossing?.endPhoto || survey.road_crossing.endPhoto === "") && <span>-</span>}


                      </td>
                      {/* <td className="border p-2 text-center">
                {survey.start_photos.map((photo, index) => (
                  <img key={index} src={`${baseUrl}${photo}`} alt="Start" width="50" height="50" onClick={() => setZoomImage(`${baseUrl}${photo}`)}/>
                ))}
              </td> */}
                      {/* <td className="border p-2 text-center">
                {survey.end_photos.map((photo, index) => (
                  <img key={index} src={`${baseUrl}${photo}`} alt="End" width="50" height="50" onClick={() => setZoomImage(`${baseUrl}${photo}`)}/>
                ))}
              </td> */}
                      <td className="border p-2 text-center">
                        {survey.event_type == "VIDEORECORD" && (
                          (() => {
                            const mainVideoUrl = survey.videoUrl?.trim().replace(/(^"|"$)/g, '');
                            const fallbackVideoUrl = survey.videoDetails?.videoUrl?.trim().replace(/(^"|"$)/g, '');

                            if (mainVideoUrl) {
                              return (
                                <button
                                  onClick={() => setSelectedVideoUrl(mainVideoUrl)}
                                  className="text-blue-600 hover:underline"
                                >
                                  Play Video
                                </button>
                              );
                            } else if (fallbackVideoUrl) {
                              return (
                                <button
                                  onClick={() => setSelectedVideoUrl(fallbackVideoUrl)}
                                  className="text-blue-600 hover:underline"
                                >
                                  Play Video
                                </button>
                              );
                            } else {
                              "No Video";
                            }
                          })()
                        )}
                      </td>

                      {/* <td className="border p-2">
                  {survey.routeIndicatorUrl ? (
                    <img src={`${baseUrl}${survey.routeIndicatorUrl}`} alt="Route Photo" className="w-16 h-16"  onClick={() => setZoomImage(`${baseUrl}${survey.routeIndicatorUrl}`)}/>
                  ) : (
                    "-"
                  )}
                </td> */}
                      {/* <td className="border p-2">
                {survey.jointChamberUrl ? (
                  <img src={`${baseUrl}${survey.jointChamberUrl}`} alt="Chamber Photo" className="w-16 h-16"  onClick={() => setZoomImage(`${baseUrl}${survey.jointChamberUrl}`)}/>
                ) : (
                  "-"
                )}
                </td> */}
                      <td className="border p-2 text-center">{survey.route_details.routeType}</td>
                      <td className="border p-2 text-center">{survey.route_details.routeBelongsTo}</td>
                      <td className="border p-2 text-center">{survey.route_details.soilType}</td>
                      <td className="border p-2 text-center">{survey.area_type}</td>
                      <td className="border p-2 text-center">{survey.road_crossing.roadCrossing || '-'}</td>
                      <td className="border p-2 text-center">{survey.road_crossing.length || '-'}</td>
                      <td className="border p-2 text-center">{survey.route_details.roadWidth || '-'}</td>
                      <td className="border p-2 text-center">{survey.route_details.centerToMargin || '-'}</td>
                      <td className="border p-2">{survey?.route_feasibility?.routeFeasible ? "Yes" : "No"}</td>
                      <td className="border p-2">{survey?.route_feasibility?.alternatePathAvailable ? "Yes" : "No"}</td>
                      <td className="border p-2">{survey?.route_feasibility?.alternativePathDetails || "-"}</td>
                      <td className="border p-2 text-center">{new Date(survey.createdTime || survey.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center mt-4 flex-wrap gap-1 sm:gap-2 text-sm">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>

              {/* First Page */}
              {currentPage > 2 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className={`px-3 py-1 border rounded ${currentPage === 1 ? "bg-blue-500 text-white" : ""
                      }`}
                  >
                    1
                  </button>
                  {currentPage > 3 && <span className="px-2">...</span>}
                </>
              )}

              {/* Pages Around Current */}
              {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i)
                .filter((page) => page >= 1 && page <= totalPages)
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded ${currentPage === page ? "bg-blue-500 text-white" : ""
                      }`}
                  >
                    {page}
                  </button>
                ))}

              {/* Last Page */}
              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1 border rounded ${currentPage === totalPages ? "bg-blue-500 text-white" : ""
                      }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
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

            {/* Road Crossing */}
            {/* <h2 className="text-xl font-semibold mt-6">Road Crossing</h2>
    {hasRoadCrossingData ? (
      <table className="w-full mt-2 border-collapse border border-gray-400 bg-white">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Road Crossing</th>
            <th className="border p-2">Length</th>
            <th className="border p-2">Start Photo</th>
            <th className="border p-2">End Photo</th>
          </tr>
        </thead>
        <tbody>
          {data?.under_ground_survey_data.map((survey) => {
            let crossing = survey.road_crossing || {};
            return crossing.roadCrossing || crossing.length || crossing.startPhoto || crossing.endPhoto ? (
              <tr key={survey.id}>
                <td className="border p-2">{crossing.roadCrossing || "-"}</td>
                <td className="border p-2">{crossing.length || "-"}</td>
                <td className="border p-2">
                  {crossing.startPhoto ? (
                    <img src={`${baseUrl}${crossing.startPhoto}`} alt="Start Photo" className="w-16 h-16"  onClick={() => setZoomImage(`${baseUrl}${crossing.startPhoto}`)}/>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="border p-2">
                  {crossing.endPhoto ? (
                    <img src={`${baseUrl}${crossing.endPhoto}`} alt="End Photo" className="w-16 h-16"  onClick={() => setZoomImage(`${baseUrl}${crossing.endPhoto}`)}/>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ) : null;
          })}
        </tbody>
      </table>
    ) : (
      <p className="text-gray-500 mt-2">No road crossing data available.</p>
    )} */}

            {/* Route Details */}
            {/* <h2 className="text-xl font-semibold mt-6">Route Details</h2>
    {hasRouteDetailsData ? (
      <table className="w-full mt-2 border-collapse border border-gray-400 bg-white">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Route Belongs To</th>
            <th className="border p-2">Route Type</th>
            <th className="border p-2">Road Width</th>
            <th className="border p-2">Soil Type</th>
          </tr>
        </thead>
        <tbody>
          {data?.under_ground_survey_data.map((survey) => {
            let route = survey.route_details || {};
            return route.routeBelongsTo || route.routeType || route.roadWidth || route.soilType ? (
              <tr key={survey.id}>
                <td className="border p-2">{route.routeBelongsTo || "-"}</td>
                <td className="border p-2">{route.routeType || "-"}</td>
                <td className="border p-2">{route.roadWidth || "-"}</td>
                <td className="border p-2">{route.soilType || "-"}</td>
              </tr>
            ) : null;
          })}
        </tbody>
      </table>
    ) : (
      <p className="text-gray-500 mt-2">No route details available.</p>
    )} */}

            {/* Route Feasibility */}
            {/* <h2 className="text-xl font-semibold mt-6">Route Feasibility</h2>
    {hasRouteFeasibilityData ? (
      <table className="w-full mt-2 border-collapse border border-gray-400 bg-white">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Route Feasible</th>
            <th className="border p-2">Alternate Path Available</th>
            <th className="border p-2">Alternative Path Details</th>
          </tr>
        </thead>
        <tbody>
          {data?.under_ground_survey_data.map((survey) => {
            let feasibility = survey.route_feasibility || {};
            return feasibility.routeFeasible !== undefined || feasibility.alternatePathAvailable || feasibility.alternativePathDetails ? (
              <tr key={survey.id}>
                <td className="border p-2">{feasibility.routeFeasible ? "Yes" : "No"}</td>
                <td className="border p-2">{feasibility.alternatePathAvailable ? "Yes" : "No"}</td>
                <td className="border p-2">{feasibility.alternativePathDetails || "-"}</td>
              </tr>
            ) : null;
          })}
        </tbody>
      </table>
    ) : (
      <p className="text-gray-500 mt-2">No route feasibility data available.</p>
    )} */}

            {/* Action Buttons */}
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
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-[600px] p-4">
            {/* Map goes here */}
            <MapComponent data={data?.under_ground_survey_data || []} />
          </div>
        )}
      </div>
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
