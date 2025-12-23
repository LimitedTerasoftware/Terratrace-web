import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { AerialSurveyDetails, MapFilters as MapFiltersType } from "../../types/aerial-survey";
import {
  parseCoordinates,
  getMidpoint,
  calculateBounds,
  getSurveyColor,
  createMarkerIcon
} from '../../utils/map-helpers';
import MapFilters from './MapFilters';
import InfoWindowContent from './InfoWindowContent';
import { Loader2 } from 'lucide-react';

interface AerialSurveyMapProps {
  surveys: AerialSurveyDetails[];
}

interface ActiveInfoWindow {
  position: google.maps.LatLngLiteral;
  type: 'start' | 'end' | 'pole' | 'crossing' | 'polyline';
  data: any;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629,
};

export default function AerialSurveyMap({ surveys }: AerialSurveyMapProps) {
 
  const [mapReady, setMapReady] = useState(false);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<ActiveInfoWindow | null>(null);
  const [filters, setFilters] = useState<MapFiltersType>({
    showStartEndGP: true,
    showPoles: true,
    showCrossings: true,
    showPolylines: true,
  });

  const markers = useMemo(() => {
    const allMarkers: Array<{
      position: google.maps.LatLngLiteral;
      type: 'start' | 'end' | 'pole' | 'crossing';
      data: any;
      surveyId: number;
    }> = [];

    surveys.forEach(survey => {
      if (filters.showStartEndGP) {
        const startCoords = parseCoordinates(survey.startGpCoordinates);
        if (startCoords) {
          allMarkers.push({
            position: startCoords,
            type: 'start',
            data: {
              name: survey.startGpName,
              coordinates: survey.startGpCoordinates,
              photos: survey.startGpPhotos,
            },
            surveyId: survey.id,
          });
        }

        const endCoords = parseCoordinates(survey.endGpCoordinates);
        if (endCoords) {
          allMarkers.push({
            position: endCoords,
            type: 'end',
            data: {
              name: survey.endGpName,
              coordinates: survey.endGpCoordinates,
              photos: survey.endGpPhotos,
            },
            surveyId: survey.id,
          });
        }
      }

      if (filters.showPoles && survey.aerial_poles) {
        survey.aerial_poles.forEach(pole => {
          const poleCoords = parseCoordinates(`${pole.lattitude},${pole.longitude}`);
          if (poleCoords) {
            allMarkers.push({
              position: poleCoords,
              type: 'pole',
              data: pole,
              surveyId: survey.id,
            });
          }
        });
      }

      if (filters.showCrossings && survey.aerial_road_crossings) {
        survey.aerial_road_crossings.forEach(crossing => {
          const startCoords = parseCoordinates(`${crossing.slattitude},${crossing.slongitude}`);
          const endCoords = parseCoordinates(`${crossing.elattitude},${crossing.elongitude}`);
          if (startCoords && endCoords) {
            const midpoint = getMidpoint(startCoords, endCoords);
            allMarkers.push({
              position: midpoint,
              type: 'crossing',
              data: crossing,
              surveyId: survey.id,
            });
          }
        });
      }
    });

    return allMarkers;
  }, [surveys, filters]);

//   const polylines = useMemo(() => {
//   if (!filters.showPolylines) return [];

//   return surveys.map((survey, index) => {
//     const path: google.maps.LatLngLiteral[] = [];

//     // Start GP
//     const startCoords = parseCoordinates(survey.startGpCoordinates);
//     if (startCoords && filters.showStartEndGP) path.push(startCoords);

//     //  Poles
//     if (survey.aerial_poles?.length) {
//       survey.aerial_poles.forEach(pole => {
//         const poleCoords = parseCoordinates(
//           `${pole.lattitude},${pole.longitude}`
//         );
//         if (poleCoords && filters.showPoles) path.push(poleCoords);
//       });
//     }

//     //   crossings (use midpoint)
//     if (survey.aerial_road_crossings?.length) {
//       survey.aerial_road_crossings.forEach(crossing => {
//         const start = parseCoordinates(
//           `${crossing.slattitude},${crossing.slongitude}`
//         );
//         const end = parseCoordinates(
//           `${crossing.elattitude},${crossing.elongitude}`
//         );

//         if (start && end && filters.showCrossings ) {
//           path.push(getMidpoint(start, end));
//         }
//       });
//     }

//     // 4 End GP
//     const endCoords = parseCoordinates(survey.endGpCoordinates);
//     if (endCoords && filters.showStartEndGP) path.push(endCoords);

//     // Need at least 2 points to draw polyline
//     if (path.length < 2) return null;

//     return {
//       path,
//       color: getSurveyColor(index),
//       surveyId: survey.id,
//       surveyName: `${survey.startGpName} → ${survey.endGpName}`,
//     };
//   }).filter(Boolean);
// }, [surveys, filters]);

const polylines = useMemo(() => {
  if (!filters.showPolylines || !filters.showPoles) return [];

  return surveys
    .map((survey, index) => {
      const path: google.maps.LatLngLiteral[] = [];

      if (survey.aerial_poles?.length) {
        survey.aerial_poles.forEach(pole => {
          const poleCoords = parseCoordinates(
            `${pole.lattitude},${pole.longitude}`
          );
          if (poleCoords) path.push(poleCoords);
        });
      }

      // Need minimum 2 points
      if (path.length < 2) return null;

      return {
        path,
        color: getSurveyColor(index),
        surveyId: survey.id,
        surveyName: `${survey.startGpName} → ${survey.endGpName}`,
      };
    })
    .filter(Boolean);
}, [
  surveys,
  filters.showPolylines,
  filters.showPoles
]);



  const onLoad = useCallback((map: google.maps.Map) => {
  setMap(map);

  // wait till map is fully idle
  google.maps.event.addListenerOnce(map, 'idle', () => {
    setMapReady(true);
  });
}, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

 useEffect(() => {
  if (map && surveys.length > 0) {
    const bounds = calculateBounds(surveys);
    if (bounds) {
      map.fitBounds(bounds);
    }
  }
}, [map, surveys]);
useEffect(() => {
  if (!filters.showPolylines && activeInfoWindow?.type === 'polyline') {
    setActiveInfoWindow(null);
  }
}, [filters.showPolylines]);


   const GoogleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GoogleKey,
  });
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error loading Google Maps</p>
          <p className="text-sm text-red-500 mt-1">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-2">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-10">
        <MapFilters
          filters={filters}
          onFilterChange={setFilters}
          surveyCount={surveys.length}
        />
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
        }}
      >
        {mapReady && markers.map((marker, index) => (

       
          <Marker
            key={`${marker.type}-${marker.surveyId}-${index}`}
            position={marker.position}
            icon={createMarkerIcon(marker.type)}
            onClick={() => setActiveInfoWindow({
              position: marker.position,
              type: marker.type,
              data: marker.data,
            })}
          />
        ))}

      {mapReady && filters.showPolylines && polylines.map((polyline, index) => (


          polyline && (
            <Polyline
              key={`polyline-${filters.showPolylines}-${polyline.surveyId}-${index}`}

              path={polyline.path}
              options={{
                strokeColor: polyline.color,
                strokeOpacity: 0.8,
                strokeWeight: 4,
                geodesic: true,
              }}
              onClick={(e) => {
                if (e.latLng) {
                  setActiveInfoWindow({
                    position: { lat: e.latLng.lat(), lng: e.latLng.lng() },
                    type: 'polyline',
                    data: {
                      surveyId: polyline.surveyId,
                      surveyName: polyline.surveyName,
                    },
                  });
                }
              }}
            />
          )
        ))}

        {activeInfoWindow && (
          <InfoWindow
            position={activeInfoWindow.position}
            onCloseClick={() => setActiveInfoWindow(null)}
          >
            {activeInfoWindow.type === 'polyline' ? (
              <div className="p-2">
                <p className="text-sm font-semibold">Survey Route</p>
                <p className="text-xs text-gray-600">{activeInfoWindow.data.surveyName}</p>
                <p className="text-xs text-gray-500">ID: {activeInfoWindow.data.surveyId}</p>
              </div>
            ) : (
              <InfoWindowContent type={activeInfoWindow.type} data={activeInfoWindow.data} />
            )}
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
