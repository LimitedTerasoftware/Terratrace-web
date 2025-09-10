import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { ProcessedPlacemark, PlacemarkCategory, ProcessedPhysicalSurvey, ProcessedDesktopPlanning } from '../../types/kmz';
import { PLACEMARK_CATEGORIES } from './PlaceMark';

// Video & Photo Survey types
import { TrackPoint } from './VideoSurveyService';
import { PhotoPoint } from './PhotoSurveyService';

interface GoogleMapProps {
  placemarks: (ProcessedPlacemark | ProcessedPhysicalSurvey | ProcessedDesktopPlanning)[];
  categories: PlacemarkCategory[];
  visibleCategories: Set<string>;
  highlightedPlacemark?: ProcessedPlacemark | ProcessedPhysicalSurvey | ProcessedDesktopPlanning;
  onPlacemarkClick: (placemark: ProcessedPlacemark | ProcessedPhysicalSurvey | ProcessedDesktopPlanning) => void;
  className?: string;

  // Enhanced Video Survey integration
  videoSurveyMode?: boolean;
  trackPoints?: TrackPoint[];
  currentPosition?: { lat: number; lng: number };
  selection?: { start?: number; end?: number };
  onTrackPointClick?: (p: TrackPoint) => void;
  onSelectionChange?: (selection: { start?: number; end?: number }) => void;

  // Photo Survey integration
  photoSurveyMode?: boolean;
  photoPoints?: PhotoPoint[];
  onPhotoPointClick?: (p: PhotoPoint) => void;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCPHNQoyCkDJ3kOdYZAjZElbhXuJvx-Odg';

// Helper function to create image gallery HTML (OUTSIDE component to avoid hook issues)
function createImageGalleryHTML(images: any[]): string {
  if (!images || images.length === 0) return '';

  const imageHTML = images.map((image, index) => `
    <div class="survey-image-container" style="margin: 8px 0;">
      <div class="survey-image-label" style="font-size: 12px; color: #666; margin-bottom: 4px;">
        ${image.label}
      </div>
      <img 
        src="${image.url}" 
        alt="${image.label}"
        style="
          width: 100%; 
          max-width: 300px; 
          height: auto; 
          max-height: 200px; 
          object-fit: cover; 
          border-radius: 4px; 
          border: 1px solid #ddd;
          cursor: pointer;
        "
        onclick="window.open('${image.url}', '_blank')"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
      />
      <div style="display: none; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px; color: #888;">
        Image failed to load: ${image.label}
      </div>
    </div>
  `).join('');

  return `
    <div class="survey-images-section" style="margin-top: 12px; border-top: 1px solid #eee; padding-top: 12px;">
      <div style="font-weight: 600; margin-bottom: 8px; color: #333;">
        Survey Images (${images.length})
      </div>
      <div class="survey-images-grid" style="max-height: 400px; overflow-y: auto;">
        ${imageHTML}
      </div>
    </div>
  `;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({
  placemarks,
  categories,
  visibleCategories,
  highlightedPlacemark,
  onPlacemarkClick,
  className = '',
  // Enhanced video survey props
  videoSurveyMode = false,
  trackPoints = [],
  currentPosition,
  selection,
  onTrackPointClick,
  onSelectionChange,
  // Photo survey props
  photoSurveyMode = false,
  photoPoints = [],
  onPhotoPointClick,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Enhanced Video Survey overlays
  const surveyPolylineRef = useRef<google.maps.Polyline | null>(null);
  const videoSurveyPolylinesRef = useRef<google.maps.Polyline[]>([]);
  const surveyDotsRef = useRef<google.maps.Marker[]>([]);
  const currentMarkerRef = useRef<google.maps.Marker | null>(null);
  const selectionMarkersRef = useRef<{ start?: google.maps.Marker; end?: google.maps.Marker }>({});
  const trackFittedOnceRef = useRef(false);

  // Photo Survey overlays
  const photoMarkersRef = useRef<google.maps.Marker[]>([]);

  // Enhanced selection state
  const [selectionState, setSelectionState] = useState<{
    mode: 'none' | 'selecting';
    pendingStart?: number;
  }>({ mode: 'none' });

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places'],
        });

        await loader.load();
        if (!mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 }, // Center of India
          zoom: 6,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          ],
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

