import { ChangeDetectionStrategy, Component } from '@angular/core';

// Route-level components keep each MMMS page independently addressable while the shared
// operations/master-data components provide the typed facade and common enterprise UI.
@Component({ selector: 'app-mmms-machines-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'machines\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsMachinesPageComponent { readonly pageCode = 'MMMS-MACHINES'; readonly apiResource = 'machines'; }
@Component({ selector: 'app-mmms-technicians-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'technicians\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsTechniciansPageComponent { readonly pageCode = 'MMMS-TECHNICIANS'; readonly apiResource = 'technicians'; }
@Component({ selector: 'app-mmms-work-orders-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'work-orders\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsWorkOrdersPageComponent { readonly pageCode = 'MMMS-WORK-ORDERS'; readonly apiResource = 'work-orders'; }
@Component({ selector: 'app-mmms-preventive-maintenance-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'preventive-maintenance\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsPreventiveMaintenancePageComponent { readonly pageCode = 'MMMS-PREVENTIVE-MAINTENANCE'; readonly apiResource = 'preventive-maintenance'; }
@Component({ selector: 'app-mmms-breakdowns-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'breakdowns\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsBreakdownsPageComponent { readonly pageCode = 'MMMS-BREAKDOWNS'; readonly apiResource = 'breakdowns'; }
@Component({ selector: 'app-mmms-spare-parts-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'spare-parts\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsSparePartsPageComponent { readonly pageCode = 'MMMS-SPARE-PARTS'; readonly apiResource = 'spare-parts'; }
@Component({ selector: 'app-mmms-costs-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'costs\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsCostsPageComponent { readonly pageCode = 'MMMS-COSTS'; readonly apiResource = 'costs'; }
@Component({ selector: 'app-mmms-mobile-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'mobile\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsMobilePageComponent { readonly pageCode = 'MMMS-MOBILE'; readonly apiResource = 'mobile'; }
@Component({ selector: 'app-mmms-qr-management-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'qr-management\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsQrManagementPageComponent { readonly pageCode = 'MMMS-QR-MANAGEMENT'; readonly apiResource = 'qr-management'; }
@Component({ selector: 'app-mmms-reports-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'reports\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsReportsPageComponent { readonly pageCode = 'MMMS-REPORTS'; readonly apiResource = 'reports/maintenance'; }
@Component({ selector: 'app-mmms-production-integration-page', standalone: false, template: '<app-mmms-operations [moduleOverride]="\'production-integration\'"></app-mmms-operations>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsProductionIntegrationPageComponent { readonly pageCode = 'MMMS-PRODUCTION-INTEGRATION'; readonly apiResource = 'production-integration'; }

@Component({ selector: 'app-mmms-organization-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'organization\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsOrganizationPageComponent { readonly pageCode = 'MMMS-ORGANIZATION'; readonly apiResource = 'master-data/organization'; }
@Component({ selector: 'app-mmms-factories-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'factories\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsFactoriesPageComponent { readonly pageCode = 'MMMS-FACTORIES'; readonly apiResource = 'master-data/factories'; }
@Component({ selector: 'app-mmms-departments-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'departments\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsDepartmentsPageComponent { readonly pageCode = 'MMMS-DEPARTMENTS'; readonly apiResource = 'master-data/departments'; }
@Component({ selector: 'app-mmms-production-lines-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'production-lines\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsProductionLinesPageComponent { readonly pageCode = 'MMMS-PRODUCTION-LINES'; readonly apiResource = 'master-data/production-lines'; }
@Component({ selector: 'app-mmms-machine-categories-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'machine-categories\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsMachineCategoriesPageComponent { readonly pageCode = 'MMMS-MACHINE-CATEGORIES'; readonly apiResource = 'master-data/machine-categories'; }
@Component({ selector: 'app-mmms-allocations-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'allocations\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsAllocationsPageComponent { readonly pageCode = 'MMMS-ALLOCATIONS'; readonly apiResource = 'master-data/allocations'; }
@Component({ selector: 'app-mmms-transfers-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'transfers\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsTransfersPageComponent { readonly pageCode = 'MMMS-TRANSFERS'; readonly apiResource = 'master-data/transfers'; }
@Component({ selector: 'app-mmms-inspections-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'inspections\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsInspectionsPageComponent { readonly pageCode = 'MMMS-INSPECTIONS'; readonly apiResource = 'master-data/inspections'; }
@Component({ selector: 'app-mmms-vendors-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'vendors\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsVendorsPageComponent { readonly pageCode = 'MMMS-VENDORS'; readonly apiResource = 'master-data/vendors'; }
@Component({ selector: 'app-mmms-calibration-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'calibration\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsCalibrationPageComponent { readonly pageCode = 'MMMS-CALIBRATION'; readonly apiResource = 'master-data/calibration'; }
@Component({ selector: 'app-mmms-notifications-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'notifications\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsNotificationsPageComponent { readonly pageCode = 'MMMS-NOTIFICATIONS'; readonly apiResource = 'master-data/notifications'; }
@Component({ selector: 'app-mmms-configuration-page', standalone: false, template: '<app-mmms-master-data [masterModuleOverride]="\'configuration\'"></app-mmms-master-data>', changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsConfigurationPageComponent { readonly pageCode = 'MMMS-CONFIGURATION'; readonly apiResource = 'master-data/configuration'; }
