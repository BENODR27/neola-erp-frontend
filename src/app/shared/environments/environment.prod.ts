import { PRODUCT_BRANDING } from '../config/app-branding';
import type { Environment } from './environment.model';

const API_BASE_URL = 'https://api.styx.classicfashion.com';
const AUTH_BASE_URL = 'https://auth.styx.classicfashion.com';

export const environment = {
  ...PRODUCT_BRANDING,
  production: true,
  enableVersionCheck: true,
  companyName: 'Classic Fashion',
  appVersion: '2.0.0',
  supportEmail: 'support@classicfashion.com',
  apiUrl: API_BASE_URL,
  apiServiceUrl: API_BASE_URL,
  authv2ApiUrl: `${AUTH_BASE_URL}/v3`,
  WU_API_URL: `${AUTH_BASE_URL}/v3`,
  SS_API_URL: API_BASE_URL,
  FR_API_URL: API_BASE_URL,
  MMMS_API_URL: `${API_BASE_URL}/v1`,
  MMMS_USE_MOCK_DATA: false,
} satisfies Environment;
