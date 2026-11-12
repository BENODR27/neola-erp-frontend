import { Component , signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BarcodeFormat } from '@zxing/browser';
import { WMS_API_CONSTANTS as WAC } from '../../../constants/wms-api.constants';
import { ApiService } from '../../../../shared/services/api/api.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../../shared/services/local-storage/local-storage.service';
import { Store } from '@ngrx/store';
import { selectWarehouses } from '../../../store/warehouse/warehouse.selectors';
import { loadWarehouses } from '../../../store/warehouse/warehouse.actions';
import { StateManagerService } from '../../../services/state-manager/state-manager.service';

interface FacilityIssueSummary {
  invoiceNo: string;
  styleColor: string;
  ocPo: string;
  fabricRef: string;
  quantityIssued: number;
}

@Component({
  selector: 'app-issue-fabric',
  standalone: false,
  templateUrl: './issue-fabric.component.html',
  styleUrl: './issue-fabric.component.css',
})
export class IssueFabricComponent {
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  readonly isScannerActive = signal<boolean>(false)
  scanFor: string = '';
  readonly dataFetched = signal<boolean>(false)
  readonly fabrics = signal<any[]>([])
  readonly facilityIssueRequests = signal<any[]>([])
  readonly isLoadingFacilityIssues = signal(false)
  readonly factories = signal<any[]>([])
  readonly warehouses = signal<any[]>([])
  form: FormGroup;
  selectedWarehouseId: string = '';
  selectedWarehouseName: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private storageService: LocalStorageService,
    private stateManager: StateManagerService,
  ) {
    this.form = this.formBuilder.group({
      palletId: [''],
      facility: ['', Validators.required],
      warehouseId: [
        this.storageService.getItem('selectedWarehouse') ?? '',
        Validators.required,
      ],
    });
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses.set(warehouses);
      const selectedWarehouse = this.warehouses().find(
        (w) => w.id == this.storageService.getItem('selectedWarehouse'),
      );
      this.selectedWarehouseName = selectedWarehouse
        ? selectedWarehouse.wareHouseName
        : '';
    });
  }
  ngOnInit(): void {
    this.fetchAllFactories();
  }
  fetchFabricCollections(): void {
    const palletId = this.form.get('palletId')?.value;
    const wareHouseId =
      this.selectedWarehouseId || this.form.get('warehouseId')?.value;
    if (wareHouseId) {
      this.apiService
        .getDatasByFilter(
          `?wareHouseId=${encodeURIComponent(wareHouseId)}&status=Quarantine` +
            (palletId ? `&palletId=${encodeURIComponent(palletId)}` : ''),
          WAC.API_URL + WAC.FabricCollection,
        )
        .subscribe({
          next: (response) => {
            this.fabrics.set(Array.isArray(response?.result)
              ? response.result
              : []);
            this.dataFetched.set(true);
            if (response?.status !== 200) {
              this.notificationService.error(
                'Unable to load rolls',
                response?.message ?? 'The fabric roll response was invalid.',
              );
            }
          },
          error: (error) => {
            this.fabrics.set([]);
            this.dataFetched.set(true);
            this.notificationService.error(
              'Unable to load rolls',
              error?.error?.message ??
                error?.message ??
                'An error occurred while loading fabric rolls.',
            );
          },
        });
    } else {
      this.notificationService.info('Info', 'Select Warehouse');
    }
  }

  toggleScanner(scanFor: string): void {
    this.scanFor = scanFor;
    this.isScannerActive.set(!this.isScannerActive());
  }

  onScanSuccess(data: string): void {
    if (data && this.scanFor == 'palletId') {
      this.form.patchValue({ palletId: data });
    } else {
    }
  }

  onFacilityChange(): void {
    this.facilityIssueRequests.set([]);
    this.fetchFacilityIssueRequests();
  }

  get facilityIssueSummary(): FacilityIssueSummary[] {
    const summary = new Map<string, FacilityIssueSummary>();
    for (const request of this.facilityIssueRequests()) {
      const collection = request?.fabricCollection ?? {};
      const invoiceNo = String(request?.invoiceNo ?? '-');
      const styleColor = `${collection?.styleName || '-'} / ${collection?.colorName || '-'}`;
      const ocPo = `${request?.ocNo || '-'} / ${request?.poNo || '-'}`;
      const fabricRef = String(collection?.fabricRef ?? '-');
      const key = JSON.stringify([invoiceNo, styleColor, ocPo, fabricRef]);
      const existing = summary.get(key);
      const quantity = Number(request?.issueQty) || 0;

      if (existing) {
        existing.quantityIssued += quantity;
      } else {
        summary.set(key, {
          invoiceNo,
          styleColor,
          ocPo,
          fabricRef,
          quantityIssued: quantity,
        });
      }
    }
    return Array.from(summary.values());
  }

  get myFacilityIssueRequests(): any[] {
    const employeeId = this.storageService.getItem('currentEmpId');
    if (employeeId == null || String(employeeId).trim() === '') {
      return [];
    }

    return this.facilityIssueRequests().filter(
      (request) => String(request?.requestedBy ?? '') === String(employeeId),
    );
  }

  fetchFacilityIssueRequests(): void {
    const facility = String(this.form.get('facility')?.value ?? '').trim();
    if (!facility) {
      this.facilityIssueRequests.set([]);
      return;
    }

    const today = new Date();
    const todayDate = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');

    this.isLoadingFacilityIssues.set(true);
    this.apiService
      .getDatasByFilter(
        `?facility=${encodeURIComponent(facility)}&fromDate=${todayDate}&toDate=${todayDate}&sortBy=createdAt&sortOrder=DESC`,
        WAC.API_URL + WAC.IssueFabricFactory,
      )
      .subscribe({
        next: (response) => {
          if (
            String(this.form.get('facility')?.value ?? '').trim() !== facility
          ) {
            return;
          }
          this.isLoadingFacilityIssues.set(false);
          if (response?.status !== 200 || !Array.isArray(response?.result)) {
            this.facilityIssueRequests.set([]);
            this.notificationService.error(
              'Unable to load facility issues',
              response?.message ?? 'The issue request response was invalid.',
            );
            return;
          }
          this.facilityIssueRequests.set(response.result);
        },
        error: (error) => {
          if (
            String(this.form.get('facility')?.value ?? '').trim() !== facility
          ) {
            return;
          }
          this.isLoadingFacilityIssues.set(false);
          this.facilityIssueRequests.set([]);
          this.notificationService.error(
            'Unable to load facility issues',
            error?.error?.message ??
              error?.message ??
              'An error occurred while loading issue requests.',
          );
        },
      });
  }

  onissueFabaricToFactory(selectedCollectionId: number, data: any): void {
    const balanceQty = Number(data?.balanceQty);
    if (!Number.isFinite(balanceQty) || balanceQty <= 0) {
      this.notificationService.info(
        'No balance available',
        'This roll has no remaining quantity to issue.',
      );
      return;
    }

    if (this.form.valid) {
      const payload = {
        fabricCollectionId: selectedCollectionId,
        facility: this.form.get('facility')?.value,
        wareHouseId:
          this.selectedWarehouseId || this.form.get('warehouseId')?.value,
        invoiceNo: data?.invoiceNo,
        poNo: data?.poNo,
        shadeLot: data?.shadeLot,
        ocNo: data?.ocNo,
        issueQty: balanceQty,
        status: 'pending',
      };

      this.apiService
        .dataCustomGet(payload, WAC.API_URL + WAC.IssueFabricFactory)
        .subscribe({
          next: (response: any) => {
            if (response?.result != null) {
              this.removeFabricFromAvailableList(selectedCollectionId);
              this.notificationService.info(
                'Duplicate request',
                'An issue request already exists for this roll.',
                2000,
              );
              return;
            }

            this.apiService
              .addData(
                {
                  ...payload,
                  warehouseName: this.selectedWarehouseName,
                  requestedBy: this.storageService.getItem('currentEmpId'),
                  issuedDate: new Date().toISOString(),
                },
                WAC.API_URL + WAC.IssueFabricFactory,
              )
              .subscribe({
                next: (createResponse: any) => {
                  if (createResponse?.status !== 200) {
                    this.notificationService.error(
                      'Issue request failed',
                      createResponse?.message ??
                        'The issue request was not confirmed. The roll remains in the available list.',
                    );
                    return;
                  }

                  this.removeFabricFromAvailableList(selectedCollectionId);
                  this.notificationService.success(
                    'success',
                    `Full roll issue requested: ${balanceQty}.`,
                    2000,
                  );
                  this.fetchFacilityIssueRequests();
                },
                error: (error) => {
                  this.notificationService.error(
                    'Issue request failed',
                    error?.error?.message ??
                      error?.message ??
                      'The full roll issue request could not be submitted.',
                  );
                },
              });
          },
          error: (error) => {
            this.notificationService.error(
              'Unable to check issue request',
              error?.error?.message ??
                error?.message ??
                'Could not verify whether a request already exists.',
            );
          },
        });
    } else {
      this.notificationService.info(
        'Selection required',
        'Select a warehouse and factory before requesting an issue.',
        2000,
      );
    }
  }

  private removeFabricFromAvailableList(collectionId: number): void {
    this.fabrics.set(this.fabrics().filter(
      (fabric) => String(fabric?.id) !== String(collectionId),
    ));
  }

  fetchAllFactories() {
    this.apiService.getDatas(WAC.API_URL + WAC.Factory).subscribe({
      next: (response) => {
        this.factories.set(response.result);
      },
      error: (error) => {
        this.notificationService.error(
          'Unable to load factories',
          error?.error?.message ??
            error?.message ??
            'An error occurred while loading factories.',
        );
      },
    });
  }

  onWarehouseChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const selectedId = selectElement.value;
    const selectedWarehouse = this.warehouses().find((w) => w.id == selectedId);
    this.selectedWarehouseName = selectedWarehouse
      ? selectedWarehouse.wareHouseName
      : '';
  }
}
