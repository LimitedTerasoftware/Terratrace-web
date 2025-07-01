// import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
// import { Loader } from '@googlemaps/js-api-loader';
// import { Layers, Maximize2, Minimize2 } from 'lucide-react';
// import { Placemark, ViewState } from '../../types/kmz';
// import { useDebounce } from 'use-debounce';

// interface MapViewerProps {
//   placemarks: Placemark[];
//   highlightedPlacemark?: Placemark;
//   onPlacemarkClick: (placemark: Placemark) => void;
//   viewState: ViewState;
//   onViewStateChange: (viewState: ViewState) => void;
// }

// export const MapViewer: React.FC<MapViewerProps> = ({
//   placemarks,
//   highlightedPlacemark,
//   onPlacemarkClick,
//   viewState,
//   onViewStateChange
// }) => {
//   const mapRef = useRef<HTMLDivElement>(null);
//   const [map, setMap] = useState<google.maps.Map | null>(null);
//   const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string>('');
//   const [isMapInitialized, setIsMapInitialized] = useState(false);

//   // Memoize the onViewStateChange to prevent unnecessary re-renders
//   const stableOnViewStateChange = useCallback((newViewState: ViewState) => {
//     onViewStateChange(newViewState);
//   }, [onViewStateChange]);




//   // Safe fullscreen toggle with error handling
//   const toggleFullscreen = useCallback(() => {
//     try {
//       setIsFullscreen(prev => {
//         const newState = !prev;
        
//         if (newState) {
//           // Entering fullscreen
//           if (document.documentElement.requestFullscreen) {
//             document.documentElement.requestFullscreen().catch(err => {
//               console.warn('Fullscreen request failed:', err);
//             });
//           }
//         } else {
//           // Exiting fullscreen
//           if (document.fullscreenElement && document.exitFullscreen) {
//             document.exitFullscreen().catch(err => {
//               console.warn('Exit fullscreen failed:', err);
//             });
//           }
//         }
        
//         return newState;
//       });
//     } catch (error) {
//       console.error('Error toggling fullscreen:', error);
//       // Fallback: just toggle the state without document fullscreen
//       setIsFullscreen(prev => !prev);
//     }
//   }, []);

//   // Listen for fullscreen changes
//   useEffect(() => {
//     const handleFullscreenChange = () => {
//       try {
//         if (!document.fullscreenElement) {
//           setIsFullscreen(false);
//         }
//       } catch (error) {
//         console.error('Error handling fullscreen change:', error);
//       }
//     };

//     document.addEventListener('fullscreenchange', handleFullscreenChange);
//     return () => {
//       document.removeEventListener('fullscreenchange', handleFullscreenChange);
//     };
//   }, []);

//   // Initialize Google Maps - only run once
//   useEffect(() => {
//     if (isMapInitialized) return;

//     const initMap = async () => {
//       try {
//         const loader = new Loader({
//           apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
//           version: 'weekly',
//           libraries: ['places', 'geometry']
//         });

//         await loader.load();

//         if (!mapRef.current) return;

//         const mapInstance = new google.maps.Map(mapRef.current, {
//           center: viewState.center,
//           zoom: viewState.zoom,
//           mapTypeId: viewState.mapType,
//           styles: [
//             {
//               featureType: 'poi',
//               elementType: 'labels',
//               stylers: [{ visibility: 'off' }]
//             }
//           ],
//           mapTypeControl: true,
//           mapTypeControlOptions: {
//             style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
//             position: google.maps.ControlPosition.TOP_RIGHT
//           },
//           streetViewControl: true,
//           fullscreenControl: false,
//           zoomControl: true,
//           zoomControlOptions: {
//             position: google.maps.ControlPosition.RIGHT_BOTTOM
//           }
//         });

//         // Use flags to prevent infinite loops
//         let isUpdatingFromMap = false;

