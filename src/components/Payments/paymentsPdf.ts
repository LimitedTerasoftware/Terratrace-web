import jsPDF from 'jspdf';
import autoTable, { CellHookData, RowInput, Styles } from 'jspdf-autotable';
import moment from 'moment';
import TricadIcon from '../../images/logo/favicon.png';
import type { PaymentRow, PaymentSummary } from './index';

type RGB = [number, number, number];

// Same palette as the Survey Inventory (Trenching & Ducting) report.
const COLORS = {
  headerBg: [239, 246, 255] as RGB, // blue-50
  accent: [59, 130, 246] as RGB, // blue-500
  accentSoft: [219, 234, 254] as RGB, // blue-100
  accentText: [29, 78, 216] as RGB, // blue-700
  title: [15, 40, 80] as RGB,
  subtitle: [60, 80, 120] as RGB,
  body: [30, 40, 60] as RGB,
  grid: [210, 220, 235] as RGB,
  altRow: [245, 249, 255] as RGB,
  footerBg: [245, 247, 250] as RGB,
  vendorRow: [250, 251, 253] as RGB,
  muted: [110, 120, 140] as RGB,
};

// Light fill + dark text so cards stay legible when printed in black & white.
const CARD_THEMES: { bg: RGB; border: RGB; text: RGB }[] = [
  { bg: [239, 246, 255], border: [59, 130, 246], text: [29, 78, 216] }, // blue
  { bg: [236, 253, 245], border: [16, 185, 129], text: [4, 120, 87] }, // green
  { bg: [255, 251, 235], border: [245, 158, 11], text: [180, 83, 9] }, // amber
  { bg: [245, 243, 255], border: [139, 92, 246], text: [109, 40, 217] }, // violet
  { bg: [240, 253, 250], border: [20, 184, 166], text: [15, 118, 110] }, // teal
  { bg: [238, 242, 255], border: [99, 102, 241], text: [67, 56, 202] }, // indigo
];

export interface PaymentsPdfFilters {
  state?: string | null;
  district?: string | null;
  block?: string | null;
  link?: string | null;
  vendor?: string | null;
  workTypes?: string[];
  paymentStatus?: string | null;
  fromDate?: string;
  toDate?: string;
}

interface PaymentsPdfInput {
  rows: PaymentRow[];
  totals: PaymentSummary | null;
  filters: PaymentsPdfFilters;
}

