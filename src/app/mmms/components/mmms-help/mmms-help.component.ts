import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MMMS_GUIDE } from './mmms-help.content';
@Component({
  selector: 'app-mmms-help',
  standalone: false,
  templateUrl: './mmms-help.component.html',
  styleUrls: ['./mmms-help.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsHelpComponent {
  readonly query = signal('');
  readonly sections = computed(() => {
    const query = this.query().trim().toLowerCase();
    return MMMS_GUIDE.filter(
      (section) =>
        !query ||
        [section.title, section.summary, ...section.steps, section.note]
          .join(' ')
          .toLowerCase()
          .includes(query),
    );
  });
  openSection(id: string): void {
    const element = document.getElementById('guide-' + id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element?.focus({ preventScroll: true });
  }
}
