import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF as Marker, InfoWindowF as InfoWindow } from '@react-google-maps/api';
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
import { Loader2, Undo2, Save, RotateCcw, GripVertical } from 'lucide-react';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

interface AerialSurveyMapProps {
  surveys: AerialSurveyDetails[];
  /** Enable pole dragging (only honoured when exactly one survey is shown) */
  editable?: boolean;
  /** Called after dragged positions are saved successfully */
  onPositionsSaved?: () => void;
  /** API endpoint to POST pole-position changes to */
  submitApiUrl?: string;
}

/** One entry in the undo stack */
interface DragChange {
  key: string;
  prev: google.maps.LatLngLiteral;
  next: google.maps.LatLngLiteral;
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

export default function AerialSurveyMap({
  surveys,
  editable = false,
  onPositionsSaved,
  submitApiUrl = `${TraceBASEURL}/poles/update-pole-survey`,
}: AerialSurveyMapProps) {

  const [mapReady, setMapReady] = useState(false);
  // Dragging is allowed for a single survey only — never on the multi-survey map
  const canDrag = editable && surveys.length === 1;

  // Position overrides after drag, keyed by `${type}-${id}`
  const [overrides, setOverrides] = useState<Record<string, google.maps.LatLngLiteral>>({});
  const [undoStack, setUndoStack] = useState<DragChange[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fittedMapRef = useRef<google.maps.Map | null>(null);

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
      id:number;
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
              photos: survey.startGpPhotos
             
            },
            surveyId: survey.id,
            id:survey.id
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
            id:survey.id
            
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
              id:pole.id

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
              id:crossing.id
              
            });
          }
        });
      }
    });

    return allMarkers.map(m => {
      const ov = overrides[`${m.type}-${m.id}`];
      return ov ? { ...m, position: ov, moved: true } : { ...m, moved: false };
    });
  }, [surveys, filters, overrides]);

  // Markers whose net position differs from the original data
  const changedMarkers = useMemo(() => {
    if (!canDrag) return [];
    const survey = surveys[0];
    const result: Array<{ id: number; position: google.maps.LatLngLiteral }> = [];
    Object.entries(overrides).forEach(([key, position]) => {
      // Only poles are draggable, keys are `pole-${id}`
      const id = Number(key.split('-')[1]);
      const pole = survey.aerial_poles?.find(p => p.id === id);
      const original = pole ? parseCoordinates(`${pole.lattitude},${pole.longitude}`) : null;
      if (!original || original.lat !== position.lat || original.lng !== position.lng) {
        result.push({ id, position });
      }
    });
    return result;
  }, [overrides, surveys, canDrag]);

  const handleDragEnd = (key: string, prev: google.maps.LatLngLiteral, e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setUndoStack(stack => [...stack, { key, prev, next }]);
    setOverrides(o => ({ ...o, [key]: next }));
    setSaveError(null);
  };

  const handleUndo = () => {
    const last = undoStack[undoStack.length - 1];
    if (!last) return;
    const rest = undoStack.slice(0, -1);
    const earlier = [...rest].reverse().find(c => c.key === last.key);
    setOverrides(o => {
      const copy = { ...o };
      if (earlier) copy[last.key] = earlier.next;
      else delete copy[last.key];
      return copy;
    });
    setUndoStack(rest);
    setSaveError(null);
  };

  const handleReset = () => {
    setOverrides({});
    setUndoStack([]);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (changedMarkers.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      // Body is a plain array of changes
      const payload = changedMarkers.map(m => ({
        id: m.id,
        event_type: 'pole',
        survey_id: surveys[0].id,
        lat: m.position.lat.toFixed(6),
        lng: m.position.lng.toFixed(6),
        user_id: userData.id,
        user_name: userData.name,
      }));
      const res = await fetch(submitApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`Server responded ${res.status}: ${errText}`);
      }
      setOverrides({});
      setUndoStack([]);
      onPositionsSaved?.();
    } catch (err: any) {
      setSaveError(err?.message ?? 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };


// const polylines = useMemo(() => {
//   if (!filters.showPolylines || !filters.showPoles) return [];

//   return surveys
//     .map((survey, index) => {
//       const path: google.maps.LatLngLiteral[] = [];

//       if (survey.aerial_poles?.length) {
//         survey.aerial_poles.forEach(pole => {
//           const poleCoords = parseCoordinates(
//             `${pole.lattitude},${pole.longitude}`
//           );
//           if (poleCoords) path.push(poleCoords);
//         });
//       }

//       // Need minimum 2 points
//       if (path.length < 2) return null;

//       return {
//         path,
//         color: getSurveyColor(index),
//         surveyId: survey.id,
//         surveyName: `${survey.startGpName} → ${survey.endGpName}`,
//       };
//     })
//     .filter(Boolean);
// }, [
//   surveys,
//   filters.showPolylines,
//   filters.showPoles
// ]);



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
    // In edit mode fit only once, so reloading after a save doesn't re-zoom
    // (tracked per map instance — StrictMode recreates the map on mount)
    if (canDrag && fittedMapRef.current === map) return;
    const bounds = calculateBounds(surveys);
    if (bounds) {
      map.fitBounds(bounds);
      fittedMapRef.current = map;
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

      {canDrag && (
        <div className="absolute top-4 right-16 z-10 bg-white rounded-lg shadow-lg p-3 w-64">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <GripVertical className="w-4 h-4" />
            Drag pole markers to move
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {changedMarkers.length} marker{changedMarkers.length === 1 ? '' : 's'} changed
          </p>
          {saveError && <p className="text-xs text-red-600 mt-1">{saveError}</p>}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0 || saving}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
            <button
              onClick={handleReset}
              disabled={undoStack.length === 0 || saving}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={changedMarkers.length === 0 || saving}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
            </button>
          </div>
        </div>
      )}

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
        {mapReady && markers.map((marker, index) => {
          const key = `${marker.type}-${marker.id}`;
          // Only poles can be dragged
          const draggable = canDrag && marker.type === 'pole';
          return (
            <Marker
              key={`${marker.type}-${marker.surveyId}-${index}`}
              position={marker.position}
              icon={createMarkerIcon(marker.type,marker.data)}
              title={`${marker.type}-${marker.surveyId}-${marker.id}${marker.moved ? ' (moved)' : ''}`}
              draggable={draggable}
              cursor={draggable ? 'grab' : 'pointer'}
              onDragStart={() => setActiveInfoWindow(null)}
              onDragEnd={(e) => handleDragEnd(key, marker.position, e)}
              onClick={() => setActiveInfoWindow({
                position: marker.position,
                type: marker.type,
                data: marker.data,
              })}
            />
          );
        })}

      {/* {mapReady && filters.showPolylines && polylines.map((polyline, index) => (


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
        ))} */}

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
