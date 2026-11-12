import { Component , signal} from '@angular/core';
import { BarcodeFormat } from '@zxing/browser';
import { FormBuilder, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { ApiService } from '../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from './../../constants/wms-api.constants';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import { StateManagerService } from '../../services/state-manager/state-manager.service';

@Component({
  selector: 'app-allocate-bin',
  standalone: false,
  templateUrl: './allocate-bin.component.html',
  styleUrl: './allocate-bin.component.css',
})
export class AllocateBinComponent {
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  readonly isScannerActive = signal<boolean>(false)
  scanFor: string = '';
  dataFetched: boolean = false;
  readonly fabrics = signal<any[]>([])
  readonly warehouses = signal<any[]>([])
  readonly rack = signal<any>({})
  readonly levels = signal<any>([])
  readonly isCustomBayActive = signal<boolean>(false)
  form: FormGroup;
  draggedPalletId: string | null = null;
  warehouseName = '';
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private localStorageService: LocalStorageService,
    private stateManager: StateManagerService,
  ) {
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses.set(warehouses);
    });
    this.form = this.formBuilder.group({
      palletId: [''],
      wareHouseId: [
        this.localStorageService.getItem('selectedWarehouse') ?? '',
      ],
      rackNumber: [''],
      bayNumber: [''],
    });
    console.log(this.warehouses());
  }

  fetchRackDatas(): void {
    const rackNumber = this.form.get('rackNumber')?.value;
    const wareHouseId = this.form.get('wareHouseId')?.value;
    const bayNumber = this.form.get('bayNumber')?.value;
    if (rackNumber && wareHouseId && bayNumber) {
      this.apiService
        .dataCustomGet(
          {
            rackNumber: rackNumber,
            wareHouseId: wareHouseId,
            bayNumber: bayNumber,
          },
          WAC.API_URL + WAC.Rack,
        )
        .subscribe((response) => {
          if (response.result == null) {
            this.rack.set(response.result);
            this.levels.set([]);
            this.notificationService.error('No Results', 'No Data Found!');
            this.fabrics.set([]);
          } else {
            this.rack.set({});
            this.levels.set(response.result.bays[0].levels);
            console.log(this.rack());
          }
        });
      this.isCustomBayActive.set(false);
    } else {
      this.notificationService.info('Info', 'Enter Valid Details');
    }
  }
  fetchFabricCollections(selectedPalletId?: any): void {
    const palletId = selectedPalletId ?? this.form.get('palletId')?.value;
    const wareHouseId = this.form.get('wareHouseId')?.value;

    selectedPalletId
      ? this.form.patchValue({ palletId: selectedPalletId })
      : null;

    if (palletId && wareHouseId) {
      this.apiService
        .getDatasByFilter(
          '?palletId=' +
            palletId +
            '&wareHouseId=' +
            wareHouseId +
            '&status=Quarantine&status=Pass&status=Reject',
          WAC.API_URL + WAC.FabricCollection,
        )
        .subscribe((response) => {
          if (response?.result.length <= 0) {
            this.notificationService.error(
              'No Results',
              `No Data Found! in Pallet with ID:${palletId}`,
            );
            this.fabrics.set([]);
            this.dataFetched = false;
          } else {
            this.fabrics.set(response.result);
            this.dataFetched = response.result.length > 0;
            console.log(this.fabrics());
          }
        });
    } else {
      this.notificationService.info('Info', 'Enter Valid Details');
    }
  }

  toggleScanner(scanFor: string): void {
    console.log(scanFor);
    this.scanFor = scanFor;
    this.isScannerActive.set(!this.isScannerActive());
    // this.onScanSuccess({
    //   rackNumber: 'A',
    //   wareHouseId: '1',
    //   bayNumber: 'B1',
    // });
    // this.isScannerActive() = !this.isScannerActive();
  }
  toggleCustomBay(): void {
    this.isCustomBayActive.set(!this.isCustomBayActive());
  }
  onScanSuccess(data: any): void {
    if (data && this.scanFor == 'palletId') {
      this.form.patchValue({ palletId: data });
      this.fetchFabricCollections(data);
      this.isScannerActive.set(!this.isScannerActive());
    } else {
      console.log(data);
      const segments = data?.split(' - ');
      console.log(segments);

      if (segments.length >= 2) {
        let scannedWarehouseId;
        this.warehouseName = segments[0].replace(/ - /g, '');
        this.apiService
          .getDatasByFilter(
            `?wareHouseName=${this.warehouseName}`,
            WAC.API_URL + WAC.WareHouse,
          )
          .subscribe({
            next: (response) => {
              console.log(response);
              scannedWarehouseId = response?.result[0].id;
            },
          });
        this.form.patchValue({
          rackNumber: segments[1]?.replace(/ - /g, '') ?? '',
          bayNumber: segments[2]?.replace(/ - |\r/g, '') ?? '',
          wareHouseId: scannedWarehouseId ?? 1,
        });
        const formData: any = this.form.value;

        console.log(formData);
        this.fetchRackDatas();
        this.isScannerActive.set(!this.isScannerActive());
      }
    }
  }

  allocateBin(rackId: any, binId: any, levelNumber: any, binNo: any): void {
    // if (this.form.valid) {
    const formData: any = this.form.value;
    console.log('Form Submitted', formData);
    const currentPalletId = formData.palletId;
    if (currentPalletId) {
      const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: 'btn btn-success',
          cancelButton: 'btn btn-danger',
        },
        buttonsStyling: false,
      });
      swalWithBootstrapButtons
        .fire({
          title: 'Are you sure to allocate?',
          text: "You won't be able to revert this!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Yes, allocate it!',
          cancelButtonText: 'No, cancel!',
          reverseButtons: true,
        })
        .then((result) => {
          if (result.isConfirmed) {
            this.apiService
              .patchDataByFilter(
                '?palletId=' + currentPalletId,
                {
                  rackId: rackId,
                  binId: binId,
                  location:
                    formData.rackNumber +
                    '-' +
                    formData.bayNumber +
                    '-' +
                    levelNumber +
                    '-' +
                    binNo,
                },
                WAC.API_URL + WAC.FabricCollection,
              )
              .subscribe((response) => {
                this.apiService
                  .patchDataByFilter(
                    '?palletId=' + currentPalletId,
                    {
                      palletId: null,
                    },
                    WAC.API_URL + WAC.BayLevelBin,
                  )
                  .subscribe((response) => {
                    this.apiService
                      .updateData(
                        binId,
                        {
                          palletId: currentPalletId,
                        },
                        WAC.API_URL + WAC.BayLevelBin,
                      )
                      .subscribe((response) => {
                        this.form.patchValue({ palletId: currentPalletId });
                        this.fetchFabricCollections();
                        this.fetchRackDatas();
                      });
                  });
              });
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            swalWithBootstrapButtons.fire({
              title: 'Cancelled',
              text: 'Ok',
              icon: 'error',
            });
          }
        });
    } else {
      Swal.fire({
        title: 'Warning',
        timer: 2000,
        text: 'Pallet Id is Missing!',
        icon: 'warning',
      });
    }

    // } else {
    //   console.log('Form is invalid');
    // }
  }
}
