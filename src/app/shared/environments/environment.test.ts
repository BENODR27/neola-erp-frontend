import { PRODUCT_BRANDING } from '../config/app-branding';
import type { Environment } from './environment.model';

const API_BASE_URL = 'https://api.styx.classicfashion.com';
const AUTH_BASE_URL = 'https://auth.styx.classicfashion.com';
export const environment = {
  ...PRODUCT_BRANDING,
  production: false,
  enableVersionCheck: false,
  companyName: 'Classic Fashion',
  appVersion: '1.0.0',
  supportEmail: 'support@classicfashion.com',
  apiUrl: API_BASE_URL,
  apiServiceUrl: API_BASE_URL,
  authv2ApiUrl: `${AUTH_BASE_URL}/v3`,
  MMMS_API_URL: 'http://localhost:7010/v1',
  MMMS_USE_MOCK_DATA: false,
} satisfies Environment;
