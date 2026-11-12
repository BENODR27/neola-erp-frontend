import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReceiveFabricComponent } from './components/fabric/receive-fabric/receive-fabric.component';
import { AllocateBinComponent } from './components/allocate-bin/allocate-bin.component';
import { IssueFabricComponent } from './components/fabric/issue-fabric/issue-fabric.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AllocateToInspectionComponent } from './components/allocate-to-inspection/allocate-to-inspection.component';
import { GenerateSourcingAsnReportComponent } from './components/generate-sourcing-asn-report/generate-sourcing-asn-report.component';
import { IssuedFabricComponent } from './components/fabric/issued-fabric/issued-fabric.component';
import { ReceivedFabricComponent } from './components/fabric/received-fabric/received-fabric.component';
import { FactoryComponent } from './components/admin/factory/factory.component';
import { WarehouseComponent } from './components/admin/warehouse/warehouse.component';
import { CustomizeRackComponent } from './components/admin/customize-rack/customize-rack.component';
import { InspectionComponent } from './components/inspection-department/inspection/inspection.component';
import { TrackRackStatusComponent } from './components/admin/track-rack-status/track-rack-status.component';
import { PrintASNReportComponent } from './components/print-asnreport/print-asnreport.component';
import { ChangePalletComponent } from './components/change-pallet/change-pallet.component';
import { TrackFabricRollComponent } from './components/track-fabric-roll/track-fabric-roll.component';
import { WelcomeComponent } from './components/welcome/welcome.component';
import { OcReallocationActionComponent } from './components/oc-reallocation-action/oc-reallocation-action.component';
import { FabricFinderComponent } from './components/fabric-finder/fabric-finder.component';
import { AdminFabricRollControlComponent } from './components/admin/admin-fabric-roll-control/admin-fabric-roll-control.component';
import { RackExplorerComponent } from './components/rack-explorer/rack-explorer.component';
import { BatchReceiveComponent } from './components/batch-receive/batch-receive.component';
import { BatchIssuingComponent } from './components/batch-issuing/batch-issuing.component';
import { SplitMergeRollComponent } from './components/split-merge-roll/split-merge-roll.component';
import { SplitRollListComponent } from './components/split-roll-list/split-roll-list.component';
import { CreateRollStickersComponent } from './components/create-roll-stickers/create-roll-stickers.component';

const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'welcome', component: WelcomeComponent },
  { path: 'fabric/smroll', component: SplitMergeRollComponent },
  { path: 'fabric/split-rolls', component: SplitRollListComponent },
  { path: 'fabric/create-roll-stickers', component: CreateRollStickersComponent },

  { path: 'rack/track', component: TrackRackStatusComponent },

  { path: 'fabric/receive', component: ReceiveFabricComponent },
  { path: 'fabric/received', component: ReceivedFabricComponent },
  { path: 'fabric/finder', component: FabricFinderComponent },

  { path: 'track/fabric/roll', component: TrackFabricRollComponent },

  { path: 'fabric/issued', component: IssuedFabricComponent },
  { path: 'oc/reallocation', component: OcReallocationActionComponent },

  { path: 'allocate/toinspection', component: AllocateToInspectionComponent },
  { path: 'change/pallet', component: ChangePalletComponent },

  { path: 'allocate/bin', component: AllocateBinComponent },

  { path: 'fabric/inspection', component: InspectionComponent },
  { path: 'issue', component: IssueFabricComponent },
  {
    path: 'generateSourcingAsnReport',
    component: GenerateSourcingAsnReportComponent,
  },
  {
    path: 'printSourcingAsnReport',
    component: PrintASNReportComponent,
  },
  { path: 'welcome', component: WelcomeComponent },

  { path: 'factory', component: FactoryComponent },
  { path: 'warehouse', component: WarehouseComponent },
  { path: 'customize/rack', component: CustomizeRackComponent },
  { path: 'fabric-roll-control', component: AdminFabricRollControlComponent },

  { path: 'rack-explorer', component: RackExplorerComponent },
  { path: 'batch-receive', component: BatchReceiveComponent },
  { path: 'batch-issue-action', component: BatchIssuingComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WarehousemanagementRoutingModule {}
