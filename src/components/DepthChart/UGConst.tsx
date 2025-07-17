import axios from 'axios';
import { Search } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'
import DataTable, { TableColumn } from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';
import { UGConstructionSurveyData } from '../../types/survey';
import moment from 'moment';
import * as XLSX from "xlsx";

interface ReportProps {
  Data: {
    selectedState: string | null;
    selectedDistrict: string | null;
    selectedBlock: string | null;
    selectedStatus: number | null;
    fromdate: string;
    todate: string;
    globalsearch: string;
    excel: boolean

  };
  Onexcel:()=>void;
}
const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;;

const Report: React.FC<ReportProps> = ({ Data,Onexcel }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UGConstructionSurveyData[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        setLoading(true);
        setError('');
        const params: any = {};
        if (Data.selectedState) params.state_id = Data.selectedState;
        if (Data.selectedDistrict) params.district_id = Data.selectedDistrict;
        if (Data.selectedBlock) params.block_id = Data.selectedBlock;
        if (Data.fromdate) params.from_date = Data.fromdate;
        if (Data.todate) params.to_date = Data.todate;
        const response = await axios.get<{ status: boolean; data: UGConstructionSurveyData[] }>(
          `${TraceBASEURL}/get-survey-data`,
          { params }
        );
        if (response.data.status) {
          setData(response.data.data);
        } else {
          console.error('API returned status=false', response.data);
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching survey data', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyData();
  }, [Data.selectedState, Data.selectedDistrict, Data.selectedBlock, Data.fromdate, Data.todate]);


  const columns: TableColumn<UGConstructionSurveyData>[] = [
    {
      name: "Actions",
      cell: row => (
        <button
          onClick={() => handleView(row.startLocation, row.endLocation,row)}
          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 outline-none dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800"
        >
          View
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
    { name: "State Name", selector: row => row.state_name, sortable: true },
    { name: "District Name", selector: row => row.district_name, sortable: true },
    { name: "Block Name", selector: row => row.block_name, sortable: true },
    { name: 'Start GP Name', selector: row => row.start_lgd_name, sortable: true },
    { name: 'End GP Name', selector: row => row.end_lgd_name, sortable: true },
    { name: "Surveyor Name", selector: row => row.user_name, sortable: true },
    { name: "Surveyor Ph Number", selector: row => row.user_mobile, sortable: true },
    { name: "Status", selector: row => '', sortable: true },
    { name: 'Created At', selector: row => moment(row.created_at).format("DD/MM/YYYY, hh:mm A"), sortable: true },
  ];
  const handleView = async (sgp: number, egp: number,row:UGConstructionSurveyData) => {
    navigate('/construction-details', { state: { sgp, egp ,row} });
  };

  const filteredData = useMemo(() => {
    if (!Data.globalsearch.trim()) return data;

    const lowerSearch = Data.globalsearch.toLowerCase();

    return data.filter((row: UGConstructionSurveyData) =>
      Object.values(row).some((value) =>
        (typeof value === 'string' || typeof value === 'number') &&
        value.toString().toLowerCase().includes(lowerSearch)
      )
    );
  }, [Data.globalsearch, data]);

  useEffect(() => {
    if (Data.excel === true && filteredData.length > 0) {
      const exportExcel = async () => {

        setLoading(true)
        const workbook = XLSX.utils.book_new();

        const headers = [
          "State Name",
          "District Name","Block Name",
          "Start Location", "End Location",
          "Surveyor Name", "Surveyor Mobile","Created At", "Updated At",  
        ];

        const dataRows = filteredData.map(row => [
          row.state_name,
          row.district_name,
          row.block_name,
          row.start_lgd_name,
          row.end_lgd_name,
          row.user_name,
          row.user_mobile,
          row.created_at,
          row.updated_at,
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

        XLSX.utils.book_append_sheet(workbook, worksheet, "Underground Construction");

        XLSX.writeFile(workbook, "Underground_Construction.xlsx", { compression: true });
        Onexcel();
        setLoading(false)

      }
      exportExcel()
    } 

  }, [Data.excel])
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#dee2e6',
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
    <div className="min-h-screen">
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
          <span className="font-medium">Error loading data:</span> {error}
        </div>
      )}
      {filteredData.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4  rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
          <p className="text-gray-500">
            {Data.globalsearch
              ? 'Try adjusting your search or filter criteria.'
              : 'There is no data.'
            }
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          progressPending={loading}
          pagination
          highlightOnHover
          pointerOnHover
          striped
          dense
          responsive
          customStyles={customStyles}
        />
      )}
    </div>

  )
}

export default Report