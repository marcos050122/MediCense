import { Report, FieldDefinition } from '../types';
import { DEFAULT_FIELDS } from '../constants';
import { supabase } from './supabase';

const STORAGE_KEYS = {
  REPORTS: 'medicenso_reports',
  FIELDS: 'medicenso_fields',
  SYNC_QUEUE: 'medicenso_sync_queue',
};

interface SyncItem {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'reports' | 'field_definitions';
  payload: any;
  timestamp: string;
}

const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const LEGACY_ID_MAP: Record<string, string> = {
  'total_houses': '2b9d3e42-7c70-4a2a-b425-9c9e843e9e51',
  'houses_visited': '6f9c8d32-2b1a-4d9e-8c7a-5b4a3c2d1e0f',
  'total_pop': 'a1b2c3d4-e5f6-4a5b-b6c7-d8e9f0a1b2c3',
  'over_80': 'f1a2b3c4-d5e6-4f5a-8b7c-0d9e8f7a6b5c',
  'over_60': 'e5d4c3b2-a1b0-4c9d-8e7f-6a5b4c3d2e1f',
  'pregnant': 'b9a8c7d6-e5f4-3d2c-1b0a-9d8c7b6a5e4d',
  'infants': 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a',
  'sick': 'c3d4e5f6-a1b2-0c9d-8e7f-6a5b4c3d2e1f',
  'vulnerable': '0f9e8d7c-6b5a-4e3d-2c1b-0a1b2c3d4e5f',
  'solo_seniors': '7a6b5c4d-3e2f-1a0b-9c8d-7e6f5a4b3c2d'
};

const migrateReportData = (report: Report): Report => {
  const newData: any = {};
  let changed = false;

  Object.keys(report.data).forEach(key => {
    if (LEGACY_ID_MAP[key]) {
      newData[LEGACY_ID_MAP[key]] = report.data[key];
      changed = true;
    } else {
      newData[key] = report.data[key];
    }
  });

  return changed ? { ...report, data: newData } : report;
};

