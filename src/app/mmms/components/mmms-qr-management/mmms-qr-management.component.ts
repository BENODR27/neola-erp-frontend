import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
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
  readonly pagination = new MmmsPagination();
  readonly historyPagination = new MmmsPagination();
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
    this.facade.getMachineRecords().subscribe({
      next: (rows) => this.machines.set(rows),
      error: () => this.error.set('Machine labels could not be loaded.'),
    });
    const reference = this.route.snapshot.queryParamMap.get('reference');
    if (reference) this.scan(reference);
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
        this.facade
          .getQrMachineHistory(machine.id)
          .subscribe({ next: (rows) => this.history.set(rows), error: () => this.history.set([]) });
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
    this.printRows.set(machine ? [machine] : this.machines());
    document.body.classList.add('mmms-print-qr');
    window.addEventListener('afterprint', () => document.body.classList.remove('mmms-print-qr'), {
      once: true,
    });
    setTimeout(() => window.print(), 0);
  }
}
