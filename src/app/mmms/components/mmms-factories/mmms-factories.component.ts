import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'app-mmms-factories',
  standalone: false,
  templateUrl: './mmms-factories.component.html',
  styleUrls: ['./mmms-factories.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsFactoriesComponent {
  readonly unitTypes = ['Factory'];
}