export const storageService = {
  // --- Core Methods with Performance Optimization ---

  getReports: async (userId: string): Promise<Report[]> => {
    // 1. Get from local cache first for instant UI
    const local = storageService.getLocalReports();

    // 2. Fetch from Supabase in background to revalidate
    // We don't await this if we already have local data to show
    const fetchPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', userId)
          .order('timestamp', { ascending: false });

        if (!error && data) {
          const reports: Report[] = data.map(item => ({
            id: item.id,
            location: item.location,
            notes: item.notes,
            timestamp: item.timestamp,
            updatedAt: item.data?._updatedAt,
            data: item.data,
            userId: item.user_id
          }));

          // Only update cache if we are online and sync queue is empty
          // to avoid overwriting pending local changes
          const queue = storageService.getSyncQueue();
          if (queue.length === 0) {
            storageService.setLocalReports(reports);
          }
          return reports;
        }
      } catch (err) {
        console.error("Bakground revalidation failed:", err);
      }
      return local;
    })();

    // If local is empty, we must wait for network
    if (local.length === 0) {
      return await fetchPromise;
    }

    // Otherwise, return local immediately and let the UI update later if needed
    // (though in this architecture, the component would need a refresh mechanism)
    // For simplicity, we return the fetchPromise if the user is willing to wait,
    // but the actual "Instant" feel comes from calling this again.
    return local;
  },

  getReportById: async (id: string): Promise<Report | undefined> => {
    // Check local first
    const local = storageService.getLocalReports();
    const found = local.find(r => r.id === id);
    if (found) return found;

    // Fallback to network only if ID looks like a UUID
    if (!isUUID(id)) return undefined;

    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          location: data.location,
          notes: data.notes,
          timestamp: data.timestamp,
          updatedAt: data.data?._updatedAt,
          data: data.data,
          userId: data.user_id
        };
      }
    } catch (e) {
      console.error("Error fetching report by ID:", e);
    }
    return undefined;
  },

  saveReport: async (report: Omit<Report, 'id'>, userId: string): Promise<Report | null> => {
    // Generate an ID for local-first use
    const tempId = crypto.randomUUID();
    const newReport: Report = { ...report, id: tempId, userId };

    // 1. Save to local storage immediately (Optimistic Update)
    const localReports = storageService.getLocalReports();
    storageService.setLocalReports([newReport, ...localReports].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));

    // 2. Add to Sync Queue
    storageService.addToSyncQueue({
      type: 'INSERT',
      table: 'reports',
      payload: { ...report, user_id: userId, id: tempId, data: { ...report.data, _updatedAt: new Date().toISOString() } },
      timestamp: new Date().toISOString()
    });

    // 3. Attempt to sync immediately (don't await)
    storageService.syncPendingChanges().catch(console.error);

    return newReport;
  },

  updateReport: async (updatedReport: Report): Promise<boolean> => {
    // 1. Update local immediately
    const localReports = storageService.getLocalReports();
    const index = localReports.findIndex(r => r.id === updatedReport.id);
    if (index !== -1) {
      const reportWithUpdate = { ...updatedReport, updatedAt: new Date().toISOString() };
      localReports[index] = reportWithUpdate;
      storageService.setLocalReports(localReports.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    }

    // 2. Add to Sync Queue
    storageService.addToSyncQueue({
      type: 'UPDATE',
      table: 'reports',
      payload: {
        id: updatedReport.id,
        location: updatedReport.location,
        notes: updatedReport.notes,
        timestamp: updatedReport.timestamp,
        data: { ...updatedReport.data, _updatedAt: new Date().toISOString() }
      },
      timestamp: new Date().toISOString()
    });

    // 3. Attempt sync
    storageService.syncPendingChanges().catch(console.error);

    return true;
  },

  deleteReport: async (id: string): Promise<boolean> => {
    // 1. Update local immediately
    const localReports = storageService.getLocalReports().filter(r => r.id !== id);
    storageService.setLocalReports(localReports);

    // 2. Add to Sync Queue
    storageService.addToSyncQueue({
      type: 'DELETE',
      table: 'reports',
      payload: { id },
      timestamp: new Date().toISOString()
    });

    // 3. Attempt sync
    storageService.syncPendingChanges().catch(console.error);

    return true;
  },

  getFields: async (userId: string): Promise<FieldDefinition[]> => {
    const local = storageService.getLocalFields();
    if (local.length > 0) return local;

    const { data, error } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('user_id', userId)
      .order('order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_FIELDS;
    }

    const fields: FieldDefinition[] = data.map(item => ({
      id: item.id,
      label: item.label,
      type: item.type as any,
      isActive: item.is_active,
      order: item.order
    }));

    // Ensure local fields also use UUIDs if they are legacy
    const migratedFields = fields.map(f => ({
      ...f,
      id: LEGACY_ID_MAP[f.id] || f.id
    }));

    storageService.setLocalFields(migratedFields);
    return migratedFields;
  },

  saveFields: async (fields: FieldDefinition[], userId: string): Promise<boolean> => {
    // 1. Ensure all fields have UUIDs before saving/syncing
    const validatedFields = fields.map(f => {
      if (isUUID(f.id)) return f;
      if (LEGACY_ID_MAP[f.id]) return { ...f, id: LEGACY_ID_MAP[f.id] };
      return { ...f, id: crypto.randomUUID() };
    });

    // Save locally
    storageService.setLocalFields(validatedFields);

    // Sync queue for fields
    storageService.addToSyncQueue({
      type: 'UPDATE',
      table: 'field_definitions',
      payload: { fields: validatedFields, userId },
      timestamp: new Date().toISOString()
    });

    storageService.syncPendingChanges().catch(console.error);
    return true;
  },

  isFieldInUse: async (fieldId: string): Promise<boolean> => {
    const reports = storageService.getLocalReports();
    return reports.some(r => {
      const val = r.data[fieldId];
      return val !== undefined && val !== null && val !== '';
    });
  },

  // --- Sync Engine ---

  getSyncQueue: (): SyncItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addToSyncQueue: (item: SyncItem) => {
    const queue = storageService.getSyncQueue();
    queue.push(item);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  },

  syncPendingChanges: async () => {
    const queue = storageService.getSyncQueue();
    if (queue.length === 0) return;

    // Process items one by one
    // Only process if we actually have internet
    if (!navigator.onLine) return;

    const remainingItems = [...queue];

    for (const item of queue) {
      try {
        let success = false;

        // Skip syncing if the payload contains an ID that isn't a valid UUID (if applicable)
        if (item.table === 'reports' && item.payload.id && !isUUID(item.payload.id)) {
          console.warn("Skipping sync for non-UUID report ID:", item.payload.id);
          remainingItems.shift();
          localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(remainingItems));
          continue;
        }

        if (item.table === 'field_definitions') {
          // Additional safety check for fields
          const { userId, fields: fieldsToSync } = item.payload;
          const validatedFields = fieldsToSync.map((f: any) => {
            if (isUUID(f.id)) return f;
            if (LEGACY_ID_MAP[f.id]) return { ...f, id: LEGACY_ID_MAP[f.id] };
            return { ...f, id: crypto.randomUUID() };
          });

          item.payload.fields = validatedFields;
        }

        if (item.table === 'reports') {
          if (item.type === 'INSERT') {
            const { error } = await supabase.from('reports').upsert(item.payload);
            success = !error;
          } else if (item.type === 'UPDATE') {
            const { error } = await supabase.from('reports').update(item.payload).eq('id', item.payload.id);
            success = !error;
          } else if (item.type === 'DELETE') {
            const { error } = await supabase.from('reports').delete().eq('id', item.payload.id);
            success = !error;
          }
        } else if (item.table === 'field_definitions') {
          // Fields are special: clear and re-insert for user
          const { userId, fields } = item.payload;
          const { error: delError } = await supabase.from('field_definitions').delete().eq('user_id', userId);
          if (!delError) {
            const toInsert = fields.map((f: any) => ({
              id: f.id,
              user_id: userId,
              label: f.label,
              type: f.type,
              is_active: f.isActive,
              order: f.order
            }));
            const { error: insError } = await supabase.from('field_definitions').insert(toInsert);
            success = !insError;
          }
        }

        if (success) {
          remainingItems.shift(); // Remove handled item
          localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(remainingItems));
        } else {
          // If a call fails, we stop processing the rest of the queue to maintain order
          break;
        }
      } catch (e) {
        console.error("Sync error for item:", item, e);
        break;
      }
    }
  },

  // --- Local Storage Helpers ---

  getLocalReports: (): Report[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (!data) return [];
      const reports: Report[] = JSON.parse(data);
      // Migrate report data keys if they are legacy
      return reports.map(migrateReportData);
    } catch (e) {
      return [];
    }
  },

  setLocalReports: (reports: Report[]) => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  },

  getLocalFields: (): FieldDefinition[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FIELDS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  setLocalFields: (fields: FieldDefinition[]) => {
    localStorage.setItem(STORAGE_KEYS.FIELDS, JSON.stringify(fields));
  },

  clearLocalData: () => {
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.FIELDS);
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  },

  migrateToSupabase: async (userId: string): Promise<{ reports: number; fields: number }> => {
    // This is the legacy migration tool, we can keep it for manual triggers
    // but the new sync queue handles things automatically now.
    const localReports = storageService.getLocalReports();
    const localFields = storageService.getLocalFields();

    let reportsMigrated = 0;
    let fieldsMigrated = 0;

    if (localFields.length > 0) {
      const { error: delError } = await supabase.from('field_definitions').delete().eq('user_id', userId);
      if (!delError) {
        const toInsert = localFields.map(f => ({
          id: f.id,
          user_id: userId,
          label: f.label,
          type: f.type,
          is_active: f.isActive,
          order: f.order
        }));
        const { error: insError } = await supabase.from('field_definitions').insert(toInsert);
        if (!insError) fieldsMigrated = localFields.length;
      }
    }

    for (const report of localReports) {
      const { error } = await supabase.from('reports').upsert({
        id: report.id,
        user_id: userId,
        location: report.location,
        notes: report.notes,
        timestamp: report.timestamp,
        data: { ...report.data, _updatedAt: report.updatedAt || report.timestamp }
      });
      if (!error) reportsMigrated++;
    }

    if (reportsMigrated > 0 || fieldsMigrated > 0) {
      storageService.clearLocalData();
    }

    return { reports: reportsMigrated, fields: fieldsMigrated };
  }
};
