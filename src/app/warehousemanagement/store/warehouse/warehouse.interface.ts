export interface HomeState {
  warehouses: WarehouseItem[];
  loading: boolean;
  error: unknown;
}

export interface WarehouseItem {
  id: string;
  name: string;
  location?: string;
  capacity?: number;
  status?: string;
}
