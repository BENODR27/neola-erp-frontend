import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MaintenanceSettings } from '../../models/mmms-configuration.models';
@Component({
  selector: 'app-mmms-configuration',
  standalone: false,
  templateUrl: './mmms-configuration.component.html',
  styleUrls: ['./mmms-configuration.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsConfigurationComponent implements OnInit {
  readonly settings = signal<MaintenanceSettings | null>(null);
  readonly keys = signal<string[]>([]);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  key = 'machineCategories';
  text = '';
  listMode = false;
  private readonly facade = inject(MmmsFacadeService);
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.facade.getSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.keys.set(Object.keys(settings));
        this.select();
      },
      error: () => this.error.set('Configuration could not be loaded.'),
    });
  }
  select(): void {
    const value = this.settings()?.[this.key];
    this.listMode = Array.isArray(value) && typeof value[0] === 'string';
    this.text = this.listMode ? (value as string[]).join('\n') : JSON.stringify(value, null, 2);
    this.error.set('');
    this.message.set('');
  }
  save(): void {
    if (this.saving()) return;
    let value: unknown;
    try {
      value = this.listMode
        ? this.text
            .split('\n')
            .map((item) => item.trim())
            .filter(Boolean)
        : JSON.parse(this.text);
    } catch {
      this.error.set('Enter valid JSON for this structured setting.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.facade
      .saveSetting(this.key, value)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.message.set('Factory configuration saved.');
          this.load();
        },
        error: (error: unknown) =>
          this.error.set(
            (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
              'Configuration could not be saved.',
          ),
      });
  }
}
