export interface MachineLocation {
  organizationId?: string;
  factoryId: string;
  factory?: string;
  department?: string;
  floorId?: string;
  locationId?: string;
  departmentId?: string;
  floor?: string;
  productionLine?: string;
  productionLineId?: string;
  currentLocation: string;
  responsiblePerson?: string;
}
export interface MovementEvent {
  from: string | null;
  to: string;
  actorId: string;
  occurredAt: string;
  reason: string;
}
export interface MachineMovement {
  id: string;
  code?: string;
  machineId: string;
  machine: string;
  machineCode: string;
  source: MachineLocation;
  destination: MachineLocation;
  status: string;
  reason: string;
  requestedAt: string;
  requestedBy: string;
  expectedDate?: string;
  allocationType: 'Temporary' | 'Permanent';
  events: MovementEvent[];
}
export interface MovementDraft {
  machineId: string;
  reason: string;
  expectedDate: string;
  allocationType: 'Temporary' | 'Permanent';
  destination: MachineLocation;
}
export const TRANSFER_TRANSITIONS: Readonly<Record<string, string[]>> = {
  Draft: ['Submitted', 'Cancelled'],
  Submitted: ['Pending Approval', 'Cancelled'],
  'Pending Approval': ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['In Transit', 'Cancelled'],
  'In Transit': ['Received'],
  Received: ['Completed'],
};
export const ALLOCATION_TRANSITIONS: Readonly<Record<string, string[]>> = {
  Draft: ['Pending Approval', 'Cancelled'],
  'Pending Approval': ['Approved', 'Rejected', 'Cancelled'],
  Approved: ['Released'],
};

export interface MovementUnit {
  id: string;
  name: string;
  factoryId: string;
  organizationId: string;
  unitType: string;
}
