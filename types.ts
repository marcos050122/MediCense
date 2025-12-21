export interface FieldDefinition {
  id: string;
  label: string;
  type: 'number' | 'text' | 'boolean';
  isActive: boolean;
  order: number;
}

export interface ReportData {
  [key: string]: string | number | boolean;
}

export interface Report {
  id: string;
  location: string;
  timestamp: string; // ISO string
  notes: string;
  data: ReportData;
  userId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
}
