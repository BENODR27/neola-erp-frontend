import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { AuthService } from '../../../auth/services/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api/api.service';
import { ADMIN_API_CONSTANTS as AAC } from '../../../adminv2/constants/admin-api.constants';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

interface WorkspaceApplication {
  id: number;
  applicationName: string | null;
  applicationIcon: string | null;
  requiredPermission: string | null;
  applicationTheme?: {
    theme?: { id: number | string; name: string } | null;
  } | null;
  name: string;
  icon: string;
}

interface WorkspaceNavigationItem {
  icon: string;
  link: string;
  label: string;
  permission: string;
}

interface WorkspaceNavigation {
  applicationName: string | null;
  landingRoute?: string | null;
  navbarItems?: WorkspaceNavigationItem[] | null;
}

@Component({
  selector: 'app-applications',
  imports: [CommonModule],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.css',
  animations: [
    trigger('cardAnim', [
      state('hover', style({ transform: 'scale(1.05)' })),
      state('normal', style({ transform: 'scale(1)' })),
      transition('normal <=> hover', animate('200ms ease-in-out')),
    ]),
  ],
})
export class ApplicationsComponent implements OnInit {
  readonly applicationSearch = signal('');
  readonly hasSearched = signal(false);
  readonly applications = signal<WorkspaceApplication[]>([]);
  readonly workspaceNavigation = signal<WorkspaceNavigation[]>([]);
  readonly iamWorkspace = computed(() =>
    this.workspaceNavigation().find(
      (entry) => entry.applicationName?.trim().toLowerCase() === 'superadminv2',
    ),
  );
  readonly applicationLoadError = signal(false);
  readonly isLoadingApplications = signal(false);
  readonly deletingApplicationId = signal<number | null>(null);

  readonly cardStates = signal<{ [key: string]: 'normal' | 'hover' }>({});

  readonly visibleApplications = computed(() => {
    const searchTerm = this.applicationSearch().trim().toLocaleLowerCase();

    return this.applications().filter((app) => {
      const canOpen = app.requiredPermission
        ? this.authService.hasPermission(app.requiredPermission)
        : this.authService.hasPermission('superadmin');
      return canOpen && (app.applicationName ?? '').toLocaleLowerCase().includes(searchTerm);
    });
  });

  constructor(
    public authService: AuthService,
    private router: Router,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    this.isLoadingApplications.set(true);
    this.apiService.getDatas(AAC.API_URL + AAC.APPLICATIONS + '/workspace').subscribe({
      next: (response) => {
        if (!Array.isArray(response?.result) || !Array.isArray(response?.navigation)) {
          console.error('Invalid workspace catalog response:', response);
          this.applicationLoadError.set(true);
          this.isLoadingApplications.set(false);
          return;
        }
        console.log('applications loaded');
        this.applications.set(
          response.result
            .filter(
              (application: unknown): application is Omit<WorkspaceApplication, 'name' | 'icon'> =>
                !!application &&
                typeof application === 'object' &&
                typeof (application as { applicationName?: unknown }).applicationName ===
                  'string' &&
                (application as { applicationName: string }).applicationName
                  .trim()
                  .toLocaleLowerCase() !== 'root',
            )
            .map((application: Omit<WorkspaceApplication, 'name' | 'icon'>) => ({
              ...application,
              name: application.applicationName ?? '',
              icon: application.applicationIcon || 'bi-app-indicator',
            })),
        );
        this.workspaceNavigation.set(
          (response.navigation as WorkspaceNavigation[]).map((configuration) => ({
            ...configuration,
            landingRoute: this.normalizeAdminRoute(configuration.landingRoute),
            navbarItems: Array.isArray(configuration.navbarItems)
              ? configuration.navbarItems.map((item) => ({
                  icon: item.icon ?? '',
                  link: this.normalizeAdminRoute(item.link),
                  label: item.label ?? '',
                  permission: item.permission ?? '',
                }))
              : [],
          })),
        );
        this.applicationLoadError.set(false);
        this.isLoadingApplications.set(false);
      },
      error: (error) => {
        console.error('Error loading workspace applications:', error);
        this.applicationLoadError.set(true);
        this.isLoadingApplications.set(false);
      },
    });
  }

  trackApplicationById(_index: number, application: WorkspaceApplication): number {
    return application.id;
  }

