import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../shared/services/api/api.service';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';

@Component({ selector: 'app-error-log-dashboard', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './error-log-dashboard.component.html', styleUrl: './error-log-dashboard.component.css' })
export class ErrorLogDashboardComponent implements OnInit {
  filters: any = { from: '', to: '', search: '', applicationName: '', employeeCode: '', organizationId: '', factoryId: '', vendorId: '', ipAddress: '', severity: '', page: 1, pageSize: 25 };
  rows: any[] = []; pagination: any = {}; loading = false; error = ''; selected: any = null;
  constructor(private readonly api: ApiService) {}
  ngOnInit(): void { this.loadErrors(); }
  loadErrors(): void { this.loading = true; this.api.getDatasByFilter(this.query(), AAC.API_URL + AAC.TELEMETRY_ERRORS).subscribe({ next: response => { this.rows = response.result || []; this.pagination = response.pagination || {}; this.loading = false; }, error: () => { this.error = 'Error logs could not be loaded.'; this.loading = false; } }); }
  applyFilter(): void { this.filters.page = 1; this.loadErrors(); }
  clearFilters(): void { Object.keys(this.filters).forEach(key => { if (!['page', 'pageSize'].includes(key)) this.filters[key] = ''; }); this.filters.page = 1; this.loadErrors(); }
  previousPage(): void { if (this.filters.page > 1) { this.filters.page--; this.loadErrors(); } }
  nextPage(): void { if (this.filters.page < (this.pagination.pages || 1)) { this.filters.page++; this.loadErrors(); } }
  private query(): string { const values = Object.entries(this.filters).filter(([, value]) => value !== '' && value !== null && value !== undefined); return values.length ? `?${values.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&')}` : ''; }
}
