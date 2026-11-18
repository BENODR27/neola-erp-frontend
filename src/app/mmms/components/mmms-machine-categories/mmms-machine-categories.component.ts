import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
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
  selector: 'app-mmms-machine-categories',
  standalone: false,
  templateUrl: './mmms-machine-categories.component.html',
  styleUrls: ['./mmms-machine-categories.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsMachineCategoriesComponent implements OnInit {
  readonly pagination = new MmmsPagination();
  readonly pageCode = 'MMMS-MACHINE-CATEGORIES';
  readonly apiResource = 'master-data/machine-categories';
  readonly moduleCode = 'machine-categories';
  readonly relationModules: Record<string, string> = {
    organization: 'organization',
  };
  readonly page = signal({
    title: 'Machine Categories',
    icon: 'bi-tags',
    description: 'Standardize equipment classification and criticality defaults.',
    singular: 'machine category',
    fields: [
      { key: 'organization', label: 'Organization', type: 'relation', relation: 'organization' },
      { key: 'name', label: 'Category name', type: 'text', required: true },
      { key: 'code', label: 'Code', type: 'text', required: true },
      {
        key: 'criticality',
        label: 'Default criticality',
        type: 'select',
        options: ['Low', 'Medium', 'High', 'Critical'],
      },
      { key: 'description', label: 'Description', type: 'text' },
    ] as MasterField[],
  });
  readonly records = signal<MasterRecord[]>([]);
  readonly relationOptions = signal<Record<string, string[]>>({});
  readonly relationSearch = signal<Record<string, string>>({});
  readonly query = signal('');
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | number | null>(null);
  draft: MasterRecord = { id: '0', module: 'machine-categories', name: '', status: 'Active' };

  private readonly facade = inject(MmmsFacadeService);
  private readonly notifications = inject(NotificationService);

  ngOnInit(): void {
    this.loadMachineCategories();
    this.loadRelations();
  }

  get fields(): MasterField[] {
    return this.page().fields;
  }

  get filtered(): MasterRecord[] {
    const value = this.query().toLowerCase().trim();
    return this.records().filter(
      (record) =>
        !value || Object.values(record).some((item) => String(item).toLowerCase().includes(value)),
    );
  }

  loadMachineCategories(): void {
    this.facade.getMasterRecords(this.moduleCode).subscribe({
      next: (rows) => this.records.set(rows as MasterRecord[]),
      error: () => this.records.set([]),
    });
  }

  loadRelations(): void {
    Object.entries(this.relationModules).forEach(([field, module]) => {
      this.facade.getMasterRecords(module).subscribe({
        next: (rows) =>
          this.relationOptions.update((current) => ({
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
    return this.optionsFor(field).filter(
      (option) => !value || option.toLowerCase().includes(value),
    );
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
    if (!requiredFields.every((field) => String(this.draft[field.key] ?? '').trim())) {
      this.notifications.warning(
        'Required fields missing',
        'Complete the required fields before saving.',
      );
      return;
    }
    const id = this.editingId() ? String(this.editingId()) : null;
    const payload = {
      ...this.draft,
      module: this.moduleCode,
      status: this.draft.status || 'Active',
    };
    this.facade.saveMasterRecord(this.moduleCode, id, payload).subscribe({
      next: (response) => {
        const saved = ((response as { result?: MasterRecord })?.result ?? payload) as MasterRecord;
        this.records.update((rows) =>
          id ? rows.map((row) => (String(row.id) === id ? saved : row)) : [saved, ...rows],
        );
        this.closeEditor();
        this.notifications.success(
          id ? 'Category updated' : 'Category created',
          'The machine category is ready.',
        );
      },
      error: (error) => this.notifications.handleError(error, 'Could not save category'),
    });
  }

  remove(record: MasterRecord): void {
    this.notifications
      .confirm(`Remove this ${this.page().singular}?`, 'Remove', 'Keep')
      .then((result) => {
        if (!result.isConfirmed) return;
        this.facade.deleteMasterRecord(this.moduleCode, String(record.id)).subscribe({
          next: () => {
            this.records.update((rows) =>
              rows.filter((row) => String(row.id) !== String(record.id)),
            );
            this.notifications.success('Category removed', 'The machine category was removed.');
          },
          error: (error) => this.notifications.handleError(error, 'Could not remove category'),
        });
      });
  }

  value(record: MasterRecord, key: string): string {
    return String(record[key] ?? '—');
  }
}
