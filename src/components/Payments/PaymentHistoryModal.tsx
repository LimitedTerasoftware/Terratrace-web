import { useEffect, useMemo, useState } from 'react';
import { Loader2, X, History } from 'lucide-react';
import moment from 'moment';
import { getAuthHeaders } from '../../utils/accessControl';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

export interface PaymentHistoryLink {
  link_detail_id: number | null;
  link_name: string;
}

// One record per bill; base / GST / TDS paid against that bill.
interface PaymentHistoryRecord {
  id: number;
  link_detail_id: number;
  firm_id: number | null;
  firm_name: string | null;
  bill_no: string | null;
  base_paid: number | null;
  gst_percent: number | null;
  gst_paid: number | null;
  tds_percent: number | null;
  tds_paid: number | null;
  net_paid: number | null;
  payment_date: string | null;
  payment_mode: string | null;
  reference_no: string | null;
  remarks: string | null;
  created_by: string | number | null;
  created_at: string | null;
}

interface PaymentHistoryTotals {
  base_paid: number;
  gst_paid: number;
  tds_paid: number;
  net_paid: number;
}

interface PaymentHistoryResponse {
  status: boolean;
  message?: string;
  link_detail_id: number;
  link_name: string;
  count: number;
  totals?: PaymentHistoryTotals;
  data: PaymentHistoryRecord[];
}

interface PaymentHistoryModalProps {
  link: PaymentHistoryLink | null;
  onClose: () => void;
}

const toNum = (v: number | string | null | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TOTAL_CARDS: { key: keyof PaymentHistoryTotals; label: string; className: string }[] = [
  { key: 'base_paid', label: 'Base Paid', className: 'text-blue-700' },
  { key: 'gst_paid', label: 'GST Paid', className: 'text-purple-700' },
  { key: 'tds_paid', label: 'TDS Paid', className: 'text-amber-700' },
  { key: 'net_paid', label: 'Net Paid', className: 'text-teal-700' },
];

const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ link, onClose }) => {
  const [records, setRecords] = useState<PaymentHistoryRecord[]>([]);
  const [apiTotals, setApiTotals] = useState<PaymentHistoryTotals | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRecords([]);
    setApiTotals(null);
    setError(null);
    if (!link?.link_detail_id) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${TraceBASEURL}/link-payments/history?link_detail_id=${link.link_detail_id}`,
          { headers: getAuthHeaders() },
        );
        const result: PaymentHistoryResponse = await response.json().catch(() => ({}));
        if (!response.ok || result.status === false) {
          throw new Error(result.message || 'Failed to fetch payment history');
        }
        setRecords(Array.isArray(result.data) ? result.data : []);
        setApiTotals(result.totals ?? null);
      } catch (err: any) {
        console.error('Error fetching payment history:', err);
        setError(err?.message || 'Failed to fetch payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [link]);

  const totals = useMemo<PaymentHistoryTotals>(
    () =>
      apiTotals ??
      records.reduce(
        (acc, r) => ({
          base_paid: acc.base_paid + toNum(r.base_paid),
          gst_paid: acc.gst_paid + toNum(r.gst_paid),
          tds_paid: acc.tds_paid + toNum(r.tds_paid),
          net_paid: acc.net_paid + toNum(r.net_paid),
        }),
        { base_paid: 0, gst_paid: 0, tds_paid: 0, net_paid: 0 },
      ),
    [apiTotals, records],
  );

  if (!link) return null;

  const amount = (v: number | null, className = '') => (
    <td className={`px-3 py-2.5 text-right tabular-nums whitespace-nowrap ${className}`}>
      {v == null ? '-' : formatCurrency(toNum(v))}
    </td>
  );

  const percent = (v: number | null) => (
    <td className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap text-gray-600">
      {v == null ? '-' : `${toNum(v)}%`}
    </td>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-xl">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-indigo-50">
              <History className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
              <p className="text-sm text-gray-500 break-words">
                {link.link_name}
                {records.length > 0 && ` · ${records.length} payment${records.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 rounded hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 pt-4">
          {TOTAL_CARDS.map((card) => (
            <div key={card.key} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
              <div className="text-xs text-gray-500">{card.label}</div>
              <div className={`text-base font-semibold tabular-nums ${card.className}`}>
                {formatCurrency(toNum(totals[card.key]))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {!link.link_detail_id ? (
            <div className="p-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg">
              Payment details are not saved for this link yet.
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <span className="font-medium">Error loading history:</span> {error}
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <tr>
                    <th className="px-3 py-3 text-left">S.No</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Bill No</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Payment Date</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Base Paid</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">GST %</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">GST Paid</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">TDS %</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">TDS Paid</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap">Net Paid</th>
                    <th className="px-3 py-3 text-left">Firm</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Mode</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Reference No</th>
                    <th className="px-3 py-3 text-left">Remarks</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Entered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-3 py-10 text-center text-gray-500">
                        No payments recorded yet
                      </td>
                    </tr>
                  ) : (
                    records.map((r, i) => (
                      <tr key={r.id ?? i} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap font-medium">{r.bill_no || '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {r.payment_date ? moment(r.payment_date).format('DD-MM-YYYY') : '-'}
                        </td>
                        {amount(r.base_paid)}
                        {percent(r.gst_percent)}
                        {amount(r.gst_paid)}
                        {percent(r.tds_percent)}
                        {amount(r.tds_paid)}
                        {amount(r.net_paid, 'font-semibold text-teal-700')}
                        <td className="px-3 py-2.5 min-w-[150px]">{r.firm_name || '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{r.payment_mode || '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">{r.reference_no || '-'}</td>
                        <td className="px-3 py-2.5 min-w-[180px] text-gray-600">{r.remarks || '-'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-gray-500">
                          {r.created_at ? moment(r.created_at).format('DD-MM-YYYY HH:mm') : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistoryModal;
