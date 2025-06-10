import React, { useState, useRef ,useEffect,useMemo} from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFullscreen } from '../hooks/useFullscreen';
import videoIcon from '../../images/icon/cinema.png';
// Leaflet icon fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import JointChamberIcon from '../../images/icon/icons8-hole-50.png'; 
import FPOIIcon from '../../images/icon/network.png';
import RouteIndIcon from '../../images/icon/signpost.png';
import RoadCrossingIcon from '../../images/icon/crossing-roads-perspective.png'
import BridgeIcon from '../../images/icon/road.png'
import LevelCrossingIcon from '../../images/icon/level-crossing.png'
import trainBridgeIcon from '../../images/icon/train-bridge.png'
import trainunderBridgeIcon from '../../images/icon/bridge_4325806.png'
import cauwayIcon from '../../images/icon/underpass_17942665.png'
import CulvertIcon from '../../images/icon/road-culvert-works-svgrepo-com.svg'
import LandmarkIcon from '../../images/icon/monument.png'
import FiberTurnIcon from '../../images/icon/curved-arrow.png'
import StoneIcon from '../../images/icon/icons8-milestone-50.png'


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
  fpoiUrl: string;
  routeIndicatorUrl: string;
  created_at: string;
  createdTime: string;
  video_duration?: number;
  videoDetails?: VideoDetails;
  road_crossing: RoadCrossing;
  surveyUploaded:string;
  kmtStoneUrl:string;
  landMarkUrls:string;
  fiberTurnUrl:string;
  landMarkType:string;


};


const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = `${BASEURL_Val}/public/`;

interface MapComponentProps {
  data: UnderGroundSurveyData[];
}

