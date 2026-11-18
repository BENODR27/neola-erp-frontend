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
import { ProductionImpactSummary } from '../../models/mmms.models';
import { MmmsFacadeService } from '../../services/mmms-facade.service';

@Component({
  selector: 'app-mmms-production-integration',
  standalone: false,
  templateUrl: './mmms-production-integration.component.html',
  styleUrls: ['./mmms-production-integration.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsProductionIntegrationComponent implements OnInit {
  readonly pagination = new MmmsPagination();
  readonly rows = signal<ProductionImpactSummary[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly query = signal('');
  readonly visible = computed(() =>
    this.rows().filter((row) =>
      [row.order, row.line, row.machine, row.recovery].some((value) =>
        value.toLowerCase().includes(this.query().toLowerCase()),
      ),
    ),
  );
  private readonly facade = inject(MmmsFacadeService);
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.facade
      .getProductionImpact()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.rows.set(rows),
        error: () =>
          this.error.set(
            'Production impact could not be loaded. Retry when the maintenance API is available.',
          ),
      });
  }
}
