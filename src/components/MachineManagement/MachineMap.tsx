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
  const EVENT_TYPES = {
    STARTSURVEY: { color: '#10B981', icon: '🎯', label: 'Survey Start' },
    DEPTH: { color: '#3B82F6', icon: '📏', label: 'Depth' },
    ROADCROSSING: { color: '#F59E0B', icon: '🛣️', label: 'Road Crossing' },
    FPOI: { color: '#EF4444', icon: '📍', label: 'FPOI' },
    JOINTCHAMBER: { color: '#8B5CF6', icon: '🔧', label: 'Joint Chamber' },
    MANHOLES: { color: '#06B6D4', icon: '🕳️', label: 'Manholes' },
    ROUTEINDICATOR: { color: '#84CC16', icon: '🧭', label: 'Route Indicator' },
    LANDMARK: { color: '#F97316', icon: '🏛️', label: 'Landmark' },
    FIBERTURN: { color: '#EC4899', icon: '🔄', label: 'Fiber Turn' },
    KILOMETERSTONE: { color: '#6B7280', icon: '📏', label: 'Kilometer Stone' },
    STARTPIT: { color: '#14B8A6', icon: '🕳️', label: 'Start Pit' },
    ENDPIT: { color: '#DC2626', icon: '🏁', label: 'End Pit' },
    ENDSURVEY: { color: '#10B981', icon: '🎯', label: 'End Survey' },
    HOLDSURVEY: { color: '#a93226', icon: '⏸️', label: 'Hold Survey'},
    BLOWING: { color: '#663300', icon:'💨',label: 'Blowing Survey' },
  };

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
      
      const marker = new google.maps.Marker({
      position,
      map,
      title: `${activity.eventType}`,
      icon: {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg width="30" height="40" xmlns="http://www.w3.org/2000/svg">
            <text x="15" y="12" text-anchor="middle" font-size="11" fill="black" font-weight="bold">
              ${activity.depthMeters || ""}
            </text>
            <circle cx="15" cy="28" r="6" fill="${markerColor}" stroke="white" stroke-width="2"/>
          </svg>
        `),
        anchor: new google.maps.Point(15, 28)
      }
    });
      const photoGallery = photos.length > 0 ? `
        <div style="margin-top: 8px;">
          <h4 style="margin: 0 0 4px 0; color: #374151; font-size: 12px; font-weight: 600;">Photos:</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 4px; max-width: 300px;">
            ${photos.slice(0, 6).map(photo => `
              <img src="${baseUrl}/${photo}"
                   style="width: 80px; height: 60px; object-fit: cover; border-radius: 4px; cursor: pointer;"
                   onclick="window.open('${baseUrl}/${photo}', '_blank')"
                   onerror="this.style.display='none'" />
            `).join('')}
            ${photos.length > 6 ? `<div style="display: flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 4px; font-size: 10px; color: #6b7280;">+${photos.length - 6}</div>` : ''}
          </div>
        </div>
      ` : '';

      const criticalWarning = isCritical ? `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 8px; margin: 8px 0;">
          <p style="margin: 0; color: #dc2626; font-size: 12px; font-weight: 600;">
            ⚠️ CRITICAL: Depth below minimum (${minDepth}m)
          </p>
        </div>
      ` : '';

      const infoContent = `
        <div style="padding: 12px; min-width: 300px; max-width: 400px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px; font-weight: 600;">
            ${activity.eventType} ${isLastEvent ? '(Live Point)' : ''}
          </h3>
          ${criticalWarning}
          <div style="margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>Machine:</strong> ${activity.machine_registration_number}
            </p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>Firm:</strong> ${activity.firm_name}
            </p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>User:</strong> ${activity.user_name}
            </p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>Location:</strong> ${activity.state_name}, ${activity.district_name}
            </p>
            <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
              <strong>Survey ID:</strong> ${activity.survey_id}
            </p>
            ${activity.start_lgd_name ? `
              <p style="margin: 0 0 4px 0; color: #4b5563; font-size: 13px;">
                <strong>Link:</strong> ${activity.start_lgd_name} - ${activity.end_lgd_name}
              </p>
            ` : ''}
            ${activity.depthMeters ? `
              <p style="margin: 0 0 4px 0; color: ${isCritical ? '#dc2626' : '#2563eb'}; font-size: 13px; font-weight: 600;">
                <strong>Depth:</strong> ${activity.depthMeters}
              </p>
            ` : ''}
            ${activity.crossingLength ? `
              <p style="margin: 0 0 4px 0; color: #dc2626; font-size: 13px; font-weight: 600;">
                <strong>Crossing Length:</strong> ${activity.crossingLength}
              </p>
            ` : ''}
            ${activity.roadWidth ? `
              <p style="margin: 0 0 4px 0; color: #059669; font-size: 13px; font-weight: 600;">
                <strong>Road Width:</strong> ${activity.roadWidth}m
              </p>
            ` : ''}
            ${activity.dgps_accuracy ? `
              <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 12px;">
                <strong>GPS Accuracy:</strong> ${activity.dgps_accuracy}m
              </p>
            ` : ''}
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 11px;">
            ${new Date(activity.created_at).toLocaleString()}
          </p>
          ${photoGallery}
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
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