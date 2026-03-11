import React, { useEffect, useRef, useState } from 'react';
import { MachineDataListItem } from '../../types/machine';

const EVENT_TYPE_MAPPING = {
  'DEPTH': { coordField: 'depthLatlong', photoField: 'depthPhoto' },
  'ROADCROSSING': { coordField: 'crossingLatlong', photoField: 'crossingPhotos' },
  'FPOI': { coordField: 'fpoiLatLong', photoField: 'fpoiPhotos' },
  'JOINTCHAMBER': { coordField: 'jointChamberLatLong', photoField: 'jointChamberPhotos' },
  'MANHOLES': { coordField: 'manholeLatLong', photoField: 'manholePhotos' },
  'ROUTEINDICATOR': { coordField: 'routeIndicatorLatLong', photoField: 'routeIndicatorPhotos' },
  'LANDMARK': { coordField: 'landmarkLatLong', photoField: 'landmarkPhotos' },
  'FIBERTURN': { coordField: 'fiberTurnLatLong', photoField: 'fiberTurnPhotos' },
  'KILOMETERSTONE': { coordField: 'kilometerstoneLatLong', photoField: 'kilometerstonePhotos' },
  'STARTPIT': { coordField: 'startPitLatlong', photoField: 'startPitPhotos' },
  'ENDPIT': { coordField: 'endPitLatlong', photoField: 'endPitPhotos' },
  'STARTSURVEY': { coordField: 'startPointCoordinates', photoField: 'startPointPhoto' },
  'ENDSURVEY': { coordField: 'endPointCoordinates', photoField: 'endPointPhoto' },
  'HOLDSURVEY': { coordField: 'holdLatlong', photoField: 'holdPhotos' },
  'BLOWING': { coordField: 'blowingLatLong', photoField: 'blowingPhotos' },
};

interface MachineMapComponentProps {
  activities: MachineDataListItem[];
  getColorByRegistration: (event: string | null | undefined) => string;
  minDepth?: number;
}

const baseUrl = import.meta.env.VITE_Image_URL || '';

