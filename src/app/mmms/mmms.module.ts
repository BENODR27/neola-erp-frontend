import { MmmsPaginationComponent } from './components/mmms-pagination/mmms-pagination.component';
import { MmmsStatusLabelPipe } from './components/mmms-configuration/mmms-status-label.pipe';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MmmsAttachmentsComponent } from './components/mmms-attachments/mmms-attachments.component';
import { MmmsCustomFieldsComponent } from './components/mmms-custom-fields/mmms-custom-fields.component';
import { QRCodeComponent } from 'angularx-qrcode';
import { QrScannerComponent } from '../shared/components/qr-scanner/qr-scanner.component';
import { MmmsRoutingModule } from './mmms-routing.module';
import { MmmsDashboardComponent } from './components/mmms-dashboard/mmms-dashboard.component';
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
import { MmmsContextSelectorComponent } from './components/mmms-context-selector/mmms-context-selector.component';

@NgModule({
  declarations: [
    MmmsDashboardComponent,
    MmmsHelpComponent,
    MmmsMachinesComponent,
    MmmsTechniciansComponent,
    MmmsWorkOrdersComponent,
    MmmsPreventiveMaintenanceComponent,
    MmmsBreakdownsComponent,
    MmmsSparePartsComponent,
    MmmsCostsComponent,
    MmmsMobileComponent,
    MmmsQrManagementComponent,
    MmmsReportsComponent,
    MmmsProductionIntegrationComponent,
    MmmsOrganizationComponent,
    MmmsFactoriesComponent,
    MmmsDepartmentsComponent,
    MmmsProductionLinesComponent,
    MmmsMachineCategoriesComponent,
    MmmsAllocationsComponent,
    MmmsTransfersComponent,
    MmmsInspectionsComponent,
    MmmsVendorsComponent,
    MmmsCalibrationComponent,
    MmmsNotificationsComponent,
    MmmsConfigurationComponent,
  ],
  imports: [
    CommonModule,
    MmmsPaginationComponent,
    FormsModule,
    MmmsRoutingModule,
    MmmsContextSelectorComponent,
    MmmsAttachmentsComponent,
    MmmsCustomFieldsComponent,
    MmmsStatusLabelPipe,
    QRCodeComponent,
    QrScannerComponent,
  ],
})
export class MmmsModule {}
