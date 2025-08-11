// import React, { useEffect, useRef, useState } from 'react';
// import { Loader } from '@googlemaps/js-api-loader';
// import { ProcessedPlacemark, PlacemarkCategory } from '../../types/kmz';
// import { PLACEMARK_CATEGORIES } from './PlaceMark';

// interface GoogleMapProps {
//   placemarks: ProcessedPlacemark[];
//   categories: PlacemarkCategory[];
//   visibleCategories: Set<string>;
//   highlightedPlacemark?: ProcessedPlacemark;
//   onPlacemarkClick: (placemark: ProcessedPlacemark) => void;
//   className?: string;
// }

// const GOOGLE_MAPS_API_KEY =import.meta.env.VITE_GOOGLE_MAPS_API_KEY; 

// export const GoogleMap: React.FC<GoogleMapProps> = ({
//   placemarks,
//   categories,
//   visibleCategories,
//   highlightedPlacemark,
//   onPlacemarkClick,
//   className = ''
// }) => {
//   const mapRef = useRef<HTMLDivElement>(null);
//   const mapInstanceRef = useRef<google.maps.Map | null>(null);
//   const markersRef = useRef<google.maps.Marker[]>([]);
//   const polylinesRef = useRef<google.maps.Polyline[]>([]);
//   const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
//   const [mapLoaded, setMapLoaded] = useState(false);
//   const [mapError, setMapError] = useState<string | null>(null);

//   // Initialize Google Maps
//   useEffect(() => {
//     const initMap = async () => {
//       try {
//         const loader = new Loader({
//           apiKey: GOOGLE_MAPS_API_KEY,
//           version: 'weekly',
//           libraries: ['places']
//         });

//         await loader.load();

//         if (!mapRef.current) return;

//         const map = new google.maps.Map(mapRef.current, {
//           center: { lat: 20.5937, lng: 78.9629 }, // Center of India
//           zoom: 6,
//           mapTypeId: google.maps.MapTypeId.ROADMAP,
//           styles: [
//             {
//               featureType: 'poi',
//               elementType: 'labels',
//               stylers: [{ visibility: 'off' }]
//             },
//             {
//               featureType: 'transit',
//               elementType: 'labels',
//               stylers: [{ visibility: 'off' }]
//             }
//           ]
//         });

//         mapInstanceRef.current = map;
//         infoWindowRef.current = new google.maps.InfoWindow();
//         setMapLoaded(true);
//       } catch (error) {
//         console.error('Error loading Google Maps:', error);
//         setMapError('Failed to load Google Maps. Please check your API key.');
//       }
//     };

//     initMap();
//   }, []);

//   // Update map with placemarks
//   useEffect(() => {
//     if (!mapLoaded || !mapInstanceRef.current) return;

//     // Clear existing markers and polylines
//     markersRef.current.forEach(marker => marker.setMap(null));
//     polylinesRef.current.forEach(polyline => polyline.setMap(null));
//     markersRef.current = [];
//     polylinesRef.current = [];

//     const bounds = new google.maps.LatLngBounds();
//     let hasVisiblePlacemarks = false;

//     // Add placemarks to map
//     placemarks.forEach(placemark => {
//       const category = categories.find(cat => cat.name === placemark.category);
//       if (!category || !visibleCategories.has(category.id)) return;

//       hasVisiblePlacemarks = true;

//       if (placemark.type === 'point') {
//         const marker = new google.maps.Marker({
//           position: placemark.coordinates,
//           map: mapInstanceRef.current,
//           title: placemark.name,
//           icon: {
//             path:google.maps.SymbolPath.CIRCLE,
//             scale: 8,
//             fillColor: category.color,
//             fillOpacity: 0.8,
//             strokeColor: '#ffffff',
//             strokeWeight: 2
//           }
//         });

//         marker.addListener('click', () => {
//           onPlacemarkClick(placemark);
          
//           if (infoWindowRef.current) {
//             infoWindowRef.current.setContent(`
//               <div class="p-3">
//                 <h3 class="font-semibold text-gray-900 mb-1">${placemark.name}</h3>
//                 <p class="text-sm text-gray-600">Category: ${placemark.category}</p>
//                 <p class="text-sm text-gray-600">Type: Point</p>
//               </div>
//             `);
//             infoWindowRef.current.open(mapInstanceRef.current, marker);
//           }
//         });

//         markersRef.current.push(marker);
//         bounds.extend(placemark.coordinates);
//       } else if (placemark.type === 'polyline') {
//         const polyline = new google.maps.Polyline({
//           path: placemark.coordinates,
//           geodesic: true,
//           strokeColor: category.color,
//           strokeOpacity: 0.8,
//           strokeWeight: 3,
//           map: mapInstanceRef.current
//         });

//         polyline.addListener('click', (event: google.maps.MapMouseEvent) => {
//           onPlacemarkClick(placemark);
          
//           if (infoWindowRef.current && event.latLng) {
//             infoWindowRef.current.setContent(`
//               <div class="p-3">
//                 <h3 class="font-semibold text-gray-900 mb-1">${placemark.name}</h3>
//                 <p class="text-sm text-gray-600">Category: ${placemark.category}</p>
//                 <p class="text-sm text-gray-600">Type: Polyline</p>
//                 ${placemark.distance ? `<p class="text-sm text-gray-600">Distance: ${placemark.distance}</p>` : ''}
//               </div>
//             `);
//             infoWindowRef.current.setPosition(event.latLng);
//             infoWindowRef.current.open(mapInstanceRef.current);
//           }
//         });