  // Helpers to clear overlays
  function clearStandardOverlays() {
    markersRef.current.forEach(marker => marker.setMap(null));
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
  }

  function clearPhotoOverlays() {
    photoMarkersRef.current.forEach(m => m.setMap(null));
    photoMarkersRef.current = [];
  }

  function clearSurveyOverlays() {
  if (surveyPolylineRef.current) {
    surveyPolylineRef.current.setMap(null);
    surveyPolylineRef.current = null;
  }
  
  // Clear video survey polylines separately (don't touch regular polylines)
  videoSurveyPolylinesRef.current.forEach(polyline => polyline.setMap(null));
  videoSurveyPolylinesRef.current = [];
  
  surveyDotsRef.current.forEach(m => m.setMap(null));
  surveyDotsRef.current = [];
  
  if (currentMarkerRef.current) {
    currentMarkerRef.current.setMap(null);
    currentMarkerRef.current = null;
  }
  
  // Clear selection markers
  if (selectionMarkersRef.current.start) {
    selectionMarkersRef.current.start.setMap(null);
  }
  if (selectionMarkersRef.current.end) {
    selectionMarkersRef.current.end.setMap(null);
  }
  selectionMarkersRef.current = {};
  clearPhotoOverlays();
}

  // Enhanced track point finder
  const findNearestTrackPoint = (timestamp: number): TrackPoint | null => {
    if (!trackPoints.length) return null;
    
    let nearest = trackPoints[0];
    let minDiff = Math.abs(trackPoints[0].timestamp - timestamp);
    
    for (const point of trackPoints) {
      const diff = Math.abs(point.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = point;
      }
    }
    
    return nearest;
  };

