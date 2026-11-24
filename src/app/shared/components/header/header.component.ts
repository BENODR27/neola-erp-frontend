import { Component, EventEmitter, HostListener, Input, Output, signal } from '@angular/core';
import { filter, map } from 'rxjs/operators';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalStorageService } from '../../services/local-storage/local-storage.service';
import { APP_CONFIG } from '../../config/app-config';
import { APP_CONSTANTS } from '../../config/app-constants';
import { SecondNavbarComponent } from '../second-navbar/second-navbar.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, SecondNavbarComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  readonly appConfig = APP_CONFIG;
  readonly appRoutes = APP_CONSTANTS.routes;
  @Input() navigationOpen = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  readonly isProfileMenuOpen = signal(false);
  readonly currentEmpName = signal('');

  toggle() {
    this.toggleSidebar.emit();
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen.set(!this.isProfileMenuOpen());
  }

  @HostListener('document:click', ['$event'])
  closeProfileMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && !target.closest('.profile-control')) {
      this.isProfileMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  closeProfileMenuOnEscape(): void {
    this.isProfileMenuOpen.set(false);
  }

  logout(): void {
    this.isProfileMenuOpen.set(false);
    Swal.fire({
      title: 'Do you want to Logout?',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      denyButtonText: 'No',
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        Swal.fire('Logout SuccessFully!', '', 'success');
      }
    });
  }

  pageTitle = APP_CONFIG.defaultTitle;

  get workspaceBrand(): string {
    const section = this.router.url.split('/')[1]?.split(/[?#]/, 1)[0];
    return section === 'adminv2'
      ? 'IAM'
      : section && !['appearance', 'home', 'applications'].includes(section)
        ? section.toUpperCase()
        : APP_CONFIG.name;
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private authService: AuthService,
    private localStorageService: LocalStorageService,
  ) {
    this.refreshCurrentEmployeeName();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let child = this.activatedRoute.firstChild;
          while (child?.firstChild) {
            child = child.firstChild;
          }
          const page =
            this.router.url.split(/[?#]/, 1)[0].split('/').filter(Boolean).pop() || 'Workspace';
          return (
            child?.snapshot.data['title'] ||
            page.replace(/-/g, ' ').replace(/^./, (letter) => letter.toUpperCase())
          );
        }),
      )
      .subscribe((title) => {
        this.refreshCurrentEmployeeName();
        this.pageTitle = title;
        this.titleService.setTitle(`${title} · ${APP_CONFIG.name}`);
      });
  }

  private refreshCurrentEmployeeName(): void {
    this.currentEmpName.set(
      this.localStorageService.getItem<string>(APP_CONSTANTS.storage.currentEmployeeName)?.trim() ||
        '',
    );
  }
}
