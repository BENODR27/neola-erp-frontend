import { MmmsStoredFile } from './mmms-file.models';
export interface SharedVendor {
  id: string;
  code: string;
  name: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  status: string;
  notes: string;
}
export interface VendorProfile {
  vendorId: string;
  vendor: string;
  address: string;
  specializations: string;
  productsSupplied: string;
  contractDetails: string;
  warrantyDetails: string;
  attachments: MmmsStoredFile[];
}
export interface VendorService {
  id: string;
  vendorId: string;
  vendor?: string;
  machineId: string;
  machine?: string;
  workOrderId?: string;
  type: string;
  description: string;
  amount: number;
  currency: string;
  plannedAt?: string;
  claimReference?: string;
  status: string;
  remarks?: string;
  rating?: number;
  invoiceReference?: string;
  attachments: MmmsStoredFile[];
  completedAt?: string;
}
