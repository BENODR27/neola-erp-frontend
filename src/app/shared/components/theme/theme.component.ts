import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../auth/services/auth.service';
import { ThemeService } from '../../services/theme/theme.service';
import {
  AppearanceManagement,
  BrandingAccount,
  DEFAULT_THEME,
  ThemeMode,
  ThemePalette,
} from '../../services/theme/theme.models';

@Component({
  selector: 'app-theme',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './theme.component.html',
  styleUrl: './theme.component.css',
})
export class ThemeComponent implements OnDestroy {
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  readonly management = signal<AppearanceManagement | null>(null);
  readonly busy = signal(false);
  readonly message = signal('');
  readonly failure = signal('');
  readonly paletteModes = ['light', 'dark'] as const;
  readonly paletteKeys: { key: keyof ThemePalette; label: string }[] = [
    { key: 'primary', label: 'Accent' },
    { key: 'background', label: 'Page background' },
    { key: 'surface', label: 'Cards' },
    { key: 'surfaceAlt', label: 'Secondary surfaces' },
    { key: 'text', label: 'Text' },
    { key: 'muted', label: 'Secondary text' },
    { key: 'border', label: 'Borders' },
    { key: 'sidebar', label: 'Navigation' },
    { key: 'sidebarText', label: 'Navigation text' },
  ];
  selectedId = 'platform';
  draft: BrandingAccount = {
    id: 'platform',
    code: '__PLATFORM__',
    name: 'Platform default',
    theme: structuredClone(DEFAULT_THEME),
    revision: 0,
  };
  memberIds: string[] = [];
  memberSearch = '';
  constructor() {
    if (this.auth.hasPermission('themes:manage')) this.load();
  }
  changeMode(value: string): void {
    this.theme.setMode(value as ThemeMode);
  }
  load(): void {
    this.busy.set(true);
    this.failure.set('');
    this.theme
      .management()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.management.set(data);
          const message = this.message();
          this.selectAccount(this.selectedId);
          this.message.set(message);
          this.busy.set(false);
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  selectAccount(id: string): void {
    this.theme.cancelPreview();
    this.selectedId = id;
    this.failure.set('');
    this.message.set('');
    const data = this.management();
    const account =
      id === 'platform' ? data?.platform : data?.accounts.find((row) => row.id === id);
    this.draft = structuredClone(
      account || {
        id: '',
        code: '',
        name: '',
        theme: data?.platform.theme || DEFAULT_THEME,
        revision: 0,
      },
    );
    if (id === 'platform') this.draft.id = 'platform';
    this.memberIds =
      data?.users.filter((user) => user.accountId === id).map((user) => String(user.id)) || [];
  }
  visibleUsers() {
    const query = this.memberSearch.trim().toLowerCase();
    return (
      this.management()?.users.filter((user) =>
        (user.employeeCode + ' ' + user.employeeName).toLowerCase().includes(query),
      ) || []
    );
  }
  toggleMember(id: string | number, checked: boolean): void {
    const value = String(id);
    this.memberIds = checked
      ? [...this.memberIds.filter((item) => item !== value), value]
      : this.memberIds.filter((item) => item !== value);
  }
  save(): void {
    this.busy.set(true);
    this.failure.set('');
    this.message.set('');
    this.theme
      .saveAccount(this.draft, this.selectedId === 'new')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.selectedId = this.selectedId === 'platform' ? 'platform' : account.id;
          this.theme.cancelPreview();
          this.theme.refresh();
          this.load();
          this.message.set(
            'Shared theme saved. Members receive it automatically within one minute or when they reopen the app.',
          );
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  saveMembers(): void {
    this.busy.set(true);
    this.failure.set('');
    this.message.set('');
    this.theme
      .saveMembers(this.draft.id, this.memberIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.theme.refresh();
          this.load();
          this.message.set('Branding membership saved.');
        },
        error: (error: unknown) => this.fail(error),
      });
  }
  private fail(error: unknown): void {
    this.busy.set(false);
    this.failure.set(
      error instanceof HttpErrorResponse
        ? error.error?.message || 'Appearance could not be saved. Please retry.'
        : 'Appearance could not be loaded. Please retry.',
    );
  }
  ngOnDestroy(): void {
    this.theme.cancelPreview();
  }
}
