import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession, AuthUser } from '../models/auth.models';
import { APP_CONSTANTS } from '../../shared/config/app-constants';

const SESSION_KEY = APP_CONSTANTS.storage.authSession;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<AuthSession | null>(this.readSession());
  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.session()?.accessToken));
  readonly permissions = computed(() => this.getPermissions(this.currentUser()));

  constructor(private readonly router: Router) {}

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getToken(): string | null {
    return this.session()?.accessToken ?? null;
  }

  setSession(session: AuthSession): void {
    this.session.set(session);
    this.persistSession(session);
  }

  hasPermission(permission: string | null | undefined): boolean {
    if (!permission) return true;
    const permissions = this.permissions();
    return (
      permissions.includes('*') ||
      permissions.includes('superadmin') ||
      permissions.includes(permission)
    );
  }

  async logout(): Promise<void> {
    this.session.set(null);
    localStorage.removeItem(SESSION_KEY);
    await this.router.navigate(['/signin']);
  }

  private getPermissions(user: AuthUser | null): string[] {
    return Array.isArray(user?.permissions) ? user.permissions : [];
  }

  private readSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  private persistSession(session: AuthSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}
