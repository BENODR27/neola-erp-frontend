import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedMaster } from '../../../shared/services/masters/masters.facade';
import { MastersPageService } from '../../masters-page.service';
import { CatalogTableComponent } from '../../components/catalog-table/catalog-table.component';

@Component({
  selector: 'app-masters-vendors',
  imports: [FormsModule, A11yModule, CatalogTableComponent],
  providers: [MastersPageService],
  templateUrl: './vendors.component.html',
  styleUrl: './vendors.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorsComponent {
  readonly catalog = inject(MastersPageService);
  constructor() {
    this.catalog.initialize('vendors');
  }
  edit(row?: SharedMaster): void {
    this.catalog.begin(
      row || {
        module: 'vendors',
        name: '',
        code: '',
        status: 'Active',
        organizationId: null,
        factoryId: null,
      },
    );
  }
}
