// Legacy Masters bundles keep existing sessions compatible with dedicated page grants.
const prefixes = new Set([
  'MASTERS-COMPANIES',
  'MASTERS-BUSINESS-UNITS',
  'MASTERS-FACTORIES',
  'MASTERS-BUILDINGS',
  'MASTERS-FLOORS',
  'MASTERS-DEPARTMENTS',
  'MASTERS-SECTIONS',
  'MASTERS-LINES',
  'MASTERS-LOCATIONS',
]);
export function coversHierarchyPermission(
  permissions: readonly string[],
  permission: string,
): boolean {
  const match = /^(.*)-(READ|MANAGE)$/.exec(permission);
  if (!match || !prefixes.has(match[1])) return false;
  if (permissions.includes('MASTERS-ADMIN')) return true;
  if (match[1] === 'MASTERS-COMPANIES' && match[2] === 'MANAGE') return false;
  return permissions.includes('MASTERS-' + match[2]);
}
