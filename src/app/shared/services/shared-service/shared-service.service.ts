import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { APP_CONSTANTS } from '../../config/app-constants';

export interface NavbarItem {
  label: string;
  link: string;
  icon?: string;
  permission?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SharedServiceService {
  readonly navbarItems = signal<NavbarItem[]>(this.getStoredNavbarItems());

  updateNavbarItems(items: NavbarItem[]): void {
    const normalizedItems = items.map((item) => ({
      ...item,
      link: this.normalizeAdminRoute(item.link),
    }));
    this.navbarItems.set(normalizedItems);
    localStorage.setItem(APP_CONSTANTS.storage.navbarItems, JSON.stringify(normalizedItems));
  }

  private getStoredNavbarItems(): NavbarItem[] {
    try {
      const stored = JSON.parse(localStorage.getItem(APP_CONSTANTS.storage.navbarItems) || '[]');
      return Array.isArray(stored)
        ? (stored as NavbarItem[]).map((item) => ({
            ...item,
            link: this.normalizeAdminRoute(item.link),
          }))
        : [];
    } catch {
      return [];
    }
  }

  private normalizeAdminRoute(route: string | null | undefined): string {
    if (typeof route !== 'string') return '';

    return route.replace(/^\/admin(?:v2)?(?=\/|$)/, '/adminv2');
  }
}
