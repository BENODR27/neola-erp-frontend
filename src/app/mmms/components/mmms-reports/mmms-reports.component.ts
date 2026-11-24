import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import { buildMaintenanceExcel, buildMaintenancePdf } from './mmms-report-export';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { finalize, firstValueFrom, map } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MaintenanceReport, ReportFilter } from '../../models/mmms-administration.models';
@Component({
  selector: 'app-mmms-reports',
  standalone: false,
  templateUrl: './mmms-reports.component.html',
  styleUrls: ['./mmms-reports.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsReportsComponent implements OnInit {
  private readonly paginationCleanup = inject(DestroyRef).onDestroy(() => {
    this.pagination.destroy();
  });
  readonly pagination = new MmmsPagination(() => this.load());
  readonly catalog = signal<{ id: string; title: string }[]>([]);
  readonly report = signal<MaintenanceReport | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly sortColumn = signal('');
  readonly descending = signal(false);
  readonly columns = signal<string[]>([]);
  readonly allColumns = computed(() => [
    ...(this.report()?.availableColumns || [
      ...new Set((this.report()?.rows || []).flatMap((row) => Object.keys(row))),
    ]),
  ]);
  readonly sortedRows = computed(() => this.report()?.rows || []);
  readonly visible = computed(() => this.pagination.slice(this.sortedRows()));
  readonly exportFile = signal<{ url: string; name: string } | null>(null);
  readonly auth = inject(AuthService);
  private readonly facade = inject(MmmsFacadeService);
  reportName = 'machine-master';
  filter: ReportFilter = {
    from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
    machineId: '',
    department: '',
    floor: '',
    category: '',
  };
  ngOnInit(): void {
    this.facade.getReportCatalog().subscribe({
      next: (rows) => this.catalog.set(rows),
      error: (error: unknown) => this.fail(error),
    });
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.pagination
      .read(
        this.facade
          .getReport(
            this.reportName,
            this.filter,
            false,
            this.pagination.query({
              sortBy: this.sortColumn(),
              sortDirection: this.descending() ? 'desc' : 'asc',
            }),
          )
          .pipe(
            map((report) => ({
              result: [report],
              total: report.total ?? report.rows.length,
              page: report.page ?? 1,
              pageSize: report.pageSize ?? 25,
              totalPages: report.totalPages ?? 1,
            })),
          ),
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ([report]) => {
          this.report.set(report);
          if (
            !this.columns().length ||
            !this.columns().every((column) => this.allColumns().includes(column))
          )
            this.columns.set(this.allColumns().slice(0, 10));
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  cell(value: unknown): string {
    return value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
  }
  toggleColumn(column: string, checked: boolean): void {
    this.columns.update((columns) =>
      checked ? [...columns, column] : columns.filter((item) => item !== column),
    );
  }
  sort(column: string): void {
    this.descending.set(this.sortColumn() === column ? !this.descending() : false);
    this.sortColumn.set(column);
    this.pagination.reset();
  }
  async download(format: 'xlsx' | 'pdf'): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const report = await firstValueFrom(
        this.facade.getReport(this.reportName, this.filter, true, {
          sortBy: this.sortColumn(),
          sortDirection: this.descending() ? 'desc' : 'asc',
        }),
      );
      const columns = this.columns();
      const rows = report.rows.map((row) => columns.map((column) => this.cell(row[column])));
      const bytes =
        format === 'xlsx'
          ? await buildMaintenanceExcel(report.title, report.generatedAt, columns, rows)
          : await buildMaintenancePdf(report.title, columns, rows);
      const url = URL.createObjectURL(
        new Blob([bytes as BlobPart], {
          type:
            format === 'xlsx'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'application/pdf',
        }),
      );
      const previous = this.exportFile();
      if (previous) URL.revokeObjectURL(previous.url);
      const name = this.reportName + '.' + format;
      this.exportFile.set({ url, name });
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
    } catch (error: unknown) {
      this.fail(error);
      if (error instanceof Error) this.error.set(error.message);
    } finally {
      this.loading.set(false);
    }
  }
  private fail(error: unknown): void {
    this.error.set(
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
        'The report could not be generated.',
    );
  }
}
