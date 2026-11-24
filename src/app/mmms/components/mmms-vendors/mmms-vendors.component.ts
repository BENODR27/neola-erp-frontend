import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { SharedVendor, VendorProfile, VendorService } from '../../models/mmms-vendor.models';
import { MachineSummary } from '../../models/mmms.models';
import { AuthService } from '../../../auth/services/auth.service';
import { MastersFacade } from '../../../shared/services/masters/masters.facade';
@Component({
  selector: 'app-mmms-vendors',
  standalone: false,
  templateUrl: './mmms-vendors.component.html',
  styleUrls: ['./mmms-vendors.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsVendorsComponent implements OnInit {
  private readonly paginationCleanup = inject(DestroyRef).onDestroy(() => {
    this.pagination.destroy();
    this.servicePagination.destroy();
  });
  readonly pagination = new MmmsPagination(() => this.loadVendors());
  readonly servicePagination = new MmmsPagination(() => this.loadServices());
  readonly vendors = signal<SharedVendor[]>([]);
  readonly vendorOptions = signal<SharedVendor[]>([]);
  readonly profiles = signal<VendorProfile[]>([]);
  readonly services = signal<VendorService[]>([]);
  readonly machines = signal<MachineSummary[]>([]);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly editor = signal<'catalog' | 'profile' | 'service' | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly auth = inject(AuthService);
  readonly sharedCatalog = signal(true);
  private readonly masters = inject(MastersFacade);
  vendorDraft: Partial<SharedVendor> = {};
  profileDraft: VendorProfile = this.emptyProfile('');
  serviceDraft: Partial<VendorService> = {};
  private readonly facade = inject(MmmsFacadeService);
  ngOnInit(): void {
    this.masters.settings().subscribe({
      next: (settings) => this.sharedCatalog.set(settings.sharedMasters),
      error: (error: unknown) => this.fail(error),
    });
    this.load();
    this.facade.getMachines().subscribe({
      next: (rows) => this.machines.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  load(): void {
    this.facade.getSharedVendors().subscribe({
      next: (rows) => this.vendorOptions.set(rows),
      error: (error: unknown) => this.fail(error),
    });
    this.loadVendors();
    this.facade.getVendorProfiles().subscribe({
      next: (rows) => this.profiles.set(rows),
      error: (error: unknown) => this.fail(error),
    });
    this.loadServices();
  }
  loadVendors(): void {
    this.pagination.read(this.facade.getSharedVendorPage(this.pagination.query())).subscribe({
      next: (rows) => this.vendors.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  loadServices(): void {
    this.servicePagination
      .read(this.facade.getPage<VendorService>('vendor-services', this.servicePagination.query()))
      .subscribe({
        next: (rows) => this.services.set(rows),
        error: (error: unknown) => this.fail(error),
      });
  }
  catalog(vendor?: SharedVendor): void {
    if (this.sharedCatalog()) return;
    this.selectedId.set(vendor?.id || null);
    this.vendorDraft = vendor
      ? { ...vendor }
      : {
          code: '',
          name: '',
          category: 'General',
          contactName: '',
          phone: '',
          email: '',
          status: 'Active',
          notes: '',
        };
    this.editor.set('catalog');
  }
  profile(vendor: SharedVendor): void {
    this.profileDraft = structuredClone(
      this.profiles().find((row) => row.vendorId === vendor.id) || this.emptyProfile(vendor.id),
    );
    this.editor.set('profile');
  }
  service(row?: VendorService): void {
    this.selectedId.set(row?.id || null);
    this.serviceDraft = row
      ? structuredClone(row)
      : {
          vendorId: '',
          machineId: '',
          type: 'External Service',
          description: '',
          amount: 0,
          currency: 'USD',
          attachments: [],
        };
    if (row) this.serviceDraft.status = this.nextStates(row.status)[0] || row.status;
    this.editor.set('service');
  }
  nextStates(status: string): string[] {
    return (
      (
        {
          Scheduled: ['In Progress', 'Cancelled'],
          'In Progress': ['On Hold', 'Completed'],
          'On Hold': ['In Progress', 'Cancelled'],
          Submitted: ['Approved', 'Rejected'],
          Approved: ['Resolved', 'Cancelled'],
        } as Record<string, string[]>
      )[status] || []
    );
  }
  availableStates(): string[] {
    const row = this.services().find((row) => row.id === this.selectedId());
    return row ? this.nextStates(row.status) : [];
  }
  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const request =
      this.editor() === 'catalog'
        ? this.facade.saveSharedVendor(this.selectedId(), this.vendorDraft)
        : this.editor() === 'profile'
          ? this.facade.saveVendorProfile(this.profileDraft)
          : this.selectedId()
            ? this.facade.updateVendorService(this.selectedId() as string, this.serviceDraft)
            : this.facade.createVendorService(this.serviceDraft);
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.editor.set(null);
        this.load();
      },
      error: (error: unknown) => this.fail(error),
    });
  }
  private emptyProfile(vendorId: string): VendorProfile {
    return {
      vendorId,
      vendor: '',
      address: '',
      specializations: '',
      productsSupplied: '',
      contractDetails: '',
      warrantyDetails: '',
      attachments: [],
    };
  }
  private fail(error: unknown): void {
    const response = error as { error?: { error?: { message?: string }; message?: string } };
    this.error.set(
      response?.error?.error?.message ||
        response?.error?.message ||
        'The vendor request could not be completed.',
    );
  }
}