  // Enhanced map click handler for segment selection
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!videoSurveyMode || !onSelectionChange || !e.latLng) return;
    
    const clickedLat = e.latLng.lat();
    const clickedLng = e.latLng.lng();
    
    // Find nearest track point to click
    let nearestPoint: TrackPoint | null = null;
    let minDistance = Infinity;
    
    for (const point of trackPoints) {
      const distance = Math.sqrt(
        Math.pow(point.lat - clickedLat, 2) + Math.pow(point.lng - clickedLng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    }
    
    if (!nearestPoint) return;
    
    if (!selection?.start) {
      // Set start point
      onSelectionChange({ start: nearestPoint.timestamp, end: selection?.end });
      setSelectionState({ mode: 'selecting', pendingStart: nearestPoint.timestamp });
    } else if (!selection?.end) {
      // Set end point
      onSelectionChange({ start: selection.start, end: nearestPoint.timestamp });
      setSelectionState({ mode: 'none' });
    } else {
      // Reset and set new start
      onSelectionChange({ start: nearestPoint.timestamp, end: undefined });
      setSelectionState({ mode: 'selecting', pendingStart: nearestPoint.timestamp });
    }
  };

  // Update map with regular placemarks (kept separate from survey overlays)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    clearStandardOverlays();

    const bounds = new google.maps.LatLngBounds();
    let hasVisiblePlacemarks = false;

    placemarks.forEach(placemark => {
      const category = categories.find(cat =>
        cat.name === placemark.category ||
        (cat.name.startsWith('Physical:') && cat.name.replace('Physical: ', '') === placemark.category) ||
        (cat.name.startsWith('Desktop:') && cat.name.replace('Desktop: ', '') === placemark.category)
      );
      if (!category || !visibleCategories.has(category.id)) return;

      hasVisiblePlacemarks = true;

      if (placemark.type === 'point') {
        const isPhysicalSurvey = placemark.id.startsWith('physical-');
        const isDesktopPlanning = placemark.id.startsWith('desktop-');

        let markerIcon: google.maps.Symbol | google.maps.Icon | undefined;

        if (isPhysicalSurvey) {
          markerIcon = {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: category.color,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          } as google.maps.Symbol;
        } else if (isDesktopPlanning) {
          const desktopPlacemark = placemark as ProcessedDesktopPlanning;
          const assetType = desktopPlacemark.assetType || desktopPlacemark.pointType || 'FPOI';

          if (assetType === 'GP') {
            markerIcon = {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 14,
              fillColor: category.color,
              fillOpacity: 0.9,
              strokeColor: '#000000',
              strokeWeight: 3,
            } as google.maps.Symbol;
          } else if (assetType === 'BHQ' || assetType === 'Block Router') {
            markerIcon = {
              path: 'M-8,-8 L8,-8 L8,8 L-8,8 Z',
              scale: 1,
              fillColor: category.color,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            } as google.maps.Symbol;
          } else if (assetType === 'FPOI') {
            markerIcon = {
              path: 'M0,-12 L8,8 L-8,8 Z',
              scale: 1,
              fillColor: category.color,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            } as google.maps.Symbol;
          } else {
            markerIcon = {
              path: 'M-6,-6 L6,-6 L6,6 L-6,6 Z M-4,-4 L4,-4 L4,4 L-4,4 Z',
              scale: 1,
              fillColor: category.color,
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            } as google.maps.Symbol;
          }
        } else {
          const pointType = (placemark as ProcessedPlacemark).pointType;
          markerIcon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: pointType === 'FPOI' || pointType === 'LANDMARK' ? 12 : 10,
            fillColor: category.color,
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: pointType === 'FPOI' || pointType === 'LANDMARK' ? 3 : 2,
          } as google.maps.Symbol;
        }

        const marker = new google.maps.Marker({
          position: placemark.coordinates as { lat: number; lng: number },
          map: mapInstanceRef.current!,
          title: placemark.name,
          icon: markerIcon,
        });

        marker.addListener('click', () => {
          onPlacemarkClick(placemark);

          if (infoWindowRef.current) {
            const isPhysical = placemark.id.startsWith('physical-');
            const isDesktop = placemark.id.startsWith('desktop-');
            let infoContent = '';

            if (isPhysical) {
              const physicalInfo = placemark as ProcessedPhysicalSurvey;
              
              const baseInfo = `
                <div class="p-3" style="max-width: 400px;">
                  <h3 class="font-semibold text-gray-900 mb-1" style="font-weight: 600; margin-bottom: 4px;">
                    ${placemark.name}
                  </h3>
                  <p class="text-sm text-gray-600">Category: ${placemark.category}</p>
                  <p class="text-sm text-gray-600">Type: Physical Survey</p>
                  <p class="text-sm text-gray-600">Survey ID: ${physicalInfo.surveyId || 'N/A'}</p>
                  <p class="text-sm text-gray-600">Block ID: ${physicalInfo.blockId || 'N/A'}</p>
                  <p class="text-sm text-gray-600">Event Type: ${physicalInfo.eventType || physicalInfo.category}</p>
                  <p class="text-sm text-gray-600">Coordinates: ${typeof placemark.coordinates === 'object' && 'lat' in placemark.coordinates 
                    ? `${placemark.coordinates.lat.toFixed(6)}, ${placemark.coordinates.lng.toFixed(6)}`
                    : 'N/A'}</p>
              `;

              const imageGallery = (physicalInfo.hasImages && physicalInfo.images) 
                ? createImageGalleryHTML(physicalInfo.images)
                : '';

              infoContent = baseInfo + imageGallery + '</div>';
              
            } else if (isDesktop) {
              const desktopInfo = placemark as ProcessedDesktopPlanning;
              infoContent = `
                <div class="p-3">
                  <h3 class="font-semibold text-gray-900 mb-1">${placemark.name}</h3>
                  <p class="text-sm text-gray-600">Category: ${placemark.category}</p>
                  <p class="text-sm text-gray-600">Type: Desktop Planning</p>
                  <p class="text-sm text-gray-600">Asset Type: ${desktopInfo.assetType || 'N/A'}</p>
                  <p class="text-sm text-gray-600">Status: ${desktopInfo.status || 'N/A'}</p>
                  ${desktopInfo.ring ? `<p class="text-sm text-gray-600">Ring: ${desktopInfo.ring}</p>` : ''}
                  ${desktopInfo.lgdCode && desktopInfo.lgdCode !== 'NULL' ? `<p class="text-sm text-gray-600">LGD Code: ${desktopInfo.lgdCode}</p>` : ''}
                  ${desktopInfo.networkId ? `<p class="text-sm text-gray-600">Network ID: ${desktopInfo.networkId}</p>` : ''}
                </div>
              `;
            } else {
              infoContent = `
                <div class="p-3">
                  <h3 class="font-semibold text-gray-900 mb-1">${placemark.name}</h3>
                  <p class="text-sm text-gray-600">Category: ${placemark.category}</p>
                  <p class="text-sm text-gray-600">Type: Point</p>
                </div>
              `;
            }

            infoWindowRef.current.setContent(infoContent);
            infoWindowRef.current.open(mapInstanceRef.current!, marker);
          }
        });

        markersRef.current.push(marker);
        bounds.extend(placemark.coordinates as unknown as google.maps.LatLng);
      } else if (placemark.type === 'polyline' && 'coordinates' in placemark && Array.isArray(placemark.coordinates)) {
        const isPhysicalSurvey = placemark.id.startsWith('physical-');
        const isDesktopPlanning = placemark.id.startsWith('desktop-');

        let strokeWeight = 3;
        let strokeOpacity = 0.8;

        if (isPhysicalSurvey) {
          const physicalInfo = placemark as ProcessedPhysicalSurvey;
          if (physicalInfo.eventType === 'SURVEY_ROUTE') {
            strokeWeight = 5;
            strokeOpacity = 0.9;
          }
        } else if (isDesktopPlanning) {
          const desktopInfo = placemark as ProcessedDesktopPlanning;
          if ((desktopInfo as any).connectionType === 'incremental') {
            strokeWeight = 4;
            strokeOpacity = 1.0;
          } else {
            strokeWeight = 3;
            strokeOpacity = 0.7;
          }
        }

        const polyline = new google.maps.Polyline({
          path: placemark.coordinates as google.maps.LatLngLiteral[],
          geodesic: true,
          strokeColor: categories.find(c => c.name === placemark.category)?.color || '#3b82f6',
          strokeOpacity: strokeOpacity,
          strokeWeight: strokeWeight,
          ...(isPhysicalSurvey && (placemark as ProcessedPhysicalSurvey).eventType === 'SURVEY_ROUTE' ? {
            strokeColor: '#FFFF2E',
            icons: [{
              icon: {
                path: 'M 0,-1 0,1',
                strokeOpacity: 1,
                scale: 1
              },
              offset: '22',
              repeat: '8px'
            }]
          } : {}),
          map: mapInstanceRef.current!,
        });

        polyline.addListener('click', (event: google.maps.MapMouseEvent) => {
          onPlacemarkClick(placemark);

          if (infoWindowRef.current && event.latLng) {
            let infoContent = '';

            if (isPhysicalSurvey) {
              const physicalInfo = placemark as ProcessedPhysicalSurvey;
              infoContent = `
                <div class="p-3">
                  <h3 class="font-semibold text-gray-900 mb-1">${placemark.name}</h3>
                  <p class="text-sm text-gray-600">Type: Physical Survey Route</p>
                  <p class="text-sm text-gray-600">Survey ID: ${physicalInfo.surveyId}</p>
                  <p class="text-sm text-gray-600">Block ID: ${physicalInfo.blockId}</p>
                  <p class="text-sm text-gray-600">Route Points: ${Array.isArray(placemark.coordinates) ? placemark.coordinates.length : 0}</p>
                </div>
              `;
            } else if (isDesktopPlanning) {
              const desktopInfo = placemark as ProcessedDesktopPlanning;
              infoContent = `
                <div class="p-3">
                  <h3 class="font-semibold text-gray-900 mb-1">${placemark.name}</h3>
                  <p class="text-sm text-gray-600">Category: ${placemark.category}</p>
                  <p class="text-sm text-gray-600">Type: Desktop Planning Connection</p>
                  <p class="text-sm text-gray-600">Connection Type: ${(desktopInfo as any).connectionType || 'N/A'}</p>
                  <p class="text-sm text-gray-600">Length: ${(desktopInfo as any).length || 'N/A'} km</p>
                  <p class="text-sm text-gray-600">Status: ${desktopInfo.status || 'N/A'}</p>
                  ${desktopInfo.networkId ? `<p class="text-sm text-gray-600">Network ID: ${desktopInfo.networkId}</p>` : ''}
                </div>
              `;
            } else {
              infoContent = `
                <div class="p-3">
                  <h3 class="font-semibold text-gray-900 mb-1">${placemark.name}</h3>
                  <p class="text-sm text-gray-600">Category: ${placemark.category}</p>
                  <p class="text-sm text-gray-600">Type: Polyline</p>
                  ${'distance' in placemark && (placemark as any).distance ? `<p class="text-sm text-gray-600">Distance: ${(placemark as any).distance}</p>` : ''}
                </div>
              `;
            }

            infoWindowRef.current.setContent(infoContent);
            infoWindowRef.current.setPosition(event.latLng);
            infoWindowRef.current.open(mapInstanceRef.current!);
          }
        });

        polylinesRef.current.push(polyline);
        (placemark.coordinates as google.maps.LatLngLiteral[]).forEach((coord: any) => bounds.extend(coord));
      }
    });

    // Fit map to show all visible placemarks (do not interrupt video/photo track fit)
    if (hasVisiblePlacemarks && !bounds.isEmpty() && !videoSurveyMode && !photoSurveyMode) {
      mapInstanceRef.current!.fitBounds(bounds, { padding: 50 });
    }
  }, [placemarks, categories, visibleCategories, mapLoaded, videoSurveyMode, photoSurveyMode]);

  // Enhanced video survey overlays with segment selection