//         // Listen for map changes with error handling and loop prevention
//         const addMapListener = (event: string, handler: () => void) => {
//           try {
//             mapInstance.addListener(event, () => {
//               if (!isUpdatingFromMap) {
//                 handler();
//               }
//             });
//           } catch (error) {
//             console.error(`Error adding ${event} listener:`, error);
//           }
//         };

//         addMapListener('center_changed', () => {
//           try {
//             const center = mapInstance.getCenter();
//             if (center) {
//               isUpdatingFromMap = true;
//               stableOnViewStateChange({
//                 ...viewState,
//                 center: { lat: center.lat(), lng: center.lng() }
//               });
          

//               setTimeout(() => { isUpdatingFromMap = false; }, 100);
//             }
//           } catch (error) {
//             console.error('Error handling center change:', error);
//             isUpdatingFromMap = false;
//           }
//         });

//         addMapListener('zoom_changed', () => {
//           try {
//             isUpdatingFromMap = true;
//             stableOnViewStateChange({
//               ...viewState,
//               zoom: mapInstance.getZoom() || viewState.zoom
//             });
//             setTimeout(() => { isUpdatingFromMap = false; }, 100);
//           } catch (error) {
//             console.error('Error handling zoom change:', error);
//             isUpdatingFromMap = false;
//           }
//         });

//         addMapListener('maptypeid_changed', () => {
//           try {
//             isUpdatingFromMap = true;
//             stableOnViewStateChange({
//               ...viewState,
//               mapType: mapInstance.getMapTypeId() as any
//             });
//             setTimeout(() => { isUpdatingFromMap = false; }, 100);
//           } catch (error) {
//             console.error('Error handling map type change:', error);
//             isUpdatingFromMap = false;
//           }
//         });

//         setMap(mapInstance);
//         setIsLoading(false);
//         setIsMapInitialized(true);
//       } catch (err) {
//         console.error('Failed to load Google Maps:', err);
//         setError('Failed to load Google Maps. Please check your API key.');
//         setIsLoading(false);
//       }
//     };

//     initMap();
//   }, [isMapInitialized, viewState.center.lat, viewState.center.lng, viewState.zoom, viewState.mapType, stableOnViewStateChange]);

//   // Update markers when placemarks change - separate effect
//   useEffect(() => {
//     if (!map || !isMapInitialized) return;

//     try {
//       // Clear existing markers
//       markers.forEach(marker => {
//         try {
//           marker.setMap(null);
//         } catch (error) {
//           console.error('Error removing marker:', error);
//         }
//       });

//       const newMarkers: google.maps.Marker[] = [];
//       const infoWindow = new google.maps.InfoWindow();

//       placemarks.forEach((placemark) => {
//         try {
//           const marker = new google.maps.Marker({
//             position: placemark.coordinates,
//             map: map,
//             title: placemark.name,
//             icon: {
//               url: placemark.icon || 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
//               scaledSize: new google.maps.Size(32, 32)
//             }
//           });

//           marker.addListener('click', () => {
//             try {
//               const content = `
//                 <div class="p-2 max-w-xs">
//                   <h3 class="font-semibold text-gray-900 mb-2">${placemark.name}</h3>
//                   ${placemark.description ? `<p class="text-sm text-gray-600 mb-2">${placemark.description}</p>` : ''}
//                   <div class="text-xs text-gray-500 space-y-1">
//                     ${placemark.state ? `<div><strong>State:</strong> ${placemark.state}</div>` : ''}
//                     ${placemark.division ? `<div><strong>Division:</strong> ${placemark.division}</div>` : ''}
//                     ${placemark.block ? `<div><strong>Block:</strong> ${placemark.block}</div>` : ''}
//                     ${placemark.category ? `<div><strong>Category:</strong> ${placemark.category}</div>` : ''}
//                     <div><strong>Coordinates:</strong> ${placemark.coordinates.lat.toFixed(6)}, ${placemark.coordinates.lng.toFixed(6)}</div>
//                   </div>
//                 </div>
//               `;
              
