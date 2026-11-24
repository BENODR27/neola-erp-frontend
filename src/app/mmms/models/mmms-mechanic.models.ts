import { MmmsStoredFile } from './mmms-file.models';
export interface MechanicRecord {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phone: string;
  skillCategories: string[];
  shift: string;
  factory: string;
  factoryId: string;
  organizationId: string;
  active: boolean;
  currentWorkload: number;
  availability: string;
  completedJobs: number;
  laborMinutes: number;
  details: {
    employeeId?: string;
    userCode?: string;
    userId?: string;
    department?: string;
    designation?: string;
    experienceYears?: number;
    joiningDate?: string;
    employmentStatus?: string;
    photo?: MmmsStoredFile[];
  };
}
