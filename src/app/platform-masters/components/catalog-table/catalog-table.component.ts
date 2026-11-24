import { ChangeDetectionStrategy, Component, Input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MastersPageService } from '../../masters-page.service';
import { SharedMaster } from '../../../shared/services/masters/masters.facade';

@Component({
  selector: 'app-master-catalog-table',
  imports: [FormsModule],
  templateUrl: './catalog-table.component.html',
  styleUrl: './catalog-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogTableComponent {
  @Input({ required: true }) catalog!: MastersPageService;
  @Input() hierarchy = false;
  @Input() people = false;
  readonly editRecord = output<SharedMaster>();
}
