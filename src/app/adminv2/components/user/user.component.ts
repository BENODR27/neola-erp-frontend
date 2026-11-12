import { Component, OnInit , signal} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../shared/services/api/api.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';

interface ManagedUser {
  id: number;
  employeeCode: string;
  employeeName: string;
  isActive: boolean;
  roles: Array<{ id: number; name: string }>;
}

interface ManagedRole {
  id: number;
  name: string;
  enabled: boolean;
}

interface ManagedScope {
  id?: number;
  applicationName: string;
  organizationId?: string | null;
  organizationName?: string | null;
  factoryId?: string | null;
  factoryName?: string | null;
  enabled?: boolean;
}

@Component({
  selector: 'app-user',
  standalone: false,
  templateUrl: './user.component.html',
  styleUrl: './user.component.css',
})
export class UserComponent implements OnInit {
  readonly datas = signal<ManagedUser[]>([])
  readonly roles = signal<ManagedRole[]>([])
  form: FormGroup;
  readonly selectedRoles = signal<number[]>([])
  selectedUserId: number | null = null;
  readonly roleSearch = signal('')
  readonly userSearch = signal('')
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all')
  readonly roleFilter = signal('all')
  currentPage = 1;
  readonly pageSize = signal(10)
  readonly pageSizeOptions = [10, 25, 50];
  readonly isSaving = signal(false)
  isLoadingUsers = false;
  readonly isLoadingRoles = signal(false)
  readonly selectedScopes = signal<ManagedScope[]>([])
  readonly isLoadingScopes = signal(false)
  readonly isSavingScopes = signal(false)
  scopeForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
    private notificationService: NotificationService,
  ) {
    this.form = this.formBuilder.group({
      employeeCode: ['', Validators.required],
      employeeName: ['', Validators.required],
      authCode: [''],
      confirmAuthCode: [''],
    });
    this.scopeForm = this.formBuilder.group({
      applicationName: ['MMMS', Validators.required],
      organizationId: [''], organizationName: [''], factoryId: [''], factoryName: [''],
    });
  }

  get isEditing(): boolean {
    return this.selectedUserId !== null;
  }

  get filteredUsers(): ManagedUser[] {
    const query = this.userSearch().trim().toLocaleLowerCase();
    return this.datas().filter((user) => {
      const matchesSearch =
        !query ||
        [
          user.employeeName,
          user.employeeCode,
          ...user.roles.map((role) => role.name),
        ].some((value) => value?.toLocaleLowerCase().includes(query));
      const matchesStatus =
        this.statusFilter() === 'all' ||
        (this.statusFilter() === 'active' && user.isActive) ||
        (this.statusFilter() === 'inactive' && !user.isActive);
      const matchesRole =
        this.roleFilter() === 'all' ||
        user.roles.some((role) => String(role.id) === this.roleFilter());

      return matchesSearch && matchesStatus && matchesRole;
    });
  }

  get pagedUsers(): ManagedUser[] {
    const start = (this.currentPage - 1) * this.pageSize();
    return this.filteredUsers.slice(start, start + this.pageSize());
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize()));
  }

  get pageStart(): number {
    return this.filteredUsers.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize() + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize(), this.filteredUsers.length);
  }

  get assignedRoles(): Array<{ id: number; name: string }> {
    const roles = new Map<number, string>();
    for (const user of this.datas()) {
      for (const role of user.roles ?? []) {
        roles.set(role.id, role.name);
      }
    }
    return [...roles.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  get filteredAssignableRoles(): ManagedRole[] {
    const query = this.roleSearch().trim().toLocaleLowerCase();
    return this.roles().filter((role) =>
      role.name.toLocaleLowerCase().includes(query),
    );
  }

  onRoleSearch(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.roleSearch.set(target.value);
    }
  }

  onUserSearch(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.userSearch.set(target.value);
      this.currentPage = 1;
    }
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      this.statusFilter.set(target.value as 'all' | 'active' | 'inactive');
      this.currentPage = 1;
    }
  }

  onRoleFilterChange(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      this.roleFilter.set(target.value);
      this.currentPage = 1;
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      this.pageSize.set(Number(target.value));
      this.currentPage = 1;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get passwordMismatch(): boolean {
    const password = this.form.get('authCode')?.value;
    const confirmation = this.form.get('confirmAuthCode')?.value;
    return Boolean((password || confirmation) && password !== confirmation);
  }

  get canSave(): boolean {
    const password = this.form.get('authCode')?.value;
    const confirmation = this.form.get('confirmAuthCode')?.value;
    const employeeCode = this.form.get('employeeCode')?.value;
    const employeeName = this.form.get('employeeName')?.value;
    return (
      this.form.valid &&
      Boolean(employeeCode?.trim()) &&
      Boolean(employeeName?.trim()) &&
      this.selectedRoles().length > 0 &&
      (this.isEditing || Boolean(password)) &&
      (!password && !confirmation ? this.isEditing : password === confirmation) &&
      !this.isSaving()
    );
  }

  ngOnInit(): void {
    this.fetchAllUsers();
    this.fetchAllRoles();
  }

  fetchAllUsers(): void {
    this.isLoadingUsers = true;
    this.apiService.getDatas(AAC.API_URL + AAC.USERS).subscribe({
      next: (response) => {
        this.datas.set(response.result ?? []);
        this.isLoadingUsers = false;
        this.currentPage = Math.min(this.currentPage, this.totalPages);
      },
      error: (error) => {
        this.isLoadingUsers = false;
        this.showError(error, 'Unable to load user accounts.');
      },
    });
  }

  fetchAllRoles(): void {
    this.isLoadingRoles.set(true);
    this.apiService.getDatas(AAC.API_URL + AAC.ROLES).subscribe({
      next: (response) => {
        this.roles.set((response.result ?? []).filter((role: ManagedRole) => role.enabled));
        this.isLoadingRoles.set(false);
      },
      error: (error) => {
        this.isLoadingRoles.set(false);
        this.showError(error, 'Unable to load available roles.');
      },
    });
  }

  startCreate(): void {
    this.selectedUserId = null;
    this.selectedRoles.set([]);
    this.roleSearch.set('');
    this.form.reset({
      employeeCode: '',
      employeeName: '',
      authCode: '',
      confirmAuthCode: '',
    });
  }

  onRoleChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const roleId = Number(checkbox.value);
    this.selectedRoles.set(checkbox.checked
      ? [...new Set([...this.selectedRoles(), roleId])]
      : this.selectedRoles().filter((id) => id !== roleId));
  }

  isSelected(roleId: number): boolean {
    return this.selectedRoles().includes(roleId);
  }

  onEdit(user: ManagedUser): void {
    this.selectedUserId = user.id;
    this.selectedRoles.set(user.roles.map((role) => role.id));
    this.roleSearch.set('');
    this.form.reset({
      employeeCode: user.employeeCode,
      employeeName: user.employeeName,
      authCode: '',
      confirmAuthCode: '',
    });
  }

  saveUser(): void {
    this.form.markAllAsTouched();
    if (!this.canSave) return;

    const values = this.form.getRawValue();
    const userId = this.selectedUserId;
    const payload: {
      employeeCode: string;
      employeeName: string;
      roleIds: number[];
      authCode?: string;
    } = {
      employeeCode: values.employeeCode.trim(),
      employeeName: values.employeeName.trim(),
      roleIds: this.selectedRoles(),
    };
    if (values.authCode) payload.authCode = values.authCode;

    this.isSaving.set(true);
    const request = userId !== null
      ? this.apiService.updateData(
          userId,
          payload,
          AAC.API_URL + AAC.USERS,
        )
      : this.apiService.addData(payload, AAC.API_URL + AAC.USERS);

    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.notificationService.success(
          'User saved',
          this.isEditing
            ? 'The user account was updated.'
            : 'The user account was created.',
        );
        this.closeModal();
        this.startCreate();
        this.fetchAllUsers();
      },
      error: (error) => {
        this.isSaving.set(false);
        this.showError(error, 'Unable to save this user account.');
      },
    });
  }

  openScopes(user: ManagedUser): void {
    this.selectedUserId = user.id;
    this.selectedScopes.set([]);
    this.isLoadingScopes.set(true);
    this.apiService.getDatas(`${AAC.API_URL}${AAC.USERS}/${user.id}${AAC.USER_SCOPES}`).subscribe({
      next: (response) => { this.selectedScopes.set(response.result ?? []); this.isLoadingScopes.set(false); },
      error: (error) => { this.isLoadingScopes.set(false); this.showError(error, 'Unable to load data access scopes.'); },
    });
  }

  addScope(): void {
    const value = this.scopeForm.getRawValue() as ManagedScope;
    if (!value.organizationId && !value.organizationName && !value.factoryId && !value.factoryName) {
      this.scopeForm.markAllAsTouched();
      this.showError(null, 'Enter an organization or factory boundary for this assignment.');
      return;
    }
    this.selectedScopes.set([...this.selectedScopes(), { ...value, enabled: true }]);
    this.scopeForm.patchValue({ organizationId: '', organizationName: '', factoryId: '', factoryName: '' });
  }

  removeScope(index: number): void { this.selectedScopes.set(this.selectedScopes().filter((_, itemIndex) => itemIndex !== index)); }

  saveScopes(): void {
    if (this.selectedUserId === null) return;
    this.isSavingScopes.set(true);
    this.apiService.putAtUrl(`${AAC.API_URL}${AAC.USERS}/${this.selectedUserId}${AAC.USER_SCOPES}`, { scopes: this.selectedScopes() }).subscribe({
      next: () => { this.isSavingScopes.set(false); this.notificationService.success('Access scope saved', 'The user can now see only the assigned organization or factory data.'); this.closeScopeModal(); },
      error: (error) => { this.isSavingScopes.set(false); this.showError(error, 'Unable to save data access scopes.'); },
    });
  }

  scopeSummary(scope: ManagedScope): string {
    const boundary = scope.factoryName || scope.factoryId ? `Factory: ${scope.factoryName || scope.factoryId}` : `Organization: ${scope.organizationName || scope.organizationId}`;
    return `${scope.applicationName} · ${boundary}`;
  }

  private closeScopeModal(): void { document.querySelector<HTMLButtonElement>('#userscopes [data-bs-dismiss="modal"]')?.click(); }

  toggleStatus(user: ManagedUser): void {
    const enabled = !user.isActive;
    const url = `${AAC.API_URL}${AAC.USERS}/${user.id}/status?enable=${enabled}`;
    this.apiService.patchDataAtUrl(url, {}).subscribe({
      next: () => {
        this.notificationService.success(
          'Status updated',
          `${user.employeeName} is now ${enabled ? 'active' : 'inactive'}.`,
        );
        this.fetchAllUsers();
      },
      error: (error) => this.showError(error, 'Unable to update user status.'),
    });
  }

  async deleteUser(user: ManagedUser): Promise<void> {
    const confirmation = await this.notificationService.confirm(
      `Delete the account for ${user.employeeName}?`,
      'Delete user',
      'Cancel',
    );
    if (!confirmation.isConfirmed) return;

    this.apiService.deleteData(user.id, AAC.API_URL + AAC.USERS).subscribe({
      next: () => {
        this.notificationService.success(
          'User deleted',
          'The user account was removed.',
        );
        this.fetchAllUsers();
      },
      error: (error) => this.showError(error, 'Unable to delete this user.'),
    });
  }

  private closeModal(): void {
    document
      .querySelector<HTMLButtonElement>(
        '#useraddedit [data-bs-dismiss="modal"]',
      )
      ?.click();
  }

  private showError(error: any, fallback: string): void {
    const message = error?.error?.message ?? fallback;
    this.notificationService.error('Request failed', message);
  }
}
