import { createFeatureSelector, createSelector } from '@ngrx/store';
export const selectWarehouseState = createFeatureSelector<any>('warehouse');
export const selectWarehouses = createSelector(
  selectWarehouseState,
  (state: any) => state.warehouses
);
export const selectWarehousesLoading = createSelector(
  selectWarehouseState,
  (state: any) => state.loadingWarehouses
);
export const selectWarehousesFailure = createSelector(
  selectWarehouseState,
  (state: any) => state.errorWarehouses
);
