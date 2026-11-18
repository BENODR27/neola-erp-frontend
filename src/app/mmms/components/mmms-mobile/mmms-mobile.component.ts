import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
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
  readonly pagination = new MmmsPagination();
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
    this.facade.getWorkOrderRecords(true).subscribe({
      next: (rows) => {
        this.error.set('');
        this.tasks.set(rows.filter((row) => !['Closed', 'Cancelled'].includes(row.status)));
      },
      error: () =>
        this.error.set(
          'Live tasks are unavailable. Saved device submissions remain available below.',
        ),
    });
  }
}
