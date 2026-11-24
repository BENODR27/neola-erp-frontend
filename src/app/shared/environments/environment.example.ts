import { PRODUCT_BRANDING } from '../config/app-branding';
import type { Environment } from './environment.model';

const IP1 = 'localhost';
const IP2 = 'localhost';
const IP3 = 'localhost';
const IP4 = 'localhost';

export const environment = {
  ...PRODUCT_BRANDING,
  production: false,
  enableVersionCheck: false,
  companyName: 'Classic Fashion',
  appVersion: '1.0.0',
  supportEmail: 'support@classicfashion.com',
  apiUrl: `http://${IP1}:3000`,
  apiServiceUrl: `http://${IP1}:3052`,
  authv2ApiUrl: `http://${IP1}:8082/v2`,
  MMMS_API_URL: 'http://localhost:7010/v1',
  MMMS_USE_MOCK_DATA: true,
} satisfies Environment;
