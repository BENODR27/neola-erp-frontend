/** Central MMMS configuration for resources, permissions, and delivery phases. */
export const MMMS_CONFIG = {
  apiVersion: 'v1',
  workspacePath: '/mmms',
  defaultApiUrl: 'http://localhost:7010/v1',
  permissions: {
    dashboard: 'MMMS-DASHBOARD',
    machines: 'MMMS-MACHINES',
    organization: 'MMMS-ORGANIZATION',
    maintenance: 'MMMS-WORK-ORDERS',
    inventory: 'MMMS-SPARE-PARTS',
    reporting: 'MMMS-REPORTS',
  },
  resources: {
    machines: 'machines',
    workOrders: 'work-orders',
    preventiveMaintenance: 'preventive-maintenance',
    breakdowns: 'breakdowns',
    spareParts: 'spare-parts',
    technicians: 'technicians',
    dashboard: 'dashboard',
    reports: 'reports/maintenance',
  },
  implementationPhases: [
    'Core machine management',
    'Maintenance operations',
    'Preventive maintenance and inspections',
    'Inventory, costs, vendors, and calibration',
    'Analytics and mobile operations',
  ],
} as const;

export type MmmsResource = keyof typeof MMMS_CONFIG.resources;
