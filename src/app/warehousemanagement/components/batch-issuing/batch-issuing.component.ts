import { Component , signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import { StateManagerService } from '../../services/state-manager/state-manager.service';
@Component({
  selector: 'app-batch-issuing',
  standalone: false,
  templateUrl: './batch-issuing.component.html',
  styleUrl: './batch-issuing.component.css',
})
export class BatchIssuingComponent {
  form!: FormGroup;
  readonly fabrics = signal<any[]>([])
  originalFabrics: any[] = [];

  readonly warehouses = signal<any[]>([])
  readonly factories = signal<any[]>([])

  selectedIds: Set<number> = new Set();
  readonly isAllSelected = signal(false)

  columnFilters: Record<string, string> = {};

  maxIssueCount: number = 0;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    public authService: AuthService,
    private notify: NotificationService,
    private ls: LocalStorageService,
    private state: StateManagerService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      status: ['Pending', Validators.required],
      fromDate: [''],
      toDate: [''],
      factoryId: [''],
      wareHouseId: [''],
    });

    this.state.getWarehouses$().subscribe((w) => (this.warehouses.set(w)));
    this.fetchAllFactories();
  }

  fetchAllFactories() {
    this.api.getDatas(WAC.API_URL + WAC.Factory).subscribe((res) => {
      this.factories.set(res.result || []);
    });
  }

  fetchFabricCollections() {
    const v = this.form.value;
    if (!v.factoryId || !v.wareHouseId) {
      this.notify.info('Info', 'Select required fields');
      return;
    }

    const query = `?facility=${v.factoryId}&wareHouseName=${v.wareHouseId}&status=${v.status}`;
    this.api
      .getDatasByFilter(query, WAC.API_URL + WAC.IssueFabricFactory)
      .subscribe((res) => {
        this.originalFabrics = res.result || [];
        this.fabrics.set([...this.originalFabrics]);
        this.resetSelection();
      });
  }

  applyFilter(event: Event, field: string) {
    this.columnFilters[field] = (
      event.target as HTMLInputElement
    ).value.toLowerCase();

    this.fabrics.set(this.originalFabrics.filter((row) =>
      Object.keys(this.columnFilters).every((key) => {
        if (!this.columnFilters[key]) return true;

        let value;
        switch (key) {
          case 'fabricRef':
            value = row.fabricCollection?.fabricRef;
            break;
          case 'palletId':
            value = row.fabricCollection?.palletId;
            break;
          case 'colorName':
            value = row.fabricCollection?.colorName;
            break;
          default:
            value = row[key];
        }
        return value
          ?.toString()
          .toLowerCase()
          .includes(this.columnFilters[key]);
      })
    ));

    this.resetSelection();
  }

  toggleSelectAll() {
    this.isAllSelected.set(!this.isAllSelected());
    this.isAllSelected()
      ? this.fabrics().forEach((r) => this.selectedIds.add(r.id))
      : this.selectedIds.clear();
  }

  toggleSelect(id: number) {
    this.selectedIds.has(id)
      ? this.selectedIds.delete(id)
      : this.selectedIds.add(id);
    this.isAllSelected.set(this.selectedIds.size === this.fabrics().length);
  }

  resetSelection() {
    this.selectedIds.clear();
    this.isAllSelected.set(false);
  }

  selectFirstN() {
    const n = Math.min(this.maxIssueCount, 100, this.fabrics().length);
    this.selectedIds.clear();
    for (let i = 0; i < n; i++) {
      this.selectedIds.add(this.fabrics()[i].id);
    }
    this.isAllSelected.set(this.selectedIds.size === this.fabrics().length);
  }

  issueAll(status: string) {
    if (this.selectedIds.size === 0) {
      this.notify.info('Info', 'Please select at least one fabric to issue');
      return;
    }

    const selectedFabrics = this.fabrics().filter((fabric) =>
      this.selectedIds.has(fabric.id)
    );

    const fabRequests = selectedFabrics.map((row) => ({
      id: row.id,
      status,
      issuedBy: this.ls.getItem('currentEmpId'),
      remarks: row?.remarks ?? '',
      fabricCollectionId: row?.fabricCollectionId ?? row?.fabricCollection?.id,
      issueQty: row?.issueQty ?? 0,
    }));

    const BATCH_SIZE = 100;
    const batches = this.chunkArray(fabRequests, BATCH_SIZE);

    let successCount = 0;
    let failureCount = 0;

    const sendBatch = (index: number) => {
      if (index >= batches.length) {
        this.notify.success(
          'Completed',
          `Processed successfully: ${successCount}, Failed: ${failureCount}`,
          4000
        );
        this.maxIssueCount = 0;
        this.resetSelection();
        this.fetchFabricCollections();
        return;
      }

      this.api
        .updateBatch(
          { items: batches[index] },
          WAC.API_URL + WAC.IssueFabricFactory
        )
        .subscribe({
          next: (response) => {
            if (response?.status === 200) {
              successCount += batches[index].length;
            } else {
              failureCount += batches[index].length;
            }
            sendBatch(index + 1);
          },
          error: (err) => {
            failureCount += batches[index].length;
            console.error('Batch failed:', index, err);
            sendBatch(index + 1);
          },
        });
    };

    sendBatch(0);
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
