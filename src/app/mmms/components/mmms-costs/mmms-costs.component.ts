import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MachineSummary } from '../../models/mmms.models';
import { MaintenanceExpense } from '../../models/mmms-administration.models';
@Component({
  selector: 'app-mmms-costs',
  standalone: false,
  templateUrl: './mmms-costs.component.html',
  styleUrls: ['./mmms-costs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsCostsComponent implements OnInit {
  private readonly paginationCleanup = inject(DestroyRef).onDestroy(() => {
    this.pagination.destroy();
  });
  readonly pagination = new MmmsPagination(() => this.load());
  private readonly facade = inject(MmmsFacadeService);
  readonly rows = signal<MaintenanceExpense[]>([]);
  readonly machines = signal<MachineSummary[]>([]);
  readonly editorOpen = signal(false);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly selected = signal<MaintenanceExpense | null>(null);
  categories = [
    'Labour Cost',
    'Spare Parts Cost',
    'External Service Cost',
    'Transportation Cost',
    'Repair Cost',
    'Inspection Cost',
    'Calibration Cost',
    'Other Expenses',
  ];
  draft: Partial<MaintenanceExpense> = {};
  voidReason = '';
  ngOnInit(): void {
    this.facade.getSettings().subscribe({
      next: (settings) => (this.categories = settings['costCategories'] as string[]),
    });
    this.load();
    this.facade.getMachines().subscribe({
      next: (rows) => this.machines.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  load(): void {
    this.pagination
      .read(this.facade.getPage<MaintenanceExpense>('expenses', this.pagination.query({})))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: (error: unknown) => this.fail(error),
      });
  }
  create(): void {
    this.draft = {
      machineId: '',
      category: 'Other Expenses',
      amount: 0,
      currency: 'USD',
      description: '',
      occurredAt: new Date().toISOString().slice(0, 10),
      attachments: [],
    };
    this.editorOpen.set(true);
  }
  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.facade
      .createExpense(this.draft)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.load();
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  voidSelectedExpense(): void {
    const row = this.selected();
    if (!row || this.saving()) return;
    this.saving.set(true);
    this.facade
      .voidExpense(row.id, this.voidReason)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.selected.set(null);
          this.load();
        },
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
