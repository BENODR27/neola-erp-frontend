import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';
import { ResponseInterceptor } from './auth/interceptors/response.interceptor';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { warehouseReducer } from './warehousemanagement/store/warehouse/warehouse.reducer';
import { WarehouseEffects } from './warehousemanagement/store/warehouse/warehouse.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor, ResponseInterceptor])),
    provideAnimationsAsync(),
    provideStore({
      warehouse: warehouseReducer,
    }),
    provideEffects([WarehouseEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
