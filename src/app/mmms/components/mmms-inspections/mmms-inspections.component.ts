import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MmmsFacadeService } from '../../services/mmms-facade.service';

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
  selector: 'app-mmms-inspections',
  standalone: false,
  templateUrl: './mmms-inspections.component.html',
  styleUrls: ['./mmms-inspections.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsInspectionsComponent implements OnInit {
  readonly pageCode = 'MMMS-INSPECTIONS';
  readonly apiResource = 'master-data/inspections';
  readonly moduleCode = 'inspections';
  readonly relationModules: Record<string, string> = {
    machine: 'machines',
    inspector: 'technicians',
  };
  readonly page = signal({
    title: 'Inspections',
    icon: 'bi-clipboard-check',
    description: 'Schedule safety, quality and condition inspections against assets.',
    singular: 'inspection',
    fields: [{ key: 'machine', label: 'Machine', type: 'relation', relation: 'machines', required: true }, { key: 'type', label: 'Inspection type', type: 'text' }, { key: 'inspector', label: 'Inspector', type: 'relation', relation: 'technicians' }, { key: 'dueDate', label: 'Due date', type: 'date' }, { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'In progress', 'Passed', 'Failed'] }] as MasterField[],
  });
  readonly records = signal<MasterRecord[]>([]);
  readonly relationOptions = signal<Record<string, string[]>>({});
  readonly relationSearch = signal<Record<string, string>>({});
  readonly query = signal('');
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | number | null>(null);
  draft: MasterRecord = { id: '0', module: 'inspections', name: '', status: 'Active' };

  private readonly facade = inject(MmmsFacadeService);

  ngOnInit(): void {
    this.loadInspections();
    this.loadRelations();
  }

  get fields(): MasterField[] {
    return this.page().fields;
  }

  get filtered(): MasterRecord[] {
    const value = this.query().toLowerCase().trim();
    return this.records().filter((record) => !value || Object.values(record).some((item) => String(item).toLowerCase().includes(value)));
  }

  loadInspections(): void {
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
    if (!requiredFields.every((field) => String(this.draft[field.key] ?? '').trim())) return;
    const id = this.editingId() ? String(this.editingId()) : null;
    const payload = { ...this.draft, module: this.moduleCode, status: this.draft.status || 'Active' };
    this.facade.saveMasterRecord(this.moduleCode, id, payload).subscribe({
      next: (response) => {
        const saved = ((response as { result?: MasterRecord })?.result ?? payload) as MasterRecord;
        this.records.update((rows) => id ? rows.map((row) => String(row.id) === id ? saved : row) : [saved, ...rows]);
        this.closeEditor();
      },
    });
  }

  remove(record: MasterRecord): void {
    if (!confirm(`Remove this ${this.page().singular}?`)) return;
    this.facade.deleteMasterRecord(this.moduleCode, String(record.id)).subscribe({
      next: () => this.records.update((rows) => rows.filter((row) => String(row.id) !== String(record.id))),
    });
  }

  value(record: MasterRecord, key: string): string {
    return String(record[key] ?? '—');
  }
}
