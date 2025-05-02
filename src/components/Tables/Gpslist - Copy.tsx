import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEye, FaEdit, FaTrash, FaPlusCircle } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";


interface GpExchange {
  id: string;
  name: string;
  lattitude: string;
  longitude: string;
  type: string;
  st_name: string;
  dt_name: string;
  blk_name: string;
}

const Gpslist = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [data, setData] = useState<GpExchange[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASEURL}/masterData`);
        setData(response.data.data.gplist); // Adjust based on actual API response structure
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="text-center py-4">Loading...</p>;
  if (error) return <p className="text-center py-4 text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Gps List</h1>
        <button
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          onClick={() => console.log("Add new entry")}
        >
          <FaPlusCircle className="h-5 w-5" />
          Add New
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="w-full table-auto border-collapse text-center">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Latitude</th>
              <th className="px-4 py-2">Longitude</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">State Name</th>
              <th className="px-4 py-2">District Name</th>
              <th className="px-4 py-2">Block Name</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((exchange, index) => (
              <tr
                key={index}
                className="border-b text-sm text-gray-700 hover:bg-gray-50"
              >
                <td className="px-4 py-2">{exchange.id}</td>
                <td className="px-4 py-2">{exchange.name}</td>
                <td className="px-4 py-2">{exchange.lattitude}</td>
                <td className="px-4 py-2">{exchange.longitude}</td>
                <td className="px-4 py-2">{exchange.type}</td>
                <td className="px-4 py-2">{exchange.st_name}</td>
                <td className="px-4 py-2">{exchange.dt_name}</td>
                <td className="px-4 py-2">{exchange.blk_name}</td>
                <td className="px-4 py-2 flex items-center gap-2">
                    <button
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => console.log("View", exchange)}
                  >
                    <FaEdit className="h-5 w-5" />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => console.log("Delete", exchange)}
                  >
                    <FaTrash className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Gpslist;
