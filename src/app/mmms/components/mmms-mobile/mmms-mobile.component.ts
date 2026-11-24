import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MmmsOfflineService } from '../../services/mmms-offline.service';
import { WorkOrderRecord } from '../../models/mmms-work-order.models';
@Component({
  selector: 'app-mmms-mobile',
  standalone: false,
  templateUrl: './mmms-mobile.component.html',
  styleUrls: ['./mmms-mobile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsMobileComponent implements OnInit {
  private readonly paginationCleanup = inject(DestroyRef).onDestroy(() => {
    this.pagination.destroy();
  });
  readonly pagination = new MmmsPagination(() => this.loadTasks());
  readonly queuePagination = new MmmsPagination();
  readonly offline = inject(MmmsOfflineService);
  readonly tasks = signal<WorkOrderRecord[]>([]);
  readonly error = signal('');
  private readonly facade = inject(MmmsFacadeService);
  ngOnInit(): void {
    void this.offline.load();
    this.loadTasks();
  }
  loadTasks(): void {
    this.error.set('');
    this.pagination
      .read(
        this.facade.getPage<WorkOrderRecord>(
          'work-orders',
          this.pagination.query({ personal: 'true', activeTasks: 'true' }),
        ),
      )
      .subscribe({
        next: (rows) => {
          this.error.set('');
          this.tasks.set(rows);
        },
        error: () =>
          this.error.set(
            'Live tasks are unavailable. Saved device submissions remain available below.',
          ),
      });
  }
}
