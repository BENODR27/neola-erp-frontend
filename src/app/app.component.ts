import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { AuthService } from './auth/services/auth.service';
import { PreloaderComponent } from './shared/components/preloader/preloader.component';
import { ThemeComponent } from './shared/components/theme/theme.component';
import { ThemeService } from './shared/services/theme/theme.service';
import { CustomCursorComponent } from './shared/components/custom-cursor/custom-cursor.component';
import { ApiService } from './shared/services/api/api.service';
import { environment } from './shared/environments/environment';
import { Subscription, catchError, interval, of, startWith, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { Title } from '@angular/platform-browser';
import { APP_CONFIG } from './shared/config/app-config';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, PreloaderComponent, CustomCursorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  readonly appConfig = APP_CONFIG;
  private versionCheckSubscription?: Subscription;
  private promptedVersion: string | null = null;
  private isPromptingForUpdate = false;

  constructor(
    public authService: AuthService,
    private themeService: ThemeService,
    private apiService: ApiService,
    private titleService: Title,
  ) {
    this.titleService.setTitle(APP_CONFIG.defaultTitle);
  }

  ngOnInit(): void {
    if (!environment.enableVersionCheck) return;

    this.versionCheckSubscription = interval(60_000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.apiService
            .getDatas(
              `${environment.authv2ApiUrl}/api/auth/version?client=${encodeURIComponent(environment.appVersion)}&check=${Date.now()}`,
            )
            .pipe(
              catchError((error: unknown) => {
                console.warn('Unable to check the application version:', error);
                return of(null);
              }),
            ),
        ),
      )
      .subscribe((response) => {
        if (
          this.authService.isLoggedIn() &&
          typeof response?.version === 'string' &&
          response.version !== environment.appVersion &&
          response.version !== this.promptedVersion &&
          !this.isPromptingForUpdate
        ) {
          void this.handleAvailableUpdate(response.version);
        }
      });
  }

  ngOnDestroy(): void {
    this.versionCheckSubscription?.unsubscribe();
  }

  logout() {
    this.authService.logout();
  }

  private async handleAvailableUpdate(version: string): Promise<void> {
    this.isPromptingForUpdate = true;
    this.promptedVersion = version;

    try {
      await Swal.fire({
        toast: true,
        position: 'top-end',
        title: 'Application update available',
        text: 'The app will refresh and sign you out in 2 minutes.',
        icon: 'warning',
        timer: 120_000,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: {
          popup: 'app-update-toast',
        },
        didOpen: (toast) => {
          toast.style.marginTop = '68px';
          toast.style.background = '#fff8db';
          toast.style.color = '#263650';
          toast.style.border = '2px solid #f0b400';
          toast.style.boxShadow = '0 12px 32px rgba(73, 55, 0, 0.24)';
          const title = toast.querySelector('.swal2-title');
          if (title) title.setAttribute('style', 'color:#263650;font-weight:800');
          const message = toast.querySelector('.swal2-html-container');
          if (message) message.setAttribute('style', 'color:#394b68;font-weight:600');
          const progress = toast.querySelector('.swal2-timer-progress-bar');
          if (progress) progress.setAttribute('style', 'background:#f0b400');
        },
      });

      await this.authService.logout();
      const reloadUrl = new URL(window.location.href);
      reloadUrl.pathname = '/signin';
      reloadUrl.search = '';
      reloadUrl.hash = '';
      reloadUrl.searchParams.set('appVersion', version);
      reloadUrl.searchParams.set('reload', Date.now().toString());
      window.location.replace(reloadUrl.toString());
    } finally {
      this.isPromptingForUpdate = false;
    }
  }
}
