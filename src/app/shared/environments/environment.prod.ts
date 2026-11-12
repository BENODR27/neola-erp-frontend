import type { Environment } from './environment.model';

const API_BASE_URL = 'https://api.styx.classicfashion.com';
const AUTH_BASE_URL = 'https://auth.styx.classicfashion.com';

export const environment = {
  production: true,
  enableVersionCheck: true,
  appName: 'ADMIN',
  appShortName: 'ADMIN',
  appDescription: 'Enterprise operations platform',
  companyName: 'Classic Fashion',
  appVersion: '2.0.0',
  logoPath: '/assets/styxlogo.png',
  logoCompactPath: '/assets/styxlogo.png',
  faviconPath: '/assets/styxlogo.png',
  defaultTitle: 'ADMIN',
  supportEmail: 'support@classicfashion.com',
  apiUrl: API_BASE_URL,
  apiServiceUrl: API_BASE_URL,
  authv2ApiUrl: `${AUTH_BASE_URL}/v3`,
  WU_API_URL: `${AUTH_BASE_URL}/v3`,
  SS_API_URL: API_BASE_URL,
  FR_API_URL: API_BASE_URL,
  MMMS_API_URL: `${API_BASE_URL}/v1`,
} satisfies Environment;
