import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MmmsPagination, MMMS_PAGE_SIZES } from './mmms-pagination';
@Component({
  selector: 'app-mmms-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mmms-pagination.component.html',
  styleUrls: ['./mmms-pagination.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsPaginationComponent {
  @Input({ required: true }) pager!: MmmsPagination;
  @Input({ required: true }) total = 0;
  @Input() label = 'Records';
  readonly sizes = MMMS_PAGE_SIZES;
  first(): number {
    return this.total ? (this.pager.currentPage(this.total) - 1) * this.pager.pageSize() + 1 : 0;
  }
  last(): number {
    return Math.min(this.total, this.pager.currentPage(this.total) * this.pager.pageSize());
  }
  go(page: number): void {
    this.pager.page.set(Math.max(1, Math.min(page, this.pager.pageCount(this.total))));
  }
}
