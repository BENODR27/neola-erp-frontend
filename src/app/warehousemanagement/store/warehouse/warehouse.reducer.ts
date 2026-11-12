import { createReducer, on } from '@ngrx/store';
import * as WarehouseActions from './warehouse.actions';

export const initialState: any = {
  warehouses: [],
  loadingWarehouses: false,
  errorWarehouses: null,
};

export const warehouseReducer = createReducer(
  initialState,

  on(WarehouseActions.loadWarehouses, (state) => {
    console.log('[Reducer] loadWarehouses');
    return {
      ...state,
      loadingWarehouses: true,
      errorWarehouses: null,
    };
  }),
  on(WarehouseActions.loadWarehousesSuccess, (state, { warehouses }) => {
    console.log('[Reducer] loadWarehousesSuccess', warehouses);
    return {
      ...state,
      warehouses,
      loadingWarehouses: false,
      errorWarehouses: null,
    };
  }),
  on(WarehouseActions.loadWarehousesFailure, (state, { error }) => {
    console.log('[Reducer] loadWarehousesFailure', error);
    return {
      ...state,
      errorWarehouses: error,
      loadingWarehouses: false,
    };
  })
);
