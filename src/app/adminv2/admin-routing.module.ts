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

const routes: Routes = [
  { path: 'user', component: UserComponent },
  { path: 'role', component: RoleComponent },
  { path: 'permission', component: PermissionComponent },
  { path: 'application', component: ApplicationManagementComponent },
  { path: 'workspace-navigation', component: WorkspaceNavigationComponent },
  { path: 'vendors', component: VendorsComponent },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'theme', component: ThemeComponent },

  {
    path: 'applications',
    component: ApplicationsComponent,
  },
  {
    path: 'webutil',
      component: UsageDashboardComponent,
  },
  {
    path: 'error/logs',
      component: ErrorLogDashboardComponent,
  },
  {
    path: 'employees',
    component: EmployeesComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
