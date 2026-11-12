import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { ApiService } from '../../../shared/services/api/api.service';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';

interface ApplicationRecord {
  id: number;
  applicationName: string;
  applicationIcon: string | null;
  requiredPermission: string | null;
}

@Component({
  selector: 'app-application-management',
  standalone: false,
  templateUrl: './application-management.component.html',
  styleUrl: './application-management.component.css',
})
export class ApplicationManagementComponent implements OnInit {
  readonly applications = signal<ApplicationRecord[]>([]);
  form: FormGroup;
  readonly selectedApplicationId = signal<number | null>(null);
  readonly isLoadingApplications = signal(false);
  readonly isSaving = signal(false);
  readonly loadingError = signal(false);

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
  ) {
    this.form = this.formBuilder.group({
      applicationName: ['', [Validators.required, Validators.pattern(/\S/)]],
      applicationIcon: ['bi-app-indicator'],
      requiredPermission: [''],
    });
  }

  ngOnInit(): void {
    this.fetchApplications();
  }

  fetchApplications(showLoading = this.applications().length === 0): void {
    this.isLoadingApplications.set(showLoading);
    this.loadingError.set(false);
    this.apiService
      .getDatas(AAC.API_URL + AAC.APPLICATIONS)
      .pipe(
        finalize(() => {
          if (showLoading) {
            this.isLoadingApplications.set(false);
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (!Array.isArray(response?.result)) {
            console.error('Invalid application list response:', response);
            this.loadingError.set(true);
            return;
          }
          this.applications.set(response.result);
        },
        error: (error) => {
          console.error('Error loading applications:', error);
          this.loadingError.set(true);
          Swal.fire({
            title: 'Unable to load applications',
            text: 'Please check your connection and try again.',
            icon: 'error',
          });
        },
      });
  }

  save(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const values = this.form.getRawValue();
    const payload = {
      applicationName: values.applicationName.trim(),
      applicationIcon: values.applicationIcon.trim() || null,
      requiredPermission: values.requiredPermission.trim() || null,
    };
    const selectedApplicationId = this.selectedApplicationId();
    const isEditing = selectedApplicationId !== null;
    const request = selectedApplicationId !== null
      ? this.apiService.updateData(
          selectedApplicationId,
          payload,
          AAC.API_URL + AAC.APPLICATIONS,
        )
      : this.apiService.addData(payload, AAC.API_URL + AAC.APPLICATIONS);

    this.isSaving.set(true);
    request
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.resetForm();
          this.fetchApplications(false);
          Swal.fire({
            title: isEditing ? 'Application updated' : 'Application created',
            text: isEditing
              ? 'Application catalog settings were updated.'
              : `${payload.applicationName} is ready for permissions.`,
            icon: 'success',
            timer: 1500,
          });
        },
        error: (error) => {
          console.error('Error saving application:', error);
          Swal.fire({
            title: isEditing ? 'Unable to update application' : 'Unable to create application',
            text: 'Check the application name and try again.',
            icon: 'error',
          });
        },
      });
  }

  edit(application: ApplicationRecord): void {
    this.selectedApplicationId.set(application.id);
    this.form.reset({
      applicationName: application.applicationName,
      applicationIcon: application.applicationIcon || '',
      requiredPermission: application.requiredPermission || '',
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.selectedApplicationId.set(null);
    this.form.reset({
      applicationName: '',
      applicationIcon: 'bi-app-indicator',
      requiredPermission: '',
    });
  }
}
