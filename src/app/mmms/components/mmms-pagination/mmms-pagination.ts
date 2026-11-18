import { signal } from '@angular/core';
export const MMMS_PAGE_SIZES = [10, 25, 50, 100] as const;
/** Filtering and sorting remain in the feature; this state only controls its visible page. */
export class MmmsPagination {
  readonly page = signal(1);
  readonly pageSize = signal(25);
  currentPage(total: number): number {
    return Math.min(Math.max(1, this.page()), this.pageCount(total));
  }
  pageCount(total: number): number {
    return Math.max(1, Math.ceil(total / this.pageSize()));
  }
  slice<T>(rows: readonly T[]): T[] {
    const start = (this.currentPage(rows.length) - 1) * this.pageSize();
    return rows.slice(start, start + this.pageSize());
  }
  reset(): void {
    this.page.set(1);
  }
  resize(size: number): void {
    if (MMMS_PAGE_SIZES.some((value) => value === size)) {
      this.pageSize.set(size);
      this.reset();
    }
  }
}
