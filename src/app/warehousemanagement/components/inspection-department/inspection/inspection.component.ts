import { Component , signal} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BarcodeFormat } from '@zxing/browser';
import { ApiService } from '../../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../../constants/wms-api.constants';
import { AuthService } from '../../../../auth/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../../shared/services/local-storage/local-storage.service';
import { CustomApiService } from '../../../services/custom-api.service';
import { StateManagerService } from '../../../services/state-manager/state-manager.service';

@Component({
  selector: 'app-inspection',
  standalone: false,
  templateUrl: './inspection.component.html',
  styleUrl: './inspection.component.css',
})
export class InspectionComponent {
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  readonly isScannerActive = signal<boolean>(false)
  scanFor: string = '';
  dataFetched: boolean = false;
  readonly fabrics = signal<any[]>([])
  readonly warehouses = signal<any[]>([])
  form: FormGroup; // Reactive form instance

  constructor(
    private formBuilder: FormBuilder,
    private apiService: CustomApiService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private localStorageService: LocalStorageService,
    private stateManager: StateManagerService
  ) {
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses.set(warehouses);
    });
    this.form = this.formBuilder.group({
      ocNo: [''],
      lotNo: [''],
      wareHouseId: [
        this.localStorageService.getItem('selectedWarehouse') ?? '',
      ],
      fabricId: [],
    });
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
        ocNo: segments[2].replace(/#$@/g, '') ?? '',
        poNo: segments[3].replace(/#$@/g, '') ?? '',
        lotNo: segments[7].replace(/#$@/g, '') ?? '',
      });
    }
  }
  fetchFabricCollections(): void {
    const wareHouseId = this.form.get('wareHouseId')?.value;
    if (wareHouseId) {
      const ocNo = this.form.get('ocNo')?.value;
      const shadeLot = this.form.get('lotNo')?.value;
      const payload: any = { status: 'Allocated to Inspection' };

      if (wareHouseId) payload.wareHouseId = wareHouseId;
      if (ocNo) payload.ocNo = ocNo;
      if (shadeLot) payload.shadeLot = shadeLot;

      this.apiService
        .datasCustomGet(payload, WAC.API_URL + WAC.FabricCollection)
        .subscribe((response) => {
          if (response?.result.length <= 0) {
            this.notificationService.error('No Results', 'No Data Found!');
            this.dataFetched = false;
            this.fabrics.set([]);
          }
          {
            this.fabrics.set(response.result);
            this.dataFetched = response.result.length > 0;
          }
        });
    } else {
      this.notificationService.info('Info', 'Select Warehouse');
    }
  }

  toggleScanner(scanFor: string): void {
    console.log(scanFor);
    this.scanFor = scanFor;
    this.isScannerActive.set(!this.isScannerActive());
  }

  onScanSuccess(data: string): void {
    this.setFormData(data);

    this.fetchFabricCollections();
  }
  onchangeInspectionStatus(inspectionStatus: string, row: any): void {
    this.apiService
      .inspectionUpdateWMS(
        {
          fabricCollectionId: row.id,
          invoiceNo: row.invoiceNo,
          poNo: row.poNo,
          ocNo: row.ocNo,
          colorName: row.colorName,
          styleName: row.styleName,
          fabricRef: row.fabricRef,
          status: inspectionStatus,
          inspectedBy: this.localStorageService.getItem('userId') ?? null,
        },
        WAC.API_URL + WAC.cf
      )
      .subscribe((response) => {
        if (response?.status == 200) {
          this.fetchFabricCollections();
          this.notificationService.success(
            'success',
            `Updated Status as ${inspectionStatus} Successfully`,
            2000
          );
        } else {
          this.notificationService.error(
            'Error',
            `Updated Status as ${inspectionStatus} Failed`,
            2000
          );
        }
      });
  }

}
