import { Component, signal } from '@angular/core';
import { ApiService } from '../../../shared/services/api/api.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';

interface ApplicationRecord {
  id: number;
  applicationName: string;
}

interface PermissionRecord {
  id: number;
  name: string;
  appname: string | null;
}

@Component({
  selector: 'app-role',
  standalone: false,
  templateUrl: './role.component.html',
  styleUrl: './role.component.css',
})
export class RoleComponent {
  readonly datas = signal<any[]>([]);
  readonly permissions = signal<PermissionRecord[]>([]);
  readonly applications = signal<ApplicationRecord[]>([]);
  form: FormGroup;
  selectedPermissions: number[] = [];
  selectedRoleId: number = 0;
  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
  ) {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      applicationName: [''],
      permissionId: [[]],
    });
  }

  ngOnInit(): void {
    this.fetchAllRoles();
    this.fetchAllPermissions();
    this.fetchApplications();
  }

  fetchAllRoles() {
    this.apiService.getDatas(AAC.API_URL + AAC.ROLES).subscribe({
      next: (response) => {
        this.datas.set(response.result);
        console.log('Roles:', response.result);
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }

  fetchAllPermissions() {
    this.apiService.getDatas(AAC.API_URL + AAC.PERMISSIONS).subscribe({
      next: (response) => {
        this.permissions.set(response.result);
        console.log('Permissions:', response.result);
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }

  fetchApplications() {
    this.apiService.getDatas(AAC.API_URL + AAC.APPLICATIONS).subscribe({
      next: (response) => {
        this.applications.set(response.result);
      },
      error: (error) => {
        console.error('Error loading applications:', error);
      },
    });
  }

  get availableApplications(): ApplicationRecord[] {
    const applications = [...this.applications()];
    const registeredNames = new Set(
      applications.map((application) => application.applicationName.trim().toLocaleLowerCase()),
    );

    for (const permission of this.permissions()) {
      const applicationName = permission.appname?.trim();
      if (applicationName && !registeredNames.has(applicationName.toLocaleLowerCase())) {
        applications.push({ id: 0, applicationName });
        registeredNames.add(applicationName.toLocaleLowerCase());
      }
    }

    return applications;
  }

  get selectedApplicationPermissions(): PermissionRecord[] {
    const selectedName = this.form.get('applicationName')?.value as string;
    if (!selectedName) {
      return [];
    }
    return this.permissions().filter(
      (permission) =>
        permission.appname?.trim().toLocaleLowerCase() === selectedName.trim().toLocaleLowerCase(),
    );
  }

  get unscopedPermissions(): PermissionRecord[] {
    return this.permissions().filter((permission) => !permission.appname?.trim());
  }

  create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const formData = this.form.value;
    const payload = {
      name: formData.name,
      permissionIds: this.selectedPermissions, // Use the array of selected permissions
    };

    this.apiService.addData(payload, AAC.API_URL + AAC.ROLES).subscribe({
      next: (response) => {
        console.log('Role Created:', response);
        Swal.fire({
          title: 'Success!',
          text: 'Role created successfully!',
          icon: 'success',
          timer: 1500,
        });
        this.fetchAllRoles();
      },
      error: (error) => {
        console.error('Error:', error);
        Swal.fire({
          title: 'Error!',
          text: error?.error?.message || 'Unable to save this role.',
          icon: 'error',
          timer: 1500,
        });
      },
    });
  }
  update() {
    if (this.selectedRoleId != 0) {
      const formData = this.form.value;
      const payload = {
        name: formData.name,
        permissionIds: this.selectedPermissions, // Use the array of selected permissions
      };

      this.apiService.updateData(this.selectedRoleId, payload, AAC.API_URL + AAC.ROLES).subscribe({
        next: (response) => {
          console.log('Role Created:', response);
          Swal.fire({
            title: 'Success!',
            text: 'Role created successfully!',
            icon: 'success',
            timer: 1500,
          });
          this.fetchAllRoles();
        },
        error: (error) => {
          console.error('Error:', error);
          Swal.fire({
            title: 'Error!',
            text: error?.error?.message || 'Unable to save this role.',
            icon: 'error',
            timer: 1500,
          });
        },
      });
    }
  }
  onPermissionChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const value = parseInt(checkbox.value, 10);

    if (checkbox.checked) {
      if (!this.selectedPermissions.includes(value)) {
        this.selectedPermissions.push(value);
      }
    } else {
      this.selectedPermissions = this.selectedPermissions.filter((id) => id !== value); // Remove permission ID from array
    }
    console.log('Selected Permissions:', this.selectedPermissions);
  }

  isSelected(permissionId: number): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

  startCreate() {
    this.selectedRoleId = 0;
    this.selectedPermissions = [];
    this.form.reset({ name: '', applicationName: '', permissionId: [] });
  }

  onEdit(row: any) {
    this.selectedRoleId = row?.id; // Store the selected role ID
    const firstApplicationName = Array.isArray(row?.permissions)
      ? (row.permissions.find((permission: PermissionRecord) => permission.appname)?.appname ?? '')
      : '';
    this.form.reset({
      name: row?.name,
      applicationName: firstApplicationName,
      permissionId: [],
    });
    // Set selectedPermissions to the permissions of the selected role
    this.selectedPermissions = Array.isArray(row?.permissions)
      ? row.permissions.map((p: any) => p.id)
      : [];
  }
}
