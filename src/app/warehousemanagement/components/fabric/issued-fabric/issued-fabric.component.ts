import { Component , signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../../constants/wms-api.constants';
import { AuthService } from '../../../../auth/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../../shared/services/local-storage/local-storage.service';
import { StateManagerService } from '../../../services/state-manager/state-manager.service';

@Component({
  selector: 'app-issued-fabric',
  standalone: false,
  templateUrl: './issued-fabric.component.html',
  styleUrl: './issued-fabric.component.css',
})
export class IssuedFabricComponent {
  readonly fabrics = signal<any[]>([])
  form: FormGroup;
  readonly warehouses = signal<any[]>([])
  readonly factories = signal<any[]>([])

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
    this.form = this.initializeForm();
  }
  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form.patchValue({ fromDate: today, toDate: today });
    const savedFilters = localStorage.getItem('ifm');
    if (savedFilters) {
      this.form.patchValue(JSON.parse(savedFilters));
    }

    // Subscribe to form changes and save them
    this.form.valueChanges.subscribe((values) => {
      localStorage.setItem('ifm', JSON.stringify(values));
    });
    this.fetchAllFactories();
  }
  /**
   * Initializes the form with default values and validators.
   */
  private initializeForm(): FormGroup {
    return this.formBuilder.group({
      status: ['Pending', Validators.required],
      invoiceNo: [''],
      ocNo: [''],
      poNo: [''],
      shadeLot: [''],
      fromDate: [''],
      toDate: [''],
      factoryId: [''],
      wareHouseId: [''],
    });
  }
  /**
   * Builds a query string from the given filter parameters.
   * @param params - Filter parameters
   */
  private buildQueryString(params: Record<string, any>): string {
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return queryString ? `?${queryString}` : '';
  }

  submitAction(row: any): void {
    if (row.updatedStatus === 'Accepted') {
      console.log('submitAction called with acc:', row);
    } else {
      console.log('submitAction called with rej:', row);
    }
    const { status, ...rowData } = row;
    this.apiService
      .updateData(
        row?.id,
        {
          status: row.updatedStatus,
          issuedBy: this.localStorageService.getItem('currentEmpId'),
          remarks: row?.remarks ?? '',
          fabricCollectionId: row?.fabricCollectionId,
          issueQty: row?.issueQty,
          // ...rowData, //if needed to send it to wfx from backend
        },
        WAC.API_URL + WAC.IssueFabricFactory
      )
      .subscribe((response) => {
        if (response?.status === 200) {
          this.notificationService.success(
            'success',
            'Updated Successfully!',
            2000
          );
          this.fetchFabricCollections();
        } else {
          this.notificationService.info(
            'Failed',
            'Insufficient balance quantity kindly check and Accept',
            3000
          );
        }
        this.fetchFabricCollections();
      });
  }
  fetchFabricCollections(): void {
    const { fromDate, toDate, factoryId, wareHouseId, status } =
      this.form.value;
    if (factoryId && wareHouseId) {
      const filterParams = {
        facility: factoryId,
        fromDate: fromDate || null,
        toDate: toDate || null,
        wareHouseName: wareHouseId || null,
        status: status || null,
      };
      const queryParams = this.buildQueryString(filterParams);
      this.apiService
        .getDatasByFilter(queryParams, WAC.API_URL + WAC.IssueFabricFactory)
        .subscribe((response) => {
          if (response?.result.length <= 0) {
            // this.notificationService.error('No Results', 'No Data Found!');
            this.fabrics.set([]);
          } else {
            this.fabrics.set(response?.result || []);
          }
        });
    } else {
      this.notificationService.info('Info', 'Select All Required Fields');
    }
  }

  /**
   * Fetches the list of all factories.
   */
  fetchAllFactories() {
    this.apiService.getDatas(WAC.API_URL + WAC.Factory).subscribe({
      next: (response) => {
        this.factories.set(response.result);
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }
}
