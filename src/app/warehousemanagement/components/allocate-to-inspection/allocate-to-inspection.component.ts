import { Component , signal} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BarcodeFormat } from '@zxing/browser';
import { ApiService } from '../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import { CustomApiService } from '../../services/custom-api.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { StateManagerService } from '../../services/state-manager/state-manager.service';

@Component({
  selector: 'app-allocate-to-inspection',
  standalone: false,
  templateUrl: './allocate-to-inspection.component.html',
  styleUrl: './allocate-to-inspection.component.css',
})
export class AllocateToInspectionComponent {
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  readonly isScannerActive = signal<boolean>(false)
  scanFor: string = '';
  dataFetched: boolean = false;
  readonly fabrics = signal<any[]>([])
  inputIssueQty: { [key: string]: number } = {};
  readonly warehouses = signal<any[]>([])
  form: FormGroup; // Reactive form instance
  selectedIds: Set<number> = new Set();
  readonly isAllSelected = signal(false)
  ocNos: Set<string> = new Set();
  lotNos: Set<string> = new Set();

  constructor(
    private formBuilder: FormBuilder,
    private apiService: CustomApiService,
    public authService: AuthService,
    private localStorageService: LocalStorageService,
    private notificationService: NotificationService,
    private stateManager: StateManagerService
  ) {
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses.set(warehouses);
    });
    this.form = this.formBuilder.group({
      ocNo: [''],
      lotNo: [''],
      fabricId: [],
      wareHouseId: [
        this.localStorageService.getItem('selectedWarehouse') ?? '',
      ],
    });
  }
  toggleScanner(scanFor: string): void {
    console.log(scanFor);
    this.scanFor = scanFor;
    this.isScannerActive.set(!this.isScannerActive());
  }
  setWarehouse() {
    this.localStorageService.setItem(
      'wareHouseId',
      this.form.get('wareHouseId')?.value
    );
  }

  entryfabDetails(): void {
    const data = this.form.get('fabricId')?.value;
    this.setFormData(data);
  }
  setFormData(data: any) {
    this.form.patchValue({ fabricId: data });

    const segments = data?.split('#$@');
    if (segments && segments.length >= 9) {
      this.form.patchValue({
        ocNo: segments[1].replace(/#$@/g, '') ?? '',
        poNo: segments[4].replace(/#$@/g, '') ?? '',
        lotNo: segments[0].replace(/#$@/g, '') ?? '',
      });
    }
  }

  fetchFabricCollections(): void {
    const ocNo = this.form.get('ocNo')?.value;
    const shadeLot = this.form.get('lotNo')?.value;
    const wareHouseId = this.form.get('wareHouseId')?.value;
    if (wareHouseId) {
      // Construct the payload dynamically
      const payload: any = { status: 'Quarantine' };

      if (wareHouseId) payload.wareHouseId = wareHouseId;
      if (ocNo) payload.ocNo = ocNo;
      if (shadeLot) payload.shadeLot = shadeLot;

      this.apiService
        .datasCustomGet(payload, WAC.API_URL + WAC.FabricCollection)
        .subscribe((response) => {
          if (!response?.result || response.result.length <= 0) {
            this.notificationService.error('No Results', 'No Data Found!');
            this.dataFetched = false;
            this.fabrics.set([]);
            return;
          }

          this.fabrics.set(response.result);
          this.dataFetched = true;
        });
    } else {
      this.notificationService.info('Info', 'Select Warehouse');
    }
  }

  onScanSuccess(data: string): void {
    this.setFormData(data);

    this.fetchFabricCollections();
  }
  onAllocateToInspection(row: any): void {
    this.toggleSelect(row.id);
    this.issueSelectedItems();
  }

  toggleSelectAll() {
    this.isAllSelected.set(!this.isAllSelected());
    if (this.isAllSelected()) {
      this.fabrics().forEach((row) => this.selectedIds.add(row.id));
    } else {
      this.selectedIds.clear();
    }
  }

  toggleSelect(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.isAllSelected.set(this.selectedIds.size === this.fabrics().length);
  }

  issueSelectedItems() {
    const allocatedBy = this.localStorageService.getItem('userId');
    const reqParams = {
      fabricCollection: {
        ids: Array.from(this.selectedIds),
        data: {
          status: 'Allocated to Inspection',
        },
      },
      issuedFabricInspection: this.fabrics()
        .filter((row) => this.selectedIds.has(row.id))
        .map((row) => ({
          fabricCollectionId: row?.id,
          wareHouseId: row?.wareHouseId,
          allocatedBy: allocatedBy,
          allocatedQty: row?.balanceQty,
        })),
    };

    this.apiService
      .BatchAllocateToInspection(reqParams, WAC.API_URL + WAC.cf)
      .subscribe({
        next: (response) => {
          console.log('Filtered Data:', response);
          if (response?.status == 200) {
            this.notificationService.success(
              'Success',
              'Allocated Successfully',
              2000
            );
            this.selectedIds.clear();
            this.fetchFabricCollections();
          } else {
            this.notificationService.error(
              'Error',
              response?.message ?? 'Something went wrong',
              3000
            );
          }
        },
        error: (error) => {
          console.error('Error:', error);
        },
      });
  }
}
