import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { catchError, filter, map, merge, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { ApiService } from '../api/api.service';
import { environment } from '../../environments/environment';
import { NavbarItem, WorkspaceCatalog, navigationForUrl } from './workspace-navigation';
export type { NavbarItem } from './workspace-navigation';

@Injectable({ providedIn: 'root' })
export class SharedServiceService {
  readonly navbarItems = signal<NavbarItem[]>([]);
  readonly navigationError = signal('');
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly refresh = new Subject<void>();
  private readonly destroyRef = inject(DestroyRef);
  constructor() {
    effect((cleanup) => {
      const user = this.auth.currentUser();
      if (!user || !this.auth.isAuthenticated()) {
        this.navbarItems.set([]);
        return;
      }
      const routes = this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map((event) => event.urlAfterRedirects),
      );
      const subscription = merge(routes, this.refresh.pipe(map(() => this.router.url)))
        .pipe(
          startWith(this.router.url),
          tap(() => {
            this.navbarItems.set([]);
            this.navigationError.set('');
          }),
          switchMap((url) =>
            this.api.getDatas(environment.authv2ApiUrl + '/api/auth/applications/workspace').pipe(
              map((response) =>
                navigationForUrl((response as WorkspaceCatalog).navigation || [], url),
              ),
              catchError(() => {
                this.navigationError.set(
                  'Navigation could not be loaded from IAM. Retry to refresh your permitted pages.',
                );
                return of([] as NavbarItem[]);
              }),
            ),
          ),
        )
        .subscribe((items) => this.navbarItems.set(items));
      cleanup(() => subscription.unsubscribe());
    });
    this.destroyRef.onDestroy(() => this.refresh.complete());
  }
  reloadNavigation(): void {
    this.refresh.next();
  }
}
