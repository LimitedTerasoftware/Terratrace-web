import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

import { FaArrowLeft } from "react-icons/fa";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface HotoEdit {
    [key: string]: string;
}

const hotoFields: { name: keyof HotoEdit; label: string }[] = [
    // { name: "id", label: "ID" },
    // { name: "state_name", label: "State Name" },
    // { name: "district_name", label: "District Name" },
    // { name: "block_name", label: "Block Name" },
    // { name: "gpName", label: "GP Name" },
    { name: "code", label: "Code" },
    { name: "equipmentMake", label: "Equipment Make" },
    { name: "otherEquipmentMake", label: "Other Equipment Make" },
    { name: "buildingAddress", label: "Building Address" },
    { name: "oltToFpoi", label: "OLT to FPOI" },
    { name: "oltToFpoiLength", label: "OLT to FPOI Length (Mtrs)" },
    { name: "oltToFpoiFaultyFibers", label: "OLT to FPOI Faulty Fibers" },
    { name: "fpoiToGp", label: "FPOI to GP" },
    { name: "fpoiToGpLength", label: "FPOI to GP Length (Mtrs)" },
    { name: "fpoiToGpFaultyFibers", label: "FPOI to GP Faulty Fibers" },
    { name: "ont", label: "ONT" },
    { name: "ontMake", label: "ONT Make" },
    { name: "ontSerialNumber", label: "ONT Serial Number" },
    { name: "ccu", label: "CCU" },
    { name: "ccuMake", label: "CCU Make" },
    { name: "ccuSerialNumber", label: "CCU Serial Number" },
    { name: "battery", label: "Battery" },
    { name: "batteryMake", label: "Battery Make" },
    { name: "batterySerialNumber", label: "Battery Serial Number" },
    { name: "solar", label: "Solar" },
    { name: "solarMake", label: "Solar Make" },
    { name: "solarSerialNumber", label: "Solar Serial Number" },
    { name: "earthing", label: "Earthing" },
    { name: "earthingCondition", label: "Earthing Condition" },
    { name: "enclosure", label: "Enclosure" },
    { name: "opticalPower", label: "Optical Power" },
    { name: "otdrTrace", label: "OTDR Trace & Distance of Fault" },
    { name: "splitter", label: "Splitter" },
    { name: "ftbNoOfFiberTerminated", label: "FTB No. of Fiber Terminated" },
    { name: "splitterPorts", label: "Splitter Ports" },
    { name: "ontPorts", label: "ONT Ports" },
    { name: "csc", label: "CSC Shifted Location" },
    { name: "cscLocation", label: "CSC Address" },
];

function HotoEdit() {
    const BASEURL = import.meta.env.VITE_API_BASE;
    const { id } = useParams();
    const [data, setData] = useState<HotoEdit | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [blocks, setBlocks] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${BASEURL}/hoto-forms/${id}`);
                console.log("API Response:", response.data); // Debug log
                
                // Check if response has data
                if (response.data && response.data.data && response.data.data.length > 0) {
                    setData(response.data.data[0]);
                } else {
                    console.error("No data found in response:", response.data);
                }
                setLoading(false);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, BASEURL]);

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const response = await axios.get(`${BASEURL}/states`);
                console.log("States Response:", response.data.data);
                setStates(response.data.data.map((state: any) => state.state_name));
            } catch (error) {
                console.error("Failed to fetch states:", error);
            }
        };

        fetchStates();
    }, [BASEURL]);

    useEffect(() => {
        const fetchDistricts = async () => {
            try {
                const response = await axios.get(`${BASEURL}/districtsdata?state_code=1`);
                console.log("Districts Response:", response.data);
                setDistricts(response.data.map((district: any) => district.district_name));
            } catch (error) {
                console.error("Failed to fetch districts:", error);
            }
        };

        fetchDistricts();
    }, [BASEURL]);

    useEffect(() => {
        const fetchBlocks = async () => {
            try {
                const response = await axios.get(`${BASEURL}/blocksdata?district_code=38`);
                console.log("Blocks Response:", response.data);
                setBlocks(response.data.map((block: any) => block.block_name));
            } catch (error) {
                console.error("Failed to fetch blocks:", error);
            }
        };

        fetchBlocks();
    }, [BASEURL]);

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!data) return;

        const { state_name, district_name, block_name, gpName, ...filteredData } = data;

        try {
            await axios.put(`${BASEURL}/hoto-forms/${data.id}`, filteredData);
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
            <h1 className="text-2xl font-bold mb-6">HOTO EDIT DETAILS</h1>

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

                    {/* GP Name Dropdown */}
                    {/* <div>
                        <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                            GP Name
                        </label>
                        <input
                            type="text"
                            aria-label="GP Name"
                            value={data.gpName || ""}
                            onChange={(e) => setData({ ...data, gpName: e.target.value })}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            placeholder="GP Name"
                        />
                    </div> */}

                    {/* Render the rest of the fields as text inputs */}
                    {hotoFields
                        .filter(
                            (field) =>
                                field.name !== "state_name" &&
                                field.name !== "district_name" &&
                                field.name !== "block_name" &&
                                field.name !== "gpName"
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

export default HotoEdit;