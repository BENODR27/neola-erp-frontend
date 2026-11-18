export interface CustomFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date';
  required?: boolean;
}
export interface MaintenanceSettings {
  machineCategories: string[];
  breakdownCategories: string[];
  workOrderTypes: string[];
  maintenanceCategories: string[];
  inspectionTypes: string[];
  sparePartCategories: string[];
  unitsOfMeasurement: string[];
  mechanicSpecializations: string[];
  documentCategories: string[];
  inspectionChecklists: { name: string; items: string[] }[];
  maintenanceFrequencies: { name: string; unit: string; interval: number }[];
  customFields: Record<string, CustomFieldDefinition[]>;
  statusLabels: Record<string, string>;
  notificationRules: Record<string, { enabled?: boolean; channels?: string[] }>;
  laborRatePerHour: number;
  [key: string]: unknown;
}
