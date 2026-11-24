import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedMaster } from '../../../shared/services/masters/masters.facade';
import { MastersPageService } from '../../masters-page.service';
import { CatalogTableComponent } from '../../components/catalog-table/catalog-table.component';
@Component({
  selector: 'app-masters-departments',
  imports: [FormsModule, A11yModule, CatalogTableComponent],
  providers: [MastersPageService],
  templateUrl: './departments.component.html',
  styleUrl: './departments.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepartmentsComponent {
  readonly catalog = inject(MastersPageService);
  constructor() {
    this.catalog.initialize('hierarchy', true, 'Department', 'MASTERS-DEPARTMENTS-MANAGE');
  }
  edit(row?: SharedMaster): void {
    this.catalog.begin(
      row || {
        module: 'departments',
        unitType: 'Department',
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
          (this.catalog.parentTypes()['Department'] || []).includes(row.unitType || ''),
      );
  }
}
