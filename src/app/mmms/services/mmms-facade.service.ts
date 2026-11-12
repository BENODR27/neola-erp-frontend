import { Injectable, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import {
  BreakdownSummary,
  CostSummary,
  MachineHistorySummary,
  MachineStatus,
  MmmsDashboardData,
  MachineSummary,
  MobileTaskSummary,
  PreventiveMaintenancePlan,
  ProductionImpactSummary,
  QrAccessSummary,
  SparePartSummary,
  TechnicianSummary,
  WorkOrderStatus,
  WorkOrderSummary,
} from '../models/mmms.models';
import { ApiService } from '../../shared/services/api/api.service';
import { environment } from '../../shared/environments/environment';
import { MmmsContextService } from './mmms-context.service';

interface MachineApiRecord {
  id: string | number;
  machineCode?: string;
  assetNumber?: string;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  manufacturer?: string;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  factoryLocation?: string;
  productionLine?: string;
  installationDate?: string;
  purchaseDate?: string;
  purchaseCost?: number | string;
  warrantyStartDate?: string;
  warrantyExpiryDate?: string;
  criticality?: string;
  lifecycleCondition?: string;
  qrReference?: string;
  status: MachineStatus;
  uptimePercent?: number | string;
  updatedAt?: string;
  archivedAt?: string;
}
interface TechnicianApiRecord {
  id: string | number;
  employeeNumber: string;
  name: string;
  skillCategories?: string[];
  shift: string;
  factory: string;
  active: boolean;
  currentWorkload?: number;
  availability: TechnicianSummary['availability'];
  email?: string;
  phone?: string;
}
interface WorkOrderApiRecord {
  id: string | number;
  machineId?: string | number;
  machine?: { name?: string };
  technicianId?: string | number;
  technician?: { name?: string };
  issue: string;
  technicianName?: string;
  status: WorkOrderStatus;
  priority: WorkOrderSummary['priority'];
  dueAt?: string;
  diagnosis?: string;
  repairNotes?: string;
  completionNotes?: string;
  verificationNotes?: string;
  laborMinutes?: number;
}
export interface MmmsMasterRecord {
  id: string;
  module: string;
  name: string;
  code?: string;
  status: string;
  [key: string]: unknown;
}

/** Typed workspace boundary. Replace the demo observable with HttpClient calls when the MMMS API is ready. */
@Injectable({ providedIn: 'root' })
export class MmmsFacadeService {
  readonly selectedPeriod = signal<'7d' | '30d' | '90d'>('30d');

  constructor(private readonly api: ApiService, private readonly context: MmmsContextService) {}

  private scopedUrl(url: string, includeFactory = true, includeOrganization = true): string {
    if (!url.startsWith(environment.MMMS_API_URL)) return url;
    const query = this.context.contextQuery();
    if (!query) return url;
    const params = new URLSearchParams(query.slice(1));
    if (!includeFactory) params.delete('factoryId');
    if (!includeOrganization) params.delete('organizationId');
    const scopedQuery = params.toString();
    return scopedQuery ? `${url}${url.includes('?') ? '&' : '?'}${scopedQuery}` : url;
  }

  getMasterRecords(module: string): Observable<MmmsMasterRecord[]> {
    if (module === 'machines') return this.getMachines() as unknown as Observable<MmmsMasterRecord[]>;
    if (module === 'technicians') return this.getTechnicians() as unknown as Observable<MmmsMasterRecord[]>;
    const baseUrl = module === 'vendors'
      ? `${environment.authv2ApiUrl}/api/auth/vendors`
      : `${environment.MMMS_API_URL}/master-data/${encodeURIComponent(module)}`;
    return this.api
      .getDatas(this.scopedUrl(baseUrl))
      .pipe(
        map((response) =>
          Array.isArray(response?.result) ? (response.result as MmmsMasterRecord[]) : [],
        ),
      );
  }

  saveMasterRecord(
    module: string,
    id: string | null,
    draft: Record<string, string | number>,
  ): Observable<unknown> {
    const url = module === 'vendors'
      ? `${environment.authv2ApiUrl}/api/auth/vendors`
      : `${environment.MMMS_API_URL}/master-data/${encodeURIComponent(module)}`;
    const payload = this.applyContext(module, draft);
    return id
      ? this.api.putAtUrl(this.scopedUrl(`${url}/${encodeURIComponent(id)}`), payload)
      : this.api.addData(
        payload,
        module === 'organization'
          ? this.scopedUrl(url, false, false)
          : this.scopedUrl(url, module !== 'factories'),
      );
  }

  deleteMasterRecord(module: string, id: string): Observable<unknown> {
    return this.api.deleteAtUrl(
      this.scopedUrl(`${module === 'vendors' ? `${environment.authv2ApiUrl}/api/auth/vendors` : `${environment.MMMS_API_URL}/master-data/${encodeURIComponent(module)}`}/${encodeURIComponent(id)}`),
    );
  }

  saveRecord(
    module: string,
    id: string | null,
    draft: Record<string, string | number>,
  ): Observable<unknown> {
    const resource = (
      {
        machines: 'machines',
        technicians: 'technicians',
        'work-orders': 'work-orders',
        'preventive-maintenance': 'preventive-maintenance',
        breakdowns: 'breakdowns',
        'spare-parts': 'spare-parts',
        costs: 'costs',
        mobile: 'mobile',
        'qr-management': 'qr-management',
        'production-integration': 'production-integration',
      } as Record<string, string>
    )[module];
    const payload = this.applyContext(module, this.toApiPayload(module, draft));
    const url = `${environment.MMMS_API_URL}/${resource}`;
    return id
      ? this.api.putAtUrl(this.scopedUrl(`${url}/${encodeURIComponent(id)}`), payload)
      : this.api.addData(payload, this.scopedUrl(url));
  }

  deleteRecord(module: string, id: string): Observable<unknown> {
    const resource = (
      {
        machines: 'machines',
        technicians: 'technicians',
        'work-orders': 'work-orders',
        'preventive-maintenance': 'preventive-maintenance',
        breakdowns: 'breakdowns',
        'spare-parts': 'spare-parts',
        costs: 'costs',
        mobile: 'mobile',
        'qr-management': 'qr-management',
        'production-integration': 'production-integration',
      } as Record<string, string>
    )[module];
    return this.api.deleteAtUrl(
      this.scopedUrl(`${environment.MMMS_API_URL}/${resource}/${encodeURIComponent(id)}`),
    );
  }

  transitionWorkOrder(id: string, draft: Record<string, string | number>): Observable<unknown> {
    return this.api.patchDataAtUrl(
      this.scopedUrl(`${environment.MMMS_API_URL}/work-orders/${encodeURIComponent(id)}/workflow`),
      this.toApiPayload('work-orders', draft),
    );
  }

  private toApiPayload(
    module: string,
    draft: Record<string, string | number>,
  ): Record<string, unknown> {
    const machineId = String(draft['machine'] ?? '').split(' · ')[0];
    if (module === 'machines')
      return {
        id: String(draft['id'] || `M-${Date.now()}`),
        machineCode: String(draft['machineCode'] || draft['id'] || `M-${Date.now()}`),
        assetNumber: String(draft['assetNumber'] || draft['id'] || `AST-${Date.now()}`),
        name: String(draft['name'] ?? ''),
        description: String(draft['description'] ?? ''),
        category: String(draft['category'] ?? ''),
        subcategory: String(draft['subcategory'] ?? ''),
        manufacturer: String(draft['manufacturer'] ?? ''),
        brand: String(draft['brand'] ?? ''),
        modelNumber: String(draft['modelNumber'] ?? ''),
        serialNumber: String(draft['serialNumber'] ?? ''),
        factoryLocation: String(draft['factoryLocation'] ?? ''),
        organizationId: String(draft['organizationId'] ?? '') || null,
        factoryId: String(draft['factoryLocationId'] ?? draft['factoryId'] ?? '') || null,
        categoryId: String(draft['categoryId'] ?? '') || null,
        productionLineId: String(draft['lineId'] ?? '') || null,
        productionLine: String(draft['line'] ?? ''),
        installationDate: String(draft['installationDate'] ?? '') || null,
        purchaseDate: String(draft['purchaseDate'] ?? '') || null,
        purchaseCost: Number(draft['purchaseCost'] ?? 0) || null,
        warrantyStartDate: String(draft['warrantyStartDate'] ?? '') || null,
        warrantyExpiryDate: String(draft['warrantyExpiryDate'] ?? '') || null,
        criticality: String(draft['criticality'] ?? 'Medium'),
        lifecycleCondition: String(draft['lifecycleCondition'] ?? 'Operational'),
        status: String(draft['status'] ?? 'Idle').replace('Maintenance', 'Under Maintenance'),
        uptimePercent: Number(draft['uptime'] ?? 0),
      };
    if (module === 'technicians')
      return {
        id: String(draft['id'] || `TECH-${Date.now()}`),
        employeeNumber: String(draft['employeeNumber'] ?? ''),
        name: String(draft['name'] ?? ''),
        skillCategories: String(draft['skills'] ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        shift: String(draft['shift'] ?? 'Day'),
        factory: String(draft['factory'] ?? 'Factory A'),
        factoryId: String(draft['factoryId'] ?? '') || null,
        organizationId: String(draft['organizationId'] ?? '') || null,
        active: String(draft['active'] ?? 'true') === 'true',
        currentWorkload: Number(draft['workload'] ?? 0),
        availability: String(draft['availability'] ?? 'Available'),
        email: String(draft['email'] ?? ''),
        phone: String(draft['phone'] ?? ''),
      };
    if (module === 'work-orders')
      return {
        id: String(draft['id'] || `WO-${Date.now()}`),
        machineId,
        technicianId: String(draft['technicianId'] ?? '') || null,
        technicianName: String(draft['technician'] ?? ''),
        organizationId: String(draft['organizationId'] ?? '') || null,
        factoryId: String(draft['factoryId'] ?? '') || null,
        issue: String(draft['issue'] ?? ''),
        priority: String(draft['priority'] ?? 'Medium'),
        status: String(draft['status'] ?? 'Open'),
        dueAt: this.normaliseDate(draft['due'], 1),
        diagnosis: String(draft['diagnosis'] ?? ''),
        repairNotes: String(draft['repairNotes'] ?? ''),
        completionNotes: String(draft['completionNotes'] ?? ''),
        verificationNotes: String(draft['verificationNotes'] ?? ''),
        laborMinutes: Number(draft['laborMinutes'] ?? 0),
      };
    if (module === 'preventive-maintenance')
      return {
        id: String(draft['id'] || `PM-${Date.now()}`),
        machineId,
        task: String(draft['task'] ?? ''),
        frequency: String(draft['frequency'] ?? 'Monthly'),
        nextDue: this.normaliseDate(draft['nextDue'], 1),
        compliancePercent: Number(draft['compliance'] ?? 0),
        ownerName: String(draft['owner'] ?? ''),
        organizationId: String(draft['organizationId'] ?? '') || null,
        factoryId: String(draft['factoryId'] ?? '') || null,
      };
    if (module === 'breakdowns')
      return {
        id: String(draft['id'] || `BD-${Date.now()}`),
        machineId,
        category: String(draft['category'] ?? 'Mechanical'),
        startedAt: this.normaliseDate(draft['startedAt'], 0),
        rootCause: String(draft['rootCause'] ?? ''),
        status: String(draft['status'] ?? 'Open'),
        organizationId: String(draft['organizationId'] ?? '') || null,
        factoryId: String(draft['factoryId'] ?? '') || null,
      };
    if (module === 'spare-parts')
      return {
        id: String(draft['id'] || `SP-${Date.now()}`),
        name: String(draft['name'] ?? ''),
        category: String(draft['category'] ?? 'General'),
        stockQuantity: Number(draft['stock'] ?? 0),
        reorderLevel: Number(draft['reorderLevel'] ?? 0),
        supplier: String(draft['supplier'] ?? ''),
        unitCost: Number(String(draft['unitCost'] ?? '0').replace('$', '')),
        organizationId: String(draft['organizationId'] ?? '') || null,
        factoryId: String(draft['factoryId'] ?? '') || null,
      };
    return { ...draft };
  }

  private applyContext(module: string, payload: Record<string, unknown>): Record<string, unknown> {
    const current = this.context.context();
    const scoped = { ...payload };
    if (module !== 'organization' && !scoped['organizationId'] && current.organizationId) scoped['organizationId'] = current.organizationId;
    if (module !== 'organization' && module !== 'factories' && !scoped['factoryId'] && current.factoryId) scoped['factoryId'] = current.factoryId;
    if (module === 'factories' && !scoped['organizationId'] && current.organizationId) scoped['organizationId'] = current.organizationId;
    return scoped;
  }

  private normaliseDate(value: string | number | undefined, daysFromNow: number): string {
    const parsed = value ? new Date(String(value)) : new Date(Number.NaN);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    return new Date(Date.now() + daysFromNow * 86400000).toISOString();
  }

  getMachines(search = ''): Observable<MachineSummary[]> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/machines${query}`)).pipe(
      map((response) =>
        (Array.isArray(response?.result) ? (response.result as MachineApiRecord[]) : []).map(
          (machine) => ({
            id: String(machine.id),
            machineCode: machine.machineCode,
            assetNumber: machine.assetNumber,
            name: String(machine.name),
            description: machine.description,
            subcategory: machine.subcategory,
            manufacturer: machine.manufacturer,
            brand: machine.brand,
            modelNumber: machine.modelNumber,
            serialNumber: machine.serialNumber,
            factoryLocation: machine.factoryLocation,
            installationDate: machine.installationDate,
            purchaseDate: machine.purchaseDate,
            purchaseCost: Number(machine.purchaseCost ?? 0),
            warrantyStartDate: machine.warrantyStartDate,
            warrantyExpiryDate: machine.warrantyExpiryDate,
            criticality: machine.criticality,
            lifecycleCondition: machine.lifecycleCondition,
            qrReference: machine.qrReference,
            archivedAt: machine.archivedAt,
            category: String(machine.category ?? ''),
            line: String(machine.productionLine ?? ''),
            status: machine.status,
            uptime: Number(machine.uptimePercent ?? 0),
            lastService: machine.updatedAt
              ? new Date(machine.updatedAt).toLocaleString()
              : 'Not recorded',
          }),
        ),
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getMachineHistory(machineId: string): Observable<MachineHistorySummary[]> {
    return this.api
      .getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/machines/${encodeURIComponent(machineId)}/history`))
      .pipe(
        map((response) =>
          Array.isArray(response?.result) ? (response.result as MachineHistorySummary[]) : [],
        ),
      );
  }

  getTechnicians(search = ''): Observable<TechnicianSummary[]> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/technicians${query}`)).pipe(
      map((response) =>
        (Array.isArray(response?.result) ? (response.result as TechnicianApiRecord[]) : []).map(
          (technician) => ({
            id: String(technician.id),
            employeeNumber: technician.employeeNumber,
            name: technician.name,
            skills: technician.skillCategories ?? [],
            shift: technician.shift,
            factory: technician.factory,
            active: technician.active,
            workload: Number(technician.currentWorkload ?? 0),
            availability: technician.availability,
            email: technician.email,
            phone: technician.phone,
          }),
        ),
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getWorkOrders(): Observable<WorkOrderSummary[]> {
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/work-orders`)).pipe(
      map((response) =>
        (Array.isArray(response?.result) ? (response.result as WorkOrderApiRecord[]) : []).map(
          (order) => ({
            id: String(order.id),
            machine: String(order.machine?.name ?? order.machineId ?? ''),
            issue: String(order.issue),
            technicianId: order.technicianId ? String(order.technicianId) : undefined,
            technician: String(order.technician?.name ?? order.technicianName ?? 'Unassigned'),
            status: order.status,
            priority: order.priority,
            due: order.dueAt ? new Date(order.dueAt).toLocaleString() : 'No due date',
            diagnosis: order.diagnosis,
            repairNotes: order.repairNotes,
            completionNotes: order.completionNotes,
            verificationNotes: order.verificationNotes,
            laborMinutes: order.laborMinutes,
          }),
        ),
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getPreventiveMaintenance(): Observable<PreventiveMaintenancePlan[]> {
    const fallback: Observable<PreventiveMaintenancePlan[]> = of([
      {
        id: 'PM-0184',
        machine: 'M-1042 · Juki DDL-9000C',
        task: 'Lubrication and needle bar inspection',
        frequency: 'Every 250h',
        nextDue: 'Today',
        compliance: 100,
        owner: 'Sewing Engineering',
      },
      {
        id: 'PM-0179',
        machine: 'M-0871 · Brother BAS-326H',
        task: '500-hour preventive service',
        frequency: 'Every 500h',
        nextDue: 'Today',
        compliance: 82,
        owner: 'Lina Saleh',
      },
      {
        id: 'PM-0174',
        machine: 'M-1138 · Gerber Paragon HX',
        task: 'Blade alignment and calibration',
        frequency: 'Monthly',
        nextDue: 'Tomorrow',
        compliance: 96,
        owner: 'Cutting Engineering',
      },
      {
        id: 'PM-0168',
        machine: 'M-0914 · Kansai Special FX',
        task: 'Drive belt and tension check',
        frequency: 'Every 1000h',
        nextDue: '18 Nov 2026',
        compliance: 74,
        owner: 'Omar Haddad',
      },
    ]);
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/preventive-maintenance`)).pipe(
      map((response) =>
        (Array.isArray(response?.result) ? response.result : []).map(
          (row: {
            id: string;
            machine?: { name?: string };
            machineId?: string;
            task: string;
            frequency: string;
            nextDue: string;
            compliancePercent?: number;
            ownerName?: string;
          }) => ({
            id: row.id,
            machine: row.machine?.name ?? row.machineId ?? '',
            task: row.task,
            frequency: row.frequency,
            nextDue: new Date(row.nextDue).toLocaleDateString(),
            compliance: Number(row.compliancePercent ?? 0),
            owner: row.ownerName ?? 'Unassigned',
          }),
        ),
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getBreakdowns(): Observable<BreakdownSummary[]> {
    const fallback: Observable<BreakdownSummary[]> = of([
      {
        id: 'BD-0062',
        machine: 'M-0914 · Kansai Special FX',
        category: 'Electrical',
        startedAt: '10 Nov 2026 · 08:18',
        downtime: '2h 42m',
        rootCause: 'Thread tension sensor fault',
        status: 'Investigating',
      },
      {
        id: 'BD-0061',
        machine: 'M-0871 · Brother BAS-326H',
        category: 'Mechanical',
        startedAt: '09 Nov 2026 · 14:05',
        downtime: '1h 18m',
        rootCause: 'Needle bar wear',
        status: 'Resolved',
      },
      {
        id: 'BD-0058',
        machine: 'M-0752 · Pegasus M-952',
        category: 'Pneumatic',
        startedAt: '07 Nov 2026 · 11:42',
        downtime: '46m',
        rootCause: 'Air pressure below threshold',
        status: 'Resolved',
      },
    ]);
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/breakdowns`)).pipe(
      map((response) =>
        (Array.isArray(response?.result) ? response.result : []).map(
          (row: {
            id: string;
            machine?: { name?: string };
            machineId?: string;
            category: string;
            startedAt: string;
            endedAt?: string;
            rootCause?: string;
            status: BreakdownSummary['status'];
          }) => ({
            id: row.id,
            machine: row.machine?.name ?? row.machineId ?? '',
            category: row.category,
            startedAt: new Date(row.startedAt).toLocaleString(),
            downtime: row.endedAt ? 'Resolved' : 'Active',
            rootCause: row.rootCause ?? 'Not recorded',
            status: row.status,
          }),
        ),
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getSpareParts(): Observable<SparePartSummary[]> {
    const fallback: Observable<SparePartSummary[]> = of([
      {
        id: 'SP-2048',
        name: 'Thread tension sensor',
        category: 'Electrical',
        stock: 2,
        reorderLevel: 5,
        supplier: 'SewTech Supplies',
        unitCost: '$42.00',
      },
      {
        id: 'SP-1182',
        name: 'Needle bar assembly',
        category: 'Mechanical',
        stock: 8,
        reorderLevel: 4,
        supplier: 'Classic Parts Hub',
        unitCost: '$68.50',
      },
      {
        id: 'SP-3021',
        name: 'Timing belt 900mm',
        category: 'Drive system',
        stock: 3,
        reorderLevel: 3,
        supplier: 'Motion Works',
        unitCost: '$19.80',
      },
      {
        id: 'SP-4420',
        name: 'Pneumatic valve 1/4in',
        category: 'Pneumatic',
        stock: 14,
        reorderLevel: 6,
        supplier: 'Motion Works',
        unitCost: '$27.25',
      },
    ]);
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/spare-parts`)).pipe(
      map((response) =>
        (Array.isArray(response?.result) ? response.result : []).map(
          (row: {
            id: string;
            name: string;
            category: string;
            stockQuantity?: number;
            reorderLevel?: number;
            supplier?: string;
            unitCost?: number | string;
          }) => ({
            id: row.id,
            name: row.name,
            category: row.category,
            stock: Number(row.stockQuantity ?? 0),
            reorderLevel: Number(row.reorderLevel ?? 0),
            supplier: row.supplier ?? 'Not recorded',
            unitCost: `$${Number(row.unitCost ?? 0).toFixed(2)}`,
          }),
        ),
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getCosts(): Observable<CostSummary[]> {
    const fallback: Observable<CostSummary[]> = of([
      {
        machine: 'M-1042 · Juki DDL-9000C',
        labor: '$420',
        spareParts: '$86',
        contractors: '$0',
        total: '$506',
        trend: 'down',
      },
      {
        machine: 'M-0871 · Brother BAS-326H',
        labor: '$680',
        spareParts: '$245',
        contractors: '$120',
        total: '$1,045',
        trend: 'up',
      },
      {
        machine: 'M-0914 · Kansai Special FX',
        labor: '$310',
        spareParts: '$42',
        contractors: '$0',
        total: '$352',
        trend: 'down',
      },
    ]);
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/costs`)).pipe(
      map((response) =>
        Array.isArray(response?.result) ? (response.result as CostSummary[]) : [],
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getMobileTasks(): Observable<MobileTaskSummary[]> {
    const fallback: Observable<MobileTaskSummary[]> = of([
      {
        id: 'WO-24081',
        machine: 'M-0914 · Kansai Special FX',
        task: 'Resolve thread tension sensor fault',
        priority: 'Critical',
        assignee: 'Omar Haddad',
        sync: 'Synced',
      },
      {
        id: 'WO-24079',
        machine: 'M-0871 · Brother BAS-326H',
        task: 'Complete 500-hour preventive service',
        priority: 'High',
        assignee: 'Lina Saleh',
        sync: 'Pending sync',
      },
      {
        id: 'WO-24076',
        machine: 'M-1042 · Juki DDL-9000C',
        task: 'Perform oil level inspection',
        priority: 'Medium',
        assignee: 'Unassigned',
        sync: 'Synced',
      },
    ]);
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/mobile`)).pipe(
      map((response) =>
        Array.isArray(response?.result) ? (response.result as MobileTaskSummary[]) : [],
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getQrAccess(): Observable<QrAccessSummary[]> {
    const fallback: Observable<QrAccessSummary[]> = of([
      {
        machine: 'Juki DDL-9000C',
        assetNumber: 'AST-1042',
        lastScan: 'Today, 09:12',
        openOrders: 1,
        breakdowns: 0,
        status: 'Running',
      },
      {
        machine: 'Brother BAS-326H',
        assetNumber: 'AST-0871',
        lastScan: 'Today, 08:55',
        openOrders: 2,
        breakdowns: 1,
        status: 'Under Maintenance',
      },
      {
        machine: 'Kansai Special FX',
        assetNumber: 'AST-0914',
        lastScan: 'Yesterday, 16:42',
        openOrders: 1,
        breakdowns: 2,
        status: 'Breakdown',
      },
    ]);
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/qr-management`)).pipe(
      map((response) =>
        Array.isArray(response?.result) ? (response.result as QrAccessSummary[]) : [],
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getProductionImpact(): Observable<ProductionImpactSummary[]> {
    const fallback: Observable<ProductionImpactSummary[]> = of([
      {
        order: 'PO-88421',
        line: 'Sewing · Line 04',
        machine: 'M-1042',
        downtime: '18m',
        unitsAtRisk: 64,
        recovery: 'On track',
      },
      {
        order: 'PO-88418',
        line: 'Sewing · Line 07',
        machine: 'M-0914',
        downtime: '2h 42m',
        unitsAtRisk: 380,
        recovery: 'At risk',
      },
      {
        order: 'PO-88396',
        line: 'Sewing · Line 02',
        machine: 'M-0871',
        downtime: '1h 18m',
        unitsAtRisk: 120,
        recovery: 'Delayed',
      },
    ]);
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/production-integration`)).pipe(
      map((response) =>
        Array.isArray(response?.result) ? (response.result as ProductionImpactSummary[]) : [],
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getReportSummary(): Observable<{
    generatedAt: string;
    metrics: {
      machineCount: number;
      workOrderCount: number;
      breakdownCount: number;
      sparePartCount: number;
    };
  }> {
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/reports/maintenance`)).pipe(
      map(
        (response) =>
          response.result as {
            generatedAt: string;
            metrics: {
              machineCount: number;
              workOrderCount: number;
              breakdownCount: number;
              sparePartCount: number;
            };
          },
      ),
    );
  }

  getDashboardData(): Observable<MmmsDashboardData> {
    return forkJoin({
      summary: this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/dashboard`)),
      machines: this.getMachines(),
      workOrders: this.getWorkOrders(),
      breakdowns: this.getBreakdowns(),
    }).pipe(
      map(({ summary, machines, workOrders, breakdowns }) => {
        const counts = summary.result as {
          machines: number;
          openWorkOrders: number;
          activeBreakdowns: number;
          spareParts: number;
        };
        const uptime = machines.length
          ? machines.reduce((total, machine) => total + machine.uptime, 0) / machines.length
          : 0;
        return {
          kpis: [
            {
              label: 'Open work orders',
              value: String(counts.openWorkOrders),
              change: 'Live',
              trend: 'neutral' as const,
              icon: 'bi-clipboard2-pulse',
              tone: 'blue' as const,
            },
            {
              label: 'Machine uptime',
              value: `${uptime.toFixed(1)}%`,
              change: 'Live',
              trend: 'neutral' as const,
              icon: 'bi-activity',
              tone: 'teal' as const,
            },
            {
              label: 'Active breakdowns',
              value: String(counts.activeBreakdowns),
              change: 'Live',
              trend: 'neutral' as const,
              icon: 'bi-exclamation-triangle',
              tone: 'amber' as const,
            },
            {
              label: 'Tracked spare parts',
              value: String(counts.spareParts),
              change: 'Live',
              trend: 'neutral' as const,
              icon: 'bi-box-seam',
              tone: 'violet' as const,
            },
          ],
          machines,
          workOrders,
          downtimeByDay: [],
          maintenanceMix: [
            { label: 'Preventive', value: 0, color: '#3b82f6' },
            { label: 'Breakdown', value: breakdowns.length, color: '#f26b5e' },
            { label: 'Corrective', value: workOrders.length, color: '#f4b740' },
          ],
        } satisfies MmmsDashboardData;
      }),
    );
    /* Removed legacy mock dashboard payload.
    return of({
      kpis: [
        {
          label: 'Open work orders',
          value: '24',
          change: '+8.2%',
          trend: 'up',
          icon: 'bi-clipboard2-pulse',
          tone: 'blue',
        },
        {
          label: 'Machine uptime',
          value: '96.4%',
          change: '+2.1%',
          trend: 'up',
          icon: 'bi-activity',
          tone: 'teal',
        },
        {
          label: 'Overdue PM tasks',
          value: '07',
          change: '-14.3%',
          trend: 'down',
          icon: 'bi-calendar2-week',
          tone: 'amber',
        },
        {
          label: 'MTTR',
          value: '3h 42m',
          change: '-18.6%',
          trend: 'down',
          icon: 'bi-stopwatch',
          tone: 'violet',
        },
      ],
      machines: [
        {
          id: 'M-1042',
          name: 'Juki DDL-9000C',
          category: 'Lockstitch',
          line: 'Sewing · Line 04',
          status: 'Running',
          uptime: 98,
          lastService: 'Today, 08:40',
        },
        {
          id: 'M-0871',
          name: 'Brother BAS-326H',
          category: 'Buttonhole',
          line: 'Sewing · Line 02',
          status: 'Under Maintenance',
          uptime: 88,
          lastService: 'Today, 07:15',
        },
        {
          id: 'M-1138',
          name: 'Gerber Paragon HX',
          category: 'Cutting',
          line: 'Cutting · Bay 01',
          status: 'Idle',
          uptime: 94,
          lastService: 'Yesterday, 16:20',
        },
        {
          id: 'M-0914',
          name: 'Kansai Special FX',
          category: 'Overlock',
          line: 'Sewing · Line 07',
          status: 'Breakdown',
          uptime: 71,
          lastService: 'Yesterday, 13:05',
        },
      ],
      workOrders: [
        {
          id: 'WO-24081',
          machine: 'M-0914 · Kansai Special FX',
          issue: 'Thread tension sensor fault',
          technician: 'Omar Haddad',
          status: 'In Progress',
          priority: 'Critical',
          due: 'Due in 42 min',
        },
        {
          id: 'WO-24079',
          machine: 'M-0871 · Brother BAS-326H',
          issue: 'Preventive service · 500h',
          technician: 'Lina Saleh',
          status: 'Waiting Parts',
          priority: 'High',
          due: 'Today, 14:30',
        },
        {
          id: 'WO-24076',
          machine: 'M-1042 · Juki DDL-9000C',
          issue: 'Oil level inspection',
          technician: 'Unassigned',
          status: 'Open',
          priority: 'Medium',
          due: 'Tomorrow',
        },
        {
          id: 'WO-24070',
          machine: 'M-0752 · Pegasus M-952',
          issue: 'Needle bar replacement',
          technician: 'Yazan Nassar',
          status: 'Completed',
          priority: 'Low',
          due: 'Closed 10:12',
        },
      ],
      downtimeByDay: [
        { day: 'Mon', hours: 6.4 },
        { day: 'Tue', hours: 4.8 },
        { day: 'Wed', hours: 7.1 },
        { day: 'Thu', hours: 3.9 },
        { day: 'Fri', hours: 5.2 },
        { day: 'Sat', hours: 2.6 },
        { day: 'Sun', hours: 1.8 },
      ],
      maintenanceMix: [
        { label: 'Preventive', value: 54, color: '#3b82f6' },
        { label: 'Breakdown', value: 28, color: '#f26b5e' },
        { label: 'Corrective', value: 18, color: '#f4b740' },
      ],
    }); */
  }
}
