import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DataTable, { TableColumn } from 'react-data-table-component';
import moment from 'moment';
import {
  IndianRupee,
  Link2,
  Ruler,
  MapPin,
  Wallet,
  CheckCircle,
  Scale,
  PenIcon,
  PlusCircle,
  History,
} from 'lucide-react';
import { StateData, District, Block } from '../../types/survey';
import { getAuthHeaders, isIEUser } from '../../utils/accessControl';
import SearchableSelect from '../Forms/SearchableSelect';
import { ToastContainer, toast } from 'react-toastify';
import PaymentEditModal from './PaymentEditModal';
import AddPaymentModal from './AddPaymentModal';
import PaymentHistoryModal from './PaymentHistoryModal';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

interface StatesResponse {
  success: boolean;
  data: StateData[];
}

// Distances are in meters, amounts in rupees. Amounts are null until payment details are saved.
interface PaymentRow {
  link_detail_id: number | null;
  start_location: number;
  end_location: number;
  start_name: string;
  end_name: string;
  link_name: string;
  state_name: string;
  district_name: string;
  block_name: string;
  firm_ids: string | null;
  firm_names: string | null;
  authorised_persons: string | null;
  authorised_mobiles: string | null;
  work_types: string | null;
  total_surveys: number;
  boq_distance: number | null;
  td_accepted_distance: number | null;
  vendor_mis_distance: number | null;
  otdr_distance: number | null;
  accepted_distance: number | null;
  rate_per_meter: number | null;
  gst_percent: number | null;
  tds_percent: number | null;
  base_amount: number | null;
  gst_amount: number | null;
  tds_amount: number | null;
  net_payable: number | null;
  base_paid: number | null;
  gst_paid: number | null;
  tds_paid: number | null;
  net_paid: number | null;
  base_balance: number | null;
  gst_balance: number | null;
  tds_balance: number | null;
  net_balance: number | null;
  payment_count: number;
  last_payment_date: string | null;
  payment_status: string | null;
  base_payment_count?: number | null;
}

interface PaymentSummary {
  total_surveys: number;
  boq_distance: number;
  td_accepted_distance: number;
  vendor_mis_distance: number;
  otdr_distance: number;
  accepted_distance: number;
  base_amount: number;
  gst_amount: number;
  tds_amount: number;
  net_payable: number;
  base_paid: number;
  gst_paid: number;
  tds_paid: number;
  net_paid: number;
  base_balance: number;
  gst_balance: number;
  tds_balance: number;
  net_balance: number;
}

interface PaymentsPagination {
  page: number;
  limit: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface PaymentsResponse {
  status: boolean;
  data: PaymentRow[];
  count?: number;
  totals?: PaymentSummary;
  pagination?: PaymentsPagination;
}

const toNum = (v: number | string | null | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDistance = (v: number) =>
  v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type ComputedRow = PaymentRow;

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-800',
  'partially paid': 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-700',
  'details pending': 'bg-blue-100 text-blue-700',
};

const workTypeOptions = [
  { value: 'New Construction', label: 'New Construction' },
  { value: 'Rectification', label: 'Rectification' },
  { value: 'OFC Blowing/ JointChamber', label: 'OFC Blowing / Joint Chamber' },
  { value: 'Protection', label: 'Protection' },
];

// Distance columns, in display order (values in meters, shown as sent by the API).
const DISTANCE_COLUMNS: { key: keyof PaymentRow; title: string }[] = [
  { key: 'boq_distance', title: 'BOQ Distance' },
  { key: 'td_accepted_distance', title: 'T&D Accepted Distance' },
  { key: 'otdr_distance', title: 'OTDR Distance' },
  { key: 'vendor_mis_distance', title: 'Vendor MIS Distance' },
  { key: 'accepted_distance', title: 'Accepted Distance' },
];

type AmountTone = 'payable' | 'paid' | 'balance';

// Amount columns, in display order. Net = Base + GST - TDS.
const AMOUNT_COLUMNS: { key: keyof PaymentRow; title: string; tone: AmountTone; total?: boolean }[] = [
  { key: 'base_amount', title: 'Base Amount', tone: 'payable' },
  { key: 'gst_amount', title: 'GST Amount', tone: 'payable' },
  { key: 'tds_amount', title: 'TDS Amount', tone: 'payable' },
  { key: 'net_payable', title: 'Net Payable', tone: 'payable', total: true },
  { key: 'base_paid', title: 'Base Paid', tone: 'paid' },
  { key: 'gst_paid', title: 'GST Paid', tone: 'paid' },
  { key: 'tds_paid', title: 'TDS Paid', tone: 'paid' },
  { key: 'net_paid', title: 'Net Paid', tone: 'paid', total: true },
  { key: 'base_balance', title: 'Base Balance', tone: 'balance' },
  { key: 'gst_balance', title: 'GST Balance', tone: 'balance' },
  { key: 'tds_balance', title: 'TDS Balance', tone: 'balance' },
  { key: 'net_balance', title: 'Net Balance', tone: 'balance', total: true },
];

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

