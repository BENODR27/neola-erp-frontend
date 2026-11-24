import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ADMIN_API_CONSTANTS } from '../adminv2/constants/admin-api.constants';
export const sharedMastersGuard: CanActivateFn = async () => {
  const http = inject(HttpClient),
    router = inject(Router);
  const settings = await firstValueFrom(
    http.get<{ sharedMasters: boolean }>(ADMIN_API_CONSTANTS.API_URL + '/control-settings'),
  );
  return settings.sharedMasters ? router.createUrlTree(['/masters']) : true;
};
