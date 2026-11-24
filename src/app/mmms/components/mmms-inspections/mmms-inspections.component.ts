import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import { MmmsStoredFile } from '../../models/mmms-file.models';
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
import { InspectionRecord } from '../../models/mmms-maintenance.models';
import { MachineSummary } from '../../models/mmms.models';
@Component({
  selector: 'app-mmms-inspections',
  standalone: false,
  templateUrl: './mmms-inspections.component.html',
  styleUrls: ['./mmms-inspections.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsInspectionsComponent implements OnInit {
  private readonly paginationCleanup = inject(DestroyRef).onDestroy(() => {
    this.pagination.destroy();
  });
  readonly pagination = new MmmsPagination(() => this.load());
  readonly records = signal<InspectionRecord[]>([]);
  readonly machines = signal<MachineSummary[]>([]);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly editorOpen = signal(false);
  readonly selected = signal<InspectionRecord | null>(null);
  draft: Partial<InspectionRecord> = {};
  checklistText = '';
  templates: { name: string; items: string[] }[] = [];
  inspectionTypes: string[] = [];
  results: Record<string, string> = {};
  observations = '';
  attachments: MmmsStoredFile[] = [];
  private readonly facade = inject(MmmsFacadeService);
  ngOnInit(): void {
    this.facade.getSettings().subscribe({
      next: (settings) => {
        this.templates = settings.inspectionChecklists;
        this.inspectionTypes = settings.inspectionTypes;
      },
    });
    this.load();
    this.facade.getMachines().subscribe({
      next: (rows) => this.machines.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  load(): void {
    this.pagination
      .read(
        this.facade.getPage<InspectionRecord>('master-data/inspections', this.pagination.query({})),
      )
      .subscribe({
        next: (rows) => this.records.set(rows),
        error: (error: unknown) => this.fail(error),
      });
  }
  create(): void {
    this.draft = {
      machineId: '',
      type: 'Safety Inspection',
      inspector: '',
      dueAt: new Date().toISOString().slice(0, 10),
    };
    this.checklistText = '';
    this.editorOpen.set(true);
  }
  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.facade
      .createInspection({
        ...this.draft,
        checklist: this.checklistText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.load();
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  inspect(row: InspectionRecord): void {
    this.selected.set(row);
    this.results = { ...row.results };
    this.observations = row.observations;
    this.attachments = row.attachments || [];
  }
  complete(): void {
    const row = this.selected();
    if (!row || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.facade
      .completeInspection(row.id, this.results, this.observations, this.attachments)
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
        'Unable to complete the inspection request.',
    );
  }
}
