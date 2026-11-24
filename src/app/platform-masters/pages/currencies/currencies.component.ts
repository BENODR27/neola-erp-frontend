import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedMaster } from '../../../shared/services/masters/masters.facade';
import { MastersPageService } from '../../masters-page.service';
import { CatalogTableComponent } from '../../components/catalog-table/catalog-table.component';

@Component({
  selector: 'app-masters-currencies',
  imports: [FormsModule, A11yModule, CatalogTableComponent],
  providers: [MastersPageService],
  templateUrl: './currencies.component.html',
  styleUrl: './currencies.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrenciesComponent {
  readonly catalog = inject(MastersPageService);
  constructor() {
    this.catalog.initialize('currencies');
  }
  edit(row?: SharedMaster): void {
    this.catalog.begin(
      row || {
        module: 'currencies',
        name: '',
        code: '',
        status: 'Active',
        organizationId: null,
        factoryId: null,
      },
    );
  }
}
