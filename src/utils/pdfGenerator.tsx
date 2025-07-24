import { pdf } from '@react-pdf/renderer';
import { PDFDocument } from '../components/DepthChart/PerformanceChart/PDFDocument';
import { MachineData, DepthPenalties } from '../types/machine';

export const generatePDF = async (data: MachineData, filters: any, depthPenalties?: DepthPenalties) => {
  try {
    const blob = await pdf(<PDFDocument data={data} filters={filters} depthPenalties={depthPenalties} />).toBlob();
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `machine-${filters.machineName}-report-${filters.month}-${filters.year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