//               infoWindow.setContent(content);
//               infoWindow.open(map, marker);
//               onPlacemarkClick(placemark);
//             } catch (error) {
//               console.error('Error handling marker click:', error);
//             }
//           });

//           newMarkers.push(marker);
//         } catch (error) {
//           console.error('Error creating marker for placemark:', placemark.name, error);
//         }
//       });

//       setMarkers(newMarkers);

//       // Fit bounds to show all markers
//       if (placemarks.length > 0) {
//         try {
//           const bounds = new google.maps.LatLngBounds();
//           placemarks.forEach(placemark => {
//             bounds.extend(placemark?.coordinates);
//           });
//           map.fitBounds(bounds);
//         } catch (error) {
//           console.error('Error fitting bounds:', error);
//         }
//       }
//     } catch (error) {
//       console.error('Error updating markers:', error);
//     }
//   }, [map, placemarks, isMapInitialized, onPlacemarkClick]);

//   // Handle highlighted placemark - separate effect
//   useEffect(() => {
//     if (!map || !highlightedPlacemark || !isMapInitialized) return;

//     try {
//       // Find the marker for the highlighted placemark
//       const markerIndex = placemarks.findIndex(p => p.id === highlightedPlacemark.id);
//       if (markerIndex >= 0 && markers[markerIndex]) {
//         map.panTo(highlightedPlacemark.coordinates);
//         map.setZoom(Math.max(map.getZoom() || 10, 12));
        
//         // Bounce animation
//         markers[markerIndex].setAnimation(google.maps.Animation.BOUNCE);
//         const timeoutId = setTimeout(() => {
//           try {
//             if (markers[markerIndex]) {
//               markers[markerIndex].setAnimation(null);
//             }
//           } catch (error) {
//             console.error('Error stopping marker animation:', error);
//           }
//         }, 2000);

//         // Cleanup timeout on unmount or change
//         return () => clearTimeout(timeoutId);
//       }
//     } catch (error) {
//       console.error('Error handling highlighted placemark:', error);
//     }
//   }, [highlightedPlacemark, map, markers, placemarks, isMapInitialized]);

//   if (error) {
//     return (
//       <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
//         <div className="text-center text-gray-600">
//           <div className="text-red-500 mb-2">⚠️</div>
//           <p className="text-sm">{error}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={`relative bg-gray-100 rounded-lg overflow-hidden transition-all duration-300 ${
//       isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-full'
//     }`}>
//       {isLoading && (
//         <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
//             <p className="text-sm text-gray-600">Loading map...</p>
//           </div>
//         </div>
//       )}
      
//       <div ref={mapRef} className="w-full h-full" />
      
//       {/* Map Controls */}
//       <div className="absolute top-4 left-4 z-10">
//         <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-2 flex items-center gap-2">
//           <button
//             onClick={toggleFullscreen}
//             className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
//             title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
//           >
//             {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
//           </button>
//         </div>
//       </div>

//       {/* Placemark Count */}
//       {placemarks.length > 0 && (
//         <div className="absolute bottom-4 left-4 z-10">
//           <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 text-sm text-gray-700">
//             {placemarks.length} marker{placemarks.length !== 1 ? 's' : ''}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { ProcessedPlacemark, PlacemarkCategory } from '../../types/kmz';
import { PLACEMARK_CATEGORIES } from './PlaceMark';

interface GoogleMapProps {
  placemarks: ProcessedPlacemark[];
  categories: PlacemarkCategory[];
  visibleCategories: Set<string>;
  highlightedPlacemark?: ProcessedPlacemark;
  onPlacemarkClick: (placemark: ProcessedPlacemark) => void;
  className?: string;
}

const GOOGLE_MAPS_API_KEY =import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Replace with your actual API key

