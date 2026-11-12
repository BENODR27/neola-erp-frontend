import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MmmsContextService } from '../../mmms/services/mmms-context.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) return true;

  return router.createUrlTree(['/signin'], {
    queryParams: { returnUrl: state.url },
  });
};

export const permissionGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const permission = route.data['permission'] as string | undefined;
  const previewAccess = route.data['previewAccess'] === true || route.parent?.data['previewAccess'] === true;

  if (previewAccess) return true;

  if (authService.isAuthenticated() && authService.hasPermission(permission)) return true;

  return router.createUrlTree(['/signin']);
};

/**
 * Prevents maintenance data from being viewed without a concrete factory scope.
 * Organization and factory administration routes intentionally remain available
 * when the context is set to "All permitted" so administrators can establish the
 * structure before selecting an operating site.
 */
export const mmmsContextGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const contextService = inject(MmmsContextService);

  if (!authService.isAuthenticated()) return router.createUrlTree(['/signin']);
  if (route.data['requiresMmmsContext'] !== true || contextService.context().factoryId) return true;

  return router.createUrlTree(['/mmms/organization'], {
    queryParams: { contextRequired: 'factory' },
  });
};

export const adminV2Guard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.hasPermission('*')) {
    return true;
  }

  return router.createUrlTree(['/signin']);
};
