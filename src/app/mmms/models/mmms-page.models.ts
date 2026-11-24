export interface MmmsPageQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  unitTypes?: string;
  personal?: string;
  activeTasks?: string;
}

export interface MmmsPage<T> {
  result: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
