import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';

interface DistrictPerformanceProps {
  summaryData?: any;
  loadingSummary?: boolean;
  activeTab?: 'GP_INSTALLATION' | 'BLOCK_INSTALLATION';
  currentPage?: number;
  rowsPerPage?: number;
  totalRows?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number, newPage: number) => void;
  selectedStateCode?: string;
  selectedDistrictCode?: string;
  fromDate?: string | null;
  toDate?: string | null;
}

export function DistrictPerformance({
  summaryData,
  loadingSummary,
  activeTab = 'GP_INSTALLATION',
  currentPage = 1,
  rowsPerPage = 10,
  totalRows = 0,
  onPageChange,
  onRowsPerPageChange,
  selectedStateCode,
  selectedDistrictCode,
  fromDate,
  toDate,
}: DistrictPerformanceProps) {
  const navigate = useNavigate();
  const isGP = activeTab === 'GP_INSTALLATION';

  const getCompletionPercentage = (item: any) => {
    const total = isGP ? item.total_gps : item.total_blocks;
    if (!total || total === 0) return 0;
    return Math.round((item.installed / total) * 100);
  };

  const getExceptions = (item: any) => {
    return (item.REJECT || 0) + (item.PENDING || 0);
  };

  const districts = summaryData?.data || [];

  const columns = [
    {
      name: 'DISTRICT',
      selector: (row: any) => row.District,
      sortable: true,
      cell: (row: any) => (
        <span className="font-semibold text-gray-900">{row.District}</span>
      ),
    },
    {
      name: isGP ? 'GP (TOTAL/INST)' : 'BLOCK (TOTAL/INST)',
      selector: (row: any) => (isGP ? row.total_gps : row.total_blocks),
      sortable: true,
      cell: (row: any) => (
        <span className="text-gray-600">
          {isGP
            ? `${row.total_gps} / ${row.installed}`
            : `${row.total_blocks} / ${row.installed}`}
        </span>
      ),
    },
    {
      name: 'ACCEPT',
      selector: (row: any) => row.ACCEPT,
      sortable: true,
      cell: (row: any) => (
        <span className="text-green-600 font-semibold">{row.ACCEPT || 0}</span>
      ),
    },
    {
      name: 'REJECT',
      selector: (row: any) => row.REJECT,
      sortable: true,
      cell: (row: any) => (
        <span className="text-red-600 font-semibold">{row.REJECT || 0}</span>
      ),
    },
    {
      name: 'PENDING',
      selector: (row: any) => row.PENDING,
      sortable: true,
      cell: (row: any) => (
        <span className="text-yellow-600 font-semibold">
          {row.PENDING || 0}
        </span>
      ),
    },
    {
      name: 'COMPLETION %',
      selector: (row: any) => getCompletionPercentage(row),
      sortable: true,
      cell: (row: any) => {
        const completion = getCompletionPercentage(row);
        return (
          <div className="flex items-center gap-2">
            <div className="w-24 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full ${
                  completion >= 80
                    ? 'bg-green-500'
                    : completion >= 60
                      ? 'bg-yellow-500'
                      : completion >= 40
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${completion}%` }}
              />
            </div>
            <span className="font-semibold text-gray-900">{completion}%</span>
          </div>
        );
      },
    },
    // {
    //   name: 'EXCEPTIONS',
    //   selector: (row: any) => getExceptions(row),
    //   sortable: true,
    //   cell: (row: any) => {
    //     const exceptions = getExceptions(row);
    //     return (
    //       <span
    //         className={`font-semibold ${
    //           exceptions > 50
    //             ? 'text-red-600'
    //             : exceptions > 20
    //               ? 'text-orange-600'
    //               : 'text-green-600'
    //         }`}
    //       >
    //         {exceptions}
    //       </span>
    //     );
    //   },
    // },
  ];

  return (
    <div className="space-y-6 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                DISTRICT {isGP ? 'GP' : 'BLOCK'} PERFORMANCE
              </h3>
              <button
                className="text-sm text-blue-600 font-medium hover:text-blue-700"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.append('tab', activeTab);
                  if (selectedStateCode)
                    params.append('state_code', selectedStateCode);
                  if (selectedDistrictCode)
                    params.append('district_code', selectedDistrictCode);
                  if (fromDate) params.append('from_date', fromDate);
                  if (toDate) params.append('to_date', toDate);
                  navigate(`/installation?${params.toString()}`);
                }}
              >
                View All Districts ({summaryData?.totalDistricts || 0})
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <DataTable
                columns={columns}
                data={districts}
                pagination
                paginationServer
                paginationTotalRows={totalRows}
                paginationDefaultPage={currentPage}
                paginationPerPage={rowsPerPage}
                onChangePage={onPageChange}
                onChangeRowsPerPage={onRowsPerPageChange}
                highlightOnHover
                responsive
                noDataComponent={
                  <div className="px-6 py-8 text-center text-gray-500">
                    No data available
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
