import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';
import { AuthService } from '../../../auth/services/auth.service';
import { ApiService } from '../api/api.service';
import { environment } from '../../environments/environment';
import {
  AppearanceManagement,
  BrandingAccount,
  DEFAULT_THEME,
  EffectiveAppearance,
  ThemeMode,
  WorkspaceTheme,
  primaryTextColor,
  resolveThemeMode,
} from './theme.models';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly appearance = signal<EffectiveAppearance>({
    account: null,
    theme: structuredClone(DEFAULT_THEME),
    mode: 'inherit',
  });
  readonly mode = computed(() => this.appearance().mode);
  readonly resolvedMode = signal<'light' | 'dark'>('light');
  readonly saving = signal(false);
  readonly error = signal('');
  readonly previewing = signal(false);
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly endpoint = environment.authv2ApiUrl + '/api/auth/appearance';
  private requestSequence = 0;
  private previewTheme?: WorkspaceTheme;
  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');
  constructor() {
    this.render();
    const mediaChange = () => this.render(this.previewTheme);
    this.media.addEventListener('change', mediaChange);
    const visible = () => {
      if (document.visibilityState === 'visible') this.refresh();
    };
    document.addEventListener('visibilitychange', visible);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') this.refresh();
    }, 60000);
    this.destroyRef.onDestroy(() => {
      this.media.removeEventListener('change', mediaChange);
      document.removeEventListener('visibilitychange', visible);
      window.clearInterval(timer);
    });
    effect((cleanup) => {
      const id = String(this.auth.currentUser()?.id || '');
      untracked(() => {
        this.requestSequence++;
        this.previewTheme = undefined;
        this.saving.set(false);
        this.appearance.set({
          account: null,
          theme: structuredClone(DEFAULT_THEME),
          mode: 'inherit',
        });
        this.previewing.set(false);
        this.error.set('');
        if (id) {
          try {
            const cached = JSON.parse(
              localStorage.getItem('platform-appearance:' + id) || 'null',
            ) as EffectiveAppearance | null;
            if (cached?.theme?.light && cached?.theme?.dark) this.appearance.set(cached);
          } catch {
            /* Invalid caches use the platform defaults. */
          }
        }
        this.render();
      });
      if (!id) return;
      const sequence = ++this.requestSequence;
      const subscription = this.api.getDatas(this.endpoint).subscribe({
        next: (response) => {
          if (sequence === this.requestSequence)
            this.accept(response.result as EffectiveAppearance, id);
        },
        error: () =>
          this.error.set(
            'Saved appearance is temporarily unavailable. Using the last theme on this device.',
          ),
      });
      cleanup(() => subscription.unsubscribe());
    });
  }
  refresh(): void {
    if (!this.auth.isAuthenticated() || this.previewing() || this.saving()) return;
    const id = String(this.auth.currentUser()?.id || '');
    const sequence = ++this.requestSequence;
    this.api
      .getDatas(this.endpoint)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (sequence === this.requestSequence)
            this.accept(response.result as EffectiveAppearance, id);
        },
        error: () =>
          this.error.set('Appearance could not be refreshed. Your current theme is retained.'),
      });
  }
  setMode(mode: ThemeMode): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set('');
    const id = String(this.auth.currentUser()?.id || '');
    const sequence = ++this.requestSequence;
    this.api
      .putAtUrl(this.endpoint + '/mode', { mode })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (sequence === this.requestSequence)
            this.accept(response.result as EffectiveAppearance, id);
        },
        error: () => {
          this.saving.set(false);
          this.error.set('Appearance could not be saved. Please retry.');
        },
        complete: () => this.saving.set(false),
      });
  }
  management(): Observable<AppearanceManagement> {
    return this.api
      .getDatas(this.endpoint + '/management')
      .pipe(map((response) => response.result as AppearanceManagement));
  }
  saveAccount(account: BrandingAccount, creating = false): Observable<BrandingAccount> {
    return (
      creating
        ? this.api.addData(account, this.endpoint + '/accounts')
        : this.api.putAtUrl(this.endpoint + '/accounts/' + encodeURIComponent(account.id), account)
    ).pipe(map((response) => response.result as BrandingAccount));
  }
  saveMembers(id: string, userIds: string[]): Observable<unknown> {
    return this.api.putAtUrl(this.endpoint + '/accounts/' + encodeURIComponent(id) + '/members', {
      userIds,
    });
  }
  preview(theme: WorkspaceTheme): void {
    this.requestSequence++;
    this.previewTheme = theme;
    this.previewing.set(true);
    this.render(theme);
  }
  cancelPreview(): void {
    this.previewTheme = undefined;
    this.previewing.set(false);
    this.render();
  }
  private accept(value: EffectiveAppearance, userId: string): void {
    if (String(this.auth.currentUser()?.id || '') !== userId) return;
    this.appearance.set(value);
    this.error.set('');
    this.previewing.set(false);
    try {
      localStorage.setItem('platform-appearance:' + userId, JSON.stringify(value));
    } catch {
      /* Appearance remains usable when browser storage is full or disabled. */
    }
    this.render();
  }
  private render(preview?: WorkspaceTheme): void {
    const theme = preview || this.appearance().theme;
    const mode = resolveThemeMode(this.mode(), theme.defaultMode, this.media.matches);
    const palette = theme[mode];
    const root = document.documentElement;
    this.resolvedMode.set(mode);
    root.dataset['theme'] = mode;
    root.style.colorScheme = mode;
    const names: Record<string, string> = {
      primary: 'primary',
      background: 'background',
      surface: 'surface',
      surfaceAlt: 'surface-alt',
      text: 'text',
      muted: 'muted',
      border: 'border',
      sidebar: 'sidebar',
      sidebarText: 'sidebar-text',
    };
    for (const [key, name] of Object.entries(names))
      root.style.setProperty('--app-' + name, palette[key as keyof typeof palette]);
    const fonts = {
      system: '"Segoe UI", system-ui, sans-serif',
      arial: 'Arial, sans-serif',
      roboto: 'Roboto, "Segoe UI", sans-serif',
      serif: 'Georgia, serif',
    };
    root.style.setProperty('--app-font', fonts[theme.font]);
    root.style.setProperty('--app-card-radius', theme.cardRadius + 'px');
    root.style.setProperty('--app-on-primary', primaryTextColor(palette.primary));
  }
}
