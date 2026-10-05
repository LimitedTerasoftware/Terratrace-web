import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { getAuthHeaders } from '../../utils/accessControl';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

export interface PaymentEditRow {
  start_location: number;
  end_location: number;
  link_name: string;
  vendor_mis_distance: number | null;
  accepted_distance: number | null;
  rate_per_meter: number | null;
  gst_percent: number | null;
  tds_percent: number | null;
  remarks?: string | null;
}

interface PaymentEditModalProps {
  row: PaymentEditRow | null;
  onClose: () => void;
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}

type FormKey =
  | 'vendor_mis_distance'
  | 'accepted_distance'
  | 'rate_per_meter'
  | 'gst_percent'
  | 'tds_percent';

const FIELDS: { key: FormKey; label: string; suffix: string }[] = [
  { key: 'vendor_mis_distance', label: 'Vendor MIS Distance', suffix: 'mt' },
  { key: 'accepted_distance', label: 'Accepted Distance', suffix: 'mt' },
  { key: 'rate_per_meter', label: 'Rate', suffix: '₹ / mt' },
  { key: 'gst_percent', label: 'GST', suffix: '%' },
  { key: 'tds_percent', label: 'TDS', suffix: '%' },
];

const PERCENT_KEYS: FormKey[] = ['gst_percent', 'tds_percent'];

const formatCurrency = (v: number) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PaymentEditModal: React.FC<PaymentEditModalProps> = ({ row, onClose, onSaved, onError }) => {
  const [form, setForm] = useState<Record<FormKey, string>>({
    vendor_mis_distance: '',
    accepted_distance: '',
    rate_per_meter: '',
    gst_percent: '',
    tds_percent: '',
  });
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!row) return;
    setForm({
      vendor_mis_distance: String(row.vendor_mis_distance ?? ''),
      accepted_distance: String(row.accepted_distance ?? ''),
      rate_per_meter: String(row.rate_per_meter ?? ''),
      gst_percent: String(row.gst_percent ?? ''),
      tds_percent: String(row.tds_percent ?? ''),
    });
    setRemarks(row.remarks ?? '');
    setErrors({});
  }, [row]);

  if (!row) return null;

  const accepted = Number(form.accepted_distance) || 0;
  const rate = Number(form.rate_per_meter) || 0;
  const gst = Number(form.gst_percent) || 0;
  const previewBase = accepted * rate;
  const previewGst = (previewBase * gst) / 100;

  const validate = () => {
    const next: Partial<Record<FormKey, string>> = {};
    FIELDS.forEach(({ key, label }) => {
      const raw = form[key].trim();
      const n = Number(raw);
      if (raw === '') next[key] = `${label} is required`;
      else if (!Number.isFinite(n) || n < 0) next[key] = `${label} must be a positive number`;
    });
    FIELDS.forEach(({ key, label }) => {
      if (PERCENT_KEYS.includes(key) && !next[key] && Number(form[key]) > 100) {
        next[key] = `${label} cannot exceed 100%`;
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      const response = await fetch(`${TraceBASEURL}/link-payments/details`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_location: row.start_location,
          end_location: row.end_location,
          vendor_mis_distance: Number(form.vendor_mis_distance),
          accepted_distance: Number(form.accepted_distance),
          rate_per_meter: Number(form.rate_per_meter),
          gst_percent: Number(form.gst_percent),
          tds_percent: Number(form.tds_percent),
          remarks: remarks.trim(),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.status === false) {
        throw new Error(result.message || 'Failed to update payment details');
      }
      onSaved(result.message || 'Payment details updated successfully');
    } catch (err: any) {
      console.error('Error updating payment details:', err);
      onError(err?.message || 'Failed to update payment details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl">
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Edit Payment Details</h2>
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

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FIELDS.map(({ key, label, suffix }) => (
              <div key={key}>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  {label} <span className="text-gray-400 font-normal">({suffix})</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={form[key]}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, [key]: e.target.value }));
                    setErrors((prev) => ({ ...prev, [key]: undefined }));
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors[key] ? 'border-red-400' : 'border-gray-300'
                  }`}
                />
                {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Remarks <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none resize-y focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mx-6 mb-5 p-3 rounded-lg bg-gray-50 border border-gray-100 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Payable Base</span>
              <span className="tabular-nums">{formatCurrency(previewBase)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>GST ({gst}%)</span>
              <span className="tabular-nums">{formatCurrency(previewGst)}</span>
            </div>
            <div className="flex justify-between mt-1 pt-1 border-t border-gray-200 font-semibold text-gray-900">
              <span>Payable Total</span>
              <span className="tabular-nums">{formatCurrency(previewBase + previewGst)}</span>
            </div>
          </div>

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
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentEditModal;
