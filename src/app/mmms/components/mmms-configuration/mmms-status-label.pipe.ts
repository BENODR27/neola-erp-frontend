import { DestroyRef, Injectable, Pipe, PipeTransform, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MmmsContextService } from '../../services/mmms-context.service';

@Injectable({ providedIn: 'root' })
class MmmsStatusLabels {
  readonly labels = signal<Record<string, string>>({});
  private readonly facade = inject(MmmsFacadeService);
  private readonly context = inject(MmmsContextService);
  private readonly destroyRef = inject(DestroyRef);
  constructor() {
    effect((cleanup) => {
      this.context.context();
      const subscription = this.facade
        .getSettings()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (settings) => this.labels.set(settings.statusLabels),
          error: () => this.labels.set({}),
        });
      cleanup(() => subscription.unsubscribe());
    });
  }
}
@Pipe({ name: 'mmmsStatusLabel', standalone: true, pure: false })
export class MmmsStatusLabelPipe implements PipeTransform {
  private readonly settings = inject(MmmsStatusLabels);
  transform(value: string | null | undefined): string {
    return value ? this.settings.labels()[value] || value : '';
  }
}
