import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ADMIN_API_CONSTANTS } from './constants/admin-api.constants';

/** Existing bookmarks stay useful after management ownership moves to the console. */
export const subscriptionManagementGuard: CanActivateFn = async () => {
  const http = inject(HttpClient);
  const router = inject(Router);
  try {
    const settings = await firstValueFrom(
      http.get<{ managed: boolean }>(ADMIN_API_CONSTANTS.API_URL + '/control-settings'),
    );
    return settings.managed ? router.createUrlTree(['/subscription-management']) : true;
  } catch {
    return router.createUrlTree(['/home']);
  }
};
