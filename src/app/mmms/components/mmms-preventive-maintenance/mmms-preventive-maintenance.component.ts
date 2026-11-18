import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MaintenancePlanRecord, MaintenanceOccurrence } from '../../models/mmms-maintenance.models';
import { MachineSummary } from '../../models/mmms.models';
@Component({
  selector: 'app-mmms-preventive-maintenance',
  standalone: false,
  templateUrl: './mmms-preventive-maintenance.component.html',
  styleUrls: ['./mmms-preventive-maintenance.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsPreventiveMaintenanceComponent implements OnInit {
  readonly pagination = new MmmsPagination();
  readonly historyPagination = new MmmsPagination();
  readonly plans = signal<MaintenancePlanRecord[]>([]);
  readonly machines = signal<MachineSummary[]>([]);
  readonly occurrences = signal<MaintenanceOccurrence[]>([]);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly editorOpen = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly historyOpen = signal(false);
  frequencies = [
    'Daily',
    'Weekly',
    'Monthly',
    'Quarterly',
    'Half-Yearly',
    'Yearly',
    'Operating Hours Based',
    'Production Quantity Based',
    'Custom Frequency',
  ];
  readonly mechanics = signal<import('../../models/mmms.models').TechnicianSummary[]>([]);
  categories: string[] = [];
  draft: Partial<MaintenancePlanRecord> = {};
  checklistText = '';
  private readonly facade = inject(MmmsFacadeService);
  ngOnInit(): void {
    this.facade.getTechnicians().subscribe({ next: (rows) => this.mechanics.set(rows) });
    this.facade
      .getSettings()
      .subscribe({ next: (settings) => (this.categories = settings.maintenanceCategories) });
    this.facade.getSettings().subscribe({
      next: (settings) =>
        (this.frequencies = [
          ...settings.maintenanceFrequencies.map((rule) => rule.name),
          'Custom Frequency',
        ]),
    });
    this.load();
    this.facade.getMachines().subscribe({
      next: (rows) => this.machines.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  load(): void {
    this.facade.getMaintenancePlans().subscribe({
      next: (rows) => this.plans.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  edit(plan?: MaintenancePlanRecord): void {
    this.selectedId.set(plan?.id || null);
    this.draft = plan
      ? { ...plan, nextDue: plan.nextDue.slice(0, 10), details: { ...plan.details } }
      : {
          machineId: '',
          task: '',
          frequency: 'Monthly',
          nextDue: new Date().toISOString().slice(0, 10),
          ownerName: '',
          details: { active: true, checklist: [] },
        };
    this.checklistText = (plan?.details.checklist || []).join('\n');
    this.editorOpen.set(true);
  }
  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.draft.details = {
      ...this.draft.details,
      checklist: this.checklistText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    };
    this.facade
      .saveMaintenancePlan(this.selectedId(), this.draft)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.load();
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  generate(plan: MaintenancePlanRecord): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.facade
      .generateMaintenanceTasks(plan.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.load();
          this.history(plan);
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  history(plan: MaintenancePlanRecord): void {
    this.historyOpen.set(true);
    this.facade.getMaintenanceOccurrences(plan.id).subscribe({
      next: (rows) => this.occurrences.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  private fail(error: unknown): void {
    this.error.set(
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
        'Unable to complete the maintenance request.',
    );
  }
}