  const [worktype, setworktype] = useState<string[]>(() =>
    (searchParams.get('workType') || '').split(',').filter(Boolean),
  );
  const [workTypeDropdownOpen, setWorkTypeDropdownOpen] = useState(false);
  const workTypeDropdownRef = useRef<HTMLDivElement>(null);

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingBlock, setLoadingBlock] = useState(false);
  const [loadingConnections, setLoadingConnections] = useState(false);

  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [editRow, setEditRow] = useState<PaymentRow | null>(null);
  const [addPaymentRow, setAddPaymentRow] = useState<PaymentRow | null>(null);
  const [historyRow, setHistoryRow] = useState<PaymentRow | null>(null);
  const [apiSummary, setApiSummary] = useState<PaymentSummary | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

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
      if (worktype.length > 0) params.workType = worktype.join(',');

      const response = await fetch(
        `${TraceBASEURL}/link-payments/summary?${new URLSearchParams(params).toString()}`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) throw new Error('Failed to fetch payments');
      const result: PaymentsResponse = await response.json();
      const data = result.status ? result.data || [] : [];
      setRows(data);
      setTotalRows(result.pagination?.total_records ?? result.count ?? data.length);
      setApiSummary(result.totals ?? null);
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
  }, [selectedState, selectedDistrict, selectedBlock, selectedConnection, connections, worktype, page, perPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        workTypeDropdownRef.current &&
        !workTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setWorkTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const syncParams = (
    state: string | null,
    district: string | null,
    block: string | null,
    link: string | null,
    workTypes: string[] = worktype,
  ) => {
    const params: Record<string, string> = {};
    if (state) params.state_id = state;
    if (district) params.district_id = district;
    if (block) params.block_id = block;
    if (link) params.link = link;
    if (workTypes.length > 0) params.workType = workTypes.join(',');
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

  const handleWorkTypeToggle = (value: string) => {
    const updated = worktype.includes(value)
      ? worktype.filter((w) => w !== value)
      : [...worktype, value];
    setworktype(updated);
    syncParams(selectedState, selectedDistrict, selectedBlock, selectedConnection, updated);
  };

  const clearFilters = () => {
    setSelectedState(IEUser ? '6' : null);
    setSelectedDistrict(null);
    setSelectedBlock(null);
    setSelectedConnection(null);
    setworktype([]);
    setSearchParams({});
    setPage(1);
  };

  const computedRows = rows;

  const statsConfig: {
    icon: typeof Link2;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
    bgColor: string;
  }[] = [
    {
      icon: Link2,
      label: 'Total Surveys',
      value: toNum(apiSummary?.total_surveys),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Ruler,
      label: 'Accepted Distance (mt)',
      value: formatDistance(toNum(apiSummary?.accepted_distance)),
      sub: `BOQ: ${formatDistance(toNum(apiSummary?.boq_distance))} mt`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: MapPin,
      label: 'T&D Accepted Distance (mt)',
      value: formatDistance(toNum(apiSummary?.td_accepted_distance)),
      sub: `OTDR: ${formatDistance(toNum(apiSummary?.otdr_distance))} · MIS: ${formatDistance(
        toNum(apiSummary?.vendor_mis_distance),
      )} mt`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Wallet,
      label: 'Net Payable',
      value: formatCurrency(toNum(apiSummary?.net_payable)),
      sub: `Base ${formatCurrency(toNum(apiSummary?.base_amount))} + GST ${formatCurrency(
        toNum(apiSummary?.gst_amount),
      )} − TDS ${formatCurrency(toNum(apiSummary?.tds_amount))}`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: CheckCircle,
      label: 'Net Paid',
      value: formatCurrency(toNum(apiSummary?.net_paid)),
      sub: `Base ${formatCurrency(toNum(apiSummary?.base_paid))} · GST ${formatCurrency(
        toNum(apiSummary?.gst_paid),
      )} · TDS ${formatCurrency(toNum(apiSummary?.tds_paid))}`,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      icon: Scale,
      label: 'Net Balance',
      value: formatCurrency(toNum(apiSummary?.net_balance)),
      sub: `Base ${formatCurrency(toNum(apiSummary?.base_balance))} · GST ${formatCurrency(
        toNum(apiSummary?.gst_balance),
      )} · TDS ${formatCurrency(toNum(apiSummary?.tds_balance))}`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  // Null means payment details are not saved yet, so show a dash instead of ₹0.
  const amountCell = (value: number | string | null | undefined, className = 'text-gray-900') =>
    value == null ? (
      <span className="text-gray-400">-</span>
    ) : (
      <span className={`tabular-nums whitespace-nowrap ${className}`}>
        {formatCurrency(toNum(value))}
      </span>
    );

  const toneClass = (tone: AmountTone, value: number, total?: boolean) => {
    const weight = total ? 'font-semibold' : '';
    if (tone === 'paid') return `text-teal-700 ${weight}`;
    if (tone === 'balance' && value > 0) return `text-orange-600 font-medium ${weight}`;
    return `text-gray-900 ${weight}`;
  };

  const percentCell = (value: number | null) =>
    value == null ? (
      <span className="text-gray-400">-</span>
    ) : (
      <span className="tabular-nums">{toNum(value)}%</span>
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
      name: <HeaderLabel title="Firm Name" />,
      selector: (row) => row.firm_names ?? '',
      cell: (row) => <Wrap text={row.firm_names ?? ''} />,
      sortable: true,
      minWidth: '180px',
    },
    {
      name: <HeaderLabel title="Authorised Person" />,
      selector: (row) => row.authorised_persons ?? '',
      cell: (row) => <Wrap text={row.authorised_persons ?? ''} />,
      sortable: true,
      minWidth: '170px',
    },
    {
      name: <HeaderLabel title="Authorised Mobile" />,
      selector: (row) => row.authorised_mobiles ?? '',
      cell: (row) => <Wrap text={row.authorised_mobiles ?? ''} />,
      minWidth: '140px',
    },
    {
      name: <HeaderLabel title="Work Type" />,
      selector: (row) => row.work_types ?? '',
      cell: (row) => <Wrap text={row.work_types ?? ''} />,
      sortable: true,
      minWidth: '150px',
    },
    {
      name: <HeaderLabel title="Total Surveys" />,
      selector: (row) => toNum(row.total_surveys),
      cell: (row) => <span className="tabular-nums">{toNum(row.total_surveys)}</span>,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    ...DISTANCE_COLUMNS.map(
      ({ key, title }): TableColumn<ComputedRow> => ({
        name: <HeaderLabel title={title} sub="mt" />,
        selector: (row) => toNum(row[key]),
        cell: (row) => (
          <span className="tabular-nums whitespace-nowrap">{formatDistance(toNum(row[key]))}</span>
        ),
        sortable: true,
        right: true,
        minWidth: '125px',
      }),
    ),
    {
      name: <HeaderLabel title="Rate" sub="per meter" />,
      selector: (row) => toNum(row.rate_per_meter),
      cell: (row) => amountCell(row.rate_per_meter),
      sortable: true,
      right: true,
      minWidth: '120px',
    },
    {
      name: <HeaderLabel title="GST" sub="%" />,
      selector: (row) => toNum(row.gst_percent),
      cell: (row) => percentCell(row.gst_percent),
      sortable: true,
      right: true,
      minWidth: '80px',
    },
    {
      name: <HeaderLabel title="TDS" sub="%" />,
      selector: (row) => toNum(row.tds_percent),
      cell: (row) => percentCell(row.tds_percent),
      sortable: true,
      right: true,
      minWidth: '80px',
    },
    ...AMOUNT_COLUMNS.map(
      ({ key, title, tone, total }): TableColumn<ComputedRow> => ({
        name: <HeaderLabel title={title} />,
        selector: (row) => toNum(row[key]),
        cell: (row) =>
          amountCell(row[key] as number | null, toneClass(tone, toNum(row[key]), total)),
        sortable: true,
        right: true,
        minWidth: total ? '150px' : '135px',
      }),
    ),
    {
      name: <HeaderLabel title="Payment Count" />,
      selector: (row) => toNum(row.payment_count),
      cell: (row) => <span className="tabular-nums">{toNum(row.payment_count)}</span>,
      sortable: true,
      right: true,
      minWidth: '100px',
    },
    {
      name: <HeaderLabel title="Last Payment Date" />,
      selector: (row) => row.last_payment_date ?? '',
      cell: (row) => (
        <span className="whitespace-nowrap">
          {row.last_payment_date ? moment(row.last_payment_date).format('DD-MM-YYYY') : '-'}
        </span>
      ),
      sortable: true,
      minWidth: '130px',
    },
    {
      name: <HeaderLabel title="Payment Status" />,
      selector: (row) => row.payment_status ?? '',
      cell: (row) => (
        <span
          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
            PAYMENT_STATUS_STYLES[(row.payment_status ?? '').toLowerCase()] ??
            'bg-gray-100 text-gray-700'
          }`}
        >
          {row.payment_status || '-'}
        </span>
      ),
      sortable: true,
      minWidth: '130px',
    },
    {
      name: <HeaderLabel title="Action" />,
      cell: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditRow(row)}
            title="Edit payment details"
            className="p-1.5 text-blue-600 rounded-md hover:bg-blue-50"
          >
            <PenIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAddPaymentRow(row)}
            title="Add payment"
            className="p-1.5 text-green-600 rounded-md hover:bg-green-50"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setHistoryRow(row)}
            title="Payment history"
            className="p-1.5 text-indigo-600 rounded-md hover:bg-indigo-50"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      ),
      width: '130px',
      center: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      <PaymentsHeader />
      <PaymentEditModal
        row={editRow}
        onClose={() => setEditRow(null)}
        onSaved={(message) => {
          toast.success(message);
          setEditRow(null);
          fetchPayments();
        }}
        onError={(message) => toast.error(message)}
      />
      <PaymentHistoryModal link={historyRow} onClose={() => setHistoryRow(null)} />
      <AddPaymentModal
        row={addPaymentRow}
        onClose={() => setAddPaymentRow(null)}
        onSaved={(message) => {
          toast.success(message);
          setAddPaymentRow(null);
          fetchPayments();
        }}
        onError={(message) => toast.error(message)}
      />

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
                        {stat.sub && (
                          <div className="text-xs text-gray-400 truncate" title={stat.sub}>
                            {stat.sub}
                          </div>
                        )}
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

            <div
              className="relative flex-1 min-w-0 sm:flex-none sm:w-48"
              ref={workTypeDropdownRef}
            >
              <button
                type="button"
                onClick={() => setWorkTypeDropdownOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <span className="truncate text-left">
                  {worktype.length === 0
                    ? 'All Work Type'
                    : worktype
                        .map(
                          (value) =>
                            workTypeOptions.find((option) => option.value === value)?.label ??
                            value,
                        )
                        .join(', ')}
                </span>
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {workTypeDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg dark:bg-gray-700 dark:border-gray-600">
                  {workTypeOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={worktype.includes(option.value)}
                        onChange={() => handleWorkTypeToggle(option.value)}
                        className="rounded border-gray-300"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              )}
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
