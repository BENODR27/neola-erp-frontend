import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { MachineSummary, TechnicianSummary } from '../../models/mmms.models';
import { MmmsMasterRecord } from '../../services/mmms-facade.service';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MmmsContextService } from '../../services/mmms-context.service';

@Component({ selector: 'app-mmms-record-editor', standalone: false, templateUrl: './mmms-record-editor-linked.component.html', styleUrls: ['./mmms-record-editor.component.css'], changeDetection: ChangeDetectionStrategy.OnPush })
export class MmmsRecordEditorComponent implements OnInit, OnChanges {
  @Input() open = false;
  @Input() module = '';
  @Input() title = '';
  @Input() editingId: string | null = null;
  @Input() draft: Record<string, string | number> = {};
  @Input() machineOptions: MachineSummary[] = [];
  @Input() technicianOptions: TechnicianSummary[] = [];
  @Input() factoryOptions: MmmsMasterRecord[] = [];
  @Input() lineOptions: MmmsMasterRecord[] = [];
  @Input() categoryOptions: MmmsMasterRecord[] = [];
  @Input() vendorOptions: MmmsMasterRecord[] = [];
  @Input() error = '';
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  private readonly facade = inject(MmmsFacadeService);
  readonly context = inject(MmmsContextService);
  relationSearch: Record<string, string> = {};

  ngOnInit(): void {
    this.facade.getMachines().subscribe({ next: (rows) => { if (!this.machineOptions.length) this.machineOptions = rows; } });
    this.facade.getTechnicians().subscribe({ next: (rows) => { if (!this.technicianOptions.length) this.technicianOptions = rows; } });
    this.facade.getMasterRecords('factories').subscribe({ next: (rows) => { if (!this.factoryOptions.length) this.factoryOptions = rows; } });
    this.facade.getMasterRecords('production-lines').subscribe({ next: (rows) => { if (!this.lineOptions.length) this.lineOptions = rows; } });
    this.facade.getMasterRecords('machine-categories').subscribe({ next: (rows) => { if (!this.categoryOptions.length) this.categoryOptions = rows; } });
    this.facade.getMasterRecords('vendors').subscribe({ next: (rows) => { if (!this.vendorOptions.length) this.vendorOptions = rows; } });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue || changes['draft']) this.applyWorkspaceScope();
  }

  private applyWorkspaceScope(): void {
    const current = this.context.context();
    if (current.organizationId) this.draft['organizationId'] = current.organizationId;
    if (current.factoryId) {
      this.draft['factoryId'] = current.factoryId;
      this.draft['factoryLocationId'] = current.factoryId;
      this.draft['factory'] = current.factoryName || '';
      this.draft['factoryLocation'] = current.factoryName || '';
    }
  }

  technicianChanged(id: string | number): void {
    const technician = this.technicianOptions.find((item) => item.id === String(id));
    this.draft['technicianId'] = String(id || '');
    this.draft['technician'] = technician?.name ?? '';
  }

  machineChanged(value: string): void {
    this.draft['machineId'] = String(value || '').split(' · ')[0];
    this.draft['machine'] = value;
  }
  masterChanged(field: string, value: string): void {
    this.draft[field] = value;
    const options = field === 'factoryLocation' || field === 'factory' ? this.factoryOptions : field === 'line' ? this.lineOptions : this.categoryOptions;
    const match = options.find((item) => item.name === value || item.code === value);
    if (match) this.draft[`${field}Id`] = String(match.id);
  }
  filterOptions<T extends { name?: string; code?: string }>(options: T[], field: string): T[] {
    const search = (this.relationSearch[field] || '').toLowerCase().trim();
    return !search ? options : options.filter((item) => `${item.name || ''} ${item.code || ''}`.toLowerCase().includes(search));
  }
  updateRelationSearch(field: string, value: string): void { this.relationSearch[field] = value; }
}
