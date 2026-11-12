import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
interface MasterPage {
  title: string;
  icon: string;
  description: string;
  singular: string;
  fields: MasterField[];
}
interface MasterRecord {
  id: string | number;
  name?: string;
  code?: string;
  status: string;
  [key: string]: string | number | undefined;
}
const pages: Record<string, MasterPage> = {
  organization: {
    title: 'Organization',
    icon: 'bi-building',
    description:
      'Define the maintenance operating model, sites, ownership and escalation boundaries.',
    singular: 'organization unit',
    fields: [
      { key: 'name', label: 'Organization name', required: true },
      { key: 'code', label: 'Code', required: true },
      { key: 'manager', label: 'Responsible manager' },
      { key: 'email', label: 'Contact email', type: 'email' },
    ],
  },
  factories: {
    title: 'Factories & Sites',
    icon: 'bi-buildings',
    description: 'Manage factories, workshops and site-level operating calendars.',
    singular: 'factory',
    fields: [
      { key: 'name', label: 'Factory name', required: true },
      { key: 'code', label: 'Factory code', required: true },
      { key: 'organizationId', label: 'Organization', relation: 'organization', required: true },
      { key: 'location', label: 'Location' },
      { key: 'manager', label: 'Site manager' },
    ],
  },
  departments: {
    title: 'Departments',
    icon: 'bi-diagram-3',
    description: 'Keep responsibility, cost-centre and maintenance ownership visible.',
    singular: 'department',
    fields: [
      { key: 'name', label: 'Department name', required: true },
      { key: 'code', label: 'Code', required: true },
      { key: 'factory', label: 'Factory' },
      { key: 'costCenter', label: 'Cost centre' },
    ],
  },
  'production-lines': {
    title: 'Floors & Production Lines',
    icon: 'bi-layout-three-columns',
    description: 'Map production areas and lines so assets, work and impact stay connected.',
    singular: 'production line',
    fields: [
      { key: 'name', label: 'Line name', required: true },
      { key: 'code', label: 'Line code', required: true },
      { key: 'factory', label: 'Factory', required: true },
      { key: 'floor', label: 'Floor / area' },
      { key: 'supervisor', label: 'Line supervisor' },
    ],
  },
  'machine-categories': {
    title: 'Machine Categories',
    icon: 'bi-tags',
    description: 'Standardize equipment classification and criticality defaults.',
    singular: 'machine category',
    fields: [
      { key: 'name', label: 'Category name', required: true },
      { key: 'code', label: 'Code', required: true },
      {
        key: 'criticality',
        label: 'Default criticality',
        type: 'select',
        options: ['Low', 'Medium', 'High', 'Critical'],
      },
      { key: 'description', label: 'Description' },
    ],
  },
  allocations: {
    title: 'Machine Allocation',
    icon: 'bi-pin-map',
    description: 'Track where every asset is installed and who owns it.',
    singular: 'allocation',
    fields: [
      { key: 'machine', label: 'Machine', required: true },
      { key: 'factory', label: 'Factory', required: true },
      { key: 'line', label: 'Production line' },
      { key: 'effectiveDate', label: 'Effective date', type: 'date' },
    ],
  },
  transfers: {
    title: 'Machine Transfers',
    icon: 'bi-arrow-left-right',
    description: 'Record controlled equipment moves with approvals and an audit trail.',
    singular: 'transfer',
    fields: [
      { key: 'machine', label: 'Machine', required: true },
      { key: 'fromSite', label: 'From site', required: true },
      { key: 'toSite', label: 'To site', required: true },
      { key: 'transferDate', label: 'Transfer date', type: 'date' },
      { key: 'reason', label: 'Reason' },
    ],
  },
  inspections: {
    title: 'Inspections',
    icon: 'bi-clipboard-check',
    description: 'Schedule safety, quality and condition inspections against assets.',
    singular: 'inspection',
    fields: [
      { key: 'machine', label: 'Machine', required: true },
      { key: 'type', label: 'Inspection type' },
      { key: 'inspector', label: 'Inspector' },
      { key: 'dueDate', label: 'Due date', type: 'date' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: ['Planned', 'In progress', 'Passed', 'Failed'],
      },
    ],
  },
  vendors: {
    title: 'Vendors & Contractors',
    icon: 'bi-person-lines-fill',
    description: 'Maintain supplier contacts, service coverage and commercial readiness.',
    singular: 'vendor',
    fields: [
      { key: 'name', label: 'Vendor name', required: true },
      { key: 'category', label: 'Service category' },
      { key: 'contact', label: 'Primary contact' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email', type: 'email' },
    ],
  },
  calibration: {
    title: 'Calibration',
    icon: 'bi-sliders2-vertical',
    description: 'Control measuring equipment certificates, due dates and evidence.',
    singular: 'calibration record',
    fields: [
      { key: 'instrument', label: 'Instrument', required: true },
      { key: 'certificate', label: 'Certificate number' },
      { key: 'provider', label: 'Calibration provider' },
      { key: 'dueDate', label: 'Next due date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Valid', 'Due soon', 'Expired'] },
    ],
  },
  notifications: {
    title: 'Notifications',
    icon: 'bi-bell',
    description: 'Configure operational alerts for overdue work, breakdowns and stock risk.',
    singular: 'notification rule',
    fields: [
      { key: 'name', label: 'Rule name', required: true },
      { key: 'event', label: 'Trigger event' },
      { key: 'audience', label: 'Recipients' },
      {
        key: 'channel',
        label: 'Channel',
        type: 'select',
        options: ['Email', 'In-app', 'Email + In-app'],
      },
    ],
  },
  configuration: {
    title: 'Configuration',
    icon: 'bi-gear',
    description: 'Set defaults that keep maintenance workflows consistent across sites.',
    singular: 'configuration setting',
    fields: [
      { key: 'name', label: 'Setting name', required: true },
      { key: 'value', label: 'Value', required: true },
      { key: 'scope', label: 'Scope' },
      { key: 'description', label: 'Description' },
    ],
  },
};
@Component({
  selector: 'app-mmms-master-data',
  standalone: false,
  templateUrl: './mmms-master-data-linked.component.html',
  styleUrls: ['./mmms-master-data.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsMasterDataComponent implements OnInit {
  @Input() masterModuleOverride?: string;
  readonly page = signal<MasterPage>(pages['organization']);
  readonly pageKey = signal('organization');
  readonly records = signal<MasterRecord[]>([]);
  readonly query = signal('');
  readonly editorOpen = signal(false);
  readonly editingId = signal<string | number | null>(null);
  draft: MasterRecord = { id: 0, status: 'Active' };
  readonly relationOptions = signal<Record<string, MasterRecord[]>>({});
  relationSearch: Record<string, string> = {};
  protected readonly facade = inject(MmmsFacadeService);
  private readonly notifications = inject(NotificationService);
  constructor(private readonly route: ActivatedRoute) {}
  ngOnInit(): void {
    const key =
      this.masterModuleOverride ||
      (this.route.snapshot.data['masterModule'] as string) ||
      'organization';
    this.pageKey.set(key);
    this.page.set(pages[key] || pages['organization']);
    this.loadRelationOptions();
    this.refreshRecords(key);
  }
  private loadRelationOptions(): void {
    ['organization', 'factories', 'departments', 'production-lines', 'machine-categories', 'vendors'].forEach((key) => this.facade.getMasterRecords(key).subscribe({ next: (rows) => this.relationOptions.update((current) => ({ ...current, [key]: rows as MasterRecord[] })) }));
    this.facade.getMachines().subscribe({ next: (rows) => this.relationOptions.update((current) => ({ ...current, machines: rows as unknown as MasterRecord[] })) });
    this.facade.getTechnicians().subscribe({ next: (rows) => this.relationOptions.update((current) => ({ ...current, technicians: rows as unknown as MasterRecord[] })) });
  }
  relationFor(field: MasterField): MasterRecord[] {
    const key = field.relation || ({ factory: 'factories', fromSite: 'factories', toSite: 'factories', machine: 'machines', line: 'production-lines', organizationId: 'organization', factoryId: 'factories' } as Record<string, string>)[field.key];
    return key ? this.relationOptions()[key] || [] : [];
  }
  filteredRelation(field: MasterField): MasterRecord[] {
    const q = (this.relationSearch[field.key] || '').toLowerCase().trim();
    return this.relationFor(field).filter((item) => !q || `${item['name'] || ''} ${item['code'] || ''}`.toLowerCase().includes(q));
  }
  updateRelationSearch(field: string, value: string): void { this.relationSearch[field] = value; }
  refreshRecords(key = this.pageKey()): void {
    this.facade.getMasterRecords(key).subscribe({
      next: (rows) => this.records.set(rows as MasterRecord[]),
      error: () => this.seed(key),
    });
  }
  get fields(): MasterField[] {
    return this.page().fields;
  }
  get filtered(): MasterRecord[] {
    const q = this.query().toLowerCase().trim();
    return this.records().filter(
      (r) => !q || Object.values(r).some((v) => String(v).toLowerCase().includes(q)),
    );
  }
  updateQuery(v: string): void {
    this.query.set(v);
  }
  openCreate(): void {
    this.editingId.set(null);
    this.draft = { id: 0, status: 'Active' };
    this.editorOpen.set(true);
  }
  openEdit(r: MasterRecord): void {
    this.editingId.set(r.id);
    this.draft = { ...r };
    this.editorOpen.set(true);
  }
  closeEditor(): void {
    this.editorOpen.set(false);
  }
  save(): void {
    const next: MasterRecord = { ...this.draft, status: this.draft.status || 'Active' };
    if (!this.fields.filter((f) => f.required).every((f) => String(next[f.key] || '').trim())) {
      this.notifications.warning('Required fields missing', 'Complete the highlighted fields before saving.');
      return;
    }
    const id = this.editingId() ? String(this.editingId()) : null;
    this.facade.saveMasterRecord(this.pageKey(), id, next as Record<string, string | number>).subscribe({
      next: (response) => {
        const saved = (response as { result?: MasterRecord })?.result || next;
        if (id) this.records.update((x) => x.map((r) => (String(r.id) === id ? saved : r)));
        else this.records.update((x) => [saved, ...x]);
        this.closeEditor();
        this.notifications.success(id ? 'Record updated' : 'Record created', `${this.page().singular} saved successfully.`);
      },
      error: (error) => this.notifications.handleError(error, 'Could not save record'),
    });
  }
  remove(r: MasterRecord): void {
    this.notifications.confirm(`Remove this ${this.page().singular}?`, 'Remove', 'Keep').then((result) => {
      if (!result.isConfirmed) return;
      this.facade.deleteMasterRecord(this.pageKey(), String(r.id)).subscribe({
        next: () => {
          this.records.update((x) => x.filter((i) => i.id !== r.id));
          this.notifications.success('Record removed', `${this.page().singular} was removed from this workspace.`);
        },
        error: (error) => this.notifications.handleError(error, 'Could not remove record'),
      });
    });
  }
  value(r: MasterRecord, k: string): string {
    return String(r[k] ?? '—');
  }
  private seed(k: string): void {
    const s: Record<string, MasterRecord[]> = {
      organization: [
        {
          id: 1,
          name: 'MaintIQ Operations',
          code: 'MNT',
          manager: 'Operations Director',
          email: 'ops@company.local',
          status: 'Active',
        },
      ],
      factories: [
        {
          id: 1,
          name: 'Central Manufacturing Plant',
          code: 'FAC-01',
          location: 'Amman',
          manager: 'M. Haddad',
          status: 'Active',
        },
        {
          id: 2,
          name: 'North Assembly Site',
          code: 'FAC-02',
          location: 'Irbid',
          manager: 'S. Khalil',
          status: 'Active',
        },
      ],
      departments: [
        {
          id: 1,
          name: 'Engineering Maintenance',
          code: 'ENG-MNT',
          factory: 'Central Manufacturing Plant',
          costCenter: 'CC-410',
          status: 'Active',
        },
      ],
      'machine-categories': [
        {
          id: 1,
          name: 'Production equipment',
          code: 'PROD',
          criticality: 'Critical',
          description: 'Line-critical machinery',
          status: 'Active',
        },
      ],
      allocations: [
        {
          id: 1,
          machine: 'CNC-0871',
          factory: 'Central Manufacturing Plant',
          line: 'Assembly Line A',
          effectiveDate: '2026-10-01',
          status: 'Active',
        },
      ],
      transfers: [
        {
          id: 1,
          machine: 'Press-204',
          fromSite: 'North Assembly Site',
          toSite: 'Central Manufacturing Plant',
          transferDate: '2026-11-05',
          reason: 'Capacity balancing',
          status: 'Approved',
        },
      ],
      inspections: [
        {
          id: 1,
          machine: 'CNC-0871',
          type: 'Safety inspection',
          inspector: 'Omar Saleh',
          dueDate: '2026-11-20',
          status: 'Planned',
        },
      ],
      vendors: [
        {
          id: 1,
          name: 'Precision Industrial Services',
          category: 'Mechanical',
          contact: 'Rami N.',
          phone: '+962 6 000 0000',
          email: 'service@precision.local',
          status: 'Active',
        },
      ],
      calibration: [
        {
          id: 1,
          instrument: 'Gauge-44',
          certificate: 'CAL-2026-114',
          provider: 'Metrology Labs',
          dueDate: '2027-02-15',
          status: 'Valid',
        },
      ],
      notifications: [
        {
          id: 1,
          name: 'Critical breakdown alert',
          event: 'Breakdown created',
          audience: 'Maintenance managers',
          channel: 'Email + In-app',
          status: 'Active',
        },
      ],
      configuration: [
        {
          id: 1,
          name: 'Default work order priority',
          value: 'Medium',
          scope: 'All factories',
          description: 'Applied when no priority is selected',
          status: 'Active',
        },
      ],
    };
    this.records.set(s[k] || []);
  }
}
