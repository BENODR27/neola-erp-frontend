import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'app-mmms-departments',
  standalone: false,
  templateUrl: './mmms-departments.component.html',
  styleUrls: ['./mmms-departments.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsDepartmentsComponent {
  readonly unitTypes = ['Department'];
}
