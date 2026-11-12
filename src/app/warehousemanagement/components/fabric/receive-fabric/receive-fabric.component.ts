import { Component , signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BarcodeFormat } from '@zxing/browser';
import { WMS_API_CONSTANTS as WAC } from '../../../constants/wms-api.constants';
import { ApiService } from '../../../../shared/services/api/api.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../../shared/services/local-storage/local-storage.service';
import { StateManagerService } from '../../../services/state-manager/state-manager.service';

@Component({
  selector: 'app-receive-fabric',
  templateUrl: './receive-fabric.component.html',
  standalone: false,
  styleUrls: ['./receive-fabric.component.css'],
})
export class ReceiveFabricComponent {
  resetPalletId() {
    this.form.patchValue({ palletId: '' });
    this.storage.removeItem('palletId');
    this.focusIn = '';
    this.isScannerActive = false;
    this.focusIn = '';
  }
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  isScannerActive: boolean = false;
  scanFor: string = '';
  dataFetched: boolean = false;
  readonly fabrics = signal<any[]>([])

  form: FormGroup; // Reactive form instance
  readonly warehouses = signal<any[]>([])
  focusIn: string = '';
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService,
    public authService: AuthService,
    public storage: LocalStorageService,
    private stateManager: StateManagerService,
  ) {
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses.set(warehouses);
    });
    this.form = this.formBuilder.group({
      palletId: [this.storage.getItem('palletId') ?? '', Validators.required],
      fabricId: ['', Validators.required],
      invoiceNo: [''],
      supplierName: [''],
      ocNo: [''],
      poNo: [''],
      fabricRef: [''],
      styleName: [''],
      colorName: [''],
      shadeLot: [''],
      totalQty: [''],
      rollNo: [''],
      wareHouseId: [
        this.storage.getItem('selectedWarehouse') ?? '',
        Validators.required,
      ],
    });
  }

  fetchFabricCollections(currentPalletId?: string): void {
    const palletId = currentPalletId ?? this.form.get('palletId')?.value;
    const wareHouseId = this.form.get('wareHouseId')?.value;

    if (palletId) {
      this.storage.setItem('palletId', palletId);
      this.apiService
        .getDatasByFilter(
          '?status=Quarantine&status=pass&status=reject&palletId=' +
            palletId +
            '&wareHouseId=' +
            wareHouseId,
          WAC.API_URL + WAC.FabricCollection,
        )
        .subscribe({
          next: (response) => {
            if (response?.status == 200 && response?.result?.length > 0) {
              this.fabrics.set(response?.result);
              this.dataFetched = true;
            } else {
              this.fabrics.set([]);
              this.notificationService.info('Info', 'Your Pallet Is Empty');
            }
          },
          error: (error) => {
            console.error('Error:', error);
          },
        });
    } else {
      this.notificationService.info('Info', 'Your Pallet Is Empty');
    }
  }

  toggleScanner(scanFor: string): void {
    this.focusIn = '';
    console.log(scanFor);
    this.scanFor = scanFor;
    this.isScannerActive = !this.isScannerActive;
    if (!this.isScannerActive) {
      this.scanFor = '';
      this.focusIn = '';
    }
  }
  setFormData(data: any) {
    const segments = data?.split('#$@');
    if (segments && segments.length >= 9) {
      this.form.patchValue({
        shadeLot: segments[0].replace(/#$@/g, '') ?? '',
        ocNo: segments[1].replace(/#$@/g, '') ?? '',
        invoiceNo: segments[2].replace(/#$@/g, '') ?? '',
        supplierName: segments[3].replace(/#$@/g, '') ?? '',
        poNo: segments[4].replace(/#$@/g, '') ?? '',
        fabricRef: segments[5].replace(/#$@/g, '') ?? '',
        styleName: segments[6].replace(/#$@/g, '') ?? '',
        colorName: segments[7].replace(/#$@/g, '') ?? '',
        totalQty: Math.round(parseFloat(segments[8])) || 0,
      });
    }
  }

  onScanSuccess(data: string): void {
    if (data && this.scanFor == 'palletId') {
      this.form.patchValue({ palletId: data });
      this.storage.setItem('palletId', data);
      this.fetchFabricCollections(data);
      this.isScannerActive = !this.isScannerActive;
    } else {
      this.form.patchValue({ fabricId: data + '#$@' }, { emitEvent: false });
      this.setFormData(data);
      // this.isScannerActive = !this.isScannerActive;
    }
  }

  entryfabDetails(): void {
    this.form.patchValue(
      {
        fabricId: this.form.get('fabricId')?.value + '#$@',
      },
      { emitEvent: false },
    );
    const data = this.form.get('fabricId')?.value;

    this.setFormData(data);
  }

  onSubmit(): void {
    const formData: any = this.form.value;

    if (this.form.valid) {
      formData.balanceQty = formData.totalQty;
      formData.createdBy = this.storage.getItem('userId');

      const invoiceNo = this.form.get('invoiceNo')?.value;
      const poNo = this.form.get('poNo')?.value;
      const ocNo = this.form.get('ocNo')?.value;
      const ShadeLot = this.form.get('shadeLot')?.value;
      //call api

      //end callapi
      this.notificationService.info('Verifying', '', 3000);
      this.apiService
        .dataCustomGet(
          {
            InvoiceNo: invoiceNo,
            OrderNo: poNo,
            OCNo: ocNo,
            ShadeLot: ShadeLot,
          },
          WAC.API_URL + WAC.sourcingAsnDetail,
        )
        .subscribe({
          next: (response) => {
            if (response?.status === 200 && response?.result) {
              this.apiService
                .addData(formData, WAC.API_URL + WAC.FabricCollection)
                .subscribe((response) => {
                  if (response.status == 200) {
                    this.notificationService.success(
                      'Good job!',
                      'Fabric checked with Asn Successfully created GRN!',
                      1000,
                    );
                  } else {
                    this.resetForm();

                    this.notificationService.error(
                      'Failed',
                      response.message,
                      3000,
                    );
                  }
                });
            } else {
              this.notificationService.error(
                'Verification Failed',
                'Fabric checked with Asn Successfully creation failed!',
                3000,
              );
            }
          },
          error: (error) => {
            this.notificationService.error('Wrong Details', error, 3000);
          },
        });
    } else {
      console.log(formData);
      this.notificationService.info('Info', 'Enter Required Details');
    }
  }

  resetForm(): void {
    const currentPalletId = this.form.get('palletId')?.value;
    const currentWarehouseId = this.form.get('wareHouseId')?.value;
    console.log(currentWarehouseId);

    this.form.reset();
    this.form.patchValue({
      palletId: currentPalletId,
      wareHouseId: currentWarehouseId,
    });
    this.focusIn = '';
    this.isScannerActive = false;
    this.focusIn = '';
  }
}
