import { MmmsStoredFile } from './mmms-file.models';
export interface MaintenanceExpense {
  id: string;
  machineId: string;
  machine?: string;
  category: string;
  amount: number;
  currency: string;
  description: string;
  occurredAt: string;
  status: string;
  workOrderId?: string;
  breakdownId?: string;
  vendorId?: string;
  invoiceReference?: string;
  attachments: MmmsStoredFile[];
}
export interface CalibrationRecord {
  id: string;
  machineId: string;
  machine: string;
  type: string;
  dueAt: string;
  agency: string;
  responsiblePerson: string;
  remarks: string;
  status: string;
  result?: string;
  certificateNumber?: string;
  calibratedAt?: string;
  attachments: MmmsStoredFile[];
}
export interface MaintenanceNotification {
  id: string;
  title: string;
  event: string;
  createdAt: string;
  read: boolean;
  machineId?: string;
  referenceId?: string;
  workOrderId?: string;
  delivery?: Record<string, { status: string; attempts: number }>;
}
export interface MaintenanceReport {
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  availableColumns?: string[];
  title: string;
  generatedAt: string;
  from: string;
  to: string;
  rows: Record<string, unknown>[];
  kpis: Record<string, unknown>;
}
export interface ReportFilter {
  from: string;
  to: string;
  machineId: string;
  department: string;
  floor: string;
  category: string;
}
