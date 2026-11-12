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
  selector: 'app-mmms-factories',
  standalone: false,
  templateUrl: './mmms-factories.component.html',
  styleUrls: ['./mmms-factories.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsFactoriesComponent implements OnInit {
  readonly pageCode = 'MMMS-FACTORIES';
  readonly apiResource = 'master-data/factories';
  readonly moduleCode = 'factories';
  readonly relationModules: Record<string, string> = {
    organization: 'organization',
  };
  readonly page = signal({
    title: 'Factories & Sites',
    icon: 'bi-buildings',
    description: 'Manage factories, workshops and site-level operating calendars.',
    singular: 'factory',
    fields: [{ key: 'organization', label: 'Organization', type: 'relation', relation: 'organization', required: true }, { key: 'name', label: 'Factory name', type: 'text', required: true }, { key: 'code', label: 'Factory code', type: 'text', required: true }, { key: 'location', label: 'Location', type: 'text' }, { key: 'manager', label: 'Site manager', type: 'text' }] as MasterField[],
  });
  readonly records = signal<MasterRecord[]>([]);
  readonly relationOptions = signal<Record<string, string[]>>({});
  readonly organizationOptions = signal<MasterRecord[]>([]);
  readonly relationSearch = signal<Record<string, string>>({});
  readonly query = signal('');
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | number | null>(null);
  draft: MasterRecord = { id: '0', module: 'factories', name: '', status: 'Active' };

  private readonly facade = inject(MmmsFacadeService);
  private readonly notifications = inject(NotificationService);

  ngOnInit(): void {
    this.loadFactories();
    this.loadRelations();
  }

  get fields(): MasterField[] {
    return this.page().fields;
  }

  get filtered(): MasterRecord[] {
    const value = this.query().toLowerCase().trim();
    return this.records().filter((record) => !value || Object.values(record).some((item) => String(item).toLowerCase().includes(value)));
  }

  loadFactories(): void {
    this.facade.getMasterRecords(this.moduleCode).subscribe({
      next: (rows) => this.records.set(rows as MasterRecord[]),
      error: () => this.records.set([]),
    });
  }

  loadRelations(): void {
    Object.entries(this.relationModules).forEach(([field, module]) => {
      this.facade.getMasterRecords(module).subscribe({
        next: (rows) => {
          const options = rows as MasterRecord[];
          if (field === 'organization') this.organizationOptions.set(options);
          this.relationOptions.update((current) => ({
            ...current,
            [field]: options.map((row) => String(row['name'] || row['code'] || row.id)),
          }));
        },
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
    const organization = this.organizationOptions().find((row) =>
      String(row['name'] || row['code'] || row.id) === String(this.draft['organization'] || ''),
    );
    const payload = {
      ...this.draft,
      module: this.moduleCode,
      status: this.draft.status || 'Active',
      organizationId: organization?.id ? String(organization.id) : this.draft['organizationId'],
    };
    this.facade.saveMasterRecord(this.moduleCode, id, payload).subscribe({
      next: (response) => {
        const saved = ((response as { result?: MasterRecord })?.result ?? payload) as MasterRecord;
        this.records.update((rows) => id ? rows.map((row) => String(row.id) === id ? saved : row) : [saved, ...rows]);
        this.closeEditor();
        this.notifications.success(id ? 'Factory updated' : 'Factory created', 'The factory is ready for use.');
      },
      error: (error) => this.notifications.handleError(error, 'Could not save factory'),
    });
  }

  remove(record: MasterRecord): void {
    this.notifications.confirm(`Remove this ${this.page().singular}?`, 'Remove', 'Keep').then((result) => {
      if (!result.isConfirmed) return;
      this.facade.deleteMasterRecord(this.moduleCode, String(record.id)).subscribe({
        next: () => { this.records.update((rows) => rows.filter((row) => String(row.id) !== String(record.id))); this.notifications.success('Factory removed', 'The factory was removed.'); },
        error: (error) => this.notifications.handleError(error, 'Could not remove factory'),
      });
    });
  }

  value(record: MasterRecord, key: string): string {
    return String(record[key] ?? '—');
  }
}
