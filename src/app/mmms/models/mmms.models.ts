export type MachineStatus = 'Running' | 'Idle' | 'Under Maintenance' | 'Breakdown' | 'Decommissioned' | 'Reserved' | 'Scrapped';
export type WorkOrderStatus = 'Open' | 'Assigned' | 'In Progress' | 'Waiting Parts' | 'Repair Completed' | 'Verification' | 'Completed' | 'Closed';

export interface MmmsKpi { label: string; value: string; change: string; trend: 'up' | 'down' | 'neutral'; icon: string; tone: 'blue' | 'teal' | 'amber' | 'violet'; }
export interface MachineSummary { id: string; machineCode?: string; assetNumber?: string; name: string; description?: string; category: string; subcategory?: string; manufacturer?: string; brand?: string; modelNumber?: string; serialNumber?: string; factoryLocation?: string; line: string; installationDate?: string; purchaseDate?: string; purchaseCost?: number; warrantyStartDate?: string; warrantyExpiryDate?: string; criticality?: string; lifecycleCondition?: string; qrReference?: string; status: MachineStatus; uptime: number; lastService: string; archivedAt?: string; }
export interface MachineHistorySummary { id: string; eventType: string; summary: string; details: Record<string, unknown>; actorId?: string; occurredAt: string; }
export type TechnicianAvailability = 'Available' | 'Busy' | 'Unavailable';
export interface TechnicianSummary { id: string; employeeNumber: string; name: string; skills: string[]; shift: string; factory: string; active: boolean; workload: number; availability: TechnicianAvailability; email?: string; phone?: string; }
export interface WorkOrderSummary { id: string; machine: string; technicianId?: string; issue: string; technician: string; status: WorkOrderStatus; priority: 'Critical' | 'High' | 'Medium' | 'Low'; due: string; diagnosis?: string; repairNotes?: string; completionNotes?: string; verificationNotes?: string; laborMinutes?: number; }
export interface PreventiveMaintenancePlan { id: string; machine: string; task: string; frequency: string; nextDue: string; compliance: number; owner: string; }
export type BreakdownStatus = 'Open' | 'Investigating' | 'Resolved';
export interface BreakdownSummary { id: string; machine: string; category: string; startedAt: string; downtime: string; rootCause: string; status: BreakdownStatus; }
export interface SparePartSummary { id: string; name: string; category: string; stock: number; reorderLevel: number; supplier: string; unitCost: string; }
export interface CostSummary { machine: string; labor: string; spareParts: string; contractors: string; total: string; trend: 'up' | 'down'; }
export interface MobileTaskSummary { id: string; machine: string; task: string; priority: WorkOrderSummary['priority']; assignee: string; sync: 'Synced' | 'Pending sync'; }
export interface QrAccessSummary { machine: string; assetNumber: string; lastScan: string; openOrders: number; breakdowns: number; status: MachineStatus; }
export interface ProductionImpactSummary { order: string; line: string; machine: string; downtime: string; unitsAtRisk: number; recovery: 'On track' | 'At risk' | 'Delayed'; }
export interface MmmsDashboardData { kpis: MmmsKpi[]; machines: MachineSummary[]; workOrders: WorkOrderSummary[]; downtimeByDay: { day: string; hours: number }[]; maintenanceMix: { label: string; value: number; color: string }[]; }
