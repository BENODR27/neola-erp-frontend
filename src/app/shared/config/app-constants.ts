export const APP_CONSTANTS = Object.freeze({
  storage: Object.freeze({
    authSession: 'auth_session',
    navbarItems: 'navbarItems',
    currentEmployeeName: 'currentEmpName',
    selectedWarehouse: 'selectedWarehouse',
    selectedFacility: 'selectedFacility',
  }),
  routes: Object.freeze({
    login: '/signin',
    home: '/home',
    applications: '/applications',
    warehouse: '/wms/dashboard',
  }),
  assets: Object.freeze({
    logo: '/assets/styxlogo.png',
    companyLogo: '/assets/cflogo.png',
  }),
} as const);
