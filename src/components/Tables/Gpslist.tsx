import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlusCircle } from "react-icons/fa";
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel, ColumnDef } from "@tanstack/react-table";
import { useDebounce } from "use-debounce"; // Install: npm install use-debounce
import { useSearchParams } from "react-router-dom";
import Modal from "react-modal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  // const [pageSize, setPageSize] = useState(10);
  const pageSize=10;
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const [formData, setFormData] = useState<GpExchange>({ id: "", name: "", lattitude: "",longitude:"",type:"",st_name:"",dt_name:"",blk_name:"" });
  

  const [filters, setFilters] = useState({
    name: searchParams.get("name") || "",
    state: searchParams.get("state") || "",
    district: searchParams.get("district") || "",
    block: searchParams.get("block") || "",
  });

  // Debounce filter values to reduce API calls
  const [debouncedFilters] = useDebounce(filters, 500);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASEURL}/gplist`, {
        params: {
          page: pageIndex + 1,
          limit: pageSize,
          ...debouncedFilters,
        },
      });
      console.log(response.data);
      setData(response.data.data); // Use response.data.data to get the actual records
      setTotalPages(Math.ceil(response.data.total / pageSize) || 1);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSearchParams(debouncedFilters);
  }, [pageIndex, pageSize, debouncedFilters]);
  
  const resetFormData = () => {
    setFormData({ id: "", name: "", lattitude: "",longitude:"",type:"",st_name:"",dt_name:"",blk_name:"" });
  };

  const handleGps = async () => {
    if (!formData.name || !formData.lattitude || !formData.longitude || !formData.type || !formData.st_name || !formData.dt_name || !formData.blk_name) { 
      toast.error("All fields are required!");
      return;
    }
    try {
      const response = await axios.post(`${BASEURL}/gplist`, formData);
      setData([...data, response.data]);
      toast.success("Gps added successfully!");
      setModalIsOpen(false);
      resetFormData(); // Reset form data after successful submission
    } catch (error) {
      toast.error("Failed to add Gps");
    }
  };
  // Memoized columns for better performance
  const columns: ColumnDef<GpExchange>[] = useMemo(
    () => [
      { accessorKey: "st_name", header: "State Name" },
      { accessorKey: "dt_name", header: "District Name" },
      { accessorKey: "blk_name", header: "Block Name" },
      { accessorKey: "name", header: "Gp Name" },
      { accessorKey: "lgd_code", header: "LGD Code" },
      { accessorKey: "lattitude", header: "Lat" },
      { accessorKey: "longitude", header: "Long" },
      { accessorKey: "type", header: "Type" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button className="text-blue-500 hover:text-blue-700">
              <FaEdit className="h-5 w-5" />
            </button>
            {/* <button className="text-red-500 hover:text-red-700">
              <FaTrash className="h-5 w-5" />
            </button> */}
          </div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });
  const handleEdit = async () => {
    if (!formData.name || !formData.lattitude || !formData.longitude || !formData.type || !formData.st_name || !formData.dt_name || !formData.blk_name) {
      toast.error("All fields are required!");
      return;
    }
    try {
      await axios.put(`${BASEURL}/gplist/${formData.id}`, formData);
      setData(data.map((gps) => (gps.id === formData.id ? formData : gps)));
      toast.success("Gps updated successfully!");
      setEditModalIsOpen(false);
      resetFormData(); // Reset form data after successful update
    } catch (error) {
      toast.error("Failed to update GPS");
    }
  };
  const handleDelete = async (id: string) => {
    try {
      console.log("id",id)
      await axios.delete(`${BASEURL}/gplist/${id}`);
      setData(data.filter((gps) => gps.id!== id));
      toast.success("gps deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete Gps");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">GPS List</h1>
        <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600" onClick={() => {
            resetFormData(); // Reset form data when opening the modal
            setModalIsOpen(true);
          }}>
          
          <FaPlusCircle className="h-5 w-5" />
          Add New
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        {["name", "state", "district", "block"].map((key) => (
          <input
            key={key}
            type="text"
            placeholder={`Filter by ${key.charAt(0).toUpperCase() + key.slice(1)}`}
            className="border px-3 py-2 rounded w-1/4"
            value={filters[key as keyof typeof filters]}
            onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
          />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
      <table className="w-full table-auto border-collapse text-center">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-gray-100 text-gray-600 uppercase text-sm">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-2">
                  {header.column.columnDef.header as string}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4">
                Loading...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4 text-red-500">
                Error: {error}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b text-sm text-gray-700 hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2">
                    {cell.column.id === "actions" ? (
                      <div className="flex gap-2">
                        <button className="text-blue-500 hover:text-blue-700" onClick={() => {
                                  setFormData(row.original);  // Set selected row data
                                  setEditModalIsOpen(true);
                              }}>
                                  <FaEdit className="h-5 w-5" />
                              </button>

                        {/* <button onClick={() => handleDelete(row.id)} className="text-red-500 hover:text-red-700">
                          <FaTrash className="h-5 w-5" />
                        </button> */}
                      </div>
                    ) : (
                      cell.renderValue() as React.ReactNode
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
          disabled={pageIndex === 0}
        >
          Previous
        </button>
        <span>
          Page {pageIndex + 1} of {totalPages}
        </span>
        <button
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          onClick={() => setPageIndex((prev) => (prev + 1 < totalPages ? prev + 1 : prev))}
          disabled={pageIndex + 1 >= totalPages}
        >
          Next
        </button>
      </div>
      <Modal
              isOpen={modalIsOpen}
              onRequestClose={() => {
                setModalIsOpen(false);
                resetFormData(); // Reset form data when closing the modal
              }}
              className="bg-white p-6 rounded-lg shadow-lg w-96 mx-auto mt-20 border"
              overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Add GPS</h2>
              <div>
                <label className="block text-sm text-gray-600"> Name</label>
                <input
                  type="text"
                  placeholder="Enter Gps Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Lattitude</label>
                <input
                  type="text"
                  placeholder="Enter Lattitude"
                  value={formData.lattitude}
                  onChange={(e) => setFormData({ ...formData, lattitude: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Longitude</label>
                <input
                  type="text"
                  placeholder="Enter Longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Type</label>
                <input
                  type="text"
                  placeholder="Enter Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div> <div>
                <label className="block text-sm text-gray-600">State Name</label>
                <input
                  type="text"
                  placeholder="Enter State Name"
                  value={formData.st_name}
                  onChange={(e) => setFormData({ ...formData, st_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div> <div>
                <label className="block text-sm text-gray-600">District Name</label>
                <input
                  type="text"
                  placeholder="Enter District Name"
                  value={formData.dt_name}
                  onChange={(e) => setFormData({ ...formData, dt_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div> <div>
                <label className="block text-sm text-gray-600">Block Name</label>
                <input
                  type="text"
                  placeholder="Enter District Name"
                  value={formData.blk_name}
                  onChange={(e) => setFormData({ ...formData, blk_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <br />
              <button onClick={handleGps} className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition">
                Submit
              </button>
      </Modal>
      <Modal
              isOpen={editModalIsOpen}
              onRequestClose={() => {
                setEditModalIsOpen(false);
                resetFormData(); // Reset form data when closing the modal
              }}
              className="bg-white p-6 rounded-lg shadow-lg w-96 mx-auto mt-20 border"
              overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Edit GPS</h2>
              <div>
                <label className="block text-sm text-gray-600"> Name</label>
                <input
                  type="text"
                  placeholder="Enter Gps Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Lattitude</label>
                <input
                  type="text"
                  placeholder="Enter Lattitude"
                  value={formData.lattitude}
                  onChange={(e) => setFormData({ ...formData, lattitude: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Longitude</label>
                <input
                  type="text"
                  placeholder="Enter Longitude"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Type</label>
                <input
                  type="text"
                  placeholder="Enter Type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div> <div>
                <label className="block text-sm text-gray-600">State Name</label>
                <input
                  type="text"
                  placeholder="Enter State Name"
                  value={formData.st_name}
                  onChange={(e) => setFormData({ ...formData, st_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div> <div>
                <label className="block text-sm text-gray-600">District Name</label>
                <input
                  type="text"
                  placeholder="Enter District Name"
                  value={formData.dt_name}
                  onChange={(e) => setFormData({ ...formData, dt_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div> <div>
                <label className="block text-sm text-gray-600">Block Name</label>
                <input
                  type="text"
                  placeholder="Enter Block Name"
                  value={formData.blk_name}
                  onChange={(e) => setFormData({ ...formData, blk_name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                />
              </div>
              <br />
              <button onClick={handleEdit} className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition">
                Update
              </button>
      </Modal>
    </div>
  );
};

export default Gpslist;
