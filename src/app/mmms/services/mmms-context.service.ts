import { Injectable, signal } from '@angular/core';
import { ApiService } from '../../shared/services/api/api.service';
import { environment } from '../../shared/environments/environment';

export interface MmmsScopeOption {
  id: string;
  name: string;
  code?: string;
  organizationId?: string;
  organizationName?: string;
}

export interface MmmsContext {
  organizationId: string | null;
  organizationName: string | null;
  factoryId: string | null;
  factoryName: string | null;
}

const STORAGE_KEY = 'mmms-workspace-context';

@Injectable({ providedIn: 'root' })
export class MmmsContextService {
  readonly organizations = signal<MmmsScopeOption[]>([]);
  readonly factories = signal<MmmsScopeOption[]>([]);
  readonly context = signal<MmmsContext>({
    organizationId: null,
    organizationName: null,
    factoryId: null,
    factoryName: null,
  });
  readonly isLoading = signal(false);
  readonly error = signal('');

  constructor(private readonly api: ApiService) {
    this.restore();
  }

  loadOptions(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.error.set('');
    this.api.getDatas(`${environment.MMMS_API_URL}/workspace-context`).subscribe({
      next: (response: {
        result: { organizations: MmmsScopeOption[]; factories: MmmsScopeOption[] };
      }) => {
        this.organizations.set(response.result.organizations);
        this.factories.set(response.result.factories);
        this.reconcileContext();
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Unable to load organization and factory access.');
        this.isLoading.set(false);
      },
    });
  }

  selectOrganization(option: MmmsScopeOption | null): void {
    if (!option) {
      this.setContext({
        organizationId: null,
        organizationName: null,
        factoryId: null,
        factoryName: null,
      });
      return;
    }
    const current = this.context();
    const nextOrganizationId = option.id;
    const factory =
      current.factoryId && this.factoryBelongsTo(current.factoryId, nextOrganizationId)
        ? this.factories().find((item) => item.id === current.factoryId)
        : null;
    this.setContext({
      organizationId: nextOrganizationId,
      organizationName: option.name,
      factoryId: factory?.id ?? null,
      factoryName: factory?.name ?? null,
    });
  }

  selectFactory(option: MmmsScopeOption | null): void {
    const current = this.context();
    this.setContext({
      ...current,
      factoryId: option?.id ?? null,
      factoryName: option?.name ?? null,
      organizationId: option?.organizationId || current.organizationId,
      organizationName: option?.organizationName || current.organizationName,
    });
  }

  clear(): void {
    this.setContext({
      organizationId: null,
      organizationName: null,
      factoryId: null,
      factoryName: null,
    });
  }

  contextQuery(): string {
    const params = new URLSearchParams();
    const current = this.context();
    if (current.organizationId) params.set('organizationId', current.organizationId);
    if (current.factoryId) params.set('factoryId', current.factoryId);
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  private setContext(next: MmmsContext): void {
    const previous = JSON.stringify(this.context());
    this.context.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (previous !== JSON.stringify(next)) window.location.reload();
  }

  private restore(): void {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || 'null',
      ) as Partial<MmmsContext> | null;
      if (saved)
        this.context.set({
          organizationId: saved.organizationId || null,
          organizationName: saved.organizationName || null,
          factoryId: saved.factoryId || null,
          factoryName: saved.factoryName || null,
        });
    } catch {
      /* Ignore invalid local storage and use an unscoped context. */
    }
  }

  private reconcileContext(): void {
    const current = this.context();
    // Keep the restored scope when an option request temporarily returns no data
    // (for example while the API is restarting or a rate limit is being cleared).
    // Clearing it here makes scoped requests unfiltered and can render a valid
    // workspace as an empty page after refresh.
    const organizationsLoaded = this.organizations().length > 0;
    const factoriesLoaded = this.factories().length > 0;
    const organization = current.organizationId
      ? this.organizations().find((item) => item.id === current.organizationId)
      : null;
    const factory = current.factoryId
      ? this.factories().find((item) => item.id === current.factoryId)
      : null;
    const organizationId =
      organizationsLoaded && current.organizationId && !organization
        ? null
        : current.organizationId;
    const factoryId = factoriesLoaded && current.factoryId && !factory ? null : current.factoryId;
    const next = {
      organizationId,
      organizationName: organization?.name ?? (organizationId ? current.organizationName : null),
      factoryId,
      factoryName: factory?.name ?? (factoryId ? current.factoryName : null),
    };
    if (JSON.stringify(current) !== JSON.stringify(next)) {
      this.context.set(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  }

  private factoryBelongsTo(factoryId: string, organizationId: string | null): boolean {
    if (!organizationId) return true;
    const factory = this.factories().find((item) => item.id === factoryId);
    return !factory?.organizationId || factory.organizationId === organizationId;
  }
}
