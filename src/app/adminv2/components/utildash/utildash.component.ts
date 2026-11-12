import { Component, ChangeDetectorRef , signal} from '@angular/core';
import { ChartPieDemoComponent } from '../../../shared/components/chart-pie-demo/chart-pie-demo.component';
import { ApiService } from '../../../shared/services/api/api.service';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-utildash',
  imports: [ChartPieDemoComponent, FormsModule, CommonModule],
  templateUrl: './utildash.component.html',
  styleUrl: './utildash.component.css',
})
export class UtildashComponent {
  datas: any[] = [];
  readonly fullOrEmpty = signal({
    chartLabels: [] as string[],
    chartColors: [] as string[],
    chartData: [] as number[],
  })
  readonly datasNameWise = signal({
    chartLabels: [] as string[],
    chartColors: [] as string[],
    chartData: [] as number[],
  })
  readonly datasEmpCodeWise = signal({
    chartLabels: [] as string[],
    chartColors: [] as string[],
    chartData: [] as number[],
  })
  readonly datasFacilityWise = signal({
    chartLabels: [] as string[],
    chartColors: [] as string[],
    chartData: [] as number[],
  })
  uniqueNames: { name: string; count: number }[] = [];
  empCodeCounts: { empCode: string; count: number }[] = [];

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private localStorageService: LocalStorageService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit() {
    // this.fetchAllLogs();
  }
  filters = {
    fromDate: null,
    toDate: null,
    facilty: null,
    name: null,
  };

  applyFilter() {
    this.fetchAllLogs();
  }
  fetchAllLogs() {
    const queryParams = this.buildQueryString(this.filters);
    this.apiService
      .getDatasByFilter(queryParams, AAC.WU_API_URL + AAC.LOG)
      .subscribe({
        next: (response) => {
          this.datas = response.result;
          const groupedData = this.datas.reverse().reduce((acc, item) => {
            const date = item.createdAt.split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          }, {});
          this.fullOrEmpty.set({
            chartLabels: Object.keys(groupedData),
            chartColors: Object.keys(groupedData).map(() => 'blue'),
            chartData: Object.values(groupedData),
          });

          // Calculate unique names and their counts
          const nameCounts = this.datas.reduce((acc, item) => {
            acc[item.name] = (acc[item.name] || 0) + 1;
            return acc;
          }, {});

          this.uniqueNames = Object.keys(nameCounts).map((name) => ({
            name,
            count: nameCounts[name],
          }));
          // Calculate facility-wise counts
          const facilityCounts = this.datas.reduce((acc, item) => {
            acc[item.facilty] = (acc[item.facilty] || 0) + 1;
            return acc;
          }, {});

          this.datasFacilityWise.set({
            chartLabels: Object.keys(facilityCounts),
            chartColors: Object.keys(facilityCounts).map(() => 'blue'),
            chartData: Object.values(facilityCounts),
          });
          // Calculate empCode-wise counts
          const empCodeCounts = this.datas.reduce((acc, item) => {
            acc[item.empCode] = (acc[item.empCode] || 0) + 1;
            return acc;
          }, {});

          this.empCodeCounts = Object.keys(empCodeCounts).map((empCode) => ({
            empCode,
            count: empCodeCounts[empCode],
          }));

          this.datasNameWise.set({
            chartLabels: Object.keys(nameCounts),
            chartColors: Object.keys(nameCounts).map(() => 'blue'),
            chartData: Object.values(nameCounts),
          });
          this.datasEmpCodeWise.set({
            chartLabels: Object.keys(empCodeCounts),
            chartColors: Object.keys(empCodeCounts).map(() => 'blue'),
            chartData: Object.values(empCodeCounts),
          });

          this.cdr.reattach();
        },
        error: (error) => {
          console.error('Error:', error);
        },
      });
  }
  private buildQueryString(params: Record<string, any>): string {
    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return queryString ? `?${queryString}` : '';
  }
}
