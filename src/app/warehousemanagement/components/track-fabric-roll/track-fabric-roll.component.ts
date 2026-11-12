import { Component , signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BarcodeFormat } from '@zxing/browser';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';
import { ApiService } from '../../../shared/services/api/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
@Component({
  selector: 'app-track-fabric-roll',
  standalone: false,
  templateUrl: './track-fabric-roll.component.html',
  styleUrl: './track-fabric-roll.component.css',
})
export class TrackFabricRollComponent {
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  readonly isScannerActive = signal<boolean>(true)
  dataFetched: boolean = false;
  scannedDatas: any = {};
  readonly fabric = signal<any>({})
  readonly inspectionData = signal<any>({})
  readonly issuedFabrics = signal<any>([])
  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    public authService: AuthService
  ) {}
  ngOnInit(): void {}

  fetchFabricCollection(): void {
    this.apiService
      .dataCustomGet(this.scannedDatas, WAC.API_URL + WAC.FabricCollection)
      .subscribe({
        next: (response) => {
          if (response?.status == 200) {
            this.fabric.set(response?.result);
            this.fetchFabricIssuedFactory(response?.result?.id);
            this.fetchFabricInspection(response?.result?.id);
          } else {
            this.fabric.set({});
            this.notificationService.info('Info', 'No Data Found');
          }
          console.log(this.fabric());
        },
        error: (error) => {
          console.error('Error:', error);
        },
      });
  }

  fetchFabricInspection(fabricCollectionId: Number): void {
    this.apiService
      .dataCustomGet(
        { fabricCollectionId: fabricCollectionId },
        WAC.API_URL + WAC.IssuedFabricInspection
      )
      .subscribe({
        next: (response) => {
          if (response?.status == 200) {
            this.inspectionData.set(response?.result);
          } else {
            this.inspectionData.set({});
            this.notificationService.info('Info', 'No Data Found');
          }
          console.log(this.inspectionData());
        }, 
        error: (error) => {
          console.error('Error:', error);
        },
      });
  }
  fetchFabricIssuedFactory(fabricCollectionId: any): void {
    this.apiService
      .getDatasByFilter(
        `?fabricCollectionId=${fabricCollectionId}`,
        WAC.API_URL + WAC.IssueFabricFactory
      )
      .subscribe({
        next: (response) => {
          if (response?.status == 200) {
            this.issuedFabrics.set(response?.result);
          } else {
            this.issuedFabrics.set([]);
            this.notificationService.info('Info', 'No Data Found');
          }
          console.log(this.issuedFabrics());
        },
        error: (error) => {
          console.error('Error:', error);
        },
      });
  }
  objectKeys(obj: Record<string, any>): string[] {
    return Object.keys(obj);
  }
  toggleScanner(scanFor: string): void {
    console.log(scanFor);
    this.isScannerActive.set(!this.isScannerActive());
  }
  setFormData(data: any) {
    const segments = data?.split('#$@');
    if (segments && segments.length >= 9) {
      this.scannedDatas = {
        shadeLot: segments[0].replace(/#$@/g, '') ?? '',
        ocNo: segments[1].replace(/#$@/g, '') ?? '',
        invoiceNo: segments[2].replace(/#$@/g, '') ?? '',
        supplierName: segments[3].replace(/#$@/g, '') ?? '',
        poNo: segments[4].replace(/#$@/g, '') ?? '',
        fabricRef: segments[5].replace(/#$@/g, '') ?? '',
        styleName: segments[6].replace(/#$@/g, '') ?? '',
        colorName: segments[7].replace(/#$@/g, '') ?? '',
        totalQty: Math.round(parseFloat(segments[8])) || 0,
      };
    }
  }
  onScanSuccess(data: string): void {
    this.setFormData(data);
    this.fetchFabricCollection();
  }
}
