import type { NavbarItem } from '../../shared/services/shared-service/shared-service.service';
import type { MmmsPage, MmmsPageQuery } from '../models/mmms-page.models';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MmmsStoredFile } from '../models/mmms-file.models';
import {
  MaintenanceExpense,
  CalibrationRecord,
  MaintenanceNotification,
  MaintenanceReport,
  ReportFilter,
} from '../models/mmms-administration.models';
import { WorkOrderRecord } from '../models/mmms-work-order.models';
import { MachineRecord } from '../models/mmms-machine.models';
import { BreakdownRecord } from '../models/mmms-breakdown.models';
import { MaintenanceAnalytics } from '../models/mmms-analytics.models';
import { MechanicRecord } from '../models/mmms-mechanic.models';
import { OrganizationUnit } from '../models/mmms-organization.models';
import { MaintenanceSettings } from '../models/mmms-configuration.models';
import { SharedVendor, VendorProfile, VendorService } from '../models/mmms-vendor.models';
import { catchError, map, Observable, throwError } from 'rxjs';
import {
  BreakdownSummary,
  CostSummary,
  MachineHistorySummary,
  MachineStatus,
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
import { MachineMovement, MovementDraft } from '../models/mmms-movement.models';
import {
  InventoryPart,
  StockTransaction,
  StockTransactionDraft,
  MaintenancePlanRecord,
  MaintenanceOccurrence,
  InspectionRecord,
} from '../models/mmms-maintenance.models';

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
  rejectionReason?: string;
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

/** Typed workspace boundary for live MMMS APIs and response mapping. */
@Injectable({ providedIn: 'root' })
export class MmmsFacadeService {
  getSharedVendorPage(query: MmmsPageQuery): Observable<MmmsPage<SharedVendor>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query))
      if (value !== undefined && value !== '') params.set(key, String(value));
    return this.http.get<MmmsPage<SharedVendor>>(
      `${environment.authv2ApiUrl}/api/auth/vendors?${params}`,
    );
  }
  getRecord<T>(resource: string): Observable<T> {
    return this.http
      .get<{ result: T }>(this.scopedUrl(`${environment.MMMS_API_URL}/${resource}`))
      .pipe(map((response) => response.result));
  }
  getPage<T>(
    resource: string,
    query: MmmsPageQuery,
    includeFactory = true,
  ): Observable<MmmsPage<T>> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
    return this.http.get<MmmsPage<T>>(
      this.scopedUrl(`${environment.MMMS_API_URL}/${resource}?${params}`, includeFactory),
    );
  }
  readonly selectedPeriod = signal<'7d' | '30d' | '90d'>('30d');
  private readonly http = inject(HttpClient);
  getSharedVendors(): Observable<SharedVendor[]> {
    return this.api
      .getDatas(`${environment.authv2ApiUrl}/api/auth/vendors`)
      .pipe(map((response) => response.result as SharedVendor[]));
  }
  saveSharedVendor(id: string | null, draft: Partial<SharedVendor>): Observable<unknown> {
    const scope = this.context.context();
    const payload = {
      ...draft,
      organizationId: scope.organizationId,
      organizationName: scope.organizationName,
      factoryId: scope.factoryId,
      factoryName: scope.factoryName,
    };
    const url = `${environment.authv2ApiUrl}/api/auth/vendors${id ? '/' + encodeURIComponent(id) : ''}`;
    return id ? this.api.putAtUrl(url, payload) : this.api.addData(payload, url);
  }
  getVendorProfiles(): Observable<VendorProfile[]> {
    return this.readRecords<VendorProfile>('vendor-profiles');
  }
  saveVendorProfile(draft: VendorProfile): Observable<unknown> {
    const scope = this.context.context();
    return this.api.putAtUrl(
      this.scopedUrl(
        `${environment.MMMS_API_URL}/vendor-profiles/${encodeURIComponent(draft.vendorId)}`,
      ),
      { ...draft, organizationId: scope.organizationId, factoryId: scope.factoryId },
    );
  }
  getVendorServices(): Observable<VendorService[]> {
    return this.readRecords<VendorService>('vendor-services');
  }
  createVendorService(draft: Partial<VendorService>): Observable<unknown> {
    return this.api.addData(draft, this.scopedUrl(`${environment.MMMS_API_URL}/vendor-services`));
  }
  updateVendorService(id: string, draft: Partial<VendorService>): Observable<unknown> {
    return this.api.addData(
      draft,
      this.scopedUrl(
        `${environment.MMMS_API_URL}/vendor-services/${encodeURIComponent(id)}/status`,
      ),
    );
  }
  getSettings(): Observable<MaintenanceSettings> {
    return this.api
      .getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/configuration/effective`))
      .pipe(map((response) => response.result as MaintenanceSettings));
  }
  saveSetting(key: string, value: unknown): Observable<unknown> {
    const scope = this.context.context();
    return this.api.putAtUrl(
      this.scopedUrl(`${environment.MMMS_API_URL}/configuration/${encodeURIComponent(key)}`),
      { value, organizationId: scope.organizationId, factoryId: scope.factoryId },
    );
  }
  getMechanicRecords(): Observable<MechanicRecord[]> {
    return this.readRecords<MechanicRecord>('technicians');
  }
  saveMechanicRecord(id: string | null, draft: Partial<MechanicRecord>): Observable<unknown> {
    const scope = this.context.context();
    const payload = {
      ...draft,
      organizationId: draft.organizationId || scope.organizationId,
      factoryId: draft.factoryId || scope.factoryId,
      factory: draft.factory || scope.factoryName,
    };
    const url = this.scopedUrl(
      `${environment.MMMS_API_URL}/technicians${id ? '/' + encodeURIComponent(id) : ''}`,
    );
    return id ? this.api.putAtUrl(url, payload) : this.api.addData(payload, url);
  }
  getAnalytics(view: string, page: MmmsPageQuery = {}): Observable<MaintenanceAnalytics> {
    const days = Number(this.selectedPeriod().replace('d', ''));
    const query = new URLSearchParams({
      view,
      from: new Date(Date.now() - days * 86400000).toISOString(),
      to: new Date().toISOString(),
    });
    for (const [key, value] of Object.entries(page))
      if (value !== undefined) query.set(key, String(value));
    return this.api
      .getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/analytics?${query}`))
      .pipe(map((response) => response.result as MaintenanceAnalytics));
  }
  getBreakdownRecords(): Observable<BreakdownRecord[]> {
    return this.readRecords<BreakdownRecord>('breakdowns');
  }
  reportBreakdown(draft: Partial<BreakdownRecord>): Observable<unknown> {
    return this.api.addData(draft, this.scopedUrl(`${environment.MMMS_API_URL}/breakdowns`));
  }
  getOrganizationHierarchy(): Observable<OrganizationUnit[]> {
    return this.api
      .getDatas(`${environment.MMMS_API_URL}/hierarchy`)
      .pipe(map((response) => response.result as OrganizationUnit[]));
  }
  saveOrganizationUnit(id: string | null, draft: Partial<OrganizationUnit>): Observable<unknown> {
    const url = `${environment.MMMS_API_URL}/hierarchy${id ? '/' + encodeURIComponent(id) : ''}`;
    return id ? this.api.putAtUrl(url, draft) : this.api.addData(draft, url);
  }
  getMachineRecords(): Observable<MachineRecord[]> {
    return this.readRecords<MachineRecord>('machines');
  }
  saveMachineRecord(id: string | null, draft: Partial<MachineRecord>): Observable<unknown> {
    const scope = this.context.context();
    const payload = {
      ...draft,
      organizationId: draft.organizationId || scope.organizationId,
      factoryId: draft.factoryId || scope.factoryId,
    };
    const url = this.scopedUrl(
      `${environment.MMMS_API_URL}/machines${id ? '/' + encodeURIComponent(id) : ''}`,
    );
    return id ? this.api.putAtUrl(url, payload) : this.api.addData(payload, url);
  }
  importMachines(rows: Partial<MachineRecord>[]): Observable<unknown> {
    const scope = this.context.context();
    return this.api.addData(
      rows.map((row) => ({
        ...row,
        organizationId: scope.organizationId,
        factoryId: scope.factoryId,
      })),
      this.scopedUrl(`${environment.MMMS_API_URL}/machines/createBatch`),
    );
  }
  resolveMachineQr(reference: string): Observable<MachineRecord> {
    return this.api
      .getDatas(`${environment.MMMS_API_URL}/machines/qr/${encodeURIComponent(reference)}`)
      .pipe(map((response) => response.result as MachineRecord));
  }
  getQrMachineHistory(id: string): Observable<MachineHistorySummary[]> {
    return this.api
      .getDatas(`${environment.MMMS_API_URL}/machines/${encodeURIComponent(id)}/history`)
      .pipe(map((response) => response.result as MachineHistorySummary[]));
  }
  getWorkOrderRecords(personal = false): Observable<WorkOrderRecord[]> {
    return this.readRecords<WorkOrderRecord>(
      personal ? 'work-orders?personal=true' : 'work-orders',
    );
  }
  saveWorkOrderRecord(
    id: string | null,
    draft: Partial<WorkOrderRecord>,
    transition = false,
  ): Observable<unknown> {
    const url = this.scopedUrl(
      `${environment.MMMS_API_URL}/work-orders${id ? '/' + encodeURIComponent(id) : ''}${transition ? '/workflow' : ''}`,
    );
    return transition
      ? this.api.patchDataAtUrl(url, draft)
      : id
        ? this.api.putAtUrl(url, draft)
        : this.api.addData(draft, url);
  }
  getWorkOrderHistory(id: string): Observable<MachineHistorySummary[]> {
    return this.readRecords<MachineHistorySummary>(`work-orders/${encodeURIComponent(id)}/history`);
  }
  getExpenses(): Observable<MaintenanceExpense[]> {
    return this.readRecords<MaintenanceExpense>('expenses');
  }
  createExpense(draft: Partial<MaintenanceExpense>): Observable<unknown> {
    return this.api.addData(draft, this.scopedUrl(`${environment.MMMS_API_URL}/expenses`));
  }
  voidExpense(id: string, reason: string): Observable<unknown> {
    return this.api.addData(
      { reason },
      this.scopedUrl(`${environment.MMMS_API_URL}/expenses/${encodeURIComponent(id)}/void`),
    );
  }
  getCalibrations(): Observable<CalibrationRecord[]> {
    return this.readRecords<CalibrationRecord>('master-data/calibration');
  }
  createCalibration(draft: Partial<CalibrationRecord>): Observable<unknown> {
    return this.api.addData(
      draft,
      this.scopedUrl(`${environment.MMMS_API_URL}/master-data/calibration`),
    );
  }
  completeCalibration(id: string, draft: Partial<CalibrationRecord>): Observable<unknown> {
    return this.api.addData(
      draft,
      this.scopedUrl(
        `${environment.MMMS_API_URL}/master-data/calibration/${encodeURIComponent(id)}/complete`,
      ),
    );
  }
  getNotifications(): Observable<MaintenanceNotification[]> {
    return this.readRecords<MaintenanceNotification>('master-data/notifications');
  }
  readNotification(id: string): Observable<unknown> {
    return this.api.addData(
      {},
      this.scopedUrl(
        `${environment.MMMS_API_URL}/master-data/notifications/${encodeURIComponent(id)}/read`,
      ),
    );
  }
  getReportCatalog(): Observable<{ id: string; title: string }[]> {
    return this.readRecords<{ id: string; title: string }>('reports/catalog');
  }
  getReport(
    name: string,
    filter: ReportFilter,
    exporting = false,
    page: MmmsPageQuery = {},
  ): Observable<MaintenanceReport> {
    const query = new URLSearchParams(Object.entries(filter).filter(([, value]) => !!value));
    for (const [key, value] of Object.entries(page))
      if (value !== undefined && value !== '') query.set(key, String(value));
    if (exporting) query.set('export', 'true');
    return this.api
      .getDatas(
        this.scopedUrl(
          `${environment.MMMS_API_URL}/reports/data/${encodeURIComponent(name)}?${query}`,
        ),
      )
      .pipe(map((response) => response.result as MaintenanceReport));
  }

  uploadAttachments(files: FileList | File[]): Observable<MmmsStoredFile[]> {
    const data = new FormData();
    Array.from(files).forEach((file) => data.append('files', file));
    const scope = this.context.context();
    const query = new URLSearchParams({
      organizationId: scope.organizationId || '',
      factoryId: scope.factoryId || '',
    });
    return this.http
      .post<{ result: MmmsStoredFile[] }>(
        `${environment.SS_API_URL}/api/ss/mmms/files?${query}`,
        data,
      )
      .pipe(map((response) => response.result));
  }
  downloadAttachment(file: MmmsStoredFile): Observable<Blob> {
    if (!file.url.startsWith('/api/ss/mmms/files/')) throw new Error('Unsupported attachment URL');
    return this.http.get(`${environment.SS_API_URL}${file.url}`, { responseType: 'blob' });
  }

  getInventoryParts(): Observable<InventoryPart[]> {
    return this.readRecords<InventoryPart>('spare-parts');
  }
  getStockDestinations(): Observable<InventoryPart[]> {
    return this.api
      .getDatas(`${environment.MMMS_API_URL}/spare-parts`)
      .pipe(map((response) => response.result as InventoryPart[]));
  }
  getStockTransactions(id: string): Observable<StockTransaction[]> {
    return this.readRecords<StockTransaction>(`spare-parts/${encodeURIComponent(id)}/transactions`);
  }
  postStockTransaction(id: string, draft: StockTransactionDraft): Observable<unknown> {
    return this.api.addData(
      draft,
      this.scopedUrl(
        `${environment.MMMS_API_URL}/spare-parts/${encodeURIComponent(id)}/transactions`,
      ),
    );
  }
  saveInventoryPart(id: string | null, draft: Partial<InventoryPart>): Observable<unknown> {
    const payload = {
      name: draft.name,
      category: draft.category,
      reorderLevel: draft.reorderLevel,
      unitCost: draft.unitCost,
      supplier: draft.supplier,
      details: draft.details,
      organizationId: this.context.context().organizationId,
      factoryId: this.context.context().factoryId,
    };
    const url = this.scopedUrl(
      `${environment.MMMS_API_URL}/spare-parts${id ? '/' + encodeURIComponent(id) : ''}`,
    );
    return id ? this.api.putAtUrl(url, payload) : this.api.addData(payload, url);
  }
  getMaintenancePlans(): Observable<MaintenancePlanRecord[]> {
    return this.readRecords<MaintenancePlanRecord>('preventive-maintenance');
  }
  saveMaintenancePlan(
    id: string | null,
    draft: Partial<MaintenancePlanRecord>,
  ): Observable<unknown> {
    const url = this.scopedUrl(
      `${environment.MMMS_API_URL}/preventive-maintenance${id ? '/' + encodeURIComponent(id) : ''}`,
    );
    return id ? this.api.putAtUrl(url, draft) : this.api.addData(draft, url);
  }
  generateMaintenanceTasks(id: string): Observable<unknown> {
    return this.api.addData(
      {},
      this.scopedUrl(
        `${environment.MMMS_API_URL}/preventive-maintenance/${encodeURIComponent(id)}/generate`,
      ),
    );
  }
  getMaintenanceOccurrences(id: string): Observable<MaintenanceOccurrence[]> {
    return this.readRecords<MaintenanceOccurrence>(
      `preventive-maintenance/${encodeURIComponent(id)}/occurrences`,
    );
  }
  getInspections(): Observable<InspectionRecord[]> {
    return this.readRecords<InspectionRecord>('master-data/inspections');
  }
  createInspection(draft: Partial<InspectionRecord>): Observable<unknown> {
    return this.api.addData(
      draft,
      this.scopedUrl(`${environment.MMMS_API_URL}/master-data/inspections`),
    );
  }
  completeInspection(
    id: string,
    results: Record<string, string>,
    observations: string,
    attachments: MmmsStoredFile[] = [],
  ): Observable<unknown> {
    return this.api.addData(
      { results, observations, attachments },
      this.scopedUrl(
        `${environment.MMMS_API_URL}/master-data/inspections/${encodeURIComponent(id)}/complete`,
      ),
    );
  }
  private readRecords<T>(path: string): Observable<T[]> {
    return this.api
      .getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/${path}`))
      .pipe(map((response) => response.result as T[]));
  }

  getMovements(module: 'allocations' | 'transfers'): Observable<MachineMovement[]> {
    return this.api
      .getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/master-data/${module}`))
      .pipe(map((response) => response.result as MachineMovement[]));
  }

  createMovement(module: 'allocations' | 'transfers', draft: MovementDraft): Observable<unknown> {
    return this.api.addData(
      draft,
      this.scopedUrl(`${environment.MMMS_API_URL}/master-data/${module}`),
    );
  }

  transitionMovement(
    module: 'allocations' | 'transfers',
    id: string,
    status: string,
    reason: string,
  ): Observable<unknown> {
    return this.api.patchDataAtUrl(
      this.scopedUrl(
        `${environment.MMMS_API_URL}/master-data/${module}/${encodeURIComponent(id)}/workflow`,
      ),
      { status, reason },
    );
  }

  getMovementDestinations(): Observable<import('../models/mmms-movement.models').MovementUnit[]> {
    return this.api
      .getDatas(`${environment.MMMS_API_URL}/movement-options`)
      .pipe(
        map(
          (response) => response.result as import('../models/mmms-movement.models').MovementUnit[],
        ),
      );
  }

  constructor(
    private readonly api: ApiService,
    private readonly context: MmmsContextService,
  ) {}

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
    if (module === 'machines')
      return this.getMachines() as unknown as Observable<MmmsMasterRecord[]>;
    if (module === 'technicians')
      return this.getTechnicians() as unknown as Observable<MmmsMasterRecord[]>;
    const baseUrl =
      module === 'vendors'
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
    const url =
      module === 'vendors'
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
      this.scopedUrl(
        `${module === 'vendors' ? `${environment.authv2ApiUrl}/api/auth/vendors` : `${environment.MMMS_API_URL}/master-data/${encodeURIComponent(module)}`}/${encodeURIComponent(id)}`,
      ),
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
        status:
          draft['status'] === 'Maintenance'
            ? 'Under Maintenance'
            : String(draft['status'] ?? 'Idle'),
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
        status: String(draft['status'] ?? 'Draft'),
        dueAt: draft['due'] ? this.normaliseDate(draft['due'], 1) : null,
        diagnosis: String(draft['diagnosis'] ?? ''),
        repairNotes: String(draft['repairNotes'] ?? ''),
        completionNotes: String(draft['completionNotes'] ?? ''),
        verificationNotes: String(draft['verificationNotes'] ?? ''),
        rejectionReason: String(draft['rejectionReason'] ?? ''),
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
    if (module !== 'organization' && !scoped['organizationId'] && current.organizationId)
      scoped['organizationId'] = current.organizationId;
    if (
      module !== 'organization' &&
      module !== 'factories' &&
      !scoped['factoryId'] &&
      current.factoryId
    )
      scoped['factoryId'] = current.factoryId;
    if (module === 'factories' && !scoped['organizationId'] && current.organizationId)
      scoped['organizationId'] = current.organizationId;
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
      .getDatas(
        this.scopedUrl(
          `${environment.MMMS_API_URL}/machines/${encodeURIComponent(machineId)}/history`,
        ),
      )
      .pipe(
        map((response) =>
          Array.isArray(response?.result) ? (response.result as MachineHistorySummary[]) : [],
        ),
      );
  }

  getTechnicians(search = ''): Observable<TechnicianSummary[]> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    return this.api
      .getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/technicians${query}`))
      .pipe(
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
            dueAt: order.dueAt,
            diagnosis: order.diagnosis,
            repairNotes: order.repairNotes,
            completionNotes: order.completionNotes,
            verificationNotes: order.verificationNotes,
            rejectionReason: order.rejectionReason,
            machineId: order.machineId === undefined ? undefined : String(order.machineId),
            laborMinutes: order.laborMinutes,
          }),
        ),
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getPreventiveMaintenance(): Observable<PreventiveMaintenancePlan[]> {
    return this.api
      .getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/preventive-maintenance`))
      .pipe(
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
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/costs`)).pipe(
      map((response) =>
        Array.isArray(response?.result) ? (response.result as CostSummary[]) : [],
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getMobileTasks(): Observable<MobileTaskSummary[]> {
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/mobile`)).pipe(
      map((response) =>
        Array.isArray(response?.result) ? (response.result as MobileTaskSummary[]) : [],
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getQrAccess(): Observable<QrAccessSummary[]> {
    return this.api.getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/qr-management`)).pipe(
      map((response) =>
        Array.isArray(response?.result) ? (response.result as QrAccessSummary[]) : [],
      ),
      catchError((error: unknown) => throwError(() => error)),
    );
  }

  getProductionImpact(): Observable<ProductionImpactSummary[]> {
    return this.api
      .getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/production-integration`))
      .pipe(
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
    return this.api
      .getDatas(this.scopedUrl(`${environment.MMMS_API_URL}/reports/maintenance`))
      .pipe(
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
}
