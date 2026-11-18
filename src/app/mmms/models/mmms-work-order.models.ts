import { MmmsStoredFile } from './mmms-file.models';
export interface WorkOrderDetails {
  customFields?: Record<string, string | number>;
  type?: string;
  planId?: string;
  breakdownId?: string;
  instructions?: string;
  estimatedDuration?: number;
  team?: string[];
  checklist?: string[];
  checklistResults?: Record<string, string>;
  attachments?: MmmsStoredFile[];
  requiredParts?: string[];
  safetyChecks?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
}
export interface WorkOrderRecord {
  id: string;
  machineId: string;
  machine?: { id: string; name: string };
  issue: string;
  description?: string;
  technicianId?: string;
  technicianName?: string;
  status: string;
  priority: string;
  dueAt?: string;
  diagnosis?: string;
  repairNotes?: string;
  completionNotes?: string;
  verificationNotes?: string;
  rejectionReason?: string;
  laborMinutes?: number;
  partsCost?: number;
  contractorCost?: number;
  details: WorkOrderDetails;
}
export const WORK_ORDER_TRANSITIONS: Readonly<Record<string, string[]>> = {
  Draft: ['Submitted', 'Cancelled'],
  Submitted: ['Approved', 'Cancelled'],
  Approved: ['Assigned', 'Cancelled'],
  Open: ['Assigned', 'Cancelled'],
  Assigned: ['In Progress', 'Approved', 'Cancelled'],
  'In Progress': ['On Hold', 'Pending Spare Parts', 'Completed'],
  'On Hold': ['In Progress', 'Cancelled'],
  'Pending Spare Parts': ['In Progress', 'Cancelled'],
  'Waiting Parts': ['In Progress', 'Cancelled'],
  Completed: ['Verified', 'In Progress'],
  'Repair Completed': ['Verification', 'In Progress'],
  Verification: ['Verified', 'In Progress'],
  Verified: ['Closed', 'In Progress'],
};