  onApplicationSearch(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.applicationSearch.set(target.value);
      this.hasSearched.set(true);
    }
  }

  matchesSearch(name: string): boolean {
    return name.toLocaleLowerCase().includes(this.applicationSearch().trim().toLocaleLowerCase());
  }

  openApplicationManagement(): void {
    this.router.navigateByUrl('/adminv2/application');
  }

  openAdminV2Workspace(): void {
    const destination = this.iamWorkspace()?.landingRoute;
    if (destination) void this.router.navigateByUrl(this.normalizeAdminRoute(destination));
  }

  async onApplicationClick(appName: string): Promise<void> {
    const requestedName = appName.trim().toLocaleLowerCase();
    const configuration = this.workspaceNavigation().find(
      (entry) => entry.applicationName?.trim().toLocaleLowerCase() === requestedName,
    );

    if (!configuration?.landingRoute) {
      console.error('No workspace navigation configured for application:', appName);
      void Swal.fire({
        icon: 'info',
        title: 'Workspace unavailable',
        text: 'Ask an administrator to configure this application.',
      });
      return;
    }

    await this.router.navigateByUrl(this.normalizeAdminRoute(configuration.landingRoute));
  }

  async deleteApplication(event: Event, application: WorkspaceApplication): Promise<void> {
    event.stopPropagation();
    if (
      !this.authService.hasPermission('applications:manage') ||
      this.deletingApplicationId() !== null
    ) {
      return;
    }

    const navigation = this.workspaceNavigation().find(
      (entry) =>
        entry.applicationName?.trim().toLocaleLowerCase() ===
        application.name.trim().toLocaleLowerCase(),
    );
    const theme = application.applicationTheme?.theme;
    const navigationSummary = navigation
      ? `<li><strong>Navigation:</strong> ${this.escapeHtml(navigation.applicationName ?? application.name)} (${navigation.navbarItems?.length ?? 0} navbar items)</li>`
      : '<li><strong>Navigation:</strong> none configured</li>';
    const themeSummary = theme
      ? `<li><strong>Theme link:</strong> ${this.escapeHtml(theme.name)} (theme definition preserved)</li>`
      : '<li><strong>Theme link:</strong> none</li>';

    const confirmation = await Swal.fire({
      title: `Delete ${application.name}?`,
      html: `<div class="text-start"><p>This will permanently remove:</p><ul><li><strong>Application:</strong> ${this.escapeHtml(application.name)} (ID ${application.id})</li>${navigationSummary}${themeSummary}</ul><p class="mb-0">This action cannot be undone.</p></div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete application',
      confirmButtonColor: '#dc3545',
      cancelButtonText: 'Cancel',
      focusCancel: true,
    });
    if (!confirmation.isConfirmed) return;

    this.deletingApplicationId.set(application.id);
    this.apiService
      .deleteData(application.id, AAC.API_URL + AAC.APPLICATIONS)
      .pipe(finalize(() => this.deletingApplicationId.set(null)))
      .subscribe({
        next: () => {
          this.applications.set(this.applications().filter((item) => item.id !== application.id));
          this.workspaceNavigation.set(
            this.workspaceNavigation().filter(
              (item) =>
                item.applicationName?.trim().toLocaleLowerCase() !==
                application.name.trim().toLocaleLowerCase(),
            ),
          );
          Swal.fire({
            title: 'Application deleted',
            text: `${application.name} and its related workspace data were removed.`,
            icon: 'success',
            timer: 1600,
            showConfirmButton: false,
          });
        },
        error: (error) => {
          console.error('Error deleting application:', error);
          Swal.fire({
            title: 'Unable to delete application',
            text: 'The application was not changed. Please retry.',
            icon: 'error',
          });
        },
      });
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>'"]/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;',
        })[character] ?? character,
    );
  }

  private normalizeAdminRoute(route: string | null | undefined): string {
    if (typeof route !== 'string') return '';

    return route.replace(/^\/admin(?:v2)?(?=\/|$)/, '/adminv2');
  }

  setCardState(key: string, state: 'normal' | 'hover') {
    this.cardStates.update((states) => ({ ...states, [key]: state }));
  }
  getCardState(key: string) {
    return this.cardStates()[key] || 'normal';
  }
}
