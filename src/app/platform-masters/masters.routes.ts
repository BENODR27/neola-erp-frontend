import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { permissionGuard } from '../auth/guards/auth.guard';
import { AuthService } from '../auth/services/auth.service';

function landing(catalog?: string): string {
  if (['units', 'currencies', 'employees', 'contacts', 'vendors'].includes(catalog || ''))
    return '/masters/' + catalog;
  const auth = inject(AuthService);
  const first = MASTERS_ROUTES.find(
    (route) =>
      route.data?.['permission'] &&
      (auth.hasPermission(route.data['permission']) ||
        auth.hasPermission('MASTERS-ADMIN') ||
        auth.hasPermission('MASTERS-READ')),
  );
  return '/masters/' + (first?.path || 'companies');
}
export const MASTERS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: ({ queryParams }) => landing(queryParams['catalog']) },
  { path: 'organization', pathMatch: 'full', redirectTo: () => landing() },
  {
    path: 'companies',
    loadComponent: () =>
      import('./pages/companies/companies.component').then((module) => module.CompaniesComponent),
    canActivate: [permissionGuard],
    data: {
      title: 'Companies',
      permission: 'MASTERS-COMPANIES-READ',
      pageCode: 'MASTERS-COMPANIES-READ',
    },
  },
  {
    path: 'business-units',
    loadComponent: () =>
      import('./pages/business-units/business-units.component').then(
        (module) => module.BusinessUnitsComponent,
      ),
    canActivate: [permissionGuard],
    data: {
      title: 'Business units',
      permission: 'MASTERS-BUSINESS-UNITS-READ',
      pageCode: 'MASTERS-BUSINESS-UNITS-READ',
    },
  },
  {
    path: 'factories',
    loadComponent: () =>
      import('./pages/factories/factories.component').then((module) => module.FactoriesComponent),
    canActivate: [permissionGuard],
    data: {
      title: 'Factories',
      permission: 'MASTERS-FACTORIES-READ',
      pageCode: 'MASTERS-FACTORIES-READ',
    },
  },
  {
    path: 'buildings',
    loadComponent: () =>
      import('./pages/buildings/buildings.component').then((module) => module.BuildingsComponent),
    canActivate: [permissionGuard],
    data: {
      title: 'Buildings',
      permission: 'MASTERS-BUILDINGS-READ',
      pageCode: 'MASTERS-BUILDINGS-READ',
    },
  },
  {
    path: 'floors',
    loadComponent: () =>
      import('./pages/floors/floors.component').then((module) => module.FloorsComponent),
    canActivate: [permissionGuard],
    data: { title: 'Floors', permission: 'MASTERS-FLOORS-READ', pageCode: 'MASTERS-FLOORS-READ' },
  },
  {
    path: 'departments',
    loadComponent: () =>
      import('./pages/departments/departments.component').then(
        (module) => module.DepartmentsComponent,
      ),
    canActivate: [permissionGuard],
    data: {
      title: 'Departments',
      permission: 'MASTERS-DEPARTMENTS-READ',
      pageCode: 'MASTERS-DEPARTMENTS-READ',
    },
  },
  {
    path: 'sections',
    loadComponent: () =>
      import('./pages/sections/sections.component').then((module) => module.SectionsComponent),
    canActivate: [permissionGuard],
    data: {
      title: 'Sections',
      permission: 'MASTERS-SECTIONS-READ',
      pageCode: 'MASTERS-SECTIONS-READ',
    },
  },
  {
    path: 'lines',
    loadComponent: () =>
      import('./pages/lines/lines.component').then((module) => module.LinesComponent),
    canActivate: [permissionGuard],
    data: { title: 'Lines', permission: 'MASTERS-LINES-READ', pageCode: 'MASTERS-LINES-READ' },
  },
  {
    path: 'locations',
    loadComponent: () =>
      import('./pages/locations/locations.component').then((module) => module.LocationsComponent),
    canActivate: [permissionGuard],
    data: {
      title: 'Locations',
      permission: 'MASTERS-LOCATIONS-READ',
      pageCode: 'MASTERS-LOCATIONS-READ',
    },
  },
  {
    path: 'units',
    loadComponent: () =>
      import('./pages/units/units.component').then((module) => module.UnitsComponent),
    canActivate: [permissionGuard],
    data: { title: 'Units of measure', permission: 'MASTERS-READ', pageCode: 'MASTERS-READ' },
  },
  {
    path: 'currencies',
    loadComponent: () =>
      import('./pages/currencies/currencies.component').then(
        (module) => module.CurrenciesComponent,
      ),
    canActivate: [permissionGuard],
    data: { title: 'Currencies', permission: 'MASTERS-READ', pageCode: 'MASTERS-READ' },
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./pages/employees/employees.component').then((module) => module.EmployeesComponent),
    canActivate: [permissionGuard],
    data: { title: 'Employees', permission: 'MASTERS-READ', pageCode: 'MASTERS-READ' },
  },
  {
    path: 'contacts',
    loadComponent: () =>
      import('./pages/contacts/contacts.component').then((module) => module.ContactsComponent),
    canActivate: [permissionGuard],
    data: { title: 'Contacts', permission: 'MASTERS-READ', pageCode: 'MASTERS-READ' },
  },
  {
    path: 'vendors',
    loadComponent: () =>
      import('./pages/vendors/vendors.component').then((module) => module.VendorsComponent),
    canActivate: [permissionGuard],
    data: { title: 'Vendors', permission: 'MASTERS-READ', pageCode: 'MASTERS-READ' },
  },
];
