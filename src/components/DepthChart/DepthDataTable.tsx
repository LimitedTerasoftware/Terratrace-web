import React, { useState } from 'react';
import { Activity, DepthDataPoint, VideoDetails } from '../../types/survey';
import { AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import moment from 'moment';
import { getDistanceFromLatLonInMeters } from '../../utils/calculations';
import { MediaItem } from '../../types/aerial-survey';

interface DepthDataTableProps {
  depthData: DepthDataPoint[];
  minDepth?: number;
}
const BASEURL_Val = import.meta.env.VITE_API_BASE;
const baseUrl = import.meta.env.VITE_Image_URL;
export const DepthDataTable: React.FC<DepthDataTableProps> = ({ 
  depthData, 
  minDepth = 1.65 
}) => {
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const baseUrl = import.meta.env.VITE_Image_URL;

    const eventPhotoFields: Record<string, keyof DepthDataPoint> = {
            DEPTH: "depthPhoto",
            STARTPIT: 'startPitPhotos',
            ENDPIT: 'endPitPhotos',
            JOINTCHAMBER: "jointChamberPhotos",
            MANHOLES: "manholePhotos",
        };
    const extractMediaFromRow = (row: DepthDataPoint): MediaItem[] => {
                const mediaItems: MediaItem[] = [];
                  const addImages = (rawPhotoData: any, labelPrefix: string) => {
                    if (typeof rawPhotoData === "string" && rawPhotoData.trim() !== "") {
                        const urls = parseMediaUrls(rawPhotoData);

                        urls.forEach((url, index) => {
                            if (url) {
                                mediaItems.push({
                                    type: "image",
                                    url: `${baseUrl}${url}`,
                                    label: `${labelPrefix} ${urls.length > 1 ? index + 1 : ""}`.trim(),
                                });
                            }
                        });
                    }
                };
        
                // Get photo field for this event type
                const photoField = eventPhotoFields[row.eventType];
                const rawPhotoData = photoField ? row[photoField] : null;

                addImages(rawPhotoData, `${row.eventType} Photo`);

              if (row.eventType === "JOINTCHAMBER" || row.eventType === "MANHOLES") {
                    const depthPhotoField = eventPhotoFields["DEPTH"]; // depthPhoto
                    const depthPhotos = row[depthPhotoField];

                    addImages(depthPhotos, "DEPTH Photo");
                }
            
              
              return mediaItems;
            };

    const parseMediaUrls = (raw: any): string[] => {
        if (!raw || typeof raw !== "string") return [];

        let value = raw.trim();

        try {
            // First parse (handles "[\"...\"]")
            const firstParse = JSON.parse(value);

            // If result is still a string, parse again
            if (typeof firstParse === "string") {
                const secondParse = JSON.parse(firstParse);
                return Array.isArray(secondParse) ? secondParse : [secondParse];
            }

            // If it's already an array
            if (Array.isArray(firstParse)) {
                return firstParse;
            }

            return [value];
        } catch {
            // Fallback for plain string or comma-separated values
            if (value.startsWith("[") && value.endsWith("]")) {
                return value
                    .slice(1, -1)
                    .split(",")
                    .map(v => v.replace(/^"|"$/g, "").trim());
            }

            return [value];
        }
    };
    let cumulativeDistance = 0;
    let latlong = '';
    const getLatLng = (point: any): { lat: number; lng: number } | null => {
      let coord: string | null | undefined = null;

      switch (point.eventType) {
        case 'DEPTH':
          coord = point.depthLatlong;
          break;
        case 'STARTPIT':
          coord = point.startPitLatlong;
          break;
        case 'ENDPIT':
          coord = point.endPitLatlong;
          break;
        case 'JOINTCHAMBER':
          coord = point.jointChamberLatLong;
          break;
        case 'MANHOLES':
          coord = point.manholeLatLong;
          break;
        default:
          coord = point.depthLatlong || point.startPitLatlong || point.endPitLatlong || point.jointChamberLatLong || point.manholeLatLong || null;
      }

      if (!coord) return null;

      const [latStr, lngStr] = coord.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      if (isNaN(lat) || isNaN(lng)) return null;

      return { lat, lng };
    };
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Measurements</h3>
      
      <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Survey Id 
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Link Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Depth (m)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Distance (m)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Machine ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coordinates
              </th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Images
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {depthData.map((point, index) => {
              const depth = parseFloat(point.depthMeters);
              const isBelowMinimum = depth < minDepth;
              let latlong = point.eventType === "DEPTH" ? point.depthLatlong :
                         point.eventType === "STARTPIT" ? point.startPitLatlong :
                         point.eventType === "ENDPIT" ? point.endPitLatlong : 
                         point.eventType === "JOINTCHAMBER" ? point.jointChamberLatLong :
                         point.eventType === "MANHOLES" ? point.manholeLatLong : 'N/A';
              const mediaItems = extractMediaFromRow(point);
              const current = getLatLng(point);
              const prev = index > 0 ? getLatLng(depthData[index - 1]) : null;
                if (current && prev) {
                    const segmentDistance = getDistanceFromLatLonInMeters(
                      prev.lat,
                      prev.lng,
                      current.lat,
                      current.lng
                    );
            
                    cumulativeDistance += segmentDistance;
                 }
             
              return (
                <tr 
                  key={index} 
                  className={`hover:bg-gray-50 ${isBelowMinimum ? 'bg-red-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {isBelowMinimum ? (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      <span className={`ml-2 text-sm font-medium ${
                        isBelowMinimum ? 'text-red-700' : 'text-green-700'
                      }`}>
                        {isBelowMinimum ? 'Critical' : 'Normal'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {point.survey_id} - {point.eventType}({point.id})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {point.start_lgd_name}_{point.end_lgd_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${
                      isBelowMinimum ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {depth.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      (Min: {minDepth})
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     {Math.round(cumulativeDistance)} m
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {point.machine_registration_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                      {latlong || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {mediaItems.length > 0 ? (
                      mediaItems.map((item, idx) => (
                        <span key={idx} className="block text-xs text-blue-600 underline cursor-pointer" onClick={() => setZoomImage(item.url)}>
                          {item.label}
                        </span>
                      ))
                    ) : null}
                  
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {moment(point.created_at).format("DD/MM/YYYY, hh:mm A")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
       {zoomImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50"
          onClick={() => setZoomImage(null)}
        >
          <img
            src={zoomImage}
            alt="Zoomed"
            className="max-w-full max-h-full p-4 rounded-lg"
          />
        </div>
      )}
    </div>
  );
};