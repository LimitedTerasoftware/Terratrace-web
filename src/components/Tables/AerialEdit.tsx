import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

import { FaArrowLeft } from "react-icons/fa";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface AerialEdit {
  [key: string]: string;
}

const AerialFields: { name: string; label: string }[] = [
  // AerialSurvey fields
  // { name: "id", label: "ID" },
  { name: "startGpName", label: "Start GP Name" },
  { name: "startGpCoordinates", label: "Start GP Coordinates" },
  { name: "endGpName", label: "End GP Name" },
  { name: "endGpCoordinates", label: "End GP Coordinates" },

  // AerialRoadCrossing fields (prefixed with "roadCrossing_")
  { name: "roadCrossing_id", label: "Road Crossing ID" },
  { name: "roadCrossing_typeOfCrossing", label: "Road Crossing Type" },
  { name: "roadCrossing_slattitude", label: "Road Crossing Start Latitude" },
  { name: "roadCrossing_slongitude", label: "Road Crossing Start Longitude" },
  { name: "roadCrossing_elattitude", label: "Road Crossing End Latitude" },
  { name: "roadCrossing_elongitude", label: "Road Crossing End Longitude" },
  { name: "roadCrossing_startPhoto", label: "Road Crossing Start Photo" },
  { name: "roadCrossing_endPhoto", label: "Road Crossing End Photo" },
  { name: "roadCrossing_length", label: "Road Crossing Length" },

  // AerialPole fields (prefixed with "pole_")
  { name: "pole_id", label: "Pole ID" },
  { name: "pole_electricityLineType", label: "Pole Electricity Line Type" },
  { name: "pole_lattitude", label: "Pole Latitude" },
  { name: "pole_longitude", label: "Pole Longitude" },
  { name: "pole_poleAvailabilityAt", label: "Pole Availability At" },
  { name: "pole_poleCondition", label: "Pole Condition" },
  { name: "pole_poleHeight", label: "Pole Height" },
  { name: "pole_polePhoto", label: "Pole Photo" },
  { name: "pole_polePosition", label: "Pole Position" },
  { name: "pole_poleType", label: "Pole Type" },
  { name: "pole_typeOfPole", label: "Pole Type of Pole" },
];

function AerialEdit() {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const { id } = useParams();
  const [data, setData] = useState<AerialEdit | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [startGpName, setStartGpName] = useState<string[]>([]);
  const [endGpName, setEndGpName] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASEURL}/aerial-surveys/${id}`);
        setData(response.data.data);
        console.log(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  useEffect(() => {
    const fetchStartGp = async () => {
      try {
        const response = await axios.get(`${BASEURL}/aerial-surveys`);
        console.log(response.data);
        console.log("startGp",response.data.data.map((startGp: any) => startGp.startGpName));
        setStartGpName(response.data.data.map((startGp: any) => startGp.startGpName));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchStartGp();
  }, []);
  useEffect(() => {
    const fetchEndGp = async () => {
      try {
        const response = await axios.get(`${BASEURL}/aerial-surveys`);
        console.log(response.data);
        console.log("EndGp",response.data.data.map((endGp: any) => endGp.endGpName));
        setEndGpName(response.data.data.map((endGp: any) => endGp.endGpName));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchEndGp();
  }, []);

  

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    try {
      await axios.put(`${BASEURL}/aerial-surveys/${data.id}`, data);
      alert("Record updated successfully!");
    } catch (error) {
      alert("Failed to update record.");
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (!data) {
    return <div>No data found.</div>;
  }

  return (
    <> 
    <ToastContainer />
          <button
            className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
            onClick={() => window.history.back()}
          >
            <FaArrowLeft className="h-5 w-5" />
            Back
          </button>
          <h1 className="text-2xl font-bold mb-6">AERIAL EDIT DETAILS</h1>

          <form onSubmit={handleEditSave}>
            <div className="grid gap-6 mb-6 md:grid-cols-3">
              {/* State Name Dropdown */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Start GP Name
                </label>
                <select
                  value={data.startGpName || ""}
                  onChange={(e) => setData({ ...data, startGpName: e.target.value })}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="">Select Start Gp</option>
                  {startGpName.map((startgp, index) => (
                    <option key={index} value={startgp}>
                      {startgp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  End GP Name
                </label>
                <select
                  value={data.endGpName || ""}
                  onChange={(e) => setData({ ...data, endGpName: e.target.value })}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="">Select End GP Name</option>
                  {endGpName.map((endgp, index) => (
                    <option key={index} value={endgp}>
                      {endgp}
                    </option>
                  ))}
                </select>
              </div>

          

              {/* Render the rest of the fields as text inputs */}
              {AerialFields
                .filter(
                  (field) =>
                    field.name !== "startGpName" &&
                    field.name !== "endGpName"
                   
                )
                .map((field, index) => (
                  <div key={index}>
                    <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      aria-label={field.label}
                      value={data[field.name] || ""}
                      onChange={(e) => setData({ ...data, [field.name]: e.target.value })}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder={field.label}
                    />
                  </div>
                ))}
            </div>
            <button
              type="submit"
              className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
            >
              Update
            </button>
          </form>
    </>
  );
}

export default AerialEdit;
