import { Component , signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableUtil } from '../../../shared/utils/table-util';
import { ApiService } from '../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';
import { AuthService } from '../../../auth/services/auth.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import { StateManagerService } from '../../services/state-manager/state-manager.service';
@Component({
  selector: 'app-rack-explorer',
  standalone: false,
  templateUrl: './rack-explorer.component.html',
  styleUrl: './rack-explorer.component.css',
})
export class RackExplorerComponent {
  readonly fabrics = signal<any[]>([])
  form: FormGroup;
  todayDate: any;
  warehouses: any[] = [];
  showFilters: boolean = true;
  readonly racks = signal<any>([])
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private localStorageService: LocalStorageService,
    private stateManager: StateManagerService
  ) {
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses = warehouses;
    });
    this.form = this.formBuilder.group({
      wareHouseId: [
        this.localStorageService.getItem('selectedWarehouse') ?? '',
      ],
      rackNumber: ['', Validators.required],
      turnAroundDays: [0],
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
    this.fetchRacks();
  }
  fetchRacks(): void {
    const wareHouseId = this.form.get('wareHouseId')?.value;

    wareHouseId
      ? this.apiService
          .getDatasByFilter(
            `?wareHouseId=${wareHouseId}`,
            WAC.API_URL + WAC.Rack
          )
          .subscribe((response) => {
            if (response?.result.length <= 0) {
              this.notificationService.error('No Results', 'No Data Found!');
            } else {
              this.racks.set(response?.result ?? []);
            }
          })
      : '';
  }

  fetchFabricCollections(): void {
    const wareHouseId = this.form.get('wareHouseId')?.value;
    const turnAroundDays = this.form.get('turnAroundDays')?.value;

    if (!wareHouseId) {
      this.notificationService.info('Info', 'Select Warehouse');
      return;
    }

    const rackNumber = this.form.get('rackNumber')?.value;

    // Fixed start date
    const fromDate = '2025-01-01';

    // End date = 90 days before today
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - turnAroundDays);
    const toDate = pastDate.toISOString().split('T')[0]; // yyyy-mm-dd

    // Build filter string
    const filter =
      `?wareHouseId=${wareHouseId}` +
      `&searchField=location&search=${rackNumber}` +
      `&status=Quarantine` +
      `&fromDate=${fromDate}` +
      `&toDate=${toDate}`;

    // API Call
    this.apiService
      .getDatasByFilter(filter, WAC.API_URL + WAC.FabricCollection)
      .subscribe((response) => {
        this.fabrics.set(response.result);

        if (!response?.result?.length) {
          this.notificationService.error('No Results', 'No Data Found!');
        } else {
          this.showFilters = false;
        }
      });
  }

  exportTable(): void {
    TableUtil.exportTableToExcel('downloadReport', 'RACK-REPORT');
    this.notificationService.success(
      'Good job!',
      'Report Downloaded Successfully!',
      2000
    );
  }
}
