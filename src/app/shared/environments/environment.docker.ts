import { PRODUCT_BRANDING } from '../config/app-branding';
import type { Environment } from './environment.model';
// Same-origin Docker gateway; no external API endpoints.
export const environment = {
  ...PRODUCT_BRANDING,
  production: true,
  enableVersionCheck: false,
  companyName: 'Platform',
  appVersion: '2.0.0',
  supportEmail: '',
  apiUrl: '',
  apiServiceUrl: '',
  authv2ApiUrl: '/v3',
  WU_API_URL: '',
  SS_API_URL: '',
  FR_API_URL: '',
  MMMS_API_URL: '/v1',
  MMMS_USE_MOCK_DATA: false,
} satisfies Environment;
