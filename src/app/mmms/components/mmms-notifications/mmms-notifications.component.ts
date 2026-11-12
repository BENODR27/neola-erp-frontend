import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { NotificationService } from '../../../shared/services/notification/notification.service';

interface MasterField {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  required?: boolean;
  relation?: string;
}

type MasterRecord = Record<string, string | number> & { id: string | number; status: string };

@Component({
  selector: 'app-mmms-notifications',
  standalone: false,
  templateUrl: './mmms-notifications.component.html',
  styleUrls: ['./mmms-notifications.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsNotificationsComponent implements OnInit {
  readonly pageCode = 'MMMS-NOTIFICATIONS';
  readonly apiResource = 'master-data/notifications';
  readonly moduleCode = 'notifications';
  readonly relationModules: Record<string, string> = {
    audience: 'technicians',
  };
  readonly page = signal({
    title: 'Notifications',
    icon: 'bi-bell',
    description: 'Configure operational alerts for overdue work, breakdowns and stock risk.',
    singular: 'notification rule',
    fields: [{ key: 'name', label: 'Rule name', type: 'text', required: true }, { key: 'event', label: 'Trigger event', type: 'text' }, { key: 'audience', label: 'Recipients', type: 'relation', relation: 'technicians' }, { key: 'channel', label: 'Channel', type: 'select', options: ['Email', 'In-app', 'Email + In-app'] }] as MasterField[],
  });
  readonly records = signal<MasterRecord[]>([]);
  readonly relationOptions = signal<Record<string, string[]>>({});
  readonly relationSearch = signal<Record<string, string>>({});
  readonly query = signal('');
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | number | null>(null);
  draft: MasterRecord = { id: '0', module: 'notifications', name: '', status: 'Active' };

  private readonly facade = inject(MmmsFacadeService);
  private readonly notifications = inject(NotificationService);

  ngOnInit(): void {
    this.loadNotifications();
    this.loadRelations();
  }

  get fields(): MasterField[] {
    return this.page().fields;
  }

  get filtered(): MasterRecord[] {
    const value = this.query().toLowerCase().trim();
    return this.records().filter((record) => !value || Object.values(record).some((item) => String(item).toLowerCase().includes(value)));
  }

  loadNotifications(): void {
    this.facade.getMasterRecords(this.moduleCode).subscribe({
      next: (rows) => this.records.set(rows as MasterRecord[]),
      error: () => this.records.set([]),
    });
  }

  loadRelations(): void {
    Object.entries(this.relationModules).forEach(([field, module]) => {
      this.facade.getMasterRecords(module).subscribe({
        next: (rows) => this.relationOptions.update((current) => ({
          ...current,
          [field]: rows.map((row) => String(row.name || row.code || row.id)),
        })),
      });
    });
  }

  optionsFor(field: MasterField): string[] {
    return this.relationOptions()[field.key] ?? field.options ?? [];
  }

  filteredOptions(field: MasterField): string[] {
    const value = (this.relationSearch()[field.key] ?? '').toLowerCase().trim();
    return this.optionsFor(field).filter((option) => !value || option.toLowerCase().includes(value));
  }

  updateRelationSearch(field: string, value: string): void {
    this.relationSearch.update((current) => ({ ...current, [field]: value }));
  }

  updateQuery(value: string): void {
    this.query.set(value);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.draft = { id: '0', module: this.moduleCode, name: '', status: 'Active' };
    this.editorOpen.set(true);
  }

  openEdit(record: MasterRecord): void {
    this.editingId.set(record.id);
    this.draft = { ...record };
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    this.editorOpen.set(false);
  }

  save(): void {
    const requiredFields = this.fields.filter((field) => field.required);
    if (!requiredFields.every((field) => String(this.draft[field.key] ?? '').trim())) { this.notifications.warning('Required fields missing', 'Complete the required fields before saving.'); return; }
    const id = this.editingId() ? String(this.editingId()) : null;
    const payload = { ...this.draft, module: this.moduleCode, status: this.draft.status || 'Active' };
    this.facade.saveMasterRecord(this.moduleCode, id, payload).subscribe({
      next: (response) => {
        const saved = ((response as { result?: MasterRecord })?.result ?? payload) as MasterRecord;
        this.records.update((rows) => id ? rows.map((row) => String(row.id) === id ? saved : row) : [saved, ...rows]);
        this.closeEditor();
        this.notifications.success(id ? 'Notification rule updated' : 'Notification rule created', 'The notification rule is ready.');
      },
      error: (error) => this.notifications.handleError(error, 'Could not save notification rule'),
    });
  }

  remove(record: MasterRecord): void {
    this.notifications.confirm(`Remove this ${this.page().singular}?`, 'Remove', 'Keep').then((result) => {
      if (!result.isConfirmed) return;
      this.facade.deleteMasterRecord(this.moduleCode, String(record.id)).subscribe({
        next: () => { this.records.update((rows) => rows.filter((row) => String(row.id) !== String(record.id))); this.notifications.success('Notification rule removed', 'The rule was removed.'); },
        error: (error) => this.notifications.handleError(error, 'Could not remove notification rule'),
      });
    });
  }

  value(record: MasterRecord, key: string): string {
    return String(record[key] ?? '—');
  }
}
