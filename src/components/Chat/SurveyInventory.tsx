import { ChevronRight, Download, FileText, Building2, MapPin, Calendar, Hash } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable, { TableColumn } from 'react-data-table-component';
import { useNavigate } from 'react-router-dom';
import { SurveyLinksData, UGConstructionSurveyData } from '../../types/survey';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TricadIcon from '../../images/logo/favicon.png';

const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;

interface SurveyInventoryProps {
  selectedState?: string;
  selectedDistrict?: string;
  selectedBlock?: string;
  selectedVendor?: string;
  searchQuery?: string;
  selectedPeriod?: string;
}

export default function SurveyInventory({
  selectedState,
  selectedDistrict,
  selectedBlock,
  selectedVendor,
  searchQuery,
  selectedPeriod,
}: SurveyInventoryProps) {
  const navigate = useNavigate();
  const [data, setData] = useState<SurveyLinksData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const fetchSurveyData = async () => {
      setIsLoading(true);
      try {
        const params: Record<string, string | number> = {};

        if (selectedState) params.state_id = selectedState;
        if (selectedDistrict) params.district_id = selectedDistrict;
        if (selectedBlock) params.block_id = selectedBlock;
        if (selectedVendor) params.firm_id = selectedVendor;
        if (searchQuery) params.search = searchQuery;

        const { fromDate, toDate } = getDateRange(selectedPeriod);
        if (fromDate) params.from_date = fromDate;
        if (toDate) params.to_date = toDate;

        const response = await axios.get<{
          status: boolean;
          data: SurveyLinksData[];
        }>(`${TraceBASEURL}/get-link-data`, { params });
        if (response.data.status) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching survey data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurveyData();
  }, [
    selectedState,
    selectedDistrict,
    selectedBlock,
    selectedVendor,
    searchQuery,
    selectedPeriod,
  ]);

  const getDateRange = (period?: string) => {
    if (period === 'all') return { fromDate: undefined, toDate: undefined };
    if (period === 'today') {
      const today = new Date();
      return {
        fromDate: today.toISOString().split('T')[0],
        toDate: today.toISOString().split('T')[0],
      };
    }
    if (period === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        fromDate: yesterday.toISOString().split('T')[0],
        toDate: yesterday.toISOString().split('T')[0],
      };
    }
    const days = parseInt(period || '30') || 30;
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    return {
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
    };
  };

  const formatDistance = (distance: string | null) => {
    if (!distance) return '0 km';
    const meters = parseFloat(distance);
    if (isNaN(meters)) return '0 km';
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTotalDistance = () => {
    const total = data.reduce((acc, row) => {
      const meters = parseFloat(row.total_distance || '0');
      return acc + (isNaN(meters) ? 0 : meters);
    }, 0);
    return (total).toFixed(2);
  };

  const getTotalSurveys = () => {
    return data.reduce((acc, row) => acc + (row.total_surveys || 0), 0);
  };

  const getPeriodLabel = () => {
    if (!selectedPeriod || selectedPeriod === 'all') return 'All Time';
    if (selectedPeriod === 'today') return 'Today';
    if (selectedPeriod === 'yesterday') return 'Yesterday';
    return `Last ${selectedPeriod} Days`;
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const now = new Date();
      // const invoiceNo = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

      // ── Background header band ──────────────────────────────────────────
      doc.setFillColor(15, 40, 80);
      doc.rect(0, 0, pageWidth, 38, 'F');

      // Accent stripe
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 38, pageWidth, 2, 'F');

      // ── Header text ────────────────────────────────────────────────────
      const logoWidth = 18;
      const logoHeight = 18;

      doc.addImage(TricadIcon, 'PNG', 14, 8, logoWidth, logoHeight);

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Trenching & Ducting Report', 38, 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(180, 210, 255);
      doc.text('Construction Tracking System', 38, 25);

      // Right side — invoice meta
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      // doc.text(`Invoice No: ${invoiceNo}`, pageWidth - 14, 13, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${now.toLocaleString('en-IN')}`, pageWidth - 14, 20, { align: 'right' });
      doc.text(`Period: ${getPeriodLabel()}`, pageWidth - 14, 27, { align: 'right' });

      let yPos = 48;

      // ── Vendor / Billing block ─────────────────────────────────────────
      if ( data[0]?.firm_name) {
        const vendorName = data[0]?.firm_name || 'N/A';
        const authPerson = data[0]?.authorised_person || 'N/A';
        const authMobile = data[0]?.authorised_mobile || 'N/A';

        // Bill-to card background
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.4);
        doc.roundedRect(14, yPos, pageWidth / 2 - 20, 32, 2, 2, 'FD');

        doc.setFillColor(59, 130, 246);
        doc.roundedRect(14, yPos, 28, 7, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('BILL TO', 18, yPos + 5);

        doc.setTextColor(15, 40, 80);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(vendorName, 18, yPos + 15);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(60, 80, 120);
        doc.text(`Contact: ${authPerson}`, 18, yPos + 22);
        doc.text(`Mobile:  ${authMobile}`, 18, yPos + 28);

        yPos += 38;
      }

      // ── Summary cards row ──────────────────────────────────────────────
      const cardW = (pageWidth - 28 - 3 * 4) / 4;
      const cardData = [
        { label: 'Total Links', value: String(data.length), color: [59, 130, 246] as [number,number,number] },
        { label: 'Total Surveys', value: String(getTotalSurveys()), color: [16, 185, 129] as [number,number,number] },
        { label: 'Total Distance', value: `${getTotalDistance()} mt`, color: [245, 158, 11] as [number,number,number] },
        { label: 'Report Period', value: getPeriodLabel(), color: [139, 92, 246] as [number,number,number] },
      ];

      cardData.forEach((card, i) => {
        const cx = 14 + i * (cardW + 4);
        doc.setFillColor(card.color[0], card.color[1], card.color[2]);
        doc.roundedRect(cx, yPos, cardW, 18, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(card.value, cx + cardW / 2, yPos + 10, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(card.label, cx + cardW / 2, yPos + 15.5, { align: 'center' });
      });

      yPos += 24;

      // ── Section title ──────────────────────────────────────────────────
      doc.setTextColor(15, 40, 80);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Construction Link Details', 14, yPos);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(14, yPos + 1.5, 14 + 50, yPos + 1.5);

      yPos += 6;

      // ── Table ──────────────────────────────────────────────────────────
      const tableRows = data.map((row, idx) => [
        String(idx + 1),
        row.state_name || '-',
        row.district_name || '-',
        row.block_name || '-',
        `(${row.start_name || ''}) TO (${row.end_name || ''})`,
        String(row.total_surveys || 0),
        `${parseFloat(row.total_distance).toFixed(2)} mt`,
        row.firm_name || '-',
        row.authorised_person ? `${row.authorised_person}\n${row.authorised_mobile || ''}` : '-',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['#', 'State', 'District', 'Block', 'Link (Start TO End)', 'Surveys', 'Distance', 'Firm', 'Authorised By']],
        body: tableRows,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
          textColor: [30, 40, 60],
          lineColor: [210, 220, 235],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [15, 40, 80],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        alternateRowStyles: { fillColor: [245, 249, 255] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          5: { halign: 'center', cellWidth: 18 },
          6: { halign: 'center', cellWidth: 22 },
        },
        didDrawPage: (hookData) => {
          // Footer on every page
          const pg = hookData.pageNumber;
          const totalPages = (doc as any).internal.getNumberOfPages();
          doc.setFillColor(15, 40, 80);
          doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
          doc.setTextColor(180, 210, 255);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.text('CONFIDENTIAL — For internal billing use only', 14, pageHeight - 4);
          doc.text(`Page ${pg} of ${totalPages}`, pageWidth - 14, pageHeight - 4, { align: 'right' });
          // doc.text(invoiceNo, pageWidth / 2, pageHeight - 4, { align: 'center' });
        },
      });

      const vendorSlug = (vendorName || 'all').replace(/\s+/g, '_');
      doc.save(`survey_inventory_${vendorSlug}_${now.toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────
  const columns: TableColumn<SurveyLinksData>[] = [
    {
      name: 'State',
      selector: (row) => row.state_name,
      sortable: true,
      wrap: true,
      cell: (row) => <span title={row.state_name}>{row.state_name}</span>,
    },
    {
      name: 'District',
      selector: (row) => row.district_name,
      sortable: true,
      maxWidth: '150px',
      wrap: true,
      cell: (row) => <span title={row.district_name}>{row.district_name}</span>,
    },
    {
      name: 'Block',
      selector: (row) => row.block_name,
      cell: (row) => (
        <span className="text-sm font-medium text-gray-900">{row.block_name}</span>
      ),
    },
    {
      name: 'Link',
      selector: (row) => row.start_name + ' → ' + row.end_name,
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {row.start_name} → {row.end_name}
        </span>
      ),
    },
    {
      name: 'Total Surveys',
      selector: (row) => row.total_surveys || 0,
      cell: (row) => (
        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
          {row.total_surveys || 0}
        </span>
      ),
    },
    {
      name: 'Distance',
      selector: (row) => row.total_distance || '0',
      cell: (row) => (
        <span className="text-sm font-medium text-emerald-700">
         `{parseFloat(row.total_distance).toFixed(2)} mt`
        </span>
      ),
    },
    {
      name: 'Firm Name',
      selector: (row) => row.firm_name || '-',
      cell: (row) => (
        <span className="text-sm text-gray-600">{row.firm_name || '-'}</span>
      ),
    },
    {
      name: 'Authorised By',
      selector: (row) => row.authorised_person || '-',
      cell: (row) => (
        <div className="py-1">
          <div className="text-sm font-medium text-gray-800">{row.authorised_person || '-'}</div>
          {row.authorised_mobile && (
            <div className="text-xs text-gray-400 mt-0.5">{row.authorised_mobile}</div>
          )}
        </div>
      ),
    },
  ];

  const vendorName =  (selectedVendor && data[0]?.firm_name) || null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── Vendor Billing Banner (shown only when vendor is selected) ── */}
      {vendorName && (
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {/* Icon badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-blue-200 text-xs font-medium tracking-widest uppercase mb-0.5">
                  Billing Vendor
                </p>
                <p className="text-white text-lg font-bold leading-tight">{vendorName}</p>
                {data[0]?.authorised_person && (
                  <p className="text-blue-200 text-xs mt-0.5">
                    Contact: {data[0].authorised_person}
                    {data[0].authorised_mobile && ` · ${data[0].authorised_mobile}`}
                  </p>
                )}
              </div>
            </div>

            {/* Quick stats pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1">
                <Hash className="w-3 h-3 text-blue-200" />
                <span className="text-white text-xs font-semibold">{data.length} Links</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1">
                <MapPin className="w-3 h-3 text-blue-200" />
                <span className="text-white text-xs font-semibold">{getTotalDistance()} mt</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1">
                <Calendar className="w-3 h-3 text-blue-200" />
                <span className="text-white text-xs font-semibold">{getPeriodLabel()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Card Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="text-base font-semibold text-gray-900">Survey Links</h3>
          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
            {data.length}
          </span>
        </div>

        {/* PDF Download button */}
        <button
          onClick={generatePDF}
          disabled={isGeneratingPDF || data.length === 0}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
            transition-all duration-200 select-none
            ${isGeneratingPDF || data.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white shadow-sm hover:shadow-md'
            }
          `}
        >
          {isGeneratingPDF ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3V4a10 10 0 00-10 10h4z" />
              </svg>
              Generating…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download PDF
            </>
          )}
        </button>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="p-4">
        <DataTable
          columns={columns}
          data={data}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 25, 50]}
          highlightOnHover
          pointerOnHover
          progressPending={isLoading}
          progressComponent={
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-9 w-9 border-[3px] border-blue-100 border-t-blue-600" />
              <p className="text-sm text-gray-400">Loading survey data…</p>
            </div>
          }
          noDataComponent={
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
              <FileText className="w-10 h-10 text-gray-200" />
              <p className="text-sm">No survey data available</p>
            </div>
          }
          customStyles={{
            headRow: {
              style: {
                backgroundColor: '#f8fafc',
                borderBottomWidth: '1px',
                borderBottomColor: '#e2e8f0',
              },
            },
            headCells: {
              style: {
                fontSize: '12px',
                fontWeight: '600',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                paddingTop: '10px',
                paddingBottom: '10px',
              },
            },
            rows: {
              style: {
                fontSize: '13px',
                color: '#374151',
                borderBottomColor: '#f1f5f9',
                '&:hover': { backgroundColor: '#eff6ff' },
              },
            },
            pagination: {
              style: {
                borderTop: '1px solid #f1f5f9',
                color: '#64748b',
                fontSize: '13px',
              },
            },
          }}
        />
      </div>
    </div>
  );
}