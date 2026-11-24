import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedMaster } from '../../../shared/services/masters/masters.facade';
import { MastersPageService } from '../../masters-page.service';
import { CatalogTableComponent } from '../../components/catalog-table/catalog-table.component';
@Component({
  selector: 'app-masters-companies',
  imports: [FormsModule, A11yModule, CatalogTableComponent],
  providers: [MastersPageService],
  templateUrl: './companies.component.html',
  styleUrl: './companies.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompaniesComponent {
  readonly catalog = inject(MastersPageService);
  constructor() {
    this.catalog.initialize('hierarchy', true, 'Company', 'MASTERS-COMPANIES-MANAGE');
  }
  edit(row?: SharedMaster): void {
    this.catalog.begin(
      row || {
        module: 'organization',
        unitType: 'Company',
        parentId: null,
        name: '',
        code: '',
        status: 'Active',
        organizationId: null,
        factoryId: null,
      },
    );
  }
}
