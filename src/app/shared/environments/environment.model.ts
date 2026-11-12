export interface Environment {
  production: boolean;
  enableVersionCheck: boolean;
  appName: string;
  appShortName: string;
  appDescription: string;
  companyName: string;
  appVersion: string;
  logoPath: string;
  logoCompactPath: string;
  faviconPath: string;
  defaultTitle: string;
  supportEmail: string;
  apiUrl: string;
  apiServiceUrl: string;
  authv2ApiUrl: string;
  WU_API_URL?: string;
  SS_API_URL?: string;
  FR_API_URL?: string;
  MMMS_API_URL?: string;
}
