import { PRODUCT_BRANDING } from '../config/app-branding';
import type { Environment } from './environment.model';
// Ordinary local databases, with same-origin development proxies. No test fixtures.
export const environment = {
  ...PRODUCT_BRANDING,
  production: false,
  enableVersionCheck: false,
  companyName: 'Local development',
  appVersion: '2.0.0',
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
