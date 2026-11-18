import { MmmsStoredFile } from './mmms-file.models';
export interface MachineRecord {
  id: string;
  name: string;
  machineCode: string;
  assetNumber: string;
  category: string;
  organizationId: string;
  factoryId: string;
  factory: string;
  department: string;
  floor: string;
  currentLocation: string;
  productionLine: string;
  status: string;
  lifecycleStatus: string;
  qrReference: string;
  documents: MmmsStoredFile[];
  operatingHours: number;
  productionQuantity: number;
  [key: string]: unknown;
}
