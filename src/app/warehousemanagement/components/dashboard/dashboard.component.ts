import { Component , signal} from '@angular/core';
import { ApiService } from '../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';
import { AuthService } from '../../../auth/services/auth.service';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NumberInput } from '@angular/cdk/coercion';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import { StateManagerService } from '../../services/state-manager/state-manager.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  data: any;
  options: any;
  readonly warehouses = signal<any[]>([])
  readonly racks = signal<any[]>([])
  form: FormGroup; // Reactive form instance
  readonly rackStatistics = signal<any>(null)
  noOfBays: number = 0;
  fullOrEmpty = {
    chartLabels: ['FULL', 'EMPTY'],
    chartColors: ['red', 'green'],
    chartData: [0, 0], //full,empty
  };
  reportByStatus = {
    chartLabels: ['PASS', 'REJECT', 'QUARANINE'],
    chartColors: ['green', 'black', 'yellow'],

    chartData: [1, 2, 3],
  };

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    public authService: AuthService,
    private localStorageService: LocalStorageService,
    private stateManager: StateManagerService
  ) {
    this.stateManager.getWarehouses$().subscribe((warehouses) => {
      this.warehouses.set(warehouses);
    });
    this.form = this.formBuilder.group({
      wareHouseId: [
        this.localStorageService.getItem('selectedWarehouse') ?? '',
      ],
    });
  }
  ngOnInit() {
    this.localStorageService.getItem('selectedWarehouse')
      ? this.fetchRackDatas()
      : '';
  }

  fetchRackDatas(): void {
    const wareHouseId = this.form.get('wareHouseId')?.value;

    this.apiService
      .getDataById(wareHouseId, WAC.API_URL + WAC.WareHouse)
      .subscribe((response) => {
        if (response != null) {
          this.racks.set(response?.result?.racks);
          // console.log(this.racks());
          console.log('frd');

          this.processRackData();
        } else {
          this.racks.set([]);

          // console.log(this.racks());
        }
      });
  }
  processRackData(): void {
    this.noOfBays = 0;
    this.fullOrEmpty.chartData[0] = 0;
    this.fullOrEmpty.chartData[1] = 0;

    this.rackStatistics.set(this.racks().map((rack: any) => {
      let binsWithoutPalletId = 0;
      let binsWithPalletId = 0;
      let totalBins = 0;
      let fullPercentage = 0;

      const bayStatistics = rack.bays.map((bay: any, bayIndex: number) => {
        let bayBinsWithoutPalletId = 0;
        let bayBinsWithPalletId = 0;
        let binsInBay = 0;
        let emptyPercentage = 0;
        let binsWithPalletIdInBay = 0;
        bay.levels.forEach((level: any) => {
          this.noOfBays++;
          level.bins.forEach((bin: any) => {
            if (bin.palletId) {
              binsWithPalletId++;
              binsWithPalletIdInBay++;
              bayBinsWithPalletId++;
            } else {
              binsWithoutPalletId++;
              bayBinsWithoutPalletId++;
            }
            totalBins++;
            binsInBay++;
          });
        });
        emptyPercentage = Math.round((binsWithPalletIdInBay / binsInBay) * 100);

        return {
          bayNumber: bayIndex + 1,
          binsWithoutPalletId: bayBinsWithoutPalletId,
          binsWithPalletId: bayBinsWithPalletId,
          emptyPercentage: emptyPercentage,
        };
      });

      this.fullOrEmpty.chartData[0] += binsWithPalletId;
      this.fullOrEmpty.chartData[1] += binsWithoutPalletId;

      fullPercentage =
        totalBins != 0 && binsWithPalletId != 0 && binsWithoutPalletId != 0
          ? Math.round((binsWithPalletId / totalBins) * 100)
          : 0;
      if (binsWithPalletId == totalBins) {
        fullPercentage = 100;
      }

      return {
        rackNumber: rack.rackNumber,
        binsWithoutPalletId,
        binsWithPalletId,
        totalBins,
        fullPercentage,
        bayStatistics,
      };
    }));

    console.log('Rack Statistics:', this.rackStatistics());
    console.log('Transformed Data for Graph:', this.fullOrEmpty);
  }
}
