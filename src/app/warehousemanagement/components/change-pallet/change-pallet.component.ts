import { Component , signal} from '@angular/core';
import { BarcodeFormat } from '@zxing/browser';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ApiService } from '../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from './../../constants/wms-api.constants';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import { StateManagerService } from '../../services/state-manager/state-manager.service';

@Component({
  selector: 'app-change-pallet',
  standalone: false,
  templateUrl: './change-pallet.component.html',
  styleUrl: './change-pallet.component.css',
})
export class ChangePalletComponent {
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  readonly isScannerActive = signal<boolean>(false)
  scanFor: string = '';
  readonly fromFabrics = signal<any[]>([])
  readonly toFabrics = signal<any[]>([])

  readonly warehouses = signal<any[]>([])
  rack: any = {};
  levels: any = [];
  isCustomBayActive: boolean = false;
  form: FormGroup; // Reactive form instance
  selectedIds: Set<number> = new Set();
  readonly isAllSelected = signal(false)
  binId: any;
  location = null;
  readonly hidechangepallet = signal(true)
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private localStorageService: LocalStorageService,
    private stateManager: StateManagerService
  ) {
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses.set(warehouses);
    });
    this.form = this.formBuilder.group({
      fromPalletId: [''],
      fromBinId: [''],
      toPalletId: [''],
      toBinId: [''],
      wareHouseId: [
        this.localStorageService.getItem('selectedWarehouse') ?? '',
      ],
    });
  }

  toggleSelectAll() {
    this.isAllSelected.set(!this.isAllSelected());
    if (this.isAllSelected()) {
      this.fromFabrics().forEach((row) => this.selectedIds.add(row.id));
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
    this.isAllSelected.set(this.selectedIds.size === this.fromFabrics().length);
  }

  fetchFabricCollections(section: string): void {
    const palletId = this.form.get(section)?.value;
    console.log(palletId);
    const wareHouseId = this.form.get('wareHouseId')?.value;

    if (palletId) {
      this.apiService
        .getDatasByFilter(
          '?palletId=' +
            palletId +
            '&wareHouseId=' +
            wareHouseId +
            '&status=Quarantine&status=Pass&status=Reject',
          WAC.API_URL + WAC.FabricCollection
        )
        .subscribe((response) => {
          if (section == 'fromPalletId') {
            if (response?.result.length <= 0) {
              this.notificationService.error(
                'No Results',
                `No Data Found! in Pallet with ID:${palletId}`
              );
              this.fromFabrics.set([]);
              this.toFabrics.set([]);

              this.selectedIds.clear();
            } else {
              this.form.patchValue({
                fromBinId: response?.result[0]?.binId ?? null,
              });
              this.fromFabrics.set(response?.result);
            }
          } else {
            this.hidechangepallet.set(false);
            if (response?.result.length <= 0) {
              this.notificationService.error(
                'No Results',
                `No Data Found! in Pallet with ID:${palletId}`
              );
              this.toFabrics.set([]);
            } else {
              this.form.patchValue({
                toBinId: response?.result[0]?.binId ?? null,
              });

              this.toFabrics.set(response?.result);
              this.binId = response?.result[0]?.binId ?? null;
              this.location = response?.result[0]?.location ?? null;
            }
          }
        });
    } else {
      this.notificationService.error('Error', 'Please Enter Pallet Id');
    }
  }

  toggleScanner(scanFor: string): void {
    console.log(scanFor);
    this.scanFor = scanFor;
    this.isScannerActive.set(!this.isScannerActive());
  }
  toggleCustomBay(): void {
    this.isCustomBayActive = !this.isCustomBayActive;
  }
  onScanSuccess(data: any): void {
    if (data && this.scanFor == 'fromPalletId') {
      this.form.patchValue({ fromPalletId: data });
    } else {
      console.log(data);
      this.form.patchValue({ toPalletId: data });
    }
  }

  issueSelectedItems() {
    const { fromBinId, fromPalletId, toPalletId } = this.form.value;
    if (fromPalletId == toPalletId) {
      this.notificationService.info(
        'Message',
        'You selected same pallet',
        3000
      );
    } else {
      this.apiService
        .updateBatch(
          {
            ids: Array.from(this.selectedIds),
            data: {
              palletId: this.form.get('toPalletId')?.value,
              binId: this.binId ?? null,
              location: this.location ?? null,
            },
          },
          WAC.API_URL + WAC.FabricCollection
        )
        .subscribe((response) => {
          if (response.status == 200) {
            if (this.isAllSelected() && fromBinId) {
              this.apiService
                .updateData(
                  fromBinId,
                  { palletId: null },
                  WAC.API_URL + WAC.BayLevelBin
                )
                .subscribe((response) => {
                  if (response.status == 200) {
                    // this.notificationService.info(
                    //   'Message',
                    //   ``,
                    //   3000
                    // );
                  }
                });
            }
            this.isAllSelected.set(false);
            this.notificationService.success(
              'Good job!',

              this.location && this.binId
                ? `Allocated to New pallet - to location ${this.location}`
                : 'Allocated to New pallet',
              5000
            );
            setTimeout(() => {
              this.fetchFabricCollections('fromPalletId');
              this.fetchFabricCollections('toPalletId');
            }, 3000);
          } else {
            this.notificationService.error('Failed', response.message, 3000);
          }
        });
    }
  }
}
