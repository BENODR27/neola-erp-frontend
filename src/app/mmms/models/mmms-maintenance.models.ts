import { MmmsStoredFile } from './mmms-file.models';
export interface MaintenanceScope {
  organizationId: string;
  factoryId: string;
}
export interface InventoryPart extends MaintenanceScope {
  id: string;
  name: string;
  category: string;
  stockQuantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  unitCost: number;
  supplier: string;
  details: {
    partCode?: string;
    storageLocation?: string;
    unit?: string;
    compatibleModels?: string[];
    description?: string;
    manufacturer?: string;
    brand?: string;
    minimumStock?: number;
    maximumStock?: number;
    imageUrl?: string;
    currency?: string;
  };
}
export interface StockTransaction {
  id: string;
  partId: string;
  type: string;
  quantity: number;
  workOrderId?: string;
  unitCost: number;
  totalCost: number;
  stockAfter: number;
  reservedAfter: number;
  reason: string;
  createdAt: string;
}
export interface StockTransactionDraft {
  requestId: string;
  type: string;
  quantity: number;
  reason: string;
  workOrderId?: string;
  reservationId?: string;
  sourceTransactionId?: string;
  destinationPartId?: string;
  direction?: string;
}
export interface MaintenancePlanRecord extends MaintenanceScope {
  id: string;
  machineId: string;
  machine?: { name: string };
  task: string;
  frequency: string;
  nextDue: string;
  ownerName: string;
  details: {
    active?: boolean;
    interval?: number;
    nextMeter?: number;
    checklist?: string[];
    priority?: string;
    instructions?: string;
    estimatedDuration?: number;
    supervisor?: string;
    category?: string;
    mechanicId?: string;
    department?: string;
  };
}
export interface MaintenanceOccurrence {
  id: string;
  planId: string;
  machineId: string;
  workOrderId: string;
  scheduledAt: string;
  completedAt?: string;
  status: string;
}
export interface InspectionRecord extends MaintenanceScope {
  id: string;
  code: string;
  machineId: string;
  machine: string;
  type: string;
  inspector: string;
  dueAt: string;
  checklist: string[];
  results: Record<string, string>;
  observations: string;
  status: string;
  workOrderId?: string;
  result?: string;
  attachments?: MmmsStoredFile[];
  completedAt?: string;
}
