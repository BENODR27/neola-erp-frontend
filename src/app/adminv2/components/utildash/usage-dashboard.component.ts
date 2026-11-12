import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../shared/services/api/api.service';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';

@Component({ selector: 'app-usage-dashboard', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './usage-daily.component.html', styleUrl: './usage-dashboard.component.css' })
export class UsageDashboardComponent implements OnInit {
  filters: any = { from: '', to: '', search: '', applicationName: '', employeeCode: '', organizationId: '', factoryId: '', vendorId: '', ipAddress: '', page: 1, pageSize: 25 };
  rows: any[] = []; summary: any = {}; pagination: any = {}; loading = false; error = '';
  constructor(private readonly api: ApiService) {}
  ngOnInit(): void { this.loadUsage(); this.loadSummary(); }
  loadUsage(): void { this.loading = true; this.api.getDatasByFilter(this.query(), AAC.API_URL + AAC.TELEMETRY_USAGE).subscribe({ next: response => { this.rows = response.result || []; this.pagination = response.pagination || {}; this.loading = false; }, error: () => { this.error = 'Usage data could not be loaded.'; this.loading = false; } }); }
  loadSummary(): void { this.api.getDatasByFilter(this.query(false), AAC.API_URL + AAC.TELEMETRY_SUMMARY).subscribe({ next: response => this.summary = response.result || {}, error: () => this.summary = {} }); }
  applyFilter(): void { this.filters.page = 1; this.loadUsage(); this.loadSummary(); }
  clearFilters(): void { Object.assign(this.filters, { from: '', to: '', search: '', applicationName: '', employeeCode: '', organizationId: '', factoryId: '', vendorId: '', ipAddress: '', page: 1 }); this.applyFilter(); }
  previousPage(): void { if (this.filters.page > 1) { this.filters.page--; this.loadUsage(); } }
  nextPage(): void { if (this.filters.page < (this.pagination.pages || 1)) { this.filters.page++; this.loadUsage(); } }
  private query(paging = true): string { const values = Object.entries(this.filters).filter(([key, value]) => (paging || !['page', 'pageSize'].includes(key)) && value !== ''); return values.length ? `?${values.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&')}` : ''; }
}