//         polylinesRef.current.push(polyline);
//         placemark.coordinates.forEach((coord: any) => bounds.extend(coord));
//       }
//     });

//     // Fit map to show all visible placemarks
//     if (hasVisiblePlacemarks && !bounds.isEmpty()) {
//       mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
//     }
//   }, [placemarks, categories, visibleCategories, mapLoaded]);

//   // Highlight selected placemark
//   useEffect(() => {
//     if (!mapLoaded || !highlightedPlacemark) return;

//     if (highlightedPlacemark.type === 'point') {
//       const marker = markersRef.current.find(m => 
//         m.getTitle() === highlightedPlacemark.name
//       );
      
//       if (marker) {
//         mapInstanceRef.current?.panTo(highlightedPlacemark.coordinates);
//         mapInstanceRef.current?.setZoom(15);
        
//         // Trigger click to show info window
//         google.maps.event.trigger(marker, 'click');
//       }
//     } else if (highlightedPlacemark.type === 'polyline') {
//       const polyline = polylinesRef.current[parseInt(highlightedPlacemark.id.split('-')[1])];
      
//       if (polyline && highlightedPlacemark.coordinates.length > 0) {
//         const bounds = new google.maps.LatLngBounds();
//         highlightedPlacemark.coordinates.forEach((coord: any) => bounds.extend(coord));
//         mapInstanceRef.current?.fitBounds(bounds, { padding: 100 });
//       }
//     }
//   }, [highlightedPlacemark, mapLoaded]);

//   if (mapError) {
//     return (
//       <div className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center ${className}`}>
//         <div className="text-red-600 mb-2">⚠️</div>
//         <h3 className="text-lg font-semibold text-red-800 mb-2">Map Error</h3>
//         <p className="text-red-700">{mapError}</p>
//       </div>
//     );
//   }

//   return (
//     <div className={`relative ${className}`}>
//       <div ref={mapRef} className="w-full h-full rounded-lg" />
//       {!mapLoaded && (
//         <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
//             <p className="text-gray-600">Loading map...</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { ProcessedPlacemark, PlacemarkCategory, ProcessedPhysicalSurvey } from '../../types/kmz';
import { PLACEMARK_CATEGORIES } from './PlaceMark';

interface GoogleMapProps {
  placemarks: (ProcessedPlacemark | ProcessedPhysicalSurvey)[];
  categories: PlacemarkCategory[];
  visibleCategories: Set<string>;
  highlightedPlacemark?: ProcessedPlacemark | ProcessedPhysicalSurvey;
  onPlacemarkClick: (placemark: ProcessedPlacemark | ProcessedPhysicalSurvey) => void;
  className?: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCPHNQoyCkDJ3kOdYZAjZElbhXuJvx-Odg'; 

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
      const category = categories.find(cat => 
        cat.name === placemark.category || 
        (cat.name.startsWith('Physical:') && cat.name.replace('Physical: ', '') === placemark.category)
      );
      if (!category || !visibleCategories.has(category.id)) return;

      hasVisiblePlacemarks = true;

      if (placemark.type === 'point') {
        const isPhysicalSurvey = placemark.id.startsWith('physical-');
        
        const marker = new google.maps.Marker({
          position: placemark.coordinates,
          map: mapInstanceRef.current,
          title: placemark.name,
          icon: {
            path: isPhysicalSurvey ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW : google.maps.SymbolPath.CIRCLE,
            scale: isPhysicalSurvey ? 6 : 8,
            fillColor: category.color,
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            rotation: isPhysicalSurvey ? 0 : undefined
          }
        });

        marker.addListener('click', () => {
          onPlacemarkClick(placemark);
          
          if (infoWindowRef.current) {
            const physicalInfo = placemark.id.startsWith('physical-') 
              ? `<p class="text-sm text-gray-600">Survey ID: ${(placemark as ProcessedPhysicalSurvey).surveyId}</p>
                 <p class="text-sm text-gray-600">Block ID: ${(placemark as ProcessedPhysicalSurvey).blockId}</p>`
              : '';
              
            infoWindowRef.current.setContent(`
              <div class="p-3">
                <h3 class="font-semibold text-gray-900 mb-1">${placemark.name}</h3>
                <p class="text-sm text-gray-600">Category: ${placemark.category}</p>
                <p class="text-sm text-gray-600">Type: Point</p>
                ${physicalInfo}
              </div>
            `);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          }
        });

        markersRef.current.push(marker);
        bounds.extend(placemark.coordinates);
      } else if (placemark.type === 'polyline' && 'coordinates' in placemark && Array.isArray(placemark.coordinates)) {
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
                ${'distance' in placemark && placemark.distance ? `<p class="text-sm text-gray-600">Distance: ${placemark.distance}</p>` : ''}
              </div>
            `);
            infoWindowRef.current.setPosition(event.latLng);
            infoWindowRef.current.open(mapInstanceRef.current);
          }
        });

        polylinesRef.current.push(polyline);
        if ('coordinates' in placemark && Array.isArray(placemark.coordinates)) {
          placemark.coordinates.forEach((coord: any) => bounds.extend(coord));
        }
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
    } else if (highlightedPlacemark.type === 'polyline' && 'coordinates' in highlightedPlacemark) {
      const polyline = polylinesRef.current[parseInt(highlightedPlacemark.id.split('-')[1])];
      
      if (polyline && Array.isArray(highlightedPlacemark.coordinates) && highlightedPlacemark.coordinates.length > 0) {
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