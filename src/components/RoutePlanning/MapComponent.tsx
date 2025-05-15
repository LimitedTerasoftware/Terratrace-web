import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader, OverlayView } from '@react-google-maps/api';
import { useAppContext } from './AppContext';
import { MapStyles } from './MapStyles';
import { mapMarkers } from './mapMarkers';
import axios from 'axios';

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
function computePathDistance(path: { lat: number; lng: number }[]): number {
  if (path.length < 2) return 0;

  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    total += haversineDistance(path[i], path[i + 1]);
  }

  return total;
}

function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // km
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;

  const aVal = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
}


function getLatLng(pos) {
  // If it's a google.maps.LatLng object
  if (pos && typeof pos.lat === 'function' && typeof pos.lng === 'function') {
    return { lat: pos.lat(), lng: pos.lng() };
  }
  // If it's a plain object with lat/lng properties as numbers
  if (
    pos &&
    typeof pos.lat === 'number' &&
    typeof pos.lng === 'number'
  ) {
    return pos;
  }
  // Unknown format
  return null;
}

function isSamePosition(pos1, pos2, precision = 6) {
  const p1 = getLatLng(pos1);
  const p2 = getLatLng(pos2);

  if (!p1 || !p2) {
    console.warn('Invalid position(s) provided:', pos1, pos2);
    return false;
  }

  // Compare with fixed decimal precision
  return (
    Number(p1.lat.toFixed(precision)) === Number(p2.lat.toFixed(precision)) &&
    Number(p1.lng.toFixed(precision)) === Number(p2.lng.toFixed(precision))
  );
}





const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"];
const colors = ['gray', 'blue', 'green'];

