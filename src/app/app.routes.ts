import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { SigninComponent } from './auth/components/signin/signin.component';
import { adminV2Guard, authGuard } from './auth/guards/auth.guard';
export const routes: Routes = [
  // Keep the legacy entry point working for older bookmarks.
  { path: 'signin', component: SigninComponent },
  { path: 'auth/login', component: SigninComponent },
  {
    path: 'wms',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    loadChildren: () =>
      import('./warehousemanagement/warehousemanagement.module').then(
        (m) => m.WarehousemanagementModule,
      ),
  },
  {
    path: 'adminv2',
    component: MainLayoutComponent,
    canActivate: [adminV2Guard],
    loadChildren: () => import('./adminv2/admin.module').then((m) => m.AdminModule),
  },
  {
    path: 'mmms',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    loadChildren: () => import('./mmms/mmms.module').then((m) => m.MmmsModule),
  },
  { path: '**', redirectTo: 'signin' },
];
