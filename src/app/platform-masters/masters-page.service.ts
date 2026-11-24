import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { MastersFacade, SharedMaster } from '../shared/services/masters/masters.facade';

/** Per-page request lifecycle; each catalog component owns its form and defaults. */
@Injectable()
export class MastersPageService {
  private readonly facade = inject(MastersFacade);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly rows = signal<SharedMaster[]>([]);
  readonly hierarchy = signal<SharedMaster[]>([]);
  readonly parentTypes = signal<Record<string, string[]>>({});
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly lookupError = signal('');
  readonly notice = signal('');
  readonly open = signal(false);
  readonly total = signal(0);
  readonly pages = signal(1);
  readonly page = signal(1);
  canManage = this.auth.hasPermission('MASTERS-MANAGE') || this.auth.hasPermission('MASTERS-ADMIN');
  search = '';
  pageSize = 20;
  draft: Partial<SharedMaster> = {};
  private module = '';
  private unitType = '';
  private generation = 0;

  initialize(module: string, withTypes = false, unitType = '', managePermission = ''): void {
    this.module = module;
    this.unitType = unitType;
    if (managePermission)
      this.canManage =
        this.auth.hasPermission(managePermission) ||
        this.auth.hasPermission('MASTERS-ADMIN') ||
        (unitType !== 'Company' && this.auth.hasPermission('MASTERS-MANAGE'));
    this.load();
    this.loadHierarchy();
    if (withTypes)
      this.facade
        .types()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (value) => this.parentTypes.set(value.parents),
          error: (error) => this.lookupError.set(this.message(error)),
        });
  }
  load(page = 1): void {
    const generation = ++this.generation;
    this.loading.set(true);
    this.error.set('');
    this.facade
      .page(this.module, page, this.search, this.pageSize, { unitType: this.unitType })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (generation === this.generation) this.loading.set(false);
        }),
      )
      .subscribe({
        next: (result) => {
          if (generation !== this.generation) return;
          if (page > Math.max(1, result.totalPages)) {
            this.load(Math.max(1, result.totalPages));
            return;
          }
          this.rows.set(result.items);
          this.total.set(result.total);
          this.pages.set(Math.max(1, result.totalPages));
          this.page.set(result.page);
        },
        error: (error) => {
          if (generation === this.generation) {
            this.rows.set([]);
            this.total.set(0);
            this.pages.set(1);
            this.error.set(this.message(error));
          }
        },
      });
  }
  loadHierarchy(page = 1, previous: SharedMaster[] = []): void {
    if (page === 1) this.lookupError.set('');
    this.facade
      .page('hierarchy', page, '', 100, { lookupFor: this.unitType })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          const rows = [...previous, ...result.items];
          if (page < result.totalPages) this.loadHierarchy(page + 1, rows);
          else this.hierarchy.set(rows);
        },
        error: (error) => this.lookupError.set(this.message(error)),
      });
  }
  begin(draft: Partial<SharedMaster>): void {
    this.draft = { ...draft };
    this.error.set('');
    this.notice.set('');
    this.open.set(true);
  }
  close(): void {
    if (!this.saving()) this.open.set(false);
  }
  save(): void {
    if (!this.canManage || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.facade
      .save(this.draft.id || null, this.draft)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.open.set(false);
          this.notice.set('Changes saved. All applications will use the updated shared record.');
          this.load(this.page());
          this.loadHierarchy();
        },
        error: (error) => this.error.set(this.message(error)),
      });
  }
  companies(): SharedMaster[] {
    return this.hierarchy().filter((row) => row.unitType === 'Company' && row.status === 'Active');
  }
  factories(): SharedMaster[] {
    if (!this.draft.organizationId) return [];
    return this.hierarchy().filter(
      (row) =>
        row.unitType === 'Factory' &&
        row.status === 'Active' &&
        row.organizationId === this.draft.organizationId,
    );
  }
  label(id: string | null | undefined): string {
    return id ? this.hierarchy().find((row) => row.id === id)?.name || id : 'Platform-wide';
  }
  private message(error: unknown): string {
    return (
      (error as { error?: { message?: string } })?.error?.message ||
      'Unable to complete this request. Please try again.'
    );
  }
}
