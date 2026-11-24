import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedMaster } from '../../../shared/services/masters/masters.facade';
import { MastersPageService } from '../../masters-page.service';
import { CatalogTableComponent } from '../../components/catalog-table/catalog-table.component';
@Component({
  selector: 'app-masters-business-units',
  imports: [FormsModule, A11yModule, CatalogTableComponent],
  providers: [MastersPageService],
  templateUrl: './business-units.component.html',
  styleUrl: './business-units.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessUnitsComponent {
  readonly catalog = inject(MastersPageService);
  constructor() {
    this.catalog.initialize('hierarchy', true, 'Business Unit', 'MASTERS-BUSINESS-UNITS-MANAGE');
  }
  edit(row?: SharedMaster): void {
    this.catalog.begin(
      row || {
        module: 'organization',
        unitType: 'Business Unit',
        parentId: null,
        name: '',
        code: '',
        status: 'Active',
        organizationId: null,
        factoryId: null,
      },
    );
  }
  parentOptions(): SharedMaster[] {
    return this.catalog
      .hierarchy()
      .filter(
        (row) =>
          row.id !== this.catalog.draft.id &&
          row.status === 'Active' &&
          (this.catalog.parentTypes()['Business Unit'] || []).includes(row.unitType || ''),
      );
  }
}