export const MachineMapComponent: React.FC<MachineMapComponentProps> = ({ 
  activities, 
  getColorByRegistration,
  minDepth = 1.65 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const currentInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const parsePhotos = (photoString: string | null): string[] => {
    if (!photoString) return [];
    try {
      return JSON.parse(photoString);
    } catch {
      return photoString.split(',').map(p => p.trim());
    }
  };

  const getDepthValue = (depthStr: string): number => {
    const cleanDepth = depthStr.replace('m', '').trim();
    return parseFloat(cleanDepth) || 0;
  };

  useEffect(() => {
    if (!mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: { lat: 17.3882, lng: 78.4892 },
      zoom: 10,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      streetViewControl: false,
      fullscreenControl: true,
      mapTypeControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    setMap(newMap);
  }, [map]);

  useEffect(() => {
    if (!map || activities.length === 0) return;

    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    const path: google.maps.LatLngLiteral[] = [];

    activities.forEach((activity, index) => {
      const mapping = EVENT_TYPE_MAPPING[activity.eventType as keyof typeof EVENT_TYPE_MAPPING];
      if (!mapping) return;

      const coordField = mapping.coordField as keyof MachineDataListItem;
      const photoField = mapping.photoField as keyof MachineDataListItem;
      const coordinates = activity[coordField] as string;
      const isLastEvent = index === activities.length - 1;
      
      if (!coordinates) return;

      const [lat, lng] = coordinates.split(',').map(Number);
      const position = { lat, lng };
      path.push(position);

      const markerColor = getColorByRegistration(activity.eventType);
      
      const photos = parsePhotos(activity[photoField] as string | null);
      
      // Check if depth is below minimum for critical marking
      const depthValue = activity.depthMeters ? getDepthValue(activity.depthMeters) : 0;
      const isCritical = activity.eventType === 'DEPTH' && depthValue > 0 && depthValue < minDepth;
      let iconConfig: google.maps.Icon | google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: markerColor,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      };
      // Start pit
      if (activity.eventType === "STARTPIT") {
        iconConfig = {
          url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
          scaledSize: new google.maps.Size(30, 30),
        };
      }

      // End pit
      if (activity.eventType === "ENDPIT") {
        iconConfig = {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          scaledSize: new google.maps.Size(30, 30),
        };
      }
      if (activity.eventType === "DEPTH") {
        iconConfig = {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg width="30" height="40" xmlns="http://www.w3.org/2000/svg">
            <text x="15" y="12" text-anchor="middle" font-size="11" fill="black" font-weight="bold">
              ${activity.depthMeters || ""}
            </text>
            <circle cx="15" cy="28" r="6" fill="#0047AB" stroke="white" stroke-width="2"/>
          </svg>
        `),
        anchor: new google.maps.Point(15, 28)
        };
      }

      if (isLastEvent) {
         iconConfig = {
          url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg width="30" height="40" xmlns="http://www.w3.org/2000/svg">
           
            <circle cx="15" cy="28" r="6" fill="#008000" stroke="white" stroke-width="2"/>
          </svg>
        `),
        anchor: new google.maps.Point(15, 28)
        };
      }
      
      const marker = new google.maps.Marker({
      position,
      map,
      title: `${activity.eventType}`,
      icon: iconConfig
    });
     // Enhanced photo gallery with better styling
      const photoGallery = photos.length > 0 ? `
        <div style="margin-top: 16px;">
          <h4 style="margin: 0 0 12px 0; color: #1f2937; font-size: 16px; font-weight: 600;">Depth Evidence</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; max-width: 400px;">
            ${photos.slice(0, 4).map(photo => `
              <div style="position: relative; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <img src="${baseUrl}/${photo}"
                     style="width: 120px; height: 90px; object-fit: cover; cursor: pointer; transition: transform 0.2s;"
                     onclick="window.open('${baseUrl}/${photo}', '_blank')"
                     onmouseover="this.style.transform='scale(1.05)'"
                     onmouseout="this.style.transform='scale(1)'"
                     onerror="this.style.display='none'" />
              </div>
            `).join('')}
            ${photos.length > 4 ? `
              <div style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #f3f4f6, #e5e7eb); border-radius: 8px; font-size: 14px; color: #6b7280; font-weight: 600; height: 90px; cursor: pointer;" onclick="alert('View all ${photos.length} photos')">
                +${photos.length - 4} more
              </div>
            ` : ''}
          </div>
        </div>
      ` : '';

      // Calculate depth deviation for DEPTH events
      const depthInfo = activity.eventType === 'DEPTH' && activity.depthMeters ? (() => {
        const actualDepth = getDepthValue(activity.depthMeters);
        const deviation = actualDepth - minDepth;
        const deviationColor = deviation >= 0 ? '#10b981' : '#ef4444';
        const deviationSign = deviation >= 0 ? '+' : '';
        
        return `
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; padding: 16px; border-radius: 12px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <h3 style="margin: 0; font-size: 18px; font-weight: 700; letter-spacing: 1px;">DEPTH</h3>
              ${isCritical ? '<div style="background: #ef4444; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">⚠ CRITICAL</div>' : ''}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="font-size: 36px; font-weight: 800; line-height: 1;">${activity.depthMeters}</div>
              <div style="text-align: right;">
                <div style="display: flex; align-items: center; margin-bottom: 4px;">
                  <span style="color: #fbbf24; margin-right: 6px;">⚠</span>
                  <span style="font-size: 14px;">Required: ${minDepth} m</span>
                </div>
                <div style="font-size: 14px; color: ${deviationColor}; font-weight: 600;">
                  Deviation: ${deviationSign}${deviation.toFixed(1)} m
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2);">
              <span style="font-size: 14px; opacity: 0.9;">Survey ID: ${activity.survey_id}</span>
              <span style="font-size: 14px; opacity: 0.9;">Link: ${activity.start_lgd_name}-${activity.end_lgd_name}</span>
            </div>
          </div>
        `;
      })() : '';

      const criticalWarning = isCritical ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; margin: 12px 0;">
          <div style="display: flex; align-items: center;">
            <span style="color: #dc2626; font-size: 18px; margin-right: 8px;">⚠️</span>
            <p style="margin: 0; color: #dc2626; font-size: 14px; font-weight: 600;">
              CRITICAL: Depth below minimum requirement (${minDepth}m)
            </p>
          </div>
        </div>
      ` : '';

      const infoContent = `
        <div style="padding: 0; min-width: 350px; max-width: 450px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${depthInfo}
          ${criticalWarning}
          
          <!-- Machine and Contractor Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #4f46e5; margin-right: 8px; font-size: 16px;">🔧</span>
                <span style="color: #64748b; font-size: 14px; font-weight: 600;">Machine</span>
              </div>
              <div style="color: #1e293b; font-size: 16px; font-weight: 700;">${activity.machine_registration_number}</div>
            </div>
            <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="color: #059669; margin-right: 8px; font-size: 16px;">🏢</span>
                <span style="color: #64748b; font-size: 14px; font-weight: 600;">Contractor</span>
              </div>
              <div style="color: #1e293b; font-size: 16px; font-weight: 700;">${activity.firm_name}</div>
            </div>
          </div>

          <!-- Location Info -->
          <div style="background: #fef7f0; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="color: #ea580c; margin-right: 8px; font-size: 16px;">📍</span>
              <span style="color: #1e293b; font-size: 16px; font-weight: 600;">${activity.state_name}, ${activity.district_name}</span>
            </div>
            <div style="color: #64748b; font-size: 14px;">${activity.block_name}</div>
          </div>

          <!-- Additional Details -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            ${activity.dgps_accuracy ? `
              <div style="display: flex; align-items: center;">
                <span style="color: #10b981; margin-right: 8px; font-size: 14px;">🛰️</span>
                <div>
                  <div style="color: #64748b; font-size: 12px;">GPS Accuracy</div>
                  <div style="color: #1e293b; font-size: 14px; font-weight: 600;">${activity.dgps_accuracy} m</div>
                </div>
              </div>
            ` : ''}
            <div style="display: flex; align-items: center;">
              <span style="color: #6b7280; margin-right: 8px; font-size: 14px;">⏰</span>
              <div>
                <div style="color: #64748b; font-size: 12px;">${new Date(activity.created_at).toLocaleDateString()}</div>
                <div style="color: #1e293b; font-size: 14px; font-weight: 600;">${new Date(activity.created_at).toLocaleTimeString()}</div>
              </div>
            </div>
          </div>

         

          ${photoGallery}
          
          ${isLastEvent ? `
            <div style="background: linear-gradient(135deg, #dcfce7, #bbf7d0); padding: 12px; border-radius: 8px; margin-top: 16px; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center;">
                <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; margin-right: 8px; animation: pulse 2s infinite;"></div>
                <span style="color: #15803d; font-size: 14px; font-weight: 600;">🔴 LIVE POINT</span>
              </div>
              <div style="color: #166534; font-size: 12px; margin-top: 4px;">Last updated: ${new Date(activity.created_at).toLocaleTimeString()}</div>
            </div>
          ` : ''}
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
        maxWidth: 450,
        pixelOffset: new google.maps.Size(0, -10)
      });


      marker.addListener('click', () => {
         if (currentInfoWindowRef.current) {
          currentInfoWindowRef.current.close();
        }
        infoWindow.open(map, marker);
        currentInfoWindowRef.current = infoWindow;


      });
    infoWindow.addListener('closeclick', () => {
      currentInfoWindowRef.current = null;
    });
      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    const surveyGroups: Record<number, MachineDataListItem[]> = {};

    activities.forEach((activity) => {
      if (!surveyGroups[activity.survey_id]) {
        surveyGroups[activity.survey_id] = [];
      }
      surveyGroups[activity.survey_id].push(activity);
    });
    
    Object.values(surveyGroups).forEach((surveyActivities) => {

    const surveyPath: google.maps.LatLngLiteral[] = [];

    surveyActivities.forEach((activity) => {
      const mapping = EVENT_TYPE_MAPPING[
        activity.eventType as keyof typeof EVENT_TYPE_MAPPING
      ];
      if (!mapping) return;

      const coordField = mapping.coordField as keyof MachineDataListItem;
      const coordinates = activity[coordField] as string;

      if (!coordinates) return;

      const [lat, lng] = coordinates.split(",").map(Number);
      surveyPath.push({ lat, lng });
    });

    if (surveyPath.length > 1) {
      const polyline = new google.maps.Polyline({
        path: surveyPath,
        geodesic: true,
        strokeColor: "#2563eb",
        strokeOpacity: 1,
        strokeWeight: 4,
      });

      polyline.setMap(map);
    }
  });

    if (path.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);

      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom() && map.getZoom()! > 16) {
          map.setZoom(16);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [map, activities, getColorByRegistration, minDepth]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
};