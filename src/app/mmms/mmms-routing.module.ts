import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MmmsDashboardComponent } from './components/mmms-dashboard/mmms-dashboard.component';
import { MmmsOperationsComponent } from './components/mmms-operations/mmms-operations.component';
import { mmmsContextGuard, permissionGuard } from '../auth/guards/auth.guard';
import { MmmsMasterDataComponent } from './components/mmms-master-data/mmms-master-data.component';
import { MmmsHelpComponent } from './components/mmms-help/mmms-help.component';
import { MmmsMachinesComponent } from './components/mmms-machines/mmms-machines.component';
import { MmmsTechniciansComponent } from './components/mmms-technicians/mmms-technicians.component';
import { MmmsWorkOrdersComponent } from './components/mmms-work-orders/mmms-work-orders.component';
import { MmmsPreventiveMaintenanceComponent } from './components/mmms-preventive-maintenance/mmms-preventive-maintenance.component';
import { MmmsBreakdownsComponent } from './components/mmms-breakdowns/mmms-breakdowns.component';
import { MmmsSparePartsComponent } from './components/mmms-spare-parts/mmms-spare-parts.component';
import { MmmsCostsComponent } from './components/mmms-costs/mmms-costs.component';
import { MmmsMobileComponent } from './components/mmms-mobile/mmms-mobile.component';
import { MmmsQrManagementComponent } from './components/mmms-qr-management/mmms-qr-management.component';
import { MmmsReportsComponent } from './components/mmms-reports/mmms-reports.component';
import { MmmsProductionIntegrationComponent } from './components/mmms-production-integration/mmms-production-integration.component';
import { MmmsOrganizationComponent } from './components/mmms-organization/mmms-organization.component';
import { MmmsFactoriesComponent } from './components/mmms-factories/mmms-factories.component';
import { MmmsDepartmentsComponent } from './components/mmms-departments/mmms-departments.component';
import { MmmsProductionLinesComponent } from './components/mmms-production-lines/mmms-production-lines.component';
import { MmmsMachineCategoriesComponent } from './components/mmms-machine-categories/mmms-machine-categories.component';
import { MmmsAllocationsComponent } from './components/mmms-allocations/mmms-allocations.component';
import { MmmsTransfersComponent } from './components/mmms-transfers/mmms-transfers.component';
import { MmmsInspectionsComponent } from './components/mmms-inspections/mmms-inspections.component';
import { MmmsVendorsComponent } from './components/mmms-vendors/mmms-vendors.component';
import { MmmsCalibrationComponent } from './components/mmms-calibration/mmms-calibration.component';
import { MmmsNotificationsComponent } from './components/mmms-notifications/mmms-notifications.component';
import { MmmsConfigurationComponent } from './components/mmms-configuration/mmms-configuration.component';

const routes: Routes = [
  { path: '', component: MmmsDashboardComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { permission: 'MMMS-DASHBOARD', requiresMmmsContext: true } },
  { path: 'machines', component: MmmsMachinesComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-MACHINES', permission: 'MMMS-MACHINES', requiresMmmsContext: true } },
  { path: 'technicians', component: MmmsTechniciansComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-TECHNICIANS', permission: 'MMMS-TECHNICIANS', requiresMmmsContext: true } },
  { path: 'work-orders', component: MmmsWorkOrdersComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-WORK-ORDERS', permission: 'MMMS-WORK-ORDERS', requiresMmmsContext: true } },
  { path: 'preventive-maintenance', component: MmmsPreventiveMaintenanceComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-PREVENTIVE-MAINTENANCE', permission: 'MMMS-PREVENTIVE-MAINTENANCE', requiresMmmsContext: true } },
  { path: 'breakdowns', component: MmmsBreakdownsComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-BREAKDOWNS', permission: 'MMMS-BREAKDOWNS', requiresMmmsContext: true } },
  { path: 'spare-parts', component: MmmsSparePartsComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-SPARE-PARTS', permission: 'MMMS-SPARE-PARTS', requiresMmmsContext: true } },
  { path: 'costs', component: MmmsCostsComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-COSTS', permission: 'MMMS-COSTS', requiresMmmsContext: true } },
  { path: 'mobile', component: MmmsMobileComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-MOBILE', permission: 'MMMS-MOBILE', requiresMmmsContext: true } },
  { path: 'qr-management', component: MmmsQrManagementComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-QR-MANAGEMENT', permission: 'MMMS-QR-MANAGEMENT', requiresMmmsContext: true } },
  { path: 'reports', component: MmmsReportsComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-REPORTS', permission: 'MMMS-REPORTS', requiresMmmsContext: true } },
  { path: 'production-integration', component: MmmsProductionIntegrationComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-PRODUCTION-INTEGRATION', permission: 'MMMS-PRODUCTION-INTEGRATION', requiresMmmsContext: true } },
  { path: 'organization', component: MmmsOrganizationComponent, canActivate: [permissionGuard], data: { pageCode: 'MMMS-ORGANIZATION', permission: 'MMMS-ORGANIZATION' } },
  { path: 'factories', component: MmmsFactoriesComponent, canActivate: [permissionGuard], data: { pageCode: 'MMMS-FACTORIES', permission: 'MMMS-FACTORIES' } },
  { path: 'departments', component: MmmsDepartmentsComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-DEPARTMENTS', permission: 'MMMS-DEPARTMENTS', requiresMmmsContext: true } },
  { path: 'production-lines', component: MmmsProductionLinesComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-PRODUCTION-LINES', permission: 'MMMS-PRODUCTION-LINES', requiresMmmsContext: true } },
  { path: 'machine-categories', component: MmmsMachineCategoriesComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-MACHINE-CATEGORIES', permission: 'MMMS-MACHINE-CATEGORIES', requiresMmmsContext: true } },
  { path: 'allocations', component: MmmsAllocationsComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-ALLOCATIONS', permission: 'MMMS-ALLOCATIONS', requiresMmmsContext: true } },
  { path: 'transfers', component: MmmsTransfersComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-TRANSFERS', permission: 'MMMS-TRANSFERS', requiresMmmsContext: true } },
  { path: 'inspections', component: MmmsInspectionsComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-INSPECTIONS', permission: 'MMMS-INSPECTIONS', requiresMmmsContext: true } },
  { path: 'vendors', component: MmmsVendorsComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-VENDORS', permission: 'MMMS-VENDORS', requiresMmmsContext: true } },
  { path: 'calibration', component: MmmsCalibrationComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-CALIBRATION', permission: 'MMMS-CALIBRATION', requiresMmmsContext: true } },
  { path: 'notifications', component: MmmsNotificationsComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-NOTIFICATIONS', permission: 'MMMS-NOTIFICATIONS', requiresMmmsContext: true } },
  { path: 'configuration', component: MmmsConfigurationComponent, canActivate: [permissionGuard, mmmsContextGuard], data: { pageCode: 'MMMS-CONFIGURATION', permission: 'MMMS-CONFIGURATION', requiresMmmsContext: true } },
  { path: 'help', component: MmmsHelpComponent, canActivate: [permissionGuard], data: { permission: 'MMMS-DASHBOARD' } },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class MmmsRoutingModule {}
