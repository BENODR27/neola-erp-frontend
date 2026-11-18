import { MmmsStoredFile } from './mmms-file.models';
export interface BreakdownRecord {
  id: string;
  machineId: string;
  machine?: { name: string };
  category: string;
  startedAt: string;
  endedAt?: string;
  rootCause?: string;
  resolutionActions?: string;
  status: string;
  details: {
    description?: string;
    severity?: string;
    productionImpact?: string;
    workOrderId?: string;
    attachments?: MmmsStoredFile[];
    reportedBy?: string;
  };
  requestId?: string;
}
