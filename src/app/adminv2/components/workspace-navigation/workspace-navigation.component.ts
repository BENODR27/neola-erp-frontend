import { Component, OnInit , signal} from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { ApiService } from '../../../shared/services/api/api.service';
import { ADMIN_API_CONSTANTS as AAC } from '../../constants/admin-api.constants';

interface NavigationItem {
  icon: string;
  link: string;
  label: string;
  permission: string;
}

interface NavigationConfiguration {
  applicationName: string;
  landingRoute: string;
  navbarItems: NavigationItem[];
}

@Component({
  selector: 'app-workspace-navigation',
  standalone: false,
  templateUrl: './workspace-navigation.component.html',
  styleUrl: './workspace-navigation.component.css',
})
export class WorkspaceNavigationComponent implements OnInit {
  readonly configurations = signal<NavigationConfiguration[]>([])
  form: FormGroup;
  selectedApplicationName: string | null = null;
  readonly isLoading = signal(false)
  readonly isSaving = signal(false)
  readonly isCreating = signal(false)
  readonly loadingError = signal(false)

  get navbarItems(): FormArray {
    return this.form.get('navbarItems') as FormArray;
  }

  constructor(
    private formBuilder: FormBuilder,
    private apiService: ApiService,
  ) {
    this.form = this.formBuilder.group({
      applicationName: ['', [Validators.required, Validators.pattern(/\S/)]],
      landingRoute: ['', [Validators.required, Validators.pattern(/^\/(?!\/)\S+/)]],
      navbarItems: this.formBuilder.array([]),
    });
  }

  ngOnInit(): void {
    this.loadConfigurations();
  }

  loadConfigurations(): void {
    this.isLoading.set(true);
    this.loadingError.set(false);
    this.apiService
      .getDatas(`${AAC.API_URL}${AAC.APPLICATIONS}/navigation`)
      .pipe(finalize(() => (this.isLoading.set(false))))
      .subscribe({
        next: (response) => {
          if (!Array.isArray(response?.result)) {
            console.error('Invalid workspace navigation response:', response);
            this.loadingError.set(true);
            return;
          }
          this.configurations.set(response.result);
          if (
            this.selectedApplicationName &&
            !this.isCreating()
          ) {
            const selected = this.configurations().find(
              (item) => item.applicationName === this.selectedApplicationName,
            );
            if (selected) this.selectConfiguration(selected);
          }
        },
        error: (error) => {
          console.error('Error loading workspace navigation:', error);
          this.loadingError.set(true);
          Swal.fire({
            title: 'Unable to load workspace navigation',
            text: 'Check your access and API connection, then try again.',
            icon: 'error',
          });
        },
      });
  }

  selectConfiguration(configuration: NavigationConfiguration): void {
    this.selectedApplicationName = configuration.applicationName;
    this.isCreating.set(false);
    this.setForm(configuration, true);
  }

  startNewConfiguration(): void {
    this.selectedApplicationName = null;
    this.isCreating.set(true);
    this.setForm(
      { applicationName: '', landingRoute: '', navbarItems: [] },
      false,
    );
  }

  addItem(): void {
    this.navbarItems.push(this.createItemForm());
  }

  removeItem(index: number): void {
    this.navbarItems.removeAt(index);
  }

  save(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const applicationName = String(value.applicationName).trim();
    const payload = {
      landingRoute: String(value.landingRoute).trim(),
      navbarItems: value.navbarItems.map((item: NavigationItem) => ({
        icon: item.icon.trim(),
        link: item.link.trim(),
        label: item.label.trim(),
        permission: item.permission.trim(),
      })),
    };

    this.isSaving.set(true);
    this.apiService
      .putAtUrl(
        `${AAC.API_URL}${AAC.APPLICATIONS}/navigation/${encodeURIComponent(applicationName)}`,
        payload,
      )
      .pipe(finalize(() => (this.isSaving.set(false))))
      .subscribe({
        next: () => {
          this.selectedApplicationName = applicationName;
          this.isCreating.set(false);
          this.loadConfigurations();
          Swal.fire({
            title: 'Navigation saved',
            text: `${applicationName} navigation is up to date.`,
            icon: 'success',
            timer: 1500,
          });
        },
        error: (error) => {
          console.error('Error saving workspace navigation:', error);
          Swal.fire({
            title: 'Unable to save navigation',
            text: 'Check the application name, routes, and navigation item fields.',
            icon: 'error',
          });
        },
      });
  }

  async deleteConfiguration(): Promise<void> {
    const applicationName = this.selectedApplicationName;
    if (!applicationName || this.isSaving()) return;
    const confirmation = await Swal.fire({
      title: `Delete ${applicationName}?`,
      html: `<div class="text-start"><p>This will permanently remove:</p><ul><li><strong>Application:</strong> ${this.escapeHtml(applicationName)}</li><li><strong>Navigation configuration:</strong> ${this.navbarItems.length} navbar items</li><li><strong>Application-theme link:</strong> removed when present</li></ul><p class="mb-0">The theme definition itself will be preserved.</p></div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete application',
      confirmButtonColor: '#dc3545',
      focusCancel: true,
    });
    if (!confirmation.isConfirmed) return;

    this.isSaving.set(true);
    this.apiService
      .deleteAtUrl(
        `${AAC.API_URL}${AAC.APPLICATIONS}/navigation/${encodeURIComponent(applicationName)}`,
      )
      .pipe(finalize(() => (this.isSaving.set(false))))
      .subscribe({
        next: () => {
          this.configurations.set(this.configurations().filter(
            (item) => item.applicationName !== applicationName,
          ));
          this.selectedApplicationName = null;
          this.isCreating.set(false);
          this.setForm(
            { applicationName: '', landingRoute: '', navbarItems: [] },
            false,
          );
          Swal.fire({
            title: 'Application deleted',
            text: 'The application, navigation, and related link were removed.',
            icon: 'success',
            timer: 1300,
            showConfirmButton: false,
          });
        },
        error: (error) => {
          console.error('Error deleting workspace navigation:', error);
          Swal.fire({
            title: 'Unable to delete navigation',
            text: 'Please retry. Existing workspace links may depend on this configuration.',
            icon: 'error',
          });
        },
      });
  }

  cancel(): void {
    this.selectedApplicationName = null;
    this.isCreating.set(false);
    this.setForm({ applicationName: '', landingRoute: '', navbarItems: [] }, false);
  }

  private setForm(
    configuration: NavigationConfiguration,
    lockApplicationName: boolean,
  ): void {
    this.form.setControl(
      'navbarItems',
      this.formBuilder.array(
        configuration.navbarItems.map((item) => this.createItemForm(item)),
      ),
    );
    this.form.patchValue({
      applicationName: configuration.applicationName,
      landingRoute: configuration.landingRoute,
    });
    const applicationNameControl = this.form.get('applicationName');
    if (lockApplicationName) applicationNameControl?.disable();
    else applicationNameControl?.enable();
  }

  private createItemForm(item?: NavigationItem): FormGroup {
    return this.formBuilder.group({
      icon: [item?.icon ?? '', Validators.required],
      link: [
        item?.link ?? '',
        [Validators.required, Validators.pattern(/^\/(?!\/)\S+/)],
      ],
      label: [item?.label ?? '', Validators.required],
      permission: [item?.permission ?? '', Validators.required],
    });
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    })[character] ?? character);
  }
}
