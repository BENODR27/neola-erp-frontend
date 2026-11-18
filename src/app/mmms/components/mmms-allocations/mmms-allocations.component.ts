import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { MmmsContextService } from '../../services/mmms-context.service';
import { MachineSummary } from '../../models/mmms.models';
import {
  ALLOCATION_TRANSITIONS,
  MachineMovement,
  MovementDraft,
  MovementUnit,
} from '../../models/mmms-movement.models';

@Component({
  selector: 'app-mmms-allocations',
  standalone: false,
  templateUrl: './mmms-allocations.component.html',
  styleUrls: ['./mmms-allocations.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsAllocationsComponent implements OnInit {
  readonly pagination = new MmmsPagination();
  readonly module = 'allocations' as const;
  readonly title = 'Machine allocations';
  readonly records = signal<MachineMovement[]>([]);
  readonly machines = signal<MachineSummary[]>([]);
  readonly units = signal<MovementUnit[]>([]);
  readonly factories = computed(() => this.units().filter((row) => row.unitType === 'Factory'));
  destinationUnits(type: string): MovementUnit[] {
    return this.units().filter(
      (row) => row.unitType === type && row.factoryId === this.draft.destination.factoryId,
    );
  }
  resetDestination(): void {
    this.draft.destination = { factoryId: this.draft.destination.factoryId, currentLocation: '' };
  }
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly search = signal('');
  readonly editorOpen = signal(false);
  readonly selected = signal<MachineMovement | null>(null);
  readonly visible = computed(() =>
    this.records().filter((row) =>
      [row.machine, row.machineCode, row.status, row.reason].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(this.search().toLowerCase()),
      ),
    ),
  );
  draft: MovementDraft = this.emptyDraft();
  actionReason = '';
  private readonly facade = inject(MmmsFacadeService);
  private readonly auth = inject(AuthService);
  private readonly context = inject(MmmsContextService);

  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      rows: this.facade.getMovements(this.module),
      machines: this.facade.getMachines(),
      factories: this.facade.getMovementDestinations(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ rows, machines, factories }) => {
          this.records.set(rows);
          this.machines.set(machines);
          this.units.set(factories);
        },
        error: (error: unknown) => this.error.set(this.message(error)),
      });
  }
  openCreate(): void {
    this.selected.set(null);
    this.draft = this.emptyDraft();
    this.draft.destination.factoryId = this.context.context().factoryId || '';
    this.editorOpen.set(true);
  }
  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.facade
      .createMovement(this.module, this.draft)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.load();
        },
        error: (error: unknown) => this.error.set(this.message(error)),
      });
  }
  actions(row: MachineMovement): string[] {
    const transitions = ALLOCATION_TRANSITIONS;
    return (transitions[row.status] || []).filter((status) => {
      if (status === 'Rejected')
        return this.auth.hasPermission('MMMS-' + this.module.toUpperCase() + '-REJECT');
      if (status === 'Approved')
        return this.auth.hasPermission('MMMS-' + this.module.toUpperCase() + '-APPROVE');
      if (status === 'Received') return this.auth.hasPermission('MMMS-TRANSFERS-RECEIVE');
      return true;
    });
  }
  transition(row: MachineMovement, status: string): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.facade
      .transitionMovement(this.module, row.id, status, this.actionReason)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.actionReason = '';
          this.selected.set(null);
          this.load();
        },
        error: (error: unknown) => this.error.set(this.message(error)),
      });
  }
  private emptyDraft(): MovementDraft {
    return {
      machineId: '',
      reason: '',
      expectedDate: '',
      allocationType: 'Permanent',
      destination: { factoryId: '', currentLocation: '', responsiblePerson: '', floor: '' },
    };
  }
  private message(error: unknown): string {
    return (
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
      'The request failed. Please retry.'
    );
  }
}
