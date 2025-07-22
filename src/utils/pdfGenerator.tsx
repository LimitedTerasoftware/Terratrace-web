import { pdf } from '@react-pdf/renderer';
import { PDFDocumentMachine } from '../components/DepthChart/PerformanceChart/PDFDocument';
import { MachineData } from '../types/machine';

export const generatePDF = async (data: MachineData, filters: any) => {
  try {
     const blob = await pdf(<PDFDocumentMachine data={data} filters={filters}/>).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `machine-${data.machineId}-report-${filters.month}-${filters.year}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};