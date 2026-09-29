import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DataTable, { TableColumn } from 'react-data-table-component';
import {
  IndianRupee,
  Link2,
  Ruler,
  MapPin,
  Wallet,
  CheckCircle,
  Scale,
} from 'lucide-react';
import { StateData, District, Block } from '../../types/survey';
import { getAuthHeaders, isIEUser } from '../../utils/accessControl';
import SearchableSelect from '../Forms/SearchableSelect';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

// Share of the (Base + GST) amount that is payable against completed work.
const PAYABLE_PERCENT = 0.8;
const GST_PERCENT = 0.18;

interface StatesResponse {
  success: boolean;
  data: StateData[];
}

interface PaymentRow {
  id?: number;
  state_name: string;
  district_name: string;
  block_name: string;
  link_name: string;
  total_km: number | null;
  rate: number | null;
  completed_km: number | null;
  payment_base?: number | null;
  payment_gst?: number | null;
  paid_base: number | null;
  paid_gst: number | null;
  balance_base?: number | null;
  balance_gst?: number | null;
}

interface PaymentSummary {
  totalLinks: number;
  totalKm: number;
  completedKm: number;
  totalPayment: number;
  paidAmount: number;
  balanceAmount: number;
}

interface PaymentsResponse {
  status: boolean;
  data: PaymentRow[];
  totalRows?: number;
  summary?: PaymentSummary;
}

