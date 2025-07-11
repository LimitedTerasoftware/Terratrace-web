import React, { useState } from 'react';
import { DepthDataPoint } from '../../types/survey';
import { AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import moment from 'moment';

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
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Detailed Measurements</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
              const distance = index * 10; // Every 10m

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
                    {distance}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {point.machine_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                      {point.depthLatlong}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {point.depthPhoto &&
                     (
                        JSON.parse(point.depthPhoto)
                          .filter((url: string) => url)
                          .map((url: string, index: number) => (
                            <span
                              key={index}
                              className="underline cursor-pointer block"
                              onClick={() => setZoomImage(`${baseUrl}${url}`)}
                            >
                              depth_Img {index + 1}
                            </span>
                          ))
                      )}
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