useEffect(() => {
  if (!mapLoaded || !mapInstanceRef.current) return;

  if (!videoSurveyMode || !trackPoints.length) {
    clearSurveyOverlays();
    trackFittedOnceRef.current = false;
    return;
  }

  const needsRecreation = surveyDotsRef.current.length === 0 || 
                          !surveyPolylineRef.current;

  if (needsRecreation) {
    clearSurveyOverlays();
    
    const map = mapInstanceRef.current;
    const bounds = new google.maps.LatLngBounds();

    // Helper function to calculate distance between two points
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371e3; // Earth radius in meters
      const φ1 = (lat1 * Math.PI) / 180;
      const φ2 = (lat2 * Math.PI) / 180;
      const Δφ = ((lat2 - lat1) * Math.PI) / 180;
      const Δλ = ((lon2 - lon1) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c; // Distance in meters
    };

    // NEW: Create segmented polylines instead of one continuous line
    const createSegmentedPolylines = (trackPoints: TrackPoint[]) => {
      const segments: TrackPoint[][] = [];
      let currentSegment: TrackPoint[] = [];
      
      for (let i = 0; i < trackPoints.length; i++) {
        const point = trackPoints[i];
        const prevPoint = trackPoints[i - 1];
        
        if (prevPoint) {
          const timeDiff = point.timestamp - prevPoint.timestamp;
          const distance = calculateDistance(
            prevPoint.lat, prevPoint.lng, 
            point.lat, point.lng
          );
          
          // Break segment if gap is too large
          // 5 minutes (300000ms) or 1km distance or 500m+ straight line distance
          const shouldBreakSegment = 
            timeDiff > 300000 || // 5 minutes gap
            distance > 1000 ||   // 1km distance
            (distance > 500 && timeDiff > 60000); // 500m+ distance with 1+ minute gap
          
          if (shouldBreakSegment) {
            // Save current segment if it has enough points
            if (currentSegment.length > 1) {
              segments.push([...currentSegment]);
            }
            // Start new segment
            currentSegment = [point];
            continue;
          }
        }
        
        currentSegment.push(point);
      }
      
      // Add the last segment
      if (currentSegment.length > 1) {
        segments.push(currentSegment);
      }
      
      return segments;
    };

    // Create segmented polylines
    const segments = createSegmentedPolylines(trackPoints);
    console.log(`Created ${segments.length} polyline segments from ${trackPoints.length} track points`);

    // Create separate polyline for each segment
    segments.forEach((segment, index) => {
      const polyline = new google.maps.Polyline({
        path: segment.map(p => ({ lat: p.lat, lng: p.lng })),
        map: null,
        strokeColor: '#22C55E',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        geodesic: true,
      });
      
      // Store all polylines for cleanup (you'll need to update polylinesRef or create segmentPolylinesRef)
      polylinesRef.current.push(polyline);
    });

    map.addListener('click', handleMapClick);

    // Keep the existing blue dots logic unchanged
    const totalTrackPoints = trackPoints.length;
    
    const calculateMaxDots = (pointCount: number): number => {
      if (pointCount <= 100) return pointCount;
      if (pointCount <= 1000) return Math.min(pointCount, 200);
      if (pointCount <= 2000) return Math.min(pointCount, 350);
      if (pointCount <= 5000) return Math.min(pointCount, 500);
      if (pointCount <= 10000) return Math.min(pointCount, 650);
      if (pointCount <= 15000) return Math.min(pointCount, 800);
      return 800; // Fixed: was 900, now correctly 800
    };

    const maxDots = calculateMaxDots(totalTrackPoints);
    const step = totalTrackPoints <= maxDots ? 1 : Math.ceil(totalTrackPoints / maxDots);
    
    const selectedIndices = new Set<number>();
    selectedIndices.add(0);
    
    for (let i = step; i < totalTrackPoints - 1; i += step) {
      selectedIndices.add(i);
    }
    
    if (totalTrackPoints > 1) {
      selectedIndices.add(totalTrackPoints - 1);
    }
    
    const sortedIndices = Array.from(selectedIndices).sort((a, b) => a - b);
    console.log(`Creating ${sortedIndices.length} blue dots from ${totalTrackPoints} track points`);
    
    const markers: google.maps.Marker[] = [];
    
    sortedIndices.forEach(index => {
      const point = trackPoints[index];
      
      const dot = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: null,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 4,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `Track Point ${index + 1}: ${new Date(point.timestamp).toLocaleTimeString()}`,
        zIndex: 500,
        optimized: true,
        clickable: true,
      });
      
      dot.addListener('click', (e: google.maps.MapMouseEvent) => {
        e.stop();
        if (onTrackPointClick) {
          onTrackPointClick(point);
        }
      });
      
      markers.push(dot);
      bounds.extend({ lat: point.lat, lng: point.lng });
    });
    
    markers.forEach(marker => {
      marker.setMap(map);
      surveyDotsRef.current.push(marker);
    });
    
    console.log(`Successfully created ${surveyDotsRef.current.length} blue dots and ${segments.length} polyline segments`);

    if (!bounds.isEmpty() && !trackFittedOnceRef.current) {
      map.fitBounds(bounds, { padding: 60 });
      trackFittedOnceRef.current = true;
    }
  }

  return () => {
    if (needsRecreation) {
      google.maps.event.clearListeners(mapInstanceRef.current!, 'click');
    }
  };
}, [mapLoaded, videoSurveyMode, trackPoints]);


  // Enhanced selection markers management
  useEffect(() => {
  if (!mapLoaded || !mapInstanceRef.current || !videoSurveyMode) return;

  if (currentPosition) {
    if (!currentMarkerRef.current) {
      // Create marker only once
      currentMarkerRef.current = new google.maps.Marker({
        position: currentPosition,
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        title: 'Current Position',
        zIndex: 1000,
        optimized: false, // Important: disable optimization for smooth movement
      });
    } else {
      // Just update position, don't recreate
      currentMarkerRef.current.setPosition(currentPosition as any);
    }
  } else if (currentMarkerRef.current) {
    // Only hide/remove if currentPosition is null
    currentMarkerRef.current.setMap(null);
    currentMarkerRef.current = null;
  }
}, [currentPosition, mapLoaded, videoSurveyMode]);

  // Move the current position marker when currentPosition changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !videoSurveyMode) return;

    if (currentPosition && !currentMarkerRef.current) {
      currentMarkerRef.current = new google.maps.Marker({
        position: currentPosition,
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
        title: 'Current Position',
        zIndex: 1000,
      });
    } else if (currentMarkerRef.current && currentPosition) {
      currentMarkerRef.current.setPosition(currentPosition as any);
    } else if (currentMarkerRef.current && !currentPosition) {
      currentMarkerRef.current.setMap(null);
      currentMarkerRef.current = null;
    }
  }, [currentPosition, mapLoaded, videoSurveyMode]);

  // Photo survey overlays (keeping existing implementation)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    clearPhotoOverlays();

    if (!photoSurveyMode || !photoPoints.length) {
      return;
    }


    const map = mapInstanceRef.current;

    photoPoints.forEach(point => {
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        icon: {
          path: 'M12 2C13.1 2 14 2.9 14 4V8H18C19.1 8 20 8.9 20 10V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V10C4 8.9 4.9 8 6 8H10V4C10 2.9 10.9 2 12 2M12 4V8H12V4M7 12C7 15.31 9.69 18 13 18S19 15.31 19 12H17C17 14.21 15.21 16 13 16S9 14.21 9 12H7Z',
          fillColor: '#DCB14E',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.2,
          anchor: { x: 12, y: 22 } as unknown as google.maps.Point,
        } as unknown as google.maps.Symbol,
        title: `Photo Point: ${point.eventType} (${point.images.length} images)`,
        zIndex: 999,
      });

      marker.addListener('click', () => {
        if (onPhotoPointClick) {
          onPhotoPointClick(point);
        }

        if (infoWindowRef.current) {
          const imagesList = point.images.map(img => `<li>${img.label}</li>`).join('');
          
          const infoContent = `
            <div class="p-3" style="max-width: 300px;">
              <h3 class="font-semibold text-gray-900 mb-1" style="font-weight: 600; margin-bottom: 4px;">
                ${point.eventType} - Survey ${point.surveyId}
              </h3>
              <p class="text-sm text-gray-600">Block: ${point.blockId}</p>
              <p class="text-sm text-gray-600">Images: ${point.images.length}</p>
              <p class="text-sm text-gray-600">Coordinates: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}</p>
              ${point.timestamp ? `<p class="text-sm text-gray-600">Captured: ${new Date(point.timestamp).toLocaleString()}</p>` : ''}
              ${point.images.length > 0 ? `
                <div class="mt-2">
                  <div class="text-sm font-medium text-gray-700">Available Images:</div>
                  <ul class="text-xs text-gray-600 list-disc pl-4">
                    ${imagesList}
                  </ul>
                  <div class="text-xs text-blue-600 mt-2">Click this marker to view photos in the panel →</div>
                </div>
              ` : ''}
            </div>
          `;

          infoWindowRef.current.setContent(infoContent);
          infoWindowRef.current.open(map, marker);
        }
      });

      photoMarkersRef.current.push(marker);
    });

  }, [mapLoaded, photoSurveyMode, photoPoints, onPhotoPointClick]);

  // Highlight selected placemark
  useEffect(() => {
    if (!mapLoaded || !highlightedPlacemark || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (highlightedPlacemark.type === 'point') {
      const marker = markersRef.current.find(m => m.getTitle() === highlightedPlacemark.name);
      if (marker) {
        map.panTo(highlightedPlacemark.coordinates as google.maps.LatLngLiteral);
        map.setZoom(15);
        google.maps.event.trigger(marker, 'click');
      }
    } else if (highlightedPlacemark.type === 'polyline' && 'coordinates' in highlightedPlacemark) {
      const coords = highlightedPlacemark.coordinates as google.maps.LatLngLiteral[];
      if (coords && coords.length) {
        const bounds = new google.maps.LatLngBounds();
        coords.forEach(c => bounds.extend(c));
        map.fitBounds(bounds, { padding: 100 });
      }
    }
  }, [highlightedPlacemark, mapLoaded]);

  // Add CSS styling for image galleries (runs once when component mounts)
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .survey-image-container img:hover {
        opacity: 0.9;
        transform: scale(1.02);
        transition: all 0.2s ease;
      }

      .survey-images-grid::-webkit-scrollbar {
        width: 6px;
      }

      .survey-images-grid::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .survey-images-grid::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }

      .survey-images-grid::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  if (mapError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-8 text-center ${className}`}>
        <div className="text-red-600 mb-2">⚠️ 🗺️</div>
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
            <p className="text-gray-600">Loading enhanced map...</p>
          </div>
        </div>
      )}
      
      {/* Enhanced Video Survey Mode Indicator */}
      {videoSurveyMode && trackPoints.length > 0 && (
        <div className="absolute top-14 left-2 bg-green-100 border border-green-300 rounded-lg px-3 py-2 shadow-sm">
          <div className="text-sm font-medium text-green-800">
            Video Survey Mode
          </div>
          <div className="text-xs text-green-600">
            {trackPoints.length} track points • Click to navigate
          </div>
          {selectionState.mode === 'selecting' && (
            <div className="text-xs text-green-700 mt-1 font-medium">
              Click another point to set end of selection
            </div>
          )}
        </div>
      )}

      {/* Selection Info Display */}
      {videoSurveyMode && (selection?.start || selection?.end) && (
        <div className="absolute top-20 left-4 bg-blue-100 border border-blue-300 rounded-lg px-3 py-2 shadow-sm">
          <div className="text-sm font-medium text-blue-800">
            Segment Selection
          </div>
          <div className="text-xs text-blue-600 space-y-1">
            {selection.start && (
              <div>Start: {new Date(selection.start).toLocaleTimeString()}</div>
            )}
            {selection.end && (
              <div>End: {new Date(selection.end).toLocaleTimeString()}</div>
            )}
            {selection.start && selection.end && (
              <div className="font-medium">
                Duration: {Math.round((selection.end - selection.start) / 1000)}s
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo Survey Mode Indicator */}
      {photoSurveyMode && photoPoints.length > 0 && (
        <div className="absolute top-14 left-2 bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 shadow-sm">
          <div className="text-sm font-medium text-yellow-800">
            Photo Survey Mode
          </div>
          <div className="text-xs text-yellow-600">
            {photoPoints.length} photo points • Click icons to view images
          </div>
        </div>
      )}

      {/* Combined modes indicator */}
      {videoSurveyMode && photoSurveyMode && trackPoints.length > 0 && photoPoints.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-purple-100 border border-purple-300 rounded-lg px-3 py-2 shadow-sm">
          <div className="text-sm font-medium text-purple-800">
            Combined Survey Mode
          </div>
          <div className="text-xs text-purple-600">
            Enhanced video controls + photo viewing
          </div>
        </div>
      )}
    </div>
  );
};