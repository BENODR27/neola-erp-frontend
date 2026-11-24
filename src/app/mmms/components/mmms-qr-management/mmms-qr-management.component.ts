import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MachineRecord } from '../../models/mmms-machine.models';
import { MachineHistorySummary } from '../../models/mmms.models';
@Component({
  selector: 'app-mmms-qr-management',
  standalone: false,
  templateUrl: './mmms-qr-management.component.html',
  styleUrls: ['./mmms-qr-management.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsQrManagementComponent implements OnInit {
  private readonly paginationCleanup = inject(DestroyRef).onDestroy(() => {
    this.pagination.destroy();
    this.historyPagination.destroy();
  });
  readonly pagination = new MmmsPagination(() => this.load());
  readonly historyPagination = new MmmsPagination(() => this.loadHistory());
  readonly machines = signal<MachineRecord[]>([]);
  readonly selected = signal<MachineRecord | null>(null);
  readonly history = signal<MachineHistorySummary[]>([]);
  readonly printRows = signal<MachineRecord[]>([]);
  readonly scannerOpen = signal(false);
  readonly error = signal('');
  reference = '';
  private readonly facade = inject(MmmsFacadeService);
  private readonly route = inject(ActivatedRoute);
  ngOnInit(): void {
    this.load();
    const reference = this.route.snapshot.queryParamMap.get('reference');
    if (reference) this.scan(reference);
  }
  load(): void {
    this.pagination
      .read(this.facade.getPage<MachineRecord>('machines', this.pagination.query()))
      .subscribe({
        next: (rows) => this.machines.set(rows),
        error: () => this.error.set('Machine labels could not be loaded.'),
      });
  }
  loadHistory(): void {
    const id = this.selected()?.id;
    if (!id) return;
    this.historyPagination
      .read(
        this.facade.getPage<MachineHistorySummary>(
          `machines/${id}/history`,
          this.historyPagination.query(),
        ),
      )
      .subscribe({
        next: (rows) => this.history.set(rows),
        error: () => this.error.set('Machine history could not be loaded.'),
      });
  }
  link(machine: MachineRecord): string {
    const url = new URL('/mmms/qr-management', window.location.origin);
    url.searchParams.set('reference', machine.qrReference);
    return url.href;
  }
  scan(value: string): void {
    this.error.set('');
    let reference = value.trim();
    try {
      const url = new URL(reference);
      if (url.origin !== window.location.origin || url.pathname !== '/mmms/qr-management') {
        this.error.set('This code is not an MMMS machine label.');
        return;
      }
      reference = url.searchParams.get('reference') || '';
    } catch {
      /* A raw permanent QR reference is also supported. */
    }
    if (!reference.startsWith('MMMS-')) {
      this.error.set('Enter a valid MMMS machine QR reference.');
      return;
    }
    this.facade.resolveMachineQr(reference).subscribe({
      next: (machine) => {
        this.selected.set(machine);
        this.scannerOpen.set(false);
        this.historyPagination.page.set(1);
        this.loadHistory();
      },
      error: () => this.error.set('Machine code was not found or is outside your access scope.'),
    });
  }
  private readonly auth = inject(AuthService);
  print(machine?: MachineRecord): void {
    if (!this.auth.hasPermission('MMMS-QR-MANAGEMENT-PRINT')) {
      this.error.set('MMMS-QR-MANAGEMENT-PRINT permission required');
      return;
    }
    this.printLabels(machine ? [machine] : this.machines());
  }
  printAll(): void {
    if (!this.auth.hasPermission('MMMS-QR-MANAGEMENT-PRINT')) {
      this.error.set('MMMS-QR-MANAGEMENT-PRINT permission required');
      return;
    }
    this.facade
      .getMachineRecords()
      .subscribe({
        next: (rows) => this.printLabels(rows),
        error: () => this.error.set('Machine labels could not be loaded for printing.'),
      });
  }
  private printLabels(rows: MachineRecord[]): void {
    this.printRows.set(rows);
    document.body.classList.add('mmms-print-qr');
    window.addEventListener('afterprint', () => document.body.classList.remove('mmms-print-qr'), {
      once: true,
    });
    setTimeout(() => window.print(), 0);
  }
}
