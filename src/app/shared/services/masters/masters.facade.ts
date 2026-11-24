import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ADMIN_API_CONSTANTS } from '../../../adminv2/constants/admin-api.constants';
import { Observable } from 'rxjs';
export interface SharedMaster {
  id: string;
  module: string;
  name: string;
  code: string;
  organizationId: string | null;
  factoryId: string | null;
  unitType?: string;
  parentId?: string | null;
  status: string;
  revision: number;
  manager?: string;
  email?: string;
  description?: string;
  data?: Record<string, unknown>;
  phone?: string;
}
export interface MasterPage {
  items: SharedMaster[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
@Injectable({ providedIn: 'root' })
export class MastersFacade {
  private readonly http = inject(HttpClient);
  private readonly url = ADMIN_API_CONSTANTS.API_URL + '/shared-masters';
  page(
    module: string,
    page: number,
    search = '',
    pageSize = 20,
    hierarchy: { unitType?: string; lookupFor?: string } = {},
  ): Observable<MasterPage> {
    return this.http.get<MasterPage>(this.url, {
      params: new HttpParams()
        .set('module', module)
        .set('page', page)
        .set('pageSize', pageSize)
        .set('search', search)
        .set('unitType', hierarchy.unitType || '')
        .set('lookupFor', hierarchy.lookupFor || ''),
    });
  }
  save(id: string | null, value: Partial<SharedMaster>): Observable<SharedMaster> {
    return id
      ? this.http.put<SharedMaster>(`${this.url}/${id}`, value)
      : this.http.post<SharedMaster>(this.url, value);
  }
  settings(): Observable<{ sharedMasters: boolean }> {
    return this.http.get<{ sharedMasters: boolean }>(
      ADMIN_API_CONSTANTS.API_URL + '/control-settings',
    );
  }
  types(): Observable<{ kinds: string[]; parents: Record<string, string[]> }> {
    return this.http.get<{ kinds: string[]; parents: Record<string, string[]> }>(
      this.url + '/types',
    );
  }
}
