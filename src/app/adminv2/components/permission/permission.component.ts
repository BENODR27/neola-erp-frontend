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
  description?: string;
  enabled?: boolean;
}

interface PermissionGroup {
  applicationName: string;
  permissions: PermissionRecord[];
}

@Component({
  selector: 'app-permission',
  standalone: false,
  templateUrl: './permission.component.html',
  styleUrl: './permission.component.css',
})
export class PermissionComponent {
  readonly datas = signal<PermissionRecord[]>([])
  readonly applications = signal<ApplicationRecord[]>([]);
  form: FormGroup;
  selectedPermissionId: number | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService
  ) {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      appname: ['', Validators.required],
      description: [''],
    });
  }
  ngOnInit(): void {
    this.fetchAllPermissions();
    this.fetchApplications();
  }

  get legacyApplicationNames(): string[] {
    const registeredNames = new Set(
      this.applications().map((application) =>
        application.applicationName.trim().toLocaleLowerCase()
      )
    );
    return [
      ...new Set(
        this.datas()
          .map((permission) => permission.appname?.trim())
          .filter(
            (name): name is string =>
              !!name && !registeredNames.has(name.toLocaleLowerCase())
          )
      ),
    ];
  }

  get permissionGroups(): PermissionGroup[] {
    const groups = new Map<string, PermissionGroup>();
    for (const permission of this.datas()) {
      const applicationName = permission.appname?.trim() || 'General';
      const key = applicationName.toLocaleLowerCase();
      let group = groups.get(key);
      if (!group) {
        group = { applicationName, permissions: [] };
        groups.set(key, group);
      }
      group.permissions.push(permission);
    }

    return [...groups.values()].sort((left, right) => {
      if (left.applicationName === 'General') return 1;
      if (right.applicationName === 'General') return -1;
      return left.applicationName.localeCompare(right.applicationName);
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

  fetchAllPermissions() {
    this.apiService.getDatas(AAC.API_URL + AAC.PERMISSIONS).subscribe({
      next: (response) => {
        this.datas.set(response.result);
        console.log('Filtered Data:', response.result);
      },
      error: (error) => {
        console.error('Error:', error);
      },
    });
  }
  create() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const formData: any = this.form.value;
    this.apiService.addData(formData, AAC.API_URL + AAC.PERMISSIONS).subscribe({
      next: (response) => {
        // if(response.status==200){
        //   Swal.fire({
        //     title: 'Good job!',
        //     timer: 1000,
        //     text: 'Datas fetched Successfully!',
        //     icon: 'success',
        //   });
        // }else{
        //   Swal.fire({
        //     title: 'Failure!',
        //     timer: 1000,
        //     text: 'Something went wrong!',
        //     icon: 'error',
        //   });
        // }
        console.log('Filtered Data:', response);
        this.resetForm();
        this.fetchAllPermissions();
      },
      error: (error) => {
        console.error('Error:', error);
        Swal.fire({
          title: 'Unable to create permission',
          text: 'Please check the permission details and try again.',
          icon: 'error',
        });
      },
    });
  }

  update() {
    if (this.selectedPermissionId === null) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, appname } = this.form.value;
    this.apiService
      .updateData(
        this.selectedPermissionId,
        { name, appname },
        AAC.API_URL + AAC.PERMISSIONS
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.resetForm();
          this.fetchAllPermissions();
          Swal.fire({
            title: 'Permission updated',
            text: 'The permission application assignment has been updated.',
            icon: 'success',
            timer: 1500,
          });
        },
        error: (error) => {
          console.error('Error updating permission:', error);
          Swal.fire({
            title: 'Unable to update permission',
            text: 'Please check the permission details and try again.',
            icon: 'error',
          });
        },
      });
  }

  private closeModal(): void {
    document
      .querySelector<HTMLButtonElement>(
        '#permissioneditadd [data-bs-dismiss="modal"]'
      )
      ?.click();
  }

  save() {
    if (this.selectedPermissionId === null) {
      this.create();
    } else {
      this.update();
    }
  }

  startCreate() {
    this.resetForm();
  }

  private resetForm() {
    this.selectedPermissionId = null;
    this.form.reset({ name: '', appname: '', description: '' });
  }
  deletePermission(permissionId: number) {
    this.apiService
      .deleteData(permissionId, AAC.API_URL + AAC.PERMISSIONS)
      .subscribe({
        next: (response) => {
          this.fetchAllPermissions();
        },
        error: (error) => {
          console.error('Error:', error);
        },
      });
  }
  onEdit(data: PermissionRecord) {
    this.selectedPermissionId = data.id;
    this.form.patchValue({
      name: data.name,
      appname: data.appname ?? '',
      description: data.description ?? '',
    });
  }
}
