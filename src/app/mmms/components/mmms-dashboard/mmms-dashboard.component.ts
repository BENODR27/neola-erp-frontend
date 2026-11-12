import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MmmsDashboardData, MachineStatus, WorkOrderStatus } from '../../models/mmms.models';

@Component({
  selector: 'app-mmms-dashboard',
  standalone: false,
  templateUrl: './mmms-dashboard.component.html',
  styleUrl: './mmms-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsDashboardComponent implements OnInit {
  readonly data = signal<MmmsDashboardData | null>(null);
  readonly isLoading = signal(true);

  constructor(private readonly facade: MmmsFacadeService) {}

  get activePeriod() {
    return this.facade.selectedPeriod;
  }
  ngOnInit(): void {
    this.loadDashboard();
  }
  loadDashboard(): void {
    this.isLoading.set(true);
    this.facade
      .getDashboardData()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((data) => this.data.set(data));
  }
  setPeriod(period: '7d' | '30d' | '90d'): void {
    this.facade.selectedPeriod.set(period);
  }
  machineStatusClass(status: MachineStatus): string {
    return status.toLowerCase().replaceAll(' ', '-');
  }
  workOrderStatusClass(status: WorkOrderStatus): string {
    return status.toLowerCase().replaceAll(' ', '-');
  }
  maxDowntime(): number {
    return Math.max(...(this.data()?.downtimeByDay.map((item) => item.hours) ?? [1]));
  }
}
