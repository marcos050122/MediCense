import { Report, FieldDefinition } from '../types';
import { DEFAULT_FIELDS } from '../constants';

// This is a local abstraction. In a real scenario, replace localStorage calls 
// with `supabase.from('reports').select(...)` etc.

const STORAGE_KEYS = {
  REPORTS: 'medicenso_reports',
  FIELDS: 'medicenso_fields',
};

export const storageService = {
  getReports: (): Report[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading reports", e);
      return [];
    }
  },

  getReportById: (id: string): Report | undefined => {
    const reports = storageService.getReports();
    return reports.find(r => r.id === id);
  },

  saveReport: (report: Report): void => {
    const reports = storageService.getReports();
    // Add new report to the beginning
    const updatedReports = [report, ...reports];
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updatedReports));
  },

  updateReport: (updatedReport: Report): void => {
    const reports = storageService.getReports();
    const index = reports.findIndex(r => r.id === updatedReport.id);
    if (index !== -1) {
      reports[index] = updatedReport;
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    }
  },

  deleteReport: (id: string): void => {
    const reports = storageService.getReports();
    const filtered = reports.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(filtered));
  },

  getFields: (): FieldDefinition[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FIELDS);
      return data ? JSON.parse(data) : DEFAULT_FIELDS;
    } catch (e) {
      return DEFAULT_FIELDS;
    }
  },

  saveFields: (fields: FieldDefinition[]): void => {
    localStorage.setItem(STORAGE_KEYS.FIELDS, JSON.stringify(fields));
  }
};
