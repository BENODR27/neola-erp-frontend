import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { MachineSummary, TechnicianSummary, MachineHistorySummary } from '../../models/mmms.models';
import { WorkOrderRecord, WORK_ORDER_TRANSITIONS } from '../../models/mmms-work-order.models';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
@Component({
  selector: 'app-mmms-work-orders',
  standalone: false,
  templateUrl: './mmms-work-orders.component.html',
  styleUrls: ['./mmms-work-orders.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsWorkOrdersComponent implements OnInit {
  private readonly paginationCleanup = inject(DestroyRef).onDestroy(() => {
    this.pagination.destroy();
    this.historyPagination.destroy();
  });
  readonly pagination = new MmmsPagination(() => this.load());
  readonly historyPagination = new MmmsPagination(() => this.loadHistoryPage());
  readonly orders = signal<WorkOrderRecord[]>([]);
  readonly machines = signal<MachineSummary[]>([]);
  readonly technicians = signal<TechnicianSummary[]>([]);
  readonly history = signal<MachineHistorySummary[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly visibleOrders = computed(() => this.orders());
  readonly statuses = computed(() => Object.keys(WORK_ORDER_TRANSITIONS));
  readonly openCount = computed(
    () => this.orders().filter((row) => !['Closed', 'Cancelled'].includes(row.status)).length,
  );
  types = [
    'Breakdown Repair',
    'Preventive Maintenance',
    'Corrective Maintenance',
    'Inspection',
    'Installation',
    'Modification',
    'General Maintenance',
  ];
  draft: Partial<WorkOrderRecord> = {};
  originalStatus = 'Draft';
  dueInput = '';
  requiredPartsInput = '';
  private readonly facade = inject(MmmsFacadeService);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  ngOnInit(): void {
    const target = this.route.snapshot.queryParamMap.get('orderId');
    if (target)
      this.facade
        .getRecord<WorkOrderRecord>(`work-orders/${encodeURIComponent(target)}`)
        .subscribe({ next: (row) => this.edit(row), error: (error: unknown) => this.fail(error) });
    this.facade
      .getSettings()
      .subscribe({ next: (settings) => (this.types = settings.workOrderTypes) });
    this.load();
    this.facade.getMachines().subscribe({
      next: (rows) => this.machines.set(rows),
      error: (error: unknown) => this.fail(error),
    });
    this.facade.getTechnicians().subscribe({
      next: (rows) => this.technicians.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  load(): void {
    this.loading.set(true);
    this.pagination
      .read(
        this.facade.getPage<WorkOrderRecord>(
          'work-orders',
          this.pagination.query({ search: this.search(), status: this.statusFilter() }),
        ),
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => {
          this.orders.set(rows);
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  edit(order?: WorkOrderRecord): void {
    this.editingId.set(order?.id || null);
    this.originalStatus = order?.status || 'Draft';
    this.draft = order
      ? structuredClone(order)
      : {
          machineId: this.route.snapshot.queryParamMap.get('machineId') || '',
          issue: '',
          priority: 'Medium',
          status: 'Draft',
          details: { type: 'General Maintenance', attachments: [], checklistResults: {} },
        };
    this.draft.details = {
      ...this.draft.details,
      checklistResults: { ...this.draft.details?.checklistResults },
      attachments: [...(this.draft.details?.attachments || [])],
    };
    const date = order?.dueAt ? new Date(order.dueAt) : null;
    this.dueInput = date
      ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : '';
    this.error.set('');
    this.historyPagination.page.set(1);
    this.history.set([]);
    this.requiredPartsInput = (this.draft.details?.requiredParts || []).join('\n');
    if (order)
      this.historyPagination
        .read(
          this.facade.getPage<MachineHistorySummary>(
            `work-orders/${order.id}/history`,
            this.historyPagination.query(),
          ),
        )
        .subscribe({
          next: (rows) => this.history.set(rows),
          error: (error: unknown) => this.fail(error),
        });
    this.editorOpen.set(true);
  }
  allowedStatuses(): string[] {
    if (!this.editingId()) return ['Draft'];
    return [
      this.originalStatus,
      ...(WORK_ORDER_TRANSITIONS[this.originalStatus] || []).filter((status) =>
        status === 'Assigned'
          ? this.auth.hasPermission('MMMS-WORK-ORDERS-ASSIGN')
          : status === 'In Progress' &&
              ['Completed', 'Repair Completed', 'Verification', 'Verified'].includes(
                this.originalStatus,
              )
            ? this.auth.hasPermission('MMMS-WORK-ORDERS-REJECT')
            : status === 'Approved'
              ? this.auth.hasPermission('MMMS-WORK-ORDERS-APPROVE')
              : ['Verified', 'Closed'].includes(status)
                ? this.auth.hasPermission('MMMS-WORK-ORDERS-VERIFY')
                : true,
      ),
    ];
  }
  finalized(): boolean {
    return ['Closed', 'Cancelled'].includes(this.originalStatus);
  }
  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const payload = {
      ...this.draft,
      details: {
        ...this.draft.details,
        requiredParts: this.requiredPartsInput
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      },
      dueAt: this.dueInput ? new Date(this.dueInput).toISOString() : undefined,
    };
    this.facade
      .saveWorkOrderRecord(
        this.editingId(),
        payload,
        !!this.editingId() && this.draft.status !== this.originalStatus,
      )
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.load();
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  loadHistoryPage(): void {
    const id = this.editingId();
    if (!id) return;
    this.historyPagination
      .read(
        this.facade.getPage<MachineHistorySummary>(
          `work-orders/${id}/history`,
          this.historyPagination.query(),
        ),
      )
      .subscribe({
        next: (rows) => this.history.set(rows),
        error: (error: unknown) => this.fail(error),
      });
  }
  private fail(error: unknown): void {
    this.error.set(
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
        'Unable to complete the work-order request.',
    );
  }
}
