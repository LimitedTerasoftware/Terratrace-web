import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { FaEdit, FaTrash, FaPlusCircle } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";

interface StateExchange {
  state_id: string;
  state_code: string;
  state_name: string;
}

const States = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [data, setData] = useState<StateExchange[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedState, setSelectedState] = useState<StateExchange | null>(
    null
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASEURL}/states`);
      setData(response.data.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddState = async (state: StateExchange) => {
    try {
      await axios.post(`${BASEURL}/states`, state);
      fetchData();
      toast.success("State added successfully!");
      setShowAddModal(false);
    } catch (err) {
      toast.error("eror adding state")
      console.error("Error adding state:", err);
    }
  };

  const handleEditState = async (state: StateExchange) => {
    try {
      await axios.put(`${BASEURL}/states/${state.state_id}`, state)
      fetchData();
      toast.success("State Updated successfully");
      setShowEditModal(false);
    } catch (err) {
      toast.success("Error updating state:");
      console.error("Error updating state:", err);
    }
  };

  const handleDeleteState = async (stateId: string) => {
    try {
      await axios.delete(`${BASEURL}/states/${stateId}`);
      fetchData();
      toast.success("State deleted successfully");
    } catch (err) {
      console.error("Error deleting state:", err);
    }
  };

  const columns: ColumnDef<StateExchange>[] = [
    {
      accessorKey: "state_name",
      header: "State Name",
    },
    {
      accessorKey: "state_code",
      header: "State Code",
    },
    // {
    //   id: "actions",
    //   header: "Actions",
    //   cell: ({ row }) => (
    //     <div className="flex gap-2">
    //       {/* <button
    //         className="text-blue-500 hover:text-blue-700"
    //         onClick={() => {
    //           setSelectedState(row.original);
    //           setShowEditModal(true);
    //         }}
    //       >
    //         <FaEdit />
    //       </button> */}
    //      {/* <button
    //         className="text-red-500 hover:text-red-700"
    //         onClick={() => handleDeleteState(row.original.state_id)}
    //       >
    //         <FaTrash />
    //       </button> */}
    //     </div>
    //   ),
    // },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <ToastContainer />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">States</h1>
        <button
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          onClick={() => setShowAddModal(true)}
        >
          <FaPlusCircle className="h-5 w-5" />
          Add New
        </button>
      </div>

      {loading ? (
        <p className="text-center py-4">Loading...</p>
      ) : error ? (
        <p className="text-center py-4 text-red-500">Error: {error}</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md p-4">
          <table className="w-full table-auto border-collapse text-center">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-gray-100 text-gray-600 uppercase text-sm">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b text-sm text-gray-700 hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && <AddStateModal onClose={() => setShowAddModal(false)} onSave={handleAddState} />}
      {showEditModal && selectedState && (
        <EditStateModal
          state={selectedState}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditState}
        />
      )}
    </div>
  );
};

const AddStateModal = ({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (state: StateExchange) => void;
}) => {
  const [stateName, setStateName] = useState("");
  const [stateCode, setStateCode] = useState("");

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Add New State</h2>
        <input className="w-full p-2 mb-2 border" placeholder="State Name" value={stateName} onChange={(e) => setStateName(e.target.value)} />
        <input className="w-full p-2 mb-2 border" placeholder="State Code" value={stateCode} onChange={(e) => setStateCode(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-500 text-white rounded" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => onSave({ state_id: "", state_name: stateName, state_code: stateCode })}>Save</button>
        </div>
      </div>
    </div>
  );
};

const EditStateModal = ({
  state,
  onClose,
  onSave,
}: {
  state: StateExchange;
  onClose: () => void;
  onSave: (state: StateExchange) => void;
}) => {
  const [stateName, setStateName] = useState(state.state_name);
  const [stateCode, setStateCode] = useState(state.state_code);

  return <AddStateModal onClose={onClose} onSave={() => onSave({ ...state, state_name: stateName, state_code: stateCode })} />;
};

export default States;
