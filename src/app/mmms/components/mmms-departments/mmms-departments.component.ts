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
  selector: 'app-mmms-departments',
  standalone: false,
  templateUrl: './mmms-departments.component.html',
  styleUrls: ['./mmms-departments.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsDepartmentsComponent implements OnInit {
  readonly pageCode = 'MMMS-DEPARTMENTS';
  readonly apiResource = 'master-data/departments';
  readonly moduleCode = 'departments';
  readonly relationModules: Record<string, string> = {
    organization: 'organization',
    factory: 'factories',
  };
  readonly page = signal({
    title: 'Departments',
    icon: 'bi-diagram-3',
    description: 'Keep responsibility, cost-centre and maintenance ownership visible.',
    singular: 'department',
    fields: [{ key: 'name', label: 'Department name', type: 'text', required: true }, { key: 'code', label: 'Code', type: 'text', required: true }, { key: 'organization', label: 'Organization', type: 'relation', relation: 'organization', required: true }, { key: 'factory', label: 'Factory', type: 'relation', relation: 'factories', required: true }, { key: 'costCenter', label: 'Cost centre', type: 'text' }] as MasterField[],
  });
  readonly records = signal<MasterRecord[]>([]);
  readonly relationOptions = signal<Record<string, string[]>>({});
  readonly relationRecords = signal<Record<string, MasterRecord[]>>({});
  readonly relationSearch = signal<Record<string, string>>({});
  readonly query = signal('');
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | number | null>(null);
  draft: MasterRecord = { id: '0', module: 'departments', name: '', status: 'Active' };

  private readonly facade = inject(MmmsFacadeService);
  private readonly notifications = inject(NotificationService);

  ngOnInit(): void {
    this.loadDepartments();
    this.loadRelations();
  }

  get fields(): MasterField[] {
    return this.page().fields;
  }

  get filtered(): MasterRecord[] {
    const value = this.query().toLowerCase().trim();
    return this.records().filter((record) => !value || Object.values(record).some((item) => String(item).toLowerCase().includes(value)));
  }

  loadDepartments(): void {
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
          this.relationRecords.update((current) => ({ ...current, [field]: options }));
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
    const selectedOrganization = String(this.draft['organization'] ?? '');
    const relationRows = this.relationRecords()[field.key] ?? [];
    const scopedOptions = field.key === 'factory' && selectedOrganization
      ? relationRows.filter((row) => String(row['organizationName'] ?? row['organization'] ?? '').toLowerCase() === selectedOrganization.toLowerCase())
      : relationRows;
    const options = scopedOptions.length ? scopedOptions.map((row) => String(row['name'] || row['code'] || row.id)) : this.optionsFor(field);
    return options.filter((option) => !value || option.toLowerCase().includes(value));
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
    const organization = (this.relationRecords()['organization'] ?? []).find((row) => String(row['name'] || row['code'] || row.id) === String(this.draft['organization'] ?? ''));
    const factory = (this.relationRecords()['factory'] ?? []).find((row) => String(row['name'] || row['code'] || row.id) === String(this.draft['factory'] ?? ''));
    const payload = {
      ...this.draft,
      module: this.moduleCode,
      status: this.draft.status || 'Active',
      organizationId: organization?.id ? String(organization.id) : this.draft['organizationId'],
      factoryId: factory?.id ? String(factory.id) : this.draft['factoryId'],
    };
    this.facade.saveMasterRecord(this.moduleCode, id, payload).subscribe({
      next: (response) => {
        const saved = ((response as { result?: MasterRecord })?.result ?? payload) as MasterRecord;
        this.records.update((rows) => id ? rows.map((row) => String(row.id) === id ? saved : row) : [saved, ...rows]);
        this.closeEditor();
        this.notifications.success(id ? 'Department updated' : 'Department created', 'The department is ready.');
      },
      error: (error) => this.notifications.handleError(error, 'Could not save department'),
    });
  }

  remove(record: MasterRecord): void {
    this.notifications.confirm(`Remove this ${this.page().singular}?`, 'Remove', 'Keep').then((result) => {
      if (!result.isConfirmed) return;
      this.facade.deleteMasterRecord(this.moduleCode, String(record.id)).subscribe({
        next: () => { this.records.update((rows) => rows.filter((row) => String(row.id) !== String(record.id))); this.notifications.success('Department removed', 'The department was removed.'); },
        error: (error) => this.notifications.handleError(error, 'Could not remove department'),
      });
    });
  }

  value(record: MasterRecord, key: string): string {
    return String(record[key] ?? '—');
  }
}
