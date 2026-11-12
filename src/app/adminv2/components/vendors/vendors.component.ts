import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';
import { ApiService } from '../../../shared/services/api/api.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';

interface Vendor { id: string; code: string; name: string; category?: string; contactName?: string; phone?: string; email?: string; organizationId?: string; organizationName?: string; factoryId?: string; factoryName?: string; serviceLevel?: string; status?: string; notes?: string; }

@Component({ selector: 'app-admin-vendors', standalone: false, templateUrl: './vendors.component.html', styleUrl: './vendors.component.css' })
export class VendorsComponent implements OnInit {
  readonly vendors = signal<Vendor[]>([]); readonly search = signal(''); readonly isSaving = signal(false); selectedId: string | null = null; form: FormGroup;
  constructor(private readonly formBuilder: FormBuilder, private readonly api: ApiService, private readonly notifications: NotificationService) {
    this.form = this.formBuilder.group({ code: ['', [Validators.required, Validators.maxLength(80)]], name: ['', [Validators.required, Validators.maxLength(180)]], category: ['General'], contactName: [''], phone: [''], email: ['', Validators.email], organizationId: [''], organizationName: [''], factoryId: [''], factoryName: [''], serviceLevel: ['Standard'], status: ['Active'], notes: [''] });
  }
  get filteredVendors(): Vendor[] { const q = this.search().trim().toLowerCase(); return this.vendors().filter((v) => !q || [v.code, v.name, v.category, v.organizationName, v.factoryName].some((x) => String(x || '').toLowerCase().includes(q))); }
  ngOnInit(): void { this.loadVendors(); }
  loadVendors(): void { this.api.getDatas(AAC.API_URL + AAC.VENDORS).subscribe({ next: (r) => this.vendors.set(r?.result ?? []), error: () => this.notifications.error('Unable to load vendors', 'Check the AuthGuard v2 service and try again.') }); }
  onSearch(event: Event): void { if (event.target instanceof HTMLInputElement) this.search.set(event.target.value); }
  startCreate(): void { this.selectedId = null; this.form.reset({ category: 'General', serviceLevel: 'Standard', status: 'Active' }); }
  startEdit(vendor: Vendor): void { this.selectedId = vendor.id; this.form.patchValue(vendor); }
  save(): void { if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.isSaving.set(true); const request = this.selectedId ? this.api.putAtUrl(`${AAC.API_URL}${AAC.VENDORS}/${encodeURIComponent(this.selectedId)}`, this.form.value) : this.api.addData(this.form.value, AAC.API_URL + AAC.VENDORS); request.subscribe({ next: () => { this.isSaving.set(false); this.notifications.success('Vendor saved', 'The shared vendor catalog was updated.'); this.loadVendors(); }, error: (e) => { this.isSaving.set(false); this.notifications.error('Save failed', e?.error?.message || 'The vendor could not be saved.'); } }); }
  remove(vendor: Vendor): void { this.notifications.confirm(`Delete ${vendor.name}?`, 'Delete', 'Cancel').then((r) => { if (!r.isConfirmed) return; this.api.deleteAtUrl(`${AAC.API_URL}${AAC.VENDORS}/${encodeURIComponent(vendor.id)}`).subscribe({ next: () => { this.notifications.success('Vendor deleted', 'The shared vendor was removed.'); this.loadVendors(); }, error: (e) => this.notifications.error('Delete failed', e?.error?.message || 'The vendor could not be deleted.') }); }); }
}
