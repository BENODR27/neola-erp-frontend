export interface MaintenanceAnalytics {
  taskTotal: number;
  generatedAt: string;
  from: string;
  to: string;
  kpis: Record<string, number | null | Record<string, number>>;
  tasks: {
    id: string;
    issue: string;
    machineId: string;
    machine: string;
    status: string;
    priority: string;
    technician?: string;
    dueAt?: string;
  }[];
  factoryDistribution: { label: string; count: number }[];
  departmentDistribution: { label: string; count: number }[];
  floorDistribution: { label: string; count: number }[];
  downtimeByDay: { day: string; hours: number }[];
}
