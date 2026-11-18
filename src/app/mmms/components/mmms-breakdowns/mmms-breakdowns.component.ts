import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MmmsOfflineService } from '../../services/mmms-offline.service';
import { BreakdownRecord } from '../../models/mmms-breakdown.models';
import { MachineSummary } from '../../models/mmms.models';
@Component({
  selector: 'app-mmms-breakdowns',
  standalone: false,
  templateUrl: './mmms-breakdowns.component.html',
  styleUrls: ['./mmms-breakdowns.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsBreakdownsComponent implements OnInit {
  readonly pagination = new MmmsPagination();
  readonly records = signal<BreakdownRecord[]>([]);
  readonly machines = signal<MachineSummary[]>([]);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly editorOpen = signal(false);
  readonly offline = inject(MmmsOfflineService);
  categories = [
    'Electrical Failure',
    'Mechanical Failure',
    'Motor Failure',
    'Bearing Failure',
    'Belt Failure',
    'Pneumatic Failure',
    'Hydraulic Failure',
    'Sensor Failure',
    'Software or Control Failure',
    'Lubrication Issue',
    'Overheating',
    'Physical Damage',
    'Other',
  ];
  pendingFiles: File[] = [];
  captureMedia(event: Event): void {
    this.pendingFiles = Array.from((event.target as HTMLInputElement).files || []);
  }
  draft: Partial<BreakdownRecord> = {};
  private readonly facade = inject(MmmsFacadeService);
  private readonly route = inject(ActivatedRoute);
  ngOnInit(): void {
    this.facade
      .getSettings()
      .subscribe({ next: (settings) => (this.categories = settings.breakdownCategories) });
    this.load();
    this.facade.getMachines().subscribe({
      next: (rows) => this.machines.set(rows),
      error: () =>
        this.error.set(
          'Machine choices are unavailable. Previously opened machine IDs can still be queued offline.',
        ),
    });
    if (this.route.snapshot.queryParamMap.has('machineId')) this.create();
  }
  load(): void {
    this.facade.getBreakdownRecords().subscribe({
      next: (rows) => this.records.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  create(): void {
    this.pendingFiles = [];
    const date = new Date();
    this.draft = {
      machineId: this.route.snapshot.queryParamMap.get('machineId') || '',
      category: 'Mechanical Failure',
      startedAt: new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
      requestId: crypto.randomUUID(),
      details: { description: '', severity: 'Medium', productionImpact: '', attachments: [] },
    };
    this.editorOpen.set(true);
  }
  save(): void {
    if (!navigator.onLine || this.pendingFiles.length) {
      void this.queue();
      return;
    }
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.facade
      .reportBreakdown({
        ...this.draft,
        startedAt: new Date(this.draft.startedAt || Date.now()).toISOString(),
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
  async queue(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    try {
      if (!this.draft.machineId || !this.draft.details?.description)
        throw new Error('Select a machine and describe the breakdown.');
      await this.offline.queueBreakdown(
        { ...this.draft, startedAt: new Date(this.draft.startedAt || Date.now()).toISOString() },
        this.pendingFiles,
      );
      this.editorOpen.set(false);
    } catch (error: unknown) {
      this.error.set(error instanceof Error ? error.message : 'Device storage is unavailable.');
    } finally {
      this.saving.set(false);
    }
  }
  duration(row: BreakdownRecord): string {
    const minutes = Math.max(
      0,
      Math.round(
        (new Date(row.endedAt || Date.now()).getTime() - new Date(row.startedAt).getTime()) / 60000,
      ),
    );
    return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm';
  }
  private fail(error: unknown): void {
    this.error.set(
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
        'The breakdown request failed. You can save a report on this device and synchronize later.',
    );
  }
}
