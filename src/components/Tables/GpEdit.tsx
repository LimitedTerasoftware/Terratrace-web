import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

import { FaArrowLeft } from "react-icons/fa";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface GpEdit {
    [key: string]: string;
  }

const gpFields: { name: keyof GpEdit; label: string }[] = [
    // { name: "id", label: "ID" },
    // { name: "state_name", label: "State Name" },
    // { name: "district_name", label: "District Name" },
    // { name: "block_name", label: "Block Name" },
    // { name: "gp_name", label: "GP Name" },
    { name: "gpCoordinates", label: "GP Coordinates" },
    { name: "gpBuildingType", label: "GP Building Type" },
    { name: "gpHouseType", label: "GP House Type" },
    { name: "gpBuildingHeight", label: "GP Building Height" },
    { name: "gpNoRooms", label: "GP Number of Rooms" },
    { name: "ceilingHeight", label: "Ceiling Height" },
    // { name: "gpPhotos", label: "GP Photos" },
    { name: "electricHours", label: "Electric Hours" },
    { name: "switchBoardType", label: "Switch Board Type" },
    { name: "socketsCount", label: "Sockets Count" },
    { name: "powerInterruptionCount", label: "Power Interruption Count" },
    { name: "personName", label: "Person Name" },
    { name: "personNumber", label: "Person Number" },
    { name: "personEmail", label: "Person Email" },
    { name: "keyPersonName", label: "Key Person Name" },
    { name: "keyPersonNumber", label: "Key Person Number" },
    { name: "ebMeter", label: "EB Meter" },
    { name: "flooring", label: "Flooring" },
    { name: "ftb", label: "FTB" },
    { name: "gpLayoutPhoto", label: "GP Layout Photo" },
    { name: "gpNoFloors", label: "GP Number of Floors" },
    { name: "gpSpaceAvailableForPhase3", label: "GP Space Available for Phase 3" },
    { name: "meterToRackCableRequired", label: "Meter to Rack Cable Required" },
    { name: "powerNonAvailableForPerDayHours", label: "Power Non-Available Hours Per Day" },
    { name: "rackToEarthPitCableRequired", label: "Rack to Earth Pit Cable Required" },
    { name: "rackToSolarCableRequired", label: "Rack to Solar Cable Required" },
    { name: "roofSeepage", label: "Roof Seepage" },
    // { name: "roofSeepagePhoto", label: "Roof Seepage Photo" },
    { name: "solarInstallationPossibility", label: "Solar Installation Possibility" },
    { name: "solarPanelVegetation", label: "Solar Panel Vegetation" },
    // { name: "gpEntirePhoto", label: "GP Entire Photo" },
    { name: "roomSpace", label: "Room Space" },
    // { name: "roomSpacePhoto", label: "Room Space Photo" },
    { name: "solarPanelSpaceSize", label: "Solar Panel Space Size" },
    { name: "loadCapacity", label: "Load Capacity" },
    // { name: "polePhoto", label: "Pole Photo" },
    // { name: "earthPitPhoto", label: "Earth Pit Photo" },
    { name: "earthPitCoordinates", label: "Earth Pit Coordinates" },
    { name: "poleCoordinates", label: "Pole Coordinates" },
    // { name: "equipmentPhoto", label: "Equipment Photo" },
    { name: "rack", label: "Rack" },
    { name: "rackCount", label: "Rack Count" },
    { name: "splitterCount", label: "Splitter Count" },
    { name: "upsMake", label: "UPS Make" },
    { name: "upsCapacity", label: "UPS Capacity" },
    { name: "ont", label: "ONT" },
    { name: "ceilingType", label: "Ceiling Type" },
    { name: "engPersonCompany", label: "Engineer Person Company" },
    { name: "engPersonEmail", label: "Engineer Person Email" },
    { name: "engPersonName", label: "Engineer Person Name" },
    { name: "engPersonNumber", label: "Engineer Person Number" },
  ];

function gpEdit() {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const { id } = useParams();
  const [data, setData] = useState<GpEdit | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);  
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASEURL}/gp-surveys/${id}`);
        setData(response.data.data[0]);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get(`${BASEURL}/states`);
        console.log(response.data.data);
        console.log("states",response.data.data.map((state: any) => state.state_name));
        setStates(response.data.data.map((state: any) => state.state_name));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchStates();
  }, []);
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await axios.get(`${BASEURL}/districtsdata?state_code=1`);
        console.log("districts",response.data.map((district: any) => district.district_name));
        setDistricts(response.data.map((district: any) => district.district_name));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchDistricts();
  }, []);
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const response = await axios.get(`${BASEURL}/blocksdata?district_code=38`);
        console.log(response.data);
        console.log("Blocks",response.data.map((block: any) => block.block_name));
        setBlocks(response.data.map((block: any) => block.block_name));
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchBlocks();
  }, []);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    const { state_name, district_name, block_name, gp_name,  ...filteredData } = data;

    try {
      await axios.put(`${BASEURL}/gp-surveys/${data.id}`, filteredData);
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
          <h1 className="text-2xl font-bold mb-6">GP EDIT DETAILS</h1>

          <form onSubmit={handleEditSave}>
        <div className="grid gap-6 mb-6 md:grid-cols-3">
          {/* State Name Dropdown */}
          {/* <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              State Name
            </label>
            <select
              value={data.state_name || ""}
              onChange={(e) => setData({ ...data, state_name: e.target.value })}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">Select State</option>
              {states.map((state, index) => (
                <option key={index} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div> */}

          {/* District Name Dropdown */}
          {/* <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              District Name
            </label>
            <select
              value={data.district_name || ""}
              onChange={(e) => setData({ ...data, district_name: e.target.value })}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">Select District</option>
              {districts.map((district, index) => (
                <option key={index} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div> */}

          {/* Block Name Dropdown */}
          {/* <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Block Name
            </label>
            <select
              value={data.block_name || ""}
              onChange={(e) => setData({ ...data, block_name: e.target.value })}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">Select Block</option>
              {blocks.map((block, index) => (
                <option key={index} value={block}>
                  {block}
                </option>
              ))}
            </select>
          </div> */}

          {/* Render the rest of the fields as text inputs */}
          {gpFields
            .filter(
              (field) =>
                field.name !== "state_name" &&
                field.name !== "district_name" &&
                field.name !== "block_name"
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

export default gpEdit;