const toNum = (v: number | string | null | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatKm = (v: number) =>
  v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Fill in derived amounts when the API does not send them.
const computeRow = (row: PaymentRow) => {
  const completedKm = toNum(row.completed_km);
  const rate = toNum(row.rate);
  const paymentBase =
    row.payment_base != null ? toNum(row.payment_base) : completedKm * rate * PAYABLE_PERCENT;
  const paymentGst =
    row.payment_gst != null ? toNum(row.payment_gst) : paymentBase * GST_PERCENT;
  const paidBase = toNum(row.paid_base);
  const paidGst = toNum(row.paid_gst);
  const balanceBase =
    row.balance_base != null ? toNum(row.balance_base) : paymentBase - paidBase;
  const balanceGst =
    row.balance_gst != null ? toNum(row.balance_gst) : paymentGst - paidGst;
  return {
    ...row,
    totalKm: toNum(row.total_km),
    rate,
    completedKm,
    paymentBase,
    paymentGst,
    paymentTotal: paymentBase + paymentGst,
    paidBase,
    paidGst,
    balanceBase,
    balanceGst,
  };
};

type ComputedRow = ReturnType<typeof computeRow>;

const customStyles = {
  headCells: {
    style: {
      fontSize: '12px',
      fontWeight: '600',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.3px',
      color: '#4B5563',
      backgroundColor: '#F9FAFB',
      borderBottom: '1px solid #E5E7EB',
      paddingLeft: '12px',
      paddingRight: '12px',
      paddingTop: '12px',
      paddingBottom: '12px',
      whiteSpace: 'normal' as const,
      lineHeight: '1.3',
    },
  },
  cells: {
    style: {
      paddingLeft: '12px',
      paddingRight: '12px',
      paddingTop: '10px',
      paddingBottom: '10px',
      fontSize: '14px',
      color: '#111827',
      borderBottom: '1px solid #F3F4F6',
    },
  },
  rows: {
    style: {
      '&:hover': {
        backgroundColor: '#F9FAFB',
      },
    },
  },
};

// Allows multi-line column headers (react-data-table truncates strings by default).
const HeaderLabel = ({ title, sub }: { title: string; sub?: string }) => (
  <div className="whitespace-normal leading-tight">
    <div>{title}</div>
    {sub && <div className="text-[10px] font-normal normal-case text-gray-400">{sub}</div>}
  </div>
);

const Wrap = ({ text }: { text: string }) => (
  <span className="whitespace-normal break-words leading-snug" title={text}>
    {text || '-'}
  </span>
);

function PaymentsPage() {
  const IEUser = isIEUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const [states, setStates] = useState<StateData[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [connections, setConnections] = useState<
    { route_name: string; startLocation: string; endLocation: string }[]
  >([]);

  const [selectedState, setSelectedState] = useState<string | null>(
    () => searchParams.get('state_id') || (IEUser ? '6' : null),
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(
    () => searchParams.get('district_id'),
  );
  const [selectedBlock, setSelectedBlock] = useState<string | null>(
    () => searchParams.get('block_id'),
  );
  const [selectedConnection, setSelectedConnection] = useState<string | null>(
    () => searchParams.get('link'),
  );

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlock, setLoadingBlock] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);

  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [apiSummary, setApiSummary] = useState<PaymentSummary | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const PaymentsHeader = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <IndianRupee className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Payments Management</h1>
            <p className="text-sm text-gray-600">
              Track link-wise payments, paid and balance amounts
            </p>
          </div>
        </div>
        <nav>
          <ol className="flex items-center gap-2">
            <li>
              <Link className="font-medium" to="/dashboard">
                Dashboard /
              </Link>
            </li>
            <li className="font-medium text-primary">Payments</li>
          </ol>
        </nav>
      </div>
    </header>
  );

  const fetchStates = async () => {
    try {
      setLoadingStates(true);
      const response = await fetch(`${TraceBASEURL}/states`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch states');
      const result: StatesResponse = await response.json();
      const stateData = result.success ? result.data : [];
      if (IEUser) {
        setStates(
          stateData.filter(
            (state: any) =>
              String(state.state_id) === '6' ||
              String(state.state_code) === '19' ||
              String(state.state_id) === '1' ||
              String(state.state_code) === '35',
          ),
        );
      } else {
        setStates(stateData);
      }
    } catch (err) {
      console.error('Error fetching states:', err);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchDistricts = async (stateId: string) => {
    try {
      setLoadingDistricts(true);
      const response = await fetch(
        `${TraceBASEURL}/districtsdata?state_code=${stateId}`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) throw new Error('Failed to fetch districts');
      const data = await response.json();
      setDistricts(data || []);
    } catch (err) {
      console.error('Error fetching districts:', err);
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchBlocks = async (districtId: string) => {
    try {
      setLoadingBlock(true);
      const response = await fetch(
        `${TraceBASEURL}/blocksdata?district_code=${districtId}`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) throw new Error('Failed to fetch blocks');
      const data = await response.json();
      setBlocks(data || []);
    } catch (err) {
      console.error('Error fetching blocks:', err);
      setBlocks([]);
    } finally {
      setLoadingBlock(false);
    }
  };

  const fetchConnections = async (blockId: string) => {
    try {
      setLoadingConnections(true);
      const response = await fetch(
        `${TraceBASEURL}/get-linknames?block_id=${blockId}`,
      );
      const result = await response.json();
      setConnections(result.status && result.data?.length > 0 ? result.data : []);
    } catch (err) {
      console.error('Error fetching links:', err);
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  };

  const getSelectedConnectionDetails = () => {
    if (!selectedConnection) return null;
    return connections.find((c) => c.route_name === selectedConnection);
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {
        page: String(page),
        limit: String(perPage),
      };
      if (selectedState) params.state_id = selectedState;
      if (selectedDistrict) params.district_id = selectedDistrict;
      if (selectedBlock) params.block_id = selectedBlock;
      const conn = getSelectedConnectionDetails();
      if (conn?.startLocation) params.start = conn.startLocation;
      if (conn?.endLocation) params.end = conn.endLocation;

      const response = await fetch(
        `${TraceBASEURL}/get-payments?${new URLSearchParams(params).toString()}`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) throw new Error('Failed to fetch payments');
      const result: PaymentsResponse = await response.json();
      const data = result.status ? result.data || [] : [];
      setRows(data);
      setTotalRows(result.totalRows ?? data.length);
      setApiSummary(result.summary ?? null);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError(err?.message || 'Failed to fetch payments');
      setRows([]);
      setTotalRows(0);
      setApiSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (selectedState) fetchDistricts(selectedState);
    else setDistricts([]);
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) fetchBlocks(selectedDistrict);
    else setBlocks([]);
  }, [selectedDistrict]);

  useEffect(() => {
    if (selectedBlock) fetchConnections(selectedBlock);
    else setConnections([]);
  }, [selectedBlock]);

  useEffect(() => {
    // Wait for link list so start/end can be resolved when a link is preselected from the URL.
    if (selectedConnection && !getSelectedConnectionDetails()) return;
    fetchPayments();
  }, [selectedState, selectedDistrict, selectedBlock, selectedConnection, connections, page, perPage]);

  const syncParams = (
    state: string | null,
    district: string | null,
    block: string | null,
    link: string | null,
  ) => {
    const params: Record<string, string> = {};
    if (state) params.state_id = state;
    if (district) params.district_id = district;
    if (block) params.block_id = block;
    if (link) params.link = link;
    setSearchParams(params);
    setPage(1);
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value || null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    syncParams(value || null, null, null, null);
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value || null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    syncParams(selectedState, value || null, null, null);
  };

  const handleBlockChange = (value: string) => {
    setSelectedBlock(value || null);
    setSelectedConnection(null);
    syncParams(selectedState, selectedDistrict, value || null, null);
  };

  const handleLinkChange = (value: string) => {
    setSelectedConnection(value || null);
    syncParams(selectedState, selectedDistrict, selectedBlock, value || null);
  };

  const clearFilters = () => {
    setSelectedState(IEUser ? '6' : null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    setSearchParams({});
    setPage(1);
  };

  const computedRows = useMemo(() => rows.map(computeRow), [rows]);

  const summary: PaymentSummary = useMemo(() => {
    if (apiSummary) return apiSummary;
    return computedRows.reduce(
      (acc, r) => ({
        totalLinks: acc.totalLinks + 1,
        totalKm: acc.totalKm + r.totalKm,
        completedKm: acc.completedKm + r.completedKm,
        totalPayment: acc.totalPayment + r.paymentTotal,
        paidAmount: acc.paidAmount + r.paidBase + r.paidGst,
        balanceAmount: acc.balanceAmount + r.balanceBase + r.balanceGst,
      }),
      {
        totalLinks: 0,
        totalKm: 0,
        completedKm: 0,
        totalPayment: 0,
        paidAmount: 0,
        balanceAmount: 0,
      },
    );
  }, [apiSummary, computedRows]);

  const statsConfig = [
    {
      icon: Link2,
      label: 'Total Links',
      value: summary.totalLinks,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Ruler,
      label: 'Total Distance (km)',
      value: formatKm(toNum(summary.totalKm)),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: MapPin,
      label: 'Completed Distance (km)',
      value: formatKm(toNum(summary.completedKm)),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Wallet,
      label: 'Total Payment',
      value: formatCurrency(toNum(summary.totalPayment)),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: CheckCircle,
      label: 'Paid Amount',
      value: formatCurrency(toNum(summary.paidAmount)),
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      icon: Scale,
      label: 'Balance Amount',
      value: formatCurrency(toNum(summary.balanceAmount)),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const amountCell = (value: number, className = 'text-gray-900') => (
    <span className={`tabular-nums whitespace-nowrap ${className}`}>{formatCurrency(value)}</span>
  );

  const columns: TableColumn<ComputedRow>[] = [
    {
      name: <HeaderLabel title="S.No" />,
      cell: (_row, index) => (page - 1) * perPage + index + 1,
      width: '70px',
    },
    {
      name: <HeaderLabel title="State Name" />,
      selector: (row) => row.state_name,
      cell: (row) => <Wrap text={row.state_name} />,
      sortable: true,
      minWidth: '130px',
    },
    {
      name: <HeaderLabel title="District Name" />,
      selector: (row) => row.district_name,
      cell: (row) => <Wrap text={row.district_name} />,
      sortable: true,
      minWidth: '130px',
    },
    {
      name: <HeaderLabel title="Block Name" />,
      selector: (row) => row.block_name,
      cell: (row) => <Wrap text={row.block_name} />,
      sortable: true,
      minWidth: '130px',
    },
    {
      name: <HeaderLabel title="Link Name" />,
      selector: (row) => row.link_name,
      cell: (row) => <Wrap text={row.link_name} />,
      sortable: true,
      minWidth: '220px',
      grow: 2,
    },
    {
      name: <HeaderLabel title="Total KM" />,
      selector: (row) => row.totalKm,
      cell: (row) => <span className="tabular-nums">{formatKm(row.totalKm)}</span>,
      sortable: true,
      right: true,
      minWidth: '110px',
    },
    {
      name: <HeaderLabel title="Rate" sub="per km" />,
      selector: (row) => row.rate,
      cell: (row) => amountCell(row.rate),
      sortable: true,
      right: true,
      minWidth: '130px',
    },
    {
      name: <HeaderLabel title="Completed KM" />,
      selector: (row) => row.completedKm,
      cell: (row) => <span className="tabular-nums">{formatKm(row.completedKm)}</span>,
      sortable: true,
      right: true,
      minWidth: '120px',
    },
    {
      name: <HeaderLabel title="Payment" sub="Base + GST (80%)" />,
      selector: (row) => row.paymentTotal,
      cell: (row) => (
        <div className="text-right leading-snug">
          <div className="font-semibold tabular-nums whitespace-nowrap">
            {formatCurrency(row.paymentTotal)}
          </div>
          <div className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
            {formatCurrency(row.paymentBase)} + {formatCurrency(row.paymentGst)}
          </div>
        </div>
      ),
      sortable: true,
      right: true,
      minWidth: '210px',
    },
    {
      name: <HeaderLabel title="Paid Base" />,
      selector: (row) => row.paidBase,
      cell: (row) => amountCell(row.paidBase, 'text-teal-700'),
      sortable: true,
      right: true,
      minWidth: '140px',
    },
    {
      name: <HeaderLabel title="Paid GST" />,
      selector: (row) => row.paidGst,
      cell: (row) => amountCell(row.paidGst, 'text-teal-700'),
      sortable: true,
      right: true,
      minWidth: '130px',
    },
    {
      name: <HeaderLabel title="Balance Base" />,
      selector: (row) => row.balanceBase,
      cell: (row) =>
        amountCell(row.balanceBase, row.balanceBase > 0 ? 'text-orange-600 font-medium' : 'text-gray-900'),
      sortable: true,
      right: true,
      minWidth: '140px',
    },
    {
      name: <HeaderLabel title="Balance GST" />,
      selector: (row) => row.balanceGst,
      cell: (row) =>
        amountCell(row.balanceGst, row.balanceGst > 0 ? 'text-orange-600 font-medium' : 'text-gray-900'),
      sortable: true,
      right: true,
      minWidth: '130px',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <PaymentsHeader />

      {/* KPI Cards */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-1 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {statsConfig.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded mb-2 w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xl font-bold text-gray-900 truncate" title={String(stat.value)}>
                          {stat.value}
                        </div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                      <div className={`p-2 ${stat.bgColor} rounded-lg flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-40">
              <SearchableSelect
                value={selectedState || ''}
                onChange={handleStateChange}
                options={states.map((state) => ({
                  value: String(state.state_id),
                  label: state.state_name,
                }))}
                placeholder="All States"
                disabled={loadingStates}
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-40">
              <SearchableSelect
                value={selectedDistrict || ''}
                onChange={handleDistrictChange}
                options={districts.map((district) => ({
                  value: String(district.district_id),
                  label: district.district_name,
                }))}
                placeholder="All Districts"
                disabled={!selectedState || loadingDistricts}
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-40">
              <SearchableSelect
                value={selectedBlock || ''}
                onChange={handleBlockChange}
                options={blocks.map((block) => ({
                  value: String(block.block_id),
                  label: block.block_name,
                }))}
                placeholder="All Blocks"
                disabled={!selectedDistrict || loadingBlock}
              />
            </div>

            <div className="relative flex-1 min-w-0 sm:flex-none sm:w-64">
              <SearchableSelect
                value={selectedConnection || ''}
                onChange={handleLinkChange}
                options={connections.map((conn) => ({
                  value: conn.route_name,
                  label: conn.route_name,
                }))}
                placeholder="Select Links"
                disabled={!selectedBlock || loadingConnections}
              />
            </div>

            <button
              onClick={clearFilters}
              className="flex-none h-10 px-4 py-2 text-sm font-medium text-red-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 outline-none dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600 whitespace-nowrap flex items-center gap-2"
            >
              <span className="text-red-500 dark:text-red-400 font-medium text-sm">✕</span>
              <span>Clear Filters</span>
            </button>
          </div>
        </div>

        {/* Table */}
        {error && (
          <div className="m-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            <span className="font-medium">Error loading data:</span> {error}
          </div>
        )}
        <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={computedRows}
              pagination
              paginationServer
              paginationTotalRows={totalRows}
              paginationPerPage={perPage}
              paginationDefaultPage={page}
              paginationRowsPerPageOptions={[10, 25, 50, 100, 200, 500]}
              highlightOnHover
              responsive
              fixedHeader
              fixedHeaderScrollHeight="65vh"
              customStyles={customStyles}
              noHeader
              persistTableHead
              noDataComponent={
                <div className="w-full py-10 text-center text-sm text-gray-500">
                  No payment records found
                </div>
              }
              onChangePage={(p) => setPage(p)}
              onChangeRowsPerPage={(newPerPage) => {
                setPerPage(newPerPage);
                setPage(1);
              }}
              progressPending={loading}
              progressComponent={
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
              }
            />
          </div>
      </div>
    </div>
  );
}

export default PaymentsPage;
