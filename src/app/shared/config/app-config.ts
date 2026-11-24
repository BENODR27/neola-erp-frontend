import { environment } from '../environments/environment';
import { PRODUCT_STORY } from './app-branding';

/**
 * Application-wide product metadata and branding.
 * Change app-branding.ts for the default identity; environment metadata can
 * override it for a deployment without changing individual components.
 */
export interface AppConfig {
  brandStory: typeof PRODUCT_STORY;
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
  brandStory: PRODUCT_STORY,
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