export const GoogleMap: React.FC<GoogleMapProps> = ({
  placemarks,
  categories,
  visibleCategories,
  highlightedPlacemark,
  onPlacemarkClick,
  className = ''
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();

        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 }, // Center of India
          zoom: 6,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        });

        mapInstanceRef.current = map;
        infoWindowRef.current = new google.maps.InfoWindow();
        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError('Failed to load Google Maps. Please check your API key.');
      }
    };

    initMap();
  }, []);

  // Update map with placemarks
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    // Clear existing markers and polylines
    markersRef.current.forEach(marker => marker.setMap(null));
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasVisiblePlacemarks = false;

    // Add placemarks to map
    placemarks.forEach(placemark => {
      const category = categories.find(cat => cat.name === placemark.category);
      if (!category || !visibleCategories.has(category.id)) return;

      hasVisiblePlacemarks = true;

      if (placemark.type === 'point') {
        const marker = new google.maps.Marker({
          position: placemark.coordinates,
          map: mapInstanceRef.current,
          title: placemark.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: category.color,
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });

        marker.addListener('click', () => {
          onPlacemarkClick(placemark);
          
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(`
              <div class="p-3">
                <h3 class="font-semibold text-gray-900 mb-1">${placemark.name}</h3>
                <p class="text-sm text-gray-600">Category: ${placemark.category}</p>
                <p class="text-sm text-gray-600">Type: Point</p>
              </div>
            `);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          }
        });

        markersRef.current.push(marker);
        bounds.extend(placemark.coordinates);
      } else if (placemark.type === 'polyline') {
        const polyline = new google.maps.Polyline({
          path: placemark.coordinates,
          geodesic: true,
          strokeColor: category.color,
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: mapInstanceRef.current
        });

        polyline.addListener('click', (event: google.maps.MapMouseEvent) => {
          onPlacemarkClick(placemark);
          
          if (infoWindowRef.current && event.latLng) {
            infoWindowRef.current.setContent(`
              <div class="p-3">
                <h3 class="font-semibold text-gray-900 mb-1">${placemark.name}</h3>
                <p class="text-sm text-gray-600">Category: ${placemark.category}</p>
                <p class="text-sm text-gray-600">Type: Polyline</p>
                ${placemark.distance ? `<p class="text-sm text-gray-600">Distance: ${placemark.distance}</p>` : ''}
              </div>
            `);
            infoWindowRef.current.setPosition(event.latLng);
            infoWindowRef.current.open(mapInstanceRef.current);
          }
        });

        polylinesRef.current.push(polyline);
        placemark.coordinates.forEach((coord: any) => bounds.extend(coord));
      }
    });

    // Fit map to show all visible placemarks
    if (hasVisiblePlacemarks && !bounds.isEmpty()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
    }
  }, [placemarks, categories, visibleCategories, mapLoaded]);

  // Highlight selected placemark
  useEffect(() => {
    if (!mapLoaded || !highlightedPlacemark) return;

    if (highlightedPlacemark.type === 'point') {
      const marker = markersRef.current.find(m => 
        m.getTitle() === highlightedPlacemark.name
      );
      
      if (marker) {
        mapInstanceRef.current?.panTo(highlightedPlacemark.coordinates);
        mapInstanceRef.current?.setZoom(15);
        
        // Trigger click to show info window
        google.maps.event.trigger(marker, 'click');
      }
    } else if (highlightedPlacemark.type === 'polyline') {
      const polyline = polylinesRef.current[parseInt(highlightedPlacemark.id.split('-')[1])];
      
      if (polyline && highlightedPlacemark.coordinates.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        highlightedPlacemark.coordinates.forEach((coord: any) => bounds.extend(coord));
        mapInstanceRef.current?.fitBounds(bounds, { padding: 100 });
      }
    }
  }, [highlightedPlacemark, mapLoaded]);

  if (mapError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center ${className}`}>
        <div className="text-red-600 mb-2">⚠️</div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Map Error</h3>
        <p className="text-red-700">{mapError}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};