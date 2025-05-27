import { GoogleMap, Marker, Polyline, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useFullscreen } from '../hooks/useFullscreen';
import videoIcon from '../../images/icon/cinema.png';
// Leaflet icon fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import VideoPlayer from './VideoPlayer';


delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type VideoDetails = {
  startLatitude: number;
  startLongitude: number;
  startTimeStamp: number;
  endLatitude: number;
  endLongitude: number;
  endTimeStamp: number;
  videoUrl: string;
};

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
// Type Definitions
type UnderGroundSurveyData = {
  id: string;
  latitude: string;
  longitude: string;
  event_type: string;
  execution_modality: string;
  videoUrl?: string;
  start_photos: string[];
  end_photos: string[];
  jointChamberUrl: string;
  created_at: string;
  createdTime: string;
  video_duration?: number;
  videoDetails?: VideoDetails;
  road_crossing: RoadCrossing;


};


const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;

interface MapComponentProps {
  data: UnderGroundSurveyData[];
}



const findNearestVideoBefore = (data: UnderGroundSurveyData[], targetTime: string): UnderGroundSurveyData | null => {

  return [...data]
    .filter(item => item.event_type === "VIDEORECORD" && (item?.videoDetails?.videoUrl || item.videoUrl) && (item?.videoDetails?.videoUrl.trim().replace(/(^"|"$)/g, '') !== "" || item?.videoUrl.trim().replace(/(^"|"$)/g, '') !== "") && new Date(item.createdTime || item.created_at) <= new Date(targetTime))
    .sort((a, b) => new Date(b.createdTime || b.created_at).getTime() - new Date(a.createdTime || a.created_at).getTime())[0] || null;
};

const getTimeDifferenceInSeconds = (time1: string, time2: string): number => {
  return (new Date(time1).getTime() - new Date(time2).getTime()) / 1000;
};

const isSameCoordinate = (
  coord1: google.maps.LatLngLiteral,
  coord2: google.maps.LatLngLiteral
) => {
  const lat1 = parseFloat(coord1.lat as any);
  const lng1 = parseFloat(coord1.lng as any);
  const lat2 = parseFloat(coord2.lat as any);
  const lng2 = parseFloat(coord2.lng as any);

  return lat1 === lat2 && lng1 === lng2;
};

