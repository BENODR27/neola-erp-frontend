export interface OrganizationUnit {
  id: string;
  name: string;
  code: string;
  unitType: string;
  parentId: string | null;
  organizationId: string;
  factoryId: string | null;
  status: string;
  manager: string;
  email: string;
  description: string;
}
export const ORGANIZATION_PARENTS: Readonly<Record<string, string[]>> = {
  Company: [],
  'Business Unit': ['Company'],
  Factory: ['Company', 'Business Unit'],
  Building: ['Factory'],
  Floor: ['Building', 'Factory'],
  Department: ['Floor', 'Factory'],
  'Production Section': ['Department'],
  'Production Line': ['Production Section', 'Department', 'Floor'],
  'Machine Location': ['Production Line', 'Department', 'Floor'],
};
