import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { BreakdownSummary, CostSummary, MachineHistorySummary, MachineSummary, MobileTaskSummary, PreventiveMaintenancePlan, ProductionImpactSummary, QrAccessSummary, SparePartSummary, TechnicianSummary, WorkOrderSummary } from '../../models/mmms.models';
import { MmmsFacadeService } from '../../services/mmms-facade.service';

type OperationsModule = 'machines' | 'technicians' | 'work-orders' | 'preventive-maintenance' | 'breakdowns' | 'spare-parts' | 'costs' | 'mobile' | 'qr-management' | 'reports' | 'production-integration';

@Component({
  selector: 'app-mmms-technicians',
  standalone: false,
  templateUrl: './mmms-technicians.component.html',
  styleUrls: ['./mmms-technicians.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsTechniciansComponent implements OnInit {
  readonly pageCode = 'MMMS-TECHNICIANS';
  readonly apiResource = 'technicians';
  readonly moduleCode: OperationsModule = 'technicians';
  readonly module = signal<OperationsModule>('machines');
  readonly machines = signal<MachineSummary[]>([]);
  readonly selectedMachine = signal<MachineSummary | null>(null);
  readonly machineHistory = signal<MachineHistorySummary[]>([]);
  readonly historyLoading = signal(false);
  readonly machineOptions = signal<MachineSummary[]>([]);
  readonly technicianOptions = signal<TechnicianSummary[]>([]);
  readonly technicians = signal<TechnicianSummary[]>([]);
  readonly workOrders = signal<WorkOrderSummary[]>([]);
  readonly preventiveMaintenance = signal<PreventiveMaintenancePlan[]>([]);
  readonly breakdowns = signal<BreakdownSummary[]>([]);
  readonly spareParts = signal<SparePartSummary[]>([]);
  readonly costs = signal<CostSummary[]>([]);
  readonly mobileTasks = signal<MobileTaskSummary[]>([]);
  readonly qrAccess = signal<QrAccessSummary[]>([]);
  readonly productionImpact = signal<ProductionImpactSummary[]>([]);
  readonly reportSummary = signal<{ generatedAt: string; metrics: { machineCount: number; workOrderCount: number; breakdownCount: number; sparePartCount: number } } | null>(null);
  readonly search = signal('');
  readonly isLoading = signal(true);
  readonly editorOpen = signal(false);
  readonly editorError = signal('');
  private editingStatus = '';
  readonly editingId = signal<string | null>(null);
  draftData: Record<string, string | number> = {};
  draftJson = '{}';

  protected readonly facade = inject(MmmsFacadeService);


  ngOnInit(): void {
    this.module.set(this.moduleCode);
    this.loadReferences();
    this.load();
  }

  private loadReferences(): void {
    this.facade.getMachines().subscribe({ next: (result) => this.machineOptions.set(result) });
    this.facade.getTechnicians().subscribe({ next: (result) => this.technicianOptions.set(result) });
  }

  load(): void {
    this.isLoading.set(true);
    if (this.module() === 'machines') {
      this.facade.getMachines(this.search()).pipe(finalize(() => this.isLoading.set(false))).subscribe((result: MachineSummary[]) => this.machines.set(result));
      return;
    }
    if (this.module() === 'technicians') {
      this.facade.getTechnicians(this.search()).pipe(finalize(() => this.isLoading.set(false))).subscribe((result) => this.technicians.set(result));
      return;
    }
    if (this.module() === 'work-orders') {
      this.facade.getWorkOrders().pipe(finalize(() => this.isLoading.set(false))).subscribe((result: WorkOrderSummary[]) => this.workOrders.set(result));
      return;
    }
    if (this.module() === 'preventive-maintenance') {
      this.facade.getPreventiveMaintenance().pipe(finalize(() => this.isLoading.set(false))).subscribe((result) => this.preventiveMaintenance.set(result));
      return;
    }
    if (this.module() === 'breakdowns') {
      this.facade.getBreakdowns().pipe(finalize(() => this.isLoading.set(false))).subscribe((result) => this.breakdowns.set(result));
      return;
    }
    if (this.module() === 'spare-parts') {
      this.facade.getSpareParts().pipe(finalize(() => this.isLoading.set(false))).subscribe((result) => this.spareParts.set(result));
      return;
    }
    if (this.module() === 'costs') {
      this.facade.getCosts().pipe(finalize(() => this.isLoading.set(false))).subscribe((result) => this.costs.set(result));
      return;
    }
    if (this.module() === 'mobile') {
      this.facade.getMobileTasks().pipe(finalize(() => this.isLoading.set(false))).subscribe((result) => this.mobileTasks.set(result));
      return;
    }
    if (this.module() === 'qr-management') {
      this.facade.getQrAccess().pipe(finalize(() => this.isLoading.set(false))).subscribe((result) => this.qrAccess.set(result));
      return;
    }
    if (this.module() === 'production-integration') {
      this.facade.getProductionImpact().pipe(finalize(() => this.isLoading.set(false))).subscribe((result) => this.productionImpact.set(result));
      return;
    }
    if (this.module() === 'reports') {
      this.facade.getReportSummary().pipe(finalize(() => this.isLoading.set(false))).subscribe((result) => this.reportSummary.set(result));
      return;
    }
    this.isLoading.set(false);
  }

  updateSearch(value: string): void {
    this.search.set(value);
    this.load();
  }

  statusClass(value: string): string { return value.toLowerCase().replaceAll(' ', '-'); }
  openEditor(item?: unknown): void {
    this.editingId.set(item ? this.recordId(item) : null);
    this.draftData = item ? { ...(item as Record<string, string | number>) } : this.defaultsForModule();
    this.editingStatus = String(this.draftData['status'] ?? 'Open');
    this.draftJson = JSON.stringify(this.draftData, null, 2);
    this.editorOpen.set(true);
  }
  closeEditor(): void { this.editorOpen.set(false); this.editingId.set(null); }
  closeMachineHistory(): void { this.selectedMachine.set(null); this.machineHistory.set([]); }
  viewMachineHistory(machine: MachineSummary): void {
    this.selectedMachine.set(machine);
    this.historyLoading.set(true);
    this.facade.getMachineHistory(machine.id).pipe(finalize(() => this.historyLoading.set(false))).subscribe({ next: (history) => this.machineHistory.set(history), error: () => this.machineHistory.set([]) });
  }
  saveEditor(): void {
    const draft = this.draftData;
    const id = String(draft['id'] || `${this.module().toUpperCase()}-${Date.now().toString().slice(-4)}`);
    this.editorError.set('');
    const request = this.module() === 'work-orders' && this.editingId() && String(draft['status']) !== this.editingStatus ? this.facade.transitionWorkOrder(this.editingId() as string, { ...draft, id }) : this.facade.saveRecord(this.module(), this.editingId(), { ...draft, id });
    request.subscribe({ next: () => { this.closeEditor(); this.load(); }, error: (error: { error?: { error?: { message?: string } } }) => this.editorError.set(error.error?.error?.message ?? 'Could not save this record. Check the backend connection and try again.') });
    if (this.module() === 'machines') this.machines.update((rows) => this.upsert(rows, { ...draft, id, uptime: Number(draft['uptime'] || 0) } as MachineSummary));
    if (this.module() === 'technicians') this.technicians.update((rows) => this.upsert(rows, { ...draft, id, employeeNumber: String(draft['employeeNumber'] || ''), skills: String(draft['skills'] || '').split(',').map((skill) => skill.trim()).filter(Boolean), active: String(draft['active']) === 'true', workload: Number(draft['workload'] || 0) } as TechnicianSummary));
    if (this.module() === 'work-orders') this.workOrders.update((rows) => this.upsert(rows, { ...draft, id } as WorkOrderSummary));
    if (this.module() === 'preventive-maintenance') this.preventiveMaintenance.update((rows) => this.upsert(rows, { ...draft, id, compliance: Number(draft['compliance'] || 0) } as PreventiveMaintenancePlan));
    if (this.module() === 'breakdowns') this.breakdowns.update((rows) => this.upsert(rows, { ...draft, id } as BreakdownSummary));
    if (this.module() === 'spare-parts') this.spareParts.update((rows) => this.upsert(rows, { ...draft, id, stock: Number(draft['stock'] || 0), reorderLevel: Number(draft['reorderLevel'] || 0) } as SparePartSummary));
    if (this.module() === 'costs') this.costs.update((rows) => this.upsert(rows, { ...draft, machine: String(draft['machine']), trend: draft['trend'] === 'up' ? 'up' : 'down' } as CostSummary));
    if (this.module() === 'mobile') this.mobileTasks.update((rows) => this.upsert(rows, { ...draft, id } as MobileTaskSummary));
    if (this.module() === 'qr-management') this.qrAccess.update((rows) => this.upsert(rows, { ...draft, assetNumber: String(draft['assetNumber']) } as QrAccessSummary));
    if (this.module() === 'production-integration') this.productionImpact.update((rows) => this.upsert(rows, { ...draft, order: String(draft['order']), unitsAtRisk: Number(draft['unitsAtRisk'] || 0) } as ProductionImpactSummary));
  }
  deleteRecord(item: unknown): void {
    const id = this.recordId(item);
    this.facade.deleteRecord(this.module(), id).subscribe({ next: () => this.load(), error: () => this.editorError.set('Could not delete this record. Check the backend connection and try again.') });
    if (this.module() === 'machines') this.machines.update((rows) => rows.filter((row) => row.id !== id));
    if (this.module() === 'technicians') this.technicians.update((rows) => rows.filter((row) => row.id !== id));
    if (this.module() === 'work-orders') this.workOrders.update((rows) => rows.filter((row) => row.id !== id));
    if (this.module() === 'preventive-maintenance') this.preventiveMaintenance.update((rows) => rows.filter((row) => row.id !== id));
    if (this.module() === 'breakdowns') this.breakdowns.update((rows) => rows.filter((row) => row.id !== id));
    if (this.module() === 'spare-parts') this.spareParts.update((rows) => rows.filter((row) => row.id !== id));
    if (this.module() === 'costs') this.costs.update((rows) => rows.filter((row) => row.machine !== id));
    if (this.module() === 'mobile') this.mobileTasks.update((rows) => rows.filter((row) => row.id !== id));
    if (this.module() === 'qr-management') this.qrAccess.update((rows) => rows.filter((row) => row.assetNumber !== id));
    if (this.module() === 'production-integration') this.productionImpact.update((rows) => rows.filter((row) => row.order !== id));
  }
  editFirstRecord(): void {
    const first = this.module() === 'machines' ? this.machines()[0] : this.module() === 'technicians' ? this.technicians()[0] : this.module() === 'work-orders' ? this.workOrders()[0] : this.module() === 'preventive-maintenance' ? this.preventiveMaintenance()[0] : this.module() === 'breakdowns' ? this.breakdowns()[0] : this.module() === 'spare-parts' ? this.spareParts()[0] : this.module() === 'costs' ? this.costs()[0] : this.module() === 'mobile' ? this.mobileTasks()[0] : this.module() === 'qr-management' ? this.qrAccess()[0] : this.productionImpact()[0];
    if (first) this.openEditor(first);
  }
  private recordId(item: unknown): string { const row = item as { [key: string]: unknown }; return String(row['id'] ?? row['assetNumber'] ?? row['order'] ?? row['machine']); }
  private upsert<T>(rows: T[], value: T): T[] { const index = rows.findIndex((row) => this.recordId(row) === this.recordId(value)); if (index < 0) return [value, ...rows]; const copy = [...rows]; copy[index] = value; return copy; }
  private defaultsForModule(): Record<string, string | number> {
    const defaults: Record<OperationsModule, Record<string, string | number>> = {
      machines: { id: '', machineCode: '', assetNumber: '', name: '', description: '', category: 'Sewing', subcategory: '', manufacturer: '', brand: '', modelNumber: '', serialNumber: '', factoryLocation: '', line: 'Sewing Â· Line 01', installationDate: '', purchaseDate: '', purchaseCost: 0, warrantyStartDate: '', warrantyExpiryDate: '', criticality: 'Medium', lifecycleCondition: 'Operational', status: 'Running', uptime: 95, lastService: 'Just added' },
      technicians: { id: '', employeeNumber: '', name: '', skills: 'Mechanical', shift: 'Day', factory: 'Factory A', active: 'true', workload: 0, availability: 'Available', email: '', phone: '' },
      'work-orders': { id: '', machine: 'M-1042 Â· Juki DDL-9000C', issue: '', technician: '', technicianId: '', status: 'Open', priority: 'Medium', due: 'Tomorrow' },
      'preventive-maintenance': { id: '', machine: '', task: '', frequency: 'Monthly', nextDue: 'Tomorrow', compliance: 100, owner: '' },
      breakdowns: { id: '', machine: '', category: 'Mechanical', startedAt: 'Today', downtime: '0m', rootCause: '', status: 'Open' },
      'spare-parts': { id: '', name: '', category: 'Mechanical', stock: 0, reorderLevel: 5, supplier: '', unitCost: '$0.00' },
      costs: { machine: '', labor: '$0', spareParts: '$0', contractors: '$0', total: '$0', trend: 'down' },
      mobile: { id: '', machine: '', task: '', priority: 'Medium', assignee: 'Unassigned', sync: 'Synced' },
      'qr-management': { machine: '', assetNumber: '', lastScan: 'Never', openOrders: 0, breakdowns: 0, status: 'Idle' },
      reports: {},
      'production-integration': { order: '', line: '', machine: '', downtime: '0m', unitsAtRisk: 0, recovery: 'On track' },
    };
    return { ...defaults[this.module()] };
  }
  title(): string { return ({ machines: 'Machine register', technicians: 'Technician directory', 'work-orders': 'Work orders', 'preventive-maintenance': 'Preventive maintenance', breakdowns: 'Breakdown history', 'spare-parts': 'Spare parts', costs: 'Cost management', mobile: 'Mobile maintenance', 'qr-management': 'QR code management', reports: 'Maintenance reports', 'production-integration': 'Production integration' } as Record<OperationsModule, string>)[this.module()]; }
  description(): string { return ({ machines: 'Track the health and lifecycle of every production asset.', technicians: 'Manage mechanic skills, availability, shifts, and open repair workload.', 'work-orders': 'Coordinate maintenance issues from assignment through closure.', 'preventive-maintenance': 'Plan recurring service and monitor schedule compliance.', breakdowns: 'Review downtime events, root causes, and recovery progress.', 'spare-parts': 'Keep critical maintenance inventory ready for the next repair.', costs: 'Monitor labor, parts, contractors, and machine-level maintenance spend.', mobile: 'Give technicians a focused shop-floor work queue with sync visibility.', 'qr-management': 'Open machine context quickly through asset QR codes.', reports: 'Use operational snapshots to make maintenance decisions with confidence.', 'production-integration': 'Connect downtime events to lines, orders, and production impact.' } as Record<OperationsModule, string>)[this.module()]; }
  isLowStock(part: SparePartSummary): boolean { return part.stock <= part.reorderLevel; }
  moduleIcon(): string { return ({ machines: 'bi-cpu', technicians: 'bi-people', 'work-orders': 'bi-clipboard2-pulse', 'preventive-maintenance': 'bi-calendar2-week', breakdowns: 'bi-exclamation-triangle', 'spare-parts': 'bi-box-seam', costs: 'bi-cash-stack', mobile: 'bi-phone', 'qr-management': 'bi-qr-code-scan', reports: 'bi-bar-chart-line', 'production-integration': 'bi-diagram-3' } as Record<OperationsModule, string>)[this.module()]; }
  isEditableModule(): boolean { return ['machines', 'technicians', 'work-orders', 'preventive-maintenance', 'breakdowns', 'spare-parts'].includes(this.module()); }
  moduleStats(): Array<{ label: string; value: string; note: string; icon: string }> {
    const stats = {
      machines: [{ label: 'Tracked assets', value: String(this.machines().length), note: 'Across active lines', icon: 'bi-cpu' }, { label: 'Healthy uptime', value: '96.4%', note: 'Across the factory', icon: 'bi-activity' }, { label: 'Needs attention', value: '2', note: 'Maintenance or breakdown', icon: 'bi-exclamation-circle' }],
      technicians: [{ label: 'Active technicians', value: String(this.technicians().filter((item) => item.active).length), note: 'Available for assignment', icon: 'bi-person-check' }, { label: 'Open workload', value: String(this.technicians().reduce((total, item) => total + item.workload, 0)), note: 'Assigned work orders', icon: 'bi-clipboard2-pulse' }, { label: 'Unavailable', value: String(this.technicians().filter((item) => !item.active || item.availability === 'Unavailable').length), note: 'Excluded from assignment', icon: 'bi-person-x' }],
      'work-orders': [{ label: 'Open queue', value: String(this.workOrders().filter((item) => item.status !== 'Completed' && item.status !== 'Closed').length), note: 'Requires coordination', icon: 'bi-list-check' }, { label: 'Critical', value: String(this.workOrders().filter((item) => item.priority === 'Critical').length), note: 'Immediate response', icon: 'bi-lightning-charge' }, { label: 'Assigned', value: String(this.workOrders().filter((item) => item.technician !== 'Unassigned').length), note: 'With a technician', icon: 'bi-person-check' }],
      'preventive-maintenance': [{ label: 'Scheduled plans', value: String(this.preventiveMaintenance().length), note: 'Active maintenance plans', icon: 'bi-calendar-check' }, { label: 'Due today', value: '2', note: 'Priority tasks', icon: 'bi-alarm' }, { label: 'Compliance', value: '88%', note: 'Current period', icon: 'bi-shield-check' }],
      breakdowns: [{ label: 'Events logged', value: String(this.breakdowns().length), note: 'Recent downtime events', icon: 'bi-exclamation-triangle' }, { label: 'Investigating', value: String(this.breakdowns().filter((item) => item.status === 'Investigating').length), note: 'Active root-cause work', icon: 'bi-search' }, { label: 'Avg. downtime', value: '1h 35m', note: 'Per event', icon: 'bi-stopwatch' }],
      'spare-parts': [{ label: 'Stocked parts', value: String(this.spareParts().length), note: 'Maintenance catalogue', icon: 'bi-box-seam' }, { label: 'Reorder alerts', value: String(this.spareParts().filter((item) => this.isLowStock(item)).length), note: 'Below threshold', icon: 'bi-bell' }, { label: 'Stock accuracy', value: '98.2%', note: 'Last cycle count', icon: 'bi-check2-circle' }],
      costs: [{ label: 'Monthly spend', value: '$1,903', note: 'Across tracked assets', icon: 'bi-cash-stack' }, { label: 'Labor share', value: '74%', note: 'Of total spend', icon: 'bi-people' }, { label: 'Cost trend', value: '-12%', note: 'Versus last month', icon: 'bi-graph-down-arrow' }],
      mobile: [{ label: 'Technician tasks', value: String(this.mobileTasks().length), note: 'In todayâ€™s queue', icon: 'bi-phone' }, { label: 'Synced', value: String(this.mobileTasks().filter((item) => item.sync === 'Synced').length), note: 'Ready on device', icon: 'bi-cloud-check' }, { label: 'Pending sync', value: String(this.mobileTasks().filter((item) => item.sync === 'Pending sync').length), note: 'Offline updates', icon: 'bi-cloud-arrow-up' }],
      'qr-management': [{ label: 'QR assets', value: String(this.qrAccess().length), note: 'Ready to scan', icon: 'bi-qr-code' }, { label: 'Open orders', value: String(this.qrAccess().reduce((total, item) => total + item.openOrders, 0)), note: 'From scanned assets', icon: 'bi-clipboard2-pulse' }, { label: 'Breakdown links', value: String(this.qrAccess().reduce((total, item) => total + item.breakdowns, 0)), note: 'History available', icon: 'bi-link-45deg' }],
      reports: [{ label: 'Report packs', value: '3', note: 'Available in preview', icon: 'bi-bar-chart-line' }, { label: 'Data freshness', value: 'Today', note: 'Last refresh', icon: 'bi-clock-history' }, { label: 'Export formats', value: '2', note: 'PDF and Excel planned', icon: 'bi-download' }],
      'production-integration': [{ label: 'Orders watched', value: String(this.productionImpact().length), note: 'With maintenance exposure', icon: 'bi-diagram-3' }, { label: 'Units at risk', value: String(this.productionImpact().reduce((total, item) => total + item.unitsAtRisk, 0)), note: 'Current impact window', icon: 'bi-boxes' }, { label: 'At risk orders', value: String(this.productionImpact().filter((item) => item.recovery !== 'On track').length), note: 'Need recovery action', icon: 'bi-flag' }],
    } as Record<OperationsModule, Array<{ label: string; value: string; note: string; icon: string }>>;
    return stats[this.module()];
  }
  loadTechniciansPage(): void { this.module.set('technicians'); this.load(); }

  createTechnician(draft: Record<string, string | number>): void {
    this.facade.saveRecord('technicians', null, draft).subscribe({ next: () => this.loadTechniciansPage() });
  }

  updateTechnician(id: string, draft: Record<string, string | number>): void {
    this.facade.saveRecord('technicians', id, { ...draft, id }).subscribe({ next: () => this.loadTechniciansPage() });
  }

  deleteTechnician(id: string): void {
    this.facade.deleteRecord('technicians', id).subscribe({ next: () => this.loadTechniciansPage() });
  }
}
