import React, { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  createColumnHelper,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  Row
} from '@tanstack/react-table';
import axios from 'axios';

type Company = {
  id: number;
  name: string;
  address?: string;
  contact_number?: string;
};

const columnHelper = createColumnHelper<Company>();

const CompaniesTable: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState<Omit<Company, 'id'>>({ name: '', address: '', contact_number: '' });
  const [editId, setEditId] = useState<number | null>(null);

  const API_URL = `${BASEURL}/companies`;

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const response = await axios.get<Company[]>(API_URL);
    setCompanies(response.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId !== null) {
        await axios.put(`${API_URL}/${editId}`, form);
      } else {
        await axios.post(API_URL, form);
      }
      setForm({ name: '', address: '', contact_number: '' });
      setEditId(null);
      fetchCompanies();
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (company: Company) => {
    const { id, name, address, contact_number } = company;
    setForm({ name, address, contact_number });
    setEditId(id);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this company?')) {
      await axios.delete(`${API_URL}/${id}`);
      fetchCompanies();
    }
  };

  const columns = [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "address", header: "Address" },
    { accessorKey: "contact_number", header: "Contact" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(row.original)}
            className="bg-blue-500 text-white px-2 py-1 rounded"
          >
            Edit
          </button>
          {/* <button
            onClick={() => handleDelete(row.original.id)}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Delete
          </button> */}
        </div>
      )
    }
  ];

  const table = useReactTable({
    data: companies,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Companies</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={form.address || ''}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Contact Number"
          value={form.contact_number || ''}
          onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <div className="col-span-full">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {editId ? 'Update Company' : 'Add Company'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full border rounded">
          <thead className="bg-gray-200">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-2 text-left border-b">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-4">No data</td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-b hover:bg-gray-100">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompaniesTable;
