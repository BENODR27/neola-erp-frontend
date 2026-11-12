import { environment } from '../environments/environment';

/**
 * Application-wide product metadata and branding.
 * Change the environment metadata to rebrand the application without hunting
 * through individual components and templates.
 */
export interface AppConfig {
  name: string;
  shortName: string;
  description: string;
  companyName: string;
  version: string;
  logo: string;
  logoCompact: string;
  favicon: string;
  defaultTitle: string;
  supportEmail: string;
}

export const APP_CONFIG: Readonly<AppConfig> = Object.freeze({
  name: environment.appName,
  shortName: environment.appShortName,
  description: environment.appDescription,
  companyName: environment.companyName,
  version: environment.appVersion,
  logo: environment.logoPath,
  logoCompact: environment.logoCompactPath,
  favicon: environment.faviconPath,
  defaultTitle: environment.defaultTitle,
  supportEmail: environment.supportEmail,
});
