import React, { useEffect, useState } from "react";
import DataTable, { TableColumn } from "react-data-table-component";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

interface TableRow {
  id: number;
  state_id: number;
  distrct_id: number;
  block_id: number;
  gp_id: number;
  link_name: string;
  startPointPhoto: string;
  startPointCoordinates: string;
  status: number;
  start_lgd: string;
  end_lgd: string;
  machine_id: string;
  contractor_details: string;
  distance: string;
  depthMeters: string;
  created_at: string;
}

const MachineDataTable = () => {
    const location = useLocation();
    const MachineData = location.state?.Data
    
  const [tableData, setTableData] = useState<TableRow[]>(MachineData || []);
  const columns: TableColumn<TableRow>[] = [
    {
      name: "ID",
      selector: (row) => row.id,
      sortable: true,
    },
    {
      name: "State ID",
      selector: (row) => row.state_id,
      sortable: true,
    },
    {
      name: "District ID",
      selector: (row) => row.distrct_id,
    },
    {
      name: "Block ID",
      selector: (row) => row.block_id,
    },
    {
      name: "GP ID",
      selector: (row) => row.gp_id,
    },
    {
      name: "Link Name",
      selector: (row) => row.link_name,
    },
    {
      name: "Start Coordinates",
      selector: (row) => row.startPointCoordinates,
    },
    {
      name: "Distance (m)",
      selector: (row) => row.distance,
    },
    {
      name: "Depth (m)",
      selector: (row) => row.depthMeters,
    },
    {
      name: "Created At",
      selector: (row) => new Date(row.created_at).toLocaleString(),
    },
  ];

    const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#64B5F6',
        color: '#616161',
        fontWeight: 600,
        fontSize: '14px',
        padding: '10px',

      },
    },
    headCells: {
      style: {
        whiteSpace: 'nowrap',
      },
    },
    cells: {
      style: {
        width: "150px",
      },
    },
  };
  return (
    <div className="container mx-auto p-6">
      <button
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 mb-6"
        onClick={() => window.history.back()}
        >
        <FaArrowLeft className="h-5 w-5" />
        Back
        </button>
      <h2 className="text-xl font-bold mb-4">Machine Data</h2>
      <DataTable
        columns={columns}
        data={tableData}
        pagination
        highlightOnHover
        responsive
        striped
        dense
        customStyles={customStyles} 
      />
    </div>
  );
};

export default MachineDataTable;
