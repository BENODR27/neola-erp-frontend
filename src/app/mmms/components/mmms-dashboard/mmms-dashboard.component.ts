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
import { finalize, map } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MaintenanceAnalytics } from '../../models/mmms-analytics.models';
@Component({
  selector: 'app-mmms-dashboard',
  standalone: false,
  templateUrl: './mmms-dashboard.component.html',
  styleUrl: './mmms-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsDashboardComponent implements OnInit {
  private readonly paginationCleanup = inject(DestroyRef).onDestroy(() => {
    this.pagination.destroy();
  });
  readonly pagination = new MmmsPagination(() => this.load());
  readonly data = signal<MaintenanceAnalytics | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly view = signal('management');
  private readonly facade = inject(MmmsFacadeService);
  readonly period = this.facade.selectedPeriod;
  readonly cards = computed(() => {
    const keys =
      this.view() === 'mechanic'
        ? ['openWorkOrders', 'overdueWorkOrders', 'preventiveDue']
        : this.view() === 'supervisor'
          ? [
              'openWorkOrders',
              'unassignedWorkOrders',
              'pendingVerification',
              'overdueWorkOrders',
              'availableMechanics',
              'preventiveDue',
              'overdueInspections',
              'overdueCalibrations',
            ]
          : [
              'machineCount',
              'activeMachines',
              'idleMachines',
              'underMaintenance',
              'activeBreakdowns',
              'criticalBreakdowns',
              'availabilityPercent',
              'downtimeHours',
              'mttrHours',
              'mtbfHours',
              'preventiveCompliancePercent',
              'lowStockCount',
            ];
    return keys.map((key) => ({ key, label: this.labels[key] || key, value: this.value(key) }));
  });
  readonly labels: Record<string, string> = {
    machineCount: 'Total machines',
    activeMachines: 'Running machines',
    idleMachines: 'Idle machines',
    underMaintenance: 'Under maintenance',
    activeBreakdowns: 'Open breakdowns',
    criticalBreakdowns: 'Critical breakdowns',
    availabilityPercent: 'Availability %',
    downtimeHours: 'Downtime hours',
    mttrHours: 'MTTR hours',
    mtbfHours: 'MTBF hours',
    preventiveCompliancePercent: 'PM compliance %',
    lowStockCount: 'Low-stock parts',
    openWorkOrders: 'Open work orders',
    unassignedWorkOrders: 'Awaiting assignment',
    pendingVerification: 'Pending verification',
    overdueWorkOrders: 'Overdue work orders',
    availableMechanics: 'Available mechanics',
    preventiveDue: 'Preventive tasks',
    overdueInspections: 'Overdue inspections',
    overdueCalibrations: 'Overdue calibrations',
  };
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.pagination
      .read(
        this.facade.getAnalytics(this.view(), this.pagination.query()).pipe(
          map((data) => ({
            result: [data],
            total: data.taskTotal,
            page: this.pagination.page(),
            pageSize: this.pagination.pageSize(),
            totalPages: Math.max(1, Math.ceil(data.taskTotal / this.pagination.pageSize())),
          })),
        ),
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ([data]) => this.data.set(data),
        error: () =>
          this.error.set('Analytics could not be loaded. Check the API connection and retry.'),
      });
  }
  setPeriod(value: '7d' | '30d' | '90d'): void {
    this.period.set(value);
    this.pagination.reset();
  }
  value(key: string): string {
    const value = this.data()?.kpis[key];
    return typeof value === 'number'
      ? Number.isInteger(value)
        ? String(value)
        : value.toFixed(2)
      : '—';
  }
  maxDowntime(): number {
    return Math.max(1, ...(this.data()?.downtimeByDay.map((row) => row.hours) || []));
  }
  currencies(): [string, number][] {
    const value = this.data()?.kpis['expensesByCurrency'];
    return value && typeof value === 'object' ? Object.entries(value) : [];
  }
}
