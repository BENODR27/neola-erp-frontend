import { MmmsContextService } from '../../services/mmms-context.service';
import { MmmsPagination } from '../mmms-pagination/mmms-pagination';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';
import { MmmsFacadeService } from '../../services/mmms-facade.service';
import { OrganizationUnit, ORGANIZATION_PARENTS } from '../../models/mmms-organization.models';
@Component({
  selector: 'app-mmms-organization',
  standalone: false,
  templateUrl: './mmms-organization.component.html',
  styleUrls: ['./mmms-organization.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmmsOrganizationComponent implements OnInit {
  readonly pagination = new MmmsPagination();
  private readonly selectedTypes = signal<string[]>([]);
  @Input() set unitTypes(value: string[]) {
    this.selectedTypes.set(value);
  }
  get unitTypes(): string[] {
    return this.selectedTypes();
  }
  private readonly context = inject(MmmsContextService);
  readonly rows = signal<OrganizationUnit[]>([]);
  readonly search = signal('');
  readonly error = signal('');
  readonly saving = signal(false);
  readonly editorOpen = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly types = Object.keys(ORGANIZATION_PARENTS);
  readonly visible = computed(() =>
    this.rows().filter(
      (row) =>
        (!this.unitTypes.length || this.unitTypes.includes(row.unitType)) &&
        (!this.context.context().organizationId ||
          row.organizationId === this.context.context().organizationId) &&
        (!this.context.context().factoryId ||
          this.unitTypes.includes('Factory') ||
          !row.factoryId ||
          row.factoryId === this.context.context().factoryId) &&
        [row.name, row.code, row.unitType, row.manager].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(this.search().toLowerCase()),
        ),
    ),
  );
  draft: Partial<OrganizationUnit> = {};
  private readonly facade = inject(MmmsFacadeService);
  ngOnInit(): void {
    this.load();
  }
  load(): void {
    this.facade.getOrganizationHierarchy().subscribe({
      next: (rows) => this.rows.set(rows),
      error: (error: unknown) => this.fail(error),
    });
  }
  edit(unit?: OrganizationUnit): void {
    this.selectedId.set(unit?.id || null);
    this.draft = unit
      ? { ...unit }
      : {
          name: '',
          code: '',
          unitType: this.unitTypes[0] || 'Company',
          parentId: null,
          status: 'Active',
          manager: '',
          email: '',
          description: '',
        };
    this.editorOpen.set(true);
  }
  parentOptions(): OrganizationUnit[] {
    return this.rows().filter(
      (row) =>
        row.id !== this.selectedId() &&
        (ORGANIZATION_PARENTS[this.draft.unitType || ''] || []).includes(row.unitType) &&
        row.status === 'Active',
    );
  }
  parentName(id: string | null): string {
    return this.rows().find((row) => row.id === id)?.name || '—';
  }
  save(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    this.facade
      .saveOrganizationUnit(this.selectedId(), this.draft)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.editorOpen.set(false);
          this.load();
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  private fail(error: unknown): void {
    this.error.set(
      (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
        'Unable to update the organization hierarchy.',
    );
  }
}
