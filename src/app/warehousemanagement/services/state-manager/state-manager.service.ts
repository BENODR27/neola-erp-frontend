import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadWarehouses } from '../../store/warehouse/warehouse.actions';
import { selectWarehouses } from '../../store/warehouse/warehouse.selectors';
import { Observable } from 'rxjs';
import { tap, take, filter } from 'rxjs/operators';
import { LocalStorageService } from '../../../shared/services/local-storage/local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class StateManagerService {
  constructor(
    private store: Store,
    private localStorage: LocalStorageService
  ) {}

  getWarehouses$(): Observable<any[]> {
    const localStorageKey = 'warehouses';

    const localWarehouses = this.localStorage.getItem(localStorageKey);
    if (localWarehouses) {
      // Return observable of local warehouses if present
      return new Observable<any[]>((observer) => {
        observer.next(Array.isArray(localWarehouses) ? localWarehouses : []);
        observer.complete();
      });
    }

    return this.store.select(selectWarehouses).pipe(
      tap((warehouses) => {
        if (!warehouses || warehouses.length === 0) {
          this.store.dispatch(loadWarehouses());
        } else {
          this.localStorage.setItem(localStorageKey, warehouses);
        }
      }),
      filter((warehouses) => !!warehouses && warehouses.length > 0),
      take(1) 
    );
  }
}
