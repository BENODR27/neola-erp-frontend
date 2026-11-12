import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WarehousemanagementRoutingModule } from './warehousemanagement-routing.module';

import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Required for [(ngModel)]
import { ReceiveFabricComponent } from './components/fabric/receive-fabric/receive-fabric.component';

import { GenerateSourcingAsnReportComponent } from './components/generate-sourcing-asn-report/generate-sourcing-asn-report.component';
import { AllocateBinComponent } from './components/allocate-bin/allocate-bin.component';
import { IssueFabricComponent } from './components/fabric/issue-fabric/issue-fabric.component';
import { AllocateToInspectionComponent } from './components/allocate-to-inspection/allocate-to-inspection.component';

import { QrScannerComponent } from '../shared/components/qr-scanner/qr-scanner.component';
import { TableComponent } from '../shared/components/table/table.component';
import { IssuedFabricComponent } from './components/fabric/issued-fabric/issued-fabric.component';
import { ReceivedFabricComponent } from './components/fabric/received-fabric/received-fabric.component';
import { WarehouseComponent } from './components/admin/warehouse/warehouse.component';
import { FactoryComponent } from './components/admin/factory/factory.component';
import { CustomizeRackComponent } from './components/admin/customize-rack/customize-rack.component';
import { InspectionComponent } from './components/inspection-department/inspection/inspection.component';
import { TrackRackStatusComponent } from './components/admin/track-rack-status/track-rack-status.component';
import { QRCodeComponent } from 'angularx-qrcode';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PrintASNReportComponent } from './components/print-asnreport/print-asnreport.component';
import { ChangePalletComponent } from './components/change-pallet/change-pallet.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ChartModule } from 'primeng/chart';
import { MeterGroup } from 'primeng/metergroup';
import { ChartPieDemoComponent } from '../shared/components/chart-pie-demo/chart-pie-demo.component';
import { TrackFabricRollComponent } from './components/track-fabric-roll/track-fabric-roll.component';
import { OcReallocationActionComponent } from './components/oc-reallocation-action/oc-reallocation-action.component';
import { provideStore } from '@ngrx/store';
import { warehouseReducer } from './store/warehouse/warehouse.reducer';
import { OrderByBayNumberPipe } from './components/admin/customize-rack/order-by-bay-number.pipe';
import { FabricFinderComponent } from './components/fabric-finder/fabric-finder.component';
import { BatchReceiveComponent } from './components/batch-receive/batch-receive.component';
import { BatchIssuingComponent } from './components/batch-issuing/batch-issuing.component';
import { RackExplorerComponent } from './components/rack-explorer/rack-explorer.component';
import { SplitMergeRollComponent } from './components/split-merge-roll/split-merge-roll.component';
import { SplitRollListComponent } from './components/split-roll-list/split-roll-list.component';
import { CreateRollStickersComponent } from './components/create-roll-stickers/create-roll-stickers.component';

@NgModule({
  declarations: [
    SplitMergeRollComponent,
    SplitRollListComponent,
    CreateRollStickersComponent,
    TrackFabricRollComponent,
    ChangePalletComponent,
    PrintASNReportComponent,
    CustomizeRackComponent,
    FactoryComponent,
    WarehouseComponent,
    ReceivedFabricComponent,
    IssuedFabricComponent,
    TrackRackStatusComponent,
    ReceiveFabricComponent,
    TableComponent,
    GenerateSourcingAsnReportComponent,
    AllocateBinComponent,
    IssueFabricComponent,
    AllocateToInspectionComponent,
    InspectionComponent,
    DashboardComponent,
    OcReallocationActionComponent,
    FabricFinderComponent,
    BatchReceiveComponent,
    BatchIssuingComponent,
    RackExplorerComponent,
  ],
  imports: [
    OrderByBayNumberPipe,
    QrScannerComponent,
    MeterGroup,
    ChartModule,
    DragDropModule,
    CommonModule,
    WarehousemanagementRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    QRCodeComponent,
    ChartPieDemoComponent,
  ],
})
export class WarehousemanagementModule {}
