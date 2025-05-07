import React, { useState } from "react";
import axios from "axios";

const FileUpload: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
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
    <div className="p-4 max-w-md mx-auto">
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

export default FileUpload;
