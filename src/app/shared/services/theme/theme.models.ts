export type ThemeMode = 'inherit' | 'light' | 'dark' | 'system';
export type ThemeFont = 'system' | 'arial' | 'roboto' | 'serif';
export interface ThemePalette {
  primary: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  sidebar: string;
  sidebarText: string;
}
export interface WorkspaceTheme {
  defaultMode: Exclude<ThemeMode, 'inherit'>;
  font: ThemeFont;
  cardRadius: number;
  light: ThemePalette;
  dark: ThemePalette;
}
export interface EffectiveAppearance {
  account: { id: string; name: string; revision: number } | null;
  theme: WorkspaceTheme;
  mode: ThemeMode;
}
export interface BrandingAccount {
  id: string;
  code: string;
  name: string;
  theme: WorkspaceTheme;
  revision: number;
}
export interface BrandingUser {
  id: string | number;
  employeeCode: string;
  employeeName: string;
  accountId: string | null;
}
export interface AppearanceManagement {
  accounts: BrandingAccount[];
  platform: BrandingAccount;
  users: BrandingUser[];
}
export const DEFAULT_THEME: WorkspaceTheme = {
  defaultMode: 'system',
  font: 'system',
  cardRadius: 14,
  light: {
    primary: '#365fbd',
    background: '#f3f6fb',
    surface: '#ffffff',
    surfaceAlt: '#edf2f9',
    text: '#202e45',
    muted: '#64748b',
    border: '#dce4ef',
    sidebar: '#19283f',
    sidebarText: '#edf3ff',
  },
  dark: {
    primary: '#8caeff',
    background: '#101722',
    surface: '#192332',
    surfaceAlt: '#223045',
    text: '#edf2fa',
    muted: '#a5b4ca',
    border: '#35455e',
    sidebar: '#0c1420',
    sidebarText: '#edf3ff',
  },
};
export function resolveThemeMode(
  mode: ThemeMode,
  fallback: WorkspaceTheme['defaultMode'],
  systemDark: boolean,
): 'light' | 'dark' {
  const selected = mode === 'inherit' ? fallback : mode;
  return selected === 'system' ? (systemDark ? 'dark' : 'light') : selected;
}
export function primaryTextColor(hex: string): string {
  const rgb = hex
    .slice(1)
    .match(/../g)
    ?.map((value) => {
      const n = parseInt(value, 16) / 255;
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    }) || [0, 0, 0];
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return (luminance + 0.05) / 0.05 > 1.05 / (luminance + 0.05) ? '#000000' : '#ffffff';
}
