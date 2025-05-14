import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useAppContext } from './AppContext';
import { MapStyles } from './MapStyles';
import { mapMarkers } from './mapMarkers';

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center position
const center = {
  lat: 17.4484,
  lng: 78.3741
};

type GPSPoint = {
  name: string;
  coordinates: [number, number]; 
  properties?: {
    icon?: string;
    remarks?: string;
    type?: string;
  };
};

type PointType = {
  name: string;
  coordinates: [number, number];
  styleUrl?: string;
  properties: Record<string, any>;
};


type GPSResponse = {
  points: GPSPoint[];
};

type MarkerInfo = {
  position: { lat: number; lng: number };
  title: string;
  description: string;
};

type Connection = {
  start: string;
  end: string;
  length: number;
  name: string;
  coordinates: [number, number][]; 
  color?: string;
  existing?: boolean;
};


type DistanceLabelProps = {
  position: google.maps.LatLngLiteral;
  text: string;
};


const DistanceLabel = ({ position, text }: DistanceLabelProps) => {
  return (
    <OverlayView
      position={position}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
    >
      <div className="bg-black text-white text-[10px] font-semibold text-nowrap px-6 py-[2px] rounded shadow">
        <span className='-ml-5'>{text}</span>
      </div>
    </OverlayView>
  );
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

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];
const colors = ['gray', 'blue', 'green'];

const MapComponent: React.FC = () => {
  const { transportMode ,apiGPSResponse,apiConctResponse,setPointProperties,AutoMode,setAutoMode} = useAppContext();
  const [selectedMarker, setSelectedMarker] = useState<MarkerInfo | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [distanceInfoWindows, setDistanceInfoWindows] = useState<
    { position: google.maps.LatLngLiteral; distance: number }[]
  >([]);
  const [pointA, setPointA] = useState<google.maps.LatLngLiteral | null>(null);
  const [pointB, setPointB] = useState<google.maps.LatLngLiteral | null>(null);
  const [pointAName, setPointAName] = useState<string>('');
  const [pointBName, setPointBName] = useState<string>('');
  const [routeGroups, setRouteGroups] = useState<Map<string, { layers: google.maps.Polyline[] }>>(new Map());
  const [polylineHistory, setPolylineHistory] = useState(new Map());
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);




  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyCPHNQoyCkDJ3kOdYZAjZElbhXuJvx-Odg',
    // libraries,
  });

    // Callback when map loads - moved outside conditional block
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    setMapInstance(map);

  }, []);

  // Callback when map unmounts - moved outside conditional block
  const onUnmount = useCallback(() => {
    setMap(null);
    setMapInstance(null);

  }, []);

useEffect(() => {
  if (apiGPSResponse?.points?.length && map) {
    setPointProperties(apiGPSResponse?.points[0])
    const bounds = new window.google.maps.LatLngBounds();
     
    (apiGPSResponse.points as PointType[]).forEach((point) => {
      if (
        Array.isArray(point.coordinates) &&
        point.coordinates.length === 2 &&
        typeof point.coordinates[0] === 'number' &&
        typeof point.coordinates[1] === 'number'
      ) {
        bounds.extend({ lat: point.coordinates[1], lng: point.coordinates[0] });
      }
    });

    map.fitBounds(bounds);
  }
}, [apiGPSResponse, map]);

