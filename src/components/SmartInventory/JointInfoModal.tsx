import { X, MapPin, Cable as CableIcon, Image as ImageIcon } from 'lucide-react';
import { ProcessedJoints } from '../../types/kmz';

interface JointInfoModalProps {
  joint: ProcessedJoints;
  baseUrl?: string;
  onClose: () => void;
}

export default function JointInfoModal({ joint, baseUrl = '', onClose }: JointInfoModalProps) {
    console.log(baseUrl);
  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-gray-100 text-gray-700';
     
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active')) return 'bg-green-100 text-green-700';
    if (statusLower.includes('branch')) return 'bg-yellow-100 text-yellow-700';
    if (statusLower.includes('pass')) return 'bg-blue-100 text-blue-700';
    if (statusLower.includes('cut')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

 

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-start justify-between pr-12">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {joint.name} {joint.joint_type && `(${joint.joint_type})`}
              </h2>
              <div className="flex flex-wrap gap-2 text-sm">
                {joint.work_type && (
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    {joint.work_type}
                  </span>
                )}
                {joint.joint_code && (
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    Code: {joint.joint_code}
                  </span>
                )}
                {joint.cables && (
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center gap-1">
                    <CableIcon size={14} />
                    {joint.cables.length} Cables
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="mt-4 flex items-center gap-2 text-sm opacity-90">
            <MapPin size={16} />
            <span>
              {joint.address || `${joint.block_name}, ${joint.district_name}, ${joint.state_name}`}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cable Information */}
          {joint.cables && joint.cables.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm">1</span>
                Cable Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {joint.cables.map((cable, idx) => (
                  <div
                    key={cable.cable_id}
                    className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="font-semibold text-gray-900 mb-2">
                      Cable {String.fromCharCode(65 + idx)}
                      <span className="text-sm text-gray-600 ml-1">ID: {cable.cable_name}</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <span className="text-gray-500">From:</span>
                        <span className="font-medium">{cable.from_node}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">To:</span>
                        <span className="font-medium">{cable.to_node}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Fiber Count:</span>
                        <span className="font-medium">{cable.fiber_count}F</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cable Type:</span>
                        <span className="font-medium">{cable.cable_type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tube Mapping Summary */}
          {joint.tube_mapping && joint.tube_mapping.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm">2</span>
                Tube Mapping Summary
              </h3>
              <div className="space-y-2">
                {joint.tube_mapping.map((mapping, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{mapping.from_cable_name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Tube {mapping.from_tube}</span>
                        <div
                          className={`w-4 h-4 rounded-full`}
                         style={{ backgroundColor: mapping.from_tube_color }}

                          title={mapping.from_tube_color}
                        />
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex items-center gap-1 text-gray-400">
                        <div className="w-8 h-0.5 bg-gray-300" />
                        <span className="text-xs">→</span>
                        <div className="w-8 h-0.5 bg-gray-300" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-4 h-4 rounded-full `}
                           style={{ backgroundColor: mapping.to_tube_color }}
                          title={mapping.to_tube_color}
                        />
                        <span className="text-xs text-gray-500">Tube {mapping.to_tube}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{mapping.to_cable_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Fiber Splicing Table */}
          {joint.fiber_splicing && joint.fiber_splicing.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm">3</span>
                Core-Level Connectivity 
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b-2 border-gray-300">
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">From Cable</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">From Tube</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">From Core</th>
                      <th className="px-3 py-2 text-center font-semibold text-gray-700">→</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">To Cable</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">To Tube</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">To Core</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {joint.fiber_splicing.map((splice, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-2 font-medium text-gray-900">{splice.from_cable_name}</td>
                        <td className="px-3 py-2 text-gray-700">{splice.from_tube}</td>
                        <td className="px-3 py-2 text-gray-700">{splice.from_core}</td>
                        <td className="px-3 py-2 text-center text-gray-400">→</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{splice.to_cable_name}</td>
                        <td className="px-3 py-2 text-gray-700">{splice.to_tube}</td>
                        <td className="px-3 py-2 text-gray-700">{splice.to_core}</td>
                        <td className="px-3 py-2">
                          {splice.status && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(splice.status)}`}>
                              {splice.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Photos */}
          {joint.photo_path && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ImageIcon size={20} className="text-gray-600" />
                Site Photos
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer">
                  <img
                    src={`${baseUrl}${joint.photo_path}`}
                    alt="Joint photo"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
