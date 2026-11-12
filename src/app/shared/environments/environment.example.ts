import type { Environment } from './environment.model';

const IP1 = 'localhost';
const IP2 = 'localhost';
const IP3 = 'localhost';
const IP4 = 'localhost';

export const environment = {
  production: false,
  enableVersionCheck: false,
  appName: 'ADMIN',
  appShortName: 'ADMIN',
  appDescription: 'Enterprise operations platform',
  companyName: 'Classic Fashion',
  appVersion: '1.0.0',
  logoPath: '/assets/styxlogo.png',
  logoCompactPath: '/assets/styxlogo.png',
  faviconPath: '/assets/styxlogo.png',
  defaultTitle: 'ADMIN',
  supportEmail: 'support@classicfashion.com',
  apiUrl: `http://${IP1}:3000`,
  apiServiceUrl: `http://${IP1}:3052`,
  authv2ApiUrl: `http://${IP1}:8082/v2`,
} satisfies Environment;
