import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserComponent } from './components/user/user.component';
import { RoleComponent } from './components/role/role.component';
import { PermissionComponent } from './components/permission/permission.component';
import { ApplicationsComponent } from '../shared/components/applications/applications.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { ThemeComponent } from '../shared/components/theme/theme.component';
import { UsageDashboardComponent } from './components/utildash/usage-dashboard.component';
import { ErrorLogDashboardComponent } from './components/error-logs/error-log-dashboard.component';
import { EmployeesComponent } from './components/employees/employees.component';
import { ApplicationManagementComponent } from './components/application-management/application-management.component';
import { WorkspaceNavigationComponent } from './components/workspace-navigation/workspace-navigation.component';
import { VendorsComponent } from './components/vendors/vendors.component';
import { subscriptionManagementGuard } from './subscription-management.guard';
import { permissionGuard } from '../auth/guards/auth.guard';

const routes: Routes = [
  {
    path: 'user',
    component: UserComponent,
    canActivate: [permissionGuard],
    data: { permission: 'users:manage' },
  },
  {
    path: 'role',
    component: RoleComponent,
    canActivate: [permissionGuard],
    data: { permission: 'roles:manage' },
  },
  {
    path: 'permission',
    component: PermissionComponent,
    canActivate: [subscriptionManagementGuard],
  },
  {
    path: 'application',
    component: ApplicationManagementComponent,
    canActivate: [subscriptionManagementGuard],
  },
  {
    path: 'workspace-navigation',
    component: WorkspaceNavigationComponent,
    canActivate: [subscriptionManagementGuard],
  },
  {
    path: 'vendors',
    component: VendorsComponent,
    canActivate: [permissionGuard],
    data: { permission: 'vendors:manage' },
  },
  { path: 'welcome', component: WelcomeComponent },
  {
    path: 'theme',
    component: ThemeComponent,
    canActivate: [permissionGuard],
    data: { permission: 'themes:manage' },
  },

  {
    path: 'applications',
    component: ApplicationsComponent,
  },
  {
    path: 'webutil',
    component: UsageDashboardComponent,
    canActivate: [permissionGuard],
    data: { permission: 'usage:read' },
  },
  {
    path: 'error/logs',
    component: ErrorLogDashboardComponent,
    canActivate: [permissionGuard],
    data: { permission: 'admin-logs' },
  },
  {
    path: 'employees',
    component: EmployeesComponent,
    canActivate: [permissionGuard],
    data: { permission: 'users:manage' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