const num = (v: number | string | null | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Helvetica has no ₹ glyph, so amounts are plain numbers and headers say (Rs.).
const money = (v: number | string | null | undefined) =>
  v == null
    ? '-'
    : num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const dist = money;

const pct = (v: number | string | null | undefined) => (v == null ? '-' : `${num(v)}%`);

const fmtDate = (v: string) => moment(v).format('DD-MM-YYYY');

const periodLabel = (f: PaymentsPdfFilters) => {
  if (!f.fromDate && !f.toDate) return 'All Dates';
  return `${f.fromDate ? fmtDate(f.fromDate) : 'Start'} to ${f.toDate ? fmtDate(f.toDate) : 'Today'}`;
};

// Contact details of the selected vendor, taken from the per-link vendor breakdown.
const findVendorContact = (rows: PaymentRow[], vendorName: string) => {
  for (const row of rows) {
    const match = row.vendors?.find((v) => v.firm_name?.trim() === vendorName.trim());
    if (match) return { person: match.authorised_person, mobile: match.authorised_mobile };
  }
  return { person: null, mobile: null };
};

export const generatePaymentsPdf = ({ rows, totals, filters }: PaymentsPdfInput) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const now = moment();
  const requestNo = `PR-${now.format('YYYYMMDD-HHmm')}`;

  // ── Header band ──────────────────────────────────────────────────────
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setFillColor(...COLORS.accent);
  doc.rect(0, 38, pageW, 2, 'F');

  doc.addImage(TricadIcon, 'PNG', margin, 8, 18, 18);

  doc.setTextColor(...COLORS.title);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Payment Request', 38, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.subtitle);
  doc.text('Construction Tracking System', 38, 25);

  doc.setTextColor(...COLORS.title);
  doc.setFont('helvetica', 'bold');
  doc.text(`Request No: ${requestNo}`, pageW - margin, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.subtitle);
  doc.text(`Generated: ${now.format('DD-MM-YYYY hh:mm A')}`, pageW - margin, 20, { align: 'right' });
  doc.text(`Period: ${periodLabel(filters)}`, pageW - margin, 27, { align: 'right' });

  let y = 48;

  // ── Bill To / Request scope blocks ───────────────────────────────────
  const blockW = pageW / 2 - margin - 3;
  const blockH = 32;

  const drawBlock = (x: number, tag: string, tagW: number) => {
    doc.setFillColor(...COLORS.headerBg);
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, blockW, blockH, 2, 2, 'FD');
    doc.setFillColor(...COLORS.accentSoft);
    doc.roundedRect(x, y, tagW, 7, 1, 1, 'FD');
    doc.setTextColor(...COLORS.accentText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(tag, x + 4, y + 5);
  };

  // Bill To: the selected vendor, or every vendor in the request.
  drawBlock(margin, 'BILL TO', 28);
  doc.setTextColor(...COLORS.title);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  if (filters.vendor) {
    const contact = findVendorContact(rows, filters.vendor);
    doc.text(doc.splitTextToSize(filters.vendor, blockW - 8)[0], margin + 4, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.subtitle);
    doc.text(`Contact: ${contact.person || 'N/A'}`, margin + 4, y + 22);
    doc.text(`Mobile:  ${contact.mobile || 'N/A'}`, margin + 4, y + 28);
  } else {
    const firms = new Set<string>();
    rows.forEach((r) =>
      (r.firm_names || '').split(',').forEach((f) => f.trim() && firms.add(f.trim())),
    );
    doc.text('All Vendors', margin + 4, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.subtitle);
    doc.text(`${firms.size} vendor(s) included in this request`, margin + 4, y + 22);
  }

  // Request scope: the filters this request was raised for.
  const scopeX = pageW / 2 + 3;
  drawBlock(scopeX, 'REQUEST SCOPE', 32);
  const scope: [string, string][] = [
    ['State', filters.state || 'All'],
    ['District', filters.district || 'All'],
    ['Block', filters.block || 'All'],
    ['Work Type', filters.workTypes?.length ? filters.workTypes.join(', ') : 'All'],
    ['Status', filters.paymentStatus || 'All'],
    ['Link', filters.link || 'All'],
  ];
  doc.setFontSize(8.5);
  scope.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = scopeX + 4 + col * (blockW / 2);
    const sy = y + 14 + row * 6;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.subtitle);
    doc.text(`${label}:`, sx, sy);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.title);
    doc.text(doc.splitTextToSize(value, blockW / 2 - 24)[0], sx + 18, sy);
  });

  y += blockH + 6;

  // ── Summary cards ────────────────────────────────────────────────────
  const cards = [
    { label: 'Total Links', value: String(rows.length) },
    { label: 'Total Surveys', value: String(num(totals?.total_surveys)) },
    { label: 'Accepted Distance', value: `${dist(totals?.accepted_distance ?? 0)} mt` },
    { label: 'Base Amount (Rs.)', value: money(totals?.base_amount ?? 0) },
    { label: 'GST Amount (Rs.)', value: money(totals?.gst_amount ?? 0) },
    { label: 'Net Payable (Rs.)', value: money(totals?.net_payable ?? 0) },
  ];
  const gap = 4;
  const cardW = (pageW - margin * 2 - gap * (cards.length - 1)) / cards.length;
  cards.forEach((card, i) => {
    const theme = CARD_THEMES[i % CARD_THEMES.length];
    const cx = margin + i * (cardW + gap);
    doc.setFillColor(...theme.bg);
    doc.setDrawColor(...theme.border);
    doc.setLineWidth(0.4);
    doc.roundedRect(cx, y, cardW, 18, 2, 2, 'FD');
    doc.setTextColor(...theme.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(card.value, cx + cardW / 2, y + 10, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(card.label, cx + cardW / 2, y + 15.5, { align: 'center' });
  });
  y += 24;

  // ── Section title ────────────────────────────────────────────────────
  doc.setTextColor(...COLORS.title);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Link-wise Payment Details', margin, y);
  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 1.5, margin + 48, y + 1.5);
  y += 6;

  // ── Table ────────────────────────────────────────────────────────────
  const head: RowInput[] = [
    [
      '#',
      'Link Name / Location',
      'Firm',
      'Work Type',
      'Accepted (mt)',
      'Rate/mt (Rs.)',
      'GST %',
      'Base (Rs.)',
      'GST (Rs.)',
      'Net Payable (Rs.)',
    ],
  ];

  // Tracks which body rows are vendor sub-rows, for styling.
  const vendorRowIdx = new Set<number>();
  const body: RowInput[] = [];
  rows.forEach((r, i) => {
    body.push([
      i + 1,
      `${r.link_name || '-'}\n${[r.state_name, r.district_name, r.block_name].filter(Boolean).join(' / ')}`,
      r.firm_names || '-',
      r.work_types || '-',
      dist(r.accepted_distance),
      money(r.rate_per_meter),
      pct(r.gst_percent),
      money(r.base_amount),
      money(r.gst_amount),
      money(r.net_payable),
    ]);
    // A single vendor repeats the link row, so only break down shared links.
    if ((r.vendors?.length ?? 0) > 1) {
      r.vendors!.forEach((v) => {
        vendorRowIdx.add(body.length);
        const net =
          v.base_amount == null && v.gst_amount == null && v.tds_amount == null
            ? null
            : num(v.base_amount) + num(v.gst_amount) - num(v.tds_amount);
        body.push([
          '',
          '   - vendor share',
          v.firm_name || '-',
          '',
          dist(v.accepted_distance),
          money(v.rate_per_meter),
          pct(v.gst_percent),
          money(v.base_amount),
          money(v.gst_amount),
          money(net),
        ]);
      });
    }
  });

  const foot: RowInput[] = totals
    ? [
        [
          { content: 'Grand Total', colSpan: 4, styles: { halign: 'right' } },
          dist(totals.accepted_distance),
          '',
          '',
          money(totals.base_amount),
          money(totals.gst_amount),
          money(totals.net_payable),
        ],
      ]
    : [];

  const LINK_COL = 1;
  const NUMERIC_FROM = 4;
  const NET_COL = 9;

  // Fixed widths so amounts never wrap; the link column takes the remaining width.
  const columnStyles: Record<number, Partial<Styles>> = {
    0: { cellWidth: 8, halign: 'center' },
    2: { cellWidth: 40 },
    3: { cellWidth: 25 },
    4: { cellWidth: 22 },
    5: { cellWidth: 20 },
    6: { cellWidth: 13 },
    7: { cellWidth: 26 },
    8: { cellWidth: 24 },
    9: { cellWidth: 28 },
  };

  autoTable(doc, {
    head,
    body: body.length
      ? body
      : [[{ content: 'No payment records found', colSpan: 10, styles: { halign: 'center' } }]],
    foot,
    startY: y,
    margin: { left: margin, right: margin, top: 14, bottom: 16 },
    theme: 'grid',
    showFoot: 'lastPage',
    rowPageBreak: 'avoid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2,
      textColor: COLORS.body,
      lineColor: COLORS.grid,
      lineWidth: 0.2,
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: COLORS.headerBg,
      textColor: COLORS.title,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      lineColor: COLORS.accent,
      lineWidth: 0.2,
    },
    footStyles: {
      fillColor: COLORS.accentSoft,
      textColor: COLORS.title,
      fontStyle: 'bold',
      halign: 'right',
      lineColor: COLORS.accent,
      lineWidth: 0.2,
    },
    alternateRowStyles: { fillColor: COLORS.altRow },
    columnStyles,
    didParseCell: (data: CellHookData) => {
      if (data.section !== 'body') return;
      const col = data.column.index;
      if (col >= NUMERIC_FROM) data.cell.styles.halign = 'right';
      if (col === NET_COL) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = COLORS.title;
      }
      if (vendorRowIdx.has(data.row.index)) {
        data.cell.styles.fillColor = COLORS.vendorRow;
        data.cell.styles.textColor = COLORS.muted;
        data.cell.styles.fontSize = 7;
        if (col === LINK_COL) data.cell.styles.fontStyle = 'italic';
      }
    },
  });

  // ── Sign-off block ───────────────────────────────────────────────────
  const signH = 26;
  let signY = (doc as any).lastAutoTable.finalY + 10;
  if (signY + signH > pageH - 16) {
    doc.addPage();
    signY = 20;
  }
  doc.setTextColor(...COLORS.subtitle);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'Net Payable = Base + GST - TDS. Amounts are calculated on the accepted distance at the agreed rate.',
    margin,
    signY,
  );
  const signers = ['Prepared By', 'Verified By', 'Approved By'];
  const signW = (pageW - margin * 2 - 2 * 20) / 3;
  signers.forEach((label, i) => {
    const sx = margin + i * (signW + 20);
    const lineY = signY + 20;
    doc.setDrawColor(...COLORS.grid);
    doc.setLineWidth(0.4);
    doc.line(sx, lineY, sx + signW, lineY);
    doc.setTextColor(...COLORS.title);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(label, sx, lineY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.subtitle);
    doc.text('Name / Signature / Date', sx, lineY + 9.5);
  });

  // ── Footer on every page ─────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFillColor(...COLORS.footerBg);
    doc.rect(0, pageH - 10, pageW, 10, 'F');
    doc.setDrawColor(...COLORS.accent);
    doc.setLineWidth(0.3);
    doc.line(0, pageH - 10, pageW, pageH - 10);
    doc.setTextColor(...COLORS.subtitle);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('CONFIDENTIAL - For internal billing use only', margin, pageH - 4);
    doc.text(requestNo, pageW / 2, pageH - 4, { align: 'center' });
    doc.text(`Page ${p} of ${pages}`, pageW - margin, pageH - 4, { align: 'right' });
  }

  const vendorSlug = (filters.vendor || 'all').trim().replace(/\s+/g, '_');
  doc.save(`payment_request_${vendorSlug}_${now.format('YYYY-MM-DD')}.pdf`);
};
