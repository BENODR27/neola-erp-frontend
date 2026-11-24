import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthSession, AuthUser } from '../models/auth.models';
import { APP_CONSTANTS } from '../../shared/config/app-constants';
import { LocalStorageService } from '../../shared/services/local-storage/local-storage.service';
import { coversHierarchyPermission } from '../../shared/services/masters/masters-permissions';
import {
  clearAuthStorage,
  readAuthSession,
  sessionIsCurrent,
  writeAuthSession,
} from './auth-session.persistence';

const SESSION_KEY = APP_CONSTANTS.storage.authSession;
const SESSION_CONTEXT_KEYS = [
  'loginvia',
  'currentEmpName',
  'currentEmpId',
  'username',
  'userId',
  'token',
  'roles',
  'permissions',
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<AuthSession | null>(this.readSession());
  readonly currentUser = computed(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.session()?.accessToken));
  readonly permissions = computed(() => this.getPermissions(this.currentUser()));

  constructor(
    private readonly router: Router,
    private readonly storage: LocalStorageService,
  ) {}

  isLoggedIn(): boolean {
    return Boolean(this.getToken());
  }

  getToken(): string | null {
    if (this.session() && !sessionIsCurrent(this.session())) this.clearSession();
    return this.session()?.accessToken ?? null;
  }

  setSession(session: AuthSession, rememberMe = false): void {
    writeAuthSession(
      session,
      rememberMe,
      localStorage,
      sessionStorage,
      SESSION_KEY,
      SESSION_CONTEXT_KEYS,
    );
    const location = rememberMe ? 'local' : 'session';
    const user = session.user;
    this.storage.setItem('loginvia', '/signin', location);
    this.storage.setItem('currentEmpName', user?.name ?? user?.['employeeName'] ?? '', location);
    this.storage.setItem('currentEmpId', user?.username ?? user?.['employeeCode'] ?? '', location);
    this.storage.setItem('username', user?.username ?? user?.['employeeCode'] ?? '', location);
    this.storage.setItem('userId', user?.id, location);
    this.session.set(session);
  }

  hasPermission(permission: string | null | undefined): boolean {
    if (!permission) return true;
    const permissions = this.permissions();
    return (
      permissions.includes('*') ||
      permissions.includes('superadmin') ||
      permissions.includes(permission) ||
      coversHierarchyPermission(permissions, permission)
    );
  }

  async logout(): Promise<void> {
    this.clearSession();
    await this.router.navigate(['/signin']);
  }

  private getPermissions(user: AuthUser | null): string[] {
    return Array.isArray(user?.permissions) ? user.permissions : [];
  }

  private readSession(): AuthSession | null {
    return readAuthSession(localStorage, sessionStorage, SESSION_KEY, SESSION_CONTEXT_KEYS);
  }

  private clearSession(): void {
    this.session.set(null);
    clearAuthStorage(localStorage, sessionStorage, SESSION_KEY, SESSION_CONTEXT_KEYS);
  }
}
