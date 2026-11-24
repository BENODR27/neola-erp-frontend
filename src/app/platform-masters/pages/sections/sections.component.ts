import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedMaster } from '../../../shared/services/masters/masters.facade';
import { MastersPageService } from '../../masters-page.service';
import { CatalogTableComponent } from '../../components/catalog-table/catalog-table.component';
@Component({
  selector: 'app-masters-sections',
  imports: [FormsModule, A11yModule, CatalogTableComponent],
  providers: [MastersPageService],
  templateUrl: './sections.component.html',
  styleUrl: './sections.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionsComponent {
  readonly catalog = inject(MastersPageService);
  constructor() {
    this.catalog.initialize('hierarchy', true, 'Production Section', 'MASTERS-SECTIONS-MANAGE');
  }
  edit(row?: SharedMaster): void {
    this.catalog.begin(
      row || {
        module: 'organization-units',
        unitType: 'Production Section',
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
          (this.catalog.parentTypes()['Production Section'] || []).includes(row.unitType || ''),
      );
  }
}
