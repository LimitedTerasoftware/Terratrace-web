import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaPlusCircle, FaTimes } from "react-icons/fa";
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from "@tanstack/react-table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "react-modal";
import UserActionsDropdown from "./UserActionsDropdown";
import { Machine } from "../../types/machine";

interface UsersData {
  user_id: string;
  uname: string;
  email: string;
  version: string;
  is_active: string;
  company_id: string;
  machine_id:string
}

type Company = {
  id: number;
  name: string;
};

const Users = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [data, setData] = useState<UsersData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editModalIsOpen, setEditModalIsOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [userAdded, setUserAdded] = useState(false);
  const [userActivated, setUserActivated] = useState(false);
  const [formData, setFormData] = useState({ user_id: "", fullname: "", email: "", contact_no: "", company_id:"", password: "" ,machine_id:''});
  const[constructionUser,setconstructionUser]= useState(false);
  const navigate = useNavigate();
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [addedUserId, setAddedUserId] = useState<string | null>(null);

  const [machines, setMachines] = useState<Machine[]>([]);
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

 

    const GetData = async() =>{
      try {
        const resp = await axios.get(`${TraceBASEURL}/get-all-machines`);
        if(resp.status === 200 || resp.status === 201){
         setMachines(resp.data.machines);
        }
        
      } catch (error) {
         console.log(error)
      }

    }

  const fetchData = async () => {
    try {
      const response = await axios.get(`${BASEURL}/allusers`);
      setData(response.data.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({ user_id: "", fullname: "", email: "", company_id:"", contact_no: "", password: "" ,machine_id:""});
  };

  const openEditModal = (user: UsersData) => {
    setFormData({
      user_id: user.user_id,
      fullname: user.uname,
      email: user.email,
      contact_no: "", // Assuming contact_no is not part of the initial data
      password: "", // Assuming password is not part of the initial data
      company_id: user.company_id,
      machine_id:user.machine_id,
    });
    setEditModalIsOpen(true);
  };

  useEffect(() => {
    fetchData();
    GetData();
  }, [userAdded, userActivated]);

  useEffect(() => {
    fetch(`${BASEURL}/companies`)
      .then((res) => res.json())
      .then((data: Company[]) => {
        console.log("company data", data);
        setCompanies(data);
      })
      .catch((err) => console.error("Failed to load companies", err));
  }, []);

  const handleEdit = async () => {
    if (!formData.fullname || !formData.email) {
      toast.error("Username and Email are required!");
      return;
    }
    try {
      await axios.post(`${BASEURL}/allusers/${formData.user_id}`, formData);
      setData(data.map((user) => (user.user_id === formData.user_id ? { ...user, uname: formData.fullname, email: formData.email } : user)));
      setEditModalIsOpen(false);
      toast.success("User updated successfully!");
      resetFormData();
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const columns = [
    { accessorKey: "user_id", header: "ID" },
    { accessorKey: "uname", header: "Username" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "version", header: "Version" },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }: any) => (row.original.is_active === "1" ? "Active" : "Inactive"),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const isActive = row.original.is_active === "1";

        const handleStatusChange = async () => {
          try {
            setUserActivated(false);
            const newStatus = isActive ? "0" : "1";

            const payload = {
              user_id: row.original.user_id,
              is_active: newStatus,
            };

            const response = await axios.post(`${BASEURL}/updateStatus`, payload);

            if (response.status === 200) {
              setUserActivated(true);
              toast.success("Status updated successfully!");
              console.log(`Status updated to ${newStatus ? "Active" : "Inactive"}`);
            } else {
              console.error("Failed to update status");
            }
          } catch (error) {
            console.error("Error updating status:", error);
          }
        };

        return (
          <UserActionsDropdown 
          row={row} 
          isActive={isActive} 
          openEditModal={openEditModal} 
          handleStatusChange={handleStatusChange} 
        />
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleAddUser = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

    setUserAdded(false);

    if (!formData.fullname || !formData.email || !formData.contact_no || !formData.password) {
      toast.error("All fields are required!");
      return;
    }
    if(constructionUser && !formData.machine_id){
      toast.error("Registration number is required!");
      return;
    }

    try {
    const response = await axios.post(`${BASEURL}/createuser`, formData);
    if(response.status === 200 || response.status === 201){
      toast.success("User added successfully!");
      setData([...data, response.data]);
      setAddedUserId(response.data.data.user_id);
      setSuccessModalOpen(true);
      setModalIsOpen(false);
      setUserAdded(true);
      resetFormData();

    }else{
     toast.error(`Error:${response.data?.message || response.data?.error}`);

    } 
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Something went wrong while adding the user.";
      toast.error(`Failed to add user: ${errorMessage}`);
    }
  };

  if (loading) return <p className="text-center py-4">Loading...</p>;
  if (error) return <p className="text-center py-4 text-red-500">Error: {error}</p>;

  return (
    <div className="container mx-auto px-4 py-6">
      <ToastContainer />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">All Users</h1>
        <div className="flex justify-end gap-2">
        <button
        className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        onClick={() => {
          resetFormData(); // Reset form data when opening the modal
          setModalIsOpen(true);
          setconstructionUser(false);
        }}
        >
        <FaPlusCircle className="h-5 w-5" />
        Add New
        </button>
        
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="w-full border-collapse text-center">
          <thead className="bg-blue-300 text-gray-600 uppercase text-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-2 border">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 border">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-4">
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-4 py-2 bg-gray-300 rounded">
          Previous
        </button>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-4 py-2 bg-gray-300 rounded">
          Next
        </button>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="bg-white p-6 rounded-lg shadow-lg w-96 mx-auto mt-5 border relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <form autoComplete="off" onSubmit={handleAddUser}>
        <input type="text" name="fake-username" className="hidden" />
        <input type="password" name="fake-password" className="hidden" />
         <button
        onClick={() => setModalIsOpen(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
      >
        <FaTimes className="h-5 w-5" />
      </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">Add User</h2>
        <div className="space-y-3">
          <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="userType"
              value="normal"
              checked={!constructionUser}
              onChange={() => setconstructionUser(false)}
              className="text-blue-500 focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-700">Normal User</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="userType"
              value="construction"
              checked={constructionUser}
              onChange={() => setconstructionUser(true)}
              className="text-blue-500 focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-700">Construction User</span>
          </label>
        </div>
      </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Company</label>
          <select
            name="company_field"
            value={formData.company_id}
            onChange={(e) =>
              setFormData({ ...formData, company_id: e.target.value })
            }
            required
            className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id.toString()}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
        {constructionUser && (
         <><div>
                <label className="block text-sm font-medium text-gray-700">Machine Registration Number</label>
                <select
                  name="company_field"
                  value={formData.machine_id}
                  onChange={(e) => {
                    const selectedRegNo = e.target.value;

                    setFormData({
                      ...formData,
                      machine_id: selectedRegNo,
                    });
                  } }
                  required
                  className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select Registration Number</option>
                  {machines.map((machine) => (
                    <option key={machine.machine_id} value={machine.machine_id}>
                      {machine.registration_number}
                    </option>
                  ))}
                </select>
              </div>
              
                </>
          )}
        <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              autoComplete="off"
              name="username_field"
              placeholder="Enter full name"
              value={formData.fullname}
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              required
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email_field"
              autoComplete="new-email"
              placeholder="Enter email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact No</label>
            <input
              type="number"
              autoComplete="new-off"
              placeholder="Enter contact number"
              value={formData.contact_no}
              required
              onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              name="new_password_field"
              autoComplete="new-password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              required
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            // onClick={handleAddUser}
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
          >
            Submit
          </button>
        </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalIsOpen}
        onRequestClose={() => setEditModalIsOpen(false)}
        className="bg-white p-6 rounded-lg shadow-lg w-96 mx-auto mt-20 border relative"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <button
        onClick={() => setEditModalIsOpen(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
      >
        <FaTimes className="h-5 w-5" />
      </button>

        <h2 className="text-xl font-semibold mb-4 text-gray-800">Edit User</h2>

        <div>
        <label className="block text-sm font-medium text-gray-700">Company</label>
        <select
          name="company_field"
          value={formData.company_id}
          onChange={(e) =>
            setFormData({ ...formData, company_id: e.target.value })
          }
          required
          className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Select company</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id.toString()}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {(formData.machine_id !== '0' && formData.machine_id !== null) && (
      <div>
        <label className="block text-sm font-medium text-gray-700">Machine Registration Number</label>
        <select
          name="company_field"
          value={formData.machine_id}
          onChange={(e) => {
            const selectedRegNo = e.target.value;
            setFormData({
              ...formData,
              machine_id: selectedRegNo,
            });
          }}
          required
          className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Select Registration Number</option>
          {machines.map((machine) => (
            <option key={machine.machine_id} value={machine.machine_id}>
              {machine.registration_number}
            </option>
          ))}
        </select>
      </div>
    )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
               name="username_field"
               autoComplete="off"
              placeholder="Enter username"
              value={formData.fullname}
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Enter email"
               name="email_field"
               autoComplete="new-email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contact No</label>
            <input
              type="text"
               name="contact_field_xyz"
               autoComplete="new-contact"
              placeholder="Enter contact number"
              value={formData.contact_no}
              onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
              className="w-full mt-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleEdit}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
          >
            Update
          </button>
        </div>
      </Modal>
      <Modal
  isOpen={successModalOpen}
  onRequestClose={() => setSuccessModalOpen(false)}
  className="bg-white p-6 rounded-lg shadow-lg w-96 mx-auto mt-20 border relative"
  overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
>
  <button
    onClick={() => setSuccessModalOpen(false)}
    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
  >
    <FaTimes className="h-5 w-5" />
  </button>

  <h2 className="text-xl font-semibold mb-4 text-green-600">User Added Successfully!</h2>
  <p className="text-gray-800">New User ID: <span className="font-bold">{addedUserId}</span></p>

  <button
    onClick={() => setSuccessModalOpen(false)}
    className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition"
  >
    OK
  </button>
</Modal>

    </div>
  );
};

export default Users;