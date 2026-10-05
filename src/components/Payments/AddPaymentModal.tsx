import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import moment from 'moment';
import { getAuthHeaders } from '../../utils/accessControl';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

// Base is paid in up to three running bills, each capped at this share of the payable base.
const BASE_INSTALLMENT_CAPS = [0.7, 0.2, 0.1];

export interface AddPaymentRow {
  link_detail_id: number | null;
  link_name: string;
  firm_ids: string | null;
  firm_names: string | null;
  base_amount: number | null;
  gst_amount: number | null;
  tds_amount: number | null;
  base_paid: number | null;
  gst_paid: number | null;
  tds_paid: number | null;
  base_balance: number | null;
  base_payment_count?: number | null;
}

type PaymentType = 'base' | 'gst' | 'tds';

interface AddPaymentModalProps {
  row: AddPaymentRow | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

type FormKey = 'amount' | 'payment_date' | 'bill_no' | 'firm_id' | 'payment_mode' | 'reference_no';

const TABS: { key: PaymentType; label: string }[] = [
  { key: 'base', label: 'Base Payment' },
  { key: 'gst', label: 'GST Payment' },
  { key: 'tds', label: 'TDS Payment' },
];

const PAYMENT_MODES: Record<PaymentType, string[]> = {
  base: ['NEFT', 'RTGS', 'IMPS', 'Cheque', 'DD'],
  gst: ['NEFT', 'RTGS', 'IMPS', 'Cheque', 'DD'],
  tds: ['Challan', 'NEFT', 'RTGS'],
};

const ORDINALS = ['1st', '2nd', '3rd'];

const toNum = (v: number | string | null | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const round2 = (v: number) => Math.round(v * 100) / 100;

const formatCurrency = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const today = () => moment().format('YYYY-MM-DD');

const emptyForm = (type: PaymentType, firmId: string): Record<FormKey, string> => ({
  amount: '',
  payment_date: today(),
  bill_no: '',
  firm_id: firmId,
  payment_mode: PAYMENT_MODES[type][0],
  reference_no: '',
});

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ row, onClose, onSaved, onError }) => {
  const [activeTab, setActiveTab] = useState<PaymentType>('base');
  const [form, setForm] = useState<Record<FormKey, string>>(emptyForm('base', ''));
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});
  const [saving, setSaving] = useState(false);

  const firms = useMemo(() => {
    const ids = (row?.firm_ids || '').split(',').map((s) => s.trim()).filter(Boolean);
    const names = (row?.firm_names || '').split(',').map((s) => s.trim());
    return ids.map((id, i) => ({ id, name: names[i] || `Firm ${id}` }));
  }, [row]);

  // Payable / paid figures and the limit for each payment type.
  const info = useMemo(() => {
    const payableBase = toNum(row?.base_amount);
    const paidBase = toNum(row?.base_paid);
    const balanceBase = round2(
      Math.max(row?.base_balance != null ? toNum(row.base_balance) : payableBase - paidBase, 0),
    );

    // Prefer the API count; otherwise infer the bill number from how much base is already paid.
    let baseIndex: number;
    if (row?.base_payment_count != null) {
      baseIndex = toNum(row.base_payment_count);
    } else if (paidBase <= 0) {
      baseIndex = 0;
    } else {
      let cumulative = 0;
      baseIndex = BASE_INSTALLMENT_CAPS.length;
      for (let i = 0; i < BASE_INSTALLMENT_CAPS.length; i++) {
        cumulative += BASE_INSTALLMENT_CAPS[i];
        if (paidBase < round2(payableBase * cumulative)) {
          baseIndex = i + 1;
          break;
        }
      }
    }
    const baseDone = balanceBase <= 0 || baseIndex >= BASE_INSTALLMENT_CAPS.length;
    const baseCap = baseDone ? 0 : BASE_INSTALLMENT_CAPS[baseIndex];
    const baseMax = baseDone ? 0 : round2(Math.min(payableBase * baseCap, balanceBase));

    // GST and TDS are each paid once, for the full amount.
    const payableGst = toNum(row?.gst_amount);
    const paidGst = toNum(row?.gst_paid);
    const gstDone = paidGst > 0;

    const tdsAmount = toNum(row?.tds_amount);
    const paidTds = toNum(row?.tds_paid);
    const tdsDone = paidTds > 0;

    return {
      payableBase,
      paidBase,
      balanceBase,
      baseIndex,
      baseCap,
      baseMax,
      baseDone,
      payableGst,
      paidGst,
      gstDue: round2(payableGst),
      gstDone,
      tdsAmount,
      paidTds,
      tdsDue: round2(tdsAmount),
      tdsDone,
    };
  }, [row]);

  const tabDisabledReason = (type: PaymentType): string | null => {
    if (type === 'base') {
      if (info.payableBase <= 0) return 'Payable base amount is not set for this link.';
      if (info.baseDone) return 'All base installments are already paid.';
    }
    if (type === 'gst') {
      if (info.payableGst <= 0) return 'Payable GST amount is not set for this link.';
      if (info.gstDone) return 'GST is paid only once and has already been paid.';
    }
    if (type === 'tds') {
      if (info.tdsAmount <= 0) return 'TDS amount is not set for this link.';
      if (info.tdsDone) return 'TDS is paid only once and has already been paid.';
    }
    return null;
  };

  const isTabPaid = (type: PaymentType) =>
    type === 'base'
      ? info.payableBase > 0 && info.baseDone
      : type === 'gst'
        ? info.gstDone
        : info.tdsDone;

  const resetFor = (type: PaymentType) => {
    const next = emptyForm(type, firms.length === 1 ? firms[0].id : '');
    if (type === 'gst' && !tabDisabledReason('gst')) next.amount = String(info.gstDue);
    if (type === 'tds' && !tabDisabledReason('tds')) next.amount = String(info.tdsDue);
    setForm(next);
    setRemarks('');
    setErrors({});
  };

  useEffect(() => {
    if (!row) return;
    setActiveTab('base');
    resetFor('base');
  }, [row]);

  if (!row) return null;

  const disabledReason = tabDisabledReason(activeTab);
  const needsFirm = activeTab !== 'tds';

  const handleTabChange = (type: PaymentType) => {
    if (saving) return;
    setActiveTab(type);
    resetFor(type);
  };

  const setField = (key: FormKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<FormKey, string>> = {};
    const amount = Number(form.amount);

    if (form.amount.trim() === '') next.amount = 'Amount is required';
    else if (!Number.isFinite(amount) || amount <= 0) next.amount = 'Amount must be greater than 0';
    else if (activeTab === 'base' && amount > info.baseMax) {
      next.amount = `${ORDINALS[info.baseIndex]} base installment cannot exceed ${formatCurrency(
        info.baseMax,
      )} (${Math.round(info.baseCap * 100)}% of payable base)`;
    } else if (activeTab === 'gst' && round2(amount) !== info.gstDue) {
      next.amount = `GST is paid once — amount must be ${formatCurrency(info.gstDue)}`;
    } else if (activeTab === 'tds' && round2(amount) !== info.tdsDue) {
      next.amount = `TDS is paid once — amount must be ${formatCurrency(info.tdsDue)}`;
    }

    if (!form.payment_date) next.payment_date = 'Payment date is required';
    else if (moment(form.payment_date).isAfter(moment(), 'day')) {
      next.payment_date = 'Payment date cannot be in the future';
    }
    if (!form.bill_no.trim()) next.bill_no = 'Bill no is required';
    if (needsFirm && !form.firm_id) next.firm_id = 'Firm is required';
    if (!form.payment_mode) next.payment_mode = 'Payment mode is required';
    if (!form.reference_no.trim()) next.reference_no = 'Reference no is required';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildBody = () => {
    const amountKey = activeTab === 'base' ? 'base_paid' : activeTab === 'gst' ? 'gst_paid' : 'tds_paid';
    return {
      link_detail_id: row.link_detail_id,
      [amountKey]: round2(Number(form.amount)),
      payment_date: form.payment_date,
      bill_no: form.bill_no.trim(),
      ...(needsFirm ? { firm_id: Number(form.firm_id) } : {}),
      payment_mode: form.payment_mode,
      reference_no: form.reference_no.trim(),
      remarks: remarks.trim(),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabledReason || !validate()) return;
    try {
      setSaving(true);
      const response = await fetch(`${TraceBASEURL}/link-payments`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status === false) {
        throw new Error(result.message || 'Failed to add payment');
      }
      onSaved(result.message || 'Payment added successfully');
    } catch (err: any) {
      console.error('Error adding payment:', err);
      onError(err?.message || 'Failed to add payment');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (key: FormKey) =>
    `w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
      errors[key] ? 'border-red-400' : 'border-gray-300'
    }`;

  const fieldError = (key: FormKey) =>
    errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>;

  const summaryLines: { label: string; value: string; strong?: boolean }[] =
    activeTab === 'base'
      ? [
          { label: 'Payable Base', value: formatCurrency(info.payableBase) },
          { label: 'Paid Base', value: formatCurrency(info.paidBase) },
          { label: 'Balance Base', value: formatCurrency(info.balanceBase) },
          ...(info.baseDone
            ? []
            : [
                {
                  label: `${ORDINALS[info.baseIndex]} installment max (${Math.round(info.baseCap * 100)}%)`,
                  value: formatCurrency(info.baseMax),
                  strong: true,
                },
              ]),
        ]
      : activeTab === 'gst'
        ? [
            { label: 'Payable GST', value: formatCurrency(info.payableGst) },
            { label: 'Paid GST', value: formatCurrency(info.paidGst) },
            { label: 'Amount to pay (one time)', value: formatCurrency(info.gstDue), strong: true },
          ]
        : [
            { label: 'TDS Amount', value: formatCurrency(info.tdsAmount) },
            { label: 'Paid TDS', value: formatCurrency(info.paidTds) },
            { label: 'Amount to deposit (one time)', value: formatCurrency(info.tdsDue), strong: true },
          ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Add Payment</h2>
            <p className="text-sm text-gray-500 break-words">{row.link_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1 text-gray-400 rounded hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center px-6">
            {TABS.map((tab) => (
              <li key={tab.key} className="mr-2">
                <button
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`inline-block p-3 rounded-t-lg outline-none ${
                    activeTab === tab.key
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {isTabPaid(tab.key) && (
                    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-green-100 text-green-700">
                      Paid
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mx-6 mt-5 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
            {summaryLines.map((line) => (
              <div
                key={line.label}
                className={`flex justify-between ${line.strong ? 'font-semibold text-gray-900' : 'text-gray-600'}`}
              >
                <span>{line.label}</span>
                <span className="tabular-nums">{line.value}</span>
              </div>
            ))}
          </div>

          {!row.link_detail_id ? (
            <div className="mx-6 mt-4 p-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg">
              Payment details are not saved for this link yet. Use Edit to save them before adding a payment.
            </div>
          ) : disabledReason ? (
            <div className="mx-6 mt-4 p-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg">
              {disabledReason}
            </div>
          ) : null}

          <fieldset
            disabled={!!disabledReason || !row.link_detail_id || saving}
            className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                {activeTab === 'base' ? 'Base Paid' : activeTab === 'gst' ? 'GST Paid' : 'TDS Paid'}{' '}
                <span className="text-gray-400 font-normal">(₹)</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={form.amount}
                onChange={(e) => setField('amount', e.target.value)}
                className={inputClass('amount')}
              />
              {fieldError('amount')}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Payment Date</label>
              <input
                type="date"
                max={today()}
                value={form.payment_date}
                onChange={(e) => setField('payment_date', e.target.value)}
                className={inputClass('payment_date')}
              />
              {fieldError('payment_date')}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Bill No</label>
              <input
                type="text"
                value={form.bill_no}
                onChange={(e) => setField('bill_no', e.target.value)}
                placeholder="e.g. RB-1"
                className={inputClass('bill_no')}
              />
              {fieldError('bill_no')}
            </div>

            {needsFirm && (
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Firm</label>
                <select
                  value={form.firm_id}
                  onChange={(e) => setField('firm_id', e.target.value)}
                  className={inputClass('firm_id')}
                >
                  <option value="">Select firm</option>
                  {firms.map((firm) => (
                    <option key={firm.id} value={firm.id}>
                      {firm.name}
                    </option>
                  ))}
                </select>
                {fieldError('firm_id')}
              </div>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Payment Mode</label>
              <select
                value={form.payment_mode}
                onChange={(e) => setField('payment_mode', e.target.value)}
                className={inputClass('payment_mode')}
              >
                {PAYMENT_MODES[activeTab].map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
              {fieldError('payment_mode')}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                {activeTab === 'tds' ? 'Challan / Reference No' : 'Reference No (UTR)'}
              </label>
              <input
                type="text"
                value={form.reference_no}
                onChange={(e) => setField('reference_no', e.target.value)}
                className={inputClass('reference_no')}
              />
              {fieldError('reference_no')}
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Remarks <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none resize-y focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !!disabledReason || !row.link_detail_id}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Add Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;
