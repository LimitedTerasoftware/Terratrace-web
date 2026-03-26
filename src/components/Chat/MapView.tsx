import { useEffect, useRef, useState } from 'react';
import { MapPin, Plus, Minus, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MapViewProps {
  constructionPathData?: unknown;
}

interface BlockSurvey {
  state_id: number;
  district_id: number;
  block_id: number;
  surveys: SurveyCoordinates[];
}

interface SurveyCoordinates {
  survey_id: number;
  machine_id: string;
  coordinates: [number, number][];
}

interface ConstructionPathResponse {
  status: boolean;
  total_blocks: number;
  data: BlockSurvey[];
}

function MapViewContent({ constructionPathData }: MapViewProps) {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 23.417350899999998, lng: 85.28900899999999 },
      zoom: 10,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    setMap(mapInstance);
  }, []);

  useEffect(() => {
    if (!map) return;

    polylines.forEach((polyline) => polyline.setMap(null));

    const pathData = constructionPathData as
      | ConstructionPathResponse
      | undefined;
    if (!pathData?.data) {
      setPolylines([]);
      return;
    }

    const newPolylines: google.maps.Polyline[] = [];

    pathData.data.forEach((block) => {
      block.surveys.forEach((survey) => {
        if (survey.coordinates.length > 0) {
          const polyline = new google.maps.Polyline({
            path: survey.coordinates.map((coord) => ({
              lat: coord[1],
              lng: coord[0],
            })),
            geodesic: true,
            strokeColor: '#10b981',
            strokeOpacity: 0.9,
            strokeWeight: 5,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 14px; font-weight: 600;">
                  Today's Construction Path
                </h3>
                <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 12px;">
                  <strong>Survey ID:</strong> ${survey.survey_id}
                </p>
                <p style="margin: 0; color: #4b5563; font-size: 12px;">
                  <strong>Machine ID:</strong> ${survey.machine_id}
                </p>
                <p style="margin: 0; color: #4b5563; font-size: 12px;">
                  <strong>Coordinates:</strong> ${survey.coordinates.length} points
                </p>
                <button  id="viewDetailsBtn"style="flex:1;padding:4px 8px;background:#2563eb;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">Construction Details</button>

              </div>
            `,
          });
          google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
            document
              .getElementById('viewDetailsBtn')
              ?.addEventListener('click', () => {
                navigate('/construction-details', {
                  state: { row: survey.survey_id, multipreview: true },
                });
              });
          });

          polyline.addListener('click', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              infoWindow.setPosition(event.latLng);
              infoWindow.open(map);
            }
          });

          polyline.setMap(map);
          newPolylines.push(polyline);
        }
      });
    });

    setPolylines(newPolylines);

    if (newPolylines.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      newPolylines.forEach((polyline) => {
        const path = polyline.getPath();
        path.forEach((latLng) => bounds.extend(latLng));
      });
      map.fitBounds(bounds);
    }
  }, [map, constructionPathData]);

  const handleZoomIn = () => {
    if (map) map.setZoom((map.getZoom() || 10) + 1);
  };

  const handleZoomOut = () => {
    if (map) map.setZoom((map.getZoom() || 10) - 1);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (map) {
            map.setCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            map.setZoom(15);
          }
        },
        () => console.error('Error getting location'),
      );
    }
  };

  const pathData = constructionPathData as ConstructionPathResponse | undefined;
  const surveyCount =
    pathData?.data?.reduce((acc, block) => acc + block.surveys.length, 0) || 0;
  const coordinateCount =
    pathData?.data?.reduce(
      (acc, block) =>
        acc + block.surveys.reduce((a, s) => a + s.coordinates.length, 0),
      0,
    ) || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative h-full">
      <div className="h-full min-h-[500px] relative">
        <div ref={mapRef} className="absolute inset-0 w-full h-full" />

        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={handleCurrentLocation}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <Navigation className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <Plus className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50"
          >
            <Minus className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-4 max-w-xs">
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">
                Today's Survey Path
              </h4>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Surveys:</span>
                  <span className="font-semibold text-green-600">
                    {surveyCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Points:</span>
                  <span className="font-semibold">{coordinateCount}</span>
                </div>
              </div>
              {surveyCount > 0 && (
                <button
                  onClick={() => navigate('/live-track')}
                  className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  View All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapView(props: MapViewProps) {
  return <MapViewContent {...props} />;
}
