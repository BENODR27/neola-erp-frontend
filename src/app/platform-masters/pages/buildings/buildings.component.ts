import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedMaster } from '../../../shared/services/masters/masters.facade';
import { MastersPageService } from '../../masters-page.service';
import { CatalogTableComponent } from '../../components/catalog-table/catalog-table.component';
@Component({
  selector: 'app-masters-buildings',
  imports: [FormsModule, A11yModule, CatalogTableComponent],
  providers: [MastersPageService],
  templateUrl: './buildings.component.html',
  styleUrl: './buildings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuildingsComponent {
  readonly catalog = inject(MastersPageService);
  constructor() {
    this.catalog.initialize('hierarchy', true, 'Building', 'MASTERS-BUILDINGS-MANAGE');
  }
  edit(row?: SharedMaster): void {
    this.catalog.begin(
      row || {
        module: 'organization-units',
        unitType: 'Building',
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
          (this.catalog.parentTypes()['Building'] || []).includes(row.unitType || ''),
      );
  }
}
