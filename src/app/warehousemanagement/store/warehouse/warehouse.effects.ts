import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as WarehouseActions from './warehouse.actions';
import { catchError, map, mergeMap, of } from 'rxjs';
import { ApiService } from '../../../shared/services/api/api.service';
import { WMS_API_CONSTANTS as WAC } from '../../constants/wms-api.constants';

@Injectable()
export class WarehouseEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);

  loadWarehouses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WarehouseActions.loadWarehouses),
      mergeMap(() => {
        console.log('[Effect] loadWarehouses triggered');
        return this.apiService.getDatas(WAC.API_URL + WAC.WareHouse).pipe(
          map((response) => {
            console.log('[Effect] API response:', response);
            // Fix: handle both array and object with result property
            const warehouses = Array.isArray(response)
              ? response
              : response?.result ?? [];
            return WarehouseActions.loadWarehousesSuccess({
              warehouses,
            });
          }),
          catchError((error) => {
            console.error('[Effect] API error:', error);
            return of(WarehouseActions.loadWarehousesFailure({ error }));
          })
        );
      })
    )
  );

  addWarehouse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WarehouseActions.addWarehouse),
      mergeMap(({ warehouse }) =>
        this.apiService.addData(WAC.API_URL + WAC.WareHouse, warehouse).pipe(
          map((newWarehouse) =>
            WarehouseActions.addWarehouseSuccess({ warehouse: newWarehouse })
          ),
          catchError((error) =>
            of(WarehouseActions.addWarehouseFailure({ error }))
          )
        )
      )
    )
  );

  updateWarehouse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WarehouseActions.updateWarehouse),
      mergeMap(({ warehouse }) =>
        this.apiService
          .updateData(
            1,
            WAC.API_URL + WAC.WareHouse + `/${warehouse.id}`,
            warehouse
          )
          .pipe(
            map((updatedWarehouse) =>
              WarehouseActions.updateWarehouseSuccess({
                warehouse: updatedWarehouse,
              })
            ),
            catchError((error) =>
              of(WarehouseActions.updateWarehouseFailure({ error }))
            )
          )
      )
    )
  );

  deleteWarehouse$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WarehouseActions.deleteWarehouse),
      mergeMap(({ id }) =>
        this.apiService
          .deleteData(1, WAC.API_URL + WAC.WareHouse + `/${id}`)
          .pipe(
            map(() => WarehouseActions.deleteWarehouseSuccess({ id })),
            catchError((error) =>
              of(WarehouseActions.deleteWarehouseFailure({ error }))
            )
          )
      )
    )
  );

  constructor() {}
}
