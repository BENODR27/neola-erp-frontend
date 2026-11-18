import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomFieldDefinition } from '../../models/mmms-configuration.models';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
@Component({
  selector: 'app-mmms-custom-fields',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="form-grid">
    <label *ngFor="let field of fields()"
      >{{ field.label
      }}<input
        [type]="field.type"
        [required]="!!field.required"
        [disabled]="readonly"
        [ngModel]="values[field.key]"
        (ngModelChange)="change(field.key, $event)"
        [ngModelOptions]="{ standalone: true }"
    /></label>
  </div>`,
})
export class MmmsCustomFieldsComponent implements OnInit {
  @Input() resource = '';
  @Input() values: Record<string, string | number> = {};
  @Input() readonly = false;
  @Output() valuesChange = new EventEmitter<Record<string, string | number>>();
  readonly fields = signal<CustomFieldDefinition[]>([]);
  private readonly facade = inject(MmmsFacadeService);
  ngOnInit(): void {
    this.facade.getSettings().subscribe({
      next: (settings) => this.fields.set(settings.customFields[this.resource] || []),
    });
  }
  change(key: string, value: string | number): void {
    this.valuesChange.emit({ ...this.values, [key]: value });
  }
}
