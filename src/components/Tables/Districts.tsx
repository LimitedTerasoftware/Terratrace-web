import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlusCircle } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface District {
  district_id: string;
  state_code: string;
  district_name: string;
  district_code: string;
}

const Districts = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [data, setData] = useState<District[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [formData, setFormData] = useState<District>({
    district_id: "",
    state_code: "",
    district_name: "",
    district_code: "",
  });

  const pageSize = 10;

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
         `${BASEURL}/districts?page=${page}&pageSize=${pageSize}`
      );
      setData(response.data.data);
      setTotalPages(response.data.total);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this district?")) return;
    try {
      await axios.delete(`${BASEURL}/districts/${id}`);
      toast.success("Deleted successfully");
      fetchData(); // Refresh data
    } catch (err: any) {
      alert("Failed to delete the district.");
    }
  };

  const handleAddNew = () => {
    setEditMode(false);
    setFormData({ district_id: "", state_code: "", district_name: "", district_code: "" });
    setModalOpen(true);
  };

  const handleEdit = (district: District) => {
    setEditMode(true);
    setFormData(district);
    setModalOpen(true);
    setSelectedDistrict(district);
  };

  const handleSubmit = async () => {

    if (!formData.district_name.trim()) {
      setError("District Name is required!");
      return;
    }

    // if (!formData.state_code.trim()) {
    //   setError("SttaeCode is required!");
    //   return;
    // }

    try {
      if (editMode) {
        await axios.put(
          `${BASEURL}/districts/${formData.district_id}`,
          formData
        );
      } else {
        await axios.post(`${BASEURL}/districts`, formData);
      }
      setModalOpen(false);
      toast.success("updated successfully");
      fetchData();
    } catch (err: any) {
      alert("Error saving district.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <ToastContainer />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Districts</h1>
        <button
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          onClick={handleAddNew}
        >
          <FaPlusCircle className="h-5 w-5" />
          Add New
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="w-full table-auto border-collapse text-center">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
              <th className="px-4 py-2">District Name</th>
              <th className="px-4 py-2">State Code</th>
              <th className="px-4 py-2">District Code</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-4">Loading...</td>
              </tr>
            ) : (
              data.map((district) => (
                <tr key={district.district_id} className="border-b text-sm text-gray-700 hover:bg-gray-50">
                  <td className="px-4 py-2">{district.district_name}</td>
                  <td className="px-4 py-2">{district.state_code}</td>
                  <td className="px-4 py-2">{district.district_code}</td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    <button className="text-blue-500 hover:text-blue-700" onClick={() => handleEdit(district)}>
                      <FaEdit className="h-5 w-5" />
                    </button>
                    {/* <button className="text-red-500 hover:text-red-700" onClick={() => handleDelete(district.district_id)}>
                      <FaTrash className="h-5 w-5" />
                    </button> */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center items-center mt-4 gap-4">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className={`px-4 py-2 rounded-md text-white ${page === 1 ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"}`}
        >
          Previous
        </button>

        <span className="text-gray-700 font-medium">Page {page} of {totalPages}</span>

        <button
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
          className={`px-4 py-2 rounded-md text-white ${page === totalPages ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"}`}
        >
          Next
        </button>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-1/3">
            <h2 className="text-xl mb-4">{editMode ? "Edit District" : "Add District"}</h2>
            <input
              type="text"
              placeholder="District Name"
              className="border p-2 w-full mb-3"
              value={formData.district_name}
              onChange={(e) => setFormData({ ...formData, district_name: e.target.value })}
              required
            />
            {error && <p className="text-red-500">{error}</p>}

            <input
              type="text"
              placeholder="State Code"
              className="border p-2 w-full mb-3"
              value={formData.state_code}
              onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="District Code"
              className="border p-2 w-full mb-3"
              value={formData.district_code}
              onChange={(e) => setFormData({ ...formData, district_code: e.target.value })}
              required
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
              <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">{editMode ? "Update" : "Add"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Districts;
