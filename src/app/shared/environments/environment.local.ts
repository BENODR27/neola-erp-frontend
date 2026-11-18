import type { Environment } from './environment.model';
// Ordinary local databases, with same-origin development proxies. No test fixtures.
export const environment = {
  production: false,
  enableVersionCheck: false,
  appName: 'Platform',
  appShortName: 'Platform',
  appDescription: 'Enterprise operations platform',
  companyName: 'Local development',
  appVersion: '2.0.0',
  logoPath: '/assets/cflogo.png',
  logoCompactPath: '/assets/cflogo.png',
  faviconPath: '',
  defaultTitle: 'Platform',
  supportEmail: '',
  apiUrl: '',
  apiServiceUrl: '',
  authv2ApiUrl: '/v3',
  WU_API_URL: 'http://localhost:3026/v3',
  SS_API_URL: '',
  FR_API_URL: '',
  MMMS_API_URL: '/v1',
  MMMS_USE_MOCK_DATA: false,
} satisfies Environment;
