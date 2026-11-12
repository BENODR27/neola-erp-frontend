import { environment } from '../../shared/environments/environment';

export const ADMIN_API_CONSTANTS = {
  API_URL: environment.authv2ApiUrl + '/api/auth',
  PERMISSIONS: '/permissions',
  USERS: '/users',
  USER_SCOPES: '/scopes',
  ROLES: '/roles',
  APPLICATIONS: '/applications',
  VENDORS: '/vendors',
  TELEMETRY_USAGE: '/telemetry/usage',
  TELEMETRY_ERRORS: '/telemetry/errors',
  TELEMETRY_SUMMARY: '/telemetry/summary',
  WU_API_URL: environment.WU_API_URL,
  LOG: '/api/wu/log',
  ERROR_LOG: '/api/wu/errorlog',
  EMPLOYEES: '/api/wu/employees',
};