const MapComponent: React.FC<MapComponentProps> = ({ data }) => {

  const [selectedMarker, setSelectedMarker] = useState<UnderGroundSurveyData | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedModality, setSelectedModality] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<string>('default');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const {enterFullscreen, exitFullscreen } = useFullscreen();
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [CrossingType, setCrossingType] = useState('All');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const eventTypes = useMemo<string[]>(() => ['ALL', ...new Set(data.map(d => d.event_type))], [data]);
  const modalities = useMemo<string[]>(() => ['ALL', ...new Set(data.map(d => d.execution_modality))], [data]);
  const filteredData = useMemo<UnderGroundSurveyData[]>(() => {
  const seen = new Set<string>();
  return data
    .filter(item =>
      (selectedEventType === 'ALL' || item.event_type === selectedEventType) &&
      (selectedModality === 'ALL' || item.execution_modality === selectedModality) &&
      (CrossingType === 'All' || item.road_crossing?.roadCrossing === CrossingType) &&
       item?.surveyUploaded === "true" 
    )
    .filter(item => {
      const key = `${item.latitude}-${item.longitude}-${item.event_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}, [data, selectedEventType, selectedModality, CrossingType]);

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
      if (item.event_type === 'ROADCROSSING' && item.surveyUploaded === 'true') {
        const type = item.road_crossing?.roadCrossing;
        if (type && counts[type] !== undefined) {
          counts[type]++;
        }
      }
    });

    return counts;
  }, [data]);
  
  useEffect(() => {
    // Short delay to ensure the component is fully rendered
    const timer = setTimeout(() => {
      if (containerRef.current) {
        setSelectedEventType('LIVELOCATION')
        enterFullscreen(containerRef.current);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [enterFullscreen]);

  useEffect(() => {
  if (
    mapRef.current &&
   (selectedEventType === 'ALL'||selectedEventType === 'LIVELOCATION') &&
    filteredData.length > 1
  ) {
    const livePoints = filteredData
      .map(item => ({
        lat: parseFloat(item.latitude),
        lng: parseFloat(item.longitude),
      }));

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    polylineRef.current = new window.google.maps.Polyline({
      path: livePoints,
      strokeColor: '#0000FF',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      icons: [
        {
          icon: {
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 2.5,
            strokeOpacity: 1,
            strokeColor: '#0000FF',
          },
          offset: '0%',
          repeat: '200px',
        },
      ],
    });

    polylineRef.current.setMap(mapRef.current);
  } else {
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }
}, [selectedEventType, filteredData]);

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
            const mainVideoUrl = item.videoUrl?.trim().replace(/(^"|"$)/g, '');
            const fallbackVideoUrl = item.videoDetails?.videoUrl?.trim().replace(/(^"|"$)/g, '');
            const finalUrl = fallbackVideoUrl || mainVideoUrl;

            let iconUrl = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

            if (
              item.event_type === "VIDEORECORD" &&
              finalUrl
            ) {
              iconUrl = `${videoIcon}`;
            }else if(item.event_type === "JOINTCHAMBER"){
                 iconUrl=JointChamberIcon
            }else if(item.event_type === "FPOI"){
                   iconUrl=FPOIIcon
            }else if(item.event_type === "ROUTEINDICATOR"){
                   iconUrl=RouteIndIcon
            }else if(item.event_type === "ROADCROSSING" && item.road_crossing?.roadCrossing === 'ROADCROSSING' && (item.road_crossing?.startPhoto || item.road_crossing?.endPhoto)){
                   iconUrl=RoadCrossingIcon
            }else if(item.event_type === "ROADCROSSING" && item.road_crossing?.roadCrossing === 'BRIDGE' && (item.road_crossing?.startPhoto || item.road_crossing?.endPhoto)){
                   iconUrl=BridgeIcon
            }else if(item.event_type === "ROADCROSSING" && item.road_crossing?.roadCrossing === 'RAILUNDERBRIDGE' && (item.road_crossing?.startPhoto || item.road_crossing?.endPhoto)){
                   iconUrl=trainunderBridgeIcon
            }else if(item.event_type === "ROADCROSSING" && item.road_crossing?.roadCrossing === 'LEVELCROSSING' && (item.road_crossing?.startPhoto || item.road_crossing?.endPhoto)){
                   iconUrl=LevelCrossingIcon
            }
            else if(item.event_type === "ROADCROSSING" && item.road_crossing?.roadCrossing === 'RAILOVERBRIDGE' && (item.road_crossing?.startPhoto || item.road_crossing?.endPhoto)){
                   iconUrl=trainBridgeIcon
            } else if(item.event_type === "ROADCROSSING" && item.road_crossing?.roadCrossing === 'CAUSEWAYS' && (item.road_crossing?.startPhoto || item.road_crossing?.endPhoto)){
                   iconUrl=cauwayIcon
            }else if(item.event_type === "ROADCROSSING" && item.road_crossing?.roadCrossing === 'CULVERT' && (item.road_crossing?.startPhoto || item.road_crossing?.endPhoto)){
                   iconUrl= CulvertIcon
            }
            else if(item.event_type === "LANDMARK"){
                   iconUrl=LandmarkIcon
            }else if(item.event_type === "FIBERTURN"){
                   iconUrl=FiberTurnIcon
            }else if(item.event_type === "KILOMETERSTONE"){
                   iconUrl=StoneIcon
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
                 setSelectedMarker(item);
                }}
              />
            );
          })}
          {selectedMarker  && (
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
                    onClick={() => setZoomImage(`${baseUrl}${selectedMarker.jointChamberUrl}`)}
                  />
                 ) : selectedMarker.event_type === "FPOI" && selectedMarker.fpoiUrl ? (
                 
                    <img
                      src={`${baseUrl}${selectedMarker.fpoiUrl}`}
                      alt="FpoiUrl"
                      className="w-full max-h-40 object-cover mt-2"
                       onClick={() => setZoomImage(`${baseUrl}${selectedMarker.fpoiUrl}`)}
                    />
                  
                  ) : selectedMarker.event_type === "KILOMETERSTONE" && selectedMarker.kmtStoneUrl ? (
                 
                    <img
                      src={`${baseUrl}${selectedMarker.kmtStoneUrl}`}
                      alt="kmtStoneUrl"
                      className="w-full max-h-40 object-cover mt-2"
                       onClick={() => setZoomImage(`${baseUrl}${selectedMarker.kmtStoneUrl}`)}
                    />
                  ) : selectedMarker.event_type === "LANDMARK" && selectedMarker.landMarkUrls && selectedMarker.landMarkType !== "NONE" ? (
                 
                    <img
                      src={`${baseUrl}${selectedMarker.landMarkUrls}`}
                      alt="landMarkUrls"
                      className="w-full max-h-40 object-cover mt-2"
                       onClick={() => setZoomImage(`${baseUrl}${selectedMarker.landMarkUrls}`)}
                    />
                  ) : selectedMarker.event_type === "FIBERTURN" && selectedMarker.fiberTurnUrl  ? (
                 
                    <img
                      src={`${baseUrl}${selectedMarker.fiberTurnUrl}`}
                      alt="FIBERTURN"
                      className="w-full max-h-40 object-cover mt-2"
                       onClick={() => setZoomImage(`${baseUrl}${selectedMarker.fiberTurnUrl}`)}
                    />
                  
                ) : selectedMarker.event_type === "ROUTEINDICATOR" && selectedMarker.routeIndicatorUrl ? (
                 
                    <img
                      src={`${baseUrl}${selectedMarker.routeIndicatorUrl}`}
                      alt="RouteIndicatorUrl"
                      className="w-full max-h-40 object-cover mt-2"
                      onClick={() => setZoomImage(`${baseUrl}${selectedMarker.routeIndicatorUrl}`)}

                    />
                  
                ) : selectedMarker.event_type === "SURVEYSTART" && selectedMarker.start_photos.length > 0 ? (
                  selectedMarker.start_photos.map((photo, index) => (
                    <img
                      key={index}
                      src={`${baseUrl}${photo}`}
                      alt={`Start ${index}`}
                      className="w-full max-h-40 object-cover mt-2"
                      onClick={() => setZoomImage(`${baseUrl}${photo}`)}

                    />
                  ))
                ) : selectedMarker.event_type === "ENDSURVEY" && selectedMarker.end_photos.length > 0 ? (
                  selectedMarker.end_photos.map((photo, index) => (
                    <img
                      key={index}
                      src={`${baseUrl}${photo}`}
                      alt={`End ${index}`}
                      className="w-full max-h-40 object-cover mt-2"
                      onClick={() => setZoomImage(`${baseUrl}${photo}`)}
                    />
                  ))
                ) :
                  selectedMarker.event_type === "ROADCROSSING" && selectedMarker.road_crossing?.startPhoto ? (
                    <img
                      src={`${baseUrl}${selectedMarker.road_crossing?.startPhoto}`}
                      alt="ROADCROSSING"
                      className="w-full max-h-40 object-cover mt-2"
                      onClick={() => setZoomImage(`${baseUrl}${selectedMarker.road_crossing?.startPhoto}`)}
                    />
                  ) :
                    selectedMarker.event_type === "ROADCROSSING" && selectedMarker.road_crossing?.endPhoto ? (
                      <img
                        src={`${baseUrl}${selectedMarker.road_crossing?.endPhoto}`}
                        alt="ROADCROSSING"
                        className="w-full max-h-40 object-cover mt-2"
                        onClick={() => setZoomImage(`${baseUrl}${selectedMarker.road_crossing?.endPhoto}`)}

                      />
                    ) : selectedMarker.event_type === "ALL" ? (
                      selectedMarker.jointChamberUrl ? (
                        <img
                          src={`${baseUrl}${selectedMarker.jointChamberUrl}`}
                          alt="Joint Chamber"
                          className="w-full max-h-40 object-cover mt-2"
                          onClick={() => setZoomImage(`${baseUrl}${selectedMarker.jointChamberUrl}`)}

                        />
                       
                      ) : selectedMarker.start_photos.length > 0 ? (
                        selectedMarker.start_photos.map((photo, index) => (
                          <img
                            key={index}
                            src={`${baseUrl}${photo}`}
                            alt={`Start ${index}`}
                            className="w-full max-h-40 object-cover mt-2"
                            onClick={() => setZoomImage(`${baseUrl}${photo}`)}
                          />
                        ))
                      ) : selectedMarker.end_photos.length > 0 ? (
                        selectedMarker.end_photos.map((photo, index) => (
                          <img
                            key={index}
                            src={`${baseUrl}${photo}`}
                            alt={`End ${index}`}
                            className="w-full max-h-40 object-cover mt-2"
                            onClick={() => setZoomImage(`${baseUrl}${photo}`)}

                          />
                        ))
                      ) : selectedMarker.road_crossing?.startPhoto ? (
                        <img
                          src={`${baseUrl}${selectedMarker.road_crossing?.startPhoto}`}
                          alt="ROADCROSSING"
                          className="w-full max-h-40 object-cover mt-2"
                          onClick={() => setZoomImage(`${baseUrl}${selectedMarker.road_crossing?.startPhoto}`)}

                        />
                      ) : selectedMarker.road_crossing?.endPhoto ? (
                        <img
                          src={`${baseUrl}${selectedMarker.road_crossing?.endPhoto}`}
                          alt="ROADCROSSING"
                          className="w-full max-h-40 object-cover mt-2"
                          onClick={() => setZoomImage(`${baseUrl}${selectedMarker.road_crossing?.endPhoto}`)}

                        />
                        
                      ) : selectedMarker.fpoiUrl ? (
                        <img
                          src={`${baseUrl}${selectedMarker.fpoiUrl}`}
                          alt="fpoiUrl"
                          className="w-full max-h-40 object-cover mt-2"
                          onClick={() => setZoomImage(`${baseUrl}${selectedMarker.fpoiUrl}`)}

                        />
                        ) : selectedMarker.kmtStoneUrl ? (
                        <img
                          src={`${baseUrl}${selectedMarker.kmtStoneUrl}`}
                          alt="kmtStoneUrl"
                          className="w-full max-h-40 object-cover mt-2"
                          onClick={() => setZoomImage(`${baseUrl}${selectedMarker.kmtStoneUrl}`)}

                        />
                        ) : selectedMarker.landMarkUrls && selectedMarker.landMarkType !== "NONE" ? (
                        <img
                          src={`${baseUrl}${selectedMarker.landMarkUrls}`}
                          alt="landMarkUrls"
                          className="w-full max-h-40 object-cover mt-2"
                          onClick={() => setZoomImage(`${baseUrl}${selectedMarker.landMarkUrls}`)}

                        />
                        ) : selectedMarker.fiberTurnUrl ? (
                        <img
                          src={`${baseUrl}${selectedMarker.fiberTurnUrl}`}
                          alt="fiberTurnUrl"
                          className="w-full max-h-40 object-cover mt-2"
                          onClick={() => setZoomImage(`${baseUrl}${selectedMarker.fiberTurnUrl}`)}

                        />
                        ) : selectedMarker.routeIndicatorUrl ? (
                        <img
                          src={`${baseUrl}${selectedMarker.routeIndicatorUrl}`}
                          alt="RouteIndicatorUrl"
                          className="w-full max-h-40 object-cover mt-2"
                          onClick={() => setZoomImage(`${baseUrl}${selectedMarker.routeIndicatorUrl}`)}

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

     </div>
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
          </div>
           <h2 className="text-xl font-bold mb-4 flex items-center text-blue-600">
          <SlidersHorizontal className="w-5 h-5 mr-2" />
          Filters
        </h2>

        {/* Event Type Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Event Type:</label>
          <select
            value={selectedEventType}
            onChange={(e) => { setSelectedEventType(e.target.value); setCrossingType('All') }}
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
