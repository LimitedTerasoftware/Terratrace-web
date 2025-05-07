import React, { useState, useEffect } from "react";
import axios from "axios";

type KmlPoint = {
  id: number;
  link_name: string;
  description: string;
  latitude: number;
  longitude: number;
};

const FileUpload: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const parseKML = async (file: File) => {
    const text = await file.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");

    const placemarks = Array.from(xml.getElementsByTagName("Placemark"));
    return placemarks.map(pm => {
      const name = pm.getElementsByTagName("name")[0]?.textContent || "";
      const description = pm.getElementsByTagName("description")[0]?.textContent || "";
      const coordinatesText =
        pm.getElementsByTagName("coordinates")[0]?.textContent?.trim() || "";
      const [lon, lat] = coordinatesText.split(",").map(parseFloat);

      return {
        link_name: name,
        description,
        latitude: lat,
        longitude: lon,
      };
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    try {
      const data = await parseKML(file);
      const res = await axios.post(`${BASEURL}upload-kml`, { data });
      setMessage(res.data.message || "Upload successful!");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed.");
    }
  };

  return (
    <div className="p-4">
      <input
        type="file"
        accept=".kml"
        onChange={handleChange}
        className="w-full mb-2 border p-2"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Upload
      </button>
      {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
    </div>
  );
};

const UploadedList: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [data, setData] = useState<KmlPoint[]>([]);
  const [page, setPage] = useState<number>(1);
  const [lastPage, setLastPage] = useState<number>(1);

  const fetchData = async (page: number) => {
    try {
      const res = await axios.get(`${BASEURL}kml-points?page=${page}`);
      setData(res.data.data);
      setLastPage(res.data.last_page);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  return (
    <div className="p-4 w-full mx-auto">
      <h2 className="text-xl font-bold mb-4">Uploaded KML Data</h2>
      <table className="w-full table-auto border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Description</th>
            <th className="border px-2 py-1">Latitude</th>
            <th className="border px-2 py-1">Longitude</th>
          </tr>
        </thead>
        <tbody>
          {data.map(point => (
            <tr key={point.id}>
              <td className="border px-2 py-1">{point.link_name}</td>
              <td className="border px-2 py-1">{point.description}</td>
              <td className="border px-2 py-1">{point.latitude}</td>
              <td className="border px-2 py-1">{point.longitude}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span>Page {page}</span>
        <button
          onClick={() => setPage(prev => Math.min(prev + 1, lastPage))}
          disabled={page === lastPage}
          className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const KmlManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"upload" | "list">("upload");

  return (
    <div className="w-full mx-auto">
      <div className="flex border-b">
        <button
          className={`px-4 py-2 text-lg font-semibold transition-all ${activeTab === "upload" ? "border-b-2 border-blue-600 text-blue-600" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload KML
        </button>
        <button
          className={`px-4 py-2 ${activeTab === "list" ? "border-b-2 border-blue-600 text-blue-600" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          KML Data
        </button>
      </div>

      <div>
        {activeTab === "upload" ? <FileUpload /> : <UploadedList />}
      </div>
    </div>
  );
};

export default KmlManager;