useEffect(() => {
  if (!map || !apiConctResponse?.connections?.length) return;

  const bounds = new window.google.maps.LatLngBounds();

  apiConctResponse.connections.forEach((connection: Connection) => {
    if (!Array.isArray(connection.coordinates) || connection.coordinates.length < 2) {
      console.warn(`Skipping invalid connection: ${connection.name}`);
      return;
    }

    const path = connection.coordinates.map(([lng, lat]) => {
      const point = { lat, lng };
      bounds.extend(point);
      return point;
    });

    const polyline = new window.google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: connection.color || "#00AA00",
      strokeOpacity: 1.0,
      strokeWeight: 4,
    });

    polyline.setMap(map);

    //Add distance label
    const offsetIndex = Math.floor(path.length * 0.5); // middle point
    const midPoint = path[offsetIndex];
   
    setDistanceInfoWindows(prev => [
    ...prev,
    {
      position: midPoint,
      distance: connection.length || 0,
    },
  ]);

 
  });

  map.fitBounds(bounds);
}, [apiConctResponse, map]);


 const HandleCalculation = async () => {
    if (!pointA || !pointB || !pointAName || !pointBName || !mapInstance) return;

    const url = `http://traceapi.keeshondcoin.com/show-route?lat1=${pointA.lat}&lng1=${pointA.lng}&lat2=${pointB.lat}&lng2=${pointB.lng}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const routes = Array.isArray(data) ? data.slice(0, 3) : [data];
      const routeKey = `${pointAName}-${pointBName}`;

      // Clear existing layers
      if(routeGroups.has(routeKey)) {
        routeGroups.get(routeKey)!.layers.forEach((layer: google.maps.Polyline) => layer.setMap(null));
        routeGroups.delete(routeKey);
      }


      const newRouteLayers: (google.maps.Polyline | google.maps.InfoWindow)[] = [];
      const newInfoWindows: { position: google.maps.LatLngLiteral; distance: number }[] = [];
      const bounds = new google.maps.LatLngBounds();

      routes.forEach((routeData, index) => {
        if (Array.isArray(routeData.route)) {
          const path = routeData.route.map((coord: [number, number]) => ({
            lat: coord[0],
            lng: coord[1],
          }));

          const polyline = new google.maps.Polyline({
            path,
            strokeColor: colors[index],
            strokeOpacity: 0.8,
            strokeWeight: 6,
            map: mapInstance,
          });

          polyline.addListener('click', () => {
            console.log(`Route ${index + 1} clicked`);
          });

          newRouteLayers.push(polyline);

          const offsetPoint = path[Math.floor(path.length * 0.25)];
          const distanceLabel = new google.maps.InfoWindow({
            content: `<div class="distance-label">${routeData.distance.toFixed(2)} km</div>`,
            position: offsetPoint,
          });
          distanceLabel.open(mapInstance);
          newRouteLayers.push(distanceLabel);

          newInfoWindows.push({
            position: offsetPoint,
            distance: routeData.distance,
          });

          const segmentKey = `${routeKey}-route${index + 1}`;
          polylineHistory.set(segmentKey, {
            polyline,
            segmentData: {
              connection: {
                length: routeData.distance,
                existing: false,
                color: colors[index],
              },
            },
            distanceLabel,
          });

          path.forEach(p => bounds.extend(p));
        }
      });

      routeGroups.set(routeKey, { layers: newRouteLayers });
      setDistanceInfoWindows(prev => [...prev, ...newInfoWindows]);
      mapInstance.fitBounds(bounds);
    } catch (err) {
      console.error(err);
    }
  };



  // Initialize places autocomplete - moved outside conditional block
  React.useEffect(() => {
    if (!isLoaded || !map || !window.google?.maps?.places) return;

    const input = document.getElementById('map-search') as HTMLInputElement;
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        return;
      }
      
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }
    });

    return () => {
      // Cleanup listener if needed
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [map, isLoaded]); // Added proper dependencies

  if (loadError) return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center text-red-600">
        Error loading map. Please try again later.
      </div>
    </div>
  );

  if (!isLoaded) return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-800 mx-auto mb-4"></div>
        <p className="text-gray-700 text-lg">Loading map...</p>
      </div>
    </div>
  );

  return (
    <div className="relative h-full w-full">
      {/* Search Box */}
      <div className="absolute top-4 left-0 right-0 mx-auto w-11/12 sm:w-96 z-10">
        <div className="relative">
          <input
            id="map-search"
            type="text"
            placeholder="Find a place"
            className={`w-full px-4 py-2 pr-10 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              showSearch ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } transition-opacity duration-300`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <button 
            className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? '×' : '🔍'}
          </button>
        </div>
      </div>

      {/* Google Map Component */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: MapStyles,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        }}
      >
        {/* Markers */}
       {apiGPSResponse?.points?.map((point: GPSPoint, index: number) => {
            const position = {
                  lat: (point.coordinates[1]),
                  lng: (point.coordinates[0]),
                };
            const isPointA = pointA && isSameCoordinate(pointA, position);
            const isPointB = pointB && isSameCoordinate(pointB, position);
             
            let iconUrl =   point?.properties?.icon || 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'

            if(isPointA) {
              iconUrl = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'; // Point A
            } else if (isPointB) {
              iconUrl = 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'; // Point B
            }
          

        return(
        <Marker
          key={index}
          position={{ lat: point.coordinates[1], lng: point.coordinates[0] }}
          icon={{
            url:iconUrl,
            scaledSize: new window.google.maps.Size(30, 30),
          }}
          onClick={() =>
          { 
            
            setPointProperties(point);
            if(AutoMode){
              if(!pointA){
              setPointAName(point.name)
               setPointA(position)
              }else if(!pointB){
                setPointBName(point.name)
                setPointB(position);
              }
            }
           
           
          }
          }
        />
        )
      })}


        {/* Info Window for Selected Marker */}
        {/* {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-medium text-blue-800">{selectedMarker.title}</h3>
              <p className="text-sm text-gray-600">{selectedMarker.description}</p>
            </div>
          </InfoWindow>
        )} */}
     
        {distanceInfoWindows.map((info, idx) => (
          <DistanceLabel
            key={idx}
            position={info.position}
            text={`${info.distance.toFixed(2)} km`}
          />
        ))}
        {AutoMode && (
        <div className="absolute top-15 right-4 z-50 bg-blue-800 text-white rounded-lg shadow-lg w-96 overflow-hidden">
          {/* Header */}
          <div className="bg-white text-blue-800 flex justify-between items-center px-4 py-3">
            <h2 className="text-lg font-semibold">Route Selection</h2>
            <button className="text-blue-800 hover:text-blue-600 text-xl font-bold" onClick={()=>setAutoMode(false)}>&times;</button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-2">
            <p><span className="font-bold">Start:</span> <span className="text-gray-200">{pointA ? `${pointAName} (${pointA.lat}, ${pointA.lng})` : 'Not Selected'}</span></p>
            <p><span className="font-bold">End:</span> <span className="text-gray-200">{pointB ? `${pointBName} (${pointB.lat},${pointB.lng})` : 'Not Selected'}</span></p>

            <div className="flex gap-2 pt-2">
              <button className="flex-1 bg-white text-black py-2 px-3 rounded-md font-medium flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!pointA || !pointB} onClick={HandleCalculation}>
                🧭 Calculate Route
              </button>
              <button className="flex-1 bg-white text-black py-2 px-3 rounded-md font-medium flex items-center justify-center hover:bg-gray-100" onClick={()=>{setPointA(null);setPointB(null)}}>
                🗑️ Delete Route
              </button>
            </div>
          </div>
        </div>

        )}

      </GoogleMap>

    </div>
    
  );
};

export default MapComponent;

export { MapComponent }