const MapComponent: React.FC = () => {
  const { transportMode, apiGPSResponse, apiConctResponse, setPointProperties, AutoMode, setAutoMode } = useAppContext();
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
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [editMarkers, setEditMarkers] = useState<google.maps.Marker[]>([]);
  const [globalData, setGlobalData] = useState<any>('');
  const [existingDistance, setExistingDistance] = useState<number>(0);
  const [proposedDistance, setProposedDistance] = useState<number>(0);






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
    let totalExisting = 0;

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
    totalExisting += connection.length || 0;


    });
    setExistingDistance(totalExisting);

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
      if (routeGroups.has(routeKey)) {
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
            strokeWeight: selectedRouteIndex === index ? 8 : 4,
            zIndex: selectedRouteIndex === index ? 999 : 1,
            map: mapInstance,
          });

          polyline.addListener("click", () => {
            handleRouteSelection(routeKey, index);

            setSelectedRouteIndex(index);
          });
          polyline.addListener("mouseover", () => {
            polyline.setOptions({ strokeWeight: 6 });
          });
          polyline.addListener("mouseout", () => {
            polyline.setOptions({ strokeWeight: selectedRouteIndex === index ? 8 : 4 });
          });
          newRouteLayers.push(polyline);

          const offsetPoint = path[Math.floor(path.length * 0.25)];
          const distanceLabel = new google.maps.InfoWindow({
            content: `<div class="distance-label">${routeData.distance.toFixed(2)} km</div>`,
            position: offsetPoint,
          });
          // distanceLabel.open(mapInstance);
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


  useEffect(() => {
    if (selectedRouteIndex === null || !routeGroups || !mapInstance) return;

    routeGroups.forEach(({ layers }, key) => {
      layers.forEach(layer => {
        if (layer instanceof google.maps.Polyline) {
          const isSelected =
            polylineHistory.get(`${key}-route${selectedRouteIndex + 1}`)?.polyline === layer;

          layer.setOptions({
            strokeWeight: isSelected ? 8 : 4,
            strokeColor: isSelected ? "#FF0000" : (layer.get("strokeColor") || "#00AA00"),
            zIndex: isSelected ? 1000 : 1,
          });
        }
      });
    });
  }, [selectedRouteIndex]);


  const addDragMarkersWithRerouting = (polyline: google.maps.Polyline, routeKey: string) => {
    const path = polyline.getPath().getArray();
    const fractions = [0.25, 0.5, 0.75];

    const newMarkers: google.maps.Marker[] = [];

    fractions.forEach((f, index) => {
      const pointIndex = Math.floor(path.length * f);
      const coord = path[pointIndex];
      if (!coord) return;

      const marker = new google.maps.Marker({
        position: coord,
        map: mapInstance,
        draggable: true,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' +
            encodeURIComponent(`
            <svg width="12" height="12" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6" r="5" fill="#00FFFF" stroke="white" stroke-width="1"/>
            </svg>`),
          scaledSize: new google.maps.Size(12, 12),
        },
        zIndex: 999 + index,
      });

      marker.addListener('dragend', async (e) => {
        const newCoord = e.latLng;
        const start = path[0];
        const end = path[path.length - 1];
        // const routeUrl = `http://router.project-osrm.org/route/v1/driving/${start.lng()},${start.lat()};${newCoord.lng()},${newCoord.lat()};${end.lng()},${end.lat()}?overview=full&geometries=geojson`;

        try {
          const res = await axios.post('http://traceapi.keeshondcoin.com/compute-route', {
            newPos: newCoord,
            origin: start,
            destination: end
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          const data = res.data;
          if (data[0].route.length > 0) {
            const newCoordsRaw = data[0].route
            const newCoords = newCoordsRaw.map(([lat, lng]) => ({ lat, lng }));

            polyline.setPath(newCoords);

            // Reposition drag markers
            const updatedPath = polyline.getPath().getArray();
            const updatedFractions = [0.25, 0.5, 0.75];
            newMarkers.forEach((m, idx) => {
              const i = Math.floor(updatedPath.length * updatedFractions[idx]);
              const pos = updatedPath[i];
              if (pos) m.setPosition(pos);
            });


            const distanceKm = data[0].distance ;
            const updatedCoords = updatedPath; // or data.routes[0].geometry.coordinates.map

            const offsetIndex = Math.floor(updatedCoords.length * 0.25);
            const offsetPoint = updatedCoords[offsetIndex] || updatedCoords[Math.floor(updatedCoords.length / 2)];


            let entry = Array.from(polylineHistory.entries()).find(([key]) =>
              key.startsWith(`${routeKey}-route`)
            );

            let infoWindow = entry?.[1]?.distanceLabel;
            const oldKey = entry?.[0];

            let oldPos: google.maps.LatLng | null = null;

            if (infoWindow) {
              oldPos = infoWindow.getPosition();
              infoWindow.close();
            }

            // Always create a new InfoWindow (since the path changed)
            infoWindow = new google.maps.InfoWindow({
              content: `<div class="distance-label">${distanceKm.toFixed(2)} km</div>`,
              position: offsetPoint,
            });
            // infoWindow.open(mapInstance);

            // Update polylineHistory with the new InfoWindow
            if (oldKey) {
              polylineHistory.set(oldKey, {
                ...(polylineHistory.get(oldKey) ?? {}),
                polyline,
                distanceLabel: infoWindow,
              });
            }

            // Remove old one from state
            setDistanceInfoWindows(prev =>
              prev.filter(
                d =>
                  !oldPos ||
                  Math.abs(d.position.lat - oldPos.lat()) > 1e-6 ||
                  Math.abs(d.position.lng - oldPos.lng()) > 1e-6
              )
            );

            // Add the new one
            setDistanceInfoWindows(prev => [
              ...prev,
              { position: offsetPoint, distance: distanceKm },
            ]);


            // Update global state
            updateRouteSummary(polyline);
            updateGlobalDataWithSelectedRoute(polyline, routeKey, 0); // assume index 0 if rerouted
          } else {
            alert("No route found");
          }
        } catch (err) {
          console.error("Rerouting failed", err);
        }
      });

      newMarkers.push(marker);
    });

    setEditMarkers(newMarkers); // store for cleanup later
  };

  const handleRouteSelection = (routeKey: string, selectedIndex: number) => {
    const selectedId = `${routeKey}-route${selectedIndex + 1}`;
    const selectedEntry = polylineHistory.get(selectedId);
    if (!selectedEntry || !selectedEntry.polyline) return;

    const selectedPolyline = selectedEntry.polyline;
    setPointA(null)
    setPointB(null)
    // Remove other optional routes and their distance labels
    const group = routeGroups.get(routeKey);
    const toRemovePositions: google.maps.LatLng[] = [];

    let routeCounter = 0;

    group?.layers.forEach((layer) => {
      if (!(layer instanceof google.maps.Polyline)) return;

      const currentKey = `${routeKey}-route${routeCounter + 1}`;
      const isSelected = currentKey === selectedId;

      if (!isSelected) {
        // Remove non-selected polyline

        layer.setMap(null);
        
        // Collect distanceLabel position to be removed
        const entry = polylineHistory.get(currentKey);

        if (entry?.distanceLabel) {
          entry.distanceLabel.close();
          const pos = entry.distanceLabel.getPosition();
          if (pos) toRemovePositions.push(pos);
        }
      }

      routeCounter++; // Only increment when it's a polyline
    });




    // Filter out only those InfoWindows that match the removed ones
    setDistanceInfoWindows(prev =>
      prev.filter(d =>
        !toRemovePositions.some(pos =>
          Math.abs(d.position.lat - pos.lat()) < 1e-6 &&
          Math.abs(d.position.lng - pos.lng()) < 1e-6
        )
      )
    );



    // Keep selected InfoWindow open
    // if (selectedEntry.distanceLabel) {
    //   selectedEntry.distanceLabel.open(mapInstance);
    // }

    // Enable editing with draggable midpoints
    addDragMarkersWithRerouting(selectedPolyline, routeKey);

    // Show summary and update global state
    updateRouteSummary(selectedPolyline);
    updateGlobalDataWithSelectedRoute(selectedPolyline, routeKey, selectedIndex);
  };


  const updateRouteSummary = (polyline: google.maps.Polyline) => {
    const path = polyline.getPath();
    let totalDistance = 0;

    for (let i = 1; i < path.getLength(); i++) {
      const p1 = path.getAt(i - 1);
      const p2 = path.getAt(i);
      totalDistance += google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
    }

    const summary = {
      distanceKm: (totalDistance / 1000).toFixed(2),
      points: path.getArray().map(p => ({ lat: p.lat(), lng: p.lng() })),
    };
    setProposedDistance(Number(summary.distanceKm))
    console.log("Route Summary:", summary);

    // Optionally display in a custom div or popup
    // setSelectedRouteSummary(summary);
  };
  const updateGlobalDataWithSelectedRoute = (
    polyline: google.maps.Polyline,
    routeKey: string,
    index: number
  ) => {
    const path = polyline.getPath().getArray().map(p => ({
      lat: p.lat(),
      lng: p.lng()
    }));

    setGlobalData(prev => ({
      ...prev,
      selectedRoutes: {
        ...prev.selectedRoutes,
        [routeKey]: {
          routeIndex: index,
          path,
          distance: computePathDistance(path),
          edited: true,
        }
      }
    }));
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
            className={`w-full px-4 py-2 pr-10 rounded-md border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${showSearch ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
          const isPointSame = pointA && !pointB && isSameCoordinate(pointA, position);

            return (
            <Marker
              key={index}
              position={{ lat: point.coordinates[1], lng: point.coordinates[0] }}
              icon={{
                url:point?.properties?.icon || 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
                scaledSize: new window.google.maps.Size(30, 30),
              }}
              onClick={() => {

                setPointProperties(point);
                if (AutoMode) {
                  if (!pointA) {
                    setPointAName(point.name)
                    setPointA(position)
                  } else if (!pointB && !isPointSame) {
      
                    setPointBName(point.name)
                    setPointB(position);
                  }
                }


              }
              }
            />
          )
        })}


       

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
              <button className="text-blue-800 hover:text-blue-600 text-xl font-bold" onClick={() => setAutoMode(false)}>&times;</button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2">
              <p><span className="font-bold">Start:</span> <span className="text-gray-200">{pointA ? `${pointAName} (${pointA.lat}, ${pointA.lng})` : 'Not Selected'}</span></p>
              <p><span className="font-bold">End:</span> <span className="text-gray-200">{pointB ? `${pointBName} (${pointB.lat},${pointB.lng})` : 'Not Selected'}</span></p>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-white text-black py-2 px-3 rounded-md font-medium flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!pointA || !pointB} onClick={HandleCalculation}>
                  🧭 Calculate Route
                </button>
                <button className="flex-1 bg-white text-black py-2 px-3 rounded-md font-medium flex items-center justify-center hover:bg-gray-100" onClick={() => { setPointA(null); setPointB(null) }}>
                  🗑️ Delete Route
                </button>
              </div>
            </div>
          </div>

        )}

        <div className="absolute top-20 left-4 z-50 overflow-hidden">
        <div className="p-3 rounded-lg shadow-md bg-white w-48 font-sans text-sm text-gray-800">
          <strong className="text-base block mb-2 font-semibold">
            Line Summary
          </strong>

          <div className="mb-1.5 flex items-center">
            <div className="w-5 h-1 rounded-sm mr-2" style={{ backgroundColor: '#0f0' }}></div>
            Existing Lines: {existingDistance.toFixed(2)}km
          </div>

          <div className="mb-2.5 flex items-center">
            <div className="w-5 h-1 rounded-sm mr-2" style={{ backgroundColor: '#f00' }}></div>
            Proposed Lines: {proposedDistance.toFixed(2)}km
          </div>

          <button
            // onClick={onUndo}
            className="px-3 py-1.5 bg-gray-300 rounded cursor-pointer font-bold border-none"
          >
            Undo
          </button>
        </div>
        </div>

  

      </GoogleMap>

    </div>

  );
};

export default MapComponent;

export { MapComponent }