import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MachineData } from '../types/machine';
import { formatCurrency, formatDistance } from './calculations';

export const generatePDF = async (data: MachineData, filters: any) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  
  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(40, 40, 40);
  pdf.text('Machine Performance Report', pageWidth / 2, 20, { align: 'center' });
  
  // Machine Info
  pdf.setFontSize(12);
  pdf.text(`Machine ID: ${filters.machineName}`, 20, 35);
  pdf.text(`Report Period: ${filters.month}/${filters.year}`, 20, 45);
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 55);
  
  // Performance Summary
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Performance Summary', 20, 75);
  
  pdf.setFontSize(10);
  const summaryData = [
    ['Monthly Distance', formatDistance(data.monthlyTotalDistance)],
    ['Machine Rent', formatCurrency(data.machineRent)],
    ['Monthly Penalty', data.monthlyPenalty ? formatCurrency(data.monthlyPenalty) : '-'],
    ['Monthly Incentive', data.monthlyIncentive ? formatCurrency(data.monthlyIncentive) : '-'],
    ['Net Cost', formatCurrency(data.netCost)]
  ];
  
  let yPos = 85;
  summaryData.forEach(([label, value]) => {
    pdf.text(`${label}:`, 20, yPos);
    pdf.text(value, 80, yPos);
    yPos += 10;
  });
  
  // Daily Performance Table
  pdf.setFontSize(14);
  pdf.text('Daily Performance', 20, yPos + 10);
  
  // Table headers
  yPos += 25;
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Date', 20, yPos);
  pdf.text('Distance (km)', 60, yPos);
  pdf.text('Target Met', 100, yPos);
  pdf.text('Difference', 140, yPos);
  
  // Table data
  pdf.setTextColor(0, 0, 0);
  data.dailyDistances.forEach((day, index) => {
    yPos += 10;
    if (yPos > 270) { // New page
      pdf.addPage();
      yPos = 20;
    }
    
    pdf.text(new Date(day.date).toLocaleDateString(), 20, yPos);
    pdf.text(day.totalDistance.toFixed(2), 60, yPos);
    pdf.text(day.meetsDailyRequirement ? 'Yes' : 'No', 100, yPos);
    pdf.text(day.difference.toFixed(2), 140, yPos);
  });
  
  // Save the PDF
  pdf.save(`machine-${filters.machineName}-report-${filters.month}-${filters.year}.pdf`);
};