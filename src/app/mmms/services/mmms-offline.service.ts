import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { MmmsContextService } from './mmms-context.service';
import { MmmsFacadeService } from './mmms-facade.service';
import { BreakdownRecord } from '../models/mmms-breakdown.models';
export interface OfflineMaintenanceEntry {
  id: string;
  userId: string;
  organizationId: string;
  factoryId: string;
  kind: 'breakdown';
  payload: Partial<BreakdownRecord>;
  files: File[];
  status: 'Pending' | 'Failed' | 'Synced';
  attempts: number;
  error: string;
  createdAt: string;
}
@Injectable({ providedIn: 'root' })
export class MmmsOfflineService {
  readonly entries = signal<OfflineMaintenanceEntry[]>([]);
  readonly syncing = signal(false);
  readonly online = signal(navigator.onLine);
  private readonly auth = inject(AuthService);
  private readonly context = inject(MmmsContextService);
  private readonly facade = inject(MmmsFacadeService);
  constructor() {
    effect(() => {
      this.auth.currentUser();
      void this.load();
    });
    window.addEventListener('online', () => {
      this.online.set(true);
      void this.sync();
    });
    window.addEventListener('offline', () => this.online.set(false));
  }
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('mmms-maintenance-offline', 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore('submissions', { keyPath: 'id' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  private async put(entry: OfflineMaintenanceEntry): Promise<void> {
    const db = await this.open();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('submissions', 'readwrite');
        transaction.objectStore('submissions').put(entry);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }
  async load(): Promise<void> {
    const userId = String(this.auth.currentUser()?.id || '');
    if (!userId) {
      this.entries.set([]);
      return;
    }
    const db = await this.open();
    try {
      const rows = await new Promise<OfflineMaintenanceEntry[]>((resolve, reject) => {
        const request = db.transaction('submissions').objectStore('submissions').getAll();
        request.onsuccess = () => resolve(request.result as OfflineMaintenanceEntry[]);
        request.onerror = () => reject(request.error);
      });
      this.entries.set(
        rows
          .filter((row) => row.userId === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );
    } finally {
      db.close();
    }
  }
  async queueBreakdown(payload: Partial<BreakdownRecord>, files: File[] = []): Promise<void> {
    const scope = this.context.context();
    const userId = String(this.auth.currentUser()?.id || '');
    if (!userId || !scope.organizationId || !scope.factoryId)
      throw new Error('Sign in and select an organization and factory before saving offline work.');
    const id = crypto.randomUUID();
    await this.put({
      id,
      userId,
      organizationId: scope.organizationId,
      factoryId: scope.factoryId,
      kind: 'breakdown',
      payload: { ...payload, requestId: id },
      files,
      status: 'Pending',
      attempts: 0,
      error: '',
      createdAt: new Date().toISOString(),
    });
    await this.load();
  }
  async sync(): Promise<void> {
    if (this.syncing() || !navigator.onLine || !this.auth.isAuthenticated()) return;
    this.syncing.set(true);
    try {
      await this.load();
      const scope = this.context.context();
      for (const entry of this.entries().filter((row) => row.status !== 'Synced')) {
        if (entry.organizationId !== scope.organizationId || entry.factoryId !== scope.factoryId)
          continue;
        try {
          entry.attempts++;
          if (entry.files.length) {
            const files = await firstValueFrom(this.facade.uploadAttachments(entry.files));
            entry.payload.details = {
              ...entry.payload.details,
              attachments: [...(entry.payload.details?.attachments || []), ...files],
            };
            entry.files = [];
            await this.put(entry);
          }
          await firstValueFrom(this.facade.reportBreakdown(entry.payload));
          entry.status = 'Synced';
          entry.error = '';
        } catch (error: unknown) {
          entry.status = 'Failed';
          entry.error =
            (error as { error?: { error?: { message?: string } } })?.error?.error?.message ||
            'Synchronization failed. Check connectivity, login and permissions, then retry.';
        }
        await this.put(entry);
      }
    } finally {
      this.syncing.set(false);
      await this.load();
    }
  }
}
