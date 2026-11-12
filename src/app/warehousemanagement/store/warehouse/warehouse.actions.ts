import { createAction, props } from '@ngrx/store';

export const loadWarehouses = createAction('[Warehouse] Load Warehouses');
export const loadWarehousesSuccess = createAction(
  '[Warehouse] Load Warehouses Success',
  props<{ warehouses: any[] }>()
);
export const loadWarehousesFailure = createAction(
  '[Warehouse] Load Warehouses Failure',
  props<{ error: any }>()
);

export const addWarehouse = createAction(
  '[Warehouse] Add Warehouse',
  props<{ warehouse: any }>()
);
export const addWarehouseSuccess = createAction(
  '[Warehouse] Add Warehouse Success',
  props<{ warehouse: any }>()
);
export const addWarehouseFailure = createAction(
  '[Warehouse] Add Warehouse Failure',
  props<{ error: any }>()
);

export const updateWarehouse = createAction(
  '[Warehouse] Update Warehouse',
  props<{ warehouse: any }>()
);
export const updateWarehouseSuccess = createAction(
  '[Warehouse] Update Warehouse Success',
  props<{ warehouse: any }>()
);
export const updateWarehouseFailure = createAction(
  '[Warehouse] Update Warehouse Failure',
  props<{ error: any }>()
);

export const deleteWarehouse = createAction(
  '[Warehouse] Delete Warehouse',
  props<{ id: string }>()
);
export const deleteWarehouseSuccess = createAction(
  '[Warehouse] Delete Warehouse Success',
  props<{ id: string }>()
);
export const deleteWarehouseFailure = createAction(
  '[Warehouse] Delete Warehouse Failure',
  props<{ error: any }>()
);
