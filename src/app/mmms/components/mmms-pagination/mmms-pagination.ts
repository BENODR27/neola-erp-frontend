import { signal } from '@angular/core';
import { defer, finalize, map, Observable, Subject, takeUntil } from 'rxjs';
import type { MmmsPage, MmmsPageQuery } from '../../models/mmms-page.models';
export const MMMS_PAGE_SIZES = [10, 25, 50, 100] as const;
/** Remote records use server totals; device-only queues retain local slicing. */
export class MmmsPagination {
  private readonly reload?: () => void;
  constructor(reload?: () => void) {
    this.reload = reload;
  }
  readonly total = signal(0);
  readonly loading = signal(false);
  private readonly cancelled = new Subject<void>();
  private requestId = 0;
  private destroyed = false;
  private filterTimer?: ReturnType<typeof setTimeout>;
  filter(): void {
    this.page.set(1);
    this.cancelled.next();
    clearTimeout(this.filterTimer);
    this.filterTimer = setTimeout(() => {
      if (!this.destroyed) this.reload?.();
    }, 250);
  }
  destroy(): void {
    this.destroyed = true;
    clearTimeout(this.filterTimer);
    this.cancelled.next();
    this.cancelled.complete();
  }
  query(filters: MmmsPageQuery = {}): MmmsPageQuery {
    return { ...filters, page: this.page(), pageSize: this.pageSize() };
  }
  read<T>(source: Observable<MmmsPage<T>>): Observable<T[]> {
    return defer(() => {
      this.cancelled.next();
      const id = ++this.requestId;
      this.loading.set(true);
      return source.pipe(
        takeUntil(this.cancelled),
        map((response) => {
          this.total.set(response.total);
          const lastPage = this.pageCount(response.total);
          if (this.page() > lastPage) {
            this.page.set(lastPage);
            queueMicrotask(() => {
              if (!this.destroyed) this.reload?.();
            });
          }
          return response.result;
        }),
        finalize(() => {
          if (id === this.requestId) this.loading.set(false);
        }),
      );
    });
  }
  go(page: number, total: number): void {
    this.page.set(Math.max(1, Math.min(page, this.pageCount(total))));
    this.reload?.();
  }
  readonly page = signal(1);
  readonly pageSize = signal(25);
  currentPage(total: number): number {
    return Math.min(Math.max(1, this.page()), this.pageCount(total));
  }
  pageCount(total: number): number {
    return Math.max(1, Math.ceil(total / this.pageSize()));
  }
  slice<T>(rows: readonly T[]): T[] {
    if (this.reload) return [...rows];
    const start = (this.currentPage(rows.length) - 1) * this.pageSize();
    return rows.slice(start, start + this.pageSize());
  }
  reset(): void {
    this.page.set(1);
    this.reload?.();
  }
  resize(size: number): void {
    if (MMMS_PAGE_SIZES.some((value) => value === size)) {
      this.pageSize.set(size);
      this.reset();
    }
  }
}
