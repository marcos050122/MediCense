import { Report, FieldDefinition } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const exportToExcel = (reports: Report[], fields: FieldDefinition[]) => {
  // Flatten data for Excel
  const flatData = reports.map(report => {
    const row: any = {
      'Fecha': format(new Date(report.timestamp), 'dd/MM/yyyy HH:mm', { locale: es }),
      'Ubicación': report.location,
      'Notas': report.notes || '',
    };

    // Add dynamic fields
    fields.forEach(field => {
      if (field.isActive) {
        row[field.label] = report.data[field.id] || 0;
      }
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(flatData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  
  // Generate filename with date
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  XLSX.writeFile(workbook, `Reporte_MediCenso_${dateStr}.xlsx`);
};

export const exportToPDF = (reports: Report[], fields: FieldDefinition[]) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(0, 100, 160); // Medical Blue
  doc.text('Reporte Sanitario MediCenso', 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado el: ${format(new Date(), 'PPP p', { locale: es })}`, 14, 30);

  const activeFields = fields.filter(f => f.isActive);
  
  // Prepare table headers
  const headers = [['Fecha', 'Ubicación', ...activeFields.map(f => f.label)]];
  
  // Prepare table body
  const body = reports.map(report => {
    const date = format(new Date(report.timestamp), 'dd/MM/yy HH:mm');
    const row = [
      date,
      report.location,
      ...activeFields.map(f => String(report.data[f.id] ?? '-'))
    ];
    return row;
  });

  // @ts-ignore - jspdf-autotable types can be tricky
  autoTable(doc, {
    head: headers,
    body: body,
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [2, 132, 199] }, // Medical Blue 600
    styles: { fontSize: 8 },
  });

  const dateStr = format(new Date(), 'yyyy-MM-dd');
  doc.save(`Reporte_MediCenso_${dateStr}.pdf`);
};