const calculateDistance = (p1: google.maps.LatLngLiteral, p2: google.maps.LatLngLiteral): number => {
  const R = 6371e3; // Earth's radius in meters
  const A1 = p1.lat * Math.PI / 180;
  const A2 = p2.lat * Math.PI / 180;
  const AB = (p2.lat - p1.lat) * Math.PI / 180;
  const BC = (p2.lng - p1.lng) * Math.PI / 180;

  const a = Math.sin(AB / 2) * Math.sin(AB / 2) +
    Math.cos(A1) * Math.cos(A2) *
    Math.sin(BC / 2) * Math.sin(BC / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};


const MapComponent: React.FC<MapComponentProps> = ({ data }) => {

  const [selectedMarker, setSelectedMarker] = useState<UnderGroundSurveyData | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<string>('default');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pointA, setPointA] = useState<google.maps.LatLngLiteral | null>(null);
  const [pointB, setPointB] = useState<google.maps.LatLngLiteral | null>(null);
  const [selectionMode, setSelectionMode] = useState<'none' | 'pointA' | 'pointB'>('none');
  const [videoSegment, setVideoSegment] = useState<UnderGroundSurveyData[] | null>(null);
  const [videoTimeRange, setVideoTimeRange] = useState<{ start: number; end: number } | null>(null);
  const [isSelectingPoint, setIsSelectingPoint] = useState(false);
  const [StartTime, setStartTime] = useState<number | null>(null);
  const [EndTime, setEndTime] = useState<number | null>(null);
  const [videoSelected, setVideoSelected] = useState<object | null>(null);
  const [movingMarkerPosition, setMovingMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { enterFullscreen, exitFullscreen } = useFullscreen();
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [CrossingType, setCrossingType] = useState('All');

  useEffect(() => {
    // Short delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      if (containerRef.current) {
        enterFullscreen(containerRef.current);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [enterFullscreen]);


  const eventTypes = useMemo<string[]>(() => ['ALL', ...new Set(data.map(d => d.event_type))], [data]);
  const modalities = useMemo<string[]>(() => ['ALL', ...new Set(data.map(d => d.execution_modality))], [data]);
  const filteredData = useMemo<UnderGroundSurveyData[]>(() => {
    return data.filter(item =>
      (selectedEventType === 'ALL' || item.event_type === selectedEventType) &&
      (selectedModality === 'ALL' || item.execution_modality === selectedModality) &&
      (CrossingType === 'All' || item.road_crossing?.roadCrossing === CrossingType)
    );
  }, [data, selectedEventType, selectedModality,CrossingType]);

const crossingCounts = useMemo(() => {
  const counts: Record<string, number> = {
    ROADCROSSING: 0,
    BRIDGE: 0,
    LEVELCROSSING: 0,
    RAILUNDERBRIDGE: 0,
    CAUSEWAYS: 0,
    CULVERT: 0,
    RAILOVERBRIDGE: 0,
  };

  data.forEach(item => {
    if (item.event_type === 'ROADCROSSING') {

    const type = item.road_crossing?.roadCrossing;
    if (type && counts[type] !== undefined) {
      counts[type]++;
    }
  }
  });

  return counts;
}, [data]);

  const positions = filteredData.map(item => ({
    lat: parseFloat(item.latitude),
    lng: parseFloat(item.longitude),
  }))

  const startPointSelection = (point: 'A' | 'B') => {
    setIsSelectingPoint(true)
    setSelectionMode(point === 'A' ? 'pointA' : 'pointB');
  };
  const resetSelection = () => {
    setPointA(null);
    setPointB(null);
    setSelectionMode('none');
    setIsSelectingPoint(false)
    setVideoSegment(null);
    setVideoTimeRange(null);
    setMovingMarkerPosition(null);
    setErrorMessage('');
  };

  const updateVideoSegment = useCallback((pointA: google.maps.LatLngLiteral, pointB: google.maps.LatLngLiteral | null) => {
    if (!pointA) return;
    const findNearestPoint = (coord: google.maps.LatLngLiteral) => {
      return data
        .map(item => ({
          ...item,
          distance: Math.sqrt(
            Math.pow(parseFloat(item.latitude) - coord.lat, 2) +
            Math.pow(parseFloat(item.longitude) - coord.lng, 2)
          )
        }))
        .sort((a, b) => a.distance - b.distance)[0];
    };
    let nearestToA = findNearestPoint(pointA);
    let nearestToB = pointB ? findNearestPoint(pointB) : null;
    if (nearestToB && isSameCoordinate(nearestToA, nearestToB)) {
      nearestToB = null;
    }

    const videoAtPointA = findNearestVideoBefore(data, (nearestToA.createdTime || nearestToA.created_at));

    if (!videoAtPointA || (!videoAtPointA.videoDetails?.videoUrl?.trim() && !videoAtPointA.videoUrl?.trim())) {
      setErrorMessage("No video found near Point A.");
      return;

    }
  


    const startTimeOffset = getTimeDifferenceInSeconds((nearestToA?.createdTime || nearestToA.created_at), (videoAtPointA?.createdTime || videoAtPointA.created_at));
    const endTimeOffset = nearestToB
      ? getTimeDifferenceInSeconds((nearestToB?.createdTime || nearestToB.created_at), (videoAtPointA?.createdTime || videoAtPointA.created_at))
      : null;


    const relevantVideos = data.filter(item =>
      (item?.videoDetails?.videoUrl || item.videoUrl) && item.event_type === "VIDEORECORD" &&
      ((item?.videoDetails?.videoUrl.trim().replace(/(^"|"$)/g, '') !== "") || (item?.videoUrl.trim().replace(/(^"|"$)/g, '') !== "")) &&
      new Date(item?.createdTime || item?.created_at) >= new Date(videoAtPointA?.createdTime || videoAtPointA.created_at)
    ).sort((a, b) => new Date(a?.createdTime || a.created_at).getTime() - new Date(b?.createdTime || b.created_at).getTime());


    setVideoSegment(relevantVideos);
    setVideoSelected(videoAtPointA)
    setStartTime(startTimeOffset);
    setEndTime(endTimeOffset ?? null);
    // If no B point selected, play from A offset till video end
    setVideoTimeRange({
      start: startTimeOffset,
      end: endTimeOffset ?? 0
    });
  }, [pointA, pointB, data]);




  const tileLayerUrl = useMemo(() => {
    switch (viewMode) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  }, [viewMode]);

  const clearFilters = () => {
    setSelectedEventType('ALL');
    setSelectedModality('ALL');
  };
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyCPHNQoyCkDJ3kOdYZAjZElbhXuJvx-Odg',
  });

  if (loadError) return <div>Map cannot be loaded right now...</div>;
  if (!isLoaded) return <div>Loading Map...</div>;
  const initialCenter = { lat: 20.5937, lng: 78.9629 }; // Center of India or your default location


  const calculateTotalDistance = (points: google.maps.LatLngLiteral[]) => {
    let distance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      distance += getDistance(points[i], points[i + 1]);
    }
    return distance;
  };

  const getDistance = (a: google.maps.LatLngLiteral, b: google.maps.LatLngLiteral) => {
    const R = 6371e3; // earth radius in meters
    const toRad = (val: number) => val * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const aDist = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(aDist), Math.sqrt(1 - aDist));
    return R * c;
  };

  const findPositionAlongPath = (points: google.maps.LatLngLiteral[], progress: number) => {
    const totalDist = calculateTotalDistance(points);
    const targetDist = totalDist * progress;

    let covered = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const segDist = getDistance(points[i], points[i + 1]);
      if (covered + segDist >= targetDist) {
        const remaining = targetDist - covered;
        const ratio = remaining / segDist;

        return {
          lat: points[i].lat + (points[i + 1].lat - points[i].lat) * ratio,
          lng: points[i].lng + (points[i + 1].lng - points[i].lng) * ratio
        };
      }
      covered += segDist;
    }
    return points[points.length - 1];
  };


  const handleTimeUpdate = (currentTime: number, Vduration: number) => {
    if (!videoTimeRange || !pointA) return;
    let progress;

    const indexA = positions.findIndex(pos => isSameCoordinate(pos, pointA));


    let pathPoints: google.maps.LatLngLiteral[] = [];

    if (indexA !== -1) {
      if (pointB) {
        const duration = (videoTimeRange.end - videoTimeRange.start);
        progress = Math.min((currentTime - videoTimeRange.start) / duration, 1);

        const indexB = positions.findIndex(pos => isSameCoordinate(pos, pointB));
        if (indexB !== -1) {
          const [start, end] = indexA < indexB ? [indexA, indexB] : [indexB, indexA];
          pathPoints = positions.slice(start, end + 1);
        }
      } else {
        const seconds = Math.round(Vduration);
        const duration = seconds - videoTimeRange.start;
        progress = Math.min((currentTime - videoTimeRange.start) / duration, 1);


        let endCoord: google.maps.LatLngLiteral | null = null;

        // Find video item at Point A
        const findNearestPoint = (coord: google.maps.LatLngLiteral) => {
          return data
            .map(item => ({
              ...item,
              distance: Math.sqrt(
                Math.pow(parseFloat(item.latitude) - coord.lat, 2) +
                Math.pow(parseFloat(item.longitude) - coord.lng, 2)
              )
            }))
            .sort((a, b) => a.distance - b.distance)[0];
        };

        const videoAtA = findNearestPoint(pointA);
        const currentVideoStartTime = new Date(videoAtA?.createdTime || videoAtA.created_at).getTime();

        // Find the next video (after Point A)
        const nextVideo = data.find(item =>
          item.event_type === "VIDEORECORD" &&
          (item?.videoDetails?.videoUrl || item.videoUrl) &&
          new Date(item?.createdTime || item.created_at).getTime() > currentVideoStartTime
        );

        if (nextVideo) {
          endCoord = {
            lat: parseFloat(nextVideo.latitude),
            lng: parseFloat(nextVideo.longitude)
          };
        } else {
          // No next video, end at last GPS point from current video segment
          const last = videoSegment[videoSegment.length - 1];


          endCoord = {
            lat: parseFloat(last.latitude),
            lng: parseFloat(last.longitude)
          };
        }

        // Find index of end coordinate
        const indexEnd = positions.findIndex(pos =>
          isSameCoordinate(pos, endCoord!)
        );
        if (indexEnd !== -1) {


          // const [start, end] = indexA < indexEnd ? [indexA, indexEnd] : [indexEnd, indexA];

          // pathPoints = positions.slice(start, end + 1);
          let start = indexA;
          let end = indexEnd;
          if (indexA === indexEnd || indexEnd < indexA) {

            if (indexEnd + 1 <= positions.length) {
              end = positions.length - 1;

            } else if (indexEnd - 2 >= 0) {
              start = indexEnd - 2; // or fallback: move backward
            }
          }
          else {
            [start, end] = indexA < indexEnd ? [indexA, indexEnd] : [indexEnd, indexA]
          }
          pathPoints = positions.slice(Math.min(start, end), Math.max(start, end) + 1);


        }



      }
    }
    if (pathPoints.length > 1) {

      const newPosition = findPositionAlongPath(pathPoints, progress);

      setMovingMarkerPosition(newPosition);
    }
  };

  const sidebarWidth = isFullscreen ? 'w-1/4' : 'w-96';

  const mapWidth = isFullscreen ? 'w-3/4' : 'w-full md:flex-1';
  return (
    <div ref={containerRef} className="flex flex-col md:flex-row h-screen">
      {/* Left side: Map */}
      <div className={`${mapWidth} h-1/2 md:h-full relative`}>
        <GoogleMap
          mapContainerStyle={{ height: '100%', width: '100%' }}
          //zoom={5}
          center={!mapLoaded ? initialCenter : undefined}
          onLoad={(map) => {
            mapRef.current = map;
            setMapLoaded(true);

            if (filteredData.length > 0) {
              const bounds = new window.google.maps.LatLngBounds();
              filteredData.forEach((item) => {
                bounds.extend({
                  lat: parseFloat(item.latitude),
                  lng: parseFloat(item.longitude),
                });
              });
              map.fitBounds(bounds);
            }
          }}

          options={{
            scrollwheel: true
          }}
        >


          {filteredData.map((item) => {
            const position = {
              lat: parseFloat(item.latitude),
              lng: parseFloat(item.longitude),
            };

            const isPointA = pointA && isSameCoordinate(pointA, position);
            const isPointB = pointB && isSameCoordinate(pointB, position);

            const mainVideoUrl = item.videoUrl?.trim().replace(/(^"|"$)/g, '');
            const fallbackVideoUrl = item.videoDetails?.videoUrl?.trim().replace(/(^"|"$)/g, '');
            const finalUrl = fallbackVideoUrl || mainVideoUrl;

            let iconUrl = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'; // default

            if (isPointA) {
              iconUrl = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'; // Point A
            } else if (isPointB) {
              iconUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'; // Point B
            } else if (
              item.event_type === "VIDEORECORD" &&
              finalUrl
            ) {
              iconUrl = `${videoIcon}`;
            }

            return (
              <Marker
                key={item.id}
                position={position}
                icon={{
                  url: iconUrl,
                  scaledSize: new window.google.maps.Size(32, 32),
                }}
                onClick={() => {
                  if (isSelectingPoint) {
                    if (!pointA) {
                      setPointA(position);
                      updateVideoSegment(position, pointB);
                    }
                    else if (!pointB) {
                      setPointB(position);
                      setIsSelectingPoint(false);
                      setSelectionMode('pointB');
                      updateVideoSegment(pointA, position);
                    }
                  } else {
                    setSelectedMarker(item);
                  }
                }}
              />
            );
          })}

          {filteredData.length > 1 && (
            <Polyline
              path={filteredData.map(item => ({
                lat: parseFloat(item.latitude),
                lng: parseFloat(item.longitude)
              }))}
              options={{
                strokeColor: '#0000FF',
                strokeOpacity: 0.8,
                strokeWeight: 3,
                icons: [
                  {
                    icon: {
                      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                      scale: 2.5,
                      strokeOpacity: 1,
                      strokeColor: '#0000FF'
                    },
                    offset: '0%',
                    repeat: '200px'
                  }
                ]

              }}
            />
          )}
          {movingMarkerPosition && (
            <Marker
              position={movingMarkerPosition}
              icon={{
                url: 'https://maps.google.com/mapfiles/kml/shapes/motorcycling.png',
                scaledSize: new window.google.maps.Size(40, 40),
              }}
            />
          )}


          {selectedMarker && !isSelectingPoint && (
            <InfoWindow
              position={{
                lat: parseFloat(selectedMarker.latitude),
                lng: parseFloat(selectedMarker.longitude)
              }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div style={{ width: '250px', minWidth: "200" }}>
                <strong>ID:</strong> {selectedMarker.id}<br />
                <strong>Event:</strong> {selectedMarker.event_type === 'ROADCROSSING' ? selectedMarker.road_crossing?.roadCrossing : selectedMarker.event_type}<br />
                <strong>Modality:</strong> {selectedMarker.execution_modality}<br /><br />
                {selectedMarker.event_type === "VIDEORECORD" && (() => {
                  const mainVideoUrl = selectedMarker.videoUrl?.trim().replace(/(^"|"$)/g, '');
                  const fallbackVideoUrl = selectedMarker.videoDetails?.videoUrl?.trim().replace(/(^"|"$)/g, '');
                  const finalUrl = mainVideoUrl || fallbackVideoUrl;

                  if (finalUrl) {
                    return (
                      <iframe
                        width="100%"
                        height="180"
                        src={`${baseUrl}${finalUrl}`}
                        frameBorder="0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        title={`Video-${selectedMarker.id}`}
                      />
                    );
                  } else {
                    return <p>No video available.</p>;
                  }
                })()}

                {selectedMarker.event_type === "JOINTCHAMBER" && selectedMarker.jointChamberUrl ? (
                  <img
                    src={`${baseUrl}${selectedMarker.jointChamberUrl}`}
                    alt="Joint Chamber"
                    className="w-full max-h-40 object-cover mt-2"
                  />
                ) : selectedMarker.event_type === "SURVEYSTART" && selectedMarker.start_photos.length > 0 ? (
                  selectedMarker.start_photos.map((photo, index) => (
                    <img
                      key={index}
                      src={`${baseUrl}${photo}`}
                      alt={`Start ${index}`}
                      className="w-full max-h-40 object-cover mt-2"
                    />
                  ))
                ) : selectedMarker.event_type === "ENDSURVEY" && selectedMarker.end_photos.length > 0 ? (
                  selectedMarker.end_photos.map((photo, index) => (
                    <img
                      key={index}
                      src={`${baseUrl}${photo}`}
                      alt={`End ${index}`}
                      className="w-full max-h-40 object-cover mt-2"
                    />
                  ))
                ) :
                  selectedMarker.event_type === "ROADCROSSING" && selectedMarker.road_crossing?.startPhoto ? (
                    <img
                      src={`${baseUrl}${selectedMarker.road_crossing?.startPhoto}`}
                      alt="ROADCROSSING"
                      className="w-full max-h-40 object-cover mt-2"
                    />
                  ) :
                    selectedMarker.event_type === "ROADCROSSING" && selectedMarker.road_crossing?.endPhoto ? (
                      <img
                        src={`${baseUrl}${selectedMarker.road_crossing?.endPhoto}`}
                        alt="ROADCROSSING"
                        className="w-full max-h-40 object-cover mt-2"
                      />
                    ) : selectedMarker.event_type === "ALL" ? (
                      selectedMarker.jointChamberUrl ? (
                        <img
                          src={`${baseUrl}${selectedMarker.jointChamberUrl}`}
                          alt="Joint Chamber"
                          className="w-full max-h-40 object-cover mt-2"
                        />
                      ) : selectedMarker.start_photos.length > 0 ? (
                        selectedMarker.start_photos.map((photo, index) => (
                          <img
                            key={index}
                            src={`${baseUrl}${photo}`}
                            alt={`Start ${index}`}
                            className="w-full max-h-40 object-cover mt-2"
                          />
                        ))
                      ) : selectedMarker.end_photos.length > 0 ? (
                        selectedMarker.end_photos.map((photo, index) => (
                          <img
                            key={index}
                            src={`${baseUrl}${photo}`}
                            alt={`End ${index}`}
                            className="w-full max-h-40 object-cover mt-2"
                          />
                        ))
                      ) : selectedMarker.road_crossing?.startPhoto ? (
                        <img
                          src={`${baseUrl}${selectedMarker.road_crossing?.startPhoto}`}
                          alt="ROADCROSSING"
                          className="w-full max-h-40 object-cover mt-2"
                        />
                      ) : selectedMarker.road_crossing?.endPhoto ? (
                        <img
                          src={`${baseUrl}${selectedMarker.road_crossing?.endPhoto}`}
                          alt="ROADCROSSING"
                          className="w-full max-h-40 object-cover mt-2"
                        />


                      ) : (
                        <p>No image available</p>
                      )
                    ) : (
                      <p>No image available</p>
                    )}

              </div>
            </InfoWindow>
          )}

        </GoogleMap>

        <div className="absolute top-2 right-15 bg-white rounded-lg shadow-md p-3 z-10">
          <div className="text-sm font-medium mb-2">Select Video Segment</div>
          <div className="flex space-x-2">
            <button
              onClick={() => startPointSelection('A')}
              className={`px-3 py-1 text-sm rounded ${selectionMode === 'pointA' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
              disabled={selectionMode === 'pointB'}
            >
              <MapPin size={14} className="inline-block mr-1" />
              Point A
            </button>
            <button
              onClick={() => startPointSelection('B')}
              className={`px-3 py-1 text-sm rounded ${selectionMode === 'pointB' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800'}`}
              disabled={selectionMode === 'pointA' || !pointA}
            >
              <MapPin size={14} className="inline-block mr-1" />
              Point B
            </button>
            <button
              onClick={resetSelection}
              className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded"
              disabled={!pointA && !pointB}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Right side: Filters and Controls */}
      <div className={`${sidebarWidth} bg-gray-100 p-4 overflow-y-auto`}>

        <div className="mb-4 flex space-x-2 items-center">
          <div>
            <button
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded"
              onClick={() => {
                if (isFullscreen) {
                  exitFullscreen();
                  setIsFullscreen(false);
                } else {
                  enterFullscreen(containerRef.current);
                  setIsFullscreen(true);
                }
              }}
            >
              {isFullscreen ? 'Exit Full View' : 'Full View'}
            </button>
          </div>

          <div>
            <button
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded"
              onClick={() => startPointSelection('A')}
            >
              Select Video Segment
            </button>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4 text-blue-600">Video Segments</h2>

        {videoSegment && videoSegment.length > 0 && (
          <><VideoPlayer
            videoSegment={videoSegment}
            selectedvideo={videoSelected}
            baseUrl={baseUrl}
            startTime={StartTime}
            endTime={EndTime}
            onTimeUpdate={handleTimeUpdate} />
            {/* <div style={{ marginTop: '10px' }}>
              <strong>ID:</strong> {VideoDetails?.id || ''}<br />
              <strong>Event:</strong> {VideoDetails?.event_type || ''}<br />
              <strong>Modality:</strong> {VideoDetails?.execution_modality || ''}<br /><br />
            </div> */}
          </>
        )}
        {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

        <h2 className="text-xl font-bold mb-4 flex items-center text-blue-600">
          <SlidersHorizontal className="w-5 h-5 mr-2" />
          Filters
        </h2>

        {/* Event Type Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Event Type:</label>
          <select
            value={selectedEventType}
            onChange={(e) =>{ setSelectedEventType(e.target.value);setCrossingType('All')}}
            className="w-full p-2 border rounded"
          >
            {eventTypes.map((event) => (
              <option key={event} value={event}>{event}</option>
            ))}
          </select>
        </div>
        {selectedEventType === 'ROADCROSSING' && (
           <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Crossing Type:</label>
          <select
            value={CrossingType}
            onChange={(e) => setCrossingType(e.target.value)}
            className="w-full p-2 border rounded"
          >  
           <option value='All'>ALL</option>
            {Object.entries(crossingCounts).map(([type, count]) => (
              <option key={type} value={type}>
                {type} ({count})
              </option>
            ))} 
            </select>
        </div>
        )}
        {/* Execution Modality Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Execution Modality:</label>
          <select
            value={selectedModality}
            onChange={(e) => setSelectedModality(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {modalities.map((modality) => (
              <option key={modality} value={modality}>{modality}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="mb-6">
          <button
            onClick={clearFilters}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
