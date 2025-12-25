import { Report, FieldDefinition } from '../types';
import { DEFAULT_FIELDS } from '../constants';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  REPORTS: 'medicenso_reports',
  FIELDS: 'medicenso_fields',
};

export const storageService = {
  // --- Supabase Methods ---

  getReports: async (userId: string): Promise<Report[]> => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error("Error fetching reports from Supabase:", error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      location: item.location,
      notes: item.notes,
      timestamp: item.timestamp,
      data: item.data,
      userId: item.user_id
    }));
  },

  getReportById: async (id: string): Promise<Report | undefined> => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching report by ID:", error);
      return undefined;
    }

    return {
      id: data.id,
      location: data.location,
      notes: data.notes,
      timestamp: data.timestamp,
      data: data.data,
      userId: data.user_id
    };
  },

  saveReport: async (report: Omit<Report, 'id'>, userId: string): Promise<Report | null> => {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        location: report.location,
        notes: report.notes,
        timestamp: report.timestamp,
        data: report.data
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving report to Supabase:", error);
      return null;
    }

    return {
      id: data.id,
      location: data.location,
      notes: data.notes,
      timestamp: data.timestamp,
      data: data.data,
      userId: data.user_id
    };
  },

  updateReport: async (updatedReport: Report): Promise<boolean> => {
    const { error } = await supabase
      .from('reports')
      .update({
        location: updatedReport.location,
        notes: updatedReport.notes,
        timestamp: updatedReport.timestamp,
        data: updatedReport.data
      })
      .eq('id', updatedReport.id);

    if (error) {
      console.error("Error updating report in Supabase:", error);
      return false;
    }
    return true;
  },

  deleteReport: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting report from Supabase:", error);
      return false;
    }
    return true;
  },

  getFields: async (userId: string): Promise<FieldDefinition[]> => {
    const { data, error } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('user_id', userId)
      .order('order', { ascending: true });

    if (error) {
      console.error("Error fetching fields from Supabase:", error);
      return DEFAULT_FIELDS;
    }

    if (!data || data.length === 0) {
      return DEFAULT_FIELDS;
    }

    return data.map(item => ({
      id: item.id,
      label: item.label,
      type: item.type as any,
      isActive: item.is_active,
      order: item.order
    }));
  },

  saveFields: async (fields: FieldDefinition[], userId: string): Promise<boolean> => {
    // This is more complex because we might need to delete old ones or update.
    // For simplicity, let's clear and re-insert or use upsert if we have IDs.
    // Given the small number of fields, a delete + insert is often safer for sync.

    // 1. Delete existing fields for user
    const { error: deleteError } = await supabase
      .from('field_definitions')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error("Error clearing old fields:", deleteError);
      return false;
    }

    // 2. Insert new fields
    const fieldsToInsert = fields.map(f => ({
      user_id: userId,
      label: f.label,
      type: f.type,
      is_active: f.isActive,
      order: f.order
    }));

    const { error: insertError } = await supabase
      .from('field_definitions')
      .insert(fieldsToInsert);

    if (insertError) {
      console.error("Error inserting new fields:", insertError);
      return false;
    }

    return true;
  },

  // --- Local Management & Migration ---

  getLocalReports: (): Report[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  getLocalFields: (): FieldDefinition[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FIELDS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  clearLocalData: () => {
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.FIELDS);
  },

  migrateToSupabase: async (userId: string): Promise<{ reports: number; fields: number }> => {
    const localReports = storageService.getLocalReports();
    const localFields = storageService.getLocalFields();

    let reportsMigrated = 0;
    let fieldsMigrated = 0;

    // Migrate fields first (if any custom ones exist)
    if (localFields.length > 0) {
      const success = await storageService.saveFields(localFields, userId);
      if (success) fieldsMigrated = localFields.length;
    }

    // Migrate reports
    for (const report of localReports) {
      const saved = await storageService.saveReport(report, userId);
      if (saved) reportsMigrated++;
    }

    if (reportsMigrated > 0 || fieldsMigrated > 0) {
      storageService.clearLocalData();
    }

    return { reports: reportsMigrated, fields: fieldsMigrated };
  }
};
