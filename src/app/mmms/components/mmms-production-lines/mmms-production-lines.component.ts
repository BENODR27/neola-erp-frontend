import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'app-mmms-production-lines',
  standalone: false,
  templateUrl: './mmms-production-lines.component.html',
  styleUrls: ['./mmms-production-lines.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsProductionLinesComponent {
  readonly unitTypes = [
    'Building',
    'Floor',
    'Production Section',
    'Production Line',
    'Machine Location',
  ];
}
