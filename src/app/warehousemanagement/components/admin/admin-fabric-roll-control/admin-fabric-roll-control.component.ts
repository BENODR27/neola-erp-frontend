import { Component , signal} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { TableUtil } from '../../../../shared/utils/table-util';
import { ApiService } from '../../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../../constants/wms-api.constants';
import { AuthService } from '../../../../auth/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../../shared/services/local-storage/local-storage.service';
import { StateManagerService } from '../../../services/state-manager/state-manager.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-admin-fabric-roll-control',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './admin-fabric-roll-control.component.html',
  styleUrl: './admin-fabric-roll-control.component.css',
})
export class AdminFabricRollControlComponent {
  readonly fabrics = signal<any[]>([])
  form: FormGroup;
  todayDate: any;
  readonly warehouses = signal<any[]>([])
  showFilters: boolean = true;
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
      status: [''],
      invoiceNo: [''],
      ocNo: [''],
      poNo: [''],
      shadeLot: [''],
      fromDate: [''],
      toDate: [''],
      wareHouseId: [
        this.localStorageService.getItem('selectedWarehouse') ?? '',
      ],
      fabricRef: [''],
      supplierName: [''],
      styleName: [''],
    });
  }
  ngOnInit(): void {
    const savedFilters = localStorage.getItem('ffinder');
    if (savedFilters) {
      this.form.patchValue(JSON.parse(savedFilters));
    }

    // Subscribe to form changes and save them
    this.form.valueChanges.subscribe((values) => {
      localStorage.setItem('ffinder', JSON.stringify(values));
    });
  }
  updateCollection(data: any) {
    this.apiService
      .updateData(
        data?.id,
        {
          balanceQty: data?.balanceQty,
          status: data?.status,
        },
        WAC.API_URL + WAC.FabricCollection
      )
      .subscribe((response) => {
        data.editEnabled = false;
      });
  }
  fetchFabricCollections(): void {
    const wareHouseId = this.form.get('wareHouseId')?.value;
    if (wareHouseId) {
      const status = this.form.get('status')?.value;
      const ocNo = this.form.get('ocNo')?.value;
      const poNo = this.form.get('poNo')?.value;
      const shadeLot = this.form.get('shadeLot')?.value;
      const invoiceNo = this.form.get('invoiceNo')?.value;
      const fromDate = this.form.get('fromDate')?.value;
      const toDate = this.form.get('toDate')?.value;
      const fabricRef = this.form.get('fabricRef')?.value;
      const supplierName = this.form.get('supplierName')?.value;
      const styleName = this.form.get('styleName')?.value;

      let filter =
        `?wareHouseId=${wareHouseId}` +
        (status ? `&status=${status}` : ``) +
        (invoiceNo ? `&invoiceNo=${invoiceNo}` : ``) +
        (ocNo ? `&ocNo=${ocNo}` : ``) +
        (poNo ? `&poNo=${poNo}` : ``) +
        (shadeLot ? `&shadeLot=${shadeLot}` : ``) +
        (fromDate ? `&fromDate=${fromDate}` : ``) +
        (fabricRef ? `&fabricRef=${fabricRef}` : ``) +
        (supplierName ? `&supplierName=${supplierName}` : ``) +
        (styleName ? `&styleName=${styleName}` : ``) +
        (toDate ? `&toDate=${toDate}` : ``);
      this.apiService
        .getDatasByFilter(filter, WAC.API_URL + WAC.FabricCollection)
        .subscribe((response) => {
          this.fabrics.set(response.result);
          console.log(this.fabrics());
          if (response?.result.length <= 0) {
            this.notificationService.error('No Results', 'No Data Found!');
          } else {
            this.showFilters = false;
          }
        });
    } else {
      this.notificationService.info('Info', 'Select Warehouse');
    }
  }

  exportTable(): void {
    TableUtil.exportTableToExcel('downloadReport', 'GRNREPORT');
    this.notificationService.success(
      'Good job!',
      'Report Downloaded Successfully!',
      2000
    );
  }
}
