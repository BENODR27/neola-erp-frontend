import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MachineSummary } from '../../models/mmms.models';
import { CalibrationRecord } from '../../models/mmms-administration.models';
@Component({
  selector: 'app-mmms-calibration',
  standalone: false,
  templateUrl: './mmms-calibration.component.html',
  styleUrls: ['./mmms-calibration.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsCalibrationComponent implements OnInit {
  readonly pagination = new MmmsPagination();
  private readonly facade = inject(MmmsFacadeService);
  readonly rows = signal<CalibrationRecord[]>([]);
  readonly machines = signal<MachineSummary[]>([]);
  readonly editorOpen = signal(false);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly selectedId = signal<string | null>(null);
  draft: Partial<CalibrationRecord> = {};
  ngOnInit(): void {
    this.load();
    this.facade.getMachines().subscribe({
      next: (rows) => this.machines.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  load(): void {
    this.facade.getCalibrations().subscribe({
      next: (rows) => this.rows.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  edit(row?: CalibrationRecord): void {
    this.selectedId.set(row?.id || null);
    this.draft = row
      ? { ...row, attachments: [...(row.attachments || [])] }
      : {
          machineId: '',
          type: '',
          dueAt: new Date().toISOString().slice(0, 10),
          agency: '',
          responsiblePerson: '',
          remarks: '',
          attachments: [],
        };
    this.editorOpen.set(true);
  }
  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    const id = this.selectedId();
    const request = id
      ? this.facade.completeCalibration(id, this.draft)
      : this.facade.createCalibration(this.draft);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.editorOpen.set(false);
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
