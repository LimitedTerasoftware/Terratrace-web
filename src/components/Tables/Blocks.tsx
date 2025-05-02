import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { FaEdit, FaTrash } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import Modal from "./Modal";

interface BlockExchange {
  block_id: string;
  block_name: string;
  block_code: string;
  district_code: string;
  state_code: string;
}

const Blocks = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [blocks, setBlocks] = useState<BlockExchange[]>([]);
  const [formData, setFormData] = useState<BlockExchange>({
    block_id: "",
    block_name: "",
    block_code: "",
    district_code: "",
    state_code: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchBlocks() {
      try {
        const response = await fetch(`${BASEURL}/v1/blocks`);
        if (!response.ok) throw new Error("Failed to fetch data");
        const data: BlockExchange[] = await response.json();
        setBlocks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBlocks();
  }, []);

  const columns: ColumnDef<BlockExchange>[] = [
    { header: "Block Name", accessorKey: "block_name" },
    { header: "Block Code", accessorKey: "block_code" },
    { header: "District Code", accessorKey: "district_code" },
    { header: "State Code", accessorKey: "state_code" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-3 justify-center">
          <button onClick={() => handleEdit(row.original)} className="text-blue-500 hover:text-blue-700">
            <FaEdit />
          </button>
          <button onClick={() => handleDelete(row.original)} className="text-red-500 hover:text-red-700">
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: blocks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleEdit = (block: BlockExchange) => {
    setEditMode(true);
    setFormData(block);
    setIsModalOpen(true);
  };

  const handleDelete = async (block: BlockExchange) => {
    try {
      const response = await fetch(`${BASEURL}/blocks/${block.block_id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete block");

      toast.success("Block deleted successfully");
      setBlocks((prev) => prev.filter((b) => b.block_id !== block.block_id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(
        editMode ? `${BASEURL}/blocks/${formData.block_id}` : `${BASEURL}/blocks`,
        {
          method: editMode ? "PUT" : "POST",
          body: JSON.stringify(formData),
        }
      );
      if (!response.ok) throw new Error(`Failed to ${editMode ? "update" : "add"} block`);

      toast.success(`${editMode ? "Updated" : "Added"} block successfully`);
      setIsModalOpen(false);
      setEditMode(false);
      setFormData({ block_id: "", block_name: "", block_code: "", district_code: "", state_code: "" });

      const newBlocks = await response.json();
      setBlocks(newBlocks);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-4">
      <button onClick={() => setIsModalOpen(true)} className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
        Add New Block
      </button>

      {/* Table */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full table-auto border-collapse text-center">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-100 text-gray-600 uppercase text-sm">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-2 border">
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
                    <td key={cell.id} className="px-4 py-2 border">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
        <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="px-3 py-1 border rounded">
          First
        </button>
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-3 py-1 border rounded">
          Prev
        </button>
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-3 py-1 border rounded">
          Next
        </button>
        <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="px-3 py-1 border rounded">
          Last
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)}>
          <h2 className="text-lg font-semibold mb-2">{editMode ? "Edit" : "Add"} Block</h2>
          <input
            type="text"
            placeholder="Block Name"
            value={formData.block_name}
            onChange={(e) => setFormData({ ...formData, block_name: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <input
            type="text"
            placeholder="Block Code"
            value={formData.block_code}
            onChange={(e) => setFormData({ ...formData, block_code: e.target.value })}
            className="border p-2 rounded w-full mb-2"
          />
          <button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            {editMode ? "Save Changes" : "Add Block"}
          </button>
        </Modal>
      )}

      <ToastContainer />
    </div>
  );
};

export default Blocks;
