import { Component , signal} from '@angular/core';
import { BarcodeFormat } from '@zxing/browser';
import { FormBuilder, FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { WMS_API_CONSTANTS as WAC } from '../../../constants/wms-api.constants';
import { ApiService } from '../../../../shared/services/api/api.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { LocalStorageService } from '../../../../shared/services/local-storage/local-storage.service';
import { StateManagerService } from '../../../services/state-manager/state-manager.service';
import { NotificationService } from '../../../../shared/services/notification/notification.service';

@Component({
  selector: 'app-track-rack-status',
  standalone: false,
  templateUrl: './track-rack-status.component.html',
  styleUrl: './track-rack-status.component.css',
})
export class TrackRackStatusComponent {
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  readonly isScannerActive = signal<boolean>(false)
  scanFor: string = '';
  dataFetched: boolean = false;
  readonly fabrics = signal<any[]>([])
  readonly racks = signal<any>([])
  isCustomBayActive: boolean = false;
  fabricForm: FormGroup; // Reactive form instance
  readonly warehouses = signal<any[]>([])

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    public authService: AuthService,
    private localStorageService: LocalStorageService,
    private stateManager: StateManagerService,
    private notificationService: NotificationService
  ) {
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses.set(warehouses);
    });
    this.fabricForm = this.formBuilder.group({
      palletId: [''],
      wareHouseId: [
        this.localStorageService.getItem('selectedWarehouse') ?? '',
      ],
      rackNumber: [''],
      bayNumber: [''],
    });
  }
  selectedRackNumber: string = '';

  ngOnInit(): void {
    this.localStorageService.getItem('selectedWarehouse')
      ? this.fetchRackDatas()
      : '';
  }
  takePalletOut(bin: any) {
    this.apiService
      .patchDataByFilter(
        '?palletId=' + bin?.palletId,
        { binId: null, location: null },
        WAC.API_URL + WAC.FabricCollection
      )
      .subscribe((response) => {
        if (response?.status == 200) {
          this.apiService
            .updateData(
              bin?.id,
              { palletId: null },
              WAC.API_URL + WAC.BayLevelBin
            )
            .subscribe((response) => {
              if (response.status == 200) {
                bin.palletId = null;

                this.notificationService.info(
                  'Message',
                  `Pallet removed Successfully`,
                  3000
                );
              }
            });
        }
      });
  }
  fetchRackDatas(): void {
    const rackNumber = this.fabricForm.get('rackNumber')?.value;
    const wareHouseId = this.fabricForm.get('wareHouseId')?.value;
    const bayNumber = this.fabricForm.get('bayNumber')?.value;

    this.apiService
      .getDataById(wareHouseId, WAC.API_URL + WAC.WareHouse)
      .subscribe((response) => {
        console.log(response);
        if (response != null) {
          this.racks.set(response?.result?.racks);
          console.log(this.racks());
        } else {
          this.racks.set([]);
        }
      });
    this.isCustomBayActive = false;
  }

  fetchFabricCollections(selectedPalletId?: any): void {
    const palletId = selectedPalletId ?? this.fabricForm.get('palletId')?.value;
    selectedPalletId
      ? this.fabricForm.patchValue({ palletId: selectedPalletId })
      : null;

    if (palletId) {
      this.apiService
        .getDatasByFilter(
          `?palletId=${palletId}&status=Quarantine&status=Pass&status=Reject`,
          WAC.API_URL + WAC.FabricCollection
        )
        .subscribe((response) => {
          this.fabrics.set(response?.result);
          this.dataFetched = response?.result?.length > 0;
          // console.log(this.fabrics());
        });
    } else {
      console.warn('Pallet ID is missing in the form.');
    }
  }

  toggleScanner(scanFor: string): void {
    // console.log(scanFor);
    this.scanFor = scanFor;
    this.isScannerActive.set(!this.isScannerActive());
  }
  toggleCustomBay(): void {
    this.isCustomBayActive = !this.isCustomBayActive;
  }
  onScanSuccess(data: any): void {
    this.fabricForm.patchValue({ wareHouseId: data?.wareHouseId });
    this.fetchRackDatas();
  }
  allocateBin(rackId: any, binId: any): void {
    // if (this.fabricForm.valid) {
    const formData: any = this.fabricForm.value;
    // console.log('Form Submitted', formData);
    const currentPalletId = this.fabricForm.get('palletId')?.value ?? null;
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
                },
                WAC.API_URL + WAC.FabricCollection
              )
              .subscribe((response) => {
                this.apiService
                  .patchDataByFilter(
                    '?palletId=' + currentPalletId,
                    {
                      palletId: null,
                    },
                    WAC.API_URL + WAC.BayLevelBin
                  )
                  .subscribe((response) => {});
                this.apiService
                  .updateData(
                    binId,
                    {
                      palletId: currentPalletId,
                    },
                    WAC.API_URL + WAC.BayLevelBin
                  )
                  .subscribe((response) => {
                    console.log('API Response', response);
                    this.fabricForm.patchValue({ palletId: currentPalletId });
                    this.fetchFabricCollections();
                    this.fetchRackDatas();
                  });
              });
          } else if (
            /* Read more about handling dismissals below */
            result.dismiss === Swal.DismissReason.cancel
          ) {
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
  }
}
