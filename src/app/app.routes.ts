import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { SigninComponent } from './auth/components/signin/signin.component';
import { adminV2Guard, authGuard, permissionGuard } from './auth/guards/auth.guard';
export const routes: Routes = [
  {
    path: 'masters',
    component: MainLayoutComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'MASTERS-APP' },
    loadChildren: () =>
      import('./platform-masters/masters.routes').then((module) => module.MASTERS_ROUTES),
  },
  {
    path: 'subscription-management',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./shared/components/subscription-management/subscription-management.component').then(
            (m) => m.SubscriptionManagementComponent,
          ),
        data: { title: 'Subscription management' },
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'home',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./shared/components/welcome/welcome.component').then((m) => m.WelcomeComponent),
        data: { title: 'Home' },
      },
    ],
  },
  {
    path: 'applications',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./shared/components/applications/applications.component').then(
            (m) => m.ApplicationsComponent,
          ),
        data: { title: 'Applications' },
      },
    ],
  },
  { path: 'adminv2/applications', pathMatch: 'full', redirectTo: 'applications' },
  {
    path: 'appearance',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./shared/components/theme/theme.component').then((m) => m.ThemeComponent),
        data: { title: 'Appearance' },
      },
    ],
  },
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
