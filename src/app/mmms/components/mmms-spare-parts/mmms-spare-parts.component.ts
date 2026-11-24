import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import {
  InventoryPart,
  StockTransaction,
  StockTransactionDraft,
} from '../../models/mmms-maintenance.models';
import { WorkOrderSummary } from '../../models/mmms.models';
@Component({
  selector: 'app-mmms-spare-parts',
  standalone: false,
  templateUrl: './mmms-spare-parts.component.html',
  styleUrls: ['./mmms-spare-parts.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsSparePartsComponent implements OnInit {
  private readonly paginationCleanup = inject(DestroyRef).onDestroy(() => {
    this.pagination.destroy();
    this.historyPagination.destroy();
  });
  readonly pagination = new MmmsPagination(() => this.load());
  readonly historyPagination = new MmmsPagination(() => this.loadHistoryPage());
  readonly parts = signal<InventoryPart[]>([]);
  readonly destinations = signal<InventoryPart[]>([]);
  readonly orders = signal<WorkOrderSummary[]>([]);
  readonly transactions = signal<StockTransaction[]>([]);
  readonly selected = signal<InventoryPart | null>(null);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly loading = signal(false);
  readonly search = signal('');
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly visible = computed(() => this.parts());
  readonly lowStock = computed(
    () =>
      this.parts().filter((part) => part.stockQuantity - part.reservedQuantity <= part.reorderLevel)
        .length,
  );
  categories: string[] = [];
  units: string[] = [];
  draft: Partial<InventoryPart> = {};
  transaction: StockTransactionDraft = this.newTransaction();
  private readonly facade = inject(MmmsFacadeService);
  ngOnInit(): void {
    this.facade.getStockDestinations().subscribe({
      next: (rows) => this.destinations.set(rows),
      error: (error: unknown) => this.fail(error),
    });
    this.facade.getSettings().subscribe({
      next: (settings) => {
        this.categories = settings.sparePartCategories;
        this.units = settings.unitsOfMeasurement;
      },
    });
    this.load();
    this.facade.getWorkOrders().subscribe({
      next: (rows) =>
        this.orders.set(
          rows.filter((row) => !['Closed', 'Cancelled', 'Verified'].includes(row.status)),
        ),
    });
  }
  load(): void {
    this.loading.set(true);
    this.pagination
      .read(
        this.facade.getPage<InventoryPart>(
          'spare-parts',
          this.pagination.query({ search: this.search() }),
        ),
      )
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => this.parts.set(rows),
        error: (error: unknown) => this.fail(error),
      });
  }
  edit(part?: InventoryPart): void {
    this.editingId.set(part?.id || null);
    this.draft = part
      ? { ...part, details: { ...part.details } }
      : {
          name: '',
          category: '',
          reorderLevel: 0,
          unitCost: 0,
          supplier: '',
          details: { partCode: '', storageLocation: '', unit: 'Each' },
        };
    this.editorOpen.set(true);
  }
  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.facade
      .saveInventoryPart(this.editingId(), this.draft)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.load();
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  view(part: InventoryPart): void {
    this.historyPagination.page.set(1);
    this.selected.set(part);
    this.transaction = this.newTransaction();
    this.historyPagination
      .read(
        this.facade.getPage<StockTransaction>(
          `spare-parts/${part.id}/transactions`,
          this.historyPagination.query(),
        ),
      )
      .subscribe({
        next: (rows) => this.transactions.set(rows),
        error: (error: unknown) => this.fail(error),
      });
  }
  post(): void {
    const part = this.selected();
    if (!part || this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.facade
      .postStockTransaction(part.id, this.transaction)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.selected.set(null);
          this.transaction = this.newTransaction();
          this.load();
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  private newTransaction(): StockTransactionDraft {
    return { requestId: crypto.randomUUID(), type: 'Receipt', quantity: 1, reason: '' };
  }
  loadHistoryPage(): void {
    const id = this.selected()?.id;
    if (!id) return;
    this.historyPagination
      .read(
        this.facade.getPage<StockTransaction>(
          `spare-parts/${id}/transactions`,
          this.historyPagination.query(),
        ),
      )
      .subscribe({
        next: (rows) => this.transactions.set(rows),
        error: (error: unknown) => this.fail(error),
      });
  }
  private fail(error: unknown): void {
    this.error.set(
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
        'Unable to complete the inventory request.',
    );
  }
}
