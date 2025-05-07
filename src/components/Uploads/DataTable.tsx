import React, { useEffect, useState } from "react";
import axios from "axios";

interface KmlEntry {
  id: number;
  link_name: string;
  description: string;
  latitude: number;
  longitude: number;
}

const DataTable: React.FC = () => {
  const [data, setData] = useState<KmlEntry[]>([]);

  useEffect(() => {
    axios.get<KmlEntry[]>("http://localhost:8000/api/kml-data")
      .then(res => setData(res.data))
      .catch(() => console.error("Failed to fetch data"));
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Uploaded KML Data</h2>
      <table className="w-full table-auto border border-gray-300">
        <thead className="bg-gray-200">
          <tr>
            <th className="border px-4 py-2">Link Name</th>
            <th className="border px-4 py-2">Description</th>
            <th className="border px-4 py-2">Latitude</th>
            <th className="border px-4 py-2">Longitude</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.id}>
              <td className="border px-4 py-2">{entry.link_name}</td>
              <td className="border px-4 py-2">{entry.description}</td>
              <td className="border px-4 py-2">{entry.latitude}</td>
              <td className="border px-4 py-2">{entry.longitude}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
