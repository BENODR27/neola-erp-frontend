import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { UserComponent } from './components/user/user.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RoleComponent } from './components/role/role.component';
import { PermissionComponent } from './components/permission/permission.component';
import { ApplicationManagementComponent } from './components/application-management/application-management.component';
import { WorkspaceNavigationComponent } from './components/workspace-navigation/workspace-navigation.component';
import { VendorsComponent } from './components/vendors/vendors.component';

@NgModule({
  declarations: [
    ApplicationManagementComponent,
    VendorsComponent,
    WorkspaceNavigationComponent,
    UserComponent,
    RoleComponent,
    PermissionComponent,
    ApplicationManagementComponent,
  ],
  imports: [CommonModule, AdminRoutingModule, ReactiveFormsModule],
})
export class AdminModule {}
