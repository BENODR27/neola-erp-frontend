import { Component , signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../shared/services/api/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';
import { StateManagerService } from '../../services/state-manager/state-manager.service';

@Component({
  selector: 'app-oc-reallocation-action',
  standalone: false,
  templateUrl: './oc-reallocation-action.component.html',
  styleUrl: './oc-reallocation-action.component.css',
})
export class OcReallocationActionComponent {
  readonly fabrics = signal<any[]>([])
  form: FormGroup;
  readonly warehouses = signal<any[]>([])
  factories: any[] = [];

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
  }
  /**
   * Initializes the form with default values and validators.
   */
  private initializeForm(): FormGroup {
    return this.formBuilder.group({
      fromDate: [, Validators.required],
      toDate: [, Validators.required],
      wareHouseName: ['', Validators.required],
      status: ['Accepted', Validators.required],
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

  fetchFabricCollections(): void {
    const { fromDate, toDate, wareHouseName, status } = this.form.value;
    if (wareHouseName) {
      const filterParams = {
        fromDate: fromDate || null,
        toDate: toDate || null,
        wareHouseName: wareHouseName || null,
        status: status || null,
      };
      const queryParams = this.buildQueryString(filterParams);
      this.apiService
        .getDatasByFilter(queryParams, WAC.API_URL + WAC.OcReallocationRequest)
        .subscribe((response) => {
          if (response?.result.length <= 0) {
            this.notificationService.error('No Results', 'No Data Found!');
            this.fabrics.set([]);
          } else {
            this.fabrics.set(response?.result || []);
          }
        });
    } else {
      this.notificationService.info('Info', 'Select All Required Fields');
    }
  }
}
