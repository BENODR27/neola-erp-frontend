import type { Environment } from './environment.model';

// Local integration configuration; shared developer endpoints remain unchanged.
export const environment = {
  production: false,
  enableVersionCheck: false,
  appName: 'MMMS',
  appShortName: 'MMMS',
  appDescription: 'Machine Maintenance Management System',
  companyName: 'Local workflow test',
  appVersion: '1.0.0',
  logoPath: '/assets/cflogo.png',
  logoCompactPath: '/assets/cflogo.png',
  faviconPath: '',
  defaultTitle: 'MMMS',
  supportEmail: '',
  apiUrl: 'http://localhost:3000',
  apiServiceUrl: '',
  authv2ApiUrl: '/v3',
  WU_API_URL: 'http://localhost:3026/v3',
  FR_API_URL: 'http://localhost:3052',
  SS_API_URL: '',
  MMMS_API_URL: '/v1',
  MMMS_USE_MOCK_DATA: false,
} satisfies Environment;
