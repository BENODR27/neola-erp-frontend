import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MachineRecord } from '../../models/mmms-machine.models';
import { MachineHistorySummary } from '../../models/mmms.models';
interface MachineField {
  key: string;
  label: string;
  type?: string;
}
@Component({
  selector: 'app-mmms-machines',
  standalone: false,
  templateUrl: './mmms-machines.component.html',
  styleUrls: ['./mmms-machines.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsMachinesComponent implements OnInit {
  readonly pagination = new MmmsPagination();
  readonly historyPagination = new MmmsPagination();
  readonly machines = signal<MachineRecord[]>([]);
  readonly history = signal<MachineHistorySummary[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly query = signal('');

  readonly editorOpen = signal(false);
  readonly selected = signal<MachineRecord | null>(null);
  readonly filtered = computed(() =>
    this.machines().filter((row) =>
      [
        row.name,
        row.machineCode,
        row.assetNumber,
        row.category,
        row.status,
        row['serialNumber'],
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(this.query().toLowerCase()),
      ),
    ),
  );
  readonly visible = computed(() => this.pagination.slice(this.filtered()));
  readonly lifecycle = [
    'Requested',
    'Purchased',
    'Received',
    'Under Installation',
    'Active',
    'Under Maintenance',
    'Under Repair',
    'Idle',
    'Temporarily Stopped',
    'Decommissioned',
    'Scrapped',
  ];
  readonly fields: MachineField[] = [
    { key: 'name', label: 'Machine name' },
    { key: 'assetNumber', label: 'Asset number (generated if empty)' },
    { key: 'category', label: 'Category' },
    { key: 'subcategory', label: 'Subcategory' },
    { key: 'machineType', label: 'Machine type' },
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'brand', label: 'Brand' },
    { key: 'modelNumber', label: 'Model number' },
    { key: 'serialNumber', label: 'Serial number' },
    { key: 'manufacturingYear', label: 'Manufacturing year', type: 'number' },
    { key: 'purchaseDate', label: 'Purchase date', type: 'date' },
    { key: 'purchasePrice', label: 'Purchase price', type: 'number' },
    { key: 'supplier', label: 'Supplier' },
    { key: 'warrantyStartDate', label: 'Warranty start', type: 'date' },
    { key: 'warrantyExpiryDate', label: 'Warranty expiry', type: 'date' },
    { key: 'installationDate', label: 'Installation date', type: 'date' },
    { key: 'commissioningDate', label: 'Commissioning date', type: 'date' },
    { key: 'powerConsumption', label: 'Power consumption' },
    { key: 'machineCapacity', label: 'Machine capacity' },
    { key: 'description', label: 'Description' },
    { key: 'responsiblePerson', label: 'Responsible person' },
    { key: 'operatingHours', label: 'Operating hours', type: 'number' },
    { key: 'productionQuantity', label: 'Production quantity', type: 'number' },
  ];
  draft: Partial<MachineRecord> = {};
  technicalText = '{}';
  customValues: Record<string, string | number> = {};
  categories: string[] = [];
  subcategories: string[] = [];
  machineTypes: string[] = [];
  private readonly facade = inject(MmmsFacadeService);
  private readonly route = inject(ActivatedRoute);
  ngOnInit(): void {
    this.facade.getSettings().subscribe({
      next: (settings) => {
        this.categories = settings.machineCategories;
        this.subcategories = settings['machineSubcategories'] as string[];
        this.machineTypes = settings['machineTypes'] as string[];
      },
    });
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.facade
      .getMachineRecords()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (rows) => {
          this.machines.set(rows);
          const id = this.route.snapshot.queryParamMap.get('machineId');
          const row = rows.find((item) => item.id === id);
          if (row) this.profile(row);
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  edit(machine?: MachineRecord): void {
    this.selected.set(machine || null);
    this.draft = machine
      ? structuredClone(machine)
      : {
          name: '',
          category: '',
          assetNumber: '',
          lifecycleStatus: 'Active',
          status: 'Idle',
          documents: [],
          operatingHours: 0,
          productionQuantity: 0,
        };
    this.technicalText = JSON.stringify(machine?.['technicalSpecifications'] || {}, null, 2);
    this.customValues =
      (machine?.['technicalSpecifications'] as { customFields?: Record<string, string | number> })
        ?.customFields || {};
    this.editorOpen.set(true);
  }
  save(): void {
    if (this.saving()) return;
    try {
      this.draft['technicalSpecifications'] = {
        ...JSON.parse(this.technicalText),
        customFields: this.customValues,
      };
    } catch {
      this.error.set('Technical specifications must be valid JSON.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.facade
      .saveMachineRecord(this.selected()?.id || null, this.draft)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.selected.set(null);
          this.load();
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  profile(machine: MachineRecord): void {
    this.selected.set(machine);
    this.facade.getMachineHistory(machine.id).subscribe({
      next: (rows) => this.history.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  archive(machine: MachineRecord): void {
    if (!window.confirm('Archive this machine and retain its history?')) return;
    this.facade.deleteRecord('machines', machine.id).subscribe({
      next: () => {
        this.selected.set(null);
        this.load();
      },
      error: (error: unknown) => this.fail(error),
    });
  }
  async importFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.saving.set(true);
    this.error.set('');
    try {
      let table: string[][];
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        const { Workbook } = await import('exceljs');
        const workbook = new Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        table = [];
        workbook.worksheets[0].eachRow((row) =>
          table.push(
            (row.values as unknown[])
              .slice(1)
              .map((value) => (value === null || value === undefined ? '' : String(value))),
          ),
        );
      } else table = this.parseCsv(await file.text());
      const [headers, ...rows] = table;
      if (!headers?.includes('name') || !headers.includes('category'))
        throw new Error('Import requires name and category column headers.');
      const payload = rows
        .filter((row) => row.some(Boolean))
        .map(
          (row) =>
            Object.fromEntries(
              headers.map((key, index) => [key.trim(), row[index] || '']),
            ) as Partial<MachineRecord>,
        );
      this.facade
        .importMachines(payload)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({ next: () => this.load(), error: (error: unknown) => this.fail(error) });
    } catch (error: unknown) {
      this.saving.set(false);
      this.error.set(error instanceof Error ? error.message : 'Import failed.');
    }
  }
  private parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;
    const source = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      if (char === '"') {
        if (quoted && source[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = !quoted;
      } else if (char === ',' && !quoted) {
        row.push(cell);
        cell = '';
      } else if (char === '\n' && !quoted) {
        row.push(cell.replace(/\r$/, ''));
        rows.push(row);
        row = [];
        cell = '';
      } else cell += char;
    }
    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    if (quoted) throw new Error('CSV has an unclosed quoted field.');
    return rows;
  }
  private fail(error: unknown): void {
    this.error.set(
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
        'Unable to complete the machine request.',
    );
  }
}
