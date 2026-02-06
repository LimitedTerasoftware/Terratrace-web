import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Cable as CableIcon, Image as ImageIcon, Loader } from 'lucide-react';
import { ProcessedJoints } from '../../types/survey';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { FaArrowLeft } from 'react-icons/fa';
import { Header } from '../Breadcrumbs/Header';



export default function JointDetails() {
  const { jointId } = useParams();
  const navigate = useNavigate();
  const [joint, setJoint] = useState<ProcessedJoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const TraceBaseUrl = import.meta.env.VITE_TraceAPI_URL;
  const ImgBaseUrl = import.meta.env.VITE_Image_URL;

  useEffect(() => {
    const fetchJointData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${TraceBaseUrl}/joint_fiber/${jointId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch joint data');
        }
        const data = await response.json();

        const transformedJoint: ProcessedJoints = {
          id: jointId,
          name: data.joint_name,
          category: data.joint_type,
          type: 'point',
          coordinates: { lat: parseFloat(data.gps_lat), lng: parseFloat(data.gps_long) },
          address: data.address,
          joint_code: data.joint_name,
          joint_type: data.joint_type,
          work_type: data.work_type,
          state_name: data.state_name,
          district_name: data.district_name,
          block_name: data.block_name,
          photo_path: data.photo_path,
          cables: data.cables || [],
          tube_mapping: data.tube_mapping || [],
          fiber_splicing: data.fiber_splicing || [],
        };

        setJoint(transformedJoint);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchJointData();
  }, [jointId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-blue-600" size={32} />
          <p className="text-gray-600">Loading joint details...</p>
        </div>
      </div>
    );
  }

  if (error || !joint) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="max-w-6xl mx-auto p-6">
          <button
            onClick={() => window.history.back()}

            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 px-4 py-2 rounded-lg transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to List
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-700 font-semibold">Error loading joint details</p>
            <p className="text-red-600 text-sm mt-1">{error || 'Joint not found'}</p>
          </div>
        </div>
      </div>
    );
  }
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
    <>
    <div className="min-h-screen">

        <ToastContainer />
        <div className="container mx-auto px-1">
            <div className="bg-white shadow-sm border-b border-gray-200 text-black px-3 py-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                        {joint.name} {joint.joint_type && `(${joint.joint_type})`}
                        </h1>
                        <div className="flex flex-wrap gap-2 text-sm">
                        {joint.work_type && (
                            <span className="bg-blue-500 bg-opacity-20 px-3 py-1 rounded-full">
                            {joint.work_type}
                            </span>
                        )}
                        {joint.joint_code && (
                            <span className="bg-blue-500  bg-opacity-20 px-3 py-1 rounded-full">
                            Code: {joint.joint_code}
                            </span>
                        )}
                        {joint.cables && (
                            <span className="bg-blue-500  bg-opacity-20 px-3 py-1 rounded-full flex items-center gap-1">
                            <CableIcon size={14} />
                            {joint.cables.length} Cables
                            </span>
                        )}
                        </div>

                        {/* Location Info */}
                        <div className="mt-4 flex items-center gap-2 text-sm opacity-90">
                        <MapPin size={16} />
                        <span>
                            {joint.address || `${joint.block_name}, ${joint.district_name}, ${joint.state_name}`}
                        </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                    <button
                    className="flex items-center gap-3 text-blue-600 hover:text-blue-700  transition-colors duration-200 group"
                    onClick={() => window.history.back()}
                    >
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
                        <ArrowLeft className="h-4 w-4" />
                    </div>
                    <span className="font-medium">Back to List</span>
                    </button>
                    </div>
                </div>
            </div>

                {/* Content */}
                <div className="py-2 space-y-6">
                {/* Cable Information */}
                {joint.cables && joint.cables.length > 0 && (
                    <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm">1</span>
                        Cable Information
                    </h2>
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
                    <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm">2</span>
                        Tube Mapping Summary
                    </h2>
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
                                className={`w-4 h-4 rounded-full`}
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
                    <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm">3</span>
                        Core-Level Connectivity Table
                    </h2>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto border">
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
                    <section className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ImageIcon size={20} className="text-gray-600" />
                        Site Photos
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer">
                        <img
                            src={`${ImgBaseUrl}${joint.photo_path}`}
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

    </>
  );
}
