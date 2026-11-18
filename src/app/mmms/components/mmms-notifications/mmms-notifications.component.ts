import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  DestroyRef,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MaintenanceNotification } from '../../models/mmms-administration.models';
@Component({
  selector: 'app-mmms-notifications',
  standalone: false,
  templateUrl: './mmms-notifications.component.html',
  styleUrls: ['./mmms-notifications.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsNotificationsComponent implements OnInit {
  readonly pagination = new MmmsPagination();
  private readonly facade = inject(MmmsFacadeService);
  readonly rows = signal<MaintenanceNotification[]>([]);
  readonly error = signal('');
  readonly saving = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  ngOnInit(): void {
    this.load();
    interval(30000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }
  load(): void {
    this.facade.getNotifications().subscribe({
      next: (rows) => this.rows.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  markRead(row: MaintenanceNotification): void {
    this.facade
      .readNotification(row.id)
      .subscribe({ next: () => this.load(), error: (error: unknown) => this.fail(error) });
  }
  delivery(row: MaintenanceNotification): string {
    return (
      Object.entries(row.delivery || {})
        .map(([channel, result]) => channel + ': ' + result.status)
        .join(', ') || 'In-app'
    );
  }
  private fail(error: unknown): void {
    this.error.set(
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
        'Unable to complete the maintenance request.',
    );
  }
}
