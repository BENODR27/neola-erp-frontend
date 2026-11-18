import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MechanicRecord } from '../../models/mmms-mechanic.models';
@Component({
  selector: 'app-mmms-technicians',
  standalone: false,
  templateUrl: './mmms-technicians.component.html',
  styleUrls: ['./mmms-technicians.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsTechniciansComponent implements OnInit {
  readonly pagination = new MmmsPagination();
  readonly rows = signal<MechanicRecord[]>([]);
  readonly search = signal('');
  readonly saving = signal(false);
  readonly error = signal('');
  readonly editorOpen = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly visible = computed(() =>
    this.rows().filter((row) =>
      [row.name, row.employeeNumber, ...row.skillCategories].some((value) =>
        value.toLowerCase().includes(this.search().toLowerCase()),
      ),
    ),
  );
  draft: Partial<MechanicRecord> = {};
  skills = '';
  private readonly facade = inject(MmmsFacadeService);
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.facade.getMechanicRecords().subscribe({
      next: (rows) => this.rows.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  edit(row?: MechanicRecord): void {
    this.selectedId.set(row?.id || null);
    this.draft = row
      ? structuredClone(row)
      : {
          employeeNumber: '',
          name: '',
          email: '',
          phone: '',
          shift: 'Day',
          active: true,
          details: { employmentStatus: 'Active', photo: [] },
        };
    this.skills = row?.skillCategories.join(', ') || '';
    this.editorOpen.set(true);
  }
  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.facade
      .saveMechanicRecord(this.selectedId(), {
        ...this.draft,
        skillCategories: this.skills
          .split(',')
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
  private fail(error: unknown): void {
    this.error.set(
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
        'The mechanic record could not be saved.',
    );
  }
}
