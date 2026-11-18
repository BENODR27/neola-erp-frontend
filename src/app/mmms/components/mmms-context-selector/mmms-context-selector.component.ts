import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MmmsContextService, MmmsScopeOption } from '../../services/mmms-context.service';

@Component({
  selector: 'app-mmms-context-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mmms-context-selector.component.html',
  styleUrls: ['./mmms-context-selector.component.css'],
})
export class MmmsContextSelectorComponent implements OnInit {
  readonly contextService = inject(MmmsContextService);
  readonly open = signal(false);
  readonly selectionRequired = signal(false);
  readonly organizationSearch = signal('');
  readonly factorySearch = signal('');
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      const hasFactories = this.contextService.factories().length > 0;
      const hasFactorySelection = Boolean(this.contextService.context().factoryId);
      const requiresScope = !this.isAdministrativeRoute();
      this.selectionRequired.set(hasFactories && !hasFactorySelection && requiresScope);
      if (hasFactories && !hasFactorySelection && requiresScope) this.open.set(true);
    });
  }

  ngOnInit(): void {
    this.contextService.loadOptions();
  }

  get filteredOrganizations(): MmmsScopeOption[] {
    const query = this.organizationSearch().toLowerCase().trim();
    return this.contextService
      .organizations()
      .filter((item) => !query || `${item.name} ${item.code || ''}`.toLowerCase().includes(query));
  }

  get filteredFactories(): MmmsScopeOption[] {
    const context = this.contextService.context();
    const query = this.factorySearch().toLowerCase().trim();
    return this.contextService.factories().filter((item) => {
      const belongs =
        !context.organizationId ||
        !item.organizationId ||
        item.organizationId === context.organizationId;
      return belongs && (!query || `${item.name} ${item.code || ''}`.toLowerCase().includes(query));
    });
  }

  toggle(): void {
    this.open.update((value) => !value);
  }
  selectOrganization(id: string): void {
    this.contextService.selectOrganization(
      this.contextService.organizations().find((item) => item.id === id) || null,
    );
  }
  selectFactory(id: string): void {
    this.contextService.selectFactory(
      this.contextService.factories().find((item) => item.id === id) || null,
    );
  }
  clear(): void {
    this.contextService.clear();
  }

  private isAdministrativeRoute(): boolean {
    const path = this.router.url.split('?')[0].replace(/\/$/, '');
    return path === '/mmms/organization' || path === '/mmms/factories' || path === '/mmms/help';
  }
}
