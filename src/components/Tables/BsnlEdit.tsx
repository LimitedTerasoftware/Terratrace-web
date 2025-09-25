import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Header } from "../Breadcrumbs/Header";
import { AlertCircle, Edit3, Loader2 } from "lucide-react";
import { ErrorPage, LoadingPage } from "../hooks/useActivities";

interface BsnlExchangeEdit {
  [key: string]: string;
}

const fields: { name: string; label: string }[] = [
  { name: "state_name", label: "State Name" },
  { name: "district_name", label: "District Name" },
  { name: "block_name", label: "Block Name" },
  // { name: "bsnlExchangeCondition", label: "Exchange Condition" },
  // { name: "bsnlRoofTopPhoto", label: "Roof Top Photo" },
  // { name: "bsnlTotalEquipmentPhoto", label: "Total Equipment Photo" },
  // { name: "bsnlFloorPhoto", label: "Floor Photo" },
  // { name: "bsnlOutsidePhoto", label: "Outside Photo" },
  { name: "bsnlCordinates", label: "Coordinates" },
  { name: "roomSpace", label: "Room Space" },
  // { name: "roomSpacePhoto", label: "Room Space Photo" },
  { name: "powerType", label: "Power Type" },
  { name: "upsCapacity", label: "UPS Capacity" },
  { name: "presentLoad", label: "Present Load" },
  { name: "powerSystemVoltage", label: "Power System Voltage" },
  { name: "generator", label: "Generator" },
  { name: "generatorMake", label: "Generator Make" },
  { name: "generatorModel", label: "Generator Model" },
  { name: "generatorCapacity", label: "Generator Capacity" },
  { name: "earthPitVoltage", label: "Earth Pit Voltage" },
  // { name: "earthPitPhoto", label: "Earth Pit Photo" },
  { name: "earthPitCoordinates", label: "Earth Pit Coordinates" },
  { name: "oltMake", label: "OLT Make" },
  { name: "oltCount", label: "OLT Count" },
  { name: "rack", label: "Rack" },
  { name: "fdms", label: "FDMS" },
  { name: "splitters", label: "Splitters" },
  { name: "routerMake", label: "Router Make" },
  { name: "routerCount", label: "Router Count" },
  // { name: "equipmentPhoto", label: "Equipment Photo" },
  { name: "personName1", label: "Person Name 1" },
  { name: "personNumber1", label: "Person Number 1" },
  { name: "personName2", label: "Person Name 2" },
  { name: "personNumber2", label: "Person Number 2" },
  { name: "personName3", label: "Person Name 3" },
  { name: "personNumber3", label: "Person Number 3" },
  // { name: "bsnlCableEntryPhoto", label: "Cable Entry Photo" },
  // { name: "bsnlCableExitPhoto", label: "Cable Exit Photo" },
  // { name: "bsnlExistingRackPhoto", label: "Existing Rack Photo" },
  // { name: "bsnlLayoutPhoto", label: "Layout Photo" },
  // { name: "bsnlProposedRackPhoto", label: "Proposed Rack Photo" },
  // { name: "bsnlUPSPhoto", label: "UPS Photo" },
  { name: "designation1", label: "Designation 1" },
  { name: "designation2", label: "Designation 2" },
  { name: "designation3", label: "Designation 3" },
  { name: "noOfEarthPits", label: "Number of Earth Pits" },
  { name: "powerCableRequired", label: "Power Cable Required" },
  { name: "socketAvailability", label: "Socket Availability" }
];

interface State {
  state_id: string;
  state_code: string;
  state_name: string;
}

interface District {
  id: number;
  name: string;
}

interface Block {
  id: number;
  name: string;
}

function BsnlEdit() {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const { id } = useParams();
  const [data, setData] = useState<BsnlExchangeEdit | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // ADDED: Error state
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASEURL}/bsnl-exchanges/${id}`);
        setData(response.data.data[0]);
        setLoading(false);
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
        setError(error.message || "Failed to fetch data"); // ADDED: Set error state
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch states when component mounts
  useEffect(() => {
    const fetchStates = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASEURL}/states`);
        const stateData: State[] = response.data.data.map((state: any) => ({
          state_id: state.state_id,
          state_code: state.state_code,
          state_name: state.state_name,
        }));
        setStates(stateData);
      } catch (error) {
        console.error("Failed to fetch states:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, []);

  // Fetch districts when a state is selected
  useEffect(() => {
    if (!selectedStateId) return;

    const fetchDistricts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASEURL}/districtsdata?state_id=${selectedStateId}`);
        const districtData = response.data.map((district: any) => ({
          id: district.district_id,
          name: district.district_name,
        }));
        setDistricts(districtData);
      } catch (error) {
        console.error("Failed to fetch districts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDistricts();
  }, [selectedStateId]);

  // Fetch blocks when a district is selected
  useEffect(() => {
    if (!selectedDistrictId) return;

    const fetchBlocks = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASEURL}/blocksdata?district_id=${selectedDistrictId}`);
        const blockData = response.data.map((block: any) => ({
          id: block.block_id,
          name: block.block_name,
        }));
        setBlocks(blockData);
      } catch (error) {
        console.error("Failed to fetch blocks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
  }, [selectedDistrictId]);

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    try {
      await axios.put(`${BASEURL}/bsnl-exchanges/${data.id}`, data);
      alert("Record updated successfully!");
    } catch (error) {
      alert("Failed to update record.");
    }
  };

  // FIXED: Added return statements
  if (loading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (!data) {
    return <ErrorPage error="No data found" />;
  }

  return (
    <>
      <div className="w-full">
        <ToastContainer />
        <Header activeTab="bsnledit" BackBut={true} />
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4 mt-4">
          <div className="border-b border-gray-200">
            <form onSubmit={handleEditSave} className="px-6 py-6">
              <div className="grid gap-6 mb-6 md:grid-cols-3">
                {/* State Name Dropdown */}
                {/* <div>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              State Name
            </label>
            <select
              value={data.state_name || ""}
              onChange={(e) => setSelectedStateId(Number(e.target.value))}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">Select State</option>
              {states.map((state) => (
              <option key={state.state_id} value={state.state_id}>
                {state.state_name}
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
              onChange={(e) => setSelectedDistrict(e.target.value)}
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
                {fields
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
                className={`text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300  px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2`}
              >
                <Edit3 className="h-4 w-4" />
                Update
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default BsnlEdit;